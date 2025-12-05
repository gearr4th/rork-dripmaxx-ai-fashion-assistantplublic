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
  const cloudSync = useCloudSync();
  const [budget, setBudgetState] = useState<BudgetOption | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const hasLoadedRef = useRef<string | null>(null);
  const mountedRef = useRef<boolean>(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

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
    const uid = user?.id ?? null;
    if (cloudSync.isInitialLoadComplete && hasLoadedRef.current !== uid) {
      hasLoadedRef.current = uid;
      void loadAsync(uid, cloudSync.cloud);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, cloudSync.isInitialLoadComplete, cloudSync.cloud]);

  const loadAsync = async (uid: string | null, cloud: typeof cloudSync.cloud) => {
    try {
      if (!uid) {
        setBudgetState(null);
        return;
      }
      console.log('[Budget] ========== LOADING BUDGET ==========');
      console.log('[Budget] User:', uid);

      if (cloud?.budget) {
        const b = cloud.budget as BudgetOption | null;
        console.log('[Budget] ✅ USING CLOUD DATA:', b);
        setBudgetState(b);
        if (b) {
          await AsyncStorage.setItem(STORAGE_KEY_FOR(uid), b);
          console.log('[Budget] Cloud data saved to AsyncStorage as backup');
        }
        return;
      }

      const stored = await AsyncStorage.getItem(STORAGE_KEY_FOR(uid));
      if (stored) {
        const parsed = stored as BudgetOption;
        console.log('[Budget] 📁 Loaded from AsyncStorage (local backup):', parsed);
        setBudgetState(parsed);
      } else {
        console.log('[Budget] ⚠️  No data found');
        setBudgetState(null);
      }
    } catch (e) {
      console.log('[Budget] load error', e);
      setBudgetState(null);
    }
  };

  const setBudget = useCallback(async (b: BudgetOption) => {
    const uid = user?.id;
    console.log('[Budget] Setting budget:', b, 'for user:', uid);
    try {
      if (!uid) {
        console.error('[Budget] Cannot save budget: No user ID');
        return;
      }
      setBudgetState(b);
      await AsyncStorage.setItem(STORAGE_KEY_FOR(uid), b);
      console.log('[Budget] AsyncStorage saved successfully');
      
      try {
        await cloudSync.mergeAndPersist({ budget: b } as any);
        console.log('[Budget] Cloud sync completed successfully');
      } catch (cloudError) {
        console.error('[Budget] Cloud sync failed:', cloudError);
        throw cloudError;
      }
    } catch (e) {
      console.error('[Budget] save error:', e);
      throw e;
    }
  }, [user?.id, cloudSync.mergeAndPersist]);

  const clearBudget = useCallback(async () => {
    const uid = user?.id;
    console.log('[Budget] Clearing budget for user:', uid);
    try {
      if (!uid) {
        console.error('[Budget] Cannot clear budget: No user ID');
        return;
      }
      setBudgetState(null);
      await AsyncStorage.removeItem(STORAGE_KEY_FOR(uid));
      console.log('[Budget] AsyncStorage cleared successfully');
      
      try {
        await cloudSync.mergeAndPersist({ budget: null } as any);
        console.log('[Budget] Cloud sync completed successfully');
      } catch (cloudError) {
        console.error('[Budget] Cloud sync failed:', cloudError);
        throw cloudError;
      }
    } catch (e) {
      console.error('[Budget] clear error:', e);
      throw e;
    }
  }, [user?.id, cloudSync.mergeAndPersist]);

  return useMemo(() => ({ budget, setBudget, clearBudget, getBudgetForCurrentUser, loading }), [budget, setBudget, clearBudget, getBudgetForCurrentUser, loading]);
});
