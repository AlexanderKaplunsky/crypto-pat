import { useState, useCallback, useEffect } from 'react';
import { geminiService } from '../services/GeminiService';
import type { JokeRating } from '../types/comedy';
import type { MoodState } from '../types/pet';
import { isCooldownActive, getRemainingCooldown, setCooldown } from '../utils/cooldownManager';

const COMEDY_COOLDOWN_SECONDS = 60; // 1 minute

interface UseComedyJudgeResult {
  isLoading: boolean;
  isOnCooldown: boolean;
  cooldownSeconds: number;
  submitJoke: (jokeText: string) => Promise<JokeRating | null>;
  lastRating: JokeRating | null;
}

function getThreshold(mood: MoodState): number {
  const thresholds = {
    happy: 3,
    neutral: 5,
    sad: 7,
  };
  return thresholds[mood] ?? thresholds.neutral;
}

export function useComedyJudge(
  currentMood: MoodState,
  currentMoodLevel: number,
  onMoodUpdate: (moodLevel: number, moodState: MoodState) => void
): UseComedyJudgeResult {
  const [isLoading, setIsLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const [lastRating, setLastRating] = useState<JokeRating | null>(null);

  // Update cooldown seconds periodically
  useEffect(() => {
    const updateCooldown = () => {
      const remaining = getRemainingCooldown('comedy');
      setCooldownSeconds(remaining);
    };

    // Initial update
    updateCooldown();

    // Update every second
    const interval = setInterval(() => {
      updateCooldown();
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Calculate isOnCooldown from current cooldown seconds (reactive)
  const isOnCooldown = cooldownSeconds > 0;

  const submitJoke = useCallback(
    async (jokeText: string): Promise<JokeRating | null> => {
      // Check cooldown
      if (isCooldownActive('comedy')) {
        const remaining = getRemainingCooldown('comedy');
        throw new Error(`Please wait ${remaining} seconds before telling another joke.`);
      }

      setIsLoading(true);
      try {
        const rating = await geminiService.rateJoke(jokeText);
        setLastRating(rating);

        // Set cooldown (1 minute = 60 seconds)
        setCooldown('comedy', COMEDY_COOLDOWN_SECONDS);
        setCooldownSeconds(COMEDY_COOLDOWN_SECONDS);

        // Check if successful
        const threshold = getThreshold(currentMood);
        if (rating.rating >= threshold) {
          // Boost mood by 1 level (clamped to max 5)
          const newMoodLevel = Math.min(5, currentMoodLevel + 1);

          // Determine new mood state based on level
          let newMoodState: MoodState;
          if (newMoodLevel >= 4) {
            newMoodState = 'happy';
          } else if (newMoodLevel <= 2) {
            newMoodState = 'sad';
          } else {
            newMoodState = 'neutral';
          }

          // Update mood
          onMoodUpdate(newMoodLevel, newMoodState);
        }

        return rating;
      } catch (error) {
        console.error('Failed to rate joke:', error);
        throw error;
      } finally {
        setIsLoading(false);
      }
    },
    [currentMood, currentMoodLevel, onMoodUpdate]
  );

  return {
    isLoading,
    isOnCooldown,
    cooldownSeconds,
    submitJoke,
    lastRating,
  };
}

