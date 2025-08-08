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

export const updateInput = (inputValue) => ({
  type: TYPE.UPDATE_INPUT,
  payload: inputValue,
});

export function setIPv6(ipv6) {
    return {
        type: TYPE.SET_IPV6,
        payload: ipv6,
    };
}

export function showIPv6Dialog(ipv6) {
    return { type: TYPE.SHOW_IPV6_DIALOG, payload: ipv6 };
}

export function hideIPv6Dialog() {
    return { type: TYPE.HIDE_IPV6_DIALOG };
}