"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.clearAllAlerts = exports.removeAlert = exports.markAllAsRead = exports.markAsRead = exports.addAlert = void 0;
const toolkit_1 = require("@reduxjs/toolkit");
const initialState = {
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,
};
const alertSlice = (0, toolkit_1.createSlice)({
    name: 'alert',
    initialState,
    reducers: {
        addAlert: (state, action) => {
            state.notifications.unshift(action.payload);
            if (!action.payload.isRead) {
                state.unreadCount += 1;
            }
        },
        markAsRead: (state, action) => {
            const alert = state.notifications.find(a => a.id === action.payload);
            if (alert && !alert.isRead) {
                alert.isRead = true;
                state.unreadCount = Math.max(0, state.unreadCount - 1);
            }
        },
        markAllAsRead: state => {
            state.notifications.forEach(alert => {
                alert.isRead = true;
            });
            state.unreadCount = 0;
        },
        removeAlert: (state, action) => {
            const index = state.notifications.findIndex(a => a.id === action.payload);
            if (index >= 0) {
                const alert = state.notifications[index];
                if (!alert.isRead) {
                    state.unreadCount = Math.max(0, state.unreadCount - 1);
                }
                state.notifications.splice(index, 1);
            }
        },
        clearAllAlerts: state => {
            state.notifications = [];
            state.unreadCount = 0;
        },
    },
});
_a = alertSlice.actions, exports.addAlert = _a.addAlert, exports.markAsRead = _a.markAsRead, exports.markAllAsRead = _a.markAllAsRead, exports.removeAlert = _a.removeAlert, exports.clearAllAlerts = _a.clearAllAlerts;
exports.default = alertSlice.reducer;
