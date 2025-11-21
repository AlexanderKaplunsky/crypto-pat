import { useCallback, useState, useEffect, useRef } from 'react';
import './App.css';
import { EvolutionAnimation, ParticleSystem, PetDisplay, PetSprite } from './components';
import { CoinSelector, CryptoStatusBar, MoodMeter, StatsPanel, Toast, CheerUpButton, TellJokeButton, WeatherIndicator } from './components/UI';
import { EvolutionModal, SchadenfreudeModal, ComedyJudgeModal, ComedyJudgeResultsModal } from './components/Modals';
import petDisplayStyles from './components/Pet/PetDisplay.module.css';
import { useCryptoUpdates, useEvolutionCheck, useGeolocation, useSchadenfreude, useToast, useWeatherUpdates, useComedyJudge } from './hooks';
import type { JokeRating } from './types/comedy';
import { calculateMood, loadPetState, savePetState } from './utils';
import { COINS } from './types';
import type { MoodState, PetState } from './types/pet';
import type { CryptoComparison } from './services/CryptoService';
import type { EvolutionCheckResult } from './utils/evolutionChecker';
import type { EvolutionStage } from './utils/evolutionChecker';

const MOOD_OPTIONS: MoodState[] = ['happy', 'neutral', 'sad'];

function App() {
  const [selectedCoinId, setSelectedCoinId] = useState<string>('bitcoin');
  
  // Load saved mood state from LocalStorage on initialization
  const savedState = loadPetState();
  const [petState, setPetState] = useState<PetState>({
    mood: savedState.moodState,
    evolutionStage: 2,
    isAnimating: true,
  });
  
  // Track mood level separately for persistence
  const [moodLevel, setMoodLevel] = useState<number>(savedState.moodLevel);
  
  // Toast notifications for mood changes
  const { toasts, showToast, dismissToast } = useToast();
  
  // Track previous mood state for notifications
  const prevMoodStateRef = useRef<MoodState>(savedState.moodState);
  
  // Schadenfreude modal state
  const [schadenfreudeModalData, setSchadenfreudeModalData] = useState<CryptoComparison | null>(null);
  const [showSchadenfreudeModal, setShowSchadenfreudeModal] = useState(false);

  // Comedy Judge modal state
  const [showComedyJudgeModal, setShowComedyJudgeModal] = useState(false);
  const [showComedyResultsModal, setShowComedyResultsModal] = useState(false);
  const [comedyRating, setComedyRating] = useState<JokeRating | null>(null);
  const [isLaughing, setIsLaughing] = useState(false);
  const [confettiTrigger, setConfettiTrigger] = useState(0);

  // Evolution state
  const [isEvolving, setIsEvolving] = useState(false);
  const [showEvolutionModal, setShowEvolutionModal] = useState(false);
  const [evolutionData, setEvolutionData] = useState<{
    currentStage: EvolutionStage;
    nextStage: EvolutionStage;
  } | null>(null);

  // Track pet age and interactions for evolution
  const [ageSeconds, setAgeSeconds] = useState<number>(0);
  const [interactionCount, setInteractionCount] = useState<number>(0);
  
  // Get geolocation for weather
  const { latitude, longitude } = useGeolocation();
  
  // Get weather data and mood modifier
  const { weather, isLoading: isWeatherLoading, moodModifier } = useWeatherUpdates({
    latitude,
    longitude,
    enabled: !!latitude && !!longitude,
  });
  
  // Get price data from crypto updates hook
  const { priceData } = useCryptoUpdates({ coinId: selectedCoinId });
  
  // Track previous values to avoid unnecessary recalculations
  const prevPriceChangeRef = useRef<number | null>(null);
  const prevMoodModifierRef = useRef<number>(0);
  const prevCoinIdRef = useRef<string>(selectedCoinId);
  
  // Calculate mood from price changes and weather
  useEffect(() => {
    // Reset tracking when coin changes
    if (prevCoinIdRef.current !== selectedCoinId) {
      prevCoinIdRef.current = selectedCoinId;
      prevPriceChangeRef.current = null;
      prevMoodModifierRef.current = moodModifier;
    }
    
    if (!priceData) {
      // If no price data, keep current mood
      return;
    }
    
    // Recalculate mood when price or weather modifier changes
    const priceChanged = prevPriceChangeRef.current !== priceData.change24h;
    const weatherChanged = prevMoodModifierRef.current !== moodModifier;
    
    if (!priceChanged && !weatherChanged) {
      // Neither price nor weather changed, no need to recalculate
      return;
    }
    
    // Update refs before calculation
    prevPriceChangeRef.current = priceData.change24h;
    prevMoodModifierRef.current = moodModifier;
    
    const newMood = calculateMood(priceData.change24h, moodModifier);
    
    // Update pet state with new mood (PetSprite will handle transition animations)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setPetState((prev) => {
      // Only update if mood state actually changed (to avoid unnecessary re-renders)
      if (prev.mood === newMood.moodState) {
        return prev;
      }
      return {
        ...prev,
        mood: newMood.moodState,
      };
    });
    
    // Update mood level
    setMoodLevel(newMood.moodLevel);
  }, [priceData, moodModifier, selectedCoinId]);
  
  // Save mood to LocalStorage whenever it changes
  useEffect(() => {
    savePetState({
      moodLevel,
      moodState: petState.mood,
    });
  }, [moodLevel, petState.mood]);

  // Watch for mood state changes and show notifications
  useEffect(() => {
    const prevState = prevMoodStateRef.current;
    const currentState = petState.mood;

    // Only notify on state changes (happy ↔ sad, not level changes within same state)
    // Also notify when coming from neutral (initial state changes)
    if (prevState !== currentState && prevState !== 'neutral') {
      if (!priceData) {
        // If no price data, skip notification
        prevMoodStateRef.current = currentState;
        return;
      }

      const coin = COINS.find(c => c.id === selectedCoinId);
      const coinSymbol = coin?.symbol.toUpperCase() || 'CRYPTO';
      const changeText = priceData.change24h >= 0 
        ? `up ${Math.abs(priceData.change24h).toFixed(1)}%` 
        : `dropped ${Math.abs(priceData.change24h).toFixed(1)}%`;

      if (currentState === 'happy') {
        showToast(
          `Your pet is happy! ${coinSymbol} is ${changeText}! 🎉`,
          'success'
        );
      } else if (currentState === 'sad') {
        showToast(
          `Your pet is sad. ${coinSymbol} ${changeText}. 😢`,
          'error'
        );
      }
    }

    prevMoodStateRef.current = currentState;
  }, [petState.mood, selectedCoinId, priceData, showToast]);

  // Mood update handler for Schadenfreude
  const handleMoodUpdate = useCallback((newMoodLevel: number, newMoodState: MoodState) => {
    // Update pet state with new mood (PetSprite will handle transition animations)
    setPetState((prev) => ({
      ...prev,
      mood: newMoodState,
    }));
    
    // Update mood level
    setMoodLevel(newMoodLevel);
    
    // Save to LocalStorage (will be handled by the useEffect, but we can also save here for immediate persistence)
    savePetState({
      moodLevel: newMoodLevel,
      moodState: newMoodState,
    });
  }, []);

  // Schadenfreude hook
  const {
    triggerSchadenfreude,
    isLoading: isSchadenfreudeLoading,
    isOnCooldown: isSchadenfreudeOnCooldown,
    cooldownSeconds: schadenfreudeCooldownSeconds,
  } = useSchadenfreude(selectedCoinId, moodLevel, handleMoodUpdate);

  // Comedy Judge hook
  const {
    submitJoke,
    isLoading: isComedyLoading,
    isOnCooldown: isComedyOnCooldown,
    cooldownSeconds: comedyCooldownSeconds,
  } = useComedyJudge(petState.mood, moodLevel, handleMoodUpdate);

  // Schadenfreude handler
  const handleCheerUp = useCallback(async () => {
    // Increment interaction count
    setInteractionCount((prev) => prev + 1);
    
    const comparison = await triggerSchadenfreude();
    
    if (comparison) {
      // Show modal with comparison
      setSchadenfreudeModalData(comparison);
      setShowSchadenfreudeModal(true);
    } else if (!isSchadenfreudeOnCooldown) {
      // Only show error if not on cooldown (cooldown is handled by button state)
      showToast('Could not find a worse-performing coin. Your pet might already be doing great! 🎉', 'info');
    }
  }, [triggerSchadenfreude, isSchadenfreudeOnCooldown, showToast]);

  // Comedy Judge handlers
  const handleTellJoke = useCallback(() => {
    setShowComedyJudgeModal(true);
  }, []);

  const handleComedySubmit = useCallback(async (jokeText: string) => {
    try {
      const rating = await submitJoke(jokeText);
      if (rating) {
        setComedyRating(rating);
        setShowComedyJudgeModal(false);
        setShowComedyResultsModal(true);

        // Check if successful (threshold check is done in hook, but we need to check for animation)
        const thresholds = {
          happy: 3,
          neutral: 5,
          sad: 7,
        };
        const threshold = thresholds[petState.mood] ?? thresholds.neutral;
        
        if (rating.rating >= threshold) {
          // Trigger laughing animation
          setIsLaughing(true);
          // Clear laughing animation after 1.5 seconds
          setTimeout(() => {
            setIsLaughing(false);
          }, 1500);
          // Trigger confetti
          setConfettiTrigger((prev) => prev + 1);
          // Increment interaction count
          setInteractionCount((prev) => prev + 1);
          // Show success toast
          showToast('Pet laughed! Mood improved! 😄', 'success');
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to rate joke';
      showToast(errorMessage, 'error');
    }
  }, [submitJoke, petState.mood, showToast]);

  const handleComedyResultsClose = useCallback(() => {
    setShowComedyResultsModal(false);
    setComedyRating(null);
  }, []);

  const handleComedySuccess = useCallback(() => {
    // This is called when results modal detects success
    // Animation and confetti are already triggered in handleComedySubmit
  }, []);

  // Track pet age (increment every second)
  useEffect(() => {
    const interval = setInterval(() => {
      setAgeSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Evolution handler
  const handleEvolution = useCallback((result: EvolutionCheckResult) => {
    if (!result.nextStage) return;

    // Convert string stage to number for petState
    const stageMap: Record<EvolutionStage, 1 | 2 | 3> = {
      baby: 1,
      adult: 2,
      legendary: 3,
    };

    // Update pet state to new evolution stage
    setPetState((prev) => ({
      ...prev,
      evolutionStage: stageMap[result.nextStage!],
    }));

    // Store evolution data for modal
    setEvolutionData({
      currentStage: result.currentStage,
      nextStage: result.nextStage,
    });

    // Start evolution animation
    setIsEvolving(true);

    // Show modal after animation completes (3 seconds)
    setTimeout(() => {
      setIsEvolving(false);
      setShowEvolutionModal(true);
    }, 3000);
  }, []);

  // Evolution check hook
  useEvolutionCheck({
    petState: {
      ...petState,
      ageSeconds,
      interactionCount,
    },
    onEvolution: handleEvolution,
  });

  // Manual mood override (for testing/debugging - can be removed in production)
  const handleMoodChange = useCallback((nextMood: MoodState) => {
    // Map mood state to approximate mood level for manual overrides
    const moodLevelMap: Record<MoodState, number> = {
      happy: 4,
      neutral: 3,
      sad: 2,
    };
    
    setPetState((prev) => ({
      ...prev,
      mood: nextMood,
    }));
    setMoodLevel(moodLevelMap[nextMood]);
    // Increment interaction count on manual mood change
    setInteractionCount((prev) => prev + 1);
  }, []);

  return (
    <main className="appShell">
      <div className="appContent">
        <header className="appHeader">
          <h1>Crypto Pet</h1>
          <p>Keep your pixel companion happy and thriving.</p>
          <CoinSelector 
            selectedCoinId={selectedCoinId}
            onCoinChange={setSelectedCoinId}
          />
        </header>

        <CryptoStatusBar coinId={selectedCoinId} />

        <WeatherIndicator weather={weather} isLoading={isWeatherLoading} />

        <StatsPanel
          petState={{
            ...petState,
            ageSeconds,
            interactionCount,
          }}
        />

        <PetDisplay>
          <ParticleSystem active={petState.mood === 'happy'} triggerConfetti={confettiTrigger} />
          <div className={petDisplayStyles.petContainer}>
            <EvolutionAnimation
              isActive={isEvolving}
              onComplete={() => {
                setIsEvolving(false);
              }}
            >
              <PetSprite
                mood={petState.mood}
                evolutionStage={petState.evolutionStage}
                isAnimating={petState.isAnimating && !isEvolving}
                isLaughing={isLaughing}
                aria-live="polite"
              />
            </EvolutionAnimation>
            <MoodMeter 
              moodLevel={moodLevel}
              moodState={petState.mood}
            />
            <div style={{ marginTop: 'var(--spacing-md)', display: 'flex', gap: 'var(--spacing-sm)', flexWrap: 'wrap', justifyContent: 'center' }}>
              <CheerUpButton
                onClick={handleCheerUp}
                isLoading={isSchadenfreudeLoading}
                isOnCooldown={isSchadenfreudeOnCooldown}
                cooldownSeconds={schadenfreudeCooldownSeconds}
              />
              <TellJokeButton
                onClick={handleTellJoke}
                isLoading={isComedyLoading}
                isOnCooldown={isComedyOnCooldown}
                cooldownSeconds={comedyCooldownSeconds}
              />
            </div>
          </div>
        </PetDisplay>

        <div className="controlPanel" role="group" aria-label="Mood controls">
          {MOOD_OPTIONS.map((option) => (
            <button
              key={option}
              type="button"
              className={`controlButton${petState.mood === option ? ' active' : ''}`}
              onClick={() => handleMoodChange(option)}
            >
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </button>
          ))}
        </div>
      </div>
      {toasts.map((toast, index) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => dismissToast(toast.id)}
          style={{
            top: `${20 + index * 80}px`,
            zIndex: 1000 + index,
          }}
        />
      ))}
      {showSchadenfreudeModal && (
        <SchadenfreudeModal
          comparison={schadenfreudeModalData}
          onClose={() => {
            setShowSchadenfreudeModal(false);
            setSchadenfreudeModalData(null);
          }}
        />
      )}
      {evolutionData && (
        <EvolutionModal
          isOpen={showEvolutionModal}
          onClose={() => {
            setShowEvolutionModal(false);
            setEvolutionData(null);
          }}
          currentStage={evolutionData.currentStage}
          nextStage={evolutionData.nextStage}
          petMood={petState.mood}
        />
      )}
      <ComedyJudgeModal
        isOpen={showComedyJudgeModal}
        onClose={() => setShowComedyJudgeModal(false)}
        onSubmit={handleComedySubmit}
        isLoading={isComedyLoading}
      />
      {comedyRating && (
        <ComedyJudgeResultsModal
          isOpen={showComedyResultsModal}
          onClose={handleComedyResultsClose}
          rating={comedyRating}
          currentMood={petState.mood}
          onSuccess={handleComedySuccess}
        />
      )}
    </main>
  );
}

export default App;
