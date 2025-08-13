import express from 'express';
import { EventEmitter } from 'events';
import { AutoScalingServiceConfig, FinancialServicesScalingProfile } from './types';
export declare class AutoScalingService extends EventEmitter {
    private config;
    private financialProfile?;
    private app;
    private metricsCollector;
    private decisionEngine;
    private scalingExecutor;
    private redis;
    private evaluationInterval?;
    private reportingSchedule?;
    private isRunning;
    constructor(config: AutoScalingServiceConfig, financialProfile?: FinancialServicesScalingProfile | undefined);
    private initializeServices;
    private setupEventHandlers;
    private evaluateScalingDecision;
    private setupMiddleware;
    private setupRoutes;
    private getHealthStatus;
    private getScalingStatus;
    private storeScalingDecision;
    private storeScalingEvent;
    private sendAlert;
    private generateScalingReport;
    private updateConfiguration;
    start(port?: number): Promise<void>;
    stop(): Promise<void>;
    getApp(): express.Application;
}
//# sourceMappingURL=AutoScalingService.d.ts.map