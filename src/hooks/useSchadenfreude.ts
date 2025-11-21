import { useState, useCallback, useEffect } from 'react';
import { cryptoService, type CryptoComparison } from '../services/CryptoService';
import type { MoodState } from '../types/pet';
import { isCooldownActive, getRemainingCooldown, setCooldown } from '../utils/cooldownManager';

const SCHADENFREUDE_COOLDOWN_SECONDS = 120; // 2 minutes

interface UseSchadenfreudeReturn {
  triggerSchadenfreude: () => Promise<CryptoComparison | null>;
  isLoading: boolean;
  isOnCooldown: boolean;
  cooldownSeconds: number;
}

export function useSchadenfreude(
  currentCoinId: string,
  currentMoodLevel: number,
  onMoodUpdate: (moodLevel: number, moodState: MoodState) => void
): UseSchadenfreudeReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // Update cooldown seconds periodically
  useEffect(() => {
    const updateCooldown = () => {
      const remaining = getRemainingCooldown('schadenfreude');
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

  const triggerSchadenfreude = useCallback(async (): Promise<CryptoComparison | null> => {
    // Check cooldown (check fresh value inside function)
    if (isCooldownActive('schadenfreude')) {
      return null;
    }

    setIsLoading(true);
    try {
      // Find worse performer
      const comparison = await cryptoService.findWorsePerformer(currentCoinId);

      if (!comparison) {
        // No worse coin found - could show error message
        console.warn('No worse performer found for Schadenfreude');
        return null;
      }

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

      // Set cooldown (2 minutes = 120 seconds)
      setCooldown('schadenfreude', SCHADENFREUDE_COOLDOWN_SECONDS);
      setCooldownSeconds(SCHADENFREUDE_COOLDOWN_SECONDS);

      // Return comparison for modal display
      return comparison;
    } catch (error) {
      console.error('Schadenfreude failed:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentCoinId, currentMoodLevel, onMoodUpdate]);

  return {
    triggerSchadenfreude,
    isLoading,
    isOnCooldown,
    cooldownSeconds,
  };
}

