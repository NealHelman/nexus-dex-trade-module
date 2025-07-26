// src/utils/encryption.js
import CryptoJS from 'crypto-js';

// Accept genesis (or whatever unique identifier) as argument
function getEncryptionKey(genesis) {
  return CryptoJS.SHA256(genesis).toString();
}

export function encryptData(data, genesis) {
  if (!data) return data;
  const key = getEncryptionKey(genesis);
  return CryptoJS.AES.encrypt(data, key).toString();
}

export function decryptData(encryptedData, genesis) {
  if (!encryptedData) return encryptedData;
  try {
    const key = getEncryptionKey(genesis);
    const bytes = CryptoJS.AES.decrypt(encryptedData, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
}

export function isEncrypted(value) {
  // Example: check for Base64-like structure of AES output
  return typeof value === 'string' && /^[A-Za-z0-9+/=]+$/.test(value) && value.length % 4 === 0;
}