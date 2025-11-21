import { useEffect, useState } from 'react';
import type { WeatherData } from '../../services/WeatherService';
import styles from './WeatherIndicator.module.css';

interface WeatherIndicatorProps {
  weather: WeatherData | null;
  isLoading?: boolean;
  className?: string;
}

const WEATHER_ICONS = {
  sunny: '☀️',
  cloudy: '☁️',
  rainy: '🌧️',
} as const;

const WEATHER_LABELS = {
  sunny: 'Sunny',
  cloudy: 'Cloudy',
  rainy: 'Rainy',
} as const;

export const WeatherIndicator = ({
  weather,
  isLoading = false,
  className = '',
}: WeatherIndicatorProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const hasData = weather !== null || isLoading;

  // Fade in animation when data becomes available
  useEffect(() => {
    if (hasData) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsVisible(true);
    }
  }, [hasData]);

  if (!weather && !isLoading) {
    return null; // Don't show if no data and not loading
  }

  const getMoodModifierColor = (modifier: number): string => {
    if (modifier > 0) return styles.positive;
    if (modifier < 0) return styles.negative;
    return styles.neutral;
  };

  const formatMoodModifier = (modifier: number): string => {
    if (modifier > 0) return `+${modifier}`;
    return modifier.toString();
  };

  return (
    <div className={`${styles.container} ${className} ${isVisible ? styles.visible : ''}`}>
      {isLoading ? (
        <div className={styles.loading}>
          <span className={styles.loadingText}>Loading weather...</span>
        </div>
      ) : weather ? (
        <>
          <div className={styles.icon}>{WEATHER_ICONS[weather.condition]}</div>
          <div className={styles.content}>
            <div className={styles.condition}>{WEATHER_LABELS[weather.condition]}</div>
            {weather.temperature !== undefined && (
              <div className={styles.temperature}>{weather.temperature}°C</div>
            )}
            <div className={`${styles.modifier} ${getMoodModifierColor(weather.moodModifier)}`}>
              {formatMoodModifier(weather.moodModifier)} mood
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
};

