import assert from 'assert';
import { createGlobalStore } from '../src/main.js';

// Basic smoke test
try {
  assert.strictEqual(typeof createGlobalStore, 'function', 'createGlobalStore should be a function');
  console.log('Test passed: createGlobalStore is a function.');
  // Add more basic tests here if possible, e.g., a simple store creation
  // For now, this is enough to verify the test script runs.
} catch (error) {
  console.error('Test failed:', error);
  process.exit(1); // Exit with error code if test fails
}
