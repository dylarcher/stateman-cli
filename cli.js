#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import { createGlobalStore, createScopedState, fromJS } from './src/index.js'; // Adjust path if running from root

// --- Global Store Example ---
const initialGlobalState = fromJS({
  user: null,
  counter: 0,
  items: [],
});

const actionTypes = {
  SET_USER: 'SET_USER',
  INCREMENT: 'INCREMENT',
  ADD_ITEM: 'ADD_ITEM',
};

function globalReducer(state = initialGlobalState, action) {
  switch (action.type) {
    case actionTypes.SET_USER:
      return state.set('user', fromJS(action.payload));
    case actionTypes.INCREMENT:
      return state.update('counter', count => count + 1);
    case actionTypes.ADD_ITEM:
      return state.update('items', items => items.push(fromJS(action.payload)));
    default:
      return state;
  }
}

const globalStore = createGlobalStore(globalReducer, initialGlobalState);

// --- Scoped State Example ---
const myScopedState = createScopedState('initial_scoped_value');
const derivedScopedState = deriveScopedState(() => myScopedState.get().length); // Reactive derived value based on myScopedState
const bridgedScopedState = createScopedState({ localData: 'local' }, { globalStore });


yargs(hideBin(process.argv))
  .command('global:getState', 'Get the current global state', () => {
    console.log('Current Global State:');
    console.log(JSON.stringify(globalStore.getState().toJS(), null, 2));
  })
  .command('global:dispatch:increment', 'Dispatch INCREMENT action to global store', () => {
    console.log('Dispatching INCREMENT...');
    globalStore.dispatch({ type: actionTypes.INCREMENT });
    console.log('New Global State:');
    console.log(JSON.stringify(globalStore.getState().toJS(), null, 2));
  })
  .command('global:dispatch:setUser [name]', 'Dispatch SET_USER action', (yargs) => {
    return yargs.positional('name', {
      describe: 'Name of the user',
      type: 'string',
      default: 'CLI User'
    });
  }, (argv) => {
    console.log(`Dispatching SET_USER with name: ${argv.name}...`);
    globalStore.dispatch({ type: actionTypes.SET_USER, payload: { name: argv.name, id: Date.now() } });
    console.log('New Global State:');
    console.log(JSON.stringify(globalStore.getState().toJS(), null, 2));
  })
  .command('global:dispatch:addItem [item]', 'Dispatch ADD_ITEM action', (yargs) => {
    return yargs.positional('item', {
        describe: 'Item to add (string)',
        type: 'string',
        default: 'default_item'
    })
  }, (argv) => {
    console.log(`Dispatching ADD_ITEM with item: ${argv.item}...`);
    globalStore.dispatch({ type: actionTypes.ADD_ITEM, payload: { name: argv.item, id: Date.now() } });
    console.log('New Global State:');
    console.log(JSON.stringify(globalStore.getState().toJS(), null, 2));
  })
  .command('scoped:getVal', 'Get the value of myScopedState', () => {
    console.log('myScopedState.val:', myScopedState.val);
  })
  .command('scoped:setVal [value]', 'Set the value of myScopedState', (yargs) => {
    return yargs.positional('value', {
      describe: 'New value for scoped state',
      type: 'string',
      default: 'new_cli_value'
    });
  }, (argv) => {
    console.log(`Setting myScopedState.val to: ${argv.value}...`);
    myScopedState.val = argv.value;
    console.log('myScopedState.val after set:', myScopedState.val);
  })
  .command('bridge:getGlobalCounter', 'Use bridged scoped state to get global counter', () => {
    const counter = bridgedScopedState.getGlobal(state => state.get('counter'));
    console.log('Counter from global store via bridged scoped state:', counter);
  })
  .command('bridge:dispatchIncrement', 'Use bridged scoped state to dispatch INCREMENT to global store', () => {
    console.log('Dispatching INCREMENT via bridged scoped state...');
    bridgedScopedState.dispatchGlobal({ type: actionTypes.INCREMENT });
    const counter = bridgedScopedState.getGlobal(state => state.get('counter'));
    console.log('New global counter via bridged state:', counter);
    console.log('Full Global State:');
    console.log(JSON.stringify(globalStore.getState().toJS(), null, 2));
  })
  .demandCommand(1, 'You need at least one command before moving on')
  .strict()
  .help()
  .argv;
