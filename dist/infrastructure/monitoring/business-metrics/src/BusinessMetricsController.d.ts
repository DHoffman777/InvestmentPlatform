import express from 'express';
import { MetricsCollectionPipeline, DashboardTemplateSystem, RealTimeMetricsStreaming, BusinessThresholdAlerting, ExecutiveReportingDashboard, DrillDownCapabilities } from './index';
export interface BusinessMetricsAPIConfig {
    port: number;
    rateLimitWindowMs: number;
    rateLimitMaxRequests: number;
    enableCors: boolean;
    enableCompression: boolean;
    maxPayloadSize: string;
    apiVersion: string;
    authenticationRequired: boolean;
}
export interface APIResponse<T = any> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    meta?: {
        timestamp: string;
        requestId: string;
        version: string;
        pagination?: PaginationMeta;
    };
}
export interface PaginationMeta {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
}
export interface QueryOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    filters?: Record<string, any>;
    search?: string;
    tenantId?: string;
}
export declare class BusinessMetricsController {
    private app;
    private config;
    private collectionPipeline;
    private dashboardSystem;
    private streamingService;
    private alertingSystem;
    private executiveDashboard;
    private drillDownService;
    constructor(config: BusinessMetricsAPIConfig, services: {
        collectionPipeline: MetricsCollectionPipeline;
        dashboardSystem: DashboardTemplateSystem;
        streamingService: RealTimeMetricsStreaming;
        alertingSystem: BusinessThresholdAlerting;
        executiveDashboard: ExecutiveReportingDashboard;
        drillDownService: DrillDownCapabilities;
    });
    private setupMiddleware;
    private requestLogger;
    private tenantExtractor;
    private authenticationMiddleware;
    private setupRoutes;
    private setupMetricDefinitionRoutes;
    private setupKPIRoutes;
    private setupDashboardRoutes;
    private setupAlertingRoutes;
    private setupExecutiveRoutes;
    private setupDrillDownRoutes;
    private setupExportRoutes;
    private setupSystemRoutes;
    private setupErrorHandling;
    private getMetricDefinitions;
    private createMetricDefinition;
    private getMetricDefinition;
    private updateMetricDefinition;
    private deleteMetricDefinition;
    private getMetricValues;
    private recordMetricValue;
    private recordMetricValuesBatch;
    private getKPIs;
    private createKPI;
    private getKPI;
    private updateKPI;
    private deleteKPI;
    private getKPICurrentValue;
    private createKPITarget;
    private getDashboardTemplates;
    private createDashboardTemplate;
    private getDashboardTemplate;
    private updateDashboardTemplate;
    private deleteDashboardTemplate;
    private cloneDashboardTemplate;
    private createDashboardInstance;
    private getDashboardInstances;
    private getDashboardInstance;
    private renderDashboard;
    private getAlertRules;
    private createAlertRule;
    private getAlertRule;
    private updateAlertRule;
    private deleteAlertRule;
    private getActiveAlerts;
    private acknowledgeAlert;
    private resolveAlert;
    private getAlertHistory;
    private getAlertStatistics;
    private getExecutiveSummary;
    private getExecutiveMetrics;
    private getExecutiveInsights;
    private getExecutiveRecommendations;
    private getPerformanceSummary;
    private getDrillDownPaths;
    private createDrillDownPath;
    private startDrillDownSession;
    private navigateDrillDown;
    private navigateBack;
    private createDrillDownBookmark;
    private getDrillDownBookmarks;
    private loadDrillDownBookmark;
    private endDrillDownSession;
    private exportMetrics;
    private exportDashboard;
    private exportDrillDown;
    private getExportStatus;
    private downloadExport;
    private getExports;
    private deleteExport;
    private getSystemStats;
    private getSystemHealth;
    private getSystemMetrics;
    private clearSystemCache;
    private healthCheck;
    private systemMetrics;
    private validateTenantId;
    private validateRequest;
    private validateToken;
    private extractUserIdFromToken;
    private extractQueryOptions;
    private calculatePagination;
    private sendSuccess;
    private sendError;
    private generateId;
    getApp(): express.Application;
    start(): Promise<void>;
}
declare global {
    namespace Express {
        interface Request {
            tenantId?: string;
            userId?: string;
        }
    }
}
