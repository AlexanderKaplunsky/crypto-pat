import styles from './CheerUpButton.module.css';

interface CheerUpButtonProps {
  onClick: () => void | Promise<void>;
  isLoading?: boolean;
  isOnCooldown?: boolean;
  cooldownSeconds?: number;
  disabled?: boolean;
}

export const CheerUpButton = ({
  onClick,
  isLoading = false,
  isOnCooldown = false,
  cooldownSeconds = 0,
  disabled = false,
}: CheerUpButtonProps) => {
  // Use cooldownSeconds directly from props (updated by parent hook every second)
  // This avoids maintaining separate state and prevents linting errors
  const displayCooldown = isOnCooldown && cooldownSeconds > 0 ? cooldownSeconds : 0;

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
      return `Cheer Up (${formatCooldown(displayCooldown)})`;
    }
    return 'Cheer Up 🎉';
  };

  const isDisabled = disabled || isLoading || isOnCooldown;

  return (
    <button
      className={`${styles.button} ${
        isDisabled ? styles.disabled : styles.ready
      } ${isLoading ? styles.loading : ''}`}
      onClick={onClick}
      disabled={isDisabled}
      aria-label="Cheer up your pet by showing a worse-performing coin"
      aria-busy={isLoading}
    >
      {isLoading && <span className={styles.spinner} aria-hidden="true" />}
      <span>{getButtonText()}</span>
    </button>
  );
};

