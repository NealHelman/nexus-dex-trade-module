import { generateAuthSign } from './signRequest';

const { utilities: { proxyRequest, showErrorDialog } } = NEXUS;

const DEX_TRADE_BASE_URL = 'https://api.dex-trade.com';

/**
 * Make authenticated request to Dex-Trade private API
 * @param {string} endpoint - API endpoint (e.g., '/v1/private/account-balances')
 * @param {Object} data - Request payload
 * @param {string} publicKey - User's public API key
 * @param {string} privateKey - User's private API key
 * @returns {Promise<Object>} API response data
 */
export async function makeDexTradePrivateRequest(endpoint, data = {}, publicKey, privateKey) {
  try {
    const body = {
      ...data,
      request_id: Date.now().toString() // This was missing!
    };

    const authSign = generateAuthSign(body, publicKey);

    console.log('makeDexTradePrivateRequest body:', body); // Debug log to verify request_id is there
    console.log('makeDexTradePrivateRequest: ', `${DEX_TRADE_BASE_URL}${endpoint}`);
    
    const response = await proxyRequest(`${DEX_TRADE_BASE_URL}${endpoint}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'login-token': privateKey,
        'x-auth-sign': authSign
      },
      data: JSON.stringify(body)
    });

    if (!response.data.status) {
      throw new Error(response.message || 'API request failed');
    }

    return response.data.data;
  } catch (error) {
    console.error('Dex-Trade API Error:', error);
    showErrorDialog({ 
      message: `Dex-Trade API Error: ${error.message}` 
    });
    throw error;
  }
}
/**
 * Make public request to Dex-Trade API (no authentication needed)
 * @param {string} endpoint - API endpoint (e.g., '/v1/public/ticker')
 * @returns {Promise<Object>} API response data
 */
export async function makeDexTradePublicRequest(endpoint) {
  try {
    const response = await proxyRequest(`${DEX_TRADE_BASE_URL}${endpoint}`, { method: 'GET' });

    if (!response.data.status) {
      throw new Error(response.data.message || 'API request failed');
    }

    return response.data.data;
  } catch (error) {
    console.error('Dex-Trade Public API Error:', error);
    showErrorDialog({ 
      message: `Dex-Trade API Error: ${error.message}` 
    });
    throw error;
  }
}
/**
 * Get account balances
 */
export async function getAccountBalances(publicKey, privateKey) {
  return makeDexTradePrivateRequest('/v1/private/balances', {}, publicKey, privateKey);
}

/**
 * Get recent orders
 */
export async function getRecentOrders(publicKey, privateKey, limit = 10) {
  return makeDexTradePrivateRequest('/v1/private/history', { limit }, publicKey, privateKey);
}

/**
 * Get market ticker data
 */
export async function getMarketTicker(pair) {
  return makeDexTradePublicRequest(`/v1/public/ticker?pair=${pair}`);
}

/**
 * Get all available markets
 */
export async function getMarkets() {
  return makeDexTradePublicRequest('/v1/public/symbols');
}