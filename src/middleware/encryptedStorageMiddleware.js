import { encryptApiKeys, decryptApiKeys } from '../utils/encryption';

const ENCRYPTED_FIELDS = ['publicKey', 'privateKey'];
const ENCRYPTION_PREFIX = 'ENC:';

function isEncrypted(value) {
    return typeof value === 'string' && value.startsWith(ENCRYPTION_PREFIX);
}

let lastPersistedSettings = null;

export const encryptedStorageMiddleware = (selector) => (store) => (next) => (action) => {
    const result = next(action);

    if (action.type === 'UPDATE_DECRYPTED_SETTINGS') {
        return result;
    }

    const state = store.getState();
    const isUnlocked = state.session?.isUnlocked;
    const pin = state.session?.pin;
    if (!isUnlocked || !pin) return result;

    // Encrypt fields if needed
    const encryptedSettings = { ...state.session };
    ENCRYPTED_FIELDS.forEach(field => {
        const val = encryptedSettings[field];
        if (val && !isEncrypted(val)) {
            encryptedSettings[field] = encryptApiKeys(val, pin);
        }
    });

    // Only persist if settings changed
    if (JSON.stringify(encryptedSettings) !== JSON.stringify(lastPersistedSettings)) {
        const { updateStorage } = NEXUS.utilities;
        updateStorage({ dexTradeModule: encryptedSettings });
        lastPersistedSettings = encryptedSettings;
    }

    return result;
};

// DECRYPTION ON INITIAL LOAD (not runtime)
export const decryptionMiddleware = (store) => (next) => (action) => {
    if ((action.type === 'INITIALIZE' || action.type === '@@NWM/INITIALIZE') && action.payload.storageData) {
        const state = store.getState();
        const isUnlocked = state.session?.isUnlocked;
        const pin = state.session?.pin;
        if (!isUnlocked || !pin) return next(action);

        // Decrypt settings fields
        const decryptedSettings = { ...action.payload.storageData.dexTradeModule };
        let needsDecryption = false;

        ENCRYPTED_FIELDS.forEach(field => {
            const val = decryptedSettings[field];
            if (val && isEncrypted(val)) {
                const decrypted = decryptApiKeys(val, pin);
                if (decrypted !== null) {
                    decryptedSettings[field] = decrypted;
                    needsDecryption = true;
                }
            }
        });

        // Replace only if something changed
        if (needsDecryption) {
            const decryptedPayload = {
                ...action.payload,
                storageData: {
                    ...action.payload.storageData,
                    dexTradModule: decryptedSettings
                }
            };

            return next({
                ...action,
                payload: decryptedPayload
            });
        }
    }

    return next(action);
};