import { useState, useEffect, useRef } from 'react';
import styles from './ComedyJudgeModal.module.css';

interface ComedyJudgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (jokeText: string) => Promise<void>;
  isLoading?: boolean;
}

const MAX_JOKE_LENGTH = 500;

export const ComedyJudgeModal = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}: ComedyJudgeModalProps) => {
  const [jokeText, setJokeText] = useState('');
  const [characterCount, setCharacterCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Focus textarea when modal opens
  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setJokeText('');
      setCharacterCount(0);
    }
  }, [isOpen]);

  // Handle Escape key
  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !isLoading) {
        e.preventDefault();
        setJokeText('');
        setCharacterCount(0);
        onClose();
      }
    };

    window.addEventListener('keydown', handleEscape);
    return () => {
      window.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, isLoading, onClose]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= MAX_JOKE_LENGTH) {
      setJokeText(value);
      setCharacterCount(value.length);
    }
  };

  const handleSubmit = async () => {
    if (jokeText.trim().length === 0 || isLoading) {
      return;
    }
    await onSubmit(jokeText.trim());
  };

  const handleClose = () => {
    if (!isLoading) {
      setJokeText('');
      setCharacterCount(0);
      onClose();
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (!isLoading && e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Allow Shift+Enter for new line, but Enter alone doesn't submit
    // (Following the spec: Enter creates new line, submit only on button click)
    if (e.key === 'Enter' && !e.shiftKey) {
      // Don't prevent default - let Enter create new line
      // Submit only happens on button click
    }
  };

  const canSubmit = jokeText.trim().length > 0 && !isLoading;
  const isNearLimit = characterCount >= 450;

  if (!isOpen) {
    return null;
  }

  return (
    <div className={styles.overlay} onClick={handleOverlayClick}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <button
          className={styles.closeButton}
          onClick={handleClose}
          disabled={isLoading}
          aria-label="Close modal"
        >
          ×
        </button>

        <h2 className={styles.title}>Make Your Pet Laugh! 😂</h2>

        <div className={styles.content}>
          <div className={styles.inputContainer}>
            <textarea
              ref={textareaRef}
              className={styles.textarea}
              placeholder="Type a joke here..."
              value={jokeText}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              maxLength={MAX_JOKE_LENGTH}
              rows={6}
              aria-label="Joke input"
              aria-describedby="character-counter"
            />
            <div
              id="character-counter"
              className={`${styles.counter} ${isNearLimit ? styles.nearLimit : ''}`}
            >
              {characterCount}/{MAX_JOKE_LENGTH}
            </div>
          </div>

          <div className={styles.actions}>
            <button
              className={`${styles.button} ${styles.buttonSecondary}`}
              onClick={handleClose}
              disabled={isLoading}
              type="button"
            >
              Cancel
            </button>
            <button
              className={`${styles.button} ${styles.buttonPrimary} ${isLoading ? styles.loading : ''}`}
              onClick={handleSubmit}
              disabled={!canSubmit}
              type="button"
            >
              {isLoading ? 'Submitting...' : 'Submit Joke'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

