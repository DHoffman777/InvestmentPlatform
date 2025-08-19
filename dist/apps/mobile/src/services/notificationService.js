"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationType = void 0;
const messaging_1 = __importDefault(require("@react-native-firebase/messaging"));
const react_native_1 = __importStar(require("@notifee/react-native"));
const react_native_2 = require("react-native");
const react_native_encrypted_storage_1 = __importDefault(require("react-native-encrypted-storage"));
const index_1 = require("@store/index");
const notificationSlice_1 = require("@store/slices/notificationSlice");
// Notification types
var NotificationType;
(function (NotificationType) {
    NotificationType["PORTFOLIO_ALERT"] = "portfolio_alert";
    NotificationType["PRICE_ALERT"] = "price_alert";
    NotificationType["TRADE_EXECUTION"] = "trade_execution";
    NotificationType["RISK_WARNING"] = "risk_warning";
    NotificationType["DOCUMENT_READY"] = "document_ready";
    NotificationType["SYSTEM_MAINTENANCE"] = "system_maintenance";
    NotificationType["SECURITY_ALERT"] = "security_alert";
    NotificationType["MARKET_NEWS"] = "market_news";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
class NotificationService {
    static instance;
    isInitialized = false;
    fcmToken = null;
    FCM_TOKEN_KEY = 'fcm_token';
    constructor() { }
    static getInstance() {
        if (!NotificationService.instance) {
            NotificationService.instance = new NotificationService();
        }
        return NotificationService.instance;
    }
    // Initialize notification service
    async initialize() {
        if (this.isInitialized) {
            return;
        }
        try {
            // Request permissions
            await this.requestPermissions();
            // Initialize Notifee
            await this.initializeNotifee();
            // Initialize Firebase messaging
            await this.initializeFirebaseMessaging();
            // Set up message handlers
            this.setupMessageHandlers();
            // Get and store FCM token
            await this.updateFCMToken();
            this.isInitialized = true;
            console.log('Notification service initialized successfully');
        }
        catch (error) {
            console.error('Failed to initialize notification service:', error);
            throw error;
        }
    }
    // Request notification permissions
    async requestPermissions() {
        try {
            if (react_native_2.Platform.OS === 'android') {
                if (react_native_2.Platform.Version >= 33) {
                    const granted = await react_native_2.PermissionsAndroid.request(react_native_2.PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS, {
                        title: 'Notification Permission',
                        message: 'Allow notifications to stay updated on your investments',
                        buttonNeutral: 'Ask Me Later',
                        buttonNegative: 'Cancel',
                        buttonPositive: 'OK',
                    });
                    return granted === react_native_2.PermissionsAndroid.RESULTS.GRANTED;
                }
                return true;
            }
            else {
                // iOS
                const authStatus = await (0, messaging_1.default)().requestPermission();
                return (authStatus === messaging_1.default.AuthorizationStatus.AUTHORIZED ||
                    authStatus === messaging_1.default.AuthorizationStatus.PROVISIONAL);
            }
        }
        catch (error) {
            console.error('Error requesting notification permissions:', error);
            return false;
        }
    }
    // Initialize Notifee for local notifications
    async initializeNotifee() {
        // Create notification channels for Android
        if (react_native_2.Platform.OS === 'android') {
            await react_native_1.default.createChannels([
                {
                    id: 'portfolio_alerts',
                    name: 'Portfolio Alerts',
                    description: 'Important portfolio and investment alerts',
                    importance: react_native_1.AndroidImportance.HIGH,
                    visibility: react_native_1.AndroidVisibility.PRIVATE,
                },
                {
                    id: 'price_alerts',
                    name: 'Price Alerts',
                    description: 'Price movement notifications',
                    importance: react_native_1.AndroidImportance.DEFAULT,
                },
                {
                    id: 'trade_execution',
                    name: 'Trade Execution',
                    description: 'Trade confirmations and execution updates',
                    importance: react_native_1.AndroidImportance.HIGH,
                },
                {
                    id: 'risk_warnings',
                    name: 'Risk Warnings',
                    description: 'Risk management alerts and warnings',
                    importance: react_native_1.AndroidImportance.HIGH,
                    visibility: react_native_1.AndroidVisibility.PRIVATE,
                },
                {
                    id: 'documents',
                    name: 'Documents',
                    description: 'Document delivery notifications',
                    importance: react_native_1.AndroidImportance.DEFAULT,
                },
                {
                    id: 'system',
                    name: 'System Notifications',
                    description: 'System maintenance and updates',
                    importance: react_native_1.AndroidImportance.LOW,
                },
                {
                    id: 'security',
                    name: 'Security Alerts',
                    description: 'Security-related notifications',
                    importance: react_native_1.AndroidImportance.HIGH,
                    visibility: react_native_1.AndroidVisibility.PRIVATE,
                },
                {
                    id: 'market_news',
                    name: 'Market News',
                    description: 'Market updates and news',
                    importance: react_native_1.AndroidImportance.LOW,
                },
            ]);
        }
    }
    // Initialize Firebase messaging
    async initializeFirebaseMessaging() {
        // Check if Firebase is available
        if (!(0, messaging_1.default)().isDeviceRegisteredForRemoteMessages) {
            await (0, messaging_1.default)().registerDeviceForRemoteMessages();
        }
        // Enable auto initialization
        await (0, messaging_1.default)().setAutoInitEnabled(true);
    }
    // Set up message handlers
    setupMessageHandlers() {
        // Handle background messages
        (0, messaging_1.default)().setBackgroundMessageHandler(async (remoteMessage) => {
            console.log('Message handled in the background!', remoteMessage);
            await this.handleRemoteMessage(remoteMessage);
        });
        // Handle foreground messages
        (0, messaging_1.default)().onMessage(async (remoteMessage) => {
            console.log('Message handled in the foreground!', remoteMessage);
            await this.handleRemoteMessage(remoteMessage);
        });
        // Handle notification open events
        (0, messaging_1.default)().onNotificationOpenedApp((remoteMessage) => {
            console.log('Notification caused app to open from background:', remoteMessage);
            this.handleNotificationPress(remoteMessage);
        });
        // Handle app launch from notification
        (0, messaging_1.default)()
            .getInitialNotification()
            .then((remoteMessage) => {
            if (remoteMessage) {
                console.log('Notification caused app to open from quit state:', remoteMessage);
                this.handleNotificationPress(remoteMessage);
            }
        });
        // Handle Notifee events
        react_native_1.default.onForegroundEvent(async ({ type, detail }) => {
            switch (type) {
                case 1: // PRESS
                    if (detail.notification?.data) {
                        this.handleLocalNotificationPress(detail.notification.data);
                    }
                    break;
                case 2: // ACTION_PRESS
                    if (detail.pressAction?.id && detail.notification?.data) {
                        this.handleNotificationAction(detail.pressAction.id, detail.notification.data);
                    }
                    break;
            }
        });
        react_native_1.default.onBackgroundEvent(async ({ type, detail }) => {
            switch (type) {
                case 1: // PRESS
                    if (detail.notification?.data) {
                        this.handleLocalNotificationPress(detail.notification.data);
                    }
                    break;
                case 2: // ACTION_PRESS
                    if (detail.pressAction?.id && detail.notification?.data) {
                        this.handleNotificationAction(detail.pressAction.id, detail.notification.data);
                    }
                    break;
            }
        });
    }
    // Handle remote message from Firebase
    async handleRemoteMessage(remoteMessage) {
        const { notification, data } = remoteMessage;
        if (notification) {
            const payload = {
                id: data?.id || `notification_${Date.now()}`,
                type: data?.type || NotificationType.SYSTEM_MAINTENANCE,
                title: notification.title || 'Investment Platform',
                body: notification.body || '',
                data: data || {},
                priority: data?.priority || 'normal',
            };
            await this.showLocalNotification(payload);
        }
    }
    // Show local notification
    async showLocalNotification(payload) {
        try {
            const channelId = this.getChannelId(payload.type);
            const actions = payload.actionButtons?.map(action => ({
                title: action.title,
                pressAction: {
                    id: action.id,
                },
                icon: action.icon,
            }));
            await react_native_1.default.displayNotification({
                id: payload.id,
                title: payload.title,
                body: payload.body,
                data: payload.data,
                android: {
                    channelId,
                    importance: this.getAndroidImportance(payload.priority),
                    pressAction: {
                        id: 'default',
                    },
                    actions,
                },
                ios: {
                    categoryId: payload.type,
                    attachments: payload.data?.imageUrl ? [{
                            url: payload.data.imageUrl,
                        }] : undefined,
                },
            });
            // Store notification in Redux store
            index_1.store.dispatch((0, notificationSlice_1.addNotification)({
                id: payload.id,
                type: payload.type,
                title: payload.title,
                body: payload.body,
                timestamp: new Date().toISOString(),
                read: false,
                data: payload.data,
            }));
        }
        catch (error) {
            console.error('Error showing local notification:', error);
        }
    }
    // Handle notification press
    handleNotificationPress(remoteMessage) {
        const { data } = remoteMessage;
        // Navigate based on notification type
        if (data?.type && data?.navigateTo) {
            // Navigation logic would go here
            console.log(`Navigate to: ${data.navigateTo}`);
        }
    }
    // Handle local notification press
    handleLocalNotificationPress(data) {
        console.log('Local notification pressed:', data);
        // Handle navigation based on notification data
        if (data?.navigateTo) {
            console.log(`Navigate to: ${data.navigateTo}`);
        }
    }
    // Handle notification action press
    handleNotificationAction(actionId, data) {
        console.log(`Notification action pressed: ${actionId}`, data);
        // Handle specific actions
        switch (actionId) {
            case 'view_portfolio':
                // Navigate to portfolio
                break;
            case 'dismiss':
                // Dismiss notification
                break;
            case 'mark_read':
                // Mark notification as read
                break;
        }
    }
    // Get FCM token
    async getFCMToken() {
        try {
            if (!this.fcmToken) {
                this.fcmToken = await (0, messaging_1.default)().getToken();
                if (this.fcmToken) {
                    await react_native_encrypted_storage_1.default.setItem(this.FCM_TOKEN_KEY, this.fcmToken);
                }
            }
            return this.fcmToken;
        }
        catch (error) {
            console.error('Error getting FCM token:', error);
            return null;
        }
    }
    // Update FCM token
    async updateFCMToken() {
        const token = await this.getFCMToken();
        if (token) {
            // Send token to server
            console.log('FCM Token:', token);
            // You would typically send this to your backend server
        }
        // Listen for token refresh
        (0, messaging_1.default)().onTokenRefresh(async (token) => {
            console.log('FCM Token refreshed:', token);
            this.fcmToken = token;
            await react_native_encrypted_storage_1.default.setItem(this.FCM_TOKEN_KEY, token);
            // Send new token to server
        });
    }
    // Schedule local notification
    async scheduleNotification(payload, triggerDate) {
        try {
            const channelId = this.getChannelId(payload.type);
            await react_native_1.default.createTriggerNotification({
                id: payload.id,
                title: payload.title,
                body: payload.body,
                data: payload.data,
                android: {
                    channelId,
                },
            }, {
                type: 1, // TIMESTAMP
                timestamp: triggerDate.getTime(),
            });
        }
        catch (error) {
            console.error('Error scheduling notification:', error);
        }
    }
    // Cancel notification
    async cancelNotification(notificationId) {
        try {
            await react_native_1.default.cancelNotification(notificationId);
        }
        catch (error) {
            console.error('Error canceling notification:', error);
        }
    }
    // Cancel all notifications
    async cancelAllNotifications() {
        try {
            await react_native_1.default.cancelAllNotifications();
        }
        catch (error) {
            console.error('Error canceling all notifications:', error);
        }
    }
    // Get channel ID based on notification type
    getChannelId(type) {
        switch (type) {
            case NotificationType.PORTFOLIO_ALERT:
                return 'portfolio_alerts';
            case NotificationType.PRICE_ALERT:
                return 'price_alerts';
            case NotificationType.TRADE_EXECUTION:
                return 'trade_execution';
            case NotificationType.RISK_WARNING:
                return 'risk_warnings';
            case NotificationType.DOCUMENT_READY:
                return 'documents';
            case NotificationType.SECURITY_ALERT:
                return 'security';
            case NotificationType.MARKET_NEWS:
                return 'market_news';
            default:
                return 'system';
        }
    }
    // Get Android importance level
    getAndroidImportance(priority) {
        switch (priority) {
            case 'high':
                return react_native_1.AndroidImportance.HIGH;
            case 'normal':
                return react_native_1.AndroidImportance.DEFAULT;
            case 'low':
                return react_native_1.AndroidImportance.LOW;
            default:
                return react_native_1.AndroidImportance.DEFAULT;
        }
    }
    // Check notification permissions
    async hasPermissions() {
        try {
            if (react_native_2.Platform.OS === 'android') {
                const settings = await react_native_1.default.getNotificationSettings();
                return settings.authorizationStatus === 1; // AUTHORIZED
            }
            else {
                const authStatus = await (0, messaging_1.default)().hasPermission();
                return (authStatus === messaging_1.default.AuthorizationStatus.AUTHORIZED ||
                    authStatus === messaging_1.default.AuthorizationStatus.PROVISIONAL);
            }
        }
        catch (error) {
            console.error('Error checking notification permissions:', error);
            return false;
        }
    }
    // Get notification settings
    async getNotificationSettings() {
        try {
            return await react_native_1.default.getNotificationSettings();
        }
        catch (error) {
            console.error('Error getting notification settings:', error);
            return null;
        }
    }
}
exports.notificationService = NotificationService.getInstance();
