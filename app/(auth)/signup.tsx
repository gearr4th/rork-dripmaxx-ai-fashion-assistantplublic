import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { Sparkles, Mail, Lock, User, Calendar } from "lucide-react-native";
import { useAuth } from "@/providers/AuthProvider";
import { testSupabaseConnection } from "@/utils/testSupabase";

export default function SignupScreen() {
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [age, setAge] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<string>("");
  const { signUp } = useAuth();

  useEffect(() => {
    const checkConnection = async () => {
      setConnectionStatus("Checking connection...");
      const result = await testSupabaseConnection();
      if (result.success) {
        setConnectionStatus("");
      } else if (result.error === 'Supabase not configured') {
        setConnectionStatus("Demo mode: Use demo@dripmaxx.ai / password");
      } else {
        setConnectionStatus("Connection issue detected. Use demo account.");
      }
    };
    void checkConnection();
  }, []);

  const handleSignup = async () => {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    const trimmedAge = age.trim();

    if (!trimmedName || !trimmedEmail || !trimmedPassword || !trimmedAge) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      Alert.alert("Invalid Email", "Please enter a valid email address (e.g., user@example.com)");
      return;
    }

    const ageNum = parseInt(trimmedAge, 10);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      Alert.alert("Error", "Please enter a valid age between 1 and 120");
      return;
    }

    if (trimmedPassword.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    try {
      const result = await signUp(trimmedEmail, trimmedPassword, trimmedName, ageNum);
      
      if (result && result.message) {
        if (result.message.includes("check your email") || result.message.includes("verify your account")) {
          Alert.alert(
            "Account Created!",
            result.message,
            [
              {
                text: "OK",
                onPress: () => router.replace("/login" as any)
              }
            ]
          );
        } else if (result.message.includes("temporarily unavailable")) {
          Alert.alert(
            "Account Created!",
            result.message,
            [
              {
                text: "Continue",
                onPress: () => {
                  router.replace("/select-budget" as any);
                }
              }
            ]
          );
        } else {
          Alert.alert("Success", result.message || "Account created successfully!");
          router.replace("/select-budget" as any);
        }
      } else {
        Alert.alert("Success", "Account created successfully!");
        router.replace("/select-budget" as any);
      }
    } catch (error: unknown) {
      console.error('[Signup Screen] Error:', error);
      let message = "Failed to create account";
      let title = "Signup Failed";
      
      if (error instanceof Error) {
        message = error.message;
        
        if (message.includes("Too many signup attempts") || message.includes("rate limit")) {
          title = "Rate Limit Reached";
          message = "Supabase email rate limit exceeded. This happens when creating multiple accounts in a short time.\n\nSolutions:\n1. Wait 15-30 minutes and try again\n2. Check if your account exists - try logging in\n3. Contact support to disable email verification\n4. Use demo: demo@dripmaxx.ai / password";
        } else if (message.includes("already exists") || message.includes("already registered")) {
          title = "Account Exists";
          message = "An account with this email already exists. Please sign in instead.";
        } else if (message.includes("Invalid email")) {
          title = "Invalid Email";
          message = "Please enter a valid email address.";
        } else if (message.includes("Password")) {
          title = "Invalid Password";
        }
      } else if (error && typeof error === 'object' && 'message' in error) {
        message = String(error.message);
      }
      
      Alert.alert(
        title,
        message,
        [
          {
            text: "OK",
            style: "cancel"
          }
        ]
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={["#020B1C", "#0A1A2F", "#071E2B", "#0C1425"]}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <Sparkles color="#F97316" size={36} />
              </View>
              <Text style={styles.title}>Join DripMaxx AI</Text>
              <Text style={styles.subtitle}>Create your fashion profile</Text>
              {connectionStatus ? (
                <View style={styles.connectionStatus}>
                  <Text style={styles.connectionStatusText}>{connectionStatus}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <User color="#475569" size={20} style={styles.inputIcon} />
                <TextInput
                  testID="signup-name"
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor="#475569"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputContainer}>
                <Mail color="#475569" size={20} style={styles.inputIcon} />
                <TextInput
                  testID="signup-email"
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#475569"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Lock color="#475569" size={20} style={styles.inputIcon} />
                <TextInput
                  testID="signup-password"
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#475569"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputContainer}>
                <Calendar color="#475569" size={20} style={styles.inputIcon} />
                <TextInput
                  testID="signup-age"
                  style={styles.input}
                  placeholder="Age"
                  placeholderTextColor="#475569"
                  value={age}
                  onChangeText={setAge}
                  keyboardType="numeric"
                />
              </View>

              <TouchableOpacity
                testID="signup-submit"
                style={[styles.signupButton, loading && styles.disabledButton]}
                onPress={handleSignup}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#F97316", "#EA580C"]}
                  style={styles.gradientButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.signupButtonText}>
                    {loading ? "Creating Account..." : "Create Account"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => router.back()}>
                  <Text style={styles.loginLink}>Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 48,
  },
  logoContainer: {
    width: 76,
    height: 76,
    borderRadius: 22,
    backgroundColor: "rgba(249, 115, 22, 0.12)",
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 30,
    fontWeight: "800" as const,
    color: "#E2E8F0",
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    color: "#64748B",
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(8, 30, 50, 0.6)",
    borderRadius: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.15)",
  },
  inputIcon: {
    marginLeft: 16,
  },
  input: {
    flex: 1,
    height: 54,
    paddingHorizontal: 14,
    color: "#E2E8F0",
    fontSize: 15,
  },
  signupButton: {
    marginTop: 8,
    borderRadius: 14,
    overflow: "hidden",
  },
  gradientButton: {
    height: 54,
    justifyContent: "center",
    alignItems: "center",
  },
  signupButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700" as const,
  },
  disabledButton: {
    opacity: 0.6,
  },
  loginContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  loginText: {
    color: "#64748B",
    fontSize: 14,
  },
  loginLink: {
    color: "#F97316",
    fontSize: 14,
    fontWeight: "600" as const,
  },
  connectionStatus: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(249, 115, 22, 0.08)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.2)",
  },
  connectionStatusText: {
    color: "#FB923C",
    fontSize: 12,
    textAlign: "center",
  },
});
