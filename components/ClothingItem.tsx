import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";

import { ClothingItem as ClothingItemType } from "@/types";

interface ClothingItemProps {
  item: ClothingItemType;
}

export default function ClothingItem({ item }: ClothingItemProps) {
  return (
    <TouchableOpacity style={styles.container}>
      <Image source={{ uri: item.imageUrl }} style={styles.image} />
      <View style={styles.overlay}>
        <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        {item.brand && <Text style={styles.brand}>{item.brand}</Text>}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 4,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
  },
  image: {
    width: "100%",
    height: 180,
    resizeMode: "cover",
  },
  overlay: {
    position: "absolute",
    top: 8,
    right: 8,
  },
  colorIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  info: {
    padding: 12,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  brand: {
    fontSize: 12,
    color: "#888",
  },
});