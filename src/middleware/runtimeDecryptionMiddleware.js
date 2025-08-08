import { decryptData, isEncrypted } from '../utils/encryption';

const ENCRYPTED_FIELDS = ['publicKey', 'privateKey'];

export const runtimeDecryptionMiddleware = (store) => (next) => (action) => {
    console.log('Runtime decryption middleware action:', action); // Debugging line
    const result = next(action);

    // After any action, check if we need to decrypt fields in the current state
    const state = store.getState();
    console.log('Current state before decryption:', state); // Debugging line
    const genesis = state.nexus?.userStatus?.genesis ?? action.payload?.userstatus?.genesis ?? 'default-key';
    console.log('Genesis key for decryption:', genesis); // Debugging line

    if (state.settings && genesis !== 'default-key') {
        let needsDecryption = false;
        const decryptedSettings = { ...state.settings };
        console.log('Decrypted settings before processing:', decryptedSettings); // Debugging line

        ENCRYPTED_FIELDS.forEach(field => {
            const val = state.settings[field];
            console.log(`Processing field: ${field}, value:`, val); // Debugging line
            if (val && isEncrypted(val)) {
                const decrypted = decryptData(val, genesis);
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