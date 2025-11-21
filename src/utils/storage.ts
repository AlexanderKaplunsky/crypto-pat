import type { MoodState } from '../types/pet';

const STORAGE_KEY = 'cryptoPetState';

export interface StoredPetState {
  // Mood data
  moodLevel: number;
  moodState: MoodState;
  
  // Other state (add as needed)
  selectedCoin?: string;
  evolutionStage?: number;
}

export function savePetState(state: Partial<StoredPetState>): void {
  try {
    const existing = loadPetState();
    const updated = { ...existing, ...state };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Failed to save pet state:', error);
  }
}

export function loadPetState(): StoredPetState {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return getDefaultPetState();
    }
    
    const parsed = JSON.parse(stored);
    
    // Validate mood data
    if (typeof parsed.moodLevel !== 'number' || parsed.moodLevel < 1 || parsed.moodLevel > 5) {
      parsed.moodLevel = 3;
    }
    if (!['happy', 'neutral', 'sad'].includes(parsed.moodState)) {
      parsed.moodState = 'neutral';
    }
    
    return {
      ...getDefaultPetState(),
      ...parsed,
    };
  } catch (error) {
    console.error('Failed to load pet state:', error);
    return getDefaultPetState();
  }
}

function getDefaultPetState(): StoredPetState {
  return {
    moodLevel: 3,
    moodState: 'neutral',
    selectedCoin: 'bitcoin',
    evolutionStage: 1,
  };
}

export function clearPetState(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear pet state:', error);
  }
}

