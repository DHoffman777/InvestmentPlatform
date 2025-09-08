/**
 * Investment Platform Log Aggregation and Analysis System
 * Comprehensive log collection, aggregation, and analysis for financial services
 */
export class LogAggregator extends EventEmitter<[never]> {
    constructor();
    logs: Map<any, any>;
    indices: Map<any, any>;
    metrics: {
        totalLogs: number;
        errorLogs: number;
        warningLogs: number;
        infoLogs: number;
        debugLogs: number;
        logsSizeBytes: number;
        logsPerSecond: number;
        sources: Map<any, any>;
        patterns: Map<any, any>;
    };
    config: {
        retention: {
            maxLogs: number;
            maxAge: number;
            compressionAge: number;
            cleanupInterval: number;
        };
        parsing: {
            structured: boolean;
            timestampFormats: string[];
            logLevels: string[];
            maxLineLength: number;
        };
        analysis: {
            errorPatterns: RegExp[];
            securityPatterns: RegExp[];
            performancePatterns: RegExp[];
            businessPatterns: RegExp[];
        };
        storage: {
            directory: string;
            compression: boolean;
            indexing: boolean;
            sharding: boolean;
        };
        streaming: {
            enabled: boolean;
            batchSize: number;
            flushInterval: number;
        };
        alerts: {
            errorThreshold: number;
            errorTimeWindow: number;
            securityAlertEnabled: boolean;
            performanceAlertEnabled: boolean;
        };
    };
    buffer: any[];
    cleanupTimer: NodeJS.Timeout;
    flushTimer: NodeJS.Timeout;
    alertCounts: Map<any, any>;
    initializeLogAggregator(): void;
    initializeStorage(): Promise<void>;
    initializeIndices(): void;
    ingest(logData: any): string;
    parseLogEntry(logData: any): {
        timestamp: any;
        level: any;
        message: any;
        source: any;
        traceId: any;
        userId: any;
        requestId: any;
    };
    parseUnstructuredLog(logLine: any): {
        raw: any;
    };
    parseTimestamp(timestampStr: any): number;
    normalizeLogLevel(level: any): any;
    updateMetrics(log: any): void;
    updateIndices(logId: any, log: any): void;
    addToIndex(indexName: any, key: any, logId: any): void;
    analyzeLog(log: any): void;
    matchesPatterns(message: any, patterns: any): any;
    incrementPatternCount(patternType: any): void;
    checkAlerts(log: any): void;
    search(query: any): any[];
    canUseIndex(options: any): any;
    searchWithIndex(options: any): any[];
    matchesQuery(log: any, options: any): boolean;
    getLogsByTraceId(traceId: any): any[];
    getRecentLogs(count?: number, level?: any): any[];
    getStats(): {
        timestamp: number;
        total: {
            logs: number;
            errors: number;
            warnings: number;
            info: number;
            debug: number;
            sizeBytes: number;
        };
        recent: {
            logs: number;
            errors: number;
            warnings: number;
            logsPerSecond: number;
        };
        sources: any;
        patterns: any;
        memory: {
            logsInMemory: number;
            indicesCount: number;
            bufferSize: number;
        };
    };
    calculateLogsPerSecond(): number;
    generateLogId(): string;
    startStreaming(): void;
    flushBuffer(): Promise<void>;
    persistLogs(logs: any): Promise<void>;
    startCleanupTimer(): void;
    cleanupOldLogs(): void;
    cleanupIndices(cutoff: any): void;
    cleanupAlertCounts(): void;
    exportLogs(options?: {}): Promise<string>;
    convertToCSV(logs: any): string;
    generateReport(): Promise<string>;
    shutdown(): void;
}
export function createLogMiddleware(aggregator: any): (req: any, res: any, next: any) => void;
import { EventEmitter } from "events";
