# Portion: Dependency Injector

## 1. Dependency Injector: Overview & Purpose

The Dependency Injector is a core concept in DepState, designed to manage external services, API clients, or utilities required by your state logic. It is not a separate module to be configured but rather an integrated feature of the global store. Its primary purpose is to make asynchronous action creators (thunks) more testable and decoupled from the concrete implementations of the services they use.

## 2. Logic and Mechanism

* **Registration via `createGlobalStore`:** Dependencies are "registered" by passing a plain JavaScript object to the `dependencies` key in the `createGlobalStore` configuration. The keys of this object serve as the names of the dependencies, and the values are the services themselves (e.g., class instances, objects with methods).

    ```javascript
    const myApiService = new ApiService();
    const myLogger = new Logger();

    const store = createGlobalStore({
      reducer: rootReducer,
      dependencies: {
        api: myApiService,
        logger: myLogger
      }
    });
    ```

* **Injection into Thunks:** The `thunkMiddleware` (which is included by default in `createGlobalStore`) is DI-aware. When it executes a thunk, it passes the entire `dependencies` object as the third argument to the thunk function.

    `(dispatch, getState, dependencies) => { /* ... */ }`

## 3. Usage Guide

### Providing Dependencies

Provide all dependencies during store creation.

```javascript
// services.js
export const apiService = {
  fetchData: async (id) => {
    const response = await fetch(`/api/data/${id}`);
    return response.json();
  }
};

export const loggerService = {
  log: (message) => console.log(message)
};

// store.js
import { createGlobalStore } from './depstate.js';
import { apiService, loggerService } from './services.js';
import rootReducer from './reducers.js';

const store = createGlobalStore({
  reducer: rootReducer,
  dependencies: {
    api: apiService,
    logger: loggerService
  }
});

Using Injected Dependencies in a Thunk
You can destructure the dependencies object in your thunk's argument list to easily access the services you need.

// actions.js
export function fetchDataForUser(userId) {
  // This is a DI-aware thunk
  return async (dispatch, getState, { api, logger }) => {
    try {
      logger.log(`Fetching data for user: ${userId}`);
      dispatch({ type: 'DATA_FETCH_START' });

      const data = await api.fetchData(userId);

      dispatch({ type: 'DATA_FETCH_SUCCESS', payload: data });
    } catch (error) {
      logger.log(`Error fetching data: ${error.message}`);
      dispatch({ type: 'DATA_FETCH_FAILURE', payload: error.message });
    }
  };
}

Testing with Mock Dependencies
The primary benefit of this pattern is simplified testing. You can test your thunks in isolation by providing mock dependencies.

// actions.test.js
import { fetchDataForUser } from './actions.js';

test('fetchDataForUser dispatches success on successful API call', async () => {
  const mockDispatch = jest.fn();
  const mockGetState = () => ({}); // Mock state if needed

  // Create mock dependencies for this test case
  const mockDependencies = {
    api: {
      fetchData: jest.fn().mockResolvedValue({ id: 1, name: 'Test' })
    },
    logger: {
      log: jest.fn()
    }
  };

  // Execute the thunk with mocks
  await fetchDataForUser(1)(mockDispatch, mockGetState, mockDependencies);

  // Assert that the correct actions were dispatched
  expect(mockDispatch.mock.calls[0][0]).toEqual({ type: 'DATA_FETCH_START' });
  expect(mockDispatch.mock.calls[1][0]).toEqual({
    type: 'DATA_FETCH_SUCCESS',
    payload: { id: 1, name: 'Test' }
  });
  expect(mockDependencies.api.fetchData).toHaveBeenCalledWith(1);
  expect(mockDependencies.logger.log).toHaveBeenCalledWith('Fetching data for user: 1');
});
