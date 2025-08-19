import { Alert } from '@types/index';
interface AlertState {
    notifications: Alert[];
    unreadCount: number;
    isLoading: boolean;
    error: string | null;
}
export declare const addAlert: import("@reduxjs/toolkit").ActionCreatorWithPayload<any, "alert/addAlert">, markAsRead: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "alert/markAsRead">, markAllAsRead: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"alert/markAllAsRead">, removeAlert: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "alert/removeAlert">, clearAllAlerts: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"alert/clearAllAlerts">;
declare const _default: import("redux").Reducer<AlertState>;
export default _default;
