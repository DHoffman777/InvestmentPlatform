import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {NotificationType} from '@services/notificationService';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body: string;
  timestamp: string;
  read: boolean;
  data?: Record<string, any>;
}

interface NotificationPreferences {
  portfolioAlerts: boolean;
  priceAlerts: boolean;
  tradeExecution: boolean;
  riskWarnings: boolean;
  documentReady: boolean;
  systemMaintenance: boolean;
  securityAlerts: boolean;
  marketNews: boolean;
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:MM format
    endTime: string; // HH:MM format
  };
}

interface NotificationState {
  notifications: Notification[];
  preferences: NotificationPreferences;
  unreadCount: number;
  fcmToken: string | null;
  permissionsGranted: boolean;
}

const initialState: NotificationState = {
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

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Notification>) => {
      // Prevent duplicate notifications
      const existingIndex = state.notifications.findIndex(
        n => n.id === action.payload.id
      );
      
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

    markAsRead: (state, action: PayloadAction<string>) => {
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

    removeNotification: (state, action: PayloadAction<string>) => {
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

    updatePreferences: (state, action: PayloadAction<Partial<NotificationPreferences>>) => {
      state.preferences = {...state.preferences, ...action.payload};
    },

    setFCMToken: (state, action: PayloadAction<string>) => {
      state.fcmToken = action.payload;
    },

    setPermissionsGranted: (state, action: PayloadAction<boolean>) => {
      state.permissionsGranted = action.payload;
    },

    // Bulk operations
    addMultipleNotifications: (state, action: PayloadAction<Notification[]>) => {
      const newNotifications = action.payload.filter(newNotif => 
        !state.notifications.some(existing => existing.id === newNotif.id)
      );
      
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
    getNotificationsByType: (state, action: PayloadAction<NotificationType>) => {
      // This is handled by selectors, but included for completeness
    },

    // Update notification priority
    updateNotificationPriority: (state, action: PayloadAction<{id: string; priority: 'high' | 'normal' | 'low'}>) => {
      const notification = state.notifications.find(n => n.id === action.payload.id);
      if (notification && notification.data) {
        notification.data.priority = action.payload.priority;
      }
    },
  },
});

export const {
  addNotification,
  markAsRead,
  markAllAsRead,
  removeNotification,
  clearNotifications,
  clearReadNotifications,
  updatePreferences,
  setFCMToken,
  setPermissionsGranted,
  addMultipleNotifications,
  updateNotificationPriority,
} = notificationSlice.actions;

export default notificationSlice.reducer;

// Selectors
export const selectNotifications = (state: {notification: NotificationState}) => state.notification.notifications;
export const selectUnreadCount = (state: {notification: NotificationState}) => state.notification.unreadCount;
export const selectNotificationPreferences = (state: {notification: NotificationState}) => state.notification.preferences;
export const selectFCMToken = (state: {notification: NotificationState}) => state.notification.fcmToken;
export const selectPermissionsGranted = (state: {notification: NotificationState}) => state.notification.permissionsGranted;

export const selectNotificationsByType = (type: NotificationType) => 
  (state: {notification: NotificationState}) => 
    state.notification.notifications.filter(n => n.type === type);

export const selectUnreadNotifications = (state: {notification: NotificationState}) => 
  state.notification.notifications.filter(n => !n.read);

export const selectRecentNotifications = (limit: number = 10) => 
  (state: {notification: NotificationState}) => 
    state.notification.notifications.slice(0, limit);