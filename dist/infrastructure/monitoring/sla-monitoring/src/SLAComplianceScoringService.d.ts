import { EventEmitter } from 'events';
import { SLAComplianceScore, SLAScoreBreakdown, SLAScoreTrend, SLAMetric, SLABreach, SLADefinition, SLASeverity } from './SLADataModel';
export interface ComplianceScoringConfig {
    scoringMethod: 'weighted' | 'geometric' | 'harmonic' | 'custom';
    weights: {
        availability: number;
        performance: number;
        reliability: number;
        penalties: number;
        breaches: number;
    };
    penalties: {
        breachPenalty: number;
        escalationMultiplier: number;
        durationFactor: number;
        severityMultipliers: Record<SLASeverity, number>;
    };
    bonuses: {
        perfectComplianceBonus: number;
        earlyResolutionBonus: number;
        proactiveActionBonus: number;
    };
    thresholds: {
        excellent: number;
        good: number;
        acceptable: number;
        poor: number;
    };
    trendAnalysis: {
        periods: number[];
        significance: number;
        volatilityWeight: number;
    };
}
export interface ScoringContext {
    slaDefinition: SLADefinition;
    timeWindow: {
        start: Date;
        end: Date;
    };
    metrics: SLAMetric[];
    breaches: SLABreach[];
    historicalScores: SLAComplianceScore[];
    businessContext: BusinessContext;
}
export interface BusinessContext {
    criticalityLevel: 'low' | 'medium' | 'high' | 'critical';
    businessHours: boolean;
    seasonalFactor: number;
    userImpact: number;
    revenueImpact: number;
    contractualRequirements: {
        minimumScore: number;
        penaltyThreshold: number;
        bonusThreshold: number;
    };
}
export interface ScoreComponent {
    name: string;
    weight: number;
    rawValue: number;
    normalizedValue: number;
    weightedValue: number;
    confidence: number;
    factors: string[];
}
export interface ComplianceGrade {
    score: number;
    grade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F';
    description: string;
    recommendations: string[];
}
export interface BenchmarkComparison {
    currentScore: number;
    industryAverage: number;
    industryBest: number;
    peerAverage: number;
    ranking: number;
    percentile: number;
}
export declare class SLAComplianceScoringService extends EventEmitter {
    private scores;
    private config;
    private scoringCache;
    private benchmarkData;
    constructor(config: ComplianceScoringConfig);
    calculateComplianceScore(context: ScoringContext): Promise<SLAComplianceScore>;
    calculateScoreComponents(context: ScoringContext): Promise<ScoreComponent[]>;
    calculateAvailabilityScore(context: ScoringContext): Promise<ScoreComponent>;
    calculatePerformanceScore(context: ScoringContext): Promise<ScoreComponent>;
    calculateReliabilityScore(context: ScoringContext): Promise<ScoreComponent>;
    calculateBreachImpactScore(context: ScoringContext): Promise<ScoreComponent>;
    calculateBusinessContextScore(context: ScoringContext): Promise<ScoreComponent>;
    calculateScoreBreakdown(components: ScoreComponent[]): SLAScoreBreakdown;
    calculateOverallScore(breakdown: SLAScoreBreakdown): number;
    calculateScoreTrends(context: ScoringContext): Promise<SLAScoreTrend[]>;
    generateScoreRecommendations(breakdown: SLAScoreBreakdown, trends: SLAScoreTrend[], context: ScoringContext): string[];
    getComplianceGrade(score: number): Promise<ComplianceGrade>;
    getBenchmarkComparison(slaId: string, score: number): Promise<BenchmarkComparison>;
    getHistoricalScores(slaId: string, timeRange: {
        start: Date;
        end: Date;
    }): Promise<SLAComplianceScore[]>;
    private getBusinessContextMultiplier;
    private calculateConfidence;
    private calculateTrendAdjustment;
    private createDefaultComponent;
    private generateCacheKey;
    private isCacheValid;
    shutdown(): Promise<any>;
}
