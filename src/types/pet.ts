export type MoodState = 'happy' | 'neutral' | 'sad';

export type EvolutionStage = 1 | 2 | 3;

export interface PetState {
  mood: MoodState;
  evolutionStage: EvolutionStage;
  isAnimating: boolean;
}

export interface PetSpriteProps {
  mood: MoodState;
  evolutionStage: EvolutionStage;
  /**
   * Enables subtle transforms/transitions that future animations can hook into.
   * Defaults to true to match the interactive feel described in the spec.
   */
  isAnimating?: boolean;
  /**
   * When true, pauses idle breathing animation so higher-priority transitions
   * can run without transform conflicts.
   */
  isTransitioning?: boolean;
  /**
   * When true, triggers laughing animation (shake + bounce + rotate).
   * Animation duration is 1.5 seconds.
   */
  isLaughing?: boolean;
}


