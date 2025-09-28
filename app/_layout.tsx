import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { View, Text, StyleSheet } from "react-native";
import { AuthProvider } from "@/providers/AuthProvider";
import { ClothesProvider } from "@/providers/ClothesProvider";
import { WeatherProvider } from "@/providers/WeatherProvider";
import { SessionProvider } from "@/providers/SessionProvider";
import { BudgetProvider } from "@/providers/BudgetProvider";
import { SavedOutfitsProvider } from "@/providers/SavedOutfitsProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import { CloudSyncProvider } from "@/providers/CloudSyncProvider";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="select-age" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="select-budget" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen 
        name="scan-clothes" 
        options={{ 
          presentation: "modal",
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="outfit-details" 
        options={{ 
          presentation: "modal",
          headerShown: false 
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    SplashScreen.hideAsync();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <GestureHandlerRootView style={styles.flex1}>
        <AuthProvider>
          <CloudSyncProvider>
            <WeatherProvider>
              <ClothesProvider>
                <SessionProvider>
                  <BudgetProvider>
                    <SavedOutfitsProvider>
                      <ErrorBoundary>
                        <View style={styles.container} testID="app-root">
                          <RootLayoutNav />
                          <View style={styles.debugBadge} pointerEvents="none" testID="debug-badge">
                            <Text style={styles.debugText}>Preview Ready</Text>
                          </View>
                        </View>
                      </ErrorBoundary>
                    </SavedOutfitsProvider>
                  </BudgetProvider>
                </SessionProvider>
              </ClothesProvider>
            </WeatherProvider>
          </CloudSyncProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
  container: { flex: 1 },
  debugBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  debugText: { color: "#fff", fontSize: 10, fontWeight: "600" as const },
});