import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { ClothingItem, ImageAnalysisResult } from "@/types";
import { useAuth } from "@/providers/AuthProvider";
import { useCloudSync } from "@/providers/CloudSyncProvider";

interface ClothesContextType {
  clothes: ClothingItem[];
  addClothingItem: (item: Omit<ClothingItem, "id">) => Promise<void>;
  addClothingItemWithAnalysis: (item: Omit<ClothingItem, "id" | "analysis">, analysis: ImageAnalysisResult) => Promise<void>;
  removeClothingItem: (id: string) => Promise<void>;
  removeClothingItems: (ids: string[]) => Promise<void>;
  clearAll: () => Promise<void>;
  loading: boolean;
}

export const [ClothesProvider, useClothes] = createContextHook<ClothesContextType>(() => {
  const { user } = useAuth();
  const [clothes, setClothes] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const cloudSync = useCloudSync();
  const hasLoadedRef = useRef<string | null>(null);

  const STORAGE_KEY_FOR = useCallback((userId: string) => `clothes:${userId}`, []);

  useEffect(() => {
    const uid = user?.id ?? 'guest';
    if (cloudSync.isInitialLoadComplete && hasLoadedRef.current !== uid) {
      hasLoadedRef.current = uid;
      void loadClothesAsync(uid, cloudSync.cloud);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, cloudSync.isInitialLoadComplete, cloudSync.cloud, STORAGE_KEY_FOR]);

  const loadClothesAsync = async (uid: string, cloud: typeof cloudSync.cloud) => {
    try {
      setLoading(true);
      const key = STORAGE_KEY_FOR(uid);
      console.log('[Clothes] ========== LOADING CLOTHES ==========');
      console.log('[Clothes] User:', uid);

      if (cloud?.clothes && cloud.clothes.length > 0) {
        console.log('[Clothes] ✅ USING CLOUD DATA:', cloud.clothes.length, 'items');
        setClothes(cloud.clothes);
        await AsyncStorage.setItem(key, JSON.stringify(cloud.clothes));
        console.log('[Clothes] Cloud data saved to AsyncStorage as backup');
        setLoading(false);
        return;
      }

      const legacy = await AsyncStorage.getItem("clothes");
      if (legacy && !(await AsyncStorage.getItem(key))) {
        console.log('[Clothes] migrating legacy clothes to user-scoped storage');
        await AsyncStorage.setItem(key, legacy);
        await AsyncStorage.removeItem('clothes');
      }

      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored) as ClothingItem[];
        console.log('[Clothes] 📁 Loaded', parsed.length, 'items from AsyncStorage (local backup)');
        setClothes(parsed);
        return;
      }
      console.log('[Clothes] ⚠️  No data found, loading demo items');

      const demoItems: ClothingItem[] = [
        {
          id: "1",
          name: "Black Leather Jacket",
          type: "tops",
          color: "#000000",
          brand: "Zara",
          imageUrl: "https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400",
        },
        {
          id: "2",
          name: "White T-Shirt",
          type: "tops",
          color: "#FFFFFF",
          brand: "H&M",
          imageUrl: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400",
        },
        {
          id: "3",
          name: "Blue Jeans",
          type: "bottoms",
          color: "#0000FF",
          brand: "Levi's",
          imageUrl: "https://images.unsplash.com/photo-1542272604-787c3835535d?w=400",
        },
        {
          id: "4",
          name: "White Sneakers",
          type: "shoes",
          color: "#FFFFFF",
          brand: "Nike",
          imageUrl: "https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=400",
        },
        {
          id: "5",
          name: "Running Shorts",
          type: "bottoms",
          color: "#222222",
          brand: "Nike",
          imageUrl: "https://images.unsplash.com/photo-1554344728-77cf90d9ed26?w=400",
        },
        {
          id: "6",
          name: "Dri-Fit Running Tee",
          type: "tops",
          color: "#333333",
          brand: "Nike",
          imageUrl: "https://images.unsplash.com/photo-1551292831-023188e78222?w=400",
        },
        {
          id: "7",
          name: "Running Shoes Pegasus",
          type: "shoes",
          color: "#DDDDDD",
          brand: "Nike",
          imageUrl: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400",
        },
        {
          id: "8",
          name: "Soccer Jersey",
          type: "tops",
          color: "#0A84FF",
          brand: "Adidas",
          imageUrl: "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400",
        },
        {
          id: "9",
          name: "Soccer Shorts",
          type: "bottoms",
          color: "#000000",
          brand: "Adidas",
          imageUrl: "https://images.unsplash.com/photo-1520975731486-c0d71c465fa8?w=400",
        },
        {
          id: "10",
          name: "Soccer Cleats Predator",
          type: "shoes",
          color: "#111111",
          brand: "Adidas",
          imageUrl: "https://images.unsplash.com/photo-1519741497674-611481863552?w=400",
        },
      ];
      setClothes(demoItems);
      await AsyncStorage.setItem(key, JSON.stringify(demoItems));
      console.log('[Clothes] Demo items saved to AsyncStorage');
    } catch (error) {
      console.error('[Clothes] Failed to load clothes:', error);
    } finally {
      setLoading(false);
    }
  };

  const persist = useCallback(async (items: ClothingItem[]) => {
    const uid = user?.id ?? 'guest';
    console.log('[Clothes] Persisting', items.length, 'items for user:', uid);
    setClothes(items);
    try {
      await AsyncStorage.setItem(STORAGE_KEY_FOR(uid), JSON.stringify(items));
      console.log('[Clothes] AsyncStorage saved successfully');
    } catch (e) {
      console.error('[Clothes] AsyncStorage save failed:', e);
      throw e;
    }
    try {
      await cloudSync.mergeAndPersist({ clothes: items });
      console.log('[Clothes] Cloud sync completed successfully');
    } catch (e) {
      console.error('[Clothes] Cloud persist error:', e);
      throw e;
    }
  }, [user?.id, cloudSync.mergeAndPersist, STORAGE_KEY_FOR]);

  const addClothingItem = useCallback(async (item: Omit<ClothingItem, "id">) => {
    console.log('[Clothes] Adding new item:', item.name);
    const newItem: ClothingItem = {
      ...item,
      id: Date.now().toString(),
      dateAdded: new Date(),
    };
    const updated = [...clothes, newItem];
    await persist(updated);
    console.log('[Clothes] Item added successfully. Total items:', updated.length);
  }, [clothes, persist]);

  const addClothingItemWithAnalysis = useCallback(async (item: Omit<ClothingItem, "id" | "analysis">, analysis: ImageAnalysisResult) => {
    console.log('[Clothes] Adding new item with analysis:', item.name);
    const newItem: ClothingItem = {
      ...item,
      id: Date.now().toString(),
      analysis,
      addedToWardrobe: true,
      dateAdded: new Date(),
    };
    const updated = [...clothes, newItem];
    await persist(updated);
    console.log('[Clothes] Item with analysis added successfully. Total items:', updated.length);
  }, [clothes, persist]);

  const removeClothingItem = useCallback(async (id: string) => {
    console.log('[Clothes] Removing item:', id);
    const updated = clothes.filter(item => item.id !== id);
    await persist(updated);
    console.log('[Clothes] Item removed successfully. Remaining items:', updated.length);
  }, [clothes, persist]);

  const removeClothingItems = useCallback(async (ids: string[]) => {
    console.log('[Clothes] Removing', ids.length, 'items');
    const idSet = new Set(ids);
    const updated = clothes.filter(item => !idSet.has(item.id));
    await persist(updated);
    console.log('[Clothes] Items removed successfully. Remaining items:', updated.length);
  }, [clothes, persist]);

  const clearAll = useCallback(async () => {
    console.log('[Clothes] Clearing all items');
    await persist([]);
    console.log('[Clothes] All items cleared successfully');
  }, [persist]);

  return useMemo(() => ({
    clothes,
    addClothingItem,
    addClothingItemWithAnalysis,
    removeClothingItem,
    removeClothingItems,
    clearAll,
    loading,
  }), [clothes, addClothingItem, addClothingItemWithAnalysis, removeClothingItem, removeClothingItems, clearAll, loading]);
});