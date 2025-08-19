import { Decimal } from '@prisma/client/runtime/library';
import { SuitabilityAssessment, SuitabilityAssessmentRequest, RiskTolerance } from '../../models/clientRelationship/ClientRelationship';
export interface RiskProfileQuestionnaire {
    id: string;
    clientId: string;
    questionnaireVersion: string;
    completedDate: Date;
    responses: QuestionResponse[];
    calculatedRiskScore: number;
    recommendedRiskTolerance: RiskTolerance;
    isValid: boolean;
    expirationDate: Date;
    completedBy: string;
}
export interface QuestionResponse {
    questionId: string;
    questionText: string;
    answerValue: number;
    answerText: string;
    weight: number;
    category: 'RISK_CAPACITY' | 'RISK_TOLERANCE' | 'INVESTMENT_KNOWLEDGE' | 'TIME_HORIZON' | 'LIQUIDITY';
}
export interface RiskAssessmentResult {
    clientId: string;
    overallRiskScore: number;
    riskTolerance: RiskTolerance;
    riskCapacity: 'LOW' | 'MODERATE' | 'HIGH';
    componentScores: {
        riskCapacity: number;
        riskTolerance: number;
        investmentKnowledge: number;
        timeHorizon: number;
        liquidity: number;
    };
    recommendations: RiskRecommendation[];
    warnings: RiskWarning[];
    nextReviewDate: Date;
}
export interface RiskRecommendation {
    type: 'ASSET_ALLOCATION' | 'INVESTMENT_STRATEGY' | 'RISK_ADJUSTMENT' | 'EDUCATION';
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    title: string;
    description: string;
    actionItems: string[];
    rationale: string;
}
export interface RiskWarning {
    type: 'MISMATCH' | 'CAPACITY_CONCERN' | 'EXPERIENCE_GAP' | 'REGULATORY';
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    title: string;
    description: string;
    requiredActions: string[];
    escalationRequired: boolean;
}
export interface SuitabilityReview {
    id: string;
    clientId: string;
    reviewDate: Date;
    reviewType: 'INITIAL' | 'PERIODIC' | 'TRIGGER_EVENT' | 'REGULATORY';
    triggerReason?: string;
    currentPortfolios: PortfolioSuitability[];
    overallSuitabilityScore: number;
    unsuitableHoldings: UnsuitableHolding[];
    requiredActions: SuitabilityAction[];
    reviewedBy: string;
    approvedBy?: string;
    nextReviewDate: Date;
}
export interface PortfolioSuitability {
    portfolioId: string;
    suitabilityScore: number;
    assetAllocationAlignment: number;
    riskAlignment: number;
    objectiveAlignment: number;
    issuesIdentified: string[];
    recommendations: string[];
}
export interface UnsuitableHolding {
    symbol: string;
    quantity: Decimal;
    marketValue: Decimal;
    unsuitabilityReason: string;
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    recommendedAction: 'IMMEDIATE_SALE' | 'GRADUAL_REDUCTION' | 'HOLD_MONITOR' | 'REVIEW_REQUIRED';
    timeline: string;
}
export interface SuitabilityAction {
    actionType: 'REBALANCE' | 'LIQUIDATE' | 'DOCUMENTATION' | 'REVIEW' | 'APPROVAL';
    description: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    dueDate: Date;
    assignedTo: string;
    isCompleted: boolean;
    completedDate?: Date;
}
export interface RiskMonitoringAlert {
    id: string;
    clientId: string;
    alertType: 'PORTFOLIO_DRIFT' | 'RISK_CAPACITY_CHANGE' | 'UNSUITABLE_INVESTMENT' | 'CONCENTRATION_RISK';
    severity: 'HIGH' | 'MEDIUM' | 'LOW';
    title: string;
    description: string;
    triggeredDate: Date;
    portfolioId?: string;
    holdingSymbol?: string;
    currentValue?: Decimal;
    thresholdValue?: Decimal;
    recommendedAction: string;
    isAcknowledged: boolean;
    acknowledgedBy?: string;
    acknowledgedDate?: Date;
    isResolved: boolean;
    resolvedDate?: Date;
    resolution?: string;
}
export declare class RiskProfilingService {
    private prisma;
    private kafkaService;
    /**
     * Complete comprehensive risk profiling assessment
     */
    completeRiskAssessment(clientId: string, questionnaire: Omit<RiskProfileQuestionnaire, 'id' | 'completedDate' | 'calculatedRiskScore' | 'recommendedRiskTolerance' | 'isValid' | 'expirationDate'>, tenantId: string, userId: string): Promise<RiskAssessmentResult>;
    /**
     * Perform comprehensive suitability assessment
     */
    performSuitabilityAssessment(request: SuitabilityAssessmentRequest, tenantId: string, userId: string): Promise<SuitabilityAssessment>;
    /**
     * Monitor ongoing suitability and generate alerts
     */
    monitorSuitability(clientId: string, tenantId: string): Promise<RiskMonitoringAlert[]>;
    /**
     * Get client's risk profile history
     */
    getRiskProfileHistory(clientId: string, tenantId: string): Promise<RiskProfileQuestionnaire[]>;
    /**
     * Get active suitability alerts for client
     */
    getActiveSuitabilityAlerts(clientId: string, tenantId: string): Promise<RiskMonitoringAlert[]>;
    private calculateRiskScores;
    private calculateOverallRiskScore;
    private determineRiskTolerance;
    private assessRiskCapacity;
    private generateRiskRecommendations;
    private identifyRiskWarnings;
    private calculateSuitabilityScore;
    private calculateRiskAlignment;
    private calculateObjectiveAlignment;
    private generateAssetAllocation;
    private identifyUnsuitableInvestments;
    private determineRiskCapacity;
    private calculateNextReviewDate;
    private triggerPortfolioReview;
    private getExperienceScore;
    private calculateLiquidityAlignment;
    private getAssetAllocationRecommendations;
    private checkPortfolioDrift;
    private checkConcentrationRisk;
    private checkUnsuitableInvestments;
}
