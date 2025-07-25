// src/utils/encryption.js
import CryptoJS from 'crypto-js';
import { useSelector } from 'react-redux';


// Use a combination of user-specific data to create a unique key
// This ensures each user's data is encrypted with their own key
function getEncryptionKey() {
  const userStatus = useSelector((state) => state.nexus.userStatus.genesis);
  const genesis = useSelector((state) => state.nexus.userStatus.userStatus.genesis);;
  return CryptoJS.SHA256(genesis);
}

export function encryptData(data) {
  if (!data) return data;
  const key = getEncryptionKey();
  return CryptoJS.AES.encrypt(data, key).toString();
}

export function decryptData(encryptedData) {
  if (!encryptedData) return encryptedData;
  try {
    const key = getEncryptionKey();
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
}