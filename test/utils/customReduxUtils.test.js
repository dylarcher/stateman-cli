import { createStore } from '../../src/utils/customReduxUtils.js';
import { Map, fromJS, isImmutable } from '../../src/utils/customImmutableUtils.js';

// Simple console logging for test results
let testCount = 0;
let assertionsPassed = 0;

function assert(condition, message) {
  testCount++;
  if (condition) {
    assertionsPassed++;
    // console.log(`PASS: ${message}`);
  } else {
    console.error(`FAIL: ${message}`);
  }
}

function resetTestCounts() {
  testCount = 0;
  assertionsPassed = 0;
}

function logTestSummary(testName) {
  console.log(`--- ${testName} Summary: ${assertionsPassed}/${testCount} assertions passed ---`);
}

console.log('Starting customReduxUtils.js tests...');

// --- Test Suite 1: Basic Store Creation & Reducer ---
resetTestCounts();
console.log('\n--- Testing Basic Store Creation & Reducer ---');

const counterReducer = (state = 0, action) => {
  switch (action.type) {
    case 'INCREMENT':
      return state + 1;
    case 'DECREMENT':
      return state - 1;
    default:
      return state;
  }
};

const store1 = createStore(counterReducer, 0);
assert(store1.getState() === 0, 'Initial state should be 0.');

store1.dispatch({ type: 'INCREMENT' });
assert(store1.getState() === 1, 'State should be 1 after INCREMENT.');

store1.dispatch({ type: 'INCREMENT' });
assert(store1.getState() === 2, 'State should be 2 after second INCREMENT.');

store1.dispatch({ type: 'DECREMENT' });
assert(store1.getState() === 1, 'State should be 1 after DECREMENT.');

store1.dispatch({ type: 'UNKNOWN_ACTION' });
assert(store1.getState() === 1, 'State should remain 1 after UNKNOWN_ACTION.');

logTestSummary('Basic Store Creation & Reducer');

// --- Test Suite 2: Initial State Handling (Reducer Defined) ---
resetTestCounts();
console.log('\n--- Testing Initial State Handling (Reducer Defined) ---');

const defaultStateReducer = (state = { count: 100 }, action) => {
  if (action.type === 'SET_COUNT') {
    return { ...state, count: action.payload };
  }
  return state;
};

const store2 = createStore(defaultStateReducer); // No initialState provided
assert(typeof store2.getState() === 'object' && store2.getState().count === 100,
  'Store should initialize with reducer default state (via @@redux/INIT).');

store2.dispatch({ type: 'SET_COUNT', payload: 50 });
assert(store2.getState().count === 50, 'State should update when no initial state was provided.');

logTestSummary('Initial State Handling (Reducer Defined)');


// --- Test Suite 3: subscribe(listener) ---
resetTestCounts();
console.log('\n--- Testing subscribe(listener) ---');
const store3 = createStore(counterReducer, 0);
let listener1CallCount = 0;
let listener2CallCount = 0;
let lastStateInListener1;

const listener1 = () => {
  listener1CallCount++;
  lastStateInListener1 = store3.getState();
};
const listener2 = () => {
  listener2CallCount++;
};

const unsubscribe1 = store3.subscribe(listener1);
store3.subscribe(listener2);

store3.dispatch({ type: 'INCREMENT' }); // State becomes 1
assert(listener1CallCount === 1, 'Listener1 should be called once.');
assert(listener2CallCount === 1, 'Listener2 should be called once.');
assert(lastStateInListener1 === 1, 'Listener1 should receive the new state.');

store3.dispatch({ type: 'INCREMENT' }); // State becomes 2
assert(listener1CallCount === 2, 'Listener1 should be called twice.');
assert(listener2CallCount === 2, 'Listener2 should be called twice.');

unsubscribe1(); // Unsubscribe listener1
store3.dispatch({ type: 'DECREMENT' }); // State becomes 1
assert(listener1CallCount === 2, 'Listener1 should NOT be called after unsubscribe.');
assert(listener2CallCount === 3, 'Listener2 should still be called.');

// Test that listeners are not called if state reference doesn't change
const noChangeReducer = (state = { value: 'test' }, action) => {
  if (action.type === 'NO_CHANGE') {
    return state; // Return same state object
  }
  if (action.type === 'CHANGE') {
    return { ...state, value: action.payload };
  }
  return state;
};
const storeNoChange = createStore(noChangeReducer);
let noChangeListenerCalls = 0;
storeNoChange.subscribe(() => noChangeListenerCalls++);

storeNoChange.dispatch({ type: 'NO_CHANGE' });
assert(noChangeListenerCalls === 0, 'Listener should not be called if state reference does not change.');

storeNoChange.dispatch({ type: 'CHANGE', payload: 'new_value' });
assert(noChangeListenerCalls === 1, 'Listener should be called if state reference changes.');


logTestSummary('subscribe(listener)');

// --- Test Suite 4: Action Format (Error Handling) ---
resetTestCounts();
console.log('\n--- Testing Action Format (Error Handling) ---');
const store4 = createStore(counterReducer, 0);
let didThrowNoType = false;
try {
  store4.dispatch({ notType: 'INCREMENT' });
} catch (e) {
  didThrowNoType = e.message.includes('Actions may not have an undefined "type" property');
}
assert(didThrowNoType, 'Dispatch should throw error if action.type is undefined.');

// Note: Our custom createStore doesn't explicitly check for plain object actions,
// but Redux does. This test is more about the 'type' property.

logTestSummary('Action Format (Error Handling)');


