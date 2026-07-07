import { createClient } from '@supabase/supabase-js';

// Server-side Supabase client — uses in-memory storage since AsyncStorage
// isn't available in the Deno runtime. Sessions aren't persisted between
// requests; the server only uses supabase.auth API calls (signUp,
// signInWithPassword) which don't require local session storage.

// The platform-managed env var points at a stale/dead project (uhzxvsdopehhziyoblqa).
// Always override to the live project (qfvwpchklysqgmylhqvn) when the dead ref
// is detected, matching the logic in utils/config.ts.
const FALLBACK_SUPABASE_URL = 'https://qfvwpchklysqgmylhqvn.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmdndwY2hrbHlzcWdteWxocXZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NTUxNzQsImV4cCI6MjA3NjEzMTE3NH0.5Z3BZyanLVSuB_yCwjvEnPtpXdA2oNMAsqcuBpA-8Z0';
const DEAD_REFS = ['uhzxvsdopehhziyoblqa'];

const envUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const envKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';
const isDeadUrl = (u: string): boolean => DEAD_REFS.some((r) => u.includes(r));

const SUPABASE_URL = envUrl && !isDeadUrl(envUrl) ? envUrl : FALLBACK_SUPABASE_URL;
const SUPABASE_ANON_KEY = envUrl && !isDeadUrl(envUrl) && envKey ? envKey : FALLBACK_SUPABASE_ANON_KEY;

if (!SUPABASE_ANON_KEY) {
  console.warn('[Supabase Server] ⚠️ No anon key found. Auth calls will fail.');
} else {
  console.log(`[Supabase Server] ✅ Initialized (${SUPABASE_URL.slice(8, 24)}...)`);
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
