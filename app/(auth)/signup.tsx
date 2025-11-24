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
    checkConnection().catch(console.error);
  }, []);

  const handleSignup = async () => {
    if (!name || !email || !password || !age) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    const ageNum = parseInt(age, 10);
    if (isNaN(ageNum) || ageNum < 1 || ageNum > 120) {
      Alert.alert("Error", "Please enter a valid age");
      return;
    }

    if (password.length < 6) {
      Alert.alert("Error", "Password must be at least 6 characters long");
      return;
    }

    setLoading(true);
    try {
      const result = await signUp(email, password, name, ageNum);
      
      if (result && result.message && result.message.includes("check your email")) {
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
      } else {
        Alert.alert("Success", "Account created successfully!");
        router.replace("/select-age" as any);
        setTimeout(() => router.push("/select-budget" as any), 50);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create account";
      Alert.alert("Error", message);
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
                <User color="#666" size={20} style={styles.inputIcon} />
                <TextInput
                  testID="signup-name"
                  style={styles.input}
                  placeholder="Full Name"
                  placeholderTextColor="#666"
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>

              <View style={styles.inputContainer}>
                <Mail color="#666" size={20} style={styles.inputIcon} />
                <TextInput
                  testID="signup-email"
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
                  testID="signup-password"
                  style={styles.input}
                  placeholder="Password"
                  placeholderTextColor="#666"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </View>

              <View style={styles.inputContainer}>
                <Calendar color="#666" size={20} style={styles.inputIcon} />
                <TextInput
                  testID="signup-age"
                  style={styles.input}
                  placeholder="Age"
                  placeholderTextColor="#666"
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
              >
                <LinearGradient
                  colors={["#FFD700", "#FFA500"]}
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
    backgroundColor: "rgba(255, 215, 0, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#FFFFFF",
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
    color: "#FFFFFF",
    fontSize: 16,
  },
  signupButton: {
    marginTop: 8,
    borderRadius: 12,
    overflow: "hidden",
  },
  gradientButton: {
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  signupButtonText: {
    color: "#000000",
    fontSize: 18,
    fontWeight: "bold",
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
    color: "#888",
    fontSize: 14,
  },
  loginLink: {
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