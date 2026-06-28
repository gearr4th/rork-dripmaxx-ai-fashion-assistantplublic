import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import { trpcClient } from "@/lib/trpc";
import type { Session } from "@supabase/supabase-js";

interface User {
  id: string;
  email: string;
  name?: string;
  age?: number;
  emailVerified?: boolean;
}

interface SignUpResult {
  success: boolean;
  message?: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  isSessionValid: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string, age: number) => Promise<SignUpResult | undefined>;
  signOut: () => Promise<void>;
  reloadUser: () => Promise<void>;
}

export const [AuthProvider, useAuth] = createContextHook<AuthContextType>(() => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [refreshToken, setRefreshToken] = useState<string | null>(null);
  const [isSessionValid, setIsSessionValid] = useState<boolean>(false);
  const initializedRef = useRef<boolean>(false);

  useEffect(() => {
    if (!initializedRef.current) {
      initializedRef.current = true;
      void loadUser();
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('[Auth] Auth state changed:', event, session?.user?.email ?? 'no user');

        if (event === 'SIGNED_OUT') {
          console.log('[Auth] User signed out via Supabase event');
          setUser(null);
          setIsAuthenticated(false);
          setAccessToken(null);
          setRefreshToken(null);
          setIsSessionValid(false);
          await AsyncStorage.multiRemove(['user', 'accessToken', 'refreshToken']);
          return;
        }

        if (event === 'TOKEN_REFRESHED' && session) {
          console.log('[Auth] Token refreshed successfully');
          setAccessToken(session.access_token);
          setRefreshToken(session.refresh_token);
          setIsSessionValid(true);
          await AsyncStorage.setItem('accessToken', session.access_token);
          await AsyncStorage.setItem('refreshToken', session.refresh_token);
        }

        if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') && session) {
          updateUserFromSession(session);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const updateUserFromSession = (session: Session) => {
    const supaUser = session.user;
    if (!supaUser) return;

    const u: User = {
      id: supaUser.id,
      email: supaUser.email ?? '',
      name: supaUser.user_metadata?.name,
      age: supaUser.user_metadata?.age,
      emailVerified: Boolean(supaUser.email_confirmed_at),
    };

    setUser(u);
    setIsAuthenticated(true);
    setIsSessionValid(true);
    setAccessToken(session.access_token);
    setRefreshToken(session.refresh_token);

    void AsyncStorage.setItem('user', JSON.stringify(u));
    void AsyncStorage.setItem('accessToken', session.access_token);
    void AsyncStorage.setItem('refreshToken', session.refresh_token);
  };

  const loadUser = async () => {
    try {
      console.log('[Auth] ========== LOADING USER SESSION ==========');
      const userData = await AsyncStorage.getItem("user");
      const token = await AsyncStorage.getItem('accessToken');
      const rtoken = await AsyncStorage.getItem('refreshToken');

      console.log('[Auth] Storage check:', {
        hasUserData: !!userData,
        hasAccessToken: !!token,
        hasRefreshToken: !!rtoken,
      });

      if (userData) {
        const parsed = JSON.parse(userData) as User;
        console.log('[Auth] Found stored user:', parsed.email, 'ID:', parsed.id);

        if (parsed.id === 'demo-user-id') {
          console.log('[Auth] Demo user detected');
          setUser(parsed);
          setIsAuthenticated(true);
          setIsSessionValid(false);
          setAccessToken(null);
          setRefreshToken(null);
          console.log('[Auth] ========== DEMO USER LOADED ==========');
          return;
        }

        if (token && rtoken && isSupabaseConfigured) {
          console.log('[Auth] Attempting to restore Supabase session...');
          try {
            const { data, error } = await supabase.auth.setSession({
              access_token: token,
              refresh_token: rtoken,
            });

            if (error) {
              console.error('[Auth] Session restoration failed:', error.message);
              console.log('[Auth] Trying to get current session as fallback...');

              const { data: sessionData } = await supabase.auth.getSession();
              if (sessionData?.session) {
                console.log('[Auth] Found existing valid session');
                updateUserFromSession(sessionData.session);
                console.log('[Auth] ========== SESSION RESTORED VIA FALLBACK ==========');
                return;
              }

              console.log('[Auth] No valid session found, clearing auth state');
              await AsyncStorage.multiRemove(['user', 'accessToken', 'refreshToken']);
              setUser(null);
              setIsAuthenticated(false);
              setAccessToken(null);
              setRefreshToken(null);
              setIsSessionValid(false);
              console.log('[Auth] ========== SESSION EXPIRED - USER LOGGED OUT ==========');
              return;
            }

            if (data?.session) {
              console.log('[Auth] Session restored successfully!');
              updateUserFromSession(data.session);
              console.log('[Auth] ========== USER LOADED SUCCESSFULLY ==========');
              return;
            }

            console.warn('[Auth] Session restoration returned no session');
            setUser(parsed);
            setIsAuthenticated(true);
            setIsSessionValid(false);
            setAccessToken(null);
            setRefreshToken(null);
          } catch (sessionError) {
            console.error('[Auth] Exception restoring session:', sessionError);
            await AsyncStorage.multiRemove(['accessToken', 'refreshToken']);
            setUser(parsed);
            setIsAuthenticated(true);
            setIsSessionValid(false);
            setAccessToken(null);
            setRefreshToken(null);
          }
        } else {
          console.warn('[Auth] No tokens or Supabase not configured');
          setUser(parsed);
          setIsAuthenticated(true);
          setIsSessionValid(false);
        }

        console.log('[Auth] ========== USER LOADED ==========');
        return;
      }

      console.log('[Auth] No stored user found, starting as guest');
      const demo: User = {
        id: 'demo-user-id',
        email: 'demo@dripmaxx.ai',
        name: 'Demo User',
        age: 25,
        emailVerified: true,
      };
      setUser(demo);
      setIsAuthenticated(true);
      setIsSessionValid(false);
      await AsyncStorage.setItem('user', JSON.stringify(demo));
      console.log('[Auth] Demo account initialized');
    } catch (error) {
      console.error("[Auth] FATAL: Failed to load user", error);
      const demo: User = {
        id: 'demo-user-id',
        email: 'demo@dripmaxx.ai',
        name: 'Demo User',
        age: 25,
        emailVerified: true,
      };
      setUser(demo);
      setIsAuthenticated(true);
      setIsSessionValid(false);
    }
  };

  const signIn = useCallback(async (email: string, password: string) => {
    console.log('[Auth] ========== SIGN IN STARTED ==========');
    console.log('[Auth] Email:', email?.slice(0, 3) + '***');

    if (email === "demo@dripmaxx.ai" && password === "password") {
      console.log('[Auth] Demo login');
      const demoUser: User = {
        id: "demo-user-id",
        email: "demo@dripmaxx.ai",
        name: "Demo User",
        age: 25,
        emailVerified: true,
      };
      setUser(demoUser);
      setIsAuthenticated(true);
      setIsSessionValid(false);
      setAccessToken(null);
      setRefreshToken(null);
      await AsyncStorage.setItem('user', JSON.stringify(demoUser));
      console.log('[Auth] Demo login successful');
      return;
    }

    try {
      console.log('[Auth] Authenticating via tRPC backend...');

      const result = await trpcClient.auth.login.mutate({
        email,
        password,
      });

      if (!result.success || !result.user) {
        throw new Error('Login failed - no user data returned');
      }

      console.log('[Auth] Backend login successful:', result.user.email);

      // Establish local Supabase session using tokens from backend
      if (result.accessToken && result.refreshToken) {
        console.log('[Auth] Setting local Supabase session from backend tokens');
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: result.accessToken,
          refresh_token: result.refreshToken,
        });
        if (sessionError) {
          console.warn('[Auth] setSession warning (non-fatal):', sessionError.message);
        }
      }

      const u: User = {
        id: result.user.id,
        email: result.user.email || email,
        name: result.user.name,
        age: result.user.age,
        emailVerified: Boolean(result.user.emailVerified),
      };

      setUser(u);
      setIsAuthenticated(true);
      setIsSessionValid(Boolean(result.accessToken));
      setAccessToken(result.accessToken ?? null);
      setRefreshToken(result.refreshToken ?? null);

      await AsyncStorage.setItem('user', JSON.stringify(u));
      if (result.accessToken) await AsyncStorage.setItem('accessToken', result.accessToken);
      if (result.refreshToken) await AsyncStorage.setItem('refreshToken', result.refreshToken);
      console.log('[Auth] ========== SIGN IN SUCCESS ==========');
    } catch (error: unknown) {
      console.error('[Auth] Login error:', error);
      const errMsg = error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : '';

      if (errMsg.includes('Failed to fetch') || errMsg.includes('Network request failed')) {
        throw new Error(
          'Unable to reach the authentication service. The demo account is available — use email "demo@dripmaxx.ai" with password "password".'
        );
      }

      if (errMsg.includes('Invalid') || errMsg.includes('invalid') || errMsg.includes('credentials') || errMsg.includes('UNAUTHORIZED')) {
        throw new Error('Invalid email or password. Please check your credentials.');
      }
      if (errMsg.includes('verify') || errMsg.includes('confirm') || errMsg.includes('FORBIDDEN')) {
        throw new Error('Please verify your email before signing in. Check your inbox.');
      }
      if (errMsg.includes('too many') || errMsg.includes('rate limit') || errMsg.includes('TOO_MANY_REQUESTS')) {
        throw new Error('Too many login attempts. Please try again in a few minutes.');
      }

      if (errMsg) throw new Error(errMsg);
      throw new Error('Failed to sign in. Please try again.');
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string, age: number): Promise<SignUpResult | undefined> => {
    console.log('[Auth] ========== SIGN UP STARTED ==========');
    console.log('[Auth] Email:', email?.slice(0, 3) + '***');

    try {
      console.log('[Auth] Creating account via tRPC backend...');

      const result = await trpcClient.auth.signup.mutate({
        email,
        password,
        name,
        age,
      });

      if (!result.success || !result.user) {
        throw new Error('Signup failed - no user data returned');
      }

      console.log('[Auth] Backend signup successful:', result.user.email);
      console.log('[Auth] Has session tokens:', Boolean(result.accessToken));

      // Establish local Supabase session using tokens from backend
      if (result.accessToken && result.refreshToken) {
        console.log('[Auth] Setting local Supabase session from backend tokens');
        const { error: sessionError } = await supabase.auth.setSession({
          access_token: result.accessToken,
          refresh_token: result.refreshToken,
        });
        if (sessionError) {
          console.warn('[Auth] setSession warning (non-fatal):', sessionError.message);
        }
      }

      const u: User = {
        id: result.user.id,
        email: result.user.email || email,
        name: name,
        age: age,
        emailVerified: Boolean(result.user.emailVerified),
      };

      setUser(u);
      setIsAuthenticated(true);

      if (result.accessToken) {
        setIsSessionValid(true);
        setAccessToken(result.accessToken);
        setRefreshToken(result.refreshToken ?? null);
        await AsyncStorage.setItem('accessToken', result.accessToken);
        if (result.refreshToken) await AsyncStorage.setItem('refreshToken', result.refreshToken);
      } else {
        setIsSessionValid(false);
        setAccessToken(null);
        setRefreshToken(null);
      }

      await AsyncStorage.setItem('user', JSON.stringify(u));
      console.log('[Auth] User saved to AsyncStorage');
      console.log('[Auth] ========== SIGN UP SUCCESS ==========');

      return {
        success: true,
        message: result.message ?? (result.accessToken
          ? 'Account created successfully!'
          : 'Account created! Please check your email to verify your account.'),
        user: u,
      };
    } catch (error: unknown) {
      console.error('[Auth] Signup error:', error);
      const errMsg = error && typeof error === 'object' && 'message' in error
        ? String(error.message)
        : '';

      if (errMsg.includes('Failed to fetch') || errMsg.includes('Network request failed')) {
        throw new Error(
          'Unable to reach the authentication service. Use the demo account — email "demo@dripmaxx.ai" with password "password".'
        );
      }

      if (errMsg.includes('already exists') || errMsg.includes('already registered') || errMsg.includes('CONFLICT')) {
        throw new Error('An account with this email already exists. Please sign in instead.');
      }
      if (errMsg.includes('rate limit') || errMsg.includes('too many') || errMsg.includes('TOO_MANY_REQUESTS')) {
        throw new Error('Too many signup attempts. Please wait a few minutes and try again.');
      }

      if (errMsg) throw new Error(errMsg);
      throw new Error('Failed to create account. Please try again.');
    }
  }, []);

  const signOut = useCallback(async () => {
    console.log('[Auth] ========== SIGNING OUT ==========');
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
        console.log('[Auth] Supabase sign out completed');
      }
    } catch (e) {
      console.warn('[Auth] Supabase sign out error (non-critical):', e);
    }

    setUser(null);
    setIsAuthenticated(false);
    setAccessToken(null);
    setRefreshToken(null);
    setIsSessionValid(false);

    try {
      const allKeys = await AsyncStorage.getAllKeys();
      const userScopedKeys = allKeys.filter(k =>
        k === 'user' ||
        k === 'accessToken' ||
        k === 'refreshToken' ||
        k === 'user_subscription' ||
        k === 'generation_count' ||
        k.startsWith('clothes:') ||
        k.startsWith('savedOutfits:') ||
        k.startsWith('session:') ||
        k.startsWith('budget:')
      );
      if (userScopedKeys.length > 0) {
        await AsyncStorage.multiRemove(userScopedKeys);
        console.log('[Auth] Cleared', userScopedKeys.length, 'user-scoped storage keys');
      }
    } catch (e) {
      console.error('[Auth] Error clearing storage:', e);
    }
    console.log('[Auth] ========== SIGN OUT COMPLETE ==========');
  }, []);

  const reloadUser = useCallback(async () => {
    if (!isSupabaseConfigured) return;
    try {
      const { data } = await supabase.auth.getSession();
      if (data?.session) {
        updateUserFromSession(data.session);
        console.log('[Auth] User reloaded from Supabase session');
      }
    } catch (e) {
      console.error('[Auth] reloadUser error:', e);
    }
  }, []);

  return useMemo(() => ({
    user,
    isAuthenticated,
    accessToken,
    refreshToken,
    isSessionValid,
    signIn,
    signUp,
    signOut,
    reloadUser,
  }), [user, isAuthenticated, accessToken, refreshToken, isSessionValid, signIn, signUp, signOut, reloadUser]);
});
