/**
 * DepState Library
 * Main entry point
 */

export {
    applyMiddleware, combineReducers, // Re-exported from Redux for convenience
    compose // Re-exported from Redux for convenience
    , createGlobalStore
} from './globalStore.js'

export {
    createScopedState,
    deriveScopedState
} from './scopedState.js'

export { default as thunk } from './middleware/thunk.js'
export { Immutable, van }

// Re-export Immutable.js and VanJS for user convenience if desired
import Immutable from 'immutable'
import van from 'vanjs-core'
