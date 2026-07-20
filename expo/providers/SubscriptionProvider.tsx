import { useMemo } from "react";
import createContextHook from "@nkzw/create-context-hook";
import {
  SubscriptionTier,
  UserSubscription,
  SUBSCRIPTION_PLANS,
} from "@/types/subscription";

/**
 * TestFlight / Beta build — all features unlocked, no payments.
 * Every gating hook returns "unlimited". No Stripe, no AsyncStorage tier,
 * no trial. This keeps the same API surface as the paid version so the
 * rest of the app compiles unchanged, but nothing is locked.
 */
interface SubscriptionContextType {
  subscription: UserSubscription | null;
  isLoading: boolean;
  tier: SubscriptionTier;
  isTrialing: boolean;
  trialDaysLeft: number;
  effectivePlan: typeof SUBSCRIPTION_PLANS["dripmaxx"];
  closetRemaining: number | null;
  generationsRemaining: number | null;
  savedOutfitsRemaining: number | null;
  tryUseGeneration: () => Promise<boolean>;
  tryAddItem: (currentCount: number) => boolean;
  trySaveOutfit: (currentCount: number) => boolean;
  canUseCostPerWear: boolean;
  canUseWeatherSuggestions: boolean;
  canUseOutfitRepeatTracking: boolean;
  canUseEventPlanning: boolean;
  canUseTrendAnalysis: boolean;
  hasWatermark: boolean;
  upgradeToTier: (target: SubscriptionTier) => Promise<void>;
  purchaseTier: (target: SubscriptionTier) => Promise<boolean>;
  startTrial: () => Promise<void>;
  cancelTrial: () => Promise<void>;
  cancelSubscription: () => Promise<void>;
  restoreSubscription: () => Promise<void>;
}

const BETA_SUBSCRIPTION: UserSubscription = {
  id: "beta",
  userId: "beta",
  tier: "dripmaxx",
  status: "active",
  cancelAtPeriodEnd: false,
};

export const [SubscriptionProvider, useSubscription] = createContextHook<SubscriptionContextType>(() => {
  const plan = SUBSCRIPTION_PLANS.dripmaxx;

  return useMemo<SubscriptionContextType>(() => ({
    subscription: BETA_SUBSCRIPTION,
    isLoading: false,
    tier: "dripmaxx",
    isTrialing: false,
    trialDaysLeft: 0,
    effectivePlan: plan,
    closetRemaining: null,
    generationsRemaining: null,
    savedOutfitsRemaining: null,
    tryUseGeneration: async () => true,
    tryAddItem: () => true,
    trySaveOutfit: () => true,
    canUseCostPerWear: true,
    canUseWeatherSuggestions: true,
    canUseOutfitRepeatTracking: true,
    canUseEventPlanning: true,
    canUseTrendAnalysis: true,
    hasWatermark: false,
    upgradeToTier: async () => {},
    purchaseTier: async () => true,
    startTrial: async () => {},
    cancelTrial: async () => {},
    cancelSubscription: async () => {},
    restoreSubscription: async () => {},
  }), [plan]);
});
