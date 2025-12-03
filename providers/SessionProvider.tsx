import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { useAuth } from "@/providers/AuthProvider";
import { useCloudSync } from "@/providers/CloudSyncProvider";

export type AgeGroup = '1-10' | '11-13' | '13-18' | '18-25' | '25-35' | '35+';

interface SessionContextType {
  ageGroup: AgeGroup | null;
  setAgeGroup: (age: AgeGroup) => Promise<void>;
  resetSession: () => Promise<void>;
}

const KEY_FOR = (userId: string) => `session:${userId}` as const;

function ageToAgeGroup(age: number): AgeGroup {
  if (age <= 10) return '1-10';
  if (age <= 13) return '11-13';
  if (age <= 18) return '13-18';
  if (age <= 25) return '18-25';
  if (age <= 35) return '25-35';
  return '35+';
}

export const [SessionProvider, useSession] = createContextHook<SessionContextType>(() => {
  const { user } = useAuth();
  const cloudSync = useCloudSync();
  const [ageGroup, setAgeGroupState] = useState<AgeGroup | null>(null);
  const hasLoadedRef = useRef<string | null>(null);

  useEffect(() => {
    const uid = user?.id ?? 'guest';
    if (cloudSync.isInitialLoadComplete && hasLoadedRef.current !== uid) {
      hasLoadedRef.current = uid;
      void loadAsync(uid, cloudSync.cloud, user?.age);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, cloudSync.isInitialLoadComplete, cloudSync.cloud, user?.age]);

  const loadAsync = async (uid: string, cloud: typeof cloudSync.cloud, userAge?: number) => {
    try {
      console.log('[Session] ========== LOADING SESSION ==========');
      console.log('[Session] User:', uid);

      if (cloud?.session?.ageGroup) {
        const ag = (cloud.session.ageGroup as AgeGroup | null) ?? null;
        console.log('[Session] ✅ USING CLOUD DATA:', ag);
        setAgeGroupState(ag);
        await AsyncStorage.setItem(KEY_FOR(uid), JSON.stringify({ ageGroup: ag }));
        console.log('[Session] Cloud data saved to AsyncStorage as backup');
        return;
      }

      const raw = await AsyncStorage.getItem(KEY_FOR(uid));
      if (raw) {
        const parsed = JSON.parse(raw) as { ageGroup?: AgeGroup | null };
        console.log('[Session] 📁 Loaded from AsyncStorage (local backup):', parsed.ageGroup);
        setAgeGroupState(parsed.ageGroup ?? null);
      } else if (userAge) {
        const derivedGroup = ageToAgeGroup(userAge);
        console.log('[Session] 🔄 Auto-derived age group from user age:', userAge, '->', derivedGroup);
        setAgeGroupState(derivedGroup);
        await AsyncStorage.setItem(KEY_FOR(uid), JSON.stringify({ ageGroup: derivedGroup }));
      } else {
        console.log('[Session] ⚠️  No data found');
        setAgeGroupState(null);
      }
    } catch (e) {
      console.log('[Session] load error', e);
      setAgeGroupState(null);
    }
  };

  const persist = useCallback(async (next: { ageGroup: AgeGroup | null }) => {
    const uid = user?.id ?? 'guest';
    console.log('[Session] persisting ageGroup:', next.ageGroup, 'for user:', uid);
    setAgeGroupState(next.ageGroup);
    try {
      await AsyncStorage.setItem(KEY_FOR(uid), JSON.stringify(next));
      console.log('[Session] AsyncStorage saved successfully');
    } catch (e) {
      console.error('[Session] AsyncStorage save failed:', e);
      throw e;
    }
    try {
      await cloudSync.mergeAndPersist({ session: { ageGroup: next.ageGroup } as any });
      console.log('[Session] Cloud sync completed successfully');
    } catch (e) {
      console.error('[Session] Cloud persist error:', e);
      throw e;
    }
  }, [user?.id, cloudSync.mergeAndPersist]);

  const setAgeGroup = useCallback(async (age: AgeGroup) => {
    console.log('[Session] setAgeGroup', age);
    await persist({ ageGroup: age });
  }, [persist]);

  const resetSession = useCallback(async () => {
    console.log('[Session] resetSession');
    await persist({ ageGroup: null });
  }, [persist]);

  return useMemo(() => ({ ageGroup, setAgeGroup, resetSession }), [ageGroup, setAgeGroup, resetSession]);
});