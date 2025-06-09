import { describe, it as test, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import localStorageAdapter from '../../src/persistence/localStorageAdapter.js';

// Mocking window and localStorage for Node.js environment
global.window = {};

describe('localStorageAdapter', () => {
  let mockLocalStorage;
  let originalWindow;
  let consoleErrorSpy, consoleWarnSpy;

  beforeEach(() => {
    mockLocalStorage = {
      getItem: mock.fn(),
      setItem: mock.fn(),
      removeItem: mock.fn(),
      clear: mock.fn(),
    };
    global.window.localStorage = mockLocalStorage;

    consoleErrorSpy = mock.method(console, 'error', () => {});
    consoleWarnSpy = mock.method(console, 'warn', () => {});
  });

  afterEach(() => {
    delete global.window.localStorage;
    consoleErrorSpy.mock.restore();
    consoleWarnSpy.mock.restore();
  });

  test('getItem should retrieve and parse item from localStorage', () => {
    mockLocalStorage.getItem.mockImplementationOnce(() => JSON.stringify({ data: 'test' }));
    const item = localStorageAdapter.getItem('myKey');
    assert.strictEqual(mockLocalStorage.getItem.mock.calls.length, 1);
    assert.deepStrictEqual(mockLocalStorage.getItem.mock.calls[0].arguments, ['myKey']);
    assert.deepStrictEqual(item, { data: 'test' });
  });

  test('getItem should return undefined if item not found', () => {
    mockLocalStorage.getItem.mock.mockImplementationOnce(() => null);
    const item = localStorageAdapter.getItem('myKey');
    assert.strictEqual(item, undefined);
  });

  test('getItem should return null on JSON parse error', () => {
    mockLocalStorage.getItem.mock.mockImplementationOnce(() => 'invalid json');
    const item = localStorageAdapter.getItem('myKey');
    assert.strictEqual(item, null);
    assert(consoleErrorSpy.mock.calls.length > 0);
  });

  test('getItem should return null if localStorage not available', () => {
    delete global.window.localStorage;
    const item = localStorageAdapter.getItem('myKey');
    assert.strictEqual(item, null);
    assert(consoleWarnSpy.mock.calls.some(call => call.arguments[0] === 'localStorage is not available. Cannot getItem.'));
    global.window.localStorage = mockLocalStorage; // Restore for other tests
  });


  test('setItem should stringify and store item in localStorage', () => {
    const value = { data: 'testValue' };
    localStorageAdapter.setItem('myKey', value);
    assert.strictEqual(mockLocalStorage.setItem.mock.calls.length, 1);
    assert.deepStrictEqual(mockLocalStorage.setItem.mock.calls[0].arguments, ['myKey', JSON.stringify(value)]);
  });

  test('setItem should not throw if localStorage not available but log warn', () => {
    delete global.window.localStorage;
    assert.doesNotThrow(() => localStorageAdapter.setItem('myKey', 'val'));
    assert(consoleWarnSpy.mock.calls.some(call => call.arguments[0] === 'localStorage is not available. Cannot setItem.'));
    global.window.localStorage = mockLocalStorage; // Restore for other tests
  });

  test('setItem should log error if JSON.stringify fails', () => {
    const circularValue = {};
    circularValue.self = circularValue;
    localStorageAdapter.setItem('myKey', circularValue);
    assert.strictEqual(mockLocalStorage.setItem.mock.calls.length, 0);
    assert(consoleErrorSpy.mock.calls.length > 0);
  });

  test('removeItem should remove item from localStorage', () => {
    localStorageAdapter.removeItem('myKey');
    assert.strictEqual(mockLocalStorage.removeItem.mock.calls.length, 1);
    assert.deepStrictEqual(mockLocalStorage.removeItem.mock.calls[0].arguments, ['myKey']);
  });

  test('removeItem should not throw if localStorage not available but log warn', () => {
    delete global.window.localStorage;
    assert.doesNotThrow(() => localStorageAdapter.removeItem('myKey'));
    assert(consoleWarnSpy.mock.calls.some(call => call.arguments[0] === 'localStorage is not available. Cannot removeItem.'));
    global.window.localStorage = mockLocalStorage; // Restore for other tests
  });
});
