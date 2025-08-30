import React, { useState, useEffect, useMemo, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/utils/config";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { Platform } from "react-native";

interface User {
  id: string;
  email: string;
  name?: string;
  age?: number;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, age: number) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const [AuthProvider, useAuth] = createContextHook<AuthContextType>(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);

  useEffect(() => {
    void loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      if (userData) {
        const parsed = JSON.parse(userData) as User;
        setUser(parsed);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error("[Auth] Failed to load user", error);
    }
  };

  const supabaseConfigured = SUPABASE_URL.length > 0 && SUPABASE_ANON_KEY.length > 0;

  const signIn = useCallback(async (email: string, password: string) => {
    console.log('[Auth] signIn', { email: email?.slice(0, 3) + '***' });

    if (!supabaseConfigured) {
      if (email === "demo@dripmaxx.ai" && password === "password") {
        const mockUser: User = { id: "1", email: "demo@dripmaxx.ai", name: "Demo User", age: 25 };
        setUser(mockUser);
        setIsAuthenticated(true);
        await AsyncStorage.setItem("user", JSON.stringify(mockUser));
        return;
      }
      throw new Error("Supabase not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY in utils/config.ts or use demo account");
    }

    const resp = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ email, password }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('[Auth] signIn REST error', resp.status, errText);
      throw new Error(`Supabase auth error: ${resp.status}`);
    }

    const json = (await resp.json()) as { user?: { id?: string; email?: string; user_metadata?: Record<string, unknown> } };
    const u: User = { id: json.user?.id ?? '', email: json.user?.email ?? email };
    setUser(u);
    setIsAuthenticated(true);
    await AsyncStorage.setItem("user", JSON.stringify(u));
  }, [supabaseConfigured]);

  const signUp = useCallback(async (email: string, password: string, name: string, age: number) => {
    console.log('[Auth] signUp', { email: email?.slice(0, 3) + '***' });

    if (!supabaseConfigured) {
      const mockUser: User = { id: Date.now().toString(), email, name, age };
      setUser(mockUser);
      setIsAuthenticated(true);
      await AsyncStorage.setItem("user", JSON.stringify(mockUser));
      return;
    }

    const resp = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ email, password, data: { name, age } }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error('[Auth] signUp REST error', resp.status, errText);
      throw new Error(`Supabase signup error: ${resp.status}`);
    }

    const json = (await resp.json()) as { user?: { id?: string; email?: string } };
    const u: User = { id: json.user?.id ?? '', email: json.user?.email ?? email, name, age };
    setUser(u);
    setIsAuthenticated(true);
    await AsyncStorage.setItem("user", JSON.stringify(u));
  }, [supabaseConfigured]);

  const signInWithGoogle = useCallback(async () => {
    if (!supabaseConfigured) {
      throw new Error("Supabase not configured for OAuth");
    }

    const redirectUrl = Linking.createURL("/auth-callback");
    const authorizeUrl = `${SUPABASE_URL}/auth/v1/authorize?provider=google&redirect_to=${encodeURIComponent(redirectUrl)}`;
    console.log('[Auth] Google OAuth start', { redirectUrl });

    try {
      if (Platform.OS === 'web') {
        const result = await WebBrowser.openAuthSessionAsync(authorizeUrl, redirectUrl);
        if (result.type === 'success' && result.url) {
          const url = result.url;
          const hash = url.split('#')[1] ?? '';
          const params = new URLSearchParams(hash);
          const accessToken = params.get('access_token') ?? '';
          if (!accessToken) throw new Error('No access token returned');
          const uResp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
            headers: { Authorization: `Bearer ${accessToken}`, apikey: SUPABASE_ANON_KEY },
          });
          if (!uResp.ok) {
            const txt = await uResp.text();
            console.error('[Auth] user fetch error', txt);
            throw new Error('Failed to fetch user');
          }
          const uJson = (await uResp.json()) as { id?: string; email?: string };
          const u: User = { id: uJson.id ?? '', email: uJson.email ?? '' };
          setUser(u);
          setIsAuthenticated(true);
          await AsyncStorage.setItem('user', JSON.stringify(u));
          return;
        }
        throw new Error('Authentication was cancelled or failed');
      } else {
        const result = await WebBrowser.openAuthSessionAsync(authorizeUrl, redirectUrl);
        if (result.type === 'success' && result.url) {
          const url = result.url;
          const hash = url.split('#')[1] ?? '';
          const params = new URLSearchParams(hash);
          const accessToken = params.get('access_token') ?? '';
          if (!accessToken) throw new Error('No access token returned');
          const uResp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
            headers: { Authorization: `Bearer ${accessToken}`, apikey: SUPABASE_ANON_KEY },
          });
          if (!uResp.ok) {
            const txt = await uResp.text();
            console.error('[Auth] user fetch error', txt);
            throw new Error('Failed to fetch user');
          }
          const uJson = (await uResp.json()) as { id?: string; email?: string };
          const u: User = { id: uJson.id ?? '', email: uJson.email ?? '' };
          setUser(u);
          setIsAuthenticated(true);
          await AsyncStorage.setItem('user', JSON.stringify(u));
          return;
        }
        throw new Error('Authentication was cancelled or failed');
      }
    } catch (e) {
      console.error('[Auth] Google OAuth error', e);
      throw e instanceof Error ? e : new Error('Google OAuth failed');
    }
  }, [supabaseConfigured]);

  const signOut = useCallback(async () => {
    console.log('[Auth] signOut');
    setUser(null);
    setIsAuthenticated(false);
    await AsyncStorage.removeItem("user");
  }, []);

  return useMemo(() => ({
    user,
    isAuthenticated,
    signIn,
    signUp,
    signInWithGoogle,
    signOut,
  }), [user, isAuthenticated, signIn, signUp, signInWithGoogle, signOut]);
});