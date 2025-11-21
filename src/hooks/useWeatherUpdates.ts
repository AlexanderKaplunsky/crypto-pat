import { useState, useEffect, useRef, useCallback } from 'react';
import { weatherService, type WeatherData } from '../services/WeatherService';

interface UseWeatherUpdatesOptions {
  latitude: number | null;
  longitude: number | null;
  updateInterval?: number; // Default: 15 minutes
  enabled?: boolean; // Default: true
}

export function useWeatherUpdates({
  latitude,
  longitude,
  updateInterval = 900000, // 15 minutes in milliseconds
  enabled = true,
}: UseWeatherUpdatesOptions) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const intervalRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  const fetchWeather = useCallback(async () => {
    if (!latitude || !longitude || !enabled) {
      return;
    }

    setIsLoading(true);
    try {
      const weatherData = await weatherService.fetchWeather(latitude, longitude);
      if (mountedRef.current && weatherData) {
        setWeather(weatherData);
      }
    } catch (error) {
      console.error('Failed to fetch weather:', error);
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [latitude, longitude, enabled]);

  // Initial fetch
  useEffect(() => {
    mountedRef.current = true;
    
    if (latitude && longitude && enabled) {
      fetchWeather();
    }

    return () => {
      mountedRef.current = false;
    };
  }, [latitude, longitude, enabled, fetchWeather]);

  // Set up periodic updates
  useEffect(() => {
    if (!latitude || !longitude || !enabled) {
      return;
    }

    intervalRef.current = setInterval(() => {
      fetchWeather();
    }, updateInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [latitude, longitude, updateInterval, enabled, fetchWeather]);

  return {
    weather,
    isLoading,
    moodModifier: weather?.moodModifier ?? 0,
    refetch: fetchWeather,
  };
}

