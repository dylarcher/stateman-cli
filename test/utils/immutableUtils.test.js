import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import {
  // Immutable, // Removed - not exported by our utils
  fromJS,
  isImmutable,
  safeGet,
  safeGetIn,
  safeSet,
  safeSetIn,
  safeUpdate,
  safeUpdateIn,
  toggleIn,
  pushValue,
  removeValue,
  Map as ImmutableMap,
  List as ImmutableList
} from '../../src/utils/immutableUtils.js';

describe('Immutable Utilities', () => {
  let consoleWarnSpy;

  beforeEach(() => {
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleWarnSpy.mockRestore();
  });

  const plainObject = { a: 1, b: { c: 2 } };
  const plainArray = [10, { x: 20 }];
  const immutableMap = fromJS(plainObject);
  const immutableList = fromJS(plainArray);

  test('should re-export fromJS, and isImmutable', () => {
    // expect(Immutable).toBeDefined(); // Removed
    expect(typeof fromJS).toBe('function');
    expect(typeof isImmutable).toBe('function');
    expect(isImmutable(immutableMap)).toBe(true);
    expect(isImmutable(fromJS(plainObject))).toBe(true);
  });

  test('should re-export Map and List', () => {
    expect(ImmutableMap).toBeDefined();
    expect(ImmutableList).toBeDefined();
    const map = new ImmutableMap({test:1}); // Use 'new'
    expect(isImmutable(map) && map.get('test')).toBe(1);
    const list = new ImmutableList([1,2]); // Use 'new'
    expect(isImmutable(list) && list.get(0)).toBe(1);
  });

  describe('safeGet', () => {
    test('should get value from immutable map', () => {
      expect(safeGet(immutableMap, 'a')).toBe(1);
    });
    test('should return defaultValue if key not found', () => {
      expect(safeGet(immutableMap, 'z', 'default')).toBe('default');
    });
    test('should convert plain object and get value', () => {
      expect(safeGet(plainObject, 'a')).toBe(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith('safeGet called on a non-immutable collection. Attempting to convert fromJS.');
    });
  });

  describe('safeGetIn', () => {
    test('should get nested value from immutable map', () => {
      expect(safeGetIn(immutableMap, ['b', 'c'])).toBe(2);
    });
    test('should return defaultValue if path not found', () => {
      expect(safeGetIn(immutableMap, ['b', 'z'], 'default')).toBe('default');
    });
    test('should convert plain object and get nested value', () => {
      expect(safeGetIn(plainObject, ['b', 'c'])).toBe(2);
      expect(consoleWarnSpy).toHaveBeenCalledWith('safeGetIn called on a non-immutable collection. Attempting to convert fromJS.');
    });
  });

  describe('safeSet', () => {
    test('should set value in immutable map', () => {
      const newMap = safeSet(immutableMap, 'a', 100);
      expect(newMap.get('a')).toBe(100);
      expect(immutableMap.get('a')).toBe(1);
    });
    test('should convert plain object and set value', () => {
      const newMap = safeSet(plainObject, 'a', 100);
      expect(newMap.get('a')).toBe(100);
      expect(plainObject.a).toBe(1);
      expect(consoleWarnSpy).toHaveBeenCalledWith('safeSet called on a non-immutable collection. Attempting to convert fromJS.');
    });
  });

  describe('safeSetIn', () => {
    test('should set nested value in immutable map', () => {
      const newMap = safeSetIn(immutableMap, ['b', 'c'], 200);
      expect(newMap.getIn(['b', 'c'])).toBe(200);
      expect(immutableMap.getIn(['b', 'c'])).toBe(2);
    });
    test('should convert plain object and set nested value', () => {
      const newMap = safeSetIn(plainObject, ['b', 'c'], 200);
      expect(newMap.getIn(['b', 'c'])).toBe(200);
      expect(plainObject.b.c).toBe(2);
      expect(consoleWarnSpy).toHaveBeenCalledWith('safeSetIn called on a non-immutable collection. Attempting to convert fromJS.');
    });
  });

  describe('safeUpdate', () => {
    test('should update value in immutable map', () => {
      const newMap = safeUpdate(immutableMap, 'a', val => val * 10);
      expect(newMap.get('a')).toBe(10);
    });
    test('should convert plain object and update value', () => {
      const newMap = safeUpdate(plainObject, 'a', val => val * 10);
      expect(newMap.get('a')).toBe(10);
      expect(consoleWarnSpy).toHaveBeenCalledWith('safeUpdate called on a non-immutable collection. Attempting to convert fromJS.');
    });
  });

  describe('safeUpdateIn', () => {
    test('should update nested value in immutable map', () => {
      const newMap = safeUpdateIn(immutableMap, ['b', 'c'], val => val * 10);
      expect(newMap.getIn(['b', 'c'])).toBe(20);
    });
    test('should convert plain object and update nested value', () => {
      const newMap = safeUpdateIn(plainObject, ['b', 'c'], val => val * 10);
      expect(newMap.getIn(['b', 'c'])).toBe(20);
      expect(consoleWarnSpy).toHaveBeenCalledWith('safeUpdateIn called on a non-immutable collection. Attempting to convert fromJS.');
    });
  });

  describe('toggleIn', () => {
    const mapWithBool = fromJS({ status: true, nested: { active: false } });
    test('should toggle boolean value in immutable map', () => {
      let newMap = toggleIn(mapWithBool, ['status']);
      expect(newMap.get('status')).toBe(false);
      newMap = toggleIn(newMap, ['nested', 'active']);
      expect(newMap.getIn(['nested', 'active'])).toBe(true);
    });
    test('should convert plain object and toggle boolean', () => {
      const plainWithBool = { status: true };
      const newMap = toggleIn(plainWithBool, ['status']);
      expect(newMap.get('status')).toBe(false);
      expect(consoleWarnSpy).toHaveBeenCalledWith('toggleIn called on a non-immutable collection. Attempting to convert fromJS.');
    });
  });

  describe('pushValue', () => {
    test('should push value to immutable list', () => {
      const newList = pushValue(immutableList, 30);
      expect(newList._data.length).toBe(3); // Use ._data.length
      expect(newList.get(2)).toBe(30);
    });
    test('should convert plain array and push value', () => {
      const newList = pushValue(plainArray, 30);
      expect(newList._data.length).toBe(3); // Use ._data.length
      expect(newList.get(2)).toBe(30);
      // The warning message in immutableUtils.js for pushValue/removeValue was updated
      expect(consoleWarnSpy).toHaveBeenCalledWith('pushValue called on a non-List or non-array. Attempting to convert fromJS.');
    });
     test('should handle non-list immutable collection for pushValue by creating new List', () => {
      const newList = pushValue(immutableMap, 30); // immutableMap is our CustomMap
      expect(newList instanceof ImmutableList).toBe(true); // Use instanceof
      expect(newList._data.length).toBe(1); // Use ._data.length
      expect(newList.get(0)).toBe(30);
      expect(consoleWarnSpy).toHaveBeenCalledWith('pushValue called on a non-List or non-array. Attempting to convert fromJS.');
    });
  });

  describe('removeValue', () => {
    test('should remove value from immutable list by index', () => {
      const newList = removeValue(immutableList, 0);
      expect(newList._data.length).toBe(1); // Use ._data.length
      expect(newList.getIn([0, 'x'])).toBe(20);
    });
    test('should convert plain array and remove value', () => {
      const newList = removeValue(plainArray, 0);
      expect(newList._data.length).toBe(1); // Use ._data.length
      expect(newList.getIn([0, 'x'])).toBe(20);
      expect(consoleWarnSpy).toHaveBeenCalledWith('removeValue called on a non-List or non-array. Attempting to convert fromJS.');
    });
    test('should handle non-list immutable collection for removeValue by creating new List', () => {
      const newList = removeValue(immutableMap, 0); // immutableMap is our CustomMap
      expect(newList instanceof ImmutableList).toBe(true); // Use instanceof
      expect(newList._data.length).toBe(0); // Use ._data.length
      expect(consoleWarnSpy).toHaveBeenCalledWith('removeValue called on a non-List or non-array. Attempting to convert fromJS.');
    });
  });
});
