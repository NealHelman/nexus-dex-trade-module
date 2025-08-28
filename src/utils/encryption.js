import sodium from 'libsodium-wrappers';
import { scrypt } from '@noble/hashes/scrypt';

// Scrypt parameters
const SCRYPT_N = 2 ** 15; // CPU/memory cost
const SCRYPT_r = 8;       // block size
const SCRYPT_p = 1;       // parallelization
const SCRYPT_KEYLEN = 32; // derived key length in bytes

// Helper to convert string to Uint8Array
function toBytes(str) {
    return typeof str === 'string'
        ? new TextEncoder().encode(str)
        : str;
}

export async function encryptApiKeys(apiKeysObject, pin) {
    await sodium.ready;
    const salt = sodium.randombytes_buf(16);
    // Derive key from pin using scrypt
    const key = scrypt(toBytes(pin), salt, {
        N: SCRYPT_N,
        r: SCRYPT_r,
        p: SCRYPT_p,
        dkLen: SCRYPT_KEYLEN,
    });

    const apiKeysJson = JSON.stringify(apiKeysObject);
    const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
    const ciphertext = sodium.crypto_secretbox_easy(
        toBytes(apiKeysJson),
        nonce,
        key
    );

    // Combine salt, nonce, and ciphertext for storage (all as base64)
    return JSON.stringify({
        salt: sodium.to_base64(salt),
        nonce: sodium.to_base64(nonce),
        ciphertext: sodium.to_base64(ciphertext),
    });
}

export async function decryptApiKeys(encryptedApiKeysBlob, pin) {
    await sodium.ready;
    const { salt, nonce, ciphertext } = JSON.parse(encryptedApiKeysBlob);
    const saltBuf = sodium.from_base64(salt);
    const nonceBuf = sodium.from_base64(nonce);
    const ciphertextBuf = sodium.from_base64(ciphertext);

    // Derive key again with scrypt
    const key = scrypt(toBytes(pin), saltBuf, {
        N: SCRYPT_N,
        r: SCRYPT_r,
        p: SCRYPT_p,
        dkLen: SCRYPT_KEYLEN,
    });

    const decrypted = sodium.crypto_secretbox_open_easy(
        ciphertextBuf,
        nonceBuf,
        key
    );
    if (!decrypted) throw new Error('Decryption failed: incorrect PIN or corrupted data');

    const apiKeysJson = new TextDecoder().decode(decrypted);
    return { apiKeysObject: JSON.parse(apiKeysJson) };
}

export function clearEncryptionCache() {
    // No-op for this implementation, but kept for API compatibility
}