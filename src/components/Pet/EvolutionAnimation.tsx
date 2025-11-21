import { useEffect, useState } from 'react';
import type { PropsWithChildren } from 'react';
import styles from './EvolutionAnimation.module.css';

type AnimationPhase = 'idle' | 'glow' | 'burst' | 'transform' | 'fade';

interface EvolutionAnimationProps {
  isActive: boolean;
  onComplete?: () => void;
}

export function EvolutionAnimation({
  isActive,
  onComplete,
  children,
}: PropsWithChildren<EvolutionAnimationProps>) {
  const [animationPhase, setAnimationPhase] = useState<AnimationPhase>('idle');

  useEffect(() => {
    if (!isActive) {
      setAnimationPhase('idle');
      return;
    }

    const timers: number[] = [];

    // Phase 1: Glow starts (0-1s)
    setAnimationPhase('glow');
    const glowTimer = window.setTimeout(() => {
      // Phase 2: Particle burst (1-2s)
      setAnimationPhase('burst');
      const burstTimer = window.setTimeout(() => {
        // Phase 3: Transform sprite (2-2.5s)
        setAnimationPhase('transform');
        const transformTimer = window.setTimeout(() => {
          // Phase 4: Glow fades (2.5-3s)
          setAnimationPhase('fade');
          const fadeTimer = window.setTimeout(() => {
            setAnimationPhase('idle');
            if (onComplete) {
              onComplete();
            }
          }, 500); // 0.5s fade
          timers.push(fadeTimer);
        }, 500); // 0.5s transform
        timers.push(transformTimer);
      }, 1000); // 1s burst
      timers.push(burstTimer);
    }, 0);
    timers.push(glowTimer);

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, [isActive, onComplete]);

  return (
    <div
      className={`${styles.evolutionAnimation} ${styles[`evolutionAnimation--${animationPhase}`]}`}
    >
      <div className={styles.evolutionAnimation__glow} />
      {animationPhase === 'burst' && <ParticleBurst />}
      <div className={styles.evolutionAnimation__content}>{children}</div>
    </div>
  );
}

function ParticleBurst() {
  const PARTICLE_COUNT = 20;
  const DISTANCE = 100; // pixels

  // Pre-calculate positions for particles in a circle
  const particles = Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
    const angle = (360 / PARTICLE_COUNT) * i;
    const angleRad = (angle * Math.PI) / 180;
    const x = Math.cos(angleRad) * DISTANCE;
    const y = Math.sin(angleRad) * DISTANCE;
    const delay = i * 0.05;
    return { x, y, delay, key: i };
  });

  return (
    <div className={styles.particleBurst}>
      {particles.map(({ x, y, delay, key }) => (
        <div
          key={key}
          className={styles.particleBurst__particle}
          style={
            {
              '--end-x': `${x}px`,
              '--end-y': `${y}px`,
              '--delay': `${delay}s`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}

