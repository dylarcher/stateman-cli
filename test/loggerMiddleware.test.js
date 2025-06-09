import { afterEach, beforeEach, describe, it as test, mock } from 'node:test';
import assert from 'node:assert';
import { fromJS } from 'immutable'
import applyMiddleware from '../src/applyMiddleware.js'
import { createGlobalStore } from '../src/globalStore.js'
import logger from '../src/middleware/logger.js'

describe('loggerMiddleware', () => {
  let store
  const initialState = fromJS({ message: 'hello' })
  const reducer = (state = initialState, action) => {
    if (action.type === 'TEST_ACTION') {
      return state.set('message', action.payload)
    }
    return state
  }

  const mockConsole = {
    log: mock.fn(),
    info: mock.fn(),
    group: mock.fn(),
    groupEnd: mock.fn(),
    error: mock.fn(),
  }
  let originalConsole

  beforeEach(() => {
    originalConsole = { ...console }
    global.console = { ...global.console, ...mockConsole } // Override console methods
    store = createGlobalStore(reducer, initialState, { enhancer: applyMiddleware(logger) })
  })

  afterEach(() => {
    global.console = originalConsole // Restore original console
    Object.values(mockConsole).forEach(mockFn => mockFn.mock.resetCalls());
  })

  test('should log action and state', () => {
    store.dispatch({ type: 'TEST_ACTION', payload: 'world' })
    assert(mockConsole.group.mock.calls.some(call => call.arguments[0] === 'TEST_ACTION'));
    assert(mockConsole.info.mock.calls.some(call => call.arguments[0] === 'dispatching' && JSON.stringify(call.arguments[1]) === JSON.stringify({ type: 'TEST_ACTION', payload: 'world' })));
    const loggedStateCall = mockConsole.log.mock.calls.find(call => call.arguments[0] === 'next state');
    assert(loggedStateCall, 'log call for "next state" not found');
    assert.deepStrictEqual(loggedStateCall.arguments[1], { message: 'world' });
    assert(mockConsole.groupEnd.mock.calls.length > 0);
  })

  test('should handle actions with no type', () => {
    // Redux will throw if action.type is undefined.
    // We test that the logger still groups with 'Unknown Action' before the error occurs.
    assert.throws(() => store.dispatch({ payload: 'something' }), /Actions may not have an undefined "type" property/);
    assert(mockConsole.group.mock.calls.some(call => call.arguments[0] === 'Unknown Action'));
    // console.info would also have been called.
    assert(mockConsole.info.mock.calls.some(call => call.arguments[0] === 'dispatching' && JSON.stringify(call.arguments[1]) === JSON.stringify({ payload: 'something' })));
    // groupEnd might not be called if an error is thrown before it.
  })

  test('should log non-immutable state correctly if encountered (though store should prevent this)', () => {
    const plainReducer = (state = { message: 'plain' }, action) => {
      if (action.type === 'PLAIN_ACTION') return { message: action.payload }
      return state
    }
    // This setup bypasses createGlobalStore's immutability enforcement for the sake of testing logger
    const mockStore = {
      getState: () => ({ message: 'plain new' }),
      dispatch: () => { }
    }
    const next = action => action
    logger(mockStore)(next)({ type: 'PLAIN_ACTION' })
    const loggedStateCall = mockConsole.log.mock.calls.find(call => call.arguments[0] === 'next state');
    assert(loggedStateCall, 'log call for "next state" not found');
    assert.deepStrictEqual(loggedStateCall.arguments[1], { message: 'plain new' });
  })

  test('should catch and log errors if getState fails during logging', () => {
    const errorStore = {
      getState: () => { throw new Error("State access failed!") },
      // dispatch is not directly called by logger, but by next(action) which is middleware chain
    }
    const next = action => {
      // This 'next' in the test is the function that would be called after the logger.
      // In a real scenario, this would eventually lead to the reducer or further middleware.
      // For this test, we can assume it does nothing or returns the action.
      return action
    }

    // We call the logger directly to isolate its behavior when getState throws
    logger(errorStore)(next)({ type: 'ANY_ACTION' })

    assert(mockConsole.error.mock.calls.some(call => call.arguments[0] === 'Error getting state for logger:' && call.arguments[1] instanceof Error));
    // Also check that it logs the raw state attempt
    assert(mockConsole.log.mock.calls.some(call => call.arguments[0] === 'next state (raw)' && call.arguments[1] === '[Error retrieving state]'));
  })
})
