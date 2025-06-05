/**
 * A simple thunk middleware.
 * Allows action creators to return a function instead of an action object.
 * The returned function (thunk) receives `dispatch` and `getState` as arguments.
 */
const thunk = store => next => action => {
  if (typeof action === 'function') {
    return action(store.dispatch, store.getState);
  }
  return next(action);
};

export default thunk;
