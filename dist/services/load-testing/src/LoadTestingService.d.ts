import express from 'express';
import { EventEmitter } from 'events';
export interface LoadTestingServiceConfig {
    redis: {
        host: string;
        port: number;
        password?: string;
        db: number;
    };
    defaultTestSettings: {
        maxConcurrentTests: number;
        defaultDuration: number;
        maxDuration: number;
        retentionDays: number;
    };
    scheduling: {
        enableScheduledTests: boolean;
        cleanupSchedule: string;
    };
    notifications: {
        enabled: boolean;
        webhookUrl?: string;
        slackChannel?: string;
    };
}
export declare class LoadTestingService extends EventEmitter {
    private config;
    private app;
    private executor;
    private capacityService;
    private redis;
    private scheduledTests;
    private benchmarkResults;
    constructor(config: LoadTestingServiceConfig);
    private initializeServices;
    private setupEventHandlers;
    private setupMiddleware;
    private setupRoutes;
    private setupCronJobs;
    private validateTestConfig;
    private storeTestMetadata;
    private storeTestResults;
    private updateTestProgress;
    private getStoredTestResult;
    private storeCapacityPlan;
    private listTests;
    private scheduleTest;
    private executeBenchmark;
    private compareBenchmarkResults;
    private extractMetricValue;
    private evaluateBenchmarkPassing;
    private generateBenchmarkSummary;
    private sendNotification;
    private cleanupOldTests;
    private getSystemStats;
    private getHealthStatus;
    private getTestTemplates;
    start(port?: number): void;
    shutdown(): Promise<void>;
    getApp(): express.Application;
}
