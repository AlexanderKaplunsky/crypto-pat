/**
 * CryptoService
 *
 * Centralized service for fetching cryptocurrency price data from CoinGecko API.
 * Implements caching with 30s TTL to respect rate limits and improve performance.
 * Includes error handling with retry logic and fallback to cached data.
 */

import { cacheManager } from '../utils/cacheManager';
import { ErrorHandler } from '../utils/errorHandler';
import type { CryptoPrice } from '../types/crypto';

interface CryptoPriceResponse {
  [coinId: string]: {
    usd: number;
    usd_24h_change: number;
  };
}

class CryptoService {
  private readonly CACHE_TTL = 30000; // 30 seconds
  private pendingRequests: Map<string, Promise<CryptoPrice | null>> = new Map();

  /**
   * Fetches the current price for a cryptocurrency.
   * Uses caching to avoid rate limit violations and duplicate requests.
   *
   * @param coinId - The CoinGecko coin ID (e.g., 'bitcoin', 'ethereum')
   * @returns Promise resolving to CryptoPrice or null if fetch fails
   */
  async fetchPrice(coinId: string): Promise<CryptoPrice | null> {
    // Check cache first
    const cacheKey = `crypto:${coinId}`;
    const cached = cacheManager.get<CryptoPrice>(cacheKey);

    if (cached) {
      return cached;
    }

    // Check if there's already a pending request for this coin
    const pendingRequest = this.pendingRequests.get(cacheKey);
    if (pendingRequest) {
      return pendingRequest;
    }

    // Create new request
    const requestPromise = this.performFetch(cacheKey, coinId);
    this.pendingRequests.set(cacheKey, requestPromise);

    try {
      const result = await requestPromise;
      return result;
    } finally {
      // Clean up pending request
      this.pendingRequests.delete(cacheKey);
    }
  }

  private async performFetch(
    cacheKey: string,
    coinId: string
  ): Promise<CryptoPrice | null> {
    try {
      // Try to fetch with retry logic
      const priceData = await ErrorHandler.retryWithBackoff(async () => {
        const response = await fetch(
          `https://api.coingecko.com/api/v3/simple/price?ids=${coinId}&vs_currencies=usd&include_24hr_change=true`
        );

        if (!response.ok) {
          if (response.status === 429) {
            throw new Error(`API error: 429 Too many requests`);
          } else {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
          }
        }

        const data: CryptoPriceResponse = await response.json();
        const coinData = data[coinId];

        if (!coinData) {
          throw new Error(`Coin ${coinId} not found`);
        }

        const result: CryptoPrice = {
          coinId,
          price: coinData.usd,
          change24h: coinData.usd_24h_change || 0,
          timestamp: Date.now(),
        };

        return result;
      });

      // Cache successful result
      cacheManager.set(cacheKey, priceData, this.CACHE_TTL);
      return priceData;

    } catch (error) {
      const err = error instanceof Error ? error : new Error('Unknown error');
      ErrorHandler.logError(err, 'CryptoService.fetchPrice');

      // Fallback to cached data (even if expired)
      const stale = cacheManager.getStale<CryptoPrice>(cacheKey);
      if (stale) {
        console.warn(`Using stale cache for ${coinId} due to API error`);
        return stale;
      }

      // No cache available - return null (component will show error)
      return null;
    }
  }

  /**
   * Clears the cache for a specific coin or all coins.
   *
   * @param coinId - Optional coin ID to clear specific cache entry
   */
  clearCache(coinId?: string): void {
    if (coinId) {
      cacheManager.clear(`crypto:${coinId}`);
    } else {
      cacheManager.clearPattern('^crypto:');
    }
  }
}

export const cryptoService = new CryptoService();

