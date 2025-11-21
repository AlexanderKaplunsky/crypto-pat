import { useEffect } from 'react';
import type { EvolutionStage } from '../../utils/evolutionChecker';
import type { MoodState } from '../../types/pet';
import { PetSprite } from '../Pet/PetSprite';
import styles from './EvolutionModal.module.css';

interface EvolutionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentStage: EvolutionStage;
  nextStage: EvolutionStage;
  petMood: MoodState;
}

const STAGE_NAMES: Record<EvolutionStage, string> = {
  baby: 'Baby',
  adult: 'Adult',
  legendary: 'Legendary',
} as const;

const STAGE_TO_NUMBER: Record<EvolutionStage, 1 | 2 | 3> = {
  baby: 1,
  adult: 2,
  legendary: 3,
} as const;

export function EvolutionModal({
  isOpen,
  onClose,
  currentStage,
  nextStage,
  petMood,
}: EvolutionModalProps) {
  // Prevent closing on ESC key
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen]);

  // Prevent closing on overlay click
  const handleOverlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const handleContinue = () => {
    onClose();
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.content}>
          <h2 className={styles.title}>🎉 EVOLUTION! 🎉</h2>

          <div className={styles.pet}>
            <PetSprite
              mood={petMood}
              evolutionStage={STAGE_TO_NUMBER[nextStage]}
              isAnimating={false}
            />
          </div>

          <div className={styles.progression}>
            <span className={styles.stage}>{STAGE_NAMES[currentStage]}</span>
            <span className={styles.arrow}>→</span>
            <span className={`${styles.stage} ${styles.stageNew}`}>
              {STAGE_NAMES[nextStage]}
            </span>
          </div>

          <p className={styles.message}>
            Your pet has evolved into a {STAGE_NAMES[nextStage]}!
          </p>

          <button
            onClick={handleContinue}
            className={styles.button}
            type="button"
          >
            Continue
          </button>
        </div>
      </div>
    </div>
  );
}

