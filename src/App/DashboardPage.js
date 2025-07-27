import { useSelector } from 'react-redux';
import { getAccountBalances, getRecentOrders, getMarketTicker, getMarkets } from '../utils/dexTradeApi';
import { getDecryptedPublicKey, getDecryptedPrivateKey } from '../selectors/settingsSelectors';
import { StyledDropdownWrapper, StyledSelect, ModalFooterBar, ModalButton, StyledTextField, StyledTextArea } from '../Styles/StyledComponents';

const {
  libraries: {
    React,
  },
  components: {
    Button,
    Panel,
    FieldSet
  },
  utilities: {
    showErrorDialog,
    showInfoDialog,
  }
} = NEXUS;

const { useState, useEffect } = React;

export default function DashboardPage() {
  const publicKey = useSelector(getDecryptedPublicKey);
  const privateKey = useSelector(getDecryptedPrivateKey);
  const [balances, setBalances] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [marketData, setMarketData] = useState({});
  const [markets, setMarkets] = useState([]);
  const [selectedPair, setSelectedPair] = useState('BTCUSDT');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadMarketsData = async () => {
    try {
      const marketsData = await getMarkets();
      console.log('marketsData: ', marketsData);
      setMarkets(marketsData || []);
      
      // Set default selected pair if not already set and markets are available
      if (marketsData && marketsData.length > 0 && !selectedPair) {
        setSelectedPair(marketsData[0].pair);
      }
    } catch (error) {
      console.error('Failed to load markets data:', error);
    }
  };

  const loadDashboardData = async () => {
    if (!publicKey || !privateKey) return;
    const token = publicKey;
    const secret = privateKey;
    
    setLoading(true);
    try {
      const [balancesData, ordersData, tickerData] = await Promise.all([
        getAccountBalances(token, secret),
        getRecentOrders(token, secret, 5),
        getMarketTicker('BTCUSDT').catch(() => null)
      ]);
      
      console.log('balancesData: ', balancesData);

      // Filter and process balances data
      const processedBalances = balancesData?.list
        ? balancesData.list
            .filter(item => {
              // Check if there's any balance (available or total)
              const hasBalance = 
                (item.balance_available && parseFloat(item.balance_available) > 0) ||
                (item.balance && parseFloat(item.balance) > 0) ||
                (item.balances?.available && parseFloat(item.balances.available) > 0) ||
                (item.balances?.total && parseFloat(item.balances.total) > 0);
              return hasBalance;
            })
            .map(item => ({
              // Standardize the data structure for easier use in the UI
              currency: item.currency?.iso3 || item.currency?.name || 'Unknown',
              currencyName: item.currency?.name || item.currency?.iso3 || 'Unknown',
              available: item.balances?.available || item.balance_available || '0',
              locked: item.balances?.locked || '0',
              total: item.balances?.total || item.balance || '0'
            }))
        : [];

      setBalances(processedBalances);
      setRecentOrders(ordersData?.orders || []);
      setMarketData(tickerData || {});
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Load markets on component mount
  useEffect(() => {
    loadMarketsData();
  }, []);

  useEffect(() => {
    loadDashboardData();
    
    // ***** TODO: TURN BACK ON *****
    // Auto-refresh every 30 seconds
    //const interval = setInterval(loadDashboardData, 30000);
    //return () => clearInterval(interval);
}, [publicKey, privateKey]);

  const handlePairChange = (newPair) => {
    setSelectedPair(newPair);
  };

  const formatBalance = (balance) => {
    const num = parseFloat(balance);
    return num.toFixed(8);
  };

  const formatPrice = (price) => {
    const num = parseFloat(price);
    return num.toFixed(8);
  };

  // Create dropdown options from markets data
  const marketOptions = markets.map(market => ({
    value: market.pair,
    label: `${market.pair} (${market.base}/${market.quote})`
  }));

  if (loading && !balances.length) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div style={{ color: '#00b7fa', fontSize: '16px' }}>Loading dashboard...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: 'auto auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <h2 style={{ color: '#00b7fa', margin: 0 }}>Dashboard</h2>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          {lastUpdated && (
            <span style={{ fontSize: '12px', color: '#888' }}>
              Last updated: {lastUpdated}
            </span>
          )}
          <Button
            skin="secondary"
            onClick={loadDashboardData}
            disabled={loading}
            style={{ 
              padding: '6px 12px',
              fontSize: '14px',
              backgroundColor: 'transparent',
              border: '1px solid #00b7fa',
              borderRadius: '4px',
              color: '#00b7fa'
            }}
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
      </div>

      {/* Account Balances */}
      <FieldSet legend="Account Balances" style={{ marginBottom: '20px' }}>
        <div style={{ padding: '15px' }}>
          {balances.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              {balances.map((balance, index) => (
                <div key={balance.currency} style={{ 
                  padding: '12px', 
                  backgroundColor: 'rgba(0, 183, 250, 0.1)', 
                  borderRadius: '4px',
                  border: '1px solid rgba(0, 183, 250, 0.3)'
                }}>
                  <div style={{ fontWeight: 'bold', color: '#00b7fa', marginBottom: '5px' }}>
                    {balance.currency}
                  </div>
                  <div style={{ fontSize: '12px', color: '#888', marginBottom: '5px' }}>
                    {balance.currencyName}
                  </div>
                  <div style={{ fontSize: '14px', color: '#ccc' }}>
                    Available: {formatBalance(balance.available)}
                  </div>
                  {parseFloat(balance.locked) > 0 && (
                    <div style={{ fontSize: '14px', color: '#888' }}>
                      Locked: {formatBalance(balance.locked)}
                    </div>
                  )}
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                    Total: {formatBalance(balance.total)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
              No balances to display
            </div>
          )}
        </div>
      </FieldSet>

      {/* Market Info */}
      <FieldSet legend="Market Data" style={{ marginBottom: '20px' }}>
        <div style={{ padding: '15px' }}>
          {/* Market Pair Selector */}
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
            <StyledDropdownWrapper label="Trading Pair" style={{ minWidth: 250 }}>
              <StyledSelect 
                value={selectedPair} 
                onChange={(e) => handlePairChange(e.target.value)}
              >
                <option value="">Select a trading pair...</option>
                {markets.map(market => (
                  <option key={market.id} value={market.pair}>
                    {market.pair} ({market.base}/{market.quote})
                  </option>
                ))}
              </StyledSelect>
            </StyledDropdownWrapper>
          </div>

          {/* Market Data Display */}
          <div>
            <h3 style={{ color: '#00b7fa', textAlign: 'center', marginBottom: '15px' }}>
              {selectedPair ? `${selectedPair} Market Data` : 'Market Data'}
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div style={{ color: '#ccc' }}>
                <strong>Last Price:</strong>
                {selectedPair && marketData && (
                  <React.Fragment>
                    <br />{formatPrice(marketData.last || 0)}
                  </React.Fragment>
                )}
              </div>
              <div style={{ color: '#ccc' }}>
                <strong>High (24h):</strong>
                {selectedPair && marketData && (
                  <React.Fragment>
                    <br />{formatPrice(marketData.high || 0)}
                  </React.Fragment>
                )}
              </div>
              <div style={{ color: '#ccc' }}>
                <strong>Low (24h):</strong>
                {selectedPair && marketData && (
                  <React.Fragment>
                    <br />{formatPrice(marketData.low || 0)}
                  </React.Fragment>
                )}
              </div>
              <div style={{ color: '#ccc' }}>
                <strong>24h Volume:</strong>
                {selectedPair && marketData && (
                  <React.Fragment>
                    <br />{formatBalance(marketData.volume_24H || 0)}
                  </React.Fragment>
                )}
              </div>
              {selectedPair && marketData && marketData.close !== undefined && marketData.close > 0 && (
                <div style={{ color: '#ccc' }}>
                  <strong>Close:</strong>
                  <br />{formatPrice(marketData.close)}
                </div>
              )}
            </div>
            {!selectedPair && (
              <div style={{ color: '#888', textAlign: 'center', padding: '20px', marginTop: '10px' }}>
                Select a trading pair to view market data
              </div>
            )}
          </div>
        </div>
      </FieldSet>

      {/* Quick Actions */}
      <FieldSet legend="Quick Actions" style={{ marginBottom: '20px' }}>
        <div style={{ padding: '15px', display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'center' }}>
          <Button
            skin="primary"
            onClick={() => showInfoDialog({ message: 'Trade feature coming soon!' })}
            style={{ 
              padding: '10px 20px',
              backgroundColor: '#00b7fa',
              border: 'none',
              borderRadius: '4px',
              color: 'black'
            }}
          >
            Quick Trade
          </Button>
          <Button
            skin="secondary"
            onClick={() => showInfoDialog({ message: 'Deposit feature coming soon!' })}
            style={{ 
              padding: '10px 20px',
              backgroundColor: 'transparent',
              border: '2px solid #00b7fa',
              borderRadius: '4px',
              color: '#00b7fa'
            }}
          >
            Deposit NXS
          </Button>
          <Button
            skin="secondary"
            onClick={() => showInfoDialog({ message: 'Withdraw feature coming soon!' })}
            style={{ 
              padding: '10px 20px',
              backgroundColor: 'transparent',
              border: '2px solid #666',
              borderRadius: '4px',
              color: '#ccc'
            }}
          >
            Withdraw
          </Button>
        </div>
      </FieldSet>

      {/* Recent Orders */}
      <FieldSet legend="Recent Orders" style={{ marginBottom: '20px' }}>
        <div style={{ padding: '15px' }}>
          {recentOrders && recentOrders.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #333' }}>
                    <th style={{ textAlign: 'left', padding: '8px', color: '#00b7fa' }}>Pair</th>
                    <th style={{ textAlign: 'left', padding: '8px', color: '#00b7fa' }}>Type</th>
                    <th style={{ textAlign: 'left', padding: '8px', color: '#00b7fa' }}>Amount</th>
                    <th style={{ textAlign: 'left', padding: '8px', color: '#00b7fa' }}>Price</th>
                    <th style={{ textAlign: 'left', padding: '8px', color: '#00b7fa' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentOrders.slice(0, 5).map((order, index) => (
                    <tr key={index} style={{ borderBottom: '1px solid #222' }}>
                      <td style={{ padding: '8px', color: '#ccc' }}>{order[0].pair}</td>
                      <td style={{ 
                        padding: '8px', 
                        color: order.side === 'buy' ? '#4CAF50' : '#f44336' 
                      }}>
                        {order.side}
                      </td>
                      <td style={{ padding: '8px', color: '#ccc' }}>{formatBalance(order[0].amount)}</td>
                      <td style={{ padding: '8px', color: '#ccc' }}>{formatPrice(order[0].price)}</td>
                      <td style={{ padding: '8px', color: '#ccc' }}>{order.status}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ color: '#888', textAlign: 'center', padding: '20px' }}>
              No recent orders
            </div>
          )}
        </div>
      </FieldSet>
    </div>
  );
}