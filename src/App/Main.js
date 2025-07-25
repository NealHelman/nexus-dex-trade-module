import { storageMiddleware, stateMiddleware } from 'nexus-module';
import { useSelector, useDispatch } from 'react-redux';
import { setApiKey } from 'actions/actionCreators';
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
  const [isInitialized, setIsInitialized] = useState(false);
  const userStatus = useSelector((state) => state.nexus.userStatus);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selected, setSelected] = useState('dashboard');
  const [showModal, setShowModal] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');

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
  const dispatch = useDispatch();
  const currentApiKey = useSelector((state) => state.settings.apiKey);


  const handleCredsSubmit = async (apiKey) => {
    if (!apiKey || isAuthenticated) return;
    dispatch(setApiKey({ apiKey }));
    setIsAuthenticated(true);
    setShowModal(false);
    setSelected('dashboard');
    showSuccessDialog({ message: 'Your Dex-Trade API key has been saved.' });
  };

  // Initialization logic runs only on mount
  React.useEffect(() => {
    const currentStorage = getCurrentStorage();

    if (currentStorage.selected) {
      setSelected(currentStorage.selected);
      lastSavedTabRef.current = currentStorage.selected; // remember initial tab
    } else {
      lastSavedTabRef.current = 'dashboard';
    }

    if (currentStorage.apiKey) {
      setIsAuthenticated(true);
    } else {
      setIsAuthenticated(false);
      setSelected('settings');
      lastSavedTabRef.current = 'settings';
      setShowModal(true);
    }

    setIsInitialized(true);
  }, []);

  // Persist tab changes (only after initialization and only if changed)
  React.useEffect(() => {
    if (!isInitialized) return;
    if (selected !== lastSavedTabRef.current) {
      const currentStorage = getCurrentStorage();
      updateStorage({ ...currentStorage, selected });
      lastSavedTabRef.current = selected;
    }
  }, [selected, isInitialized]);

  return (
    <Panel title="Nexus Dex-Trade Module" icon={{ url: 'exchange.svg', id: 'icon' }}>
      <HorizontalTab.TabBar>
        {TABS.map(tab => (
          <HorizontalTab
            key={tab.key}
            active={selected === tab.key}
            onClick={() => setSelected(tab.key)}
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
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
            />
            {error && <div style={{ color: 'red' }}>{error}</div>}
            <div style={{ textAlign: 'right' }}>
              <Button
                skin="primary"
                style={{ marginTop: '1em' }}
                disabled={!apiKey}
                onClick={() => handleCredsSubmit(apiKey)}
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
