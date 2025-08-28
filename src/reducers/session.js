const initialState = {
    isUnlocked: false,
    pin: null,
};

export default function session(state = initialState, action) {
    switch (action.type) {
        case 'SESSION_UNLOCKED':
            return { ...state, isUnlocked: true, pin: action.pin };
        case 'SESSION_LOCKED':
            return { ...state, isUnlocked: false, pin: null };
        default:
            return state;
    }
}