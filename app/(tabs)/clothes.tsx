import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Plus, Shirt, Filter, TrendingUp, Camera, Sparkles } from "lucide-react-native";
import { router } from "expo-router";
import { useClothes } from "@/providers/ClothesProvider";
import { useWeather } from "@/providers/WeatherProvider";
import ClothingItem from "@/components/ClothingItem";
import WardrobeUpliftCard from "@/components/WardrobeUpliftCard";
import TrendCard from "@/components/TrendCard";
import ImageAnalysisCard from "@/components/ImageAnalysisCard";
import { ImageAnalysisResult } from "@/types";

export default function ClothesScreen() {
  const { clothes } = useClothes();
  const { weather } = useWeather();
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [analysisResults, setAnalysisResults] = useState<ImageAnalysisResult[]>([]);
  const [trends, setTrends] = useState<string[]>(["Modern casual", "Streetwear", "Minimalist", "Y2K Revival"]);

  const categories = [
    { id: "all", name: "All", icon: "👔" },
    { id: "tops", name: "Tops", icon: "👕" },
    { id: "bottoms", name: "Bottoms", icon: "👖" },
    { id: "shoes", name: "Shoes", icon: "👟" },
    { id: "accessories", name: "Accessories", icon: "👜" },
  ];

  const filteredClothes = selectedCategory === "all" 
    ? clothes 
    : clothes.filter(item => item.type === selectedCategory);

  return (
    <LinearGradient
      colors={["#0A0A0A", "#1A1A2E", "#0A0A0A"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>My Wardrobe</Text>
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
              console.log('Suggested item pressed:', item.name);
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
                {filteredClothes.map((item, index) => (
                  <View key={item.id} style={styles.gridItem}>
                    <ClothingItem item={item} />
                  </View>
                ))}
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
    paddingBottom: 100,
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

});