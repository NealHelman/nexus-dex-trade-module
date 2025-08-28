import PropTypes from "prop-types";
import { useDispatch } from "react-redux";
import { encryptApiKeys, decryptApiKeys, clearEncryptionCache } from "../utils/encryption";
import MaskableTextField from "../shared/components/MaskableTextField.tsx";
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

const { createContext, useCallback, useContext, useEffect, useRef, useState } = React;


// --- CONFIGURABLE ---
const INACTIVITY_TIMEOUT_MS = 10 * 60 * 1000; // 10 minutes

const SessionUnlockContext = createContext();

export function SessionUnlockProvider({ children, encryptedApiKeysBlob, genesis }) {
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [apiKeys, setApiKeys] = useState(null);
    const [showPinModal, setShowPinModal] = useState(false);
    const [pinError, setPinError] = useState("");
    const [lockedByTimeout, setLockedByTimeout] = useState(false);
    const inactivityTimer = useRef(null);
    const dispatch = useDispatch();

    // --- Inactivity timer logic ---
    const resetInactivityTimer = useCallback(() => {
        if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
        if (isUnlocked) {
            inactivityTimer.current = setTimeout(() => {
                handleLock(true);
            }, INACTIVITY_TIMEOUT_MS);
        }
    }, [isUnlocked]);

    // Reset timer on user activity (mouse/keyboard/touch)
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

    // --- Unlock logic ---
    const requestUnlock = useCallback(() => {
        setShowPinModal(true);
        setPinError("");
        setLockedByTimeout(false);
    }, []);

    const handleUnlock = useCallback(async (pin) => {
        try {
            dispatch({ type: 'SESSION_UNLOCKED', pin });
            const { apiKeysObject } = await decryptApiKeys(encryptedApiKeysBlob, { pin });
            setApiKeys(apiKeysObject);
            setIsUnlocked(true);
            setShowPinModal(false);
            setPinError("");
            resetInactivityTimer();
        } catch (err) {
            setPinError("Incorrect PIN or corrupted data.");
        } finally {
            // Clear PIN from memory
            if (typeof pin === "string") {
                for (let i = 0; i < pin.length; ++i) pin[i] = "\0";
            }
            clearEncryptionCache();
        }
    }, [encryptedApiKeysBlob, resetInactivityTimer]);

    // --- Lock logic ---
    const handleLock = useCallback((fromTimeout = false) => {
        dispatch({ type: 'SESSION_LOCKED' });
        setApiKeys(null);
        setIsUnlocked(false);
        setShowPinModal(false);
        setPinError("");
        clearEncryptionCache();
        if (inactivityTimer.current) clearTimeout(inactivityTimer.current);
        setLockedByTimeout(!!fromTimeout);
        // Clear PIN from memory
        if (typeof pin === "string") {
            for (let i = 0; i < pin.length; ++i) pin[i] = "\0";
        }
    }, []);

    // --- Expose context API ---
    const value = {
        isUnlocked,
        apiKeys,
        requestUnlock,   // Call to prompt unlock modal
        lock: handleLock,
        lockedByTimeout,
    };

    // --- PIN Modal UI (plug in your MaskableTextField) ---
    function PinModal() {
        if (!showPinModal) return null;
        return (
            <div className="pin-modal">
                <div className="modal-content">
                    <h2>Enter PIN to Unlock</h2>
                    <form
                        onSubmit={e => {
                            e.preventDefault();
                            const pin = e.target.elements.pin.value;
                            handleUnlock(pin);
                            e.target.reset();
                        }}
                    >
                        {/* Replace with your MaskableTextField if available */}
                        <input
                            name="pin"
                            type="password"
                            autoComplete="off"
                            minLength={4}
                            maxLength={32}
                            required
                            inputMode="text"
                            pattern="[0-9]*"
                            autoFocus
                        />
                        <button type="submit">Unlock</button>
                        <button type="button" onClick={handleLock}>Cancel</button>
                    </form>
                    {pinError && <div className="error">{pinError}</div>}
                </div>
            </div>
        );
    }

    return (
        <SessionUnlockContext.Provider value={value}>
            {children}
            <PinModal />
        </SessionUnlockContext.Provider>
    );
}

SessionUnlockProvider.propTypes = {
    children: PropTypes.node.isRequired,
    encryptedApiKeysBlob: PropTypes.string.isRequired,
    genesis: PropTypes.string.isRequired
};

// --- Custom hook for consumers ---
export function useSessionUnlock() {
    const ctx = useContext(SessionUnlockContext);
    if (!ctx) throw new Error("useSessionUnlock must be used within SessionUnlockProvider");
    return ctx;
}