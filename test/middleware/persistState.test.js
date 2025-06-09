import { afterEach, beforeEach, describe, it as test, mock } from 'node:test';
import assert from 'node:assert';
import { fromJS, isImmutable } from 'immutable'
import applyMiddleware from '../../src/applyMiddleware.js'
import { createGlobalStore } from '../../src/globalStore.js'
import { persistStateMiddleware, rehydrateState } from '../../src/middleware/persistState.js'

describe('persistStateMiddleware & rehydrateState', () => {
  let mockAdapter;
  const storageKey = 'testState'
  const initialState = fromJS({ counter: 0, user: { name: 'Guest' } })
  const reducer = (state = initialState, action) => {
    switch (action.type) {
      case 'INCREMENT':
        return state.update('counter', c => c + 1)
      case 'SET_USER_NAME':
        return state.setIn(['user', 'name'], action.name)
      default:
        return state
    }
  }
  let consoleErrorSpy, consoleWarnSpy

  beforeEach(() => {
    // timers = mock.timers(); // This was incorrect
    mockAdapter = {
      getItem: mock.fn(),
      setItem: mock.fn(),
      removeItem: mock.fn(),
    };
    // No clearAllMocks needed as new mocks are created.
    // timers.reset() is implicitly handled by new mock.timers() per test or manage explicitly if needed.
    consoleErrorSpy = mock.method(console, 'error', () => { });
    consoleWarnSpy = mock.method(console, 'warn', () => { });
  })

  afterEach(() => {
    consoleErrorSpy.mock.restore();
    consoleWarnSpy.mock.restore();
    // mock.timers.reset(); // Reset timers if they were enabled globally for a describe block
  })

  describe('rehydrateState', () => {
    test('should retrieve and deserialize state from adapter', () => {
      const persistedData = { counter: 10, user: { name: 'Persisted User' } }
      mockAdapter.getItem.mock.mockImplementationOnce(() => JSON.stringify(persistedData));

      const rehydrated = rehydrateState({ key: storageKey, adapter: mockAdapter })
      assert.strictEqual(mockAdapter.getItem.mock.calls.length, 1);
      assert.deepStrictEqual(mockAdapter.getItem.mock.calls[0].arguments, [storageKey]);
      assert(isImmutable(rehydrated));
      assert.deepStrictEqual(rehydrated.toJS(), persistedData);
    })

    test('should return undefined if adapter returns undefined/null', () => {
      mockAdapter.getItem.mock.mockImplementationOnce(() => undefined);
      assert.strictEqual(rehydrateState({ key: storageKey, adapter: mockAdapter }), undefined);

      mockAdapter.getItem.mock.mockImplementationOnce(() => null);
      assert.strictEqual(rehydrateState({ key: storageKey, adapter: mockAdapter }), undefined);
    })

    test('should return undefined and log error on deserialization error', () => {
      mockAdapter.getItem.mock.mockImplementationOnce(() => 'invalid json');
      assert.strictEqual(rehydrateState({ key: storageKey, adapter: mockAdapter }), undefined);
      assert(consoleErrorSpy.mock.calls.length > 0);
    })

    test('should use custom deserializer if provided', () => {
      const customDeserializer = mock.fn(str => ({ value: str + "_deserialized" }));
      mockAdapter.getItem.mock.mockImplementationOnce(() => "data");
      rehydrateState({ key: storageKey, adapter: mockAdapter, deserializer: customDeserializer });
      assert.strictEqual(customDeserializer.mock.calls.length, 1);
      assert.deepStrictEqual(customDeserializer.mock.calls[0].arguments, ["data"]);
    })
    test('should return undefined if key or adapter is missing', () => {
      assert.strictEqual(rehydrateState({ adapter: mockAdapter }), undefined);
      assert(consoleWarnSpy.mock.calls.some(call => call.arguments[0] === 'Rehydration requires `key` and `adapter`.'));
      // Reset for next check if calls are cumulative in test
      consoleWarnSpy.mock.resetCalls();
      assert.strictEqual(rehydrateState({ key: storageKey }), undefined);
      assert(consoleWarnSpy.mock.calls.some(call => call.arguments[0] === 'Rehydration requires `key` and `adapter`.'));
    })
  })

  describe('persistStateMiddleware', () => {
    // beforeEach and afterEach for global timer mocks removed

    test('should subscribe to store and save state changes using adapter (debounced)', () => { // No longer async
      const store = createGlobalStore(
        reducer,
        initialState,
        { enhancer: applyMiddleware(persistStateMiddleware({ key: storageKey, adapter: mockAdapter, throttleWait: 0 })) } // No wait for test
      )

      store.dispatch({ type: 'INCREMENT' });
      // await new Promise(resolve => mock.timers.tick(1, resolve)); // Removed

      assert.strictEqual(mockAdapter.setItem.mock.calls.length, 1);
      assert.deepStrictEqual(mockAdapter.setItem.mock.calls[0].arguments, [storageKey, JSON.stringify(store.getState().toJS())]);

      store.dispatch({ type: 'SET_USER_NAME', name: 'Test' });
      // await new Promise(resolve => mock.timers.tick(1, resolve)); // Removed

      assert.strictEqual(mockAdapter.setItem.mock.calls.length, 2);
      assert.deepStrictEqual(mockAdapter.setItem.mock.calls[1].arguments, [storageKey, JSON.stringify(store.getState().toJS())]);
    })

    test('should use selector to choose part of state to persist', () => { // No longer async
      const selector = state => state.get('user');
      const store = createGlobalStore(
        reducer,
        initialState,
        { enhancer: applyMiddleware(persistStateMiddleware({ key: storageKey, adapter: mockAdapter, selector, throttleWait: 0 })) }
      )

      store.dispatch({ type: 'INCREMENT' });
      // await new Promise(resolve => mock.timers.tick(1, resolve)); // Removed

      assert.strictEqual(mockAdapter.setItem.mock.calls.length, 1, "setItem should be called after first dispatch with selector");
      assert.deepStrictEqual(mockAdapter.setItem.mock.calls[0].arguments, [storageKey, JSON.stringify(initialState.get('user').toJS())]);

      store.dispatch({ type: 'SET_USER_NAME', name: 'Selector Test' });
      // await new Promise(resolve => mock.timers.tick(1, resolve)); // Removed

      const expectedUser = { name: 'Selector Test' };
      assert.strictEqual(mockAdapter.setItem.mock.calls.length, 2, "setItem should be called after second dispatch with selector");
      assert.deepStrictEqual(mockAdapter.setItem.mock.calls[1].arguments, [storageKey, JSON.stringify(expectedUser)]);
    })

    test('should use custom serializer if provided', () => { // No longer async
      const customSerializer = mock.fn(state => "custom_" + JSON.stringify(state));
      const store = createGlobalStore(
        reducer,
        initialState,
        { enhancer: applyMiddleware(persistStateMiddleware({ key: storageKey, adapter: mockAdapter, serializer: customSerializer, throttleWait: 0 })) }
      )
      store.dispatch({ type: 'INCREMENT' });
      // await new Promise(resolve => mock.timers.tick(1, resolve)); // Removed

      assert.strictEqual(customSerializer.mock.calls.length, 1);
      assert.deepStrictEqual(customSerializer.mock.calls[0].arguments, [store.getState().toJS()]);
      assert.strictEqual(mockAdapter.setItem.mock.calls.length, 1, "setItem should be called with custom serializer");
      assert.deepStrictEqual(mockAdapter.setItem.mock.calls[0].arguments, [storageKey, "custom_" + JSON.stringify(store.getState().toJS())]);
    })

    test('should throttle save operations', () => {
      mock.timers.enable(); // Enable timers only for this test
      const throttleWait = 100;
      const store = createGlobalStore(
        reducer,
        initialState,
        { enhancer: applyMiddleware(persistStateMiddleware({ key: storageKey, adapter: mockAdapter, throttleWait })) }
      )

      store.dispatch({ type: 'INCREMENT' })
      store.dispatch({ type: 'INCREMENT' })
      assert.strictEqual(mockAdapter.setItem.mock.calls.length, 0);

      mock.timers.tick(throttleWait / 2);
      store.dispatch({ type: 'INCREMENT' })
      assert.strictEqual(mockAdapter.setItem.mock.calls.length, 0);

      mock.timers.tick(throttleWait); // This should trigger the throttled saveState
      assert.strictEqual(mockAdapter.setItem.mock.calls.length, 1);
      assert.deepStrictEqual(mockAdapter.setItem.mock.calls[0].arguments, [storageKey, JSON.stringify(fromJS({ counter: 3, user: { name: "Guest" } }).toJS())]);
    })

    test('should log error if adapter.setItem fails', async () => {
      mockAdapter.setItem.mock.mockImplementationOnce(() => { throw new Error('Save failed') });
      const store = createGlobalStore(
        reducer,
        initialState,
        { enhancer: applyMiddleware(persistStateMiddleware({ key: storageKey, adapter: mockAdapter, throttleWait: 0 })) }
      )
      store.dispatch({ type: 'INCREMENT' });
      // await new Promise(resolve => mock.timers.tick(1, resolve)); // Removed

      assert(consoleErrorSpy.mock.calls.some(call => call.arguments[0] === 'Error saving state to adapter:' && call.arguments[1] instanceof Error));
      // Note: This test is now synchronous. If setItem is not called, this assertion will likely fail because consoleErrorSpy won't be called.
    })

    test('should throw error if key or adapter is missing in config for middleware', () => { // This test is synchronous
      assert.throws(() => persistStateMiddleware({ adapter: mockAdapter }), /Persistence middleware requires `key` and `adapter` in config\./);
      assert.throws(() => persistStateMiddleware({ key: storageKey }), /Persistence middleware requires `key` and `adapter` in config\./);
    })
  })
})
