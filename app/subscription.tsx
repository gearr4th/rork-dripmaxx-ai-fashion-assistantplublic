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
    <LinearGradient colors={['#0A0A0A', '#1A1A2E', '#0A0A0A']} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
            <X color="#FFFFFF" size={24} />
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
                    {planTier === 'free' && <Zap color="#888" size={28} />}
                    {planTier === 'premium' && <Crown color="#FFD700" size={28} />}
                    {planTier === 'pro' && <Crown color="#FF6B00" size={28} />}
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
                      <Check color="#4CAF50" size={20} />
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
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
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  highlightedCard: {
    borderColor: '#FFD700',
    backgroundColor: 'rgba(255, 215, 0, 0.05)',
  },
  currentPlanCard: {
    borderColor: '#4CAF50',
    backgroundColor: 'rgba(76, 175, 80, 0.05)',
  },
  badge: {
    position: 'absolute',
    top: -10,
    right: 20,
    backgroundColor: '#FFD700',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    color: '#000000',
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
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  planName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  currency: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  price: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  interval: {
    fontSize: 16,
    color: '#888',
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
    color: '#CCCCCC',
  },
  upgradeButton: {
    backgroundColor: '#FF6B00',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  highlightedButton: {
    backgroundColor: '#FFD700',
  },
  currentButton: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  upgradeButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  currentButtonText: {
    color: '#4CAF50',
  },
  warningCard: {
    backgroundColor: 'rgba(255, 152, 0, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 152, 0, 0.3)',
  },
  warningText: {
    color: '#FFA726',
    fontSize: 14,
    textAlign: 'center',
  },
  disclaimer: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
    lineHeight: 18,
  },
});
