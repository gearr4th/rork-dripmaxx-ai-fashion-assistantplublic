import { useState, useEffect, useMemo, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { supabase } from "@/lib/supabase";

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

  useEffect(() => {
    void loadUser();
  }, []);

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
        console.log('[Auth] ✓ Found stored user:', parsed.email, 'ID:', parsed.id);
        
        if (token && rtoken && parsed.id !== 'demo-user-id') {
          console.log('[Auth] Attempting to restore Supabase session...');
          try {
            const { data, error } = await supabase.auth.setSession({
              access_token: token,
              refresh_token: rtoken,
            });
            
            if (error) {
              console.error('[Auth] ⚠️  Session restoration failed:', error.message);
              console.log('[Auth] Clearing invalid session data...');
              await AsyncStorage.removeItem('accessToken');
              await AsyncStorage.removeItem('refreshToken');
              setAccessToken(null);
              setRefreshToken(null);
            } else if (data?.session) {
              console.log('[Auth] ✅ Session restored successfully!');
              console.log('[Auth] Session user:', data.user?.email);
              
              const newAccessToken = data.session.access_token;
              const newRefreshToken = data.session.refresh_token;
              
              if (newAccessToken !== token) {
                console.log('[Auth] Session was refreshed, updating tokens...');
                await AsyncStorage.setItem('accessToken', newAccessToken);
                await AsyncStorage.setItem('refreshToken', newRefreshToken);
                setAccessToken(newAccessToken);
                setRefreshToken(newRefreshToken);
              } else {
                setAccessToken(token);
                setRefreshToken(rtoken);
              }
            } else {
              console.warn('[Auth] Session restoration returned no session');
              setAccessToken(null);
              setRefreshToken(null);
            }
          } catch (sessionError) {
            console.error('[Auth] Exception restoring session:', sessionError);
            await AsyncStorage.removeItem('accessToken');
            await AsyncStorage.removeItem('refreshToken');
            setAccessToken(null);
            setRefreshToken(null);
          }
        } else if (parsed.id === 'demo-user-id') {
          console.log('[Auth] Demo user detected, skipping session restoration');
          setAccessToken(null);
          setRefreshToken(null);
        } else {
          console.warn('[Auth] Missing tokens, user logged out or session expired');
          setAccessToken(null);
          setRefreshToken(null);
        }
        
        setUser(parsed);
        setIsAuthenticated(true);
        console.log('[Auth] ========== USER LOADED SUCCESSFULLY ==========');
        return;
      }
      
      console.log('[Auth] No stored user found, using demo account');
      const demo: User = { 
        id: 'demo-user-id', 
        email: 'demo@dripmaxx.ai', 
        name: 'Demo User', 
        age: 25, 
        emailVerified: true 
      };
      setUser(demo);
      setIsAuthenticated(true);
      setAccessToken(null);
      setRefreshToken(null);
      await AsyncStorage.setItem('user', JSON.stringify(demo));
      console.log('[Auth] ✓ Demo account initialized');
      console.log('[Auth] ========================================');
    } catch (error) {
      console.error("[Auth] ❌ FATAL: Failed to load user", error);
      const demo: User = { 
        id: 'demo-user-id', 
        email: 'demo@dripmaxx.ai', 
        name: 'Demo User', 
        age: 25, 
        emailVerified: true 
      };
      setUser(demo);
      setIsAuthenticated(true);
    }
  };

  const signIn = useCallback(async (email: string, password: string) => {
    console.log('[Auth] ========== SIGN IN STARTED ==========');
    console.log('[Auth] Email:', email?.slice(0, 3) + '***');

    if (email === "demo@dripmaxx.ai" && password === "password") {
      console.log('[Auth] Demo login - bypassing backend');
      const demoUser: User = {
        id: "demo-user-id",
        email: "demo@dripmaxx.ai",
        name: "Demo User",
        age: 25,
        emailVerified: true,
      };
      setUser(demoUser);
      setIsAuthenticated(true);
      setAccessToken(null);
      setRefreshToken(null);
      await AsyncStorage.setItem('user', JSON.stringify(demoUser));
      console.log('[Auth] ✓ Demo login successful');
      return;
    }

    try {
      console.log('[Auth] Using direct Supabase authentication...');
      
      const { data, error: supabaseError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (supabaseError) {
        console.error('[Auth] ❌ Supabase login failed:', supabaseError.message);
        const msg = supabaseError.message || 'Authentication failed';
        if (msg.toLowerCase().includes('invalid') || msg.toLowerCase().includes('credentials')) {
          throw new Error('Invalid email or password. Please check your credentials.');
        }
        throw new Error(msg);
      }

      if (!data.user || !data.session) {
        throw new Error('Login failed - no user data returned');
      }

      console.log('[Auth] ✅ Supabase login successful:', data.user.email);

      const u: User = {
        id: data.user.id,
        email: data.user.email || email,
        name: data.user.user_metadata?.name,
        age: data.user.user_metadata?.age,
        emailVerified: Boolean(data.user.email_confirmed_at),
      };

      setUser(u);
      setIsAuthenticated(true);
      setAccessToken(data.session.access_token);
      setRefreshToken(data.session.refresh_token);
      
      await AsyncStorage.setItem('user', JSON.stringify(u));
      await AsyncStorage.setItem('accessToken', data.session.access_token);
      await AsyncStorage.setItem('refreshToken', data.session.refresh_token);
      console.log('[Auth] ========== SIGN IN SUCCESS ==========');
    } catch (error: unknown) {
      console.error('[Auth] ❌ Login error:', error);
      if (error && typeof error === 'object' && 'message' in error) {
        throw new Error(String(error.message));
      }
      throw new Error('Failed to sign in. Please try again.');
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, name: string, age: number): Promise<SignUpResult | undefined> => {
    console.log('[Auth] ========== SIGN UP STARTED ==========');
    console.log('[Auth] Email:', email?.slice(0, 3) + '***');

    try {
      console.log('[Auth] Using direct Supabase signup...');
      
      const { data, error: supabaseError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name,
            age,
          },
        },
      });

      if (supabaseError) {
        console.error('[Auth] ❌ Supabase signup failed:', supabaseError.message);
        const msg = supabaseError.message || 'Signup failed';
        if (msg.toLowerCase().includes('already registered') || msg.toLowerCase().includes('already exists')) {
          throw new Error('An account with this email already exists. Please sign in instead.');
        }
        throw new Error(msg);
      }

      if (!data.user) {
        throw new Error('Signup failed - no user data returned');
      }

      console.log('[Auth] ✅ Supabase signup successful:', data.user.email);

      const u: User = {
        id: data.user.id,
        email: data.user.email || email,
        name: name,
        age: age,
        emailVerified: Boolean(data.user.email_confirmed_at),
      };

      setUser(u);
      setIsAuthenticated(true);
      
      if (data.session) {
        setAccessToken(data.session.access_token);
        setRefreshToken(data.session.refresh_token);
        await AsyncStorage.setItem('accessToken', data.session.access_token);
        await AsyncStorage.setItem('refreshToken', data.session.refresh_token);
      } else {
        setAccessToken(null);
        setRefreshToken(null);
      }
      
      await AsyncStorage.setItem('user', JSON.stringify(u));
      console.log('[Auth] ✓ User saved to AsyncStorage');
      console.log('[Auth] ========== SIGN UP SUCCESS ==========');
      
      const message = data.session 
        ? 'Account created successfully!' 
        : 'Account created! Please check your email to verify your account.';
      
      return {
        success: true,
        message,
        user: u,
      };
    } catch (error: unknown) {
      console.error('[Auth] ❌ Signup error:', error);
      if (error && typeof error === 'object' && 'message' in error) {
        throw new Error(String(error.message));
      }
      throw new Error('Failed to create account. Please try again.');
    }
  }, []);

  const signOut = useCallback(async () => {
    console.log('[Auth] Signing out...');
    setUser(null);
    setIsAuthenticated(false);
    setAccessToken(null);
    setRefreshToken(null);
    await AsyncStorage.removeItem("user");
    await AsyncStorage.removeItem('accessToken');
    await AsyncStorage.removeItem('refreshToken');
    await supabase.auth.signOut();
    console.log('[Auth] ✓ Sign out completed');
  }, []);

  const reloadUser = useCallback(async () => {
    console.log('[Auth] reloadUser - skipped (not implemented)');
  }, []);

  return useMemo(() => ({
    user,
    isAuthenticated,
    accessToken,
    refreshToken,
    signIn,
    signUp,
    signOut,
    reloadUser,
  }), [user, isAuthenticated, accessToken, refreshToken, signIn, signUp, signOut, reloadUser]);
});
