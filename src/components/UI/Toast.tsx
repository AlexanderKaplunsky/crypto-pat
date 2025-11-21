import { useEffect, useState } from 'react';
import styles from './Toast.module.css';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  onClose?: () => void;
  style?: React.CSSProperties;
}

export const Toast = ({ 
  message, 
  type = 'info', 
  duration = 3000,
  onClose,
  style
}: ToastProps) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(() => {
        onClose?.();
      }, 300); // Wait for fade-out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div 
      className={`${styles.toast} ${styles[type]} ${!isVisible ? styles.hidden : ''}`}
      style={style}
    >
      {message}
    </div>
  );
};

