import { generateAuthSign } from './signRequest';

const { utilities: { proxyRequest, showErrorDialog } } = NEXUS;

const DEX_TRADE_BASE_URL = 'https://api.dex-trade.com';
const DEX_TRADE_PUBLIC_ADDON = '/v1/public/';
const DEX_TRADE_PRIVATE_ADDON = '/v1/private/';

function collectSortedValues(obj) {
    if (typeof obj !== 'object' || obj === null) return [obj];
    if (Array.isArray(obj)) return obj.flatMap(collectSortedValues);

    return Object.keys(obj)
        .sort()
        .flatMap(k => collectSortedValues(obj[k]));
}

/**
 * Make authenticated request to Dex-Trade private API
 * @param {string} endpoint - API endpoint (e.g., 'account-balances')
 * @param {Object} data - Request payload
 * @param {string} token - publicKey - User's public API key
 * @param {string} secret - privateKey - User's private API key
 * @returns {Promise<Object>} API response data
 */
export async function makeDexTradePrivateRequest(endpoint, data = {}, token, secret) {
    try {
        data['request_id'] = Math.floor(Date.now() / 1000).toString();
        console.log('Making API request:', {
            endpoint,
            data,
            token: token.substring(0, 10) + '...',
            url: `${DEX_TRADE_BASE_URL}${DEX_TRADE_PRIVATE_ADDON}${endpoint}`
        });

        const authSign = generateAuthSign(data, secret);
        console.log('Generated auth sign:', authSign.substring(0, 20) + '...');

        let url = '';
        if (endpoint.substr(0, 4) === '/v1/') {
            url = `${DEX_TRADE_BASE_URL}${endpoint}`;
        } else {
            url = `${DEX_TRADE_BASE_URL}${DEX_TRADE_PRIVATE_ADDON}${endpoint}`;
        }

        const response = await proxyRequest(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'login-token': token,
                'x-auth-sign': authSign
            },
            data: JSON.stringify(data)
        });

        console.log('Raw API response:', response);

        if (!response.data.status) {
            console.log('API returned error status:', response.data);
            throw new Error(response.data.message || 'API request failed');
        }

        console.log('API success, returning data:', response.data.data);
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
 * @param {string} endpoint - API endpoint (e.g., 'ticker')
 * @returns {Promise<Object>} API response data
 */
export async function makeDexTradePublicRequest(endpoint) {
    try {
        const url = `${DEX_TRADE_BASE_URL}${DEX_TRADE_PUBLIC_ADDON}${endpoint}`;
        console.log('Making public API request to:', url);

        const response = await proxyRequest(url, { method: 'GET' });
        console.log('Public API raw response:', response);

        if (!response.data.status) {
            console.log('Public API returned error status:', response.data);
            throw new Error(response.data.message || 'API request failed');
        }

        console.log('Public API success, returning data:', response.data.data);
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
export async function getAccountBalances(token, secret) {
    return makeDexTradePrivateRequest('balances', {}, token, secret);
}

/**
 * Get recent orders
 */
export async function getRecentOrders(token, secret, limit = 10) {
    return makeDexTradePrivateRequest('history', { limit }, token, secret);
}

/**
 * Get market ticker data
 */
export async function getMarketTicker(pair) {
    return makeDexTradePublicRequest(`ticker?pair=${pair}`);
}

/**
 * Get all available markets
 */
export async function getMarkets() {
    return makeDexTradePublicRequest('symbols');
}

/**
 * Get deposit address for a specific currency
 */
export const getDepositAddress = async (token, secret, iso, network = null) => {
    const body = {
        iso: iso,
        new: 0
    };

    // Add network if provided (needed for USDT)
    if (network) {
        body.network = network;
    }

    return await makeDexTradePrivateRequest('get-address', body, token, secret);
};

/**
 * Initiate a withdrawal
 */
export const initiateWithdrawal = async (token, secret, iso, amount, toAddress) => {
    const body = {
        iso: iso,
        amount: parseFloat(amount),
        to_address: toAddress
    };

    return await makeDexTradePrivateRequest('/v1/withdraw', body, token, secret);
};

/**
 * Send withdrawal confirmation PIN to email
 */
export const sendWithdrawalPin = async (token, secret, withdrawalId) => {
    const body = {
        id: withdrawalId
    };

    return await makeDexTradePrivateRequest('/v1/withdraw/send-pin', body, token, secret);
};

/**
 * Confirm withdrawal with email PIN and optional Google authenticator code
 */
export const confirmWithdrawal = async (token, secret, withdrawalId, emailPin, googlePin = null) => {
    const body = {
        id: withdrawalId,
        email_pin: emailPin
    };

    // Add Google PIN if provided
    if (googlePin) {
        body.google_pin = googlePin;
    }

    return await makeDexTradePrivateRequest('/v1/withdraw/confirm-code', body, token, secret);
};

/**
 * View withdrawal details
 */
export const getWithdrawalDetails = async (token, secret, withdrawalId) => {
    const body = {
        id: withdrawalId
    };

    return await makeDexTradePrivateRequest('/v1/withdraw/view', body, token, secret);
};

// Get available currencies from the public markets endpoint
export const getAvailableCurrencies = async () => {
    try {
        console.log('Calling public symbols endpoint...');
        const markets = await makeDexTradePublicRequest('symbols');
        console.log('Raw markets response type:', typeof markets);
        console.log('Raw markets response:', markets);
        console.log('Is array?', Array.isArray(markets));

        if (markets) {
            console.log('Markets keys:', Object.keys(markets));
            if (Array.isArray(markets)) {
                console.log('First market item:', markets[0]);
            }
        }

        // Extract unique currencies from the trading pairs
        const currencies = new Set();

        if (Array.isArray(markets)) {
            markets.forEach((market, index) => {
                console.log(`Market ${index}:`, market);
                // Markets are usually in format like "BTC-USDT", "NXS-BTC", etc.
                if (market.symbol && market.symbol.includes('-')) {
                    const [base, quote] = market.symbol.split('-');
                    currencies.add(base);
                    currencies.add(quote);
                } else if (market.name && market.name.includes('-')) {
                    const [base, quote] = market.name.split('-');
                    currencies.add(base);
                    currencies.add(quote);
                }
                // Also check if there are separate base_currency and quote_currency fields
                if (market.base_currency) currencies.add(market.base_currency);
                if (market.quote_currency) currencies.add(market.quote_currency);
                if (market.base) currencies.add(market.base);
                if (market.quote) currencies.add(market.quote);
            });
        } else if (typeof markets === 'object' && markets !== null) {
            // Maybe it's an object with currency pairs as keys
            Object.keys(markets).forEach(key => {
                console.log(`Market key: ${key}, value:`, markets[key]);
                if (key.includes('-')) {
                    const [base, quote] = key.split('-');
                    currencies.add(base);
                    currencies.add(quote);
                }
            });
        }

        console.log('Extracted currencies:', Array.from(currencies));

        if (currencies.size === 0) {
            throw new Error('No currencies found in markets');
        }

        // Convert to array and create currency objects
        return Array.from(currencies).map(code => ({
            iso: code,
            code: code,
            name: code, // We'll use the code as name for now
            network: null // We don't know the network from this endpoint
        }));
    } catch (error) {
        console.error('Failed to get available currencies:', error);
        throw error;
    }
};

export function fetchOrderBook(pair) {
    // For order book: endpoint is "book?pair=BTCUSDT"
    return makeDexTradePublicRequest(`book?pair=${pair}`);
};

export function createOrder(token, secret, orderData) {
    return makeDexTradePrivateRequest('create-order', orderData, token, secret);
};