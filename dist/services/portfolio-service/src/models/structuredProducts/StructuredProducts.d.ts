export declare enum StructuredProductType {
    STRUCTURED_NOTE = "STRUCTURED_NOTE",
    MARKET_LINKED_CD = "MARKET_LINKED_CD",
    REVERSE_CONVERTIBLE = "REVERSE_CONVERTIBLE",
    AUTOCALLABLE = "AUTOCALLABLE",
    BARRIER_OPTION = "BARRIER_OPTION",
    EXOTIC_DERIVATIVE = "EXOTIC_DERIVATIVE",
    EQUITY_LINKED = "EQUITY_LINKED",
    RATE_LINKED = "RATE_LINKED",
    COMMODITY_LINKED = "COMMODITY_LINKED",
    CURRENCY_LINKED = "CURRENCY_LINKED"
}
export declare enum BarrierType {
    KNOCK_IN = "KNOCK_IN",
    KNOCK_OUT = "KNOCK_OUT",
    UP_AND_IN = "UP_AND_IN",
    UP_AND_OUT = "UP_AND_OUT",
    DOWN_AND_IN = "DOWN_AND_IN",
    DOWN_AND_OUT = "DOWN_AND_OUT",
    DOUBLE_BARRIER = "DOUBLE_BARRIER"
}
export declare enum PayoffType {
    FIXED_COUPON = "FIXED_COUPON",
    FLOATING_COUPON = "FLOATING_COUPON",
    PARTICIPATION = "PARTICIPATION",
    LEVERAGED = "LEVERAGED",
    CAPPED = "CAPPED",
    FLOORED = "FLOORED",
    DIGITAL = "DIGITAL",
    BASKET = "BASKET"
}
export declare enum ObservationFrequency {
    CONTINUOUS = "CONTINUOUS",
    DAILY = "DAILY",
    WEEKLY = "WEEKLY",
    MONTHLY = "MONTHLY",
    QUARTERLY = "QUARTERLY",
    MATURITY_ONLY = "MATURITY_ONLY"
}
export declare enum SettlementType {
    CASH = "CASH",
    PHYSICAL = "PHYSICAL",
    ELECTION = "ELECTION"
}
export declare enum UnderlyingType {
    SINGLE_STOCK = "SINGLE_STOCK",
    INDEX = "INDEX",
    BASKET = "BASKET",
    COMMODITY = "COMMODITY",
    CURRENCY = "CURRENCY",
    INTEREST_RATE = "INTEREST_RATE",
    CREDIT = "CREDIT",
    HYBRID = "HYBRID"
}
export declare enum DocumentStatus {
    DRAFT = "DRAFT",
    PENDING_REVIEW = "PENDING_REVIEW",
    APPROVED = "APPROVED",
    ACTIVE = "ACTIVE",
    MATURED = "MATURED",
    CALLED = "CALLED",
    DEFAULTED = "DEFAULTED"
}
export declare enum RiskLevel {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    VERY_HIGH = "VERY_HIGH"
}
export interface StructuredProduct {
    id: string;
    tenantId: string;
    securityId: string;
    productName: string;
    productType: StructuredProductType;
    issuer: string;
    issuerId: string;
    cusip?: string;
    isin?: string;
    ticker?: string;
    notionalAmount: number;
    currency: string;
    issueDate: Date;
    maturityDate: Date;
    minInvestment: number;
    incrementAmount?: number;
    payoffType: PayoffType;
    payoffFormula: string;
    payoffParameters: Record<string, any>;
    underlyingType: UnderlyingType;
    underlyingAssets: UnderlyingAsset[];
    hasBarrier: boolean;
    barriers?: BarrierFeature[];
    hasCoupon: boolean;
    coupons?: CouponStructure[];
    isCallable: boolean;
    isPutable: boolean;
    callSchedule?: CallSchedule[];
    putSchedule?: PutSchedule[];
    hasCapitalProtection: boolean;
    protectionLevel?: number;
    protectionType?: 'FULL' | 'PARTIAL' | 'CONDITIONAL';
    settlementType: SettlementType;
    settlementDays: number;
    termSheet: string;
    prospectus?: string;
    marketingMaterials?: string[];
    riskLevel: RiskLevel;
    riskFactors: string[];
    creditRating?: string;
    currentPrice?: number;
    lastPriceUpdate?: Date;
    pricingModel?: string;
    pricingParameters?: Record<string, any>;
    status: DocumentStatus;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
}
export interface UnderlyingAsset {
    id: string;
    symbol: string;
    name: string;
    assetType: string;
    weight: number;
    exchange?: string;
    currency?: string;
    sector?: string;
    currentPrice?: number;
    lastUpdate?: Date;
    initialLevel?: number;
    strikeLevel?: number;
    impliedVolatility?: number;
    historicalVolatility?: number;
    correlationMatrix?: Record<string, number>;
}
export interface BarrierFeature {
    id: string;
    barrierType: BarrierType;
    level: number;
    rebate?: number;
    observationFrequency: ObservationFrequency;
    observationStartDate: Date;
    observationEndDate: Date;
    upperBarrier?: number;
    lowerBarrier?: number;
    isAmerican: boolean;
    isActive: boolean;
    hasBeenHit: boolean;
    hitDate?: Date;
    hitLevel?: number;
    knockInAction?: PayoffAction;
    knockOutAction?: PayoffAction;
}
export interface CouponStructure {
    id: string;
    couponType: 'FIXED' | 'FLOATING' | 'CONDITIONAL' | 'STEP_UP' | 'BARRIER_DEPENDENT';
    paymentDate: Date;
    couponRate?: number;
    referenceRate?: string;
    spread?: number;
    condition?: string;
    conditionParameters?: Record<string, any>;
    hasMemory: boolean;
    accumulatedCoupons?: number;
    isPaid: boolean;
    paidAmount?: number;
    paidDate?: Date;
    calculatedRate?: number;
    calculatedAmount?: number;
    calculationDate?: Date;
}
export interface CallSchedule {
    id: string;
    callDate: Date;
    callPrice: number;
    callType: 'MANDATORY' | 'OPTIONAL';
    callCondition?: string;
    conditionParameters?: Record<string, any>;
    noticeDays: number;
    noticeDate?: Date;
    isExercised: boolean;
    exerciseDate?: Date;
    exercisePrice?: number;
}
export interface PutSchedule {
    id: string;
    putDate: Date;
    putPrice: number;
    putType: 'MANDATORY' | 'OPTIONAL';
    putCondition?: string;
    conditionParameters?: Record<string, any>;
    noticeDays: number;
    noticeDate?: Date;
    isExercised: boolean;
    exerciseDate?: Date;
    exercisePrice?: number;
}
export interface PayoffAction {
    actionType: 'PAYOUT' | 'CONVERT' | 'TERMINATE' | 'CONTINUE';
    payoutAmount?: number;
    payoutFormula?: string;
    conversionRatio?: number;
    conversionAsset?: string;
}
export interface StructuredProductMarketData {
    id: string;
    productId: string;
    timestamp: Date;
    theoreticalValue: number;
    marketPrice?: number;
    bid?: number;
    ask?: number;
    spread?: number;
    delta?: number;
    gamma?: number;
    theta?: number;
    vega?: number;
    rho?: number;
    impliedVolatility?: number;
    timeToMaturity?: number;
    underlyingLevels: Record<string, number>;
    barrierDistances?: Record<string, number>;
    barrierProbabilities?: Record<string, number>;
    priceScenarios?: PriceScenario[];
}
export interface PriceScenario {
    scenarioName: string;
    underlyingChanges: Record<string, number>;
    impliedVolChanges?: Record<string, number>;
    timeDecay?: number;
    scenarioPrice: number;
    pnl: number;
}
export interface ValuationModel {
    id: string;
    modelName: string;
    modelType: 'MONTE_CARLO' | 'BINOMIAL' | 'TRINOMIAL' | 'PDE' | 'CLOSED_FORM' | 'EMPIRICAL';
    parameters: Record<string, any>;
    simulations?: number;
    timeSteps?: number;
    randomSeed?: number;
    calibrationDate?: Date;
    calibrationMethod?: string;
    calibrationParameters?: Record<string, any>;
    backTestResults?: BackTestResult[];
    calculationTime?: number;
    convergenceMetrics?: Record<string, number>;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface BackTestResult {
    testDate: Date;
    modelPrice: number;
    marketPrice: number;
    absoluteError: number;
    relativeError: number;
    rmse?: number;
    mae?: number;
    bias?: number;
    testPeriod: {
        startDate: Date;
        endDate: Date;
    };
}
export interface StructuredProductPosition {
    id: string;
    tenantId: string;
    portfolioId: string;
    productId: string;
    quantity: number;
    notionalValue: number;
    averageCost: number;
    currentValue: number;
    unrealizedPnl: number;
    realizedPnl: number;
    acquisitionDate: Date;
    acquisitionPrice: number;
    lastValuationDate: Date;
    lastValuationPrice: number;
    var95?: number;
    var99?: number;
    expectedShortfall?: number;
    portfolioDelta?: number;
    portfolioGamma?: number;
    portfolioTheta?: number;
    portfolioVega?: number;
    pricingAlerts: PricingAlert[];
    barrierAlerts: BarrierAlert[];
    pendingSettlement?: number;
    settledAmount?: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface PricingAlert {
    id: string;
    alertType: 'STALE_PRICE' | 'PRICE_DEVIATION' | 'VOLATILITY_SPIKE' | 'MODEL_FAILURE';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
    currentValue?: number;
    expectedValue?: number;
    deviation?: number;
    threshold?: number;
    alertTime: Date;
    acknowledgedAt?: Date;
    acknowledgedBy?: string;
    resolvedAt?: Date;
    isActive: boolean;
}
export interface BarrierAlert {
    id: string;
    barrierId: string;
    alertType: 'BARRIER_APPROACH' | 'BARRIER_HIT' | 'BARRIER_RECOVERY';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    currentLevel: number;
    barrierLevel: number;
    distance: number;
    distancePercentage: number;
    alertTime: Date;
    acknowledgedAt?: Date;
    acknowledgedBy?: string;
    isActive: boolean;
}
export interface DocumentParsingResult {
    id: string;
    documentId: string;
    documentType: 'TERM_SHEET' | 'PROSPECTUS' | 'MARKETING' | 'LEGAL';
    parsingStatus: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED';
    parsingEngine: string;
    extractedTerms: Record<string, any>;
    structuredData: Partial<StructuredProduct>;
    extractionConfidence: Record<string, number>;
    overallConfidence: number;
    validationErrors: ValidationError[];
    validationWarnings: ValidationWarning[];
    processingStartTime: Date;
    processingEndTime?: Date;
    processingDuration?: number;
    requiresReview: boolean;
    reviewedBy?: string;
    reviewedAt?: Date;
    reviewNotes?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface ValidationError {
    field: string;
    errorType: string;
    message: string;
    severity: 'ERROR' | 'WARNING' | 'INFO';
    suggestedFix?: string;
}
export interface ValidationWarning {
    field: string;
    warningType: string;
    message: string;
    impact: string;
}
export interface IssuerCreditRisk {
    issuerId: string;
    issuerName: string;
    moodysRating?: string;
    spRating?: string;
    fitchRating?: string;
    internalRating?: string;
    creditSpread: number;
    probabilityOfDefault: number;
    recoveryRate: number;
    creditVaR: number;
    totalExposure: number;
    concentrationLimit: number;
    utilizationRatio: number;
    lastReviewDate: Date;
    nextReviewDate: Date;
    watchListStatus: 'NONE' | 'WATCH' | 'RESTRICTED' | 'PROHIBITED';
    ratingHistory: RatingEvent[];
    spreadHistory: SpreadHistory[];
    createdAt: Date;
    updatedAt: Date;
}
export interface RatingEvent {
    date: Date;
    agency: string;
    previousRating: string;
    newRating: string;
    action: 'UPGRADE' | 'DOWNGRADE' | 'AFFIRM' | 'WITHDRAWAL';
    outlook: 'POSITIVE' | 'NEGATIVE' | 'STABLE' | 'DEVELOPING';
    rationale?: string;
}
export interface SpreadHistory {
    date: Date;
    spread: number;
    benchmark: string;
    source: string;
}
export interface CreateStructuredProductRequest {
    productData: Omit<StructuredProduct, 'id' | 'createdAt' | 'updatedAt'>;
    underlyingAssets: Omit<UnderlyingAsset, 'id'>[];
    barriers?: Omit<BarrierFeature, 'id'>[];
    coupons?: Omit<CouponStructure, 'id'>[];
    callSchedule?: Omit<CallSchedule, 'id'>[];
    putSchedule?: Omit<PutSchedule, 'id'>[];
}
export interface StructuredProductValuationRequest {
    productId: string;
    valuationDate: Date;
    modelType?: string;
    scenarioAnalysis?: boolean;
    includeGreeks?: boolean;
    customParameters?: Record<string, any>;
}
export interface StructuredProductValuationResponse {
    productId: string;
    valuationDate: Date;
    theoreticalValue: number;
    marketData: StructuredProductMarketData;
    modelResults: Record<string, any>;
    scenarioAnalysis?: PriceScenario[];
    calculationTime: number;
    warnings?: string[];
}
export interface BarrierMonitoringRequest {
    productIds?: string[];
    portfolioIds?: string[];
    alertThreshold?: number;
    includeHitBarriers?: boolean;
}
export interface BarrierMonitoringResponse {
    monitoringDate: Date;
    activeBarriers: BarrierStatus[];
    alerts: BarrierAlert[];
    summary: {
        totalBarriers: number;
        activeBarriers: number;
        approachingBarriers: number;
        hitBarriers: number;
    };
}
export interface BarrierStatus {
    productId: string;
    productName: string;
    barrierId: string;
    barrierType: BarrierType;
    barrierLevel: number;
    currentLevel: number;
    distance: number;
    distancePercentage: number;
    isApproaching: boolean;
    hasBeenHit: boolean;
    hitDate?: Date;
}
export interface StructuredProductSearchRequest {
    tenantId: string;
    productTypes?: StructuredProductType[];
    issuers?: string[];
    underlyingTypes?: UnderlyingType[];
    maturityDateRange?: {
        startDate: Date;
        endDate: Date;
    };
    riskLevels?: RiskLevel[];
    hasBarrier?: boolean;
    isCallable?: boolean;
    hasCapitalProtection?: boolean;
    status?: DocumentStatus[];
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}
export interface StructuredProductSearchResponse {
    products: StructuredProduct[];
    total: number;
    aggregations: {
        byProductType: Record<StructuredProductType, number>;
        byIssuer: Record<string, number>;
        byRiskLevel: Record<RiskLevel, number>;
        averageMaturity: number;
        totalNotional: number;
    };
    pagination: {
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}
