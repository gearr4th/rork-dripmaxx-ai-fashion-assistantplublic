import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import {
  SubscriptionTier,
  UserSubscription,
  SUBSCRIPTION_PLANS,
  TRIAL_DURATION_MS,
  TRIAL_RULES,
  TRIAL_TIER,
  TrialInfo,
} from "@/types/subscription";
import { useAuth } from "./AuthProvider";

interface SubscriptionContextType {
  subscription: UserSubscription | null;
  isLoading: boolean;
  tier: SubscriptionTier;
  isTrialing: boolean;
  trialDaysLeft: number;
  /** The *effective* plan rules (trial overrides DripLite limits during trial) */
  effectivePlan: typeof SUBSCRIPTION_PLANS["driplite"];
  /** Closet items remaining (null = unlimited) */
  closetRemaining: number | null;
  /** Outfit generations remaining today (null = unlimited) */
  generationsRemaining: number | null;
  /** Saved outfits remaining (null = unlimited) */
  savedOutfitsRemaining: number | null;
  /** Tries to consume 1 generation. Returns false if limit hit. */
  tryUseGeneration: () => Promise<boolean>;
  /** Tries to add 1 item to closet. Returns false if limit hit. */
  tryAddItem: (currentCount: number) => boolean;
  /** Tries to save 1 outfit. Returns false if limit hit. */
  trySaveOutfit: (currentCount: number) => boolean;
  /** Feature flags */
  canUseCostPerWear: boolean;
  canUseWeatherSuggestions: boolean;
  canUseOutfitRepeatTracking: boolean;
  canUseEventPlanning: boolean;
  canUseTrendAnalysis: boolean;
  hasWatermark: boolean;
  /** Upgrade actions */
  upgradeToTier: (target: SubscriptionTier) => Promise<void>;
  startTrial: () => Promise<void>;
  cancelSubscription: () => Promise<void>;
  restoreSubscription: () => Promise<void>;
}

const DAY_KEY = (): string => {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

function isTrialActive(trial: TrialInfo | undefined): boolean {
  if (!trial) return false;
  return trial.isActive && new Date(trial.expiresAt).getTime() > Date.now();
}

function trialDaysLeft(trial: TrialInfo | undefined): number {
  if (!trial) return 0;
  const ms = new Date(trial.expiresAt).getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (24 * 60 * 60 * 1000)));
}

