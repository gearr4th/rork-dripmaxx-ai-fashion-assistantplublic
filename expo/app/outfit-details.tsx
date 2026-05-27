import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, Save, ExternalLink } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSavedOutfits } from "@/providers/SavedOutfitsProvider";
import { useClothes } from "@/providers/ClothesProvider";
import { useSubscription } from "@/providers/SubscriptionProvider";
import { Outfit, ClothingItem } from "@/types";
import { useSession } from "@/providers/SessionProvider";
import Watermark from "@/components/Watermark";

export default function OutfitDetailsScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const { savedOutfits, saveOutfit } = useSavedOutfits();
  const { clothes } = useClothes();
  const { hasWatermark } = useSubscription();
  const { ageGroup } = useSession();

  const outfit: Outfit | null = useMemo(() => {
    const id = params.id ? String(params.id) : null;
    if (!id) return null;
    return savedOutfits.find(o => o.id === id) ?? null;
  }, [params.id, savedOutfits]);

  const handleSave = async () => {
    if (!outfit) return;
    try {
      await saveOutfit(outfit);
      Alert.alert("Saved", "Outfit saved to your profile");
    } catch {
      Alert.alert("Error", "Could not save outfit");
    }
  };

  const resolvedItems = outfit?.items ?? [];
  const outfitItemIds = useMemo(() => new Set((outfit?.items ?? []).map(i => i.id)), [outfit?.items]);
  const wardrobeOther = useMemo(() => {
    return clothes.filter(c => !outfitItemIds.has(c.id));
  }, [clothes, outfitItemIds]);

  type RecommendedProduct = {
    name: string;
    brand: string;
    estimatedPrice: number;
    trendAlignment: string;
    imageUrl: string;
    url: string;
    tier: 'budget' | 'upgrade';
  };

  const makeImageForType = (type: string, tier: 'budget' | 'upgrade'): string => {
    const base = 'https://images.unsplash.com/';
    const byType: Record<string, string[]> = {
      tops: [
        'photo-1520978792268-5de3c0f0b36b',
        'photo-1520975731486-c0d71c465fa8',
        'photo-1489987707025-afc232f7ea0f',
        'photo-1520975922292-5a74d3e3e9d0',
      ],
      bottoms: [
        'photo-1542272604-787c3835535d',
        'photo-1520974746431-81b9b9dc2d22',
        'photo-1512436991641-6745cdb1723f',
      ],
      shoes: [
        'photo-1542291026-7eec264c27ff',
        'photo-1519741497674-611481863552',
        'photo-1520974655501-78b99ad3b49e',
      ],
    };
    const list = byType[type as keyof typeof byType] ?? [
      'photo-1520978792268-5de3c0f0b36b',
    ];
    const idx = Math.floor(Math.random() * list.length);
    const id = list[idx];
    const w = tier === 'upgrade' ? 800 : 600;
    return `${base}${id}?w=${w}`;
  };

  const fashionBrandsBudget = [
    'H&M', 'Uniqlo', 'Zara', 'ASOS', 'Bershka', 'Pull&Bear', 'COS'
  ] as const;
  const fashionBrandsUpgrade = [
    'Nike', 'Adidas', 'New Balance', 'A.P.C.', 'Acne Studios', 'AMI Paris', 'Arket'
  ] as const;

  const randomFrom = <T,>(arr: readonly T[]): T => arr[Math.floor(Math.random() * arr.length)];

  const toTypeGroup = (item: ClothingItem): 'tops' | 'bottoms' | 'shoes' => {
    const t = (item.type || '').toLowerCase();
    if (t.includes('top') || t.includes('jacket') || t.includes('shirt') || t.includes('hoodie')) return 'tops';
    if (t.includes('shoe') || t.includes('sneaker') || t.includes('boot') || t.includes('cleat')) return 'shoes';
    return 'bottoms';
  };

  const generateRecommendations = (item: ClothingItem): { budget: RecommendedProduct; upgrade: RecommendedProduct } => {
    const typeGroup = toTypeGroup(item);
    const baseName = item.name.split(' ').slice(0, 2).join(' ');

    const budget: RecommendedProduct = {
      name: `${baseName} Alt`,
      brand: randomFrom(fashionBrandsBudget),
      estimatedPrice: Math.max(25, Math.round((item.analysis?.averagePrice ?? 60) * 0.6)),
      trendAlignment: item.analysis?.style ?? 'On-trend basic',
      imageUrl: makeImageForType(typeGroup, 'budget'),
      url: `https://www.asos.com/search/?q=${encodeURIComponent(baseName)}`,
      tier: 'budget',
    };
    const upgrade: RecommendedProduct = {
      name: `${baseName} Pro`,
      brand: randomFrom(fashionBrandsUpgrade),
      estimatedPrice: Math.max(80, Math.round((item.analysis?.averagePrice ?? 100) * 1.4)),
      trendAlignment: item.analysis?.style ?? 'Premium contemporary',
      imageUrl: makeImageForType(typeGroup, 'upgrade'),
      url: `https://www.nike.com/w?q=${encodeURIComponent(baseName)}`,
      tier: 'upgrade',
    };

    const wardrobeNames = new Set(clothes.map(c => c.name.toLowerCase()));
    if (wardrobeNames.has(budget.name.toLowerCase())) budget.name = `${budget.name} V2`;
    if (wardrobeNames.has(upgrade.name.toLowerCase())) upgrade.name = `${upgrade.name} Plus`;

    return { budget, upgrade };
  };

  const dripExplainer = useMemo(() => {
    const style = outfit?.style ?? 'Contemporary';
    const occ = outfit?.occasion ?? 'daily wear';
    const baseTags = ['#ootd', '#fyp', '#streetwear', '#minimal', '#outfitinspo', '#todayfit'];
    const styleTags: Record<string, string[]> = {
      streetwear: ['#streetstyle', '#gorpcore', '#techwear'],
      minimalist: ['#cleanfit', '#normcore', '#quietluxury'],
      sporty: ['#athleisure', '#sneakerhead', '#gymfit'],
      casual: ['#casualstyle', '#everydaycarry', '#comfortcore'],
      formal: ['#menswear', '#suitstyle', '#elevatedbasics'],
    };
    const key = Object.keys(styleTags).find(k => style.toLowerCase().includes(k)) ?? 'casual';
    const tags = [...baseTags.slice(0,3), ...(styleTags[key] ?? []).slice(0,2)];
    const ageMap: Record<string, { popular: string; why: string }> = {
      '1-10': { popular: 'bright color pops', why: 'fun palettes and comfy layers' },
      '11-13': { popular: 'graphic tees and cargos', why: 'TikTok dance-core and comfort' },
      '13-18': { popular: 'oversized hoodies and Sambas', why: 'creator-driven street vibes' },
      '18-25': { popular: 'clean sneakers, baggy denim', why: 'effortless campus streetwear' },
      '25-35': { popular: 'elevated basics, neutral tones', why: 'versatile office-to-out feel' },
      '35+': { popular: 'tailored casuals, premium staples', why: 'refined comfort and quality' },
    };
    const ag = ageMap[ageGroup ?? '18-25'];
    const reason = `${style} meets ${occ} with balanced color and proportions; ${ag.popular} trend is hot for your group because ${ag.why}.`;
    return { reason, tags };
  }, [outfit?.style, outfit?.occasion, ageGroup]);

  return (
    <LinearGradient
      colors={["#0B1120", "#111B2E", "#0A1628"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Outfit</Text>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()} testID="close-outfit-details">
            <X color="#CBD5E1" size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.items}>
            <Text style={styles.sectionTitle}>Items</Text>
            {resolvedItems.map((it) => (
              <View key={it.id} style={styles.itemCard} testID={`outfit-item-${it.id}`}>
                <View>
                  <Image source={{ uri: it.imageUrl }} style={styles.itemThumb} />
                  {hasWatermark && <Watermark />}
                </View>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{it.name}</Text>
                  <Text style={styles.itemMeta} numberOfLines={1}>
                    {it.brand ?? 'Unknown brand'} • {it.type || '—'} • {it.color}
                  </Text>
                  {it.analysis?.dripLevel || it.analysis?.versatilityScore ? (
                    <Text style={styles.itemMetaSub}>
                      {it.analysis?.dripLevel ?? 'Drip'} • Versatility {it.analysis?.versatilityScore ?? 60}
                    </Text>
                  ) : null}
                </View>
              </View>
            ))}

            {resolvedItems.length > 0 && (
              <View style={styles.explainer} testID="drip-explainer">
                <Text style={styles.explainerTitle}>Why this hits today</Text>
                <Text style={styles.explainerText} numberOfLines={3}>{dripExplainer.reason}</Text>
                <Text style={styles.explainerTags} numberOfLines={2}>{dripExplainer.tags.join(' ')}</Text>
              </View>
            )}
          </View>

          {resolvedItems.length > 0 && (
            <View style={styles.recoSection}>
              <Text style={styles.sectionTitle}>Today’s Fashion Picks for Your Outfit</Text>
              {resolvedItems.map((it) => {
                const { budget, upgrade } = generateRecommendations(it);
                return (
                  <View key={`reco-${it.id}`} style={styles.recoCard} testID={`reco-row-${it.id}`}>
                    <Text style={styles.recoItemTitle}>{it.name}</Text>
                    <View style={styles.recoRow}>
                      {[budget, upgrade].map((p) => (
                        <View key={`${it.id}-${p.tier}`} style={styles.recoItem}>
                          <Image source={{ uri: p.imageUrl }} style={styles.recoImage} />
                          <View style={styles.recoInfo}>
                            <Text style={styles.recoTier}>
                              {p.tier === 'budget' ? 'Budget Pick' : 'Upgrade Pick'}
                            </Text>
                            <Text style={styles.recoName} numberOfLines={1}>{p.name}</Text>
                            <Text style={styles.recoMeta} numberOfLines={1}>{p.brand} • ${p.estimatedPrice}</Text>
                            <Text style={styles.recoTrend} numberOfLines={1}>{p.trendAlignment}</Text>
                            <TouchableOpacity
                              onPress={() => {
                                console.log('Open recommendation', p);
                                Linking.openURL(p.url).catch(() => Alert.alert('Unable to open link'));
                              }}
                              style={styles.shopButton}
                              testID={`shop-${it.id}-${p.tier}`}
                            >
                              <ExternalLink color="#0A84FF" size={16} />
                              <Text style={styles.shopText}>Shop</Text>
                            </TouchableOpacity>
                          </View>
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })}
            </View>
          )}

          {wardrobeOther.length > 0 && (
            <View style={styles.wardrobeSection}>
              <Text style={styles.sectionTitle}>In Your Wardrobe</Text>
              <View style={styles.grid}>
                {wardrobeOther.slice(0, 12).map((w) => (
                  <View key={w.id} style={styles.gridItem} testID={`wardrobe-item-${w.id}`}>
                    <Image source={{ uri: w.imageUrl }} style={styles.gridImage} />
                    <Text style={styles.gridText} numberOfLines={1}>{w.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={handleSave} testID="save-outfit-button">
            <Save color="#4CAF50" size={24} />
            <Text style={styles.actionText}>Save</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#E2E8F0",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(30, 58, 95, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#CBD5E1",
    marginBottom: 16,
  },
  items: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  itemCard: {
    flexDirection: "row",
    backgroundColor: "rgba(30, 58, 95, 0.35)",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    alignItems: "center",
  },
  itemThumb: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#E2E8F0",
    marginBottom: 4,
  },
  itemMeta: {
    fontSize: 13,
    color: "#94A3B8",
  },
  itemMetaSub: {
    fontSize: 12,
    color: "#8AC6FF",
    marginTop: 2,
  },
  explainer: {
    backgroundColor: 'rgba(30, 58, 95, 0.35)',
    borderColor: 'rgba(59, 130, 246, 0.12)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    marginTop: 4,
  },
  explainerTitle: {
    color: '#60A5FA',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 6,
  },
  explainerText: {
    color: '#CBD5E1',
    fontSize: 13,
    marginBottom: 6,
  },
  explainerTags: {
    color: '#34D399',
    fontSize: 12,
  },
  wardrobeSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  recoSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  recoCard: {
    backgroundColor: 'rgba(30, 58, 95, 0.35)',
    borderRadius: 14,
    padding: 12,
    marginBottom: 14,
  },
  recoItemTitle: {
    color: '#CBD5E1',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  recoRow: {
    flexDirection: 'row',
    gap: 12,
  },
  recoItem: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  recoImage: {
    width: 84,
    height: 84,
  },
  recoInfo: {
    flex: 1,
    padding: 10,
    gap: 2,
  },
  recoTier: {
    color: '#60A5FA',
    fontSize: 11,
    fontWeight: '600',
  },
  recoName: {
    color: '#E2E8F0',
    fontSize: 13,
    fontWeight: '600',
  },
  recoMeta: {
    color: '#94A3B8',
    fontSize: 12,
  },
  recoTrend: {
    color: '#9AE6B4',
    fontSize: 11,
  },
  shopButton: {
    marginTop: 6,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'rgba(10,132,255,0.12)',
  },
  shopText: {
    color: '#0A84FF',
    fontSize: 12,
    fontWeight: '600',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridItem: {
    width: 90,
    alignItems: 'center',
  },
  gridImage: {
    width: 90,
    height: 90,
    borderRadius: 10,
    marginBottom: 6,
  },
  gridText: {
    color: '#CBD5E1',
    fontSize: 12,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(59, 130, 246, 0.12)",
  },
  actionButton: {
    alignItems: "center",
    gap: 8,
  },
  actionText: {
    color: "#CBD5E1",
    fontSize: 12,
  },
});