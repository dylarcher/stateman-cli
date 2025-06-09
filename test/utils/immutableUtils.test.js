import { describe, it as test, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import {
  Immutable,
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
    consoleWarnSpy = mock.method(console, 'warn', () => {});
  });

  afterEach(() => {
    consoleWarnSpy.mock.restore();
  });

  const plainObject = { a: 1, b: { c: 2 } };
  const plainArray = [10, { x: 20 }];
  const immutableMap = fromJS(plainObject);
  const immutableList = fromJS(plainArray);

  test('should re-export Immutable namespace, fromJS, and isImmutable', () => {
    assert(typeof Immutable !== 'undefined');
    assert.strictEqual(typeof fromJS, 'function');
    assert.strictEqual(typeof isImmutable, 'function');
    assert(isImmutable(immutableMap));
    assert(isImmutable(fromJS(plainObject)));
  });

  test('should re-export Map and List', () => {
    assert(typeof ImmutableMap !== 'undefined');
    assert(typeof ImmutableList !== 'undefined');
    const map = ImmutableMap({test:1});
    assert(isImmutable(map) && map.get('test') === 1);
    const list = ImmutableList([1,2]);
    assert(isImmutable(list) && list.get(0) === 1);
  });

  describe('safeGet', () => {
    test('should get value from immutable map', () => {
      assert.strictEqual(safeGet(immutableMap, 'a'), 1);
    });
    test('should return defaultValue if key not found', () => {
      assert.strictEqual(safeGet(immutableMap, 'z', 'default'), 'default');
    });
    test('should convert plain object and get value', () => {
      assert.strictEqual(safeGet(plainObject, 'a'), 1);
      assert(consoleWarnSpy.mock.calls.some(call => call.arguments[0] === 'safeGet called on a non-immutable collection. Attempting to convert fromJS.'));
    });
  });

  describe('safeGetIn', () => {
    test('should get nested value from immutable map', () => {
      assert.strictEqual(safeGetIn(immutableMap, ['b', 'c']), 2);
    });
    test('should return defaultValue if path not found', () => {
      assert.strictEqual(safeGetIn(immutableMap, ['b', 'z'], 'default'), 'default');
    });
    test('should convert plain object and get nested value', () => {
      assert.strictEqual(safeGetIn(plainObject, ['b', 'c']), 2);
      assert(consoleWarnSpy.mock.calls.some(call => call.arguments[0] === 'safeGetIn called on a non-immutable collection. Attempting to convert fromJS.'));
    });
  });

  describe('safeSet', () => {
    test('should set value in immutable map', () => {
      const newMap = safeSet(immutableMap, 'a', 100);
      assert.strictEqual(newMap.get('a'), 100);
      assert.strictEqual(immutableMap.get('a'), 1);
    });
    test('should convert plain object and set value', () => {
      const newMap = safeSet(plainObject, 'a', 100);
      assert.strictEqual(newMap.get('a'), 100);
      assert.strictEqual(plainObject.a, 1);
      assert(consoleWarnSpy.mock.calls.some(call => call.arguments[0] === 'safeSet called on a non-immutable collection. Attempting to convert fromJS.'));
    });
  });

  describe('safeSetIn', () => {
    test('should set nested value in immutable map', () => {
      const newMap = safeSetIn(immutableMap, ['b', 'c'], 200);
      assert.strictEqual(newMap.getIn(['b', 'c']), 200);
      assert.strictEqual(immutableMap.getIn(['b', 'c']), 2);
    });
    test('should convert plain object and set nested value', () => {
      const newMap = safeSetIn(plainObject, ['b', 'c'], 200);
      assert.strictEqual(newMap.getIn(['b', 'c']), 200);
      assert.strictEqual(plainObject.b.c, 2);
      assert(consoleWarnSpy.mock.calls.some(call => call.arguments[0] === 'safeSetIn called on a non-immutable collection. Attempting to convert fromJS.'));
    });
  });

  describe('safeUpdate', () => {
    test('should update value in immutable map', () => {
      const newMap = safeUpdate(immutableMap, 'a', val => val * 10);
      assert.strictEqual(newMap.get('a'), 10);
    });
    test('should convert plain object and update value', () => {
      const newMap = safeUpdate(plainObject, 'a', val => val * 10);
      assert.strictEqual(newMap.get('a'), 10);
      assert(consoleWarnSpy.mock.calls.some(call => call.arguments[0] === 'safeUpdate called on a non-immutable collection. Attempting to convert fromJS.'));
    });
  });

  describe('safeUpdateIn', () => {
    test('should update nested value in immutable map', () => {
      const newMap = safeUpdateIn(immutableMap, ['b', 'c'], val => val * 10);
      assert.strictEqual(newMap.getIn(['b', 'c']), 20);
    });
    test('should convert plain object and update nested value', () => {
      const newMap = safeUpdateIn(plainObject, ['b', 'c'], val => val * 10);
      assert.strictEqual(newMap.getIn(['b', 'c']), 20);
      assert(consoleWarnSpy.mock.calls.some(call => call.arguments[0] === 'safeUpdateIn called on a non-immutable collection. Attempting to convert fromJS.'));
    });
  });

  describe('toggleIn', () => {
    const mapWithBool = fromJS({ status: true, nested: { active: false } });
    test('should toggle boolean value in immutable map', () => {
      let newMap = toggleIn(mapWithBool, ['status']);
      assert.strictEqual(newMap.get('status'), false);
      newMap = toggleIn(newMap, ['nested', 'active']);
      assert.strictEqual(newMap.getIn(['nested', 'active']), true);
    });
    test('should convert plain object and toggle boolean', () => {
      const plainWithBool = { status: true };
      const newMap = toggleIn(plainWithBool, ['status']);
      assert.strictEqual(newMap.get('status'), false);
      assert(consoleWarnSpy.mock.calls.some(call => call.arguments[0] === 'toggleIn called on a non-immutable collection. Attempting to convert fromJS.'));
    });
  });

  describe('pushValue', () => {
    test('should push value to immutable list', () => {
      const newList = pushValue(immutableList, 30);
      assert.strictEqual(newList.size, 3);
      assert.strictEqual(newList.get(2), 30);
    });
    test('should convert plain array and push value', () => {
      const newList = pushValue(plainArray, 30);
      assert.strictEqual(newList.size, 3);
      assert.strictEqual(newList.get(2), 30);
      assert(consoleWarnSpy.mock.calls.some(call => call.arguments[0] === 'pushValue called on a non-List. Attempting to convert fromJS, then to List.'));
    });
     test('should handle non-list immutable collection for pushValue by creating new List', () => {
      const newList = pushValue(immutableMap, 30);
      assert(ImmutableList.isList(newList));
      assert.strictEqual(newList.size, 1);
      assert.strictEqual(newList.get(0), 30);
      assert(consoleWarnSpy.mock.calls.some(call => call.arguments[0] === 'pushValue called on a non-List. Attempting to convert fromJS, then to List.'));
    });
  });

  describe('removeValue', () => {
    test('should remove value from immutable list by index', () => {
      const newList = removeValue(immutableList, 0);
      assert.strictEqual(newList.size, 1);
      assert.strictEqual(newList.getIn([0, 'x']), 20);
    });
    test('should convert plain array and remove value', () => {
      const newList = removeValue(plainArray, 0);
      assert.strictEqual(newList.size, 1);
      assert.strictEqual(newList.getIn([0, 'x']), 20);
      assert(consoleWarnSpy.mock.calls.some(call => call.arguments[0] === 'removeValue called on a non-List. Attempting to convert fromJS, then to List.'));
    });
    test('should handle non-list immutable collection for removeValue by creating new List', () => {
      const newList = removeValue(immutableMap, 0);
      assert(ImmutableList.isList(newList));
      assert.strictEqual(newList.size, 0);
      assert(consoleWarnSpy.mock.calls.some(call => call.arguments[0] === 'removeValue called on a non-List. Attempting to convert fromJS, then to List.'));
    });
  });
});
