import { EventEmitter } from 'events';
export interface QueryPerformanceMetrics {
    queryId: string;
    sqlQuery: string;
    executionTime: number;
    rowsReturned: number;
    rowsExamined: number;
    tableName: string;
    operationType: 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE';
    timestamp: Date;
    indexesUsed: string[];
    queryPlan?: any;
    connectionInfo: {
        poolSize: number;
        activeConnections: number;
        idleConnections: number;
    };
}
export interface OptimizationRecommendation {
    id: string;
    queryId: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    type: 'INDEX' | 'QUERY_REWRITE' | 'SCHEMA_CHANGE' | 'CONFIGURATION';
    title: string;
    description: string;
    suggestedSolution: string;
    estimatedImpact: {
        performanceGain: number;
        confidenceLevel: number;
    };
    implementation: {
        effort: 'LOW' | 'MEDIUM' | 'HIGH';
        riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
        sqlCommands?: string[];
    };
    createdAt: Date;
}
export interface IndexAnalysis {
    tableName: string;
    indexName: string;
    columns: string[];
    isUnique: boolean;
    usage: {
        totalQueries: number;
        averageSelectivity: number;
        maintenanceCost: number;
    };
    recommendations: {
        action: 'KEEP' | 'DROP' | 'MODIFY' | 'ADD';
        reason: string;
        impact: string;
    };
}
export interface SlowQueryAnalysis {
    queryPattern: string;
    occurrences: number;
    averageExecutionTime: number;
    maxExecutionTime: number;
    totalExecutionTime: number;
    affectedTables: string[];
    commonFilters: string[];
    suggestedOptimizations: string[];
}
export declare class DatabaseOptimizer extends EventEmitter {
    private prisma;
    private performanceMetrics;
    private optimizationHistory;
    constructor();
    private setupQueryMonitoring;
    private captureQueryMetrics;
    private generateQueryId;
    private analyzeQuery;
    private getConnectionPoolInfo;
    private getExplainPlan;
    private extractRowsExamined;
    private extractIndexesUsed;
    private traversePlan;
    analyzeSlowQueries(timeWindow?: number): Promise<SlowQueryAnalysis[]>;
    private normalizeQueryPattern;
    private extractCommonFilters;
    private generateOptimizationSuggestions;
    private hasFullTableScan;
    private analyzeSlowQuery;
    private generateRecommendations;
    analyzeIndexUsage(): Promise<IndexAnalysis[]>;
    private calculateSelectivity;
    private estimateMaintenanceCost;
    private analyzeIndexRecommendations;
    generateOptimizationReport(): Promise<{
        summary: {
            totalQueries: number;
            slowQueries: number;
            averageExecutionTime: number;
            optimizationOpportunities: number;
        };
        slowQueries: SlowQueryAnalysis[];
        indexAnalysis: IndexAnalysis[];
        recommendations: OptimizationRecommendation[];
    }>;
    disconnect(): Promise<void>;
}
