import { EventEmitter } from 'events';
export interface CounterpartyProfile {
    id: string;
    name: string;
    legalEntityIdentifier: string;
    creditRating: string;
    ratingAgency: string;
    probabilityOfDefault: number;
    exposureAtDefault: number;
    lossGivenDefault: number;
    recoveryRate: number;
    industry: string;
    country: string;
    establishedDate: Date;
    totalAssets: number;
    netWorth: number;
    annualRevenue: number;
    lastFinancialUpdate: Date;
    regulatoryStatus: 'ACTIVE' | 'SUSPENDED' | 'RESTRICTED' | 'INACTIVE';
    kycStatus: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED';
    sanctions: boolean;
    blacklisted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface ExposureLimit {
    counterpartyId: string;
    limitType: 'GROSS' | 'NET' | 'SETTLEMENT' | 'CREDIT' | 'CONCENTRATION';
    limitAmount: number;
    currency: string;
    utilizationAmount: number;
    utilizationPercentage: number;
    threshold: number;
    warningLevel: number;
    expiryDate: Date;
    reviewDate: Date;
    approvedBy: string;
    status: 'ACTIVE' | 'SUSPENDED' | 'EXPIRED';
}
export interface RiskScoreComponents {
    creditScore: number;
    financialStrengthScore: number;
    operationalRiskScore: number;
    concentrationRiskScore: number;
    geopoliticalRiskScore: number;
    industryRiskScore: number;
    historicalPerformanceScore: number;
    compositeScore: number;
}
export interface CounterpartyRiskMetrics {
    counterpartyId: string;
    riskScoreComponents: RiskScoreComponents;
    riskTier: 'MINIMAL' | 'LOW' | 'MODERATE' | 'HIGH' | 'SEVERE';
    maxExposureRecommendation: number;
    recommendedLimits: {
        dailyLimit: number;
        weeklyLimit: number;
        monthlyLimit: number;
    };
    riskFactors: string[];
    mitigationRequirements: string[];
    nextReviewDate: Date;
    lastAssessmentDate: Date;
}
export interface CreditEvent {
    id: string;
    counterpartyId: string;
    eventType: 'RATING_DOWNGRADE' | 'RATING_UPGRADE' | 'DEFAULT' | 'BANKRUPTCY' | 'RESTRUCTURING' | 'MERGER' | 'ACQUISITION';
    eventDate: Date;
    description: string;
    impact: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    sourceAgency: string;
    verified: boolean;
    processedAt: Date;
}
export interface ConcentrationAnalysis {
    counterpartyId: string;
    totalExposure: number;
    concentrationPercentage: number;
    riskAdjustedExposure: number;
    diversificationBenefit: number;
    concentrationRisk: number;
    recommendations: string[];
    calculatedAt: Date;
}
export declare class CounterpartyRiskAssessmentService extends EventEmitter {
    private counterpartyProfiles;
    private exposureLimits;
    private riskMetrics;
    private creditEvents;
    private concentrationAnalyses;
    private readonly INDUSTRY_RISK_WEIGHTS;
    private readonly COUNTRY_RISK_WEIGHTS;
    constructor();
    createCounterpartyProfile(profileData: Omit<CounterpartyProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<CounterpartyProfile>;
    updateCounterpartyProfile(counterpartyId: string, updates: Partial<CounterpartyProfile>): Promise<CounterpartyProfile>;
    performRiskAssessment(counterpartyId: string): Promise<CounterpartyRiskMetrics>;
    private calculateRiskScoreComponents;
    private calculateCreditScore;
    private calculateFinancialStrengthScore;
    private calculateOperationalRiskScore;
    private calculateConcentrationRiskScore;
    private calculateGeopoliticalRiskScore;
    private calculateIndustryRiskScore;
    private calculateHistoricalPerformanceScore;
    private determineRiskTier;
    private calculateMaxExposureRecommendation;
    private calculateRecommendedLimits;
    private identifyRiskFactors;
    private generateMitigationRequirements;
    private calculateNextReviewDate;
    addExposureLimit(counterpartyId: string, limitData: Omit<ExposureLimit, 'utilizationAmount' | 'utilizationPercentage'>): Promise<ExposureLimit>;
    recordCreditEvent(counterpartyId: string, eventData: Omit<CreditEvent, 'id' | 'processedAt'>): Promise<CreditEvent>;
    performConcentrationAnalysis(counterpartyId: string, totalPortfolioValue: number): Promise<ConcentrationAnalysis>;
    getCounterpartyProfile(counterpartyId: string): CounterpartyProfile | undefined;
    getRiskMetrics(counterpartyId: string): CounterpartyRiskMetrics | undefined;
    getExposureLimits(counterpartyId: string): ExposureLimit[];
    getCreditEvents(counterpartyId: string): CreditEvent[];
    getConcentrationAnalysis(counterpartyId: string): ConcentrationAnalysis | undefined;
    getAllCounterparties(): CounterpartyProfile[];
    getHighRiskCounterparties(): CounterpartyRiskMetrics[];
    getCounterpartiesDueForReview(): CounterpartyRiskMetrics[];
    generateRiskSummaryReport(): {
        totalCounterparties: number;
        riskTierDistribution: {
            [key: string]: number;
        };
        averageCompositeScore: number;
        highRiskCount: number;
        dueForReviewCount: number;
    };
}
