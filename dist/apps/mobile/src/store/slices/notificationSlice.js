"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.selectRecentNotifications = exports.selectUnreadNotifications = exports.selectNotificationsByType = exports.selectPermissionsGranted = exports.selectFCMToken = exports.selectNotificationPreferences = exports.selectUnreadCount = exports.selectNotifications = exports.updateNotificationPriority = exports.addMultipleNotifications = exports.setPermissionsGranted = exports.setFCMToken = exports.updatePreferences = exports.clearReadNotifications = exports.clearNotifications = exports.removeNotification = exports.markAllAsRead = exports.markAsRead = exports.addNotification = void 0;
const toolkit_1 = require("@reduxjs/toolkit");
const initialState = {
    notifications: [],
    preferences: {
        portfolioAlerts: true,
        priceAlerts: true,
        tradeExecution: true,
        riskWarnings: true,
        documentReady: true,
        systemMaintenance: true,
        securityAlerts: true,
        marketNews: false,
        pushEnabled: true,
        emailEnabled: true,
        smsEnabled: false,
        quietHours: {
            enabled: false,
            startTime: '22:00',
            endTime: '08:00',
        },
    },
    unreadCount: 0,
    fcmToken: null,
    permissionsGranted: false,
};
const notificationSlice = (0, toolkit_1.createSlice)({
    name: 'notification',
    initialState,
    reducers: {
        addNotification: (state, action) => {
            // Prevent duplicate notifications
            const existingIndex = state.notifications.findIndex(n => n.id === action.payload.id);
            if (existingIndex === -1) {
                state.notifications.unshift(action.payload);
                if (!action.payload.read) {
                    state.unreadCount += 1;
                }
                // Keep only the latest 100 notifications
                if (state.notifications.length > 100) {
                    const removedNotifications = state.notifications.splice(100);
                    // Adjust unread count for removed notifications
                    const removedUnreadCount = removedNotifications.filter(n => !n.read).length;
                    state.unreadCount = Math.max(0, state.unreadCount - removedUnreadCount);
                }
            }
        },
        markAsRead: (state, action) => {
            const notification = state.notifications.find(n => n.id === action.payload);
            if (notification && !notification.read) {
                notification.read = true;
                state.unreadCount = Math.max(0, state.unreadCount - 1);
            }
        },
        markAllAsRead: (state) => {
            state.notifications.forEach(notification => {
                notification.read = true;
            });
            state.unreadCount = 0;
        },
        removeNotification: (state, action) => {
            const index = state.notifications.findIndex(n => n.id === action.payload);
            if (index !== -1) {
                const notification = state.notifications[index];
                if (!notification.read) {
                    state.unreadCount = Math.max(0, state.unreadCount - 1);
                }
                state.notifications.splice(index, 1);
            }
        },
        clearNotifications: (state) => {
            state.notifications = [];
            state.unreadCount = 0;
        },
        clearReadNotifications: (state) => {
            state.notifications = state.notifications.filter(n => !n.read);
        },
        updatePreferences: (state, action) => {
            state.preferences = { ...state.preferences, ...action.payload };
        },
        setFCMToken: (state, action) => {
            state.fcmToken = action.payload;
        },
        setPermissionsGranted: (state, action) => {
            state.permissionsGranted = action.payload;
        },
        // Bulk operations
        addMultipleNotifications: (state, action) => {
            const newNotifications = action.payload.filter(newNotif => !state.notifications.some(existing => existing.id === newNotif.id));
            state.notifications.unshift(...newNotifications);
            state.unreadCount += newNotifications.filter(n => !n.read).length;
            // Keep only the latest 100 notifications
            if (state.notifications.length > 100) {
                const removedNotifications = state.notifications.splice(100);
                const removedUnreadCount = removedNotifications.filter(n => !n.read).length;
                state.unreadCount = Math.max(0, state.unreadCount - removedUnreadCount);
            }
        },
        // Filter operations
        getNotificationsByType: (state, action) => {
            // This is handled by selectors, but included for completeness
        },
        // Update notification priority
        updateNotificationPriority: (state, action) => {
            const notification = state.notifications.find(n => n.id === action.payload.id);
            if (notification && notification.data) {
                notification.data.priority = action.payload.priority;
            }
        },
    },
});
_a = notificationSlice.actions, exports.addNotification = _a.addNotification, exports.markAsRead = _a.markAsRead, exports.markAllAsRead = _a.markAllAsRead, exports.removeNotification = _a.removeNotification, exports.clearNotifications = _a.clearNotifications, exports.clearReadNotifications = _a.clearReadNotifications, exports.updatePreferences = _a.updatePreferences, exports.setFCMToken = _a.setFCMToken, exports.setPermissionsGranted = _a.setPermissionsGranted, exports.addMultipleNotifications = _a.addMultipleNotifications, exports.updateNotificationPriority = _a.updateNotificationPriority;
exports.default = notificationSlice.reducer;
// Selectors
const selectNotifications = (state) => state.notification.notifications;
exports.selectNotifications = selectNotifications;
const selectUnreadCount = (state) => state.notification.unreadCount;
exports.selectUnreadCount = selectUnreadCount;
const selectNotificationPreferences = (state) => state.notification.preferences;
exports.selectNotificationPreferences = selectNotificationPreferences;
const selectFCMToken = (state) => state.notification.fcmToken;
exports.selectFCMToken = selectFCMToken;
const selectPermissionsGranted = (state) => state.notification.permissionsGranted;
exports.selectPermissionsGranted = selectPermissionsGranted;
const selectNotificationsByType = (type) => (state) => state.notification.notifications.filter(n => n.type === type);
exports.selectNotificationsByType = selectNotificationsByType;
const selectUnreadNotifications = (state) => state.notification.notifications.filter(n => !n.read);
exports.selectUnreadNotifications = selectUnreadNotifications;
const selectRecentNotifications = (limit = 10) => (state) => state.notification.notifications.slice(0, limit);
exports.selectRecentNotifications = selectRecentNotifications;
