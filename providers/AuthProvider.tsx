import React, { useState, useEffect, useMemo, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/utils/config";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { Platform } from "react-native";

WebBrowser.maybeCompleteAuthSession();

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
  sendMagicLink: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  completeOAuthFromRedirect: (url: string) => Promise<void>;
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
        return;
      }
      const demo: User = { id: '1', email: 'demo@dripmaxx.ai', name: 'Demo User', age: 25 };
      setUser(demo);
      setIsAuthenticated(true);
      await AsyncStorage.setItem('user', JSON.stringify(demo));
    } catch (error) {
      console.error("[Auth] Failed to load user", error);
    }
  };

  const supabaseConfigured = Boolean(SUPABASE_URL) && Boolean(SUPABASE_ANON_KEY);

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
      throw new Error(errText || `Supabase auth error: ${resp.status}`);
    }

    const json = (await resp.json()) as { user?: { id?: string; email?: string; user_metadata?: Record<string, unknown> } };
    const u: User = { id: json.user?.id ?? '', email: json.user?.email ?? email };
    if (!u.id) throw new Error('Login failed: invalid user payload');
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

    const redirectTo = Linking.createURL('/(auth)/auth-callback');

    const resp = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SUPABASE_ANON_KEY,
      },
      body: JSON.stringify({ email, password, data: { name, age }, options: { emailRedirectTo: redirectTo } }),
    });

    const text = await resp.text();
    if (!resp.ok) {
      console.error('[Auth] signUp REST error', resp.status, text);
      throw new Error(text || `Supabase signup error: ${resp.status}`);
    }

    let json: { user?: { id?: string; email?: string } } = {};
    try { json = JSON.parse(text) as { user?: { id?: string; email?: string } }; } catch {}

    if (!json.user?.id) {
      throw new Error('Check your email to verify your account, then open the app again from the link.');
    }

    const u: User = { id: json.user.id ?? '', email: json.user.email ?? email, name, age };
    setUser(u);
    setIsAuthenticated(true);
    await AsyncStorage.setItem("user", JSON.stringify(u));
  }, [supabaseConfigured]);

  const sendMagicLink = useCallback(async (email: string) => {
    if (!supabaseConfigured) throw new Error('Magic link requires Supabase configuration');
    const redirectTo = Linking.createURL('/(auth)/auth-callback');
    const resp = await fetch(`${SUPABASE_URL}/auth/v1/otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', apikey: SUPABASE_ANON_KEY },
      body: JSON.stringify({ email, create_user: true, type: 'magiclink', redirect_to: redirectTo }),
    });
    if (!resp.ok) {
      const err = await resp.text();
      console.error('[Auth] sendMagicLink error', resp.status, err);
      throw new Error(err || 'Failed to send magic link');
    }
  }, [supabaseConfigured]);

  const completeOAuthFromRedirect = useCallback(async (url: string) => {
    try {
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
      if (!u.id) throw new Error('Invalid user');
      setUser(u);
      setIsAuthenticated(true);
      await AsyncStorage.setItem('user', JSON.stringify(u));
    } catch (e) {
      console.error('[Auth] completeOAuthFromRedirect error', e);
      throw e instanceof Error ? e : new Error('OAuth completion failed');
    }
  }, []);

  const signInWithGoogle = useCallback(async () => {
    throw new Error('Google sign-in is disabled in demo mode');
  }, []);

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
    sendMagicLink,
    signInWithGoogle,
    completeOAuthFromRedirect,
    signOut,
  }), [user, isAuthenticated, signIn, signUp, sendMagicLink, signInWithGoogle, completeOAuthFromRedirect, signOut]);
});