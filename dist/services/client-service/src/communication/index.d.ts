import { CommunicationService } from './CommunicationService';
import { CommunicationAnalyticsService } from './CommunicationAnalyticsService';
import { ComplianceRecordingService } from './ComplianceRecordingService';
import { CommunicationTimelineService } from './CommunicationTimelineService';
import { CommunicationController } from './CommunicationController';
export interface CommunicationSystemConfig {
    communication: {
        enableMultiChannel: boolean;
        enableCategorization: boolean;
        enableSmartSearch: boolean;
        maxSearchResults: number;
        defaultRetentionDays: number;
        enableNotifications: boolean;
        supportedChannels: string[];
        supportedTypes: string[];
    };
    analytics: {
        enableRealTimeAnalytics: boolean;
        metricsRetentionDays: number;
        sentimentAnalysisEnabled: boolean;
        responseTimeSlaHours: number;
        highVolumeThreshold: number;
        lowSentimentThreshold: number;
        analysisIntervals: {
            realTime: number;
            hourly: number;
            daily: number;
            weekly: number;
        };
        alertThresholds: {
            volumeSpike: number;
            responseTimeDelay: number;
            sentimentDrop: number;
            slaViolation: number;
        };
    };
    recording: {
        enableRecording: boolean;
        defaultRetentionDays: number;
        encryptionEnabled: boolean;
        transcriptionEnabled: boolean;
        realTimeTranscription: boolean;
        qualityMonitoring: boolean;
        consentValidation: boolean;
        storageRedundancy: number;
        compressionLevel: number;
        maxFileSize: number;
        allowedCodecs: string[];
        geographicRestrictions: string[];
        auditFrequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
        alertThresholds: {
            diskSpaceWarning: number;
            qualityDegradation: number;
            retentionExpiry: number;
            consentExpiry: number;
        };
    };
    timeline: {
        defaultViewType: 'chronological' | 'grouped' | 'filtered' | 'summary' | 'interactive';
        maxTimelineLength: number;
        autoRefreshInterval: number;
        enableRealTimeUpdates: boolean;
        enablePredictiveInsights: boolean;
        retentionPeriod: number;
        complianceSettings: {
            auditTrailEnabled: boolean;
            recordingIntegration: boolean;
            complianceValidation: boolean;
            automaticClassification: boolean;
        };
        alertSettings: {
            enableAlerts: boolean;
            defaultEscalationTime: number;
            alertChannels: string[];
            quietHours: {
                enabled: boolean;
                start: string;
                end: string;
                timezone: string;
            };
        };
    };
    api: {
        rateLimiting: {
            windowMs: number;
            maxRequests: number;
            skipSuccessfulRequests: boolean;
        };
        validation: {
            enableStrict: boolean;
            maxContentLength: number;
            allowedFileTypes: string[];
            maxFileSize: number;
        };
        features: {
            enableAnalytics: boolean;
            enableRecording: boolean;
            enableTimeline: boolean;
            enableRealTime: boolean;
        };
        security: {
            enableCors: boolean;
            allowedOrigins: string[];
            enableHelmet: boolean;
            requireAuth: boolean;
        };
    };
    integrations: {
        storageProviders: string[];
        transcriptionServices: string[];
        archivalSystems: string[];
        complianceTools: string[];
        calendarSystems: string[];
        crmSystems: string[];
        documentSystems: string[];
        communicationPlatforms: string[];
    };
}
export declare class CommunicationSystem {
    private communicationService;
    private analyticsService?;
    private recordingService?;
    private timelineService?;
    private controller;
    private config;
    private isInitialized;
    constructor(config?: Partial<CommunicationSystemConfig>);
    private mergeDefaultConfig;
    private deepMerge;
    private initializeServices;
    private setupServiceIntegrations;
    initialize(): Promise<void>;
    getCommunicationService(): CommunicationService;
    getAnalyticsService(): CommunicationAnalyticsService | undefined;
    getRecordingService(): ComplianceRecordingService | undefined;
    getTimelineService(): CommunicationTimelineService | undefined;
    getController(): CommunicationController;
    getExpressApp(): import("express").Application;
    getConfig(): CommunicationSystemConfig;
    updateConfig(updates: Partial<CommunicationSystemConfig>): void;
    getSystemHealth(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        services: Record<string, 'available' | 'unavailable' | 'degraded'>;
        timestamp: Date;
        uptime: number;
    }>;
    getSystemMetrics(): Promise<{
        memory: NodeJS.MemoryUsage;
        cpu: NodeJS.CpuUsage;
        uptime: number;
        services: {
            communication: any;
            analytics?: any;
            recording?: any;
            timeline?: any;
        };
    }>;
    shutdown(): Promise<void>;
}
export { CommunicationService, CommunicationAnalyticsService, ComplianceRecordingService, CommunicationTimelineService, CommunicationController };
export * from './CommunicationService';
export * from './CommunicationAnalyticsService';
export * from './ComplianceRecordingService';
export * from './CommunicationTimelineService';
export * from './CommunicationController';
export default CommunicationSystem;
