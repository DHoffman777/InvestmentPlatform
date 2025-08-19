import { EventEmitter } from 'events';
export interface SettlementPredictionInput {
    instructionId: string;
    counterpartyId: string;
    securityId: string;
    notionalAmount: number;
    currency: string;
    settlementDate: Date;
    tradeDate: Date;
    securityType: string;
    settlementMethod: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    marketConditions: MarketConditions;
    historicalContext: HistoricalContext;
}
export interface MarketConditions {
    volatilityIndex: number;
    liquidityIndex: number;
    creditSpreadIndex: number;
    marketStressLevel: 'NORMAL' | 'ELEVATED' | 'HIGH' | 'EXTREME';
    holidayAdjustments: boolean;
    systemLoad: number;
    timeOfDay: 'OPEN' | 'MID_DAY' | 'CLOSE' | 'AFTER_HOURS';
}
export interface HistoricalContext {
    counterpartySuccessRate: number;
    counterpartyAvgDelayDays: number;
    securityTypeSuccessRate: number;
    seasonalFactors: number;
    recentFailures: number;
    volumePattern: 'NORMAL' | 'HIGH' | 'LOW';
}
export interface PredictionResult {
    predictionId: string;
    instructionId: string;
    failureProbability: number;
    riskLevel: 'VERY_LOW' | 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
    expectedDelayDays: number;
    confidenceLevel: number;
    keyRiskFactors: RiskFactor[];
    mitigationSuggestions: MitigationSuggestion[];
    earlyWarningIndicators: EarlyWarningIndicator[];
    modelVersion: string;
    predictionTimestamp: Date;
    validUntil: Date;
}
export interface RiskFactor {
    factor: string;
    impact: number;
    weight: number;
    description: string;
    category: 'COUNTERPARTY' | 'SECURITY' | 'MARKET' | 'OPERATIONAL' | 'SYSTEMIC';
}
export interface MitigationSuggestion {
    id: string;
    suggestion: string;
    expectedImpact: number;
    implementationCost: 'LOW' | 'MEDIUM' | 'HIGH';
    timeToImplement: number;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    category: 'PREVENTION' | 'MONITORING' | 'RESPONSE' | 'RECOVERY';
}
export interface EarlyWarningIndicator {
    indicator: string;
    currentValue: number;
    threshold: number;
    status: 'NORMAL' | 'WARNING' | 'CRITICAL';
    trend: 'IMPROVING' | 'STABLE' | 'DETERIORATING';
    leadTime: number;
}
export interface FailurePredictionModel {
    modelId: string;
    modelName: string;
    version: string;
    algorithm: 'LOGISTIC_REGRESSION' | 'RANDOM_FOREST' | 'NEURAL_NETWORK' | 'ENSEMBLE';
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    lastTrainingDate: Date;
    trainingDataSize: number;
    featureImportance: Map<string, number>;
    isActive: boolean;
}
export interface PredictionPerformanceMetrics {
    modelVersion: string;
    evaluationPeriod: string;
    totalPredictions: number;
    correctPredictions: number;
    falsePositives: number;
    falseNegatives: number;
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    auc: number;
    calibrationScore: number;
}
export interface FailurePattern {
    patternId: string;
    patternName: string;
    description: string;
    frequency: number;
    avgImpact: number;
    conditions: PatternCondition[];
    detectionRules: string[];
    preventionMeasures: string[];
    identifiedCount: number;
    lastSeen: Date;
}
export interface PatternCondition {
    field: string;
    operator: 'EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'BETWEEN' | 'CONTAINS';
    value: any;
    weight: number;
}
export declare class SettlementFailurePredictionService extends EventEmitter {
    private predictionModels;
    private predictionHistory;
    private failurePatterns;
    private performanceMetrics;
    private activeModel;
    private readonly FEATURE_WEIGHTS;
    private readonly RISK_THRESHOLDS;
    constructor();
    private initializeDefaultModel;
    private initializeFailurePatterns;
    predictSettlementFailure(input: SettlementPredictionInput): Promise<PredictionResult>;
    private extractFeatures;
    private calculateBaseProbability;
    private logisticRegressionPredict;
    private randomForestPredict;
    private neuralNetworkPredict;
    private applyPatternAdjustments;
    private evaluatePattern;
    private determineRiskLevel;
    private calculateExpectedDelay;
    private calculateConfidenceLevel;
    private identifyKeyRiskFactors;
    private generateMitigationSuggestions;
    private createEarlyWarningIndicators;
    updatePredictionAccuracy(instructionId: string, actualOutcome: 'SUCCESS' | 'FAILURE', actualDelayDays?: number): Promise<void>;
    private updateModelPerformance;
    detectFailurePatterns(settlementHistory: any[]): FailurePattern[];
    getBatchPredictions(inputs: SettlementPredictionInput[]): Promise<PredictionResult[]>;
    getPredictionHistory(instructionId: string): PredictionResult[];
    getLatestPrediction(instructionId: string): PredictionResult | undefined;
    getHighRiskPredictions(threshold?: number): PredictionResult[];
    getModelPerformance(modelVersion?: string): PredictionPerformanceMetrics | undefined;
    getFailurePatterns(): FailurePattern[];
    addFailurePattern(pattern: Omit<FailurePattern, 'patternId' | 'identifiedCount' | 'lastSeen'>): FailurePattern;
    generatePredictionSummary(timeFrame?: 'DAILY' | 'WEEKLY' | 'MONTHLY'): {
        totalPredictions: number;
        highRiskCount: number;
        averageFailureProbability: number;
        mostCommonRiskFactors: {
            factor: string;
            count: number;
        }[];
        modelAccuracy: number;
    };
}
