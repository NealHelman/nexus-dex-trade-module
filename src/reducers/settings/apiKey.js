// src/reducers/settings/apiKey.js
import * as TYPE from 'actions/types';

const initialState = '';

export default (state = initialState, action) => {
  switch (action.type) {
    case TYPE.SET_API_KEY:
      return action.payload;
    default:
      return state;
  }
};