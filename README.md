# STATEMAN

> Vanilla JavaScript &middot; State Management &middot; CLI Tool &middot; NPM Library

Leveraging the industry's best to build a unified, powerful, and developer-friendly state solution in Vanilla JS.

## Core Purpose & Goals

The STATEMAN library aims to provide a hybrid "all-in-one" state management solution for JavaScript applications. It combines the strengths of established patterns like Redux with lightweight, reactive scoped states inspired by VanJS.

The core philosophy is founded on three key architectural pillars:
1.  **Dual-Store Architecture:** A powerful global store for application-wide state, paired with lightweight, private scoped states for individual components.
2.  **Guaranteed Immutability:** Enforcing data integrity and predictable state changes in the global store, preventing side-effects and enabling advanced features.
3.  **Native Enhancement:** Designed to augment, not replace, native platform features like Web Component state and the DOM event model.

## Key Features / Modules

### A Tale of Two Stores
The architecture provides two distinct but connected state management models to fit any use case.

#### The Global Store
For centralized, predictable application-wide state.
- UI Event: TBD
- `store.dispatch(action)`: TBD
- Middleware Chain: TBD
- Pure Reducer: TBD
- New Immutable State: TBD

#### Scoped State
For localized, reactive component-level state.
- Component Initialized: TBD
- `createScopedState(value)`: TBD
- `state.val = newValue`: TBD
- Direct DOM Update: TBD
- UI Reflects Change: TBD

### The Power of Synergy
The library's initial strength comes from unifying the best features of established tools:
- **Redux:** Provides the predictable state container pattern.
- **VanJS:** Powers the reactive, lightweight scoped states.
- **Immutable.js:** Ensures data integrity and performance.
- **Killa.js:** Inspires the flexible state persistence layer.

### The Bridge: Connecting Worlds
A controlled interface allows scoped components to safely read from or dispatch actions to the global store.
- **Scoped Component:**
    - `getGlobalState(selector)`: TBD
    - `dispatchGlobal(action)`: TBD

### API Inspiration
The library's API design is a synthesis of familiar and powerful patterns. This chart illustrates the proportional influence of source libraries on the design of the core public API, showcasing the "piecemeal" approach to creating a comprehensive and intuitive developer experience.

## Getting Started / Installation

### Prerequisites
- [Placeholder for prerequisites]

### Installation Steps
- [Placeholder for installation steps]

### Basic Usage
- [Placeholder for basic usage examples]

## Folder Structure

```bash
depstate/
├── dist/                     # Distribution files (after build)
│   ├── depstate.esm.js       # ES Module build
│   └── depstate.cjs.js       # CommonJS build
├── docs/                     # Documentation files (Markdown)
│   ├── README.md             # Main documentation entry (can be a copy of the root README)
│   ├── Core_Concepts.md
│   ├── Store_Portion.md
│   ├── Scoped_State_Portion.md
│   ├── Dependency_Injector_Portion.md
│   ├── API_Reference.md
│   └── Examples.md
├── src/                      # Source code
│   ├── index.js              # Main library entry point (exports all public APIs)
│   ├── globalStore.js        # Logic for createGlobalStore, combineReducers
│   ├── scopedState.js        # Logic for createScopedState, deriveScopedState
│   ├── middleware/
│   │   └── thunk.js          # DI-aware thunk middleware (can be imported separately)
│   └── utils/                # Utility functions (e.g., for Immutable.js helpers, if any)
│       └── immutableUtils.js # (Placeholder for potential Immutable.js helpers)
├── test/                     # Unit and integration tests (examples)
│   ├── globalStore.test.js
│   ├── scopedState.test.js
│   └── middleware/
│       └── thunk.test.js
├── .eslintrc.json           # ESLint configuration (example)
├──.gitignore                # Git ignore file
├── LICENSE                   # License file (e.g., MIT)
├── package.json              # Project metadata and dependencies
└── README.md                 # Project README
```

## Roadmap to Independence
A phased approach ensures a stable evolution towards a fully dependency-free library.

| # | Phase | Description |
| --- | --- | --- |
| 1 | Core Functionality | Implement the dual-store architecture, the bridge API, and establish comprehensive testing. |
| 2 | Enhancements & DX | Integrate Redux DevTools, implement the middleware system, and add state persistence. |
| 3 | Expansion & Refinement | Create a full build system and begin incrementally replacing dependencies with custom code. |


## How to Contribute
We welcome contributions! Please see our [Contributing Guidelines](.github/CONTRIBUTING.md) for more information on how to get started.

## License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---
> An infographic based on the [deep research report](./research.pdf) for a hybrid state management library.
