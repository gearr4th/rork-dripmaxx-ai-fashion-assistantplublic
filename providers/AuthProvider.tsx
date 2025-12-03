import { useState, useEffect, useMemo, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { trpc } from "@/lib/trpc";
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

  const loginMutation = trpc.auth.login.useMutation();
  const signupMutation = trpc.auth.signup.useMutation();

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
    console.log('[Auth] signIn started', { email: email?.slice(0, 3) + '***' });

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
      console.log('[Auth] Attempting tRPC login...');
      const result = await loginMutation.mutateAsync({ 
        email, 
        password 
      });

      if (!result.success || !result.user) {
        throw new Error("Login failed");
      }

      console.log('[Auth] ✓ tRPC login successful:', result.user.email, 'ID:', result.user.id);

      const u: User = {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        age: result.user.age,
        emailVerified: result.user.emailVerified,
      };

      setUser(u);
      setIsAuthenticated(true);
      setAccessToken(result.accessToken);
      setRefreshToken(result.refreshToken);
      
      await AsyncStorage.setItem('user', JSON.stringify(u));
      console.log('[Auth] ✓ User saved to AsyncStorage');
      if (result.accessToken) {
        await AsyncStorage.setItem('accessToken', result.accessToken);
        console.log('[Auth] ✓ Access token saved');
      }
      if (result.refreshToken) {
        await AsyncStorage.setItem('refreshToken', result.refreshToken);
        console.log('[Auth] ✓ Refresh token saved');
      }

      if (result.accessToken && result.refreshToken) {
        console.log('[Auth] Setting Supabase session...');
        const { data, error } = await supabase.auth.setSession({
          access_token: result.accessToken,
          refresh_token: result.refreshToken,
        });
        if (error) {
          console.error('[Auth] Failed to set Supabase session:', error);
        } else {
          console.log('[Auth] ✓ Supabase session set successfully. User ID:', data?.user?.id);
        }
      }
    } catch (error: unknown) {
      console.error('[Auth] tRPC login failed, falling back to direct Supabase:', error);
      
      const errorMsg = error && typeof error === 'object' && 'message' in error 
        ? String(error.message) 
        : String(error);
      
      if (errorMsg.includes('JSON') || errorMsg.includes('SyntaxError') || errorMsg.includes('fetch')) {
        console.log('[Auth] Backend unavailable, using direct Supabase authentication');
        
        try {
          const { data, error: supabaseError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });

          if (supabaseError) {
            console.error('[Auth] Supabase direct login failed:', supabaseError);
            throw new Error(supabaseError.message || 'Authentication failed');
          }

          if (!data.user || !data.session) {
            throw new Error('Login failed - no user data returned');
          }

          console.log('[Auth] ✓ Direct Supabase login successful:', data.user.email);

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
          console.log('[Auth] ✓ Direct Supabase session saved');
          return;
        } catch (supabaseErr) {
          console.error('[Auth] Direct Supabase auth also failed:', supabaseErr);
          throw supabaseErr;
        }
      }
      
      if (error && typeof error === 'object' && 'message' in error) {
        throw new Error(String(error.message));
      }
      
      throw new Error('Failed to sign in. Please try again.');
    }
  }, [loginMutation]);

  const signUp = useCallback(async (email: string, password: string, name: string, age: number): Promise<SignUpResult | undefined> => {
    console.log('[Auth] signUp started', { email: email?.slice(0, 3) + '***' });

    try {
      console.log('[Auth] Attempting tRPC signup...');
      const result = await signupMutation.mutateAsync({
        email,
        password,
        name,
        age,
      });

      if (!result.success || !result.user) {
        throw new Error("Signup failed");
      }

      console.log('[Auth] ✓ tRPC signup successful:', result.user.email, 'ID:', result.user.id);

      const u: User = {
        id: result.user.id,
        email: result.user.email,
        name: result.user.name,
        age: result.user.age,
        emailVerified: result.user.emailVerified,
      };

      setUser(u);
      setIsAuthenticated(true);
      setAccessToken(result.accessToken);
      setRefreshToken(result.refreshToken);
      
      await AsyncStorage.setItem("user", JSON.stringify(u));
      console.log('[Auth] ✓ User saved to AsyncStorage');
      if (result.accessToken) {
        await AsyncStorage.setItem('accessToken', result.accessToken);
        console.log('[Auth] ✓ Access token saved');
      }
      if (result.refreshToken) {
        await AsyncStorage.setItem('refreshToken', result.refreshToken);
        console.log('[Auth] ✓ Refresh token saved');
      }

      if (result.accessToken && result.refreshToken) {
        console.log('[Auth] Setting Supabase session after signup...');
        const { data, error } = await supabase.auth.setSession({
          access_token: result.accessToken,
          refresh_token: result.refreshToken,
        });
        if (error) {
          console.error('[Auth] Failed to set Supabase session:', error);
        } else {
          console.log('[Auth] ✓ Supabase session set successfully. User ID:', data?.user?.id);
        }
      }

      if (result.message && !result.user.emailVerified) {
        console.log('[Auth] Email verification required:', result.message);
      }

      return {
        success: true,
        message: result.message,
        user: u,
      };
    } catch (error: unknown) {
      console.error('[Auth] tRPC signup failed, falling back to direct Supabase:', error);
      
      const errorMsg = error && typeof error === 'object' && 'message' in error 
        ? String(error.message) 
        : String(error);
      
      if (errorMsg.includes('JSON') || errorMsg.includes('SyntaxError') || errorMsg.includes('fetch')) {
        console.log('[Auth] Backend unavailable, using direct Supabase signup');
        
        try {
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
            console.error('[Auth] Supabase direct signup failed:', supabaseError);
            throw new Error(supabaseError.message || 'Signup failed');
          }

          if (!data.user) {
            throw new Error('Signup failed - no user data returned');
          }

          console.log('[Auth] ✓ Direct Supabase signup successful:', data.user.email);

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
          console.log('[Auth] ✓ Direct Supabase signup saved');
          
          const message = data.session 
            ? 'Account created successfully!' 
            : '⚠️ Account created! Please check your email to verify your account.';
          
          return {
            success: true,
            message,
            user: u,
          };
        } catch (supabaseErr) {
          console.error('[Auth] Direct Supabase signup also failed:', supabaseErr);
          throw supabaseErr;
        }
      }
      
      if (error && typeof error === 'object' && 'message' in error) {
        throw new Error(String(error.message));
      }
      
      throw new Error('Failed to create account. Please try again.');
    }
  }, [signupMutation]);

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
