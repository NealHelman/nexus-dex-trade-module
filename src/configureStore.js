import { createStore, compose, applyMiddleware } from 'redux';
import { thunk } from 'redux-thunk';

import createReducer from './reducers';
import { storageMiddleware, stateMiddleware } from 'nexus-module';
import { encryptedStorageMiddleware, decryptionMiddleware } from './middleware/encryptedStorageMiddleware';

export default function configureStore() {
    //Middlewares will automatically save when the state as changed,
    //ie state.session.dexTradeModule will be stored on disk and will save every time state.session.dexTradeModule is changed.
    const middlewares = [
        storageMiddleware(state => ({ dexTradeModule: state.session?.dexTradeModule })), // Load/save to disk
        decryptionMiddleware, // <-- Decrypt after load from disk, before anything else
        encryptedStorageMiddleware(({ session }) => ({ session })), // Encrypt before saving
        stateMiddleware(({ ui }) => ({ ui })), // Save to session
        thunk, // Allows for async actions
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
            store.replaceReducer(createReducer());
        });
    }

    return store;
}
