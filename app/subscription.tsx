import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Check, Crown, X, Zap } from 'lucide-react-native';
import { router } from 'expo-router';
import { useSubscription } from '@/providers/SubscriptionProvider';
import { SUBSCRIPTION_PLANS, SubscriptionTier } from '@/types/subscription';

export default function SubscriptionScreen() {
  const { tier, upgradeToPremium, upgradeToPro, subscription } = useSubscription();
  const [loading, setLoading] = useState<string | null>(null);

  const handleUpgrade = async (targetTier: SubscriptionTier) => {
    if (targetTier === 'free') return;
    
    setLoading(targetTier);
    
    try {
      if (Platform.OS === 'web') {
        Alert.alert(
          'Stripe Integration',
          'In production, this will redirect to Stripe Checkout. For now, upgrading locally for demo purposes.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Continue',
              onPress: async () => {
                if (targetTier === 'premium') {
                  await upgradeToPremium();
                } else if (targetTier === 'pro') {
                  await upgradeToPro();
                }
                Alert.alert('Success!', `You've been upgraded to ${targetTier}!`, [
                  { text: 'OK', onPress: () => router.back() }
                ]);
              }
            }
          ]
        );
      } else {
        Alert.alert(
          'Coming Soon',
          'Stripe integration for mobile is being finalized. Use the web version or upgrade locally for testing.',
          [
            {
              text: 'Cancel',
              style: 'cancel',
            },
            {
              text: 'Test Upgrade',
              onPress: async () => {
                if (targetTier === 'premium') {
                  await upgradeToPremium();
                } else if (targetTier === 'pro') {
                  await upgradeToPro();
                }
                Alert.alert('Success!', `You've been upgraded to ${targetTier}!`, [
                  { text: 'OK', onPress: () => router.back() }
                ]);
              }
            }
          ]
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to process upgrade';
      Alert.alert('Error', message);
    } finally {
      setLoading(null);
    }
  };

  return (
    <LinearGradient colors={['#0B1120', '#111B2E', '#0A1628']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X color="#CBD5E1" size={24} />
          </TouchableOpacity>
          <Text style={styles.title}>Choose Your Plan</Text>
          <Text style={styles.subtitle}>Unlock premium features and elevate your style</Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {(['free', 'premium', 'pro'] as SubscriptionTier[]).map((planTier) => {
            const plan = SUBSCRIPTION_PLANS[planTier];
            const isCurrentPlan = tier === planTier;
            const isHighlighted = plan.highlighted;

            return (
              <TouchableOpacity
                key={plan.id}
                style={[
                  styles.planCard,
                  isHighlighted && styles.highlightedCard,
                  isCurrentPlan && styles.currentPlanCard
                ]}
                onPress={() => handleUpgrade(planTier)}
                disabled={isCurrentPlan || loading !== null}
              >
                {isHighlighted && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>MOST POPULAR</Text>
                  </View>
                )}

                <View style={styles.planHeader}>
                  <View style={styles.planIcon}>
                    {planTier === 'free' && <Zap color="#64748B" size={28} />}
                    {planTier === 'premium' && <Crown color="#FBBF24" size={28} />}
                    {planTier === 'pro' && <Crown color="#3B82F6" size={28} />}
                  </View>
                  <Text style={styles.planName}>{plan.name}</Text>
                  <View style={styles.priceContainer}>
                    <Text style={styles.currency}>$</Text>
                    <Text style={styles.price}>{plan.price}</Text>
                    <Text style={styles.interval}>/{plan.interval}</Text>
                  </View>
                </View>

                <View style={styles.featuresContainer}>
                  {plan.features.map((feature, index) => (
                    <View key={index} style={styles.featureRow}>
                      <Check color="#34D399" size={20} />
                      <Text style={styles.featureText}>{feature}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity
                  style={[
                    styles.upgradeButton,
                    isCurrentPlan && styles.currentButton,
                    isHighlighted && !isCurrentPlan && styles.highlightedButton
                  ]}
                  onPress={() => handleUpgrade(planTier)}
                  disabled={isCurrentPlan || loading !== null}
                >
                  {loading === planTier ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text
                      style={[
                        styles.upgradeButtonText,
                        isCurrentPlan && styles.currentButtonText
                      ]}
                    >
                      {isCurrentPlan ? 'Current Plan' : `Upgrade to ${plan.name}`}
                    </Text>
                  )}
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })}

          {subscription?.cancelAtPeriodEnd && (
            <View style={styles.warningCard}>
              <Text style={styles.warningText}>
                Your subscription will be canceled at the end of the current billing period on{' '}
                {subscription.currentPeriodEnd?.toLocaleDateString()}
              </Text>
            </View>
          )}

          <Text style={styles.disclaimer}>
            • Subscriptions auto-renew unless canceled{'\n'}
            • Cancel anytime from your account settings{'\n'}
            • Prices in USD, may vary by region
          </Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    right: 20,
    top: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(30, 58, 95, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '800' as const,
    color: '#E2E8F0',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  planCard: {
    backgroundColor: 'rgba(30, 58, 95, 0.35)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(59, 130, 246, 0.12)',
  },
  highlightedCard: {
    borderColor: '#3B82F6',
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
  },
  currentPlanCard: {
    borderColor: '#059669',
    backgroundColor: 'rgba(5, 150, 105, 0.08)',
  },
  badge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#3B82F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  planHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  planIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E2E8F0',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currency: {
    fontSize: 20,
    color: '#E2E8F0',
    fontWeight: '600',
  },
  price: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#E2E8F0',
  },
  interval: {
    fontSize: 16,
    color: '#64748B',
  },
  featuresContainer: {
    marginBottom: 24,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 14,
    color: '#94A3B8',
  },
  upgradeButton: {
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  highlightedButton: {
    backgroundColor: '#2563EB',
  },
  currentButton: {
    backgroundColor: 'rgba(5, 150, 105, 0.15)',
    borderWidth: 1,
    borderColor: '#059669',
  },
  upgradeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  currentButtonText: {
    color: '#34D399',
  },
  warningCard: {
    backgroundColor: 'rgba(251, 191, 36, 0.08)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(251, 191, 36, 0.2)',
  },
  warningText: {
    color: '#FBBF24',
    fontSize: 14,
    textAlign: 'center',
  },
  disclaimer: {
    fontSize: 12,
    color: '#475569',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
  },
});
