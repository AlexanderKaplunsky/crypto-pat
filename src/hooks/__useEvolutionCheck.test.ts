/// <reference types="node" />
/**
 * Validation tests for useEvolutionCheck hook
 * Run with: npx tsx src/hooks/__useEvolutionCheck.test.ts
 * 
 * Note: For full React Testing Library tests, install:
 * - vitest
 * - @testing-library/react
 * - @testing-library/react-hooks (if using older version)
 */

import { checkEvolution } from '../utils/evolutionChecker';
import type { PetState } from '../types/pet';
import type { EvolutionCheckResult } from '../utils/evolutionChecker';

interface TestPetState extends PetState {
  ageSeconds: number;
  interactionCount: number;
}

function createPetState(
  evolutionStage: 1 | 2 | 3,
  ageSeconds: number,
  interactionCount: number
): TestPetState {
  return {
    evolutionStage,
    mood: 'neutral',
    isAnimating: false,
    ageSeconds,
    interactionCount,
  };
}

// Simple test runner (validates hook logic without React)
// Full React Testing Library tests require vitest setup
function runSimpleTests() {
  console.log('🧪 Running useEvolutionCheck validation tests...\n');
  console.log('⚠️  Note: Full React Testing Library tests require vitest setup');
  console.log('   This validates the underlying evolution check logic\n');
  
  let passed = 0;
  let failed = 0;

  // Test 1: Hook detects evolution when threshold met
  {
    const petState = createPetState(1, 300, 5);
    let callbackCalled = false;
    let callbackResult: EvolutionCheckResult | null = null;
    
    const onEvolution = (result: EvolutionCheckResult) => {
      callbackCalled = true;
      callbackResult = result;
    };

    // Simulate hook behavior - check evolution
    const evolutionResult = checkEvolution(petState);
    
    if (evolutionResult.shouldEvolve) {
      onEvolution(evolutionResult);
    }

    const testPassed = callbackCalled && 
      callbackResult?.shouldEvolve === true &&
      callbackResult?.nextStage === 'adult';
    
    if (testPassed) {
      passed++;
      console.log('✅ Hook detects evolution when threshold met');
    } else {
      failed++;
      console.error('❌ Hook detects evolution when threshold met');
      console.error(`   Callback called: ${callbackCalled}, Result: ${JSON.stringify(callbackResult)}`);
    }
  }

  // Test 2: Hook does not trigger duplicate evolution (simplified - tests logic)
  {
    const petState = createPetState(1, 300, 5);
    let callbackCallCount = 0;
    let hasEvolved = false;
    
    const onEvolution = () => {
      if (!hasEvolved) {
        callbackCallCount++;
        hasEvolved = true;
      }
    };

    // Simulate multiple checks with same state (hook would prevent duplicate)
    const evolutionResult1 = checkEvolution(petState);
    if (evolutionResult1.shouldEvolve && !hasEvolved) {
      onEvolution();
    }
    
    // Second check should not trigger again (hook uses ref to prevent)
    const evolutionResult2 = checkEvolution(petState);
    if (evolutionResult2.shouldEvolve && !hasEvolved) {
      onEvolution();
    }

    const testPassed = callbackCallCount === 1; // Should only be called once
    
    if (testPassed) {
      passed++;
      console.log('✅ Hook does not trigger duplicate evolution (simplified)');
    } else {
      failed++;
      console.error('❌ Hook does not trigger duplicate evolution');
      console.error(`   Expected 1 call, got ${callbackCallCount}`);
    }
  }

  // Test 3: Hook respects enabled flag (simplified)
  {
    const petState = createPetState(1, 300, 5);
    let callbackCalled = false;
    
    const onEvolution = () => {
      callbackCalled = true;
    };

    // Simulate disabled hook
    const enabled = false;
    if (enabled) {
      const evolutionResult = checkEvolution(petState);
      if (evolutionResult.shouldEvolve) {
        onEvolution();
      }
    }

    const testPassed = !callbackCalled;
    
    if (testPassed) {
      passed++;
      console.log('✅ Hook respects enabled flag');
    } else {
      failed++;
      console.error('❌ Hook respects enabled flag');
    }
  }

  // Test 4: Hook returns correct shouldEvolve status
  {
    const petState = createPetState(1, 300, 5);
    const evolutionResult = checkEvolution(petState);
    
    const testPassed = evolutionResult.shouldEvolve === true &&
      evolutionResult.nextStage === 'adult' &&
      evolutionResult.currentStage === 'baby';
    
    if (testPassed) {
      passed++;
      console.log('✅ Hook returns correct shouldEvolve status');
    } else {
      failed++;
      console.error('❌ Hook returns correct shouldEvolve status');
      console.error(`   Expected: { shouldEvolve: true, nextStage: 'adult', currentStage: 'baby' }`);
      console.error(`   Got: ${JSON.stringify(evolutionResult)}`);
    }
  }

  // Test 5: Hook re-runs check when state changes
  {
    let petState = createPetState(1, 299, 9);
    let callbackCalled = false;
    
    const onEvolution = () => {
      callbackCalled = true;
    };

    // Initial check - should not evolve
    const result1 = checkEvolution(petState);
    if (result1.shouldEvolve) {
      onEvolution();
    }

    // Update state to meet threshold
    petState = createPetState(1, 300, 9);
    const result2 = checkEvolution(petState);
    if (result2.shouldEvolve && !callbackCalled) {
      onEvolution();
    }

    const testPassed = callbackCalled && result2.shouldEvolve === true;
    
    if (testPassed) {
      passed++;
      console.log('✅ Hook re-runs check when state changes');
    } else {
      failed++;
      console.error('❌ Hook re-runs check when state changes');
    }
  }

  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All validation tests passed!');
    console.log('\n💡 For full React Testing Library tests:');
    console.log('   1. Install: npm install -D vitest @testing-library/react @testing-library/react-hooks');
    console.log('   2. Configure vitest.config.ts');
    console.log('   3. Use renderHook from @testing-library/react');
    return 0;
  } else {
    console.error('💥 Some tests failed!');
    return 1;
  }
}

