import { storageMiddleware, stateMiddleware } from 'nexus-module';
import { useSelector, useDispatch } from 'react-redux';
import { getDecryptedPublicKey, getDecryptedPrivateKey } from '../selectors/settingsSelectors';
import { setPublicKey, setPrivateKey } from '../actions/actionCreators';
import { setSelectedTab } from '../actions/actionCreators';
import { Copyright } from '../utils/copyright.js';
import nxsPackage from '../../nxs_package.json';
import styles from '../Styles/styles.css';

import DashboardPage from './DashboardPage';
import TradePage from './TradePage';
import DepositWithdrawPage from './DepositWithdrawPage';
import ReferralPage from './ReferralPage';
import SettingsPage from './SettingsPage';

const { version } = nxsPackage;
const {
  libraries: {
    React,
    ReactDOM,
    emotion: { react, styled, cache },
  },
  components: {
    Button,
    Modal,
    Panel,
    Dropdown,
    FieldSet,
    TextField,
    Tooltip,
    HorizontalTab
  },
  utilities: {
    apiCall,
    confirm,
    openInBrowser,
    proxyRequest,
    updateState,
    updateStorage,
    secureApiCall,
    send,
    showErrorDialog,
    showInfoDialog,
    showSuccessDialog
  }
} = NEXUS;

const useState = React.useState;
const useRef = React.useRef;
const useEffect = React.useEffect;

