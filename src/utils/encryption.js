import sodium from 'libsodium-wrappers';
import { scrypt } from '@noble/hashes/scrypt';

// Scrypt parameters
const SCRYPT_N = 2 ** 15; // CPU/memory cost
const SCRYPT_r = 8;       // block size
const SCRYPT_p = 1;       // parallelization
const SCRYPT_KEYLEN = 32; // derived key length in bytes

const ENCRYPTION_VERSION = 1;

// Helper to convert string to Uint8Array
function toBytes(str) {
    if (typeof str === 'string') {
        return new TextEncoder().encode(str);
    }
    // If already a Uint8Array, return as is
    if (str instanceof Uint8Array) return str;
    // If it's an ArrayBuffer, convert
    if (str instanceof ArrayBuffer) return new Uint8Array(str);
    // Otherwise, error
    throw new Error('Invalid input to toBytes');
}

// Helper for base64 encoding/decoding
function toBase64(buf) {
    return sodium.to_base64(buf, sodium.base64_variants.ORIGINAL);
}
function fromBase64(str) {
    return sodium.from_base64(str, sodium.base64_variants.ORIGINAL);
}

/**
 * Encrypts an object (e.g. {publicKey, privateKey, ...}) as a single blob.
 * Returns a base64-encoded JSON blob string (optionally, prefix with ENC:).
 */
export async function encryptApiKeys(obj, pin) {
    console.log('Encrypting object:', obj);

    await sodium.ready;
    console.log('Sodium is ready');
    const salt = sodium.randombytes_buf(16);
    console.log('Generated salt:', toBase64(salt));
    let key;
    try {
        console.log('PIN typeof:', typeof pin, 'value:', pin);
        key = await scrypt(toBytes(pin), salt, {
            N: SCRYPT_N,
            r: SCRYPT_r,
            p: SCRYPT_p,
            dkLen: SCRYPT_KEYLEN,
        });
        console.log('Derived key:', toBase64(key));
    } catch (e) {
        console.error('scrypt threw:', e);
        throw e;
    }

    const plaintext = JSON.stringify(obj);
    const nonce = sodium.randombytes_buf(sodium.crypto_secretbox_NONCEBYTES);
    console.log('Generated nonce:', toBase64(nonce));

    console.log('Key length:', key.length); // should be 32
    console.log('Nonce length:', nonce.length); // should be 24
    console.log('Plaintext bytes length:', toBytes(plaintext).length);
    let ciphertext;
    try {
        ciphertext = sodium.crypto_secretbox_easy(
            toBytes(plaintext),
            nonce,
            key
        );
    } catch (e) {
        console.error('crypto_secretbox_easy threw:', e);
        throw e;
    }
    console.log('Generated ciphertext:', toBase64(ciphertext));

    // Compose the encrypted blob
    const blob = {
        version: ENCRYPTION_VERSION,
        salt: toBase64(salt),
        nonce: toBase64(nonce),
        ciphertext: toBase64(ciphertext),
    };

    console.log('Encrypted blob:', blob);
    return 'ENC:' + btoa(JSON.stringify(blob));
}

/**
 * Decrypts a base64-encoded blob string (optionally with ENC: prefix) with the pin.
 * Returns the original object.
 */
export async function decryptApiKeys(encryptedBlob, pin) {
    await sodium.ready;
    let blobStr = encryptedBlob;
    if (blobStr.startsWith('ENC:')) {
        blobStr = blobStr.slice(4);
    }
    const blob = JSON.parse(atob(blobStr));

    if (!blob.version || blob.version !== ENCRYPTION_VERSION) {
        throw new Error('Unsupported encryption version');
    }

    const saltBuf = fromBase64(blob.salt);
    const nonceBuf = fromBase64(blob.nonce);
    const ciphertextBuf = fromBase64(blob.ciphertext);

    const key = await scrypt(toBytes(pin), saltBuf, {
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

    const plaintext = new TextDecoder().decode(decrypted);
    return JSON.parse(plaintext);
}

/**
 * No caching in this implementation, but API compatibility is kept.
 */
export function clearEncryptionCache() {
    // No-op for compatibility
}