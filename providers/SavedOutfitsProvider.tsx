import React, { useCallback, useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { Outfit } from "@/types";
import { useAuth } from "@/providers/AuthProvider";

interface SavedOutfitsContextType {
  savedOutfits: Outfit[];
  saveOutfit: (outfit: Outfit) => Promise<void>;
  removeOutfit: (id: string) => Promise<void>;
  clearAll: () => Promise<void>;
  loading: boolean;
}

const KEY_FOR = (userId: string) => `savedOutfits:${userId}` as const;
const LEGACY_KEY = "savedOutfits" as const;

export const [SavedOutfitsProvider, useSavedOutfits] = createContextHook<SavedOutfitsContextType>(() => {
  const { user } = useAuth();
  const [savedOutfits, setSavedOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const load = async () => {
    try {
      setLoading(true);
      const uid = user?.id ?? 'guest';
      const key = KEY_FOR(uid);

      const legacy = await AsyncStorage.getItem(LEGACY_KEY);
      if (legacy && !(await AsyncStorage.getItem(key))) {
        console.log('[SavedOutfits] migrating legacy saved outfits to user-scoped storage');
        await AsyncStorage.setItem(key, legacy);
        await AsyncStorage.removeItem(LEGACY_KEY);
      }

      const raw = await AsyncStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as Outfit[];
        setSavedOutfits(parsed);
      } else {
        setSavedOutfits([]);
      }
    } catch (e) {
      console.log("[SavedOutfits] load error", e);
    } finally {
      setLoading(false);
    }
  };

  const persist = async (arr: Outfit[]) => {
    setSavedOutfits(arr);
    const uid = user?.id ?? 'guest';
    await AsyncStorage.setItem(KEY_FOR(uid), JSON.stringify(arr));
  };

  const saveOutfit = useCallback(async (outfit: Outfit) => {
    const exists = savedOutfits.some(o => o.id === outfit.id);
    const updated = exists
      ? savedOutfits.map(o => (o.id === outfit.id ? outfit : o))
      : [outfit, ...savedOutfits];
    await persist(updated);
  }, [savedOutfits]);

  const removeOutfit = useCallback(async (id: string) => {
    const updated = savedOutfits.filter(o => o.id !== id);
    await persist(updated);
  }, [savedOutfits]);

  const clearAll = useCallback(async () => {
    await persist([]);
  }, []);

  return useMemo(() => ({ savedOutfits, saveOutfit, removeOutfit, clearAll, loading }), [savedOutfits, saveOutfit, removeOutfit, clearAll, loading]);
});