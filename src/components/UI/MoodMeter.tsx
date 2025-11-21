import { useEffect, useState, useRef } from 'react';
import type { MoodState } from '../../types/pet';
import styles from './MoodMeter.module.css';

interface MoodMeterProps {
  moodLevel: number; // 1-5
  moodState: MoodState;
}

const MOOD_LABELS: Record<MoodState, string> = {
  happy: 'Happy',
  neutral: 'Neutral',
  sad: 'Sad',
};

export const MoodMeter = ({ moodLevel, moodState }: MoodMeterProps) => {
  const [isAnimating, setIsAnimating] = useState(false);
  const prevMoodLevelRef = useRef(moodLevel);

  useEffect(() => {
    if (moodLevel !== prevMoodLevelRef.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsAnimating(true);
      prevMoodLevelRef.current = moodLevel;
      
      // Reset animation flag after animation completes
      const timer = setTimeout(() => setIsAnimating(false), 500);
      return () => clearTimeout(timer);
    }
  }, [moodLevel]);

  // Clamp moodLevel to valid range (1-5)
  const clampedLevel = Math.max(1, Math.min(5, moodLevel));

  return (
    <div className={styles.container}>
      <div className={styles.dots} role="img" aria-label={`Mood level ${clampedLevel} out of 5`}>
        {[1, 2, 3, 4, 5].map((level) => (
          <span
            key={level}
            className={`${styles.dot} ${
              level <= clampedLevel ? styles.filled : styles.empty
            } ${styles[moodState]} ${
              isAnimating && level <= clampedLevel ? styles.animate : ''
            }`}
            aria-label={level <= clampedLevel ? 'Filled' : 'Empty'}
          />
        ))}
      </div>
      <span className={styles.label}>{MOOD_LABELS[moodState]}</span>
    </div>
  );
};

