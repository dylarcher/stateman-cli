/**
 * Composes single-argument functions from right to left.
 * This is a basic version of compose, often found in Redux.
 * @param {...function} funcs The functions to compose.
 * @returns {function} A function composed of the input functions.
 */
export function compose(...funcs) {
  if (funcs.length === 0) {
    return arg => arg;
  }
  if (funcs.length === 1) {
    return funcs[0];
  }
  return funcs.reduce((a, b) => (...args) => a(b(...args)));
}

/**
 * Creates a store enhancer that applies middleware to the dispatch method
 * of the Redux store. This is compatible with the Redux middleware API.
 * @param {...function} middlewares The middleware chain to be applied.
 * @returns {function} A store enhancer applying the middleware.
 */
export default function applyMiddleware(...middlewares) {
  return (createStore) => (reducer, initialState) => {
    const store = createStore(reducer, initialState);
    let dispatch = () => {
      throw new Error(
        'Dispatching while constructing your middleware is not allowed. ' +
        'Other middleware would not be applied to this dispatch.'
      );
    };

    const middlewareAPI = {
      getState: store.getState,
      dispatch: (action, ...args) => dispatch(action, ...args),
    };

    const chain = middlewares.map(middleware => middleware(middlewareAPI));
    dispatch = compose(...chain)(store.dispatch);

    return {
      ...store,
      dispatch,
    };
  };
}
