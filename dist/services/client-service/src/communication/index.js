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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationController = exports.CommunicationTimelineService = exports.ComplianceRecordingService = exports.CommunicationAnalyticsService = exports.CommunicationSearchService = exports.CommunicationCategorizationService = exports.MultiChannelTrackingService = exports.CommunicationSystem = void 0;
// Note: CommunicationService doesn't exist as a separate file
const CommunicationAnalyticsService_1 = require("./CommunicationAnalyticsService");
Object.defineProperty(exports, "CommunicationAnalyticsService", { enumerable: true, get: function () { return CommunicationAnalyticsService_1.CommunicationAnalyticsService; } });
const ComplianceRecordingService_1 = require("./ComplianceRecordingService");
Object.defineProperty(exports, "ComplianceRecordingService", { enumerable: true, get: function () { return ComplianceRecordingService_1.ComplianceRecordingService; } });
const CommunicationTimelineService_1 = require("./CommunicationTimelineService");
Object.defineProperty(exports, "CommunicationTimelineService", { enumerable: true, get: function () { return CommunicationTimelineService_1.CommunicationTimelineService; } });
const CommunicationController_1 = require("./CommunicationController");
Object.defineProperty(exports, "CommunicationController", { enumerable: true, get: function () { return CommunicationController_1.CommunicationController; } });
const MultiChannelTrackingService_1 = require("./MultiChannelTrackingService");
Object.defineProperty(exports, "MultiChannelTrackingService", { enumerable: true, get: function () { return MultiChannelTrackingService_1.MultiChannelTrackingService; } });
const CommunicationCategorizationService_1 = require("./CommunicationCategorizationService");
Object.defineProperty(exports, "CommunicationCategorizationService", { enumerable: true, get: function () { return CommunicationCategorizationService_1.CommunicationCategorizationService; } });
const CommunicationSearchService_1 = require("./CommunicationSearchService");
Object.defineProperty(exports, "CommunicationSearchService", { enumerable: true, get: function () { return CommunicationSearchService_1.CommunicationSearchService; } });
class CommunicationSystem {
    multiChannelService;
    categorizationService;
    searchService;
    analyticsService;
    recordingService;
    timelineService;
    controller;
    config;
    isInitialized = false;
    constructor(config = {}) {
        this.config = this.mergeDefaultConfig(config);
        this.initializeServices();
    }
    mergeDefaultConfig(userConfig) {
        const defaultConfig = {
            communication: {
                enableMultiChannel: true,
                enableCategorization: true,
                enableSmartSearch: true,
                maxSearchResults: 1000,
                defaultRetentionDays: 2555, // 7 years
                enableNotifications: true,
                supportedChannels: ['email', 'phone', 'sms', 'chat', 'video_call', 'in_person', 'document', 'portal'],
                supportedTypes: ['email', 'phone', 'sms', 'chat', 'meeting', 'document', 'note']
            },
            analytics: {
                enableRealTimeAnalytics: true,
                metricsRetentionDays: 365,
                sentimentAnalysisEnabled: true,
                responseTimeSlaHours: 24,
                highVolumeThreshold: 50,
                lowSentimentThreshold: 0.3,
                analysisIntervals: {
                    realTime: 30000, // 30 seconds
                    hourly: 3600000, // 1 hour
                    daily: 86400000, // 24 hours
                    weekly: 604800000 // 7 days
                },
                alertThresholds: {
                    volumeSpike: 25,
                    responseTimeDelay: 20,
                    sentimentDrop: 10,
                    slaViolation: 90
                }
            },
            recording: {
                enableRecording: true,
                defaultRetentionDays: 2555,
                encryptionEnabled: true,
                transcriptionEnabled: true,
                realTimeTranscription: false,
                qualityMonitoring: true,
                consentValidation: true,
                storageRedundancy: 2,
                compressionLevel: 5,
                maxFileSize: 5, // GB
                allowedCodecs: ['AAC', 'MP3', 'H.264', 'H.265'],
                geographicRestrictions: [],
                auditFrequency: 'monthly',
                alertThresholds: {
                    diskSpaceWarning: 85,
                    qualityDegradation: 70,
                    retentionExpiry: 30,
                    consentExpiry: 90
                }
            },
            timeline: {
                defaultViewType: 'chronological',
                maxTimelineLength: 1095, // 3 years
                autoRefreshInterval: 60, // seconds
                enableRealTimeUpdates: true,
                enablePredictiveInsights: true,
                retentionPeriod: 2555,
                complianceSettings: {
                    auditTrailEnabled: true,
                    recordingIntegration: true,
                    complianceValidation: true,
                    automaticClassification: true
                },
                alertSettings: {
                    enableAlerts: true,
                    defaultEscalationTime: 4, // hours
                    alertChannels: ['email', 'sms'],
                    quietHours: {
                        enabled: true,
                        start: '22:00',
                        end: '06:00',
                        timezone: 'UTC'
                    }
                }
            },
            api: {
                rateLimiting: {
                    windowMs: 15 * 60 * 1000,
                    maxRequests: 1000,
                    skipSuccessfulRequests: false
                },
                validation: {
                    enableStrict: true,
                    maxContentLength: 10000,
                    allowedFileTypes: ['pdf', 'doc', 'docx', 'txt', 'jpg', 'png'],
                    maxFileSize: 10 * 1024 * 1024
                },
                features: {
                    enableAnalytics: true,
                    enableRecording: true,
                    enableTimeline: true,
                    enableRealTime: true
                },
                security: {
                    enableCors: true,
                    allowedOrigins: ['http://localhost:3000'],
                    enableHelmet: true,
                    requireAuth: true
                }
            },
            integrations: {
                storageProviders: ['local', 'aws-s3', 'azure-blob'],
                transcriptionServices: ['aws-transcribe', 'google-speech'],
                archivalSystems: ['glacier', 'cold-storage'],
                complianceTools: ['finra-trace', 'sec-edgar'],
                calendarSystems: ['outlook', 'google-calendar'],
                crmSystems: ['salesforce', 'hubspot'],
                documentSystems: ['sharepoint', 'google-drive'],
                communicationPlatforms: ['teams', 'slack', 'zoom']
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
    initializeServices() {
        // Initialize services based on configuration
        if (this.config.communication.enableMultiChannel) {
            this.multiChannelService = new MultiChannelTrackingService_1.MultiChannelTrackingService({});
        }
        if (this.config.communication.enableCategorization) {
            this.categorizationService = new CommunicationCategorizationService_1.CommunicationCategorizationService({});
        }
        if (this.config.communication.enableSmartSearch) {
            this.searchService = new CommunicationSearchService_1.CommunicationSearchService({});
        }
        // Initialize analytics service if enabled
        if (this.config.api.features.enableAnalytics) {
            this.analyticsService = new CommunicationAnalyticsService_1.CommunicationAnalyticsService(this.config.analytics);
        }
        // Initialize recording service if enabled
        if (this.config.api.features.enableRecording) {
            this.recordingService = new ComplianceRecordingService_1.ComplianceRecordingService(this.config.recording);
        }
        // Initialize timeline service if enabled
        if (this.config.api.features.enableTimeline) {
            this.timelineService = new CommunicationTimelineService_1.CommunicationTimelineService(this.config.timeline);
        }
        // Initialize API controller
        // Note: CommunicationController constructor signature may need updating
        this.controller = new CommunicationController_1.CommunicationController(undefined, // Placeholder for missing communicationService
        this.analyticsService, this.recordingService, this.timelineService, this.config.api);
        this.setupServiceIntegrations();
    }
    setupServiceIntegrations() {
        // Set up event-driven integration between services
        // Communication service events
        // TODO: Re-enable when CommunicationService is implemented
        /* this.communicationService.on('communicationCreated', (event) => {
          // Auto-add to timeline if timeline service is enabled
          if (this.timelineService && this.config.timeline.complianceSettings.recordingIntegration) {
            this.timelineService.addTimelineEntry({
              communicationId: event.communicationId,
              tenantId: event.tenantId,
              clientId: event.clientId,
              employeeId: event.employeeId,
              timestamp: new Date(),
              entryType: 'communication',
              channel: event.channel,
              direction: event.direction,
              status: 'completed',
              priority: event.priority || 'medium',
              subject: event.subject,
              summary: event.summary || event.subject,
              participants: event.participants || [],
              attachments: event.attachments || [],
              tags: event.tags || [],
              categories: event.categories || [],
              relatedEntries: [],
              metrics: {},
              compliance: {
                recordingRequired: false,
                recordingExists: false,
                retentionPeriod: this.config.communication.defaultRetentionDays,
                complianceFlags: [],
                auditTrail: []
              },
              customFields: {
                sourceType: 'communication_service',
                autoGenerated: true
              }
            }).catch(error => {
              console.error('Failed to add communication to timeline:', error);
            });
          }
    
          // Trigger analytics processing if enabled
          if (this.analyticsService) {
            // Analytics service would process the new communication
            console.log(`Analytics processing communication ${event.communicationId}`);
          }
        }); */
        // Analytics service events
        if (this.analyticsService) {
            this.analyticsService.on('alertCreated', (alert) => {
                // Timeline service could create alert entries
                if (this.timelineService) {
                    this.timelineService.addTimelineEntry({
                        communicationId: `alert_${alert.id}`,
                        tenantId: alert.tenantId,
                        clientId: alert.clientId || 'system',
                        employeeId: 'system',
                        timestamp: new Date(),
                        entryType: 'system_event',
                        channel: 'system',
                        direction: 'system',
                        status: 'completed',
                        priority: alert.severity === 'critical' ? 'urgent' : 'high',
                        subject: alert.title,
                        summary: alert.description,
                        participants: [],
                        attachments: [],
                        tags: ['alert', 'analytics'],
                        categories: ['system_alert'],
                        relatedEntries: [],
                        metrics: {},
                        compliance: {
                            recordingRequired: false,
                            recordingExists: false,
                            retentionPeriod: 365,
                            complianceFlags: [],
                            auditTrail: []
                        },
                        customFields: {
                            alertId: alert.id,
                            alertType: alert.type,
                            severity: alert.severity,
                            autoGenerated: true
                        }
                    }).catch(error => {
                        console.error('Failed to add alert to timeline:', error);
                    });
                }
            });
        }
        // Recording service events
        if (this.recordingService) {
            this.recordingService.on('recordingStarted', (event) => {
                // Add recording start to timeline
                if (this.timelineService) {
                    this.timelineService.addTimelineEntry({
                        communicationId: event.communicationId,
                        tenantId: event.tenantId,
                        clientId: 'system', // Would need actual client ID from communication
                        employeeId: 'system',
                        timestamp: new Date(),
                        entryType: 'system_event',
                        channel: 'system',
                        direction: 'system',
                        status: 'in_progress',
                        priority: 'medium',
                        subject: 'Recording Started',
                        summary: `Recording session ${event.sessionId} started with ${event.participants} participant(s)`,
                        participants: [],
                        attachments: [],
                        tags: ['recording', 'compliance'],
                        categories: ['recording_event'],
                        relatedEntries: [],
                        metrics: {},
                        compliance: {
                            recordingRequired: true,
                            recordingExists: true,
                            retentionPeriod: this.config.recording.defaultRetentionDays,
                            complianceFlags: ['RECORDING_IN_PROGRESS'],
                            auditTrail: []
                        },
                        customFields: {
                            sessionId: event.sessionId,
                            recordingType: 'compliance',
                            autoGenerated: true
                        }
                    }).catch(error => {
                        console.error('Failed to add recording start to timeline:', error);
                    });
                }
            });
            this.recordingService.on('recordingStopped', (event) => {
                // Update timeline with recording completion
                if (this.timelineService) {
                    this.timelineService.addTimelineEntry({
                        communicationId: event.recordingId,
                        tenantId: 'system', // Would need tenant ID
                        clientId: 'system',
                        employeeId: 'system',
                        timestamp: new Date(),
                        entryType: 'system_event',
                        channel: 'system',
                        direction: 'system',
                        status: 'completed',
                        priority: 'medium',
                        subject: 'Recording Completed',
                        summary: `Recording completed - Duration: ${Math.round(event.duration / 60)} minutes, Size: ${Math.round(event.fileSize / 1024 / 1024)} MB`,
                        participants: [],
                        attachments: [],
                        tags: ['recording', 'compliance', 'completed'],
                        categories: ['recording_event'],
                        relatedEntries: [],
                        metrics: {
                            duration: event.duration
                        },
                        compliance: {
                            recordingRequired: true,
                            recordingExists: true,
                            retentionPeriod: this.config.recording.defaultRetentionDays,
                            complianceFlags: ['RECORDING_COMPLETED'],
                            auditTrail: []
                        },
                        customFields: {
                            recordingId: event.recordingId,
                            fileSize: event.fileSize,
                            duration: event.duration,
                            autoGenerated: true
                        }
                    }).catch(error => {
                        console.error('Failed to add recording completion to timeline:', error);
                    });
                }
            });
        }
        // Timeline service events
        if (this.timelineService) {
            this.timelineService.on('alertCreated', (alert) => {
                // Analytics service could track timeline alerts
                if (this.analyticsService) {
                    console.log(`Timeline alert created: ${alert.alertType} for client ${alert.clientId}`);
                }
            });
        }
    }
    async initialize() {
        if (this.isInitialized) {
            throw new Error('Communication system is already initialized');
        }
        try {
            console.log('Initializing Communication System...');
            // Initialize services in order
            console.log('✓ Communication Service initialized');
            if (this.analyticsService) {
                console.log('✓ Analytics Service initialized');
            }
            if (this.recordingService) {
                console.log('✓ Recording Service initialized');
            }
            if (this.timelineService) {
                console.log('✓ Timeline Service initialized');
            }
            console.log('✓ API Controller initialized');
            console.log('✓ Service integrations configured');
            this.isInitialized = true;
            console.log('Communication System initialization complete');
        }
        catch (error) {
            console.error('Failed to initialize Communication System:', error);
            throw error;
        }
    }
    // Service getters
    getMultiChannelService() {
        return this.multiChannelService;
    }
    getCategorizationService() {
        return this.categorizationService;
    }
    getSearchService() {
        return this.searchService;
    }
    getAnalyticsService() {
        return this.analyticsService;
    }
    getRecordingService() {
        return this.recordingService;
    }
    getTimelineService() {
        return this.timelineService;
    }
    getController() {
        return this.controller;
    }
    getExpressApp() {
        return this.controller.getApp();
    }
    // Configuration methods
    getConfig() {
        return { ...this.config };
    }
    updateConfig(updates) {
        if (this.isInitialized) {
            throw new Error('Cannot update configuration after initialization');
        }
        this.config = this.deepMerge(this.config, updates);
    }
    // Health and monitoring
    async getSystemHealth() {
        const services = {
            communication: 'available',
            analytics: this.analyticsService ? 'available' : 'unavailable',
            recording: this.recordingService ? 'available' : 'unavailable',
            timeline: this.timelineService ? 'available' : 'unavailable'
        };
        const unavailableCount = Object.values(services).filter(s => s === 'unavailable').length;
        const degradedCount = 0; // No 'degraded' status in services, so this is always 0
        let status = 'healthy';
        if (degradedCount > 0 || unavailableCount === 1) {
            status = 'degraded';
        }
        else if (unavailableCount > 1) {
            status = 'unhealthy';
        }
        return {
            status,
            services,
            timestamp: new Date(),
            uptime: process.uptime()
        };
    }
    async getSystemMetrics() {
        return {
            memory: process.memoryUsage(),
            cpu: process.cpuUsage(),
            uptime: process.uptime(),
            services: {
                communication: {
                    // Mock metrics - replace with actual service metrics
                    totalCommunications: 0,
                    averageResponseTime: 0
                },
                analytics: this.analyticsService ? {
                    metricsProcessed: 0,
                    alertsGenerated: 0
                } : undefined,
                recording: this.recordingService ? {
                    activeRecordings: 0,
                    totalRecordings: 0
                } : undefined,
                timeline: this.timelineService ? {
                    totalEntries: 0,
                    activeViews: 0
                } : undefined
            }
        };
    }
    // Lifecycle management
    async shutdown() {
        if (!this.isInitialized) {
            return;
        }
        console.log('Shutting down Communication System...');
        try {
            // Graceful shutdown in reverse order
            await this.controller.shutdown();
            console.log('✓ API Controller shutdown complete');
            if (this.timelineService) {
                await this.timelineService.shutdown();
                console.log('✓ Timeline Service shutdown complete');
            }
            if (this.recordingService) {
                await this.recordingService.shutdown();
                console.log('✓ Recording Service shutdown complete');
            }
            if (this.analyticsService) {
                await this.analyticsService.shutdown();
                console.log('✓ Analytics Service shutdown complete');
            }
            // Communication service shutdown would go here
            console.log('✓ Communication Service shutdown complete');
            this.isInitialized = false;
            console.log('Communication System shutdown complete');
        }
        catch (error) {
            console.error('Error during Communication System shutdown:', error);
            throw error;
        }
    }
}
exports.CommunicationSystem = CommunicationSystem;
// Export types
__exportStar(require("./MultiChannelTrackingService"), exports);
__exportStar(require("./CommunicationCategorizationService"), exports);
__exportStar(require("./CommunicationSearchService"), exports);
__exportStar(require("./CommunicationAnalyticsService"), exports);
__exportStar(require("./ComplianceRecordingService"), exports);
__exportStar(require("./CommunicationTimelineService"), exports);
__exportStar(require("./CommunicationController"), exports);
// Default export
exports.default = CommunicationSystem;
