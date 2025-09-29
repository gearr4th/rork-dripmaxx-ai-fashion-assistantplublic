import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { useClothes } from '@/providers/ClothesProvider';
import { ClothingItem as ClothingItemType, DripLevel, ImageAnalysisResult } from '@/types';
import { ArrowLeft, Sparkles, DollarSign, TrendingUp, Star } from 'lucide-react-native';

function deriveAnalysis(item: ClothingItemType): ImageAnalysisResult {
  if (item.analysis) return item.analysis;
  const name = item.name.toLowerCase();
  const sporty = /(run|soccer|athlet|gym|training|dri-fit|pegasus)/.test(name);
  const luxe = /(leather|silk|cashmere|premium|designer)/.test(name);
  const trendy = /(oversized|cropped|vintage|wide|cargo|chunky|platform|ribbed)/.test(name);

  const versatility = Math.min(100, 50 + (trendy ? 15 : 0) + (sporty ? 10 : 0));
  const score = (sporty ? 70 : 50) + (trendy ? 10 : 0) + (luxe ? 10 : 0);
  const dripLevel: DripLevel = score >= 85 ? 'Maxx Drip' : score >= 75 ? 'Pure Drip' : score >= 65 ? 'Certified Drip' : 'Lowkey Drip';
  return {
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
}

const DRIP_COLORS: Record<DripLevel, string> = {
  'Maxx Drip': '#8A2BE2',
  'Pure Drip': '#1E90FF',
  'Certified Drip': '#32CD32',
  'Lowkey Drip': '#999999',
};

export default function ItemDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { clothes } = useClothes();
  const item = useMemo(() => clothes.find(c => c.id === String(id)), [clothes, id]);

  if (!item) {
    return (
      <View style={styles.center}>
        <Text style={styles.error}>Item not found</Text>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" testID="go-back">
          <Text style={styles.link}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const analysis = deriveAnalysis(item);
  const dripColor = DRIP_COLORS[analysis.dripLevel];

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ title: item.name }} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Image source={{ uri: item.imageUrl }} style={styles.image} />

        <View style={styles.headerRow}>
          <View style={[styles.dripPill, { borderColor: dripColor }]}> 
            <Sparkles color={dripColor} size={14} />
            <Text style={[styles.dripText, { color: dripColor }]}>{analysis.dripLevel}</Text>
          </View>
          {item.brand ? <Text style={styles.brand}>{item.brand}</Text> : null}
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Analytics</Text>
          <View style={styles.row}> 
            <TrendingUp color="#FFD700" size={18} />
            <Text style={styles.rowText}>Versatility score: {analysis.versatilityScore}/100</Text>
          </View>
          <View style={styles.row}> 
            <Star color="#FFD700" size={18} />
            <Text style={styles.rowText}>Style: {analysis.style}</Text>
          </View>
          {analysis.averagePrice != null ? (
            <View style={styles.row}>
              <DollarSign color="#FFD700" size={18} />
              <Text style={styles.rowText}>Avg price: {analysis.currency}{Math.round(analysis.averagePrice)}</Text>
            </View>
          ) : null}
          <Text style={styles.reason}>{analysis.reasoning}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>How to level this up</Text>
          <Text style={styles.tip}>Pair with complimentary pieces for a higher fit score:</Text>
          <View style={styles.bullets}>
            <Text style={styles.bullet}>• Add a matching {item.type === 'tops' ? 'bottom' : item.type === 'bottoms' ? 'top' : 'accessory'} to complete the look</Text>
            <Text style={styles.bullet}>• Choose colors that contrast with {item.color}</Text>
            <Text style={styles.bullet}>• Mix a trendy piece with this for balance</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0A0A0A' },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  error: { color: '#fff', fontSize: 16, marginBottom: 8 },
  link: { color: '#FFD700', fontSize: 14, fontWeight: '600' },
  image: { width: '100%', height: 320, borderRadius: 12, backgroundColor: '#111' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  brand: { color: '#AAA', fontSize: 14 },
  dripPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 2, backgroundColor: 'rgba(255,255,255,0.06)' },
  dripText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  card: { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.12)', borderWidth: 1, borderRadius: 12, padding: 14, marginTop: 16 },
  cardTitle: { color: '#FFF', fontSize: 16, fontWeight: '700', marginBottom: 8 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginVertical: 4 },
  rowText: { color: '#EEE', fontSize: 14 },
  reason: { color: '#BBB', fontSize: 12, marginTop: 8, lineHeight: 18 },
  tip: { color: '#EEE', fontSize: 13, marginBottom: 8 },
  bullets: { gap: 6 },
  bullet: { color: '#DDD', fontSize: 13, lineHeight: 18 },
});