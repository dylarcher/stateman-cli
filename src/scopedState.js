import van from 'vanjs-core';
import { connectToGlobalStore } from './bridge.js';

/**
 * Creates a reactive scoped state object using VanJS.
 * If a globalStore is provided in options, bridge methods will be attached.
 *
 * @template T
 * @param {T} initialValue - The initial value for the state.
 * @param {object} [options] - Options for the scoped state.
 * @param {object} [options.globalStore] - An instance of the global store to connect to.
 * @returns {object} A VanJS state object, potentially augmented with global interaction methods
 *                   (`getGlobal`, `dispatchGlobal`, `subscribeToGlobal`).
 */
function createScopedState(initialValue, options = {}) {
  const scopedState = van.state(initialValue);

  if (options.globalStore) {
    connectToGlobalStore(scopedState, options.globalStore);
  }

  return scopedState;
}

/**
 * Creates a derived state object using VanJS.
 * Its value is computed by the derivationFn based on other state objects.
 * If a globalStore is provided in options, bridge methods can be attached
 * (though direct bridge methods on derived states are less common, they might access global state via their derivationFn).
 *
 * @template T
 * @param {function(): T} derivationFn - A function that computes the derived value.
 * @param {object} [options] - Options for the derived state.
 * @param {object} [options.globalStore] - An instance of the global store, if the derivationFn needs to establish bridge capabilities
 *                                         on the derived state itself (less common).
 * @returns {object} A VanJS derived state object. If globalStore is provided, it might be augmented.
 */
function deriveScopedState(derivationFn, options = {}) {
  const derivedState = van.derive(derivationFn);

  // Typically, derived states get global data via their derivation function accessing
  // a bridged scopedState. However, if direct global interaction on the derived state
  // itself is needed, the bridge could be connected here too.
  if (options.globalStore) {
    // Attaching bridge to derivedState directly. Use cases might be limited
    // as derived states are primarily for reading/reacting.
    connectToGlobalStore(derivedState, options.globalStore);
  }

  return derivedState;
}

export { createScopedState, deriveScopedState };