// --- Test Suite 5: Enhancer Support ---
resetTestCounts();
console.log('\n--- Testing Enhancer Support ---');

const simpleEnhancer = (nextCreateStore) => (reducer, initialState) => {
  const store = nextCreateStore(reducer, initialState);
  return {
    ...store,
    dispatch: (action) => {
      // console.log('Dispatching from enhanced store:', action);
      return store.dispatch(action);
    },
    enhancedMethod: () => 'enhanced_result'
  };
};

const enhancedStore1 = createStore(counterReducer, 0, simpleEnhancer);
assert(enhancedStore1.getState() === 0, 'Enhanced store: initial state should be 0.');
enhancedStore1.dispatch({ type: 'INCREMENT' });
assert(enhancedStore1.getState() === 1, 'Enhanced store: state should be 1 after INCREMENT.');
assert(typeof enhancedStore1.enhancedMethod === 'function' && enhancedStore1.enhancedMethod() === 'enhanced_result',
  'Enhanced store should have methods added by enhancer.');

// Test createStore(reducer, enhancer) signature
const enhancedStore2 = createStore(counterReducer, simpleEnhancer);
assert(enhancedStore2.getState() === 0, 'Enhanced store (signature 2): initial state should be 0 (from reducer default).');
enhancedStore2.dispatch({ type: 'INCREMENT' });
assert(enhancedStore2.getState() === 1, 'Enhanced store (signature 2): state should be 1 after INCREMENT.');
assert(typeof enhancedStore2.enhancedMethod === 'function' && enhancedStore2.enhancedMethod() === 'enhanced_result',
  'Enhanced store (signature 2) should have methods added by enhancer.');


logTestSummary('Enhancer Support');


// --- Test Suite 6: Integration with Custom Immutable Utilities ---
resetTestCounts();
console.log('\n--- Testing Integration with Custom Immutable Utilities ---');

const immutableInitialState = fromJS({ count: 0, user: { name: 'Test' } });

const immutableReducer = (state = immutableInitialState, action) => {
  switch (action.type) {
    case 'IMMUTABLE_INCREMENT':
      return state.set('count', state.get('count') + 1);
    case 'SET_USER_NAME':
      return state.setIn(['user', 'name'], action.payload);
    default:
      return state;
  }
};

const immutableStore = createStore(immutableReducer, immutableInitialState);
assert(isImmutable(immutableStore.getState()), 'getState() should return an immutable structure.');
assert(immutableStore.getState().get('count') === 0, 'Immutable store: initial count should be 0.');
assert(immutableStore.getState().getIn(['user', 'name']) === 'Test', 'Immutable store: initial user name should be "Test".');

immutableStore.dispatch({ type: 'IMMUTABLE_INCREMENT' });
assert(isImmutable(immutableStore.getState()), 'getState() should return immutable after dispatch.');
assert(immutableStore.getState().get('count') === 1, 'Immutable store: count should be 1 after IMMUTABLE_INCREMENT.');

const oldStateRef = immutableStore.getState();
immutableStore.dispatch({ type: 'SET_USER_NAME', payload: 'NewName' });
const newStateRef = immutableStore.getState();

assert(isImmutable(newStateRef), 'getState() should return immutable after deep setIn.');
assert(newStateRef.getIn(['user', 'name']) === 'NewName', 'Immutable store: user name should be "NewName".');
assert(newStateRef.get('count') === 1, 'Immutable store: count should remain 1.');
assert(oldStateRef !== newStateRef, 'Immutable store: state reference should change after dispatch.');
assert(oldStateRef.getIn(['user', 'name']) === 'Test', 'Immutable store: original state should remain unchanged.');


// Test with reducer-defined initial immutable state
const immutableReducerDefault = (state = fromJS({val: 42}), action) => {
    if (action.type === 'UPDATE_VAL') {
        return state.set('val', action.payload);
    }
    return state;
};
const immutableStoreDefault = createStore(immutableReducerDefault);
assert(isImmutable(immutableStoreDefault.getState()), 'Immutable default state: should be immutable.');
assert(immutableStoreDefault.getState().get('val') === 42, 'Immutable default state: initial val should be 42.');

immutableStoreDefault.dispatch({type: 'UPDATE_VAL', payload: 100});
assert(immutableStoreDefault.getState().get('val') === 100, 'Immutable default state: val should update.');


logTestSummary('Integration with Custom Immutable Utilities');


console.log('\nAll customReduxUtils.js tests finished. Check console for FAIL messages.');
// Final summary (optional, as each suite has one)
// console.log(`Overall: ${assertionsPassed} / ${testCount} assertions passed across all suites.`);
// This overall count would need manual aggregation or a proper test runner.
// The per-suite summary is more practical here.

// Test for dispatching during reducer execution (should throw)
resetTestCounts();
console.log('\n--- Testing Dispatch Invariants ---');
const dispatchInReducer = (state = 0, action) => {
  if (action.type === 'DISPATCH_IN_REDUCER') {
    // This should throw an error
    storeForInvariantTest.dispatch({ type: 'INNER_ACTION' });
    return state + 1;
  }
  return state;
};
const storeForInvariantTest = createStore(dispatchInReducer);
let threwDispatchInReducer = false;
try {
  storeForInvariantTest.dispatch({ type: 'DISPATCH_IN_REDUCER' });
} catch (e) {
  threwDispatchInReducer = e.message.includes('Reducers may not dispatch actions.');
}
assert(threwDispatchInReducer, 'Should throw error when dispatching inside a reducer.');
logTestSummary('Dispatch Invariants');

console.log("All tests completed. Check console for errors.");
