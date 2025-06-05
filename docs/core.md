# Core Concepts of DepState

## 1. Introduction to Core Concepts

Understanding the core concepts of DepState is essential for effectively using the library. This document provides a foundational overview of the terminology and architectural principles that underpin DepState. Grasping these concepts will make it easier to understand the specific API details of each library portion and to build robust, maintainable applications. The entire set of concepts—State, Actions, Reducers, Store, Selectors, and Dependency Injection—forms an integrated system designed for explicitness, testability, and manageable complexity.

## 2. State

In DepState, the **state** refers to the single, comprehensive data structure that represents the entire condition of an application at any given point in time.

* **Global State:** Managed by the global store, it is an `Immutable.js` data structure (typically an `Immutable.Map`). It's the single source of truth for the entire application.
* **Scoped State:** A lightweight, localized state, often a primitive value, used for component-level concerns like UI toggles or input values.
* **Immutability:** A cornerstone principle in DepState is that the global state is **immutable**. This means the state object is never modified directly. Instead, when a change is required, a new state object is created. Immutability is crucial for several reasons:
  * **Predictability:** It makes tracking changes easier, as state transitions are explicit.
  * **Performance Optimizations:** It allows for efficient change detection (e.g., shallow comparisons) in UI rendering or selector memoization.
  * **Easier Debugging:** Time-travel debugging and state snapshots become feasible.

## 3. Actions

**Actions** are plain JavaScript objects that serve as the primary source of information for state changes. They represent an *intent* to alter the state. Actions are the only way to trigger a state update in the global store.

* **Structure:** By convention, actions have a `type` property, which is usually a string constant identifying the action. They may also have a `payload` property carrying any data necessary for the state update.

    ```javascript
    {
      type: 'ADD_TODO',
      payload: { id: 1, text: 'Learn DepState' }
    }
    ```

* **Role:** Actions are dispatched to the store. The store then uses the action and the current state to determine the new state by passing them to reducers.

## 4. Reducers

**Reducers** are pure functions responsible for specifying how the application's global state changes in response to actions.

* **Signature:** A reducer takes two arguments: the current `state` (or a slice of it, which will be an `Immutable.js` object) and an `action`. It returns the `newState` (which must also be an `Immutable.js` object).
    `(currentState, action) => newState`
* **Purity:** Reducer purity is paramount:
  * They must not mutate their arguments.
  * They must not perform any side effects (e.g., API calls, accessing global variables).
  * Given the same inputs, a reducer must always return the same output.

## 5. Store

The **Store** is the central object that brings together the global state, actions, and reducers. It is the single source of truth for the application state.

* **Responsibilities:**
  * Holds the current application state object (as an `Immutable.Map`).
  * Provides access to the current state via a method like `getState()`.
  * Allows state to be updated by dispatching actions via `dispatch(action)`.
  * Registers and unregisters listeners (subscribers) that are notified of state changes, via `subscribe(listener)`.
  * Manages the lifecycle and application of middleware.
  * Manages the **dependency container**, linking the state management system with the dependency injection capabilities for thunks.

## 6. Dependency Injection and Management

**Dependency Injection (DI)** is a design pattern where components receive their dependencies from an external source rather than creating them internally. In DepState, DI is an integrated feature for asynchronous logic.

* **Concept:** DI in DepState means that asynchronous action creators (thunks) can declare their dependencies (e.g., API services, utility functions), and the library will provide instances of these dependencies when the thunk is executed.
* **Why DI?:**
  * **Testability:** Dependencies can be easily mocked or replaced during testing.
  * **Decoupling:** Asynchronous logic is decoupled from the concrete implementation of the services it uses.
  * **Managing Services/APIs:** Provides a structured way to manage and use external services within your state logic.

* **Mechanism:**
    1. **Providing Dependencies:** An object containing all dependencies is passed to `createGlobalStore` during setup.
    2. **Injection:** The `thunkMiddleware` (included by default) makes this dependencies object available as the third argument to any thunk function it executes.

## 7. Selectors

**Selectors** are functions that compute derived data from the store state. They encapsulate the logic for retrieving specific pieces of state or computing values based on the state. While not a built-in feature that requires a special API in DepState, they are a recommended pattern. Libraries like `reselect` can be used with DepState to create memoized selectors for performance.
