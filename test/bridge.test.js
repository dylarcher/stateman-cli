import { beforeEach, describe, expect, jest, test } from '@jest/globals'
// Use our custom utils
import { fromJS } from '../src/utils/immutableUtils.js';
import { derive as customVanDerive } from '../src/utils/customVanUtils.js'; // Import custom derive
import { connectToGlobalStore } from '../src/bridge.js'
import { createGlobalStore } from '../src/globalStore.js'
import { createScopedState } from '../src/scopedState.js'

// Top-level declaration for globalStore and its setup
let globalStore
const initialGlobal = fromJS({ counter: 100, message: 'Hello Global', user: null })
const globalReducer = (state = initialGlobal, action) => {
  switch (action.type) {
    case 'GLOBAL_INCREMENT':
      return state.update('counter', c => c + 1)
    case 'SET_MESSAGE':
      return state.set('message', action.payload)
    case 'SET_USER':
      return state.set('user', fromJS(action.payload))
    default:
      return state
  }
}

beforeEach(() => {
  globalStore = createGlobalStore(globalReducer, initialGlobal)
})

describe('State Bridging (Legacy Tests - using createScopedState)', () => {
  // These tests use createScopedState which internally calls connectToGlobalStore
  test('scopedState.getGlobal should retrieve data from globalStore', () => {
    const scoped = createScopedState(null, { globalStore })
    const counter = scoped.getGlobal(state => state.get('counter'))
    expect(counter).toBe(100)
    const message = scoped.getGlobal(state => state.get('message'))
    expect(message).toBe('Hello Global')
  })

  test('scopedState.getGlobal should throw if selector is not a function', () => {
    const scoped = createScopedState(null, { globalStore })
    expect(() => scoped.getGlobal(null)).toThrow('selectorFn must be a function for getGlobal.')
  })

  test('scopedState.dispatchGlobal should dispatch actions to globalStore', () => {
    const scoped = createScopedState(null, { globalStore })
    scoped.dispatchGlobal({ type: 'GLOBAL_INCREMENT' })
    expect(globalStore.getState().get('counter')).toBe(101)

    scoped.dispatchGlobal({ type: 'SET_MESSAGE', payload: 'Updated by Scoped' })
    expect(globalStore.getState().get('message')).toBe('Updated by Scoped')
  })

  test('scopedState.subscribeToGlobal should notify on selected state change', () => {
    const scoped = createScopedState(null, { globalStore })
    const listener = jest.fn()
    const selector = state => state.get('counter')

    const unsubscribe = scoped.subscribeToGlobal(selector, listener)
    expect(listener).not.toHaveBeenCalled()

    globalStore.dispatch({ type: 'GLOBAL_INCREMENT' })
    expect(listener).toHaveBeenCalledTimes(1)
    expect(listener).toHaveBeenCalledWith(101)

    globalStore.dispatch({ type: 'SET_MESSAGE', payload: 'Irrelevant change' })
    expect(listener).toHaveBeenCalledTimes(1)

    globalStore.dispatch({ type: 'GLOBAL_INCREMENT' })
    expect(listener).toHaveBeenCalledTimes(2)
    expect(listener).toHaveBeenCalledWith(102)

    unsubscribe()
    globalStore.dispatch({ type: 'GLOBAL_INCREMENT' })
    expect(listener).toHaveBeenCalledTimes(2)
  })

  test('scopedState.subscribeToGlobal should handle primitive and immutable comparisons', () => {
    const userSelector = state => state.get('user')
    const listenerUser = jest.fn()
    const scoped = createScopedState(null, { globalStore })
    globalStore.dispatch({ type: 'SET_USER', payload: { name: 'User1', id: 1 } })

    const unsubscribeUser = scoped.subscribeToGlobal(userSelector, listenerUser)

    globalStore.dispatch({ type: 'SET_USER', payload: { name: 'User2', id: 2 } })
    expect(listenerUser).toHaveBeenCalledTimes(1)
    expect(listenerUser.mock.calls[0][0].get('name')).toBe('User2')

    globalStore.dispatch({ type: 'SET_USER', payload: { name: 'User2', id: 2 } })
    expect(listenerUser).toHaveBeenCalledTimes(1)
  })

  test('subscribeToGlobal should throw if selector or callback is not a function', () => {
    const scoped = createScopedState(null, { globalStore })
    expect(() => scoped.subscribeToGlobal(null, () => { })).toThrow('selectorFn must be a function for subscribeToGlobal.')
    expect(() => scoped.subscribeToGlobal(() => { }, null)).toThrow('callback must be a function for subscribeToGlobal.')
  })
})

