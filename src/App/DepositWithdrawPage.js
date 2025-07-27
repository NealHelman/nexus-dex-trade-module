import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { getMarkets } from '../utils/dexTradeApi';

export default function DepositWithdrawPage() {
  const [supportedCurrencies, setSupportedCurrencies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCurrencies();
  }, []);

  const loadCurrencies = async () => {
    try {
      const markets = await getMarkets();
      console.log('Markets:', markets);
      
      const currencies = new Set();
      if (markets && Array.isArray(markets)) {
        markets.forEach(market => {
          if (market.symbol && market.symbol.includes('-')) {
            const [base, quote] = market.symbol.split('-');
            currencies.add(base);
            currencies.add(quote);
          }
        });
      }
      
      setSupportedCurrencies(Array.from(currencies).sort());
    } catch (error) {
      console.error('Error loading currencies:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: '#00b7fa' }}>
        Loading...
      </div>
    );
  }

  return (
    <div style={{ padding: '20px', color: '#ccc' }}>
      <h2 style={{ color: '#00b7fa', marginBottom: '20px' }}>
        Deposit & Withdraw
      </h2>
      
      <div style={{ marginBottom: '20px' }}>
        <h3>Supported Currencies ({supportedCurrencies.length}):</h3>
        <p>{supportedCurrencies.join(', ')}</p>
      </div>
      
      <div style={{ color: '#ffa500' }}>
        ⚠️ NXS listing coming soon to Dex-Trade
      </div>
    </div>
  );
}