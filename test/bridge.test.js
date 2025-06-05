import { createGlobalStore } from '../src/globalStore.js';
import { createScopedState } from '../src/scopedState.js';
import { fromJS, isImmutable } from 'immutable';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';

describe('State Bridging', () => {
  const initialGlobal = fromJS({ counter: 100, message: 'Hello Global', user: null });
  const globalReducer = (state = initialGlobal, action) => {
    switch (action.type) {
      case 'GLOBAL_INCREMENT':
        return state.update('counter', c => c + 1);
      case 'SET_MESSAGE':
        return state.set('message', action.payload);
      case 'SET_USER': // Added for the new test case
        return state.set('user', fromJS(action.payload));
      default:
        return state;
    }
  };
  let globalStore;

  beforeEach(() => {
    globalStore = createGlobalStore(globalReducer, initialGlobal);
  });

  test('scopedState.getGlobal should retrieve data from globalStore', () => {
    const scoped = createScopedState(null, { globalStore });
    const counter = scoped.getGlobal(state => state.get('counter'));
    expect(counter).toBe(100);
    const message = scoped.getGlobal(state => state.get('message'));
    expect(message).toBe('Hello Global');
  });

  test('scopedState.getGlobal should throw if selector is not a function', () => {
    const scoped = createScopedState(null, { globalStore });
    expect(() => scoped.getGlobal(null)).toThrow('selectorFn must be a function.');
  });

  test('scopedState.dispatchGlobal should dispatch actions to globalStore', () => {
    const scoped = createScopedState(null, { globalStore });
    scoped.dispatchGlobal({ type: 'GLOBAL_INCREMENT' });
    expect(globalStore.getState().get('counter')).toBe(101);

    scoped.dispatchGlobal({ type: 'SET_MESSAGE', payload: 'Updated by Scoped' });
    expect(globalStore.getState().get('message')).toBe('Updated by Scoped');
  });

  test('scopedState.subscribeToGlobal should notify on selected state change', () => {
    const scoped = createScopedState(null, { globalStore });
    const listener = jest.fn();
    const selector = state => state.get('counter');

    const unsubscribe = scoped.subscribeToGlobal(selector, listener);
    expect(listener).not.toHaveBeenCalled();

    // Dispatch action that changes selected state
    globalStore.dispatch({ type: 'GLOBAL_INCREMENT' });
    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(101);

    // Dispatch action that does NOT change selected state
    globalStore.dispatch({ type: 'SET_MESSAGE', payload: 'Irrelevant change' });
    expect(listener).toHaveBeenCalledTimes(1); // Should not be called again

    globalStore.dispatch({ type: 'GLOBAL_INCREMENT' });
    expect(listener).toHaveBeenCalledTimes(2);
    expect(listener).toHaveBeenCalledWith(102);

    unsubscribe();
    globalStore.dispatch({ type: 'GLOBAL_INCREMENT' });
    expect(listener).toHaveBeenCalledTimes(2); // Should not be called after unsubscribe
  });

  test('scopedState.subscribeToGlobal should handle primitive and immutable comparisons', () => {
    const userSelector = state => state.get('user'); // Returns an immutable Map or null
    const listenerUser = jest.fn();
    const scoped = createScopedState(null, { globalStore });
    // Initialize user state for the test
    globalStore.dispatch({ type: 'SET_USER', payload: { name: 'User1', id: 1 } });


    const unsubscribeUser = scoped.subscribeToGlobal(userSelector, listenerUser);

    // Dispatch with a new user object that is different
    globalStore.dispatch({ type: 'SET_USER', payload: { name: 'User2', id: 2 } });
    expect(listenerUser).toHaveBeenCalledTimes(1);
    expect(listenerUser.mock.calls[0][0].get('name')).toBe('User2');

    // Dispatch with the same user data, should result in an equal immutable object
    globalStore.dispatch({ type: 'SET_USER', payload: { name: 'User2', id: 2 } });
    expect(listenerUser).toHaveBeenCalledTimes(1); // Should not call if new Immutable is .equals() to old
  });

  test('subscribeToGlobal should throw if selector or callback is not a function', () => {
    const scoped = createScopedState(null, { globalStore });
    expect(() => scoped.subscribeToGlobal(null, () => {})).toThrow('selectorFn must be a function.');
    expect(() => scoped.subscribeToGlobal(() => {}, null)).toThrow('callback must be a function.');
  });
});
