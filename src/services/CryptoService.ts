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
import { COINS, type CoinInfo } from '../types/crypto';

interface CryptoPriceResponse {
  [coinId: string]: {
    usd: number;
    usd_24h_change: number;
  };
}

export interface CryptoComparison {
  currentCoin: {
    id: string;
    name: string;
    symbol: string;
    change24h: number;
    price: number;
  };
  worseCoin: {
    id: string;
    name: string;
    symbol: string;
    change24h: number;
    price: number;
  };
  message: string;
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

  /**
   * Finds a worse-performing coin compared to the current coin.
   * Used for the Schadenfreude mechanic to make the pet feel better.
   *
   * @param currentCoinId - The CoinGecko coin ID of the currently selected coin
   * @returns Promise resolving to CryptoComparison or null if no worse performer exists
   */
  async findWorsePerformer(currentCoinId: string): Promise<CryptoComparison | null> {
    try {
      // Get current coin price
      const currentPrice = await this.fetchPrice(currentCoinId);
      if (!currentPrice) {
        throw new Error(`Could not fetch price for current coin: ${currentCoinId}`);
      }

      // Get current coin info
      const currentCoinInfo = COINS.find((coin) => coin.id === currentCoinId);
      if (!currentCoinInfo) {
        throw new Error(`Coin info not found: ${currentCoinId}`);
      }

      // Fetch prices for multiple coins (10-15 popular coins)
      const coinsToCompare = COINS.filter((coin) => coin.id !== currentCoinId).slice(0, 14);
      const pricePromises = coinsToCompare.map((coin) => this.fetchPrice(coin.id));
      const prices = await Promise.all(pricePromises);

      // Filter out null results and find worse performers
      const validPrices = prices
        .map((price, index) => ({
          price,
          coin: coinsToCompare[index],
        }))
        .filter((item) => item.price !== null) as Array<{
        price: CryptoPrice;
        coin: CoinInfo;
      }>;

      // Find coins with worse 24h change than current
      const worsePerformers = validPrices.filter(
        (item) => item.price.change24h < currentPrice.change24h
      );

      // If no worse performer exists, return null
      if (worsePerformers.length === 0) {
        return null;
      }

      // Find the worst performer (lowest change24h)
      const worstPerformer = worsePerformers.reduce((worst, current) =>
        current.price.change24h < worst.price.change24h ? current : worst
      );

      // Generate humorous message
      const message = this.generateSchadenfreudeMessage(
        currentCoinInfo.name,
        worstPerformer.coin.name,
        currentPrice.change24h,
        worstPerformer.price.change24h
      );

      return {
        currentCoin: {
          id: currentCoinInfo.id,
          name: currentCoinInfo.name,
          symbol: currentCoinInfo.symbol,
          change24h: currentPrice.change24h,
          price: currentPrice.price,
        },
        worseCoin: {
          id: worstPerformer.coin.id,
          name: worstPerformer.coin.name,
          symbol: worstPerformer.coin.symbol,
          change24h: worstPerformer.price.change24h,
          price: worstPerformer.price.price,
        },
        message,
      };
    } catch (error) {
      console.error('CryptoService.findWorsePerformer error:', error);
      return null;
    }
  }

  private generateSchadenfreudeMessage(
    _currentName: string,
    worseName: string,
    currentChange: number,
    worseChange: number
  ): string {
    const messages = [
      `At least it's not ${worseName}!`,
      `${worseName} is doing even worse! 😅`,
      `Could be worse... like ${worseName}!`,
      `${worseName} is having a rougher day!`,
      `At least you're not ${worseName}!`,
    ];

    // Select message based on how much worse the other coin is
    const difference = Math.abs(worseChange - currentChange);
    const messageIndex = Math.min(Math.floor(difference / 2), messages.length - 1);

    return messages[messageIndex];
  }
}

export const cryptoService = new CryptoService();

