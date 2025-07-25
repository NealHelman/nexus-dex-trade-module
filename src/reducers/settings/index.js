import { combineReducers } from 'redux';

import apiKey from './apiKey';
import selectedTab from './selectedTab';

export default combineReducers({
  apiKey,
  selectedTab
});
