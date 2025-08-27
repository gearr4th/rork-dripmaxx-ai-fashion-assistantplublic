import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, Heart, Share2, Save } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";

export default function OutfitDetailsScreen() {
  const params = useLocalSearchParams();

  return (
    <LinearGradient
      colors={["#0A0A0A", "#1A1A2E", "#0A0A0A"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Outfit Details</Text>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <X color="#FFFFFF" size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.outfitImages}>
            <ScrollView
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
            >
              <Image
                source={{ uri: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400" }}
                style={styles.itemImage}
              />
              <Image
                source={{ uri: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400" }}
                style={styles.itemImage}
              />
              <Image
                source={{ uri: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400" }}
                style={styles.itemImage}
              />
            </ScrollView>
          </View>

          <View style={styles.details}>
            <Text style={styles.occasion}>Office Meeting</Text>
            <Text style={styles.style}>Business Casual</Text>

            <View style={styles.weatherInfo}>
              <Text style={styles.weatherText}>Perfect for: Partly Cloudy, 18°C</Text>
            </View>

            <View style={styles.items}>
              <Text style={styles.sectionTitle}>Items in this outfit</Text>
              <View style={styles.itemCard}>
                <Image
                  source={{ uri: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=100" }}
                  style={styles.itemThumb}
                />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>Black Blazer</Text>
                  <Text style={styles.itemBrand}>Zara</Text>
                </View>
              </View>
              <View style={styles.itemCard}>
                <Image
                  source={{ uri: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=100" }}
                  style={styles.itemThumb}
                />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>White Shirt</Text>
                  <Text style={styles.itemBrand}>H&M</Text>
                </View>
              </View>
              <View style={styles.itemCard}>
                <Image
                  source={{ uri: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=100" }}
                  style={styles.itemThumb}
                />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>Dark Jeans</Text>
                  <Text style={styles.itemBrand}>Levi's</Text>
                </View>
              </View>
            </View>

            <View style={styles.aiNotes}>
              <Text style={styles.sectionTitle}>AI Style Notes</Text>
              <Text style={styles.notesText}>
                This outfit combines professional elegance with modern comfort. The black blazer adds authority while the white shirt keeps it fresh. Dark jeans provide a contemporary twist on business casual, perfect for creative offices or client meetings.
              </Text>
            </View>
          </View>

          <View style={styles.actions}>
            <TouchableOpacity style={styles.actionButton}>
              <Heart color="#FF4444" size={24} />
              <Text style={styles.actionText}>Favorite</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Share2 color="#FFD700" size={24} />
              <Text style={styles.actionText}>Share</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton}>
              <Save color="#4CAF50" size={24} />
              <Text style={styles.actionText}>Save</Text>
            </TouchableOpacity>
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
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingBottom: 40,
  },
  outfitImages: {
    height: 400,
    marginBottom: 24,
  },
  itemImage: {
    width: 375,
    height: 400,
    resizeMode: "cover",
  },
  details: {
    padding: 20,
  },
  occasion: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  style: {
    fontSize: 18,
    color: "#FFD700",
    marginBottom: 16,
  },
  weatherInfo: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 12,
    marginBottom: 24,
  },
  weatherText: {
    color: "#FFFFFF",
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  items: {
    marginBottom: 24,
  },
  itemCard: {
    flexDirection: "row",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
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
    color: "#FFFFFF",
    marginBottom: 4,
  },
  itemBrand: {
    fontSize: 14,
    color: "#888",
  },
  aiNotes: {
    marginBottom: 24,
  },
  notesText: {
    fontSize: 14,
    color: "#AAA",
    lineHeight: 22,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  actionButton: {
    alignItems: "center",
    gap: 8,
  },
  actionText: {
    color: "#FFFFFF",
    fontSize: 12,
  },
});