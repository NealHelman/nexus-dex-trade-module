import { useSelector } from 'react-redux';
import { getDecryptedPublicKey, getDecryptedPrivateKey } from '../selectors/settingsSelectors';
import { StyledDropdownWrapper, StyledSelect } from '../Styles/StyledComponents';
import { safeApiCall, fetchOrderBook, createOrder, getAccountBalances } from '../utils/dexTradeApi';

const {
    libraries: { React },
    components: { FieldSet, Button, TextField, Dropdown },
    utilities: { showSuccessDialog, showErrorDialog, showInfoDialog },
} = NEXUS;

const PAIRS = [
    { label: 'NXS/USDT', value: 'NXSUSDT', base: 'NXS', quote: 'USDT' },
    { label: 'BTC/USDT', value: 'BTCUSDT', base: 'BTC', quote: 'USDT' },
];

function generateRequestId() {
    return String(Date.now()) + String(Math.floor(Math.random() * 10000));
}

export default function TradePage() {
    const [pair, setPair] = React.useState('NXSUSDT');
    const [orderBook, setOrderBook] = React.useState({ buy: [], sell: [] });
    const [loadingBook, setLoadingBook] = React.useState(false);

    // Buy/Sell order state
    const [orderType, setOrderType] = React.useState(0); // 0 = Limit
    const [rate, setRate] = React.useState(0);
    const [volume, setVolume] = React.useState(0);
    const [side, setSide] = React.useState(0); // 0 = Buy, 1 = Sell
    const [submitting, setSubmitting] = React.useState(false);

    // Balances
    const [balances, setBalances] = React.useState({});
    const [loadingBalances, setLoadingBalances] = React.useState(false);

    const publicKey = useSelector(getDecryptedPublicKey);
    const privateKey = useSelector(getDecryptedPrivateKey);

    // Get base/quote from selected pair
    const pairObj = PAIRS.find(p => p.value === pair) || PAIRS[0];
    const base = pairObj.base;
    const quote = pairObj.quote;

    // Fetch order book
    React.useEffect(() => {
        const loadOrderBook = async () => {
            setLoadingBook(true);
            let data = null;
            try {
                // TODO: Remove this once listing is available and trading is open
                if (pair === 'NXSUSDT') {
                    showInfoDialog({ message: 'Sadly enough, NXS is not yet available' });
                } else {
                    data = await fetchOrderBook(pair);
                }
                setOrderBook(data || { buy: [], sell: [] });
            } catch (e) {
                setOrderBook({ buy: [], sell: [] });
                showErrorDialog({ message: 'Failed to fetch order book' });
            } finally {
                setLoadingBook(false);
            }
        };
        loadOrderBook();
    }, [pair]);

    // Fetch balances
    React.useEffect(() => {
        const loadBalances = async () => {
            if (!publicKey || !privateKey) return;
            setLoadingBalances(true);
            try {
                const data = await safeApiCall(getAccountBalances, publicKey, privateKey);
                const dict = {};
                if (data?.list) {
                    data.list.forEach(item => {
                        const iso = item.currency?.iso3 || item.currency?.name;
                        dict[iso] = parseFloat(item.balances?.available || item.balance_available || '0');
                    });
                }
                setBalances(dict);
            } catch (e) {
                setBalances({});
            } finally {
                setLoadingBalances(false);
            }
        };
        loadBalances();
    }, [publicKey, privateKey]);

    // Calculate max volume for buy/sell
    const maxBuyVolume = (() => {
        const availQuote = balances[quote] || 0;
        const r = parseFloat(rate) || 0;
        return r > 0 ? (availQuote / r) : 0;
    })();
    const maxSellVolume = balances[base] || 0;

    // Set volume by percentage (based on buy/sell)
    const setVolumeByPercent = pct => {
        if (side === 0) { // Buy
            if (maxBuyVolume > 0) {
                setVolume(Number((maxBuyVolume * pct).toFixed(8)));
            } else {
                setVolume(0);
            }
        } else { // Sell
            if (maxSellVolume > 0) {
                setVolume(Number((maxSellVolume * pct).toFixed(8)));
            } else {
                setVolume(0);
            }
        }
    };

    // Show how much trade will be in each currency
    const tradeTotal = (() => {
        const v = parseFloat(volume) || 0;
        const r = parseFloat(rate) || 0;
        return (v * r).toFixed(8);
    })();

    const handleOrderSubmit = async (e) => {
        e.preventDefault();
        if (rate < 0 || volume < 0) {
            showErrorDialog({ message: 'Rate and Volume must be zero or greater.' });
            return;
        }
        setSubmitting(true);
        const orderData = {
            type_trade: orderType,
            type: side,
            rate: Number(rate).toFixed(8),
            volume: Number(volume).toFixed(8),
            pair: pair
        };
        console.log('Submitting order:', orderData);
        try {
            const response = await safeApiCall(createOrder, orderData, publicKey, privateKey);
            if (response) {
                showSuccessDialog({ message: `Order ${side === 0 ? 'Buy' : 'Sell'} submitted!` });
                setRate(0);
                setVolume(0);
                // Optionally refresh order book
            } else {
                showErrorDialog({ message: 'Order submission failed.' });
            }
        } catch (error) {
            showErrorDialog({ message: 'Order failed: ' + (error?.message || 'Unknown error') });
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '1000px', margin: 'auto' }}>
            <h2 style={{ color: '#00b7fa', marginBottom: '20px', textAlign: 'center' }}>Trading</h2>
            <FieldSet legend="Order Book" style={{ marginBottom: 30 }}>
                <div style={{
                    display: 'flex',
                    gap: '32px',
                    alignItems: 'flex-start',
                    justifyContent: 'center',
                }}>
                    {/* Buy Orders */}
                    <div style={{ flex: 1 }}>
                        <h4 style={{ color: '#61ff61', marginBottom: 10 }}>Buy Orders</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {loadingBook ? (
                                <div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>Loading...</div>
                            ) : orderBook.buy && orderBook.buy.length > 0 ? (
                                orderBook.buy.slice(0, 10).map((o, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            background: 'rgba(76, 255, 76, 0.08)',
                                            borderRadius: '4px',
                                            padding: '6px 10px',
                                            fontSize: 14,
                                            color: '#61ff61',
                                            cursor: 'pointer',
                                            transition: 'background 0.15s',
                                        }}
                                        onClick={() => {
                                            setSide(1); // Switch to Sell
                                            setRate(o.rate);
                                        }}
                                        onMouseOver={e => (e.currentTarget.style.background = 'rgba(76,255,76,0.18)')}
                                        onMouseOut={e => (e.currentTarget.style.background = 'rgba(76,255,76,0.08)')}
                                        title="Click to auto-fill Sell order at this price"
                                    >
                                        <span>Vol: {o.volume}</span>
                                        <span>Rate: {o.rate}</span>
                                        <span>Count: {o.count}</span>
                                    </div>
                                ))
                            ) : (
                                <div style={{ color: '#888', textAlign: 'center', padding: '10px' }}>No buy orders</div>
                            )}
                        </div>
                    </div>
                    {/* Sell Orders */}
                    <div style={{ flex: 1 }}>
                        <h4 style={{ color: '#ff6161', marginBottom: 10 }}>Sell Orders</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                            {loadingBook ? (
                                <div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>Loading...</div>
                            ) : orderBook.sell && orderBook.sell.length > 0 ? (
                                orderBook.sell.slice(0, 10).map((o, i) => (
                                    <div
                                        key={i}
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            background: 'rgba(255, 76, 76, 0.08)',
                                            borderRadius: '4px',
                                            padding: '6px 10px',
                                            fontSize: 14,
                                            color: '#ff6161',
                                            cursor: 'pointer',
                                            transition: 'background 0.15s',
                                        }}
                                        onClick={() => {
                                            setSide(0); // Switch to Buy
                                            setRate(o.rate);
                                        }}
                                        onMouseOver={e => (e.currentTarget.style.background = 'rgba(255,76,76,0.18)')}
                                        onMouseOut={e => (e.currentTarget.style.background = 'rgba(255,76,76,0.08)')}
                                        title="Click to auto-fill Buy order at this price"
                                    >
                                        <span>Vol: {o.volume}</span>
                                        <span>Rate: {o.rate}</span>
                                        <span>Count: {o.count}</span>
                                    </div>
                                ))
                            ) : (
                                <div style={{ color: '#888', textAlign: 'center', padding: '10px' }}>No sell orders</div>
                            )}
                        </div>
                    </div>
                </div>
                <div style={{ marginTop: 16, display: 'flex', justifyContent: 'center' }}>
                    <StyledDropdownWrapper label="Trading Pair" style={{ minWidth: 200 }}>
                        <StyledSelect value={pair} onChange={e => setPair(e.target.value)}>
                            {PAIRS.map((p) => (
                                <option key={p.value} value={p.value}>{p.label}</option>
                            ))}
                        </StyledSelect>
                    </StyledDropdownWrapper>
                </div>
            </FieldSet>

            <FieldSet legend="Buy/Sell Order">

                {/* Balances Row */}
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 24,
                    marginBottom: 18,
                    flexWrap: 'wrap',
                    fontSize: 16,
                    color: '#ccc'
                }}>
                    <span>
                        Available {base}: <span style={{ color: balances[base] > 0 ? '#00b7fa' : '#bbbbbb' }}>{balances[base] || 0}</span>
                    </span>
                    <span>
                        Available {quote}: <span style={{ color: balances[quote] > 0 ? '#00b7fa' : '#bbbbbb' }}>{balances[quote] || 0}</span>
                    </span>
                </div>

                {/* Dropdowns Row */}
                <div style={{
                    display: 'flex',
                    gap: 16,
                    marginBottom: 16,
                    flexWrap: 'wrap',
                    width: '100%'
                }}>
                    <StyledDropdownWrapper label="Side" style={{ flex: 1, minWidth: 160 }}>
                        <StyledSelect value={side} onChange={e => setSide(Number(e.target.value))}>
                            <option value={0}>Buy</option>
                            <option value={1}>Sell</option>
                        </StyledSelect>
                    </StyledDropdownWrapper>
                    <StyledDropdownWrapper label="Order Type" style={{ flex: 1, minWidth: 160 }}>
                        <StyledSelect value={orderType} onChange={e => setOrderType(Number(e.target.value))}>
                            <option value={0}>Limit</option>
                        </StyledSelect>
                    </StyledDropdownWrapper>
                </div>

                {/* Rate and Volume Row */}
                <div style={{
                    display: 'flex',
                    gap: 16,
                    marginBottom: 8,
                    width: '100%',
                    flexWrap: 'wrap',
                }}>
                    <div style={{ flex: 1, minWidth: 140 }}>
                        <label style={{ color: '#aaa', fontSize: 13, marginBottom: 2, display: 'block' }}>Rate ({quote})</label>
                        <TextField
                            value={rate}
                            onChange={e => setRate(Math.max(0, Number(e.target.value)))}
                            placeholder="0"
                            style={{ width: '100%', height: 40 }}
                            required
                            type="number"
                            min="0"
                            step="any"
                        />
                    </div>
                    <div style={{ flex: 1, minWidth: 140 }}>
                        <label style={{ color: '#aaa', fontSize: 13, marginBottom: 2, display: 'block' }}>Volume ({base})</label>
                        <TextField
                            value={volume}
                            onChange={e => setVolume(Math.max(0, Number(e.target.value)))}
                            placeholder="0"
                            style={{ width: '100%', height: 40 }}
                            required
                            type="number"
                            min="0"
                            step="any"
                        />
                        <div style={{ display: 'flex', gap: 8, marginTop: 2, fontSize: 13 }}>
                            {[0.25, 0.5, 0.75, 1].map(pct => (
                                <span
                                    key={pct}
                                    style={{ color: '#00b7fa', cursor: 'pointer', textDecoration: 'underline' }}
                                    onClick={() => setVolumeByPercent(pct)}
                                >
                                    {Math.round(pct * 100)}%
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Buy/Sell Button Row */}
                <Button
                    type="submit"
                    onClick={handleOrderSubmit}
                    disabled={
                        submitting ||
                        loadingBalances ||
                        Number(volume) <= 0 ||
                        Number(rate) <= 0 ||
                        (side === 0 && Number(volume) * Number(rate) > (balances[quote] || 0)) ||
                        (side === 1 && Number(volume) > (balances[base] || 0))
                    }
                    style={{
                        width: '100%',
                        height: 44,
                        marginTop: 12,
                        backgroundColor: side === 0 ? '#00b7fa' : '#f44336',
                        color: 'white',
                        borderRadius: '4px',
                        fontWeight: 600,
                        fontSize: 17,
                        border: 'none',
                        cursor: submitting ? 'not-allowed' : 'pointer',
                        opacity: submitting ? 0.7 : 1,
                    }}
                >
                    {side === 0 ? 'Buy' : 'Sell'}
                </Button>

                {/* Total Row */}
                <div style={{
                    marginTop: 18,
                    fontSize: 14,
                    color: '#aaa'
                }}>
                    Total: {(Number(volume) * Number(rate)).toFixed(8)} {quote}
                </div>
            </FieldSet>
        </div>
    );
}