import { EventEmitter } from 'events';
import { ResourceUtilizationService } from './ResourceUtilizationService';
import { ResourceEfficiencyAnalyticsService } from './ResourceEfficiencyAnalyticsService';
import { ResourceOptimizationService } from './ResourceOptimizationService';
import { ResourceAllocationTrackingService } from './ResourceAllocationTrackingService';
import { ResourceCostAnalysisService } from './ResourceCostAnalysisService';
import { ResourcePlanningDashboardService } from './ResourcePlanningDashboardService';
export interface ResourceMonitoringControllerConfig {
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
}
export interface ServiceDependencies {
    utilizationService: ResourceUtilizationService;
    efficiencyService: ResourceEfficiencyAnalyticsService;
    optimizationService: ResourceOptimizationService;
    allocationService: ResourceAllocationTrackingService;
    costAnalysisService: ResourceCostAnalysisService;
    dashboardService: ResourcePlanningDashboardService;
}
export declare class ResourceMonitoringController extends EventEmitter {
    private config;
    private services;
    private app;
    private server?;
    constructor(config: ResourceMonitoringControllerConfig, services: ServiceDependencies);
    private setupMiddleware;
    private setupRoutes;
    private setupHealthRoutes;
    private setupUtilizationRoutes;
    private setupEfficiencyRoutes;
    private setupOptimizationRoutes;
    private setupAllocationRoutes;
    private setupCostAnalysisRoutes;
    private setupDashboardRoutes;
    private setupAdminRoutes;
    private setupSwaggerDocs;
    private setupErrorHandling;
    private authenticateRequest;
    private getContentType;
    start(): Promise<any>;
    shutdown(): Promise<void>;
}
