import * as TYPE from './types';

export const setPublicKey = (publicKey) => ({
    type: TYPE.SET_PUBLIC_KEY,
    payload: publicKey,
});

export const setPrivateKey = (privateKey) => ({
    type: TYPE.SET_PRIVATE_KEY,
    payload: privateKey,
});

export const setSelectedTab = (tab) => ({
    type: TYPE.SET_SELECTED_TAB,
    payload: tab,
});

export const setIPv6 = (ipv6) => ({
    type: TYPE.SET_IPV6,
    payload: ipv6,
});

export const setCurrentIPv6 = (currentIPv6) => ({
    type: TYPE.SET_CURRENT_IPV6,
    payload: currentIPv6,
});

export const setShowIPv6ChangedDialog = (show) => ({
    type: TYPE.SET_SHOW_IPV6_CHANGED_DIALOG,
    payload: show,
});