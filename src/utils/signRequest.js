const crypto = require('crypto');

/**
 * Recursively sort object keys and collect values as strings in order.
 */
function collectSortedValues(obj) {
    if (obj === null || typeof obj !== "object") {
        return [String(obj)];
    }
    if (Array.isArray(obj)) {
        return obj.flatMap(collectSortedValues);
    }
    const sortedKeys = Object.keys(obj).sort();
    return sortedKeys.flatMap(k => collectSortedValues(obj[k]));
}

/**
 * Generate X-Auth-Sign for Dex-Trade private API.
 * @param {Object} body - The request body (should already include request_id!).
 * @param {string} secret - The API private key.
 * @returns {string} The sha256 hash hex string.
 */
export function generateAuthSign(body, secret) {
    const values = collectSortedValues(body);
    console.log('Collected sorted values for signing:', values);
    const valuesString = values.join('');
    console.log('Values string for signing:', valuesString);
    const payload = `${valuesString}${secret}`;
    console.log('Payload for signing:', payload);
    const hash = crypto.createHash('sha256').update(payload).digest('hex');
    console.log('Generated X-Auth-Sign:', hash);
    return hash;
}