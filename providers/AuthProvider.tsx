import { useState, useEffect, useMemo, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import createContextHook from "@nkzw/create-context-hook";
import { trpc } from "@/lib/trpc";

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
      const userData = await AsyncStorage.getItem("user");
      const token = await AsyncStorage.getItem('accessToken');
      const rtoken = await AsyncStorage.getItem('refreshToken');
      
      if (userData) {
        const parsed = JSON.parse(userData) as User;
        setUser(parsed);
        setIsAuthenticated(true);
        setAccessToken(token ?? null);
        setRefreshToken(rtoken ?? null);
        console.log('[Auth] Loaded user from storage:', parsed.email);
        return;
      }
      
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
      console.log('[Auth] Using demo account');
    } catch (error) {
      console.error("[Auth] Failed to load user", error);
    }
  };

  const signIn = useCallback(async (email: string, password: string) => {
    console.log('[Auth] signIn started', { email: email?.slice(0, 3) + '***' });

    try {
      const result = await loginMutation.mutateAsync({ 
        email, 
        password 
      });

      if (!result.success || !result.user) {
        throw new Error("Login failed");
      }

      console.log('[Auth] Login successful:', result.user.email);

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
      if (result.accessToken) {
        await AsyncStorage.setItem('accessToken', result.accessToken);
      }
      if (result.refreshToken) {
        await AsyncStorage.setItem('refreshToken', result.refreshToken);
      }
    } catch (error: unknown) {
      console.error('[Auth] signIn error:', error);
      
      if (error && typeof error === 'object' && 'message' in error) {
        throw new Error(String(error.message));
      }
      
      throw new Error('Failed to sign in. Please try again.');
    }
  }, [loginMutation]);

  const signUp = useCallback(async (email: string, password: string, name: string, age: number) => {
    console.log('[Auth] signUp started', { email: email?.slice(0, 3) + '***' });

    try {
      const result = await signupMutation.mutateAsync({
        email,
        password,
        name,
        age,
      });

      if (!result.success || !result.user) {
        throw new Error("Signup failed");
      }

      console.log('[Auth] Signup successful:', result.user.email);

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
      if (result.accessToken) {
        await AsyncStorage.setItem('accessToken', result.accessToken);
      }
      if (result.refreshToken) {
        await AsyncStorage.setItem('refreshToken', result.refreshToken);
      }

      if (result.message && !result.user.emailVerified) {
        console.log('[Auth] Email verification required:', result.message);
      }
    } catch (error: unknown) {
      console.error('[Auth] signUp error:', error);
      
      if (error && typeof error === 'object' && 'message' in error) {
        throw new Error(String(error.message));
      }
      
      throw new Error('Failed to create account. Please try again.');
    }
  }, [signupMutation]);

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
