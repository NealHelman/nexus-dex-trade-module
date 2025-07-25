import { storageMiddleware, stateMiddleware } from 'nexus-module';
import { useSelector, useDispatch } from 'react-redux';
import { setApiKey, setSelectedTab } from '../actions/actionCreators';
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

const { useState, useRef } = React;

export default function Main() {
  const dispatch = useDispatch();
  
  // Get data from Redux store instead of localStorage
  const apiKey = useSelector((state) => state.settings.apiKey);
  const selected = useSelector((state) => state.settings.selectedTab);

  const [showModal, setShowModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [tempApiKey, setTempApiKey] = useState(''); // For form input
  const [error, setError] = useState('');
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

  // Ref to track last saved tab to avoid repeated writes
  const lastSavedTabRef = useRef(null);
  const currentApiKey = useSelector((state) => state.settings.apiKey);

  const handleCredsSubmit = async (apiKeyValue) => {
    if (!apiKeyValue || isAuthenticated) return;
    dispatch(setApiKey(apiKeyValue));
    setIsAuthenticated(true);
    setShowModal(false);
    dispatch(setSelectedTab('dashboard'));
    showSuccessDialog({ message: 'Your Dex-Trade API key has been saved.' });
  };

  React.useEffect(() => {
    if (apiKey) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
      dispatch(setSelectedTab('settings'));
      setShowModal(true);
    }
    setIsInitialized(true);
  }, [apiKey, dispatch]);

  const handleTabClick = (tab) => {
    dispatch(setSelectedTab(tab)); // This will automatically persist
  };

  return (
    <Panel title="Nexus Dex-Trade Module" icon={{ url: 'exchange.svg', id: 'icon' }}>
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
      {showModal && !isAuthenticated && (
        <Modal 
          title="Dex-Trade API Key" 
          removeModal={() => setShowModal(false)}
          show
          >
          <FieldSet
            legend="Enter your Dex-Trade API Key"
            style={{ marginLeft: '1em', marginRight: '1em' }}
            >
            <TextField
              label="API Key"
              value={tempApiKey}
              onChange={e => setTempApiKey(e.target.value)}
            />
            {error && <div style={{ color: 'red' }}>{error}</div>}
            <div style={{ textAlign: 'right' }}>
              <Button
                skin="primary"
                style={{ marginTop: '1em' }}
                disabled={!tempApiKey}
                onClick={() => handleCredsSubmit(tempApiKey)}
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
    </Panel>
  );
}
