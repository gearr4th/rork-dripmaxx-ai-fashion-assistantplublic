import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/utils/config';

const validUrl = SUPABASE_URL && SUPABASE_URL !== '' && !SUPABASE_URL.includes('placeholder') && SUPABASE_URL.startsWith('https://');
const validKey = SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== '' && !SUPABASE_ANON_KEY.includes('placeholder') && SUPABASE_ANON_KEY.length > 20;

// Detect runtime: Deno (server) vs React Native (client).
// Deno exposes a global `Deno` namespace; React Native does not.
const isServer = typeof (globalThis as any).Deno !== 'undefined';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  if (!isServer) {
    console.error('[Supabase] ❌ CRITICAL: Missing Supabase configuration!');
  }
} else if (!validUrl || !validKey) {
  if (!isServer) {
    console.error('[Supabase] ❌ Invalid Supabase credentials detected:');
  }
} else if (!isServer) {
  console.log('[Supabase] ✅ Configuration validated successfully');
}

// On the server, use a simple in-memory storage with no session persistence.
// On the client, use React Native's AsyncStorage for persistent sessions.
let authStorage: {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
};

if (isServer) {
  const store: Record<string, string> = {};
  authStorage = {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
  };
} else {
  // Client only — AsyncStorage is available via Metro bundler.
  const AsyncStorage = require('@react-native-async-storage/async-storage').default;
  authStorage = AsyncStorage;
}

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: !isServer,
      persistSession: !isServer,
      detectSessionInUrl: !isServer,
      storage: authStorage,
      storageKey: 'dripmaxx-auth-token',
      flowType: 'pkce',
    },
    global: {
      headers: {
        'X-Client-Info': 'dripmaxx-app',
      },
    },
    db: {
      schema: 'public',
    },
  }
);

export const isSupabaseConfigured = validUrl && validKey;
