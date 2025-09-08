import { EventEmitter } from 'events';
export interface MortgageBackedSecurity {
    id: string;
    cusip: string;
    name: string;
    issuer: string;
    type: 'gnma' | 'fnma' | 'fhlmc' | 'private_label' | 'commercial';
    originalBalance: number;
    currentBalance: number;
    couponRate: number;
    maturityDate: Date;
    issueDate: Date;
    pricingDate: Date;
    price: number;
    yield: number;
    duration: number;
    convexity: number;
    averageLife: number;
    poolNumber?: string;
    passThrough: boolean;
    collateral: MBSCollateral;
    prepaymentModel: PrepaymentModel;
    cashFlows: CashFlow[];
    riskMetrics: MBSRiskMetrics;
    servicingData: ServicingData;
    active: boolean;
}
export interface MBSCollateral {
    originalLoanBalance: number;
    weightedAverageCoupon: number;
    weightedAverageMaturity: number;
    weightedAverageLoanAge: number;
    loanCount: number;
    geography: GeographicDistribution;
    creditQuality: CreditQuality;
    loanPurpose: {
        [purpose: string]: number;
    };
    propertyType: {
        [type: string]: number;
    };
}
export interface AssetBackedSecurity {
    id: string;
    cusip: string;
    name: string;
    issuer: string;
    assetType: 'auto_loans' | 'credit_cards' | 'student_loans' | 'equipment' | 'receivables' | 'other';
    tranche: string;
    seniority: 'senior' | 'mezzanine' | 'subordinate' | 'equity';
    originalBalance: number;
    currentBalance: number;
    couponRate: number;
    couponType: 'fixed' | 'floating' | 'step_up';
    maturityDate: Date;
    issueDate: Date;
    price: number;
    yield: number;
    duration: number;
    creditRating: CreditRating;
    enhancement: CreditEnhancement;
    collateral: ABSCollateral;
    cashFlows: CashFlow[];
    paymentStructure: ABSPaymentStructure;
    riskMetrics: ABSRiskMetrics;
    active: boolean;
}
export interface CallableBond {
    id: string;
    cusip: string;
    name: string;
    issuer: string;
    type: 'corporate' | 'municipal' | 'government' | 'agency';
    originalAmount: number;
    outstandingAmount: number;
    couponRate: number;
    maturityDate: Date;
    issueDate: Date;
    firstCallDate: Date;
    callSchedule: CallOption[];
    callProtection: CallProtection;
    price: number;
    yield: number;
    yieldToCall: number;
    yieldToWorst: number;
    duration: number;
    modifiedDuration: number;
    convexity: number;
    optionAdjustedSpread: number;
    creditRating: CreditRating;
    callRisk: CallRisk;
    cashFlows: CashFlow[];
    active: boolean;
}
export interface CallOption {
    callDate: Date;
    callPrice: number;
    callType: 'make_whole' | 'fixed_price' | 'declining_premium' | 'par';
    noticePeriod: number;
    exercisable: boolean;
}
export interface CallProtection {
    type: 'hard' | 'soft' | 'none';
    endDate?: Date;
    premium?: number;
    conditions?: string[];
}
export interface CashFlow {
    date: Date;
    principal: number;
    interest: number;
    total: number;
    balanceRemaining: number;
    type: 'scheduled' | 'prepayment' | 'default' | 'call' | 'maturity';
    probability: number;
}
export interface PrepaymentModel {
    type: 'psa' | 'cpr' | 'smm' | 'custom';
    speed: number;
    assumptions: {
        baselineSpeed: number;
        seasonality: number[];
        burnout: number;
        incentive: IncentiveFunction;
    };
    scenario: 'base' | 'fast' | 'slow';
}
export interface IncentiveFunction {
    refinancingThreshold: number;
    maxIncentive: number;
    turnoverRate: number;
}
export interface MBSRiskMetrics {
    prepaymentRisk: number;
    extensionRisk: number;
    creditRisk: number;
    interestRateRisk: number;
    liquidityRisk: number;
    modelRisk: number;
    keyRateDurations: {
        [tenor: string]: number;
    };
    scenarioAnalysis: ScenarioResult[];
}
export interface ABSRiskMetrics {
    creditRisk: number;
    prepaymentRisk: number;
    liquidityRisk: number;
    concentrationRisk: number;
    servicerRisk: number;
    keyRateDurations: {
        [tenor: string]: number;
    };
    stressTestResults: StressTestResult[];
}
export interface CallRisk {
    callProbability: {
        [date: string]: number;
    };
    reinvestmentRisk: number;
    negativeCashflows: number;
    optionValue: number;
}
export interface GeographicDistribution {
    states: {
        [state: string]: number;
    };
    msas: {
        [msa: string]: number;
    };
    concentration: number;
}
export interface CreditQuality {
    averageFICO: number;
    ficoDistribution: {
        [range: string]: number;
    };
    loanToValue: number;
    ltvDistribution: {
        [range: string]: number;
    };
    delinquencyRate: number;
    defaultRate: number;
}
export interface CreditRating {
    agency: string;
    rating: string;
    outlook: 'positive' | 'stable' | 'negative' | 'developing';
    lastReview: Date;
    watchList: boolean;
}
export interface CreditEnhancement {
    type: 'subordination' | 'excess_spread' | 'reserve_fund' | 'insurance' | 'letter_of_credit';
    level: number;
    provider?: string;
    trigger?: number;
}
export interface ABSCollateral {
    assetCount: number;
    averageBalance: number;
    weightedAverageCoupon: number;
    weightedAverageLife: number;
    geography: GeographicDistribution;
    creditQuality: CreditQuality;
    diversification: DiversificationMetrics;
}
export interface ABSPaymentStructure {
    priority: 'sequential' | 'pro_rata' | 'turbo';
    paymentFrequency: 'monthly' | 'quarterly' | 'semi_annual';
    principalPayment: 'bullet' | 'amortizing' | 'controlled_amortization';
    interestPayment: 'current' | 'accrual' | 'pay_in_kind';
    triggers: PaymentTrigger[];
}
export interface PaymentTrigger {
    type: 'step_down' | 'rapid_amortization' | 'cash_trap' | 'turbo';
    threshold: number;
    metric: string;
    action: string;
    active: boolean;
}
export interface DiversificationMetrics {
    herfindahlIndex: number;
    concentration: {
        [category: string]: number;
    };
    correlations: {
        [asset: string]: number;
    };
}
export interface ServicingData {
    servicer: string;
    servicingFee: number;
    delinquencyRate: number;
    lossRate: number;
    recoveryRate: number;
    servicingAdvances: number;
    lastReportingDate: Date;
}
export interface ScenarioResult {
    scenario: string;
    yieldChange: number;
    prepaymentSpeed: number;
    averageLife: number;
    duration: number;
    totalReturn: number;
}
export interface StressTestResult {
    scenario: string;
    expectedLoss: number;
    unexpectedLoss: number;
    riskContribution: number;
    capitalRequirement: number;
}
/**
 * Structured Products Service
 * Handles mortgage-backed securities, asset-backed securities, and callable bonds
 */
