import React, { useMemo } from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { Sparkles, DollarSign, Repeat } from "lucide-react-native";

import { ClothingItem as ClothingItemType, DripLevel, ImageAnalysisResult } from "@/types";

interface ClothingItemProps {
  item: ClothingItemType;
  onDelete?: () => void;
  showDelete?: boolean;
}

const DRIP_COLORS: Record<DripLevel, string> = {
  "Maxx Drip": "#A78BFA",
  "Pure Drip": "#60A5FA",
  "Certified Drip": "#34D399",
  "Lowkey Drip": "#64748B",
};

function formatPrice(price: number | null, currency?: string): string {
  if (price == null) return "";
  const sym =
    currency === "USD" ? "$" : currency === "AUD" ? "A$" : currency === "EUR" ? "€" : "$";
  return `${sym}${Math.round(price)}`;
}

export default function ClothingItem({ item }: ClothingItemProps) {
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
  const dripColor = analysis ? DRIP_COLORS[analysis.dripLevel] : "#64748B";

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
              <DollarSign color="#F97316" size={12} />
              <Text style={styles.price}>{formatPrice(analysis.averagePrice, analysis.currency)}</Text>
            </View>
          ) : null}
        </View>
        <View style={[styles.dripLevel, { backgroundColor: `${dripColor}15` }]}>
          <Text style={[styles.dripText, { color: dripColor }]}>{analysis?.dripLevel ?? 'Lowkey Drip'}</Text>
        </View>
        {item.purchasePrice != null && item.purchasePrice > 0 ? (
          <View style={styles.cpwRow}>
            <Repeat color="#22D3EE" size={11} />
            <Text style={styles.cpwText}>
              {(item.wearCount ?? 0) > 0
                ? `${(item.purchasePrice / (item.wearCount ?? 1)).toFixed(2)}/wear`
                : `${Math.round(item.purchasePrice)} • 0 wears`}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    margin: 4,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "rgba(30, 58, 95, 0.35)",
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
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: "rgba(226, 232, 240, 0.6)",
  },
  dripBadge: {
    position: "absolute",
    top: -8,
    left: -8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    borderWidth: 2,
    justifyContent: "center",
    alignItems: "center",
  },
  info: {
    padding: 10,
  },
  name: {
    fontSize: 13,
    fontWeight: "600" as const,
    color: "#E2E8F0",
    marginBottom: 4,
  },
  details: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  brand: {
    fontSize: 11,
    color: "#64748B",
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  price: {
    fontSize: 12,
    color: "#FB923C",
    fontWeight: "600" as const,
  },
  dripLevel: {
    alignSelf: "flex-start",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginTop: 2,
  },
  dripText: {
    fontSize: 10,
    fontWeight: "700" as const,
    textTransform: "uppercase" as const,
  },
  cpwRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
  },
  cpwText: {
    fontSize: 11,
    color: "#22D3EE",
    fontWeight: "600" as const,
  },
});
