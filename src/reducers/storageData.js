const initialState = {
    dexTradeModule: {
        encryptedApiKeys: null,
        selectedTab: 'settings', // This will be overwritten by the user's last tab, NOT a default.
        ipv6: '', // Last known IPv6, never cleared unless user/logic says so.
    },
    // ...other storage state...
};

export default function storageData(state = initialState, action) {
    switch (action.type) {
        case 'SET_ENCRYPTED_API_KEYS_BLOB':
            return {
                ...state,
                dexTradeModule: {
                    ...state.dexTradeModule,
                    encryptedApiKeys: action.payload,
                }
            };
        case 'CLEAR_ENCRYPTED_API_KEYS_BLOB':
            return {
                ...state,
                dexTradeModule: {
                    ...state.dexTradeModule,
                    encryptedApiKeys: null,
                }
            };
        case 'SET_SELECTED_TAB':
            return {
                ...state,
                dexTradeModule: {
                    ...state.dexTradeModule,
                    selectedTab: action.payload, // Always updates to user’s last choice.
                }
            };
        case 'SET_IPV6':
            return {
                ...state,
                dexTradeModule: {
                    ...state.dexTradeModule,
                    ipv6: action.payload,
                }
            };
        // ...other cases as needed...
        default:
            return state;
    }
}