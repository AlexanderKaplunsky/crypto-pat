export { cacheManager, type CacheEntry } from './cacheManager';
export {
  setCooldown,
  isCooldownActive,
  getRemainingCooldown,
  clearCooldown,
  getCooldownExpiresAt,
  clearAllCooldowns,
} from './cooldownManager';
export { ErrorHandler } from './errorHandler';
export { calculateMood, type MoodCalculationResult } from './moodCalculator';
export { savePetState, loadPetState, clearPetState, type StoredPetState } from './storage';
export {
  checkEvolution,
  type EvolutionCheckResult,
  type EvolutionStage,
  type EvolutionReason,
} from './evolutionChecker';
