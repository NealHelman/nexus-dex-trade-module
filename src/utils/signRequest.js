import sha256 from 'crypto-js/sha256';

/**
 * Recursively sort object keys and collect values in order.
 */
function collectSortedValues(obj) {
  if (typeof obj !== 'object' || obj === null) return [obj];
  if (Array.isArray(obj)) return obj.flatMap(collectSortedValues);

  return Object.keys(obj)
    .sort()
    .flatMap(k => collectSortedValues(obj[k]));
}

/**
 * Generate X-Auth-Sign for Dex-Trade private API.
 * @param {Object} body - The request body.
 * @param {string} secret - The API secret.
 * @returns {string} The sha256 hash hex string.
 */
export function generateAuthSign(body, secret) {
  const values = collectSortedValues(body);
  const payload = values.join('') + secret;
  return sha256(payload).toString();
}