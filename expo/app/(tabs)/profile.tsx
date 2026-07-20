import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Image,
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
  ChevronRight,
  Wallet,
  MessageSquare,
  RotateCcw,
} from "lucide-react-native";
import { router } from "expo-router";
import { useAuth } from "@/providers/AuthProvider";
import { useOnboarding } from "@/providers/OnboardingProvider";
import { useBudget } from "@/providers/BudgetProvider";
import { useSavedOutfits } from "@/providers/SavedOutfitsProvider";
import FeedbackModal from "@/components/FeedbackModal";
import { useSubscription } from "@/providers/SubscriptionProvider";
import { tierDisplayName } from "@/types/subscription";

export default function ProfileScreen() {
  const { user, signOut } = useAuth();
  const { budget } = useBudget();
  const { savedOutfits } = useSavedOutfits();
  const { tier } = useSubscription();
  const { preferences, resetOnboarding } = useOnboarding();
  const [feedbackModalVisible, setFeedbackModalVisible] = useState<boolean>(false);

  const handleSignOut = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => {
          void signOut();
          router.replace("/login" as any);
        },
      },
    ]);
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
        >
          <View style={styles.header}>
            <View style={styles.avatarContainer}>
              <User color="#FB923C" size={36} />
            </View>
            <Text style={styles.name}>{user?.name || "Demo User"}</Text>
            <Text style={styles.email}>{user?.email || "demo@dripmaxx.ai"}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Account Information</Text>

            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <User color="#FB923C" size={18} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Name</Text>
                <Text style={styles.infoValue}>{user?.name || "Demo User"}</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Mail color="#FB923C" size={18} />
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
                <Calendar color="#FB923C" size={18} />
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
                <CreditCard color="#FB923C" size={18} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Plan</Text>
                <Text style={styles.infoValue}>{tierDisplayName(tier)} — Beta</Text>
                <Text style={styles.infoSubtext}>All features unlocked</Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIcon}>
                <Wallet color="#FB923C" size={18} />
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoLabel}>Monthly Budget</Text>
                <Text style={styles.infoValue}>{budget ?? 'Not set'}</Text>
              </View>
              <TouchableOpacity onPress={() => router.push('/select-budget' as any)} activeOpacity={0.7}>
                <Text style={styles.changeLink}>Change</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Saved Outfits</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.savedOutfitsRow}>
              {savedOutfits.length === 0 ? (
                <Text style={styles.savedEmpty}>No saved outfits yet</Text>
              ) : (
                savedOutfits.map((o) => (
                  <TouchableOpacity key={o.id} onPress={() => router.push({ pathname: '/outfit-details', params: { id: o.id } } as any)} style={styles.savedOutfitCard} testID={`saved-outfit-${o.id}`} activeOpacity={0.8}>
                    <View style={styles.savedThumbRow}>
                      {o.items.slice(0,3).map((it) => (
                        <View key={it.id} style={styles.savedThumbWrap}>
                          <Image source={{ uri: it.imageUrl }} style={styles.savedThumb} />
                        </View>
                      ))}
                    </View>
                    <Text style={styles.savedOutfitText} numberOfLines={1}>{o.style}</Text>
                  </TouchableOpacity>
                ))
              )}
            </ScrollView>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Settings</Text>

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/onboarding' as any)} activeOpacity={0.6}>
              <Settings color="#64748B" size={20} />
              <Text style={styles.menuText}>Style Preferences</Text>
              <ChevronRight color="#334155" size={18} />
            </TouchableOpacity>

            {preferences.styleVibes.length > 0 && (
              <View style={styles.prefChipsWrap}>
                {preferences.styleVibes.map((v) => (
                  <View key={v} style={styles.prefChip}>
                    <Text style={styles.prefChipText}>{v}</Text>
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity style={styles.menuItem} onPress={() => router.push('/select-budget' as any)} activeOpacity={0.6}>
              <Wallet color="#64748B" size={20} />
              <Text style={styles.menuText}>Monthly Budget</Text>
              <ChevronRight color="#334155" size={18} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={() => setFeedbackModalVisible(true)} activeOpacity={0.6}>
              <MessageSquare color="#64748B" size={20} />
              <Text style={styles.menuText}>Give Feedback</Text>
              <ChevronRight color="#334155" size={18} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                Alert.alert(
                  "Reset Style Profile",
                  "This will reset your style preferences and take you through onboarding again.",
                  [
                    { text: "Cancel", style: "cancel" },
                    {
                      text: "Reset",
                      style: "destructive",
                      onPress: () => {
                        void resetOnboarding().then(() => router.replace('/onboarding' as any));
                      },
                    },
                  ]
                );
              }}
              activeOpacity={0.6}
            >
              <RotateCcw color="#64748B" size={20} />
              <Text style={styles.menuText}>Reset Style Profile</Text>
              <ChevronRight color="#334155" size={18} />
            </TouchableOpacity>

            <TouchableOpacity style={styles.menuItem} onPress={handleSignOut} activeOpacity={0.6}>
              <LogOut color="#EF4444" size={20} />
              <Text style={[styles.menuText, { color: "#EF4444" }]}>
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <Text style={styles.version}>DripMaxx AI v1.0.0 (Beta)</Text>
            <Text style={styles.copyright}>© 2026 DripMaxx AI</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
      <FeedbackModal
        visible={feedbackModalVisible}
        onClose={() => setFeedbackModalVisible(false)}
      />
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
    backgroundColor: "rgba(249, 115, 22, 0.1)",
    borderWidth: 2,
    borderColor: "rgba(249, 115, 22, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  name: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: "#E2E8F0",
    marginBottom: 4,
  },
  email: {
    fontSize: 14,
    color: "#64748B",
  },
  section: {
    marginBottom: 28,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#CBD5E1",
    marginBottom: 14,
    letterSpacing: 0.3,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(8, 30, 50, 0.5)",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.1)",
  },
  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(249, 115, 22, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    color: "#64748B",
    marginBottom: 3,
    fontWeight: "500" as const,
  },
  infoValue: {
    fontSize: 15,
    color: "#E2E8F0",
    fontWeight: "500" as const,
  },
  infoSubtext: {
    fontSize: 12,
    color: "#64748B",
    marginTop: 3,
  },
  changeLink: {
    color: "#FB923C",
    fontSize: 14,
    fontWeight: "600" as const,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(249, 115, 22, 0.08)",
  },
  menuText: {
    flex: 1,
    fontSize: 15,
    color: "#CBD5E1",
    marginLeft: 14,
  },
  footer: {
    alignItems: "center",
    marginTop: 16,
  },
  version: {
    fontSize: 12,
    color: "#334155",
    marginBottom: 4,
  },
  copyright: {
    fontSize: 12,
    color: "#334155",
  },
  savedOutfitsRow: {
    paddingVertical: 8,
  },
  savedEmpty: {
    color: '#475569',
    fontSize: 14,
  },
  savedOutfitCard: {
    backgroundColor: 'rgba(8, 30, 50, 0.5)',
    borderColor: 'rgba(249, 115, 22, 0.1)',
    borderWidth: 1,
    borderRadius: 14,
    padding: 12,
    marginRight: 12,
    width: 180,
  },
  savedThumbRow: {
    flexDirection: 'row',
  },
  savedThumbWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    overflow: 'hidden',
    marginRight: -10,
    borderWidth: 2,
    borderColor: '#020B1C',
  },
  savedThumb: {
    width: 36,
    height: 36,
  },
  savedOutfitText: {
    color: '#CBD5E1',
    fontSize: 12,
    marginTop: 8,
    fontWeight: "500" as const,
  },
  prefChipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    paddingHorizontal: 4,
    paddingBottom: 10,
  },
  prefChip: {
    backgroundColor: 'rgba(249, 115, 22, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: 'rgba(249, 115, 22, 0.2)',
  },
  prefChipText: {
    color: '#FDBA74',
    fontSize: 12,
    fontWeight: '600' as const,
  },
});
