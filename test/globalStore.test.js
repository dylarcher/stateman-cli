import { describe, it as test, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { fromJS, isImmutable } from 'immutable'
import { createGlobalStore } from '../src/globalStore.js'

describe('createGlobalStore', () => {
  const initialState = fromJS({ counter: 0, user: null })
  const reducer = (state = initialState, action) => {
    switch (action.type) {
      case 'INCREMENT':
        return state.update('counter', c => c + 1)
      case 'SET_USER':
        return state.set('user', fromJS(action.payload))
      default:
        return state
    }
  }

  test('should create a store and return initial state', () => {
    const store = createGlobalStore(reducer, initialState)
    assert(isImmutable(store.getState()))
    assert.deepStrictEqual(store.getState().toJS(), { counter: 0, user: null })
  })

  test('should handle undefined initial state by letting reducer define it', () => {
    const reducerWithOwnInitial = (state, action) => {
      if (state === undefined) {
        return fromJS({ message: "default initial" })
      }
      // other actions
      return state
    }
    const store = createGlobalStore(reducerWithOwnInitial)
    assert(isImmutable(store.getState()))
    assert.strictEqual(store.getState().get('message'), "default initial")
  })

  test('should dispatch actions and update state immutably', () => {
    const store = createGlobalStore(reducer, initialState)
    const originalState = store.getState()

    store.dispatch({ type: 'INCREMENT' })
    const stateAfterIncrement = store.getState()
    assert.strictEqual(stateAfterIncrement.get('counter'), 1)
    assert(isImmutable(stateAfterIncrement))
    assert.strictEqual(originalState.get('counter'), 0) // Original state should not have changed
    assert.notStrictEqual(stateAfterIncrement, originalState) // Should be a new immutable instance

    store.dispatch({ type: 'SET_USER', payload: { name: 'Test User' } })
    const stateAfterSetUser = store.getState()
    assert.strictEqual(stateAfterSetUser.getIn(['user', 'name']), 'Test User')
    assert(isImmutable(stateAfterSetUser.get('user')))
    assert.strictEqual(stateAfterIncrement.get('user'), null) // State after increment should not have user
    assert.notStrictEqual(stateAfterSetUser, stateAfterIncrement)
  })

  test('should notify subscribers on state change', () => {
    const store = createGlobalStore(reducer, initialState)
    const listener = mock.fn()

    const unsubscribe = store.subscribe(listener)
    assert.strictEqual(listener.mock.calls.length, 0)

    store.dispatch({ type: 'INCREMENT' })
    assert.strictEqual(listener.mock.calls.length, 1)

    store.dispatch({ type: 'SET_USER', payload: { name: 'Another User' } })
    assert.strictEqual(listener.mock.calls.length, 2)

    unsubscribe()
    store.dispatch({ type: 'INCREMENT' })
    assert.strictEqual(listener.mock.calls.length, 2) // Should not be called after unsubscribe
  })

  test('should throw error if initial state is not immutable', () => {
    assert.throws(() => createGlobalStore(reducer, { counter: 0 }), /Initial state must be an Immutable.js structure if provided\./)
  })

  test('should throw error if reducer returns non-immutable state', () => {
    const faultyReducer = (state = initialState, action) => {
      if (action.type === 'FAULTY_ACTION') {
        return { counter: state.get('counter') + 1 } // Returns plain object
      }
      return state
    }
    const store = createGlobalStore(faultyReducer, initialState)
    assert.throws(() => store.dispatch({ type: 'FAULTY_ACTION' }), /Reducer must return an Immutable.js structure\./)
  })
})


describe('createGlobalStore with ergonomic actions', () => {
  const initial = fromJS({ counter: 0 })
  const testReducer = (state = initial, action) => {
    switch (action.type) {
      case 'INCREMENT_BY':
        return state.update('counter', c => c + action.payload)
      case 'SET_MESSAGE':
        return state.set('message', action.message)
      default:
        return state
    }
  }

  const actionsConfig = {
    increment: (amount = 1) => ({ type: 'INCREMENT_BY', payload: amount }),
    setMessage: (text) => ({ type: 'SET_MESSAGE', message: text }),
    // Example of a non-function property in actions config
    invalidAction: "not a function"
  }
  let consoleWarnSpy

  beforeEach(() => {
    // Spy on console.warn before each test in this describe block
    consoleWarnSpy = mock.method(console, 'warn', () => { })
  })

  afterEach(() => {
    // Restore console.warn after each test
    consoleWarnSpy.mock.restore()
  })

  test('should attach action dispatchers to store.actions', () => {
    const store = createGlobalStore(testReducer, initial, { actions: actionsConfig })
    assert(store.actions)
    assert.strictEqual(typeof store.actions.increment, 'function')
    assert.strictEqual(typeof store.actions.setMessage, 'function')
  })

  test('store.actions.actionName() should dispatch the action and update state', () => {
    const store = createGlobalStore(testReducer, initial, { actions: actionsConfig })

    store.actions.increment(5)
    assert.strictEqual(store.getState().get('counter'), 5)

    store.actions.setMessage('Hello Actions')
    assert.strictEqual(store.getState().get('message'), 'Hello Actions')
  })

  test('store.actions.actionName() should use default parameters of action creator', () => {
    const store = createGlobalStore(testReducer, initial, { actions: actionsConfig })
    store.actions.increment() // No amount, should default to 1
    assert.strictEqual(store.getState().get('counter'), 1)
  })

  test('should not create action dispatcher for non-function properties in actions config', () => {
    const store = createGlobalStore(testReducer, initial, { actions: actionsConfig })

    assert.strictEqual(typeof store.actions.invalidAction, 'undefined')
    assert.strictEqual(consoleWarnSpy.mock.calls.length, 1)
    assert.deepStrictEqual(consoleWarnSpy.mock.calls[0].arguments, ["Action creator for 'invalidAction' is not a function and will be ignored."])
  })

  test('store.actions should be an empty object if no actions config is provided', () => {
    const store = createGlobalStore(testReducer, initial) // No options object
    assert.deepStrictEqual(store.actions, {})

    const storeWithOptions = createGlobalStore(testReducer, initial, {}) // Empty options object
    assert.deepStrictEqual(storeWithOptions.actions, {})
  })

  test('store.actions should be an empty object if actions config is null or not an object', () => {
    let store = createGlobalStore(testReducer, initial, { actions: null })
    assert.deepStrictEqual(store.actions, {})

    store = createGlobalStore(testReducer, initial, { actions: "not_an_object" })
    assert.deepStrictEqual(store.actions, {})
  })
})
