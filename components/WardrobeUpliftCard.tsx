import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ShoppingBag,
  TrendingUp,
  Star,
  Heart,
  ExternalLink,
  Sparkles,
} from 'lucide-react-native';
import { ClothingItem, Weather } from '@/types';
import { useBudget } from '@/providers/BudgetProvider';

interface SuggestedItem {
  name: string;
  brand: string;
  price: number;
  imageUrl: string;
  reason: string;
  category: string;
  trendScore: number;
  versatilityScore: number;
}

interface WardrobeAnalysis {
  hasWeatherAppropriateClothes: boolean;
  hasTrendyItems: boolean;
  missingCategories: string[];
  overallScore: number;
  suggestions: SuggestedItem[];
  upliftMessage: string;
}

interface WardrobeUpliftCardProps {
  clothes: ClothingItem[];
  weather: Weather | null;
  occasion?: string;
  onItemPress?: (item: SuggestedItem) => void;
}

export default function WardrobeUpliftCard({
  clothes,
  weather,
  occasion = 'daily wear',
  onItemPress,
}: WardrobeUpliftCardProps) {
  const { budget } = useBudget();
  const [analysis, setAnalysis] = useState<WardrobeAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const generateFallbackAnalysis = useCallback((): WardrobeAnalysis => {
    const budgetNum = getBudgetNumber(budget);
    return {
      hasWeatherAppropriateClothes: clothes.length > 2,
      hasTrendyItems: clothes.length > 1,
      missingCategories: ['accessories', 'outerwear'],
      overallScore: Math.max(20, Math.min(80, clothes.length * 15)),
      suggestions: generateFallbackSuggestions(budgetNum),
      upliftMessage: "Your style journey is just beginning! ✨ These pieces will elevate your wardrobe and boost your confidence.",
    };
  }, [budget, clothes.length]);

  const analyzeWardrobe = useCallback(async () => {
    setLoading(true);
    try {
      const analysis = await performWardrobeAnalysis(clothes, weather, occasion, budget);
      setAnalysis(analysis);
    } catch (error) {
      console.error('Wardrobe analysis error:', error);
      setAnalysis(generateFallbackAnalysis());
    } finally {
      setLoading(false);
    }
  }, [clothes, weather, occasion, budget, generateFallbackAnalysis]);

  useEffect(() => {
    analyzeWardrobe();
  }, [analyzeWardrobe]);

  const generateFallbackSuggestions = (budgetNum: number): SuggestedItem[] => {
    const baseItems = [
      {
        name: "Classic White Sneakers",
        brand: "Adidas",
        price: Math.min(budgetNum * 0.3, 120),
        imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400",
        reason: "Versatile foundation piece that works with everything",
        category: "shoes",
        trendScore: 85,
        versatilityScore: 95,
      },
      {
        name: "Oversized Denim Jacket",
        brand: "Zara",
        price: Math.min(budgetNum * 0.4, 80),
        imageUrl: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=400",
        reason: "Perfect layering piece for any season",
        category: "outerwear",
        trendScore: 90,
        versatilityScore: 88,
      },
      {
        name: "Minimalist Crossbody Bag",
        brand: "COS",
        price: Math.min(budgetNum * 0.25, 60),
        imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400",
        reason: "Elevates any outfit instantly",
        category: "accessories",
        trendScore: 80,
        versatilityScore: 92,
      },
      {
        name: "Ribbed Knit Top",
        brand: "Uniqlo",
        price: Math.min(budgetNum * 0.2, 35),
        imageUrl: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400",
        reason: "Trendy texture that's comfortable and stylish",
        category: "tops",
        trendScore: 75,
        versatilityScore: 85,
      },
    ];
    return baseItems.slice(0, 4);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Analyzing your wardrobe...</Text>
      </View>
    );
  }

  if (!analysis || analysis.overallScore > 75) {
    return null;
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FF6B6B', '#FF8E8E', '#FFB6B6']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Sparkles color="#FFFFFF" size={24} />
          </View>
          <View style={styles.headerText}>
            <Text style={styles.title}>Style Upgrade Time!</Text>
            <Text style={styles.subtitle}>{analysis.upliftMessage}</Text>
          </View>
        </View>

        <View style={styles.scoreContainer}>
          <Text style={styles.scoreLabel}>Wardrobe Score</Text>
          <View style={styles.scoreBar}>
            <View 
              style={[styles.scoreProgress, { width: `${analysis.overallScore}%` }]} 
            />
          </View>
          <Text style={styles.scoreText}>{analysis.overallScore}/100</Text>
        </View>

        <Text style={styles.suggestionsTitle}>
          <ShoppingBag color="#FFFFFF" size={18} /> Recommended Additions
        </Text>
        
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.suggestionsScroll}
        >
          {analysis.suggestions.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={styles.suggestionCard}
              onPress={() => onItemPress?.(item)}
              testID={`suggestion-item-${index}`}
            >
              <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
              <View style={styles.itemInfo}>
                <Text style={styles.itemName} numberOfLines={2}>{item.name}</Text>
                <Text style={styles.itemBrand}>{item.brand}</Text>
                <Text style={styles.itemPrice}>${item.price}</Text>
                
                <View style={styles.scoresContainer}>
                  <View style={styles.scoreChip}>
                    <TrendingUp color="#FFD700" size={12} />
                    <Text style={styles.chipText}>{item.trendScore}</Text>
                  </View>
                  <View style={styles.scoreChip}>
                    <Star color="#FFD700" size={12} />
                    <Text style={styles.chipText}>{item.versatilityScore}</Text>
                  </View>
                </View>
                
                <Text style={styles.itemReason} numberOfLines={2}>
                  {item.reason}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <TouchableOpacity style={styles.actionButton}>
          <LinearGradient
            colors={['#FFD700', '#FFA500']}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Heart color="#000" size={20} />
            <Text style={styles.buttonText}>Start Shopping</Text>
            <ExternalLink color="#000" size={16} />
          </LinearGradient>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );
}

