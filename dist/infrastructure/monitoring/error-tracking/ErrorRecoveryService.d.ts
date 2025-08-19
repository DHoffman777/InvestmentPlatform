import { EventEmitter } from 'events';
import { PrismaClient } from '@prisma/client';
import { StructuredError, ErrorCategory } from './ErrorTrackingService';
import { RootCauseAnalysis } from './ErrorCorrelationService';
export interface RecoveryStrategy {
    id: string;
    name: string;
    description: string;
    category: ErrorCategory;
    applicableConditions: RecoveryCondition[];
    steps: RecoveryStep[];
    automaticExecution: boolean;
    requiredPermissions: string[];
    estimatedTime: number;
    riskLevel: 'low' | 'medium' | 'high';
    successRate: number;
    prerequisites: string[];
}
export interface RecoveryCondition {
    field: string;
    operator: 'equals' | 'contains' | 'matches' | 'in' | 'gt' | 'lt';
    value: any;
    weight: number;
}
export interface RecoveryStep {
    id: string;
    name: string;
    description: string;
    type: RecoveryStepType;
    parameters: Record<string, any>;
    timeout: number;
    retryable: boolean;
    maxRetries: number;
    rollbackRequired: boolean;
    validationChecks: ValidationType[];
}
export declare enum RecoveryStepType {
    RESTART_SERVICE = "restart_service",
    CLEAR_CACHE = "clear_cache",
    RESET_CONNECTION = "reset_connection",
    SCALE_RESOURCES = "scale_resources",
    ROLLBACK_DEPLOYMENT = "rollback_deployment",
    EXECUTE_SCRIPT = "execute_script",
    SEND_NOTIFICATION = "send_notification",
    UPDATE_CONFIG = "update_config",
    MANUAL_INTERVENTION = "manual_intervention",
    HEALTH_CHECK = "health_check"
}
export declare enum ValidationType {
    HEALTH_CHECK = "health_check",
    PERFORMANCE_TEST = "performance_test",
    CONNECTIVITY_TEST = "connectivity_test",
    DATA_INTEGRITY = "data_integrity",
    USER_ACCEPTANCE = "user_acceptance"
}
export interface RecoveryExecution {
    id: string;
    errorId: string;
    strategyId: string;
    initiatedBy: string;
    startTime: Date;
    endTime?: Date;
    status: RecoveryStatus;
    currentStep?: number;
    steps: RecoveryStepExecution[];
    results: RecoveryResult;
    logs: RecoveryLog[];
    rollbackExecuted: boolean;
}
export declare enum RecoveryStatus {
    PENDING = "pending",
    IN_PROGRESS = "in_progress",
    COMPLETED = "completed",
    FAILED = "failed",
    ROLLED_BACK = "rolled_back",
    CANCELLED = "cancelled"
}
export interface RecoveryStepExecution {
    stepId: string;
    startTime: Date;
    endTime?: Date;
    status: RecoveryStatus;
    attempts: number;
    output?: string;
    error?: string;
    rollbackPerformed: boolean;
}
export interface RecoveryResult {
    success: boolean;
    stepsCompleted: number;
    totalSteps: number;
    timeTaken: number;
    errorResolved: boolean;
    sideEffects: string[];
    recommendations: string[];
    followUpActions: string[];
}
export interface RecoveryLog {
    timestamp: Date;
    level: 'info' | 'warn' | 'error' | 'debug';
    message: string;
    stepId?: string;
    metadata?: Record<string, any>;
}
export interface AutoRecoveryConfig {
    enabled: boolean;
    maxConcurrentRecoveries: number;
    cooldownPeriod: number;
    blacklistedServices: string[];
    requiredApprovals: {
        highRisk: boolean;
        productionEnvironment: boolean;
        criticalServices: string[];
    };
}
export interface RecoverySuggestion {
    strategyId: string;
    confidence: number;
    reasoning: string;
    estimatedImpact: 'low' | 'medium' | 'high';
    automationRecommended: boolean;
    prerequisites: string[];
    alternatives: string[];
}
export declare class ErrorRecoveryService extends EventEmitter {
    private logger;
    private prisma;
    private recoveryStrategies;
    private activeRecoveries;
    private autoRecoveryConfig;
    private executionQueue;
    private isProcessing;
    constructor(prisma: PrismaClient, autoRecoveryConfig: AutoRecoveryConfig);
    private createLogger;
    private initializeDefaultStrategies;
    suggestRecoveryStrategies(error: StructuredError, rootCauseAnalysis?: RootCauseAnalysis): Promise<RecoverySuggestion[]>;
    private calculateStrategyConfidence;
    private conditionMatches;
    private getFieldValue;
    private calculateRootCauseAlignment;
    private getStrategyCauses;
    private generateReasoning;
    private estimateImpact;
    private shouldAutomate;
    private findAlternativeStrategies;
    executeRecoveryStrategy(errorId: string, strategyId: string, initiatedBy: string, autoExecution?: boolean): Promise<RecoveryExecution>;
    private processRecoveryQueue;
    private executeRecovery;
    private executeRecoveryStep;
    private executeStepAction;
    private replaceTemplateVariables;
    private executeHealthCheck;
    private executeServiceRestart;
    private executeCacheClear;
    private executeConnectionReset;
    private executeResourceScaling;
    private executeScript;
    private executeSendNotification;
    private executeConfigUpdate;
    private executeManualIntervention;
    private checkErrorResolution;
    private generateRecommendations;
    private generateFollowUpActions;
    private getError;
    private storeRecoveryExecution;
    private updateRecoveryExecution;
    private addLog;
    private sleep;
    private generateExecutionId;
    private startRecoveryProcessor;
    private cleanupCompletedRecoveries;
    addRecoveryStrategy(strategy: RecoveryStrategy): void;
    getRecoveryStrategies(): RecoveryStrategy[];
    getActiveRecoveries(): RecoveryExecution[];
    getRecoveryHistory(errorId?: string): Promise<RecoveryExecution[]>;
    cancelRecovery(executionId: string, cancelledBy: string): Promise<boolean>;
    shutdown(): Promise<void>;
}
