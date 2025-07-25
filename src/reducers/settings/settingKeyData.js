import * as TYPE from 'actions/types';

const initialState = {
  apiKey: '',
  selectedTab: 'dashboard',
};

export default (state = initialState, action) => {
  switch (action.type) {
    case TYPE.SET_API_KEY:
      return {
        ...state,
        ...action.payload,
      };
    case TYPE.SET_SELECTED_TAB:
      return {
        ...state,
        ...action.payload,
      };

    default:
      return state;
  }
};
