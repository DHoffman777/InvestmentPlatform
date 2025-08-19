"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearError = exports.setTabBarVisible = exports.setActiveScreen = exports.setError = exports.setRefreshing = exports.setLoading = void 0;
const toolkit_1 = require("@reduxjs/toolkit");
const initialState = {
    isLoading: false,
    isRefreshing: false,
    error: null,
    activeScreen: 'Dashboard',
    tabBarVisible: true,
};
const uiSlice = (0, toolkit_1.createSlice)({
    name: 'ui',
    initialState,
    reducers: {
        setLoading: (state, action) => {
            state.isLoading = action.payload;
        },
        setRefreshing: (state, action) => {
            state.isRefreshing = action.payload;
        },
        setError: (state, action) => {
            state.error = action.payload;
        },
        setActiveScreen: (state, action) => {
            state.activeScreen = action.payload;
        },
        setTabBarVisible: (state, action) => {
            state.tabBarVisible = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
});
_a = uiSlice.actions, exports.setLoading = _a.setLoading, exports.setRefreshing = _a.setRefreshing, exports.setError = _a.setError, exports.setActiveScreen = _a.setActiveScreen, exports.setTabBarVisible = _a.setTabBarVisible, exports.clearError = _a.clearError;
exports.default = uiSlice.reducer;
