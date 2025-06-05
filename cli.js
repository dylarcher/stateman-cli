#!/usr/bin/env node
import yargs from 'yargs'
import { hideBin } from 'yargs/helpers'
import {
  createGlobalStore,
  createScopedState,
  fromJS,
  isImmutable // For immutable check demo
} from './src/index.js' // Adjust path if running from root

// --- Global Store Example ---
const initialGlobalState = fromJS({
  user: null,
  counter: 0,
  items: [],
})

const actionTypes = {
  // We'll keep these for actions not converted to store.actions for demonstration variety
  ADD_ITEM: 'ADD_ITEM',
}

// Define action creators for the new store.actions feature
const globalStoreActionCreators = {
  increment: (amount = 1) => ({ type: 'INCREMENT_COUNTER', payload: amount }),
  setUser: (name, id) => ({ type: 'SET_USER_DATA', payload: { name, id } }),
  // ADD_ITEM could also be here, but we'll leave one manual dispatch for variety
}

function globalReducer(state = initialGlobalState, action) {
  switch (action.type) {
    case 'INCREMENT_COUNTER': // Renamed to avoid conflict if old 'INCREMENT' was used elsewhere
      return state.update('counter', count => count + action.payload)
    case 'SET_USER_DATA': // Renamed
      return state.set('user', fromJS(action.payload))
    case actionTypes.ADD_ITEM:
      return state.update('items', items => items.push(fromJS(action.payload)))
    default:
      return state
  }
}

// Initialize globalStore with the new actions config
const globalStore = createGlobalStore(globalReducer, initialGlobalState, {
  actions: globalStoreActionCreators
})

// --- Scoped State Example ---
const myScopedState = createScopedState('initial_scoped_value')
const immutableScopedObj = createScopedState({ data: 'initial', nested: { value: 10 } }, { useImmutable: true })
const bridgedScopedState = createScopedState({ localData: 'local' }, { globalStore })


yargs(hideBin(process.argv))
  .command('global:getState', 'Get the current global state', () => {
    console.log('Current Global State:')
    console.log(JSON.stringify(globalStore.getState().toJS(), null, 2))
  })
  .command('global:action:increment [amount]', 'Dispatch INCREMENT action via store.actions', (yargs) => {
    return yargs.positional('amount', {
      describe: 'Amount to increment by',
      type: 'number',
      default: 1
    })
  }, (argv) => {
    console.log(`Dispatching INCREMENT via store.actions.increment(${argv.amount})...`)
    globalStore.actions.increment(argv.amount) // Using new ergonomic action
    console.log('New Global State:')
    console.log(JSON.stringify(globalStore.getState().toJS(), null, 2))
  })
  .command('global:action:setUser [name]', 'Dispatch SET_USER action via store.actions', (yargs) => {
    return yargs.positional('name', {
      describe: 'Name of the user',
      type: 'string',
      default: 'CLI User via Action'
    })
  }, (argv) => {
    console.log(`Dispatching SET_USER via store.actions.setUser('${argv.name}')...`)
    globalStore.actions.setUser(argv.name, Date.now()) // Using new ergonomic action
    console.log('New Global State:')
    console.log(JSON.stringify(globalStore.getState().toJS(), null, 2))
  })
  .command('global:dispatch:addItem [item]', 'Dispatch ADD_ITEM action (manual dispatch example)', (yargs) => {
    return yargs.positional('item', {
      describe: 'Item to add (string)',
      type: 'string',
      default: 'default_item_manual'
    })
  }, (argv) => {
    console.log(`Dispatching ADD_ITEM with item: ${argv.item} (manual dispatch)...`)
    globalStore.dispatch({ type: actionTypes.ADD_ITEM, payload: { name: argv.item, id: Date.now() } })
    console.log('New Global State:')
    console.log(JSON.stringify(globalStore.getState().toJS(), null, 2))
  })
  .command('scoped:getVal', 'Get the value of myScopedState', () => {
    console.log('myScopedState.val:', myScopedState.val)
  })
  .command('scoped:setVal [value]', 'Set the value of myScopedState', (yargs) => {
    return yargs.positional('value', {
      describe: 'New value for scoped state',
      type: 'string',
      default: 'new_cli_value'
    })
  }, (argv) => {
    console.log(`Setting myScopedState.val to: ${argv.value}...`)
    myScopedState.val = argv.value
    console.log('myScopedState.val after set:', myScopedState.val)
  })
  .command('scoped:getImmutable', 'Get value of immutableScopedObj and check type', () => {
    console.log('immutableScopedObj.val:', immutableScopedObj.val)
    console.log('Is it immutable?', isImmutable(immutableScopedObj.val)) // Demonstrate isImmutable util
    if (isImmutable(immutableScopedObj.val)) {
      console.log('Converted to JS for display:', immutableScopedObj.val.toJS())
    }
  })
  .command('scoped:setImmutable [jsonValue]', 'Set value of immutableScopedObj (note: CLI demo, no ongoing enforcement)', (yargs) => {
    return yargs.positional('jsonValue', {
      describe: 'JSON string for the new value (e.g., \'{"data":"new"}\')',
      type: 'string',
      default: '{"data":"new cli data","nested":{"value":20}}'
    })
  }, (argv) => {
    try {
      const newValue = JSON.parse(argv.jsonValue)
      console.log('Setting immutableScopedObj.val. NOTE: useImmutable only converts initialValue.')
      console.log('If assigning a plain object, it remains plain unless you manually use fromJS().')
      immutableScopedObj.val = newValue // This will be a plain object in the state now
      console.log('immutableScopedObj.val after set:', immutableScopedObj.val)
      console.log('Is it immutable now?', isImmutable(immutableScopedObj.val))
    } catch (e) {
      console.error("Error parsing JSON input for setImmutable:", e.message)
    }
  })
  .command('bridge:getGlobalCounter', 'Use bridged scoped state to get global counter (getGlobal)', () => {
    const counter = bridgedScopedState.getGlobal(state => state.get('counter'))
    console.log('Counter from global store via bridged (getGlobal):', counter)
  })
  .command('bridge:getReactiveCounter', 'Use bridged scoped state to get a reactive global counter (createGlobalStateSelector)', () => {
    console.log('Creating reactive global counter selector...')
    const reactiveCounter = bridgedScopedState.createGlobalStateSelector(state => state.get('counter'))
    console.log('Initial reactiveCounter.val:', reactiveCounter.val)

    console.log('Dispatching global INCREMENT via store.actions to test reactivity...')
    globalStore.actions.increment(10) // Increment by 10

    // Note: In a real app, VanJS derivations would update automatically.
    // In CLI, we show the value immediately after dispatch. It should reflect the change.
    console.log('reactiveCounter.val after global dispatch:', reactiveCounter.val)
    console.log('To see it update other VanJS elements, you would use it in van.derive() or van.add() in a VanJS app.')
  })
  .command('bridge:dispatchIncrement', 'Use bridged scoped state to dispatch INCREMENT to global store (dispatchGlobal)', () => {
    console.log('Dispatching INCREMENT via bridged scoped state (dispatchGlobal)...')
    // For dispatchGlobal, we still need to construct the full action if not using store.actions
    // The action type should match what the reducer expects.
    bridgedScopedState.dispatchGlobal({ type: 'INCREMENT_COUNTER', payload: 1 })
    const counter = bridgedScopedState.getGlobal(state => state.get('counter'))
    console.log('New global counter via bridged state:', counter)
  })
  .demandCommand(1, 'You need at least one command before moving on')
  .strict()
  .help()
  .version(false) // Disable default yargs version flag
  .argv
