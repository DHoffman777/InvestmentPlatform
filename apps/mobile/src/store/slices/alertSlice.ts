import {createSlice, PayloadAction} from '@reduxjs/toolkit';
import {Alert} from '@types/index';

interface AlertState {
  notifications: Alert[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: AlertState = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
};

const alertSlice = createSlice({
  name: 'alert',
  initialState,
  reducers: {
    addAlert: (state, action: PayloadAction<Alert>) => {
      state.notifications.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
    },
    markAsRead: (state, action: PayloadAction<string>) => {
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
    removeAlert: (state, action: PayloadAction<string>) => {
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

export const {addAlert, markAsRead, markAllAsRead, removeAlert, clearAllAlerts} =
  alertSlice.actions;
export default alertSlice.reducer;