import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { Outfit, ClothingItem } from '@/types';
import { useAuth } from '@/providers/AuthProvider';
import { supabase } from '@/lib/supabase';

type BudgetOption = '$100' | '$250' | '$500' | '$1000' | '$2000+';

interface CloudBlobV1 {
  version: 1;
  clothes?: ClothingItem[];
  savedOutfits?: Outfit[];
  session?: { ageGroup: string | null };
  budget?: BudgetOption | null;
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
  const { user } = useAuth();
  const [cloud, setCloud] = useState<CloudBlobV1 | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastError, setLastError] = useState<string | null>(null);
  const [isInitialLoadComplete, setIsInitialLoadComplete] = useState<boolean>(false);
  const mountedRef = useRef<boolean>(false);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchCloud = useCallback(async () => {
    if (!user?.id) {
      if (mountedRef.current) setCloud(null);
      return;
    }
    try {
      console.log('[CloudSync] fetchCloud for user', user.id);
      const { data, error } = await supabase
        .from('user_blobs')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[CloudSync] fetchCloud error:', error);
        if (mountedRef.current) setLastError(`Cloud fetch failed: ${error.message}`);
        return;
      }

      const blob = data?.data ?? null;
      if (mountedRef.current) {
        if (blob) {
          console.log('[CloudSync] Loaded cloud data:', { 
            hasClothes: !!blob.clothes, 
            hasSavedOutfits: !!blob.savedOutfits,
            hasBudget: !!blob.budget,
            hasSession: !!blob.session 
          });
          setCloud(blob);
        } else {
          console.log('[CloudSync] No cloud data found, creating empty');
          setCloud({ version: 1, updatedAt: new Date().toISOString() });
        }
        setIsInitialLoadComplete(true);
      }
    } catch (e) {
      console.error('[CloudSync] fetchCloud exception:', e);
      if (mountedRef.current) setLastError(e instanceof Error ? e.message : 'Unknown error');
    }
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) {
      setIsInitialLoadComplete(true);
    }
  }, [user?.id]);

  useEffect(() => {
    void fetchCloud();
  }, [fetchCloud]);

  const mergeAndPersist = useCallback(async (partial: Partial<CloudBlobV1>) => {
    if (!user?.id) {
      console.error('[CloudSync] Cannot save: No user ID');
      return;
    }
    if (mountedRef.current) setIsSyncing(true);
    try {
      const next: CloudBlobV1 = {
        version: 1,
        updatedAt: new Date().toISOString(),
        ...(cloud ?? {}),
        ...partial,
      } as CloudBlobV1;
      if (mountedRef.current) setCloud(next);

      console.log('[CloudSync] Saving to cloud:', { 
        hasClothes: !!next.clothes, 
        hasSavedOutfits: !!next.savedOutfits,
        hasBudget: !!next.budget,
        hasSession: !!next.session,
        userId: user.id
      });

      const { error } = await supabase
        .from('user_blobs')
        .upsert({ id: user.id, data: next }, { onConflict: 'id' });

      if (error) {
        console.error('[CloudSync] upsert error:', error);
        if (mountedRef.current) setLastError(error.message || 'Cloud save failed');
        throw new Error(`Cloud save failed: ${error.message}`);
      } else {
        console.log('[CloudSync] Successfully saved to cloud');
        if (mountedRef.current) setLastError(null);
      }
    } catch (e) {
      console.error('[CloudSync] upsert exception:', e);
      if (mountedRef.current) setLastError(e instanceof Error ? e.message : 'Unknown error');
      throw e;
    } finally {
      if (mountedRef.current) setIsSyncing(false);
    }
  }, [user?.id, cloud]);

  return useMemo(() => ({ cloud, mergeAndPersist, isSyncing, lastError, isInitialLoadComplete }), [cloud, mergeAndPersist, isSyncing, lastError, isInitialLoadComplete]);
});
