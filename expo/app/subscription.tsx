import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import { X, Sparkles, Check } from "lucide-react-native";
import { router } from "expo-router";

/**
 * TestFlight / Beta build — all features are free during the beta.
 * No purchases, no Stripe, no paywall. This screen exists only because
 * older navigation paths may still route here.
 */
export default function SubscriptionScreen() {
  const features: string[] = [
    "Unlimited closet items",
    "Unlimited outfit generations",
    "Unlimited saved looks",
    "AI outfit generation",
    "Weather-based suggestions",
    "Cost-per-wear tracking",
    "Outfit repeat tracking",
    "Event-based planning",
    "Seasonal trend analysis",
    "Priority generation speed",
    "Watermark-free",
  ];

  return (
    <LinearGradient colors={["#060B18", "#0D1525", "#080F1E"]} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.closeButton}
            activeOpacity={0.7}
          >
            <X color="#CBD5E1" size={22} />
          </TouchableOpacity>
          <Text style={styles.title}>DripMaxx Beta</Text>
          <Text style={styles.subtitle}>
            All features are unlocked and free during the beta. No payment required.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.iconWrap}>
            <LinearGradient
              colors={["#F97316", "#C2410C"]}
              style={styles.iconGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <Sparkles color="#FEF3C7" size={28} />
            </LinearGradient>
          </View>
          <Text style={styles.badge}>BETA ACCESS</Text>
          <Text style={styles.price}>Free</Text>
          <Text style={styles.priceSub}>Everything unlocked — enjoy.</Text>

          <View style={styles.features}>
            {features.map((f) => (
              <View key={f} style={styles.featureRow}>
                <Check color="#34D399" size={16} />
                <Text style={styles.featureText}>{f}</Text>
              </View>
            ))}
          </View>
        </View>

        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => router.back()}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={["#F97316", "#EA580C"]}
            style={styles.doneGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <Text style={styles.doneText}>Back to app</Text>
          </LinearGradient>
        </TouchableOpacity>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 28,
    alignItems: "center",
  },
  closeButton: {
    position: "absolute",
    right: 24,
    top: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(30, 58, 95, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "800" as const,
    color: "#F1F5F9",
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 22,
  },
  card: {
    marginHorizontal: 20,
    backgroundColor: "rgba(15, 23, 42, 0.8)",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1.5,
    borderColor: "rgba(249, 115, 22, 0.3)",
    alignItems: "center",
  },
  iconWrap: {
    marginBottom: 16,
  },
  iconGradient: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  badge: {
    color: "#FB923C",
    fontSize: 11,
    fontWeight: "800" as const,
    letterSpacing: 1,
    marginBottom: 8,
  },
  price: {
    fontSize: 44,
    fontWeight: "800" as const,
    color: "#F1F5F9",
    letterSpacing: -1,
  },
  priceSub: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 4,
    marginBottom: 24,
  },
  features: {
    alignSelf: "stretch",
    gap: 10,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  featureText: {
    fontSize: 13,
    color: "#CBD5E1",
  },
  doneButton: {
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 14,
    overflow: "hidden",
  },
  doneGradient: {
    paddingVertical: 16,
    alignItems: "center",
  },
  doneText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700" as const,
  },
});
