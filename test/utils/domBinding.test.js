import { describe, it as test, mock, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { JSDOM } from 'jsdom';
import van from 'vanjs-core';
import { createScopedState } from '../../src/scopedState.js';
import {
  bindProperty,
  bindAttribute,
  bindTextContent,
  bindChildren,
  bindChildrenWithVanAdd
} from '../../src/utils/domBinding.js';

// JSDOM setup
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.document = dom.window.document;
global.window = dom.window;
global.HTMLElement = dom.window.HTMLElement;
global.Node = dom.window.Node; // Needed for van.js or other DOM manipulations

describe('DOM Binding Utilities', () => {
  let element;
  let consoleErrorSpy;

  beforeEach(() => {
    element = document.createElement('div');
    document.body.appendChild(element);
    consoleErrorSpy = mock.method(console, 'error', () => {});
  });

  afterEach(() => {
    if (document.body.contains(element)) {
      document.body.removeChild(element);
    }
    consoleErrorSpy.mock.restore();
  });

  describe('bindProperty', () => {
    test('should reactively update element property', async () => {
      const state = createScopedState('initialText');
      bindProperty(element, 'textContent', state);
      assert.strictEqual(element.textContent, 'initialText');
      state.val = 'newText';
      await new Promise(r => setTimeout(r, 0));
      assert.strictEqual(element.textContent, 'newText');
    });

    test('should log error with invalid arguments', () => {
      bindProperty(null, 'textContent', createScopedState(''));
      assert(consoleErrorSpy.mock.calls.some(call => call.arguments[0] === 'Invalid arguments for bindProperty: element, propertyName, and scopedState (with .val) are required.'));
    });
  });

  describe('bindAttribute', () => {
    test('should reactively update element attribute', async () => {
      const state = createScopedState('initial-class');
      bindAttribute(element, 'class', state);
      assert.strictEqual(element.getAttribute('class'), 'initial-class');
      state.val = 'new-class';
      await new Promise(r => setTimeout(r, 0));
      assert.strictEqual(element.getAttribute('class'), 'new-class');
    });

    test('should handle boolean attributes', async () => {
      const state = createScopedState(true);
      bindAttribute(element, 'disabled', state);
      assert.strictEqual(element.hasAttribute('disabled'), true);
      assert.strictEqual(element.getAttribute('disabled'), '');

      state.val = false;
      await new Promise(r => setTimeout(r, 0));
      assert.strictEqual(element.hasAttribute('disabled'), false);
    });

    test('should log error with invalid arguments', () => {
      bindAttribute(null, 'class', createScopedState(''));
      assert(consoleErrorSpy.mock.calls.some(call => call.arguments[0] === 'Invalid arguments for bindAttribute: element, attributeName, and scopedState (with .val) are required.'));
    });
  });

  describe('bindTextContent', () => {
    test('should be a shortcut for bindProperty with textContent', async () => {
      const state = createScopedState('hello');
      bindTextContent(element, state);
      assert.strictEqual(element.textContent, 'hello');
      state.val = 'world';
      await new Promise(r => setTimeout(r, 0));
      assert.strictEqual(element.textContent, 'world');
    });
  });

  describe('bindChildren', () => {
    test('should reactively replace children with text', async () => {
      const state = createScopedState('Child Text 1');
      bindChildren(element, state);
      assert.strictEqual(element.textContent, 'Child Text 1');
      state.val = 'Child Text 2';
      await new Promise(r => setTimeout(r, 0));
      assert.strictEqual(element.textContent, 'Child Text 2');
    });

    test('should reactively replace children with a DOM element', async () => {
      const child1 = document.createElement('span');
      child1.textContent = 'Span 1';
      const child2 = document.createElement('p');
      child2.textContent = 'Paragraph 2';

      const state = createScopedState(child1);
      bindChildren(element, state);
      assert.strictEqual(element.firstChild, child1);
      assert.strictEqual(element.textContent, 'Span 1');

      state.val = child2;
      await new Promise(r => setTimeout(r, 0));
      assert.strictEqual(element.firstChild, child2);
      assert.strictEqual(element.textContent, 'Paragraph 2');
    });

    test('should reactively replace children with an array of elements/text', async () => {
      const span = document.createElement('span');
      span.textContent = 'Span';
      const state = createScopedState([span, " and text"]);
      bindChildren(element, state);
      assert.strictEqual(element.children.length, 1);
      assert.strictEqual(element.childNodes[0], span);
      assert.strictEqual(element.childNodes[1].textContent, " and text");

      state.val = "Just text now";
      await new Promise(r => setTimeout(r, 0));
      assert.strictEqual(element.children.length, 0);
      assert.strictEqual(element.textContent, "Just text now");
    });

    test('should clear children if state value is null or undefined', async () => {
        element.appendChild(document.createElement('p'));
        const state = createScopedState(null);
        bindChildren(element, state);
        await new Promise(r => setTimeout(r,0));
        assert.strictEqual(element.hasChildNodes(), false);

        state.val = "something";
        await new Promise(r => setTimeout(r,0));
        assert.strictEqual(element.textContent, "something");

        state.val = undefined;
        await new Promise(r => setTimeout(r,0));
        assert.strictEqual(element.hasChildNodes(), false);
    });

    test('should log error with invalid arguments for bindChildren', () => {
        bindChildren(null, createScopedState(''));
        assert(consoleErrorSpy.mock.calls.some(call => call.arguments[0] === 'Invalid arguments for bindChildren: parentElement and scopedState (with .val) are required.'));
    });
  });

  describe('bindChildrenWithVanAdd', () => {
    test('should use van.add to bind children reactively', async () => {
        const state = createScopedState(van.tags.p("VanJS Child 1"));
        bindChildrenWithVanAdd(element, state);
        await new Promise(r => setTimeout(r,0));
        assert.strictEqual(element.firstChild.tagName, "P");
        assert.strictEqual(element.firstChild.textContent, "VanJS Child 1");

        state.val = van.tags.div("VanJS Child 2");
        await new Promise(r => setTimeout(r,0));
        assert.strictEqual(element.firstChild.tagName, "DIV");
        assert.strictEqual(element.firstChild.textContent, "VanJS Child 2");
    });

    test('should log error with invalid arguments for bindChildrenWithVanAdd', () => {
        bindChildrenWithVanAdd(null, createScopedState(''));
        assert(consoleErrorSpy.mock.calls.some(call => call.arguments[0] === 'Invalid arguments for bindChildrenWithVanAdd: parentElement and scopedState (with .val) are required.'));
    });
  });
});
