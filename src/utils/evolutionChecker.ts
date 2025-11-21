import type { PetState } from '../types/pet';

export type EvolutionStage = 'baby' | 'adult' | 'legendary';
export type EvolutionReason = 'age' | 'interactions' | null;

export interface EvolutionCheckResult {
  shouldEvolve: boolean;
  nextStage: EvolutionStage | null;
  reason: EvolutionReason;
  currentStage: EvolutionStage;
}

const EVOLUTION_THRESHOLDS = {
  babyToAdult: {
    ageSeconds: 300, // 5 minutes
    interactions: 10,
  },
  adultToLegendary: {
    ageSeconds: 900, // 15 minutes
    interactions: 25,
  },
} as const;

/**
 * Checks if a pet should evolve based on age and interaction count.
 * 
 * Evolution rules:
 * - Baby → Adult: 300 seconds (5 min) OR 10 interactions
 * - Adult → Legendary: 900 seconds (15 min) OR 25 interactions
 * - Legendary: Cannot evolve further
 * 
 * @param petState - The pet's current state
 * @returns Evolution check result with shouldEvolve flag and next stage info
 */
export function checkEvolution(petState: PetState & { ageSeconds?: number; interactionCount?: number }): EvolutionCheckResult {
  // Extract evolution stage - handle both number (1,2,3) and string ('baby','adult','legendary') formats
  let evolutionStage: EvolutionStage;
  if (typeof petState.evolutionStage === 'number') {
    // Map number stages to string stages for compatibility
    const stageMap: Record<number, EvolutionStage> = {
      1: 'baby',
      2: 'adult',
      3: 'legendary',
    };
    evolutionStage = stageMap[petState.evolutionStage] || 'baby';
  } else {
    evolutionStage = petState.evolutionStage as EvolutionStage;
  }

  const { ageSeconds, interactionCount } = petState;

  // Validate input
  if (!evolutionStage || ageSeconds === undefined || interactionCount === undefined) {
    console.warn('Invalid pet state provided to checkEvolution', {
      evolutionStage,
      ageSeconds,
      interactionCount,
    });
    return {
      shouldEvolve: false,
      nextStage: null,
      reason: null,
      currentStage: evolutionStage || 'baby',
    };
  }

  // Legendary stage cannot evolve further
  if (evolutionStage === 'legendary') {
    return {
      shouldEvolve: false,
      nextStage: null,
      reason: null,
      currentStage: 'legendary',
    };
  }

  // Check Baby → Adult evolution
  if (evolutionStage === 'baby') {
    const meetsAgeThreshold = ageSeconds >= EVOLUTION_THRESHOLDS.babyToAdult.ageSeconds;
    const meetsInteractionThreshold = interactionCount >= EVOLUTION_THRESHOLDS.babyToAdult.interactions;

    if (meetsAgeThreshold || meetsInteractionThreshold) {
      return {
        shouldEvolve: true,
        nextStage: 'adult',
        reason: meetsAgeThreshold ? 'age' : 'interactions',
        currentStage: 'baby',
      };
    }
  }

  // Check Adult → Legendary evolution
  if (evolutionStage === 'adult') {
    const meetsAgeThreshold = ageSeconds >= EVOLUTION_THRESHOLDS.adultToLegendary.ageSeconds;
    const meetsInteractionThreshold = interactionCount >= EVOLUTION_THRESHOLDS.adultToLegendary.interactions;

    if (meetsAgeThreshold || meetsInteractionThreshold) {
      return {
        shouldEvolve: true,
        nextStage: 'legendary',
        reason: meetsAgeThreshold ? 'age' : 'interactions',
        currentStage: 'adult',
      };
    }
  }

  // No evolution needed
  return {
    shouldEvolve: false,
    nextStage: null,
    reason: null,
    currentStage: evolutionStage,
  };
}

