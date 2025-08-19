import { Request, Response, NextFunction } from 'express';
import { EventEmitter } from 'events';
export interface ApiPerformanceMetrics {
    endpoint: string;
    method: string;
    responseTime: number;
    statusCode: number;
    requestSize: number;
    responseSize: number;
    timestamp: Date;
    userAgent?: string;
    clientId?: string;
    traceId?: string;
    databaseTime?: number;
    externalServiceTime?: number;
    processingTime?: number;
    memoryUsage?: number;
}
export interface EndpointAnalysis {
    endpoint: string;
    method: string;
    totalRequests: number;
    averageResponseTime: number;
    p50ResponseTime: number;
    p95ResponseTime: number;
    p99ResponseTime: number;
    errorRate: number;
    throughput: number;
    trends: {
        responseTimeChange: number;
        throughputChange: number;
        errorRateChange: number;
    };
    slowestRequests: ApiPerformanceMetrics[];
    optimization: {
        priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        recommendations: string[];
        estimatedImpact: number;
    };
}
export interface PerformanceOptimization {
    id: string;
    endpoint: string;
    type: 'CACHING' | 'COMPRESSION' | 'PAGINATION' | 'BATCHING' | 'ASYNC_PROCESSING' | 'DATABASE_OPTIMIZATION';
    title: string;
    description: string;
    implementation: string;
    estimatedGain: number;
    complexity: 'LOW' | 'MEDIUM' | 'HIGH';
    status: 'PENDING' | 'IN_PROGRESS' | 'IMPLEMENTED' | 'TESTED';
    createdAt: Date;
    implementedAt?: Date;
    beforeMetrics?: {
        avgResponseTime: number;
        p95ResponseTime: number;
        throughput: number;
    };
    afterMetrics?: {
        avgResponseTime: number;
        p95ResponseTime: number;
        throughput: number;
    };
}
export interface PerformanceAlert {
    id: string;
    endpoint: string;
    alertType: 'SLOW_RESPONSE' | 'HIGH_ERROR_RATE' | 'LOW_THROUGHPUT' | 'RESOURCE_EXHAUSTION';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
    currentValue: number;
    threshold: number;
    triggeredAt: Date;
    resolvedAt?: Date;
    recommendedActions: string[];
}
export declare class ApiPerformanceOptimizer extends EventEmitter {
    private metrics;
    private optimizations;
    private alerts;
    private readonly maxMetricsPerEndpoint;
    private readonly thresholds;
    constructor();
    metricsMiddleware(): (req: Request, res: Response, next: NextFunction) => void;
    private normalizeEndpoint;
    private recordMetrics;
    private checkForAlerts;
    private createAlert;
    private getRecommendedActions;
    analyzeEndpoint(endpoint: string, method: string, timeWindow?: number): EndpointAnalysis | null;
    private percentile;
    private calculateTrends;
    private generateOptimizationRecommendations;
    createOptimization(optimization: Omit<PerformanceOptimization, 'id' | 'createdAt' | 'status'>): string;
    updateOptimizationStatus(id: string, status: PerformanceOptimization['status'], metrics?: {
        avgResponseTime: number;
        p95ResponseTime: number;
        throughput: number;
    }): boolean;
    getOptimizationsByPriority(): PerformanceOptimization[];
    generatePerformanceReport(timeWindow?: number): {
        summary: {
            totalEndpoints: number;
            totalRequests: number;
            averageResponseTime: number;
            errorRate: number;
            slowestEndpoints: Array<{
                endpoint: string;
                avgResponseTime: number;
            }>;
        };
        endpointAnalyses: EndpointAnalysis[];
        activeAlerts: PerformanceAlert[];
        recommendedOptimizations: PerformanceOptimization[];
    };
    generateAutomaticOptimizations(): PerformanceOptimization[];
    private startPeriodicAnalysis;
    getMetricsForEndpoint(endpoint: string, method: string): ApiPerformanceMetrics[];
    clearMetrics(endpoint?: string, method?: string): void;
    getActiveAlerts(): PerformanceAlert[];
    resolveAlert(alertId: string): boolean;
}
