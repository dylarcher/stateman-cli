import {
  isImmutable,
  fromJS,
  Map,
  List,
} from '../../src/utils/customImmutableUtils.js';

// Helper for checking if direct mutation throws (it should due to Object.freeze)
// In a real test env, this would be more robust.
function expectToThrow(fn) {
  try {
    fn();
    console.error('Expected function to throw, but it did not.');
    return false; // Or throw new Error("Expected to throw") in a real test
  } catch (e) {
    return true;
  }
}

console.log('Starting customImmutableUtils.js tests...');

// --- isImmutable ---
console.log('Testing isImmutable...');
const objToTestImmutable = { a: 1 };
const arrToTestImmutable = [1, 2];
const mapFromJS = fromJS(objToTestImmutable);
const listFromJS = fromJS(arrToTestImmutable);

if (!isImmutable(mapFromJS)) console.error('isImmutable failed for Map');
if (!isImmutable(listFromJS)) console.error('isImmutable failed for List');
if (isImmutable(objToTestImmutable)) console.error('isImmutable failed for plain object');
if (isImmutable(arrToTestImmutable)) console.error('isImmutable failed for plain array');
if (isImmutable(null)) console.error('isImmutable failed for null');
if (isImmutable(undefined)) console.error('isImmutable failed for undefined');
if (isImmutable(123)) console.error('isImmutable failed for number');
if (isImmutable("string")) console.error('isImmutable failed for string');
console.log('isImmutable tests done.');

// --- fromJS ---
console.log('Testing fromJS...');
const simpleObj = { a: 1, b: 2 };
const simpleArr = [1, 2, 3];
const nestedObj = { a: 1, b: { c: 3, d: { e: 4 } }, f: [5, { g: 6 }] };
const nestedArr = [1, [2, 3], { a: 4, b: [5] }];

const mapFromSimpleObj = fromJS(simpleObj);
const listFromSimpleArr = fromJS(simpleArr);
const mapFromNestedObj = fromJS(nestedObj);
const listFromNestedArr = fromJS(nestedArr);

if (!(mapFromSimpleObj instanceof Map)) console.error('fromJS did not convert simple object to Map');
if (!(listFromSimpleArr instanceof List)) console.error('fromJS did not convert simple array to List');
if (!(mapFromNestedObj instanceof Map)) console.error('fromJS did not convert nested object to Map');
if (!(mapFromNestedObj.get('b') instanceof Map)) console.error('fromJS did not convert nested object property to Map');
if (!(mapFromNestedObj.get('f') instanceof List)) console.error('fromJS did not convert nested array property to List');
if (!(listFromNestedArr instanceof List)) console.error('fromJS did not convert nested array to List');
if (!(listFromNestedArr.get(1) instanceof List)) console.error('fromJS did not convert nested array element to List');
if (!(listFromNestedArr.get(2) instanceof Map)) console.error('fromJS did not convert nested object element to Map');

if (fromJS(null) !== null) console.error('fromJS failed for null');
if (fromJS(undefined) !== undefined) console.error('fromJS failed for undefined');
if (fromJS(123) !== 123) console.error('fromJS failed for number');
if (fromJS("test") !== "test") console.error('fromJS failed for string');

// Test immutability of fromJS results
const fromJSMap = fromJS({ a: 1 });
const fromJSList = fromJS([1]);
if (!expectToThrow(() => { fromJSMap._data.a = 2; })) console.error('fromJS Map direct mutation did not throw');
if (fromJSMap.get('a') !== 1) console.error('fromJS Map was mutated');
if (!expectToThrow(() => { fromJSList._data[0] = 2; })) console.error('fromJS List direct mutation did not throw');
if (fromJSList.get(0) !== 1) console.error('fromJS List was mutated');
console.log('fromJS tests done.');


// --- Map Class ---
console.log('Testing Map class...');
const initialMapData = { a: 1, b: { c: 2 }, d: [3, 4] };
const map1 = fromJS(initialMapData);

