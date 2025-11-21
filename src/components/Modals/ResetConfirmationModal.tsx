import { useEffect } from 'react';
import styles from './ResetConfirmationModal.module.css';

interface ResetConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ResetConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
}: ResetConfirmationModalProps) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

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

        <h2 className={styles.title}>⚠️ Reset Pet?</h2>

        <div className={styles.content}>
          <p className={styles.warning}>
            This will permanently delete your current pet and all progress.
          </p>
          <ul className={styles.consequences}>
            <li>Delete your current pet</li>
            <li>Reset all stats</li>
            <li>Return to coin selection</li>
          </ul>
          <p className={styles.finalWarning}>
            <strong>This cannot be undone!</strong>
          </p>
          <div className={styles.actions}>
            <button className={styles.cancelButton} onClick={onClose}>
              Cancel
            </button>
            <button className={styles.confirmButton} onClick={handleConfirm}>
              Yes, Reset
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

