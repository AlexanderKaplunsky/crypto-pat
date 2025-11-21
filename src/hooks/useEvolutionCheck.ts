import { useEffect, useRef } from 'react';
import { checkEvolution, type EvolutionCheckResult } from '../utils/evolutionChecker';
import type { PetState } from '../types/pet';

interface UseEvolutionCheckOptions {
  petState: PetState & { ageSeconds?: number; interactionCount?: number };
  onEvolution?: (result: EvolutionCheckResult) => void;
  enabled?: boolean; // Default: true
}

interface UseEvolutionCheckReturn {
  shouldEvolve: boolean;
  evolutionResult: EvolutionCheckResult;
}

export function useEvolutionCheck({
  petState,
  onEvolution,
  enabled = true,
}: UseEvolutionCheckOptions): UseEvolutionCheckReturn {
  const lastEvolutionStageRef = useRef<PetState['evolutionStage']>(petState.evolutionStage);
  const hasEvolvedRef = useRef(false);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // Reset evolution flag if stage changed externally
    if (petState.evolutionStage !== lastEvolutionStageRef.current) {
      hasEvolvedRef.current = false;
      lastEvolutionStageRef.current = petState.evolutionStage;
    }

    // Check if evolution should occur
    const evolutionResult = checkEvolution(petState);

    // Only trigger if evolution should occur and hasn't been triggered yet
    if (evolutionResult.shouldEvolve && !hasEvolvedRef.current) {
      hasEvolvedRef.current = true;
      
      // Call callback if provided
      if (onEvolution) {
        onEvolution(evolutionResult);
      }
    }
  }, [
    petState.evolutionStage,
    petState.ageSeconds,
    petState.interactionCount,
    enabled,
    onEvolution,
  ]);

  // Return current evolution check result for UI
  const evolutionResult = checkEvolution(petState);
  
  return {
    shouldEvolve: evolutionResult.shouldEvolve && !hasEvolvedRef.current,
    evolutionResult,
  };
}

