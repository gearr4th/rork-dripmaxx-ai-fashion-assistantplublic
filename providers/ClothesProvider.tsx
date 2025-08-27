import React, { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { ClothingItem } from "@/types";

interface ClothesContextType {
  clothes: ClothingItem[];
  addClothingItem: (item: Omit<ClothingItem, "id">) => Promise<void>;
  removeClothingItem: (id: string) => Promise<void>;
  loading: boolean;
}

export const [ClothesProvider, useClothes] = createContextHook<ClothesContextType>(() => {
  const [clothes, setClothes] = useState<ClothingItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClothes();
  }, []);

  const loadClothes = async () => {
    try {
      const stored = await AsyncStorage.getItem("clothes");
      if (stored) {
        setClothes(JSON.parse(stored));
      } else {
        // Add some demo items
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
        ];
        setClothes(demoItems);
        await AsyncStorage.setItem("clothes", JSON.stringify(demoItems));
      }
    } catch (error) {
      console.error("Failed to load clothes:", error);
    } finally {
      setLoading(false);
    }
  };

  const addClothingItem = async (item: Omit<ClothingItem, "id">) => {
    const newItem: ClothingItem = {
      ...item,
      id: Date.now().toString(),
    };
    const updated = [...clothes, newItem];
    setClothes(updated);
    await AsyncStorage.setItem("clothes", JSON.stringify(updated));
  };

  const removeClothingItem = async (id: string) => {
    const updated = clothes.filter(item => item.id !== id);
    setClothes(updated);
    await AsyncStorage.setItem("clothes", JSON.stringify(updated));
  };

  return {
    clothes,
    addClothingItem,
    removeClothingItem,
    loading,
  };
});