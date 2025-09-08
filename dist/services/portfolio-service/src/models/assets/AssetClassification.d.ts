export interface AssetClass {
    id: string;
    name: string;
    code: string;
    description: string | null;
    parentClassId?: string | null;
    level: number;
    assetType: 'EQUITY' | 'FIXED_INCOME' | 'CASH_EQUIVALENT' | 'ALTERNATIVE' | 'DERIVATIVE' | 'STRUCTURED_PRODUCT' | 'COMMODITY' | 'REAL_ESTATE';
    riskLevel: 'CONSERVATIVE' | 'MODERATE_CONSERVATIVE' | 'MODERATE' | 'MODERATE_AGGRESSIVE' | 'AGGRESSIVE';
    liquidityTier: 'TIER_1' | 'TIER_2' | 'TIER_3' | 'TIER_4';
    regulatoryCategory?: string;
    secClassification?: string;
    minimumInvestment?: number;
    typicalHoldingPeriod?: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface AssetSubClass {
    id: string;
    assetClassId: string;
    name: string;
    code: string;
    description: string | null;
    characteristics: AssetCharacteristics;
    primaryBenchmark?: string;
    secondaryBenchmarks?: string[];
    expectedReturn?: number;
    volatility?: number;
    sharpeRatio?: number;
    maxDrawdown?: number;
    correlationToMarket?: number;
    correlationToBonds?: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface AssetCharacteristics {
    incomeGenerating: boolean;
    incomeFrequency?: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL' | 'IRREGULAR';
    averageYield?: number;
    growthOriented: boolean;
    capitalAppreciationPotential: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
    marketCapSensitive: boolean;
    interestRateSensitive: boolean;
    inflationSensitive: boolean;
    currencySensitive: boolean;
    sectorExposure?: string[];
    geographicExposure?: string[];
    taxAdvantaged: boolean;
    taxDeferral: boolean;
    dailyLiquidity: boolean;
    settlementPeriod: number;
    tradingHours?: string;
}
export interface InstrumentClassification {
    id: string;
    instrumentId: string;
    securityId?: string | null;
    symbol?: string;
    instrumentName: string;
    assetClassId: string;
    assetSubClassId?: string;
    classifications: ClassificationDimension[];
    gicsCode?: string;
    gicsSector?: string;
    gicsIndustryGroup?: string;
    gicsIndustry?: string;
    gicsSubIndustry?: string;
    countryCode?: string;
    regionCode?: string;
    developedMarket: boolean;
    marketCapCategory?: 'LARGE_CAP' | 'MID_CAP' | 'SMALL_CAP' | 'MICRO_CAP';
    styleClassification?: 'VALUE' | 'GROWTH' | 'BLEND';
    creditRating?: string;
    investmentGrade?: boolean;
    esgScore?: number;
    esgRating?: string;
    sustainabilityCompliant: boolean;
    accreditedInvestorOnly: boolean;
    institutionalOnly: boolean;
    retailSuitable: boolean;
    primaryExchange?: string;
    currency: string;
    reviewFrequency: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL';
    tenantId: string;
    emergingMarket?: boolean;
    classificationDate: Date;
    lastReviewDate: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface ClassificationDimension {
    dimension: string;
    code: string;
    name: string;
    confidence: number;
    source: string;
    lastUpdated: Date;
}
export interface AssetAllocation {
    id: string;
    portfolioId?: string;
    name: string;
    description?: string;
    allocations: AllocationTarget[];
    constraints: AllocationConstraint[];
    rebalancingThreshold: number;
    rebalancingFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY' | 'TACTICAL';
    riskProfile: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE' | 'VERY_AGGRESSIVE';
    timeHorizon: 'SHORT' | 'MEDIUM' | 'LONG' | 'VERY_LONG';
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
}
export interface AllocationTarget {
    assetClassId: string;
    assetSubClassId?: string;
    targetPercentage: number;
    minPercentage?: number;
    maxPercentage?: number;
    isStrategic: boolean;
    tacticalAdjustment?: number;
    rationale?: string;
    lastReviewDate?: Date;
}
export interface AllocationConstraint {
    type: 'MIN_ALLOCATION' | 'MAX_ALLOCATION' | 'MAX_CONCENTRATION' | 'MIN_DIVERSIFICATION' | 'ESG_MINIMUM' | 'SECTOR_LIMIT' | 'GEOGRAPHIC_LIMIT';
    target: string;
    value: number;
    unit: 'PERCENTAGE' | 'DOLLAR_AMOUNT' | 'COUNT';
    description: string;
    isHard: boolean;
}
export interface ClassifyInstrumentRequest {
    instrumentId: string;
    securityId?: string;
    symbol?: string;
    instrumentName: string;
    instrumentType: string;
    additionalData?: Record<string, any>;
    tenantId: string;
    classifiedBy: string;
}
export interface UpdateClassificationRequest {
    instrumentId: string;
    securityId?: string;
    assetClassId?: string;
    assetSubClassId?: string;
    classifications?: ClassificationDimension[];
    gicsCode?: string;
    countryCode?: string;
    marketCapCategory?: string;
    styleClassification?: string;
    creditRating?: string;
    esgScore?: number;
    tenantId: string;
    updatedBy: string;
}
export interface CreateAssetAllocationRequest {
    portfolioId?: string;
    name: string;
    description?: string;
    allocations: Omit<AllocationTarget, 'lastReviewDate'>[];
    constraints?: Omit<AllocationConstraint, 'description'>[];
    riskProfile: string;
    timeHorizon: string;
    rebalancingThreshold?: number;
    rebalancingFrequency?: string;
    tenantId: string;
    createdBy: string;
}
export interface AssetClassificationSummary {
    totalInstruments: number;
    classificationsByAssetClass: Record<string, number>;
    classificationsByRegion: Record<string, number>;
    classificationsBySector: Record<string, number>;
    unclassifiedCount: number;
    lastClassificationDate: Date;
}
export interface PortfolioClassificationAnalysis {
    portfolioId: string;
    asOfDate: Date;
    assetClassAllocation: AllocationBreakdown[];
    geographicAllocation: AllocationBreakdown[];
    sectorAllocation: AllocationBreakdown[];
    styleAllocation: AllocationBreakdown[];
    creditQualityAllocation: AllocationBreakdown[];
    esgScore: number;
    esgAllocation: AllocationBreakdown[];
    portfolioRiskLevel: string;
    diversificationScore: number;
    concentrationRisk: ConcentrationRisk[];
    complianceViolations: ComplianceViolation[];
}
export interface AllocationBreakdown {
    category: string;
    categoryName: string;
    percentage: number;
    marketValue: number;
    targetPercentage?: number;
    deviation?: number;
}
export interface ConcentrationRisk {
    type: 'INSTRUMENT' | 'SECTOR' | 'GEOGRAPHY' | 'ISSUER';
    identifier: string;
    name: string;
    percentage: number;
    riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
}
export interface ComplianceViolation {
    constraintType: string;
    description: string;
    currentValue: number;
    limitValue: number;
    severity: 'WARNING' | 'VIOLATION' | 'CRITICAL';
    recommendedAction: string;
}
export declare const STANDARD_ASSET_CLASSES: {
    EQUITY: {
        DOMESTIC_LARGE_CAP: string;
        DOMESTIC_MID_CAP: string;
        DOMESTIC_SMALL_CAP: string;
        INTERNATIONAL_DEVELOPED: string;
        EMERGING_MARKETS: string;
        REAL_ESTATE: string;
    };
    FIXED_INCOME: {
        GOVERNMENT_BONDS: string;
        CORPORATE_BONDS: string;
        HIGH_YIELD_BONDS: string;
        MUNICIPAL_BONDS: string;
        INTERNATIONAL_BONDS: string;
        TREASURY_BILLS: string;
    };
    CASH_EQUIVALENT: {
        MONEY_MARKET: string;
        BANK_DEPOSITS: string;
        COMMERCIAL_PAPER: string;
    };
    ALTERNATIVE: {
        PRIVATE_EQUITY: string;
        HEDGE_FUNDS: string;
        COMMODITIES: string;
        INFRASTRUCTURE: string;
        PRIVATE_DEBT: string;
    };
};
export interface ClassificationValidationResult {
    isValid: boolean;
    errors: string[];
    warnings?: string[];
    suggestions?: string[];
}
