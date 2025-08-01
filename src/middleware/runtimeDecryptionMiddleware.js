import { decryptData, isEncrypted } from '../utils/encryption';

const ENCRYPTED_FIELDS = ['publicKey', 'privateKey'];

export const runtimeDecryptionMiddleware = (store) => (next) => (action) => {
    if (action.type === 'INITIALIZE') {
        console.log('INITIALIZE action received:', action);
    }
    const result = next(action);
  
  // After any action, check if we need to decrypt fields in the current state
  const state = store.getState();
  const genesis = state.nexus?.userStatus?.genesis ?? 'default-key';
  
  if (state.settings && genesis !== 'default-key') {
    let needsDecryption = false;
    const decryptedSettings = { ...state.settings };
    
    ENCRYPTED_FIELDS.forEach(field => {
      const val = state.settings[field];
      if (val && isEncrypted(val)) {
        const decrypted = decryptData(val, genesis);
        if (decrypted !== null) {
          decryptedSettings[field] = decrypted;
          needsDecryption = true;
        }
      }
    });
    
    // If we decrypted anything, dispatch an action to update the state
    if (needsDecryption) {
      store.dispatch({
        type: 'UPDATE_DECRYPTED_SETTINGS',
        payload: decryptedSettings
      });
    }
  }
  
  return result;
};