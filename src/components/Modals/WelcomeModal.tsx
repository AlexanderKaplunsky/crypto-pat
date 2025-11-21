import { useEffect } from 'react';
import styles from './WelcomeModal.module.css';

interface WelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGetStarted: () => void;
}

export function WelcomeModal({ isOpen, onClose, onGetStarted }: WelcomeModalProps) {
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

  if (!isOpen) return null;

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

        <h2 className={styles.title}>Welcome to Crypto Pet! 🐾</h2>

        <div className={styles.content}>
          <p className={styles.description}>
            Your pet's mood is tied to real-time cryptocurrency prices. 
            When your chosen coin goes up, your pet gets happy. When it goes down, your pet gets sad.
          </p>
          <p className={styles.description}>
            Keep your pet happy by cheering it up or making it laugh with jokes!
          </p>
          <div className={styles.actions}>
            <button className={styles.primaryButton} onClick={onGetStarted}>
              Get Started
            </button>
            <button className={styles.secondaryButton} onClick={onClose}>
              Skip
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

