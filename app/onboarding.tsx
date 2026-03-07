import React, { useState, useRef, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  ScrollView,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Palette,
  Shirt,
  Target,
  Wallet,
  Heart,
  UserRound,
  Flame,
  Check,
} from "lucide-react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import { useOnboarding, StylePreferences } from "@/providers/OnboardingProvider";

interface StepConfig {
  key: keyof StylePreferences;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  type: "single" | "multi";
  options: { id: string; label: string; emoji: string }[];
  minSelections?: number;
  maxSelections?: number;
}

const STEPS: StepConfig[] = [
  {
    key: "gender",
    title: "How do you identify?",
    subtitle: "This helps us tailor outfit suggestions to you",
    icon: <UserRound color="#FB923C" size={28} />,
    type: "single",
    options: [
      { id: "male", label: "Male", emoji: "👔" },
      { id: "female", label: "Female", emoji: "👗" },
      { id: "non-binary", label: "Non-Binary", emoji: "✨" },
      { id: "prefer-not", label: "Prefer not to say", emoji: "🤍" },
    ],
  },
  {
    key: "ageRange",
    title: "What's your age range?",
    subtitle: "We'll match trends relevant to your generation",
    icon: <Flame color="#FB923C" size={28} />,
    type: "single",
    options: [
      { id: "16-21", label: "16 – 21", emoji: "🧊" },
      { id: "22-28", label: "22 – 28", emoji: "🔥" },
      { id: "29-35", label: "29 – 35", emoji: "💎" },
      { id: "36-45", label: "36 – 45", emoji: "🏆" },
      { id: "46+", label: "46+", emoji: "👑" },
    ],
  },
  {
    key: "bodyType",
    title: "What's your body type?",
    subtitle: "Better fit recommendations for your frame",
    icon: <UserRound color="#FB923C" size={28} />,
    type: "single",
    options: [
      { id: "slim", label: "Slim / Lean", emoji: "🪶" },
      { id: "athletic", label: "Athletic / Fit", emoji: "💪" },
      { id: "average", label: "Average", emoji: "👤" },
      { id: "curvy", label: "Curvy", emoji: "🌊" },
      { id: "plus", label: "Plus Size", emoji: "🌟" },
      { id: "prefer-not", label: "Prefer not to say", emoji: "🤍" },
    ],
  },
  {
    key: "favoriteColors",
    title: "Pick your go-to colors",
    subtitle: "Select 2-5 colors you love wearing",
    icon: <Palette color="#FB923C" size={28} />,
    type: "multi",
    minSelections: 2,
    maxSelections: 5,
    options: [
      { id: "black", label: "Black", emoji: "🖤" },
      { id: "white", label: "White", emoji: "🤍" },
      { id: "navy", label: "Navy", emoji: "💙" },
      { id: "grey", label: "Grey", emoji: "🩶" },
      { id: "beige", label: "Beige / Cream", emoji: "🧈" },
      { id: "brown", label: "Brown / Earth", emoji: "🤎" },
      { id: "olive", label: "Olive / Green", emoji: "💚" },
      { id: "burgundy", label: "Burgundy / Wine", emoji: "🍷" },
      { id: "pastel", label: "Pastels", emoji: "🌸" },
      { id: "bright", label: "Bold & Bright", emoji: "🌈" },
    ],
  },
  {
    key: "styleVibes",
    title: "What's your style vibe?",
    subtitle: "Pick 2-4 that resonate with you",
    icon: <Shirt color="#FB923C" size={28} />,
    type: "multi",
    minSelections: 2,
    maxSelections: 4,
    options: [
      { id: "streetwear", label: "Streetwear", emoji: "🛹" },
      { id: "minimalist", label: "Minimalist", emoji: "◻️" },
      { id: "casual", label: "Casual / Laid-back", emoji: "☀️" },
      { id: "smart-casual", label: "Smart Casual", emoji: "🧥" },
      { id: "preppy", label: "Preppy / Classic", emoji: "⛵" },
      { id: "athleisure", label: "Athleisure", emoji: "🏃" },
      { id: "bohemian", label: "Bohemian", emoji: "🌻" },
      { id: "edgy", label: "Edgy / Alt", emoji: "⛓️" },
      { id: "vintage", label: "Vintage / Retro", emoji: "📻" },
      { id: "luxury", label: "Luxury / High-end", emoji: "💰" },
    ],
  },
  {
    key: "occasions",
    title: "Where do you dress up for?",
    subtitle: "Pick your most common occasions",
    icon: <Target color="#FB923C" size={28} />,
    type: "multi",
    minSelections: 1,
    maxSelections: 5,
    options: [
      { id: "work", label: "Work / Office", emoji: "💼" },
      { id: "casual", label: "Day-to-Day", emoji: "🏠" },
      { id: "dates", label: "Dates", emoji: "❤️" },
      { id: "parties", label: "Parties & Nights Out", emoji: "🎉" },
      { id: "gym", label: "Gym & Active", emoji: "🏋️" },
      { id: "travel", label: "Travel", emoji: "✈️" },
      { id: "formal", label: "Formal Events", emoji: "🎩" },
      { id: "brunch", label: "Brunch & Socials", emoji: "🥂" },
    ],
  },
  {
    key: "budgetRange",
    title: "What's your monthly budget?",
    subtitle: "We'll keep recommendations wallet-friendly",
    icon: <Wallet color="#FB923C" size={28} />,
    type: "single",
    options: [
      { id: "under-50", label: "Under $50", emoji: "💵" },
      { id: "50-150", label: "$50 – $150", emoji: "💰" },
      { id: "150-300", label: "$150 – $300", emoji: "💳" },
      { id: "300-500", label: "$300 – $500", emoji: "💎" },
      { id: "500+", label: "$500+", emoji: "👑" },
      { id: "no-limit", label: "No limit", emoji: "♾️" },
    ],
  },
  {
    key: "fashionGoals",
    title: "What are your fashion goals?",
    subtitle: "What do you want DripMaxx to help with?",
    icon: <Heart color="#FB923C" size={28} />,
    type: "multi",
    minSelections: 1,
    maxSelections: 4,
    options: [
      { id: "daily-outfits", label: "Daily outfit ideas", emoji: "📅" },
      { id: "build-wardrobe", label: "Build a better wardrobe", emoji: "🧱" },
      { id: "try-new", label: "Try new styles", emoji: "🧪" },
      { id: "save-money", label: "Save money on clothes", emoji: "🐷" },
      { id: "impress", label: "Dress to impress", emoji: "🔥" },
      { id: "confidence", label: "Feel more confident", emoji: "💪" },
      { id: "sustainable", label: "Shop sustainably", emoji: "🌿" },
      { id: "trend-aware", label: "Stay on trend", emoji: "📈" },
    ],
  },
];

