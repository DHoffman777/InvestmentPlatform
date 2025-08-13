// Instrument Reference Data Models
// Comprehensive instrument master data and corporate actions processing

export interface InstrumentMaster {
  id: string;
  instrumentId: string; // Primary identifier (CUSIP, ISIN, etc.)
  
  // Identifiers
  cusip?: string;
  isin?: string;
  sedol?: string;
  ticker?: string;
  bloombergId?: string;
  refinitivRic?: string;
  
  // Basic information
  name: string;
  shortName?: string;
  description?: string;
  instrumentType: InstrumentType;
  securityType: SecurityType;
  
  // Issuer information
  issuerId?: string;
  issuerName: string;
  issuerCountry?: string;
  issuerIndustry?: string;
  
  // Market information
  primaryExchange?: string;
  secondaryExchanges?: string[];
  tradingCurrency: string;
  denominationCurrency?: string;
  countryOfRisk?: string;
  
  // Status and lifecycle
  issuedDate?: Date;
  maturityDate?: Date;
  firstTradingDate?: Date;
  lastTradingDate?: Date;
  isActive: boolean;
  isDelisted: boolean;
  delistingDate?: Date;
  delistingReason?: string;
  
  // Corporate structure
  parentInstrumentId?: string;
  relatedInstruments?: RelatedInstrument[];
  
  // Data quality and sources
  dataSource: string;
  dataVendor: string;
  lastUpdated: Date;
  dataQuality: DataQualityScore;
  
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

export interface RelatedInstrument {
  instrumentId: string;
  relationshipType: InstrumentRelationshipType;
  description?: string;
  effectiveDate?: Date;
  endDate?: Date;
}

export interface InstrumentAttributes {
  instrumentId: string;
  
  // Trading characteristics
  lotSize?: number;
  minimumTradingUnit?: number;
  tickSize?: number;
  priceMultiplier?: number;
  
  // Risk attributes
  volatility?: number;
  beta?: number;
  sharpeRatio?: number;
  valueAtRisk?: number;
  
  // Liquidity metrics
  averageDailyVolume?: number;
  bidAskSpread?: number;
  marketCapitalization?: number;
  liquidityTier?: string;
  
  // Fundamental data (for equities)
  sharesOutstanding?: number;
  floatShares?: number;
  dividendYield?: number;
  priceEarningsRatio?: number;
  priceBookRatio?: number;
  
  // Fixed income specific
  faceValue?: number;
  couponRate?: number;
  duration?: number;
  modifiedDuration?: number;
  convexity?: number;
  yieldToMaturity?: number;
  creditRating?: string;
  
  // Options specific
  underlyingInstrumentId?: string;
  strikePrice?: number;
  expirationDate?: Date;
  optionType?: 'CALL' | 'PUT';
  impliedVolatility?: number;
  
  // Metadata
  lastUpdated: Date;
  dataSource: string;
}

export interface CorporateAction {
  id: string;
  instrumentId: string;
  tenantId: string;
  
  // Action details
  actionType: CorporateActionType;
  actionCode: string;
  description: string;
  announcementDate: Date;
  
  // Key dates
  exDate: Date;
  recordDate: Date;
  payableDate?: Date;
  effectiveDate?: Date;
  
  // Action specifics
  actionDetails: CorporateActionDetails;
  
  // Status
  status: CorporateActionStatus;
  processingStatus: ProcessingStatus;
  
  // Data source
  dataSource: string;
  sourceReference?: string;
  
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
  processedAt?: Date;
  processedBy?: string;
}

export interface CorporateActionDetails {
  // Dividend details
  dividendAmount?: number;
  dividendCurrency?: string;
  dividendType?: 'REGULAR' | 'SPECIAL' | 'LIQUIDATING' | 'RETURN_OF_CAPITAL';
  
  // Stock split/stock dividend details
  splitRatio?: number;
  oldShares?: number;
  newShares?: number;
  
  // Spin-off details
  spinoffInstrumentId?: string;
  spinoffRatio?: number;
  
  // Merger/acquisition details
  acquiringInstrumentId?: string;
  cashPerShare?: number;
  stockRatio?: number;
  
  // Rights offering details
  rightsRatio?: number;
  subscriptionPrice?: number;
  rightsExpirationDate?: Date;
  
  // Bond specific
  interestAmount?: number;
  principalAmount?: number;
  
  // Tax information
  taxableAmount?: number;
  taxExemptAmount?: number;
  foreignTaxCredit?: number;
  
  // Additional metadata
  notes?: string;
  attachments?: string[];
}

export interface MarketDataSnapshot {
  instrumentId: string;
  asOfDate: Date;
  asOfTime: Date;
  
  // Price data
  lastPrice?: number;
  openPrice?: number;
  highPrice?: number;
  lowPrice?: number;
  closePrice?: number;
  previousClose?: number;
  change?: number;
  changePercent?: number;
  
  // Volume data
  volume?: number;
  averageVolume?: number;
  volumeWeightedAveragePrice?: number;
  
  // Bid/Ask data
  bidPrice?: number;
  bidSize?: number;
  askPrice?: number;
  askSize?: number;
  
  // Market status
  marketStatus: MarketStatus;
  tradingSession?: string;
  
  // Data quality
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
  
  // Target mapping
  targetInstrumentId: string;
  mappingType: MappingType;
  mappingConfidence: number; // 0-100
  
  // Validation
  isValidated: boolean;
  validatedBy?: string;
  validatedAt?: Date;
  
