"use strict"

/**
 * DepState: State Management with Integrated Dependencies
 * This file contains the core implementation of the DepState library,
 * leveraging Redux for global state, VanJS for scoped state, and Immutable.js for data integrity.
 */

// Package imports
import Immutable from 'immutable';
import { createStore as createReduxStore, applyMiddleware as reduxApplyMiddleware, compose as reduxCompose } from 'redux';
import van from 'vanjs-core';
import thunk from './middleware/thunk.js';

/**
 * Creates a DepState global store that holds the complete state tree of your app.
 * It's a wrapper around the Redux store, configured to work with Immutable.js and a DI-aware thunk middleware.
 * @param {object} config - The configuration object for the store.
 * @param {function} config.reducer - The root reducer function.
 * @param {Immutable.Map} [config.initialState] - The initial state, which should be an Immutable.js Map.
 * @param {Array} [config.middleware=[]] - An array of middleware to be applied.
 * @param {object} [config.dependencies={}] - An object containing dependencies to be injected into thunks.
 * @param {boolean} [config.devTools=true] - Whether to enable Redux DevTools Extension integration.
 * @returns {object} A DepState store instance.
 */
export function createGlobalStore({
    reducer,
    initialState,
    middleware = [],
    dependencies = {},
    devTools = true
}) {
    // Use the imported thunk middleware
    const thunkMiddleware = thunk.withExtraArgument(dependencies);

    // Prepend our thunk middleware to any user-provided middleware
    const allMiddleware = [thunkMiddleware, ...middleware]

    // Set up enhancers, including middleware and DevTools
    const composeEnhancers = (devTools && typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) || reduxCompose
    const enhancer = composeEnhancers(reduxApplyMiddleware(...allMiddleware))

    // Create the underlying Redux store
    const store = createReduxStore(reducer, initialState, enhancer)

    // Return the store with a clear API
    return {
        dispatch: store.dispatch,
        subscribe: store.subscribe,
        getState: store.getState,
        replaceReducer: store.replaceReducer,
        dependencies: dependencies // Expose dependencies for reference if needed
    }
}

/**
 * A utility that combines multiple reducers into a single root reducer.
 * This version is designed to work with an Immutable.js state tree.
 * @param {object} reducers - An object where keys are state slice names and values are the corresponding reducer functions.
 * @returns {function} A single root reducer function.
 */
export function combineReducers(reducers) {
    // This is a simplified version inspired by redux-immutable's combineReducers.
    // It ensures that the state passed to each reducer is the correct Immutable slice.
    return (state = Immutable.Map(), action) => {
        return Object.keys(reducers).reduce((nextState, key) => {
            const previousStateForKey = nextState.get(key)
            const nextStateForKey = reducers[key](previousStateForKey, action)
            return nextState.set(key, nextStateForKey)
        }, state)
    }
}

/**
 * Creates a reactive, localized state object, ideal for UI components.
 * This is a wrapper around VanJS's state functionality.
 * @template T
 * @param {T} initialValue - The initial value for the state.
 * @param {object} [options] - Configuration options.
 * @param {object} [options.globalStore] - An optional DepState global store instance to enable bridging.
 * @returns {object} A DepState scoped state object.
 */
export function createScopedState(initialValue, options = {}) {
    const vanState = van.state(initialValue)
    const { globalStore } = options

    const scopedState = {
        // Core VanJS properties
        get val() {
            return vanState.val
        },
        set val(newValue) {
            vanState.val = newValue
        },
        get oldVal() {
            return vanState.oldVal
        },
        get rawVal() {
            return vanState.rawVal
        },
        // DepState bridge methods (if connected to global store)
        getGlobal: (selectorFn) => {
            if (!globalStore) {
                console.warn('getGlobal called on a scoped state that is not connected to a global store.')
                return undefined
            }
            if (typeof selectorFn !== 'function') {
                throw new Error('getGlobal requires a selector function.')
            }
            return selectorFn(globalStore.getState())
        },
        dispatchGlobal: (action) => {
            if (!globalStore) {
                console.warn('dispatchGlobal called on a scoped state that is not connected to a global store.')
                return
            }
            return globalStore.dispatch(action)
        },
        subscribeToGlobal: (selectorFn, callback) => {
            if (!globalStore) {
                console.warn('subscribeToGlobal called on a scoped state that is not connected to a global store.')
                return () => { } // Return a no-op unsubscribe function
            }
            if (typeof selectorFn !== 'function' || typeof callback !== 'function') {
                throw new Error('subscribeToGlobal requires a selector function and a callback function.')
            }

            let lastSelectedState = selectorFn(globalStore.getState())

            const unsubscribe = globalStore.subscribe(() => {
                const newSelectedState = selectorFn(globalStore.getState())
                // Use Immutable.is for robust equality checks
                if (!Immutable.is(lastSelectedState, newSelectedState)) {
                    lastSelectedState = newSelectedState
                    callback(newSelectedState)
                }
            })
            return unsubscribe
        },
        // Expose underlying VanJS state for direct use with van.tags if needed
        _vanState: vanState
    }

    return scopedState
}

/**
 * Creates a derived state whose value is computed from other state objects.
 * This is a wrapper around VanJS's derive functionality.
 * @template T
 * @param {function(): T} derivationFn - The function that computes the derived value.
 * @returns {object} A read-only derived state object.
 */
export function deriveScopedState(derivationFn) {
    const derivedState = van.derive(derivationFn)
    // Return a read-only version for safety
    return {
        get val() {
            return derivedState.val
        },
        get rawVal() {
            return derivedState.rawVal
        },
        _vanState: derivedState
    }
}


// Re-export key utilities for convenience
export {
    reduxApplyMiddleware as applyMiddleware,
    reduxCompose as compose,
    Immutable,
    van
}
