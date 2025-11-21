/**
 * WeatherService
 *
 * Centralized service for fetching weather data from OpenWeather API.
 * Implements caching with 15min TTL to respect rate limits and improve performance.
 * Maps weather conditions to mood modifiers that affect the pet's emotional state.
 */

import { cacheManager } from '../utils/cacheManager';
import { ErrorHandler } from '../utils/errorHandler';
import { ENV } from '../config/env';

export interface WeatherData {
  condition: 'sunny' | 'cloudy' | 'rainy';
  temperature: number; // Celsius
  moodModifier: number; // -0.5 to +0.5
  timestamp: number;
  location?: {
    lat: number;
    lon: number;
  };
}

interface OpenWeatherResponse {
  weather: Array<{
    main: string;
    description: string;
  }>;
  main: {
    temp: number; // Kelvin
  };
  coord: {
    lat: number;
    lon: number;
  };
}

class WeatherService {
  private readonly CACHE_TTL = 900000; // 15 minutes in milliseconds
  private pendingRequests: Map<string, Promise<WeatherData | null>> = new Map();

  /**
   * Fetches current weather data for given coordinates.
   * Uses caching to avoid rate limit violations and duplicate requests.
   *
   * @param lat - Latitude
   * @param lon - Longitude
   * @returns Promise resolving to WeatherData or null if fetch fails
   */
  async fetchWeather(lat: number, lon: number): Promise<WeatherData | null> {
    // Validate API key
    if (!ENV.OPENWEATHER_API_KEY) {
      console.warn('OpenWeather API key not configured. Using neutral weather.');
      return this.getNeutralWeather(lat, lon);
    }

    // Round coordinates to 2 decimal places for cache key
    const roundedLat = Math.round(lat * 100) / 100;
    const roundedLon = Math.round(lon * 100) / 100;
    const cacheKey = `weather:${roundedLat}:${roundedLon}`;

    // Check cache first
    const cached = cacheManager.get<WeatherData>(cacheKey);
    if (cached) {
      return cached;
    }

    // Check for pending request
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey)!;
    }

    // Create new request
    const requestPromise = this.fetchWeatherFromAPI(lat, lon, cacheKey);
    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      this.pendingRequests.delete(cacheKey);
    }
  }

  private async fetchWeatherFromAPI(
    lat: number,
    lon: number,
    cacheKey: string
  ): Promise<WeatherData | null> {
    try {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${ENV.OPENWEATHER_API_KEY}&units=metric`;
      
      const response = await fetch(url);

      if (!response.ok) {
        if (response.status === 401) {
          console.error('OpenWeather API: Invalid API key');
        } else if (response.status === 429) {
          console.warn('OpenWeather API: Rate limit exceeded');
        } else {
          console.error(`OpenWeather API error: ${response.status}`);
        }
        return this.getNeutralWeather(lat, lon);
      }

      const data: OpenWeatherResponse = await response.json();
      
      const weatherData = this.mapWeatherToData(data);
      
      // Cache the result
      cacheManager.set(cacheKey, weatherData, this.CACHE_TTL);
      
      return weatherData;
    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      ErrorHandler.logError(err, 'WeatherService.fetchWeatherFromAPI');
      return this.getNeutralWeather(lat, lon);
    }
  }

  private mapWeatherToData(data: OpenWeatherResponse): WeatherData {
    const mainCondition = data.weather[0]?.main?.toLowerCase() || 'clouds';
    const tempCelsius = data.main.temp;
    
    // Map weather conditions to mood modifiers
    let condition: 'sunny' | 'cloudy' | 'rainy';
    let moodModifier: number;

    if (mainCondition.includes('clear') || mainCondition.includes('sun')) {
      condition = 'sunny';
      moodModifier = 0.5;
    } else if (
      mainCondition.includes('rain') ||
      mainCondition.includes('drizzle') ||
      mainCondition.includes('thunderstorm') ||
      mainCondition.includes('snow')
    ) {
      condition = 'rainy';
      moodModifier = -0.5;
    } else {
      // Clouds, mist, fog, etc.
      condition = 'cloudy';
      moodModifier = 0;
    }

    return {
      condition,
      temperature: Math.round(tempCelsius),
      moodModifier,
      timestamp: Date.now(),
      location: {
        lat: data.coord.lat,
        lon: data.coord.lon,
      },
    };
  }

  private getNeutralWeather(lat: number, lon: number): WeatherData {
    return {
      condition: 'cloudy',
      temperature: 20, // Default temperature
      moodModifier: 0,
      timestamp: Date.now(),
      location: {
        lat,
        lon,
      },
    };
  }

  clearCache(lat?: number, lon?: number): void {
    if (lat !== undefined && lon !== undefined) {
      const roundedLat = Math.round(lat * 100) / 100;
      const roundedLon = Math.round(lon * 100) / 100;
      const cacheKey = `weather:${roundedLat}:${roundedLon}`;
      cacheManager.clear(cacheKey);
    } else {
      // Clear all weather cache entries
      cacheManager.clearPattern('^weather:');
    }
  }
}

export const weatherService = new WeatherService();

