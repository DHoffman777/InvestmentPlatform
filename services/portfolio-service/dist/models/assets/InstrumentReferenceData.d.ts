export interface InstrumentMaster {
    id: string;
    securityId: string;
    cusip?: string;
    isin?: string;
    sedol?: string;
    ticker?: string;
    bloombergId?: string;
    refinitivRic?: string;
    name: string;
    shortName?: string;
    description?: string;
    instrumentType: InstrumentType;
    securityType: SecurityType;
    issuerId?: string;
    issuerName: string;
    issuerCountry?: string;
    issuerIndustry?: string;
    primaryExchange?: string;
    secondaryExchanges?: string[];
    tradingCurrency: string;
    denominationCurrency?: string;
    countryOfRisk?: string;
    issuedDate?: Date;
    maturityDate?: Date;
    firstTradingDate?: Date;
    lastTradingDate?: Date;
    isActive: boolean;
    isDelisted: boolean;
    delistingDate?: Date;
    delistingReason?: string;
    parentInstrumentId?: string;
    relatedInstruments?: RelatedInstrument[];
    dataSource: string;
    dataVendor: string;
    lastUpdated: Date;
    dataQuality: DataQualityScore;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
}
export interface RelatedInstrument {
    securityId: string;
    relationshipType: InstrumentRelationshipType;
    description?: string;
    effectiveDate?: Date;
    endDate?: Date;
}
export interface InstrumentAttributes {
    securityId: string;
    lotSize?: number;
    minimumTradingUnit?: number;
    tickSize?: number;
    priceMultiplier?: number;
    volatility?: number;
    beta?: number;
    sharpeRatio?: number;
    valueAtRisk?: number;
    averageDailyVolume?: number;
    bidAskSpread?: number;
    marketCapitalization?: number;
    liquidityTier?: string;
    sharesOutstanding?: number;
    floatShares?: number;
    dividendYield?: number;
    priceEarningsRatio?: number;
    priceBookRatio?: number;
    faceValue?: number;
    couponRate?: number;
    duration?: number;
    modifiedDuration?: number;
    convexity?: number;
    yieldToMaturity?: number;
    creditRating?: string;
    underlyingInstrumentId?: string;
    strikePrice?: number;
    expirationDate?: Date;
    optionType?: 'CALL' | 'PUT';
    impliedVolatility?: number;
    lastUpdated: Date;
    dataSource: string;
}
export interface CorporateAction {
    id: string;
    securityId: string;
    tenantId: string;
    actionType: CorporateActionType;
    actionCode: string;
    description: string;
    announcementDate: Date;
    exDate: Date;
    recordDate: Date;
    payableDate?: Date;
    effectiveDate?: Date;
    actionDetails: CorporateActionDetails;
    status: CorporateActionStatus;
    processingStatus: ProcessingStatus;
    dataSource: string;
    sourceReference?: string;
    createdAt: Date;
    updatedAt: Date;
    processedAt?: Date;
    processedBy?: string;
}
export interface CorporateActionDetails {
    dividendAmount?: number;
    dividendCurrency?: string;
    dividendType?: 'REGULAR' | 'SPECIAL' | 'LIQUIDATING' | 'RETURN_OF_CAPITAL';
    splitRatio?: number;
    oldShares?: number;
    newShares?: number;
    spinoffInstrumentId?: string;
    spinoffRatio?: number;
    acquiringInstrumentId?: string;
    cashPerShare?: number;
    stockRatio?: number;
    rightsRatio?: number;
    subscriptionPrice?: number;
    rightsExpirationDate?: Date;
    interestAmount?: number;
    principalAmount?: number;
    taxableAmount?: number;
    taxExemptAmount?: number;
    foreignTaxCredit?: number;
    notes?: string;
    attachments?: string[];
}
export interface MarketDataSnapshot {
    securityId: string;
    asOfDate: Date;
    asOfTime: Date;
    lastPrice?: number;
    openPrice?: number;
    highPrice?: number;
    lowPrice?: number;
    closePrice?: number;
    previousClose?: number;
    change?: number;
    changePercent?: number;
    volume?: number;
    averageVolume?: number;
    volumeWeightedAveragePrice?: number;
    bidPrice?: number;
    bidSize?: number;
    askPrice?: number;
    askSize?: number;
    marketStatus: MarketStatus;
    tradingSession?: string;
    dataSource: string;
    dataVendor: string;
    dataQuality: DataQualityScore;
    lastUpdated: Date;
}
export interface InstrumentMapping {
    id: string;
    sourceSystem: string;
    sourceIdentifier: string;
    sourceInstrumentType: string;
    targetInstrumentId: string;
    mappingType: MappingType;
    mappingConfidence: number;
    isValidated: boolean;
    validatedBy?: string;
    validatedAt?: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export type InstrumentType = 'EQUITY' | 'BOND' | 'MONEY_MARKET' | 'MUTUAL_FUND' | 'ETF' | 'OPTION' | 'FUTURE' | 'SWAP' | 'FORWARD' | 'COMMODITY' | 'CURRENCY' | 'INDEX' | 'WARRANT' | 'CERTIFICATE' | 'STRUCTURED_PRODUCT';
export type SecurityType = 'COMMON_STOCK' | 'PREFERRED_STOCK' | 'GOVERNMENT_BOND' | 'CORPORATE_BOND' | 'MUNICIPAL_BOND' | 'TREASURY_BILL' | 'MONEY_MARKET_FUND' | 'MUTUAL_FUND' | 'ETF' | 'REIT' | 'MLP' | 'ADR' | 'GDR' | 'CALL_OPTION' | 'PUT_OPTION' | 'FUTURE_CONTRACT' | 'SWAP_CONTRACT';
export type InstrumentRelationshipType = 'PARENT_CHILD' | 'UNDERLYING_DERIVATIVE' | 'CONVERSION' | 'SPLIT_FROM' | 'SPLIT_TO' | 'MERGER_FROM' | 'MERGER_TO' | 'SPINOFF_FROM' | 'SPINOFF_TO' | 'SUCCESSOR' | 'PREDECESSOR';
export type CorporateActionType = 'DIVIDEND' | 'STOCK_SPLIT' | 'STOCK_DIVIDEND' | 'RIGHTS_OFFERING' | 'SPINOFF' | 'MERGER' | 'ACQUISITION' | 'TENDER_OFFER' | 'LIQUIDATION' | 'BANKRUPTCY' | 'DELISTING' | 'NAME_CHANGE' | 'TICKER_CHANGE' | 'INTEREST_PAYMENT' | 'PRINCIPAL_PAYMENT' | 'CALL' | 'PUT' | 'MATURITY';
export type CorporateActionStatus = 'ANNOUNCED' | 'CONFIRMED' | 'EFFECTIVE' | 'COMPLETED' | 'CANCELLED' | 'PENDING';
export type ProcessingStatus = 'PENDING' | 'IN_PROGRESS' | 'PROCESSED' | 'FAILED' | 'REQUIRES_MANUAL_REVIEW';
export type MarketStatus = 'OPEN' | 'CLOSED' | 'PRE_MARKET' | 'POST_MARKET' | 'HALTED' | 'SUSPENDED' | 'DELAYED';
export type DataQualityScore = 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'UNVERIFIED';
export type MappingType = 'EXACT_MATCH' | 'FUZZY_MATCH' | 'MANUAL_MAPPING' | 'ALGORITHMIC_MAPPING';
export interface CreateInstrumentRequest {
    securityId: string;
    identifiers: {
        cusip?: string;
        isin?: string;
        sedol?: string;
        ticker?: string;
        bloombergId?: string;
        refinitivRic?: string;
    };
    name: string;
    shortName?: string;
    description?: string;
    instrumentType: InstrumentType;
    securityType: SecurityType;
    issuerName: string;
    issuerCountry?: string;
    primaryExchange?: string;
    tradingCurrency: string;
    dataSource: string;
    dataVendor: string;
    tenantId: string;
    createdBy: string;
}
export interface UpdateInstrumentRequest {
    securityId: string;
    updates: Partial<InstrumentMaster>;
    tenantId: string;
    updatedBy: string;
}
export interface SearchInstrumentRequest {
    query?: string;
    identifiers?: {
        cusip?: string;
        isin?: string;
        sedol?: string;
        ticker?: string;
    };
    instrumentType?: InstrumentType[];
    securityType?: SecurityType[];
    exchange?: string[];
    currency?: string[];
    isActive?: boolean;
    limit?: number;
    offset?: number;
    tenantId: string;
}
export interface ProcessCorporateActionRequest {
    securityId: string;
    actionType: CorporateActionType;
    announcementDate: Date;
    exDate: Date;
    recordDate: Date;
    payableDate?: Date;
    actionDetails: CorporateActionDetails;
    dataSource: string;
    tenantId: string;
    processedBy: string;
}
export interface InstrumentLookupRequest {
    identifier: string;
    identifierType: 'CUSIP' | 'ISIN' | 'SEDOL' | 'TICKER' | 'BLOOMBERG' | 'RIC';
    tenantId: string;
}
export interface BulkInstrumentUpdateRequest {
    instruments: Array<{
        securityId: string;
        updates: Partial<InstrumentMaster>;
    }>;
    tenantId: string;
    updatedBy: string;
}
export interface InstrumentValidationResult {
    securityId: string;
    isValid: boolean;
    errors: string[];
    warnings?: string[];
    suggestions?: string[];
    dataQuality: DataQualityScore;
}
export interface InstrumentSearchResult {
    instruments: InstrumentMaster[];
    total: number;
    hasMore: boolean;
    searchQuery?: string;
    filters: any;
}
export interface CorporateActionImpact {
    positionId: string;
    originalQuantity: number;
    newQuantity: number;
    cashAmount?: number;
    newInstruments?: Array<{
        securityId: string;
        quantity: number;
    }>;
    taxImplications: {
        taxableAmount: number;
        taxExemptAmount: number;
        foreignTaxCredit?: number;
    };
}
export interface DataQualityReport {
    securityId: string;
    overallQuality: DataQualityScore;
    fieldQuality: Record<string, DataQualityScore>;
    missingFields: string[];
    inconsistencies: string[];
    lastValidated: Date;
    validatedBy?: string;
    recommendations: string[];
}
export interface IdentifierValidation {
    identifier: string;
    identifierType: string;
    isValid: boolean;
    checkDigitValid?: boolean;
    formatValid: boolean;
    errors: string[];
}
export interface MarketDataQuality {
    securityId: string;
    asOfDate: Date;
    priceQuality: DataQualityScore;
    volumeQuality: DataQualityScore;
    completeness: number;
    timeliness: number;
    accuracy: number;
    dataVendor: string;
}
export declare const STANDARD_EXCHANGES: {
    US: {
        NYSE: string;
        NASDAQ: string;
        AMEX: string;
        BATS: string;
        IEX: string;
    };
    INTERNATIONAL: {
        LSE: string;
        TSE: string;
        HKE: string;
        FSE: string;
        TSX: string;
    };
};
export declare const CURRENCY_CODES: string[];
export declare const STANDARD_DATA_VENDORS: string[];
