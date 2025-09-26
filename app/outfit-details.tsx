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
  const wardrobeOther = useMemo(() => {
    const outfitIds = new Set(resolvedItems.map(i => i.id));
    return clothes.filter(c => !outfitIds.has(c.id));
  }, [clothes, resolvedItems]);

  return (
    <LinearGradient
      colors={["#0A0A0A", "#1A1A2E", "#0A0A0A"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.title}>Outfit</Text>
          <TouchableOpacity style={styles.closeButton} onPress={() => router.back()} testID="close-outfit-details">
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
              <View key={it.id} style={styles.itemCard} testID={`outfit-item-${it.id}`}>
                <Image source={{ uri: it.imageUrl }} style={styles.itemThumb} />
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
          </View>

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
  itemMeta: {
    fontSize: 13,
    color: "#BBB",
  },
  itemMetaSub: {
    fontSize: 12,
    color: "#8AC6FF",
    marginTop: 2,
  },
  wardrobeSection: {
    paddingHorizontal: 20,
    marginBottom: 24,
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
    color: '#EEE',
    fontSize: 12,
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