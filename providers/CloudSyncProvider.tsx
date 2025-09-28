import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import createContextHook from '@nkzw/create-context-hook';
import { Outfit, ClothingItem } from '@/types';
import { useAuth } from '@/providers/AuthProvider';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '@/utils/config';

interface CloudBlobV1 {
  version: 1;
  clothes?: ClothingItem[];
  savedOutfits?: Outfit[];
  session?: { ageGroup: string | null };
  updatedAt: string;
}

interface CloudSyncContextType {
  cloud: CloudBlobV1 | null;
  mergeAndPersist: (partial: Partial<CloudBlobV1>) => Promise<void>;
  isSyncing: boolean;
  lastError?: string | null;
}

export const [CloudSyncProvider, useCloudSync] = createContextHook<CloudSyncContextType>(() => {
  const { user, accessToken } = useAuth();
  const [cloud, setCloud] = useState<CloudBlobV1 | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastError, setLastError] = useState<string | null>(null);
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
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/user_blobs?id=eq.${encodeURIComponent(user.id)}&select=*`, {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          Prefer: 'return=representation',
        },
      });
      if (!resp.ok) {
        const t = await resp.text();
        console.log('[CloudSync] fetchCloud error', resp.status, t);
        if (mountedRef.current) setLastError(`Cloud fetch failed: ${resp.status}`);
        return;
      }
      const rows = (await resp.json()) as Array<{ id: string; data: CloudBlobV1 }>; 
      const blob = rows?.[0]?.data ?? null;
      if (mountedRef.current) {
        if (blob) {
          setCloud(blob);
        } else {
          setCloud({ version: 1, updatedAt: new Date().toISOString() });
        }
      }
    } catch (e) {
      console.log('[CloudSync] fetchCloud exception', e);
      if (mountedRef.current) setLastError(e instanceof Error ? e.message : 'Unknown error');
    }
  }, [user?.id, accessToken]);

  useEffect(() => {
    void fetchCloud();
  }, [fetchCloud]);

  const mergeAndPersist = useCallback(async (partial: Partial<CloudBlobV1>) => {
    if (!user?.id) return;
    if (mountedRef.current) setIsSyncing(true);
    try {
      const next: CloudBlobV1 = {
        version: 1,
        updatedAt: new Date().toISOString(),
        ...(cloud ?? {}),
        ...partial,
      } as CloudBlobV1;
      if (mountedRef.current) setCloud(next);

      const body = [{ id: user.id, data: next }];
      const resp = await fetch(`${SUPABASE_URL}/rest/v1/user_blobs`, {
        method: 'POST',
        headers: {
          apikey: SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          Prefer: 'return=representation,resolution=merge-duplicates',
        },
        body: JSON.stringify(body),
      });
      if (!resp.ok) {
        const t = await resp.text();
        console.log('[CloudSync] upsert error', resp.status, t);
        if (mountedRef.current) setLastError(t || `Cloud save failed: ${resp.status}`);
      } else {
        if (mountedRef.current) setLastError(null);
      }
    } catch (e) {
      console.log('[CloudSync] upsert exception', e);
      if (mountedRef.current) setLastError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      if (mountedRef.current) setIsSyncing(false);
    }
  }, [user?.id, cloud, accessToken]);

  return useMemo(() => ({ cloud, mergeAndPersist, isSyncing, lastError }), [cloud, mergeAndPersist, isSyncing, lastError]);
});
