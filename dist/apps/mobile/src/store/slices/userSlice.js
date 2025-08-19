"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearUser = exports.updatePreferences = exports.setUser = void 0;
const toolkit_1 = require("@reduxjs/toolkit");
const initialState = {
    profile: null,
    preferences: null,
    isLoading: false,
    error: null,
};
const userSlice = (0, toolkit_1.createSlice)({
    name: 'user',
    initialState,
    reducers: {
        setUser: (state, action) => {
            state.profile = action.payload;
            state.preferences = action.payload.preferences;
        },
        updatePreferences: (state, action) => {
            if (state.preferences) {
                state.preferences = { ...state.preferences, ...action.payload };
            }
        },
        clearUser: () => initialState,
    },
});
_a = userSlice.actions, exports.setUser = _a.setUser, exports.updatePreferences = _a.updatePreferences, exports.clearUser = _a.clearUser;
exports.default = userSlice.reducer;
