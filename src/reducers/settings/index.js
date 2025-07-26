import { combineReducers } from 'redux';

import publicKey from './publicKey';
import privateKey from './privateKey';
import selectedTab from './selectedTab';

const settingsReducer = combineReducers({
  publicKey,
  privateKey,
  selectedTab
});

// Wrapper to handle runtime decryption updates
export default (state, action) => {
  if (action.type === 'UPDATE_DECRYPTED_SETTINGS') {
    return {
      ...state,
      ...action.payload
    };
  }
  return settingsReducer(state, action);
};