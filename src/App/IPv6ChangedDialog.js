import React from 'react';
import store from '../store';
import { useSelector, useDispatch } from 'react-redux';
import CopyIcon from '../shared/icons/copy.svg';
import { setPublicKey, setPrivateKey, setSelectedTab, setIPv6, setCurrentIPv6, setShowIPv6ChangedDialog } from '../actions/actionCreators';

const { Modal, Button } = NEXUS.components;
const { copyToClipboard, openInBrowser, showSuccessDialog } = NEXUS.utilities;

export default function IPv6ChangedDialog({ open, currentIPv6, onClose }) {
    console.log('Rendering IPv6ChangedDialog');
    const dispatch = useDispatch();

    const showIPv6ChangedDialog = useSelector(state => state.ui.showIPv6ChangedDialog);
    const ipv6 = useSelector(state => state.settings.ipv6);

    const handleCopy = () => {
        copyToClipboard(currentIPv6);
        showSuccessDialog?.({ message: 'IPv6 address copied to clipboard.' });
    };

    const handleOpenDexTrade = () => {
        openInBrowser('https://dex-trade.com/account/api-management');
    };

    const handleClose = () => {
        if (ipv6 !== currentIPv6) { store.dispatch(setIPv6(currentIPv6)); }
        store.dispatch(setShowIPv6ChangedDialog(false));
    };

    return (
        <Modal
            title="Your IP Address Has Changed"
            show={open}
            removeModal={handleClose}
            style={{ maxWidth: 480 }}
        >
            <div style={{ margin: '1em 0', fontSize: 15, color: '#ccc', textAlign: 'center' }}>
                <div style={{ marginBottom: 16 }}>
                    <b>Security Notice:</b> Your public IPv6 address has changed.
                </div>
                <div style={{ margin: '1em 0' }}>
                    If you restrict your Dex-Trade API key to trusted IPs (Recommended), you must update your allow list.
                </div>
                <div style={{ margin: '1em 0', fontSize: 16 }}>
                    <b>Current IPv6:</b>
                    <div
                        style={{
                            background: '#222',
                            padding: '8px 12px',
                            borderRadius: 6,
                            margin: '8px 0',
                            display: 'inline-flex',
                            alignItems: 'center',
                            fontFamily: 'monospace',
                        }}
                    >
                        <span>{currentIPv6}</span>
                        <button
                            style={{
                                background: 'none',
                                border: 'none',
                                marginLeft: 10,
                                cursor: 'pointer',
                                padding: 0,
                                display: 'flex',
                                alignItems: 'center'
                            }}
                            title="Copy IPv6 to clipboard"
                            onClick={handleCopy}
                        >
                            <img src={CopyIcon} alt="Copy" style={{ width: 20, height: 20 }} />
                        </button>
                    </div>
                </div>
                <div style={{ margin: '1em 0' }}>
                    <Button
                        skin="primary"
                        onClick={handleOpenDexTrade}
                        style={{ fontSize: 14 }}
                    >
                        Open Dex-Trade API Management Page
                    </Button>
                </div>
            </div>
            <div style={{ textAlign: 'right', marginBottom: '1em', marginRight: '1em' }}>
                <Button skin="filled" onClick={handleClose}>
                    Close
                </Button>
            </div>
        </Modal>
    );
}