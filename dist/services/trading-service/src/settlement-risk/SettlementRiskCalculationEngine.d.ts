import { EventEmitter } from 'events';
export interface RiskMetrics {
    creditRisk: number;
    liquidityRisk: number;
    operationalRisk: number;
    marketRisk: number;
    compositeRisk: number;
    riskGrade: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}
export interface SettlementInstruction {
    id: string;
    tradeId: string;
    counterpartyId: string;
    settlementDate: Date;
    currency: string;
    notionalAmount: number;
    securityType: string;
    cusip?: string;
    isin?: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    status: 'PENDING' | 'PROCESSING' | 'SETTLED' | 'FAILED' | 'CANCELLED';
    createdAt: Date;
    updatedAt: Date;
}
export interface CounterpartyRiskProfile {
    counterpartyId: string;
    name: string;
    creditRating: string;
    probabilityOfDefault: number;
    exposureAtDefault: number;
    lossGivenDefault: number;
    concentrationLimit: number;
    currentExposure: number;
    riskWeighting: number;
    lastUpdated: Date;
}
export interface SettlementRiskAssessment {
    instructionId: string;
    riskMetrics: RiskMetrics;
    keyRiskFactors: string[];
    mitigationActions: string[];
    alertLevel: 'INFO' | 'WARNING' | 'CRITICAL';
    assessmentTimestamp: Date;
    validUntil: Date;
}
export interface RiskThresholds {
    creditRiskThreshold: number;
    liquidityRiskThreshold: number;
    operationalRiskThreshold: number;
    marketRiskThreshold: number;
    compositeRiskThreshold: number;
    concentrationThreshold: number;
    exposureThreshold: number;
}
export interface MarketConditions {
    volatilityIndex: number;
    liquidityIndex: number;
    creditSpreadIndex: number;
    marketStressLevel: 'NORMAL' | 'ELEVATED' | 'HIGH' | 'EXTREME';
    lastUpdated: Date;
}
export declare class SettlementRiskCalculationEngine extends EventEmitter {
    private riskThresholds;
    private marketConditions;
    private counterpartyProfiles;
    private pendingInstructions;
    private riskAssessments;
    constructor();
    private getDefaultRiskThresholds;
    private getDefaultMarketConditions;
    calculateSettlementRisk(instruction: SettlementInstruction): Promise<SettlementRiskAssessment>;
    private calculateRiskMetrics;
    private calculateCreditRisk;
    private calculateLiquidityRisk;
    private calculateOperationalRisk;
    private calculateMarketRisk;
    private calculateCompositeRisk;
    private determineRiskGrade;
    private identifyKeyRiskFactors;
    private generateMitigationActions;
    private determineAlertLevel;
    private getCreditRatingMultiplier;
    private getSecurityLiquidityMultiplier;
    private getSecurityComplexityScore;
    private getPriorityRiskMultiplier;
    private getSystemLoadFactor;
    private getMarketStressMultiplier;
    private getAssetClassRiskMultiplier;
    addCounterpartyProfile(profile: CounterpartyRiskProfile): void;
    updateCounterpartyProfile(counterpartyId: string, updates: Partial<CounterpartyRiskProfile>): void;
    getCounterpartyProfile(counterpartyId: string): CounterpartyRiskProfile | undefined;
    updateMarketConditions(conditions: Partial<MarketConditions>): void;
    updateRiskThresholds(thresholds: Partial<RiskThresholds>): void;
    getRiskAssessment(instructionId: string): SettlementRiskAssessment | undefined;
    getAllRiskAssessments(): SettlementRiskAssessment[];
    getHighRiskInstructions(): SettlementRiskAssessment[];
    generateRiskSummary(): {
        totalAssessments: number;
        riskDistribution: {
            [key: string]: number;
        };
        averageCompositeRisk: number;
        criticalAlerts: number;
    };
}
