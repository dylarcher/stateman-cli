import {
  Map,
  List,
  fromJS,
  isImmutable,
} from "./customImmutableUtils.js";

/**
 * Re-exports custom fromJS() for converting plain JavaScript objects and arrays
 * into their deeply immutable counterparts.
 * @template T
 * @param {any} jsValue - The plain JavaScript value to convert.
 * @returns {T} The new immutable structure (e.g., Map, List).
 */
export { fromJS };

/**
 * Re-exports custom isImmutable() for checking if a value is a custom immutable collection.
 * @param {any} maybeImmutable - The value to check.
 * @returns {boolean} True if the value is a custom immutable collection, false otherwise.
 */
export { isImmutable };

/**
 * Safely gets a value from an Immutable collection.
 * @template C, K, V
 * @param {C} collection - The Immutable collection (e.g., Map, List).
 * @param {K} key - The key or index to retrieve.
 * @param {V} [defaultValue] - The value to return if the key is not found.
 * @returns {V | undefined} The value at the key, or defaultValue if not found.
 */
export function safeGet(collection, key, defaultValue) {
  if (!isImmutable(collection)) {
    console.warn(
      "safeGet called on a non-immutable collection. Attempting to convert fromJS.",
    );
    collection = fromJS(collection);
  }
  return collection.get(key, defaultValue);
}

/**
 * Safely gets a deeply nested value from an Immutable collection.
 * @template C, V
 * @param {C} collection - The Immutable collection.
 * @param {Array<any>} path - The path (array of keys/indices) to the value.
 * @param {V} [defaultValue] - The value to return if the path is not found.
 * @returns {V | undefined} The value at the path, or defaultValue if not found.
 */
export function safeGetIn(collection, path, defaultValue) {
  if (!isImmutable(collection)) {
    console.warn(
      "safeGetIn called on a non-immutable collection. Attempting to convert fromJS.",
    );
    collection = fromJS(collection);
  }
  return collection.getIn(path, defaultValue);
}

/**
 * Safely sets a value in an Immutable collection.
 * If the collection is not immutable, it attempts to convert it.
 * @template C
 * @param {C} collection - The Immutable collection.
 * @param {any} key - The key or index to set.
 * @param {any} value - The value to set.
 * @returns {C} The new Immutable collection with the value set.
 */
export function safeSet(collection, key, value) {
  if (!isImmutable(collection)) {
    console.warn(
      "safeSet called on a non-immutable collection. Attempting to convert fromJS.",
    );
    collection = fromJS(collection);
  }
  return collection.set(key, value);
}

/**
 * Safely sets a deeply nested value in an Immutable collection.
 * If the collection is not immutable, it attempts to convert it.
 * @template C
 * @param {C} collection - The Immutable collection.
 * @param {Array<any>} path - The path (array of keys/indices) to the value.
 * @param {any} value - The value to set.
 * @returns {C} The new Immutable collection with the value set.
 */
export function safeSetIn(collection, path, value) {
  if (!isImmutable(collection)) {
    console.warn(
      "safeSetIn called on a non-immutable collection. Attempting to convert fromJS.",
    );
    collection = fromJS(collection);
  }
  return collection.setIn(path, value);
}

/**
 * Safely updates a value in an Immutable collection using an updater function.
 * If the collection is not immutable, it attempts to convert it.
 * @template C
 * @param {C} collection - The Immutable collection.
 * @param {any} key - The key or index to update.
 * @param {function(value: any): any} updaterFn - The function to apply to the value.
 * @returns {C} The new Immutable collection with the value updated.
 */
export function safeUpdate(collection, key, updaterFn) {
  if (!isImmutable(collection)) {
    console.warn(
      "safeUpdate called on a non-immutable collection. Attempting to convert fromJS.",
    );
    collection = fromJS(collection);
  }
  return collection.update(key, updaterFn);
}

/**
 * Safely updates a deeply nested value in an Immutable collection using an updater function.
 * If the collection is not immutable, it attempts to convert it.
 * @template C
 * @param {C} collection - The Immutable collection.
 * @param {Array<any>} path - The path (array of keys/indices) to the value.
 * @param {function(value: any): any} updaterFn - The function to apply to the value.
 * @returns {C} The new Immutable collection with the value updated.
 */
export function safeUpdateIn(collection, path, updaterFn) {
  if (!isImmutable(collection)) {
    console.warn(
      "safeUpdateIn called on a non-immutable collection. Attempting to convert fromJS.",
    );
    collection = fromJS(collection);
  }
  return collection.updateIn(path, updaterFn);
}

/**
 * Toggles a boolean value at a deeply nested path in an Immutable collection.
 * If the collection is not immutable, it attempts to convert it.
 * @template C
 * @param {C} collection - The Immutable collection.
 * @param {Array<any>} path - The path to the boolean value.
 * @returns {C} The new Immutable collection with the boolean value toggled.
 */
export function toggleIn(collection, path) {
  if (!isImmutable(collection)) {
    console.warn(
      "toggleIn called on a non-immutable collection. Attempting to convert fromJS.",
    );
    collection = fromJS(collection);
  }
  return collection.updateIn(path, (val) => !val);
}

/**
 * Pushes a value to a custom List.
 * If the collection is not a List, it attempts to convert it.
 * If conversion fails or results in a non-List, an empty List is used.
 * @param {List | any} listInput - The List or a convertible value (e.g., an array).
 * @param {any} value - The value to push.
 * @returns {List} The new List with the value pushed.
 */
export function pushValue(listInput, value) {
  let targetList;
  if (listInput instanceof List) {
    targetList = listInput;
  } else {
    console.warn(
      "pushValue called on a non-List or non-array. Attempting to convert fromJS.",
    );
    const converted = fromJS(listInput);
    if (converted instanceof List) {
      targetList = converted;
    } else {
      console.warn("pushValue: input did not convert to a List. Starting with an empty List.");
      targetList = new List();
    }
  }
  return targetList.push(value);
}

/**
 * Removes a value by index from a custom List.
 * If the collection is not a List, it attempts to convert it.
 * If conversion fails or results in a non-List, an empty List is used for the operation (which will be a no-op).
 * @param {List | any} listInput - The List or a convertible value (e.g., an array).
 * @param {number} index - The index to remove.
 * @returns {List} The new List with the value removed, or the original/empty if conversion failed.
 */
export function removeValue(listInput, index) {
  let targetList;
  if (listInput instanceof List) {
    targetList = listInput;
  } else {
    console.warn(
      "removeValue called on a non-List or non-array. Attempting to convert fromJS.",
    );
    const converted = fromJS(listInput);
    if (converted instanceof List) {
      targetList = converted;
    } else {
      console.warn("removeValue: input did not convert to a List. Starting with an empty List.");
      targetList = new List();
    }
  }
  return targetList.delete(index);
}

// Re-export the custom Map and List implementations
export { List, Map };
