import { isImmutable } from './utils/immutableUtils.js'; // Custom isImmutable
import { state as vanState } from './utils/customVanUtils.js'; // Custom van.state

/**
 * Attaches global store interaction methods to a scoped state's context.
 * This function is intended to be used internally by createScopedState.
 *
 * @param {object} scopedState - The VanJS state object (or any object to attach methods to).
 * @param {object} globalStore - The global store instance (from createGlobalStore).
 */
export function connectToGlobalStore(scopedState, globalStore) {
  if (!globalStore || typeof globalStore.getState !== 'function' || typeof globalStore.dispatch !== 'function') {
    console.warn('Invalid globalStore instance provided for bridging.')
    return
  }

  /**
   * Retrieves a slice of the global state using a selector function.
   * @template S
   * @param {function(object): S} selectorFn - A function that takes the global state (our custom Map/List)
   *                                           and returns a selected part or derived data.
   * @returns {S} The selected state.
   */
  scopedState.getGlobal = (selectorFn) => {
    if (typeof selectorFn !== 'function') {
      throw new Error('selectorFn must be a function for getGlobal.')
    }
    const globalState = globalStore.getState()
    if (!isImmutable(globalState)) {
      console.warn('Global state is not an Immutable.js structure. Bridge functionality may not work as expected.')
    }
    return selectorFn(globalState)
  }

  /**
   * Dispatches an action to the connected global store.
   * @param {object} action - The action object to dispatch.
   * @returns {object} The dispatched action.
   */
  scopedState.dispatchGlobal = (action) => {
    return globalStore.dispatch(action)
  }

  /**
   * Subscribes to changes in a selected slice of the global state.
   * The callback is invoked only when the selected part of the state changes.
   * @template S
   * @param {function(object): S} selectorFn - A function that selects data from the global state (our custom Map/List).
   * @param {function(S): void} callback - The function to call when the selected state changes.
   * @returns {function} An unsubscribe function.
   */
  scopedState.subscribeToGlobal = (selectorFn, callback) => {
    if (typeof selectorFn !== 'function') {
      throw new Error('selectorFn must be a function for subscribeToGlobal.')
    }
    if (typeof callback !== 'function') {
      throw new Error('callback must be a function for subscribeToGlobal.')
    }

    let lastSelectedState = selectorFn(globalStore.getState())

    const unsubscribe = globalStore.subscribe(() => {
      const newSelectedState = selectorFn(globalStore.getState())

      // Simplified change detection: if new instances are returned on change, !== works.
      // isImmutable checks can be kept if we add a deep .equals method later.
      // For now, rely on reference change or custom areEqual.
      let hasChanged;
      if (isImmutable(lastSelectedState) && isImmutable(newSelectedState)) {
        hasChanged = !lastSelectedState.equals(newSelectedState);
      } else {
        hasChanged = lastSelectedState !== newSelectedState;
      }

      if (hasChanged) {
        lastSelectedState = newSelectedState
        callback(newSelectedState)
      }
    })
    return unsubscribe
  }

  /**
   * Creates a reactive VanJS state that reflects a selected slice of the global state.
   * The VanJS state automatically updates when the selected global data changes.
   * @template S
   * @param {function(object): S} selectorFn - A function that selects data from the global state (our custom Map/List).
   * @param {object} [options] - Optional parameters.
   * @param {function(S, S): boolean} [options.areEqual] - Optional custom equality function to determine
   *                                                      if the selected state has changed.
   *                                                      Defaults to strict inequality (!==).
   * @returns {object} A VanJS-like state object (from customVanUtils) whose .val property holds the selected global data.
   */
  scopedState.createGlobalStateSelector = (selectorFn, options = {}) => {
    if (typeof selectorFn !== 'function') {
      throw new Error('selectorFn must be a function for createGlobalStateSelector.')
    }

    const { areEqual } = options
    const initialSelectedData = selectorFn(globalStore.getState())
    const reactiveGlobalState = vanState(initialSelectedData) // Use custom vanState

    let lastSelectedStateForVan = initialSelectedData

    globalStore.subscribe(() => {
      const newSelectedState = selectorFn(globalStore.getState())
      let changed = false
      if (typeof areEqual === 'function') {
        changed = !areEqual(lastSelectedStateForVan, newSelectedState)
      } else if (isImmutable(lastSelectedStateForVan) && isImmutable(newSelectedState)) {
        changed = !lastSelectedStateForVan.equals(newSelectedState);
      } else {
        // Default to strict inequality for non-custom-immutable types or mixed types.
        changed = lastSelectedStateForVan !== newSelectedState;
      }

      if (changed) {
        lastSelectedStateForVan = newSelectedState
        reactiveGlobalState.val = newSelectedState
      }
    })
    // Note on unsubscribe: As mentioned in the prompt, this basic implementation
    // doesn't return the unsubscribe function from globalStore.subscribe.
    // For long-lived scoped states that might be destroyed before the global store,
    // managing this subscription would be important in a production library.
    return reactiveGlobalState
  }
}
