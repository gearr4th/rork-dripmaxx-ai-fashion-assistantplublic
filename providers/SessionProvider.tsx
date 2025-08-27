import React, { useCallback, useMemo, useState } from "react";
import createContextHook from "@nkzw/create-context-hook";

export type AgeGroup = '1-10' | '11-13' | '13-18' | '18-25' | '25-35' | '35+';

interface SessionContextType {
  ageGroup: AgeGroup | null;
  setAgeGroup: (age: AgeGroup) => void;
  resetSession: () => void;
}

export const [SessionProvider, useSession] = createContextHook<SessionContextType>(() => {
  const [ageGroup, setAgeGroupState] = useState<AgeGroup | null>(null);

  const setAgeGroup = useCallback((age: AgeGroup) => {
    console.log('[Session] setAgeGroup', age);
    setAgeGroupState(age);
  }, []);

  const resetSession = useCallback(() => {
    console.log('[Session] resetSession');
    setAgeGroupState(null);
  }, []);

  return useMemo(() => ({ ageGroup, setAgeGroup, resetSession }), [ageGroup, setAgeGroup, resetSession]);
});