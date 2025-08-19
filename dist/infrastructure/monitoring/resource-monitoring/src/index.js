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
exports.getDefaultConfig = exports.createResourceMonitoringSystem = exports.ResourceMonitoringSystem = void 0;
__exportStar(require("./ResourceDataModel"), exports);
__exportStar(require("./ResourceUtilizationService"), exports);
__exportStar(require("./ResourceEfficiencyAnalyticsService"), exports);
__exportStar(require("./ResourceOptimizationService"), exports);
__exportStar(require("./ResourceAllocationTrackingService"), exports);
__exportStar(require("./ResourceCostAnalysisService"), exports);
__exportStar(require("./ResourcePlanningDashboardService"), exports);
__exportStar(require("./ResourceMonitoringController"), exports);
const ResourceUtilizationService_1 = require("./ResourceUtilizationService");
const ResourceEfficiencyAnalyticsService_1 = require("./ResourceEfficiencyAnalyticsService");
const ResourceOptimizationService_1 = require("./ResourceOptimizationService");
const ResourceAllocationTrackingService_1 = require("./ResourceAllocationTrackingService");
const ResourceCostAnalysisService_1 = require("./ResourceCostAnalysisService");
const ResourcePlanningDashboardService_1 = require("./ResourcePlanningDashboardService");
const ResourceMonitoringController_1 = require("./ResourceMonitoringController");
class ResourceMonitoringSystem {
    utilizationService;
    efficiencyService;
    optimizationService;
    allocationService;
    costAnalysisService;
    dashboardService;
    apiController;
    constructor(config) {
        // Initialize services
        this.utilizationService = new ResourceUtilizationService_1.ResourceUtilizationService(config.utilization);
        this.efficiencyService = new ResourceEfficiencyAnalyticsService_1.ResourceEfficiencyAnalyticsService(config.efficiency);
        this.optimizationService = new ResourceOptimizationService_1.ResourceOptimizationService(config.optimization);
        this.allocationService = new ResourceAllocationTrackingService_1.ResourceAllocationTrackingService(config.allocation);
        this.costAnalysisService = new ResourceCostAnalysisService_1.ResourceCostAnalysisService(config.costAnalysis);
        this.dashboardService = new ResourcePlanningDashboardService_1.ResourcePlanningDashboardService(config.dashboard);
        // Initialize API controller with service dependencies
        this.apiController = new ResourceMonitoringController_1.ResourceMonitoringController(config.api, {
            utilizationService: this.utilizationService,
            efficiencyService: this.efficiencyService,
            optimizationService: this.optimizationService,
            allocationService: this.allocationService,
            costAnalysisService: this.costAnalysisService,
            dashboardService: this.dashboardService
        });
        this.setupIntegrations();
    }
    setupIntegrations() {
        // Connect utilization service to efficiency analytics
        this.utilizationService.on('snapshotGenerated', async (event) => {
            try {
                const efficiency = await this.efficiencyService.analyzeResourceEfficiency(event.snapshot);
                console.log(`Efficiency analysis completed for resource ${event.resourceId}: ${(efficiency.score * 100).toFixed(1)}%`);
            }
            catch (error) {
                console.error(`Efficiency analysis failed for resource ${event.resourceId}:`, error.message);
            }
        });
        // Connect utilization service to allocation tracking
        this.utilizationService.on('snapshotGenerated', async (event) => {
            try {
                await this.allocationService.trackAllocationUsage(event.resourceId, event.snapshot);
            }
            catch (error) {
                console.error(`Allocation tracking failed for resource ${event.resourceId}:`, error.message);
            }
        });
        // Connect utilization service to cost analysis
        this.utilizationService.on('snapshotGenerated', async (event) => {
            try {
                const historicalData = []; // Would fetch actual historical data
                await this.costAnalysisService.analyzeCostCorrelations(event.resourceId, event.snapshot, historicalData);
            }
            catch (error) {
                console.error(`Cost analysis failed for resource ${event.resourceId}:`, error.message);
            }
        });
        // Connect efficiency service to optimization service
        this.efficiencyService.on('efficiencyAnalyzed', async (event) => {
            try {
                const snapshot = await this.utilizationService.generateSnapshot(event.resourceId);
                const insights = this.efficiencyService.getInsights(event.resourceId);
                const opportunities = this.efficiencyService.getOptimizationOpportunities(event.resourceId);
                const context = {
                    snapshot,
                    historical_data: [], // Would fetch historical data
                    anomalies: [], // Would fetch anomalies
                    insights,
                    opportunities
                };
                const recommendations = await this.optimizationService.generateRecommendations(context);
                console.log(`Generated ${recommendations.length} optimization recommendations for resource ${event.resourceId}`);
            }
            catch (error) {
                console.error(`Optimization recommendation generation failed for resource ${event.resourceId}:`, error.message);
            }
        });
        // Connect optimization service to allocation service
        this.optimizationService.on('recommendationApplied', async (event) => {
            try {
                console.log(`Optimization recommendation ${event.recommendationId} applied for resource ${event.resourceId}`);
                // Could trigger allocation adjustments based on recommendations
            }
            catch (error) {
                console.error(`Post-recommendation processing failed:`, error.message);
            }
        });
        // Connect cost analysis service to optimization service
        this.costAnalysisService.on('costAnalysisCompleted', async (event) => {
            try {
                console.log(`Cost analysis completed for resource ${event.resourceId}, ${event.savingsOpportunities} optimization opportunities identified`);
                // Cost optimizations would be integrated with general optimization recommendations
            }
            catch (error) {
                console.error(`Cost optimization integration failed:`, error.message);
            }
        });
        // Connect allocation service to cost analysis
        this.allocationService.on('allocationCreated', async (event) => {
            try {
                console.log(`New allocation ${event.allocationId} created for resource ${event.resourceId}`);
                // Could trigger cost impact analysis
            }
            catch (error) {
                console.error(`Allocation cost impact analysis failed:`, error.message);
            }
        });
        // Connect all services to dashboard updates
        this.utilizationService.on('snapshotGenerated', (event) => {
            this.dashboardService.emit('dataUpdate', {
                type: 'utilization',
                resourceId: event.resourceId,
                timestamp: event.timestamp
            });
        });
        this.efficiencyService.on('efficiencyAnalyzed', (event) => {
            this.dashboardService.emit('dataUpdate', {
                type: 'efficiency',
                resourceId: event.resourceId,
                timestamp: event.timestamp
            });
        });
        this.costAnalysisService.on('costAnalysisCompleted', (event) => {
            this.dashboardService.emit('dataUpdate', {
                type: 'cost',
                resourceId: event.resourceId,
                timestamp: event.timestamp
            });
        });
        this.allocationService.on('allocationCreated', (event) => {
            this.dashboardService.emit('dataUpdate', {
                type: 'allocation',
                resourceId: event.resourceId,
                timestamp: event.timestamp
            });
        });
        this.optimizationService.on('recommendationsGenerated', (event) => {
            this.dashboardService.emit('dataUpdate', {
                type: 'recommendations',
                resourceId: event.resourceId,
                timestamp: event.timestamp
            });
        });
        // Connect API controller events for monitoring
        this.apiController.on('requestCompleted', (event) => {
            // Could log API metrics, send to monitoring system, etc.
            if (event.statusCode >= 400) {
                console.warn(`API request failed: ${event.method} ${event.path} - ${event.statusCode} (${event.duration}ms)`);
            }
        });
        this.apiController.on('error', (event) => {
            console.error(`API error: ${event.error} - ${event.method} ${event.path}`);
        });
        // Error handling and logging
        this.setupErrorHandling();
    }
    setupErrorHandling() {
        const services = [
            { name: 'utilizationService', service: this.utilizationService },
            { name: 'efficiencyService', service: this.efficiencyService },
            { name: 'optimizationService', service: this.optimizationService },
            { name: 'allocationService', service: this.allocationService },
            { name: 'costAnalysisService', service: this.costAnalysisService },
            { name: 'dashboardService', service: this.dashboardService },
            { name: 'apiController', service: this.apiController }
        ];
        for (const { name, service } of services) {
            service.on('error', (error) => {
                console.error(`${name} error:`, error);
            });
        }
        // Handle uncaught exceptions
        process.on('uncaughtException', (error) => {
            console.error('Uncaught Exception:', error);
            this.shutdown().then(() => process.exit(1));
        });
        process.on('unhandledRejection', (reason, promise) => {
            console.error('Unhandled Rejection at:', promise, 'reason:', reason);
        });
        // Handle graceful shutdown signals
        process.on('SIGTERM', async () => {
            console.log('SIGTERM received, initiating graceful shutdown...');
            await this.shutdown();
            process.exit(0);
        });
        process.on('SIGINT', async () => {
            console.log('SIGINT received, initiating graceful shutdown...');
            await this.shutdown();
            process.exit(0);
        });
    }
    // Service getters for external access
    getUtilizationService() {
        return this.utilizationService;
    }
    getEfficiencyService() {
        return this.efficiencyService;
    }
    getOptimizationService() {
        return this.optimizationService;
    }
    getAllocationService() {
        return this.allocationService;
    }
    getCostAnalysisService() {
        return this.costAnalysisService;
    }
    getDashboardService() {
        return this.dashboardService;
    }
    getAPIController() {
        return this.apiController;
    }
    async start() {
        console.log('Starting Resource Monitoring System...');
        // Start API server
        await this.apiController.start();
        console.log('Resource Monitoring System started successfully');
        console.log('Services running:');
        console.log('  - Resource Utilization Service');
        console.log('  - Resource Efficiency Analytics Service');
        console.log('  - Resource Optimization Service');
        console.log('  - Resource Allocation Tracking Service');
        console.log('  - Resource Cost Analysis Service');
        console.log('  - Resource Planning Dashboard Service');
        console.log('  - Resource Monitoring API Controller');
    }
    async shutdown() {
        console.log('Shutting down Resource Monitoring System...');
        // Shutdown services in reverse order of dependency
        await this.apiController.shutdown();
        await this.dashboardService.shutdown();
        await this.costAnalysisService.shutdown();
        await this.allocationService.shutdown();
        await this.optimizationService.shutdown();
        await this.efficiencyService.shutdown();
        await this.utilizationService.shutdown();
        console.log('Resource Monitoring System shutdown complete');
    }
}
exports.ResourceMonitoringSystem = ResourceMonitoringSystem;
const createResourceMonitoringSystem = (config) => {
    return new ResourceMonitoringSystem(config);
};
exports.createResourceMonitoringSystem = createResourceMonitoringSystem;
const getDefaultConfig = () => {
    return {
        utilization: {
            refreshInterval: 60000, // 1 minute
            batchSize: 100,
            maxRetries: 3,
            timeoutMs: 30000,
            enableRealTimeStreaming: true,
            enableQualityValidation: true,
            dataRetentionHours: 72, // 3 days
            aggregationWindows: [300000, 900000, 3600000] // 5min, 15min, 1hour
        },
        efficiency: {
            analysisInterval: 300000, // 5 minutes
            benchmarkUpdateInterval: 86400000, // 24 hours
            wasteThresholds: {
                overProvisioned: 0.3,
                underUtilized: 0.5,
                idle: 0.05
            },
            efficiencyTargets: {
                cpu: 0.8,
                memory: 0.8,
                storage: 0.8,
                network: 0.7,
                cost: 0.85
            },
            enableMLAnalysis: true,
            enableBenchmarking: true,
            costAnalysisEnabled: true
        },
        optimization: {
            enableMLRecommendations: true,
            enableCostOptimization: true,
            enablePerformanceOptimization: true,
            enableSecurityOptimization: false,
            recommendationUpdateInterval: 1800000, // 30 minutes
            maxRecommendationsPerResource: 10,
            confidenceThreshold: 0.7,
            autoApplyLowRiskRecommendations: false,
            costSavingsThreshold: 50,
            performanceImpactThreshold: 0.05
        },
        allocation: {
            trackingInterval: 300000, // 5 minutes
            allocationTimeoutHours: 168, // 1 week
            enableAutoRelease: true,
            enableAllocationOptimization: true,
            wasteThreshold: 30,
            efficiencyThreshold: 0.7,
            maxAllocationDuration: 8760, // 1 year in hours
            costTrackingEnabled: true,
            approvalRequired: true,
            notificationChannels: ['email', 'slack']
        },
        costAnalysis: {
            analysisInterval: 3600000, // 1 hour
            costUpdateInterval: 1800000, // 30 minutes
            enableRealTimeCostTracking: true,
            enableCostForecasting: true,
            enableCostOptimization: true,
            enableCostAlerting: true,
            costThresholds: {
                warning: 1000,
                critical: 5000,
                emergency: 10000
            },
            forecastHorizons: [7, 14, 30, 90], // Days
            optimizationTargets: {
                cost_reduction_percentage: 15,
                efficiency_improvement_percentage: 20,
                waste_reduction_percentage: 25
            },
            currencies: ['USD', 'EUR', 'GBP'],
            exchangeRateUpdateInterval: 3600000 // 1 hour
        },
        dashboard: {
            refreshInterval: 60000, // 1 minute
            enableRealTimeUpdates: true,
            enableInteractiveFeatures: true,
            maxDataPoints: 1000,
            defaultTimeRange: 'last_day',
            widgetConfiguration: [],
            customMetrics: [],
            alertIntegration: true,
            exportFormats: ['pdf', 'excel', 'csv', 'json'],
            roleBasedAccess: true
        },
        api: {
            port: 3008,
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
// Example usage and startup
if (require.main === module) {
    const config = (0, exports.getDefaultConfig)();
    const system = (0, exports.createResourceMonitoringSystem)(config);
    system.start().then(() => {
        console.log('Resource Monitoring System started successfully on port', config.api.port);
    }).catch((error) => {
        console.error('Failed to start Resource Monitoring System:', error);
        process.exit(1);
    });
}
