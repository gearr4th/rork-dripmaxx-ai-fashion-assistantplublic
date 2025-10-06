import { ClothingItem, Outfit, Weather, ImageAnalysisResult, DripLevel, BudgetRecommendation, Occasion, OutfitRating } from "@/types";
import { BudgetOption } from '@/providers/BudgetProvider';
import { CONFIG } from './config';

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

type ContentPart = { type: 'text'; text: string } | { type: 'image'; image: string };
type CoreMessage = { role: 'user' | 'assistant'; content: string | ContentPart[] };

async function callLLM(messages: CoreMessage[]): Promise<string> {
  try {
    const response = await fetch('https://toolkit.rork.com/text/llm/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages }),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`LLM HTTP ${response.status}: ${text}`);
    }
    const data = (await response.json()) as { completion?: string };
    const out = String(data.completion ?? '');
    return out;
  } catch (e) {
    console.log('[callLLM] error', e);
    throw e;
  }
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
    const data = await res.json() as { display_name?: string }[];
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
    const sys = `Extract concise structured data from the user's outfit request. Respond with ONLY JSON in this exact shape: {"occasion": string|null, "budget": number|null, "preferences": string[], "location": string|null}.
- occasion: short phrase like "school", "party", "date", "office", or inferred from place types like mall -> "shopping" if user mentions a venue.
- budget: total budget in user's currency as a number without symbols. If the user mentions $80 or under 50, return 80 or 50. If no budget mentioned, null.
- preferences: array of short tokens for styles, colors, fits, brands, fabrics. Keep 3-8 items.
- location: human-readable location if a place or city is mentioned (e.g., "Chadstone Shopping Centre, Melbourne, Australia"), else null.`;
    const text = await callLLM([
      { role: 'assistant', content: sys },
      { role: 'user', content: `User: ${input}` },
    ]);
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
    const trendPrompt = `You are a fashion trend scout scanning TikTok and Instagram culture. Based on the current month and year, the user's location "${location ?? 'Unknown'}", and the user's intent: "${prompt || 'general daily outfit'}", output ONLY a compact JSON array of 6-10 short trend tags people are wearing right now on TikTok/Instagram. Focus on wearable items (e.g., "oversized vintage tee", "loose carpenter jeans", "adidas sambas", "ballet flats", "quiet luxury", "gorpcore shells"). Avoid influencers or brand names unless iconic. If the location resembles a shopping mall or venue (e.g., "Chadstone Shopping Centre"), bias toward practical shopping-day outfits and Melbourne/AU seasonal context if applicable. No explanation, just JSON array of strings.`;
    const text = await callLLM([
      { role: 'assistant', content: 'Return ONLY JSON arrays when asked. No prose.' },
      { role: 'user', content: trendPrompt },
    ]);
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
    console.log('[analyzeClothingImage] start', { mimeType: input.mimeType, size: input.base64.length });

    const system: CoreMessage = {
      role: 'assistant',
      content:
        'You are a precise fashion product identifier. Respond ONLY with valid JSON matching the required schema. No markdown.'
    };

    const user: CoreMessage = {
      role: 'user',
      content: [
        {
          type: 'text',
          text:
            'Analyze this clothing image and return ONLY JSON with fields: {"itemName": string, "officialProductName": string, "brand": string|null, "type": string|null, "style": string|null, "averagePrice": number|null, "currency": "USD", "versatilityScore": number, "dripLevel": "Maxx Drip" | "Pure Drip" | "Certified Drip" | "Lowkey Drip", "reasoning": string, "sources": string[], "storeLink": string|null, "bestOccasion": "casual" | "work" | "party" | "date" | "gym" | "formal" | "travel" | "daily wear", "cheaperAlternatives": [{"name": string, "brand": string, "estimatedPrice": number, "similarity": number, "trendAlignment": string, "whereToFind": string}]}\nRules: prefer official store pricing; infer brand if visible; ensure valid JSON only.'
        },
        { type: 'image', image: input.base64 },
      ],
    };

    const out = await callLLM([system, user]);
    console.log('[analyzeClothingImage] raw', out.slice(0, 200));
    const jsonMatch = out.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in LLM response');
    const parsed = JSON.parse(jsonMatch[0]) as Record<string, unknown>;

    const dripString = String((parsed as any).dripLevel ?? (parsed as any).drip ?? 'Lowkey Drip');
    const cheaperAlternatives = Array.isArray((parsed as any).cheaperAlternatives)
      ? ((parsed as any).cheaperAlternatives as any[])
          .map((alt) => ({
            name: String(alt?.name ?? 'Alternative Item'),
            brand: String(alt?.brand ?? 'Unknown Brand'),
            estimatedPrice: typeof alt?.estimatedPrice === 'number' ? (alt.estimatedPrice as number) : 0,
            similarity: Math.max(0, Math.min(100, Number(alt?.similarity ?? 70))),
            trendAlignment: String(alt?.trendAlignment ?? 'Trendy'),
            whereToFind: String(alt?.whereToFind ?? 'Online retailers'),
          }))
          .slice(0, 5)
      : [];

    const enriched: ImageAnalysisResult = {
      itemName: String((parsed as any).itemName ?? 'Clothing Item'),
      officialProductName: String((parsed as any).officialProductName ?? (parsed as any).itemName ?? 'Unknown'),
      brand: (parsed as any).brand ? String((parsed as any).brand) : undefined,
      type: (parsed as any).type ? String((parsed as any).type) : undefined,
      style: (parsed as any).style ? String((parsed as any).style) : undefined,
      averagePrice: typeof (parsed as any).averagePrice === 'number' ? ((parsed as any).averagePrice as number) : null,
      currency: (parsed as any).currency ? String((parsed as any).currency) : 'USD',
      versatilityScore: Math.max(0, Math.min(100, Number((parsed as any).versatilityScore ?? 60))),
      dripLevel: (['Maxx Drip', 'Pure Drip', 'Certified Drip', 'Lowkey Drip'].includes(dripString) ? dripString : 'Lowkey Drip') as DripLevel,
      reasoning: String((parsed as any).reasoning ?? ''),
      sources: Array.isArray((parsed as any).sources) ? ((parsed as any).sources as any[]).map((s) => String(s)).slice(0, 5) : [],
      cheaperAlternatives,
      storeLink: typeof (parsed as any).storeLink === 'string' ? ((parsed as any).storeLink as string) : null,
      bestOccasion: (['casual','work','party','date','gym','formal','travel','daily wear'].includes(String((parsed as any).bestOccasion))
        ? (String((parsed as any).bestOccasion) as any)
        : undefined) as any,
    };

    try {
      const verified = await verifyOfficialProduct(enriched);
      return { ...enriched, ...verified } as ImageAnalysisResult;
    } catch (vErr) {
      console.log('[verifyOfficialProduct] failed, returning AI-only data', vErr);
      return enriched;
    }
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
      cheaperAlternatives: [],
      storeLink: null,
      bestOccasion: 'casual',
    };
    return fallback;
  }
}

