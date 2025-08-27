# DripMaxx AI - Gemini Integration Setup

## Getting Your Gemini API Key

1. **Visit Google AI Studio**: Go to [https://makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)

2. **Sign in**: Use your Google account to sign in

3. **Create API Key**: Click "Create API Key" button

4. **Copy the Key**: Copy the generated API key

## Setting Up the API Key

1. **Open the config file**: Navigate to `utils/config.ts`

2. **Replace the placeholder**: Find this line:
   ```typescript
   export const GEMINI_API_KEY = 'your-gemini-api-key-here';
   ```

3. **Paste your key**: Replace `'your-gemini-api-key-here'` with your actual API key:
   ```typescript
   export const GEMINI_API_KEY = 'AIzaSyC...your-actual-key-here';
   ```

## How It Works

The Gemini AI integration will:

1. **Analyze Weather**: Consider current temperature, humidity, wind speed, and conditions
2. **Factor in Trends**: Use current fashion trends for your age group
3. **Consider Occasion**: Take your prompt/setting into account
4. **Smart Selection**: Choose from your scanned clothes intelligently
5. **Fallback System**: If AI fails, it falls back to smart weather-based selection

## Features

- **Weather-Appropriate**: Suggests warm clothes for cold weather, light clothes for hot weather
- **Trend-Aware**: Incorporates current fashion trends
- **Occasion-Specific**: Adapts to your specified setting (work, casual, date, etc.)
- **Color Coordination**: AI considers color matching
- **Style Cohesion**: Ensures the outfit works together as a whole

## Testing

Once you've added your API key:

1. Add some clothes to your wardrobe via the scan feature
2. Go to the home screen
3. Enter a prompt like "Going to work" or "Date night"
4. Tap "Generate Outfit"
5. Check the console logs to see the AI interaction

## Troubleshooting

- **API Key Issues**: Make sure your key is valid and has no extra spaces
- **Network Issues**: Check your internet connection
- **Quota Exceeded**: Gemini has usage limits; check your Google AI Studio dashboard
- **Fallback Mode**: If AI fails, the app will still work with smart selection

## Cost

Gemini 1.5 Flash is very affordable:
- Free tier: 15 requests per minute
- Paid tier: Very low cost per request

Your outfit generation requests are typically small and shouldn't cost much.