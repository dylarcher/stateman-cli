import { isImmutable } from 'immutable';

/**
 * Attaches global store interaction methods to a scoped state's context.
 * This function is intended to be used internally by createScopedState.
 *
 * @param {object} scopedState - The VanJS state object.
 * @param {object} globalStore - The global store instance (from createGlobalStore).
 */
export function connectToGlobalStore(scopedState, globalStore) {
  if (!globalStore || typeof globalStore.getState !== 'function' || typeof globalStore.dispatch !== 'function') {
    console.warn('Invalid globalStore instance provided for bridging.');
    return;
  }

  /**
   * Retrieves a slice of the global state using a selector function.
   * @template S
   * @param {function(Immutable.Map): S} selectorFn - A function that takes the global Immutable.js state
   *                                                  and returns a selected part or derived data.
   * @returns {S} The selected state.
   */
  scopedState.getGlobal = (selectorFn) => {
    if (typeof selectorFn !== 'function') {
      throw new Error('selectorFn must be a function.');
    }
    const globalState = globalStore.getState();
    if (!isImmutable(globalState)) {
      // This should ideally not happen if globalStore is correctly implemented
      console.warn('Global state is not an Immutable.js structure. Bridge functionality may not work as expected.');
    }
    return selectorFn(globalState);
  };

  /**
   * Dispatches an action to the connected global store.
   * @param {object} action - The action object to dispatch.
   * @returns {object} The dispatched action.
   */
  scopedState.dispatchGlobal = (action) => {
    return globalStore.dispatch(action);
  };

  /**
   * Subscribes to changes in a selected slice of the global state.
   * The callback is invoked only when the selected part of the state changes.
   * @template S
   * @param {function(Immutable.Map): S} selectorFn - A function that selects data from the global state.
   * @param {function(S): void} callback - The function to call when the selected state changes.
   * @returns {function} An unsubscribe function.
   */
  scopedState.subscribeToGlobal = (selectorFn, callback) => {
    if (typeof selectorFn !== 'function') {
      throw new Error('selectorFn must be a function.');
    }
    if (typeof callback !== 'function') {
      throw new Error('callback must be a function.');
    }

    let lastSelectedState = selectorFn(globalStore.getState());

    const unsubscribe = globalStore.subscribe(() => {
      const newSelectedState = selectorFn(globalStore.getState());
      // Perform a shallow comparison for primitives or an Immutable.is comparison for immutable objects.
      // More complex objects might need deeper comparison logic if not immutable.
      const const_immutable_check = isImmutable(lastSelectedState) && isImmutable(newSelectedState)
      const const_primitive_check = !(typeof lastSelectedState === 'object' && lastSelectedState !== null) && !(typeof newSelectedState === 'object' && newSelectedState !== null)

      if (const_immutable_check ? !lastSelectedState.equals(newSelectedState) : (const_primitive_check ? lastSelectedState !== newSelectedState : true) ) {
         // Fallback to true if not immutable or primitive, to always call callback, or implement a deep comparison.
         // For now, if not immutable, we'll assume it changed if references are different or rely on a simple primitive check.
         // A more robust solution for plain JS objects would be a deep equality check or require selectors to return primitives/immutables.
        if (isImmutable(lastSelectedState) && isImmutable(newSelectedState)) {
            if (!lastSelectedState.equals(newSelectedState)) {
                lastSelectedState = newSelectedState;
                callback(newSelectedState);
            }
        } else if (lastSelectedState !== newSelectedState) {
            // This basic check works for primitives and for object references if the selector always returns a new object on change.
            // For complex mutable objects returned by selectors, this might trigger too often or not at all if the object is mutated in place.
            // Best practice: selectors should return immutable data or primitives.
            lastSelectedState = newSelectedState;
            callback(newSelectedState);
        }
      }
    });
    return unsubscribe;
  };
}
