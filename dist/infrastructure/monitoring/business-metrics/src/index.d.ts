export * from './BusinessMetricsDataModel';
export * from './MetricsCollectionPipeline';
export * from './DashboardTemplateSystem';
export * from './RealTimeMetricsStreaming';
export * from './BusinessThresholdAlerting';
export * from './ExecutiveReportingDashboard';
export * from './DrillDownCapabilities';
export * from './BusinessMetricsController';
import { MetricsCollectionPipeline, CollectionConfig } from './MetricsCollectionPipeline';
import { DashboardTemplateSystem } from './DashboardTemplateSystem';
import { RealTimeMetricsStreaming, StreamingConfig } from './RealTimeMetricsStreaming';
import { BusinessThresholdAlerting } from './BusinessThresholdAlerting';
import { ExecutiveReportingDashboard, ExecutiveDashboardConfig } from './ExecutiveReportingDashboard';
import { DrillDownCapabilities } from './DrillDownCapabilities';
import { BusinessMetricsController, BusinessMetricsAPIConfig } from './BusinessMetricsController';
export interface BusinessMetricsSystemConfig {
    collection: CollectionConfig;
    streaming: StreamingConfig;
    executive: ExecutiveDashboardConfig;
    api: BusinessMetricsAPIConfig;
}
export declare class BusinessMetricsSystem {
    private collectionPipeline;
    private dashboardSystem;
    private streamingService;
    private alertingSystem;
    private executiveDashboard;
    private drillDownService;
    private apiController;
    constructor(config: BusinessMetricsSystemConfig);
    private setupIntegrations;
    getCollectionPipeline(): MetricsCollectionPipeline;
    getDashboardSystem(): DashboardTemplateSystem;
    getStreamingService(): RealTimeMetricsStreaming;
    getAlertingSystem(): BusinessThresholdAlerting;
    getExecutiveDashboard(): ExecutiveReportingDashboard;
    getDrillDownService(): DrillDownCapabilities;
    getAPIController(): BusinessMetricsController;
    start(): Promise<void>;
    shutdown(): Promise<void>;
}
export declare const createBusinessMetricsSystem: (config: BusinessMetricsSystemConfig) => BusinessMetricsSystem;
export declare const getDefaultConfig: () => BusinessMetricsSystemConfig;
