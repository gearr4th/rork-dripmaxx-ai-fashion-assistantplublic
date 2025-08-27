import { ClothingItem, Outfit, Weather, ImageAnalysisResult, DripLevel } from "@/types";
import { GoogleGenerativeAI } from '@google/generative-ai';
import { GEMINI_API_KEY, CONFIG } from './config';

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);

interface GenerateOutfitParams {
  weather: Weather | null;
  trends: string[];
  prompt: string;
  clothes: ClothingItem[];
}

export interface ParsedUserRequest {
  occasion: string | null;
  budget: number | null;
  preferences: string[];
  location: string | null;
}

async function geocodePlace(place: string): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(place)}`;
    const res = await fetch(url, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'WardrobeApp/1.0 (+https://example.com)'
      }
    });
    if (!res.ok) return null;
    const data = await res.json() as Array<{ display_name?: string }>;
    if (Array.isArray(data) && data.length > 0) {
      const display = data[0]?.display_name ?? null;
      return display ? String(display) : null;
    }
    return null;
  } catch (e) {
    console.log('geocodePlace error', e);
    return null;
  }
}

export async function interpretUserStyleRequest(input: string): Promise<ParsedUserRequest> {
  try {
    const model = genAI.getGenerativeModel({ model: CONFIG.GEMINI_MODEL });
    const sys = `Extract concise structured data from the user's outfit request. Respond with ONLY JSON in this exact shape: {"occasion": string|null, "budget": number|null, "preferences": string[], "location": string|null}.
