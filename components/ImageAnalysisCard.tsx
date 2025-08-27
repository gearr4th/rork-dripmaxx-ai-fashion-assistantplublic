import React, { memo, useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ImageAnalysisResult, DripLevel } from '@/types';
import { DollarSign, Sparkles, Shirt } from 'lucide-react-native';

interface Props {
  result: ImageAnalysisResult;
}

const DRIP_COLORS: Record<DripLevel, string> = {
  'Maxx Drip': '#8A2BE2',
  'Pure Drip': '#1E90FF',
  'Certified Drip': '#32CD32',
  'Lowkey Drip': '#999999',
};

function formatPrice(price: number | null, currency?: string): string {
  if (price == null) return '—';
  const sym = currency === 'USD' ? '$' : currency === 'AUD' ? 'A$' : currency === 'EUR' ? '€' : '';
  return `${sym}${Math.round(price)}`;
}

function clampScore(score: number): number { return Math.max(0, Math.min(100, score)); }

function ImageAnalysisCard({ result }: Props) {
  const dripColor = useMemo(() => DRIP_COLORS[result.dripLevel], [result.dripLevel]);
  return (
    <View style={styles.card} testID="analysis-card">
      <View style={styles.rowHeader}>
        <Shirt color="#FFD700" size={18} />
        <Text style={styles.title} numberOfLines={2}>{result.officialProductName || result.itemName}</Text>
      </View>
      <View style={styles.row}>
        <DollarSign color="#AAA" size={16} />
        <Text style={styles.label}>Avg Price</Text>
        <Text style={styles.value}>{formatPrice(result.averagePrice, result.currency)}</Text>
      </View>
      <View style={styles.row}>
        <Sparkles color="#AAA" size={16} />
        <Text style={styles.label}>Versatility</Text>
        <Text style={styles.value}>{clampScore(result.versatilityScore)} / 100</Text>
      </View>
      <View style={[styles.dripPill, { borderColor: dripColor }]}>
        <Text style={[styles.dripText, { color: dripColor }]}>{result.dripLevel}</Text>
      </View>
      {result.brand && (
        <Text style={styles.subtle}>Brand: {result.brand}</Text>
      )}
      {result.style && (
        <Text style={styles.subtle}>Style: {result.style}</Text>
      )}
    </View>
  );
}

export default memo(ImageAnalysisCard);

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 14,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  title: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
    marginLeft: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  label: {
    color: '#AAA',
    fontSize: 13,
  },
  value: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 6,
  },
  dripPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8,
    marginBottom: 6,
  },
  dripText: {
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  subtle: {
    color: '#BBB',
    fontSize: 12,
    marginTop: 2,
  },
});