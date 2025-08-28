import { encryptApiKeys, decryptApiKeys } from '../utils/encryption';

const UNLOCK_ACTIONS = [
    'SET_UNLOCKED',      // Example: set session as unlocked
    'SET_SESSION',       // Example: updated session, possibly after unlock
    'SET_PIN',
    // Add others as needed
    'INITIALIZE',
    '@@NWM/INITIALIZE'
];

// Helper to check if action triggers decryption
function shouldAttemptDecryption(action) {
    return UNLOCK_ACTIONS.includes(action.type);
}

// Only persist the encrypted blob and non-sensitive fields
export const encryptedStorageMiddleware = (selector) => (store) => (next) => async (action) => {
    const result = next(action);

    if (action.type === 'UPDATE_DECRYPTED_SETTINGS') {
        return result;
    }

    const state = store.getState();
    const { isUnlocked, pin, dexTradeModule } = state.session || {};
    if (!isUnlocked || !pin || !dexTradeModule) return result;

    // Only persist if keys are present
    const { publicKey, privateKey, ...rest } = dexTradeModule;
    if (!publicKey || !privateKey) return result;

    // Build encrypted blob for sensitive fields
    const encryptedApiKeys = await encryptApiKeys({ publicKey, privateKey }, pin);

    // Remove sensitive (decrypted) fields from persist obj
    const persistObj = {
        ...rest,
        encryptedApiKeys,
    };

    // Only persist if changed (very basic, can be improved for deep equality)
    if (!window._lastDexTradePersist || JSON.stringify(window._lastDexTradePersist) !== JSON.stringify(persistObj)) {
        const { updateStorage } = NEXUS.utilities;
        updateStorage({ dexTradeModule: persistObj });
        window._lastDexTradePersist = persistObj;
    }

    return result;
};

export const decryptionMiddleware = (store) => (next) => async (action) => {
    const result = next(action);

    // Only run for relevant actions
    if (!shouldAttemptDecryption(action)) return result;

    const state = store.getState();
    const { isUnlocked, pin, dexTradeModule } = state.session || {};

    // Only decrypt if session unlocked, pin present, encrypted blob present, and not already decrypted
    if (
        isUnlocked &&
        pin &&
        dexTradeModule &&
        dexTradeModule.encryptedApiKeys &&
        (!dexTradeModule.publicKey || !dexTradeModule.privateKey)
    ) {
        try {
            const { publicKey, privateKey } = await decryptApiKeys(
                dexTradeModule.encryptedApiKeys,
                pin
            );
            // Merge decrypted keys into dexTradeModule
            store.dispatch({
                type: 'UPDATE_DECRYPTED_SETTINGS',
                payload: {
                    ...dexTradeModule,
                    publicKey,
                    privateKey,
                }
            });
        } catch (e) {
            console.error('Failed to decrypt API keys:', e);
            // Optionally, dispatch an error action or set error state
        }
    }

    return result;
};