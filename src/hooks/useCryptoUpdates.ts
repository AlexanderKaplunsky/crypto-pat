import { useState, useEffect, useRef, useCallback } from 'react';
import { cryptoService, type CryptoPrice } from '../services';
import { ErrorHandler } from '../utils/errorHandler';

interface UseCryptoUpdatesOptions {
  coinId: string;
  intervalMs?: number; // Default: 30000 (30 seconds)
  enabled?: boolean; // Default: true
}

interface UseCryptoUpdatesReturn {
  priceData: CryptoPrice | null;
  priceHistory: number[]; // Array of last 10 price values
  loading: boolean;
  error: Error | null;
  errorMessage: string | null; // User-friendly error message for toast
  lastUpdate: number | null;
}

export const useCryptoUpdates = ({
  coinId,
  intervalMs = 30000,
  enabled = true,
}: UseCryptoUpdatesOptions): UseCryptoUpdatesReturn => {
  const [priceData, setPriceData] = useState<CryptoPrice | null>(null);
  const [priceHistory, setPriceHistory] = useState<number[]>([]); // Store last 10 prices
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<number | null>(null);
  const intervalRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  const fetchPrice = useCallback(async () => {
    if (!enabled) return;

    setLoading(true);
    setError(null);

    try {
      const data = await cryptoService.fetchPrice(coinId);
      // Only update state if component is still mounted
      if (mountedRef.current) {
        if (data) {
          setPriceData(data);
          setLastUpdate(Date.now());
          setError(null);
          setErrorMessage(null);
          
          // Update history (keep last 10 points)
          setPriceHistory(prev => {
            const updated = [...prev, data.price];
            return updated.slice(-10); // Keep last 10
          });
        } else {
          // No data and no cache available
          const error = new Error('Failed to fetch price data');
          setError(error);
          setErrorMessage('Unable to fetch prices. Using cached data.');
        }
      }
    } catch (err) {
      // Only update state if component is still mounted
      if (mountedRef.current) {
        const error = err instanceof Error ? err : new Error('Unknown error');
        setError(error);
        setErrorMessage(ErrorHandler.getUserMessage(error));
        ErrorHandler.logError(error, 'useCryptoUpdates');
      }
    } finally {
      // Only update state if component is still mounted
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [coinId, enabled]);

  useEffect(() => {
    mountedRef.current = true;

    // Initial fetch
    fetchPrice();

    // Set up interval if enabled
    if (enabled) {
      intervalRef.current = setInterval(() => {
        fetchPrice();
      }, intervalMs);
    }

    // Cleanup on unmount or when dependencies change
    return () => {
      mountedRef.current = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [fetchPrice, intervalMs, enabled]);

  return {
    priceData,
    priceHistory,
    loading,
    error,
    errorMessage,
    lastUpdate,
  };
};

