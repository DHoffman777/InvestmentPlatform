import { EventEmitter } from 'events';
import { PrismaClient } from '@prisma/client';
import { StructuredError, ErrorCategory } from './ErrorTrackingService';
export interface CorrelationRule {
    id: string;
    name: string;
    description: string;
    type: CorrelationType;
    conditions: CorrelationCondition[];
    timeWindow: number;
    confidence: number;
    enabled: boolean;
    actions: CorrelationAction[];
}
export declare enum CorrelationType {
    TEMPORAL = "temporal",// Errors occurring close in time
    CAUSAL = "causal",// One error likely caused by another
    CONTEXTUAL = "contextual",// Errors in same context (service, user, etc.)
    PATTERN = "pattern",// Matching error patterns
    CASCADE = "cascade"
}
export interface CorrelationCondition {
    field: string;
    operator: 'equals' | 'contains' | 'matches' | 'in' | 'exists';
    value: any;
    weight: number;
}
export interface CorrelationAction {
    type: 'merge' | 'link' | 'escalate' | 'notify' | 'suggest_fix';
    parameters: Record<string, any>;
}
export interface ErrorCorrelation {
    id: string;
    primaryErrorId: string;
    relatedErrorIds: string[];
    correlationType: CorrelationType;
    confidence: number;
    strength: number;
    createdAt: Date;
    updatedAt: Date;
    metadata: {
        commonAttributes: Record<string, any>;
        timeDifference?: number;
        rootCause?: string;
        impactAssessment?: string;
    };
}
export interface RootCauseAnalysis {
    errorId: string;
    possibleCauses: PossibleCause[];
    investigationSteps: InvestigationStep[];
    relatedErrors: string[];
    systemContext: SystemContext;
    analysis: {
        rootCauseConfidence: number;
        impactAssessment: string;
        resolutionComplexity: 'low' | 'medium' | 'high';
        estimatedResolutionTime: number;
    };
}
export interface PossibleCause {
    cause: string;
    probability: number;
    evidence: string[];
    category: 'technical' | 'business' | 'external' | 'user';
    investigationRequired: boolean;
}
export interface InvestigationStep {
    step: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    estimatedTime: number;
    tools: string[];
    expectedOutcome: string;
}
export interface SystemContext {
    service: string;
    version: string;
    environment: string;
    deploymentTime?: Date;
    recentChanges: Change[];
    systemHealth: {
        cpuUsage: number;
        memoryUsage: number;
        diskUsage: number;
        networkLatency: number;
    };
    dependencies: ServiceDependency[];
}
export interface Change {
    type: 'deployment' | 'config' | 'infrastructure' | 'data';
    timestamp: Date;
    description: string;
    author: string;
    impact: 'high' | 'medium' | 'low';
}
export interface ServiceDependency {
    service: string;
    status: 'healthy' | 'degraded' | 'down';
    responseTime: number;
    errorRate: number;
    lastCheck: Date;
}
export interface CorrelationPattern {
    id: string;
    name: string;
    pattern: RegExp;
    category: ErrorCategory;
    indicatedCauses: string[];
    confidence: number;
    examples: string[];
}
export declare class ErrorCorrelationService extends EventEmitter {
    private logger;
    private prisma;
    private correlationRules;
    private correlationPatterns;
    private correlationCache;
    private readonly cacheTimeout;
    constructor(prisma: PrismaClient);
    private createLogger;
    private initializeDefaultRules;
    private initializeCorrelationPatterns;
    correlateError(error: StructuredError): Promise<ErrorCorrelation[]>;
    private findCorrelationByRule;
    private findRelatedErrors;
    private buildConditionClause;
    private calculateCorrelationConfidence;
    private conditionMatches;
    private getFieldValue;
    private calculateCorrelationStrength;
    private calculateTimeProximityFactor;
    private calculateContextSimilarity;
    private calculateCausalStrength;
    private calculateCascadeStrength;
    private calculatePatternMatchStrength;
    private extractCommonAttributes;
    private calculateTimeDifference;
    private suggestRootCause;
    private assessImpact;
    performRootCauseAnalysis(errorId: string): Promise<RootCauseAnalysis>;
    private getRelatedErrorsFromCorrelations;
    private analyzePossibleCauses;
    private categorizeCause;
    private analyzeCausesByCategory;
    private generateInvestigationSteps;
    private generateInvestigationStepForCause;
    private getSystemContext;
    private performAnalysis;
    private storeCorrelation;
    private startCorrelationProcessor;
    private processRecentErrors;
    private cleanupCache;
    private isCacheValid;
    private generateCorrelationId;
    addCorrelationRule(rule: CorrelationRule): void;
    addCorrelationPattern(pattern: CorrelationPattern): void;
    getCorrelationRules(): CorrelationRule[];
    getCorrelationPatterns(): CorrelationPattern[];
    getCorrelationsForError(errorId: string): Promise<ErrorCorrelation[]>;
    shutdown(): Promise<any>;
}
