import { Tabs } from "expo-router";
import { Home, History, Shirt, User } from "lucide-react-native";
import React from "react";
export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: "#F97316",
        tabBarInactiveTintColor: "#3E5C6B",
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#020B1C",
          borderTopColor: "rgba(249, 115, 22, 0.12)",
          borderTopWidth: 1,
          minHeight: 60,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600" as const,
          letterSpacing: 0.3,
        },
        tabBarIconStyle: {
          marginBottom: 2,
        },
      }}
    >
      <Tabs.Screen
        name="(home)"
        options={{
          title: "Home",
          tabBarIcon: ({ color }) => <Home color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="history"
        options={{
          title: "History",
          tabBarIcon: ({ color }) => <History color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="clothes"
        options={{
          title: "Wardrobe",
          tabBarIcon: ({ color }) => <Shirt color={color} size={22} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Profile",
          tabBarIcon: ({ color }) => <User color={color} size={22} />,
        }}
      />
    </Tabs>
  );
}