export default function Main() {
  const dispatch = useDispatch();
  
  // Get data from Redux store instead of localStorage
  const publicKey = useSelector(getDecryptedPublicKey);
  const privateKey = useSelector(getDecryptedPrivateKey);
  const selected = useSelector((state) => state.settings.selectedTab);

  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [tempPublicKey, setTempPublicKey] = useState('');
  const [tempPrivateKey, setTempPrivateKey] = useState('');
  const [error, setError] = useState('');
  const [isDonating, setIsDonating] = useState(false);
  const [donationAmount, setDonationAmount ] = useState(0);
  const [donationSent, setDonationSent ] = useState(false);
  const [senderAddress, setSenderAddress] = useState('');
  const userStatus = useSelector((state) => state.nexus.userStatus);
  
    // ***** DEBUGGING *****
  const entireState = useSelector(state => state);
  console.log('Full Redux State:', entireState);

  const renderCount = useRef(0);
  renderCount.current += 1;
  console.log(`Main.js rendered ${renderCount.current} times`);

  const TABS = [
    { key: 'dashboard', label: 'Dashboard' },
    { key: 'trade', label: 'Trade' },
    { key: 'deposit', label: 'Deposit/Withdraw' },
    { key: 'referral', label: 'Referral' },
    { key: 'settings', label: 'Settings' },
  ];
  
  const donationRecipient = '8B4MB2NfEGTZJiWWxhUxTGJKJzbEXLicrgrf8uEJ97XQj2fW9Lt';

  // Ref to track last saved tab to avoid repeated writes
  const lastSavedTabRef = useRef(null);
  const currentApiKey = useSelector((state) => state.settings.apiKey);

  const handleCredsSubmit = async (publicKeyValue, privateKeyValue) => {
    if (!publicKeyValue || !privateKeyValue || isAuthenticated) return;
    dispatch(setPublicKey(publicKeyValue));
    dispatch(setPrivateKey(privateKeyValue));
    setIsAuthenticated(true);
    setShowApiKeyModal(false);
    dispatch(setSelectedTab('dashboard'));
    showSuccessDialog({ message: 'Your Dex-Trade API keys have been saved.' });
  };

  React.useEffect(() => {
    if (publicKey && privateKey) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
      dispatch(setSelectedTab('settings'));
      setShowApiKeyModal(true);
    }
    setIsInitialized(true);
  }, [publicKey, privateKey, dispatch]);

  const handleTabClick = (tab) => {
    dispatch(setSelectedTab(tab)); // This will automatically persist
  };
  
  React.useEffect(() => {
    const fetchSenderAddress = async () => {
      if (senderAddress) return;
      try {
        const address = await apiCall('finance/get/account/address', {
          name: 'default'
        });
        setSenderAddress(address.address);
      } catch (e) {
        console.error('Failed to fetch your default account address:', e);
        setSenderAddress('');
      }
    };
    fetchSenderAddress();
  }, []);

  const handleDonation = async () => {
    if (!donationRecipient || !donationAmount) return false;
    setDonationSent(true);
    try {
      const response = await secureApiCall('finance/debit/account', {
        from: senderAddress,
        to: donationRecipient,
        amount: donationAmount
      });

      resetDonationModal();
      const result = response.data ?? response;
      console.log('donationUtils::result: ', result);

      let outputObj;
      if (typeof result === "string") {
        try {
          outputObj = JSON.parse(result);
        } catch (err) {
          showErrorDialog?.({
            message: "Unexpected response format",
            note: result,
          });
          return false;
        }
      } else {
        outputObj = result;
      }

      if (outputObj && outputObj.success === true) {
        outputObj.success = 1;
      }

      if (!outputObj.success) {
        showErrorDialog?.({
          message: "Donation failed",
          note: "Maybe try again later?"
        });
        return false;
      }

      showSuccessDialog?.({ message: "Donation Success!" });
      return true;
    } catch (e) {
      showErrorDialog?.({
        message: 'Error during donation',
        note: e.message
      });
      return false;
    }
  }
  
  const resetDonationModal = () => {
    setDonationAmount(0);
    setIsDonating(false);
  };

  return (
    <Panel 
      title="Nexus Dex-Trade Module" 
      icon={{ url: 'exchange.svg', id: 'icon' }}
      style={{ 
        // Override the PanelWrapper's padding
        padding: '30px 10% 0 10%', // Remove bottom padding from wrapper
        height: '100vh', // Use viewport height
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      {/* Content that respects the Panel's padding */}
      <div style={{ 
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        // Counteract PanelBody's padding and extend to true bottom
        margin: '-20px -30px -20px -30px', // Negative margins to extend beyond PanelBody padding
        padding: '20px 30px 0 30px' // Restore content padding, no bottom
      }}>
        {/* Scrollable content area */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto',
          paddingBottom: '10px' // Small space before footer
        }}>
      
            <HorizontalTab.TabBar>
              {TABS.map(tab => (
                <HorizontalTab
                  key={tab.key}
                  active={selected === tab.key}
                  onClick={() => handleTabClick(tab.key)}
                >
                  {tab.label}
                </HorizontalTab>
              ))}
            </HorizontalTab.TabBar>

            {selected === 'dashboard' && <DashboardPage />}
            {selected === 'trade' && <TradePage />}
            {selected === 'deposit' && <DepositWithdrawPage />}
            {selected === 'referral' && <ReferralPage />}
            {selected === 'settings' && <SettingsPage />}

            {/* Modal for API key input */}
            {showApiKeyModal && !isAuthenticated && (
              <Modal 
                title="Dex-Trade API Key" 
                removeModal={() => setShowApiKeyModal(false)}
                show
                >
                <FieldSet
                  legend="Enter your Dex-Trade API Keys"
                  style={{ marginLeft: '1em', marginRight: '1em' }}
                  >
                  <div style={{ marginBottom: '15px', color: '#ccc' }}>
                    Public Key:{' '}
                    <TextField
                      label="Public Key"
                      value={tempPublicKey}
                      onChange={e => setTempPublicKey(e.target.value)}
                    />
                  </div>
                  <div style={{ marginBottom: '15px', color: '#ccc' }}>
                    Private Key:{' '}
                    <TextField
                      label="Private Key"
                      value={tempPrivateKey}
                      onChange={e => setTempPrivateKey(e.target.value)}
                    />
                  </div>
                  {error && <div style={{ color: 'red' }}>{error}</div>}
                  <div style={{ textAlign: 'right' }}>
                    <Button
                      skin="primary"
                      style={{ marginTop: '1em' }}
                      disabled={!tempPublicKey || !tempPrivateKey}
                      onClick={() => handleCredsSubmit(tempPublicKey, tempPrivateKey)}
                    >
                      Save
                    </Button>
                  </div>
                </FieldSet>
                <div style={{ marginTop: 16, marginBottom: '1em', fontSize: 13, color: '#999', textAlign: 'center' }}>
                  If you do not have a Dex-Trade.com API key yet, go{' '}
                  <span className='linkStyle' onClick={() => openInBrowser('https://dex-trade.com/account/api-management')}>here</span>
                  <br />You'll be prompted to log into your Dex-Trade.com account.
                  If you don't have a Dex-Trade.com account yet, go{' '}
                  <span className='linkStyle' onClick={() => openInBrowser('https://dex-trade.com/refcode/qj9c43')}>here</span>.
                </div>
                <div style={{ marginTop: 16, marginBottom: '1em', fontSize: 13, color: '#999', textAlign: 'center' }}>
                  Your credentials are stored securely and only used locally.
                </div>
              </Modal>
            )}
          </div>
        </div>
        {/* Footer that extends to the Panel's edges */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr auto 1fr',
            alignItems: 'center',
            fontSize: 'small',
            background: 'inherit',
            padding: '8px 30px 30px 30px', // Include bottom padding to reach viewport edge
            margin: '0',
            boxShadow: '0 -1px 3px rgba(0,0,0,0.1)',
            zIndex: 1
          }}
        >
        
          <div style={{ justifySelf: 'start' }}>version {version}</div>
          <div style={{ justifySelf: 'center' }}>
            <Button skin="filled-primary" onClick={() => setIsDonating(true)}>Donate</Button>
          </div>
          <Copyright />
        </div>
        {isDonating && (
          <Modal id="DonationDialog" escToClose={true} removeModal={() => setIsDonating(false)} style={{ width: '500px' }}>
            <Modal.Header>Thank you!<br />How many NXS<br />do you wish to donate?</Modal.Header>
            <Modal.Body>
              <TextField label="DonationAmount" value={donationAmount} onChange={(e) => setDonationAmount(e.target.value)} />
            </Modal.Body>
            <Modal.Footer style={{ textAlign: 'right' }}>
              <Button 
                skin="filled-primary"
                onClick={handleDonation}
                disabled={!donationAmount || !senderAddress || donationSent}
                >
                  Donate
                </Button>
              <Button
                skin="filled"
                onClick={resetDonationModal}
                style={{ marginLeft: '1em' }}

              >
                  Cancel
              </Button>
            </Modal.Footer>
          </Modal>
        )}
    </Panel>
  );
}
