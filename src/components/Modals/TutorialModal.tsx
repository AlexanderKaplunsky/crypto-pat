import { useState, useEffect } from 'react';
import styles from './TutorialModal.module.css';

interface TutorialStep {
  title: string;
  description: string;
  highlight?: string; // Element to highlight
}

const TUTORIAL_STEPS: TutorialStep[] = [
  {
    title: 'Mood Meter',
    description: 'Watch your pet\'s mood meter. It shows how your pet feels based on crypto prices. Keep it happy!',
    highlight: 'mood-meter',
  },
  {
    title: 'Cheer Up Button',
    description: 'If your pet is sad, click "Cheer Up" to find a worse-performing coin. Your pet will feel better!',
    highlight: 'cheer-up-button',
  },
  {
    title: 'Tell Joke Button',
    description: 'Make your pet laugh by telling a joke! The AI will rate it. If it\'s funny enough, your pet\'s mood improves!',
    highlight: 'tell-joke-button',
  },
  {
    title: 'Crypto Status',
    description: 'Watch the status bar to see your coin\'s price and trend. This affects your pet\'s mood!',
    highlight: 'crypto-status',
  },
];

interface TutorialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export function TutorialModal({ isOpen, onClose, onComplete }: TutorialModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  // Reset to first step when modal opens
  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const step = TUTORIAL_STEPS[currentStep];
  const isLastStep = currentStep === TUTORIAL_STEPS.length - 1;
  const isFirstStep = currentStep === 0;

  const handleNext = () => {
    if (isLastStep) {
      onComplete();
    } else {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button
          className={styles.closeButton}
          onClick={onClose}
          aria-label="Close modal"
        >
          ×
        </button>

        <h2 className={styles.title}>Tutorial: {step.title}</h2>

        <div className={styles.content}>
          <div className={styles.stepIndicator}>
            Step {currentStep + 1} of {TUTORIAL_STEPS.length}
          </div>
          <p className={styles.description}>{step.description}</p>
          {step.highlight && (
            <div className={styles.highlight} data-highlight={step.highlight}>
              👆 Look for this element
            </div>
          )}
          <div className={styles.actions}>
            {!isFirstStep && (
              <button className={styles.secondaryButton} onClick={handleBack}>
                Back
              </button>
            )}
            <button className={styles.secondaryButton} onClick={handleSkip}>
              Skip Tutorial
            </button>
            <button className={styles.primaryButton} onClick={handleNext}>
              {isLastStep ? 'Start Playing!' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

