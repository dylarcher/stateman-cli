/**
 * @jest-environment jsdom
 */
import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
// Use our custom VanJS utilities
import { add as customAdd } from '../../src/utils/customVanUtils.js';
import { createScopedState } from '../../src/scopedState.js'; // This now uses our custom state/derive
import {
  bindProperty,
  bindAttribute,
  bindTextContent,
  bindChildren,
  bindChildrenWithVanAdd
} from '../../src/utils/domBinding.js';

describe('DOM Binding Utilities', () => {
  let element;
  let consoleErrorSpy;

  beforeEach(() => {
    element = document.createElement('div');
    document.body.appendChild(element);
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    if (document.body.contains(element)) {
      document.body.removeChild(element);
    }
    consoleErrorSpy.mockRestore();
  });

  describe('bindProperty', () => {
    test('should reactively update element property', async () => {
      const state = createScopedState('initialText');
      bindProperty(element, 'textContent', state);
      expect(element.textContent).toBe('initialText');
      state.val = 'newText';
      await new Promise(r => setTimeout(r, 0));
      expect(element.textContent).toBe('newText');
    });

    test('should log error with invalid arguments', () => {
      bindProperty(null, 'textContent', createScopedState(''));
      expect(consoleErrorSpy).toHaveBeenCalledWith('Invalid arguments for bindProperty: element, propertyName, and scopedState (with .val) are required.');
    });
  });

  describe('bindAttribute', () => {
    test('should reactively update element attribute', async () => {
      const state = createScopedState('initial-class');
      bindAttribute(element, 'class', state);
      expect(element.getAttribute('class')).toBe('initial-class');
      state.val = 'new-class';
      await new Promise(r => setTimeout(r, 0));
      expect(element.getAttribute('class')).toBe('new-class');
    });

    test('should handle boolean attributes', async () => {
      const state = createScopedState(true);
      bindAttribute(element, 'disabled', state);
      expect(element.hasAttribute('disabled')).toBe(true);
      expect(element.getAttribute('disabled')).toBe('');

      state.val = false;
      await new Promise(r => setTimeout(r, 0));
      expect(element.hasAttribute('disabled')).toBe(false);
    });

    test('should log error with invalid arguments', () => {
      bindAttribute(null, 'class', createScopedState(''));
      expect(consoleErrorSpy).toHaveBeenCalledWith('Invalid arguments for bindAttribute: element, attributeName, and scopedState (with .val) are required.');
    });
  });

  describe('bindTextContent', () => {
    test('should be a shortcut for bindProperty with textContent', async () => {
      const state = createScopedState('hello');
      bindTextContent(element, state);
      expect(element.textContent).toBe('hello');
      state.val = 'world';
      await new Promise(r => setTimeout(r, 0));
      expect(element.textContent).toBe('world');
    });
  });

  describe('bindChildren', () => {
    test('should reactively replace children with text', async () => {
      const state = createScopedState('Child Text 1');
      bindChildren(element, state); // Corrected: parentElement should be element
      expect(element.textContent).toBe('Child Text 1');
      state.val = 'Child Text 2';
      await new Promise(r => setTimeout(r, 0));
      expect(element.textContent).toBe('Child Text 2');
    });

    test('should reactively replace children with a DOM element', async () => {
      const child1 = document.createElement('span');
      child1.textContent = 'Span 1';
      const child2 = document.createElement('p');
      child2.textContent = 'Paragraph 2';

      const state = createScopedState(child1);
      bindChildren(element, state); // Corrected: parentElement should be element
      expect(element.firstChild).toBe(child1);
      expect(element.textContent).toBe('Span 1');

      state.val = child2;
      await new Promise(r => setTimeout(r, 0));
      expect(element.firstChild).toBe(child2);
      expect(element.textContent).toBe('Paragraph 2');
    });

    test('should reactively replace children with an array of elements/text', async () => {
      const span = document.createElement('span');
      span.textContent = 'Span';
      const state = createScopedState([span, " and text"]);
      bindChildren(element, state); // Corrected: parentElement should be element
      expect(element.children.length).toBe(1);
      expect(element.childNodes[0]).toBe(span);
      expect(element.childNodes[1].textContent).toBe(" and text");

      state.val = "Just text now";
      await new Promise(r => setTimeout(r, 0));
      expect(element.children.length).toBe(0);
      expect(element.textContent).toBe("Just text now");
    });

    test('should clear children if state value is null or undefined', async () => {
        element.appendChild(document.createElement('p')); // Add initial child
        const state = createScopedState(null); // State starts as null
        bindChildren(element, state); // Corrected: parentElement should be element; Bind
        await new Promise(r => setTimeout(r,0)); // Wait for derivation
        expect(element.hasChildNodes()).toBe(false); // Should be empty

        state.val = "something"; // Add content
        await new Promise(r => setTimeout(r,0));
        expect(element.textContent).toBe("something");

        // Corrected: Test one state change at a time for clarity in this test case
        // element.appendChild(document.createElement('p')); // Add another child manually
        state.val = undefined; // Set state to undefined
        await new Promise(r => setTimeout(r,0));
        expect(element.hasChildNodes()).toBe(false); // Should be empty again
    });

    test('should log error with invalid arguments for bindChildren', () => {
        bindChildren(null, createScopedState(''));
        expect(consoleErrorSpy).toHaveBeenCalledWith('Invalid arguments for bindChildren: parentElement and scopedState (with .val) are required.');
    });
  });

  describe('bindChildrenWithVanAdd', () => {
    test('should use custom add to bind children reactively', async () => {
        const p = document.createElement('p');
        p.textContent = "Custom VanJS Child 1";
        const state = createScopedState(p); // createScopedState uses our custom state

        bindChildrenWithVanAdd(element, state);
        await new Promise(r => setTimeout(r,0)); // Allow for async updates if any (though our add is sync)
        expect(element.firstChild.tagName).toBe("P");
        expect(element.firstChild.textContent).toBe("Custom VanJS Child 1");

        const div = document.createElement('div');
        div.textContent = "Custom VanJS Child 2";
        state.val = div; // Update the state's value
        await new Promise(r => setTimeout(r,0));
        expect(element.firstChild.tagName).toBe("DIV");
        expect(element.firstChild.textContent).toBe("Custom VanJS Child 2");
    });

    test('should log error with invalid arguments for bindChildrenWithVanAdd', () => {
        bindChildrenWithVanAdd(null, createScopedState(''));
        expect(consoleErrorSpy).toHaveBeenCalledWith('Invalid arguments for bindChildrenWithVanAdd: parentElement and scopedState (with .val) are required.');
    });
  });
});
