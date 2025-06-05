// Global Store
export { createGlobalStore } from './globalStore.js';

// Scoped State
export { createScopedState, deriveScopedState } from './scopedState.js';

// Immutability Utilities
// Exporting the namespace and specific functions for convenience
export * from './utils/immutableUtils.js';
// Users can also access specific Immutable types like Map, List via the Immutable namespace:
// import { Immutable } from 'my-library'; const myMap = Immutable.Map();
import applyMiddleware from "./applyMiddleware.js";

// Middleware (Placeholder for now)
/**
 * Placeholder for applyMiddleware. Full implementation in Phase 2.
 * This function will enhance the global store with middleware capabilities.
 * @param {...function} middlewares - The middleware functions to apply.
 * @returns {function} A store enhancer.
 */

/**
 * Composes single-argument functions from right to left.
 * This is a basic version of compose, often found in Redux.
 * @param {...function} funcs The functions to compose.
 * @returns {function} A function composed of the input functions.
 */

// Persistence Utilities
export { persistStateMiddleware, rehydrateState } from './middleware/persistState.js';
export { default as localStorageAdapter } from './persistence/localStorageAdapter.js';

// DOM Binding Utilities
export * from './utils/domBinding.js';
