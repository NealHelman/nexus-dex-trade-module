import { useSelector } from 'react-redux';
import { getDepositAddress, initiateWithdrawal, sendWithdrawalPin, confirmWithdrawal } from '../utils/dexTradeApi';
import { getDecryptedPublicKey, getDecryptedPrivateKey } from '../selectors/settingsSelectors';
import { StyledDropdownWrapper, StyledSelect } from '../Styles/StyledComponents';
import QRCodeDisplay from '../shared/components/QRCodeDisplay';

const {
  libraries: {
    React,
    ReactDOM
  },
  components: {
    Button,
    FieldSet,
    TextField
  },
  utilities: {
    showErrorDialog,
    showInfoDialog,
    showSuccessDialog,
    copyToClipboard,
    apiCall,
    openInBrowser
  }
} = NEXUS;

const { useState, useEffect } = React;

const SUPPORTED_CURRENCIES = [
  { iso: 'NXS', name: 'Nexus', network: null },
  { iso: 'USDT', name: 'Tether', network: 'ETH' }
];

export default function DepositWithdrawPage() {
  const publicKey = useSelector(getDecryptedPublicKey);
  const privateKey = useSelector(getDecryptedPrivateKey);
  
  // Access Nexus address book from Redux state
  const addressBook = useSelector(state => state?.nexus?.addressBook || {});

  // Deposit state
  const [selectedDepositCurrency, setSelectedDepositCurrency] = useState('NXS');
  const [depositAddress, setDepositAddress] = useState('');
  const [loadingAddress, setLoadingAddress] = useState(false);

  // Withdraw state
  const [selectedWithdrawCurrency, setSelectedWithdrawCurrency] = useState('NXS');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawalId, setWithdrawalId] = useState(null);
  const [emailPin, setEmailPin] = useState('');
  const [googlePin, setGooglePin] = useState('');
  const [withdrawalStep, setWithdrawalStep] = useState('form'); // 'form', 'confirm', 'complete'
  const [loading, setLoading] = useState(false);

  // NXS wallet integration state
  const [nxsAccounts, setNxsAccounts] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  // Load deposit address when currency changes
  useEffect(() => {
    if (selectedDepositCurrency && publicKey && privateKey) {
      // TODO: Remove this once listing is available and trading is open
      if (selectedDepositCurrency === 'NXS') {
        showInfoDialog({ message: 'Sadly enough, NXS is not yet available' });
      } else {
        loadDepositAddress();
      }
    }
  }, [selectedDepositCurrency, publicKey, privateKey]);

  // Load NXS accounts on component mount
  useEffect(() => {
    loadNxsAccounts();
  }, []);

  const loadDepositAddress = async () => {
    if (!publicKey || !privateKey) return;
    
    setLoadingAddress(true);
    try {
      const currency = SUPPORTED_CURRENCIES.find(c => c.iso === selectedDepositCurrency);
      const response = await getDepositAddress(
        publicKey, 
        privateKey, 
        currency.iso, 
        currency.network
      );
      
      if (response && response.address) {
        setDepositAddress(response.address);
      } else {
        showErrorDialog({ message: 'Failed to get deposit address' });
      }
    } catch (error) {
      console.error('Failed to load deposit address:', error);
      showErrorDialog({ message: 'Failed to load deposit address' });
    } finally {
      setLoadingAddress(false);
    }
  };

  const loadNxsAccounts = async () => {
    try {
      setLoadingAccounts(true);
      
      // Use the proper Nexus API call to get NXS accounts with balance > 0
      const response = await apiCall("finance/list/account", {
        verbose: "summary",
        where: "results.ticker=NXS AND results.total>0"
      });
      
      if (response && response.length > 0) {
        const accounts = response.map(account => ({
          name: account.name,
          address: account.address,
          balance: account.total.toFixed(6)
        }));
        setNxsAccounts(accounts);
      } else {
        setNxsAccounts([]);
      }
    } catch (error) {
      console.error('Failed to load NXS accounts:', error);
      showErrorDialog({ message: 'Failed to load NXS accounts from wallet' });
      setNxsAccounts([]);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleCopyAddress = async () => {
    try {
      await copyToClipboard(depositAddress);
      showSuccessDialog({ message: 'Address copied to clipboard!' });
    } catch (error) {
      showErrorDialog({ message: 'Failed to copy address' });
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawAmount || !withdrawAddress) {
      showErrorDialog({ message: 'Please fill in all fields' });
      return;
    }

    setLoading(true);
    try {
      const response = await initiateWithdrawal(
        publicKey,
        privateKey,
        selectedWithdrawCurrency,
        withdrawAmount,
        withdrawAddress
      );

      if (response && response.id) {
        setWithdrawalId(response.id);
        setWithdrawalStep('confirm');
        showInfoDialog({ 
          message: 'Withdrawal initiated! Please check your email for the confirmation PIN.' 
        });
      } else {
        showErrorDialog({ message: 'Failed to initiate withdrawal' });
      }
    } catch (error) {
      console.error('Withdrawal failed:', error);
      showErrorDialog({ message: 'Failed to initiate withdrawal' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendPin = async () => {
    if (!withdrawalId) return;

    setLoading(true);
    try {
      await sendWithdrawalPin(publicKey, privateKey, withdrawalId);
      showSuccessDialog({ message: 'Confirmation PIN sent to your email!' });
    } catch (error) {
      console.error('Failed to send PIN:', error);
      showErrorDialog({ message: 'Failed to send confirmation PIN' });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmWithdrawal = async () => {
    if (!emailPin) {
      showErrorDialog({ message: 'Please enter the email PIN' });
      return;
    }

    setLoading(true);
    try {
      const response = await confirmWithdrawal(
        publicKey,
        privateKey,
        withdrawalId,
        emailPin,
        googlePin || null
      );

      if (response && response.success) {
        setWithdrawalStep('complete');
        showSuccessDialog({ message: 'Withdrawal confirmed successfully!' });
        // Reset form
        setWithdrawAmount('');
        setWithdrawAddress('');
        setEmailPin('');
        setGooglePin('');
        setWithdrawalId(null);
      } else {
        showErrorDialog({ message: 'Failed to confirm withdrawal' });
      }
    } catch (error) {
      console.error('Confirmation failed:', error);
      showErrorDialog({ message: 'Failed to confirm withdrawal' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendFromWallet = async () => {
    if (!selectedAccount || !sendAmount || !depositAddress) {
      showErrorDialog({ message: 'Please fill in all fields' });
      return;
    }

    try {
      setLoading(true);
      
      // Get the account name from the selected account
      const account = nxsAccounts.find(acc => acc.address === selectedAccount);
      if (!account) {
        throw new Error('Selected account not found');
      }

      // Send NXS using the Nexus API
      const response = await apiCall("finance/debit/account", {
        name: account.name,
        to: depositAddress,
        amount: parseFloat(sendAmount)
      });

      if (response && response.txid) {
        showSuccessDialog({ 
          message: `Successfully sent ${sendAmount} NXS to your Dex-Trade account!\nTransaction ID: ${response.txid}` 
        });
        setSendAmount('');
        setSelectedAccount('');
        // Reload accounts to update balances
        loadNxsAccounts();
      } else {
        throw new Error('Transaction failed');
      }
    } catch (error) {
      console.error('Send failed:', error);
      showErrorDialog({ message: `Failed to send NXS from wallet: ${error.message}` });
    } finally {
      setLoading(false);
    }
  };

  const resetWithdrawalForm = () => {
    setWithdrawalStep('form');
    setWithdrawAmount('');
    setWithdrawAddress('');
    setEmailPin('');
    setGooglePin('');
    setWithdrawalId(null);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '1000px', margin: 'auto' }}>
      <h2 style={{ color: '#00b7fa', marginBottom: '20px', textAlign: 'center' }}>Deposit & Withdraw</h2>

      {/* Deposits Section */}
      <FieldSet legend="Deposit Funds" style={{ marginBottom: '30px' }}>
        <div style={{ padding: '20px' }}>
          {/* Currency Selector */}
          <label htmlFor="filterSelect" style={{ marginBottom: 'auto', marginTop: 'auto', textAlign: 'center' }}>
            <span>Currency: </span>
            <StyledDropdownWrapper label='Currency' style={{ minWidth: 200 }}>
              <StyledSelect 
                value={selectedDepositCurrency}
                onChange={(e) => setSelectedDepositCurrency(e.target.value)}
              >
                {SUPPORTED_CURRENCIES.map(currency => (
                  <option key={currency.iso} value={currency.iso}>
                    {currency.name} ({currency.iso})
                  </option>
                ))}
              </StyledSelect>
            </StyledDropdownWrapper>
          </label>
        </div>

        {/* Deposit Address Display */}
        {loadingAddress ? (
          <div style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
            Loading deposit address...
          </div>
        ) : depositAddress ? (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '20px', alignItems: 'start' }}>
            <div>
              <div style={{ marginBottom: '10px' }}>
                <strong style={{ color: '#00b7fa' }}>Deposit Address:</strong>
              </div>
              <div style={{ 
                padding: '12px', 
                backgroundColor: 'rgba(0, 183, 250, 0.1)', 
                borderRadius: '4px',
                border: '1px solid rgba(0, 183, 250, 0.3)',
                wordBreak: 'break-all',
                fontFamily: 'monospace',
                fontSize: '14px',
                marginBottom: '10px'
              }}>
                {depositAddress}
              </div>
              <div style={{ textAlign: 'center' }}>
                <Button
                  onClick={handleCopyAddress}
                  style={{ 
                    padding: '8px 16px',
                    backgroundColor: '#00b7fa',
                    border: 'none',
                    borderRadius: '4px',
                    color: 'white'
                  }}
                >
                  Copy Address
                </Button>
              </div>
            </div>
            {depositAddress && (
              <div style={{ marginTop: '20px' }}>
                <QRCodeDisplay address={depositAddress} size={200} />
                <p style={{ fontSize: '0.8em', color: '#888', marginTop: '10px' }}>
                  Scan this QR code or copy the address above to deposit {selectedDepositCurrency}
                </p>
              </div>
            )}
          </div>
        ) : (
          <div style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
            Select a currency to get deposit address
          </div>
        )}

        {/* NXS Wallet Integration */}
        {selectedDepositCurrency === 'NXS' && depositAddress && (
          <div style={{ 
            marginTop: '30px', 
            padding: '20px', 
            backgroundColor: 'rgba(76, 175, 80, 0.1)',
            borderRadius: '8px',
            border: '1px solid rgba(76, 175, 80, 0.3)'
          }}>
            <h4 style={{ color: '#4CAF50', marginBottom: '15px' }}>
              Send NXS from Your Wallet
            </h4>
            
            {loadingAccounts ? (
              <div style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
                Loading wallet accounts...
              </div>
            ) : nxsAccounts.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '15px', alignItems: 'end' }}>
                <div>
                  <StyledDropdownWrapper label="From Account" style={{ minWidth: 200 }}>
                    <StyledSelect 
                      value={selectedAccount}
                      onChange={(e) => setSelectedAccount(e.target.value)}
                    >
                      <option value="">Select account...</option>
                      {nxsAccounts.map((account, index) => (
                        <option key={index} value={account.address}>
                          {account.name} ({account.balance} NXS)
                        </option>
                      ))}
                    </StyledSelect>
                  </StyledDropdownWrapper>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>
                    Amount (NXS)
                  </label>
                  <TextField
                    type="number"
                    value={sendAmount}
                    onChange={(e) => setSendAmount(e.target.value)}
                    placeholder="0.00"
                    style={{ width: '100%' }}
                  />
                </div>
                <Button
                  onClick={handleSendFromWallet}
                  disabled={loading || !selectedAccount || !sendAmount}
                  style={{ 
                    padding: '10px 20px',
                    backgroundColor: '#4CAF50',
                    border: 'none',
                    borderRadius: '4px',
                    color: 'white'
                  }}
                >
                  {loading ? 'Sending...' : 'Send to Exchange'}
                </Button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#888', padding: '20px' }}>
                No NXS accounts with balance found in your wallet
              </div>
            )}
          </div>
        )}
      </FieldSet>
      
      {/* Withdrawals Section */}
      <FieldSet legend="Withdraw Funds" style={{ marginBottom: '20px' }}>
        <div style={{ padding: '20px' }}>
          {withdrawalStep === 'form' && (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '24px', // space between rows
                marginBottom: '20px'
              }}
            >
              {/* Row 1: Withdrawal Currency */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div style={{ minWidth: 230 }}>
                  <label style={{ color: '#ccc', fontWeight: 500 }}>
                    Withdrawal From This Crypto on Your Dex-Trade Account
                  </label>
                </div>
                <StyledDropdownWrapper label="Currency" style={{ flex: 1 }}>
                  <StyledSelect 
                    value={selectedWithdrawCurrency}
                    onChange={(e) => setSelectedWithdrawCurrency(e.target.value)}
                  >
                    {SUPPORTED_CURRENCIES.map(currency => (
                      <option key={currency.iso} value={currency.iso}>
                        {currency.name} ({currency.iso})
                      </option>
                    ))}
                  </StyledSelect>
                </StyledDropdownWrapper>
              </div>

              {/* Row 2: Withdrawal Amount */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                <div style={{ minWidth: 230 }}>
                  <label style={{ color: '#ccc', fontWeight: 500 }}>
                    Amount to Withdraw
                  </label>
                </div>
                <TextField
                  type="number"
                  value={withdrawAmount}
                  onChange={e => setWithdrawAmount(e.target.value)}
                  placeholder="0.00"
                  min="0"
                  step="any"
                  style={{ width: '100%' }}
                />
              </div>

              {/* Row 3: Withdrawal Address */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '24px' }}>
                <div style={{ minWidth: 230 }}>
                  <label style={{ color: '#ccc', fontWeight: 500 }}>
                    Withdrawal To This Address
                  </label>
                </div>
                <div style={{ flex: 1 }}>
                  {selectedWithdrawCurrency === 'NXS' ? (
                    <>
                      <StyledDropdownWrapper label="Your NXS Address">
                        <StyledSelect
                          value={
                            nxsAccounts.some(acc => acc.address === withdrawAddress)
                              ? withdrawAddress
                              : ""
                          }
                          onChange={e => setWithdrawAddress(e.target.value)}
                          style={{ width: '100%' }}
                        >
                          <option value="">Select your NXS address</option>
                          {nxsAccounts.map(account => (
                            <option key={account.address} value={account.address}>
                              {account.name ? `${account.name} (${account.address})` : account.address}
                            </option>
                          ))}
                        </StyledSelect>
                      </StyledDropdownWrapper>
                      <TextField
                        type="text"
                        value={withdrawAddress}
                        onChange={e => setWithdrawAddress(e.target.value)}
                        placeholder="Enter or paste any NXS address"
                        style={{ width: '100%', marginTop: 10 }}
                      />
                      <div style={{ color: '#888', fontSize: '0.9em', marginTop: 4 }}>
                        Select from your wallet or enter any Nexus address.
                      </div>
                    </>
                  ) : (
                    <TextField
                      type="text"
                      value={withdrawAddress}
                      onChange={e => setWithdrawAddress(e.target.value)}
                      placeholder="Enter destination address"
                      style={{ width: '100%' }}
                    />
                  )}
                </div>
              </div>
              <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: 'rgba(255, 193, 7, 0.1)', borderRadius: '4px', border: '1px solid rgba(255, 193, 7, 0.3)' }}>
                <div style={{ color: '#FFC107', marginBottom: '10px' }}>
                  <strong>⚠️ Important Notes:</strong>
                </div>
                <ul style={{ color: '#ccc', margin: 0, paddingLeft: '20px' }}>
                  <li>Double-check the withdrawal address before proceeding</li>
                  <li>You will receive an email confirmation PIN</li>
                  <li>If 2FA is enabled, you'll also need your Google Authenticator code</li>
                  <li>Check current withdrawal fees at{' '}
                  <span className='linkStyle' onClick={() => openInBrowser('https://dex-trade.com/fees/')}>dex-trade.com/fees</span></li>
                </ul>
              </div>

              <Button
                skin="filled-primary"
                onClick={handleWithdraw}
                disabled={loading || !withdrawAmount || !withdrawAddress}
                style={{ 
                  padding: '12px 24px',
                  border: 'none',
                  borderRadius: '4px',
                  color: 'white'
                }}
              >
                {loading ? 'Processing...' : 'Initiate Withdrawal'}
              </Button>
            </div>
            )}

          {withdrawalStep === 'confirm' && (
            <div>
              <div style={{ marginBottom: '20px', textAlign: 'center' }}>
                <h4 style={{ color: '#00b7fa' }}>Confirm Withdrawal</h4>
                <p style={{ color: '#ccc' }}>
                  Withdrawal ID: <strong>{withdrawalId}</strong>
                </p>
                <p style={{ color: '#ccc' }}>
                  {withdrawAmount} {selectedWithdrawCurrency} → {withdrawAddress}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '15px', marginBottom: '20px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>
                    Email PIN *
                  </label>
                  <TextField
                    value={emailPin}
                    onChange={(e) => setEmailPin(e.target.value)}
                    placeholder="Enter PIN from email"
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '5px', color: '#ccc' }}>
                    Google Authenticator (if enabled)
                  </label>
                  <TextField
                    value={googlePin}
                    onChange={(e) => setGooglePin(e.target.value)}
                    placeholder="6-digit code"
                    style={{ width: '100%' }}
                  />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <Button
                    onClick={handleSendPin}
                    disabled={loading}
                    style={{ 
                      padding: '8px 16px',
                      backgroundColor: 'transparent',
                      border: '1px solid #00b7fa',
                      borderRadius: '4px',
                      color: '#00b7fa'
                    }}
                  >
                    Resend PIN
                  </Button>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <Button
                  onClick={handleConfirmWithdrawal}
                  disabled={loading || !emailPin}
                  style={{ 
                    padding: '12px 24px',
                    backgroundColor: '#4CAF50',
                    border: 'none',
                    borderRadius: '4px',
                    color: 'white'
                  }}
                >
                  {loading ? 'Confirming...' : 'Confirm Withdrawal'}
                </Button>
                <Button
                  onClick={resetWithdrawalForm}
                  style={{ 
                    padding: '12px 24px',
                    backgroundColor: 'transparent',
                    border: '1px solid #666',
                    borderRadius: '4px',
                    color: '#ccc'
                  }}
                >
                  Cancel
                </Button>
              </div>
            </div>
            )}

          {withdrawalStep === 'complete' && (
            <div style={{ textAlign: 'center', padding: '40px' }}>
              <h3 style={{ color: '#4CAF50', marginBottom: '10px' }}>Withdrawal Confirmed!</h3>
              <p style={{ color: '#ccc', marginBottom: '20px' }}>
                Your withdrawal has been successfully processed.
              </p>
              <Button
                onClick={resetWithdrawalForm}
                style={{ 
                  padding: '12px 24px',
                  backgroundColor: '#00b7fa',
                  border: 'none',
                  borderRadius: '4px',
                  color: 'white'
                }}
              >
                New Withdrawal
              </Button>
            </div>
          )}
        </div>
      </FieldSet>
    </div>
  );      
}