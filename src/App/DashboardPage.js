import { useSelector } from 'react-redux';
import { getAccountBalances, getRecentOrders, getMarketTicker } from '../utils/dexTradeApi';
import { getDecryptedPublicKey, getDecryptedPrivateKey } from '../selectors/settingsSelectors';

const {
  libraries: {
    React,
  },
  components: {
    Button,
    Panel,
    FieldSet,
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
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadDashboardData = async () => {
    if (!publicKey || !privateKey) return;
    
    setLoading(true);
    try {
      const [balancesData, ordersData, tickerData] = await Promise.all([
        getAccountBalances(privateKey, publicKey),
        getRecentOrders(privateKey, publicKey, 5),
        getMarketTicker('BTCUSDT').catch(() => null)
      ]);

      setBalances(balancesData?.balances || []);
      setRecentOrders(ordersData?.orders || []);
      setMarketData(tickerData || {});
      setLastUpdated(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
    
    // ***** TURN BACK ON *****
    // Auto-refresh every 30 seconds
    //const interval = setInterval(loadDashboardData, 30000);
    //return () => clearInterval(interval);
}, [publicKey, privateKey]);

  const formatBalance = (balance) => {
    const num = parseFloat(balance);
    return num.toFixed(8);
  };

  const formatPrice = (price) => {
    const num = parseFloat(price);
    return num.toFixed(8);
  };

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
              {balances
                .filter(balance => parseFloat(balance.available) > 0 || parseFloat(balance.locked) > 0)
                .map(balance => (
                <div key={balance.currency} style={{ 
                  padding: '12px', 
                  backgroundColor: 'rgba(0, 183, 250, 0.1)', 
                  borderRadius: '4px',
                  border: '1px solid rgba(0, 183, 250, 0.3)'
                }}>
                  <div style={{ fontWeight: 'bold', color: '#00b7fa', marginBottom: '5px' }}>
                    {balance.currency}
                  </div>
                  <div style={{ fontSize: '14px', color: '#ccc' }}>
                    Available: {formatBalance(balance.available)}
                  </div>
                  {parseFloat(balance.locked) > 0 && (
                    <div style={{ fontSize: '14px', color: '#888' }}>
                      Locked: {formatBalance(balance.locked)}
                    </div>
                  )}
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
      {marketData.pair && (
        <FieldSet legend={`${marketData.pair} Market Data`} style={{ marginBottom: '20px' }}>
          <div style={{ padding: '15px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
            <div style={{ color: '#ccc' }}>
              <strong>Last Price:</strong> {formatPrice(marketData.last || 0)}
            </div>
            <div style={{ color: '#ccc' }}>
              <strong>High (24h):</strong> {formatPrice(marketData.high || 0)}
            </div>
            <div style={{ color: '#ccc' }}>
              <strong>Low (24h):</strong> {formatPrice(marketData.low || 0)}
            </div>
            <div style={{ color: '#ccc' }}>
              <strong>24h Volume:</strong> {formatBalance(marketData.volume_24h || 0)}
            </div>
            {marketData.close !== undefined && (
              <div style={{ color: '#ccc' }}>
                <strong>Close:</strong> {formatPrice(marketData.close)}
              </div>
            )}
          </div>
        </FieldSet>
      )}

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
              borderRadius: '4px'
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
          {recentOrders.length > 0 ? (
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
                      <td style={{ padding: '8px', color: '#ccc' }}>{order.pair}</td>
                      <td style={{ 
                        padding: '8px', 
                        color: order.side === 'buy' ? '#4CAF50' : '#f44336' 
                      }}>
                        {order.side}
                      </td>
                      <td style={{ padding: '8px', color: '#ccc' }}>{formatBalance(order.amount)}</td>
                      <td style={{ padding: '8px', color: '#ccc' }}>{formatPrice(order.price)}</td>
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