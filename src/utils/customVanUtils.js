// src/utils/customVanUtils.js

let currentContext = null; // Tracks the currently running computation (derivation or add's effect)

function runAndTrackDependencies(computationFn, updateFn) {
  const oldContext = currentContext;
  currentContext = updateFn; // The "updateFn" is what gets registered as a dependent
  try {
    const result = computationFn(); // Execute the user's computation function
    updateFn(result); // Initial update with the result
    return result;
  } finally {
    currentContext = oldContext;
  }
}

export function state(initialValue) {
  const s = {
    _val: initialValue,
    _dependents: new Set(), // Stores functions that depend on this state

    get val() {
      if (currentContext) {
        s._dependents.add(currentContext); // Register the current computation
      }
      return s._val;
    },

    set val(newValue) {
      if (s._val !== newValue) {
        s._val = newValue;
        // Notify all dependents
        // Iterate over a copy in case a dependent modifies the set during iteration (though less likely here)
        [...s._dependents].forEach((dep) => dep());
      }
    },

    // For direct subscription if ever needed, not strictly part of VanJS core API this way
    // but useful for understanding. `derive` and `add` are the primary consumers.
    _subscribe(dependentFn) {
      s._dependents.add(dependentFn);
    },
    _unsubscribe(dependentFn) {
      s._dependents.delete(dependentFn);
    },
  };
  return s;
}

export function derive(computationFn) {
  let derivedVal; // Holds the current value of the derivation

  // The update function for this derivation. It re-runs the computation
  // and updates derivedVal. This is what gets registered with dependency states.
  const updater = () => {
    // Re-run the computation. Dependencies will be re-tracked automatically
    // because currentContext will be set to this updater again.
    // However, for simple derive, we don't want `derive` itself to be a dependency of its own computation.
    // The dependencies are purely from `computationFn` to the states it reads.
    const oldContext = currentContext;
    currentContext = updater; // Register this updater for states accessed by computationFn
    try {
      derivedVal = computationFn();
    } finally {
      currentContext = oldContext;
    }
    // Unlike state's setter, derive doesn't trigger its own _dependents here.
    // If a derived state is used in another derivation, that outer derivation
    // will have its own updater registered when `derived.val` is accessed.
  };

  // Initial computation and dependency tracking
  const oldContext = currentContext;
  currentContext = updater; // Set this updater as the one to be subscribed by states accessed in computationFn
  try {
    derivedVal = computationFn();
  } finally {
    currentContext = oldContext;
  }

  // The returned object for a derivation. It's like a state but its .val is not directly settable.
  const derivedState = {
    _dependents: new Set(), // Derived states can also be dependencies for other derivations

    get val() {
      if (currentContext) {
        derivedState._dependents.add(currentContext);
      }
      return derivedVal;
    },
    // No setter for derived state's .val externally.
    // Internal update function that also notifies dependents of the derived state
    _updateAndNotify() {
      const oldInternalVal = derivedVal;
      const oldCtx = currentContext;
      currentContext = derivedState._updateAndNotify; // This derived state's update function is the context for its computation
      try {
        derivedVal = computationFn();
      } finally {
        currentContext = oldCtx;
      }

      if (oldInternalVal !== derivedVal) {
        [...derivedState._dependents].forEach((dep) => dep());
      }
    },
  };

  // Initial run and dependency tracking for the derived state.
  // The function that states subscribe to is the one that updates this derived state's value AND notifies its dependents.
  const oldCtxForInitialRun = currentContext;
  currentContext = derivedState._updateAndNotify;
  try {
    derivedState._updateAndNotify(); // Run once to set initial value and track dependencies
  } finally {
    currentContext = oldCtxForInitialRun;
  }

  return derivedState;
}

export function add(parentElement, childSource) {
  let currentDOMNodes = []; // Keep track of DOM nodes added by this function

  const updateDOM = (newValue) => {
    // Clear previous nodes
    currentDOMNodes.forEach((node) => {
      if (node.remove)
        node.remove(); // For DOM elements
      else if (node.parentNode) node.parentNode.removeChild(node); // For text nodes
    });
    currentDOMNodes = [];

    const appendChild = (child) => {
      if (child === null || child === undefined) return;
      if (Array.isArray(child)) {
        child.forEach(appendChild);
      } else {
        const node =
          typeof child === "string" || typeof child === "number"
            ? document.createTextNode(String(child))
            : child;
        parentElement.appendChild(node);
        currentDOMNodes.push(node);
      }
    };
    appendChild(newValue);
  };

  if (typeof childSource === "function") {
    // This is a reactive binding, setup derivation-like behavior
    const effectFn = () => {
      const newValue = childSource(); // Run the user's function to get the new value/DOM node
      updateDOM(newValue);
    };

    // Run and track dependencies for the effect
    const oldContext = currentContext;
    currentContext = effectFn; // The effectFn is what gets registered as a dependent
    try {
      effectFn(); // Initial run to set DOM and track dependencies
    } finally {
      currentContext = oldContext;
    }
  } else {
    // Static content, just add it once
    updateDOM(childSource);
  }
  // `add` doesn't return a state-like object, it's a side-effect function.
}

// Mock document and TextNode for environments without DOM (like this test environment)
// This is very basic and only for the `add` function to not throw errors.
if (typeof document === "undefined") {
  global.document = {
    createTextNode: (text) => ({
      nodeType: 3,
      textContent: text,
      remove: function () {
        this.parentNode = null;
      }, // mock removal
      parentNode: null, // mock parent
    }),
    createElement: (tagName) => ({
      nodeType: 1,
      tagName: tagName.toUpperCase(),
      children: [],
      appendChild: function (child) {
        this.children.push(child);
        child.parentNode = this;
      },
      removeChild: function (child) {
        const index = this.children.indexOf(child);
        if (index > -1) this.children.splice(index, 1);
        child.parentNode = null;
      },
      innerHTML: "", // roughly for clearing
      remove: function () {
        this.parentNode = null;
      },
    }),
  };
  global.Node = { TEXT_NODE: 3, ELEMENT_NODE: 1 };
}
