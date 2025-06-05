/**
 * A simple logging middleware.
 * Logs actions and the new state after the action is dispatched.
 */
const logger = store => next => action => {
  console.group(action.type || 'Unknown Action');
  console.info('dispatching', action);
  let result = next(action);
  try {
    // Check if getState returns an immutable object and convert to JS for logging
    const state = store.getState();
    if (state && typeof state.toJS === 'function') {
      console.log('next state', state.toJS());
    } else {
      console.log('next state', state);
    }
  } catch (e) {
    console.error('Error getting state for logger:', e);
    // Avoid calling store.getState() again if it already failed.
    console.log('next state (raw)', '[Error retrieving state]');
  }
  console.groupEnd();
  return result;
};

export default logger;
