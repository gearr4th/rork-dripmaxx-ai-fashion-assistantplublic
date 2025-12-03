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
      if (mountedRef.current) {
        setCloud(null);
        setIsInitialLoadComplete(true);
      }
      return;
    }
    try {
      console.log('[CloudSync] ========== FETCHING CLOUD DATA ==========');
      console.log('[CloudSync] User ID:', user.id);
      console.log('[CloudSync] Supabase session:', (await supabase.auth.getSession()).data.session?.user?.id || 'NO SESSION');
      
      const { data, error } = await supabase
        .from('user_blobs')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('[CloudSync] ❌ fetchCloud error:', JSON.stringify(error, null, 2));
        console.error('[CloudSync] fetchCloud error details:', { 
          message: error.message, 
          code: error.code,
          details: error.details,
          hint: error.hint 
        });
        if (mountedRef.current) {
          setLastError(`Cloud fetch failed: ${error.message}`);
          setIsInitialLoadComplete(true);
        }
        return;
      }

      const blob = data?.data ?? null;
      if (mountedRef.current) {
        if (blob) {
          console.log('[CloudSync] ✅ CLOUD DATA LOADED:', { 
            clothesCount: blob.clothes?.length ?? 0, 
            outfitsCount: blob.savedOutfits?.length ?? 0,
            budget: blob.budget,
            session: blob.session?.ageGroup
          });
          setCloud(blob);
        } else {
          console.log('[CloudSync] ⚠️  No cloud data found, creating empty');
          setCloud({ version: 1, updatedAt: new Date().toISOString() });
        }
        setIsInitialLoadComplete(true);
        console.log('[CloudSync] ========== CLOUD SYNC READY ==========');
      }
    } catch (e) {
      console.error('[CloudSync] ❌ fetchCloud exception:', e);
      console.error('[CloudSync] fetchCloud exception details:', {
        message: e instanceof Error ? e.message : 'Unknown error',
        stack: e instanceof Error ? e.stack : undefined,
        raw: JSON.stringify(e)
      });
      if (mountedRef.current) {
        setLastError(e instanceof Error ? e.message : 'Unknown error');
        setIsInitialLoadComplete(true);
      }
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
