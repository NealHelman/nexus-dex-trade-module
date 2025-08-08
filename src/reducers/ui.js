import * as TYPE from '../actions/types';

const initialState = {
    showIPv6ChangedDialog: false,
};

export default function ui(state = initialState, action) {
    switch (action.type) {
        case TYPE.SET_SHOW_IPV6_CHANGED_DIALOG:
            return { ...state, showIPv6ChangedDialog: action.payload };
        case TYPE.SET_CURRENT_IPV6:
            return { ...state, currentIPv6: action.payload };
        default:
            return state;
    }
}