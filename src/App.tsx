import { useCallback, useState, useEffect, useRef } from 'react';
import './App.css';
import { EvolutionAnimation, ParticleSystem, PetDisplay, PetSprite } from './components';
import { CoinSelector, CryptoStatusBar, MoodMeter, StatsPanel, Toast, CheerUpButton, TellJokeButton, WeatherIndicator, ResetButton } from './components/UI';
import { EvolutionModal, SchadenfreudeModal, ComedyJudgeModal, ComedyJudgeResultsModal, WelcomeModal, TutorialModal } from './components/Modals';
import petDisplayStyles from './components/Pet/PetDisplay.module.css';
import { useCryptoUpdates, useEvolutionCheck, useGeolocation, useSchadenfreude, useToast, useWeatherUpdates, useComedyJudge } from './hooks';
import type { JokeRating } from './types/comedy';
import { calculateMood, loadPetState, savePetState, getCooldownExpiresAt, setCooldown, resetAllPetData, clearAllCooldowns, hasPetState, hasCompletedFTUE, markFTUECompleted } from './utils';
import { COINS, getCoinById } from './types';
import type { MoodState, PetState } from './types/pet';
import type { CryptoComparison } from './services/CryptoService';
import type { EvolutionCheckResult } from './utils/evolutionChecker';
import type { EvolutionStage } from './utils/evolutionChecker';

const STAGE_NAMES: Record<1 | 2 | 3, string> = {
  1: 'Baby',
  2: 'Adult',
  3: 'Legendary',
} as const;

