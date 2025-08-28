import { decryptApiKeys } from '../utils/encryption';

const ENCRYPTED_FIELDS = ['publicKey', 'privateKey'];
const ENCRYPTION_PREFIX = 'ENC:';

function isEncrypted(value) {
    // Simply check for our encryption prefix
    return typeof value === 'string' && value.startsWith(ENCRYPTION_PREFIX);
}

export const runtimeDecryptionMiddleware = (store) => (next) => (action) => {
    const result = next(action);

    // Get unlock state from Redux
    const state = store.getState();
    const isUnlocked = state.session?.isUnlocked;
    const pin = state.session?.pin; // Only in memory

    if (!isUnlocked || !pin) {
        // Don't attempt to decrypt/encrypt if not unlocked
        return result;
    }

    if (state.settings) {
        let needsDecryption = false;
        const decryptedSettings = { ...state.session };
        console.log('Decrypted settings before processing:', decryptedSettings); // Debugging line

        ENCRYPTED_FIELDS.forEach(field => {
            const val = state.session[field];
            console.log(`Processing field: ${field}, value:`, val); // Debugging line
            if (val && isEncrypted(val)) {
                const decrypted = decryptApiKeys(val, pin);
                console.log(`Decrypted value for ${field}:`, decrypted); // Debugging line
                if (decrypted !== null) {
                    decryptedSettings[field] = decrypted;
                    needsDecryption = true;
                }
            }
        });

        // If we decrypted anything, dispatch an action to update the state
        if (needsDecryption) {
            console.log('Decrypted settings after processing:', decryptedSettings); // Debugging line
            store.dispatch({
                type: 'UPDATE_DECRYPTED_SETTINGS',
                payload: decryptedSettings
            });
        }
    }

    return result;
};