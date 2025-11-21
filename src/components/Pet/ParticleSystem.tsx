import { useEffect, useRef } from 'react';
import styles from './ParticleSystem.module.css';

const GOLD_PALETTE = ['#FFD700', '#FFA500', '#FFFF00'] as const;
const CONFETTI_PALETTE = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#FF69B4', '#32CD32'] as const;
const MAX_PARTICLES = 50;
const DEFAULT_COUNT = 15;
const CONFETTI_COUNT = 18; // 15-20 particles
const PARTICLE_LIFETIME_MIN = 800;
const PARTICLE_LIFETIME_MAX = 1400;

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  life: number;
  ttl: number;
  color: (typeof GOLD_PALETTE)[number] | (typeof CONFETTI_PALETTE)[number];
}

export interface ParticleSystemProps {
  active: boolean;
  particleCount?: number;
  triggerConfetti?: number; // When this value changes, trigger confetti burst
}

const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;

export const ParticleSystem = ({ active, particleCount = DEFAULT_COUNT, triggerConfetti }: ParticleSystemProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const isActiveRef = useRef(active);
  const targetCountRef = useRef(Math.min(particleCount, MAX_PARTICLES));
  const frameRef = useRef<number | null>(null);
  const spawnAccumulatorRef = useRef(0);
  const lastTimestampRef = useRef<number | null>(null);
  const prevConfettiTriggerRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    isActiveRef.current = active;
    if (!active) {
      spawnAccumulatorRef.current = 0;
    }
  }, [active]);

  useEffect(() => {
    targetCountRef.current = Math.min(particleCount, MAX_PARTICLES);
  }, [particleCount]);

  // Handle confetti trigger
  useEffect(() => {
    if (triggerConfetti !== undefined && triggerConfetti !== prevConfettiTriggerRef.current) {
      prevConfettiTriggerRef.current = triggerConfetti;
      
      // Spawn confetti burst
      const canvas = canvasRef.current;
      if (canvas) {
        for (let i = 0; i < CONFETTI_COUNT; i++) {
          // Use setTimeout to spread particles slightly
          setTimeout(() => {
            const width = canvas.width || 400;
            const height = canvas.height || 400;
            const originX = width / 2 + randomBetween(-40, 40);
            const originY = height * 0.4 + randomBetween(-20, 20);

            const particle: Particle = {
              id: Date.now() + i,
              x: originX,
              y: originY,
              vx: randomBetween(-0.3, 0.3),
              vy: randomBetween(-0.8, -1.2),
              size: randomBetween(3, 5),
              life: 0,
              ttl: randomBetween(PARTICLE_LIFETIME_MIN, PARTICLE_LIFETIME_MAX),
              color: CONFETTI_PALETTE[Math.floor(Math.random() * CONFETTI_PALETTE.length)],
            };

            particlesRef.current.push(particle);
          }, i * 20); // Stagger particles slightly
        }
      }
    }
  }, [triggerConfetti]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const parentEl = canvas.parentElement;
    if (!parentEl) {
      return undefined;
    }

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      const { width, height } = entry.contentRect;
      canvas.width = width;
      canvas.height = height;
    });

    observer.observe(parentEl);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return undefined;
    }

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return undefined;
    }

    let particleId = 0;

    const spawnParticle = (isConfetti = false) => {
      const width = canvas.width || 400;
      const height = canvas.height || 400;
      const originX = width / 2 + randomBetween(-30, 30);
      const originY = height * 0.4 + randomBetween(-10, 10);

      const palette = isConfetti ? CONFETTI_PALETTE : GOLD_PALETTE;
      const velocityMultiplier = isConfetti ? 1.5 : 1;

      const particle: Particle = {
        id: particleId++,
        x: originX,
        y: originY,
        vx: randomBetween(-0.2, 0.2) * velocityMultiplier,
        vy: randomBetween(-0.6, -1) * velocityMultiplier,
        size: randomBetween(2, 4),
        life: 0,
        ttl: randomBetween(PARTICLE_LIFETIME_MIN, PARTICLE_LIFETIME_MAX),
        color: palette[Math.floor(Math.random() * palette.length)],
      };

      particlesRef.current.push(particle);
    };

    const updateParticles = (delta: number) => {
      const particles = particlesRef.current;
      for (let i = particles.length - 1; i >= 0; i -= 1) {
        const particle = particles[i];
        particle.life += delta;
        if (particle.life >= particle.ttl) {
          particles.splice(i, 1);
          continue;
        }

        const deltaSeconds = delta / 16.67;
        particle.x += particle.vx * deltaSeconds * 10;
        particle.y += particle.vy * deltaSeconds * 10;
        particle.vy -= 0.005 * deltaSeconds; // gentle upward drift
      }
    };

    const drawParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const particles = particlesRef.current;

      for (let i = 0; i < particles.length; i += 1) {
        const particle = particles[i];
        const progress = particle.life / particle.ttl;
        const alpha = 1 - progress;
        ctx.globalAlpha = Math.max(alpha, 0) * 0.9;
        ctx.fillStyle = particle.color;
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
    };

    const loop = (timestamp: number) => {
      if (lastTimestampRef.current == null) {
        lastTimestampRef.current = timestamp;
      }
      const delta = timestamp - lastTimestampRef.current;
      lastTimestampRef.current = timestamp;

      if (isActiveRef.current && particlesRef.current.length < MAX_PARTICLES) {
        spawnAccumulatorRef.current += delta;
        const spawnInterval = 1000 / targetCountRef.current;
        while (
          spawnAccumulatorRef.current >= spawnInterval &&
          particlesRef.current.length < MAX_PARTICLES
        ) {
          spawnParticle(false);
          spawnAccumulatorRef.current -= spawnInterval;
        }
      }

      updateParticles(delta);
      drawParticles();

      frameRef.current = window.requestAnimationFrame(loop);
    };

    frameRef.current = window.requestAnimationFrame(loop);

    return () => {
      if (frameRef.current) {
        window.cancelAnimationFrame(frameRef.current);
      }
    };
  }, []);

  return <canvas ref={canvasRef} className={styles.particleCanvas} role="presentation" />;
};