function App() {
  // Load saved state from LocalStorage on initialization
  const savedState = loadPetState();
  
  // Restore cooldowns from saved state
  useEffect(() => {
    const schadenfreudeUntil = savedState.schadenfreudeCooldownUntil;
    const comedyUntil = savedState.comedyCooldownUntil;
    
    if (schadenfreudeUntil) {
      const remaining = Math.max(0, Math.ceil((schadenfreudeUntil - Date.now()) / 1000));
      if (remaining > 0) {
        setCooldown('schadenfreude', remaining);
      }
    }
    if (comedyUntil) {
      const remaining = Math.max(0, Math.ceil((comedyUntil - Date.now()) / 1000));
      if (remaining > 0) {
        setCooldown('comedy', remaining);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount - savedState is constant from initial load
  
  const [selectedCoinId, setSelectedCoinId] = useState<string>(savedState.selectedCoin || 'bitcoin');
  
  const [petState, setPetState] = useState<PetState>({
    mood: savedState.moodState,
    evolutionStage: (savedState.evolutionStage || 1) as 1 | 2 | 3,
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
  
  // Manual evolution override flag (disables automatic evolution)
  const [manualEvolutionOverride, setManualEvolutionOverride] = useState(false);

  // FTUE state
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showTutorialModal, setShowTutorialModal] = useState(false);

  // Track pet age and interactions for evolution
  const [ageSeconds, setAgeSeconds] = useState<number>(savedState.ageSeconds || 0);
  const [interactionCount, setInteractionCount] = useState<number>(savedState.interactionCount || 0);
  
  // Track additional stats
  const [schadenfreudeCount, setSchadenfreudeCount] = useState<number>(savedState.schadenfreudeCount || 0);
  const [comedyAttempts, setComedyAttempts] = useState<number>(savedState.comedyAttempts || 0);
  const [comedySuccesses, setComedySuccesses] = useState<number>(savedState.comedySuccesses || 0);

  // Check if FTUE should be shown on mount
  useEffect(() => {
    const hasPet = hasPetState();
    const ftueCompleted = hasCompletedFTUE();
    
    if (!hasPet && !ftueCompleted) {
      setShowWelcomeModal(true);
    }
  }, []);
  
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
  
  // Auto-save all state to LocalStorage whenever it changes
  useEffect(() => {
    const coin = getCoinById(selectedCoinId);
    const stageName = STAGE_NAMES[petState.evolutionStage];
    
    // Get cooldown timestamps
    const schadenfreudeCooldownUntil = getCooldownExpiresAt('schadenfreude');
    const comedyCooldownUntil = getCooldownExpiresAt('comedy');
    
    savePetState({
      selectedCoin: selectedCoinId,
      coinSymbol: coin?.symbol.toUpperCase(),
      currentPrice: priceData?.price,
      priceChange24h: priceData?.change24h,
      lastPriceUpdate: priceData?.timestamp,
      moodLevel,
      moodState: petState.mood,
      weatherCondition: weather?.condition,
      weatherMoodModifier: weather?.moodModifier,
      lastWeatherUpdate: weather?.timestamp,
      evolutionStage: petState.evolutionStage,
      stageName,
      ageSeconds,
      interactionCount,
      schadenfreudeCount,
      comedyAttempts,
      comedySuccesses,
      schadenfreudeCooldownUntil: schadenfreudeCooldownUntil || undefined,
      comedyCooldownUntil: comedyCooldownUntil || undefined,
    });
  }, [
    selectedCoinId,
    priceData,
    moodLevel,
    petState.mood,
    petState.evolutionStage,
    weather,
    ageSeconds,
    interactionCount,
    schadenfreudeCount,
    comedyAttempts,
    comedySuccesses,
  ]);

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
    // Increment interaction count and schadenfreude count
    setInteractionCount((prev) => prev + 1);
    setSchadenfreudeCount((prev) => prev + 1);
    
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
      // Increment comedy attempts
      setComedyAttempts((prev) => prev + 1);
      
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
          // Increment comedy successes
          setComedySuccesses((prev) => prev + 1);
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
  // Age continues from saved state, so we calculate elapsed time since creation
  useEffect(() => {
    const savedAge = savedState.ageSeconds || 0;
    const savedCreatedAt = savedState.createdAt;
    
    if (savedCreatedAt) {
      // Calculate elapsed time since creation
      const elapsedSinceCreation = Math.floor((Date.now() - savedCreatedAt) / 1000);
      const initialAge = Math.max(savedAge, elapsedSinceCreation);
      setAgeSeconds(initialAge);
    }
    
    const interval = setInterval(() => {
      setAgeSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount - savedState is constant from initial load

  // Evolution handler
  const handleEvolution = useCallback((result: EvolutionCheckResult) => {
    if (!result.nextStage) return;

    // Convert string stage to number for petState
    const stageMap: Record<EvolutionStage, 1 | 2 | 3> = {
      baby: 1,
      adult: 2,
      legendary: 3,
    };

    const newStage = stageMap[result.nextStage];

    // Update pet state to new evolution stage
    setPetState((prev) => ({
      ...prev,
      evolutionStage: newStage,
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

  // Evolution check hook (disabled when manual override is active)
  useEvolutionCheck({
    petState: {
      ...petState,
      ageSeconds,
      interactionCount,
    },
    onEvolution: handleEvolution,
    enabled: !manualEvolutionOverride,
  });

  // FTUE handlers
  const handleWelcomeGetStarted = useCallback(() => {
    setShowWelcomeModal(false);
    if (!hasCompletedFTUE()) {
      setShowTutorialModal(true);
    }
  }, []);

  const handleWelcomeSkip = useCallback(() => {
    setShowWelcomeModal(false);
    markFTUECompleted();
  }, []);

  const handleTutorialComplete = useCallback(() => {
    setShowTutorialModal(false);
    markFTUECompleted();
  }, []);

  const handleTutorialSkip = useCallback(() => {
    setShowTutorialModal(false);
    markFTUECompleted();
  }, []);

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

  // Reset pet handler
  const handleReset = useCallback(() => {
    // Clear all LocalStorage data
    resetAllPetData();
    clearAllCooldowns();
    
    // Reset all component state to defaults
    setSelectedCoinId('bitcoin');
    setPetState({
      mood: 'neutral',
      evolutionStage: 1,
      isAnimating: true,
    });
    setMoodLevel(3);
    setAgeSeconds(0);
    setInteractionCount(0);
    setSchadenfreudeCount(0);
    setComedyAttempts(0);
    setComedySuccesses(0);
    
    // Reset modal states
    setShowSchadenfreudeModal(false);
    setSchadenfreudeModalData(null);
    setShowComedyJudgeModal(false);
    setShowComedyResultsModal(false);
    setComedyRating(null);
    setShowEvolutionModal(false);
    setEvolutionData(null);
    setIsEvolving(false);
    setIsLaughing(false);
    setConfettiTrigger(0);
    
    // Reset previous mood ref
    prevMoodStateRef.current = 'neutral';
    
    // Show toast notification
    showToast('Pet reset! Starting fresh... 🐾', 'info');
  }, [showToast]);

  // Expose console shortcuts for debugging
  useEffect(() => {
    // Map mood state to approximate mood level
    const moodLevelMap: Record<MoodState, number> = {
      happy: 4,
      neutral: 3,
      sad: 2,
    };

    // Function to change pet mood
    (window as any).setMood = (mood: MoodState) => {
      if (!['happy', 'neutral', 'sad'].includes(mood)) {
        console.error('Invalid mood. Use: "happy", "neutral", or "sad"');
        return;
      }
      setPetState((prev) => ({
        ...prev,
        mood,
      }));
      setMoodLevel(moodLevelMap[mood]);
      setInteractionCount((prev) => prev + 1);
      console.log(`Pet mood changed to: ${mood}`);
    };

    // Function to change pet evolution stage
    (window as any).setEvolution = (stage: 1 | 2 | 3) => {
      if (![1, 2, 3].includes(stage)) {
        console.error('Invalid evolution stage. Use: 1 (Baby), 2 (Adult), or 3 (Legendary)');
        return;
      }
      // Enable manual override to prevent automatic evolution from changing it back
      setManualEvolutionOverride(true);
      setPetState((prev) => ({
        ...prev,
        evolutionStage: stage,
      }));
      console.log(`Pet evolution changed to: ${STAGE_NAMES[stage]} (Stage ${stage})`);
      console.log('Automatic evolution is now disabled. Use enableAutoEvolution() to re-enable.');
    };

    // Function to enable/disable automatic evolution
    (window as any).enableAutoEvolution = () => {
      setManualEvolutionOverride(false);
      console.log('Automatic evolution enabled');
    };

    (window as any).disableAutoEvolution = () => {
      setManualEvolutionOverride(true);
      console.log('Automatic evolution disabled');
    };

    // Function to get current pet state
    (window as any).getPetState = () => {
      return {
        mood: petState.mood,
        evolutionStage: petState.evolutionStage,
        stageName: STAGE_NAMES[petState.evolutionStage],
        moodLevel,
        ageSeconds,
        interactionCount,
      };
    };

    // Log available functions
    console.log('%cCrypto Pet Console Shortcuts:', 'color: #4CAF50; font-weight: bold; font-size: 14px;');
    console.log('%csetMood("happy" | "neutral" | "sad")', 'color: #2196F3;');
    console.log('%csetEvolution(1 | 2 | 3)', 'color: #2196F3;');
    console.log('%cgetPetState()', 'color: #2196F3;');
    console.log('%cenableAutoEvolution() / disableAutoEvolution()', 'color: #FF9800;');
    console.log('Example: setMood("happy") or setEvolution(2)');

    // Cleanup on unmount
    return () => {
      delete (window as any).setMood;
      delete (window as any).setEvolution;
      delete (window as any).getPetState;
      delete (window as any).enableAutoEvolution;
      delete (window as any).disableAutoEvolution;
    };
  }, [petState, moodLevel, ageSeconds, interactionCount]);

  return (
    <main className="appShell">
      <div className="appContent">
        <header className="appHeader">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%', position: 'relative' }}>
            <div style={{ flex: 1 }}></div>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <h1>Crypto Pet</h1>
              <p>Keep your pixel companion happy and thriving.</p>
            </div>
            <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
              <ResetButton onReset={handleReset} />
            </div>
          </div>
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
      </div>
      {toasts.map((toast, index) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          duration={toast.duration}
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
      <WelcomeModal
        isOpen={showWelcomeModal}
        onClose={handleWelcomeSkip}
        onGetStarted={handleWelcomeGetStarted}
      />
      <TutorialModal
        isOpen={showTutorialModal}
        onClose={handleTutorialSkip}
        onComplete={handleTutorialComplete}
      />
    </main>
  );
}

export default App;
