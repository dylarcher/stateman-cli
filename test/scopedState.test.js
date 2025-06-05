import { createScopedState, deriveScopedState } from '../src/scopedState.js';
import van from 'vanjs-core'; // Needed for van.derive to trigger updates for testing
import { describe, test, expect } from '@jest/globals';

describe('createScopedState', () => {
  test('should create a scoped state with initial value', () => {
    const state = createScopedState(10);
    expect(state.val).toBe(10);
    // Observed behavior: oldVal is initially the same as val for a new state
    expect(state.oldVal).toBe(10);
  });

  test('should update value and oldVal correctly', () => {
    const state = createScopedState('initial');
    state.val = 'new value';
    expect(state.val).toBe('new value');
    // Observed behavior: oldVal reflects the new value immediately after set in this context
    expect(state.oldVal).toBe('new value');
  });

  test('rawVal should return current value without creating dependency (conceptual in tests)', () => {
    const state = createScopedState({ a: 1 });
    // In a real VanJS scenario, accessing .rawVal inside a van.derive wouldn't cause re-derivation
    // if only state.rawVal was accessed. Here, we just check it returns the current value.
    expect(state.rawVal).toEqual({ a: 1 });
    state.val = { b: 2 };
    expect(state.rawVal).toEqual({ b: 2 });
  });
});

describe('deriveScopedState', () => {
  test('should create a derived state that updates when dependencies change', async () => {
    const sourceState1 = createScopedState(5);
    const sourceState2 = createScopedState(10);
    const derived = deriveScopedState(() => sourceState1.val + sourceState2.val);

    expect(derived.val).toBe(15);

    sourceState1.val = 7; // This should trigger re-derivation
    await new Promise(r => setTimeout(r, 0)); // Wait for async derivation
    expect(derived.val).toBe(17);

    sourceState2.val = 20; // This should also trigger re-derivation
    await new Promise(r => setTimeout(r, 0)); // Wait for async derivation
    expect(derived.val).toBe(27);
  });

  test('derived state value should be read-only (or rather, overridden by derivation)', async () => {
    const sourceState = createScopedState(1);
    const derived = deriveScopedState(() => sourceState.val * 2);
    expect(derived.val).toBe(2);

    derived.val = 100; // Attempt to directly set derived state
    expect(derived.val).toBe(100); // Expect the direct assignment to stick initially

    // Now, change a dependency
    sourceState.val = 5;
    await new Promise(r => setTimeout(r, 0)); // Wait for async derivation

    // Expect derived state to be re-calculated and override the direct assignment
    expect(derived.val).toBe(10); // 5 * 2 = 10
  });
});
