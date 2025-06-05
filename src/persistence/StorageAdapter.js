/**
 * @file Defines the interface for a StorageAdapter.
 * In JavaScript, this is more of a conceptual interface defined by its expected methods.
 * A StorageAdapter is responsible for getting, setting, and removing items from a storage medium.
 */

/**
 * @interface StorageAdapter
 *
 * @method getItem
 * @param {string} key - The key of the item to retrieve.
 * @returns {Promise<any> | any} The item from storage, or null/undefined if not found. Can be Promise-based.
 *
 * @method setItem
 * @param {string} key - The key of the item to set.
 * @param {any} value - The value to store.
 * @returns {Promise<void> | void} A promise or void.
 *
 * @method removeItem
 * @param {string} key - The key of the item to remove.
 * @returns {Promise<void> | void} A promise or void.
 */

// No actual code here, as it's a conceptual interface for documentation.
// Implementations will adhere to this structure.
export default {}; // Exports an empty object, as there's no concrete implementation here.
