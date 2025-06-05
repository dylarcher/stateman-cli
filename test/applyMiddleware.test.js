import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import applyMiddleware, { compose } from '../src/applyMiddleware.js';
import { createGlobalStore } from '../src/globalStore.js'; // Using the actual global store
import { fromJS } from 'immutable';

describe('compose', () => {
  test('composes functions from right to left', () => {
    const a = next => x => next(x + 'a');
    const b = next => x => next(x + 'b');
    const c = next => x => next(x + 'c');
    const final = x => x;
    expect(compose(a,b,c)(final)('')).toBe('abc');
    expect(compose(a,b,c)(x => x + 'd')('')).toBe('abcd');
  });

  test('returns the identity function if no functions are passed', () => {
    expect(compose()(1)).toBe(1);
  });

  test('returns the single function if only one is passed', () => {
    const fn = x => x * 2;
    expect(compose(fn)(2)).toBe(4);
  });
});

describe('applyMiddleware', () => {
  const initialState = fromJS({ value: 0 });
  const reducer = (state = initialState, action) => {
    if (action.type === 'ADD') {
      return state.update('value', v => v + (action.payload || 1));
    }
    return state;
  };

  test('should enhance store with middleware', () => {
    const middlewareLog = [];
    const testMiddleware = store => next => action => {
      middlewareLog.push(`before: ${action.type}`);
      const result = next(action);
      middlewareLog.push(`after: ${action.type}`);
      return result;
    };

    const store = createGlobalStore(reducer, initialState, applyMiddleware(testMiddleware));
    store.dispatch({ type: 'ADD', payload: 5 });

    expect(store.getState().get('value')).toBe(5);
    expect(middlewareLog).toEqual(['before: ADD', 'after: ADD']);
  });

  test('should pass correct API to middleware', () => {
    let capturedStoreAPI;
    const testMiddleware = store => {
      capturedStoreAPI = store;
      return next => action => next(action);
    };

    const store = createGlobalStore(reducer, initialState, applyMiddleware(testMiddleware));
    store.dispatch({ type: 'ADD' });

    expect(capturedStoreAPI.getState).toBeInstanceOf(Function);
    expect(capturedStoreAPI.dispatch).toBeInstanceOf(Function);
    expect(capturedStoreAPI.getState().get('value')).toBe(1); // dispatch was called
  });

  test('middleware should be able to dispatch actions', () => {
    const testMiddleware = ({ dispatch, getState }) => next => action => {
      if (action.type === 'DOUBLE_ADD') {
        dispatch({ type: 'ADD', payload: action.payload });
        dispatch({ type: 'ADD', payload: action.payload });
        return; // Stop this action
      }
      return next(action);
    };

    const store = createGlobalStore(reducer, initialState, applyMiddleware(testMiddleware));
    store.dispatch({ type: 'DOUBLE_ADD', payload: 3 });
    expect(store.getState().get('value')).toBe(6);
  });

  test('should throw if dispatching during middleware construction', () => {
    const problematicMiddleware = store => {
      store.dispatch({ type: 'FAIL' }); // Dispatching too early
      return next => action => next(action);
    };
    expect(() => createGlobalStore(reducer, initialState, applyMiddleware(problematicMiddleware)))
      .toThrow(/Dispatching while constructing your middleware is not allowed/);
  });
});
