# Portion: Store

## 1. Store: Overview & Purpose

The **Store** is the central pillar of the DepState library. It serves as the single source of truth for the application's state. Its primary responsibilities include holding the current state, providing mechanisms to read the state, allowing state updates through dispatched actions, managing subscriptions for state change notifications, and orchestrating middleware. Critically, in DepState, the Store also integrates with or manages the Dependency Injector, making it the hub not only for state but also for dependency management.

## 2. API and Usage Guide

### `createGlobalStore(config)`

This is the primary function used to create a store instance.

* **`config: object`**: A configuration object with the following properties:
  * `reducer: (state, action) => newState`: (Required) A function that returns the next state tree, given the current state tree and an action.
  * `initialState?: Immutable.Map`: (Optional) The initial state. Useful for initializing the store with state from a server or local storage.
  * `middleware?: Function[]`: (Optional) An array of Redux-compatible middleware to apply.
  * `dependencies?: object`: (Optional) An object containing dependencies to be injected into thunks.
  * `devTools?: boolean`: (Optional, default: `true`) Enables Redux DevTools Extension integration.
* **Returns:** A `Store` object.

### Store Instance Methods

The object returned by `createGlobalStore` has the following methods:

* **`store.getState(): Immutable.Map`**
  * Returns the current state tree of the application. The state is an `Immutable.js` object.

* **`store.dispatch(action): Action | Function`**
  * Dispatches an action or a thunk. This is the only way to trigger a state change.
  * The `dispatch` function returns the action that was dispatched (or the return value of the thunk).

* **`store.subscribe(listener): () => void`**
  * `listener: () => void`: A callback function to be executed any time the state changes.
  * **Returns:** A function that, when called, unsubscribes the listener.

* **`store.replaceReducer(nextReducer)`**
  * `nextReducer: (state, action) => newState`: The new root reducer to replace the existing one.
  * Used for advanced patterns like hot reloading and code splitting.

### Example

```javascript
import { createGlobalStore, combineReducers, applyMiddleware } from './depstate.js';
import Immutable from '[https://esm.sh/immutable@4.3.6](https://esm.sh/immutable@4.3.6)';

// Reducers
const counterReducer = (state = Immutable.Map({ count: 0 }), action) => {
  switch(action.type) {
    case 'INCREMENT':
      return state.set('count', state.get('count') + 1);
    default:
      return state;
  }
};

const rootReducer = combineReducers({
  counter: counterReducer
});

// Dependencies
const logger = { log: (msg) => console.log(`[LOG]: ${msg}`) };

// Store Creation
const store = createGlobalStore({
  reducer: rootReducer,
  dependencies: { logger }
});

// Usage
store.dispatch({ type: 'INCREMENT' });
console.log(store.getState().getIn(['counter', 'count'])); // Output: 1
