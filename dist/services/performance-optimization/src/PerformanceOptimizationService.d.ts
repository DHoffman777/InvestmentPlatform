import express from 'express';
export interface PerformanceOptimizationConfig {
    redis: {
        host: string;
        port: number;
        password?: string;
        db: number;
        keyPrefix: string;
    };
    monitoring: {
        enabled: boolean;
        interval: number;
        alertThresholds: {
            slowQuery: number;
            highErrorRate: number;
            lowCacheHitRate: number;
        };
    };
    optimization: {
        autoOptimize: boolean;
        maxConcurrentOptimizations: number;
        backupBeforeOptimization: boolean;
    };
    reporting: {
        generateDaily: boolean;
        generateWeekly: boolean;
        retentionDays: number;
    };
}
export declare class PerformanceOptimizationService {
    private app;
    private dbOptimizer;
    private queryAnalyzer;
    private dbMonitor;
    private apiOptimizer;
    private cachingStrategy;
    private config;
    constructor(config: PerformanceOptimizationConfig);
    private initializeServices;
    private setupEventHandlers;
    private considerAutoOptimization;
    private setupMiddleware;
    private setupRoutes;
    private generateComprehensiveRecommendations;
    private setupCronJobs;
    private generateDailyReport;
    private generateWeeklyReport;
    private generateTrendAnalysis;
    startMonitoring(): Promise<void>;
    stopMonitoring(): Promise<void>;
    start(port?: number): void;
    shutdown(): Promise<void>;
    getApp(): express.Application;
}