export default function OnboardingScreen() {
  const { completeOnboarding } = useOnboarding();
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [selections, setSelections] = useState<Record<string, string | string[]>>({});
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  const totalSteps = STEPS.length;

  const animateTransition = useCallback((direction: "forward" | "back", callback: () => void) => {
    const exitValue = direction === "forward" ? -40 : 40;
    const enterValue = direction === "forward" ? 40 : -40;

    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: exitValue, duration: 150, useNativeDriver: true }),
    ]).start(() => {
      callback();
      slideAnim.setValue(enterValue);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 250, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 250, useNativeDriver: true }),
      ]).start();
    });
  }, [fadeAnim, slideAnim]);

  const animateProgress = useCallback((step: number) => {
    Animated.timing(progressAnim, {
      toValue: (step + 1) / totalSteps,
      duration: 400,
      useNativeDriver: false,
    }).start();
  }, [progressAnim, totalSteps]);

  const handleSelect = useCallback((stepKey: string, optionId: string, type: "single" | "multi", max?: number) => {
    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setSelections((prev) => {
      if (type === "single") {
        return { ...prev, [stepKey]: optionId };
      }
      const current = (prev[stepKey] as string[]) || [];
      if (current.includes(optionId)) {
        return { ...prev, [stepKey]: current.filter((id) => id !== optionId) };
      }
      if (max && current.length >= max) {
        return prev;
      }
      return { ...prev, [stepKey]: [...current, optionId] };
    });
  }, []);

  const canProceed = useMemo(() => {
    if (currentStep < 0) return true;
    const step = STEPS[currentStep];
    const val = selections[step.key];
    if (step.type === "single") return !!val;
    const arr = (val as string[]) || [];
    return arr.length >= (step.minSelections || 1);
  }, [currentStep, selections]);

  const handleComplete = useCallback(async () => {
    if (Platform.OS !== "web") {
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const prefs: StylePreferences = {
      gender: (selections.gender as string) || "",
      ageRange: (selections.ageRange as string) || "",
      bodyType: (selections.bodyType as string) || "",
      favoriteColors: (selections.favoriteColors as string[]) || [],
      styleVibes: (selections.styleVibes as string[]) || [],
      occasions: (selections.occasions as string[]) || [],
      budgetRange: (selections.budgetRange as string) || "",
      fashionGoals: (selections.fashionGoals as string[]) || [],
    };

    await completeOnboarding(prefs);
    router.replace("/(tabs)" as any);
  }, [selections, completeOnboarding]);

  const handleNext = useCallback(() => {
    if (!canProceed) return;

    if (Platform.OS !== "web") {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    Animated.sequence([
      Animated.timing(buttonScale, { toValue: 0.95, duration: 80, useNativeDriver: true }),
      Animated.timing(buttonScale, { toValue: 1, duration: 80, useNativeDriver: true }),
    ]).start();

    if (currentStep >= totalSteps - 1) {
      void handleComplete();
      return;
    }

    animateTransition("forward", () => {
      const next = currentStep + 1;
      setCurrentStep(next);
      animateProgress(next);
    });
  }, [canProceed, currentStep, totalSteps, animateTransition, animateProgress, buttonScale, handleComplete]);

  const handleBack = useCallback(() => {
    if (currentStep <= -1) return;
    animateTransition("back", () => {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      if (prev >= 0) animateProgress(prev);
    });
  }, [currentStep, animateTransition, animateProgress]);


  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ["0%", "100%"],
  });

  const renderWelcome = () => (
    <View style={styles.welcomeContainer}>
      <View style={styles.welcomeIconWrap}>
        <LinearGradient
          colors={["#F97316", "#EA580C", "#C2410C"]}
          style={styles.welcomeIconGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Sparkles color="#FFFFFF" size={48} />
        </LinearGradient>
      </View>
      <Text style={styles.welcomeTitle}>Welcome to{"\n"}DripMaxx AI</Text>
      <Text style={styles.welcomeSubtitle}>
        Let's learn about your style so we can give you{"\n"}personalised outfit recommendations
      </Text>
      <View style={styles.welcomeFeatures}>
        {[
          { icon: "🎯", text: "Personalised to your taste" },
          { icon: "🔥", text: "Trending styles for you" },
          { icon: "💰", text: "Budget-aware suggestions" },
        ].map((f) => (
          <View key={f.text} style={styles.welcomeFeatureRow}>
            <Text style={styles.welcomeFeatureEmoji}>{f.icon}</Text>
            <Text style={styles.welcomeFeatureText}>{f.text}</Text>
          </View>
        ))}
      </View>
    </View>
  );

  const renderStep = (step: StepConfig) => {
    const val = selections[step.key];
    const selectedArr = step.type === "multi" ? ((val as string[]) || []) : [];
    const selectedSingle = step.type === "single" ? (val as string) : "";

    return (
      <View style={styles.stepContainer}>
        <View style={styles.stepIconWrap}>{step.icon}</View>
        <Text style={styles.stepTitle}>{step.title}</Text>
        <Text style={styles.stepSubtitle}>{step.subtitle}</Text>

        <ScrollView
          style={styles.optionsScroll}
          contentContainerStyle={styles.optionsContainer}
          showsVerticalScrollIndicator={false}
        >
          {step.options.map((opt) => {
            const isSelected =
              step.type === "single"
                ? selectedSingle === opt.id
                : selectedArr.includes(opt.id);

            return (
              <TouchableOpacity
                key={opt.id}
                style={[styles.optionCard, isSelected && styles.optionCardSelected]}
                onPress={() => handleSelect(step.key, opt.id, step.type, step.maxSelections)}
                activeOpacity={0.7}
                testID={`onboarding-option-${opt.id}`}
              >
                <Text style={styles.optionEmoji}>{opt.emoji}</Text>
                <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
                  {opt.label}
                </Text>
                {isSelected && (
                  <View style={styles.checkBadge}>
                    <Check color="#FFFFFF" size={14} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {step.type === "multi" && (
          <Text style={styles.selectionCount}>
            {selectedArr.length} / {step.maxSelections ?? "∞"} selected
            {step.minSelections ? ` (min ${step.minSelections})` : ""}
          </Text>
        )}
      </View>
    );
  };

  return (
    <LinearGradient
      colors={["#020B1C", "#0A1628", "#071422", "#0C1425"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        {currentStep >= 0 && (
          <View style={styles.progressBarContainer}>
            <View style={styles.progressBarTrack}>
              <Animated.View style={[styles.progressBarFill, { width: progressWidth }]}>
                <LinearGradient
                  colors={["#F97316", "#FB923C"]}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
              </Animated.View>
            </View>
            <Text style={styles.progressText}>
              {currentStep + 1} / {totalSteps}
            </Text>
          </View>
        )}

        <Animated.View
          style={[
            styles.contentWrap,
            { opacity: fadeAnim, transform: [{ translateX: slideAnim }] },
          ]}
        >
          {currentStep < 0 ? renderWelcome() : renderStep(STEPS[currentStep])}
        </Animated.View>

        <View style={styles.bottomBar}>
          {currentStep >= 0 && (
            <TouchableOpacity
              style={styles.backButton}
              onPress={handleBack}
              activeOpacity={0.7}
              testID="onboarding-back"
            >
              <ChevronLeft color="#94A3B8" size={22} />
              <Text style={styles.backText}>Back</Text>
            </TouchableOpacity>
          )}

          <Animated.View
            style={[
              styles.nextButtonWrap,
              currentStep < 0 && styles.nextButtonFull,
              { transform: [{ scale: buttonScale }] },
            ]}
          >
            <TouchableOpacity
              style={[styles.nextButton, !canProceed && styles.nextButtonDisabled]}
              onPress={handleNext}
              disabled={!canProceed}
              activeOpacity={0.8}
              testID="onboarding-next"
            >
              <LinearGradient
                colors={canProceed ? ["#F97316", "#EA580C"] : ["#334155", "#1E293B"]}
                style={styles.nextButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={[styles.nextText, !canProceed && styles.nextTextDisabled]}>
                  {currentStep < 0
                    ? "Let's Go"
                    : currentStep >= totalSteps - 1
                    ? "Finish Setup"
                    : "Continue"}
                </Text>
                <ChevronRight color={canProceed ? "#FFFFFF" : "#64748B"} size={20} />
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>

        {currentStep < 0 && (
          <TouchableOpacity
            style={styles.skipAll}
            onPress={() => {
              void completeOnboarding({
                gender: "",
                ageRange: "",
                bodyType: "",
                favoriteColors: [],
                styleVibes: [],
                occasions: [],
                budgetRange: "",
                fashionGoals: [],
              }).then(() => router.replace("/(tabs)" as any));
            }}
            activeOpacity={0.6}
            testID="onboarding-skip"
          >
            <Text style={styles.skipText}>Skip for now</Text>
          </TouchableOpacity>
        )}
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  progressBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
    gap: 12,
  },
  progressBarTrack: {
    flex: 1,
    height: 4,
    backgroundColor: "rgba(249, 115, 22, 0.12)",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 2,
    overflow: "hidden",
  },
  progressText: {
    color: "#64748B",
    fontSize: 12,
    fontWeight: "600" as const,
    minWidth: 36,
    textAlign: "right" as const,
  },
  contentWrap: {
    flex: 1,
  },
  welcomeContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  welcomeIconWrap: {
    marginBottom: 32,
    borderRadius: 36,
    overflow: "hidden",
  },
  welcomeIconGradient: {
    width: 96,
    height: 96,
    borderRadius: 36,
    justifyContent: "center",
    alignItems: "center",
  },
  welcomeTitle: {
    fontSize: 34,
    fontWeight: "800" as const,
    color: "#E2E8F0",
    textAlign: "center" as const,
    lineHeight: 42,
    marginBottom: 16,
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: "#64748B",
    textAlign: "center" as const,
    lineHeight: 24,
    marginBottom: 40,
  },
  welcomeFeatures: {
    width: "100%",
    gap: 16,
  },
  welcomeFeatureRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(249, 115, 22, 0.06)",
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.1)",
    gap: 14,
  },
  welcomeFeatureEmoji: {
    fontSize: 24,
  },
  welcomeFeatureText: {
    fontSize: 16,
    color: "#CBD5E1",
    fontWeight: "500" as const,
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  stepIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(249, 115, 22, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.2)",
  },
  stepTitle: {
    fontSize: 26,
    fontWeight: "800" as const,
    color: "#E2E8F0",
    marginBottom: 6,
  },
  stepSubtitle: {
    fontSize: 14,
    color: "#64748B",
    marginBottom: 24,
    lineHeight: 20,
  },
  optionsScroll: {
    flex: 1,
  },
  optionsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingBottom: 20,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(8, 30, 50, 0.6)",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1.5,
    borderColor: "rgba(100, 116, 139, 0.15)",
    gap: 10,
    minWidth: "45%",
    flexGrow: 1,
  },
  optionCardSelected: {
    backgroundColor: "rgba(249, 115, 22, 0.12)",
    borderColor: "#F97316",
  },
  optionEmoji: {
    fontSize: 20,
  },
  optionLabel: {
    flex: 1,
    fontSize: 15,
    color: "#94A3B8",
    fontWeight: "500" as const,
  },
  optionLabelSelected: {
    color: "#FDBA74",
    fontWeight: "600" as const,
  },
  checkBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#F97316",
    justifyContent: "center",
    alignItems: "center",
  },
  selectionCount: {
    fontSize: 12,
    color: "#64748B",
    textAlign: "center" as const,
    paddingBottom: 4,
  },
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 8,
    gap: 4,
  },
  backText: {
    color: "#94A3B8",
    fontSize: 15,
    fontWeight: "500" as const,
  },
  nextButtonWrap: {
    flex: 1,
  },
  nextButtonFull: {
    flex: 1,
  },
  nextButton: {
    borderRadius: 14,
    overflow: "hidden",
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    gap: 8,
  },
  nextText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700" as const,
  },
  nextTextDisabled: {
    color: "#64748B",
  },
  skipAll: {
    alignItems: "center",
    paddingBottom: 12,
  },
  skipText: {
    color: "#475569",
    fontSize: 14,
    fontWeight: "500" as const,
  },
});
