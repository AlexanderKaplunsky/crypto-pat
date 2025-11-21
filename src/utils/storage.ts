import type { MoodState } from '../types/pet';

const STORAGE_KEY = 'cryptoPetState';

export interface StoredPetState {
  // Identity
  id?: string;
  createdAt?: number;
  
  // Crypto
  selectedCoin?: string;
  coinSymbol?: string;
  currentPrice?: number;
  priceChange24h?: number;
  lastPriceUpdate?: number;
  
  // Mood
  moodLevel: number;
  moodState: MoodState;
  
  // Weather
  weatherCondition?: string;
  weatherMoodModifier?: number;
  lastWeatherUpdate?: number;
  
  // Evolution
  evolutionStage?: number;
  stageName?: string;
  
  // Stats
  ageSeconds?: number;
  interactionCount?: number;
  schadenfreudeCount?: number;
  comedyAttempts?: number;
  comedySuccesses?: number;
  
  // Cooldowns
  schadenfreudeCooldownUntil?: number;
  comedyCooldownUntil?: number;
  
  // FTUE
  ftueCompleted?: boolean;
}

export function savePetState(state: Partial<StoredPetState>): void {
  try {
    const existing = loadPetState();
    const updated = { ...existing, ...state };
    
    // Ensure required fields exist
    if (!updated.id) {
      updated.id = generateId();
    }
    if (!updated.createdAt) {
      updated.createdAt = Date.now();
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save pet state:', error);
    // Try to handle quota exceeded error
    if (error instanceof DOMException && error.name === 'QuotaExceededError') {
      console.warn('LocalStorage quota exceeded. Clearing old data...');
      // Could implement LRU cache or data compression here
    }
  }
}

export function loadPetState(): StoredPetState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return getDefaultPetState();
    }
    
    const parsed = JSON.parse(stored);
    
    // Validate and merge with defaults
    const validated = validateAndMergeState(parsed);
    
    return validated;
  } catch (error) {
    console.error('Failed to load pet state:', error);
    return getDefaultPetState();
  }
}

function validateAndMergeState(parsed: unknown): StoredPetState {
  const defaults = getDefaultPetState();
  
  // Ensure parsed is an object
  if (typeof parsed !== 'object' || parsed === null) {
    return defaults;
  }
  
  const obj = parsed as Record<string, unknown>;
  
  // Validate mood data
  let moodLevel = defaults.moodLevel;
  if (typeof obj.moodLevel === 'number' && obj.moodLevel >= 1 && obj.moodLevel <= 5) {
    moodLevel = obj.moodLevel;
  }
  
  let moodState: MoodState = defaults.moodState;
  if (typeof obj.moodState === 'string' && ['happy', 'neutral', 'sad'].includes(obj.moodState)) {
    moodState = obj.moodState as MoodState;
  }
  
  // Validate evolution stage
  let evolutionStage = defaults.evolutionStage;
  if (typeof obj.evolutionStage === 'number' && obj.evolutionStage >= 1 && obj.evolutionStage <= 3) {
    evolutionStage = obj.evolutionStage;
  }
  
  // Merge with defaults (ensures all fields exist)
  return {
    ...defaults,
    ...obj,
    moodLevel,
    moodState,
    evolutionStage,
  };
}

function getDefaultPetState(): StoredPetState {
  return {
    id: generateId(),
    createdAt: Date.now(),
    moodLevel: 3,
    moodState: 'neutral',
    selectedCoin: 'bitcoin',
    coinSymbol: 'BTC',
    evolutionStage: 1,
    stageName: 'Baby',
    ageSeconds: 0,
    interactionCount: 0,
    schadenfreudeCount: 0,
    comedyAttempts: 0,
    comedySuccesses: 0,
  };
}

function generateId(): string {
  // Simple UUID v4-like generator
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function clearPetState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear pet state:', error);
  }
}

// Helper to check if pet state exists
export function hasPetState(): boolean {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored !== null && stored !== '';
  } catch {
    return false;
  }
}

// Comprehensive reset function that clears all pet data
export function resetAllPetData(): void {
  try {
    // Clear main pet state
    clearPetState();
    
    // Note: Cooldowns are cleared via clearAllCooldowns() which should be called separately
    // This keeps concerns separated - storage.ts handles pet state, cooldownManager handles cooldowns
  } catch (error) {
    console.error('Failed to reset pet data:', error);
  }
}

// FTUE (First-Time User Experience) functions
export function hasCompletedFTUE(): boolean {
  try {
    const state = loadPetState();
    return state.ftueCompleted === true;
  } catch {
    return false;
  }
}

export function markFTUECompleted(): void {
  savePetState({ ftueCompleted: true });
}

