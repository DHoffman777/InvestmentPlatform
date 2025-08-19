export declare enum NotificationType {
    PORTFOLIO_ALERT = "portfolio_alert",
    PRICE_ALERT = "price_alert",
    TRADE_EXECUTION = "trade_execution",
    RISK_WARNING = "risk_warning",
    DOCUMENT_READY = "document_ready",
    SYSTEM_MAINTENANCE = "system_maintenance",
    SECURITY_ALERT = "security_alert",
    MARKET_NEWS = "market_news"
}
export interface NotificationPayload {
    id: string;
    type: NotificationType;
    title: string;
    body: string;
    data?: Record<string, any>;
    priority: 'high' | 'normal' | 'low';
    actionButtons?: NotificationAction[];
}
export interface NotificationAction {
    id: string;
    title: string;
    icon?: string;
}
declare class NotificationService {
    private static instance;
    private isInitialized;
    private fcmToken;
    private readonly FCM_TOKEN_KEY;
    private constructor();
    static getInstance(): NotificationService;
    initialize(): Promise<void>;
    private requestPermissions;
    private initializeNotifee;
    private initializeFirebaseMessaging;
    private setupMessageHandlers;
    private handleRemoteMessage;
    showLocalNotification(payload: NotificationPayload): Promise<void>;
    private handleNotificationPress;
    private handleLocalNotificationPress;
    private handleNotificationAction;
    getFCMToken(): Promise<string | null>;
    private updateFCMToken;
    scheduleNotification(payload: NotificationPayload, triggerDate: Date): Promise<void>;
    cancelNotification(notificationId: string): Promise<void>;
    cancelAllNotifications(): Promise<void>;
    private getChannelId;
    private getAndroidImportance;
    hasPermissions(): Promise<boolean>;
    getNotificationSettings(): Promise<any>;
}
export declare const notificationService: NotificationService;
export {};
