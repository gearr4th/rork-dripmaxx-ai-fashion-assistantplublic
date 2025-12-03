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
    checkConnection().catch(console.error);
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
      colors={["#0A0A0A", "#1A1A2E", "#0A0A0A"]}
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
                <Sparkles color="#FFD700" size={40} />
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
                <Mail color="#666" size={20} style={styles.inputIcon} />
                <TextInput
                  testID="login-email"
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#666"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Lock color="#666" size={20} style={styles.inputIcon} />
                <TextInput
                  testID="login-password"
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#666"
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
              >
                <LinearGradient
                  colors={["#FFD700", "#FFA500"]}
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
    padding: 20,
  },
  header: {
    alignItems: "center",
    marginBottom: 50,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: "rgba(255, 107, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#F2F2F2",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#888",
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  inputIcon: {
    marginLeft: 16,
  },
  input: {
    flex: 1,
    height: 56,
    paddingHorizontal: 16,
    color: "#F2F2F2",
    fontSize: 16,
  },
  loginButton: {
    marginTop: 8,
    borderRadius: 12,
    overflow: "hidden",
  },
  gradientButton: {
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  loginButtonText: {
    color: "#000000",
    fontSize: 18,
    fontWeight: "bold",
  },
  disabledButton: {
    opacity: 0.6,
  },
  demoPrimary: {
    marginTop: 12,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#FF6B00",
    alignItems: "center",
    justifyContent: "center",
  },
  demoPrimaryText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "700",
  },
  signupContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  signupText: {
    color: "#888",
    fontSize: 14,
  },
  signupLink: {
    color: "#FFD700",
    fontSize: 14,
    fontWeight: "600",
  },
  connectionStatus: {
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "rgba(255, 165, 0, 0.15)",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255, 165, 0, 0.3)",
  },
  connectionStatusText: {
    color: "#FFA500",
    fontSize: 12,
    textAlign: "center",
  },
});