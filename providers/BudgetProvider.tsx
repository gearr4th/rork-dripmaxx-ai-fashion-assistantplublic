import React, { useCallback, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useAuth } from '@/providers/AuthProvider';

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
  const [budget, setBudgetState] = useState<BudgetOption | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

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
    setBudgetState(null);
    if (user?.id) {
      void getBudgetForCurrentUser();
    }
  }, [user?.id, getBudgetForCurrentUser]);

  const setBudget = useCallback(async (b: BudgetOption) => {
    try {
      if (!user?.id) return;
      setBudgetState(b);
      await AsyncStorage.setItem(STORAGE_KEY_FOR(user.id), b);
    } catch (e) {
      console.log('[Budget] save error', e);
    }
  }, [user?.id]);

  const clearBudget = useCallback(async () => {
    try {
      if (!user?.id) return;
      setBudgetState(null);
      await AsyncStorage.removeItem(STORAGE_KEY_FOR(user.id));
    } catch (e) {
      console.log('[Budget] clear error', e);
    }
  }, [user?.id]);

  return useMemo(() => ({ budget, setBudget, clearBudget, getBudgetForCurrentUser, loading }), [budget, setBudget, clearBudget, getBudgetForCurrentUser, loading]);
});