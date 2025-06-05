// Global Store
export { createGlobalStore } from './globalStore.js';

// Scoped State
export { createScopedState, deriveScopedState } from './scopedState.js';

// Immutability Utilities
// Exporting the namespace and specific functions for convenience
export { Immutable, fromJS, isImmutable } from './utils/immutableUtils.js';
// Users can also access specific Immutable types like Map, List via the Immutable namespace:
// import { Immutable } from 'my-library'; const myMap = Immutable.Map();

// Middleware (Placeholder for now)
/**
 * Placeholder for applyMiddleware. Full implementation in Phase 2.
 * This function will enhance the global store with middleware capabilities.
 * @param {...function} middlewares - The middleware functions to apply.
 * @returns {function} A store enhancer.
 */
export function applyMiddleware(...middlewares) {
  return (createStore) => (reducer, initialState) => {
    const store = createStore(reducer, initialState);
    let dispatch = () => {
      throw new Error(
        'Dispatching while constructing your middleware is not allowed. ' +
        'Other middleware would not be applied to this dispatch.'
      );
    };
    const middlewareAPI = {
      getState: store.getState,
      dispatch: (action, ...args) => dispatch(action, ...args)
    };
    const chain = middlewares.map(middleware => middleware(middlewareAPI));
    dispatch = compose(...chain)(store.dispatch); // compose will need to be defined or imported

    return {
      ...store,
      dispatch
    };
  };
}

/**
 * Composes single-argument functions from right to left.
 * This is a basic version of compose, often found in Redux.
 * @param {...function} funcs The functions to compose.
 * @returns {function} A function composed of the input functions.
 */
function compose(...funcs) {
  if (funcs.length === 0) {
    return arg => arg;
  }
  if (funcs.length === 1) {
    return funcs[0];
  }
  return funcs.reduce((a, b) => (...args) => a(b(...args)));
}
