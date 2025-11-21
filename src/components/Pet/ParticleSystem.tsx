import { useEffect, useRef } from 'react';
import styles from './ParticleSystem.module.css';

const GOLD_PALETTE = ['#FFD700', '#FFA500', '#FFFF00'] as const;
const MAX_PARTICLES = 50;
const DEFAULT_COUNT = 15;
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
  color: (typeof GOLD_PALETTE)[number];
}

export interface ParticleSystemProps {
  active: boolean;
  particleCount?: number;
}

const randomBetween = (min: number, max: number) => Math.random() * (max - min) + min;

export const ParticleSystem = ({ active, particleCount = DEFAULT_COUNT }: ParticleSystemProps) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const isActiveRef = useRef(active);
  const targetCountRef = useRef(Math.min(particleCount, MAX_PARTICLES));
  const frameRef = useRef<number | null>(null);
  const spawnAccumulatorRef = useRef(0);
  const lastTimestampRef = useRef<number | null>(null);

  useEffect(() => {
    isActiveRef.current = active;
    if (!active) {
      spawnAccumulatorRef.current = 0;
    }
  }, [active]);

  useEffect(() => {
    targetCountRef.current = Math.min(particleCount, MAX_PARTICLES);
  }, [particleCount]);

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

    const spawnParticle = () => {
      const width = canvas.width || 400;
      const height = canvas.height || 400;
      const originX = width / 2 + randomBetween(-30, 30);
      const originY = height * 0.4 + randomBetween(-10, 10);

      const particle: Particle = {
        id: particleId++,
        x: originX,
        y: originY,
        vx: randomBetween(-0.2, 0.2),
        vy: randomBetween(-0.6, -1),
        size: randomBetween(2, 4),
        life: 0,
        ttl: randomBetween(PARTICLE_LIFETIME_MIN, PARTICLE_LIFETIME_MAX),
        color: GOLD_PALETTE[Math.floor(Math.random() * GOLD_PALETTE.length)],
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
          spawnParticle();
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

