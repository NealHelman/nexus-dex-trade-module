import IPv6ChangedDialog from './IPv6ChangedDialog';
import { useSelector, useDispatch } from 'react-redux';
import { getDecryptedPublicKey, getDecryptedPrivateKey } from '../selectors/settingsSelectors';
import { setPublicKey, setPrivateKey } from '../actions/actionCreators';
import { getPublicIPv6 } from '../utils/getIPV6';

const {
    libraries: {
        React,
    },
    components: {
        Button,
        Modal,
        FieldSet,
    },
    utilities: {
        confirm,
        showSuccessDialog,
    }
} = NEXUS;

const { useState, useEffect } = React;

export default function SettingsPage() {
    const dispatch = useDispatch();
    const publicKey = useSelector(getDecryptedPublicKey);
    const privateKey = useSelector(getDecryptedPrivateKey);
    const storedIPv6 = useSelector(state => state.settings.ipv6);
    const [showIPv6Dialog, setShowIPv6Dialog] = useState(false);
    const [currentIPv6, setCurrentIPv6] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    useEffect(() => {
        async function checkIPv6() {
            if (!storedIPv6) return; // Only check if we have a stored value
            const ipv6 = await getPublicIPv6();
            if (ipv6 && ipv6 !== storedIPv6) {
                setCurrentIPv6(ipv6);
                setShowIPv6Dialog(true);
            }
        }
        checkIPv6();
    }, [storedIPv6]);

    const handleResetApiKey = () => {
        setShowConfirmModal(true);
    };

    const confirmReset = () => {
        dispatch(setPublicKey(''));
        dispatch(setPrivateKey(''));
        setShowConfirmModal(false);
        showSuccessDialog({
            message: 'API keys has been reset. You will be prompted to enter a new one.'
        });
    };

    const cancelReset = () => {
        setShowConfirmModal(false);
    };

    return (
        <div style={{ padding: '20px', maxWidth: '600px', margin: 'auto auto' }}>
            <h2 style={{ marginBottom: '20px', color: '#00b7fa', textAlign: 'center' }}>Settings</h2>

            <FieldSet legend="API Key Management" style={{ marginBottom: '20px' }}>
                <div style={{ padding: '15px' }}>
                    <p style={{ marginBottom: '15px', color: '#ccc' }}>
                        Current Public Key: {publicKey ? `${publicKey.substring(0, 8)}...` : 'Not set'}
                    </p>
                    <p style={{ marginBottom: '15px', color: '#ccc' }}>
                        Current Private Key: {privateKey ? `${privateKey.substring(0, 8)}...` : 'Not set'}
                    </p>
                    <p style={{ marginBottom: '15px', color: '#ccc', fontSize: '14px' }}>
                        Reset your Dex-Trade API keys if you need to update it or if you're experiencing authentication issues.
                    </p>
                    <div style={{ textAlign: 'center' }}>
                        <Button
                            skin="primary"
                            onClick={handleResetApiKey}
                            style={{
                                padding: '12px 24px',
                                fontSize: '16px',
                                backgroundColor: '#00b7fa',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                color: 'black'
                            }}
                        >
                            Reset API Keys
                        </Button>
                    </div>
                </div>
            </FieldSet>

            {/* Confirmation Modal */}
            {showConfirmModal && (
                <Modal
                    title="Reset API Key"
                    removeModal={cancelReset}
                    show
                >
                    <FieldSet
                        legend="Are you sure?"
                        style={{ marginLeft: '1em', marginRight: '1em' }}
                    >
                        <p style={{ marginBottom: '15px', color: '#ccc' }}>
                            This will remove your current API keys, and you'll need to enter a new one to continue using the module.
                        </p>
                        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                            <Button
                                skin="secondary"
                                onClick={cancelReset}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: 'transparent',
                                    border: '2px solid #666',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    color: '#ccc'
                                }}
                            >
                                Cancel
                            </Button>
                            <Button
                                skin="primary"
                                onClick={confirmReset}
                                style={{
                                    padding: '8px 16px',
                                    backgroundColor: '#00b7fa',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    color: 'black'
                                }}
                            >
                                Reset
                            </Button>
                        </div>
                    </FieldSet>
                </Modal>
            )}
            {showIPv6Dialog && (
                <IPv6ChangedDialog
                    ipv6={currentIPv6}
                    onClose={() => setShowIPv6Dialog(false)}
                />
            )}
        </div>
    );
}