// Map.get
if (map1.get('a') !== 1) console.error('Map.get failed for existing key');
if (!(map1.get('b') instanceof Map)) console.error('Map.get failed for nested Map');
if (map1.get('x') !== undefined) console.error('Map.get failed for non-existing key');
if (map1.get('x', 'default') !== 'default') console.error('Map.get failed for non-existing key with default');

// Map.set
const map2 = map1.set('e', 5);
if (map2 === map1) console.error('Map.set did not return a new Map');
if (map1.get('e') !== undefined) console.error('Map.set mutated original Map');
if (map2.get('e') !== 5) console.error('Map.set failed to set new key');
const map3 = map2.set('a', 10);
if (map3.get('a') !== 10) console.error('Map.set failed to overwrite existing key');
const mapWithObj = map1.set('obj', { f: 6 });
if (!(mapWithObj.get('obj') instanceof Map) || mapWithObj.get('obj').get('f') !== 6) console.error('Map.set did not convert plain object to Map');

// Map.getIn
if (map1.getIn(['b', 'c']) !== 2) console.error('Map.getIn failed for existing path');
if (map1.getIn(['d', 0]) !== 3) console.error('Map.getIn failed for path with List');
if (map1.getIn(['x', 'y']) !== undefined) console.error('Map.getIn failed for non-existing path');
if (map1.getIn(['x', 'y'], 'default') !== 'default') console.error('Map.getIn failed for non-existing path with default');

// Map.setIn
const map4 = map1.setIn(['b', 'c'], 20);
if (map4 === map1) console.error('Map.setIn did not return a new Map');
if (map1.getIn(['b', 'c']) === 20) console.error('Map.setIn mutated original Map');
if (map4.getIn(['b', 'c']) !== 20) console.error('Map.setIn failed to set existing path');
const map5 = map1.setIn(['x', 'y', 'z'], 30); // Create intermediate Maps
if (!(map5.get('x') instanceof Map) || !(map5.getIn(['x', 'y']) instanceof Map) || map5.getIn(['x', 'y', 'z']) !== 30) console.error('Map.setIn failed to create intermediate Maps');
const map6 = map1.setIn(['d', 0], 30);
if (map6.getIn(['d', 0]) !== 30) console.error('Map.setIn failed for path with List');
const mapWithListInPath = map1.setIn(['newBranch', 0, 'a'], 'val');
if (!(mapWithListInPath.get('newBranch') instanceof List)) console.error('Map.setIn did not create List for numeric path segment');
if (!(mapWithListInPath.getIn(['newBranch', 0]) instanceof Map)) console.error('Map.setIn did not create Map in List for object path segment');
if (mapWithListInPath.getIn(['newBranch', 0, 'a']) !== 'val') console.error('Map.setIn failed for creating nested list/map path');


// Map.update
const map7 = map1.update('a', val => val * 10);
if (map7.get('a') !== 10) console.error('Map.update failed');
if (map1.get('a') === 10) console.error('Map.update mutated original map');

// Map.updateIn
const map8 = map1.updateIn(['b', 'c'], val => val * 10);
if (map8.getIn(['b', 'c']) !== 20) console.error('Map.updateIn failed');
if (map1.getIn(['b', 'c']) === 20) console.error('Map.updateIn mutated original map');

// Map.toJS
const jsMap = map1.toJS();
if (typeof jsMap !== 'object' || jsMap === null || Array.isArray(jsMap)) console.error('Map.toJS did not return a plain object');
if (jsMap.a !== 1) console.error('Map.toJS failed for simple property');
if (typeof jsMap.b !== 'object' || jsMap.b.c !== 2) console.error('Map.toJS failed for nested object');
if (!Array.isArray(jsMap.d) || jsMap.d[0] !== 3) console.error('Map.toJS failed for nested array');
// A more robust check would be deep equality: JSON.stringify(jsMap) === JSON.stringify(initialMapData)
// For now, manual checks are fine.
const nestedToJS = fromJS({x: {y: [1,{z:2}]}}).toJS();
if (nestedToJS.x.y[1].z !== 2) console.error('Map.toJS failed for deeply nested structures');

