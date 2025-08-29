import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Sparkles, DollarSign } from "lucide-react-native";

import { ClothingItem as ClothingItemType, DripLevel } from "@/types";

interface ClothingItemProps {
  item: ClothingItemType;
}

const DRIP_COLORS: Record<DripLevel, string> = {
  'Maxx Drip': '#8A2BE2',
  'Pure Drip': '#1E90FF',
  'Certified Drip': '#32CD32',
  'Lowkey Drip': '#999999',
};

function formatPrice(price: number | null, currency?: string): string {
  if (price == null) return '';
  const sym = currency === 'USD' ? '$' : currency === 'AUD' ? 'A$' : currency === 'EUR' ? '€' : '$';
  return `${sym}${Math.round(price)}`;
}

export default function ClothingItem({ item }: ClothingItemProps) {
  const analysis = item.analysis;
  const dripColor = analysis ? DRIP_COLORS[analysis.dripLevel] : '#999999';
  
  return (
    <TouchableOpacity style={styles.container}>
      <Image source={{ uri: item.imageUrl }} style={styles.image} />
      <View style={styles.overlay}>
        <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
        {analysis && (
          <View style={[styles.dripBadge, { borderColor: dripColor }]}>
            <Sparkles color={dripColor} size={12} />
          </View>
        )}
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
        <View style={styles.details}>
          {item.brand && <Text style={styles.brand}>{item.brand}</Text>}
          {analysis && analysis.averagePrice && (
            <View style={styles.priceRow}>
              <DollarSign color="#FFD700" size={12} />
              <Text style={styles.price}>
                {formatPrice(analysis.averagePrice, analysis.currency)}
              </Text>
            </View>
          )}
        </View>
        {analysis && (
          <View style={[styles.dripLevel, { backgroundColor: `${dripColor}20` }]}>
            <Text style={[styles.dripText, { color: dripColor }]}>
              {analysis.dripLevel}
            </Text>
          </View>
        )}
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
  dripBadge: {
    position: 'absolute',
    top: -8,
    left: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
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
  details: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  brand: {
    fontSize: 12,
    color: "#888",
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  price: {
    fontSize: 12,
    color: '#FFD700',
    fontWeight: '600',
  },
  dripLevel: {
    alignSelf: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  dripText: {
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});