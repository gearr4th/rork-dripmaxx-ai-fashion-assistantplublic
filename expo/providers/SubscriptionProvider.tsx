import { useState, useEffect, useMemo, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { SubscriptionTier, UserSubscription } from '@/types/subscription';
import { useAuth } from './AuthProvider';

interface SubscriptionContextType {
  subscription: UserSubscription | null;
  isLoading: boolean;
  tier: SubscriptionTier;
  canUseFeature: (feature: string) => boolean;
  getRemainingGenerations: () => number;
  incrementGenerationCount: () => Promise<void>;
  upgradeToPremium: () => Promise<void>;
  upgradeToPro: () => Promise<void>;
  cancelSubscription: () => Promise<void>;
  restoreSubscription: () => Promise<void>;
}

const GENERATION_LIMIT_FREE = 5;

export const [SubscriptionProvider, useSubscription] = createContextHook<SubscriptionContextType>(() => {
  const { user } = useAuth();
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [generationCount, setGenerationCount] = useState<number>(0);

  const loadSubscription = useCallback(async () => {
    try {
      setIsLoading(true);
      const storedSub = await AsyncStorage.getItem('user_subscription');
      const storedCount = await AsyncStorage.getItem('generation_count');
      
      if (storedSub) {
        const parsed = JSON.parse(storedSub) as UserSubscription;
        setSubscription(parsed);
      } else if (user) {
        const defaultSub: UserSubscription = {
          id: Date.now().toString(),
          userId: user.id,
          tier: 'free',
          status: 'active'
        };
        setSubscription(defaultSub);
        await AsyncStorage.setItem('user_subscription', JSON.stringify(defaultSub));
      }
      
      if (storedCount) {
        setGenerationCount(parseInt(storedCount, 10));
      }
    } catch (error) {
      console.error('[Subscription] Failed to load subscription', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void loadSubscription();
  }, [loadSubscription]);



  const tier = useMemo(() => subscription?.tier ?? 'free', [subscription]);

  const canUseFeature = useCallback((feature: string): boolean => {
    if (tier === 'pro') return true;
    if (tier === 'premium') {
      return !['AI personal stylist', 'Virtual wardrobe management', 'Shopping assistant with deals', 'Brand collaborations', 'Early access to new features', 'Dedicated account manager'].includes(feature);
    }
    return ['5 outfit generations per month', 'Basic drip rating', 'Budget recommendations', 'Community support'].includes(feature);
  }, [tier]);

  const getRemainingGenerations = useCallback((): number => {
    if (tier === 'premium' || tier === 'pro') return Infinity;
    return Math.max(0, GENERATION_LIMIT_FREE - generationCount);
  }, [tier, generationCount]);

  const incrementGenerationCount = useCallback(async () => {
    if (tier === 'premium' || tier === 'pro') return;
    
    const newCount = generationCount + 1;
    setGenerationCount(newCount);
    await AsyncStorage.setItem('generation_count', newCount.toString());
  }, [tier, generationCount]);

  const upgradeToPremium = useCallback(async () => {
    if (!user) {
      throw new Error('User must be logged in to upgrade');
    }

    const updatedSub: UserSubscription = {
      id: subscription?.id ?? Date.now().toString(),
      userId: user.id,
      tier: 'premium',
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };

    setSubscription(updatedSub);
    await AsyncStorage.setItem('user_subscription', JSON.stringify(updatedSub));
    console.log('[Subscription] Upgraded to Premium');
  }, [user, subscription]);

  const upgradeToPro = useCallback(async () => {
    if (!user) {
      throw new Error('User must be logged in to upgrade');
    }

    const updatedSub: UserSubscription = {
      id: subscription?.id ?? Date.now().toString(),
      userId: user.id,
      tier: 'pro',
      status: 'active',
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    };

    setSubscription(updatedSub);
    await AsyncStorage.setItem('user_subscription', JSON.stringify(updatedSub));
    console.log('[Subscription] Upgraded to Pro');
  }, [user, subscription]);

  const cancelSubscription = useCallback(async () => {
    if (!subscription || subscription.tier === 'free') return;

    const updatedSub: UserSubscription = {
      ...subscription,
      cancelAtPeriodEnd: true
    };

    setSubscription(updatedSub);
    await AsyncStorage.setItem('user_subscription', JSON.stringify(updatedSub));
    console.log('[Subscription] Subscription will cancel at period end');
  }, [subscription]);

  const restoreSubscription = useCallback(async () => {
    if (!subscription) return;

    const updatedSub: UserSubscription = {
      ...subscription,
      cancelAtPeriodEnd: false
    };

    setSubscription(updatedSub);
    await AsyncStorage.setItem('user_subscription', JSON.stringify(updatedSub));
    console.log('[Subscription] Subscription restored');
  }, [subscription]);

  return useMemo(() => ({
    subscription,
    isLoading,
    tier,
    canUseFeature,
    getRemainingGenerations,
    incrementGenerationCount,
    upgradeToPremium,
    upgradeToPro,
    cancelSubscription,
    restoreSubscription
  }), [subscription, isLoading, tier, canUseFeature, getRemainingGenerations, incrementGenerationCount, upgradeToPremium, upgradeToPro, cancelSubscription, restoreSubscription]);
});
