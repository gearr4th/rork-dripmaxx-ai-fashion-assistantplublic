import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, Save } from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSavedOutfits } from "@/providers/SavedOutfitsProvider";
import { useClothes } from "@/providers/ClothesProvider";
import { Outfit } from "@/types";

export default function OutfitDetailsScreen() {
  const params = useLocalSearchParams<{ id?: string }>();
  const { savedOutfits, saveOutfit } = useSavedOutfits();
  const { clothes } = useClothes();

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
    } catch (e) {
      Alert.alert("Error", "Could not save outfit");
    }
  };

  const resolvedItems = outfit?.items ?? [];

  return (
    <LinearGradient
      colors={["#0A0A0A", "#1A1A2E", "#0A0A0A"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Outfit</Text>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()}>
            <X color="#FFFFFF" size={24} />
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.items}>
            <Text style={styles.sectionTitle}>Items</Text>
            {resolvedItems.map((it) => (
              <View key={it.id} style={styles.itemCard}>
                <Image source={{ uri: it.imageUrl }} style={styles.itemThumb} />
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{it.name}</Text>
                  <Text style={styles.itemBrand}>{it.brand ?? 'Unknown brand'}</Text>
                </View>
              </View>
            ))}
          </View>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  items: {
    marginBottom: 24,
    paddingHorizontal: 20,
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