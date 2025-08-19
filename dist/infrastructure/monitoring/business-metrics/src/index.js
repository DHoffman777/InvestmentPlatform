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
exports.getDefaultConfig = exports.createBusinessMetricsSystem = exports.BusinessMetricsSystem = void 0;
__exportStar(require("./BusinessMetricsDataModel"), exports);
__exportStar(require("./MetricsCollectionPipeline"), exports);
__exportStar(require("./DashboardTemplateSystem"), exports);
__exportStar(require("./RealTimeMetricsStreaming"), exports);
__exportStar(require("./BusinessThresholdAlerting"), exports);
__exportStar(require("./ExecutiveReportingDashboard"), exports);
__exportStar(require("./DrillDownCapabilities"), exports);
__exportStar(require("./BusinessMetricsController"), exports);
const MetricsCollectionPipeline_1 = require("./MetricsCollectionPipeline");
const DashboardTemplateSystem_1 = require("./DashboardTemplateSystem");
const RealTimeMetricsStreaming_1 = require("./RealTimeMetricsStreaming");
const BusinessThresholdAlerting_1 = require("./BusinessThresholdAlerting");
const ExecutiveReportingDashboard_1 = require("./ExecutiveReportingDashboard");
const DrillDownCapabilities_1 = require("./DrillDownCapabilities");
const BusinessMetricsController_1 = require("./BusinessMetricsController");
class BusinessMetricsSystem {
    collectionPipeline;
    dashboardSystem;
    streamingService;
    alertingSystem;
    executiveDashboard;
    drillDownService;
    apiController;
    constructor(config) {
        this.collectionPipeline = new MetricsCollectionPipeline_1.MetricsCollectionPipeline(config.collection);
        this.dashboardSystem = new DashboardTemplateSystem_1.DashboardTemplateSystem();
        this.streamingService = new RealTimeMetricsStreaming_1.RealTimeMetricsStreaming(config.streaming);
        this.alertingSystem = new BusinessThresholdAlerting_1.BusinessThresholdAlerting();
        this.executiveDashboard = new ExecutiveReportingDashboard_1.ExecutiveReportingDashboard(config.executive);
        this.drillDownService = new DrillDownCapabilities_1.DrillDownCapabilities();
        this.apiController = new BusinessMetricsController_1.BusinessMetricsController(config.api, {
            collectionPipeline: this.collectionPipeline,
            dashboardSystem: this.dashboardSystem,
            streamingService: this.streamingService,
            alertingSystem: this.alertingSystem,
            executiveDashboard: this.executiveDashboard,
            drillDownService: this.drillDownService
        });
        this.setupIntegrations();
    }
    setupIntegrations() {
        this.collectionPipeline.on('metricValuesBatch', (event) => {
            event.values.forEach(value => {
                this.streamingService.publishMetricUpdate(value);
                this.alertingSystem.evaluateMetricValue(value);
            });
        });
        this.alertingSystem.on('alertTriggered', (event) => {
            this.streamingService.publishAlert(event);
        });
        this.executiveDashboard.on('executiveSummaryGenerated', (event) => {
            console.log(`Executive summary generated for tenant ${event.tenantId}: ${event.summaryId}`);
        });
        this.drillDownService.on('drillDownPerformed', (event) => {
            console.log(`Drill-down performed: ${event.level} with ${event.dataPoints} data points`);
        });
    }
    getCollectionPipeline() {
        return this.collectionPipeline;
    }
    getDashboardSystem() {
        return this.dashboardSystem;
    }
    getStreamingService() {
        return this.streamingService;
    }
    getAlertingSystem() {
        return this.alertingSystem;
    }
    getExecutiveDashboard() {
        return this.executiveDashboard;
    }
    getDrillDownService() {
        return this.drillDownService;
    }
    getAPIController() {
        return this.apiController;
    }
    async start() {
        console.log('Starting Business Metrics System...');
        await this.apiController.start();
        console.log('Business Metrics System started successfully');
    }
    async shutdown() {
        console.log('Shutting down Business Metrics System...');
        await this.streamingService.shutdown();
        await this.executiveDashboard.shutdown();
        await this.drillDownService.shutdown();
        console.log('Business Metrics System shutdown complete');
    }
}
exports.BusinessMetricsSystem = BusinessMetricsSystem;
const createBusinessMetricsSystem = (config) => {
    return new BusinessMetricsSystem(config);
};
exports.createBusinessMetricsSystem = createBusinessMetricsSystem;
const getDefaultConfig = () => {
    return {
        collection: {
            batchSize: 1000,
            flushInterval: 30000,
            maxRetries: 3,
            retryBackoff: 1000,
            compressionEnabled: true,
            encryptionEnabled: true,
            deadLetterQueueEnabled: true
        },
        streaming: {
            port: 8080,
            maxConnections: 1000,
            heartbeatInterval: 30000,
            bufferSize: 10000,
            compressionEnabled: true,
            rateLimitPerClient: 100,
            authenticationRequired: true
        },
        executive: {
            refreshInterval: 300000,
            dataRetentionDays: 90,
            autoExportEnabled: true,
            cacheEnabled: true,
            performanceThresholds: {
                loadTime: 5000,
                dataFreshness: 300000,
                errorRate: 0.01,
                availabilityTarget: 0.999
            }
        },
        api: {
            port: 3000,
            rateLimitWindowMs: 900000,
            rateLimitMaxRequests: 1000,
            enableCors: true,
            enableCompression: true,
            maxPayloadSize: '10mb',
            apiVersion: 'v1',
            authenticationRequired: true
        }
    };
};
exports.getDefaultConfig = getDefaultConfig;
