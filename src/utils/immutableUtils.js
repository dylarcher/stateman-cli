import Immutable, { isImmutable as checkIsImmutable, fromJS, List, Map } from 'immutable'

/**
 * Re-exports the entire Immutable.js library.
 */
export { Immutable }

/**
 * Re-exports Immutable.fromJS() for converting plain JavaScript objects and arrays
 * into their deeply immutable counterparts.
 * @template T
 * @param {any} jsValue - The plain JavaScript value to convert.
 * @returns {T} The new immutable structure (e.g., Immutable.Map, Immutable.List).
 */
export { fromJS }

/**
 * Re-exports Immutable.isImmutable() for checking if a value is an Immutable.js collection.
 * @param {any} maybeImmutable - The value to check.
 * @returns {boolean} True if the value is an Immutable.js collection, false otherwise.
 */
export const isImmutable = checkIsImmutable

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
    console.warn('safeGet called on a non-immutable collection. Attempting to convert fromJS.')
    collection = fromJS(collection)
  }
  return collection.get(key, defaultValue)
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
    console.warn('safeGetIn called on a non-immutable collection. Attempting to convert fromJS.')
    collection = fromJS(collection)
  }
  return collection.getIn(path, defaultValue)
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
    console.warn('safeSet called on a non-immutable collection. Attempting to convert fromJS.')
    collection = fromJS(collection)
  }
  return collection.set(key, value)
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
    console.warn('safeSetIn called on a non-immutable collection. Attempting to convert fromJS.')
    collection = fromJS(collection)
  }
  return collection.setIn(path, value)
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
    console.warn('safeUpdate called on a non-immutable collection. Attempting to convert fromJS.')
    collection = fromJS(collection)
  }
  return collection.update(key, updaterFn)
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
    console.warn('safeUpdateIn called on a non-immutable collection. Attempting to convert fromJS.')
    collection = fromJS(collection)
  }
  return collection.updateIn(path, updaterFn)
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
    console.warn('toggleIn called on a non-immutable collection. Attempting to convert fromJS.')
    collection = fromJS(collection)
  }
  return collection.updateIn(path, val => !val)
}

/**
 * Pushes a value to an Immutable.List.
 * If the collection is not an Immutable.List, it attempts to convert it.
 * @param {Immutable.List | any} list - The Immutable.List or a convertible value.
 * @param {any} value - The value to push.
 * @returns {Immutable.List} The new Immutable.List with the value pushed.
 */
export function pushValue(list, value) {
  let targetList
  if (!List.isList(list)) {
    console.warn('pushValue called on a non-List. Attempting to convert fromJS, then to List.')
    const immutableCollection = fromJS(list)
    targetList = List.isList(immutableCollection) ? immutableCollection : List()
  } else {
    targetList = list
  }
  return targetList.push(value)
}

/**
 * Removes a value by index from an Immutable.List.
 * If the collection is not an Immutable.List, it attempts to convert it.
 * @param {Immutable.List | any} list - The Immutable.List or a convertible value.
 * @param {number} index - The index to remove.
 * @returns {Immutable.List} The new Immutable.List with the value removed.
 */
export function removeValue(list, index) {
  let targetList
  if (!List.isList(list)) {
    console.warn('removeValue called on a non-List. Attempting to convert fromJS, then to List.')
    const immutableCollection = fromJS(list)
    targetList = List.isList(immutableCollection) ? immutableCollection : List()
  } else {
    targetList = list
  }
  return targetList.delete(index)
}

export { List, Map }