- occasion: short phrase like "school", "party", "date", "office", or inferred from place types like mall -> "shopping" if user mentions a venue.
- budget: total budget in user's currency as a number without symbols. If the user mentions $80 or under 50, return 80 or 50. If no budget mentioned, null.
- preferences: array of short tokens for styles, colors, fits, brands, fabrics. Keep 3-8 items.
- location: human-readable location if a place or city is mentioned (e.g., "Chadstone Shopping Centre, Melbourne, Australia"), else null.`;
    const res = await model.generateContent(`${sys}\nUser: ${input}`);
    const text = res.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const occasion = typeof parsed.occasion === 'string' ? parsed.occasion : null;
      const budget = typeof parsed.budget === 'number' ? parsed.budget : null;
      const preferences: string[] = Array.isArray(parsed.preferences)
        ? parsed.preferences.filter((p: unknown) => typeof p === 'string').map((p: string) => p.trim()).filter(Boolean)
        : [];
      const rawLocation: string | null = typeof parsed.location === 'string' ? parsed.location : null;
      let location: string | null = rawLocation;
      if (rawLocation) {
        const geo = await geocodePlace(rawLocation);
        if (geo) location = geo;
      }
      return { occasion, budget, preferences, location } as ParsedUserRequest;
    }
  } catch (e) {
    console.log('interpretUserStyleRequest fallback parse', e);
  }
  const lower = input.toLowerCase();
  let budget: number | null = null;
  const moneyMatch = lower.match(/\b(under\s*)?(\$|£|€)?\s?(\d{2,4})\b/);
  if (moneyMatch) budget = Number(moneyMatch[3]);
  let occasion: string | null = null;
  const knownOccasions = ['school','party','date','office','work','wedding','gym','brunch','travel','beach','shopping'];
  for (const occ of knownOccasions) {
    if (lower.includes(occ)) { occasion = occ; break; }
  }
  if (!occasion) {
    if (/(mall|shopping\s?centre|shopping\s?center|plaza)/.test(lower)) {
      occasion = 'shopping';
    }
  }
  const prefs: string[] = [];
  const colorMatch = lower.match(/\b(black|white|navy|blue|green|olive|brown|beige|cream|grey|gray|red|pink|pastel)\b/g);
  if (colorMatch) prefs.push(...colorMatch);
  if (lower.includes('oversized')) prefs.push('oversized');
  if (lower.includes('slim')) prefs.push('slim');
  if (lower.includes('baggy')) prefs.push('baggy');
  if (lower.includes('minimal')) prefs.push('minimalist');
  let location: string | null = null;
  const maybePlace = input.trim();
  if (maybePlace && maybePlace.length > 2 && /[a-zA-Z]/.test(maybePlace)) {
    const mallHints = /(mall|shopping\s?centre|shopping\s?center|plaza|centre|center)/i;
    if (mallHints.test(maybePlace)) {
      location = maybePlace;
    }
  }
  if (location) {
    const geo = await geocodePlace(location);
    if (geo) location = geo;
  }
  return { occasion, budget, preferences: Array.from(new Set(prefs)), location };
}

export async function fetchSocialTrends(params: { prompt: string; location?: string | null }): Promise<string[]> {
  const { prompt, location } = params;
  try {
    console.log('Fetching social trends from AI...', { prompt, location });
    const model = genAI.getGenerativeModel({ model: CONFIG.GEMINI_MODEL });
    const trendPrompt = `You are a fashion trend scout scanning TikTok and Instagram culture. Based on the current month and year, the user's location "${location ?? 'Unknown'}", and the user's intent: "${prompt || 'general daily outfit'}", output ONLY a compact JSON array of 6-10 short trend tags people are wearing right now on TikTok/Instagram. Focus on wearable items (e.g., "oversized vintage tee", "loose carpenter jeans", "adidas sambas", "ballet flats", "quiet luxury", "gorpcore shells"). Avoid influencers or brand names unless iconic. If the location resembles a shopping mall or venue (e.g., "Chadstone Shopping Centre"), bias toward practical shopping-day outfits and Melbourne/AU seasonal context if applicable. No explanation, just JSON array of strings.`;
    const res = await model.generateContent(trendPrompt);
    const text = res.response.text();
    console.log('Trend AI raw:', text);
    const jsonMatch = text.match(/[\[][\s\S]*[\]]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) {
        const cleaned = parsed.map((t: unknown) => (typeof t === 'string' ? t.trim() : '')).filter(Boolean);
        if (cleaned.length > 0) return cleaned as string[];
      }
    }
  } catch (error) {
    console.error('fetchSocialTrends error:', error);
  }
  return CONFIG.DEFAULT_TRENDS;
}

type AnalyzeImageInput = { base64: string; mimeType: string };

export async function analyzeClothingImage(input: AnalyzeImageInput): Promise<ImageAnalysisResult> {
  try {
    console.log('Analyzing clothing image with Gemini...', { mimeType: input.mimeType, size: input.base64.length });
    const model = genAI.getGenerativeModel({ model: CONFIG.GEMINI_MODEL });

    const prompt = `You are a fashion product identifier. Given an image of a clothing item, return ONLY JSON in this shape:
{
  "itemName": string, // simple human-friendly name if brand unknown
  "officialProductName": string, // closest product name from likely brand catalog
  "brand": string|null,
  "type": string|null, // hoodie, tee, jeans, sneakers, etc.
  "style": string|null, // e.g., streetwear, minimalist, smart casual, Y2K
  "averagePrice": number|null, // average price from brand official store (estimate if exact unavailable)
  "currency": "USD", // pick currency and keep consistent based on brand region
  "versatilityScore": number, // 0-100 rating for how many occasions it fits
  "dripLevel": "Maxx Drip" | "Pure Drip" | "Certified Drip" | "Lowkey Drip",
  "reasoning": string, // short justification including comparable products
  "sources": string[] // likely brand/catalog URLs or search terms
}
Rules:
- Prefer official brand pricing, never reseller or aftermarket.
- If brand uncertain, infer from cues like logos, silhouettes, typical colorways.
- Be conservative with Maxx Drip; reserve for iconic or high-fashion pieces.
- Do not add extra text, only the JSON. Make sure it is valid JSON.`;

    const result = await model.generateContent([
      { text: prompt },
      {
        inlineData: {
          data: input.base64,
          mimeType: input.mimeType,
        }
      } as any,
    ]);
    const text = result.response.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in AI response');
    const parsed = JSON.parse(jsonMatch[0]);

    const dripString = String(parsed.dripLevel ?? parsed.drip ?? 'Lowkey Drip') as DripLevel;
    const normalized: ImageAnalysisResult = {
      itemName: String(parsed.itemName ?? 'Clothing Item'),
      officialProductName: String(parsed.officialProductName ?? parsed.itemName ?? 'Unknown'),
      brand: parsed.brand ? String(parsed.brand) : undefined,
      type: parsed.type ? String(parsed.type) : undefined,
      style: parsed.style ? String(parsed.style) : undefined,
      averagePrice: typeof parsed.averagePrice === 'number' ? parsed.averagePrice : null,
      currency: parsed.currency ? String(parsed.currency) : 'USD',
      versatilityScore: Math.max(0, Math.min(100, Number(parsed.versatilityScore ?? 60))),
      dripLevel: (['Maxx Drip','Pure Drip','Certified Drip','Lowkey Drip'].includes(dripString) ? dripString : 'Lowkey Drip') as DripLevel,
      reasoning: String(parsed.reasoning ?? ''),
      sources: Array.isArray(parsed.sources) ? parsed.sources.map((s: unknown) => String(s)).slice(0, 5) : [],
    };
    return normalized;
  } catch (e) {
    console.log('analyzeClothingImage error, returning fallback', e);
    const fallback: ImageAnalysisResult = {
      itemName: 'Clothing Item',
      officialProductName: 'Unknown Product',
      brand: undefined,
      type: undefined,
      style: undefined,
      averagePrice: null,
      currency: 'USD',
      versatilityScore: 55,
      dripLevel: 'Certified Drip',
      reasoning: 'Could not confidently identify. Generic style score applied.',
      sources: [],
    };
    return fallback;
  }
}

export async function generateOutfit({
  weather,
  trends,
  prompt,
  clothes,
}: GenerateOutfitParams): Promise<Outfit> {
  try {
    console.log('Generating outfit with Gemini AI...');
    const aiPrompt = createOutfitPrompt(weather, trends, prompt, clothes);
    const model = genAI.getGenerativeModel({ model: CONFIG.GEMINI_MODEL });
    const result = await model.generateContent(aiPrompt);
    const response = await result.response;
    const text = response.text();
    console.log('Gemini response:', text);
    const outfit = parseAIResponse(text, clothes, weather, trends, prompt);
    return outfit;
  } catch (error) {
    console.error('Gemini AI error:', error);
    return generateSmartOutfit(clothes, weather, trends, prompt);
  }
}

function createOutfitPrompt(
  weather: Weather | null,
  trends: string[],
  prompt: string,
  clothes: ClothingItem[]
): string {
  const weatherInfo = weather 
    ? `Weather: ${weather.condition}, ${weather.temperature}°C, humidity ${weather.humidity}%, wind ${weather.windSpeed} km/h`
    : 'Weather: Unknown';
  const trendsInfo = trends.length > 0 
    ? `Current fashion trends: ${trends.join(', ')}`
    : `Current fashion trends: ${CONFIG.DEFAULT_TRENDS.join(', ')}`;
  const clothesInfo = clothes.map(item => 
    `${item.type}: ${item.name} (${item.color}, ${item.brand || 'no brand'})`
  ).join('\n');
  const timestamp = new Date().toISOString();
  const variabilityHint = Math.random().toString(36).slice(2, 8);
  return `You are a professional fashion stylist for a mobile app. Create a fresh, not-repetitive outfit.
