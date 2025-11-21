import type { MoodState } from '../types/pet';

export interface MoodCalculationResult {
  moodLevel: number; // 1-5
  moodState: MoodState; // 'happy' | 'neutral' | 'sad'
}

/**
 * Calculates pet mood based on cryptocurrency price change and weather modifier.
 * 
 * Algorithm:
 * - Price > +5%  → Level 5 (Happy)
 * - Price 0-5%   → Level 4 (Happy)
 * - Price 0--5%  → Level 2 (Sad)
 * - Price < -5%  → Level 1 (Sad)
 * - Else         → Level 3 (Neutral)
 * 
 * Weather modifier (-0.5 to +0.5) is added to base mood level.
 * Final mood is clamped between 1 and 5.
 * 
 * @param priceChange24h - 24-hour price change percentage (e.g., 2.5 for +2.5%)
 * @param weatherModifier - Weather modifier (-0.5 to +0.5), defaults to 0
 * @returns Object with moodLevel (1-5) and moodState ('happy' | 'neutral' | 'sad')
 */
export function calculateMood(
  priceChange24h: number,
  weatherModifier: number = 0
): MoodCalculationResult {
  // Handle invalid inputs
  if (typeof priceChange24h !== 'number' || isNaN(priceChange24h)) {
    // Return neutral mood for invalid inputs
    return {
      moodLevel: 3,
      moodState: 'neutral',
    };
  }

  // Calculate base mood from price change
  let baseMood: number;
  
  if (priceChange24h > 5) {
    baseMood = 5; // Very happy
  } else if (priceChange24h > 0 && priceChange24h <= 5) {
    baseMood = 4; // Happy
  } else if (priceChange24h === 0) {
    baseMood = 3; // Neutral
  } else if (priceChange24h >= -5 && priceChange24h < 0) {
    baseMood = 2; // Sad
  } else {
    // priceChange24h < -5
    baseMood = 1; // Very sad
  }
  
  // Apply weather modifier and round to nearest integer
  let finalMood = Math.round(baseMood + weatherModifier);
  
  // Clamp mood level between 1 and 5
  finalMood = Math.max(1, Math.min(5, finalMood));
  
  // Determine mood state based on final level
  let moodState: MoodState;
  if (finalMood >= 4) {
    moodState = 'happy';
  } else if (finalMood <= 2) {
    moodState = 'sad';
  } else {
    moodState = 'neutral';
  }
  
  return {
    moodLevel: finalMood,
    moodState,
  };
}

