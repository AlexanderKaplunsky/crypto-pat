import { useState, useEffect } from 'react';
import { COINS } from '../../types';
import styles from './CoinSelector.module.css';

interface CoinSelectorProps {
  selectedCoinId: string;
  onCoinChange: (coinId: string) => void;
}

const STORAGE_KEY = 'crypto-pet-selected-coin';

export const CoinSelector = ({ selectedCoinId, onCoinChange }: CoinSelectorProps) => {
  const [localSelected, setLocalSelected] = useState(selectedCoinId);

  // Sync with prop changes
  useEffect(() => {
    setLocalSelected(selectedCoinId);
  }, [selectedCoinId]);

  useEffect(() => {
    // Load from LocalStorage on mount
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && COINS.find(c => c.id === saved)) {
        onCoinChange(saved);
        setLocalSelected(saved);
      } else {
        // Default to Bitcoin
        const defaultCoin = COINS[0]?.id || 'bitcoin';
        onCoinChange(defaultCoin);
        setLocalSelected(defaultCoin);
      }
    } catch {
      // LocalStorage disabled or unavailable
      console.warn('LocalStorage not available, using default coin');
      const defaultCoin = COINS[0]?.id || 'bitcoin';
      onCoinChange(defaultCoin);
      setLocalSelected(defaultCoin);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newCoinId = e.target.value;
    setLocalSelected(newCoinId);
    try {
      localStorage.setItem(STORAGE_KEY, newCoinId);
    } catch {
      console.warn('Failed to save to LocalStorage');
    }
    onCoinChange(newCoinId);
  };

  return (
    <div className={styles.container}>
      <label htmlFor="coin-select" className={styles.label}>
        Track Coin:
      </label>
      <select
        id="coin-select"
        value={localSelected}
        onChange={handleChange}
        className={styles.select}
      >
        {COINS.map((coin) => (
          <option key={coin.id} value={coin.id}>
            {coin.icon} {coin.name} ({coin.symbol.toUpperCase()})
          </option>
        ))}
      </select>
    </div>
  );
};

