import { ClothingItem, Outfit, Weather } from "@/types";
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
}

export async function interpretUserStyleRequest(input: string): Promise<ParsedUserRequest> {
  try {
    const model = genAI.getGenerativeModel({ model: CONFIG.GEMINI_MODEL });
    const sys = `Extract concise structured data from the user's outfit request. Respond with ONLY JSON in this exact shape: {"occasion": string|null, "budget": number|null, "preferences": string[]}.
- occasion: short phrase like "school", "party", "date", "office", or null if not provided.
- budget: total budget in user's currency as a number without symbols. If the user mentions $80 or under 50, return 80 or 50. If no budget mentioned, null.
- preferences: array of short tokens for styles, colors, fits, brands, fabrics. Keep 3-8 items.`;
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
      return { occasion, budget, preferences } as ParsedUserRequest;
    }
  } catch (e) {
    console.log('interpretUserStyleRequest fallback parse', e);
  }
  const lower = input.toLowerCase();
  let budget: number | null = null;
  const moneyMatch = lower.match(/\b(under\s*)?(\$|£|€)?\s?(\d{2,4})\b/);
  if (moneyMatch) budget = Number(moneyMatch[3]);
  let occasion: string | null = null;
  const knownOccasions = ['school','party','date','office','work','wedding','gym','brunch','travel','beach'];
  for (const occ of knownOccasions) {
    if (lower.includes(occ)) { occasion = occ; break; }
  }
  const prefs: string[] = [];
  const colorMatch = lower.match(/\b(black|white|navy|blue|green|olive|brown|beige|cream|grey|gray|red|pink|pastel)\b/g);
  if (colorMatch) prefs.push(...colorMatch);
  if (lower.includes('oversized')) prefs.push('oversized');
  if (lower.includes('slim')) prefs.push('slim');
  if (lower.includes('baggy')) prefs.push('baggy');
  if (lower.includes('minimal')) prefs.push('minimalist');
  return { occasion, budget, preferences: Array.from(new Set(prefs)) };
}

export async function fetchSocialTrends(params: { prompt: string; location?: string | null }): Promise<string[]> {
  const { prompt, location } = params;
  try {
    console.log('Fetching social trends from AI...', { prompt, location });
    const model = genAI.getGenerativeModel({ model: CONFIG.GEMINI_MODEL });
    const trendPrompt = `You are a fashion trend scout scanning TikTok and Instagram culture. Based on the current month and year, the user's location "${location ?? 'Unknown'}", and the user's intent: "${prompt || 'general daily outfit'}", output ONLY a compact JSON array of 6-10 short trend tags people are wearing right now on TikTok/Instagram. Focus on wearable items (e.g., "oversized vintage tee", "loose carpenter jeans", "adidas sambas", "ballet flats", "quiet luxury", "gorpcore shells"). Avoid influencers or brand names unless iconic. No explanation, just JSON array of strings.`;
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
