import { useEffect } from 'react';
import type { CryptoComparison } from '../../services/CryptoService';
import styles from './SchadenfreudeModal.module.css';

interface SchadenfreudeModalProps {
  comparison: CryptoComparison | null;
  onClose: () => void;
}

export const SchadenfreudeModal = ({ comparison, onClose }: SchadenfreudeModalProps) => {
  // Auto-close after 3 seconds
  useEffect(() => {
    if (!comparison) return;

    const timer = setTimeout(() => {
      onClose();
    }, 3000);

    return () => clearTimeout(timer);
  }, [comparison, onClose]);

  if (!comparison) {
    return null;
  }

  const formatChange = (change: number): { symbol: string; color: string } => {
    if (change > 0) {
      return { symbol: '↑', color: 'green' };
    } else if (change < 0) {
      return { symbol: '↓', color: 'red' };
    } else {
      return { symbol: '→', color: 'gray' };
    }
  };

  const currentChange = formatChange(comparison.currentCoin.change24h);
  const worseChange = formatChange(comparison.worseCoin.change24h);

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close modal"
        >
          ×
        </button>

        <h2 className={styles.title}>Schadenfreude Boost! 🎉</h2>

        <div className={styles.comparison}>
          <div className={styles.coinRow}>
            <span className={styles.label}>Your Coin:</span>
            <span className={styles.coinInfo}>
              {comparison.currentCoin.symbol.toUpperCase()}{' '}
              <span className={styles[`change-${currentChange.color}`]}>
                {currentChange.symbol} {Math.abs(comparison.currentCoin.change24h).toFixed(2)}%
              </span>
            </span>
          </div>

          <div className={styles.coinRow}>
            <span className={styles.label}>Worse Coin:</span>
            <span className={styles.coinInfo}>
              {comparison.worseCoin.symbol.toUpperCase()}{' '}
              <span className={styles[`change-${worseChange.color}`]}>
                {worseChange.symbol} {Math.abs(comparison.worseCoin.change24h).toFixed(2)}%
              </span>
            </span>
          </div>
        </div>

        <p className={styles.message}>"{comparison.message}"</p>
      </div>
    </div>
  );
};

