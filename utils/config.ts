// Configuration file for API keys and settings

// Replace with your actual Gemini API key from Google AI Studio
// Get your key at: https://makersuite.google.com/app/apikey
// Replace 'YOUR_ACTUAL_API_KEY_HERE' with your real Gemini API key
// Get your key at: https://makersuite.google.com/app/apikey
export const GEMINI_API_KEY = 'AIzaSyDpIpEu0enKLo0-wncDtXpQEjKdHLnXEEo';

// Weather API configuration (if you want to use a different weather service)
export const WEATHER_API_KEY = 'your-weather-api-key-here';

// Supabase configuration (set these to enable real auth)
// Example:
// export const SUPABASE_URL = 'https://your-project-ref.supabase.co';
// export const SUPABASE_ANON_KEY = 'eyJhbGciOi...';
export const SUPABASE_URL: string = '';
export const SUPABASE_ANON_KEY: string = '';

// Public email service (Web3Forms) for feedback delivery
// Create a free key at https://web3forms.com/ and paste it here
export const WEB3FORMS_ACCESS_KEY: string = '';
export const FEEDBACK_TO_EMAIL: string = 'gearr4th@gmail.com';

// Other configuration options
export const CONFIG = {
  // Gemini model to use
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