  // Status
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Enums and Types
export type InstrumentType = 
  | 'EQUITY'
  | 'BOND'
  | 'MONEY_MARKET'
  | 'MUTUAL_FUND'
  | 'ETF'
  | 'OPTION'
  | 'FUTURE'
  | 'SWAP'
  | 'FORWARD'
  | 'COMMODITY'
  | 'CURRENCY'
  | 'INDEX'
  | 'WARRANT'
  | 'CERTIFICATE'
  | 'STRUCTURED_PRODUCT';

export type SecurityType =
  | 'COMMON_STOCK'
  | 'PREFERRED_STOCK'
  | 'GOVERNMENT_BOND'
  | 'CORPORATE_BOND'
  | 'MUNICIPAL_BOND'
  | 'TREASURY_BILL'
  | 'MONEY_MARKET_FUND'
  | 'MUTUAL_FUND'
  | 'ETF'
  | 'REIT'
  | 'MLP'
  | 'ADR'
  | 'GDR'
  | 'CALL_OPTION'
  | 'PUT_OPTION'
  | 'FUTURE_CONTRACT'
  | 'SWAP_CONTRACT';

export type InstrumentRelationshipType =
  | 'PARENT_CHILD'
  | 'UNDERLYING_DERIVATIVE'
  | 'CONVERSION'
  | 'SPLIT_FROM'
  | 'SPLIT_TO'
  | 'MERGER_FROM'
  | 'MERGER_TO'
  | 'SPINOFF_FROM'
  | 'SPINOFF_TO'
  | 'SUCCESSOR'
  | 'PREDECESSOR';

export type CorporateActionType =
  | 'DIVIDEND'
  | 'STOCK_SPLIT'
  | 'STOCK_DIVIDEND'
  | 'RIGHTS_OFFERING'
  | 'SPINOFF'
  | 'MERGER'
  | 'ACQUISITION'
  | 'TENDER_OFFER'
  | 'LIQUIDATION'
  | 'BANKRUPTCY'
  | 'DELISTING'
  | 'NAME_CHANGE'
  | 'TICKER_CHANGE'
  | 'INTEREST_PAYMENT'
  | 'PRINCIPAL_PAYMENT'
  | 'CALL'
  | 'PUT'
  | 'MATURITY';

export type CorporateActionStatus =
  | 'ANNOUNCED'
  | 'CONFIRMED'
  | 'EFFECTIVE'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'PENDING';

export type ProcessingStatus =
  | 'PENDING'
  | 'IN_PROGRESS'
  | 'PROCESSED'
  | 'FAILED'
  | 'REQUIRES_MANUAL_REVIEW';

export type MarketStatus =
  | 'OPEN'
  | 'CLOSED'
  | 'PRE_MARKET'
  | 'POST_MARKET'
  | 'HALTED'
  | 'SUSPENDED'
  | 'DELAYED';

export type DataQualityScore =
  | 'EXCELLENT'
  | 'GOOD'
  | 'FAIR'
  | 'POOR'
  | 'UNVERIFIED';

export type MappingType =
  | 'EXACT_MATCH'
  | 'FUZZY_MATCH'
  | 'MANUAL_MAPPING'
  | 'ALGORITHMIC_MAPPING';

// Request/Response interfaces
export interface CreateInstrumentRequest {
  instrumentId: string;
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
  instrumentId: string;
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
  instrumentId: string;
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
    instrumentId: string;
    updates: Partial<InstrumentMaster>;
  }>;
  tenantId: string;
  updatedBy: string;
}

export interface InstrumentValidationResult {
  instrumentId: string;
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
    instrumentId: string;
    quantity: number;
  }>;
  taxImplications: {
    taxableAmount: number;
    taxExemptAmount: number;
    foreignTaxCredit?: number;
  };
}

export interface DataQualityReport {
  instrumentId: string;
  overallQuality: DataQualityScore;
  fieldQuality: Record<string, DataQualityScore>;
  missingFields: string[];
  inconsistencies: string[];
  lastValidated: Date;
  validatedBy?: string;
  recommendations: string[];
}

// Utility interfaces
export interface IdentifierValidation {
  identifier: string;
  identifierType: string;
  isValid: boolean;
  checkDigitValid?: boolean;
  formatValid: boolean;
  errors: string[];
}

export interface MarketDataQuality {
  instrumentId: string;
  asOfDate: Date;
  priceQuality: DataQualityScore;
  volumeQuality: DataQualityScore;
  completeness: number; // 0-100
  timeliness: number; // minutes delay
  accuracy: number; // 0-100
  dataVendor: string;
}

// Constants
export const STANDARD_EXCHANGES = {
  US: {
    NYSE: 'New York Stock Exchange',
    NASDAQ: 'NASDAQ',
    AMEX: 'American Stock Exchange',
    BATS: 'BATS Global Markets',
    IEX: 'Investors Exchange'
  },
  INTERNATIONAL: {
    LSE: 'London Stock Exchange',
    TSE: 'Tokyo Stock Exchange',
    HKE: 'Hong Kong Exchange',
    FSE: 'Frankfurt Stock Exchange',
    TSX: 'Toronto Stock Exchange'
  }
};

export const CURRENCY_CODES = [
  'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'HKD', 'SGD'
];

export const STANDARD_DATA_VENDORS = [
  'Bloomberg',
  'Refinitiv',
  'Morningstar',
  'FactSet',
  'S&P Market Intelligence',
  'Quandl',
  'Alpha Vantage',
  'IEX Cloud',
  'Yahoo Finance',
  'Internal'
];