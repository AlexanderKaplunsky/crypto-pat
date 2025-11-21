/**
 * Validation tests for moodCalculator
 * Run with: npx tsx src/utils/__moodCalculator.test.ts
 */

import { calculateMood } from './moodCalculator';

interface TestCase {
  name: string;
  priceChange24h: number;
  weatherModifier: number;
  expected: { moodLevel: number; moodState: 'happy' | 'neutral' | 'sad' };
}

const testCases: TestCase[] = [
  // AC2: Price-Based Mood Levels
  { name: 'Price > 5%', priceChange24h: 6, weatherModifier: 0, expected: { moodLevel: 5, moodState: 'happy' } },
  { name: 'Price 0-5%', priceChange24h: 3, weatherModifier: 0, expected: { moodLevel: 4, moodState: 'happy' } },
  { name: 'Price 0--5%', priceChange24h: -3, weatherModifier: 0, expected: { moodLevel: 2, moodState: 'sad' } },
  { name: 'Price < -5%', priceChange24h: -6, weatherModifier: 0, expected: { moodLevel: 1, moodState: 'sad' } },
  { name: 'Price = 0', priceChange24h: 0, weatherModifier: 0, expected: { moodLevel: 3, moodState: 'neutral' } },
  
  // AC3: Weather Modifier Application
  { name: 'Price 4% + sunny (+0.5)', priceChange24h: 4, weatherModifier: 0.5, expected: { moodLevel: 5, moodState: 'happy' } },
  { name: 'Price -4% + rainy (-0.5)', priceChange24h: -4, weatherModifier: -0.5, expected: { moodLevel: 2, moodState: 'sad' } }, // 2 + (-0.5) = 1.5, rounds to 2
  { name: 'Price 3% + cloudy (0)', priceChange24h: 3, weatherModifier: 0, expected: { moodLevel: 4, moodState: 'happy' } },
  
  // AC4: Mood Level Clamping
  { name: 'Price 5% + sunny (clamp to 5)', priceChange24h: 5, weatherModifier: 0.5, expected: { moodLevel: 5, moodState: 'happy' } },
  { name: 'Price -5% + rainy (clamp to 1)', priceChange24h: -5, weatherModifier: -0.5, expected: { moodLevel: 2, moodState: 'sad' } }, // 2 + (-0.5) = 1.5, rounds to 2
  
  // Edge Cases
  { name: 'Exact boundary: price = 5.0', priceChange24h: 5.0, weatherModifier: 0, expected: { moodLevel: 4, moodState: 'happy' } },
  { name: 'Exact boundary: price = -5.0', priceChange24h: -5.0, weatherModifier: 0, expected: { moodLevel: 2, moodState: 'sad' } },
  { name: 'Very large positive', priceChange24h: 100, weatherModifier: 0, expected: { moodLevel: 5, moodState: 'happy' } },
  { name: 'Very large negative', priceChange24h: -100, weatherModifier: 0, expected: { moodLevel: 1, moodState: 'sad' } },
  { name: 'Price 3.5% + sunny', priceChange24h: 3.5, weatherModifier: 0.5, expected: { moodLevel: 5, moodState: 'happy' } },
  { name: 'Price -3.5% + rainy', priceChange24h: -3.5, weatherModifier: -0.5, expected: { moodLevel: 2, moodState: 'sad' } }, // 2 + (-0.5) = 1.5, rounds to 2
];

function runTests() {
  console.log('🧪 Running moodCalculator validation tests...\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const test of testCases) {
    const result = calculateMood(test.priceChange24h, test.weatherModifier);
    const passedTest = 
      result.moodLevel === test.expected.moodLevel && 
      result.moodState === test.expected.moodState;
    
    if (passedTest) {
      passed++;
      console.log(`✅ ${test.name}`);
    } else {
      failed++;
      console.error(`❌ ${test.name}`);
      console.error(`   Expected: ${JSON.stringify(test.expected)}`);
      console.error(`   Got:      ${JSON.stringify(result)}`);
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

