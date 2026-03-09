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
import { Sparkles, Mail, Lock } from "lucide-react-native";
import { useAuth } from "@/providers/AuthProvider";
import { testSupabaseConnection } from "@/utils/testSupabase";

export default function LoginScreen() {
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<string>("");
  const { signIn } = useAuth();

  const navigateToApp = () => {
    router.replace("/" as any);
  };

  const handleLogin = async () => {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    if (!trimmedEmail || !trimmedPassword) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      Alert.alert("Invalid Email", "Please enter a valid email address (e.g., user@example.com)");
      return;
    }

    setLoading(true);
    try {
      await signIn(trimmedEmail, trimmedPassword);
      navigateToApp();
    } catch (error: unknown) {
      console.error('[Login Screen] Login error:', error);
      let message = "Failed to sign in";
      let title = "Login Failed";
      
      if (error instanceof Error) {
        message = error.message;
        console.log('[Login Screen] Error message:', message);
        
        if (message.toLowerCase().includes("json") || message.toLowerCase().includes("parse") || message.toLowerCase().includes("syntaxerror") || message.toLowerCase().includes("unexpected character")) {
          title = "Backend Error";
          message = "The backend returned an invalid response. This usually means the API endpoint is misconfigured. The app will attempt to authenticate directly with Supabase. If this persists, please contact support.";
        } else if (message.toLowerCase().includes("backend") || message.toLowerCase().includes("html") || message.toLowerCase().includes("unreachable")) {
          title = "Service Issue";
          message = "The authentication backend is temporarily unavailable. The app will use direct authentication. Please try again.";
        } else if (message.toLowerCase().includes("invalid") || message.toLowerCase().includes("incorrect") || message.toLowerCase().includes("credentials")) {
          title = "Invalid Credentials";
          message = "The email or password you entered is incorrect. Please double-check and try again.";
        } else if (message.toLowerCase().includes("not found") || message.toLowerCase().includes("does not exist")) {
          title = "Account Not Found";
          message = "No account found with this email. Please sign up first.";
        } else if (message.toLowerCase().includes("verify") || message.toLowerCase().includes("confirm")) {
          title = "Email Not Verified";
          message = "Please check your email and verify your account before signing in.";
        } else if (message.toLowerCase().includes("too many") || message.toLowerCase().includes("rate limit")) {
          title = "Too Many Attempts";
          message = "You've tried to log in too many times. Please wait a few minutes and try again.";
        } else if (message.toLowerCase().includes("network") || message.toLowerCase().includes("fetch failed")) {
          title = "Network Error";
          message = "Please check your internet connection and try again.";
        }
      }
      
      Alert.alert(title, message);
    } finally {
      setLoading(false);
    }
  };

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

  const handleDemo = async () => {
    try {
      setLoading(true);
      await signIn("demo@dripmaxx.ai", "password");
      navigateToApp();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Demo sign-in failed";
      Alert.alert("Demo", msg);
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
              <Text style={styles.title}>DripMaxx AI</Text>
              <Text style={styles.subtitle}>Your AI Fashion Assistant</Text>
              {connectionStatus ? (
                <View style={styles.connectionStatus}>
                  <Text style={styles.connectionStatusText}>{connectionStatus}</Text>
                </View>
              ) : null}
            </View>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Mail color="#475569" size={20} style={styles.inputIcon} />
                <TextInput
                  testID="login-email"
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
                  testID="login-password"
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#475569"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <TouchableOpacity
                testID="login-submit"
                style={[styles.loginButton, loading && styles.disabledButton]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={["#F97316", "#EA580C"]}
                  style={styles.gradientButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.loginButtonText}>
                    {loading ? "Signing In..." : "Sign In"}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity
                testID="login-demo"
                style={styles.demoPrimary}
                onPress={handleDemo}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Text style={styles.demoPrimaryText}>Continue with Demo</Text>
              </TouchableOpacity>

              <View style={styles.signupContainer}>
                <Text style={styles.signupText}>Don&apos;t have an account? </Text>
                <TouchableOpacity onPress={() => router.push("/signup" as any)}>
                  <Text style={styles.signupLink}>Sign Up</Text>
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
  loginButton: {
    marginTop: 8,
    borderRadius: 14,
    overflow: "hidden",
  },
  gradientButton: {
    height: 54,
    justifyContent: "center",
    alignItems: "center",
  },
  loginButtonText: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "700" as const,
  },
  disabledButton: {
    opacity: 0.6,
  },
  demoPrimary: {
    marginTop: 12,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(249, 115, 22, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(249, 115, 22, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  demoPrimaryText: {
    color: "#FB923C",
    fontSize: 15,
    fontWeight: "600" as const,
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  signupText: {
    color: "#64748B",
    fontSize: 14,
  },
  signupLink: {
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
