/**
 * @jest-environment jsdom
 */
import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import localStorageAdapter from '../../src/persistence/localStorageAdapter.js';

describe('localStorageAdapter', () => {
  let mockLocalStorage;
  let originalWindow;
  let consoleErrorSpy, consoleWarnSpy;

  beforeEach(() => {
    mockLocalStorage = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      removeItem: jest.fn(),
      clear: jest.fn(),
    };
    originalWindow = global.window;
    // Create a new window object for each test that inherits from the global one if needed
    // but for localStorage, we directly define it.
    global.window = Object.create(global.window || {}); // Ensure window exists
    Object.defineProperty(global.window, 'localStorage', {
      value: mockLocalStorage,
      writable: true,
      configurable: true,
    });

    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    global.window = originalWindow;
    // jest.clearAllMocks(); // Let's remove this to see, mocks are reset in beforeEach
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  test('getItem should retrieve and parse item from localStorage', () => {
    mockLocalStorage.getItem.mockReturnValueOnce(JSON.stringify({ data: 'test' }));
    const item = localStorageAdapter.getItem('myKey');
    expect(mockLocalStorage.getItem).toHaveBeenCalledWith('myKey');
    expect(item).toEqual({ data: 'test' });
  });

  test('getItem should return undefined if item not found', () => {
    mockLocalStorage.getItem.mockReturnValueOnce(null);
    const item = localStorageAdapter.getItem('myKey');
    expect(item).toBeUndefined();
  });

  test('getItem should return null on JSON parse error', () => {
    mockLocalStorage.getItem.mockReturnValueOnce('invalid json');
    const item = localStorageAdapter.getItem('myKey');
    expect(item).toBeNull();
    expect(console.error).toHaveBeenCalled();
  });

  test('getItem should return null if localStorage not available', () => {
    Object.defineProperty(global.window, 'localStorage', { value: undefined, configurable: true });
    const item = localStorageAdapter.getItem('myKey');
    expect(item).toBeNull();
    expect(console.warn).toHaveBeenCalledWith('localStorage is not available. Cannot getItem.');
  });


  test('setItem should stringify and store item in localStorage', () => {
    const value = { data: 'testValue' };
    localStorageAdapter.setItem('myKey', value);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('myKey', JSON.stringify(value));
  });

  test('setItem should not throw if localStorage not available but log warn', () => {
    Object.defineProperty(global.window, 'localStorage', { value: undefined, configurable: true });
    expect(() => localStorageAdapter.setItem('myKey', 'val')).not.toThrow();
    expect(console.warn).toHaveBeenCalledWith('localStorage is not available. Cannot setItem.');
  });

  test('setItem should log error if JSON.stringify fails', () => {
    const circularValue = {};
    circularValue.self = circularValue;
    localStorageAdapter.setItem('myKey', circularValue);
    expect(mockLocalStorage.setItem).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalled();
  });

  test('removeItem should remove item from localStorage', () => {
    localStorageAdapter.removeItem('myKey');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('myKey');
  });

  test('removeItem should not throw if localStorage not available but log warn', () => {
    Object.defineProperty(global.window, 'localStorage', { value: undefined, configurable: true });
    expect(() => localStorageAdapter.removeItem('myKey')).not.toThrow();
    expect(console.warn).toHaveBeenCalledWith('localStorage is not available. Cannot removeItem.');
  });
});
