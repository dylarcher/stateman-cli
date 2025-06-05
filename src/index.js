// Global Store
export { createGlobalStore } from './globalStore.js'

// Scoped State
export { createScopedState, deriveScopedState } from './scopedState.js'

// Immutability Utilities
// Exporting the namespace and specific functions for convenience
export { fromJS, Immutable, isImmutable } from './utils/immutableUtils.js'
// Users can also access specific Immutable types like Map, List via the Immutable namespace:
// import { Immutable } from 'my-library'; const myMap = Immutable.Map();
import applyMiddleware from "./applyMiddleware.js"
export { applyMiddleware }

// Persistence Utilities
export { persistStateMiddleware, rehydrateState } from './middleware/persistState.js'
export { default as localStorageAdapter } from './persistence/localStorageAdapter.js'

// DOM Binding Utilities
export * from './utils/domBinding.js'
