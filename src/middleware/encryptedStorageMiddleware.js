import { encryptData, decryptData, isEncrypted } from '../utils/encryption';

const ENCRYPTED_FIELDS = ['publicKey', 'privateKey'];

function encryptSensitiveFields(state, genesis) {
    console.log('Encrypting sensitive fields with genesis:', genesis);
    console.log('Current state before encryption:', state);
    if (!state.settings) return state;
    const encryptedSettings = { ...state.settings };

    ENCRYPTED_FIELDS.forEach(field => {
        const val = encryptedSettings[field];
        if (val && !isEncrypted(val)) {
            encryptedSettings[field] = encryptData(val, genesis);
        }
    });

    return { ...state, settings: encryptedSettings };
}

function decryptSensitiveFields(state, genesis) {
    console.log('Decrypting sensitive fields with genesis:', genesis);
    console.log('Current state before decryption:', state);
    if (!state.settings) return state;
    const decryptedSettings = { ...state.settings };

    ENCRYPTED_FIELDS.forEach(field => {
        const val = decryptedSettings[field];
        if (val && isEncrypted(val)) {
            const decrypted = decryptData(val, genesis);
            if (decrypted !== null) {
                decryptedSettings[field] = decrypted;
            }
        }
    });

    return { ...state, settings: decryptedSettings };
}

let lastPersistedSettings = null;

export const encryptedStorageMiddleware = (selector) => (store) => (next) => (action) => {
    const result = next(action);

    if (action.type === 'UPDATE_DECRYPTED_SETTINGS') {
        return result;
    }

    const state = store.getState();
    const genesis = state.nexus?.userStatus?.genesis ?? 'default-key';
    const dataToSave = selector(state);
    const encryptedData = encryptSensitiveFields(dataToSave, genesis);

    // Compare with last persisted
    if (JSON.stringify(encryptedData) !== JSON.stringify(lastPersistedSettings)) {
        const { updateStorage } = NEXUS.utilities;
        updateStorage(encryptedData);
        lastPersistedSettings = encryptedData;
    }

    return result;
};

export const decryptionMiddleware = (store) => (next) => (action) => {
    console.log('Decryption middleware action:', action); // Debugging line
    if ((action.type === 'INITIALIZE' || action.type === '@@NWM/INITIALIZE') && action.payload.storageData) {
        console.log('Decryption middleware INITIALIZE:', action); // Debugging line
        const state = store.getState();
        const genesis = state.nexus?.userStatus?.genesis ?? action.payload?.userStatus?.genesis ?? 'default-key';
        console.log('Genesis key for decryption:', genesis);

        // Decrypt the storage data BEFORE it goes into the state
        const decryptedStorageData = decryptSensitiveFields(action.payload.storageData, genesis);
        console.log('Decrypted storage data:', decryptedStorageData); // Debugging line

        const decryptedPayload = {
            ...action.payload,
            storageData: decryptedStorageData
        };

        console.log('Decrypted storage data:', decryptedStorageData);

        return next({
            ...action,
            payload: decryptedPayload
        });
    }

    return next(action);
};