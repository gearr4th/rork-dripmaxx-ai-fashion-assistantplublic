import { useState, useEffect, useMemo, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";

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
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [preferences, setPreferences] = useState<StylePreferences>(defaultPreferences);

  useEffect(() => {
    const load = async () => {
      try {
        const completed = await AsyncStorage.getItem(ONBOARDING_KEY);
        const stored = await AsyncStorage.getItem(PREFERENCES_KEY);
        console.log("[Onboarding] Loaded:", { completed: !!completed, hasPrefs: !!stored });
        setHasCompletedOnboarding(completed === "true");
        if (stored) {
          setPreferences(JSON.parse(stored));
        }
      } catch (e) {
        console.error("[Onboarding] Load error:", e);
        setHasCompletedOnboarding(false);
      }
    };
    void load();
  }, []);

  const completeOnboarding = useCallback(async (prefs: StylePreferences) => {
    try {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(prefs));
      setPreferences(prefs);
      setHasCompletedOnboarding(true);
      console.log("[Onboarding] Completed with preferences:", prefs);
    } catch (e) {
      console.error("[Onboarding] Save error:", e);
    }
  }, []);

  const updatePreferences = useCallback(async (prefs: Partial<StylePreferences>) => {
    try {
      const updated = { ...preferences, ...prefs };
      await AsyncStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
      setPreferences(updated);
      console.log("[Onboarding] Preferences updated:", updated);
    } catch (e) {
      console.error("[Onboarding] Update error:", e);
    }
  }, [preferences]);

  const resetOnboarding = useCallback(async () => {
    try {
      await AsyncStorage.removeItem(ONBOARDING_KEY);
      await AsyncStorage.removeItem(PREFERENCES_KEY);
      setHasCompletedOnboarding(false);
      setPreferences(defaultPreferences);
      console.log("[Onboarding] Reset");
    } catch (e) {
      console.error("[Onboarding] Reset error:", e);
    }
  }, []);

  return useMemo(() => ({
    hasCompletedOnboarding,
    preferences,
    completeOnboarding,
    updatePreferences,
    resetOnboarding,
  }), [hasCompletedOnboarding, preferences, completeOnboarding, updatePreferences, resetOnboarding]);
});
