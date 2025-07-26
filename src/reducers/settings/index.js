import * as TYPE from '../../actions/types';
import { INITIALIZE } from 'nexus-module';

const initialState = {
  publicKey: '',
  privateKey: '',
  selectedTab: 'dashboard',
};

export default (state = initialState, action) => {
  switch (action.type) {
    case TYPE.SET_PUBLIC_KEY:
      return {
        ...state,
        publicKey: action.payload,
      };
    case TYPE.SET_PRIVATE_KEY:
      return {
        ...state,
        privateKey: action.payload,
      };
    case TYPE.SET_SELECTED_TAB:
      return {
        ...state,
        selectedTab: action.payload,
      };
    case INITIALIZE:
      // Handle initialization with decrypted data from storage
      if (action.payload.storageData && action.payload.storageData.settings) {
        return {
          ...state,
          ...action.payload.storageData.settings,
        };
      }
      return state;
    case 'UPDATE_DECRYPTED_SETTINGS':
      return {
        ...state,
        ...action.payload,
      };
    default:
      return state;
  }
};