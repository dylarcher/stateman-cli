// src/utils/customReduxUtils.js

// It's useful to have these available if reducers or initial state use them,
// though createStore itself doesn't strictly need to know about their internals,
// it just passes state around.
// import { isImmutable, fromJS } from './customImmutableUtils.js'; // Not strictly needed for createStore logic itself unless we enforce state type here

const ActionTypes = {
  INIT: "@@redux/INIT",
  REPLACE: "@@redux/REPLACE", // Not implementing replaceReducer in this version
};

export function createStore(reducer, initialState, enhancer) {
  if (typeof initialState === "function" && typeof enhancer === "undefined") {
    enhancer = initialState;
    initialState = undefined;
  }

  if (typeof enhancer !== "undefined") {
    if (typeof enhancer !== "function") {
      throw new Error("Expected the enhancer to be a function.");
    }
    // The enhancer is applied by calling it with createStore itself.
    // It should return a new store creator function which is then called.
    return enhancer(createStore)(reducer, initialState);
  }

  if (typeof reducer !== "function") {
    throw new Error("Expected the reducer to be a function.");
  }

  let currentReducer = reducer;
  let currentState = initialState;
  let currentListeners = [];
  let nextListeners = currentListeners; // For safe iteration during dispatch
  let isDispatching = false;

  function ensureCanMutateNextListeners() {
    if (nextListeners === currentListeners) {
      nextListeners = currentListeners.slice();
    }
  }

  function getState() {
    if (isDispatching) {
      throw new Error(
        "You may not call store.getState() while the reducer is executing. " +
          "The reducer has already received the state as an argument. " +
          "Pass it down from the top reducer instead of reading it from the store.",
      );
    }
    return currentState;
  }

  function subscribe(listener) {
    if (typeof listener !== "function") {
      throw new Error("Expected the listener to be a function.");
    }

    if (isDispatching) {
      throw new Error(
        "You may not call store.subscribe() while the reducer is executing. " +
          "If you would like to be notified after the store has been updated, subscribe from a " +
          "component and invoke store.getState() in the callback to access the latest state. " +
          "See https://redux.js.org/api/store#subscribelistener for more details.",
      );
    }

    let isSubscribed = true;
    ensureCanMutateNextListeners();
    nextListeners.push(listener);

    return function unsubscribe() {
      if (!isSubscribed) {
        return;
      }

      if (isDispatching) {
        throw new Error(
          "You may not unsubscribe from a store listener while the reducer is executing. " +
            "See https://redux.js.org/api/store#subscribelistener for more details.",
        );
      }

      isSubscribed = false;
      ensureCanMutateNextListeners();
      const index = nextListeners.indexOf(listener);
      nextListeners.splice(index, 1);
      currentListeners = null; // Mark currentListeners as dirty, will be updated before next dispatch
    };
  }

  function dispatch(action) {
    if (typeof action.type === "undefined") {
      throw new Error(
        'Actions may not have an undefined "type" property. ' +
          "Have you misspelled a constant?",
      );
    }

    if (isDispatching) {
      throw new Error("Reducers may not dispatch actions.");
    }

    try {
      isDispatching = true;
      currentState = currentReducer(currentState, action);
    } finally {
      isDispatching = false;
    }

    const listeners = (currentListeners = nextListeners);
    for (let i = 0; i < listeners.length; i++) {
      const listener = listeners[i];
      listener();
    }

    return action;
  }

  // When a store is created, an "INIT" action is dispatched so that every
  // reducer returns their initial state. This effectively populates
  // the initial state tree.
  if (currentState === undefined) {
    dispatch({ type: ActionTypes.INIT });
  }

  return {
    dispatch,
    subscribe,
    getState,
    // replaceReducer could be added here if needed
  };
}
