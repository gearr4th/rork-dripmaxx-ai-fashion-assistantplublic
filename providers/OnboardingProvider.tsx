import { useState, useEffect, useMemo, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { useCloudSync } from "@/providers/CloudSyncProvider";

export interface StylePreferences {
  gender: string;
  ageRange: string;
  favoriteColors: string[];
  styleVibes: string[];
  occasions: string[];
  budgetRange: string;
  fashionGoals: string[];
  bodyType: string;
}

const ONBOARDING_KEY = "onboarding_completed";
const PREFERENCES_KEY = "style_preferences";

const defaultPreferences: StylePreferences = {
  gender: "",
  ageRange: "",
  favoriteColors: [],
  styleVibes: [],
  occasions: [],
  budgetRange: "",
  fashionGoals: [],
  bodyType: "",
};

export const [OnboardingProvider, useOnboarding] = createContextHook(() => {
  const cloudSync = useCloudSync();
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [preferences, setPreferences] = useState<StylePreferences>(defaultPreferences);
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);

  useEffect(() => {
    if (cloudSync.isInitialLoadComplete && !hasLoaded) {
      setHasLoaded(true);
      void loadOnboarding();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cloudSync.isInitialLoadComplete, hasLoaded]);

  const loadOnboarding = async () => {
    try {
      console.log("[Onboarding] ========== LOADING ==========");

      if (cloudSync.cloud?.onboarding) {
        console.log("[Onboarding] Using cloud data");
        setHasCompletedOnboarding(cloudSync.cloud.onboarding.completed);
        setPreferences(cloudSync.cloud.onboarding.preferences ?? defaultPreferences);
        await AsyncStorage.setItem(ONBOARDING_KEY, cloudSync.cloud.onboarding.completed ? "true" : "false");
        await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(cloudSync.cloud.onboarding.preferences ?? defaultPreferences));
        return;
      }

      const completed = await AsyncStorage.getItem(ONBOARDING_KEY);
      const stored = await AsyncStorage.getItem(PREFERENCES_KEY);
      console.log("[Onboarding] Loaded from local:", { completed: !!completed, hasPrefs: !!stored });
      setHasCompletedOnboarding(completed === "true");
      if (stored) {
        setPreferences(JSON.parse(stored));
      }
    } catch (e) {
      console.error("[Onboarding] Load error:", e);
      setHasCompletedOnboarding(false);
    }
  };

  const completeOnboarding = useCallback(async (prefs: StylePreferences) => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
      setPreferences(prefs);
      setHasCompletedOnboarding(true);
      console.log("[Onboarding] Completed with preferences");

      try {
        await cloudSync.mergeAndPersist({
          onboarding: { completed: true, preferences: prefs },
        } as any);
        console.log("[Onboarding] Synced to cloud");
      } catch (e) {
        console.warn("[Onboarding] Cloud sync failed:", e);
      }
    } catch (e) {
      console.error("[Onboarding] Save error:", e);
    }
  }, [cloudSync]);

  const updatePreferences = useCallback(async (prefs: Partial<StylePreferences>) => {
    try {
      const updated = { ...preferences, ...prefs };
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
      setPreferences(updated);
      console.log("[Onboarding] Preferences updated");

      try {
        await cloudSync.mergeAndPersist({
          onboarding: { completed: hasCompletedOnboarding === true, preferences: updated },
        } as any);
      } catch (e) {
        console.warn("[Onboarding] Cloud sync failed:", e);
      }
    } catch (e) {
      console.error("[Onboarding] Update error:", e);
    }
  }, [preferences, hasCompletedOnboarding, cloudSync]);

  const resetOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(ONBOARDING_KEY);
      await AsyncStorage.removeItem(PREFERENCES_KEY);
      setHasCompletedOnboarding(false);
      setPreferences(defaultPreferences);
      console.log("[Onboarding] Reset");

      try {
        await cloudSync.mergeAndPersist({
          onboarding: null,
        } as any);
      } catch (e) {
        console.warn("[Onboarding] Cloud sync failed:", e);
      }
    } catch (e) {
      console.error("[Onboarding] Reset error:", e);
    }
  }, [cloudSync]);

  return useMemo(() => ({
    hasCompletedOnboarding,
    preferences,
    completeOnboarding,
    updatePreferences,
    resetOnboarding,
  }), [hasCompletedOnboarding, preferences, completeOnboarding, updatePreferences, resetOnboarding]);
});
