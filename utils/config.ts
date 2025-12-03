// Configuration file for API keys and settings

// Gemini is NOT used directly anymore. Leave empty to avoid accidental calls.
export const GEMINI_API_KEY = '';

// Weather API configuration (if you want to use a different weather service)
export const WEATHER_API_KEY = 'your-weather-api-key-here';

// Supabase configuration (read from environment variables)
export const SUPABASE_URL: string = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
export const SUPABASE_ANON_KEY: string = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Public email service (Web3Forms) for feedback delivery
// Create a free key at https://web3forms.com/ and paste it here
export const WEB3FORMS_ACCESS_KEY = '10c958e9-abf0-44be-9513-4a2882c3ccef';
export const FEEDBACK_TO_EMAIL = 'gearr4th@gmail.com' as const;

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