import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, Shirt, TrendingUp, Camera, Sparkles, Trash2, X, CheckSquare } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useClothes } from "@/providers/ClothesProvider";
import { useWeather } from "@/providers/WeatherProvider";
import ClothingItem from "@/components/ClothingItem";
import WardrobeUpliftCard from "@/components/WardrobeUpliftCard";
import TrendCard from "@/components/TrendCard";
import ImageAnalysisCard from "@/components/ImageAnalysisCard";
import { ClothingItem as ClothingItemType, ImageAnalysisResult } from "@/types";

interface RecommendedItem {
  id: string;
  name: string;
  imageUrl: string;
  price: number;
  linkUrl: string;
  category: string;
  reason: string;
}

export default function ClothesScreen() {
  const { clothes, removeClothingItems, removeClothingItem, clearAll } = useClothes();
  const { weather } = useWeather();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [analysisResults] = useState<ImageAnalysisResult[]>([]);
  const [trends] = useState<string[]>(["Modern casual", "Streetwear", "Minimalist", "Y2K Revival"]);
  const [selectionMode, setSelectionMode] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const params = useLocalSearchParams<{ showRecs?: string }>();

  const categories = [
    { id: "all", name: "All", icon: "👔" },
    { id: "tops", name: "Tops", icon: "👕" },
    { id: "bottoms", name: "Bottoms", icon: "👖" },
    { id: "shoes", name: "Shoes", icon: "👟" },
    { id: "accessories", name: "Accessories", icon: "👜" },
  ];

  const filteredClothes = useMemo(() => selectedCategory === "all" 
    ? clothes 
    : clothes.filter(item => item.type === selectedCategory), [clothes, selectedCategory]);

  const shouldShowRecommendations = useMemo(() => {
    const flag = params?.showRecs === '1';
    return flag || clothes.length <= 4;
  }, [params?.showRecs, clothes.length]);

  const recommendedItems: RecommendedItem[] = useMemo(() => {
    const list: RecommendedItem[] = [
      { id: 'rec-1', name: 'White Oversized Tee', imageUrl: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=800&auto=format&fit=crop', price: 19, linkUrl: 'https://www.asos.com/search/?q=white%20oversized%20t%20shirt', category: 'tops', reason: 'Layerable essential elevates any fit' },
      { id: 'rec-2', name: 'Black Slim Jeans', imageUrl: 'https://images.unsplash.com/photo-1516826957135-700dedea698c?q=80&w=800&auto=format&fit=crop', price: 39, linkUrl: 'https://www.zara.com/', category: 'bottoms', reason: 'Versatile base, works with sneakers or boots' },
      { id: 'rec-3', name: 'Clean White Sneakers', imageUrl: 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?q=80&w=800&auto=format&fit=crop', price: 59, linkUrl: 'https://www.nike.com/w/white-shoes-3rauvzy7ok', category: 'shoes', reason: 'Certified drip staple that pairs with everything' },
      { id: 'rec-4', name: 'Neutral Hoodie', imageUrl: 'https://images.unsplash.com/photo-1512436991641-6745cdb1723f?q=80&w=800&auto=format&fit=crop', price: 35, linkUrl: 'https://www.uniqlo.com/', category: 'tops', reason: 'Cozy streetwear layer, timeless' },
      { id: 'rec-5', name: 'Black Baseball Cap', imageUrl: 'https://images.unsplash.com/photo-1520975916090-3105956dac38?q=80&w=800&auto=format&fit=crop', price: 15, linkUrl: 'https://www.amazon.com/s?k=black+baseball+cap', category: 'accessories', reason: 'Lowkey drip finisher for casual fits' },
      { id: 'rec-6', name: 'Silver Chain', imageUrl: 'https://images.unsplash.com/photo-1606857521015-7f9fcf423740?q=80&w=800&auto=format&fit=crop', price: 22, linkUrl: 'https://www.etsy.com/search?q=silver+chain+men', category: 'accessories', reason: 'Subtle shine boosts outfit score' },
      { id: 'rec-7', name: 'Carpenter Pants', imageUrl: 'https://images.unsplash.com/photo-1593030761757-81b0736f9e2d?q=80&w=800&auto=format&fit=crop', price: 49, linkUrl: 'https://www.carhartt-wip.com/en', category: 'bottoms', reason: 'On-trend silhouette with utility vibe' },
      { id: 'rec-8', name: 'Black Puffer Vest', imageUrl: 'https://images.unsplash.com/photo-1519741497674-611481863552?q=80&w=800&auto=format&fit=crop', price: 55, linkUrl: 'https://www.h&m.com/', category: 'tops', reason: 'Layer for dimension without bulk' },
      { id: 'rec-9', name: 'Crew Socks (3pk)', imageUrl: 'https://images.unsplash.com/photo-1584530220747-254c9d0d9077?q=80&w=800&auto=format&fit=crop', price: 12, linkUrl: 'https://www.amazon.com/s?k=crew+socks', category: 'accessories', reason: 'Small upgrade that cleans up the silhouette' },
      { id: 'rec-10', name: 'Classic Belt', imageUrl: 'https://images.unsplash.com/photo-1582860738160-00ddcb6c3d5d?q=80&w=800&auto=format&fit=crop', price: 18, linkUrl: 'https://www.levis.com/', category: 'accessories', reason: 'Polished finish, elevates fit cohesion' },
    ];
    return list;
  }, []);

  const onLongPressItem = useCallback((item: ClothingItemType) => {
    setSelectionMode(true);
    setSelectedIds(prev => new Set(prev).add(item.id));
  }, []);

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const exitSelection = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const handleDeleteSelected = useCallback(async () => {
    if (selectedIds.size === 0) {
      Alert.alert("Nothing selected", "Select items to delete by tapping them.");
      return;
    }
    Alert.alert(
      "Delete items",
      `Are you sure you want to delete ${selectedIds.size} item(s)?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: async () => {
          await removeClothingItems(Array.from(selectedIds));
          exitSelection();
        } },
      ]
    );
  }, [selectedIds, removeClothingItems, exitSelection]);

  const handleDeleteAll = useCallback(() => {
    if (filteredClothes.length === 0) return;
    Alert.alert(
      "Delete all",
      `This will delete all ${filteredClothes.length} item(s) in this view. Continue?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete All", style: "destructive", onPress: async () => {
          await removeClothingItems(filteredClothes.map(i => i.id));
          exitSelection();
        }},
      ]
    );
  }, [filteredClothes, removeClothingItems, exitSelection]);

  return (
    <LinearGradient
      colors={["#0A0A0A", "#1A1A2E", "#0A0A0A"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>My Wardrobe</Text>
          <View style={styles.headerActions}>
            {selectionMode ? (
              <>
                <TouchableOpacity accessibilityRole="button" testID="exit-selection" onPress={exitSelection} style={styles.headerPill}>
                  <X color="#000" size={20} />
                </TouchableOpacity>
                <TouchableOpacity accessibilityRole="button" testID="delete-selected" onPress={handleDeleteSelected} style={[styles.headerPill, { backgroundColor: "#FF5A5F" }]}>
                  <Trash2 color="#000" size={20} />
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => router.push("/scan-clothes" as any)}
              >
                <LinearGradient
                  colors={["#FFD700", "#FFA500"]}
                  style={styles.addButtonGradient}
                >
                  <Plus color="#000" size={24} />
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category.id}
              style={[
                styles.categoryButton,
                selectedCategory === category.id && styles.categoryButtonActive,
              ]}
              onPress={() => setSelectedCategory(category.id)}
            >
              <Text style={styles.categoryIcon}>{category.icon}</Text>
              <Text
                style={[
                  styles.categoryText,
                  selectedCategory === category.id && styles.categoryTextActive,
                ]}
              >
                {category.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <ScrollView 
          style={styles.mainContent}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{clothes.length}</Text>
              <Text style={styles.statLabel}>Total Items</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {clothes.filter(c => c.type === "tops").length}
              </Text>
              <Text style={styles.statLabel}>Tops</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {clothes.filter(c => c.type === "bottoms").length}
              </Text>
              <Text style={styles.statLabel}>Bottoms</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>
                {clothes.filter(c => c.type === "shoes").length}
              </Text>
              <Text style={styles.statLabel}>Shoes</Text>
            </View>
          </View>

          <WardrobeUpliftCard
            clothes={clothes}
            weather={weather}
            occasion="daily wear"
            onItemPress={(item) => {
              try {
                const params2 = {
                  name: item.name,
                  brand: item.brand,
                  price: String(item.price),
                  imageUrl: item.imageUrl,
                  reason: item.reason,
                  category: item.category,
                  trendScore: String(item.trendScore),
                  versatilityScore: String(item.versatilityScore),
                } as const;
                router.push({ pathname: "/recommendation-details", params: params2 });
              } catch (e) {
                console.log('[Wardrobe] navigate recommendation error', e);
              }
            }}
          />

          <View style={styles.trendsSection}>
            <Text style={styles.sectionTitle}>
              <TrendingUp color="#FFD700" size={20} /> Current Trends
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.trendsScroll}
            >
              {trends.map((trend, index) => (
                <TrendCard key={`${trend}-${index}`} trend={trend} />
              ))}
            </ScrollView>
          </View>

          <View style={styles.scanSection}>
            <Text style={styles.sectionTitle}>
              <Camera color="#FFD700" size={20} /> Scan & Analyze
            </Text>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => router.push("/scan-clothes" as any)}
            >
              <LinearGradient
                colors={["#4CAF50", "#45A049"]}
                style={styles.scanButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Camera color="#FFF" size={24} />
                <Text style={styles.scanButtonText}>Scan New Item</Text>
                <Sparkles color="#FFF" size={20} />
              </LinearGradient>
            </TouchableOpacity>
            <Text style={styles.scanDescription}>
              Get instant analysis: brand, price, drip level & cheaper alternatives
            </Text>
          </View>

          {analysisResults.length > 0 && (
            <View style={styles.analysisSection}>
              <Text style={styles.sectionTitle}>
                <Sparkles color="#FFD700" size={20} /> Recent Analysis
              </Text>
              {analysisResults.map((result, index) => (
                <ImageAnalysisCard key={index} result={result} />
              ))}
            </View>
          )}

          <View style={styles.selectionBarWrapper}>
            {selectionMode && (
              <View style={styles.selectionBar}>
                <Text style={styles.selectionText}>{selectedIds.size} selected</Text>
                <View style={styles.selectionActions}>
                  <TouchableOpacity testID="delete-all" style={[styles.selectionButton, { backgroundColor: "#FF5A5F" }]} onPress={handleDeleteAll}>
                    <Trash2 color="#000" size={18} />
                    <Text style={styles.selectionButtonText}>Delete All</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          <View style={styles.wardrobeSection}>
            <Text style={styles.sectionTitle}>
              <Shirt color="#FFD700" size={20} /> My Wardrobe
            </Text>
            {filteredClothes.length === 0 ? (
              <View style={styles.emptyState}>
                <Shirt color="#666" size={48} />
                <Text style={styles.emptyStateText}>No items in wardrobe</Text>
                <Text style={styles.emptyStateSubtext}>
                  Tap the + button to add your first item
                </Text>
              </View>
            ) : (
              <View style={styles.gridContainer}>
                {filteredClothes.map((item) => {
                  const isSelected = selectedIds.has(item.id);
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={[styles.gridItem, isSelected && styles.gridItemSelected]}
                      onLongPress={() => onLongPressItem(item)}
                      delayLongPress={250}
                      onPress={() => selectionMode ? toggleSelect(item.id) : router.push(`/item/${item.id}` as any)}
                      testID={`wardrobe-item-${item.id}`}
                      accessibilityRole="button"
                      accessibilityLabel={`Open details for ${item.name}`}
                    >
                      {selectionMode && (
                        <View style={[styles.checkOverlay, isSelected ? styles.checkOverlayActive : null]}>
                          <CheckSquare color={isSelected ? "#000" : "#888"} size={18} />
                        </View>
                      )}
                      <ClothingItem 
                        item={item} 
                        onDelete={() => {
                          Alert.alert(
                            'Delete item',
                            `Delete "${item.name}" forever?`,
                            [
                              { text: 'Cancel', style: 'cancel' },
                              { text: 'Delete', style: 'destructive', onPress: async () => {
                                  await removeClothingItem(item.id);
                                } 
                              },
                            ]
                          );
                        }}
                        showDelete={!selectionMode}
                      />
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {shouldShowRecommendations && (
              <View style={{ marginTop: 24 }}>
                <Text style={styles.sectionTitle} testID="recs-title">10 Certified Drip additions</Text>
                <Text style={styles.recsSubtext}>
                  Quick adds that boost your wardrobe score without breaking the bank
                </Text>
                <View style={styles.recsGrid}>
                  {recommendedItems.map((rec) => (
                    <TouchableOpacity
                      key={rec.id}
                      style={styles.recCard}
                      onPress={() => {
                        try {
                          import('react-native').then(({ Linking }) => {
                            Linking.openURL(rec.linkUrl).catch(() => {
                              Alert.alert('Link error', 'Could not open link');
                            });
                          });
                        } catch (e) {
                          Alert.alert('Link error', 'Could not open link');
                        }
                      }}
                      accessibilityRole="button"
                      accessibilityLabel={`Open link for ${rec.name}`}
                      testID={`rec-item-${rec.id}`}
                    >
                      <Image source={{ uri: rec.imageUrl }} style={styles.recImage} />
                      <View style={styles.recInfoRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.recName} numberOfLines={1}>{rec.name}</Text>
                          <Text style={styles.recReason} numberOfLines={2}>{rec.reason}</Text>
                        </View>
                        <View style={styles.badge}><Text style={styles.badgeText}>Certified Drip</Text></View>
                      </View>
                      <View style={styles.recFooter}>
                        <Text style={styles.recPrice}>${rec.price}</Text>
                        <Text style={styles.recLink}>View</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}
          </View>
        </ScrollView>
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
    paddingBottom: 16,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerPill: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFD700',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  addButton: {
    borderRadius: 24,
    overflow: "hidden",
  },
  addButtonGradient: {
    width: 48,
    height: 48,
    justifyContent: "center",
    alignItems: "center",
  },
  categoriesContainer: {
    maxHeight: 60,
    marginBottom: 16,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    marginRight: 12,
  },
  categoryButtonActive: {
    backgroundColor: "#FFD700",
    borderColor: "#FFD700",
  },
  categoryIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  categoryText: {
    color: "#888",
    fontSize: 14,
    fontWeight: "600",
  },
  categoryTextActive: {
    color: "#000000",
  },
  mainContent: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 120,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 16,
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFD700",
  },
  statLabel: {
    fontSize: 12,
    color: "#888",
    marginTop: 4,
  },
  trendsSection: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  trendsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  scanSection: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  scanButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 8,
  },
  scanButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    gap: 10,
  },
  scanButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  scanDescription: {
    color: "#888",
    fontSize: 12,
    textAlign: "center",
    lineHeight: 16,
  },
  analysisSection: {
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  selectionBarWrapper: {
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  selectionBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  selectionText: {
    color: '#EEE',
    fontSize: 14,
    fontWeight: '600',
  },
  selectionActions: {
    flexDirection: 'row',
    gap: 8,
  },
  selectionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFD700',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  selectionButtonText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '700',
  },
  wardrobeSection: {
    paddingHorizontal: 20,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  gridItem: {
    width: "48%",
    marginBottom: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  gridItemSelected: {
    borderWidth: 2,
    borderColor: '#FFD700',
  },
  checkOverlay: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkOverlayActive: {
    backgroundColor: '#FFD700',
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyStateText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#FFFFFF",
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: "#666",
    marginTop: 8,
  },
  recsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  recCard: {
    width: '48%',
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    overflow: 'hidden',
    marginBottom: 12,
  },
  recImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#111',
  },
  recInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingTop: 8,
    gap: 8,
  },
  recName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 2,
  },
  recReason: {
    color: '#AAA',
    fontSize: 12,
  },
  badge: {
    backgroundColor: '#FFD700',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  badgeText: {
    color: '#000',
    fontSize: 10,
    fontWeight: '800',
  },
  recFooter: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recPrice: {
    color: '#FFD700',
    fontSize: 14,
    fontWeight: '700',
  },
  recLink: {
    color: '#FFF',
    fontSize: 12,
    textDecorationLine: 'underline',
  },
  recsSubtext: {
    color: '#AAA',
    fontSize: 12,
    marginBottom: 8,
  },
});