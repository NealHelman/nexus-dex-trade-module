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

export const showIPv6Dialog = (ipv6) => ({
    type: TYPE.SHOW_IPV6_DIALOG,
    payload: ipv6,
});

export const hideIPv6Dialog = () => ({
    type: TYPE.HIDE_IPV6_DIALOG,
});