import { useCallback, useState } from 'react';
import './App.css';
import { ParticleSystem, PetDisplay, PetSprite } from './components';
import { CoinSelector, CryptoStatusBar } from './components/UI';
import type { MoodState, PetState } from './types/pet';

const MOOD_OPTIONS: MoodState[] = ['happy', 'neutral', 'sad'];

function App() {
  const [selectedCoinId, setSelectedCoinId] = useState<string>('bitcoin');
  const [petState, setPetState] = useState<PetState>({
    mood: 'happy',
    evolutionStage: 2,
    isAnimating: true,
  });

  const handleMoodChange = useCallback((nextMood: MoodState) => {
    setPetState((prev) => ({
      ...prev,
      mood: nextMood,
    }));
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

        <PetDisplay>
          <ParticleSystem active={petState.mood === 'happy'} />
          <PetSprite
            mood={petState.mood}
            evolutionStage={petState.evolutionStage}
            isAnimating={petState.isAnimating}
            aria-live="polite"
          />
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
    </main>
  );
}

export default App;
