import { EventEmitter } from 'events';
import { FinancialServicesConfig } from './types';
export declare class FinancialServicesComplianceService extends EventEmitter {
    private config;
    private app;
    private redis;
    private complianceMonitoring;
    private regulatoryFiling;
    constructor(config: FinancialServicesConfig);
    private setupMiddleware;
    private setupRoutes;
    private setupEventHandlers;
    private getViolations;
    private getViolation;
    private getClientSuitabilityAssessments;
    private getClientAMLChecks;
    private generateComplianceReport;
    private generateReportId;
    start(): Promise<void>;
    cleanup(): Promise<void>;
}
