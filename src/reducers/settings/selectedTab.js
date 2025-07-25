// src/reducers/settings/selectedTab.js
import * as TYPE from 'actions/types';

const initialState = 'dashboard';

export default (state = initialState, action) => {
  switch (action.type) {
    case TYPE.SET_SELECTED_TAB:
      return action.payload;
    default:
      return state;
  }
};