async function verifyOfficialProduct(base: ImageAnalysisResult): Promise<Partial<ImageAnalysisResult>> {
  try {
    const name = (base.officialProductName || base.itemName).trim();
    const brandLower = (base.brand || '').toLowerCase().trim();
    const query = encodeURIComponent(`${brandLower} ${name}`.trim());

    const brandDomains: Record<string, string> = {
      nike: 'nike.com',
      adidas: 'adidas.com',
      zara: 'zara.com',
      'h&m': 'hm.com',
      hm: 'hm.com',
      uniqlo: 'uniqlo.com',
      puma: 'puma.com',
      reebok: 'reebok.com',
      newbalance: 'newbalance.com',
      'new balance': 'newbalance.com',
      asos: 'asos.com',
      boohoo: 'boohoo.com',
      shein: 'shein.com',
      cos: 'cos.com',
      arket: 'arket.com',
      bershka: 'bershka.com',
      pullbear: 'pullandbear.com',
      'pull&bear': 'pullandbear.com',
    };

    const mappedDomain = Object.entries(brandDomains).find(([k]) => brandLower.includes(k))?.[1] ?? '';

    const candidates: { url: string; source: string }[] = [];
    if (mappedDomain === 'nike.com') candidates.push({ url: `https://www.nike.com/w?q=${query}`, source: 'nike' });
    if (mappedDomain === 'adidas.com') candidates.push({ url: `https://www.adidas.com/us/search?q=${query}`, source: 'adidas' });
    if (mappedDomain === 'zara.com') candidates.push({ url: `https://www.zara.com/us/en/search?searchTerm=${query}`, source: 'zara' });
    if (mappedDomain === 'hm.com') candidates.push({ url: `https://www2.hm.com/en_us/search-results.html?q=${query}`, source: 'hm' });
    if (mappedDomain === 'uniqlo.com') candidates.push({ url: `https://www.uniqlo.com/us/en/search?q=${query}`, source: 'uniqlo' });

    if (!mappedDomain) {
      candidates.push({ url: `https://duckduckgo.com/html/?q=${query}+official`, source: 'duckduckgo' });
    }

    for (const c of candidates) {
      try {
        const res = await fetch(c.url, { headers: { 'Accept': 'text/html,application/xhtml+xml', 'User-Agent': 'WardrobeApp/1.0' } });
        if (!res.ok) continue;
        const html = await res.text();

        const links = html.match(/https?:\/\/[\w.-]+\.[\w.-]+[^"'\s<>)]*/g) ?? [];
        const preferred = links.find((u) => (mappedDomain ? u.includes(mappedDomain) : /nike|adidas|zara|hm|uniqlo|puma|newbalance|reebok|asos|cos|arket|bershka|pullandbear/.test(u)));
        const verifiedStoreLink = preferred ?? base.storeLink ?? null;

        const priceMatch = html.match(/(US\$|A\$|\$|€|£)\s?\d{1,4}(?:[\.,]\d{2})?/);
        let verifiedPrice: number | null = base.averagePrice ?? null;
        let verifiedCurrency: string = base.currency || 'USD';
        if (priceMatch) {
          const raw = priceMatch[0];
          verifiedCurrency = raw.includes('€') ? 'EUR' : raw.includes('£') ? 'GBP' : raw.includes('A$') ? 'AUD' : 'USD';
          const num = raw.replace(/[^0-9\.]/g, '');
          const parsed = parseFloat(num);
          verifiedPrice = Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : verifiedPrice;
        }

        if (verifiedStoreLink || verifiedPrice != null) {
          return { verifiedStoreLink, verifiedPrice, verifiedCurrency, verificationSource: c.source };
        }
      } catch (err) {
        console.log('[verifyOfficialProduct] candidate error', c.source, err);
      }
    }

    return { verifiedStoreLink: base.storeLink ?? null, verifiedPrice: base.averagePrice ?? null, verifiedCurrency: base.currency, verificationSource: null };
  } catch (e) {
    console.log('[verifyOfficialProduct] error', e);
    return { verifiedStoreLink: base.storeLink ?? null, verifiedPrice: base.averagePrice ?? null, verifiedCurrency: base.currency, verificationSource: null };
  }
}

export async function generateOutfit({
  weather,
  trends,
  prompt,
  clothes,
}: GenerateOutfitParams): Promise<Outfit> {
  try {
    console.log('Generating outfit with AI...');
    const aiPrompt = createOutfitPrompt(weather, trends, prompt, clothes);
    const text = await callLLM([
      { role: 'assistant', content: 'You are a professional mobile fashion stylist. Return ONLY JSON as instructed.' },
      { role: 'user', content: aiPrompt },
    ]);
    console.log('AI response:', text);
    const outfit = parseAIResponse(text, clothes, weather, trends, prompt);
    return outfit;
  } catch (error) {
    console.error('AI generateOutfit error:', error);
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

// Keep a short memory of recent picks to increase variety between generations
const __recentSelectionIds: string[] = [];
const __recentComboKeys: string[] = [];

function generateSmartOutfit(
  clothes: ClothingItem[],
  weather: Weather | null,
  trends: string[],
  prompt: string
): Outfit {
  const logPrefix = '[generateSmartOutfit]';
  console.log(`${logPrefix} start`, { clothesCount: clothes.length, weather, prompt, trendsCount: trends.length });
  const selectedItems: ClothingItem[] = [];
  const isWarm = !!weather && weather.temperature > CONFIG.TEMPERATURE_THRESHOLDS.WARM;
  const isCold = !!weather && weather.temperature < CONFIG.TEMPERATURE_THRESHOLDS.COLD;
  const isRainy = !!weather && (weather.condition?.toLowerCase?.().includes('rain') ?? false);

  const lowerPrompt = (prompt || '').toLowerCase();
  const isRun = /(\brun|running|jog|jogging|sprint|marathon)\b/.test(lowerPrompt);
  const isSoccer = /(\bsoccer\b|football match|five[- ]a[- ]side|futsal|\bcleats?\b|\bkit\b|\bjersey\b)/.test(lowerPrompt);
  const isGym = /(\bgym\b|workout|training|train)/.test(lowerPrompt);
  const isSporty = isRun || isSoccer || isGym;

  const byType = (t: string) => clothes.filter(c => (c.type?.toLowerCase?.() ?? '') === t);
  const tops = byType('tops');
  const bottoms = byType('bottoms');
  const shoes = byType('shoes');

  const nameIncludes = (item: ClothingItem, patterns: string[]): boolean => {
    const n = `${item.name} ${item.brand ?? ''} ${item.type ?? ''}`.toLowerCase();
    return patterns.some(p => n.includes(p));
  };

  const recentPenalty = (item: ClothingItem): number => {
    return __recentSelectionIds.includes(item.id) ? -18 : 0;
  };

  const sportUnsuitablePenalty = (item: ClothingItem): number => {
    if (!isSporty) return 0;
    const n = `${item.name} ${item.type ?? ''}`.toLowerCase();
    if (/(jean|chino|trouser|leather|coat|blazer|oxford|loafer|derby)/.test(n)) return -28;
    return 0;
  };

  const scoreItem = (item: ClothingItem, category: 'top' | 'bottom' | 'shoe'): number => {
    let score = 0;
    if (isSporty) score += 8;

    if (isRun) {
      if (category === 'shoe' && nameIncludes(item, ['runner', 'running', 'pegasus', 'ultraboost', 'trainer', 'sneaker'])) score += 70;
      if (category === 'bottom' && nameIncludes(item, ['short', 'split short', 'jogger', 'track'])) score += isWarm ? 50 : 30;
      if (category === 'top' && nameIncludes(item, ['tee', 't-shirt', 'tank', 'singlet', 'dri-fit', 'jersey'])) score += isWarm ? 42 : 24;
      if (isCold && category === 'top' && nameIncludes(item, ['long sleeve', 'hoodie', 'thermal', 'quarter zip'])) score += 26;
    }

    if (isSoccer) {
      if (category === 'shoe' && nameIncludes(item, ['cleat', 'boot', 'samba', 'predator', 'tiempo', 'x speed', 'mercurial'])) score += 70;
      if (category === 'bottom' && nameIncludes(item, ['short', 'kit', 'soccer', 'football'])) score += 52;
      if (category === 'top' && nameIncludes(item, ['jersey', 'kit', 'tee'])) score += 42;
      if (isRainy && category === 'top' && nameIncludes(item, ['shell', 'windbreaker', 'jacket'])) score += 20;
    }

    if (isGym) {
      if (category === 'shoe' && nameIncludes(item, ['trainer', 'metcon', 'nobull', 'nano', 'sneaker'])) score += 54;
      if (category === 'bottom' && nameIncludes(item, ['short', 'compression', 'jogger'])) score += 38;
      if (category === 'top' && nameIncludes(item, ['tank', 'tee', 'dri-fit'])) score += 36;
    }

    if (isWarm) {
      if (category === 'bottom' && nameIncludes(item, ['short'])) score += 26;
      if (category === 'top' && nameIncludes(item, ['tee', 'tank'])) score += 18;
    }
    if (isCold) {
      if (category === 'top' && nameIncludes(item, ['hoodie', 'sweater', 'jacket', 'long sleeve'])) score += 24;
      if (category === 'bottom' && nameIncludes(item, ['jogger', 'track', 'thermal'])) score += 18;
    }
    if (isRainy) {
      if (category === 'shoe' && nameIncludes(item, ['boot', 'gore', 'waterproof'])) score += 24;
      if (category === 'top' && nameIncludes(item, ['shell', 'rain', 'windbreaker', 'jacket'])) score += 18;
    }

    if (Array.isArray(trends) && trends.length) {
      const tLower = trends.join(' ').toLowerCase();
      if (tLower.includes('gorpcore') && nameIncludes(item, ['shell', 'cargo', 'trail'])) score += 10;
      if (tLower.includes('minimal') && nameIncludes(item, ['tee', 'plain'])) score += 6;
      if (tLower.includes('athleisure') && nameIncludes(item, ['dri-fit', 'track', 'trainer'])) score += 8;
    }

    score += Math.floor(Math.random() * 12);
    score += recentPenalty(item);
    score += sportUnsuitablePenalty(item);
    return score;
  };

  const rankItems = (items: ClothingItem[], category: 'top' | 'bottom' | 'shoe') => {
    return items
      .map(i => ({ i, s: scoreItem(i, category) }))
      .sort((a, b) => b.s - a.s);
  };

  const pickBest = (items: ClothingItem[], category: 'top' | 'bottom' | 'shoe'): ClothingItem | null => {
    if (items.length === 0) return null;
    const ranked = rankItems(items, category);
    const topN = ranked.slice(0, Math.min(4, ranked.length));
    const weights = topN.map((_, idx) => (topN.length - idx));
    const total = weights.reduce((acc, w) => acc + w, 0);
    let r = Math.random() * total;
    for (let k = 0; k < topN.length; k++) {
      if (r < weights[k]) return topN[k].i;
      r -= weights[k];
    }
    return topN[0].i;
  };

  const ensureSportSpecific = (current: ClothingItem | null, candidates: ClothingItem[], mustPatterns: string[], category: 'top'|'bottom'|'shoe') => {
    if (!current) return pickBest(candidates, category);
    if (nameIncludes(current, mustPatterns)) return current;
    const filtered = candidates.filter(c => nameIncludes(c, mustPatterns));
    if (filtered.length === 0) return current;
    return pickBest(filtered, category) ?? current;
  };

  // Candidate groups with inference if types are noisy
  const topCandidates = tops.length ? tops : clothes.filter(c => nameIncludes(c, ['tee', 'shirt', 'tank', 'jersey', 'hoodie', 'jacket', 'long sleeve']));
  const bottomCandidates = bottoms.length ? bottoms : clothes.filter(c => nameIncludes(c, ['short', 'shorts', 'pant', 'jean', 'jogger', 'track']));
  const shoeCandidates = shoes.length ? shoes : clothes.filter(c => nameIncludes(c, ['shoe', 'sneaker', 'boot', 'runner', 'trainer', 'cleat']));

  let chosenTop = pickBest(topCandidates, 'top');
  let chosenBottom = pickBest(bottomCandidates, 'bottom');
  let chosenShoe = pickBest(shoeCandidates, 'shoe');

  if (isRun) {
    chosenShoe = ensureSportSpecific(chosenShoe, shoeCandidates, ['runner','running','pegasus','ultraboost','trainer','sneaker'], 'shoe');
    chosenBottom = ensureSportSpecific(chosenBottom, bottomCandidates, ['short','split short','jogger','track'], 'bottom');
  }
  if (isSoccer) {
    chosenShoe = ensureSportSpecific(chosenShoe, shoeCandidates, ['cleat','boot','samba','predator','tiempo','x speed','mercurial'], 'shoe');
    chosenTop = ensureSportSpecific(chosenTop, topCandidates, ['jersey','kit','tee'], 'top');
    chosenBottom = ensureSportSpecific(chosenBottom, bottomCandidates, ['short','kit','soccer','football'], 'bottom');
  }
  if (isGym) {
    chosenShoe = ensureSportSpecific(chosenShoe, shoeCandidates, ['trainer','metcon','nobull','nano','sneaker'], 'shoe');
  }

  const pushIf = (i: ClothingItem | null) => { if (i) selectedItems.push(i); };
  pushIf(chosenTop);
  pushIf(chosenBottom);
  pushIf(chosenShoe);

  // Avoid identical combinations back-to-back
  const comboKey = selectedItems.map(i => i.id).sort().join('-');
  if (__recentComboKeys.includes(comboKey)) {
    console.log(`${logPrefix} combo duplicate detected, forcing variation`);
    // Try swapping one piece for next best alternative
    const swapOne = () => {
      const trySwap = (current: ClothingItem | null, candidates: ClothingItem[], category: 'top'|'bottom'|'shoe') => {
        if (!current) return null;
        const ranked = rankItems(candidates, category).map(r => r.i).filter(i => i.id !== current.id);
        const alt = ranked.find(i => !__recentSelectionIds.includes(i.id)) ?? ranked[0] ?? null;
        return alt ?? current;
      };
      if (Math.random() < 0.34) chosenTop = trySwap(chosenTop, topCandidates, 'top');
      else if (Math.random() < 0.67) chosenBottom = trySwap(chosenBottom, bottomCandidates, 'bottom');
      else chosenShoe = trySwap(chosenShoe, shoeCandidates, 'shoe');
    };
    swapOne();
    // rebuild selection
    selectedItems.length = 0;
    pushIf(chosenTop);
    pushIf(chosenBottom);
    pushIf(chosenShoe);
  }

  // Update recent memory for variety
  selectedItems.forEach(i => {
    __recentSelectionIds.push(i.id);
    if (__recentSelectionIds.length > 15) __recentSelectionIds.shift();
  });
  const newComboKey = selectedItems.map(i => i.id).sort().join('-');
  __recentComboKeys.push(newComboKey);
  if (__recentComboKeys.length > 8) __recentComboKeys.shift();

  console.log(`${logPrefix} selection`, selectedItems.map(s => ({ name: s.name, type: s.type })));

  return {
    id: Date.now().toString(),
    items: selectedItems,
    occasion: prompt || 'Smart AI Selection',
    weather: weather ? `${weather.condition}, ${weather.temperature}°C` : 'All Weather',
    style: (isSporty ? (isRun ? 'Run-ready' : isSoccer ? 'Match-ready' : 'Sport-ready') : trends[0] ?? 'Weather-Appropriate Style') as string,
  };
}

function parseBudgetAmount(budget: BudgetOption): number {
  switch (budget) {
    case '$100': return 100;
    case '$250': return 250;
    case '$500': return 500;
    case '$1000': return 1000;
    case '$2000+': return 2000;
    default: return 100;
  }
}

function isOccasionMatch(itemAnalysis: ImageAnalysisResult | undefined, occasion: Occasion): boolean {
  if (!itemAnalysis) return true;
  
  const style = itemAnalysis.style?.toLowerCase() || '';
  const name = itemAnalysis.itemName.toLowerCase();
  
  switch (occasion) {
    case 'formal':
      return style.includes('formal') || style.includes('business') || 
             name.includes('suit') || name.includes('dress shirt') || name.includes('blazer');
    case 'party':
      return style.includes('party') || style.includes('night') || 
             name.includes('dress') || name.includes('heels') || itemAnalysis.dripLevel === 'Maxx Drip';
    case 'gym':
      return style.includes('athletic') || style.includes('sport') || 
             name.includes('sneakers') || name.includes('leggings') || name.includes('tank');
    case 'work':
      return style.includes('business') || style.includes('professional') || 
             name.includes('shirt') || name.includes('pants') || name.includes('blazer');
    case 'date':
      return itemAnalysis.dripLevel === 'Maxx Drip' || itemAnalysis.dripLevel === 'Pure Drip' ||
             style.includes('elegant') || style.includes('chic');
    case 'casual':
    case 'daily wear':
    case 'travel':
    default:
      return itemAnalysis.versatilityScore > 60;
  }
}

export function evaluateBudgetAndOccasion(
  analysis: ImageAnalysisResult,
  budget: BudgetOption | null,
  occasion: Occasion = 'casual'
): BudgetRecommendation {
  const budgetAmount = budget ? parseBudgetAmount(budget) : null;
  const itemPrice = analysis.averagePrice || 0;
  const occasionMatch = isOccasionMatch(analysis, occasion);
  
  let fits = true;
  let message = '';
  let occasionMessage = '';
  
  if (budgetAmount && itemPrice > budgetAmount) {
    fits = false;
    const overage = itemPrice - budgetAmount;
    message = `This item costs ${itemPrice}, which is ${overage} over your ${budget} budget.`;
  } else if (budgetAmount) {
    const remaining = budgetAmount - itemPrice;
    message = `Great choice! This fits your ${budget} budget with ${remaining} to spare.`;
  } else {
    message = 'No budget set - consider setting a monthly budget in settings.';
  }
  
  if (!occasionMatch) {
    occasionMessage = `This item might not be ideal for ${occasion} occasions. Consider the style and versatility score.`;
  } else {
    occasionMessage = `Perfect match for ${occasion} occasions!`;
  }
  
  return {
    fits,
    message,
    alternatives: fits ? undefined : analysis.cheaperAlternatives,
    occasionMatch,
    occasionMessage
  };
}

export async function rateOutfit(params: {
  base64: string;
  mimeType: string;
  occasion: string;
}): Promise<import('@/types').OutfitRating> {
  try {
    console.log('[rateOutfit] start', { occasion: params.occasion });

    const system: CoreMessage = {
      role: 'assistant',
      content: 'You are a professional fashion critic and stylist. Respond ONLY with valid JSON matching the required schema. No markdown.'
    };

    const user: CoreMessage = {
      role: 'user',
      content: [
        {
          type: 'text',
          text: `Analyze this complete outfit and rate it based on 5 criteria. The occasion is: "${params.occasion}"

Criteria (each scored 0-100):
1. Creativity & Style Identity (25% weight): Originality, taste, individuality. Unique combinations vs copy-paste trends.
2. Context & Occasion Match (15% weight): Does it make sense for "${params.occasion}"? Event-appropriate, seasonally right.
3. Color Coordination (20% weight): Harmonious tones, contrast, balanced saturation.
4. Accessory & Footwear Integration (15% weight): How accessories and shoes complete the outfit.
5. Composition & Fit (25% weight): Proportions, layering, silhouette, tailoring.

Respond ONLY with JSON:
{
  "criteria": {
    "creativityAndStyle": number,
    "contextAndOccasion": number,
    "colorCoordination": number,
    "accessoryAndFootwear": number,
    "compositionAndFit": number
  },
  "detailedFeedback": {
    "creativityFeedback": "string",
    "contextFeedback": "string",
    "colorFeedback": "string",
    "accessoryFeedback": "string",
    "compositionFeedback": "string"
  },
  "overallSummary": "string (2-3 sentences)"
}`
        },
        { type: 'image', image: params.base64 },
      ],
    };

    const out = await callLLM([system, user]);
    console.log('[rateOutfit] raw', out.slice(0, 200));
    const jsonMatch = out.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in LLM response');
    const parsed = JSON.parse(jsonMatch[0]) as any;

    const criteria = {
      creativityAndStyle: Math.max(0, Math.min(100, Number(parsed.criteria?.creativityAndStyle ?? 50))),
      contextAndOccasion: Math.max(0, Math.min(100, Number(parsed.criteria?.contextAndOccasion ?? 50))),
      colorCoordination: Math.max(0, Math.min(100, Number(parsed.criteria?.colorCoordination ?? 50))),
      accessoryAndFootwear: Math.max(0, Math.min(100, Number(parsed.criteria?.accessoryAndFootwear ?? 50))),
      compositionAndFit: Math.max(0, Math.min(100, Number(parsed.criteria?.compositionAndFit ?? 50))),
    };

    const compositeDripScore = Math.round(
      criteria.creativityAndStyle * 0.25 +
      criteria.contextAndOccasion * 0.15 +
      criteria.colorCoordination * 0.20 +
      criteria.accessoryAndFootwear * 0.15 +
      criteria.compositionAndFit * 0.25
    );

    let dripCategory: 'Lowkey Drip' | 'Certified Drip' | 'Pure Drip' | 'Maxx Drip';
    if (compositeDripScore >= 91) dripCategory = 'Maxx Drip';
    else if (compositeDripScore >= 71) dripCategory = 'Pure Drip';
    else if (compositeDripScore >= 51) dripCategory = 'Certified Drip';
    else dripCategory = 'Lowkey Drip';

    const rating: import('@/types').OutfitRating = {
      id: Date.now().toString(),
      imageUri: '',
      occasion: params.occasion,
      criteria,
      compositeDripScore,
      dripCategory,
      detailedFeedback: {
        creativityFeedback: String(parsed.detailedFeedback?.creativityFeedback ?? 'No feedback'),
        contextFeedback: String(parsed.detailedFeedback?.contextFeedback ?? 'No feedback'),
        colorFeedback: String(parsed.detailedFeedback?.colorFeedback ?? 'No feedback'),
        accessoryFeedback: String(parsed.detailedFeedback?.accessoryFeedback ?? 'No feedback'),
        compositionFeedback: String(parsed.detailedFeedback?.compositionFeedback ?? 'No feedback'),
      },
      overallSummary: String(parsed.overallSummary ?? 'Outfit analyzed.'),
      timestamp: new Date(),
    };

    return rating;
  } catch (e) {
    console.log('[rateOutfit] error', e);
    throw new Error('Failed to rate outfit');
  }
}
