import type { PropsWithChildren } from 'react';
import styles from './PetDisplay.module.css';

export const PetDisplay = ({ children }: PropsWithChildren) => (
  <section className={styles.container} role="figure" aria-label="Pet display">
    <div className={styles.content}>{children}</div>
  </section>
);