async function performWardrobeAnalysis(
  clothes: ClothingItem[],
  weather: Weather | null,
  occasion: string,
  budget: string | null
): Promise<WardrobeAnalysis> {
  const budgetNum = getBudgetNumber(budget);
  
  // Analyze weather appropriateness
  const hasWeatherAppropriateClothes = analyzeWeatherAppropriateness(clothes, weather);
  
  // Analyze trend alignment
  const hasTrendyItems = analyzeTrendiness(clothes);
  
  // Find missing categories
  const missingCategories = findMissingCategories(clothes);
  
  // Calculate overall score
  const overallScore = calculateWardrobeScore(clothes, hasWeatherAppropriateClothes, hasTrendyItems);
  
  // Generate suggestions
  const suggestions = await generateSmartSuggestions(clothes, weather, occasion, budgetNum, missingCategories);
  
  // Create uplift message
  const upliftMessage = generateUpliftMessage(overallScore, missingCategories.length);
  
  return {
    hasWeatherAppropriateClothes,
    hasTrendyItems,
    missingCategories,
    overallScore,
    suggestions,
    upliftMessage,
  };
}

function getBudgetNumber(budget: string | null): number {
  if (!budget) return 200;
  const match = budget.match(/\d+/);
  if (!match) return 200;
  const num = parseInt(match[0]);
  return budget.includes('+') ? num * 1.5 : num;
}

function analyzeWeatherAppropriateness(clothes: ClothingItem[], weather: Weather | null): boolean {
  if (!weather) return true;
  
  const temp = weather.temperature;
  const isWarm = temp > 20;
  const isCold = temp < 10;
  const isRainy = weather.condition.toLowerCase().includes('rain');
  
  if (isCold) {
    return clothes.some(item => 
      item.name.toLowerCase().includes('jacket') ||
      item.name.toLowerCase().includes('sweater') ||
      item.name.toLowerCase().includes('hoodie') ||
      item.name.toLowerCase().includes('coat')
    );
  }
  
  if (isWarm) {
    return clothes.some(item => 
      item.name.toLowerCase().includes('t-shirt') ||
      item.name.toLowerCase().includes('tank') ||
      item.name.toLowerCase().includes('shorts') ||
      item.name.toLowerCase().includes('dress')
    );
  }
  
  if (isRainy) {
    return clothes.some(item => 
      item.name.toLowerCase().includes('jacket') ||
      item.name.toLowerCase().includes('boot') ||
      item.name.toLowerCase().includes('waterproof')
    );
  }
  
  return true;
}

