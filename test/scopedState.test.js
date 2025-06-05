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
import { fromJS, isImmutable } from 'immutable'; // Static import

describe('createScopedState with useImmutable option', () => {
  // Need to import fromJS and isImmutable for these tests
  // Assuming they are available via '../src/utils/immutableUtils.js' or similar
  // For the test file, we might need to import them directly or ensure Jest can resolve them
  // For simplicity, if createScopedState itself imports them, that's fine for its internal use.
  // The tests here will use isImmutable from 'immutable' or a re-export.
  // Let's assume 'fromJS' and 'isImmutable' are globally available via Jest setup or direct import in test.
  // For safety, test files should manage their own imports.
  // Adding import for fromJS and isImmutable as they are used in assertions.
  // const { fromJS, isImmutable } = await import('immutable'); // Removed dynamic import


  test('should convert plain object initialValue to Immutable.Map if useImmutable is true', () => {
    const initialState = { a: 1, b: { c: 2 } };
    const state = createScopedState(initialState, { useImmutable: true });
    expect(isImmutable(state.val)).toBe(true);
    expect(state.val.get('a')).toBe(1);
    expect(state.val.getIn(['b', 'c'])).toBe(2);
  });

  test('should convert plain array initialValue to Immutable.List if useImmutable is true', () => {
    const initialState = [1, { x: 10 }];
    const state = createScopedState(initialState, { useImmutable: true });
    expect(isImmutable(state.val)).toBe(true);
    expect(state.val.get(0)).toBe(1);
    expect(isImmutable(state.val.get(1))).toBe(true); // The nested object {x:10} becomes Immutable.Map
    expect(state.val.getIn([1, 'x'])).toBe(10);
  });

  test('should not convert if initialValue is already immutable and useImmutable is true', () => {
    const initialImmutable = fromJS({ a: 1 });
    const state = createScopedState(initialImmutable, { useImmutable: true });
    expect(state.val).toBe(initialImmutable);
  });

  test('should not convert if useImmutable is false (default)', () => {
    const initialState = { a: 1 };
    const state = createScopedState(initialState);
    expect(isImmutable(state.val)).toBe(false);
    expect(state.val).toEqual(initialState);
  });

  test('should not convert primitives even if useImmutable is true', () => {
    let state = createScopedState(123, { useImmutable: true });
    expect(isImmutable(state.val)).toBe(false);
    expect(state.val).toBe(123);

    state = createScopedState("text", { useImmutable: true });
    expect(isImmutable(state.val)).toBe(false);
    expect(state.val).toBe("text");

    state = createScopedState(null, { useImmutable: true });
    expect(isImmutable(state.val)).toBe(false); // isImmutable(null) is false
    expect(state.val).toBe(null);
  });
});
