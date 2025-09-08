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
exports.getDefaultConfig = exports.createCapacityPlanningSystem = exports.CapacityPlanningSystem = void 0;
__exportStar(require("./CapacityPlanningDataModel"), exports);
__exportStar(require("./ResourceUsagePredictionService"), exports);
__exportStar(require("./ScalingThresholdMonitor"), exports);
__exportStar(require("./CapacityTrendAnalyzer"), exports);
__exportStar(require("./AutomatedScalingRecommendationEngine"), exports);
__exportStar(require("./CapacityPlanningReportGenerator"), exports);
__exportStar(require("./CostOptimizationService"), exports);
__exportStar(require("./CapacityAlertWorkflowManager"), exports);
__exportStar(require("./CapacityPlanningController"), exports);
const ResourceUsagePredictionService_1 = require("./ResourceUsagePredictionService");
const ScalingThresholdMonitor_1 = require("./ScalingThresholdMonitor");
const CapacityTrendAnalyzer_1 = require("./CapacityTrendAnalyzer");
const AutomatedScalingRecommendationEngine_1 = require("./AutomatedScalingRecommendationEngine");
const CapacityPlanningReportGenerator_1 = require("./CapacityPlanningReportGenerator");
const CostOptimizationService_1 = require("./CostOptimizationService");
const CapacityAlertWorkflowManager_1 = require("./CapacityAlertWorkflowManager");
const CapacityPlanningController_1 = require("./CapacityPlanningController");
class CapacityPlanningSystem {
    predictionService;
    thresholdMonitor;
    trendAnalyzer;
    recommendationEngine;
    reportGenerator;
    costOptimizationService;
    workflowManager;
    apiController;
    constructor(config) {
        this.predictionService = new ResourceUsagePredictionService_1.ResourceUsagePredictionService(config.prediction);
        this.thresholdMonitor = new ScalingThresholdMonitor_1.ScalingThresholdMonitor(config.thresholdMonitoring);
        this.trendAnalyzer = new CapacityTrendAnalyzer_1.CapacityTrendAnalyzer(config.trendAnalysis);
        this.recommendationEngine = new AutomatedScalingRecommendationEngine_1.AutomatedScalingRecommendationEngine(config.recommendations);
        this.reportGenerator = new CapacityPlanningReportGenerator_1.CapacityPlanningReportGenerator(config.reporting);
        this.costOptimizationService = new CostOptimizationService_1.CostOptimizationService(config.costOptimization);
        this.workflowManager = new CapacityAlertWorkflowManager_1.CapacityAlertWorkflowManager(config.workflows);
        this.apiController = new CapacityPlanningController_1.CapacityPlanningController(config.api, {
            predictionService: this.predictionService,
            thresholdMonitor: this.thresholdMonitor,
            trendAnalyzer: this.trendAnalyzer,
            recommendationEngine: this.recommendationEngine,
            reportGenerator: this.reportGenerator,
            costOptimizationService: this.costOptimizationService,
            workflowManager: this.workflowManager
        });
        this.setupIntegrations();
    }
    setupIntegrations() {
        // Connect threshold monitor alerts to workflow manager
        this.thresholdMonitor.on('alertCreated', async (event) => {
            const alerts = await this.thresholdMonitor.getActiveAlerts(event.resourceId);
            if (alerts.length > 0) {
                await this.workflowManager.processAlert(alerts[0]);
            }
        });
        // Connect prediction service to recommendation engine
        this.predictionService.on('predictionCompleted', async (event) => {
            console.log(`Prediction completed for resource ${event.resourceId}`);
        });
        // Connect trend analyzer to recommendation engine
        this.trendAnalyzer.on('analysisCompleted', async (event) => {
            console.log(`Trend analysis completed for resource ${event.resourceId}`);
        });
        // Connect cost optimization to workflow manager
        this.costOptimizationService.on('analysisCompleted', async (event) => {
            console.log(`Cost optimization analysis completed for resource ${event.resourceId}`);
        });
        // Connect recommendation engine to workflow manager
        this.recommendationEngine.on('recommendationGenerated', async (event) => {
            console.log(`Recommendation generated: ${event.recommendationId} for resource ${event.resourceId}`);
        });
        // Connect report generator events
        this.reportGenerator.on('reportGenerationCompleted', async (event) => {
            console.log(`Report generation completed: ${event.reportId}`);
        });
        // Connect workflow manager events
        this.workflowManager.on('workflowCompleted', async (event) => {
            console.log(`Workflow completed: ${event.executionId}`);
        });
    }
    getPredictionService() {
        return this.predictionService;
    }
    getThresholdMonitor() {
        return this.thresholdMonitor;
    }
    getTrendAnalyzer() {
        return this.trendAnalyzer;
    }
    getRecommendationEngine() {
        return this.recommendationEngine;
    }
    getReportGenerator() {
        return this.reportGenerator;
    }
    getCostOptimizationService() {
        return this.costOptimizationService;
    }
    getWorkflowManager() {
        return this.workflowManager;
    }
    getAPIController() {
        return this.apiController;
    }
    async start() {
        console.log('Starting Capacity Planning System...');
        await this.apiController.start();
        console.log('Capacity Planning System started successfully');
    }
    async shutdown() {
        console.log('Shutting down Capacity Planning System...');
        await this.predictionService.shutdown();
        await this.thresholdMonitor.shutdown();
        await this.trendAnalyzer.shutdown();
        await this.recommendationEngine.shutdown();
        await this.reportGenerator.shutdown();
        await this.costOptimizationService.shutdown();
        await this.workflowManager.shutdown();
        console.log('Capacity Planning System shutdown complete');
    }
}
exports.CapacityPlanningSystem = CapacityPlanningSystem;
const createCapacityPlanningSystem = (config) => {
    return new CapacityPlanningSystem(config);
};
exports.createCapacityPlanningSystem = createCapacityPlanningSystem;
const getDefaultConfig = () => {
    return {
        prediction: {
            dataRetentionDays: 90,
            defaultLookbackPeriod: 168,
            defaultPredictionHorizon: 24,
            modelRetrainingInterval: 86400000,
            minDataPointsForPrediction: 50,
            enableAutoModelSelection: true,
            modelAccuracyThreshold: 0.7,
            parallelPredictions: 5
        },
        thresholdMonitoring: {
            evaluationInterval: 60000,
            alertCooldownPeriod: 900000,
            maxConcurrentAlerts: 10,
            enableAutoScaling: true,
            defaultThresholds: {
                cpu_usage: 80,
                memory_usage: 85,
                disk_usage: 90
            },
            escalationRules: [{
                    timeToEscalate: 300000,
                    escalationLevel: 1,
                    actions: []
                }],
            notificationChannels: [{
                    type: 'email',
                    configuration: { enabled: true },
                    isActive: true,
                    priority: 1
                }]
        },
        trendAnalysis: {
            analysisInterval: 300000,
            minDataPoints: 24,
            seasonalityDetectionThreshold: 0.3,
            changePointSensitivity: 2.0,
            forecastHorizon: 48,
            confidenceThreshold: 0.8,
            enableSeasonalityDetection: true,
            enableChangePointDetection: true,
            enableForecastGeneration: true
        },
        recommendations: {
            evaluationInterval: 1800000,
            recommendationValidityPeriod: 3600000,
            minConfidenceThreshold: 0.7,
            maxRecommendationsPerResource: 5,
            enableProactiveRecommendations: true,
            enableCostOptimization: true,
            enablePerformanceTuning: true,
            riskTolerance: 'medium',
            businessHours: {
                start: 9,
                end: 17,
                timezone: 'UTC'
            },
            scalingConstraints: {
                maxScaleUpFactor: 3.0,
                maxScaleDownFactor: 0.5,
                minCooldownPeriod: 900000,
                maxConcurrentScalings: 3,
                budgetLimit: 50000,
                maintenanceWindows: [],
                dependencies: {}
            }
        },
        reporting: {
            defaultFormat: ['pdf', 'html'],
            maxReportsPerDay: 50,
            reportRetentionDays: 30,
            enableScheduledReports: true,
            templateDirectory: './templates',
            outputDirectory: './reports',
            emailSettings: {
                enabled: false,
                smtpHost: '',
                smtpPort: 587,
                fromAddress: ''
            }
        },
        costOptimization: {
            analysisInterval: 86400000,
            minSavingsThreshold: 100,
            maxRiskTolerance: 0.3,
            enableRealTimeOptimization: false,
            costDataSources: [],
            optimizationStrategies: [],
            budgetConstraints: []
        },
        workflows: {
            enableAutoEscalation: true,
            escalationTimeouts: {
                critical: 300000,
                high: 900000,
                medium: 1800000,
                low: 3600000
            },
            maxEscalationLevel: 3,
            enableAutoRemediation: false,
            remediationApprovalRequired: true,
            workflowTemplates: [],
            integrations: []
        },
        api: {
            port: 3000,
            rateLimitWindowMs: 900000,
            rateLimitMaxRequests: 1000,
            enableCors: true,
            enableCompression: true,
            maxPayloadSize: '10mb',
            apiVersion: 'v1',
            authenticationRequired: false,
            enableSwaggerDocs: true,
            metricsEnabled: true
        }
    };
};
exports.getDefaultConfig = getDefaultConfig;
