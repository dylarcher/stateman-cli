/**
 * @jest-environment jsdom
 */
import { afterEach, beforeEach, describe, expect, jest, test } from '@jest/globals'
import { fromJS, Map as ImmutableMap } from 'immutable'
import applyMiddleware from '../src/applyMiddleware.js' // To test enhancer composition
import { createGlobalStore } from '../src/globalStore.js'

describe('Redux DevTools Integration', () => {
  const initialState = fromJS({ counter: 0 })
  const reducer = (state = initialState, action) => {
    switch (action.type) {
      case 'INCREMENT':
        return state.update('counter', c => c + 1)
      case 'DECREMENT':
        return state.update('counter', c => c - 1)
      default:
        return state
    }
  }

  let mockDevToolsExtensionCompose
  // let mockDevToolsInstance; // Not directly used now with composeEnhancers focus
  let originalWindowDevToolsCompose
  // let originalWindowDevToolsExtension; // Not directly used

  beforeEach(() => {
    // mockDevToolsInstance = { ... }; // Kept for reference if needed later

    // Mock for window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    mockDevToolsExtensionCompose = jest.fn().mockImplementation(optionsPassedToCompose => {
      // This mock needs to return an enhancer composer.
      // If it receives an argument (the app's enhancer like applyMiddleware),
      // it should return a function that composes that enhancer.
      // If it receives no arguments, it returns a basic enhancer (like (createStore) => ...).
      return (appEnhancer) => { // appEnhancer is what createGlobalStore passes (e.g., result of applyMiddleware)
        if (appEnhancer) {
          return (createStore) => (reducer, initialState) => {
            // This simulates composing appEnhancer with what DevTools would do.
            // For testing, we just ensure appEnhancer is part of the chain.
            return appEnhancer(createStore)(reducer, initialState)
          }
        }
        // If no appEnhancer, DevTools is the only enhancer.
        return (createStore) => (reducer, initialState) => {
          return createStore(reducer, initialState)
        }
      }
    })

    originalWindowDevToolsCompose = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ = mockDevToolsExtensionCompose

    // originalWindowDevToolsExtension = window.__REDUX_DEVTOOLS_EXTENSION__;
    // window.__REDUX_DEVTOOLS_EXTENSION__ = { connect: jest.fn(() => mockDevToolsInstance) };
  })

  afterEach(() => {
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ = originalWindowDevToolsCompose
    // window.__REDUX_DEVTOOLS_EXTENSION__ = originalWindowDevToolsExtension;
    jest.clearAllMocks()
  })

  test('should use REDUX_DEVTOOLS_EXTENSION_COMPOSE__ if available', () => {
    createGlobalStore(reducer, initialState)
    expect(mockDevToolsExtensionCompose).toHaveBeenCalled()
  })

  test('should pass serialize options for Immutable.js to DevTools', () => {
    createGlobalStore(reducer, initialState)
    expect(mockDevToolsExtensionCompose).toHaveBeenCalledWith(
      expect.objectContaining({
        serialize: expect.objectContaining({
          immutable: ImmutableMap, // Check if 'immutable' key exists
          replacer: expect.any(Function)
        })
      })
    )
    // Test the replacer function from the actual call
    const options = mockDevToolsExtensionCompose.mock.calls[0][0]
    const replacer = options.serialize.replacer
    const immutableData = fromJS({ a: 1 })
    expect(replacer(null, immutableData)).toEqual({ a: 1 })
    expect(replacer(null, "string")).toBe("string")
  })

  test('should correctly compose DevTools enhancer with other enhancers', () => {
    const mockMiddlewareFn = jest.fn(store => next => action => next(action))
    const appEnhancer = applyMiddleware(mockMiddlewareFn)

    const store = createGlobalStore(reducer, initialState, { enhancer: appEnhancer })
    // The mockDevToolsExtensionCompose should have been called with options,
    // and then its returned function should have been called with appEnhancer.
    expect(mockDevToolsExtensionCompose).toHaveBeenCalledWith(expect.objectContaining({ serialize: expect.any(Object) }))

    // To verify that appEnhancer (applyMiddleware) was indeed part of the composed enhancer:
    store.dispatch({ type: 'INCREMENT' }) // Dispatch an action
    expect(mockMiddlewareFn).toHaveBeenCalled() // Middleware from appEnhancer should have run
  })

  test('should correctly apply DevTools enhancer if no other enhancer is present', () => {
    createGlobalStore(reducer, initialState, {}) // Empty options, so no appEnhancer
    expect(mockDevToolsExtensionCompose).toHaveBeenCalledWith(expect.objectContaining({ serialize: expect.any(Object) }))
    // Our mock for composeEnhancers returns a function that takes createStore.
    // And that function, when called, returns the store.
    // Hard to test further without actual DevTools or more complex store mock.
    // The main thing is that composeEnhancers is called.
  })

  test('should function correctly if DevTools extension is not available', () => {
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ = undefined
    // window.__REDUX_DEVTOOLS_EXTENSION__ = undefined; // Not needed for this test path

    let store
    expect(() => {
      // Pass undefined as options, or options without enhancer
      store = createGlobalStore(reducer, initialState, undefined)
    }).not.toThrow()

    store.dispatch({ type: 'INCREMENT' })
    expect(store.getState().get('counter')).toBe(1)
  })
})
