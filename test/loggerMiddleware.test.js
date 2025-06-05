import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import logger from '../src/middleware/logger.js';
import { createGlobalStore } from '../src/globalStore.js';
import applyMiddleware from '../src/applyMiddleware.js';
import { fromJS } from 'immutable';

describe('loggerMiddleware', () => {
  let store;
  const initialState = fromJS({ message: 'hello' });
  const reducer = (state = initialState, action) => {
    if (action.type === 'TEST_ACTION') {
      return state.set('message', action.payload);
    }
    return state;
  };

  const mockConsole = {
    log: jest.fn(),
    info: jest.fn(),
    group: jest.fn(),
    groupEnd: jest.fn(),
    error: jest.fn(),
  };
  let originalConsole;

  beforeEach(() => {
    originalConsole = { ...console };
    global.console = { ...global.console, ...mockConsole }; // Override console methods
    store = createGlobalStore(reducer, initialState, applyMiddleware(logger));
  });

  afterEach(() => {
    global.console = originalConsole; // Restore original console
    jest.clearAllMocks();
  });

  test('should log action and state', () => {
    store.dispatch({ type: 'TEST_ACTION', payload: 'world' });
    expect(mockConsole.group).toHaveBeenCalledWith('TEST_ACTION');
    expect(mockConsole.info).toHaveBeenCalledWith('dispatching', { type: 'TEST_ACTION', payload: 'world' });
    // Check if toJS was called by checking the structure of the logged state
    const loggedState = mockConsole.log.mock.calls.find(call => call[0] === 'next state');
    expect(loggedState[1]).toEqual({ message: 'world' });
    expect(mockConsole.groupEnd).toHaveBeenCalled();
  });

  test('should handle actions with no type', () => {
    // Redux will throw if action.type is undefined.
    // We test that the logger still groups with 'Unknown Action' before the error occurs.
    expect(() => store.dispatch({ payload: 'something' })).toThrow(/Actions may not have an undefined "type" property/);
    expect(mockConsole.group).toHaveBeenCalledWith('Unknown Action');
    // console.info would also have been called.
    expect(mockConsole.info).toHaveBeenCalledWith('dispatching', { payload: 'something' });
    // groupEnd might not be called if an error is thrown before it.
  });

  test('should log non-immutable state correctly if encountered (though store should prevent this)', () => {
    const plainReducer = (state = { message: 'plain' }, action) => {
        if (action.type === 'PLAIN_ACTION') return { message: action.payload };
        return state;
    }
    // This setup bypasses createGlobalStore's immutability enforcement for the sake of testing logger
    const mockStore = {
        getState: () => ({ message: 'plain new' }),
        dispatch: () => {}
    }
    const next = action => action;
    logger(mockStore)(next)({ type: 'PLAIN_ACTION' });
    const loggedState = mockConsole.log.mock.calls.find(call => call[0] === 'next state');
    expect(loggedState[1]).toEqual({ message: 'plain new' });
  });

  test('should catch and log errors if getState fails during logging', () => {
    const errorStore = {
        getState: () => { throw new Error("State access failed!"); },
        // dispatch is not directly called by logger, but by next(action) which is middleware chain
    };
    const next = action => {
      // This 'next' in the test is the function that would be called after the logger.
      // In a real scenario, this would eventually lead to the reducer or further middleware.
      // For this test, we can assume it does nothing or returns the action.
      return action;
    };

    // We call the logger directly to isolate its behavior when getState throws
    logger(errorStore)(next)({ type: 'ANY_ACTION' });

    expect(mockConsole.error).toHaveBeenCalledWith('Error getting state for logger:', expect.any(Error));
    // Also check that it logs the raw state attempt
    expect(mockConsole.log).toHaveBeenCalledWith('next state (raw)', '[Error retrieving state]');
  });
});
