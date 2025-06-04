# STATEMAN

## Architecting a Hybrid "all-in-one" State Manager

> Vanilla JavaScript &middot; State Management &middot; CLI Tool &middot; NPM Library

Leveraging the industry's best to build a unified, powerful, and developer-friendly state solution in Vanilla JS.

### The Core Philosophy

The library is founded on three key architectural pillars designed for flexibility and power.

| # | Phase | Description |
| --- | --- | --- |
| 1 | Dual-Store Architecture | A powerful global store for application-wide state, paired with lightweight, private scoped states for individual components. |
| 2 | Guaranteed Immutability | Enforcing data integrity and predictable state changes in the global store, preventing side-effects and enabling advanced features. |
| 3 | Native Enhancement| Designed to augment, not replace, native platform features like Web Component state and the DOM event model. |

### A Tale of Two Stores

The architecture provides two distinct but connected state management models to fit any use case.

#### The Global Store

For centralized, predictable application-wide state.

- **UI Event:** TBD
- **\`store.dispatch(action)\`:** TBD
- **Middleware Chain:** TBD
- **Pure Reducer:** TBD
- **New Immutable State:** TBD

#### Scoped State

For localized, reactive component-level state.

- **Component Initialized:** TBD
- **\`createScopedState(value)\`:** TBD
- **\`state.val = newValue\`:** TBD
- **Direct DOM Update:** TBD
- **UI Reflects Change:** TBD

### The Power of Synergy

The library's initial strength comes from unifying the best features of established tools.

| # | Phase | Description |
| --- | --- | --- |
| 1 | Redux | Provides the predictable state container pattern. |
| 2 | VanJS | Powers the reactive, lightweight scoped states. |
| 3 | Immutable.js | Ensures data integrity and performance. |
| 4 | Killa.js | Inspires the flexible state persistence layer. |

### The Bridge: Connecting Worlds

A controlled interface allows scoped components to safely read from or dispatch actions to the global store.

#### Scoped Component

- **\`getGlobalState(selector)\`:** TBD
- **\`dispatchGlobal(action)\`:** TBD

### API Inspiration

The library's API design is a synthesis of familiar and powerful patterns.

This chart illustrates the proportional influence of source libraries on the design of the core public API, showcasing the "piecemeal" approach to creating a comprehensive and intuitive developer experience.

### Roadmap to Independence

A phased approach ensures a stable evolution towards a fully dependency-free library.

| # | Phase | Description |
| --- | --- | --- |
| 1 | Core Functionality | Implement the dual-store architecture, the bridge API, and establish comprehensive testing. |
| 2 | Enhancements & DX | Integrate Redux DevTools, implement the middleware system, and add state persistence. |
| 3 | Expansion & Refinement | Create a full build system and begin incrementally replacing dependencies with custom code. |

---

> An infographic based on the [deep research report](./research.pdf) for a hybrid state management library.