${weatherInfo}
${trendsInfo}
Occasion/Setting: ${prompt || 'Casual day out'}
Time context: ${timestamp}
Variability key: ${variabilityHint}

Available clothing items:
${clothesInfo}

Rules:
1. Weather appropriateness.
2. Reflect social trends but keep it wearable.
3. Color harmony and style cohesion.
4. Vary selections across calls even for similar prompts to avoid repetition.
5. Only choose from the provided closet.

Respond in EXACT JSON:
{
  "selectedItems": ["item_name_1", "item_name_2", "item_name_3"],
  "styleDescription": "Brief description of the style",
  "reasoning": "Why this outfit works for the weather, trends, and occasion"
}`;
}

function parseAIResponse(
  aiResponse: string,
  clothes: ClothingItem[],
  weather: Weather | null,
  trends: string[],
  prompt: string
): Outfit {
  try {
    const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      const selectedItems: ClothingItem[] = [];
      if (parsed.selectedItems && Array.isArray(parsed.selectedItems)) {
        for (const itemName of parsed.selectedItems) {
          const item = clothes.find(c => 
            c.name.toLowerCase().includes(String(itemName).toLowerCase()) ||
            String(itemName).toLowerCase().includes(c.name.toLowerCase())
          );
          if (item) {
            selectedItems.push(item);
          }
        }
      }
      if (selectedItems.length === 0) {
        return generateSmartOutfit(clothes, weather, trends, prompt);
      }
      return {
        id: Date.now().toString(),
        items: selectedItems,
        occasion: prompt || "AI Recommended Outfit",
        weather: weather ? `${weather.condition}, ${weather.temperature}°C` : "All Weather",
        style: (parsed.styleDescription ?? trends[0] ?? "AI Curated Style") as string,
      };
    }
  } catch (error) {
    console.error('Error parsing AI response:', error);
  }
  return generateSmartOutfit(clothes, weather, trends, prompt);
}

function generateSmartOutfit(
  clothes: ClothingItem[],
  weather: Weather | null,
  trends: string[],
  prompt: string
): Outfit {
  const selectedItems: ClothingItem[] = [];
  const isWarm = !!weather && weather.temperature > CONFIG.TEMPERATURE_THRESHOLDS.WARM;
  const isCold = !!weather && weather.temperature < CONFIG.TEMPERATURE_THRESHOLDS.COLD;
  const isRainy = !!weather && weather.condition.toLowerCase().includes('rain');
  const tops = clothes.filter(c => c.type === "tops");
  const bottoms = clothes.filter(c => c.type === "bottoms");
  const shoes = clothes.filter(c => c.type === "shoes");
  if (tops.length > 0) {
    if (isCold) {
      const warmTops = tops.filter(t => 
        t.name.toLowerCase().includes('sweater') ||
        t.name.toLowerCase().includes('hoodie') ||
        t.name.toLowerCase().includes('jacket')
      );
      selectedItems.push((warmTops[0] ?? tops[0]) as ClothingItem);
    } else if (isWarm) {
      const lightTops = tops.filter(t => 
        t.name.toLowerCase().includes('t-shirt') ||
        t.name.toLowerCase().includes('tank') ||
        t.name.toLowerCase().includes('shirt')
      );
      selectedItems.push((lightTops[0] ?? tops[0]) as ClothingItem);
    } else {
      selectedItems.push(tops[0] as ClothingItem);
    }
  }
  if (bottoms.length > 0) {
    selectedItems.push(bottoms[0] as ClothingItem);
  }
  if (shoes.length > 0) {
    if (isRainy) {
      const waterproofShoes = shoes.filter(s => 
        s.name.toLowerCase().includes('boot') ||
        s.name.toLowerCase().includes('waterproof')
      );
      selectedItems.push((waterproofShoes[0] ?? shoes[0]) as ClothingItem);
    } else {
      selectedItems.push(shoes[0] as ClothingItem);
    }
  }
  return {
    id: Date.now().toString(),
    items: selectedItems,
    occasion: prompt || "Smart AI Selection",
    weather: weather ? `${weather.condition}, ${weather.temperature}°C` : "All Weather",
    style: (trends[0] ?? "Weather-Appropriate Style") as string,
  };
}

function generateMockOutfit(
  weather: Weather | null,
  trends: string[],
  prompt: string,
  clothes: ClothingItem[]
): Outfit {
  const tops = clothes.filter(c => c.type === "tops");
  const bottoms = clothes.filter(c => c.type === "bottoms");
  const shoes = clothes.filter(c => c.type === "shoes");
  const selectedItems: ClothingItem[] = [];
  if (tops.length > 0) {
    selectedItems.push(tops[Math.floor(Math.random() * tops.length)] as ClothingItem);
  }
  if (bottoms.length > 0) {
    selectedItems.push(bottoms[Math.floor(Math.random() * bottoms.length)] as ClothingItem);
  }
  if (shoes.length > 0) {
    selectedItems.push(shoes[Math.floor(Math.random() * shoes.length)] as ClothingItem);
  }
  return {
    id: Date.now().toString(),
    items: selectedItems,
    occasion: prompt || "Casual Day Out",
    weather: weather ? `${weather.condition}, ${weather.temperature}°C` : "All Weather",
    style: (trends[Math.floor(Math.random() * Math.max(trends.length, 1))] ?? "Modern Casual") as string,
  };
}
