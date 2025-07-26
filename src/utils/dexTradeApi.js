import { generateAuthSign } from './signRequest';

const { utilities: { proxyRequest, showErrorDialog } } = NEXUS;

const DEX_TRADE_BASE_URL = 'https://api.dex-trade.com';

/**
 * Make authenticated request to Dex-Trade private API
 * @param {string} endpoint - API endpoint (e.g., '/v1/private/account-balances')
 * @param {Object} data - Request payload
 * @param {string} apiKey - User's API key
 * @param {string} apiSecret - User's API secret
 * @returns {Promise<Object>} API response data
 */
export async function makeDexTradePrivateRequest(endpoint, data = {}, apiKey, apiSecret) {
  try {
    const body = {
      ...data,
      timestamp: Date.now()
    };

    const authSign = generateAuthSign(body, apiSecret);

    const response = await proxyRequest({
      url: `${DEX_TRADE_BASE_URL}${endpoint}`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': apiKey,
        'X-Auth-Sign': authSign
      },
      data: JSON.stringify(body)
    });

    if (!response.success) {
      throw new Error(response.message || 'API request failed');
    }

    return response.data;
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
    const response = await proxyRequest({
      url: `${DEX_TRADE_BASE_URL}${endpoint}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    });

    if (!response.success) {
      throw new Error(response.message || 'API request failed');
    }

    return response.data;
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
export async function getAccountBalances(apiKey, apiSecret) {
  return makeDexTradePrivateRequest('/v1/private/balances', {}, apiKey, apiSecret);
}

/**
 * Get recent orders
 */
export async function getRecentOrders(apiKey, apiSecret, limit = 10) {
  return makeDexTradePrivateRequest('/v1/private/history', { limit }, apiKey, apiSecret);
}

/**
 * Get market ticker data
 */
export async function getMarketTicker(pair = 'NXSUSDT') {
  return makeDexTradePublicRequest(`/v1/public/ticker?${pair}`);
}

/**
 * Get all available markets
 */
export async function getMarkets() {
  return makeDexTradePublicRequest('/v1/public/symbols');
}