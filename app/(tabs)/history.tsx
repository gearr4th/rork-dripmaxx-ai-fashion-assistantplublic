import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Calendar, Filter } from "lucide-react-native";
import OutfitHistoryCard from "@/components/OutfitHistoryCard";
import { OutfitHistory } from "@/types";

export default function HistoryScreen() {
  const [filter, setFilter] = useState<"all" | "favorites">("all");
  const [history] = useState<OutfitHistory[]>([
    {
      id: "1",
      date: new Date("2024-01-15"),
      outfit: {
        id: "1",
        items: [
          { id: "1", name: "Black Blazer", type: "top", color: "#000000", imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400" },
          { id: "2", name: "White Shirt", type: "top", color: "#FFFFFF", imageUrl: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400" },
          { id: "3", name: "Dark Jeans", type: "bottom", color: "#1A1A2E", imageUrl: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400" },
        ],
        occasion: "Office Meeting",
        weather: "Partly Cloudy, 18°C",
        style: "Business Casual",
      },
      rating: 5,
      favorite: true,
    },
    {
      id: "2",
      date: new Date("2024-01-14"),
      outfit: {
        id: "2",
        items: [
          { id: "4", name: "Hoodie", type: "top", color: "#808080", imageUrl: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400" },
          { id: "5", name: "Joggers", type: "bottom", color: "#404040", imageUrl: "https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400" },
        ],
        occasion: "Weekend Chill",
        weather: "Sunny, 22°C",
        style: "Casual",
      },
      rating: 4,
      favorite: false,
    },
  ]);

  const filteredHistory = filter === "favorites" 
    ? history.filter(h => h.favorite)
    : history;

  return (
    <LinearGradient
      colors={["#0A0A0A", "#1A1A2E", "#0A0A0A"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Outfit History</Text>
          <View style={styles.filterContainer}>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filter === "all" && styles.filterButtonActive,
              ]}
              onPress={() => setFilter("all")}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filter === "all" && styles.filterButtonTextActive,
                ]}
              >
                All
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.filterButton,
                filter === "favorites" && styles.filterButtonActive,
              ]}
              onPress={() => setFilter("favorites")}
            >
              <Text
                style={[
                  styles.filterButtonText,
                  filter === "favorites" && styles.filterButtonTextActive,
                ]}
              >
                Favorites
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredHistory.length === 0 ? (
            <View style={styles.emptyState}>
              <Calendar color="#666" size={48} />
              <Text style={styles.emptyStateText}>No outfits yet</Text>
              <Text style={styles.emptyStateSubtext}>
                Your outfit history will appear here
              </Text>
            </View>
          ) : (
            filteredHistory.map((item) => (
              <OutfitHistoryCard key={item.id} history={item} />
            ))
          )}
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
    padding: 20,
    paddingBottom: 0,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  filterContainer: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  filterButtonActive: {
    backgroundColor: "#FFD700",
    borderColor: "#FFD700",
  },
  filterButtonText: {
    color: "#888",
    fontSize: 14,
    fontWeight: "600",
  },
  filterButtonTextActive: {
    color: "#000000",
  },
  scrollContent: {
    padding: 20,
    paddingTop: 0,
    paddingBottom: 100,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 80,
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