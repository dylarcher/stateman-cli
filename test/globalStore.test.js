import { describe, expect, jest, test } from '@jest/globals'
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
    expect(isImmutable(store.getState())).toBe(true)
    expect(store.getState().toJS()).toEqual({ counter: 0, user: null })
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
    expect(isImmutable(store.getState())).toBe(true)
    expect(store.getState().get('message')).toBe("default initial")
  })

  test('should dispatch actions and update state immutably', () => {
    const store = createGlobalStore(reducer, initialState)
    const originalState = store.getState()

    store.dispatch({ type: 'INCREMENT' })
    const stateAfterIncrement = store.getState()
    expect(stateAfterIncrement.get('counter')).toBe(1)
    expect(isImmutable(stateAfterIncrement)).toBe(true)
    expect(originalState.get('counter')).toBe(0) // Original state should not have changed
    expect(stateAfterIncrement).not.toBe(originalState) // Should be a new immutable instance

    store.dispatch({ type: 'SET_USER', payload: { name: 'Test User' } })
    const stateAfterSetUser = store.getState()
    expect(stateAfterSetUser.getIn(['user', 'name'])).toBe('Test User')
    expect(isImmutable(stateAfterSetUser.get('user'))).toBe(true)
    expect(stateAfterIncrement.get('user')).toBe(null) // State after increment should not have user
    expect(stateAfterSetUser).not.toBe(stateAfterIncrement)
  })

  test('should notify subscribers on state change', () => {
    const store = createGlobalStore(reducer, initialState)
    const listener = jest.fn()

    const unsubscribe = store.subscribe(listener)
    expect(listener).not.toHaveBeenCalled()

    store.dispatch({ type: 'INCREMENT' })
    expect(listener).toHaveBeenCalledTimes(1)

    store.dispatch({ type: 'SET_USER', payload: { name: 'Another User' } })
    expect(listener).toHaveBeenCalledTimes(2)

    unsubscribe()
    store.dispatch({ type: 'INCREMENT' })
    expect(listener).toHaveBeenCalledTimes(2) // Should not be called after unsubscribe
  })

  test('should throw error if initial state is not immutable', () => {
    expect(() => createGlobalStore(reducer, { counter: 0 })).toThrow('Initial state must be an Immutable.js structure if provided.')
  })

  test('should throw error if reducer returns non-immutable state', () => {
    const faultyReducer = (state = initialState, action) => {
      if (action.type === 'FAULTY_ACTION') {
        return { counter: state.get('counter') + 1 } // Returns plain object
      }
      return state
    }
    const store = createGlobalStore(faultyReducer, initialState)
    expect(() => store.dispatch({ type: 'FAULTY_ACTION' })).toThrow('Reducer must return an Immutable.js structure.')
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
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => { })
  })

  afterEach(() => {
    // Restore console.warn after each test
    consoleWarnSpy.mockRestore()
  })

  test('should attach action dispatchers to store.actions', () => {
    const store = createGlobalStore(testReducer, initial, { actions: actionsConfig })
    expect(store.actions).toBeDefined()
    expect(typeof store.actions.increment).toBe('function')
    expect(typeof store.actions.setMessage).toBe('function')
  })

  test('store.actions.actionName() should dispatch the action and update state', () => {
    const store = createGlobalStore(testReducer, initial, { actions: actionsConfig })

    store.actions.increment(5)
    expect(store.getState().get('counter')).toBe(5)

    store.actions.setMessage('Hello Actions')
    expect(store.getState().get('message')).toBe('Hello Actions')
  })

  test('store.actions.actionName() should use default parameters of action creator', () => {
    const store = createGlobalStore(testReducer, initial, { actions: actionsConfig })
    store.actions.increment() // No amount, should default to 1
    expect(store.getState().get('counter')).toBe(1)
  })

  test('should not create action dispatcher for non-function properties in actions config', () => {
    const store = createGlobalStore(testReducer, initial, { actions: actionsConfig })

    expect(store.actions.invalidAction).toBeUndefined()
    expect(consoleWarnSpy).toHaveBeenCalledWith("Action creator for 'invalidAction' is not a function and will be ignored.")
  })

  test('store.actions should be an empty object if no actions config is provided', () => {
    const store = createGlobalStore(testReducer, initial) // No options object
    expect(store.actions).toEqual({})

    const storeWithOptions = createGlobalStore(testReducer, initial, {}) // Empty options object
    expect(storeWithOptions.actions).toEqual({})
  })

  test('store.actions should be an empty object if actions config is null or not an object', () => {
    let store = createGlobalStore(testReducer, initial, { actions: null })
    expect(store.actions).toEqual({})

    store = createGlobalStore(testReducer, initial, { actions: "not_an_object" })
    expect(store.actions).toEqual({})
  })
})
