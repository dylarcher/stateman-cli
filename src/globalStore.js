import { Map as CustomMap, List as CustomList, isImmutable } from './utils/immutableUtils.js'
// import { createStore as reduxCreateStore } from 'redux' // Remove Redux import
import { createStore as customCreateStore } from './utils/customReduxUtils.js' // Import custom createStore
import { compose } from './applyMiddleware.js'

/**
 * Creates a Redux-like global store that uses Immutable.js for its state.
 * Integrates with Redux DevTools Extension if available and supports ergonomic action creators.
 *
 * @param {function} reducer - A reducing function that returns the next state tree.
 * @param {Immutable.Map} [initialState] - The initial state (Immutable.Map).
 * @param {object} [options] - Optional configuration for the store.
 * @param {function} [options.enhancer] - The store enhancer, e.g., applyMiddleware.
 * @param {object} [options.actions] - An object where keys are action names and values are
 *                                     action creator functions. These will be attached to
 *                                     `store.actions` and will automatically dispatch.
 *                                     An action creator should return a Redux action object ({ type, ...payload }).
 * @returns {object} A Redux-like store object with dispatch, subscribe, getState, and an `actions` object if provided.
 */
function createGlobalStore(reducer, initialState, options = {}) {
  const { enhancer, actions: actionCreators } = options

  if (initialState !== undefined && !isImmutable(initialState)) {
    throw new Error('Initial state must be an Immutable.js structure if provided.')
  }

  const wrappedReducer = (state, action) => {
    const currentState = state === undefined && initialState !== undefined ? initialState : state
    const newState = reducer(currentState, action)
    if (!isImmutable(newState)) {
      throw new Error('Reducer must return an Immutable.js structure.')
    }
    return newState
  }

  let composeEnhancers = compose

  if (typeof window !== 'undefined' && window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) {
    composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
      serialize: {
        // Pass our custom Map and List constructors to the DevTools
        immutable: {
          Map: CustomMap,
          List: CustomList,
        },
        replacer: (key, value) => (isImmutable(value) ? value.toJS() : value),
      }
    })
  }

  // Use the custom createStore function
  const store = customCreateStore(
    wrappedReducer,
    initialState,
    enhancer ? composeEnhancers(enhancer) : composeEnhancers()
  )

  const finalStore = {
    ...store,
    getState: () => {
      const state = store.getState()
      // Ensure the state returned is always an instance of our custom immutable Map if it wasn't already.
      // Note: If the root state could be a List, fromJS(state) would be more appropriate.
      // Assuming root state is object-like, similar to original ImmutableMap(state).
      return isImmutable(state) ? state : new CustomMap(state)
    },
    actions: {} // Initialize actions object
  }

  // Populate store.actions if actionCreators are provided
  if (actionCreators && typeof actionCreators === 'object') {
    for (const actionName in actionCreators) {
      if (Object.hasOwnProperty.call(actionCreators, actionName)) {
        const actionCreator = actionCreators[actionName]
        if (typeof actionCreator === 'function') {
          finalStore.actions[actionName] = (...args) => {
            const action = actionCreator(...args)
            return finalStore.dispatch(action)
          }
        } else {
          console.warn(`Action creator for '${actionName}' is not a function and will be ignored.`)
        }
      }
    }
  }

  return finalStore
}

export { createGlobalStore }
