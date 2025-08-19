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
exports.getDefaultConfig = exports.createSLAMonitoringSystem = exports.SLAMonitoringSystem = void 0;
__exportStar(require("./SLADataModel"), exports);
__exportStar(require("./SLATrackingService"), exports);
__exportStar(require("./SLABreachDetectionService"), exports);
__exportStar(require("./SLAReportingService"), exports);
__exportStar(require("./SLAHistoricalAnalysisService"), exports);
__exportStar(require("./SLAComplianceScoringService"), exports);
__exportStar(require("./SLACustomerNotificationService"), exports);
__exportStar(require("./SLAManagementController"), exports);
const SLATrackingService_1 = require("./SLATrackingService");
const SLABreachDetectionService_1 = require("./SLABreachDetectionService");
const SLAReportingService_1 = require("./SLAReportingService");
const SLAHistoricalAnalysisService_1 = require("./SLAHistoricalAnalysisService");
const SLAComplianceScoringService_1 = require("./SLAComplianceScoringService");
const SLACustomerNotificationService_1 = require("./SLACustomerNotificationService");
const SLAManagementController_1 = require("./SLAManagementController");
class SLAMonitoringSystem {
    trackingService;
    breachDetectionService;
    reportingService;
    historicalAnalysisService;
    complianceScoringService;
    customerNotificationService;
    apiController;
    constructor(config) {
        // Initialize services
        this.trackingService = new SLATrackingService_1.SLATrackingService(config.tracking);
        this.breachDetectionService = new SLABreachDetectionService_1.SLABreachDetectionService(config.breachDetection);
        this.reportingService = new SLAReportingService_1.SLAReportingService(config.reporting);
        this.historicalAnalysisService = new SLAHistoricalAnalysisService_1.SLAHistoricalAnalysisService(config.historicalAnalysis);
        this.complianceScoringService = new SLAComplianceScoringService_1.SLAComplianceScoringService(config.complianceScoring);
        this.customerNotificationService = new SLACustomerNotificationService_1.SLACustomerNotificationService(config.customerNotifications);
        // Initialize API controller with service dependencies
        this.apiController = new SLAManagementController_1.SLAManagementController(config.api, {
            trackingService: this.trackingService,
            breachDetectionService: this.breachDetectionService,
            reportingService: this.reportingService,
            historicalAnalysisService: this.historicalAnalysisService,
            complianceScoringService: this.complianceScoringService,
            customerNotificationService: this.customerNotificationService
        });
        this.setupIntegrations();
    }
    setupIntegrations() {
        // Connect tracking service to breach detection
        this.trackingService.on('metricCalculated', async (event) => {
            try {
                await this.breachDetectionService.detectBreaches(event.slaId, event.metric);
            }
            catch (error) {
                console.error(`Breach detection failed for SLA ${event.slaId}:`, error.message);
            }
        });
        // Connect breach detection to customer notifications
        this.breachDetectionService.on('breachDetected', async (event) => {
            try {
                // Get customers for this SLA and send notifications
                console.log(`Breach detected for SLA ${event.slaId}, sending customer notifications`);
                // In real implementation, would query customer database and send notifications
            }
            catch (error) {
                console.error(`Customer notification failed for breach ${event.breachId}:`, error.message);
            }
        });
        // Connect breach resolution to customer notifications
        this.breachDetectionService.on('breachResolved', async (event) => {
            try {
                console.log(`Breach resolved for SLA ${event.slaId}, sending resolution notifications`);
                // In real implementation, would send resolution notifications to customers
            }
            catch (error) {
                console.error(`Resolution notification failed for breach ${event.breachId}:`, error.message);
            }
        });
        // Connect analysis service to recommendations
        this.historicalAnalysisService.on('analysisCompleted', async (event) => {
            console.log(`Historical analysis completed for SLA ${event.slaId}`);
            // Could trigger automatic report generation or alerts based on analysis results
        });
        // Connect compliance scoring to reporting
        this.complianceScoringService.on('scoreCalculated', async (event) => {
            console.log(`Compliance score calculated for SLA ${event.slaId}: ${event.score.overallScore}`);
            // Could trigger compliance reports or alerts based on score thresholds
        });
        // Connect reporting to customer notifications
        this.reportingService.on('reportGenerated', async (event) => {
            console.log(`Report generated: ${event.reportId}`);
            // Could automatically send reports to customers based on their preferences
        });
        // Connect customer notifications events
        this.customerNotificationService.on('notificationSent', async (event) => {
            console.log(`Customer notification sent: ${event.notificationId} via ${event.channel}`);
        });
        this.customerNotificationService.on('escalationStarted', async (event) => {
            console.log(`Escalation started for incident ${event.incidentId}`);
        });
        // Connect API controller events
        this.apiController.on('requestCompleted', (event) => {
            // Could log API metrics, send to monitoring system, etc.
        });
    }
    // Service getters for external access
    getTrackingService() {
        return this.trackingService;
    }
    getBreachDetectionService() {
        return this.breachDetectionService;
    }
    getReportingService() {
        return this.reportingService;
    }
    getHistoricalAnalysisService() {
        return this.historicalAnalysisService;
    }
    getComplianceScoringService() {
        return this.complianceScoringService;
    }
    getCustomerNotificationService() {
        return this.customerNotificationService;
    }
    getAPIController() {
        return this.apiController;
    }
    async start() {
        console.log('Starting SLA Monitoring System...');
        // Start API server
        await this.apiController.start();
        console.log('SLA Monitoring System started successfully');
    }
    async shutdown() {
        console.log('Shutting down SLA Monitoring System...');
        // Shutdown services in reverse order
        await this.apiController.shutdown();
        await this.customerNotificationService.shutdown();
        await this.complianceScoringService.shutdown();
        await this.historicalAnalysisService.shutdown();
        await this.reportingService.shutdown();
        await this.breachDetectionService.shutdown();
        await this.trackingService.shutdown();
        console.log('SLA Monitoring System shutdown complete');
    }
}
exports.SLAMonitoringSystem = SLAMonitoringSystem;
const createSLAMonitoringSystem = (config) => {
    return new SLAMonitoringSystem(config);
};
exports.createSLAMonitoringSystem = createSLAMonitoringSystem;
const getDefaultConfig = () => {
    return {
        tracking: {
            refreshInterval: 60000, // 1 minute
            batchSize: 100,
            maxRetries: 3,
            timeoutMs: 30000,
            enableRealTimeTracking: true,
            enableTrendAnalysis: true,
            dataRetentionDays: 90,
            aggregationIntervals: [300000, 900000, 3600000], // 5min, 15min, 1hour
            validationRules: [
                { field: 'value', rule: 'min', value: 0, errorMessage: 'Value cannot be negative' },
                { field: 'value', rule: 'max', value: 999999, errorMessage: 'Value exceeds maximum allowed' }
            ]
        },
        breachDetection: {
            checkInterval: 30000, // 30 seconds
            breachGracePeriod: 120000, // 2 minutes
            escalationTimeouts: {
                critical: 300000, // 5 minutes
                high: 900000, // 15 minutes
                medium: 1800000, // 30 minutes
                low: 3600000 // 1 hour
            },
            maxConcurrentAlerts: 50,
            enableAutoEscalation: true,
            enableRootCauseAnalysis: true,
            notificationRetryAttempts: 3,
            notificationRetryDelay: 30000
        },
        reporting: {
            maxReportsPerDay: 100,
            reportRetentionDays: 365,
            enableScheduledReports: true,
            defaultFormats: ['pdf', 'html'],
            templateDirectory: './templates',
            outputDirectory: './reports',
            emailSettings: {
                enabled: false,
                smtpHost: '',
                smtpPort: 587,
                fromAddress: ''
            }
        },
        historicalAnalysis: {
            analysisInterval: 3600000, // 1 hour
            lookbackPeriods: {
                short: 7, // 7 days
                medium: 30, // 30 days
                long: 90, // 90 days
                extended: 365 // 365 days
            },
            anomalyDetection: {
                enabled: true,
                sensitivityThreshold: 2.5,
                minimumDataPoints: 20,
                algorithms: ['zscore', 'iqr']
            },
            patternRecognition: {
                enabled: true,
                minimumPatternLength: 10,
                seasonalityThreshold: 0.3,
                trendSignificanceLevel: 0.05
            },
            correlation: {
                enabled: true,
                minimumCorrelationCoefficient: 0.5,
                windowSize: 168, // 1 week in hours
                lagAnalysis: true
            },
            prediction: {
                enabled: true,
                horizons: [1, 6, 24, 168], // 1h, 6h, 24h, 1 week
                models: ['linear', 'arima'],
                confidenceThreshold: 0.7
            }
        },
        complianceScoring: {
            scoringMethod: 'weighted',
            weights: {
                availability: 0.3,
                performance: 0.25,
                reliability: 0.25,
                penalties: 0.1,
                breaches: 0.1
            },
            penalties: {
                breachPenalty: 5,
                escalationMultiplier: 2,
                durationFactor: 1.5,
                severityMultipliers: {
                    critical: 3,
                    high: 2,
                    medium: 1.5,
                    low: 1
                }
            },
            bonuses: {
                perfectComplianceBonus: 5,
                earlyResolutionBonus: 3,
                proactiveActionBonus: 2
            },
            thresholds: {
                excellent: 95,
                good: 90,
                acceptable: 85,
                poor: 75
            },
            trendAnalysis: {
                periods: [7, 30, 90],
                significance: 0.05,
                volatilityWeight: 0.1
            }
        },
        customerNotifications: {
            enableCustomerNotifications: true,
            notificationTemplates: {},
            deliveryChannels: [
                {
                    channel: 'email',
                    enabled: true,
                    priority: 1,
                    configuration: {},
                    rateLimits: {
                        maxNotificationsPerHour: 10,
                        maxNotificationsPerDay: 50,
                        burstLimit: 5,
                        cooldownPeriod: 300000
                    },
                    retryPolicy: {
                        maxRetries: 3,
                        initialDelay: 1000,
                        maxDelay: 30000,
                        backoffMultiplier: 2,
                        retryableErrors: ['TIMEOUT', 'NETWORK_ERROR']
                    }
                }
            ],
            escalationMatrix: {
                levels: [],
                automaticEscalation: false,
                escalationTimeouts: {},
                skipLevels: false
            },
            brandingConfig: {
                companyName: 'Investment Platform',
                logo: '',
                colors: {
                    primary: '#2196F3',
                    secondary: '#FFC107',
                    accent: '#4CAF50',
                    background: '#F5F5F5'
                },
                footer: '© 2024 Investment Platform. All rights reserved.',
                disclaimer: 'This is an automated message. Please do not reply.',
                contactInfo: {
                    supportEmail: 'support@investmentplatform.com',
                    supportPhone: '1-800-SUPPORT',
                    website: 'https://investmentplatform.com'
                }
            },
            complianceReporting: {
                enabled: false,
                frequency: 'monthly',
                recipients: [],
                includeMetrics: true,
                includeTrends: true,
                includeRecommendations: true,
                format: 'pdf',
                distributionTime: '09:00'
            },
            customerPreferences: {
                allowCustomerOptOut: true,
                requireExplicitOptIn: false,
                preferenceManagementUrl: 'https://investmentplatform.com/preferences',
                defaultPreferences: {}
            }
        },
        api: {
            port: 3000,
            rateLimitWindowMs: 900000, // 15 minutes
            rateLimitMaxRequests: 1000,
            enableCors: true,
            enableCompression: true,
            maxPayloadSize: '10mb',
            apiVersion: 'v1',
            authenticationRequired: false,
            enableSwaggerDocs: true,
            metricsEnabled: true,
            allowedOrigins: ['*']
        }
    };
};
exports.getDefaultConfig = getDefaultConfig;
