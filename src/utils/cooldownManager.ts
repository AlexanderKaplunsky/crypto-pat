/**
 * Cooldown management utilities for game mechanics.
 */

const COOLDOWN_STORAGE_PREFIX = 'cooldown_';

/**
 * Sets a cooldown for a specific feature.
 * @param featureId - Unique identifier for the feature (e.g., 'schadenfreude')
 * @param durationSeconds - Cooldown duration in seconds
 * @returns Timestamp when cooldown expires (milliseconds since epoch)
 */
export function setCooldown(featureId: string, durationSeconds: number): number {
  const expiresAt = Date.now() + durationSeconds * 1000;
  const storageKey = `${COOLDOWN_STORAGE_PREFIX}${featureId}`;
  
  try {
    localStorage.setItem(storageKey, expiresAt.toString());
  } catch (error) {
    console.error(`Failed to set cooldown for ${featureId}:`, error);
  }
  
  return expiresAt;
}

/**
 * Checks if a cooldown is currently active.
 * @param featureId - Unique identifier for the feature
 * @returns True if cooldown is active, false otherwise
 */
export function isCooldownActive(featureId: string): boolean {
  const remaining = getRemainingCooldown(featureId);
  return remaining > 0;
}

/**
 * Gets the remaining cooldown time in seconds.
 * @param featureId - Unique identifier for the feature
 * @returns Remaining seconds (0 if expired or not set)
 */
export function getRemainingCooldown(featureId: string): number {
  const storageKey = `${COOLDOWN_STORAGE_PREFIX}${featureId}`;
  
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) {
      return 0;
    }
    
    const expiresAt = parseInt(stored, 10);
    if (isNaN(expiresAt)) {
      return 0;
    }
    
    const remaining = Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000));
    
    // Clean up expired cooldowns
    if (remaining === 0) {
      clearCooldown(featureId);
    }
    
    return remaining;
  } catch (error) {
    console.error(`Failed to get cooldown for ${featureId}:`, error);
    return 0;
  }
}

/**
 * Clears a cooldown for a specific feature.
 * @param featureId - Unique identifier for the feature
 */
export function clearCooldown(featureId: string): void {
  const storageKey = `${COOLDOWN_STORAGE_PREFIX}${featureId}`;
  
  try {
    localStorage.removeItem(storageKey);
  } catch (error) {
    console.error(`Failed to clear cooldown for ${featureId}:`, error);
  }
}

/**
 * Gets the expiration timestamp for a cooldown.
 * @param featureId - Unique identifier for the feature
 * @returns Expiration timestamp (milliseconds) or null if not set
 */
export function getCooldownExpiresAt(featureId: string): number | null {
  const storageKey = `${COOLDOWN_STORAGE_PREFIX}${featureId}`;
  
  try {
    const stored = localStorage.getItem(storageKey);
    if (!stored) {
      return null;
    }
    
    const expiresAt = parseInt(stored, 10);
    return isNaN(expiresAt) ? null : expiresAt;
  } catch (error) {
    console.error(`Failed to get cooldown expiration for ${featureId}:`, error);
    return null;
  }
}

/**
 * Clears all cooldowns (useful for reset functionality).
 */
export function clearAllCooldowns(): void {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach((key) => {
      if (key.startsWith(COOLDOWN_STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  } catch (error) {
    console.error('Failed to clear all cooldowns:', error);
  }
}

