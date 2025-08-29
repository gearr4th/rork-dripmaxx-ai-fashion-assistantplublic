import React, { useState, useEffect, useCallback } from "react";
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
  TrendingUp,
  MapPin,
  Plus,
} from "lucide-react-native";
import { useWeather } from "@/providers/WeatherProvider";
import { useClothes } from "@/providers/ClothesProvider";
import { router, Redirect } from "expo-router";
import { useAuth } from "@/providers/AuthProvider";
import OutfitCard from "@/components/OutfitCard";
import WeatherCard from "@/components/WeatherCard";
import TrendCard from "@/components/TrendCard";
import WardrobeUpliftCard from "@/components/WardrobeUpliftCard";
import { generateOutfit, fetchSocialTrends, interpretUserStyleRequest, ParsedUserRequest } from "@/utils/aiService";
import { Outfit } from "@/types";
import { useSession } from "@/providers/SessionProvider";

export default function HomeScreen() {
  const { isAuthenticated } = useAuth();
  const { ageGroup } = useSession();
  const { weather, loading: weatherLoading, error: weatherError, fetchWeather } = useWeather();
  const { clothes } = useClothes();
  const [prompt, setPrompt] = useState<string>("");
  const [generating, setGenerating] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [outfit, setOutfit] = useState<Outfit | null>(null);
  const [trends, setTrends] = useState<string[]>(["Modern casual", "Streetwear", "Minimalist"]);
  const [parsed, setParsed] = useState<ParsedUserRequest | null>(null);

  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

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
      console.log('Interpreting user request for NL preferences, occasion, budget...');
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
    await fetchWeather();
    setRefreshing(false);
  };

  if (!isAuthenticated) {
    return <Redirect href="/login" />;
  }

  if (!ageGroup) {
    return <Redirect href="/select-age" />;
  }

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
            <View>
              <Text style={styles.greeting}>Good Morning!</Text>
              <Text style={styles.title}>What's your vibe today?</Text>
            </View>
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => router.push("/scan-clothes" as any)}
            >
              <Plus color="#000" size={24} />
            </TouchableOpacity>
          </View>

          <WeatherCard 
            weather={weather} 
            loading={weatherLoading} 
            error={weatherError} 
            onRefresh={fetchWeather}
          />

          <WardrobeUpliftCard
            clothes={clothes}
            weather={weather}
            occasion={prompt || 'daily wear'}
            onItemPress={(item) => {
              console.log('Suggested item pressed:', item.name);
            }}
          />

          <View style={styles.trendsSection}>
            <Text style={styles.sectionTitle}>
              <TrendingUp color="#FFD700" size={20} /> Trending Now
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.trendsScroll}
            >
              {trends.map((trend, index) => (
                <TrendCard key={`${trend}-${index}`} trend={trend} />
              ))}
            </ScrollView>
          </View>

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
                  <Text style={styles.generateButtonText}>New Outfit</Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.helperNote}>Uses your prompt + live weather + TikTok/Instagram trends</Text>

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
    marginBottom: 24,
  },
  greeting: {
    fontSize: 16,
    color: "#888",
    marginBottom: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#FFD700",
    justifyContent: "center",
    alignItems: "center",
  },
  trendsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  trendsScroll: {
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  promptSection: {
    marginBottom: 24,
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
    padding: 22,
    gap: 10,
  },
  generateButtonText: {
    color: "#000000",
    fontSize: 20,
    fontWeight: "bold",
  },
  helperNote: {
    color: "#AAA",
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
    marginBottom: 16,
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
});