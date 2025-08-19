import { EventEmitter } from 'events';
export interface DatabaseHealth {
    timestamp: Date;
    connectionPool: {
        active: number;
        idle: number;
        total: number;
        waiting: number;
    };
    performance: {
        avgQueryTime: number;
        slowQueries: number;
        queriesPerSecond: number;
        cacheHitRatio: number;
    };
    resources: {
        cpuUsage: number;
        memoryUsage: number;
        diskUsage: number;
        ioWait: number;
    };
    locks: {
        activeLocks: number;
        waitingQueries: number;
        deadlocks: number;
    };
    replication: {
        lagBehindMaster: number;
        replicationHealth: 'HEALTHY' | 'WARNING' | 'CRITICAL';
    };
    overallHealth: 'HEALTHY' | 'WARNING' | 'CRITICAL';
}
export interface AlertRule {
    id: string;
    name: string;
    metric: keyof DatabaseHealth | string;
    operator: '>' | '<' | '=' | '!=' | '>=' | '<=';
    threshold: number;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    duration: number;
    enabled: boolean;
    notificationChannels: string[];
}
export interface PerformanceAlert {
    id: string;
    ruleId: string;
    ruleName: string;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    metric: string;
    currentValue: number;
    threshold: number;
    message: string;
    triggeredAt: Date;
    acknowledgedAt?: Date;
    resolvedAt?: Date;
    actionsTaken: string[];
}
export interface DatabaseStatistics {
    tableStats: {
        tableName: string;
        rowCount: number;
        tableSize: string;
        indexSize: string;
        totalSize: string;
        sequentialScans: number;
        indexScans: number;
        tuplesInserted: number;
        tuplesUpdated: number;
        tuplesDeleted: number;
        lastVacuum?: Date;
        lastAnalyze?: Date;
    }[];
    indexStats: {
        tableName: string;
        indexName: string;
        indexSize: string;
        indexScans: number;
        tuplesRead: number;
        tuplesFetched: number;
        efficiency: number;
    }[];
    connectionStats: {
        totalConnections: number;
        activeConnections: number;
        idleConnections: number;
        idleInTransaction: number;
        maxConnections: number;
    };
    queryStats: {
        totalQueries: number;
        avgQueryTime: number;
        slowestQueries: Array<{
            query: string;
            calls: number;
            totalTime: number;
            avgTime: number;
        }>;
    };
}
export declare class DatabaseMonitor extends EventEmitter {
    private prisma;
    private monitoringInterval;
    private alertRules;
    private activeAlerts;
    private healthHistory;
    private readonly maxHistorySize;
    constructor();
    private initializeDefaultAlertRules;
    startMonitoring(intervalMs?: number): void;
    stopMonitoring(): void;
    private collectHealthMetrics;
    private getConnectionPoolStats;
    private getPerformanceStats;
    private getResourceStats;
    private getLockStats;
    private getReplicationStats;
    private calculateOverallHealth;
    private checkAlertRules;
    private getMetricValue;
    private evaluateCondition;
    private triggerAlert;
    private resolveAlert;
    private takeAutomatedActions;
    getDetailedStatistics(): Promise<DatabaseStatistics>;
    private getTableStatistics;
    private getIndexStatistics;
    private getConnectionStatistics;
    private getQueryStatistics;
    getHealthHistory(hours?: number): DatabaseHealth[];
    getActiveAlerts(): PerformanceAlert[];
    acknowledgeAlert(alertId: string): boolean;
    addAlertRule(rule: AlertRule): void;
    removeAlertRule(ruleId: string): boolean;
    disconnect(): Promise<void>;
}
