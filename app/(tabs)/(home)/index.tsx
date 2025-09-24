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
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  Sparkles,
  MapPin,
  Plus,
  MessageSquare,
} from "lucide-react-native";
import { useWeather } from "@/providers/WeatherProvider";
import { useClothes } from "@/providers/ClothesProvider";
import { router } from "expo-router";
import OutfitCard from "@/components/OutfitCard";
import WeatherCard from "@/components/WeatherCard";
import { generateOutfit, fetchSocialTrends, interpretUserStyleRequest, ParsedUserRequest } from "@/utils/aiService";
import { Outfit } from "@/types";
import FeedbackModal from "@/components/FeedbackModal";

export default function HomeScreen() {
  const { weather, loading: weatherLoading, error: weatherError, fetchWeather } = useWeather();
  const { clothes } = useClothes();
  const [prompt, setPrompt] = useState<string>("");
  const [generating, setGenerating] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [outfit, setOutfit] = useState<Outfit | null>(null);
  const [trends, setTrends] = useState<string[]>(["Modern casual", "Streetwear", "Minimalist"]);
  const [isFetchingDailyTrends, setIsFetchingDailyTrends] = useState<boolean>(false);
  const [parsed, setParsed] = useState<ParsedUserRequest | null>(null);
  const [feedbackModalVisible, setFeedbackModalVisible] = useState<boolean>(false);
  const [currentGreeting, setCurrentGreeting] = useState<string>("");

  const getTimeBasedGreeting = () => {
    const now = new Date();
    const hour = now.getHours();
    if (hour >= 5 && hour < 12) return "Good Morning!";
    if (hour >= 12 && hour < 17) return "Good Afternoon!";
    if (hour >= 17 && hour < 22) return "Good Evening!";
    return "Good Night!";
  };

  useEffect(() => {
    const updateGreeting = () => setCurrentGreeting(getTimeBasedGreeting());
    updateGreeting();
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    fetchWeather();
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
    fetchDailyTrends();

    const interval = setInterval(() => {
      const now = new Date();
      const nextKey = `${now.getFullYear()}-${now.getMonth()+1}-${now.getDate()}`;
      if ((global as unknown as { __lastTrendsDay?: string }).__lastTrendsDay !== nextKey) {
        if (mounted) fetchDailyTrends();
      }
    }, 60 * 1000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [fetchDailyTrends]);

  const handleCreateSmartOutfit = useCallback(async () => {
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
      });
      setOutfit(newOutfit);
    } catch (error) {
      console.log('CreateSmartOutfit error', error);
      Alert.alert("Error", "Failed to create outfit. Please try again.");
    } finally {
      setGenerating(false);
    }
  }, [clothes.length, weather, prompt, clothes, fetchWeather]);

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
      colors={["#0A0A0A", "#1A1A2E", "#0A0A0A"]}
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
              tintColor="#FFD700"
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
                  >
                    <Text style={styles.trendChipText}>{t}</Text>
                  </TouchableOpacity>
                ))}
                {isFetchingDailyTrends && (
                  <View style={[styles.trendChip, { opacity: 0.7 }]}
                    testID="trend-chip-loading"
                  >
                    <ActivityIndicator color="#000" />
                  </View>
                )}
                <TouchableOpacity
                  accessibilityRole="button"
                  testID="refresh-trends-button"
                  onPress={() => fetchDailyTrends(true)}
                  style={[styles.trendChip, { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#FFD700' }]}
                >
                  <Text style={[styles.trendChipText, { color: '#000' }]}>Refresh</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => router.push("/scan-clothes" as any)}
              >
                <Plus color="#000" size={24} />
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
            <Text style={styles.sectionTitle}>
              <MapPin color="#FFD700" size={20} /> Where are you going?
            </Text>
            <TextInput
              testID="prompt-input"
              style={styles.promptInput}
              placeholder="e.g., Office meeting, Casual brunch, Date night..."
              placeholderTextColor="#666"
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
          >
            <LinearGradient
              colors={["#FFD700", "#FFA500"]}
              style={styles.gradientButton}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {generating ? (
                <ActivityIndicator color="#000" />
              ) : (
                <>
                  <Sparkles color="#000" size={28} />
                  <Text style={styles.generateButtonText}>Create Outfit</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.feedbackButtonLarge}
            onPress={() => setFeedbackModalVisible(true)}
            testID="feedback-button"
          >
            <LinearGradient
              colors={["rgba(74, 144, 226, 0.2)", "rgba(74, 144, 226, 0.1)"]}
              style={styles.feedbackGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <MessageSquare color="#4A90E2" size={24} />
              <Text style={styles.feedbackButtonLargeText}>💬 Give Feedback</Text>
            </LinearGradient>
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
              <Text style={styles.sectionTitle}>Your Perfect Outfit</Text>
              <OutfitCard outfit={outfit} />
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
    alignItems: "center",
    marginBottom: 16,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  feedbackButtonLarge: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 24,
    borderWidth: 2,
    borderColor: "#4A90E2",
    shadowColor: "#4A90E2",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  feedbackGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
    paddingVertical: 18,
    gap: 12,
  },
  feedbackButtonLargeText: {
    color: "#4A90E2",
    fontSize: 17,
    fontWeight: "700",
  },
  greeting: {
    fontSize: 18,
    color: "#FFD700",
    marginBottom: 4,
    fontWeight: "600",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFD700",
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  promptSection: {
    marginBottom: 20,
  },
  promptInput: {
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 16,
    color: "#FFFFFF",
    fontSize: 16,
    minHeight: 80,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
    textAlignVertical: "top",
  },
  generateButton: {
    borderRadius: 12,
    overflow: "hidden",
    marginBottom: 24,
  },
  gradientButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    gap: 10,
  },
  generateButtonText: {
    color: "#000000",
    fontSize: 20,
    fontWeight: "bold",
  },

  disabledButton: {
    opacity: 0.6,
  },
  outfitSection: {
    marginTop: 8,
  },
  parsedBubble: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderColor: 'rgba(255,255,255,0.12)',
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },
  parsedText: {
    color: '#EEE',
    fontSize: 14,
    marginBottom: 4,
  },
  trendChipsRow: {
    paddingTop: 10,
    gap: 8,
  },
  trendChip: {
    height: 36,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: '#FFD700',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  trendChipText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '700',
  }
});