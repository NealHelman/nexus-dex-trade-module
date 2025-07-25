import { combineReducers } from 'redux';

import { setApiKey, setSelectedTab } from './settingKeyData';

export default combineReducers({
  setApiKey,
  setSelectedTab
});
