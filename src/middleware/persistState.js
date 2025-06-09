import { fromJS, isImmutable } from "../utils/immutableUtils.js"; // Use custom utils

/**
 * Debounces a function.
 * @param {function} func - The function to debounce.
 * @param {number} wait - The debounce delay in milliseconds.
 * @returns {function} The debounced function.
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout); // Ensure this line is present
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Creates a middleware for persisting parts of the global store's state.
 *
 * @param {object} config - Configuration object.
 * @param {string} config.key - The storage key.
 * @param {object} config.adapter - A storage adapter (e.g., localStorageAdapter).
 * @param {function(state: Immutable.Map): object} [config.selector=(state) => state] - Function to select the part of the state to persist.
 *                                                                                  Should return a plain JS object or an Immutable structure.
 * @param {function(selectedState: object): string} [config.serializer=JSON.stringify] - Function to serialize the selected state.
 * @param {function(persistedString: string): object} [config.deserializer=JSON.parse] - Function to deserialize the persisted string.
 * @param {number} [config.throttleWait=1000] - Time in ms to throttle/debounce save operations.
 *
 * @returns {function} The persistence middleware.
 */
export function persistStateMiddleware({
  key,
  adapter,
  selector = (state) => state,
  serializer = JSON.stringify,
  throttleWait = 1000, // Default throttle to 1 second
}) {
  if (!key || !adapter) {
    throw new Error(
      "Persistence middleware requires `key` and `adapter` in config.",
    );
  }

  // This reference will be set once the store is available.
  let currentStore = null;

  const performSave = () => {
    if (!currentStore) {
      console.warn(
        "[Debug persistState] performSave called before store was available.",
      );
      return;
    }
    const stateToSave = currentStore.getState();
    try {
      const selectedState = selector(stateToSave);
      const serializableState = isImmutable(selectedState)
        ? selectedState.toJS()
        : selectedState;
      adapter.setItem(key, serializer(serializableState));
    } catch (error) {
      console.error("Error saving state to adapter:", error);
    }
  };

  const debouncedPerformSave =
    throttleWait > 0 ? debounce(performSave, throttleWait) : performSave; // If no wait time, execute directly

  return (store) => {
    currentStore = store; // Capture the store reference.
    return (next) => (action) => {
      const result = next(action);
      // After action is processed and state is updated, persist it.
      debouncedPerformSave(); // No arguments needed as performSave gets current state
      return result;
    };
  };
}

/**
 * Rehydrates the state from the storage adapter.
 * This should be called before creating the store to augment the initial state.
 *
 * @param {object} config - Configuration object.
 * @param {string} config.key - The storage key.
 * @param {object} config.adapter - A storage adapter.
 * @param {function(persistedString: string): object} [config.deserializer=JSON.parse] - Function to deserialize.
 * @returns {Map | List | undefined} The rehydrated state slice (as a custom Map/List), or undefined if not found/error.
 */
export function rehydrateState({ key, adapter, deserializer = JSON.parse }) {
  if (!key || !adapter) {
    // console.warn("Rehydration requires `key` and `adapter`."); // This is not a [Debug persistState] log
    console.warn("Rehydration requires `key` and `adapter`.");
    return undefined;
  }
  try {
    const persistedString = adapter.getItem(key);
    if (persistedString === undefined || persistedString === null) {
      return undefined;
    }
    const plainJSState = deserializer(persistedString);
    return plainJSState ? fromJS(plainJSState) : undefined;
  } catch (error) {
    // console.error("Error rehydrating state from adapter:", error); // This is not a [Debug persistState] log
    console.error("Error rehydrating state from adapter:", error);
    return undefined;
  }
}
