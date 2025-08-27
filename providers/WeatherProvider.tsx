import { useState, useEffect, useCallback, useMemo } from "react";
import { Platform } from "react-native";
import * as Location from 'expo-location';
import createContextHook from "@nkzw/create-context-hook";
import { Weather } from "@/types";

interface WeatherContextType {
  weather: Weather | null;
  loading: boolean;
  error: string | null;
  fetchWeather: () => Promise<void>;
  getCurrentLocation: () => Promise<{ latitude: number; longitude: number } | null>;
}

export const [WeatherProvider, useWeather] = createContextHook<WeatherContextType>(() => {
  const [weather, setWeather] = useState<Weather | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getCurrentLocation = useCallback(async (): Promise<{ latitude: number; longitude: number } | null> => {
    try {
      if (Platform.OS === 'web') {
        return new Promise((resolve, reject) => {
          if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by this browser'));
            return;
          }

          navigator.geolocation.getCurrentPosition(
            (position) => {
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
              });
            },
            (error) => {
              let errorMessage = 'Unknown geolocation error';
              let code: number | undefined;
              if (typeof error === 'object' && error) {
                const ge = error as GeolocationPositionError;
                code = ge.code;
                switch (ge.code) {
                  case ge.PERMISSION_DENIED:
                    errorMessage = 'Location access denied by user';
                    break;
                  case ge.POSITION_UNAVAILABLE:
                    errorMessage = 'Location information unavailable';
                    break;
                  case ge.TIMEOUT:
                    errorMessage = 'Location request timed out';
                    break;
                  default:
                    errorMessage = ge.message || 'Geolocation failed';
                }
              }
              if (code === 1 || errorMessage.includes('denied')) {
                console.warn('Geolocation permission denied. Falling back to approximate location.');
                resolve(null);
                return;
              }
              console.error('Geolocation error:', errorMessage);
              reject(new Error(errorMessage));
            },
            {
              enableHighAccuracy: false,
              timeout: 15000,
              maximumAge: 600000,
            }
          );
        });
      } else {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          console.log('Location permission denied');
          return null;
        }

        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });
        
        return {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to get location';
      if (errorMessage.toLowerCase().includes('denied')) {
        console.warn('Location access denied. Returning null to allow graceful fallback.');
        return null;
      }
      console.error('Failed to get location:', errorMessage);
      return null;
    }
  }, []);

  const fetchWeatherByCoords = useCallback(async (lat: number, lon: number) => {
    try {
      const response = await fetch(`https://wttr.in/${lat},${lon}?format=j1`);
      if (!response.ok) {
        throw new Error(`Weather API request failed: ${response.status}`);
      }
      const data = await response.json();
      if (!data.current_condition || !data.current_condition[0]) {
        throw new Error('Invalid weather data format');
      }
      const current = data.current_condition[0];
      const location = data.nearest_area && data.nearest_area[0]
        ? `${data.nearest_area[0].areaName[0].value}, ${data.nearest_area[0].country[0].value}`
        : 'Unknown Location';
      const weatherData: Weather = {
        temperature: Math.round(parseInt(current.temp_C)),
        condition: current.weatherDesc[0].value,
        humidity: parseInt(current.humidity),
        windSpeed: Math.round(parseInt(current.windspeedKmph)),
        location,
      };
      return weatherData;
    } catch (error) {
      console.error('Weather API error:', error);
      try {
        const fallbackResponse = await fetch(
          `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&timezone=auto`
        );
        if (fallbackResponse.ok) {
          const fallbackData = await fallbackResponse.json();
          const current = fallbackData.current_weather as { temperature: number; weathercode: number; windspeed: number };
          const getWeatherDescription = (code: number): string => {
            if (code === 0) return 'Clear';
            if (code <= 3) return 'Partly Cloudy';
            if (code <= 48) return 'Foggy';
            if (code <= 67) return 'Rainy';
            if (code <= 77) return 'Snowy';
            if (code <= 82) return 'Showers';
            if (code <= 99) return 'Thunderstorm';
            return 'Unknown';
          };
          return {
            temperature: Math.round(current.temperature),
            condition: getWeatherDescription(current.weathercode),
            humidity: 50,
            windSpeed: Math.round(current.windspeed),
            location: `${lat.toFixed(2)}, ${lon.toFixed(2)}`,
          } as Weather;
        }
      } catch (fallbackError) {
        console.error('Fallback weather API also failed:', fallbackError);
      }
      throw error;
    }
  }, []);

  const getApproximateLocationByIP = useCallback(async (): Promise<{ latitude: number; longitude: number; label?: string } | null> => {
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (!res.ok) return null;
      const json: any = await res.json();
      if (typeof json.latitude === 'number' && typeof json.longitude === 'number') {
        const label = json.city && json.country_name ? `${json.city}, ${json.country_name}` : undefined;
        return { latitude: json.latitude, longitude: json.longitude, label };
      }
      return null;
    } catch (e) {
      console.log('IP geolocation failed');
      return null;
    }
  }, []);

  const fetchWeather = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const precise = await getCurrentLocation();
      if (precise) {
        const weatherData = await fetchWeatherByCoords(precise.latitude, precise.longitude);
        setWeather(weatherData);
        return;
      }
      const approx = await getApproximateLocationByIP();
      if (approx) {
        const weatherData = await fetchWeatherByCoords(approx.latitude, approx.longitude);
        setWeather({ ...weatherData, location: weatherData.location || approx.label || 'Approximate Location' });
        setError('Using approximate location (permission denied).');
        return;
      }
      console.log('Location access denied, using default location for weather');
      try {
        const defaultWeatherData = await fetchWeatherByCoords(40.7128, -74.0060);
        setWeather({
          ...defaultWeatherData,
          location: "Default Location"
        });
        setError('Location access denied. Showing weather for default location.');
      } catch {
        const mockWeather: Weather = {
          temperature: 22,
          condition: "Partly Cloudy",
          humidity: 65,
          windSpeed: 12,
          location: "Default Location",
        };
        setWeather(mockWeather);
        setError('Location access denied. Using sample weather data.');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch weather data';
      if (!errorMessage.includes('Location access denied')) {
        console.error('Failed to fetch weather:', errorMessage);
        setError(errorMessage);
      }
      const fallbackWeather: Weather = {
        temperature: 20,
        condition: "Partly Cloudy",
        humidity: 50,
        windSpeed: 10,
        location: "Default Location",
      };
      setWeather(fallbackWeather);
      if (errorMessage.includes('Location access denied')) {
        setError('Location access denied. Using sample weather data.');
      }
    } finally {
      setLoading(false);
    }
  }, [getCurrentLocation, fetchWeatherByCoords, getApproximateLocationByIP]);

  // Auto-fetch weather on mount
  useEffect(() => {
    fetchWeather();
  }, [fetchWeather]);

  return useMemo(() => ({
    weather,
    loading,
    error,
    fetchWeather,
    getCurrentLocation,
  }), [weather, loading, error, fetchWeather, getCurrentLocation]);
});