describe('scopedState.createGlobalStateSelector (New Tests - direct use of connectToGlobalStore)', () => {
  // These tests use a plain object for 'scoped' and call connectToGlobalStore manually
  // as createGlobalStateSelector is a method added by connectToGlobalStore.
  test('should return a VanJS state reflecting selected global data', async () => {
    const scoped = {}
    connectToGlobalStore(scoped, globalStore)
    const counterSelector = state => state.get('counter')
    const reactiveCounter = scoped.createGlobalStateSelector(counterSelector)

    expect(reactiveCounter.val).toBe(100)

    globalStore.dispatch({ type: 'GLOBAL_INCREMENT' })
    expect(reactiveCounter.val).toBe(101)

    globalStore.dispatch({ type: 'SET_MESSAGE', payload: 'Irrelevant' })
    expect(reactiveCounter.val).toBe(101)

    globalStore.dispatch({ type: 'GLOBAL_INCREMENT' })
    expect(reactiveCounter.val).toBe(102)
  })

  test('VanJS state from createGlobalStateSelector should update other VanJS derivations', async () => {
    const scoped = {}
    connectToGlobalStore(scoped, globalStore)
    const counterSelector = state => state.get('counter')
    const reactiveCounter = scoped.createGlobalStateSelector(counterSelector)

    const derivedDouble = customVanDerive(() => reactiveCounter.val * 2) // Use custom derive
    expect(derivedDouble.val).toBe(200)

    globalStore.dispatch({ type: 'GLOBAL_INCREMENT' })
    await new Promise(r => setTimeout(r, 0))
    expect(reactiveCounter.val).toBe(101)
    expect(derivedDouble.val).toBe(202)
  })

  test('should throw if selectorFn is not a function', () => {
    const scoped = {}
    connectToGlobalStore(scoped, globalStore)
    expect(() => scoped.createGlobalStateSelector(null))
      .toThrow('selectorFn must be a function for createGlobalStateSelector.')
  })

  test('should use custom areEqual function if provided', () => {
    const scoped = {}
    connectToGlobalStore(scoped, globalStore)
    const makeImmutable = fromJS
    const userSelector = state => state.get('user') || makeImmutable({})

    const areUserNamesEqual = (prevUser, newUser) => {
      const p = prevUser && typeof prevUser.get === 'function' ? prevUser : makeImmutable(prevUser || {})
      const n = newUser && typeof newUser.get === 'function' ? newUser : makeImmutable(newUser || {})
      return p.get('name') === n.get('name')
    }

    const reactiveUser = scoped.createGlobalStateSelector(userSelector, { areEqual: areUserNamesEqual })

    globalStore.dispatch({ type: 'SET_USER', payload: { name: 'Alice', timestamp: 1 } })
    expect(reactiveUser.val.get('name')).toBe('Alice')
    const firstUserInstanceVal = reactiveUser.val

    globalStore.dispatch({ type: 'SET_USER', payload: { name: 'Alice', timestamp: 2 } })
    expect(reactiveUser.val.get('name')).toBe('Alice')
    expect(reactiveUser.val).toBe(firstUserInstanceVal)
    expect(reactiveUser.val.get('timestamp')).toBe(1)

    globalStore.dispatch({ type: 'SET_USER', payload: { name: 'Bob', timestamp: 3 } })
    expect(reactiveUser.val.get('name')).toBe('Bob')
    expect(reactiveUser.val.get('timestamp')).toBe(3)
    expect(reactiveUser.val).not.toBe(firstUserInstanceVal)
  })
})