export const [SubscriptionProvider, useSubscription] = createContextHook<SubscriptionContextType>(() => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [generationCount, setGenerationCount] = useState<number>(0);
  const [generationDate, setGenerationDate] = useState<string>("");
  const didAutoTrialRef = useRef<boolean>(false);

  // Load stored subscription data
  const loadSubscription = useCallback(async () => {
    try {
      setIsLoading(true);
      const uid = user?.id ?? "guest";
      const storedSub = await AsyncStorage.getItem(`subscription:${uid}`);
      const storedCount = await AsyncStorage.getItem(`gen_count:${uid}`);
      const storedDate = await AsyncStorage.getItem(`gen_date:${uid}`);
      const todayKey = DAY_KEY();

      if (storedDate !== todayKey) {
        setGenerationCount(0);
        setGenerationDate(todayKey);
        await AsyncStorage.setItem(`gen_count:${uid}`, "0");
        await AsyncStorage.setItem(`gen_date:${uid}`, todayKey);
      } else if (storedCount) {
        setGenerationCount(parseInt(storedCount, 10) || 0);
        setGenerationDate(storedDate);
      }

      if (storedSub) {
        const parsed = JSON.parse(storedSub) as UserSubscription;
        // Migrate old tier names
        if (parsed.tier === "free") parsed.tier = "driplite";
        if (parsed.tier === "premium") parsed.tier = "dripplus";
        if (parsed.tier === "pro") parsed.tier = "dripmaxx";
        // Check if trial expired
        if (parsed.trial && !isTrialActive(parsed.trial) && parsed.status === "trialing") {
          parsed.status = "active";
          parsed.trial = { ...parsed.trial, isActive: false };
          if (parsed.tier === TRIAL_TIER) parsed.tier = "driplite";
          console.log("[Subscription] Trial expired, resetting to DripLite");
        }
        setSubscription(parsed);
      } else if (user && !didAutoTrialRef.current) {
        didAutoTrialRef.current = true;
        // New user — auto-start 3-day trial
        const now = new Date();
        const trial: TrialInfo = {
          startedAt: now.toISOString(),
          expiresAt: new Date(now.getTime() + TRIAL_DURATION_MS).toISOString(),
          isActive: true,
        };
        const defaultSub: UserSubscription = {
          id: Date.now().toString(),
          userId: uid,
          tier: TRIAL_TIER,
          status: "trialing",
          trial,
        };
        setSubscription(defaultSub);
        await AsyncStorage.setItem(`subscription:${uid}`, JSON.stringify(defaultSub));
        console.log("[Subscription] Auto-started 3-day DripMaxx trial");
      }
    } catch (error) {
      console.error("[Subscription] Failed to load subscription", error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadSubscription();
  }, [loadSubscription]);

  const persist = useCallback(async (sub: UserSubscription) => {
    const uid = user?.id ?? "guest";
    setSubscription(sub);
    await AsyncStorage.setItem(`subscription:${uid}`, JSON.stringify(sub));
  }, [user?.id]);

  // Effective tier & plan
  const tier = useMemo<SubscriptionTier>(() => subscription?.tier ?? "driplite", [subscription]);
  const isTrialing = useMemo(() => subscription?.status === "trialing" && isTrialActive(subscription?.trial), [subscription]);
  const daysLeft = useMemo(() => trialDaysLeft(subscription?.trial), [subscription?.trial]);

  const effectivePlan = useMemo(() => {
    if (isTrialing) return TRIAL_RULES;
    return SUBSCRIPTION_PLANS[tier];
  }, [tier, isTrialing]);

  // Limit calculations
  const closetRemaining = useMemo<number | null>(() => {
    if (effectivePlan.closetLimit === null) return null;
    return effectivePlan.closetLimit; // caller passes current count and we return true/false via tryAddItem
  }, [effectivePlan]);

  const generationsRemaining = useMemo<number | null>(() => {
    if (effectivePlan.dailyGenerationLimit === null) return null;
    return Math.max(0, effectivePlan.dailyGenerationLimit - generationCount);
  }, [effectivePlan, generationCount]);

  const savedOutfitsRemaining = useMemo<number | null>(() => {
    if (effectivePlan.maxSavedOutfits === null) return null;
    return effectivePlan.maxSavedOutfits;
  }, [effectivePlan]);

  // Feature flags
  const canUseCostPerWear = effectivePlan.features.costPerWear;
  const canUseWeatherSuggestions = effectivePlan.features.weatherSuggestions;
  const canUseOutfitRepeatTracking = effectivePlan.features.outfitRepeatTracking;
  const canUseEventPlanning = effectivePlan.features.eventPlanning;
  const canUseTrendAnalysis = effectivePlan.features.seasonalTrendAnalysis;
  const hasWatermark = effectivePlan.features.watermark;

  // Generation counting
  const tryUseGeneration = useCallback(async (): Promise<boolean> => {
    const uid = user?.id ?? "guest";
    const todayKey = DAY_KEY();
    const limit = effectivePlan.dailyGenerationLimit;
    if (limit === null) return true; // unlimited

    const effectiveCount = generationDate === todayKey ? generationCount : 0;
    if (effectiveCount >= limit) return false;

    const next = effectiveCount + 1;
    setGenerationCount(next);
    setGenerationDate(todayKey);
    await AsyncStorage.setItem(`gen_count:${uid}`, String(next));
    await AsyncStorage.setItem(`gen_date:${uid}`, todayKey);
    return true;
  }, [user?.id, effectivePlan, generationCount, generationDate]);

  // Item/closet gating
  const tryAddItem = useCallback((currentCount: number): boolean => {
    if (effectivePlan.closetLimit === null) return true;
    return currentCount < effectivePlan.closetLimit;
  }, [effectivePlan]);

  // Outfit save gating
  const trySaveOutfit = useCallback((currentCount: number): boolean => {
    if (effectivePlan.maxSavedOutfits === null) return true;
    return currentCount < effectivePlan.maxSavedOutfits;
  }, [effectivePlan]);

  // Trial start (manual start if not auto)
  const startTrial = useCallback(async () => {
    if (!user) throw new Error("User must be logged in");
    if (!subscription) return;
    const now = new Date();
    const trial: TrialInfo = {
      startedAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + TRIAL_DURATION_MS).toISOString(),
      isActive: true,
    };
    await persist({ ...subscription, tier: TRIAL_TIER, status: "trialing", trial });
  }, [user, subscription, persist]);

  // Upgrade to a tier
  const upgradeToTier = useCallback(async (target: SubscriptionTier) => {
    if (!user) throw new Error("User must be logged in to upgrade");
    if (!subscription) return;
    const updated: UserSubscription = {
      ...subscription,
      id: subscription.id || Date.now().toString(),
      userId: user.id,
      tier: target,
      status: "active",
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      trial: undefined,
      cancelAtPeriodEnd: false,
    };
    await persist(updated);
    console.log(`[Subscription] Upgraded to ${target}`);
  }, [user, subscription, persist]);

  const cancelSubscription = useCallback(async () => {
    if (!subscription || subscription.tier === "driplite") return;
    await persist({ ...subscription, cancelAtPeriodEnd: true });
  }, [subscription, persist]);

  const restoreSubscription = useCallback(async () => {
    if (!subscription) return;
    await persist({ ...subscription, cancelAtPeriodEnd: false });
  }, [subscription, persist]);

  return useMemo(() => ({
    subscription,
    isLoading,
    tier,
    isTrialing,
    trialDaysLeft: daysLeft,
    effectivePlan,
    closetRemaining,
    generationsRemaining,
    savedOutfitsRemaining,
    tryUseGeneration,
    tryAddItem,
    trySaveOutfit,
    canUseCostPerWear,
    canUseWeatherSuggestions,
    canUseOutfitRepeatTracking,
    canUseEventPlanning,
    canUseTrendAnalysis,
    hasWatermark,
    upgradeToTier,
    startTrial,
    cancelSubscription,
    restoreSubscription,
  }), [
    subscription, isLoading, tier, isTrialing, daysLeft,
    effectivePlan, closetRemaining, generationsRemaining,
    savedOutfitsRemaining, tryUseGeneration, tryAddItem,
    trySaveOutfit, canUseCostPerWear, canUseWeatherSuggestions,
    canUseOutfitRepeatTracking, canUseEventPlanning,
    canUseTrendAnalysis, hasWatermark, upgradeToTier,
    startTrial, cancelSubscription, restoreSubscription,
  ]);
});
