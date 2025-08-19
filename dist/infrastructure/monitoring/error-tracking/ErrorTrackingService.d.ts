import { EventEmitter } from 'events';
import { PrismaClient } from '@prisma/client';
export interface ErrorMetadata {
    userId?: string;
    sessionId?: string;
    requestId?: string;
    userAgent?: string;
    ipAddress?: string;
    endpoint?: string;
    method?: string;
    statusCode?: number;
    responseTime?: number;
    memoryUsage?: NodeJS.MemoryUsage;
    customData?: Record<string, any>;
}
export interface ErrorContext {
    service: string;
    version: string;
    environment: string;
    timestamp: Date;
    traceId?: string;
    spanId?: string;
    parentSpanId?: string;
}
export interface StructuredError {
    id: string;
    fingerprint: string;
    message: string;
    category: ErrorCategory;
    severity: ErrorSeverity;
    errorType: string;
    stack?: string;
    context: ErrorContext;
    metadata: ErrorMetadata;
    count: number;
    firstSeen: Date;
    lastSeen: Date;
    resolved: boolean;
    resolvedAt?: Date;
    resolvedBy?: string;
    tags: string[];
    affectedUsers: string[];
    relatedErrors: string[];
}
export declare enum ErrorCategory {
    AUTHENTICATION = "authentication",
    AUTHORIZATION = "authorization",
    VALIDATION = "validation",
    DATABASE = "database",
    EXTERNAL_API = "external_api",
    NETWORK = "network",
    PERFORMANCE = "performance",
    BUSINESS_LOGIC = "business_logic",
    SYSTEM = "system",
    SECURITY = "security",
    COMPLIANCE = "compliance",
    TRADING = "trading",
    PORTFOLIO = "portfolio",
    MARKET_DATA = "market_data",
    SETTLEMENT = "settlement",
    UNKNOWN = "unknown"
}
export declare enum ErrorSeverity {
    CRITICAL = "critical",// System down, data corruption, security breach
    HIGH = "high",// Major functionality broken, significant user impact
    MEDIUM = "medium",// Feature broken, moderate user impact
    LOW = "low",// Minor issues, minimal user impact
    INFO = "info"
}
export interface ErrorPattern {
    id: string;
    name: string;
    description: string;
    pattern: RegExp;
    category: ErrorCategory;
    severity: ErrorSeverity;
    tags: string[];
    recoveryActions: string[];
}
export interface ErrorAggregation {
    fingerprint: string;
    count: number;
    affectedUsers: number;
    firstSeen: Date;
    lastSeen: Date;
    trend: 'increasing' | 'decreasing' | 'stable';
    hourlyDistribution: number[];
    topAffectedEndpoints: Array<{
        endpoint: string;
        count: number;
    }>;
    topAffectedUsers: Array<{
        userId: string;
        count: number;
    }>;
}
export declare class ErrorTrackingService extends EventEmitter {
    private logger;
    private prisma;
    private errorPatterns;
    private aggregationCache;
    private readonly maxStackFrames;
    private readonly aggregationWindow;
    constructor(prisma: PrismaClient);
    private createStructuredLogger;
    private initializeErrorPatterns;
    captureError(error: Error, context: ErrorContext, metadata?: ErrorMetadata): Promise<StructuredError>;
    private generateFingerprint;
    private extractStackSignature;
    private categorizeError;
    private assessSeverity;
    private matchErrorPattern;
    private cleanStack;
    private generateErrorId;
    private storeError;
    private updateAggregation;
    private startAggregationUpdater;
    private processAggregations;
    getErrorById(errorId: string): Promise<StructuredError | null>;
    getErrorsByFingerprint(fingerprint: string): Promise<StructuredError[]>;
    getRecentErrors(limit?: number, severity?: ErrorSeverity, category?: ErrorCategory): Promise<StructuredError[]>;
    resolveError(errorId: string, resolvedBy: string, resolution?: string): Promise<boolean>;
    getErrorStatistics(timeRange?: string): Promise<any>;
    private parseTimeRange;
    private groupBy;
    addErrorPattern(pattern: ErrorPattern): void;
    removeErrorPattern(patternId: string): boolean;
    getErrorPatterns(): ErrorPattern[];
    shutdown(): Promise<void>;
}
