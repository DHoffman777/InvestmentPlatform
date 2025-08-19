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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchedulingController = exports.MeetingAnalyticsService = exports.VideoConferencingService = exports.MeetingNotesService = exports.MeetingNotificationService = exports.AvailabilityManagementService = exports.MeetingBookingService = exports.CalendarIntegrationService = exports.SchedulingSystem = void 0;
const CalendarIntegrationService_1 = __importDefault(require("./CalendarIntegrationService"));
exports.CalendarIntegrationService = CalendarIntegrationService_1.default;
const MeetingBookingService_1 = __importDefault(require("./MeetingBookingService"));
exports.MeetingBookingService = MeetingBookingService_1.default;
const AvailabilityManagementService_1 = __importDefault(require("./AvailabilityManagementService"));
exports.AvailabilityManagementService = AvailabilityManagementService_1.default;
const MeetingNotificationService_1 = __importDefault(require("./MeetingNotificationService"));
exports.MeetingNotificationService = MeetingNotificationService_1.default;
const MeetingNotesService_1 = __importDefault(require("./MeetingNotesService"));
exports.MeetingNotesService = MeetingNotesService_1.default;
const VideoConferencingService_1 = __importDefault(require("./VideoConferencingService"));
exports.VideoConferencingService = VideoConferencingService_1.default;
const MeetingAnalyticsService_1 = __importDefault(require("./MeetingAnalyticsService"));
exports.MeetingAnalyticsService = MeetingAnalyticsService_1.default;
const SchedulingController_1 = __importDefault(require("./SchedulingController"));
exports.SchedulingController = SchedulingController_1.default;
// Main scheduling system class that orchestrates all services
class SchedulingSystem {
    calendarService;
    bookingService;
    availabilityService;
    notificationService;
    notesService;
    videoService;
    analyticsService;
    apiController;
    config;
    isInitialized = false;
    constructor(config = {}) {
        this.config = this.mergeDefaultConfig(config);
    }
    mergeDefaultConfig(userConfig) {
        const defaultConfig = {
            calendar: {
                enabled: true,
                defaultProvider: 'zoom',
                syncIntervalMinutes: 15,
                maxConnections: 10,
                retryAttempts: 3
            },
            booking: {
                enabled: true,
                defaultWorkflowId: 'default-client-meeting',
                autoApprovalEnabled: true,
                maxAdvanceBookingDays: 90,
                minNoticeHours: 24,
                allowDoubleBooking: false
            },
            availability: {
                enabled: true,
                defaultTimeZone: 'UTC',
                slotGenerationWindow: 30,
                slotDuration: 30,
                maxSlotsPerQuery: 100,
                cacheEnabled: true
            },
            notifications: {
                enabled: true,
                defaultFromEmail: 'noreply@investmentplatform.com',
                maxRetryAttempts: 3,
                enableDeliveryTracking: true,
                enableClickTracking: true,
                rateLimits: {
                    email: { perMinute: 100, perHour: 1000 },
                    sms: { perMinute: 10, perHour: 100 },
                    push: { perMinute: 500, perHour: 5000 }
                }
            },
            notes: {
                enabled: true,
                autoSaveEnabled: true,
                aiFeatureEnabled: true,
                enableTranscription: true,
                enableTranslation: false,
                retentionDays: 2555 // 7 years
            },
            video: {
                enabled: true,
                defaultProvider: 'zoom',
                recordingEnabled: true,
                transcriptionEnabled: true,
                maxMeetingDuration: 480, // 8 hours
                maxParticipants: 500,
                autoCleanupEnabled: true
            },
            analytics: {
                enabled: true,
                realTimeProcessing: true,
                enablePredictive: true,
                retentionDays: 365,
                anonymizeData: false,
                exportFormats: ['pdf', 'excel', 'csv']
            },
            api: {
                enabled: true,
                port: 3005,
                corsEnabled: true,
                authenticationEnabled: true,
                rateLimitEnabled: true,
                documentationEnabled: true,
                mobileSupport: true,
                realTimeEnabled: true
            }
        };
        return this.deepMerge(defaultConfig, userConfig);
    }
    deepMerge(target, source) {
        const result = { ...target };
        for (const key in source) {
            if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
                result[key] = this.deepMerge(target[key] || {}, source[key]);
            }
            else {
                result[key] = source[key];
            }
        }
        return result;
    }
    async initialize() {
        if (this.isInitialized) {
            throw new Error('Scheduling system is already initialized');
        }
        console.log('Initializing Meeting Scheduling System...');
        try {
            // Initialize services in dependency order
            await this.initializeCalendarService();
            await this.initializeAvailabilityService();
            await this.initializeBookingService();
            await this.initializeNotificationService();
            await this.initializeNotesService();
            await this.initializeVideoService();
            await this.initializeAnalyticsService();
            await this.initializeAPIController();
            // Set up service integrations
            this.setupServiceIntegrations();
            this.isInitialized = true;
            console.log('✅ Meeting Scheduling System initialization complete');
        }
        catch (error) {
            console.error('❌ Failed to initialize Meeting Scheduling System:', error);
            throw error;
        }
    }
    async initializeCalendarService() {
        if (!this.config.calendar.enabled) {
            console.log('📅 Calendar Integration Service disabled');
            return;
        }
        this.calendarService = new CalendarIntegrationService_1.default({
            maxConnections: this.config.calendar.maxConnections,
            syncIntervalMinutes: this.config.calendar.syncIntervalMinutes,
            retryAttempts: this.config.calendar.retryAttempts,
            retryDelayMs: 5000,
            batchSize: 100,
            maxEventDuration: 24,
            defaultReminders: [15, 5],
            allowedDomains: [],
            blockedDomains: [],
            encryptionEnabled: true,
            auditEnabled: true,
            cacheEnabled: true,
            cacheTtlMinutes: 60
        });
        console.log('✅ Calendar Integration Service initialized');
    }
    async initializeAvailabilityService() {
        if (!this.config.availability.enabled) {
            console.log('📊 Availability Management Service disabled');
            return;
        }
        this.availabilityService = new AvailabilityManagementService_1.default({
            defaultTimeZone: this.config.availability.defaultTimeZone,
            defaultWorkingHours: {
                start: '09:00',
                end: '17:00'
            },
            defaultBufferTime: 15,
            maxAdvanceBookingDays: this.config.booking.maxAdvanceBookingDays,
            minAdvanceBookingHours: this.config.booking.minNoticeHours,
            slotGenerationWindow: this.config.availability.slotGenerationWindow,
            slotDuration: this.config.availability.slotDuration,
            maxSlotsPerQuery: this.config.availability.maxSlotsPerQuery,
            cacheEnabled: this.config.availability.cacheEnabled,
            cacheTtlMinutes: 15,
            optimizationEnabled: true,
            allowOverlappingSlots: false
        });
        console.log('✅ Availability Management Service initialized');
    }
    async initializeBookingService() {
        if (!this.config.booking.enabled) {
            console.log('📝 Meeting Booking Service disabled');
            return;
        }
        this.bookingService = new MeetingBookingService_1.default({
            defaultWorkflowId: this.config.booking.defaultWorkflowId,
            autoApprovalEnabled: this.config.booking.autoApprovalEnabled,
            maxAdvanceBookingDays: this.config.booking.maxAdvanceBookingDays,
            minNoticeHours: this.config.booking.minNoticeHours,
            businessHours: {
                start: '09:00',
                end: '17:00',
                days: [1, 2, 3, 4, 5] // Monday to Friday
            },
            holidays: [],
            maxConcurrentBookings: 5,
            allowDoubleBooking: this.config.booking.allowDoubleBooking,
            conflictResolution: 'manual',
            notificationChannels: ['email'],
            integrationSettings: {
                calendar: this.config.calendar.enabled,
                crm: true,
                videoConferencing: this.config.video.enabled,
                roomBooking: true
            }
        });
        console.log('✅ Meeting Booking Service initialized');
    }
    async initializeNotificationService() {
        if (!this.config.notifications.enabled) {
            console.log('📧 Meeting Notification Service disabled');
            return;
        }
        this.notificationService = new MeetingNotificationService_1.default({
            defaultFromEmail: this.config.notifications.defaultFromEmail,
            defaultFromName: 'Investment Platform',
            maxRetryAttempts: this.config.notifications.maxRetryAttempts,
            retryDelayMs: 60000,
            batchSize: 50,
            processingInterval: 30000,
            enableDeliveryTracking: this.config.notifications.enableDeliveryTracking,
            enableClickTracking: this.config.notifications.enableClickTracking,
            enableUnsubscribe: true,
            rateLimits: this.config.notifications.rateLimits,
            providers: {
                email: 'sendgrid',
                sms: 'twilio',
                push: 'firebase'
            }
        });
        console.log('✅ Meeting Notification Service initialized');
    }
    async initializeNotesService() {
        if (!this.config.notes.enabled) {
            console.log('📔 Meeting Notes Service disabled');
            return;
        }
        this.notesService = new MeetingNotesService_1.default({
            autoSave: {
                enabled: this.config.notes.autoSaveEnabled,
                intervalSeconds: 30
            },
            aiFeatures: {
                enableSummaryGeneration: this.config.notes.aiFeatureEnabled,
                enableActionItemExtraction: this.config.notes.aiFeatureEnabled,
                enableSentimentAnalysis: this.config.notes.aiFeatureEnabled,
                enableTranscription: this.config.notes.enableTranscription,
                enableTranslation: this.config.notes.enableTranslation,
                languages: ['en', 'es', 'fr', 'de']
            },
            sharing: {
                defaultVisibility: 'team',
                allowPublicSharing: false,
                requireApprovalForSharing: true,
                maxSharedUsers: 50
            },
            storage: {
                retentionDays: this.config.notes.retentionDays,
                archiveAfterDays: 365,
                maxFileSizeMB: 100,
                allowedFileTypes: ['pdf', 'doc', 'docx', 'txt', 'md', 'jpg', 'png', 'mp3', 'mp4']
            },
            followUp: {
                autoCreateFromActionItems: true,
                defaultDueDays: 7,
                enableReminders: true,
                reminderDaysBefore: [1, 3, 7],
                escalationEnabled: true,
                escalationDays: 14
            },
            integrations: {
                calendar: this.config.calendar.enabled,
                crm: true,
                projectManagement: true,
                taskManagement: true,
                documentStorage: true
            }
        });
        console.log('✅ Meeting Notes Service initialized');
    }
    async initializeVideoService() {
        if (!this.config.video.enabled) {
            console.log('🎥 Video Conferencing Service disabled');
            return;
        }
        this.videoService = new VideoConferencingService_1.default({
            defaultProvider: this.config.video.defaultProvider,
            webhookEnabled: true,
            webhookSecret: 'webhook-secret-key',
            recordingEnabled: this.config.video.recordingEnabled,
            transcriptionEnabled: this.config.video.transcriptionEnabled,
            maxMeetingDuration: this.config.video.maxMeetingDuration,
            maxParticipants: this.config.video.maxParticipants,
            autoCleanupEnabled: this.config.video.autoCleanupEnabled,
            cleanupAfterDays: 30,
            qualityMonitoring: true,
            analyticsRetentionDays: this.config.analytics.retentionDays,
            securitySettings: {
                enforcePasswordProtection: true,
                requireAuthentication: false,
                enableWaitingRoom: true,
                enableEncryption: true,
                allowGuestAccess: true
            },
            compliance: {
                enableRecordingConsent: true,
                dataRetentionDays: this.config.notes.retentionDays,
                gdprCompliant: true,
                hipaaCompliant: false,
                soxCompliant: false
            }
        });
        console.log('✅ Video Conferencing Service initialized');
    }
    async initializeAnalyticsService() {
        if (!this.config.analytics.enabled) {
            console.log('📈 Meeting Analytics Service disabled');
            return;
        }
        this.analyticsService = new MeetingAnalyticsService_1.default({
            enabled: this.config.analytics.enabled,
            realTimeProcessing: this.config.analytics.realTimeProcessing,
            batchProcessingInterval: 60,
            retentionDays: this.config.analytics.retentionDays,
            anonymizeData: this.config.analytics.anonymizeData,
            enablePredictive: this.config.analytics.enablePredictive,
            benchmarkSources: ['internal', 'industry'],
            defaultDashboard: 'executive_overview',
            alertThresholds: {
                lowAttendance: 70,
                poorEngagement: 40,
                highCancellationRate: 25,
                techIssues: 3,
                lowSatisfaction: 3.0
            },
            exportFormats: this.config.analytics.exportFormats,
            scheduledReports: true,
            apiRateLimit: 1000
        });
        console.log('✅ Meeting Analytics Service initialized');
    }
    async initializeAPIController() {
        if (!this.config.api.enabled) {
            console.log('🌐 Scheduling API Controller disabled');
            return;
        }
        if (!this.bookingService || !this.availabilityService) {
            throw new Error('Required services not initialized for API Controller');
        }
        this.apiController = new SchedulingController_1.default({
            calendarService: this.calendarService,
            bookingService: this.bookingService,
            availabilityService: this.availabilityService,
            notificationService: this.notificationService,
            notesService: this.notesService,
            videoService: this.videoService,
            analyticsService: this.analyticsService
        }, {
            port: this.config.api.port,
            corsEnabled: this.config.api.corsEnabled,
            corsOrigins: ['http://localhost:3000', 'http://localhost:3001'],
            rateLimiting: {
                windowMs: 15 * 60 * 1000,
                maxRequests: 1000,
                skipSuccessfulRequests: false
            },
            authentication: {
                enabled: this.config.api.authenticationEnabled,
                apiKeyHeader: 'x-api-key'
            },
            validation: {
                strictMode: true,
                maxRequestSize: '10mb'
            },
            logging: {
                enabled: true,
                level: 'info',
                includeRequestBody: false
            },
            documentation: {
                enabled: this.config.api.documentationEnabled,
                swaggerPath: '/api-docs',
                version: '1.0.0'
            },
            mobile: {
                enablePushNotifications: this.config.api.mobileSupport,
                enableOfflineSync: this.config.api.mobileSupport,
                maxSyncBatchSize: 100
            },
            realTime: {
                enableWebSockets: false,
                enableServerSentEvents: this.config.api.realTimeEnabled,
                heartbeatInterval: 30000
            }
        });
        console.log('✅ Scheduling API Controller initialized');
    }
    setupServiceIntegrations() {
        console.log('🔗 Setting up service integrations...');
        // Calendar service integrations
        if (this.calendarService) {
            this.calendarService.on('connectionCreated', (event) => {
                console.log(`Calendar connection created: ${event.connectionId}`);
            });
            this.calendarService.on('eventCreated', (event) => {
                console.log(`Calendar event created: ${event.eventId}`);
                // Trigger analytics collection
                if (this.analyticsService) {
                    // Would collect metrics for calendar events
                }
            });
        }
        // Booking service integrations
        if (this.bookingService) {
            this.bookingService.on('bookingCreated', async (event) => {
                console.log(`Booking created: ${event.bookingId}`);
                // Create calendar event if calendar service is enabled
                if (this.calendarService) {
                    // Would create calendar event for booking
                }
                // Create video meeting if video service is enabled
                if (this.videoService) {
                    // Would create video meeting for booking
                }
                // Send notifications
                if (this.notificationService) {
                    await this.notificationService.processMeetingEvent({
                        type: 'meeting_created',
                        meetingId: event.bookingId,
                        tenantId: event.tenantId,
                        meetingData: {}, // Would pass actual meeting data
                        timestamp: new Date()
                    });
                }
            });
            this.bookingService.on('bookingConfirmed', async (event) => {
                console.log(`Booking confirmed: ${event.bookingId}`);
                // Collect analytics
                if (this.analyticsService) {
                    // Would collect booking metrics
                }
            });
        }
        // Availability service integrations
        if (this.availabilityService) {
            this.availabilityService.on('slotBooked', (event) => {
                console.log(`Availability slot booked: ${event.slotId}`);
            });
        }
        // Notification service integrations
        if (this.notificationService) {
            this.notificationService.on('notificationProcessed', (event) => {
                console.log(`Notification processed: ${event.jobId} - ${event.status}`);
            });
        }
        // Notes service integrations
        if (this.notesService) {
            this.notesService.on('notesCreated', (event) => {
                console.log(`Meeting notes created: ${event.notesId}`);
            });
            this.notesService.on('followUpCreated', (event) => {
                console.log(`Follow-up created: ${event.followUpId}`);
                // Send notifications for follow-ups
                if (this.notificationService) {
                    // Would send follow-up notifications
                }
            });
        }
        // Video service integrations
        if (this.videoService) {
            this.videoService.on('meetingStarted', async (event) => {
                console.log(`Video meeting started: ${event.meetingId}`);
                // Collect real-time analytics
                if (this.analyticsService) {
                    // Would start collecting meeting metrics
                }
            });
            this.videoService.on('meetingEnded', async (event) => {
                console.log(`Video meeting ended: ${event.meetingId}`);
                // Collect final analytics
                if (this.analyticsService) {
                    await this.analyticsService.collectMeetingMetrics({
                        meetingId: event.meetingId,
                        tenantId: 'default', // Would get from event
                        title: 'Video Meeting',
                        type: 'video_conference',
                        startTime: new Date(Date.now() - event.duration * 60 * 1000),
                        endTime: new Date(),
                        participants: Array(event.participants).fill(null).map((_, i) => ({
                            id: `participant_${i}`,
                            status: 'attended'
                        }))
                    });
                }
            });
            this.videoService.on('recordingsReady', (event) => {
                console.log(`Video recordings ready: ${event.meetingId}`);
                // Notify users about available recordings
                if (this.notificationService) {
                    // Would send recording availability notifications
                }
            });
        }
        // Analytics service integrations
        if (this.analyticsService) {
            this.analyticsService.on('reportGenerated', (event) => {
                console.log(`Analytics report generated: ${event.reportId}`);
            });
            this.analyticsService.on('alert', (event) => {
                console.log(`Analytics alert: ${event.type} - ${event.message}`);
                // Send alert notifications
                if (this.notificationService) {
                    // Would send alert notifications
                }
            });
        }
        console.log('✅ Service integrations configured');
    }
    // Public API methods
    getCalendarService() {
        return this.calendarService;
    }
    getBookingService() {
        return this.bookingService;
    }
    getAvailabilityService() {
        return this.availabilityService;
    }
    getNotificationService() {
        return this.notificationService;
    }
    getNotesService() {
        return this.notesService;
    }
    getVideoService() {
        return this.videoService;
    }
    getAnalyticsService() {
        return this.analyticsService;
    }
    getAPIController() {
        return this.apiController;
    }
    getExpressApp() {
        return this.apiController?.getApp();
    }
    getConfig() {
        return { ...this.config };
    }
    updateConfig(updates) {
        if (this.isInitialized) {
            throw new Error('Cannot update configuration after initialization');
        }
        this.config = this.deepMerge(this.config, updates);
    }
    async getSystemHealth() {
        const services = {};
        if (this.calendarService) {
            services.calendar = await this.calendarService.getSystemHealth();
        }
        if (this.bookingService) {
            services.booking = await this.bookingService.getSystemHealth();
        }
        if (this.availabilityService) {
            services.availability = await this.availabilityService.getSystemHealth();
        }
        if (this.notificationService) {
            services.notifications = await this.notificationService.getSystemHealth();
        }
        if (this.notesService) {
            services.notes = await this.notesService.getSystemHealth();
        }
        if (this.videoService) {
            services.video = await this.videoService.getSystemHealth();
        }
        if (this.analyticsService) {
            services.analytics = await this.analyticsService.getSystemHealth();
        }
        // Determine overall system health
        const serviceStatuses = Object.values(services).map(s => s.status);
        const unhealthyCount = serviceStatuses.filter(s => s === 'unhealthy').length;
        const degradedCount = serviceStatuses.filter(s => s === 'degraded').length;
        let status = 'healthy';
        if (unhealthyCount > 0) {
            status = 'unhealthy';
        }
        else if (degradedCount > 0) {
            status = 'degraded';
        }
        return {
            status,
            services,
            timestamp: new Date(),
            uptime: process.uptime()
        };
    }
    async startAPI() {
        if (!this.apiController) {
            throw new Error('API Controller not initialized');
        }
        await this.apiController.start();
        console.log(`🚀 Scheduling API started on port ${this.config.api.port}`);
    }
    async stopAPI() {
        if (this.apiController) {
            await this.apiController.stop();
            console.log('🛑 Scheduling API stopped');
        }
    }
    async shutdown() {
        console.log('🔄 Shutting down Meeting Scheduling System...');
        // Stop API first
        if (this.apiController) {
            await this.apiController.stop();
        }
        // Shutdown services in reverse order
        if (this.analyticsService) {
            await this.analyticsService.shutdown();
            console.log('✅ Analytics Service shutdown complete');
        }
        if (this.videoService) {
            await this.videoService.shutdown();
            console.log('✅ Video Conferencing Service shutdown complete');
        }
        if (this.notesService) {
            await this.notesService.shutdown();
            console.log('✅ Notes Service shutdown complete');
        }
        if (this.notificationService) {
            await this.notificationService.shutdown();
            console.log('✅ Notification Service shutdown complete');
        }
        if (this.bookingService) {
            await this.bookingService.shutdown();
            console.log('✅ Booking Service shutdown complete');
        }
        if (this.availabilityService) {
            await this.availabilityService.shutdown();
            console.log('✅ Availability Service shutdown complete');
        }
        if (this.calendarService) {
            await this.calendarService.shutdown();
            console.log('✅ Calendar Service shutdown complete');
        }
        this.isInitialized = false;
        console.log('✅ Meeting Scheduling System shutdown complete');
    }
}
exports.SchedulingSystem = SchedulingSystem;
// Export all types from individual services
__exportStar(require("./CalendarIntegrationService"), exports);
__exportStar(require("./MeetingBookingService"), exports);
__exportStar(require("./AvailabilityManagementService"), exports);
__exportStar(require("./MeetingNotificationService"), exports);
__exportStar(require("./MeetingNotesService"), exports);
__exportStar(require("./VideoConferencingService"), exports);
__exportStar(require("./MeetingAnalyticsService"), exports);
__exportStar(require("./SchedulingController"), exports);
// Default export
exports.default = SchedulingSystem;
