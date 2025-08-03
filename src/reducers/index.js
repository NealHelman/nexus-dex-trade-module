import { INITIALIZE } from 'nexus-module';
import { combineReducers } from 'redux';
import { walletDataReducer } from 'nexus-module';

import settings from './settings';
import ui from './ui';

export default function createReducer() {
    return function (state, action) {
        // Log the action type for debugging purposes
        console.log('Reducer action:', action.type, action.payload); // Debugging line
        const baseReducer = combineReducers({
            settings,
            ui,
            nexus: walletDataReducer,
        });
        return baseReducer(state, action);
    };
}
