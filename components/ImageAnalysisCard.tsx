import React, { memo, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { ImageAnalysisResult, DripLevel, CheaperAlternative } from '@/types';
import { DollarSign, Sparkles, Shirt, ChevronDown, ChevronUp, TrendingDown, Star, Link as LinkIcon, Calendar, CheckCircle2 } from 'lucide-react-native';

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
  const [showAlternatives, setShowAlternatives] = useState<boolean>(false);
  const dripColor = useMemo(() => DRIP_COLORS[result.dripLevel], [result.dripLevel]);
  const hasAlternatives = result.cheaperAlternatives && result.cheaperAlternatives.length > 0;
  
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
      {result.bestOccasion && (
        <View style={styles.row}>
          <Calendar color="#AAA" size={16} />
          <Text style={styles.label}>Best Occasion</Text>
          <Text style={styles.value}>{result.bestOccasion}</Text>
        </View>
      )}
      {(result.verifiedStoreLink || result.storeLink) && (
        <View style={styles.row}>
          <LinkIcon color="#AAA" size={16} />
          <Text style={styles.label}>Store</Text>
          <Text style={[styles.value, styles.link]} numberOfLines={1}>{result.verifiedStoreLink || result.storeLink}</Text>
        </View>
      )}
      
      {(result.verifiedPrice != null || hasAlternatives) && (
        <>
          {!!result.verifiedPrice && (
            <View style={styles.verificationRow}>
              <CheckCircle2 color="#4CAF50" size={16} />
              <Text style={styles.verificationText}>
                Verified price: {formatPrice(result.verifiedPrice ?? null, result.verifiedCurrency || result.currency)}
              </Text>
            </View>
          )}

          {hasAlternatives && (
            <TouchableOpacity 
              style={styles.alternativesToggle}
              onPress={() => setShowAlternatives(!showAlternatives)}
              testID="alternatives-toggle"
            >
              <TrendingDown color="#4CAF50" size={16} />
              <Text style={styles.alternativesToggleText}>
                Cheaper Alternatives ({result.cheaperAlternatives!.length})
              </Text>
              {showAlternatives ? (
                <ChevronUp color="#4CAF50" size={16} />
              ) : (
                <ChevronDown color="#4CAF50" size={16} />
              )}
            </TouchableOpacity>
          )}
          
          {showAlternatives && (
            <ScrollView 
              style={styles.alternativesContainer}
              showsVerticalScrollIndicator={false}
              nestedScrollEnabled
            >
              {result.cheaperAlternatives!.map((alt: CheaperAlternative, index: number) => (
                <AlternativeCard key={index} alternative={alt} currency={result.currency || 'USD'} />
              ))}
            </ScrollView>
          )}
        </>
      )}
    </View>
  );
}

interface AlternativeCardProps {
  alternative: CheaperAlternative;
  currency: string;
}

function AlternativeCard({ alternative, currency }: AlternativeCardProps) {
  const savings = alternative.estimatedPrice > 0 
    ? Math.round(((100 - alternative.estimatedPrice) / 100) * 100)
    : 0;
    
  return (
    <View style={styles.alternativeCard} testID="alternative-card">
      <View style={styles.alternativeHeader}>
        <Text style={styles.alternativeName} numberOfLines={1}>
          {alternative.name}
        </Text>
        <View style={styles.alternativePrice}>
          <Text style={styles.alternativePriceText}>
            {formatPrice(alternative.estimatedPrice, currency)}
          </Text>
          {savings > 0 && (
            <Text style={styles.savingsText}>-{savings}%</Text>
          )}
        </View>
      </View>
      
      <View style={styles.alternativeDetails}>
        <Text style={styles.alternativeBrand}>{alternative.brand}</Text>
        <View style={styles.alternativeMetrics}>
          <View style={styles.metricItem}>
            <Star color="#FFD700" size={12} />
            <Text style={styles.metricText}>{alternative.similarity}% match</Text>
          </View>
          <Text style={styles.metricDivider}>•</Text>
          <Text style={styles.metricText}>{alternative.trendAlignment}</Text>
        </View>
        <Text style={styles.whereToFind} numberOfLines={1}>
          Available at: {alternative.whereToFind}
        </Text>
      </View>
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
    flexShrink: 1,
  },
  link: {
    color: '#4AB3FF',
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
  alternativesToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  alternativesToggleText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  verificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.3)',
  },
  verificationText: {
    color: '#A5D6A7',
    fontSize: 13,
    fontWeight: '600',
  },
  alternativesContainer: {
    maxHeight: 300,
    marginTop: 8,
  },
  alternativeCard: {
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(76, 175, 80, 0.2)',
  },
  alternativeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  alternativeName: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  alternativePrice: {
    alignItems: 'flex-end',
  },
  alternativePriceText: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '700',
  },
  savingsText: {
    color: '#4CAF50',
    fontSize: 11,
    fontWeight: '600',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
  },
  alternativeDetails: {
    gap: 4,
  },
  alternativeBrand: {
    color: '#CCC',
    fontSize: 12,
    fontWeight: '500',
  },
  alternativeMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  metricText: {
    color: '#AAA',
    fontSize: 11,
  },
  metricDivider: {
    color: '#666',
    fontSize: 11,
  },
  whereToFind: {
    color: '#999',
    fontSize: 11,
    fontStyle: 'italic',
  },
});