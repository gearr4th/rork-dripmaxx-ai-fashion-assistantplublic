import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/utils/config';

const validUrl = SUPABASE_URL && SUPABASE_URL !== '' && !SUPABASE_URL.includes('placeholder') && SUPABASE_URL.startsWith('https://');
const validKey = SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== '' && !SUPABASE_ANON_KEY.includes('placeholder') && SUPABASE_ANON_KEY.length > 20;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[Supabase] ❌ CRITICAL: Missing Supabase configuration!');
  console.error('[Supabase] SUPABASE_URL:', SUPABASE_URL ? 'SET' : 'MISSING');
  console.error('[Supabase] SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? 'SET' : 'MISSING');
  console.error('[Supabase] Please set EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY in your .env file');
} else if (!validUrl || !validKey) {
  console.error('[Supabase] ❌ Invalid Supabase credentials detected:');
  if (!validUrl) console.error('[Supabase]   - URL is invalid or placeholder');
  if (!validKey) console.error('[Supabase]   - Anon key is invalid or placeholder');
  console.error('[Supabase] App will run in local-only mode');
} else {
  console.log('[Supabase] ✅ Configuration validated successfully');
  console.log('[Supabase] URL:', SUPABASE_URL.substring(0, 40) + '...');
  console.log('[Supabase] Key:', SUPABASE_ANON_KEY.substring(0, 20) + '...');
}

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: AsyncStorage,
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
