import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  const { cloud, mergeAndPersist } = useCloudSync();
  const [ageGroup, setAgeGroupState] = useState<AgeGroup | null>(null);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (cloud?.session) {
      const ag = (cloud.session.ageGroup as AgeGroup | null) ?? null;
      console.log('[Session] hydrate from cloud', ag);
      setAgeGroupState(ag);
      const uid = user?.id ?? 'guest';
      void AsyncStorage.setItem(KEY_FOR(uid), JSON.stringify({ ageGroup: ag }));
    }
  }, [cloud?.session, user?.id]);

  const load = async () => {
    try {
      const uid = user?.id ?? 'guest';
      const raw = await AsyncStorage.getItem(KEY_FOR(uid));
      if (raw) {
        const parsed = JSON.parse(raw) as { ageGroup?: AgeGroup | null };
        setAgeGroupState(parsed.ageGroup ?? null);
      } else if (user?.age) {
        const derivedGroup = ageToAgeGroup(user.age);
        console.log('[Session] Auto-derived age group from user age:', user.age, '->', derivedGroup);
        setAgeGroupState(derivedGroup);
        await AsyncStorage.setItem(KEY_FOR(uid), JSON.stringify({ ageGroup: derivedGroup }));
      } else {
        setAgeGroupState(null);
      }
    } catch (e) {
      console.log('[Session] load error', e);
      setAgeGroupState(null);
    }
  };

  const persist = async (next: { ageGroup: AgeGroup | null }) => {
    setAgeGroupState(next.ageGroup);
    const uid = user?.id ?? 'guest';
    await AsyncStorage.setItem(KEY_FOR(uid), JSON.stringify(next));
    try { await mergeAndPersist({ session: { ageGroup: next.ageGroup } as any }); } catch (e) { console.log('[Session] cloud persist error', e); }
  };

  const setAgeGroup = useCallback(async (age: AgeGroup) => {
    console.log('[Session] setAgeGroup', age);
    await persist({ ageGroup: age });
  }, []);

  const resetSession = useCallback(async () => {
    console.log('[Session] resetSession');
    await persist({ ageGroup: null });
  }, []);

  return useMemo(() => ({ ageGroup, setAgeGroup, resetSession }), [ageGroup, setAgeGroup, resetSession]);
});