function analyzeTrendiness(clothes: ClothingItem[]): boolean {
  const trendyKeywords = [
    'oversized', 'cropped', 'vintage', 'distressed', 'wide-leg',
    'cargo', 'platform', 'chunky', 'minimalist', 'ribbed'
  ];
  
  return clothes.some(item => 
    trendyKeywords.some(keyword => 
      item.name.toLowerCase().includes(keyword)
    )
  );
}

function findMissingCategories(clothes: ClothingItem[]): string[] {
  const categories = ['tops', 'bottoms', 'shoes', 'outerwear', 'accessories'];
  const presentCategories = new Set(clothes.map(item => item.type));
  
  return categories.filter(cat => !presentCategories.has(cat));
}

function calculateWardrobeScore(
  clothes: ClothingItem[],
  hasWeatherAppropriate: boolean,
  hasTrendy: boolean
): number {
  let score = Math.min(clothes.length * 10, 40); // Base score from quantity
  
  if (hasWeatherAppropriate) score += 20;
  if (hasTrendy) score += 20;
  
  // Bonus for variety
  const uniqueTypes = new Set(clothes.map(item => item.type)).size;
  score += uniqueTypes * 5;
  
  return Math.min(score, 100);
}

async function generateSmartSuggestions(
  clothes: ClothingItem[],
  weather: Weather | null,
  occasion: string,
  budget: number,
  missingCategories: string[]
): Promise<SuggestedItem[]> {
  const suggestions: SuggestedItem[] = [];
  const itemsPerCategory = Math.floor(4 / Math.max(missingCategories.length, 1));
  
  for (const category of missingCategories.slice(0, 4)) {
    const categoryItems = generateCategoryItems(category, budget, weather, occasion);
    suggestions.push(...categoryItems.slice(0, itemsPerCategory || 1));
  }
  
  // Fill remaining slots with versatile items
  while (suggestions.length < 4) {
    suggestions.push(...generateVersatileItems(budget, weather).slice(0, 4 - suggestions.length));
  }
  
  return suggestions.slice(0, 4);
}

function generateCategoryItems(
  category: string,
  budget: number,
  weather: Weather | null,
  occasion: string
): SuggestedItem[] {
  const priceRange = budget / 4;
  
  const categoryMap: Record<string, SuggestedItem[]> = {
    tops: [
      {
        name: "Ribbed Long Sleeve Top",
        brand: "Uniqlo",
        price: Math.min(priceRange * 0.6, 35),
        imageUrl: "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400",
        reason: "Perfect base layer that's on-trend",
        category: "tops",
        trendScore: 85,
        versatilityScore: 90,
      },
      {
        name: "Oversized Blazer",
        brand: "Zara",
        price: Math.min(priceRange * 1.2, 89),
        imageUrl: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400",
        reason: "Instantly elevates any outfit",
        category: "tops",
        trendScore: 90,
        versatilityScore: 95,
      },
    ],
    bottoms: [
      {
        name: "Wide Leg Trousers",
        brand: "COS",
        price: Math.min(priceRange * 1.1, 75),
        imageUrl: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400",
        reason: "Trendy silhouette that's comfortable",
        category: "bottoms",
        trendScore: 88,
        versatilityScore: 85,
      },
      {
        name: "High-Waisted Jeans",
        brand: "Levi's",
        price: Math.min(priceRange * 1.3, 98),
        imageUrl: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400",
        reason: "Classic that never goes out of style",
        category: "bottoms",
        trendScore: 80,
        versatilityScore: 95,
      },
    ],
    shoes: [
      {
        name: "Platform Sneakers",
        brand: "Nike",
        price: Math.min(priceRange * 1.4, 120),
        imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400",
        reason: "Adds height and street style edge",
        category: "shoes",
        trendScore: 92,
        versatilityScore: 80,
      },
      {
        name: "Chelsea Boots",
        brand: "Dr. Martens",
        price: Math.min(priceRange * 1.6, 150),
        imageUrl: "https://images.unsplash.com/photo-1608256246200-53e635b5b65f?w=400",
        reason: "Versatile and weather-appropriate",
        category: "shoes",
        trendScore: 85,
        versatilityScore: 90,
      },
    ],
    outerwear: [
      {
        name: "Cropped Puffer Jacket",
        brand: "The North Face",
        price: Math.min(priceRange * 1.8, 180),
        imageUrl: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=400",
        reason: "Trendy silhouette meets functionality",
        category: "outerwear",
        trendScore: 90,
        versatilityScore: 85,
      },
      {
        name: "Oversized Denim Jacket",
        brand: "Zara",
        price: Math.min(priceRange * 1.0, 65),
        imageUrl: "https://images.unsplash.com/photo-1544966503-7cc5ac882d5f?w=400",
        reason: "Perfect layering piece for any season",
        category: "outerwear",
        trendScore: 88,
        versatilityScore: 92,
      },
    ],
    accessories: [
      {
        name: "Chunky Gold Chain Necklace",
        brand: "Mejuri",
        price: Math.min(priceRange * 0.8, 85),
        imageUrl: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400",
        reason: "Adds instant glamour to any look",
        category: "accessories",
        trendScore: 95,
        versatilityScore: 80,
      },
      {
        name: "Structured Mini Bag",
        brand: "Charles & Keith",
        price: Math.min(priceRange * 1.2, 89),
        imageUrl: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400",
        reason: "Elevates your outfit instantly",
        category: "accessories",
        trendScore: 85,
        versatilityScore: 88,
      },
    ],
  };
  
  return categoryMap[category] || [];
}