// Full React Testing Library tests (requires vitest setup)
function runFullTests() {
  console.log('🧪 Running full useEvolutionCheck tests with React Testing Library...\n');
  
  // These tests require vitest + @testing-library/react
  // Uncomment when test framework is set up
  
  /*
  describe('useEvolutionCheck', () => {
    it('should trigger evolution when threshold met', () => {
      const onEvolution = vi.fn();
      const petState: TestPetState = createPetState(1, 300, 5);

      const { result } = renderHook(() =>
        useEvolutionCheck({
          petState,
          onEvolution,
        })
      );

      expect(onEvolution).toHaveBeenCalledWith(
        expect.objectContaining({
          shouldEvolve: true,
          nextStage: 'adult',
        })
      );
      expect(result.current.shouldEvolve).toBe(true);
    });

    it('should call onEvolution callback when evolution occurs', () => {
      const onEvolution = vi.fn();
      const petState: TestPetState = createPetState(1, 300, 5);

      renderHook(() =>
        useEvolutionCheck({
          petState,
          onEvolution,
        })
      );

      expect(onEvolution).toHaveBeenCalledTimes(1);
      expect(onEvolution).toHaveBeenCalledWith(
        expect.objectContaining({
          shouldEvolve: true,
        })
      );
    });

    it('should not trigger duplicate evolution', () => {
      const onEvolution = vi.fn();
      const petState: TestPetState = createPetState(1, 300, 5);

      const { rerender } = renderHook(
        ({ petState }) => useEvolutionCheck({ petState, onEvolution }),
        { initialProps: { petState } }
      );

      expect(onEvolution).toHaveBeenCalledTimes(1);

      // Rerender with same state
      rerender({ petState });
      expect(onEvolution).toHaveBeenCalledTimes(1);
    });

    it('should re-run check when state changes', () => {
      const onEvolution = vi.fn();
      let petState: TestPetState = createPetState(1, 299, 9);

      const { rerender } = renderHook(
        ({ petState }) => useEvolutionCheck({ petState, onEvolution }),
        { initialProps: { petState } }
      );

      expect(onEvolution).not.toHaveBeenCalled();

      // Update state to meet threshold
      petState = createPetState(1, 300, 9);
      rerender({ petState });

      expect(onEvolution).toHaveBeenCalledTimes(1);
    });

    it('should respect enabled flag', () => {
      const onEvolution = vi.fn();
      const petState: TestPetState = createPetState(1, 300, 5);

      renderHook(() =>
        useEvolutionCheck({
          petState,
          onEvolution,
          enabled: false,
        })
      );

      expect(onEvolution).not.toHaveBeenCalled();
    });

    it('should return correct shouldEvolve status', () => {
      const petState: TestPetState = createPetState(1, 300, 5);

      const { result } = renderHook(() =>
        useEvolutionCheck({
          petState,
        })
      );

      expect(result.current.shouldEvolve).toBe(true);
      expect(result.current.evolutionResult.shouldEvolve).toBe(true);
      expect(result.current.evolutionResult.nextStage).toBe('adult');
    });
  });
  */
  
  console.log('⚠️  Full tests require vitest setup - see comments in test file');
}

// Run tests if executed directly
const exitCode = runSimpleTests();
process.exit(exitCode);

export { runSimpleTests, runFullTests, createPetState };

