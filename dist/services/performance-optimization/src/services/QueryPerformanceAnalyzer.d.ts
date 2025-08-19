import { PrismaClient } from '@prisma/client';
export interface FinancialQueryPattern {
    id: string;
    name: string;
    description: string;
    sqlPattern: RegExp;
    optimizationStrategy: string;
    recommendedIndexes: string[];
    estimatedImpact: 'LOW' | 'MEDIUM' | 'HIGH';
}
export interface QueryOptimizationPlan {
    queryId: string;
    originalQuery: string;
    optimizedQuery: string;
    optimizationSteps: OptimizationStep[];
    estimatedPerformanceGain: number;
    implementationRisk: 'LOW' | 'MEDIUM' | 'HIGH';
    testingSuggestions: string[];
}
export interface OptimizationStep {
    step: number;
    type: 'INDEX_CREATION' | 'QUERY_REWRITE' | 'SCHEMA_CHANGE' | 'CONFIGURATION';
    description: string;
    sqlCommands: string[];
    expectedGain: number;
    dependencies?: string[];
}
export interface PerformanceBenchmark {
    queryType: string;
    tableSize: 'SMALL' | 'MEDIUM' | 'LARGE' | 'XLARGE';
    benchmarkResults: {
        baseline: number;
        optimized: number;
        improvement: number;
    };
    date: Date;
}
export declare class QueryPerformanceAnalyzer extends PrismaClient {
    private financialQueryPatterns;
    constructor();
    private initializeFinancialPatterns;
    analyzeQuery(query: string): {
        matchedPatterns: FinancialQueryPattern[];
        optimizationPlan: QueryOptimizationPlan | null;
    };
    private generateOptimizationPlan;
    private extractTableName;
    private extractColumns;
    private rewriteQuery;
    private optimizePerformanceCalculation;
    private optimizeValuationQuery;
    private optimizeRiskAggregation;
    private optimizeTransactionHistory;
    private optimizeComplianceQuery;
    private optimizeReportingQuery;
    private needsSchemaOptimization;
    private generateSchemaOptimizations;
    private assessImplementationRisk;
    private generateTestingSuggestions;
    benchmarkQuery(query: string, iterations?: number): Promise<{
        averageExecutionTime: number;
        minExecutionTime: number;
        maxExecutionTime: number;
        standardDeviation: number;
        executionPlan: any;
    }>;
    generateOptimizationReport(queries: string[]): Promise<{
        totalQueriesAnalyzed: number;
        patternsMatched: {
            [key: string]: number;
        };
        optimizationPlans: QueryOptimizationPlan[];
        estimatedTotalGain: number;
        implementationPriority: Array<{
            queryId: string;
            priority: number;
            reason: string;
        }>;
    }>;
    private calculatePriority;
    private getPriorityReason;
}
