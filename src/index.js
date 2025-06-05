/**
 * DepState Library
 * Main entry point
 */

// Export core functionalities from main.js
export {
    createGlobalStore,
    combineReducers,
    applyMiddleware, // Re-exported from main.js, originally from Redux
    compose,         // Re-exported from main.js, originally from Redux
    createScopedState,
    deriveScopedState
} from './main.js';

// Export middleware
export { default as thunk } from './middleware/thunk.js';

// Re-export Immutable.js and VanJS for user convenience if desired
// These are also exported from main.js, but exporting them here directly
// aligns with the original structure and build process (marked as external).
import Immutable from 'immutable';
import van from 'vanjs-core';

export { Immutable, van };
