import { useState, useEffect, useCallback, useMemo } from "react";
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
  const { cloud, mergeAndPersist } = useCloudSync();

  const STORAGE_KEY_FOR = useCallback((userId: string) => `clothes:${userId}`, []);

  useEffect(() => {
    void loadClothes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    if (cloud?.clothes) {
      console.log('[Clothes] hydrating from cloud');
      setClothes(cloud.clothes);
      void AsyncStorage.setItem(STORAGE_KEY_FOR(user?.id ?? 'guest'), JSON.stringify(cloud.clothes));
      setLoading(false);
    }
  }, [cloud?.clothes, STORAGE_KEY_FOR, user?.id]);

  const loadClothes = async () => {
    try {
      setLoading(true);
      const uid = user?.id ?? 'guest';
      const key = STORAGE_KEY_FOR(uid);

      const legacy = await AsyncStorage.getItem("clothes");
      if (legacy && !(await AsyncStorage.getItem(key))) {
        console.log('[Clothes] migrating legacy clothes to user-scoped storage');
        await AsyncStorage.setItem(key, legacy);
        await AsyncStorage.removeItem('clothes');
      }

      const stored = await AsyncStorage.getItem(key);
      if (stored) {
        setClothes(JSON.parse(stored) as ClothingItem[]);
        return;
      }

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
    } catch (error) {
      console.error("Failed to load clothes:", error);
    } finally {
      setLoading(false);
    }
  };

  const persist = async (items: ClothingItem[]) => {
    setClothes(items);
    const uid = user?.id ?? 'guest';
    await AsyncStorage.setItem(STORAGE_KEY_FOR(uid), JSON.stringify(items));
    try { await mergeAndPersist({ clothes: items }); } catch (e) { console.log('[Clothes] cloud persist error', e); }
  };

  const addClothingItem = useCallback(async (item: Omit<ClothingItem, "id">) => {
    const newItem: ClothingItem = {
      ...item,
      id: Date.now().toString(),
      dateAdded: new Date(),
    };
    const updated = [...clothes, newItem];
    await persist(updated);
  }, [clothes]);

  const addClothingItemWithAnalysis = useCallback(async (item: Omit<ClothingItem, "id" | "analysis">, analysis: ImageAnalysisResult) => {
    const newItem: ClothingItem = {
      ...item,
      id: Date.now().toString(),
      analysis,
      addedToWardrobe: true,
      dateAdded: new Date(),
    };
    const updated = [...clothes, newItem];
    await persist(updated);
  }, [clothes]);

  const removeClothingItem = useCallback(async (id: string) => {
    const updated = clothes.filter(item => item.id !== id);
    await persist(updated);
  }, [clothes]);

  const removeClothingItems = useCallback(async (ids: string[]) => {
    const idSet = new Set(ids);
    const updated = clothes.filter(item => !idSet.has(item.id));
    await persist(updated);
  }, [clothes]);

  const clearAll = useCallback(async () => {
    await persist([]);
  }, []);

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