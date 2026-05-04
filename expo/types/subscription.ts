export type SubscriptionTier = 'free' | 'premium' | 'pro';

export interface SubscriptionPlan {
  id: string;
  tier: SubscriptionTier;
  name: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  stripePriceId?: string;
  features: string[];
  highlighted?: boolean;
}

export interface UserSubscription {
  id: string;
  userId: string;
  tier: SubscriptionTier;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd?: boolean;
}

export const SUBSCRIPTION_PLANS: Record<SubscriptionTier, SubscriptionPlan> = {
  free: {
    id: 'free',
    tier: 'free',
    name: 'Free',
    price: 0,
    currency: 'USD',
    interval: 'month',
    features: [
      '5 outfit generations per month',
      'Basic drip rating',
      'Budget recommendations',
      'Community support'
    ]
  },
  premium: {
    id: 'premium',
    tier: 'premium',
    name: 'Premium',
    price: 9.99,
    currency: 'USD',
    interval: 'month',
    stripePriceId: process.env.EXPO_PUBLIC_STRIPE_PREMIUM_PRICE_ID,
    features: [
      'Unlimited outfit generations',
      'Advanced drip analytics',
      'Personalized style tips',
      'Priority support',
      'Save unlimited outfits',
      'Exclusive trends access'
    ],
    highlighted: true
  },
  pro: {
    id: 'pro',
    tier: 'pro',
    name: 'Pro',
    price: 19.99,
    currency: 'USD',
    interval: 'month',
    stripePriceId: process.env.EXPO_PUBLIC_STRIPE_PRO_PRICE_ID,
    features: [
      'Everything in Premium',
      'AI personal stylist',
      'Virtual wardrobe management',
      'Shopping assistant with deals',
      'Brand collaborations',
      'Early access to new features',
      'Dedicated account manager'
    ]
  }
};
