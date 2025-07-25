import * as TYPE from './types';

export const setApiKey = (apiKey) => ({
  type: TYPE.SET_API_KEY,
  payload: apiKey,
});

export const setSelectedTab = (tab) => ({
  type: TYPE.SET_SELECTED_TAB,
  payload: tab,
});

export const updateInput = (inputValue) => ({
  type: TYPE.UPDATE_INPUT,
  payload: inputValue,
});
