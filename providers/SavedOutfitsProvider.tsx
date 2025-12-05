import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { Outfit } from "@/types";
import { useAuth } from "@/providers/AuthProvider";
import { useCloudSync } from "@/providers/CloudSyncProvider";

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
  const cloudSync = useCloudSync();
  const [savedOutfits, setSavedOutfits] = useState<Outfit[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const hasLoadedRef = useRef<string | null>(null);

  useEffect(() => {
    const uid = user?.id ?? 'guest';
    if (cloudSync.isInitialLoadComplete && hasLoadedRef.current !== uid) {
      hasLoadedRef.current = uid;
      void loadAsync(uid, cloudSync.cloud);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, cloudSync.isInitialLoadComplete, cloudSync.cloud]);

  const loadAsync = async (uid: string, cloud: typeof cloudSync.cloud) => {
    try {
      setLoading(true);
      const key = KEY_FOR(uid);
      console.log('[SavedOutfits] ========== LOADING OUTFITS ==========');
      console.log('[SavedOutfits] User:', uid);

      if (cloud?.savedOutfits && cloud.savedOutfits.length > 0) {
        console.log('[SavedOutfits] ✅ USING CLOUD DATA:', cloud.savedOutfits.length, 'outfits');
        setSavedOutfits(cloud.savedOutfits);
        await AsyncStorage.setItem(key, JSON.stringify(cloud.savedOutfits));
        console.log('[SavedOutfits] Cloud data saved to AsyncStorage as backup');
        setLoading(false);
        return;
      }

      const legacy = await AsyncStorage.getItem(LEGACY_KEY);
      if (legacy && !(await AsyncStorage.getItem(key))) {
        console.log('[SavedOutfits] migrating legacy saved outfits to user-scoped storage');
        await AsyncStorage.setItem(key, legacy);
        await AsyncStorage.removeItem(LEGACY_KEY);
      }

      const raw = await AsyncStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw) as Outfit[];
        console.log('[SavedOutfits] 📁 Loaded', parsed.length, 'outfits from AsyncStorage (local backup)');
        setSavedOutfits(parsed);
      } else {
        console.log('[SavedOutfits] ⚠️  No data found');
        setSavedOutfits([]);
      }
    } catch (e) {
      console.error('[SavedOutfits] load error:', e);
    } finally {
      setLoading(false);
    }
  };

  const persist = useCallback(async (arr: Outfit[]) => {
    const uid = user?.id ?? 'guest';
    console.log('[SavedOutfits] Persisting', arr.length, 'outfits for user:', uid);
    setSavedOutfits(arr);
    try {
      await AsyncStorage.setItem(KEY_FOR(uid), JSON.stringify(arr));
      console.log('[SavedOutfits] AsyncStorage saved successfully');
    } catch (e) {
      console.error('[SavedOutfits] AsyncStorage save failed:', e);
      throw e;
    }
    try {
      await cloudSync.mergeAndPersist({ savedOutfits: arr });
      console.log('[SavedOutfits] Cloud sync completed successfully');
    } catch (e) {
      console.error('[SavedOutfits] Cloud persist error:', e);
      throw e;
    }
  }, [user?.id, cloudSync.mergeAndPersist]);

  const saveOutfit = useCallback(async (outfit: Outfit) => {
    const exists = savedOutfits.some(o => o.id === outfit.id);
    console.log('[SavedOutfits]', exists ? 'Updating' : 'Adding', 'outfit:', outfit.id);
    const updated = exists
      ? savedOutfits.map(o => (o.id === outfit.id ? outfit : o))
      : [outfit, ...savedOutfits];
    await persist(updated);
    console.log('[SavedOutfits] Outfit saved successfully. Total outfits:', updated.length);
  }, [savedOutfits, persist]);

  const removeOutfit = useCallback(async (id: string) => {
    console.log('[SavedOutfits] Removing outfit:', id);
    const updated = savedOutfits.filter(o => o.id !== id);
    await persist(updated);
    console.log('[SavedOutfits] Outfit removed successfully. Remaining outfits:', updated.length);
  }, [savedOutfits, persist]);

  const clearAll = useCallback(async () => {
    console.log('[SavedOutfits] Clearing all outfits');
    await persist([]);
    console.log('[SavedOutfits] All outfits cleared successfully');
  }, [persist]);

  return useMemo(() => ({ savedOutfits, saveOutfit, removeOutfit, clearAll, loading }), [savedOutfits, saveOutfit, removeOutfit, clearAll, loading]);
});
