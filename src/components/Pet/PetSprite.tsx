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
  ...imgProps
}: PetSpriteProps & Omit<ImgProps, 'src' | 'alt' | 'width' | 'height'>) => {
  const [transitionClass, setTransitionClass] = useState<TransitionClassName | null>(null);
  const prevMoodRef = useRef<MoodState>(mood);

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

  const isMoodTransitioning = Boolean(transitionClass);
  const stageClass = styles[`stage${evolutionStage}` as keyof typeof styles];
  const className = [
    styles.sprite,
    stageClass,
    isAnimating ? styles.animating : styles.paused,
    isTransitioning || isMoodTransitioning ? styles.transitioning : '',
    transitionClass ? styles[transitionClass] : '',
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


