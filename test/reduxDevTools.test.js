import { afterEach, beforeEach, describe, it as test, mock } from 'node:test';
import assert from 'node:assert';
import { fromJS, Map as ImmutableMap } from 'immutable';
import applyMiddleware from '../src/applyMiddleware.js'; // To test enhancer composition
import { createGlobalStore } from '../src/globalStore.js';

// Mocking window for Node.js environment
let originalGlobalWindow;

beforeEach(() => {
  originalGlobalWindow = global.window;
  global.window = {};
});

afterEach(() => {
  global.window = originalGlobalWindow;
});
describe('Redux DevTools Integration', () => {
  const initialState = fromJS({ counter: 0 });
  const reducer = (state = initialState, action) => {
    switch (action.type) {
      case 'INCREMENT':
        return state.update('counter', c => c + 1)
      case 'DECREMENT':
        return state.update('counter', c => c - 1)
      default:
        return state
    }
  }

  let mockDevToolsExtensionCompose;
  let originalWindowDevToolsCompose;

  beforeEach(() => {
    mockDevToolsExtensionCompose = mock.fn((optionsPassedToCompose) => {
      return (appEnhancer) => {
        if (appEnhancer) {
          return (createStore) => (reducer, initialState) => {
            return appEnhancer(createStore)(reducer, initialState);
          };
        }
        return (createStore) => (reducer, initialState) => {
          return createStore(reducer, initialState);
        };
      };
    });

    originalWindowDevToolsCompose = global.window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__;
    global.window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ = mockDevToolsExtensionCompose;
  });

  afterEach(() => {
    global.window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ = originalWindowDevToolsCompose;
    mockDevToolsExtensionCompose.mock.resetCalls();
  });

  test('should use REDUX_DEVTOOLS_EXTENSION_COMPOSE__ if available', () => {
    createGlobalStore(reducer, initialState);
    assert(mockDevToolsExtensionCompose.mock.calls.length > 0, 'DevTools compose function was not called');
  });

  test('should pass serialize options for Immutable.js to DevTools', () => {
    createGlobalStore(reducer, initialState);
    assert(mockDevToolsExtensionCompose.mock.calls.length > 0, 'DevTools compose function was not called');
    const callArgs = mockDevToolsExtensionCompose.mock.calls[0].arguments;
    assert(callArgs.length > 0, 'DevTools compose function was called without arguments');
    const options = callArgs[0];
    assert(options && typeof options === 'object', 'Options were not passed or not an object');
    assert(options.serialize && typeof options.serialize === 'object', 'Serialize option not found or not an object');
    assert.strictEqual(options.serialize.immutable, ImmutableMap, 'Immutable.js Map not passed to serialize options');
    assert.strictEqual(typeof options.serialize.replacer, 'function', 'Replacer function not passed to serialize options');

    const replacer = options.serialize.replacer;
    const immutableData = fromJS({ a: 1 });
    assert.deepStrictEqual(replacer(null, immutableData), { a: 1 });
    assert.strictEqual(replacer(null, "string"), "string");
  });

  test('should correctly compose DevTools enhancer with other enhancers', () => {
    const mockMiddlewareFn = mock.fn(store => next => action => next(action));
    const appEnhancer = applyMiddleware(mockMiddlewareFn);

    const store = createGlobalStore(reducer, initialState, { enhancer: appEnhancer });
    assert(mockDevToolsExtensionCompose.mock.calls.length > 0, 'DevTools compose was not called');
    const composeArgs = mockDevToolsExtensionCompose.mock.calls[0].arguments;
    assert(composeArgs[0] && typeof composeArgs[0].serialize === 'object', 'Serialize options not passed to compose');

    store.dispatch({ type: 'INCREMENT' });
    assert(mockMiddlewareFn.mock.calls.length > 0, 'Middleware function was not called');
  });

  test('should correctly apply DevTools enhancer if no other enhancer is present', () => {
    createGlobalStore(reducer, initialState, {}); // Empty options, so no appEnhancer
    assert(mockDevToolsExtensionCompose.mock.calls.length > 0, 'DevTools compose was not called');
    const composeArgs = mockDevToolsExtensionCompose.mock.calls[0].arguments;
    assert(composeArgs[0] && typeof composeArgs[0].serialize === 'object', 'Serialize options not passed to compose');
  });

  test('should function correctly if DevTools extension is not available', () => {
    global.window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ = undefined;

    let store;
    assert.doesNotThrow(() => {
      store = createGlobalStore(reducer, initialState, undefined);
    });

    store.dispatch({ type: 'INCREMENT' });
    assert.strictEqual(store.getState().get('counter'), 1);
  });
})
