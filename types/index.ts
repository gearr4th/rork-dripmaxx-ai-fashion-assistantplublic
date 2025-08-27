export interface ClothingItem {
  id: string;
  name: string;
  type: string;
  color: string;
  brand?: string;
  imageUrl: string;
}

export interface Weather {
  temperature: number;
  condition: string;
  humidity: number;
  windSpeed: number;
  location: string;
}

export interface Outfit {
  id: string;
  items: ClothingItem[];
  occasion: string;
  weather: string;
  style: string;
}

export interface OutfitHistory {
  id: string;
  date: Date;
  outfit: Outfit;
  rating: number;
  favorite: boolean;
}

export type DripLevel = 'Maxx Drip' | 'Pure Drip' | 'Certified Drip' | 'Lowkey Drip';

export interface ImageAnalysisResult {
  itemName: string;
  officialProductName: string;
  brand?: string;
  type?: string;
  style?: string;
  averagePrice: number | null;
  currency?: string;
  versatilityScore: number; // 0-100
  dripLevel: DripLevel;
  reasoning: string;
  sources?: string[];
}