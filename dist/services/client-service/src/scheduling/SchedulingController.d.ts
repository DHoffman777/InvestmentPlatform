import express from 'express';
import { EventEmitter } from 'events';
import CalendarIntegrationService from './CalendarIntegrationService';
import MeetingBookingService from './MeetingBookingService';
import AvailabilityManagementService from './AvailabilityManagementService';
import MeetingNotificationService from './MeetingNotificationService';
import MeetingNotesService from './MeetingNotesService';
import VideoConferencingService from './VideoConferencingService';
import MeetingAnalyticsService from './MeetingAnalyticsService';
export interface SchedulingAPIConfig {
    port: number;
    corsEnabled: boolean;
    corsOrigins: string[];
    rateLimiting: {
        windowMs: number;
        maxRequests: number;
        skipSuccessfulRequests: boolean;
    };
    authentication: {
        enabled: boolean;
        jwtSecret?: string;
        apiKeyHeader: string;
    };
    validation: {
        strictMode: boolean;
        maxRequestSize: string;
    };
    logging: {
        enabled: boolean;
        level: 'error' | 'warn' | 'info' | 'debug';
        includeRequestBody: boolean;
    };
    documentation: {
        enabled: boolean;
        swaggerPath: string;
        version: string;
    };
    mobile: {
        enablePushNotifications: boolean;
        enableOfflineSync: boolean;
        maxSyncBatchSize: number;
    };
    realTime: {
        enableWebSockets: boolean;
        enableServerSentEvents: boolean;
        heartbeatInterval: number;
    };
}
export declare class SchedulingController extends EventEmitter {
    private app;
    private server?;
    private config;
    private calendarService;
    private bookingService;
    private availabilityService;
    private notificationService;
    private notesService;
    private videoService;
    private analyticsService;
    constructor(services: {
        calendarService: CalendarIntegrationService;
        bookingService: MeetingBookingService;
        availabilityService: AvailabilityManagementService;
        notificationService: MeetingNotificationService;
        notesService: MeetingNotesService;
        videoService: VideoConferencingService;
        analyticsService: MeetingAnalyticsService;
    }, config?: Partial<SchedulingAPIConfig>);
    private initializeApp;
    private requestLogger;
    private authenticateRequest;
    private setupRoutes;
    private setupCalendarRoutes;
    private setupBookingRoutes;
    private setupAvailabilityRoutes;
    private setupNotificationRoutes;
    private setupNotesRoutes;
    private setupVideoRoutes;
    private setupAnalyticsRoutes;
    private setupMobileRoutes;
    private setupRealTimeRoutes;
    private setupDocumentation;
    private handleValidationErrors;
    private getHealth;
    private getCalendarProviders;
    private getCalendarProvider;
    private createCalendarConnection;
    private getCalendarConnections;
    private updateCalendarConnection;
    private deleteCalendarConnection;
    private createCalendarEvent;
    private getCalendarEvents;
    private scheduleCalendarSync;
    private getCalendarSyncStatus;
    private getBookingWorkflows;
    private createBookingWorkflow;
    private createBookingRequest;
    private getBookingRequests;
    private getBookingRequest;
    private updateBookingRequest;
    private approveBooking;
    private rejectBooking;
    private cancelBooking;
    private createAvailabilityProfile;
    private getAvailabilityProfiles;
    private getAvailabilityProfile;
    private updateAvailabilityProfile;
    private queryAvailability;
    private bulkQueryAvailability;
    private bookAvailabilitySlot;
    private releaseAvailabilitySlot;
    private getNotificationTemplates;
    private createNotificationTemplate;
    private getNotificationRules;
    private createNotificationRule;
    private createMeetingReminder;
    private getNotificationStats;
    private createMeetingNotes;
    private createNotesFromTemplate;
    private getMeetingNotes;
    private getMeetingNotesById;
    private updateMeetingNotes;
    private createFollowUp;
    private getFollowUps;
    private updateFollowUp;
    private addFollowUpComment;
    private getNotesTemplates;
    private createNotesTemplate;
    private getVideoProviders;
    private updateVideoProvider;
    private createVideoMeeting;
    private getVideoMeetings;
    private getVideoMeeting;
    private updateVideoMeeting;
    private deleteVideoMeeting;
    private startVideoMeeting;
    private endVideoMeeting;
    private joinVideoMeeting;
    private leaveVideoMeeting;
    private getVideoMeetingRecordings;
    private downloadVideoRecording;
    private getVideoTemplates;
    private createVideoTemplate;
    private processVideoWebhook;
    private collectMeetingMetrics;
    private getMeetingMetrics;
    private generateAnalyticsReport;
    private getAnalyticsReports;
    private getAnalyticsReport;
    private getAnalyticsDashboards;
    private createAnalyticsDashboard;
    private getAnalyticsDashboard;
    private getAnalyticsBenchmarks;
    private getPredictiveInsights;
    private mobileSync;
    private mobileSyncUpload;
    private registerPushDevice;
    private unregisterPushDevice;
    private getOfflineManifest;
    private resolveOfflineConflicts;
    private streamRealTimeEvents;
    private getWebSocketInfo;
    private getRealTimeStatus;
    private generateOpenAPISpec;
    private setupErrorHandling;
    start(): Promise<void>;
    stop(): Promise<void>;
    getApp(): express.Application;
    getConfig(): SchedulingAPIConfig;
}
declare global {
    namespace Express {
        interface Request {
            user: {
                id: string;
                tenantId: string;
                role: string;
            };
        }
    }
}
export default SchedulingController;