console.log('Map class tests done.');

// --- List Class ---
console.log('Testing List class...');
const initialListData = [1, { a: 2 }, [3, 4], 5];
const list1 = fromJS(initialListData);

// List.get
if (list1.get(0) !== 1) console.error('List.get failed for existing index');
if (!(list1.get(1) instanceof Map)) console.error('List.get failed for nested Map');
if (list1.get(10) !== undefined) console.error('List.get failed for non-existing index');
if (list1.get(10, 'default') !== 'default') console.error('List.get failed for non-existing index with default');

// List.set
const list2 = list1.set(0, 10);
if (list2 === list1) console.error('List.set did not return a new List');
if (list1.get(0) === 10) console.error('List.set mutated original List');
if (list2.get(0) !== 10) console.error('List.set failed to set value');
const listUnchanged = list1.set(10, 100); // Out of bounds
if (listUnchanged !== list1) console.error('List.set out of bounds should return original list');
const listWithObj = list1.set(0, { b: 20 });
if (!(listWithObj.get(0) instanceof Map) || listWithObj.get(0).get('b') !== 20) console.error('List.set did not convert plain object to Map');


// List.push
const list3 = list1.push(6);
if (list3 === list1) console.error('List.push did not return a new List');
if (list1._data.length === list3._data.length) console.error('List.push mutated original List or did not add element');
if (list3.get(list3._data.length - 1) !== 6) console.error('List.push failed to add element');
const list4 = list1.push({ x: 7 });
if (!(list4.get(list4._data.length - 1) instanceof Map)) console.error('List.push did not convert object to Map');

// List.delete
const list5 = list1.delete(0);
if (list5 === list1) console.error('List.delete did not return a new List');
if (list1.get(0) === undefined && list1._data.length === initialListData.length -1) console.error('List.delete mutated original List');
if (list5.get(0) !== initialListData[1]) console.error('List.delete failed to delete element correctly'); // new first element is old second
if (list5._data.length !== initialListData.length - 1) console.error('List.delete did not change length correctly');
const listOriginal = list1.delete(10); // out of bounds
if (listOriginal !== list1) console.error('List.delete with out of bounds index should return original list');


// List.update
const list6 = list1.update(0, val => val * 10);
if (list6.get(0) !== 10) console.error('List.update failed');
if (list1.get(0) === 10) console.error('List.update mutated original list');

// List.getIn
if (list1.getIn([1, 'a']) !== 2) console.error('List.getIn failed for path into Map');
if (list1.getIn([2, 0]) !== 3) console.error('List.getIn failed for path into List');
if (list1.getIn([10, 'x']) !== undefined) console.error('List.getIn failed for non-existing path');
if (list1.getIn([10, 'x'], 'default') !== 'default') console.error('List.getIn failed for non-existing path with default');

// List.setIn
const list7 = list1.setIn([1, 'a'], 20);
if (list7 === list1) console.error('List.setIn did not return a new List');
if (list1.getIn([1, 'a']) === 20) console.error('List.setIn mutated original List');
if (list7.getIn([1, 'a']) !== 20) console.error('List.setIn failed for path into Map');
const list8 = list1.setIn([2, 0], 30);
if (list8.getIn([2, 0]) !== 30) console.error('List.setIn failed for path into List');
const list9 = list1.setIn([5, 'newKey'], 'newValue'); // Create Map at new index
if (!(list9.get(5) instanceof Map) || list9.getIn([5, 'newKey']) !== 'newValue') console.error('List.setIn failed to create Map at new index');
const list10 = list1.setIn([1, 'newBranch', 0], 'nestedInMap'); // Create List in Map in List
if (!(list10.getIn([1, 'newBranch']) instanceof List)) console.error('List.setIn failed to create List in Map in List');
if (list10.getIn([1, 'newBranch', 0]) !== 'nestedInMap') console.error('List.setIn failed for deep mixed path creation');

