import { NotificationType } from '@services/notificationService';
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
        startTime: string;
        endTime: string;
    };
}
interface NotificationState {
    notifications: Notification[];
    preferences: NotificationPreferences;
    unreadCount: number;
    fcmToken: string | null;
    permissionsGranted: boolean;
}
export declare const addNotification: import("@reduxjs/toolkit").ActionCreatorWithPayload<Notification, "notification/addNotification">, markAsRead: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "notification/markAsRead">, markAllAsRead: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"notification/markAllAsRead">, removeNotification: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "notification/removeNotification">, clearNotifications: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"notification/clearNotifications">, clearReadNotifications: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"notification/clearReadNotifications">, updatePreferences: import("@reduxjs/toolkit").ActionCreatorWithPayload<Partial<NotificationPreferences>, "notification/updatePreferences">, setFCMToken: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "notification/setFCMToken">, setPermissionsGranted: import("@reduxjs/toolkit").ActionCreatorWithPayload<boolean, "notification/setPermissionsGranted">, addMultipleNotifications: import("@reduxjs/toolkit").ActionCreatorWithPayload<Notification[], "notification/addMultipleNotifications">, updateNotificationPriority: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    id: string;
    priority: "high" | "normal" | "low";
}, "notification/updateNotificationPriority">;
declare const _default: import("redux").Reducer<NotificationState>;
export default _default;
export declare const selectNotifications: (state: {
    notification: NotificationState;
}) => Notification[];
export declare const selectUnreadCount: (state: {
    notification: NotificationState;
}) => number;
export declare const selectNotificationPreferences: (state: {
    notification: NotificationState;
}) => NotificationPreferences;
export declare const selectFCMToken: (state: {
    notification: NotificationState;
}) => string | null;
export declare const selectPermissionsGranted: (state: {
    notification: NotificationState;
}) => boolean;
export declare const selectNotificationsByType: (type: NotificationType) => (state: {
    notification: NotificationState;
}) => Notification[];
export declare const selectUnreadNotifications: (state: {
    notification: NotificationState;
}) => Notification[];
export declare const selectRecentNotifications: (limit?: number) => (state: {
    notification: NotificationState;
}) => Notification[];
