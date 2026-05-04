import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { ChevronRight } from "lucide-react-native";
import { router } from "expo-router";
import { Outfit } from "@/types";
import { useSavedOutfits } from "@/providers/SavedOutfitsProvider";

interface OutfitCardProps {
  outfit: Outfit;
}

export default function OutfitCard({ outfit }: OutfitCardProps) {
  const { saveOutfit } = useSavedOutfits();
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={async () => {
        try {
          await saveOutfit(outfit);
        } catch {
          // no-op
        }
        router.push({ pathname: "/outfit-details", params: { id: outfit.id } } as any);
      }}
      testID={`outfit-card-${outfit.id}`}
      activeOpacity={0.8}
    >
      <View style={styles.imagesContainer}>
        {outfit.items.slice(0, 3).map((item, index) => (
          <Image
            key={item.id}
            source={{ uri: item.imageUrl }}
            style={[styles.itemImage, { zIndex: 3 - index }]}
          />
        ))}
      </View>
      <View style={styles.details}>
        <Text style={styles.occasion} numberOfLines={1}>{outfit.style}</Text>
        <Text style={styles.itemCount}>{outfit.items.length} items</Text>
      </View>
      <ChevronRight color="#334155" size={18} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(30, 58, 95, 0.35)",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.12)",
  },
  imagesContainer: {
    flexDirection: "row",
    marginRight: 14,
  },
  itemImage: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: "#0F1729",
    marginRight: -14,
  },
  details: {
    flex: 1,
    marginLeft: 18,
  },
  occasion: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#E2E8F0",
    marginBottom: 3,
  },
  itemCount: {
    fontSize: 12,
    color: "#64748B",
  },
});
