/// <reference types="node" />
/**
 * Validation tests for evolutionChecker
 * Run with: npx tsx src/utils/__evolutionChecker.test.ts
 */

import { checkEvolution } from './evolutionChecker';
import type { PetState } from '../types/pet';

interface TestPetState extends PetState {
  ageSeconds: number;
  interactionCount: number;
}

interface TestCase {
  name: string;
  petState: TestPetState;
  expected: {
    shouldEvolve: boolean;
    nextStage: 'baby' | 'adult' | 'legendary' | null;
    reason: 'age' | 'interactions' | null;
    currentStage: 'baby' | 'adult' | 'legendary';
  };
}

// Helper to create minimal pet state
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

const testCases: TestCase[] = [
  // AC2: Baby to Adult - Age threshold
  {
    name: 'Baby pet with 300 seconds age → should evolve to adult (age reason)',
    petState: createPetState(1, 300, 5),
    expected: {
      shouldEvolve: true,
      nextStage: 'adult',
      reason: 'age',
      currentStage: 'baby',
    },
  },
  {
    name: 'Baby pet with 301 seconds age → should evolve to adult (age reason)',
    petState: createPetState(1, 301, 5),
    expected: {
      shouldEvolve: true,
      nextStage: 'adult',
      reason: 'age',
      currentStage: 'baby',
    },
  },
  
  // AC2: Baby to Adult - Interaction threshold
  {
    name: 'Baby pet with 10 interactions → should evolve to adult (interactions reason)',
    petState: createPetState(1, 100, 10),
    expected: {
      shouldEvolve: true,
      nextStage: 'adult',
      reason: 'interactions',
      currentStage: 'baby',
    },
  },
  {
    name: 'Baby pet with 11 interactions → should evolve to adult (interactions reason)',
    petState: createPetState(1, 100, 11),
    expected: {
      shouldEvolve: true,
      nextStage: 'adult',
      reason: 'interactions',
      currentStage: 'baby',
    },
  },
  
  // AC2: Baby to Adult - Not ready
  {
    name: 'Baby pet with 299 seconds and 9 interactions → should not evolve',
    petState: createPetState(1, 299, 9),
    expected: {
      shouldEvolve: false,
      nextStage: null,
      reason: null,
      currentStage: 'baby',
    },
  },
  
  // AC3: Adult to Legendary - Age threshold
  {
    name: 'Adult pet with 900 seconds age → should evolve to legendary (age reason)',
    petState: createPetState(2, 900, 15),
    expected: {
      shouldEvolve: true,
      nextStage: 'legendary',
      reason: 'age',
      currentStage: 'adult',
    },
  },
  {
    name: 'Adult pet with 901 seconds age → should evolve to legendary (age reason)',
    petState: createPetState(2, 901, 15),
    expected: {
      shouldEvolve: true,
      nextStage: 'legendary',
      reason: 'age',
      currentStage: 'adult',
    },
  },
  
  // AC3: Adult to Legendary - Interaction threshold
  {
    name: 'Adult pet with 25 interactions → should evolve to legendary (interactions reason)',
    petState: createPetState(2, 500, 25),
    expected: {
      shouldEvolve: true,
      nextStage: 'legendary',
      reason: 'interactions',
      currentStage: 'adult',
    },
  },
  {
    name: 'Adult pet with 26 interactions → should evolve to legendary (interactions reason)',
    petState: createPetState(2, 500, 26),
    expected: {
      shouldEvolve: true,
      nextStage: 'legendary',
      reason: 'interactions',
      currentStage: 'adult',
    },
  },
  
  // AC3: Adult to Legendary - Not ready
  {
    name: 'Adult pet with 899 seconds and 24 interactions → should not evolve',
    petState: createPetState(2, 899, 24),
    expected: {
      shouldEvolve: false,
      nextStage: null,
      reason: null,
      currentStage: 'adult',
    },
  },
  
  // AC4: Legendary cannot evolve
  {
    name: 'Legendary pet → should never evolve',
    petState: createPetState(3, 10000, 100),
    expected: {
      shouldEvolve: false,
      nextStage: null,
      reason: null,
      currentStage: 'legendary',
    },
  },
  
  // AC6: Invalid input
  {
    name: 'Invalid pet state (missing ageSeconds) → returns false with warning',
    petState: {
      evolutionStage: 1,
      mood: 'neutral',
      isAnimating: false,
      ageSeconds: undefined as any,
      interactionCount: 10,
    },
    expected: {
      shouldEvolve: false,
      nextStage: null,
      reason: null,
      currentStage: 'baby',
    },
  },
  {
    name: 'Invalid pet state (missing interactionCount) → returns false with warning',
    petState: {
      evolutionStage: 1,
      mood: 'neutral',
      isAnimating: false,
      ageSeconds: 300,
      interactionCount: undefined as any,
    },
    expected: {
      shouldEvolve: false,
      nextStage: null,
      reason: null,
      currentStage: 'baby',
    },
  },
  
  // AC7: Edge cases - exact thresholds
  {
    name: 'Edge case: Baby pet with exactly 300 seconds → should evolve',
    petState: createPetState(1, 300, 0),
    expected: {
      shouldEvolve: true,
      nextStage: 'adult',
      reason: 'age',
      currentStage: 'baby',
    },
  },
  {
    name: 'Edge case: Baby pet with exactly 10 interactions → should evolve',
    petState: createPetState(1, 0, 10),
    expected: {
      shouldEvolve: true,
      nextStage: 'adult',
      reason: 'interactions',
      currentStage: 'baby',
    },
  },
  {
    name: 'Edge case: Adult pet with exactly 900 seconds → should evolve',
    petState: createPetState(2, 900, 0),
    expected: {
      shouldEvolve: true,
      nextStage: 'legendary',
      reason: 'age',
      currentStage: 'adult',
    },
  },
  {
    name: 'Edge case: Adult pet with exactly 25 interactions → should evolve',
    petState: createPetState(2, 0, 25),
    expected: {
      shouldEvolve: true,
      nextStage: 'legendary',
      reason: 'interactions',
      currentStage: 'adult',
    },
  },
  
  // Additional edge cases
  {
    name: 'Baby pet with both thresholds met (age takes priority)',
    petState: createPetState(1, 300, 10),
    expected: {
      shouldEvolve: true,
      nextStage: 'adult',
      reason: 'age', // Age is checked first
      currentStage: 'baby',
    },
  },
  {
    name: 'Adult pet with both thresholds met (age takes priority)',
    petState: createPetState(2, 900, 25),
    expected: {
      shouldEvolve: true,
      nextStage: 'legendary',
      reason: 'age', // Age is checked first
      currentStage: 'adult',
    },
  },
];

function runTests() {
  console.log('🧪 Running evolutionChecker validation tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const test of testCases) {
    const result = checkEvolution(test.petState);
    const passedTest = 
      result.shouldEvolve === test.expected.shouldEvolve &&
      result.nextStage === test.expected.nextStage &&
      result.reason === test.expected.reason &&
      result.currentStage === test.expected.currentStage;
    
    if (passedTest) {
      passed++;
      console.log(`✅ ${test.name}`);
    } else {
      failed++;
      console.error(`❌ ${test.name}`);
      console.error(`   Expected: ${JSON.stringify(test.expected, null, 2)}`);
      console.error(`   Got:      ${JSON.stringify(result, null, 2)}`);
    }
  }
  
  console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All tests passed!');
    return 0;
  } else {
    console.error('💥 Some tests failed!');
    return 1;
  }
}

// Run tests if executed directly
const exitCode = runTests();
process.exit(exitCode);

export { runTests, testCases };

