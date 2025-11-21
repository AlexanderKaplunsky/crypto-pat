import { useEffect, useState } from 'react';
import styles from './TellJokeButton.module.css';

interface TellJokeButtonProps {
  onClick: () => void | Promise<void>;
  isLoading?: boolean;
  isOnCooldown?: boolean;
  cooldownSeconds?: number;
  disabled?: boolean;
}

export const TellJokeButton = ({
  onClick,
  isLoading = false,
  isOnCooldown = false,
  cooldownSeconds = 0,
  disabled = false,
}: TellJokeButtonProps) => {
  const [displayCooldown, setDisplayCooldown] = useState(cooldownSeconds);

  // Update cooldown display every second
  useEffect(() => {
    if (!isOnCooldown || cooldownSeconds <= 0) {
      setDisplayCooldown(0);
      return;
    }

    setDisplayCooldown(cooldownSeconds);
    const interval = setInterval(() => {
      setDisplayCooldown((prev) => {
        if (prev <= 1) {
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOnCooldown, cooldownSeconds]);

  const formatCooldown = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getButtonText = (): string => {
    if (isLoading) {
      return 'Loading...';
    }
    if (isOnCooldown && displayCooldown > 0) {
      return `Tell Joke (${formatCooldown(displayCooldown)})`;
    }
    return 'Tell Joke 😂';
  };

  const isDisabled = disabled || isLoading || isOnCooldown;

  return (
    <button
      className={`${styles.button} ${
        isDisabled ? styles.disabled : styles.ready
      } ${isLoading ? styles.loading : ''}`}
      onClick={onClick}
      disabled={isDisabled}
      aria-label="Tell your pet a joke to make it laugh"
      aria-busy={isLoading}
    >
      {isLoading && <span className={styles.spinner} aria-hidden="true" />}
      <span>{getButtonText()}</span>
    </button>
  );
};

