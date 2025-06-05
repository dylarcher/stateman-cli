import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import thunk from '../src/middleware/thunk.js';
import { createGlobalStore } from '../src/globalStore.js';
import applyMiddleware from '../src/applyMiddleware.js';
import { fromJS } from 'immutable';

describe('thunkMiddleware', () => {
  let store;
  const initialState = fromJS({ data: null, loading: false });
  const reducer = (state = initialState, action) => {
    switch (action.type) {
      case 'FETCH_START':
        return state.set('loading', true);
      case 'FETCH_SUCCESS':
        return state.merge({ loading: false, data: fromJS(action.payload) });
      default:
        return state;
    }
  };

  beforeEach(() => {
    store = createGlobalStore(reducer, initialState, applyMiddleware(thunk));
  });

  test('should pass through normal actions', () => {
    store.dispatch({ type: 'FETCH_START' });
    expect(store.getState().get('loading')).toBe(true);
  });

  test('should execute function actions (thunks)', () => {
    const thunkAction = (dispatch, getState) => {
      expect(dispatch).toBeInstanceOf(Function);
      expect(getState).toBeInstanceOf(Function);
      dispatch({ type: 'FETCH_SUCCESS', payload: { value: 'from thunk' } });
    };
    store.dispatch(thunkAction);
    expect(store.getState().get('data').get('value')).toBe('from thunk');
    expect(store.getState().get('loading')).toBe(false); // Assuming FETCH_SUCCESS sets loading to false
  });

  test('thunk can dispatch other thunks', () => {
    const nestedThunk = (dispatch, getState) => {
      dispatch({ type: 'FETCH_SUCCESS', payload: { nested: true } });
    };
    const parentThunk = (dispatch, getState) => {
      dispatch({ type: 'FETCH_START' });
      dispatch(nestedThunk);
    };
    store.dispatch(parentThunk);
    expect(store.getState().get('loading')).toBe(false);
    expect(store.getState().getIn(['data', 'nested'])).toBe(true);
  });

  test('thunk should receive the latest state via getState', (done) => {
    const firstAction = { type: 'FETCH_START' };
    const thunkAction = (dispatch, getState) => {
      expect(getState().get('loading')).toBe(true); // Check state after firstAction
      dispatch({ type: 'FETCH_SUCCESS', payload: "done" });
      expect(getState().get('loading')).toBe(false);
      done();
    };
    store.dispatch(firstAction);
    store.dispatch(thunkAction);
  });
});
