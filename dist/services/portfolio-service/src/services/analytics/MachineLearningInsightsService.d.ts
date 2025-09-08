import { MachineLearningInsight, AnalyticsDataPoint } from '../../models/analytics/Analytics';
import { EventPublisher } from '../../utils/eventPublisher';
interface InsightGenerationRequest {
    tenantId: string;
    analysisType: MachineLearningInsight['type'];
    entities: {
        portfolios?: string[];
        positions?: string[];
        clients?: string[];
    };
    timeRange: {
        startDate: Date;
        endDate: Date;
    };
    minConfidence?: number;
    categories?: string[];
}
interface ClusterAnalysisResult {
    clusters: {
        id: string;
        name: string;
        centroid: Record<string, number>;
        members: string[];
        characteristics: string[];
        riskLevel: 'low' | 'medium' | 'high';
        expectedReturn: number;
        volatility: number;
    }[];
    silhouetteScore: number;
    optimalClusters: number;
}
interface PatternRecognitionResult {
    patterns: {
        id: string;
        name: string;
        description: string;
        frequency: number;
        confidence: number;
        impact: 'positive' | 'negative' | 'neutral';
        indicators: string[];
        historicalAccuracy: number;
    }[];
    trendAnalysis: {
        direction: 'bullish' | 'bearish' | 'sideways';
        strength: number;
        duration: number;
        breakoutProbability: number;
    };
}
interface OptimizationSuggestion {
    type: 'rebalancing' | 'position_sizing' | 'risk_reduction' | 'yield_enhancement' | 'tax_optimization';
    priority: 'low' | 'medium' | 'high';
    expectedImpact: {
        return: number;
        risk: number;
        sharpeRatio: number;
    };
    implementation: {
        actions: string[];
        timeline: string;
        cost: number;
        complexity: 'low' | 'medium' | 'high';
    };
    constraints: string[];
}
interface PerformanceDriverAnalysis {
    drivers: {
        factor: string;
        contribution: number;
        significance: number;
        trend: 'increasing' | 'decreasing' | 'stable';
        category: 'macro' | 'sector' | 'security' | 'strategy';
    }[];
    attribution: {
        assetAllocation: number;
        securitySelection: number;
        interactionEffect: number;
        timing: number;
        currency: number;
    };
    riskDecomposition: {
        systematic: number;
        idiosyncratic: number;
        sectors: Record<string, number>;
        factors: Record<string, number>;
    };
}
export declare class MachineLearningInsightsService {
    private eventPublisher;
    private insights;
    private insightTemplates;
    constructor(eventPublisher?: EventPublisher);
    generateInsights(request: InsightGenerationRequest): Promise<MachineLearningInsight[]>;
    performClusterAnalysis(data: AnalyticsDataPoint[], features: string[], numClusters?: number): Promise<ClusterAnalysisResult>;
    recognizePatterns(data: AnalyticsDataPoint[], patternTypes?: string[]): Promise<PatternRecognitionResult>;
    generateOptimizationSuggestions(portfolioData: any, constraints?: string[], objective?: 'return' | 'risk' | 'sharpe'): Promise<OptimizationSuggestion[]>;
    analyzePerformanceDrivers(portfolioData: any, benchmarkData: any, timeRange: {
        startDate: Date;
        endDate: Date;
    }): Promise<PerformanceDriverAnalysis>;
    getInsightsByEntity(entityId: string, entityType: 'portfolio' | 'position' | 'client', categories?: string[], minConfidence?: number): Promise<MachineLearningInsight[]>;
    markInsightActionTaken(insightId: string, action: string, takenBy: string, outcome?: string): Promise<MachineLearningInsight>;
    private generateClusterAnalysisInsights;
    private generatePatternRecognitionInsights;
    private generateOptimizationInsights;
    private generateRiskAttributionInsights;
    private generatePerformanceDriverInsights;
    private extractFeatureMatrix;
    private findOptimalClusters;
    private performKMeansClustering;
    private analyzeClusterCharacteristics;
    private generateClusterCharacteristics;
    private calculateSilhouetteScore;
    private detectPattern;
    private analyzeTrend;
    private generateRebalancingSuggestion;
    private generateRiskReductionSuggestions;
    private generateYieldEnhancementSuggestions;
    private generateTaxOptimizationSuggestions;
    private filterAndRankOptimizations;
    private identifyPerformanceDrivers;
    private performAttributionAnalysis;
    private decomposeRisk;
    private initializeInsightTemplates;
}
export {};
