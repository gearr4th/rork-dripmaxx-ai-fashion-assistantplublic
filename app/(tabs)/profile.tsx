import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  User,
  Mail,
  Calendar,
  CreditCard,
  Settings,
  LogOut,
  Crown,
  ChevronRight,
} from "lucide-react-native";
import { router } from "expo-router";
import { useAuth } from "@/providers/AuthProvider";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  const handleUpgrade = () => {
    Alert.alert(
      "Upgrade to Premium",
      "Get unlimited outfit generations, exclusive trends, and priority support for $9.99/month",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Subscribe", onPress: () => console.log("Subscribe to premium") },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => {
          signOut();
          router.replace("/login" as any);
        },
      },
    ]);
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
        >
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              <User color="#FFD700" size={40} />
            </View>
            <Text style={styles.name}>{user?.name || "Demo User"}</Text>
            <Text style={styles.email}>{user?.email || "demo@dripmaxx.ai"}</Text>
          </View>

          <TouchableOpacity style={styles.premiumCard} onPress={handleUpgrade}>
            <LinearGradient
              colors={["#FFD700", "#FFA500"]}
              style={styles.premiumGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Crown color="#000" size={24} />
              <View style={styles.premiumContent}>
                <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
                <Text style={styles.premiumSubtitle}>
                  Unlimited outfits & exclusive features
                </Text>
              </View>
              <ChevronRight color="#000" size={24} />
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Information</Text>
            
            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <User color="#666" size={20} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>{user?.name || "Demo User"}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Mail color="#666" size={20} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Email</Text>
                <Text style={styles.infoValue}>
                  {user?.email || "demo@dripmaxx.ai"}
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Calendar color="#666" size={20} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Age Group</Text>
                <Text style={styles.infoValue}>
                  {user?.age ? `${user.age} years` : "25 years"}
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <CreditCard color="#666" size={20} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Subscription</Text>
                <Text style={styles.infoValue}>Free Plan</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Settings</Text>

            <TouchableOpacity style={styles.menuItem}>
              <Settings color="#888" size={20} />
              <Text style={styles.menuText}>Preferences</Text>
              <ChevronRight color="#666" size={20} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem}>
              <CreditCard color="#888" size={20} />
              <Text style={styles.menuText}>Payment Methods</Text>
              <ChevronRight color="#666" size={20} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleSignOut}>
              <LogOut color="#FF4444" size={20} />
              <Text style={[styles.menuText, { color: "#FF4444" }]}>
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.version}>DripMaxx AI v1.0.0</Text>
            <Text style={styles.copyright}>© 2024 DripMaxx AI</Text>
          </View>
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
    alignItems: "center",
    marginBottom: 24,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: "#888",
  },
  premiumCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 32,
  },
  premiumGradient: {
    flexDirection: "row",
    alignItems: "center",
    padding: 20,
    gap: 16,
  },
  premiumContent: {
    flex: 1,
  },
  premiumTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 4,
  },
  premiumSubtitle: {
    fontSize: 14,
    color: "rgba(0, 0, 0, 0.7)",
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#888",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "500",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255, 255, 255, 0.05)",
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    color: "#FFFFFF",
    marginLeft: 16,
  },
  footer: {
    alignItems: "center",
    marginTop: 20,
  },
  version: {
    fontSize: 12,
    color: "#666",
    marginBottom: 4,
  },
  copyright: {
    fontSize: 12,
    color: "#666",
  },
});