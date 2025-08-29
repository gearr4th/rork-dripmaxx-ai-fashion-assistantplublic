export interface ClothingItem {
  id: string;
  name: string;
  type: string;
  color: string;
  brand?: string;
  imageUrl: string;
  analysis?: ImageAnalysisResult;
  addedToWardrobe?: boolean;
  dateAdded?: Date;
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

export type Occasion = 'casual' | 'work' | 'party' | 'date' | 'gym' | 'formal' | 'travel' | 'daily wear';

export interface BudgetRecommendation {
  fits: boolean;
  message: string;
  alternatives?: CheaperAlternative[];
  occasionMatch: boolean;
  occasionMessage?: string;
}

export interface CheaperAlternative {
  name: string;
  brand: string;
  estimatedPrice: number;
  similarity: number;
  trendAlignment: string;
  whereToFind: string;
}

export interface ImageAnalysisResult {
  itemName: string;
  officialProductName: string;
  brand?: string;
  type?: string;
  style?: string;
  averagePrice: number | null;
  currency: string;
  versatilityScore: number; // 0-100
  dripLevel: DripLevel;
  reasoning: string;
  sources: string[];
  cheaperAlternatives?: CheaperAlternative[];
}

export interface FeedbackData {
  id: string;
  userId?: string;
  easeOfUse: number; // 1-5 stars
  accuracyOfDripRating: number; // 1-5 stars
  usefulnessOfRecommendations: number; // 1-5 stars
  additionalComments: string;
  timestamp: Date;
  appVersion?: string;
  deviceInfo?: string;
}