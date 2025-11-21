import { useEffect, useRef, useState } from 'react';
import type { ComponentPropsWithoutRef } from 'react';
import styles from './PetSprite.module.css';
import type { EvolutionStage, MoodState, PetSpriteProps } from '../../types/pet';

const stageToName: Record<EvolutionStage, string> = {
  1: 'baby',
  2: 'adult',
  3: 'legendary',
};

const stageToSize: Record<EvolutionStage, number> = {
  1: 64,
  2: 128,
  3: 192,
};

type ImgProps = ComponentPropsWithoutRef<'img'>;

type TransitionClassName = 'transitionToHappy' | 'transitionToSad' | 'transitionToNeutral';

const TRANSITION_DURATION_MS = 500;

const moodToTransitionClass: Record<MoodState, TransitionClassName> = {
  happy: 'transitionToHappy',
  sad: 'transitionToSad',
  neutral: 'transitionToNeutral',
};

const buildSpritePath = (stage: EvolutionStage, mood: MoodState) => {
  // Use import.meta.env.BASE_URL to respect Vite's base path configuration
  // This ensures assets work correctly on GitHub Pages with subdirectory paths
  // BASE_URL already includes trailing slash (e.g., '/crypto-pet/' or '/')
  const baseUrl = import.meta.env.BASE_URL;
  return `${baseUrl}assets/sprites/pet-${stageToName[stage]}-${mood}.png`;
};

export const PetSprite = ({
  mood,
  evolutionStage,
  isAnimating = true,
  isTransitioning = false,
  isLaughing = false,
  ...imgProps
}: PetSpriteProps & Omit<ImgProps, 'src' | 'alt' | 'width' | 'height'>) => {
  const [transitionClass, setTransitionClass] = useState<TransitionClassName | null>(null);
  const [laughingClass, setLaughingClass] = useState<string | null>(null);
  const prevMoodRef = useRef<MoodState>(mood);
  const prevLaughingRef = useRef<boolean>(false);

  useEffect(() => {
    if (prevMoodRef.current === mood) {
      return;
    }

    prevMoodRef.current = mood;
    let timer: number | undefined;

    const frame = window.requestAnimationFrame(() => {
      const nextTransitionClass = moodToTransitionClass[mood];
      setTransitionClass(nextTransitionClass);

      timer = window.setTimeout(() => {
        setTransitionClass(null);
      }, TRANSITION_DURATION_MS);
    });

    return () => {
      window.cancelAnimationFrame(frame);
      if (typeof timer === 'number') {
        window.clearTimeout(timer);
      }
    };
  }, [mood]);

  // Handle laughing animation
  useEffect(() => {
    if (isLaughing && !prevLaughingRef.current) {
      // Start laughing animation
      setLaughingClass(styles.laughing);
      prevLaughingRef.current = true;

      // Clear after animation completes (1.5s)
      const timer = setTimeout(() => {
        setLaughingClass(null);
        prevLaughingRef.current = false;
      }, 1500);

      return () => clearTimeout(timer);
    } else if (!isLaughing) {
      prevLaughingRef.current = false;
    }
  }, [isLaughing]);

  const isMoodTransitioning = Boolean(transitionClass);
  const stageClass = styles[`stage${evolutionStage}` as keyof typeof styles];
  const className = [
    styles.sprite,
    stageClass,
    isAnimating ? styles.animating : styles.paused,
    isTransitioning || isMoodTransitioning ? styles.transitioning : '',
    transitionClass ? styles[transitionClass] : '',
    laughingClass,
  ]
    .filter(Boolean)
    .join(' ');

  const spritePath = buildSpritePath(evolutionStage, mood);
  const spriteSize = stageToSize[evolutionStage];
  const alt = `${stageToName[evolutionStage]} ${mood} pet sprite`;

  return (
    <img
      {...imgProps}
      className={className}
      data-stage={evolutionStage}
      data-mood={mood}
      src={spritePath}
      alt={alt}
      width={spriteSize}
      height={spriteSize}
      draggable={false}
      loading="lazy"
    />
  );
};


