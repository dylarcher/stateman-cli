import van from "vanjs-core";

/**
 * @file DOM Binding Utilities for VanJS states.
 * These helpers provide declarative ways to bind VanJS states to DOM elements.
 */

/**
 * Reactively sets a property of a DOM element to the value of a VanJS state.
 * @param {HTMLElement} element - The DOM element.
 * @param {string} propertyName - The name of the property to bind (e.g., 'value', 'textContent', 'className').
 * @param {object} scopedState - The VanJS state object (expected to have a .val property).
 * @returns {void}
 */
export function bindProperty(element, propertyName, scopedState) {
  if (
    !element ||
    typeof propertyName !== "string" ||
    !scopedState ||
    typeof scopedState.val === "undefined"
  ) {
    console.error(
      "Invalid arguments for bindProperty: element, propertyName, and scopedState (with .val) are required.",
    );
    return;
  }
  van.derive(() => {
    element[propertyName] = scopedState.val;
  });
}

/**
 * Reactively sets an attribute of a DOM element to the value of a VanJS state.
 * @param {HTMLElement} element - The DOM element.
 * @param {string} attributeName - The name of the attribute to bind.
 * @param {object} scopedState - The VanJS state object (expected to have a .val property).
 * @returns {void}
 */
export function bindAttribute(element, attributeName, scopedState) {
  if (
    !element ||
    typeof attributeName !== "string" ||
    !scopedState ||
    typeof scopedState.val === "undefined"
  ) {
    console.error(
      "Invalid arguments for bindAttribute: element, attributeName, and scopedState (with .val) are required.",
    );
    return;
  }
  van.derive(() => {
    if (typeof scopedState.val === "boolean") {
      if (scopedState.val) {
        element.setAttribute(attributeName, "");
      } else {
        element.removeAttribute(attributeName);
      }
    } else {
      element.setAttribute(attributeName, String(scopedState.val));
    }
  });
}

/**
 * Reactively sets the textContent of a DOM element to the value of a VanJS state.
 * @param {HTMLElement} element - The DOM element.
 * @param {object} scopedState - The VanJS state object (expected to have a .val property).
 * @returns {void}
 */
export function bindTextContent(element, scopedState) {
  bindProperty(element, "textContent", scopedState);
}

/**
 * Reactively replaces the children of a DOM element with the value of a VanJS state.
 * The state value should be a DOM node, a string, or an array of these, or null/undefined to clear.
 * @param {HTMLElement} parentElement - The DOM element whose children will be replaced.
 * @param {object} scopedState - The VanJS state object (expected to have a .val property).
 * @returns {void}
 */
export function bindChildren(parentElement, scopedState) {
  if (
    !parentElement ||
    !scopedState ||
    typeof scopedState.val === "undefined"
  ) {
    console.error(
      "Invalid arguments for bindChildren: parentElement and scopedState (with .val) are required.",
    );
    return;
  }
  van.derive(() => {
    const newContent = scopedState.val;
    while (parentElement.firstChild) {
      parentElement.removeChild(parentElement.firstChild);
    }
    if (newContent !== null && newContent !== undefined) {
      if (Array.isArray(newContent)) {
        parentElement.append(...newContent);
      } else {
        parentElement.append(newContent);
      }
    }
  });
}

/**
 * A more idiomatic VanJS way to bind children using van.add.
 * This allows VanJS to manage the lifecycle of the children if they are VanJS components.
 * @param {HTMLElement} parentElement - The DOM element to add children to.
 * @param {object} scopedState - The VanJS state object whose .val will be rendered as children.
 * @returns {ChildNode | ChildNode[] | undefined} The DOM element(s) rendered by VanJS, or undefined if arguments are invalid.
 */
export function bindChildrenWithVanAdd(parentElement, scopedState) {
  if (
    !parentElement ||
    !scopedState ||
    typeof scopedState.val === "undefined"
  ) {
    console.error(
      "Invalid arguments for bindChildrenWithVanAdd: parentElement and scopedState (with .val) are required.",
    );
    return undefined;
  }
  return van.add(parentElement, () => scopedState.val);
}
