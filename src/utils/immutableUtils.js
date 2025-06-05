import Immutable, { isImmutable as checkIsImmutable, fromJS } from 'immutable'

/**
 * Re-exports the entire Immutable.js library.
 * This allows users to access Immutable.Map, Immutable.List, etc.
 * e.g., import { Immutable } from 'my-library'; const map = Immutable.Map();
 * or more directly if specific structures are exported from index.js:
 * import { Map, List } from 'my-library/immutable';
 */
export { Immutable }

/**
 * Re-exports Immutable.fromJS() for converting plain JavaScript objects and arrays
 * into their deeply immutable counterparts.
 *
 * @template T
 * @param {any} jsValue - The plain JavaScript value to convert.
 * @returns {T} The new immutable structure (e.g., Immutable.Map, Immutable.List).
 */
export { fromJS }

/**
 * Re-exports Immutable.isImmutable() for checking if a value is an Immutable.js collection.
 * Renamed to `isImmutableCheck` internally to avoid conflict if this file itself exports `isImmutable`.
 * For the public API, it will be available as `isImmutable`.
 *
 * @param {any} maybeImmutable - The value to check.
 * @returns {boolean} True if the value is an Immutable.js collection, false otherwise.
 */
export const isImmutable = checkIsImmutable

// It can also be useful to export specific Immutable types if the library intends
// to guide users towards them, for example:
// export const Map = Immutable.Map;
// export const List = Immutable.List;
// export const Record = Immutable.Record;
// For now, just exporting the main Immutable namespace, fromJS, and isImmutable.
