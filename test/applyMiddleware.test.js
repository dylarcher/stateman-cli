import { describe, it as test } from 'node:test';
import assert from 'node:assert';
import { fromJS } from 'immutable'
import applyMiddleware, { compose } from '../src/applyMiddleware.js'
import { createGlobalStore } from '../src/globalStore.js' // Using the actual global store

describe('compose', () => {
  test('composes functions from right to left', () => {
    const a = next => x => next(x + 'a')
    const b = next => x => next(x + 'b')
    const c = next => x => next(x + 'c')
    const final = x => x
    assert.strictEqual(compose(a, b, c)(final)(''), 'abc')
    assert.strictEqual(compose(a, b, c)(x => x + 'd')(''), 'abcd')
  })

  test('returns the identity function if no functions are passed', () => {
    assert.strictEqual(compose()(1), 1)
  })

  test('returns the single function if only one is passed', () => {
    const fn = x => x * 2
    assert.strictEqual(compose(fn)(2), 4)
  })
})

describe('applyMiddleware', () => {
  const initialState = fromJS({ value: 0 })
  const reducer = (state = initialState, action) => {
    if (action.type === 'ADD') {
      return state.update('value', v => v + (action.payload || 1))
    }
    return state
  }

  test('should enhance store with middleware', () => {
    const middlewareLog = []
    const testMiddleware = store => next => action => {
      middlewareLog.push(`before: ${action.type}`)
      const result = next(action)
      middlewareLog.push(`after: ${action.type}`)
      return result
    }

    const store = createGlobalStore(reducer, initialState, { enhancer: applyMiddleware(testMiddleware) })
    store.dispatch({ type: 'ADD', payload: 5 })

    assert.strictEqual(store.getState().get('value'), 5)
    assert.deepStrictEqual(middlewareLog, ['before: ADD', 'after: ADD'])
  })

  test('should pass correct API to middleware', () => {
    let capturedStoreAPI
    const testMiddleware = store => {
      capturedStoreAPI = store
      return next => action => next(action)
    }

    const store = createGlobalStore(reducer, initialState, { enhancer: applyMiddleware(testMiddleware) })
    store.dispatch({ type: 'ADD' })

    assert(capturedStoreAPI.getState instanceof Function)
    assert(capturedStoreAPI.dispatch instanceof Function)
    assert.strictEqual(capturedStoreAPI.getState().get('value'), 1) // dispatch was called
  })

  test('middleware should be able to dispatch actions', () => {
    const testMiddleware = ({ dispatch, getState }) => next => action => {
      if (action.type === 'DOUBLE_ADD') {
        dispatch({ type: 'ADD', payload: action.payload })
        dispatch({ type: 'ADD', payload: action.payload })
        return // Stop this action
      }
      return next(action)
    }

    const store = createGlobalStore(reducer, initialState, { enhancer: applyMiddleware(testMiddleware) })
    store.dispatch({ type: 'DOUBLE_ADD', payload: 3 })
    assert.strictEqual(store.getState().get('value'), 6)
  })

  test('should throw if dispatching during middleware construction', () => {
    const problematicMiddleware = store => {
      store.dispatch({ type: 'FAIL' }) // Dispatching too early
      return next => action => next(action)
    }
    assert.throws(() => createGlobalStore(reducer, initialState, { enhancer: applyMiddleware(problematicMiddleware) }),
      /Dispatching while constructing your middleware is not allowed/)
  })
})
