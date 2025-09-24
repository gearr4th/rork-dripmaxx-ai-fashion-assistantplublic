// Configuration file for API keys and settings

// Gemini is NOT used directly anymore. Leave empty to avoid accidental calls.
export const GEMINI_API_KEY = '';

// Weather API configuration (if you want to use a different weather service)
export const WEATHER_API_KEY = 'your-weather-api-key-here';

// Supabase configuration (set these to enable real auth)
// Example:
// export const SUPABASE_URL = 'https://your-project-ref.supabase.co';
// export const SUPABASE_ANON_KEY = 'eyJhbGciOi...';
export const SUPABASE_URL: string = 'https://sjficpnclhtkqnerqnwe.supabase.co';
export const SUPABASE_ANON_KEY: string = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNqZmljcG5jbGh0a3FuZXJxbndlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2MzUyMjYsImV4cCI6MjA3MjIxMTIyNn0.60Erd_5qqkd_1KqDxdVfQkGhCPBysxa-9cHwAZJ_Gmk';

// Public email service (Web3Forms) for feedback delivery
// Create a free key at https://web3forms.com/ and paste it here
export const WEB3FORMS_ACCESS_KEY: string = '';
export const FEEDBACK_TO_EMAIL: string = 'gearr4th@gmail.com';

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