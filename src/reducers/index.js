import { INITIALIZE } from 'nexus-module';
import { combineReducers } from 'redux';
import { walletDataReducer } from 'nexus-module';

import settings from './settings';
import session from './session';
import ui from './ui';

export default function createReducer() {
    return function (state, action) {
        const baseReducer = combineReducers({
            settings,
            ui,
            session,
            nexus: walletDataReducer,
        });
        const newState = baseReducer(state, action);

        if (action.type === INITIALIZE) {
            console.log('INITIALIZE state with action:', action);
            const { storageData } = action.payload;
            return {
                ...newState,
                session: {
                    ...newState.session,
                    dexTradeModule: {
                        ...newState.session.dexTradeModule,
                        ...(storageData?.dexTradeModule || {}),
                    },
                },
            }
        }

        return newState;
    };
}
