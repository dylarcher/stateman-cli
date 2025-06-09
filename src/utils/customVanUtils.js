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
        // If this derived state is used in another computation,
        // that computation depends on this derived state.
        // This derivedState's `updater` function is what needs to be run
        // if one of *its* dependencies changes.
        // The `currentContext` (of the outer computation) needs to be notified
        // when `derivedVal` changes.
        // This is tricky: a derived state's value changes when its *own* updater runs.
        // So, the dependents of a derived state are essentially depending on its `updater` to have run.
        // For now, let's assume `derive` doesn't directly trigger its own dependents when its value changes.
        // Instead, if a `derive` is nested, the outer `derive` will re-evaluate and get the new `.val`.
        // This model might be too simple for complex chains.
        // A more robust model would have derivedState also call its own _dependents when its value changes.
        // Let's refine this: when derivedState.val is read, currentContext depends on it.
        // When derivedVal is updated by its *own* updater, it should notify its dependents.
        // So, the updater needs to also call derivedState._dependents.

        // Let's re-think the updater for derive:
        // The updater for derive should:
        // 1. Re-calculate its own value.
        // 2. If its value changed, notify *its* dependents.
        // This means `derive` itself needs a mechanism like state's setter.

        // Let's stick to the simpler model first based on the prompt, where derive creates a readonly .val
        // and re-computation is handled by the initial setup.
        // If `d1 = derive(() => s1.val + s2.val)`
        // and `d2 = derive(() => d1.val * 2)`
        // When s1 changes, d1's updater runs, d1.val changes.
        // Then d2's updater (which depends on d1.val) must run.
        // This means d1.val getter must register d2's updater.
        // And when d1's internal value changes, it must trigger its dependents.

        // Corrected getter for derivedState:
        if (currentContext) {
          derivedState._dependents.add(currentContext);
        }
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
