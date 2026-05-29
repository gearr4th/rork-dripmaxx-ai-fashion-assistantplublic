import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client — uses in-memory storage since AsyncStorage
// isn't available in the Deno runtime. Sessions aren't persisted between
// requests; the server only uses supabase.auth API calls (signUp,
// signInWithPassword) which don't require local session storage.

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://qfvwpchklysqgmylhqvn.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

if (!SUPABASE_ANON_KEY) {
  console.warn('[Supabase Server] ⚠️ No anon key found in env. Auth calls will fail.');
} else {
  console.log('[Supabase Server] ✅ Initialized');
}

// In-memory storage for the server runtime. Supabase auth-js requires
// a storage object with getItem/setItem/removeItem even when
// persistSession is false, because it always calls _recoverAndRefresh
// during initialization.
const memoryStorage: Record<string, string> = {};

export const supabaseServer = createClient(SUPABASE_URL, SUPABASE_ANON_KEY || 'placeholder-key', {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false,
    storage: {
      getItem: (key: string) => memoryStorage[key] ?? null,
      setItem: (key: string, value: string) => { memoryStorage[key] = value; },
      removeItem: (key: string) => { delete memoryStorage[key]; },
    },
    storageKey: 'dripmaxx-server',
    flowType: 'pkce',
  },
  global: {
    headers: {
      'X-Client-Info': 'dripmaxx-server',
    },
  },
  db: {
    schema: 'public',
  },
});
