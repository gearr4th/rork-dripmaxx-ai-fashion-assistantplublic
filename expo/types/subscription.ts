export type SubscriptionTier = "driplite" | "dripplus" | "dripmaxx";

export interface SubscriptionPlan {
  id: string;
  tier: SubscriptionTier;
  name: string;
  price: number;
  currency: string;
  interval: "month";
  stripePriceId?: string;
  /** Limit of clothing items the user can upload */
  closetLimit: number | null;
  /** Max outfit generations per day */
  dailyGenerationLimit: number | null;
  /** Max saved outfits (null = unlimited) */
  maxSavedOutfits: number | null;
  /** Features enabled at this tier */
  features: {
    weatherSuggestions: boolean;
    costPerWear: boolean;
    outfitRepeatTracking: boolean;
    eventPlanning: boolean;
    seasonalTrendAnalysis: boolean;
    priorityGeneration: boolean;
    watermark: boolean;
  };
  highlighted?: boolean;
}

export interface TrialInfo {
  startedAt: string;
  expiresAt: string;
  isActive: boolean;
}

export interface UserSubscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  status: "active" | "canceled" | "past_due" | "trialing";
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
  trial?: TrialInfo;
}

/** 3 days in milliseconds */
export const TRIAL_DURATION_MS = 3 * 24 * 60 * 60 * 1000;

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  driplite: {
    id: "driplite",
    tier: "driplite",
    name: "DripLite",
    price: 0,
    currency: "USD",
    interval: "month",
    closetLimit: 5,
    dailyGenerationLimit: 1,
    maxSavedOutfits: 3,
    features: {
      weatherSuggestions: false,
      costPerWear: false,
      outfitRepeatTracking: false,
      eventPlanning: false,
      seasonalTrendAnalysis: false,
      priorityGeneration: false,
      watermark: true,
    },
  },
  dripplus: {
    id: "dripplus",
    tier: "dripplus",
    name: "Drip+",
    price: 4.99,
    currency: "USD",
    interval: "month",
    stripePriceId: process.env.EXPO_PUBLIC_STRIPE_DRIPPLUS_PRICE_ID,
    closetLimit: 20,
    dailyGenerationLimit: 2,
    maxSavedOutfits: null,
    features: {
      weatherSuggestions: true,
      costPerWear: true,
      outfitRepeatTracking: true,
      eventPlanning: false,
      seasonalTrendAnalysis: false,
      priorityGeneration: false,
      watermark: false,
    },
    highlighted: true,
  },
  dripmaxx: {
    id: "dripmaxx",
    tier: "dripmaxx",
    name: "DripMaxx",
    price: 9.99,
    currency: "USD",
    interval: "month",
    stripePriceId: process.env.EXPO_PUBLIC_STRIPE_DRIPMAXX_PRICE_ID,
    closetLimit: null,
    dailyGenerationLimit: 10,
    maxSavedOutfits: null,
    features: {
      weatherSuggestions: true,
      costPerWear: true,
      outfitRepeatTracking: true,
      eventPlanning: true,
      seasonalTrendAnalysis: true,
      priorityGeneration: true,
      watermark: false,
    },
  },
};

/** Trial tier: Drip+ limits applied during 3-day trial */
export const TRIAL_TIER = "dripmaxx" as const;

/** What features & limits apply during the 3-day free trial.
 *  Matches the user's spec: Drip+ limits, basic features, watermark ON. */
export const TRIAL_RULES: SubscriptionPlan = {
  id: "trial",
  tier: TRIAL_TIER,
  name: "DripMaxx Trial",
  price: 0,
  currency: "USD",
  interval: "month",
  closetLimit: 20,
  dailyGenerationLimit: 3,
  maxSavedOutfits: 3,
  features: {
    weatherSuggestions: true,
    costPerWear: true,
    outfitRepeatTracking: true,
    eventPlanning: false,
    seasonalTrendAnalysis: true,
    priorityGeneration: false,
    watermark: true,
  },
};

/** Human-readable tier display name */
export function tierDisplayName(tier: SubscriptionTier): string {
  switch (tier) {
    case "driplite": return "DripLite";
    case "dripplus": return "Drip+";
    case "dripmaxx": return "DripMaxx";
  }
}
