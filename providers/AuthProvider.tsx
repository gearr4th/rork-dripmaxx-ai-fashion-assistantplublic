import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";

interface User {
  id: string;
  email: string;
  name: string;
  age?: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, age: number) => Promise<void>;
  signOut: () => Promise<void>;
}

export const [AuthProvider, useAuth] = createContextHook<AuthContextType>(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        setUser(JSON.parse(userData));
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("Failed to load user:", error);
    }
  };

  const signIn = async (email: string, password: string) => {
    // Mock authentication - in production, this would call Supabase
    if (email === "demo@dripmaxx.ai" && password === "password") {
      const mockUser: User = {
        id: "1",
        email: "demo@dripmaxx.ai",
        name: "Demo User",
        age: 25,
      };
      setUser(mockUser);
      setIsAuthenticated(true);
      await AsyncStorage.setItem("user", JSON.stringify(mockUser));
    } else {
      throw new Error("Invalid credentials");
    }
  };

  const signUp = async (email: string, password: string, name: string, age: number) => {
    // Mock signup - in production, this would call Supabase
    const mockUser: User = {
      id: Date.now().toString(),
      email,
      name,
      age,
    };
    setUser(mockUser);
    setIsAuthenticated(true);
    await AsyncStorage.setItem("user", JSON.stringify(mockUser));
  };

  const signOut = async () => {
    setUser(null);
    setIsAuthenticated(false);
    await AsyncStorage.removeItem("user");
  };

  return {
    user,
    isAuthenticated,
    signIn,
    signUp,
    signOut,
  };
});