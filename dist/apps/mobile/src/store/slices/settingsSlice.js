"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearSettings = exports.updatePreferences = exports.setPreferences = void 0;
const toolkit_1 = require("@reduxjs/toolkit");
const initialState = {
    preferences: null,
    isLoading: false,
    error: null,
};
const settingsSlice = (0, toolkit_1.createSlice)({
    name: 'settings',
    initialState,
    reducers: {
        setPreferences: (state, action) => {
            state.preferences = action.payload;
        },
        updatePreferences: (state, action) => {
            if (state.preferences) {
                state.preferences = { ...state.preferences, ...action.payload };
            }
        },
        clearSettings: () => initialState,
    },
});
_a = settingsSlice.actions, exports.setPreferences = _a.setPreferences, exports.updatePreferences = _a.updatePreferences, exports.clearSettings = _a.clearSettings;
exports.default = settingsSlice.reducer;
