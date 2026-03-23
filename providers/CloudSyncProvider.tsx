import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { Outfit, ClothingItem } from '@/types';
import { useAuth } from '@/providers/AuthProvider';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

type BudgetOption = '$100' | '$250' | '$500' | '$1000' | '$2000+';

interface StylePreferences {
  gender: string;
  ageRange: string;
  favoriteColors: string[];
  styleVibes: string[];
  occasions: string[];
  budgetRange: string;
  fashionGoals: string[];
  bodyType: string;
}

export interface CloudBlobV1 {
  version: 1;
  clothes?: ClothingItem[];
  savedOutfits?: Outfit[];
  session?: { ageGroup: string | null };
  budget?: BudgetOption | null;
  onboarding?: {
    completed: boolean;
    preferences: StylePreferences;
  } | null;
  updatedAt: string;
}

interface CloudSyncContextType {
  cloud: CloudBlobV1 | null;
  mergeAndPersist: (partial: Partial<CloudBlobV1>) => Promise<void>;
  isSyncing: boolean;
  lastError?: string | null;
  isInitialLoadComplete: boolean;
}

export const [CloudSyncProvider, useCloudSync] = createContextHook<CloudSyncContextType>(() => {
  const { user, isSessionValid } = useAuth();
  const [cloud, setCloud] = useState<CloudBlobV1 | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState<boolean>(false);
  const mountedRef = useRef<boolean>(true);
  const userIdRef = useRef<string | null>(null);
  const pendingSaveRef = useRef<CloudBlobV1 | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const canUseCloud = useCallback((userId: string | null): boolean => {
    if (!userId || userId === 'demo-user-id') return false;
    if (!isSupabaseConfigured) return false;
    return true;
  }, []);

  const fetchCloud = useCallback(async (userId: string | null) => {
    if (!userId) {
      if (mountedRef.current) {
        setCloud(null);
        setIsInitialLoadComplete(true);
      }
      return;
    }

    if (!canUseCloud(userId)) {
      console.log('[CloudSync] Cloud not available for user:', userId === 'demo-user-id' ? 'demo' : 'no config');
      if (mountedRef.current) {
        setCloud({ version: 1, updatedAt: new Date().toISOString() });
        setIsInitialLoadComplete(true);
      }
      return;
    }

    try {
      console.log('[CloudSync] Fetching cloud data for user:', userId);

      const { data, error } = await supabase
        .from('user_blobs')
        .select('*')
        .eq('id', userId)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[CloudSync] Fetch error:', error.message, 'Code:', error.code);
        if (mountedRef.current) {
          setLastError(error.message);
          setCloud({ version: 1, updatedAt: new Date().toISOString() });
          setIsInitialLoadComplete(true);
        }
        return;
      }

      const blob = data?.data as CloudBlobV1 | null ?? null;
      if (mountedRef.current) {
        if (blob) {
          console.log('[CloudSync] Cloud data loaded:', {
            clothesCount: blob.clothes?.length ?? 0,
            outfitsCount: blob.savedOutfits?.length ?? 0,
            hasBudget: !!blob.budget,
            hasOnboarding: !!blob.onboarding,
          });
          setCloud(blob);
          setLastError(null);
        } else {
          console.log('[CloudSync] No cloud data found, starting fresh');
          setCloud({ version: 1, updatedAt: new Date().toISOString() });
        }
        setIsInitialLoadComplete(true);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      console.warn('[CloudSync] Cloud fetch failed:', msg);
      if (mountedRef.current) {
        setLastError(msg);
        setCloud({ version: 1, updatedAt: new Date().toISOString() });
        setIsInitialLoadComplete(true);
      }
    }
  }, [canUseCloud]);

  const saveToCloud = useCallback(async (userId: string, blob: CloudBlobV1) => {
    if (!canUseCloud(userId)) return;

    setIsSyncing(true);
    try {
      console.log('[CloudSync] Saving to cloud for user:', userId);
      const { error } = await supabase
        .from('user_blobs')
        .upsert({ id: userId, data: blob }, { onConflict: 'id' });

      if (error) {
        console.warn('[CloudSync] Cloud save failed:', error.message);
        if (mountedRef.current) setLastError(error.message);

        if (error.message.includes('JWT') || error.message.includes('token') || error.code === 'PGRST301') {
          console.log('[CloudSync] Auth error detected, queuing save for later');
          pendingSaveRef.current = blob;
        }
      } else {
        console.log('[CloudSync] Saved to cloud successfully');
        if (mountedRef.current) setLastError(null);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      console.warn('[CloudSync] Cloud save error:', msg);
      if (mountedRef.current) setLastError(msg);
    } finally {
      if (mountedRef.current) setIsSyncing(false);
    }
  }, [canUseCloud]);

  useEffect(() => {
    const currentUserId = user?.id ?? null;
    if (userIdRef.current !== currentUserId) {
      userIdRef.current = currentUserId;
      setIsInitialLoadComplete(false);
      setLastError(null);
      void fetchCloud(currentUserId);
    }
  }, [user?.id, fetchCloud]);

  useEffect(() => {
    if (isSessionValid && pendingSaveRef.current && userIdRef.current) {
      console.log('[CloudSync] Session became valid, flushing pending save');
      const pending = pendingSaveRef.current;
      pendingSaveRef.current = null;
      void saveToCloud(userIdRef.current, pending);
    }
  }, [isSessionValid, saveToCloud]);

  const mergeAndPersist = useCallback(async (partial: Partial<CloudBlobV1>) => {
    const userId = userIdRef.current;
    if (!userId) {
      console.error('[CloudSync] Cannot save: No user ID');
      return;
    }

    setCloud(prevCloud => {
      const next: CloudBlobV1 = {
        version: 1,
        updatedAt: new Date().toISOString(),
        ...(prevCloud ?? {}),
        ...partial,
      } as CloudBlobV1;

      if (canUseCloud(userId)) {
        void saveToCloud(userId, next);
      }

      return next;
    });
  }, [canUseCloud, saveToCloud]);

  return useMemo(() => ({
    cloud,
    mergeAndPersist,
    isSyncing,
    lastError,
    isInitialLoadComplete,
  }), [cloud, mergeAndPersist, isSyncing, lastError, isInitialLoadComplete]);
});
