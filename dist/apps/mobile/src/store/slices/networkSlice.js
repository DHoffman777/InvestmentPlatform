"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.setOfflineMode = exports.setNetworkStatus = void 0;
const toolkit_1 = require("@reduxjs/toolkit");
const initialState = {
    status: {
        isConnected: true,
        isInternetReachable: true,
        type: 'unknown',
    },
    isOffline: false,
};
const networkSlice = (0, toolkit_1.createSlice)({
    name: 'network',
    initialState,
    reducers: {
        setNetworkStatus: (state, action) => {
            state.status = action.payload;
            state.isOffline = !action.payload.isConnected || !action.payload.isInternetReachable;
        },
        setOfflineMode: (state, action) => {
            state.isOffline = action.payload;
        },
    },
});
_a = networkSlice.actions, exports.setNetworkStatus = _a.setNetworkStatus, exports.setOfflineMode = _a.setOfflineMode;
exports.default = networkSlice.reducer;
