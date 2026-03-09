import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { useClothes } from '@/providers/ClothesProvider';
import { ClothingItem as ClothingItemType, DripLevel, ImageAnalysisResult } from '@/types';
import { Sparkles, DollarSign, TrendingUp, Star } from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';

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
  'Maxx Drip': '#F97316',
  'Pure Drip': '#3B82F6',
  'Certified Drip': '#34D399',
  'Lowkey Drip': '#64748B',
};

export default function ItemDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { clothes } = useClothes();
  const item = useMemo(() => clothes.find(c => c.id === String(id)), [clothes, id]);

  if (!item) {
    return (
      <LinearGradient colors={['#020B1C', '#0A1A2F', '#071E2B', '#0C1425']} style={styles.center}>
        <Text style={styles.error}>Item not found</Text>
        <TouchableOpacity onPress={() => router.back()} accessibilityRole="button" testID="go-back">
          <Text style={styles.link}>Go back</Text>
        </TouchableOpacity>
      </LinearGradient>
    );
  }

  const analysis = deriveAnalysis(item);
  const dripColor = DRIP_COLORS[analysis.dripLevel];

  return (
    <LinearGradient colors={['#020B1C', '#0A1A2F', '#071E2B', '#0C1425']} style={styles.container}>
      <Stack.Screen options={{ title: item.name, headerStyle: { backgroundColor: '#020B1C' }, headerTintColor: '#E2E8F0' }} />
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
            <TrendingUp color="#FB923C" size={18} />
            <Text style={styles.rowText}>Versatility score: {analysis.versatilityScore}/100</Text>
          </View>
          <View style={styles.row}> 
            <Star color="#FB923C" size={18} />
            <Text style={styles.rowText}>Style: {analysis.style}</Text>
          </View>
          {analysis.averagePrice != null ? (
            <View style={styles.row}>
              <DollarSign color="#FB923C" size={18} />
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center' as const, justifyContent: 'center' as const },
  error: { color: '#E2E8F0', fontSize: 16, marginBottom: 8 },
  link: { color: '#FB923C', fontSize: 14, fontWeight: '600' as const },
  image: { width: '100%', height: 320, borderRadius: 14, backgroundColor: 'rgba(8, 30, 50, 0.5)' },
  headerRow: { flexDirection: 'row' as const, alignItems: 'center' as const, justifyContent: 'space-between' as const, marginTop: 12 },
  brand: { color: '#94A3B8', fontSize: 14 },
  dripPill: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 6, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999, borderWidth: 2, backgroundColor: 'rgba(8, 30, 50, 0.6)' },
  dripText: { fontSize: 12, fontWeight: '800' as const, textTransform: 'uppercase' as const },
  card: { backgroundColor: 'rgba(8, 30, 50, 0.5)', borderColor: 'rgba(249, 115, 22, 0.12)', borderWidth: 1, borderRadius: 14, padding: 14, marginTop: 16 },
  cardTitle: { color: '#E2E8F0', fontSize: 16, fontWeight: '700' as const, marginBottom: 8 },
  row: { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 8, marginVertical: 4 },
  rowText: { color: '#CBD5E1', fontSize: 14 },
  reason: { color: '#94A3B8', fontSize: 12, marginTop: 8, lineHeight: 18 },
  tip: { color: '#CBD5E1', fontSize: 13, marginBottom: 8 },
  bullets: { gap: 6 },
  bullet: { color: '#94A3B8', fontSize: 13, lineHeight: 18 },
});