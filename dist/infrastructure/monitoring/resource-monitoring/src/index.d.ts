export * from './ResourceDataModel';
export * from './ResourceUtilizationService';
export * from './ResourceEfficiencyAnalyticsService';
export * from './ResourceOptimizationService';
export * from './ResourceAllocationTrackingService';
export * from './ResourceCostAnalysisService';
export * from './ResourcePlanningDashboardService';
export * from './ResourceMonitoringController';
import { ResourceUtilizationService, ResourceCollectionConfig } from './ResourceUtilizationService';
import { ResourceEfficiencyAnalyticsService, EfficiencyAnalyticsConfig } from './ResourceEfficiencyAnalyticsService';
import { ResourceOptimizationService, OptimizationConfig } from './ResourceOptimizationService';
import { ResourceAllocationTrackingService, AllocationTrackingConfig } from './ResourceAllocationTrackingService';
import { ResourceCostAnalysisService, CostAnalysisConfig } from './ResourceCostAnalysisService';
import { ResourcePlanningDashboardService, DashboardConfig } from './ResourcePlanningDashboardService';
import { ResourceMonitoringController, ResourceMonitoringControllerConfig } from './ResourceMonitoringController';
export interface ResourceMonitoringSystemConfig {
    utilization: ResourceCollectionConfig;
    efficiency: EfficiencyAnalyticsConfig;
    optimization: OptimizationConfig;
    allocation: AllocationTrackingConfig;
    costAnalysis: CostAnalysisConfig;
    dashboard: DashboardConfig;
    api: ResourceMonitoringControllerConfig;
}
export declare class ResourceMonitoringSystem {
    private utilizationService;
    private efficiencyService;
    private optimizationService;
    private allocationService;
    private costAnalysisService;
    private dashboardService;
    private apiController;
    constructor(config: ResourceMonitoringSystemConfig);
    private setupIntegrations;
    private setupErrorHandling;
    getUtilizationService(): ResourceUtilizationService;
    getEfficiencyService(): ResourceEfficiencyAnalyticsService;
    getOptimizationService(): ResourceOptimizationService;
    getAllocationService(): ResourceAllocationTrackingService;
    getCostAnalysisService(): ResourceCostAnalysisService;
    getDashboardService(): ResourcePlanningDashboardService;
    getAPIController(): ResourceMonitoringController;
    start(): Promise<void>;
    shutdown(): Promise<void>;
}
export declare const createResourceMonitoringSystem: (config: ResourceMonitoringSystemConfig) => ResourceMonitoringSystem;
export declare const getDefaultConfig: () => ResourceMonitoringSystemConfig;
