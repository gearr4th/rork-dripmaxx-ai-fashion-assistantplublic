import { useState, useEffect, useMemo, useCallback } from "react";
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
  emailVerified?: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, age: number) => Promise<void>;
  sendMagicLink: (email: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  completeOAuthFromRedirect: (url: string) => Promise<void>;
  signOut: () => Promise<void>;
  reloadUser: () => Promise<void>;
}

export const [AuthProvider, useAuth] = createContextHook<AuthContextType>(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);

  useEffect(() => {
    void loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem("user");
      const token = await AsyncStorage.getItem('accessToken');
      const rtoken = await AsyncStorage.getItem('refreshToken');
      if (userData) {
        const parsed = JSON.parse(userData) as User;
        setUser(parsed);
        setIsAuthenticated(true);
        setAccessToken(token ?? null);
        setRefreshToken(rtoken ?? null);
        return;
      }
      const demo: User = { id: '1', email: 'demo@dripmaxx.ai', name: 'Demo User', age: 25, emailVerified: true };
      setUser(demo);
      setIsAuthenticated(true);
      setAccessToken(null);
      setRefreshToken(null);
      await AsyncStorage.setItem('user', JSON.stringify(demo));
    } catch (error) {
      console.error("[Auth] Failed to load user", error);
    }
  };

  const supabaseConfigured = Boolean(SUPABASE_URL) && Boolean(SUPABASE_ANON_KEY);

  const signIn = useCallback(async (email: string, password: string) => {
    console.log('[Auth] signIn started', { email: email?.slice(0, 3) + '***', supabaseConfigured });

    if (email === 'demo@dripmaxx.ai' && password === 'password') {
      console.log('[Auth] Using demo credentials');
      const mockUser: User = { id: '1', email: 'demo@dripmaxx.ai', name: 'Demo User', age: 25, emailVerified: true };
      setUser(mockUser);
      setIsAuthenticated(true);
      setAccessToken(null);
      setRefreshToken(null);
      await AsyncStorage.setItem('user', JSON.stringify(mockUser));
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      return;
    }

    if (!supabaseConfigured) {
      throw new Error('Authentication service not configured. Please use demo account: demo@dripmaxx.ai / password');
    }

    const url = `${SUPABASE_URL}/auth/v1/token?grant_type=password`;
    console.log('[Auth] Attempting sign in to:', url);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    let resp: Response;
    try {
      console.log('[Auth] Sending request with body:', { email, password: '***' });
      resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ email, password }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      console.log('[Auth] signIn response status:', resp.status);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('[Auth] signIn fetch error:', fetchError);
      console.error('[Auth] Error type:', fetchError?.constructor?.name);
      
      const errorMsg = fetchError instanceof Error ? fetchError.message : String(fetchError);
      console.error('[Auth] Error message:', errorMsg);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error('Connection timed out (15s). Your network may be slow or the server is unreachable.');
      }
      
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error('No internet connection detected. Please check your network and try again.');
      }
      
      throw new Error('Unable to connect to authentication server. Please check:\n\n1. Your internet connection\n2. Try the demo account: demo@dripmaxx.ai / password\n3. Contact support if issue persists');
    }

    if (!resp.ok) {
      const raw = await resp.text();
      let friendly = 'Failed to sign in';
      try {
        const parsed = JSON.parse(raw) as { code?: number; error_code?: string; msg?: string; message?: string; error_description?: string };
        if (parsed?.error_code === 'invalid_credentials' || (parsed?.msg ?? '').toLowerCase().includes('invalid login credentials') || (parsed?.message ?? '').toLowerCase().includes('invalid login credentials')) {
          friendly = 'Invalid email or password. Please try again.';
        } else if ((parsed?.msg ?? '').toLowerCase().includes('email not confirmed')) {
          friendly = 'Please verify your email address before signing in. Check your inbox for the verification link.';
        } else if (typeof parsed?.message === 'string' && parsed.message.length > 0) {
          friendly = parsed.message;
        } else if (typeof parsed?.msg === 'string' && parsed.msg.length > 0) {
          friendly = parsed.msg;
        } else if (typeof parsed?.error_description === 'string' && parsed.error_description.length > 0) {
          friendly = parsed.error_description;
        }
      } catch {
        if (raw.includes('invalid login credentials')) {
          friendly = 'Invalid email or password. Please try again.';
        } else if (raw.includes('email not confirmed')) {
          friendly = 'Please verify your email address before signing in. Check your inbox for the verification link.';
        } else if (raw && raw.length < 200) {
          friendly = raw;
        }
      }
      
      if (resp.status >= 500) {
        friendly = 'Server error. Please try again in a moment.';
      } else if (resp.status === 429) {
        friendly = 'Too many login attempts. Please try again later.';
      }
      
      console.error('[Auth] signIn REST error', resp.status, raw);
      throw new Error(friendly);
    }

    const json = (await resp.json()) as { access_token?: string; refresh_token?: string; user?: { id?: string; email?: string; user_metadata?: Record<string, unknown>; email_confirmed_at?: string | null } };
    const u: User = { id: json.user?.id ?? '', email: json.user?.email ?? email, emailVerified: Boolean(json.user?.email_confirmed_at) };
    if (!u.id) throw new Error('Login failed: invalid user payload');
    setUser(u);
    setIsAuthenticated(true);
    setAccessToken(json.access_token ?? null);
    setRefreshToken(json.refresh_token ?? null);
    await AsyncStorage.setItem('user', JSON.stringify(u));
    if (json.access_token) await AsyncStorage.setItem('accessToken', json.access_token);
    if (json.refresh_token) await AsyncStorage.setItem('refreshToken', json.refresh_token);
  }, [supabaseConfigured]);

  const signUp = useCallback(async (email: string, password: string, name: string, age: number) => {
    console.log('[Auth] signUp started', { email: email?.slice(0, 3) + '***', supabaseConfigured });

    if (!supabaseConfigured) {
      console.log('[Auth] Using local signup (no Supabase)');
      const mockUser: User = { id: Date.now().toString(), email, name, age, emailVerified: true };
      setUser(mockUser);
      setIsAuthenticated(true);
      setAccessToken(null);
      setRefreshToken(null);
      await AsyncStorage.setItem("user", JSON.stringify(mockUser));
      await AsyncStorage.removeItem('accessToken');
      await AsyncStorage.removeItem('refreshToken');
      return;
    }

    const redirectTo = Platform.OS === 'web'
      ? `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8081'}/(auth)/auth-callback`
      : Linking.createURL('/(auth)/auth-callback');

    const url = `${SUPABASE_URL}/auth/v1/signup`;
    console.log('[Auth] Attempting signup to:', url);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000);

    let resp: Response;
    try {
      console.log('[Auth] Sending signup request with body:', { email, name, age });
      resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ email, password, data: { name, age }, options: { emailRedirectTo: redirectTo } }),
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      console.log('[Auth] signUp response status:', resp.status);
    } catch (fetchError) {
      clearTimeout(timeoutId);
      console.error('[Auth] signUp fetch error:', fetchError);
      console.error('[Auth] Error type:', fetchError?.constructor?.name);
      
      const errorMsg = fetchError instanceof Error ? fetchError.message : String(fetchError);
      console.error('[Auth] Error message:', errorMsg);
      
      if (fetchError instanceof Error && fetchError.name === 'AbortError') {
        throw new Error('Connection timed out (15s). Your network may be slow or the server is unreachable.');
      }
      
      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        throw new Error('No internet connection detected. Please check your network and try again.');
      }
      
      throw new Error('Unable to connect to authentication server. Please check your internet connection and try again.');
    }

    const text = await resp.text();
    if (!resp.ok) {
      console.error('[Auth] signUp REST error', resp.status, text);
      let errorMessage = 'Failed to create account';
      try {
        const errorJson = JSON.parse(text) as { message?: string; msg?: string; error_description?: string; error?: string; code?: string };
        
        if (errorJson.message?.includes('already registered')) {
          errorMessage = 'An account with this email already exists. Please sign in instead.';
        } else if (errorJson.msg?.includes('already registered') || errorJson.error_description?.includes('already registered')) {
          errorMessage = 'An account with this email already exists. Please sign in instead.';
        } else if (errorJson.message?.includes('email rate limit')) {
          errorMessage = 'Too many signup attempts. Please try again later.';
        } else if (errorJson.message?.includes('password')) {
          errorMessage = 'Password must be at least 6 characters long.';
        } else if (errorJson.message?.includes('invalid email')) {
          errorMessage = 'Please enter a valid email address.';
        } else if (errorJson.message) {
          errorMessage = errorJson.message;
        } else if (errorJson.msg) {
          errorMessage = errorJson.msg;
        } else if (errorJson.error_description) {
          errorMessage = errorJson.error_description;
        } else if (errorJson.error) {
          errorMessage = errorJson.error;
        }
      } catch {
        if (text.includes('already registered')) {
          errorMessage = 'An account with this email already exists. Please sign in instead.';
        } else if (text.includes('email rate limit')) {
          errorMessage = 'Too many signup attempts. Please try again later.';
        } else if (text.includes('password')) {
          errorMessage = 'Password must be at least 6 characters long.';
        } else if (text && text.length < 200) {
          errorMessage = text;
        }
      }
      
      if (resp.status >= 500) {
        errorMessage = 'Server error. Please try again in a moment.';
      } else if (resp.status === 429) {
        errorMessage = 'Too many attempts. Please try again later.';
      } else if (!navigator.onLine && typeof navigator !== 'undefined') {
        errorMessage = 'No internet connection. Please check your network.';
      }
      
      throw new Error(errorMessage);
    }

    let json: { user?: { id?: string; email?: string; email_confirmed_at?: string | null } } = {};
    try { json = JSON.parse(text) as { user?: { id?: string; email?: string; email_confirmed_at?: string | null } }; } catch {}

    if (!json.user?.id) {
      throw new Error('Check your email to verify your account, then open the app again from the link.');
    }

    const u: User = { id: json.user.id ?? '', email: json.user.email ?? email, name, age, emailVerified: Boolean(json.user?.email_confirmed_at) };
    setUser(u);
    setIsAuthenticated(true);
    setAccessToken(null);
    setRefreshToken(null);
    await AsyncStorage.setItem("user", JSON.stringify(u));
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
  }, [supabaseConfigured]);

  const sendMagicLink = useCallback(async (email: string) => {
    if (!supabaseConfigured) throw new Error('Magic link requires Supabase configuration');
    const redirectTo = Platform.OS === 'web'
      ? `${typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8081'}/(auth)/auth-callback`
      : Linking.createURL('/(auth)/auth-callback');
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
      const uJson = (await uResp.json()) as { id?: string; email?: string; email_confirmed_at?: string | null };
      const u: User = { id: uJson.id ?? '', email: uJson.email ?? '', emailVerified: Boolean(uJson.email_confirmed_at) };
      if (!u.id) throw new Error('Invalid user');
      setUser(u);
      setIsAuthenticated(true);
      setAccessToken(accessToken);
      await AsyncStorage.setItem('user', JSON.stringify(u));
      if (accessToken) await AsyncStorage.setItem('accessToken', accessToken);
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
    setAccessToken(null);
    setRefreshToken(null);
    await AsyncStorage.removeItem("user");
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
  }, []);

  const reloadUser = useCallback(async () => {
    try {
      if (!accessToken) return;
      const uResp = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
        headers: { Authorization: `Bearer ${accessToken}`, apikey: SUPABASE_ANON_KEY },
      });
      if (!uResp.ok) return;
      const uJson = (await uResp.json()) as { id?: string; email?: string; email_confirmed_at?: string | null };
      if (!uJson.id) return;
      const next: User = { id: uJson.id ?? '', email: uJson.email ?? '', emailVerified: Boolean(uJson.email_confirmed_at), name: user?.name, age: user?.age };
      setUser(next);
      await AsyncStorage.setItem('user', JSON.stringify(next));
    } catch (e) {
      console.log('[Auth] reloadUser error', e);
    }
  }, [accessToken, user?.name, user?.age]);

  return useMemo(() => ({
    user,
    isAuthenticated,
    accessToken,
    refreshToken,
    signIn,
    signUp,
    sendMagicLink,
    signInWithGoogle,
    completeOAuthFromRedirect,
    signOut,
    reloadUser,
  }), [user, isAuthenticated, accessToken, refreshToken, signIn, signUp, sendMagicLink, signInWithGoogle, completeOAuthFromRedirect, signOut, reloadUser]);
});