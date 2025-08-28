import PropTypes from "prop-types";
import { useDispatch } from "react-redux";
import { encryptApiKeys, decryptApiKeys, clearEncryptionCache } from "../utils/encryption";
import { setEncryptedApiKeysBlob as setEncryptedApiKeysBlobAction } from "../actions/actionCreators";
const {
    libraries: {
        React,
    }
} = NEXUS;
const { createContext, useCallback, useContext, useEffect, useRef, useState } = React;

const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

const SessionUnlockContext = createContext();

export function SessionUnlockProvider({ children, encryptedApiKeysBlob, setEncryptedApiKeysBlob, genesis }) {
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [apiKeys, setApiKeys] = useState(null);
    const [showPinModal, setShowPinModal] = useState(false);
    const [showFirstTimeModal, setShowFirstTimeModal] = useState(false);
    const [pinError, setPinError] = useState("");
    const [lockedByTimeout, setLockedByTimeout] = useState(false);
    const inactivityTimer = useRef(null);
    const dispatch = useDispatch();

    // Inactivity timer logic
    const resetInactivityTimer = useCallback(() => {
        if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
        if (isUnlocked) {
            inactivityTimer.current = setTimeout(() => {
                handleLock(true);
            }, INACTIVITY_TIMEOUT_MS);
        }
    }, [isUnlocked]);

    useEffect(() => {
        if (!isUnlocked) return;
        const events = ["mousemove", "keydown", "mousedown", "touchstart"];
        events.forEach(e => window.addEventListener(e, resetInactivityTimer));
        resetInactivityTimer();
        return () => {
            events.forEach(e => window.removeEventListener(e, resetInactivityTimer));
            if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
        };
    }, [isUnlocked, resetInactivityTimer]);

    // Show modals appropriately
    useEffect(() => {
        if (!encryptedApiKeysBlob) {
            setShowFirstTimeModal(true);
            setShowPinModal(false);
        } else {
            setShowFirstTimeModal(false);
        }
    }, [encryptedApiKeysBlob]);

    // Unlock logic
    const requestUnlock = useCallback(() => {
        if (!encryptedApiKeysBlob) {
            setShowFirstTimeModal(true);
        } else {
            setShowPinModal(true);
            setPinError("");
            setLockedByTimeout(false);
        }
    }, [encryptedApiKeysBlob]);

    const handleUnlock = useCallback(async (pin) => {
        try {
            dispatch({ type: 'SESSION_UNLOCKED', pin });
            const { apiKeysObject } = await decryptApiKeys(encryptedApiKeysBlob, pin);
            setApiKeys(apiKeysObject);
            setIsUnlocked(true);
            setShowPinModal(false);
            setPinError("");
            resetInactivityTimer();
        } catch (err) {
            setPinError("Incorrect PIN or corrupted data.");
        } finally {
            clearEncryptionCache();
        }
    }, [encryptedApiKeysBlob, resetInactivityTimer]);

    // Lock logic
    const handleLock = useCallback((fromTimeout = false) => {
        dispatch({ type: 'SESSION_LOCKED' });
        setApiKeys(null);
        setIsUnlocked(false);
        setShowPinModal(false);
        setPinError("");
        clearEncryptionCache();
        if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
        setLockedByTimeout(!!fromTimeout);
    }, []);

    // First-time save handler
    const handleFirstTimeSave = useCallback(async ({ publicKey, privateKey, pin, pinConfirm }) => {
        if (!publicKey || !privateKey || !pin || !pinConfirm) {
            setPinError("All fields are required.");
            return;
        }
        if (pin !== pinConfirm) {
            setPinError("PINs do not match.");
            return;
        }
        try {
            const encrypted = await encryptApiKeys({ publicKey, privateKey }, pin);
            // Save to Redux/localStorage (use prop callback)
            setEncryptedApiKeysBlob(encrypted);
            dispatch(setEncryptedApiKeysBlobAction(encrypted));
            setApiKeys({ publicKey, privateKey });
            setIsUnlocked(true);
            setShowFirstTimeModal(false);
            setPinError("");
            dispatch({ type: 'SESSION_UNLOCKED', pin });
            resetInactivityTimer();
        } catch (err) {
            setPinError("Failed to encrypt and save keys.");
        } finally {
            clearEncryptionCache();
        }
    }, [setEncryptedApiKeysBlob, resetInactivityTimer]);

    // Reset logic: clear blob, keys, and session
    const handleReset = useCallback(() => {
        setEncryptedApiKeysBlob(null); // Remove blob from storage
        setApiKeys(null);
        setIsUnlocked(false);
        setShowFirstTimeModal(true);
        setShowPinModal(false);
        setPinError("");
        dispatch({ type: 'SESSION_LOCKED' });
        clearEncryptionCache();
        if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
    }, [setEncryptedApiKeysBlob]);

    // Expose context API
    const value = {
        isUnlocked,
        apiKeys,
        requestUnlock,   // Call to prompt unlock modal
        lock: handleLock,
        lockedByTimeout,
        showPinModal,
        setShowPinModal,
        handleUnlock,
        handleLock,
        pinError,
        setPinError,
        // First time setup
        showFirstTimeModal,
        setShowFirstTimeModal,
        handleFirstTimeSave,
        handleReset,
    };

    return (
        <SessionUnlockContext.Provider value={value}>
            {children}
        </SessionUnlockContext.Provider>
    );
}

SessionUnlockProvider.propTypes = {
    children: PropTypes.node.isRequired,
    encryptedApiKeysBlob: PropTypes.string,
    setEncryptedApiKeysBlob: PropTypes.func.isRequired,
    genesis: PropTypes.string,
};

export function useSessionUnlock() {
    const ctx = useContext(SessionUnlockContext);
    if (!ctx) throw new Error("useSessionUnlock must be used within SessionUnlockProvider");
    return ctx;
}