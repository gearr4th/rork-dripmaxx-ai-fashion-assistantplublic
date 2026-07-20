import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Sparkles,
  MapPin,
  Plus,
  MessageSquare,
  ScanLine,
  RefreshCw,
} from "lucide-react-native";
import { useWeather } from "@/providers/WeatherProvider";
import { useClothes } from "@/providers/ClothesProvider";
import { router } from "expo-router";
import OutfitCard from "@/components/OutfitCard";
import { useSavedOutfits } from "@/providers/SavedOutfitsProvider";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { useSubscription } from "@/providers/SubscriptionProvider";
import WeatherCard from "@/components/WeatherCard";
import { generateOutfit, fetchSocialTrends, interpretUserStyleRequest, ParsedUserRequest } from "@/utils/aiService";
import { Outfit } from "@/types";
import FeedbackModal from "@/components/FeedbackModal";

export default function HomeScreen() {
  const { weather, loading: weatherLoading, error: weatherError, fetchWeather } = useWeather();
  const { clothes } = useClothes();
  const { hasCompletedOnboarding, preferences } = useOnboarding();
  const { tryUseGeneration, trySaveOutfit, generationsRemaining, tier } = useSubscription();
  const [prompt, setPrompt] = useState<string>("");
  const [generating, setGenerating] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [outfit, setOutfit] = useState<Outfit | null>(null);
  const { saveOutfit, savedOutfits } = useSavedOutfits();
  const [trends, setTrends] = useState<string[]>(["Modern casual", "Streetwear", "Minimalist"]);
  const [isFetchingDailyTrends, setIsFetchingDailyTrends] = useState<boolean>(false);
  const [parsed, setParsed] = useState<ParsedUserRequest | null>(null);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState<boolean>(false);
  const [currentGreeting, setCurrentGreeting] = useState<string>("");
  const pulseAnim = useMemo(() => new Animated.Value(1), []);

  useEffect(() => {
    if (generating) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 0.6, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [generating, pulseAnim]);

  const getTimeBasedGreeting = () => {
    const now = new Date();
    const hour = now.getHours();
    if (hour >= 5 && hour < 12) return "Good Morning";
    if (hour >= 12 && hour < 17) return "Good Afternoon";
    if (hour >= 17 && hour < 22) return "Good Evening";
    return "Good Night";
  };

  useEffect(() => {
    const updateGreeting = () => setCurrentGreeting(getTimeBasedGreeting());
    updateGreeting();
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (hasCompletedOnboarding === false) {
      router.replace("/onboarding" as any);
    }
  }, [hasCompletedOnboarding]);

  useEffect(() => {
    void fetchWeather();
  }, [fetchWeather]);

  const fetchDailyTrends = useCallback(async (force: boolean = false) => {
    console.log('fetchDailyTrends called', { force, location: weather?.location });
    try {
      setIsFetchingDailyTrends(true);
      const today = new Date();
      const dayKey = `${today.getFullYear()}-${today.getMonth()+1}-${today.getDate()}`;
      const g = global as unknown as { __lastTrendsDay?: string };
      if (!force && g.__lastTrendsDay === dayKey && trends.length > 0) {
        console.log('Skipping trends fetch, already fetched today');
        return;
      }
      const dynamic = await fetchSocialTrends({
        prompt: '',
        location: weather?.location ?? null,
      });
      g.__lastTrendsDay = dayKey;
      setTrends(dynamic);
    } catch (e) {
      console.log('Daily trends fetch error', e);
    } finally {
      setIsFetchingDailyTrends(false);
    }
  }, [weather?.location, trends.length]);

  useEffect(() => {
    let mounted = true;
    void fetchDailyTrends();

    const interval = setInterval(() => {
      const now = new Date();
      const nextKey = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}`;
      if ((global as unknown as { __lastTrendsDay?: string }).__lastTrendsDay !== nextKey) {
        if (mounted) void fetchDailyTrends();
      }
    }, 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [fetchDailyTrends]);

  const handleCreateSmartOutfit = useCallback(async () => {
    const canGen = await tryUseGeneration();
    if (!canGen) {
      Alert.alert(
        "Daily Limit Reached",
        "You've used all your outfit generations for today. Come back tomorrow!",
        [{ text: "OK", style: "default" }]
      );
      return;
    }
    if (clothes.length === 0) {
      Alert.alert(
        "No Wardrobe Items",
        "Please add some clothes to your wardrobe first!",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Add Clothes", onPress: () => router.push("/scan-clothes" as any) },
        ]
      );
      return;
    }
    setGenerating(true);
    try {
      if (!weather) {
        await fetchWeather();
      }
      const parsedReq = await interpretUserStyleRequest(prompt);
      setParsed(parsedReq);
      const enrichedPrompt = [
        prompt?.trim() || '',
        parsedReq.location ? `Location: ${parsedReq.location}` : null,
        parsedReq.occasion ? `Occasion: ${parsedReq.occasion}` : null,
        parsedReq.budget != null ? `Budget: ${parsedReq.budget}` : null,
        parsedReq.preferences.length ? `Preferences: ${parsedReq.preferences.join(', ')}` : null,
      ].filter(Boolean).join('\n');
      const dynamicTrends = await fetchSocialTrends({ prompt: enrichedPrompt, location: parsedReq.location ?? weather?.location ?? null });
      setTrends(dynamicTrends);
      const newOutfit = await generateOutfit({
        weather,
        trends: dynamicTrends,
        prompt: enrichedPrompt,
        clothes,
        stylePreferences: preferences,
      });
      setOutfit(newOutfit);
      try {
        const totalItems = clothes.length;
        if (totalItems <= 4) {
          router.push({ pathname: '/(tabs)/clothes', params: { showRecs: '1' } } as any);
        }
      } catch (e) {
        console.log('navigate to wardrobe after generation error', e);
      }
    } catch (error) {
      console.log('CreateSmartOutfit error', error);
      Alert.alert("Error", "Failed to create outfit. Please try again.");
    } finally {
      setGenerating(false);
    }
  }, [weather, prompt, clothes, fetchWeather, preferences]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([fetchWeather(), fetchDailyTrends(true)]);
    } catch (e) {
      console.log('onRefresh error', e);
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <LinearGradient
      colors={["#020B1C", "#0A1A2F", "#071E2B", "#0C1425"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#F97316"
            />
          }
        >
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.greeting}>{currentGreeting}</Text>
              <Text style={styles.title}>What's your vibe today?</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.trendChipsRow}
              >
                {trends.map((t) => (
                  <TouchableOpacity
                    key={t}
                    style={styles.trendChip}
                    onPress={() => setPrompt((p) => (p?.length ? `${p} ${t}` : t))}
                    testID={`trend-chip-${t}`}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.trendChipText}>{t}</Text>
                  </TouchableOpacity>
                ))}
                {isFetchingDailyTrends && (
                  <View style={[styles.trendChip, { opacity: 0.7 }]}
                    testID="trend-chip-loading"
                  >
                    <ActivityIndicator color="#E2E8F0" size="small" />
                  </View>
                )}
                <TouchableOpacity
                  accessibilityRole="button"
                  testID="refresh-trends-button"
                  onPress={() => fetchDailyTrends(true)}
                  style={styles.refreshChip}
                  activeOpacity={0.7}
                >
                  <RefreshCw color="#F97316" size={14} />
                </TouchableOpacity>
              </ScrollView>
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.scanOutfitButton}
                onPress={() => router.push("/scan-outfit" as any)}
                testID="scan-outfit-button"
                activeOpacity={0.7}
              >
                <ScanLine color="#FB923C" size={22} />
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => router.push("/scan-clothes" as any)}
                activeOpacity={0.7}
              >
                <LinearGradient
                  colors={["#F97316", "#EA580C"]}
                  style={styles.addButtonGradient}
                >
                  <Plus color="#FFFFFF" size={22} />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>

          <WeatherCard 
            weather={weather} 
            loading={weatherLoading} 
            error={weatherError} 
            onRefresh={fetchWeather}
          />

          <View style={styles.promptSection}>
            <View style={styles.sectionTitleRow}>
              <MapPin color="#F97316" size={18} />
              <Text style={styles.sectionTitle}>Where are you going?</Text>
            </View>
            <TextInput
              testID="prompt-input"
              style={styles.promptInput}
              placeholder="e.g., Office meeting, Casual brunch, Date night..."
              placeholderTextColor="#4B5C78"
              value={prompt}
              onChangeText={setPrompt}
              multiline
            />
          </View>

          <TouchableOpacity
            testID="create-outfit-button"
            style={[styles.generateButton, generating && styles.disabledButton]}
            onPress={handleCreateSmartOutfit}
            disabled={generating}
            activeOpacity={0.8}
          >
            <Animated.View style={{ opacity: generating ? pulseAnim : 1 }}>
              <LinearGradient
                colors={["#F97316", "#EA580C"]}
                style={styles.gradientButton}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                {generating ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Sparkles color="#FFFFFF" size={24} />
                    <Text style={styles.generateButtonText}>Create Outfit</Text>
                  </>
                )}
              </LinearGradient>
            </Animated.View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.feedbackButtonLarge}
            onPress={() => setFeedbackModalVisible(true)}
            testID="feedback-button"
            activeOpacity={0.7}
          >
            <View style={styles.feedbackInner}>
              <MessageSquare color="#FB923C" size={20} />
              <Text style={styles.feedbackButtonLargeText}>Give Feedback</Text>
            </View>
          </TouchableOpacity>

          {parsed && (
            <View style={styles.outfitSection}>
              <Text style={styles.sectionTitle}>Chat understanding</Text>
              <View style={styles.parsedBubble} testID="parsed-summary">
                <Text style={styles.parsedText}>Occasion: {parsed.occasion ?? '—'}</Text>
                <Text style={styles.parsedText}>Budget: {parsed.budget != null ? `${parsed.budget}` : '—'}</Text>
                <Text style={styles.parsedText}>Preferences: {parsed.preferences.length ? parsed.preferences.join(', ') : '—'}</Text>
                <Text style={styles.parsedText}>Location: {parsed.location ?? '—'}</Text>
              </View>
            </View>
          )}

          {outfit && (
            <View style={styles.outfitSection}>
              <Text style={styles.sectionTitle}>Your Outfit</Text>
              <OutfitCard outfit={outfit} />
              <TouchableOpacity
                testID="save-outfit-from-home"
                style={[styles.generateButton, { marginTop: 12 }]}
                onPress={async () => {
                  try {
                    if (!trySaveOutfit(savedOutfits.length)) {
                      Alert.alert(
                        "Save Limit Reached",
                        "You've reached your maximum saved outfits.",
                        [{ text: "OK", style: "default" }]
                      );
                      return;
                    }
                    await saveOutfit(outfit);
                    router.push({ pathname: '/outfit-details', params: { id: outfit.id } } as any);
                  } catch {
                    Alert.alert('Error', 'Could not save outfit');
                  }
                }}
                activeOpacity={0.8}
              >
                <LinearGradient colors={["#059669", "#047857"]} style={styles.gradientButton} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                  <Text style={styles.generateButtonText}>Save to Profile</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
        
        <FeedbackModal
          visible={feedbackModalVisible}
          onClose={() => setFeedbackModalVisible(false)}
        />
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
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 4,
  },
  greeting: {
    fontSize: 15,
    color: "#FB923C",
    marginBottom: 4,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase" as const,
  },
  title: {
    fontSize: 26,
    fontWeight: "800" as const,
    color: "#E2E8F0",
    marginBottom: 8,
  },
  scanOutfitButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(249, 115, 22, 0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(249, 115, 22, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  addButton: {
    borderRadius: 22,
    overflow: "hidden",
  },
  addButtonGradient: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 22,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#CBD5E1",
    letterSpacing: 0.3,
  },
  promptSection: {
    marginBottom: 20,
  },
  promptInput: {
    backgroundColor: "rgba(8, 30, 50, 0.6)",
    borderRadius: 14,
    padding: 16,
    color: "#E2E8F0",
    fontSize: 15,
    minHeight: 80,
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.18)",
    textAlignVertical: "top",
  },
  generateButton: {
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 16,
  },
  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    gap: 10,
  },
  generateButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700" as const,
  },
  disabledButton: {
    opacity: 0.6,
  },
  feedbackButtonLarge: {
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 20,
    backgroundColor: "rgba(249, 115, 22, 0.06)",
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.18)",
  },
  feedbackInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 10,
  },
  feedbackButtonLargeText: {
    color: "#FB923C",
    fontSize: 15,
    fontWeight: "600" as const,
  },
  outfitSection: {
    marginTop: 8,
  },
  parsedBubble: {
    backgroundColor: "rgba(249, 115, 22, 0.06)",
    borderColor: "rgba(249, 115, 22, 0.12)",
    borderWidth: 1,
    borderRadius: 14,
    padding: 14,
    marginTop: 8,
  },
  parsedText: {
    color: "#CBD5E1",
    fontSize: 14,
    marginBottom: 4,
    lineHeight: 20,
  },
  trendChipsRow: {
    paddingTop: 10,
    gap: 8,
    alignItems: "center",
  },
  trendChip: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    backgroundColor: "rgba(249, 115, 22, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  trendChipText: {
    color: "#FDBA74",
    fontSize: 13,
    fontWeight: "600" as const,
  },
  refreshChip: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(249, 115, 22, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
});
