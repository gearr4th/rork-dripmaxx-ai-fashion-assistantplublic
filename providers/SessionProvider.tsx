import React, { useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { useAuth } from "@/providers/AuthProvider";

export type AgeGroup = '1-10' | '11-13' | '13-18' | '18-25' | '25-35' | '35+';

interface SessionContextType {
  ageGroup: AgeGroup | null;
  setAgeGroup: (age: AgeGroup) => Promise<void>;
  resetSession: () => Promise<void>;
}

const KEY_FOR = (userId: string) => `session:${userId}` as const;

export const [SessionProvider, useSession] = createContextHook<SessionContextType>(() => {
  const { user } = useAuth();
  const [ageGroup, setAgeGroupState] = useState<AgeGroup | null>(null);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const load = async () => {
    try {
      const uid = user?.id ?? 'guest';
      const raw = await AsyncStorage.getItem(KEY_FOR(uid));
      if (raw) {
        const parsed = JSON.parse(raw) as { ageGroup?: AgeGroup | null };
        setAgeGroupState(parsed.ageGroup ?? null);
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