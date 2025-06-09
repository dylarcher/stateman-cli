import { beforeEach, describe, it as test, mock } from 'node:test';
import assert from 'node:assert';
import { fromJS } from 'immutable'
import van from 'vanjs-core' // Import van for van.derive in new tests
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
    assert.strictEqual(counter, 100)
    const message = scoped.getGlobal(state => state.get('message'))
    assert.strictEqual(message, 'Hello Global')
  })

  test('scopedState.getGlobal should throw if selector is not a function', () => {
    const scoped = createScopedState(null, { globalStore })
    assert.throws(() => scoped.getGlobal(null), /selectorFn must be a function for getGlobal\./)
  })

  test('scopedState.dispatchGlobal should dispatch actions to globalStore', () => {
    const scoped = createScopedState(null, { globalStore })
    scoped.dispatchGlobal({ type: 'GLOBAL_INCREMENT' })
    assert.strictEqual(globalStore.getState().get('counter'), 101)

    scoped.dispatchGlobal({ type: 'SET_MESSAGE', payload: 'Updated by Scoped' })
    assert.strictEqual(globalStore.getState().get('message'), 'Updated by Scoped')
  })

  test('scopedState.subscribeToGlobal should notify on selected state change', () => {
    const scoped = createScopedState(null, { globalStore })
    const listener = mock.fn()
    const selector = state => state.get('counter')

    const unsubscribe = scoped.subscribeToGlobal(selector, listener)
    assert.strictEqual(listener.mock.calls.length, 0)

    globalStore.dispatch({ type: 'GLOBAL_INCREMENT' })
    assert.strictEqual(listener.mock.calls.length, 1)
    assert.deepStrictEqual(listener.mock.calls[0].arguments[0], 101)

    globalStore.dispatch({ type: 'SET_MESSAGE', payload: 'Irrelevant change' })
    assert.strictEqual(listener.mock.calls.length, 1)

    globalStore.dispatch({ type: 'GLOBAL_INCREMENT' })
    assert.strictEqual(listener.mock.calls.length, 2)
    assert.deepStrictEqual(listener.mock.calls[1].arguments[0], 102)

    unsubscribe()
    globalStore.dispatch({ type: 'GLOBAL_INCREMENT' })
    assert.strictEqual(listener.mock.calls.length, 2)
  })

  test('scopedState.subscribeToGlobal should handle primitive and immutable comparisons', () => {
    const userSelector = state => state.get('user')
    const listenerUser = mock.fn()
    const scoped = createScopedState(null, { globalStore })
    globalStore.dispatch({ type: 'SET_USER', payload: { name: 'User1', id: 1 } })

    const unsubscribeUser = scoped.subscribeToGlobal(userSelector, listenerUser)

    globalStore.dispatch({ type: 'SET_USER', payload: { name: 'User2', id: 2 } })
    assert.strictEqual(listenerUser.mock.calls.length, 1)
    assert.strictEqual(listenerUser.mock.calls[0].arguments[0].get('name'), 'User2')

    globalStore.dispatch({ type: 'SET_USER', payload: { name: 'User2', id: 2 } })
    assert.strictEqual(listenerUser.mock.calls.length, 1)
  })

  test('subscribeToGlobal should throw if selector or callback is not a function', () => {
    const scoped = createScopedState(null, { globalStore })
    assert.throws(() => scoped.subscribeToGlobal(null, () => { }), /selectorFn must be a function for subscribeToGlobal\./)
    assert.throws(() => scoped.subscribeToGlobal(() => { }, null), /callback must be a function for subscribeToGlobal\./)
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

    assert.strictEqual(reactiveCounter.val, 100)

    globalStore.dispatch({ type: 'GLOBAL_INCREMENT' })
    assert.strictEqual(reactiveCounter.val, 101)

    globalStore.dispatch({ type: 'SET_MESSAGE', payload: 'Irrelevant' })
    assert.strictEqual(reactiveCounter.val, 101)

    globalStore.dispatch({ type: 'GLOBAL_INCREMENT' })
    assert.strictEqual(reactiveCounter.val, 102)
  })

  test('VanJS state from createGlobalStateSelector should update other VanJS derivations', async () => {
    const scoped = {}
    connectToGlobalStore(scoped, globalStore)
    const counterSelector = state => state.get('counter')
    const reactiveCounter = scoped.createGlobalStateSelector(counterSelector)

    const derivedDouble = van.derive(() => reactiveCounter.val * 2)
    assert.strictEqual(derivedDouble.val, 200)

    globalStore.dispatch({ type: 'GLOBAL_INCREMENT' })
    await new Promise(r => setTimeout(r, 0))
    assert.strictEqual(reactiveCounter.val, 101)
    assert.strictEqual(derivedDouble.val, 202)
  })

  test('should throw if selectorFn is not a function', () => {
    const scoped = {}
    connectToGlobalStore(scoped, globalStore)
    assert.throws(() => scoped.createGlobalStateSelector(null),
      /selectorFn must be a function for createGlobalStateSelector\./)
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
    assert.strictEqual(reactiveUser.val.get('name'), 'Alice')
    const firstUserInstanceVal = reactiveUser.val

    globalStore.dispatch({ type: 'SET_USER', payload: { name: 'Alice', timestamp: 2 } })
    assert.strictEqual(reactiveUser.val.get('name'), 'Alice')
    assert.strictEqual(reactiveUser.val, firstUserInstanceVal)
    assert.strictEqual(reactiveUser.val.get('timestamp'), 1)

    globalStore.dispatch({ type: 'SET_USER', payload: { name: 'Bob', timestamp: 3 } })
    assert.strictEqual(reactiveUser.val.get('name'), 'Bob')
    assert.strictEqual(reactiveUser.val.get('timestamp'), 3)
    assert.notStrictEqual(reactiveUser.val, firstUserInstanceVal)
  })
})
