import { createStore as reduxCreateStore } from 'redux';
import { Map as ImmutableMap, isImmutable } from 'immutable';

/**
 * Creates a Redux-like global store that uses Immutable.js for its state.
 * Integrates with Redux DevTools Extension if available.
 *
 * @param {function} reducer - A reducing function that returns the next state tree.
 * @param {Immutable.Map} [initialState] - The initial state (Immutable.Map).
 * @param {function} [enhancer] - The store enhancer, e.g., applyMiddleware.
 * @returns {object} A Redux-like store object.
 */
function createGlobalStore(reducer, initialState, enhancer) {
  if (initialState !== undefined && !isImmutable(initialState)) {
    throw new Error('Initial state must be an Immutable.js structure if provided.');
  }

  const wrappedReducer = (state, action) => {
    const currentState = state === undefined && initialState !== undefined ? initialState : state;
    const newState = reducer(currentState, action);
    if (!isImmutable(newState)) {
      throw new Error('Reducer must return an Immutable.js structure.');
    }
    return newState;
  };

  // Redux DevTools Extension setup
  let composeEnhancers = (arg) => { // Default compose function (identity if only one arg, or basic compose)
    if (arguments.length === 0) return undefined; // No enhancer and no DevTools
    if (typeof arg === 'function') { // Expects arg to be the enhancer from applyMiddleware
        return arg;
    }
    return undefined; // Should not happen if called correctly
  };

  if (typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) {
    composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
      serialize: {
        immutable: ImmutableMap,
        replacer: (key, value) => {
          if (isImmutable(value)) {
            return value.toJS();
          }
          return value;
        }
      }
    });
  }

  // Correctly compose enhancers:
  // If an enhancer is passed (e.g., from applyMiddleware), it should be composed with DevTools.
  // If no enhancer is passed, DevTools should still be applied if available.
  const storeEnhancer = enhancer
    ? composeEnhancers(enhancer)
    : composeEnhancers(); // composeEnhancers() will be identity or DevTools alone

  const store = reduxCreateStore(
    wrappedReducer,
    initialState,
    storeEnhancer // Apply the potentially composed enhancer
  );

  return {
    ...store,
    getState: () => {
      const state = store.getState();
      return isImmutable(state) ? state : ImmutableMap(state); // Ensure immutability
    }
  };
}

export { createGlobalStore };
