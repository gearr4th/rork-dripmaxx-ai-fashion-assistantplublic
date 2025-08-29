import React, { memo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { BudgetRecommendation, CheaperAlternative } from '@/types';
import { DollarSign, AlertTriangle, CheckCircle, TrendingDown, Star } from 'lucide-react-native';

interface Props {
  recommendation: BudgetRecommendation;
  currency?: string;
}

function formatPrice(price: number, currency?: string): string {
  const sym = currency === 'USD' ? '$' : currency === 'AUD' ? 'A$' : currency === 'EUR' ? '€' : '$';
  return `${sym}${Math.round(price)}`;
}

function BudgetRecommendationCard({ recommendation, currency = 'USD' }: Props) {
  const { fits, message, alternatives, occasionMatch, occasionMessage } = recommendation;
  
  return (
    <View style={styles.card} testID="budget-recommendation-card">
      <View style={styles.header}>
        <View style={[styles.statusIcon, fits ? styles.successIcon : styles.warningIcon]}>
          {fits ? (
            <CheckCircle color={fits ? '#4CAF50' : '#FF9800'} size={20} />
          ) : (
            <AlertTriangle color="#FF9800" size={20} />
          )}
        </View>
        <Text style={styles.title}>Budget & Occasion Analysis</Text>
      </View>
      
      <View style={styles.section}>
        <View style={styles.row}>
          <DollarSign color="#FFD700" size={16} />
          <Text style={styles.label}>Budget Fit</Text>
        </View>
        <Text style={[styles.message, fits ? styles.successText : styles.warningText]}>
          {message}
        </Text>
      </View>
      
      <View style={styles.section}>
        <Text style={[styles.message, occasionMatch ? styles.successText : styles.warningText]}>
          {occasionMessage}
        </Text>
      </View>
      
      {alternatives && alternatives.length > 0 && (
        <View style={styles.alternativesSection}>
          <View style={styles.alternativesHeader}>
            <TrendingDown color="#4CAF50" size={16} />
            <Text style={styles.alternativesTitle}>Budget-Friendly Alternatives</Text>
          </View>
          <ScrollView 
            style={styles.alternativesContainer}
            showsVerticalScrollIndicator={false}
            nestedScrollEnabled
          >
            {alternatives.slice(0, 3).map((alt: CheaperAlternative, index: number) => (
              <AlternativeCard key={index} alternative={alt} currency={currency} />
            ))}
          </ScrollView>
        </View>
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

export default memo(BudgetRecommendationCard);

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  successIcon: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  warningIcon: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
  },
  title: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  section: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  label: {
    color: '#AAA',
    fontSize: 14,
    fontWeight: '600',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
  },
  successText: {
    color: '#4CAF50',
  },
  warningText: {
    color: '#FF9800',
  },
  alternativesSection: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
  alternativesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  alternativesTitle: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: '600',
  },
  alternativesContainer: {
    maxHeight: 200,
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