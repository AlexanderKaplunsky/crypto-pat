import { useEffect, useState, useMemo } from 'react';
import { useCryptoUpdates } from '../../hooks';
import { COINS } from '../../types';
import { Toast } from './Toast';
import { Sparkline } from './Sparkline';
import styles from './CryptoStatusBar.module.css';

interface CryptoStatusBarProps {
  coinId: string;
}

export const CryptoStatusBar = ({ coinId }: CryptoStatusBarProps) => {
  const { priceData, priceHistory, loading, error, errorMessage, lastUpdate } = useCryptoUpdates({ coinId });
  const [updateTrigger, setUpdateTrigger] = useState(0);
  const [showToast, setShowToast] = useState(false);

  // Show toast when error occurs
  useEffect(() => {
    if (errorMessage && !priceData) {
      setShowToast(true);
    }
  }, [errorMessage, priceData]);

  // Update relative time display every second
  useEffect(() => {
    if (!priceData) return;

    const interval = setInterval(() => {
      // Force re-render to update relative time
      setUpdateTrigger((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [priceData]);

  // Determine sparkline color based on trend (must be called before early returns)
  const sparklineColor = useMemo(() => {
    if (!priceData || priceHistory.length < 2) return 'gray';
    const change = priceData.change24h || 0;
    if (change > 0.5) return 'green';
    if (change < -0.5) return 'red';
    return 'gray';
  }, [priceData, priceHistory]);

  if (loading && !priceData) {
    return (
      <div className={styles.container}>
        <span className={styles.loading}>Loading price data...</span>
      </div>
    );
  }

  if (error || !priceData) {
    return (
      <>
        <div className={styles.container}>
          <span className={styles.error}>
            {error ? `Error: ${error.message}` : 'Unable to fetch price data'}
          </span>
        </div>
        {showToast && errorMessage && (
          <Toast
            message={errorMessage}
            type="warning"
            duration={3000}
            onClose={() => setShowToast(false)}
          />
        )}
      </>
    );
  }

  const coin = COINS.find(c => c.id === coinId);
  const coinName = coin?.symbol.toUpperCase() || coinId;
  const change24h = priceData.change24h || 0;
  
  // Determine color and arrow
  const isPositive = change24h > 0.5;
  const isNegative = change24h < -0.5;
  const colorClass = isPositive ? styles.positive : isNegative ? styles.negative : styles.neutral;
  const arrow = isPositive ? '↑' : isNegative ? '↓' : '→';
  const sign = change24h > 0 ? '+' : '';

  // Calculate time ago using priceData timestamp or lastUpdate
  // updateTrigger is used to force re-render every second (intentionally unused in calculation)
  const timestamp = priceData.timestamp || lastUpdate || Date.now();
  const secondsAgo = Math.floor((Date.now() - timestamp) / 1000);
  // Use updateTrigger to satisfy TypeScript (forces re-render every second)
  void updateTrigger;
  const timeAgo = secondsAgo < 60 
    ? `${secondsAgo}s ago` 
    : `${Math.floor(secondsAgo / 60)}m ago`;

  return (
    <div className={`${styles.container} ${colorClass}`}>
      <span className={styles.coinName}>{coinName}:</span>
      <span className={styles.price}>${priceData.price.toLocaleString('en-US', { 
        minimumFractionDigits: 2, 
        maximumFractionDigits: 2 
      })}</span>
      <Sparkline 
        data={priceHistory} 
        color={sparklineColor}
        width={60}
        height={16}
      />
      <span className={styles.change}>
        {arrow} {sign}{change24h.toFixed(2)}% (24h)
      </span>
      <span className={styles.timestamp}>[Updated: {timeAgo}]</span>
    </div>
  );
};

