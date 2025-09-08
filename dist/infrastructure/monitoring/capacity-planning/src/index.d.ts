export * from './CapacityPlanningDataModel';
export * from './ResourceUsagePredictionService';
export * from './ScalingThresholdMonitor';
export * from './CapacityTrendAnalyzer';
export * from './AutomatedScalingRecommendationEngine';
export * from './CapacityPlanningReportGenerator';
export * from './CostOptimizationService';
export * from './CapacityAlertWorkflowManager';
export * from './CapacityPlanningController';
import { ResourceUsagePredictionService } from './ResourceUsagePredictionService';
import { ScalingThresholdMonitor } from './ScalingThresholdMonitor';
import { CapacityTrendAnalyzer } from './CapacityTrendAnalyzer';
import { AutomatedScalingRecommendationEngine } from './AutomatedScalingRecommendationEngine';
import { CapacityPlanningReportGenerator } from './CapacityPlanningReportGenerator';
import { CostOptimizationService } from './CostOptimizationService';
import { CapacityAlertWorkflowManager } from './CapacityAlertWorkflowManager';
import { CapacityPlanningController } from './CapacityPlanningController';
export interface CapacityPlanningSystemConfig {
    prediction: {
        dataRetentionDays: number;
        defaultLookbackPeriod: number;
        defaultPredictionHorizon: number;
        modelRetrainingInterval: number;
        minDataPointsForPrediction: number;
        enableAutoModelSelection: boolean;
        modelAccuracyThreshold: number;
        parallelPredictions: number;
    };
    thresholdMonitoring: {
        evaluationInterval: number;
        alertCooldownPeriod: number;
        maxConcurrentAlerts: number;
        enableAutoScaling: boolean;
        defaultThresholds: Record<string, number>;
        escalationRules: Array<{
            timeToEscalate: number;
            escalationLevel: number;
            actions: any[];
        }>;
        notificationChannels: Array<{
            type: string;
            configuration: Record<string, any>;
            isActive: boolean;
            priority: number;
        }>;
    };
    trendAnalysis: {
        analysisInterval: number;
        minDataPoints: number;
        seasonalityDetectionThreshold: number;
        changePointSensitivity: number;
        forecastHorizon: number;
        confidenceThreshold: number;
        enableSeasonalityDetection: boolean;
        enableChangePointDetection: boolean;
        enableForecastGeneration: boolean;
    };
    recommendations: {
        evaluationInterval: number;
        recommendationValidityPeriod: number;
        minConfidenceThreshold: number;
        maxRecommendationsPerResource: number;
        enableProactiveRecommendations: boolean;
        enableCostOptimization: boolean;
        enablePerformanceTuning: boolean;
        riskTolerance: 'low' | 'medium' | 'high';
        businessHours: {
            start: number;
            end: number;
            timezone: string;
        };
        scalingConstraints: {
            maxScaleUpFactor: number;
            maxScaleDownFactor: number;
            minCooldownPeriod: number;
            maxConcurrentScalings: number;
            budgetLimit: number;
            maintenanceWindows: Array<{
                start: Date;
                end: Date;
                recurring: boolean;
            }>;
            dependencies: Record<string, string[]>;
        };
    };
    reporting: {
        defaultFormat: string[];
        maxReportsPerDay: number;
        reportRetentionDays: number;
        enableScheduledReports: boolean;
        templateDirectory: string;
        outputDirectory: string;
        emailSettings: {
            enabled: boolean;
            smtpHost: string;
            smtpPort: number;
            fromAddress: string;
        };
    };
    costOptimization: {
        analysisInterval: number;
        minSavingsThreshold: number;
        maxRiskTolerance: number;
        enableRealTimeOptimization: boolean;
        costDataSources: Array<{
            type: 'aws' | 'azure' | 'gcp' | 'internal';
            configuration: Record<string, any>;
            isActive: boolean;
        }>;
        optimizationStrategies: Array<{
            type: string;
            enabled: boolean;
            parameters: Record<string, any>;
            minSavingsPercentage: number;
        }>;
        budgetConstraints: Array<{
            resourceType: string;
            monthlyBudget: number;
            alertThreshold: number;
        }>;
    };
    workflows: {
        enableAutoEscalation: boolean;
        escalationTimeouts: Record<string, number>;
        maxEscalationLevel: number;
        enableAutoRemediation: boolean;
        remediationApprovalRequired: boolean;
        workflowTemplates: any[];
        integrations: Array<{
            type: string;
            configuration: Record<string, any>;
            isActive: boolean;
        }>;
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
    };
}
export declare class CapacityPlanningSystem {
    private predictionService;
    private thresholdMonitor;
    private trendAnalyzer;
    private recommendationEngine;
    private reportGenerator;
    private costOptimizationService;
    private workflowManager;
    private apiController;
    constructor(config: CapacityPlanningSystemConfig);
    private setupIntegrations;
    getPredictionService(): ResourceUsagePredictionService;
    getThresholdMonitor(): ScalingThresholdMonitor;
    getTrendAnalyzer(): CapacityTrendAnalyzer;
    getRecommendationEngine(): AutomatedScalingRecommendationEngine;
    getReportGenerator(): CapacityPlanningReportGenerator;
    getCostOptimizationService(): CostOptimizationService;
    getWorkflowManager(): CapacityAlertWorkflowManager;
    getAPIController(): CapacityPlanningController;
    start(): Promise<any>;
    shutdown(): Promise<any>;
}
export declare const createCapacityPlanningSystem: (config: CapacityPlanningSystemConfig) => CapacityPlanningSystem;
export declare const getDefaultConfig: () => CapacityPlanningSystemConfig;
