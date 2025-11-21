import { useState } from 'react';
import { ResetConfirmationModal } from '../Modals/ResetConfirmationModal';
import styles from './ResetButton.module.css';

interface ResetButtonProps {
  onReset: () => void;
}

export function ResetButton({ onReset }: ResetButtonProps) {
  const [showConfirm, setShowConfirm] = useState(false);

  const handleClick = () => {
    setShowConfirm(true);
  };

  const handleConfirm = () => {
    onReset();
    setShowConfirm(false);
  };

  const handleCancel = () => {
    setShowConfirm(false);
  };

  return (
    <>
      <button
        className={styles.resetButton}
        onClick={handleClick}
        aria-label="Reset Pet"
        title="Reset Pet"
        type="button"
      >
        🔄 Reset
      </button>
      <ResetConfirmationModal
        isOpen={showConfirm}
        onClose={handleCancel}
        onConfirm={handleConfirm}
      />
    </>
  );
}

