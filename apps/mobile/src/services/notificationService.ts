import messaging, {FirebaseMessagingTypes} from '@react-native-firebase/messaging';
import notifee, {AndroidImportance, AndroidVisibility} from '@notifee/react-native';
import {Platform, PermissionsAndroid} from 'react-native';
import EncryptedStorage from 'react-native-encrypted-storage';
import {store} from '@store/index';
import {addNotification} from '@store/slices/notificationSlice';

// Notification types
export enum NotificationType {
  PORTFOLIO_ALERT = 'portfolio_alert',
  PRICE_ALERT = 'price_alert',
  TRADE_EXECUTION = 'trade_execution',
  RISK_WARNING = 'risk_warning',
  DOCUMENT_READY = 'document_ready',
  SYSTEM_MAINTENANCE = 'system_maintenance',
  SECURITY_ALERT = 'security_alert',
  MARKET_NEWS = 'market_news',
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

class NotificationService {
  private static instance: NotificationService;
  private isInitialized = false;
  private fcmToken: string | null = null;
  private readonly FCM_TOKEN_KEY = 'fcm_token';

  private constructor() {}

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  // Initialize notification service
  public async initialize(): Promise<void> {
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
    } catch (error) {
      console.error('Failed to initialize notification service:', error);
      throw error;
    }
  }

