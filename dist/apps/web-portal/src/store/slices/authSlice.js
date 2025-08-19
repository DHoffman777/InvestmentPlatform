"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshToken = exports.updateUserPreferences = exports.updateLastActivity = exports.logout = exports.loginFailure = exports.loginSuccess = exports.loginStart = void 0;
const toolkit_1 = require("@reduxjs/toolkit");
const initialState = {
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: false,
    sessionExpiry: null,
    lastActivity: Date.now(),
};
const authSlice = (0, toolkit_1.createSlice)({
    name: 'auth',
    initialState,
    reducers: {
        loginStart: (state) => {
            state.isLoading = true;
        },
        loginSuccess: (state, action) => {
            state.user = action.payload.user;
            state.token = action.payload.token;
            state.isAuthenticated = true;
            state.isLoading = false;
            state.sessionExpiry = action.payload.expiresAt;
            state.lastActivity = Date.now();
        },
        loginFailure: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.isLoading = false;
            state.sessionExpiry = null;
        },
        logout: (state) => {
            state.user = null;
            state.token = null;
            state.isAuthenticated = false;
            state.isLoading = false;
            state.sessionExpiry = null;
            state.lastActivity = Date.now();
        },
        updateLastActivity: (state) => {
            state.lastActivity = Date.now();
        },
        updateUserPreferences: (state, action) => {
            if (state.user) {
                state.user.preferences = { ...state.user.preferences, ...action.payload };
            }
        },
        refreshToken: (state, action) => {
            state.token = action.payload.token;
            state.sessionExpiry = action.payload.expiresAt;
            state.lastActivity = Date.now();
        },
    },
});
_a = authSlice.actions, exports.loginStart = _a.loginStart, exports.loginSuccess = _a.loginSuccess, exports.loginFailure = _a.loginFailure, exports.logout = _a.logout, exports.updateLastActivity = _a.updateLastActivity, exports.updateUserPreferences = _a.updateUserPreferences, exports.refreshToken = _a.refreshToken;
exports.default = authSlice.reducer;
