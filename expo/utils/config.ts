// Configuration file for API keys and settings

// Gemini is NOT used directly anymore. Leave empty to avoid accidental calls.
export const GEMINI_API_KEY = '';

// Weather API configuration (if you want to use a different weather service)
export const WEATHER_API_KEY = 'your-weather-api-key-here';

// Supabase configuration (read from environment variables)
// Support both process.env and direct access for web compatibility
const getEnvVar = (key: string): string => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  return '';
};

// Live Supabase project (qfvwpchklysqgmylhqvn). Hardcoded because the
// platform-managed .env points at a stale/dead project. Env var still wins
// if set to a valid value, so prod overrides remain possible.
const FALLBACK_SUPABASE_URL = 'https://qfvwpchklysqgmylhqvn.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFmdndwY2hrbHlzcWdteWxocXZuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjA1NTUxNzQsImV4cCI6MjA3NjEzMTE3NH0.5Z3BZyanLVSuB_yCwjvEnPtpXdA2oNMAsqcuBpA-8Z0';

const envUrl = getEnvVar('EXPO_PUBLIC_SUPABASE_URL');
const envKey = getEnvVar('EXPO_PUBLIC_SUPABASE_ANON_KEY');

// Known-dead project ref — always override to fallback.
const DEAD_REFS = ['uhzxvsdopehhziyoblqa'];
const isDeadUrl = (u: string): boolean => DEAD_REFS.some((r) => u.includes(r));

export const SUPABASE_URL: string = envUrl && !isDeadUrl(envUrl) ? envUrl : FALLBACK_SUPABASE_URL;
export const SUPABASE_ANON_KEY: string = envUrl && !isDeadUrl(envUrl) && envKey ? envKey : FALLBACK_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn('[Config] Supabase environment variables not found!');
  console.warn('[Config] SUPABASE_URL:', SUPABASE_URL ? 'SET' : 'MISSING');
  console.warn('[Config] SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? 'SET' : 'MISSING');
}

// Feedback is sent via formsubmit.co (no API key needed).
// Keep a single recipient across the app and backend.
export const FEEDBACK_TO_EMAIL = 'nmam.amnm@gmail.com' as const;

// Other configuration options
export const CONFIG = {
  // Model label kept only for reference; not used directly
  GEMINI_MODEL: 'gemini-1.5-flash',
  
  // Default fashion trends if none are provided
  DEFAULT_TRENDS: [
    'Modern casual',
    'Minimalist',
    'Streetwear',
    'Business casual',
    'Athleisure',
    'Vintage inspired',
    'Sustainable fashion'
  ],
  
  // Temperature thresholds for outfit recommendations
  TEMPERATURE_THRESHOLDS: {
    COLD: 10,
    WARM: 20,
    HOT: 30
  }
};