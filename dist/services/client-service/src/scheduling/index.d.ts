import CalendarIntegrationService from './CalendarIntegrationService';
import MeetingBookingService from './MeetingBookingService';
import AvailabilityManagementService from './AvailabilityManagementService';
import MeetingNotificationService from './MeetingNotificationService';
import MeetingNotesService from './MeetingNotesService';
import VideoConferencingService from './VideoConferencingService';
import MeetingAnalyticsService from './MeetingAnalyticsService';
import SchedulingController from './SchedulingController';
export interface SchedulingSystemConfig {
    calendar: {
        enabled: boolean;
        defaultProvider: string;
        syncIntervalMinutes: number;
        maxConnections: number;
        retryAttempts: number;
    };
    booking: {
        enabled: boolean;
        defaultWorkflowId: string;
        autoApprovalEnabled: boolean;
        maxAdvanceBookingDays: number;
        minNoticeHours: number;
        allowDoubleBooking: boolean;
    };
    availability: {
        enabled: boolean;
        defaultTimeZone: string;
        slotGenerationWindow: number;
        slotDuration: number;
        maxSlotsPerQuery: number;
        cacheEnabled: boolean;
    };
    notifications: {
        enabled: boolean;
        defaultFromEmail: string;
        maxRetryAttempts: number;
        enableDeliveryTracking: boolean;
        enableClickTracking: boolean;
        rateLimits: {
            email: {
                perMinute: number;
                perHour: number;
            };
            sms: {
                perMinute: number;
                perHour: number;
            };
            push: {
                perMinute: number;
                perHour: number;
            };
        };
    };
    notes: {
        enabled: boolean;
        autoSaveEnabled: boolean;
        aiFeatureEnabled: boolean;
        enableTranscription: boolean;
        enableTranslation: boolean;
        retentionDays: number;
    };
    video: {
        enabled: boolean;
        defaultProvider: string;
        recordingEnabled: boolean;
        transcriptionEnabled: boolean;
        maxMeetingDuration: number;
        maxParticipants: number;
        autoCleanupEnabled: boolean;
    };
    analytics: {
        enabled: boolean;
        realTimeProcessing: boolean;
        enablePredictive: boolean;
        retentionDays: number;
        anonymizeData: boolean;
        exportFormats: string[];
    };
    api: {
        enabled: boolean;
        port: number;
        corsEnabled: boolean;
        authenticationEnabled: boolean;
        rateLimitEnabled: boolean;
        documentationEnabled: boolean;
        mobileSupport: boolean;
        realTimeEnabled: boolean;
    };
}
export declare class SchedulingSystem {
    private calendarService?;
    private bookingService?;
    private availabilityService?;
    private notificationService?;
    private notesService?;
    private videoService?;
    private analyticsService?;
    private apiController?;
    private config;
    private isInitialized;
    constructor(config?: Partial<SchedulingSystemConfig>);
    private mergeDefaultConfig;
    private deepMerge;
    initialize(): Promise<void>;
    private initializeCalendarService;
    private initializeAvailabilityService;
    private initializeBookingService;
    private initializeNotificationService;
    private initializeNotesService;
    private initializeVideoService;
    private initializeAnalyticsService;
    private initializeAPIController;
    private setupServiceIntegrations;
    getCalendarService(): CalendarIntegrationService | undefined;
    getBookingService(): MeetingBookingService | undefined;
    getAvailabilityService(): AvailabilityManagementService | undefined;
    getNotificationService(): MeetingNotificationService | undefined;
    getNotesService(): MeetingNotesService | undefined;
    getVideoService(): VideoConferencingService | undefined;
    getAnalyticsService(): MeetingAnalyticsService | undefined;
    getAPIController(): SchedulingController | undefined;
    getExpressApp(): import("express").Application | undefined;
    getConfig(): SchedulingSystemConfig;
    updateConfig(updates: Partial<SchedulingSystemConfig>): void;
    getSystemHealth(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        services: Record<string, any>;
        timestamp: Date;
        uptime: number;
    }>;
    startAPI(): Promise<void>;
    stopAPI(): Promise<void>;
    shutdown(): Promise<void>;
}
export { CalendarIntegrationService, MeetingBookingService, AvailabilityManagementService, MeetingNotificationService, MeetingNotesService, VideoConferencingService, MeetingAnalyticsService, SchedulingController };
export * from './CalendarIntegrationService';
export * from './MeetingBookingService';
export * from './AvailabilityManagementService';
export * from './MeetingNotificationService';
export * from './MeetingNotesService';
export * from './VideoConferencingService';
export * from './MeetingAnalyticsService';
export * from './SchedulingController';
export default SchedulingSystem;
