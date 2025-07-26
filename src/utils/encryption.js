// src/utils/encryption.js
import CryptoJS from 'crypto-js';

const ENCRYPTION_PREFIX = 'ENC:'; // Add a clear prefix to identify encrypted data

// Accept genesis (or whatever unique identifier) as argument
function getEncryptionKey(genesis) {
  return CryptoJS.SHA256(genesis).toString();
}

export function encryptData(data, genesis) {
  if (!data) return data;
  const key = getEncryptionKey(genesis);
  const encrypted = CryptoJS.AES.encrypt(data, key).toString();
  return ENCRYPTION_PREFIX + encrypted; // Add prefix to clearly mark as encrypted
}

export function decryptData(encryptedData, genesis) {
  if (!encryptedData) return encryptedData;
  try {
    // Remove prefix before decrypting
    if (!encryptedData.startsWith(ENCRYPTION_PREFIX)) {
      return encryptedData; // Not encrypted, return as-is
    }
    
    const actualEncryptedData = encryptedData.substring(ENCRYPTION_PREFIX.length);
    const key = getEncryptionKey(genesis);
    const bytes = CryptoJS.AES.decrypt(actualEncryptedData, key);
    return bytes.toString(CryptoJS.enc.Utf8);
  } catch (error) {
    console.error('Decryption failed:', error);
    return null;
  }
}

export function isEncrypted(value) {
  // Simply check for our encryption prefix
  return typeof value === 'string' && value.startsWith(ENCRYPTION_PREFIX);
}