import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { persistStateMiddleware, rehydrateState } from '../../src/middleware/persistState.js';
import { createGlobalStore } from '../../src/globalStore.js';
import applyMiddleware from '../../src/applyMiddleware.js';
import { fromJS, isImmutable, Map as ImmutableMap } from 'immutable';

jest.useFakeTimers(); // Use fake timers for debounce/throttle

describe('persistStateMiddleware & rehydrateState', () => {
  let mockAdapter;
  const storageKey = 'testState';
  const initialState = fromJS({ counter: 0, user: { name: 'Guest' } });
  const reducer = (state = initialState, action) => {
    switch (action.type) {
      case 'INCREMENT':
        return state.update('counter', c => c + 1);
      case 'SET_USER_NAME':
        return state.setIn(['user', 'name'], action.name);
      default:
        return state;
    }
  };
  let consoleErrorSpy, consoleWarnSpy;

  beforeEach(() => {
    mockAdapter = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
    };
    jest.clearAllMocks();
    jest.clearAllTimers();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  describe('rehydrateState', () => {
    test('should retrieve and deserialize state from adapter', () => {
      const persistedData = { counter: 10, user: { name: 'Persisted User' } };
      mockAdapter.getItem.mockReturnValueOnce(JSON.stringify(persistedData));

      const rehydrated = rehydrateState({ key: storageKey, adapter: mockAdapter });
      expect(mockAdapter.getItem).toHaveBeenCalledWith(storageKey);
      expect(isImmutable(rehydrated)).toBe(true);
      expect(rehydrated.toJS()).toEqual(persistedData);
    });

    test('should return undefined if adapter returns undefined/null', () => {
      mockAdapter.getItem.mockReturnValueOnce(undefined);
      expect(rehydrateState({ key: storageKey, adapter: mockAdapter })).toBeUndefined();

      mockAdapter.getItem.mockReturnValueOnce(null);
      expect(rehydrateState({ key: storageKey, adapter: mockAdapter })).toBeUndefined();
    });

    test('should return undefined and log error on deserialization error', () => {
      mockAdapter.getItem.mockReturnValueOnce('invalid json');
      expect(rehydrateState({ key: storageKey, adapter: mockAdapter })).toBeUndefined();
      expect(console.error).toHaveBeenCalled();
    });

    test('should use custom deserializer if provided', () => {
        const customDeserializer = jest.fn(str => ({ value: str + "_deserialized" }));
        mockAdapter.getItem.mockReturnValueOnce("data");
        rehydrateState({ key: storageKey, adapter: mockAdapter, deserializer: customDeserializer });
        expect(customDeserializer).toHaveBeenCalledWith("data");
    });
     test('should return undefined if key or adapter is missing', () => {
      expect(rehydrateState({ adapter: mockAdapter })).toBeUndefined();
      expect(console.warn).toHaveBeenCalledWith('Rehydration requires `key` and `adapter`.');
      expect(rehydrateState({ key: storageKey })).toBeUndefined();
      expect(console.warn).toHaveBeenCalledWith('Rehydration requires `key` and `adapter`.');
    });
  });

  describe('persistStateMiddleware', () => {
    test('should subscribe to store and save state changes using adapter (debounced)', () => {
      const store = createGlobalStore(
        reducer,
        initialState,
        applyMiddleware(persistStateMiddleware({ key: storageKey, adapter: mockAdapter, throttleWait: 0 })) // No wait for test
      );

      store.dispatch({ type: 'INCREMENT' });
      jest.runAllTimers();

      expect(mockAdapter.setItem).toHaveBeenCalledTimes(1);
      expect(mockAdapter.setItem).toHaveBeenCalledWith(storageKey, JSON.stringify(store.getState().toJS()));

      store.dispatch({ type: 'SET_USER_NAME', name: 'Test' });
      jest.runAllTimers();
      expect(mockAdapter.setItem).toHaveBeenCalledTimes(2);
      expect(mockAdapter.setItem).toHaveBeenLastCalledWith(storageKey, JSON.stringify(store.getState().toJS()));
    });

    test('should use selector to choose part of state to persist', () => {
      const selector = state => state.get('user');
      const store = createGlobalStore(
        reducer,
        initialState,
        applyMiddleware(persistStateMiddleware({ key: storageKey, adapter: mockAdapter, selector, throttleWait: 0 }))
      );

      store.dispatch({ type: 'INCREMENT' });
      jest.runAllTimers();
      expect(mockAdapter.setItem).toHaveBeenCalledWith(storageKey, JSON.stringify(initialState.get('user').toJS()));

      store.dispatch({ type: 'SET_USER_NAME', name: 'Selector Test' });
      jest.runAllTimers();
      const expectedUser = { name: 'Selector Test' };
      expect(mockAdapter.setItem).toHaveBeenLastCalledWith(storageKey, JSON.stringify(expectedUser));
    });

    test('should use custom serializer if provided', () => {
        const customSerializer = jest.fn(state => "custom_" + JSON.stringify(state));
        const store = createGlobalStore(
            reducer,
            initialState,
            applyMiddleware(persistStateMiddleware({ key: storageKey, adapter: mockAdapter, serializer: customSerializer, throttleWait: 0 }))
        );
        store.dispatch({ type: 'INCREMENT' });
        jest.runAllTimers();
        expect(customSerializer).toHaveBeenCalledWith(store.getState().toJS());
        expect(mockAdapter.setItem).toHaveBeenCalledWith(storageKey, "custom_" + JSON.stringify(store.getState().toJS()));
    });

    test('should throttle save operations', () => {
      const throttleWait = 100;
      const store = createGlobalStore(
        reducer,
        initialState,
        applyMiddleware(persistStateMiddleware({ key: storageKey, adapter: mockAdapter, throttleWait }))
      );

      store.dispatch({ type: 'INCREMENT' });
      store.dispatch({ type: 'INCREMENT' });
      expect(mockAdapter.setItem).not.toHaveBeenCalled();

      jest.advanceTimersByTime(throttleWait / 2);
      store.dispatch({ type: 'INCREMENT' });
      expect(mockAdapter.setItem).not.toHaveBeenCalled();

      jest.advanceTimersByTime(throttleWait);
      expect(mockAdapter.setItem).toHaveBeenCalledTimes(1);
      expect(mockAdapter.setItem).toHaveBeenCalledWith(storageKey, JSON.stringify(fromJS({counter: 3, user: {name: "Guest"}}).toJS()));
    });

    test('should log error if adapter.setItem fails', () => {
      mockAdapter.setItem.mockImplementationOnce(() => { throw new Error('Save failed'); });
      const store = createGlobalStore(
        reducer,
        initialState,
        applyMiddleware(persistStateMiddleware({ key: storageKey, adapter: mockAdapter, throttleWait: 0 }))
      );
      store.dispatch({ type: 'INCREMENT' });
      jest.runAllTimers();
      expect(console.error).toHaveBeenCalledWith('Error saving state to adapter:', expect.any(Error));
    });

    test('should throw error if key or adapter is missing in config for middleware', () => {
        expect(() => persistStateMiddleware({ adapter: mockAdapter })).toThrow('Persistence middleware requires `key` and `adapter` in config.');
        expect(() => persistStateMiddleware({ key: storageKey })).toThrow('Persistence middleware requires `key` and `adapter` in config.');
    });
  });
});
