import { decryptData, isEncrypted } from '../utils/encryption';

export const getDecryptedPublicKey = (state) => {
  const publicKey = state.settings.publicKey;
  if (!publicKey) return '';
  
  const genesis = state.nexus?.userStatus?.genesis ?? 'default-key';
  
  if (isEncrypted(publicKey)) {
    const decrypted = decryptData(publicKey, genesis);
    return decrypted !== null ? decrypted : publicKey;
  }
  
  return publicKey;
};

export const getDecryptedPrivateKey = (state) => {
  const privateKey = state.settings.privateKey;
  if (!privateKey) return '';
  
  const genesis = state.nexus?.userStatus?.genesis ?? 'default-key';
  
  if (isEncrypted(privateKey)) {
    const decrypted = decryptData(privateKey, genesis);
    return decrypted !== null ? decrypted : privateKey;
  }
  
  return privateKey;
};