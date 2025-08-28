import { createRoot } from 'react-dom/client';
import { Provider, useSelector, useDispatch } from 'react-redux';
import { listenToWalletData } from 'nexus-module';
import marketplaceTheme from './Styles/theme';
import { SessionUnlockProvider } from './context/SessionUnlockProvider.jsx';

import store from './store';
import App from './App';
import './Styles/styles.css';

listenToWalletData(store);

const {
    libraries: {
        emotion: { react },
    },
} = NEXUS;
const { ThemeProvider } = NEXUS.libraries.emotion.react;

console.log('Initial Redux State:', store.getState());

// Hook-using wrapper component
function Root() {
    const genesis = useSelector(state => state.nexus?.userStatus?.genesis);
    const encryptedApiKeysBlob = useSelector(state => state.storageData?.dexTradeModule?.encryptedApiKeys);

    const setEncryptedApiKeysBlob = (blob) => {
        dispatch({
            type: 'SET_ENCRYPTED_API_KEYS_BLOB',
            payload: blob,
        });
    };

    if (!genesis) return null;

    return (
        <SessionUnlockProvider
            encryptedApiKeysBlob={encryptedApiKeysBlob}
            genesis={genesis}
        >
            <ThemeProvider theme={marketplaceTheme}>
                <App />
            </ThemeProvider>
        </SessionUnlockProvider>
    );
}

// render now uses Root as the entry point for hooks/context
const root = createRoot(document.getElementById('root'));
root.render(
    <Provider store={store}>
        <Root />
    </Provider>
);