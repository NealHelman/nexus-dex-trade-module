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