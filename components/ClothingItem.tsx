import React, { useMemo } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { Sparkles, DollarSign } from "lucide-react-native";

import { ClothingItem as ClothingItemType, DripLevel, ImageAnalysisResult } from "@/types";

interface ClothingItemProps {
  item: ClothingItemType;
  onDelete?: () => void;
  showDelete?: boolean;
}

const DRIP_COLORS: Record<DripLevel, string> = {
  "Maxx Drip": "#8A2BE2",
  "Pure Drip": "#1E90FF",
  "Certified Drip": "#32CD32",
  "Lowkey Drip": "#999999",
};

function formatPrice(price: number | null, currency?: string): string {
  if (price == null) return "";
  const sym =
    currency === "USD" ? "$" : currency === "AUD" ? "A$" : currency === "EUR" ? "€" : "$";
  return `${sym}${Math.round(price)}`;
}

export default function ClothingItem({ item, onDelete, showDelete = false }: ClothingItemProps) {
  const analysis: ImageAnalysisResult | undefined = useMemo(() => {
    if (item.analysis) return item.analysis;
    const base = (name: string) => name.toLowerCase();
    const n = base(item.name);
    const sporty = /(run|soccer|athlet|gym|training|dri-fit|pegasus)/.test(n);
    const luxe = /(leather|silk|cashmere|premium|designer)/.test(n);
    const trendy = /(oversized|cropped|vintage|wide|cargo|chunky|platform|ribbed)/.test(n);

    const versatility = Math.min(100, 50 + (trendy ? 15 : 0) + (sporty ? 10 : 0));
    const score = (sporty ? 70 : 50) + (trendy ? 10 : 0) + (luxe ? 10 : 0);

    const dripLevel: DripLevel = score >= 85 ? 'Maxx Drip' : score >= 75 ? 'Pure Drip' : score >= 65 ? 'Certified Drip' : 'Lowkey Drip';

    const derived: ImageAnalysisResult = {
      itemName: item.name,
      officialProductName: item.name,
      brand: item.brand,
      type: item.type,
      style: sporty ? 'athleisure' : trendy ? 'streetwear' : 'casual',
      averagePrice: null,
      currency: 'USD',
      versatilityScore: versatility,
      dripLevel,
      reasoning: 'Auto-estimated from item name and attributes.',
      sources: [],
    };
    return derived;
  }, [item]);
  const dripColor = analysis ? DRIP_COLORS[analysis.dripLevel] : "#999999";

  return (
    <View style={styles.container} testID={`clothing-card-${item.id}`}>
      <Image source={{ uri: item.imageUrl }} style={styles.image} />


      <View style={styles.overlay}>
        <View style={[styles.colorIndicator, { backgroundColor: item.color }]} />
        <View style={[styles.dripBadge, { borderColor: dripColor }]}>
          <Sparkles color={dripColor} size={12} />
        </View>
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {item.name}
        </Text>
        <View style={styles.details}>
          {item.brand ? <Text style={styles.brand}>{item.brand}</Text> : <View />}
          {analysis && analysis.averagePrice ? (
            <View style={styles.priceRow}>
              <DollarSign color="#FF5C00" size={12} />
              <Text style={styles.price}>{formatPrice(analysis.averagePrice, analysis.currency)}</Text>
            </View>
          ) : null}
        </View>
        <View style={[styles.dripLevel, { backgroundColor: `${dripColor}20` }]}>
          <Text style={[styles.dripText, { color: dripColor }]}>{analysis?.dripLevel ?? 'Lowkey Drip'}</Text>
        </View>
      </View>
    </View>
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
    borderColor: "#E0E0E0",
  },
  dripBadge: {
    position: "absolute",
    top: -8,
    left: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  info: {
    padding: 12,
  },
  name: {
    fontSize: 14,
    fontWeight: "600",
    color: "#E0E0E0",
    marginBottom: 4,
  },
  details: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  brand: {
    fontSize: 12,
    color: "#888",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  price: {
    fontSize: 12,
    color: "#FF5C00",
    fontWeight: "600",
  },
  dripLevel: {
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 4,
  },
  dripText: {
    fontSize: 10,
    fontWeight: "700",
    textTransform: "uppercase",
  },
});