export declare class StructuredProductsService extends EventEmitter {
    private mbsSecurities;
    private absSecurities;
    private callableBonds;
    private marketData;
    constructor();
    /**
     * Create mortgage-backed security
     */
    createMBS(mbsData: Omit<MortgageBackedSecurity, 'id' | 'cashFlows' | 'riskMetrics' | 'active'>): Promise<MortgageBackedSecurity>;
    /**
     * Create asset-backed security
     */
    createABS(absData: Omit<AssetBackedSecurity, 'id' | 'cashFlows' | 'riskMetrics' | 'active'>): Promise<AssetBackedSecurity>;
    /**
     * Create callable bond
     */
    createCallableBond(bondData: Omit<CallableBond, 'id' | 'yieldToCall' | 'yieldToWorst' | 'callRisk' | 'cashFlows' | 'active'>): Promise<CallableBond>;
    /**
     * Update MBS prepayment speeds and recalculate metrics
     */
    updateMBSPrepaymentModel(mbsId: string, newModel: PrepaymentModel): Promise<MortgageBackedSecurity>;
    /**
     * Analyze call option exercise probability
     */
    analyzeCallProbability(bondId: string, marketScenarios: any[]): {
        callProbabilities: {
            [date: string]: number;
        };
        expectedCallDate: Date | null;
        optionValue: number;
        recommendations: string[];
    };
    /**
     * Run stress tests on structured products
     */
    runStressTests(productIds: string[], scenarios: StressScenario[]): Promise<Map<string, StressTestResult[]>>;
    private generateMBSCashFlows;
    private generateABSCashFlows;
    private generateCallableBondCashFlows;
    private calculateMBSRiskMetrics;
    private calculateABSRiskMetrics;
    private calculateYieldToCall;
    private calculateCallRisk;
    private calculateScheduledPrincipal;
    private calculatePrepaymentRate;
    private calculatePrepaymentRisk;
    private calculateExtensionRisk;
    private calculateLiquidityRisk;
    private calculateModelRisk;
    private runMBSScenario;
    private calculateABSMaturityPeriods;
    private calculateABSAmortization;
    private calculateControlledAmortization;
    private getABSDefaultRate;
    private estimateCallProbability;
    private getCurrentMarketRate;
    private calculateCashFlowVariance;
    private calculateAverageLife;
    private calculateABSPrepaymentRisk;
    private calculateServicerRisk;
    private stressMBS;
    private stressABS;
    private stressCallableBond;
    private calculateReinvestmentRisk;
    private calculateNegativeConvexity;
    private calculateCallOptionValue;
    private getMaturityBucket;
    private generateCallAnalysisRecommendations;
    private initializeMarketData;
    private startPricingEngine;
    private updatePricing;
}
interface StressScenario {
    name: string;
    parameters: Record<string, any>;
}
export default StructuredProductsService;
