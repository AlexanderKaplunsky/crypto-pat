import { useEffect, useState } from 'react';
import type { JokeRating } from '../../types/comedy';
import type { MoodState } from '../../types/pet';
import styles from './ComedyJudgeResultsModal.module.css';

interface ComedyJudgeResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  rating: JokeRating;
  currentMood: MoodState;
  onSuccess?: () => void;
}

const SUCCESS_THRESHOLDS = {
  happy: 3,
  neutral: 5,
  sad: 7,
} as const;

const AUTO_CLOSE_DELAY = 5000; // 5 seconds

export const ComedyJudgeResultsModal = ({
  isOpen,
  onClose,
  rating,
  currentMood,
  onSuccess,
}: ComedyJudgeResultsModalProps) => {
  const [timeRemaining, setTimeRemaining] = useState(AUTO_CLOSE_DELAY / 1000);

  // Auto-close timer
  useEffect(() => {
    if (!isOpen) {
      setTimeRemaining(AUTO_CLOSE_DELAY / 1000);
      return;
    }

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onClose();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, onClose]);

  const getThreshold = (): number => {
    return SUCCESS_THRESHOLDS[currentMood] ?? SUCCESS_THRESHOLDS.neutral;
  };

  const isSuccessful = (): boolean => {
    return rating.rating >= getThreshold();
  };

  // Trigger success callback if successful
  useEffect(() => {
    if (isOpen && isSuccessful() && onSuccess) {
      onSuccess();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, rating.rating, currentMood]);

  const truncateJoke = (text: string, maxLength: number = 200): string => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const renderStars = (): string => {
    const filled = '⭐';
    const empty = '○';
    return filled.repeat(rating.rating) + empty.repeat(10 - rating.rating);
  };

  const getRatingColor = (): string => {
    if (rating.rating >= 7) return 'var(--color-success)';
    if (rating.rating >= 4) return 'var(--color-warning)';
    return 'var(--color-error)';
  };

  const threshold = getThreshold();
  const success = isSuccessful();
  const moodLabel = currentMood.charAt(0).toUpperCase() + currentMood.slice(1);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div
        className={`${styles.modal} ${success ? styles.success : styles.failure}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close modal"
        >
          ×
        </button>

        <h2 className={styles.title}>AI Comedy Judge Results 🎭</h2>

        <div className={styles.content}>
          <div className={styles.jokeSection}>
            <h3 className={styles.sectionTitle}>Your Joke:</h3>
            <p className={styles.jokeText}>{truncateJoke(rating.jokeText)}</p>
          </div>

          <div className={styles.ratingSection}>
            <div className={styles.ratingDisplay}>
              <span
                className={styles.ratingNumber}
                style={{ color: getRatingColor() }}
              >
                {rating.rating}/10
              </span>
              <div className={styles.stars}>{renderStars()}</div>
            </div>

            <div className={styles.feedback}>
              <p>{rating.feedback}</p>
            </div>
          </div>

          <div className={styles.thresholdSection}>
            <p className={styles.threshold}>
              Threshold: <strong>{threshold}/10</strong> ({moodLabel} pet)
            </p>
          </div>

          <div className={styles.resultSection}>
            {success ? (
              <div className={styles.successMessage}>
                ✅ SUCCESS! Pet laughed! 🎉
              </div>
            ) : (
              <div className={styles.failureMessage}>
                ❌ Not funny enough. Try again!
              </div>
            )}
          </div>

          <div className={styles.actions}>
            <button
              className={`${styles.button} ${styles.buttonPrimary}`}
              onClick={onClose}
              type="button"
            >
              Continue
            </button>
          </div>

          <div className={styles.autoClose}>
            Auto-closing in {timeRemaining}s...
          </div>
        </div>
      </div>
    </div>
  );
};

