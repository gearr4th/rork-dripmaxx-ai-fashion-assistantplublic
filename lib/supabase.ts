import { createClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '@/utils/config';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('[Supabase] ❌ CRITICAL: Missing Supabase configuration!');
  console.error('[Supabase] SUPABASE_URL:', SUPABASE_URL ? 'SET' : 'MISSING');
  console.error('[Supabase] SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? 'SET' : 'MISSING');
}

const validUrl = SUPABASE_URL && SUPABASE_URL !== '' && !SUPABASE_URL.includes('placeholder');
const validKey = SUPABASE_ANON_KEY && SUPABASE_ANON_KEY !== '' && !SUPABASE_ANON_KEY.includes('placeholder');

if (validUrl && validKey) {
  console.log('[Supabase] ✅ Configuration loaded:', SUPABASE_URL.substring(0, 30) + '...');
} else {
  console.error('[Supabase] ❌ Invalid Supabase credentials. App will run in demo mode.');
}

export const supabase = createClient(
  SUPABASE_URL || 'https://placeholder.supabase.co',
  SUPABASE_ANON_KEY || 'placeholder-key',
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
    global: {
      headers: {
        'X-Client-Info': 'dripmaxx-app',
      },
    },
  }
);

export const isSupabaseConfigured = validUrl && validKey;
