import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { hideIPv6Dialog } from '../actions/actionCreators';
import CopyIcon from '../shared/icons/copy.svg';

const { Modal, Button } = NEXUS.components;
const { copyToClipboard, openInBrowser, showSuccessDialog } = NEXUS.utilities;

export default function IPv6ChangedDialog({ open, currentIPv6, onClose }) {
    console.log('Rendering IPv6ChangedDialog');
    const dispatch = useDispatch();

    const handleCopy = () => {
        copyToClipboard(ipv6);
        showSuccessDialog?.({ message: 'IPv6 address copied to clipboard.' });
    };

    const handleOpenDexTrade = () => {
        openInBrowser('https://dex-trade.com/account/api-management');
    };

    const handleClose = () => {
        dispatch(hideIPv6Dialog());
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
            <div style={{ textAlign: 'right' }}>
                <Button skin="filled" onClick={onClose}>
                    Close
                </Button>
            </div>
        </Modal>
    );
}