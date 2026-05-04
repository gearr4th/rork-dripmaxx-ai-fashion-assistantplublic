import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StyleSheet } from "react-native";
import { AuthProvider } from "@/providers/AuthProvider";
import { ClothesProvider } from "@/providers/ClothesProvider";
import { WeatherProvider } from "@/providers/WeatherProvider";
import { SessionProvider } from "@/providers/SessionProvider";
import { BudgetProvider } from "@/providers/BudgetProvider";
import { SavedOutfitsProvider } from "@/providers/SavedOutfitsProvider";
import ErrorBoundary from "@/components/ErrorBoundary";
import { CloudSyncProvider } from "@/providers/CloudSyncProvider";
import { SubscriptionProvider } from "@/providers/SubscriptionProvider";
import { OnboardingProvider } from "@/providers/OnboardingProvider";
import { trpc, trpcClient } from "@/lib/trpc";

void SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();



function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="select-age" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="select-budget" options={{ headerShown: false, presentation: 'modal' }} />
      <Stack.Screen name="subscription" options={{ headerShown: false, presentation: 'modal' }} />
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
      <Stack.Screen 
        name="scan-outfit" 
        options={{ 
          presentation: "modal",
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="recommendation-details" 
        options={{ 
          headerShown: true,
          headerStyle: { backgroundColor: '#020B1C' },
          headerTintColor: '#E2E8F0',
          title: 'Recommendation',
        }} 
      />
      <Stack.Screen 
        name="item" 
        options={{ 
          headerShown: false,
        }} 
      />
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    void SplashScreen.hideAsync();
  }, []);

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        <GestureHandlerRootView style={styles.flex1}>
          <AuthProvider>
            <CloudSyncProvider>
              <OnboardingProvider>
                <SubscriptionProvider>
                  <WeatherProvider>
                    <ClothesProvider>
                      <SessionProvider>
                        <BudgetProvider>
                          <SavedOutfitsProvider>
                            <ErrorBoundary>
                              <RootLayoutNav />
                            </ErrorBoundary>
                          </SavedOutfitsProvider>
                        </BudgetProvider>
                      </SessionProvider>
                    </ClothesProvider>
                  </WeatherProvider>
                </SubscriptionProvider>
              </OnboardingProvider>
            </CloudSyncProvider>
          </AuthProvider>
        </GestureHandlerRootView>
      </QueryClientProvider>
    </trpc.Provider>
  );
}

const styles = StyleSheet.create({
  flex1: { flex: 1 },
});