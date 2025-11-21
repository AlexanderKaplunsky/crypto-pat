import type { PetState } from '../../types/pet';
import styles from './StatsPanel.module.css';

interface StatsPanelProps {
  petState: PetState & {
    ageSeconds?: number;
    interactionCount?: number;
  };
}

const STAGE_NAMES: Record<1 | 2 | 3, string> = {
  1: 'Baby',
  2: 'Adult',
  3: 'Legendary',
} as const;

const STAGE_COLORS: Record<1 | 2 | 3, string> = {
  1: 'var(--color-sad-blue)',
  2: 'var(--color-button-green)',
  3: 'var(--color-happy-yellow)',
} as const;

export function StatsPanel({ petState }: StatsPanelProps) {
  const formatAge = (seconds: number | undefined): string => {
    if (seconds === undefined) {
      return 'N/A';
    }
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const evolutionStage = petState.evolutionStage;
  const stageName = STAGE_NAMES[evolutionStage];
  const stageColor = STAGE_COLORS[evolutionStage];

  return (
    <div className={styles.statsPanel}>
      {petState.ageSeconds !== undefined && (
        <>
          <div className={styles.stat}>
            <span className={styles.label}>Age:</span>
            <span className={styles.value}>{formatAge(petState.ageSeconds)}</span>
          </div>
          <div className={styles.separator}>|</div>
        </>
      )}

      <div className={styles.stat}>
        <span className={styles.label}>Evolution:</span>
        <span
          className={`${styles.value} ${styles.valueEvolution}`}
          style={{ color: stageColor }}
        >
          {stageName}
        </span>
      </div>

      {petState.interactionCount !== undefined && (
        <>
          <div className={styles.separator}>|</div>
          <div className={styles.stat}>
            <span className={styles.label}>Interactions:</span>
            <span className={styles.value}>{petState.interactionCount}</span>
          </div>
        </>
      )}
    </div>
  );
}

