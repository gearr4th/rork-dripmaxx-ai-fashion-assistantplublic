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
  const { signIn } = useAuth();

  const navigateToApp = () => {
    router.replace("/" as any);
  };

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      navigateToApp();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to sign in";
      Alert.alert("Error", message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testSupabaseConnection().catch(console.error);
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
});