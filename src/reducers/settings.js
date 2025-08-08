import * as TYPE from '../actions/types';

const initialState = {
    publicKey: null,
    privateKey: null,
    selectedTab: null,
    showIPv6Dialog: false
};

export default function settings(state = initialState, action) {
    switch (action.type) {
        case TYPE.SET_PUBLIC_KEY:
            return { ...state, publicKey: action.payload };
        case TYPE.SET_PRIVATE_KEY:
            return { ...state, privateKey: action.payload };
        case TYPE.SET_SELECTED_TAB:
            return { ...state, selectedTab: action.payload };
        case TYPE.SET_IPV6:
            return { ...state, ipv6: action.payload };
        case TYPE.SHOW_IPV6_DIALOG:
            return { ...state, showIPv6Dialog: true, currentIPv6: action.payload };
        case TYPE.HIDE_IPV6_DIALOG:
            return { ...state, showIPv6Dialog: false, currentIPv6: null };
        case 'UPDATE_DECRYPTED_SETTINGS':
            return { ...state, ...action.payload };
        default:
            return state;
    }
}