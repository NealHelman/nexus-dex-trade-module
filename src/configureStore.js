import { createStore, compose, applyMiddleware } from 'redux';
import createReducer from './reducers';
import { stateMiddleware } from 'nexus-module';
import { encryptedStorageMiddleware, decryptionMiddleware } from './middleware/encryptedStorageMiddleware';

export default function configureStore() {
  //Middlewares will automatically save when the state as changed,
  //ie state.settings will be stored on disk and will save every time state.settings is changed.
  const middlewares = [
    decryptionMiddleware, // Decrypt on load
    encryptedStorageMiddleware(({ settings }) => ({ settings })), // Encrypt on save
    stateMiddleware(({ ui }) => ({ ui })), //Data saved to session
  ];
  const enhancers = [applyMiddleware(...middlewares)];

  const composeEnhancers =
    process.env.NODE_ENV !== 'production' &&
    typeof window === 'object' &&
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
      ? window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
          shouldHotReload: false,
        })
      : compose;

  const store = createStore(createReducer(), composeEnhancers(...enhancers));

  if (module.hot) {
    module.hot.accept('./reducers', () => {
      // Preserve the current state when replacing the reducer
      const currentState = store.getState();
      store.replaceReducer(createReducer());
      
      // Restore the preserved state
      store.dispatch({
        type: '@@REDUX_HMR_RESTORE_STATE',
        payload: currentState
      });
    });
  }

  return store;
}