export declare enum DerivativeType {
    CALL_OPTION = "CALL_OPTION",
    PUT_OPTION = "PUT_OPTION",
    FUTURE = "FUTURE",
    SWAP = "SWAP",
    FORWARD = "FORWARD",
    WARRANT = "WARRANT",
    CONVERTIBLE_BOND = "CONVERTIBLE_BOND"
}
export declare enum OptionStyle {
    AMERICAN = "AMERICAN",
    EUROPEAN = "EUROPEAN",
    BERMUDAN = "BERMUDAN",
    ASIAN = "ASIAN",
    BARRIER = "BARRIER",
    EXOTIC = "EXOTIC"
}
export declare enum ExerciseType {
    PHYSICAL_DELIVERY = "PHYSICAL_DELIVERY",
    CASH_SETTLEMENT = "CASH_SETTLEMENT",
    CHOICE_OF_SETTLEMENT = "CHOICE_OF_SETTLEMENT"
}
export declare enum OptionStatus {
    ACTIVE = "ACTIVE",
    EXPIRED = "EXPIRED",
    EXERCISED = "EXERCISED",
    ASSIGNED = "ASSIGNED",
    CLOSED = "CLOSED",
    CANCELLED = "CANCELLED"
}
export declare enum MarginType {
    INITIAL_MARGIN = "INITIAL_MARGIN",
    MAINTENANCE_MARGIN = "MAINTENANCE_MARGIN",
    VARIATION_MARGIN = "VARIATION_MARGIN",
    SPAN_MARGIN = "SPAN_MARGIN",
    PORTFOLIO_MARGIN = "PORTFOLIO_MARGIN"
}
export declare enum VolatilityModel {
    BLACK_SCHOLES = "BLACK_SCHOLES",
    BINOMIAL = "BINOMIAL",
    TRINOMIAL = "TRINOMIAL",
    MONTE_CARLO = "MONTE_CARLO",
    HESTON = "HESTON",
    LOCAL_VOLATILITY = "LOCAL_VOLATILITY"
}
export declare enum StrategyType {
    SINGLE_OPTION = "SINGLE_OPTION",
    COVERED_CALL = "COVERED_CALL",
    PROTECTIVE_PUT = "PROTECTIVE_PUT",
    STRADDLE = "STRADDLE",
    STRANGLE = "STRANGLE",
    SPREAD_BULL_CALL = "SPREAD_BULL_CALL",
    SPREAD_BULL_PUT = "SPREAD_BULL_PUT",
    SPREAD_BEAR_CALL = "SPREAD_BEAR_CALL",
    SPREAD_BEAR_PUT = "SPREAD_BEAR_PUT",
    IRON_CONDOR = "IRON_CONDOR",
    IRON_BUTTERFLY = "IRON_BUTTERFLY",
    COLLAR = "COLLAR",
    CUSTOM = "CUSTOM"
}
export interface DerivativeInstrument {
    id: string;
    tenantId: string;
    instrumentId: string;
    symbol: string;
    underlyingSymbol: string;
    underlyingInstrumentId: string;
    derivativeType: DerivativeType;
    exchange: string;
    currency: string;
    country: string;
    contractSize: number;
    multiplier: number;
    tickSize: number;
    tickValue: number;
    issueDate: Date;
    expirationDate: Date;
    lastTradingDate: Date;
    settlementDate: Date;
    status: OptionStatus;
    isActive: boolean;
    currentPrice: number;
    underlyingPrice: number;
    priceDate: Date;
    initialMargin?: number;
    maintenanceMargin?: number;
    marginRequirement?: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface OptionContract extends DerivativeInstrument {
    optionType: 'CALL' | 'PUT';
    optionStyle: OptionStyle;
    strikePrice: number;
    exerciseType: ExerciseType;
    premium: number;
    intrinsicValue: number;
    timeValue: number;
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    rho: number;
    impliedVolatility: number;
    historicalVolatility?: number;
    volatilityModel: VolatilityModel;
    canExercise: boolean;
    exerciseHistory?: ExerciseEvent[];
    assignmentHistory?: AssignmentEvent[];
    dividendAmount?: number;
    exDividendDate?: Date;
    dividendAdjusted?: boolean;
}
export interface FutureContract extends DerivativeInstrument {
    futureType: string;
    deliveryMonth: string;
    deliveryLocation?: string;
    settlementPrice: number;
    dailySettlement: number;
    markToMarket: number;
    initialMarginRate: number;
    maintenanceMarginRate: number;
    variationMargin: number;
    dailyPriceLimit?: number;
    positionLimit?: number;
    deliveryMethod: ExerciseType;
    firstNoticeDate?: Date;
    lastDeliveryDate?: Date;
    openInterest?: number;
    volume?: number;
}
export interface GreeksCalculation {
    id: string;
    tenantId: string;
    instrumentId: string;
    calculationDate: Date;
    delta: number;
    deltaCash?: number;
    gamma: number;
    gammaCash?: number;
    theta: number;
    thetaDaily?: number;
    vega: number;
    vegaPercent?: number;
    rho: number;
    rhoPercent?: number;
    lambda?: number;
    epsilon?: number;
    volga?: number;
    vanna?: number;
    charm?: number;
    color?: number;
    underlyingPrice: number;
    volatility: number;
    riskFreeRate: number;
    dividendYield?: number;
    timeToExpiration: number;
    calculationMethod: VolatilityModel;
    calculationTime: number;
    warnings?: string[];
}
export interface ImpliedVolatilityAnalysis {
    id: string;
    tenantId: string;
    instrumentId: string;
    analysisDate: Date;
    impliedVolatility: number;
    bidIV?: number;
    askIV?: number;
    midIV?: number;
    historicalVolatility: number;
    ivRank: number;
    ivPercentile: number;
    atmIV: number;
    skew: number;
    termStructure: IVTermStructurePoint[];
    realizedVolatility?: number;
    volOfVol?: number;
    meanReversion?: number;
    ivStandardDeviation: number;
    confidence95Upper: number;
    confidence95Lower: number;
    frontMonthIV?: number;
    backMonthIV?: number;
    termStructureSlope?: number;
    dataPoints: number;
    calculationMethod: string;
    warnings?: string[];
}
export interface IVTermStructurePoint {
    daysToExpiration: number;
    impliedVolatility: number;
    strike?: number;
    optionType?: 'CALL' | 'PUT';
}
export interface OptionStrategy {
    id: string;
    tenantId: string;
    portfolioId?: string;
    strategyName: string;
    strategyType: StrategyType;
    description?: string;
    legs: StrategyLeg[];
    maxProfit: number;
    maxLoss: number;
    breakeven: number[];
    probabilityOfProfit?: number;
    netDelta: number;
    netGamma: number;
    netTheta: number;
    netVega: number;
    netRho: number;
    netPremium: number;
    marginRequirement: number;
    buyingPower: number;
    riskRewardRatio?: number;
    maximumDrawdown?: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    expirationDate?: Date;
}
export interface StrategyLeg {
    id: string;
    instrumentId: string;
    side: 'BUY' | 'SELL';
    quantity: number;
    strikePrice?: number;
    expirationDate?: Date;
    optionType?: 'CALL' | 'PUT';
    entryPrice: number;
    currentPrice: number;
    premium: number;
    deltaContribution: number;
    gammaContribution: number;
    thetaContribution: number;
    vegaContribution: number;
    rhoContribution: number;
}
export interface MarginCalculationRequest {
    tenantId: string;
    portfolioId?: string;
    positions: MarginPosition[];
    marginType: MarginType;
    underlyingPrices: Record<string, number>;
    volatilities: Record<string, number>;
    interestRates: Record<string, number>;
    calculationDate?: Date;
    scenarioShifts?: MarginScenario[];
}
export interface MarginPosition {
    instrumentId: string;
    quantity: number;
    price: number;
    side: 'LONG' | 'SHORT';
}
export interface MarginScenario {
    name: string;
    underlyingShift: number;
    volatilityShift: number;
    timeDecay: number;
}
export interface MarginCalculationResult {
    id: string;
    requestId: string;
    tenantId: string;
    calculationDate: Date;
    initialMargin: number;
    maintenanceMargin: number;
    variationMargin: number;
    positionMargins: PositionMargin[];
    portfolioMargin: number;
    netLiquidationValue: number;
    excessLiquidity: number;
    portfolioRisk: number;
    concentrationRisk: number;
    liquidityRisk: number;
    spanMargin?: number;
    calculationMethod: string;
    riskArrays?: any;
    warnings?: string[];
}
export interface PositionMargin {
    instrumentId: string;
    initialMargin: number;
    maintenanceMargin: number;
    riskContribution: number;
    hedgeCredit?: number;
}
export interface ExerciseEvent {
    id: string;
    tenantId: string;
    instrumentId: string;
    portfolioId: string;
    exerciseDate: Date;
    exercisePrice: number;
    exerciseQuantity: number;
    exerciseType: ExerciseType;
    settlementDate: Date;
    settlementAmount: number;
    stockTransactionId?: string;
    cashTransactionId?: string;
    status: 'PENDING' | 'SETTLED' | 'FAILED';
    createdAt: Date;
}
export interface AssignmentEvent {
    id: string;
    tenantId: string;
    instrumentId: string;
    portfolioId: string;
    assignmentDate: Date;
    assignmentPrice: number;
    assignmentQuantity: number;
    assignmentType: ExerciseType;
    settlementDate: Date;
    settlementAmount: number;
    stockTransactionId?: string;
    cashTransactionId?: string;
    status: 'PENDING' | 'SETTLED' | 'FAILED';
    createdAt: Date;
}
export interface MarkToMarketValuation {
    id: string;
    tenantId: string;
    instrumentId: string;
    valuationDate: Date;
    marketPrice: number;
    theoreticalPrice: number;
    intrinsicValue: number;
    timeValue: number;
    unrealizedPnL: number;
    dailyPnL: number;
    inceptionPnL: number;
    deltaPnL: number;
    gammaPnL: number;
    thetaPnL: number;
    vegaPnL: number;
    rhoPnL: number;
    residualPnL: number;
    underlyingPrice: number;
    volatility: number;
    riskFreeRate: number;
    dividendYield?: number;
    timeToExpiration: number;
    pricingModel: VolatilityModel;
    confidence: number;
    dataSource: string;
    calculationTime: number;
    warnings?: string[];
}
export interface DerivativesPortfolioAnalytics {
    id: string;
    tenantId: string;
    portfolioId: string;
    analysisDate: Date;
    totalPositions: number;
    totalNotional: number;
    totalMarketValue: number;
    optionsAllocation: number;
    futuresAllocation: number;
    otherDerivativesAllocation: number;
    portfolioDelta: number;
    portfolioGamma: number;
    portfolioTheta: number;
    portfolioVega: number;
    portfolioRho: number;
    portfolioVaR: number;
    maxDrawdown: number;
    sharpeRatio: number;
    activeStrategies: number;
    strategyBreakdown: StrategyBreakdown[];
    totalMarginUsed: number;
    availableMargin: number;
    marginUtilization: number;
    nearTermExpirations: ExpirationBucket[];
    totalReturn: number;
    dailyPnL: number;
    monthlyPnL: number;
    yearToDatePnL: number;
    lastUpdated: Date;
    dataQuality: number;
    warnings?: string[];
}
export interface StrategyBreakdown {
    strategyType: StrategyType;
    count: number;
    totalNotional: number;
    totalMargin: number;
    netPnL: number;
}
export interface ExpirationBucket {
    expirationDate: Date;
    daysToExpiration: number;
    positionCount: number;
    totalNotional: number;
    totalGamma: number;
    totalTheta: number;
    rollRisk: number;
}
export interface GreeksCalculationRequest {
    instrumentId: string;
    underlyingPrice?: number;
    volatility?: number;
    riskFreeRate?: number;
    dividendYield?: number;
    calculationMethod?: VolatilityModel;
}
export interface ImpliedVolatilityRequest {
    instrumentId: string;
    optionPrice: number;
    underlyingPrice?: number;
    timeToExpiration?: number;
    riskFreeRate?: number;
    dividendYield?: number;
}
export interface StrategyBuilderRequest {
    tenantId: string;
    portfolioId?: string;
    strategyType: StrategyType;
    underlyingSymbol: string;
    legs: StrategyLegRequest[];
    targetPrice?: number;
    riskTolerance?: number;
    timeHorizon?: number;
}
export interface StrategyLegRequest {
    optionType?: 'CALL' | 'PUT';
    side: 'BUY' | 'SELL';
    quantity: number;
    strikePrice?: number;
    expirationDate?: Date;
    instrumentId?: string;
}
export interface DerivativesSearchRequest {
    tenantId: string;
    underlyingSymbol?: string;
    derivativeTypes?: DerivativeType[];
    optionTypes?: ('CALL' | 'PUT')[];
    strikePriceMin?: number;
    strikePriceMax?: number;
    premiumMin?: number;
    premiumMax?: number;
    expirationDateMin?: Date;
    expirationDateMax?: Date;
    daysToExpirationMin?: number;
    daysToExpirationMax?: number;
    deltaMin?: number;
    deltaMax?: number;
    gammaMin?: number;
    gammaMax?: number;
    thetaMin?: number;
    thetaMax?: number;
    vegaMin?: number;
    vegaMax?: number;
    impliedVolatilityMin?: number;
    impliedVolatilityMax?: number;
    volumeMin?: number;
    openInterestMin?: number;
    bidAskSpreadMax?: number;
    limit?: number;
    offset?: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}
export interface DerivativesSearchResult {
    instruments: DerivativeInstrument[];
    total: number;
    aggregateMetrics: {
        averageDelta: number;
        averageGamma: number;
        averageTheta: number;
        averageVega: number;
        averageIV: number;
        totalVolume: number;
        totalOpenInterest: number;
    };
    pagination: {
        limit: number;
        offset: number;
        hasMore: boolean;
    };
}
