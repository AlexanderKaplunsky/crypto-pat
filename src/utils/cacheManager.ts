/**
 * CacheManager
 *
 * Centralized cache management utility with TTL support, fallback scenarios,
 * and pattern-based cache invalidation. Used for caching API responses to
 * respect rate limits and improve app responsiveness.
 */

interface CacheEntry<T> {
  data: T;
  expires: number;
  timestamp: number;
}

class CacheManager {
  private cache: Map<string, CacheEntry<any>> = new Map();

  /**
   * Get cached data if it exists and hasn't expired
   */
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expires) {
      // Return expired data as fallback (for error scenarios)
      return entry.data;
    }

    return entry.data;
  }

  /**
   * Get cached data even if expired (for fallback scenarios)
   */
  getStale<T>(key: string): T | null {
    const entry = this.cache.get(key);
    return entry ? entry.data : null;
  }

  /**
   * Set cache entry with TTL
   */
  set<T>(key: string, data: T, ttlMs: number = 30000): void {
    const now = Date.now();
    this.cache.set(key, {
      data,
      expires: now + ttlMs,
      timestamp: now,
    });
  }

  /**
   * Check if key exists and is valid (not expired)
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    return Date.now() <= entry.expires;
  }

  /**
   * Clear specific cache entry
   */
  clear(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Clear all cache entries matching a pattern
   */
  clearPattern(pattern: string): void {
    const regex = new RegExp(pattern);
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache
   */
  clearAll(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics (for debugging)
   */
  getStats() {
    const now = Date.now();
    let valid = 0;
    let expired = 0;

    for (const entry of this.cache.values()) {
      if (now <= entry.expires) {
        valid++;
      } else {
        expired++;
      }
    }

    return {
      total: this.cache.size,
      valid,
      expired,
    };
  }
}

export const cacheManager = new CacheManager();
export type { CacheEntry };

