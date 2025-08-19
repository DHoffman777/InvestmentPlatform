import { EventEmitter } from 'events';
export interface TradeOrder {
    id: string;
    counterpartyId: string;
    securityId: string;
    side: 'BUY' | 'SELL';
    quantity: number;
    price: number;
    currency: string;
    orderType: 'MARKET' | 'LIMIT' | 'STOP' | 'STOP_LIMIT';
    timeInForce: 'DAY' | 'GTC' | 'IOC' | 'FOK';
    settlementDate: Date;
    portfolioId: string;
    traderId: string;
    createdAt: Date;
}
export interface RiskCheckResult {
    checkId: string;
    orderId: string;
    checkType: string;
    status: 'PASS' | 'FAIL' | 'WARNING' | 'PENDING';
    severity: 'INFO' | 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
    details?: any;
    threshold?: number;
    actualValue?: number;
    recommendedAction?: string;
    bypassable: boolean;
    bypassReason?: string;
    bypassedBy?: string;
    executedAt: Date;
    executionTimeMs: number;
}
export interface RiskCheckSuite {
    suiteId: string;
    orderId: string;
    suiteName: string;
    totalChecks: number;
    passedChecks: number;
    failedChecks: number;
    warningChecks: number;
    overallStatus: 'PASS' | 'FAIL' | 'WARNING' | 'PENDING';
    canProceed: boolean;
    requiresApproval: boolean;
    results: RiskCheckResult[];
    executedAt: Date;
    completedAt?: Date;
    totalExecutionTimeMs?: number;
}
export interface RiskLimit {
    id: string;
    limitType: 'POSITION' | 'NOTIONAL' | 'CONCENTRATION' | 'EXPOSURE' | 'CREDIT' | 'LEVERAGE' | 'VAR' | 'SECTOR' | 'COUNTRY';
    entityType: 'PORTFOLIO' | 'COUNTERPARTY' | 'SECURITY' | 'TRADER' | 'ACCOUNT';
    entityId: string;
    limitValue: number;
    currency?: string;
    warningThreshold: number;
    breachThreshold: number;
    utilizationValue: number;
    utilizationPercentage: number;
    isActive: boolean;
    effectiveDate: Date;
    expiryDate?: Date;
    reviewDate: Date;
    approvedBy: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface ComplianceRule {
    id: string;
    ruleName: string;
    ruleType: 'REGULATORY' | 'INTERNAL' | 'CLIENT_SPECIFIC' | 'RISK_MANAGEMENT';
    description: string;
    isActive: boolean;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    applicableSecurityTypes: string[];
    applicableCounterparties?: string[];
    applicablePortfolios?: string[];
    ruleLogic: string;
    violationAction: 'BLOCK' | 'WARN' | 'REQUIRE_APPROVAL' | 'LOG_ONLY';
    effectiveDate: Date;
    expiryDate?: Date;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface SettlementCapacity {
    counterpartyId: string;
    securityType: string;
    currency: string;
    maxDailyVolume: number;
    maxDailyNotional: number;
    currentDailyVolume: number;
    currentDailyNotional: number;
    availableCapacity: number;
    utilizationPercentage: number;
    lastUpdated: Date;
}
export interface LiquidityCheck {
    securityId: string;
    requiredQuantity: number;
    side: 'BUY' | 'SELL';
    availableLiquidity: number;
    liquidityRatio: number;
    averageDailyVolume: number;
    marketImpact: number;
    liquidityScore: number;
    liquidityRisk: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    recommendedMaxQuantity?: number;
}
export declare class PreSettlementRiskChecksService extends EventEmitter {
    private riskLimits;
    private complianceRules;
    private settlementCapacities;
    private riskCheckHistory;
    private readonly RISK_CHECKS;
    constructor();
    executePreSettlementChecks(order: TradeOrder, checkTypes?: string[]): Promise<RiskCheckSuite>;
    private determineOverallStatus;
    private canTradeProceed;
    private checkPositionLimits;
    private checkCounterpartyExposure;
    private checkConcentrationLimits;
    private checkCreditLimits;
    private checkSettlementCapacity;
    private checkLiquidity;
    private checkRegulatoryCompliance;
    private checkInternalPolicies;
    private checkMarketHours;
    private checkSettlementDate;
    private checkPriceReasonableness;
    private checkCrossTrades;
    private checkWashTrades;
    private checkRestrictedSecurities;
    private checkKycAml;
    private createErrorResult;
    private getEntityLimits;
    private getCurrentPosition;
    private getCurrentCounterpartyExposure;
    private getPortfolioValue;
    private getCurrentSecurityValue;
    private getCurrentCreditExposure;
    private calculateOrderCreditRisk;
    private getSettlementCapacity;
    private getLiquidityInfo;
    private evaluateComplianceRule;
    private getMarketHours;
    private isMarketOpen;
    private getBusinessDaysBetween;
    private getStandardSettlementDays;
    private getMarketPrice;
    private findOppositeOrders;
    private getRecentTrades;
    private analyzeWashTradeRisk;
    private getSecurityRestrictions;
    private getKycStatus;
    private getAmlRiskLevel;
    addRiskLimit(entityId: string, limit: Omit<RiskLimit, 'id' | 'createdAt' | 'updatedAt'>): RiskLimit;
    addComplianceRule(rule: Omit<ComplianceRule, 'id' | 'createdAt' | 'updatedAt'>): ComplianceRule;
    bypassRiskCheck(suiteId: string, checkId: string, bypassReason: string, bypassedBy: string): boolean;
    getRiskCheckHistory(orderId: string): RiskCheckSuite[];
    getLatestRiskCheck(orderId: string): RiskCheckSuite | undefined;
    getAllActiveAlerts(): RiskCheckResult[];
    generateRiskSummary(timeFrame?: 'DAILY' | 'WEEKLY' | 'MONTHLY'): {
        totalChecksExecuted: number;
        passRate: number;
        failRate: number;
        warningRate: number;
        mostCommonFailures: {
            checkType: string;
            count: number;
        }[];
        averageExecutionTime: number;
    };
}
