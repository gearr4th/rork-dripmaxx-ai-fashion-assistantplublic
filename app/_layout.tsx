import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { AuthProvider } from "@/providers/AuthProvider";
import { ClothesProvider } from "@/providers/ClothesProvider";
import { WeatherProvider } from "@/providers/WeatherProvider";
import { SessionProvider } from "@/providers/SessionProvider";
import { BudgetProvider } from "@/providers/BudgetProvider";

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
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthProvider>
          <WeatherProvider>
            <ClothesProvider>
              <SessionProvider>
                <BudgetProvider>
                  <RootLayoutNav />
                </BudgetProvider>
              </SessionProvider>
            </ClothesProvider>
          </WeatherProvider>
        </AuthProvider>
      </GestureHandlerRootView>
    </QueryClientProvider>
  );
}