import { EventEmitter } from 'events';
import { SLATrackingService } from './SLATrackingService';
import { SLABreachDetectionService } from './SLABreachDetectionService';
import { SLAReportingService } from './SLAReportingService';
import { SLAHistoricalAnalysisService } from './SLAHistoricalAnalysisService';
import { SLAComplianceScoringService } from './SLAComplianceScoringService';
import { SLACustomerNotificationService } from './SLACustomerNotificationService';
import { SLASeverity, SLAStatus } from './SLADataModel';
export interface SLAManagementConfig {
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
    trackingService: SLATrackingService;
    breachDetectionService: SLABreachDetectionService;
    reportingService: SLAReportingService;
    historicalAnalysisService: SLAHistoricalAnalysisService;
    complianceScoringService: SLAComplianceScoringService;
    customerNotificationService: SLACustomerNotificationService;
}
export interface APIResponse<T = any> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    timestamp: Date;
    requestId: string;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface SLAQuery {
    slaId?: string;
    serviceId?: string;
    status?: SLAStatus;
    severity?: SLASeverity;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    includeInactive?: boolean;
}
export declare class SLAManagementController extends EventEmitter {
    private app;
    private config;
    private services;
    private server;
    private requestCount;
    constructor(config: SLAManagementConfig, services: ServiceDependencies);
    private setupMiddleware;
    private setupRoutes;
    private setupHealthRoutes;
    private setupSLADefinitionRoutes;
    private setupTrackingRoutes;
    private setupBreachRoutes;
    private setupComplianceRoutes;
    private setupAnalysisRoutes;
    private setupReportingRoutes;
    private setupNotificationRoutes;
    private setupAdminRoutes;
    private setupSwaggerDocs;
    private setupErrorHandling;
    private authenticateRequest;
    private validateRequest;
    private sendResponse;
    private sendError;
    private getSLADefinitions;
    private getSLADefinition;
    private updateSLADefinition;
    private generateSLAId;
    start(): Promise<void>;
    shutdown(): Promise<void>;
}
declare global {
    namespace Express {
        interface Request {
            requestId: string;
            startTime: number;
            user?: {
                id: string;
                role: string;
            };
        }
    }
}