// List.updateIn
const list11 = list1.updateIn([1, 'a'], val => val * 10);
if (list11.getIn([1, 'a']) !== 20) console.error('List.updateIn failed for path into Map');
if (list1.getIn([1, 'a']) === 20) console.error('List.updateIn mutated original list');
const list12 = list1.updateIn([2, 0], val => val * 10);
if (list12.getIn([2, 0]) !== 30) console.error('List.updateIn failed for path into List');


// List.toJS
const jsList = list1.toJS();
if (!Array.isArray(jsList)) console.error('List.toJS did not return an array');
if (jsList[0] !== 1) console.error('List.toJS failed for simple element');
if (typeof jsList[1] !== 'object' || jsList[1].a !== 2) console.error('List.toJS failed for nested object element');
if (!Array.isArray(jsList[2]) || jsList[2][0] !== 3) console.error('List.toJS failed for nested array element');
// Compare with initialListData (after its elements are potentially converted by fromJS's logic for toJS)
// JSON.stringify(jsList) === JSON.stringify(initialListData.map(v => (typeof v === 'object' && v !== null) ? fromJS(v).toJS() : v))
const complexList = fromJS([1, {b:[2, {c:3}]}]);
const complexListJS = complexList.toJS();
if (complexListJS[1].b[1].c !== 3) console.error('List.toJS failed for deeply nested structures');


console.log('List class tests done.');
console.log('All customImmutableUtils.js tests finished.');
// In a real test suite, you'd have proper assertions and a summary.
// For now, errors are logged to console.

// Example of testing immutability for set operations more directly
const testMapForImmutability = new Map({a: 1});
const modifiedTestMap = testMapForImmutability.set('b', 2);
if (testMapForImmutability.get('b') !== undefined) {
    console.error('Original map was mutated after set operation!');
}
if (modifiedTestMap.get('b') !== 2) {
    console.error('New map does not have the new value after set operation!');
}

const testListForImmutability = new List([1,2]);
const modifiedTestList = testListForImmutability.push(3);
if (testListForImmutability._data.length !== 2) {
     console.error('Original list was mutated after push operation!');
}
if (modifiedTestList._data.length !== 3 || modifiedTestList.get(2) !== 3) {
     console.error('New list does not have the new value after push operation!');
}

// Test setIn not creating List for non-numeric key in path
const mapTestPath = new Map();
const mapWithPathToStringKey = mapTestPath.setIn(['level1', 'level2'], 'value');
if (!(mapWithPathToStringKey.get('level1') instanceof Map)) {
    console.error('setIn created a List for a string key in path instead of a Map');
}

// Test setIn creating List for numeric key in path
const mapTestPathNumeric = new Map();
const mapWithPathToNumericKey = mapTestPathNumeric.setIn(['level1', 0], 'value');
if (!(mapWithPathToNumericKey.get('level1') instanceof List)) {
    console.error('setIn did not create a List for a numeric key in path');
}
if (!(mapWithPathToNumericKey.getIn(['level1',0]) === 'value')) {
    console.error('setIn did not set value correctly for numeric key path');
}

// Test List.setIn creating Map for string key in path
const listTestPathString = new List([]);
const listWithPathToStringKey = listTestPathString.setIn([0, 'key'], 'value');
if (!(listWithPathToStringKey.get(0) instanceof Map)) {
    console.error('List.setIn did not create a Map for a string key in path');
}
if (listWithPathToStringKey.getIn([0, 'key']) !== 'value') {
    console.error('List.setIn did not set value correctly for string key path');
}

// Test List.setIn creating List for numeric key in path
const listTestPathNumeric = new List([]);
const listWithPathToNumericKey = listTestPathNumeric.setIn([0, 0], 'value');
if (!(listWithPathToNumericKey.get(0) instanceof List)) {
    console.error('List.setIn did not create a List for a numeric key in path');
}
if (listWithPathToNumericKey.getIn([0,0]) !== 'value') {
    console.error('List.setIn did not set value correctly for numeric key path');
}

console.log("Additional path creation tests for setIn completed.");
console.log("All tests completed. Check console for errors.");
