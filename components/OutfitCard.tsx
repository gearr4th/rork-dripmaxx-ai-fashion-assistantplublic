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
        } catch (e) {
          // no-op
        }
        router.push({ pathname: "/outfit-details", params: { id: outfit.id } } as any);
      }}
      testID={`outfit-card-${outfit.id}`}
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
      <ChevronRight color="#666" size={20} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  imagesContainer: {
    flexDirection: "row",
    marginRight: 16,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#000000",
    marginRight: -15,
  },
  details: {
    flex: 1,
    marginLeft: 20,
  },
  occasion: {
    fontSize: 16,
    fontWeight: "600",
    color: "#F2F2F2",
    marginBottom: 4,
  },
  itemCount: {
    fontSize: 12,
    color: "#888",
  },
});