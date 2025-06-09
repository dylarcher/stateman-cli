import { state, derive } from './utils/customVanUtils.js'; // Correct path from src/ to src/utils/
import { connectToGlobalStore } from './bridge.js'
import { fromJS, isImmutable } from './utils/immutableUtils.js'

/**
 * Creates a reactive scoped state object using VanJS.
 * If a globalStore is provided in options, bridge methods will be attached.
 * Can optionally convert plain object/array initialValue to an Immutable.js structure.
 *
 * @template T
 * @param {T} initialValue - The initial value for the state.
 * @param {object} [options] - Options for the scoped state.
 * @param {object} [options.globalStore] - An instance of the global store to connect to.
 * @param {boolean} [options.useImmutable=false] - If true, and `initialValue` is a plain JavaScript object or array,
 *                                               it is converted to an Immutable.js structure upon creation.
 *                                               This option *only* affects the initial value conversion.
 *                                               Subsequent assignments to `scopedState.val` are NOT automatically
 *                                               converted to immutable structures by this option; users must
 *                                               manage ongoing immutability themselves if desired by assigning
 *                                               Immutable.js objects to `.val`.
 * @returns {object} A VanJS state object, potentially augmented with global interaction methods,
 *                   and whose initial value might be an Immutable.js structure if `useImmutable` was true.
 */
function createScopedState(initialValue, options = {}) {
  const { globalStore, useImmutable = false } = options

  let finalInitialValue = initialValue
  if (useImmutable && typeof initialValue === 'object' && initialValue !== null && !isImmutable(initialValue)) {
    finalInitialValue = fromJS(initialValue)
  }

  const scopedState = state(finalInitialValue); // Use custom state

  // The previous Object.defineProperty for 'val' when useImmutable was true has been removed.
  // It was not functionally enforcing immutability on ongoing assignments due to complexities
  // with overriding VanJS's native .val setter without recreating its reactivity.
  // The 'useImmutable' option now solely pertains to the conversion of the initialValue.

  if (globalStore) {
    connectToGlobalStore(scopedState, globalStore)
  }

  return scopedState
}

/**
 * Creates a derived state object using VanJS.
 * Its value is computed by the derivationFn based on other state objects.
 *
 * @template T
 * @param {function(): T} derivationFn - A function that computes the derived value.
 *                                     It should depend on other VanJS state objects.
 * @param {object} [options] - Options for the derived state.
 * @param {object} [options.globalStore] - An instance of the global store, if the derivationFn needs to establish bridge capabilities
 *                                         on the derived state itself (less common, as bridge methods are typically on the source states).
 * @returns {object} A VanJS derived state object. If globalStore is provided, it might be augmented with bridge methods.
 */
function deriveScopedState(derivationFn, options = {}) {
  const derivedState = derive(derivationFn); // Use custom derive
  if (options.globalStore) {
    // Attaching bridge to derivedState directly. Use cases might be limited.
    connectToGlobalStore(derivedState, options.globalStore)
  }
  return derivedState
}

export { createScopedState, deriveScopedState }
