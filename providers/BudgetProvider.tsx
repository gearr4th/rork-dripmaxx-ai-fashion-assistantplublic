import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useAuth } from '@/providers/AuthProvider';
import { useCloudSync } from '@/providers/CloudSyncProvider';

export type BudgetOption = '$100' | '$250' | '$500' | '$1000' | '$2000+';

interface BudgetContextType {
  budget: BudgetOption | null;
  setBudget: (b: BudgetOption) => Promise<void>;
  clearBudget: () => Promise<void>;
  getBudgetForCurrentUser: () => Promise<BudgetOption | null>;
  loading: boolean;
}

const STORAGE_KEY_FOR = (userId: string) => `budget:${userId}`;

export const [BudgetProvider, useBudget] = createContextHook<BudgetContextType>(() => {
  const { user } = useAuth();
  const { cloud, mergeAndPersist, isInitialLoadComplete } = useCloudSync();
  const [budget, setBudgetState] = useState<BudgetOption | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const hasHydratedFromCloud = useRef<boolean>(false);

  const getBudgetForCurrentUser = useCallback(async (): Promise<BudgetOption | null> => {
    try {
      if (!user?.id) return null;
      setLoading(true);
      const stored = await AsyncStorage.getItem(STORAGE_KEY_FOR(user.id));
      if (!stored) {
        setBudgetState(null);
        return null;
      }
      const parsed = stored as BudgetOption;
      setBudgetState(parsed);
      return parsed;
    } catch (e) {
      console.log('[Budget] load error', e);
      return null;
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isInitialLoadComplete && cloud?.budget && !hasHydratedFromCloud.current) {
      const b = cloud.budget as BudgetOption | null;
      console.log('[Budget] hydrating from cloud:', b);
      setBudgetState(b);
      if (user?.id && b) {
        void AsyncStorage.setItem(STORAGE_KEY_FOR(user.id), b).catch(e =>
          console.error('[Budget] Failed to save cloud data to AsyncStorage:', e)
        );
      }
      hasHydratedFromCloud.current = true;
    }
  }, [cloud?.budget, user?.id, isInitialLoadComplete]);

  useEffect(() => {
    if (isInitialLoadComplete && !hasHydratedFromCloud.current) {
      setBudgetState(null);
      if (user?.id) {
        void getBudgetForCurrentUser();
      }
    }
  }, [user?.id, getBudgetForCurrentUser, isInitialLoadComplete]);

  const setBudget = useCallback(async (b: BudgetOption) => {
    console.log('[Budget] Setting budget:', b, 'for user:', user?.id);
    try {
      if (!user?.id) {
        console.error('[Budget] Cannot save budget: No user ID');
        return;
      }
      setBudgetState(b);
      await AsyncStorage.setItem(STORAGE_KEY_FOR(user.id), b);
      console.log('[Budget] AsyncStorage saved successfully');
      
      try {
        await mergeAndPersist({ budget: b } as any);
        console.log('[Budget] Cloud sync completed successfully');
      } catch (cloudError) {
        console.error('[Budget] Cloud sync failed:', cloudError);
        throw cloudError;
      }
    } catch (e) {
      console.error('[Budget] save error:', e);
      throw e;
    }
  }, [user?.id, mergeAndPersist]);

  const clearBudget = useCallback(async () => {
    console.log('[Budget] Clearing budget for user:', user?.id);
    try {
      if (!user?.id) {
        console.error('[Budget] Cannot clear budget: No user ID');
        return;
      }
      setBudgetState(null);
      await AsyncStorage.removeItem(STORAGE_KEY_FOR(user.id));
      console.log('[Budget] AsyncStorage cleared successfully');
      
      try {
        await mergeAndPersist({ budget: null } as any);
        console.log('[Budget] Cloud sync completed successfully');
      } catch (cloudError) {
        console.error('[Budget] Cloud sync failed:', cloudError);
        throw cloudError;
      }
    } catch (e) {
      console.error('[Budget] clear error:', e);
      throw e;
    }
  }, [user?.id, mergeAndPersist]);

  return useMemo(() => ({ budget, setBudget, clearBudget, getBudgetForCurrentUser, loading }), [budget, setBudget, clearBudget, getBudgetForCurrentUser, loading]);
});