export * from './SLADataModel';
export * from './SLATrackingService';
export * from './SLABreachDetectionService';
export * from './SLAReportingService';
export * from './SLAHistoricalAnalysisService';
export * from './SLAComplianceScoringService';
export * from './SLACustomerNotificationService';
export * from './SLAManagementController';
import { SLATrackingService } from './SLATrackingService';
import { SLABreachDetectionService } from './SLABreachDetectionService';
import { SLAReportingService } from './SLAReportingService';
import { SLAHistoricalAnalysisService } from './SLAHistoricalAnalysisService';
import { SLAComplianceScoringService } from './SLAComplianceScoringService';
import { SLACustomerNotificationService } from './SLACustomerNotificationService';
import { SLAManagementController } from './SLAManagementController';
export interface SLAMonitoringSystemConfig {
    tracking: {
        refreshInterval: number;
        batchSize: number;
        maxRetries: number;
        timeoutMs: number;
        enableRealTimeTracking: boolean;
        enableTrendAnalysis: boolean;
        dataRetentionDays: number;
        aggregationIntervals: number[];
        validationRules: Array<{
            field: string;
            rule: 'min' | 'max' | 'range' | 'pattern' | 'custom';
            value: any;
            errorMessage: string;
        }>;
    };
    breachDetection: {
        checkInterval: number;
        breachGracePeriod: number;
        escalationTimeouts: Record<string, number>;
        maxConcurrentAlerts: number;
        enableAutoEscalation: boolean;
        enableRootCauseAnalysis: boolean;
        notificationRetryAttempts: number;
        notificationRetryDelay: number;
    };
    reporting: {
        maxReportsPerDay: number;
        reportRetentionDays: number;
        enableScheduledReports: boolean;
        defaultFormats: string[];
        templateDirectory: string;
        outputDirectory: string;
        emailSettings: {
            enabled: boolean;
            smtpHost: string;
            smtpPort: number;
            fromAddress: string;
        };
    };
    historicalAnalysis: {
        analysisInterval: number;
        lookbackPeriods: {
            short: number;
            medium: number;
            long: number;
            extended: number;
        };
        anomalyDetection: {
            enabled: boolean;
            sensitivityThreshold: number;
            minimumDataPoints: number;
            algorithms: ('zscore' | 'iqr' | 'isolation_forest' | 'lstm')[];
        };
        patternRecognition: {
            enabled: boolean;
            minimumPatternLength: number;
            seasonalityThreshold: number;
            trendSignificanceLevel: number;
        };
        correlation: {
            enabled: boolean;
            minimumCorrelationCoefficient: number;
            windowSize: number;
            lagAnalysis: boolean;
        };
        prediction: {
            enabled: boolean;
            horizons: number[];
            models: ('linear' | 'arima' | 'prophet' | 'lstm')[];
            confidenceThreshold: number;
        };
    };
    complianceScoring: {
        scoringMethod: 'weighted' | 'geometric' | 'harmonic' | 'custom';
        weights: {
            availability: number;
            performance: number;
            reliability: number;
            penalties: number;
            breaches: number;
        };
        penalties: {
            breachPenalty: number;
            escalationMultiplier: number;
            durationFactor: number;
            severityMultipliers: Record<string, number>;
        };
        bonuses: {
            perfectComplianceBonus: number;
            earlyResolutionBonus: number;
            proactiveActionBonus: number;
        };
        thresholds: {
            excellent: number;
            good: number;
            acceptable: number;
            poor: number;
        };
        trendAnalysis: {
            periods: number[];
            significance: number;
            volatilityWeight: number;
        };
    };
    customerNotifications: {
        enableCustomerNotifications: boolean;
        notificationTemplates: any;
        deliveryChannels: Array<{
            channel: string;
            enabled: boolean;
            priority: number;
            configuration: Record<string, any>;
            rateLimits: {
                maxNotificationsPerHour: number;
                maxNotificationsPerDay: number;
                burstLimit: number;
                cooldownPeriod: number;
            };
            retryPolicy: {
                maxRetries: number;
                initialDelay: number;
                maxDelay: number;
                backoffMultiplier: number;
                retryableErrors: string[];
            };
        }>;
        escalationMatrix: {
            levels: any[];
            automaticEscalation: boolean;
            escalationTimeouts: Record<string, number>;
            skipLevels: boolean;
        };
        brandingConfig: {
            companyName: string;
            logo: string;
            colors: Record<string, string>;
            footer: string;
            disclaimer: string;
            contactInfo: Record<string, string>;
        };
        complianceReporting: {
            enabled: boolean;
            frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
            recipients: string[];
            includeMetrics: boolean;
            includeTrends: boolean;
            includeRecommendations: boolean;
            format: 'pdf' | 'html' | 'excel';
            distributionTime: string;
        };
        customerPreferences: {
            allowCustomerOptOut: boolean;
            requireExplicitOptIn: boolean;
            preferenceManagementUrl: string;
            defaultPreferences: any;
        };
    };
    api: {
        port: number;
        rateLimitWindowMs: number;
        rateLimitMaxRequests: number;
        enableCors: boolean;
        enableCompression: boolean;
        maxPayloadSize: string;
        apiVersion: string;
        authenticationRequired: boolean;
        enableSwaggerDocs: boolean;
        metricsEnabled: boolean;
        allowedOrigins: string[];
        jwtSecret?: string;
        adminApiKey?: string;
    };
}
export declare class SLAMonitoringSystem {
    private trackingService;
    private breachDetectionService;
    private reportingService;
    private historicalAnalysisService;
    private complianceScoringService;
    private customerNotificationService;
    private apiController;
    constructor(config: SLAMonitoringSystemConfig);
    private setupIntegrations;
    getTrackingService(): SLATrackingService;
    getBreachDetectionService(): SLABreachDetectionService;
    getReportingService(): SLAReportingService;
    getHistoricalAnalysisService(): SLAHistoricalAnalysisService;
    getComplianceScoringService(): SLAComplianceScoringService;
    getCustomerNotificationService(): SLACustomerNotificationService;
    getAPIController(): SLAManagementController;
    start(): Promise<void>;
    shutdown(): Promise<void>;
}
export declare const createSLAMonitoringSystem: (config: SLAMonitoringSystemConfig) => SLAMonitoringSystem;
export declare const getDefaultConfig: () => SLAMonitoringSystemConfig;
