// src/middleware/encryptedStorageMiddleware.js
import { encryptData, decryptData } from '../utils/encryption';

// Fields that should be encrypted
const ENCRYPTED_FIELDS = ['apiKey'];

function encryptSensitiveFields(state) {
  if (!state.settings) return state;
  
  const encryptedSettings = { ...state.settings };
  
  ENCRYPTED_FIELDS.forEach(field => {
    if (encryptedSettings[field]) {
      encryptedSettings[field] = encryptData(encryptedSettings[field]);
    }
  });
  
  return {
    ...state,
    settings: encryptedSettings
  };
}

function decryptSensitiveFields(state) {
  if (!state.settings) return state;
  
  const decryptedSettings = { ...state.settings };
  
  ENCRYPTED_FIELDS.forEach(field => {
    if (decryptedSettings[field]) {
      const decrypted = decryptData(decryptedSettings[field]);
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
  
  // Get the state that would be saved
  const state = store.getState();
  const dataToSave = selector(state);
  
  // Encrypt sensitive fields before saving
  const encryptedData = encryptSensitiveFields(dataToSave);
  
  // Use the built-in updateStorage with encrypted data
  const { updateStorage } = NEXUS.utilities;
  updateStorage(encryptedData);
  
  return result;
};

// Middleware to decrypt data when initializing
export const decryptionMiddleware = (store) => (next) => (action) => {
  if (action.type === 'INITIALIZE' && action.payload.storageData) {
    // Decrypt the storage data before it goes into the state
    const decryptedPayload = {
      ...action.payload,
      storageData: decryptSensitiveFields(action.payload.storageData)
    };
    
    return next({
      ...action,
      payload: decryptedPayload
    });
  }
  
  return next(action);
};