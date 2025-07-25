import { encryptData, decryptData } from '../utils/encryption';

const ENCRYPTED_FIELDS = ['apiKey'];

function encryptSensitiveFields(state, genesis) {
  if (!state.settings) return state;
  const encryptedSettings = { ...state.settings };

  ENCRYPTED_FIELDS.forEach(field => {
    if (encryptedSettings[field]) {
      encryptedSettings[field] = encryptData(encryptedSettings[field], genesis);
    }
  });

  return {
    ...state,
    settings: encryptedSettings
  };
}

function decryptSensitiveFields(state, genesis) {
  if (!state.settings) return state;
  const decryptedSettings = { ...state.settings };

  ENCRYPTED_FIELDS.forEach(field => {
    if (decryptedSettings[field]) {
      const decrypted = decryptData(decryptedSettings[field], genesis);
      if (decrypted !== null) {
        decryptedSettings[field] = decrypted;
      }
    }
  });

  return {
    ...state,
    settings: decryptedSettings
  };
}

export const encryptedStorageMiddleware = (selector) => (store) => (next) => (action) => {
  const result = next(action);
  const state = store.getState();
  const genesis = state.nexus?.userStatus?.genesis ?? 'default-key';
  const dataToSave = selector(state);

  const encryptedData = encryptSensitiveFields(dataToSave, genesis);
  const { updateStorage } = NEXUS.utilities;
  updateStorage(encryptedData);

  return result;
};

export const decryptionMiddleware = (store) => (next) => (action) => {
  if (action.type === 'INITIALIZE' && action.payload.storageData) {
    const state = store.getState();
    const genesis = state.nexus?.userStatus?.genesis ?? 'default-key';

    const decryptedPayload = {
      ...action.payload,
      storageData: decryptSensitiveFields(action.payload.storageData, genesis)
    };

    return next({
      ...action,
      payload: decryptedPayload
    });
  }

  return next(action);
};
