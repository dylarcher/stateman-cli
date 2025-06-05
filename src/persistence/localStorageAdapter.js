/**
 * @file Implements a StorageAdapter for browser localStorage.
 */

const localStorageAdapter = {
  /**
   * Retrieves an item from localStorage.
   * @param {string} key - The key of the item.
   * @returns {any | null} The retrieved item (parsed if JSON), or null if not found or error.
   */
  getItem: (key) => {
    if (typeof window === 'undefined' || !window.localStorage) {
      console.warn('localStorage is not available. Cannot getItem.')
      return null
    }
    try {
      const serializedState = window.localStorage.getItem(key)
      if (serializedState === null) {
        return undefined // Or null, depending on desired API for "not found"
      }
      return JSON.parse(serializedState)
    } catch (error) {
      console.error('Error getting item from localStorage:', error)
      return null // Or undefined
    }
  },

  /**
   * Sets an item in localStorage.
   * @param {string} key - The key of the item.
   * @param {any} value - The value to store (will be JSON.stringified).
   * @returns {void}
   */
  setItem: (key, value) => {
    if (typeof window === 'undefined' || !window.localStorage) {
      console.warn('localStorage is not available. Cannot setItem.')
      return
    }
    try {
      const serializedState = JSON.stringify(value)
      window.localStorage.setItem(key, serializedState)
    } catch (error) {
      console.error('Error setting item in localStorage:', error)
    }
  },

  /**
   * Removes an item from localStorage.
   * @param {string} key - The key of the item.
   * @returns {void}
   */
  removeItem: (key) => {
    if (typeof window === 'undefined' || !window.localStorage) {
      console.warn('localStorage is not available. Cannot removeItem.')
      return
    }
    try {
      window.localStorage.removeItem(key)
    } catch (error) {
      console.error('Error removing item from localStorage:', error)
    }
  }
}

export default localStorageAdapter
