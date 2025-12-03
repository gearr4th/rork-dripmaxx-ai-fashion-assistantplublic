import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { Outfit, ClothingItem } from '@/types';
import { useAuth } from '@/providers/AuthProvider';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

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
  const mountedRef = useRef<boolean>(true);
  const userIdRef = useRef<string | null>(null);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const fetchCloud = useCallback(async (userId: string | null) => {
    if (!userId) {
      if (mountedRef.current) {
        setCloud(null);
        setIsInitialLoadComplete(true);
      }
      return;
    }
    
    if (userId === 'demo-user-id') {
      console.log('[CloudSync] Demo user detected, using local storage only');
      if (mountedRef.current) {
        setCloud({ version: 1, updatedAt: new Date().toISOString() });
        setIsInitialLoadComplete(true);
      }
      return;
    }
    
    if (!isSupabaseConfigured) {
      console.warn('[CloudSync] Supabase not configured, using local storage');
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
        console.error('[CloudSync] Fetch error:', error.message);
        if (mountedRef.current) {
          setCloud({ version: 1, updatedAt: new Date().toISOString() });
          setIsInitialLoadComplete(true);
        }
        return;
      }

      const blob = data?.data ?? null;
      if (mountedRef.current) {
        if (blob) {
          console.log('[CloudSync] Cloud data loaded:', { 
            clothesCount: blob.clothes?.length ?? 0, 
            outfitsCount: blob.savedOutfits?.length ?? 0
          });
          setCloud(blob);
        } else {
          console.log('[CloudSync] No cloud data, starting fresh');
          setCloud({ version: 1, updatedAt: new Date().toISOString() });
        }
        setIsInitialLoadComplete(true);
      }
    } catch {
      console.warn('[CloudSync] Cloud fetch failed, using offline mode');
      if (mountedRef.current) {
        setCloud({ version: 1, updatedAt: new Date().toISOString() });
        setIsInitialLoadComplete(true);
      }
    }
  }, []);

  useEffect(() => {
    const currentUserId = user?.id ?? null;
    if (userIdRef.current !== currentUserId) {
      userIdRef.current = currentUserId;
      setIsInitialLoadComplete(false);
      void fetchCloud(currentUserId);
    }
  }, [user?.id, fetchCloud]);

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
      
      if (userId === 'demo-user-id') {
        console.log('[CloudSync] Demo user, data stored locally only');
        return next;
      }
      
      if (!isSupabaseConfigured) {
        console.warn('[CloudSync] Supabase not configured, local only');
        return next;
      }
      
      setIsSyncing(true);
      console.log('[CloudSync] Saving to cloud for user:', userId);
      
      (async () => {
        try {
          const { error } = await supabase
            .from('user_blobs')
            .upsert({ id: userId, data: next }, { onConflict: 'id' });
          
          if (error) {
            console.warn('[CloudSync] Cloud save failed:', error.message);
          } else {
            console.log('[CloudSync] Saved to cloud successfully');
            if (mountedRef.current) setLastError(null);
          }
        } catch {
          console.warn('[CloudSync] Cloud save error, data kept locally');
        } finally {
          if (mountedRef.current) setIsSyncing(false);
        }
      })();
      
      return next;
    });
  }, []);

  return useMemo(() => ({ cloud, mergeAndPersist, isSyncing, lastError, isInitialLoadComplete }), [cloud, mergeAndPersist, isSyncing, lastError, isInitialLoadComplete]);
});
