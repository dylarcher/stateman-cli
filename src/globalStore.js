import { createStore as reduxCreateStore } from 'redux';
import { Map as ImmutableMap, isImmutable } from 'immutable';

/**
 * Creates a Redux-like global store that uses Immutable.js for its state.
 *
 * @param {function} reducer - A reducing function that returns the next state tree,
 *                             given the current state tree and an action to handle.
 *                             It must operate on and return Immutable.js structures.
 * @param {Immutable.Map} [initialState] - The initial state. Must be an Immutable.Map.
 *                                         If not provided, the reducer will be called
 *                                         with an undefined state to produce the initial state.
 * @param {function} [enhancer] - The store enhancer, such as applyMiddleware.
 * @returns {object} A Redux-like store object with dispatch, subscribe, getState methods.
 *                   The getState method returns an Immutable.Map.
 */
function createGlobalStore(reducer, initialState, enhancer) {
  // Ensure initialState, if provided, is an Immutable.Map.
  if (initialState !== undefined && !isImmutable(initialState)) {
    throw new Error('Initial state must be an Immutable.js structure if provided.');
  }

  // Wrap the original reducer to ensure it always receives and returns Immutable.js structures.
  // This is a basic safeguard; reducers themselves should be written to handle Immutable.js.
  const wrappedReducer = (state, action) => {
    // If state is undefined (initial call), and initialState was provided, use it.
    // Redux typically calls the reducer with undefined state initially.
    // If initialState is also undefined here, it means the reducer should define its own initial Immutable state.
    const currentState = state === undefined && initialState !== undefined ? initialState : state;

    if (currentState !== undefined && !isImmutable(currentState)) {
      console.warn('Reducer received a non-immutable state. This may indicate an issue.');
      // Attempt to convert, but this is not ideal. Reducers should manage this.
      // return reducer(ImmutableMap.isMap(currentState) ? currentState : ImmutableMap(currentState), action);
    }

    const newState = reducer(currentState, action);

    if (!isImmutable(newState)) {
      throw new Error('Reducer must return an Immutable.js structure.');
    }
    return newState;
  };

  // If an initial state is explicitly passed to createGlobalStore,
  // and it's immutable, Redux will pass it to the reducer for the first call.
  // If initialState is undefined here, Redux passes 'undefined' to the reducer,
  // which should then return its own default initial immutable state.
  const store = reduxCreateStore(wrappedReducer, initialState, enhancer);

  return {
    ...store,
    /**
     * Reads the state tree managed by the store.
     * @returns {Immutable.Map} The current state tree.
     */
    getState: () => {
      const state = store.getState();
      // Ensure the state returned is always immutable, though the wrappedReducer should guarantee this.
      return isImmutable(state) ? state : ImmutableMap(state);
    }
  };
}

export { createGlobalStore };