  // Request notification permissions
  private async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        if (Platform.Version >= 33) {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
            {
              title: 'Notification Permission',
              message: 'Allow notifications to stay updated on your investments',
              buttonNeutral: 'Ask Me Later',
              buttonNegative: 'Cancel',
              buttonPositive: 'OK',
            }
          );
          return granted === PermissionsAndroid.RESULTS.GRANTED;
        }
        return true;
      } else {
        // iOS
        const authStatus = await messaging().requestPermission();
        return (
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL
        );
      }
    } catch (error) {
      console.error('Error requesting notification permissions:', error);
      return false;
    }
  }

  // Initialize Notifee for local notifications
  private async initializeNotifee(): Promise<void> {
    // Create notification channels for Android
    if (Platform.OS === 'android') {
      await notifee.createChannels([
        {
          id: 'portfolio_alerts',
          name: 'Portfolio Alerts',
          description: 'Important portfolio and investment alerts',
          importance: AndroidImportance.HIGH,
          visibility: AndroidVisibility.PRIVATE,
        },
        {
          id: 'price_alerts',
          name: 'Price Alerts',
          description: 'Price movement notifications',
          importance: AndroidImportance.DEFAULT,
        },
        {
          id: 'trade_execution',
          name: 'Trade Execution',
          description: 'Trade confirmations and execution updates',
          importance: AndroidImportance.HIGH,
        },
        {
          id: 'risk_warnings',
          name: 'Risk Warnings',
          description: 'Risk management alerts and warnings',
          importance: AndroidImportance.HIGH,
          visibility: AndroidVisibility.PRIVATE,
        },
        {
          id: 'documents',
          name: 'Documents',
          description: 'Document delivery notifications',
          importance: AndroidImportance.DEFAULT,
        },
        {
          id: 'system',
          name: 'System Notifications',
          description: 'System maintenance and updates',
          importance: AndroidImportance.LOW,
        },
        {
          id: 'security',
          name: 'Security Alerts',
          description: 'Security-related notifications',
          importance: AndroidImportance.HIGH,
          visibility: AndroidVisibility.PRIVATE,
        },
        {
          id: 'market_news',
          name: 'Market News',
          description: 'Market updates and news',
          importance: AndroidImportance.LOW,
        },
      ]);
    }
  }

  // Initialize Firebase messaging
  private async initializeFirebaseMessaging(): Promise<void> {
    // Check if Firebase is available
    if (!messaging().isDeviceRegisteredForRemoteMessages) {
      await messaging().registerDeviceForRemoteMessages();
    }

    // Enable auto initialization
    await messaging().setAutoInitEnabled(true);
  }

  // Set up message handlers
  private setupMessageHandlers(): void {
    // Handle background messages
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Message handled in the background!', remoteMessage);
      await this.handleRemoteMessage(remoteMessage);
    });

    // Handle foreground messages
    messaging().onMessage(async (remoteMessage) => {
      console.log('Message handled in the foreground!', remoteMessage);
      await this.handleRemoteMessage(remoteMessage);
    });

    // Handle notification open events
    messaging().onNotificationOpenedApp((remoteMessage) => {
      console.log('Notification caused app to open from background:', remoteMessage);
      this.handleNotificationPress(remoteMessage);
    });

    // Handle app launch from notification
    messaging()
      .getInitialNotification()
      .then((remoteMessage) => {
        if (remoteMessage) {
          console.log('Notification caused app to open from quit state:', remoteMessage);
          this.handleNotificationPress(remoteMessage);
        }
      });

    // Handle Notifee events
    notifee.onForegroundEvent(async ({type, detail}) => {
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

    notifee.onBackgroundEvent(async ({type, detail}) => {
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
  private async handleRemoteMessage(remoteMessage: FirebaseMessagingTypes.RemoteMessage): Promise<void> {
    const {notification, data} = remoteMessage;
    
    if (notification) {
      const payload: NotificationPayload = {
        id: data?.id || `notification_${Date.now()}`,
        type: (data?.type as NotificationType) || NotificationType.SYSTEM_MAINTENANCE,
        title: notification.title || 'Investment Platform',
        body: notification.body || '',
        data: data || {},
        priority: (data?.priority as 'high' | 'normal' | 'low') || 'normal',
      };

      await this.showLocalNotification(payload);
    }
  }

  // Show local notification
  public async showLocalNotification(payload: NotificationPayload): Promise<void> {
    try {
      const channelId = this.getChannelId(payload.type);
      
      const actions = payload.actionButtons?.map(action => ({
        title: action.title,
        pressAction: {
          id: action.id,
        },
        icon: action.icon,
      }));

      await notifee.displayNotification({
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
      store.dispatch(addNotification({
        id: payload.id,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        timestamp: new Date().toISOString(),
        read: false,
        data: payload.data,
      }));

    } catch (error) {
      console.error('Error showing local notification:', error);
    }
  }

  // Handle notification press
  private handleNotificationPress(remoteMessage: FirebaseMessagingTypes.RemoteMessage): void {
    const {data} = remoteMessage;
    
    // Navigate based on notification type
    if (data?.type && data?.navigateTo) {
      // Navigation logic would go here
      console.log(`Navigate to: ${data.navigateTo}`);
    }
  }

  // Handle local notification press
  private handleLocalNotificationPress(data: Record<string, any>): void {
    console.log('Local notification pressed:', data);
    
    // Handle navigation based on notification data
    if (data?.navigateTo) {
      console.log(`Navigate to: ${data.navigateTo}`);
    }
  }

  // Handle notification action press
  private handleNotificationAction(actionId: string, data: Record<string, any>): void {
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
  public async getFCMToken(): Promise<string | null> {
    try {
      if (!this.fcmToken) {
        this.fcmToken = await messaging().getToken();
        if (this.fcmToken) {
          await EncryptedStorage.setItem(this.FCM_TOKEN_KEY, this.fcmToken);
        }
      }
      return this.fcmToken;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  // Update FCM token
  private async updateFCMToken(): Promise<void> {
    const token = await this.getFCMToken();
    if (token) {
      // Send token to server
      console.log('FCM Token:', token);
      // You would typically send this to your backend server
    }

    // Listen for token refresh
    messaging().onTokenRefresh(async (token) => {
      console.log('FCM Token refreshed:', token);
      this.fcmToken = token;
      await EncryptedStorage.setItem(this.FCM_TOKEN_KEY, token);
      // Send new token to server
    });
  }

  // Schedule local notification
  public async scheduleNotification(
    payload: NotificationPayload,
    triggerDate: Date
  ): Promise<void> {
    try {
      const channelId = this.getChannelId(payload.type);
      
      await notifee.createTriggerNotification(
        {
          id: payload.id,
          title: payload.title,
          body: payload.body,
          data: payload.data,
          android: {
            channelId,
          },
        },
        {
          type: 1, // TIMESTAMP
          timestamp: triggerDate.getTime(),
        }
      );
    } catch (error) {
      console.error('Error scheduling notification:', error);
    }
  }

  // Cancel notification
  public async cancelNotification(notificationId: string): Promise<void> {
    try {
      await notifee.cancelNotification(notificationId);
    } catch (error) {
      console.error('Error canceling notification:', error);
    }
  }

  // Cancel all notifications
  public async cancelAllNotifications(): Promise<void> {
    try {
      await notifee.cancelAllNotifications();
    } catch (error) {
      console.error('Error canceling all notifications:', error);
    }
  }

  // Get channel ID based on notification type
  private getChannelId(type: NotificationType): string {
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
  private getAndroidImportance(priority: 'high' | 'normal' | 'low'): AndroidImportance {
    switch (priority) {
      case 'high':
        return AndroidImportance.HIGH;
      case 'normal':
        return AndroidImportance.DEFAULT;
      case 'low':
        return AndroidImportance.LOW;
      default:
        return AndroidImportance.DEFAULT;
    }
  }

  // Check notification permissions
  public async hasPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'android') {
        const settings = await notifee.getNotificationSettings();
        return settings.authorizationStatus === 1; // AUTHORIZED
      } else {
        const authStatus = await messaging().hasPermission();
        return (
          authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
          authStatus === messaging.AuthorizationStatus.PROVISIONAL
        );
      }
    } catch (error) {
      console.error('Error checking notification permissions:', error);
      return false;
    }
  }

  // Get notification settings
  public async getNotificationSettings(): Promise<any> {
    try {
      return await notifee.getNotificationSettings();
    } catch (error) {
      console.error('Error getting notification settings:', error);
      return null;
    }
  }
}

export const notificationService = NotificationService.getInstance();