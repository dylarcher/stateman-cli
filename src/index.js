// Global Store
export { createGlobalStore } from './globalStore.js'

// Scoped State
export { createScopedState, deriveScopedState } from './scopedState.js'
export { createScopedState, deriveScopedState } from './scopedState.js'

// Immutability Utilities
// Exporting the namespace and specific functions for convenience
export { fromJS, Immutable, isImmutable } from './utils/immutableUtils.js'
// Users can also access specific Immutable types like Map, List via the Immutable namespace:
// import { Immutable } from 'my-library'; const myMap = Immutable.Map();
import applyMiddleware from "./applyMiddleware.js"

// Middleware (Placeholder for now)
// Import compose from applyMiddleware.js
import { compose } from './applyMiddleware.js'

/**
 * Placeholder for applyMiddleware. Full implementation in Phase 2.
 * This function will enhance the global store with middleware capabilities.
 * @param {...function} middlewares - The middleware functions to apply.
 * @returns {function} A store enhancer.
 */
export function applyMiddleware(...middlewares) {
  return (createStore) => (reducer, initialState) => {
    const store = createStore(reducer, initialState)
    const store = createStore(reducer, initialState)
    let dispatch = () => {
      throw new Error(
        'Dispatching while constructing your middleware is not allowed. ' +
        'Other middleware would not be applied to this dispatch.'
      )
    }
      )
  }
  const middlewareAPI = {
    getState: store.getState,
    dispatch: (action, ...args) => dispatch(action, ...args)
  }
  const chain = middlewares.map(middleware => middleware(middlewareAPI))
  dispatch = compose(...chain)(store.dispatch)

  return {
    ...store,
    dispatch
  }
}
}

// Persistence Utilities
export { persistStateMiddleware, rehydrateState } from './middleware/persistState.js'
export { default as localStorageAdapter } from './persistence/localStorageAdapter.js'

// DOM Binding Utilities
export * from './utils/domBinding.js'
