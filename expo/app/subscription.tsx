import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { Check, Crown, X, Zap, Timer, Star, Sparkles } from "lucide-react-native";
import { router } from "expo-router";
import { useSubscription } from "@/providers/SubscriptionProvider";
import {
  SUBSCRIPTION_PLANS,
  SubscriptionTier,
  tierDisplayName,
} from "@/types/subscription";

interface FeatureRowProps {
  label: string;
  included: boolean;
  proOnly?: boolean;
}

function FeatureRow({ label, included, proOnly }: FeatureRowProps) {
  return (
    <View style={styles.featureRow}>
      {included ? (
        <Check color="#34D399" size={16} />
      ) : (
        <X color="#475569" size={16} />
      )}
      <Text style={[styles.featureText, !included && styles.featureTextDisabled]}>
        {label}
      </Text>
      {proOnly && included && (
        <View style={styles.proBadge}>
          <Text style={styles.proBadgeText}>PRO</Text>
        </View>
      )}
    </View>
  );
}

export default function SubscriptionScreen() {
  const {
    tier,
    isTrialing,
    trialDaysLeft,
    purchaseTier,
    startTrial,
    cancelTrial,
    subscription,
  } = useSubscription();
  const [loading, setLoading] = useState<SubscriptionTier | null>(null);
  const [cancellingTrial, setCancellingTrial] = useState(false);

  const handleTierAction = async (targetTier: SubscriptionTier) => {
    // If in trial and tapping DripLite → exit trial
    if (isTrialing && targetTier === "driplite") {
      setCancellingTrial(true);
      try {
        await cancelTrial();
        Alert.alert(
          "Trial Cancelled",
          "You're now on the DripLite free plan. You can upgrade anytime.",
          [{ text: "OK" }]
        );
      } catch (error) {
        const message = error instanceof Error ? error.message : "Failed to exit trial";
        Alert.alert("Error", message);
      } finally {
        setCancellingTrial(false);
      }
      return;
    }

    // If not in trial and same tier → no-op
    if (!isTrialing && targetTier === tier) return;
    
    // DripLite when not in trial → no-op (already free)
    if (targetTier === "driplite" && !isTrialing) return;

    setLoading(targetTier);

    try {
      const success = await purchaseTier(targetTier);
      if (success) {
        Alert.alert(
          "Welcome to " + tierDisplayName(targetTier) + "!",
          "Your subscription is now active. Enjoy your new features!",
          [{ text: "Awesome!", onPress: () => router.back() }]
        );
      } else {
        Alert.alert(
          "Payment Not Completed",
          "The payment was cancelled or didn't go through. You can try again anytime.",
          [{ text: "OK" }]
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to process upgrade";
      Alert.alert("Something Went Wrong", message);
    } finally {
      setLoading(null);
    }
  };

    const handleStartTrial = async () => {
    try {
      await startTrial();
      Alert.alert("Trial Started!", "Enjoy 3 days of DripMaxx for free!", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to start trial";
      Alert.alert("Error", message);
    }
  };

  const showTrialBanner = useMemo(() => {
    return tier === "driplite" && !isTrialing && !subscription?.trial;
  }, [tier, isTrialing, subscription?.trial]);

  const tiers: SubscriptionTier[] = ["driplite", "dripplus", "dripmaxx"];

  return (
    <LinearGradient colors={["#060B18", "#0D1525", "#080F1E"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.closeButton}
              activeOpacity={0.7}
            >
              <X color="#CBD5E1" size={22} />
            </TouchableOpacity>
            <Text style={styles.title}>Choose Your Plan</Text>
            <Text style={styles.subtitle}>
              Elevate your style with AI-powered outfit intelligence
            </Text>
          </View>

          {/* Trial banner */}
          {showTrialBanner && (
            <TouchableOpacity
              style={styles.trialBanner}
              onPress={handleStartTrial}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={["#7C3AED", "#5B21B6"]}
                style={styles.trialBannerGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.trialIconWrap}>
                  <Timer color="#C4B5FD" size={28} />
                </View>
                <View style={styles.trialContent}>
                  <Text style={styles.trialTitle}>3-Day Free Trial</Text>
                  <Text style={styles.trialSubtitle}>
                    Try DripMaxx with 20 items, 3 generations/day — no commitment
                  </Text>
                </View>
                <Crown color="#FBBF24" size={20} />
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Active trial indicator */}
          {isTrialing && (
            <View style={styles.activeTrialBanner}>
              <LinearGradient
                colors={["#059669", "#047857"]}
                style={styles.activeTrialGradient}
              >
                <Sparkles color="#D1FAE5" size={18} />
                <Text style={styles.activeTrialText}>
                  Trial active — {trialDaysLeft} day{trialDaysLeft !== 1 ? "s" : ""} left
                </Text>
              </LinearGradient>
              <TouchableOpacity
                style={styles.skipTrialButton}
                onPress={() => handleTierAction("driplite")}
                disabled={cancellingTrial}
                activeOpacity={0.7}
              >
                {cancellingTrial ? (
                  <ActivityIndicator color="#CBD5E1" size="small" />
                ) : (
                  <Text style={styles.skipTrialText}>Exit Trial → DripLite</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Tier cards */}
          <View style={styles.tiersContainer}>
            {tiers.map((planTier) => {
              const plan = SUBSCRIPTION_PLANS[planTier];
              // During trial: DripMaxx is "current" visually but purchasable; DripLite exits trial
              const isCurrentPlan = tier === planTier && !isTrialing;
              const isTrialTier = isTrialing && planTier === "dripmaxx";
              const isHighlighted = plan.highlighted;
              const isRevenue = planTier === "dripmaxx";

              return (
                <TouchableOpacity
                  key={plan.id}
                  style={[
                    styles.planCard,
                    isHighlighted && styles.highlightedCard,
                    isRevenue && styles.revenueCard,
                    isCurrentPlan && styles.currentPlanCard,
                    isTrialTier && styles.trialActiveCard,
                  ]}
                  onPress={() => handleTierAction(planTier)}
                  disabled={(isCurrentPlan && !isTrialing) || loading !== null || cancellingTrial}
                  activeOpacity={0.8}
                >
                  {isHighlighted && (
                    <View style={styles.popularBadge}>
                      <Star color="#FBBF24" size={12} />
                      <Text style={styles.popularBadgeText}>MOST POPULAR</Text>
                    </View>
                  )}
                  {isRevenue && !isHighlighted && (
                    <View style={styles.revenueBadge}>
                      <Crown color="#F97316" size={12} />
                      <Text style={styles.revenueBadgeText}>BEST VALUE</Text>
                    </View>
                  )}

                  {/* Plan header */}
                  <View style={styles.planHeader}>
                    <View
                      style={[
                        styles.planIcon,
                        isRevenue && styles.planIconPro,
                      ]}
                    >
                      {planTier === "driplite" && <Zap color="#64748B" size={24} />}
                      {planTier === "dripplus" && <Star color="#FBBF24" size={24} />}
                      {planTier === "dripmaxx" && <Crown color="#F97316" size={24} />}
                    </View>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <View style={styles.priceRow}>
                      <Text style={styles.currency}>$</Text>
                      <Text style={styles.price}>{plan.price === 0 ? "0" : plan.price}</Text>
                      {plan.price > 0 && (
                        <Text style={styles.interval}>/mo</Text>
                      )}
                    </View>
                    {plan.price === 0 && (
                      <Text style={styles.freeLabel}>Free forever</Text>
                    )}
                  </View>

                  {/* Feature list */}
                  <View style={styles.featuresContainer}>
                    <FeatureRow
                      label={`${plan.closetLimit === null ? "Unlimited" : plan.closetLimit} closet items`}
                      included={true}
                      proOnly={plan.closetLimit === null}
                    />
                    <FeatureRow
                      label={`${plan.dailyGenerationLimit === null ? "Unlimited" : plan.dailyGenerationLimit} outfit${plan.dailyGenerationLimit === 1 ? "" : "s"}/day`}
                      included={true}
                    />
                    <FeatureRow
                      label={`${plan.maxSavedOutfits === null ? "Unlimited" : plan.maxSavedOutfits} saved looks`}
                      included={true}
                    />
                    <FeatureRow
                      label="AI outfit generation"
                      included={true}
                    />
                    <FeatureRow
                      label="Weather-based suggestions"
                      included={plan.features.weatherSuggestions}
                    />
                    <FeatureRow
                      label="Cost-per-wear tracking"
                      included={plan.features.costPerWear}
                    />
                    <FeatureRow
                      label="Outfit repeat tracking"
                      included={plan.features.outfitRepeatTracking}
                    />
                    <FeatureRow
                      label="Event-based planning"
                      included={plan.features.eventPlanning}
                      proOnly={plan.features.eventPlanning}
                    />
                    <FeatureRow
                      label="Seasonal trend analysis"
                      included={plan.features.seasonalTrendAnalysis}
                      proOnly={plan.features.seasonalTrendAnalysis}
                    />
                    <FeatureRow
                      label="Priority generation speed"
                      included={plan.features.priorityGeneration}
                      proOnly={plan.features.priorityGeneration}
                    />
                    <FeatureRow
                      label="Watermark-free"
                      included={!plan.features.watermark}
                    />
                  </View>

                  {/* CTA button */}
                  <TouchableOpacity
                    style={[
                      styles.upgradeButton,
                      isCurrentPlan && styles.currentButton,
                      isHighlighted && styles.highlightedButton,
                      isRevenue && styles.revenueButton,
                    ]}
                    onPress={() => handleTierAction(planTier)}
                    disabled={(isCurrentPlan && !isTrialing) || loading !== null || cancellingTrial}
                    activeOpacity={0.8}
                  >
                    {(loading === planTier || (isTrialing && planTier === "driplite" && cancellingTrial)) ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text
                        style={[
                          styles.upgradeButtonText,
                          isCurrentPlan && !isTrialing && styles.currentButtonText,
                        ]}
                      >
                        {isCurrentPlan && !isTrialing
                          ? "Current Plan"
                          : isTrialing && planTier === "driplite"
                            ? "Exit Trial"
                            : isTrialing && planTier === "dripmaxx"
                              ? "Keep DripMaxx — $9.99/mo"
                              : plan.price === 0
                                ? "Get Started Free"
                                : `Upgrade to ${plan.name}`}
                      </Text>
                    )}
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Warning about cancellation */}
          {subscription?.cancelAtPeriodEnd && (
            <View style={styles.warningCard}>
              <Text style={styles.warningText}>
                Your subscription will be canceled at the end of the current billing period.
              </Text>
            </View>
          )}

          {/* Disclaimer */}
          <Text style={styles.disclaimer}>
            • Subscriptions auto-renew unless canceled{"\n"}
            • Cancel anytime from your account settings{"\n"}
            • Free trial converts to DripLite after 3 days{"\n"}
            • Prices in USD, may vary by region
          </Text>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollContent: { paddingBottom: 60 },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 28,
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    right: 24,
    top: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(30, 58, 95, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: "#F1F5F9",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
  },

  /* Trial banner */
  trialBanner: {
    marginHorizontal: 20,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
  },
  trialBannerGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 18,
    gap: 12,
  },
  trialIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(196, 181, 253, 0.15)",
    justifyContent: "center",
    alignItems: "center",
  },
  trialContent: { flex: 1 },
  trialTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#F1F5F9",
    marginBottom: 2,
  },
  trialSubtitle: {
    fontSize: 12,
    color: "#C4B5FD",
    lineHeight: 16,
  },

  /* Active trial */
  activeTrialBanner: {
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 24,
  },
  activeTrialGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 14,
    gap: 10,
  },
  activeTrialText: {
    color: "#D1FAE5",
    fontSize: 14,
    fontWeight: "600" as const,
  },
  skipTrialButton: {
    marginTop: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    alignItems: "center" as const,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.15)",
  },
  skipTrialText: {
    color: "#CBD5E1",
    fontSize: 13,
    fontWeight: "600" as const,
  },

  /* Tier cards */
  tiersContainer: {
    paddingHorizontal: 20,
  },
  planCard: {
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: "rgba(51, 65, 85, 0.4)",
    overflow: "hidden",
  },
  highlightedCard: {
    borderColor: "#FBBF24",
    backgroundColor: "rgba(251, 191, 36, 0.05)",
  },
  revenueCard: {
    borderColor: "#F97316",
    backgroundColor: "rgba(249, 115, 22, 0.06)",
  },
  currentPlanCard: {
    borderColor: "#059669",
    backgroundColor: "rgba(5, 150, 105, 0.06)",
  },
  trialActiveCard: {
    borderColor: "#7C3AED",
    backgroundColor: "rgba(124, 58, 237, 0.06)",
  },

  /* Badges */
  popularBadge: {
    position: "absolute",
    top: 12,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FBBF24",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  popularBadgeText: {
    color: "#0F172A",
    fontSize: 10,
    fontWeight: "800" as const,
    letterSpacing: 0.5,
  },
  revenueBadge: {
    position: "absolute",
    top: 12,
    right: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F97316",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  revenueBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "800" as const,
    letterSpacing: 0.5,
  },

  /* Plan header */
  planHeader: { alignItems: "center", marginBottom: 20 },
  planIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(51, 65, 85, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },
  planIconPro: {
    backgroundColor: "rgba(249, 115, 22, 0.15)",
  },
  planName: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: "#F1F5F9",
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  priceRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  currency: {
    fontSize: 18,
    color: "#F1F5F9",
    fontWeight: "600" as const,
  },
  price: {
    fontSize: 42,
    fontWeight: "800" as const,
    color: "#F1F5F9",
    letterSpacing: -1,
  },
  interval: {
    fontSize: 14,
    color: "#64748B",
    marginLeft: 2,
  },
  freeLabel: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 2,
  },

  /* Features */
  featuresContainer: { marginBottom: 20, gap: 10 },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  featureText: {
    fontSize: 13,
    color: "#CBD5E1",
    flex: 1,
  },
  featureTextDisabled: {
    color: "#334155",
  },
  proBadge: {
    backgroundColor: "rgba(249, 115, 22, 0.15)",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  proBadgeText: {
    color: "#FB923C",
    fontSize: 8,
    fontWeight: "800" as const,
    letterSpacing: 0.5,
  },

  /* Buttons */
  upgradeButton: {
    backgroundColor: "#334155",
    borderRadius: 14,
    paddingVertical: 15,
    alignItems: "center",
  },
  highlightedButton: {
    backgroundColor: "#FBBF24",
  },
  revenueButton: {
    backgroundColor: "#F97316",
  },
  currentButton: {
    backgroundColor: "rgba(5, 150, 105, 0.15)",
    borderWidth: 1,
    borderColor: "#059669",
  },
  upgradeButtonText: {
    color: "#F1F5F9",
    fontSize: 15,
    fontWeight: "700" as const,
  },
  currentButtonText: {
    color: "#34D399",
  },

  /* Warning */
  warningCard: {
    marginHorizontal: 20,
    backgroundColor: "rgba(251, 191, 36, 0.08)",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.2)",
  },
  warningText: {
    color: "#FBBF24",
    fontSize: 13,
    textAlign: "center",
  },

  /* Disclaimer */
  disclaimer: {
    fontSize: 12,
    color: "#475569",
    textAlign: "center",
    marginTop: 12,
    paddingHorizontal: 40,
    lineHeight: 20,
  },
});