function generateVersatileItems(budget: number, weather: Weather | null): SuggestedItem[] {
  const priceRange = budget / 4;
  
  return [
    {
      name: "Classic White Sneakers",
      brand: "Adidas",
      price: Math.min(priceRange * 1.2, 120),
      imageUrl: "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400",
      reason: "Goes with everything in your wardrobe",
      category: "shoes",
      trendScore: 85,
      versatilityScore: 98,
    },
    {
      name: "Basic White Tee",
      brand: "Everlane",
      price: Math.min(priceRange * 0.5, 28),
      imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
      reason: "Essential foundation piece",
      category: "tops",
      trendScore: 75,
      versatilityScore: 100,
    },
  ];
}

function generateUpliftMessage(score: number, missingCategoriesCount: number): string {
  const messages = [
    "Your style journey is just beginning! ✨ These pieces will elevate your wardrobe and boost your confidence.",
    "Ready to level up your look? 🚀 These trendy additions will have you feeling amazing every day!",
    "Time to treat yourself! 💫 These carefully selected pieces will transform your style game.",
    "Your wardrobe is calling for an upgrade! 🌟 These items will help you express your unique style.",
    "Let's build your dream wardrobe! ✨ These versatile pieces will give you endless outfit possibilities.",
  ];
  
  if (score < 30) {
    return "Every style icon started somewhere! 🌟 These foundation pieces will set you up for fashion success.";
  } else if (score < 50) {
    return "You're on the right track! ✨ These additions will take your style to the next level.";
  } else {
    return messages[Math.floor(Math.random() * messages.length)];
  }
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradient: {
    padding: 20,
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    marginTop: 12,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  scoreContainer: {
    marginBottom: 20,
  },
  scoreLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 8,
  },
  scoreBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 4,
  },
  scoreProgress: {
    height: '100%',
    backgroundColor: '#FFD700',
    borderRadius: 4,
  },
  scoreText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'right',
  },
  suggestionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  suggestionsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  suggestionCard: {
    width: 160,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: 12,
    marginRight: 12,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: 120,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  itemInfo: {
    padding: 12,
  },
  itemName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  itemBrand: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 4,
  },
  itemPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFD700',
    marginBottom: 8,
  },
  scoresContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  scoreChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginRight: 6,
  },
  chipText: {
    fontSize: 10,
    color: '#FFD700',
    marginLeft: 2,
    fontWeight: '600',
  },
  itemReason: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 14,
  },
  actionButton: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});