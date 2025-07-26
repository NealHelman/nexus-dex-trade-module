// src/reducers/settings/publicKey.js
import * as TYPE from 'actions/types';

const initialState = '';

export default (state = initialState, action) => {
  switch (action.type) {
    case TYPE.SET_PUBLIC_KEY:
      return action.payload;
    default:
      return state;
  }
};