// Asset Classification and Categorization System
// Provides comprehensive taxonomy for investment instruments

export interface AssetClass {
  id: string;
  name: string;
  code: string;
  description: string | null;
  parentClassId?: string | null;
  level: number; // Hierarchy level (1 = top level, 2 = sub-class, etc.)
  
  // Classification attributes
  assetType: 'EQUITY' | 'FIXED_INCOME' | 'CASH_EQUIVALENT' | 'ALTERNATIVE' | 'DERIVATIVE' | 'STRUCTURED_PRODUCT' | 'COMMODITY' | 'REAL_ESTATE';
  riskLevel: 'CONSERVATIVE' | 'MODERATE_CONSERVATIVE' | 'MODERATE' | 'MODERATE_AGGRESSIVE' | 'AGGRESSIVE';
  liquidityTier: 'TIER_1' | 'TIER_2' | 'TIER_3' | 'TIER_4';
  
  // Regulatory classifications
  regulatoryCategory?: string;
  secClassification?: string;
  
  // Investment characteristics
  minimumInvestment?: number;
  typicalHoldingPeriod?: string;
  
  // Status and metadata
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
  
  // Specific characteristics
  characteristics: AssetCharacteristics;
  
  // Performance benchmarks
  primaryBenchmark?: string;
  secondaryBenchmarks?: string[];
  
  // Risk metrics
  expectedReturn?: number;
  volatility?: number;
  sharpeRatio?: number;
  maxDrawdown?: number;
  
  // Correlation data
  correlationToMarket?: number;
  correlationToBonds?: number;
  
  // Status
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AssetCharacteristics {
  // Income generation
  incomeGenerating: boolean;
  incomeFrequency?: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL' | 'IRREGULAR';
  averageYield?: number;
  
  // Growth characteristics
  growthOriented: boolean;
  capitalAppreciationPotential: 'LOW' | 'MODERATE' | 'HIGH' | 'VERY_HIGH';
  
  // Market characteristics
  marketCapSensitive: boolean;
  interestRateSensitive: boolean;
  inflationSensitive: boolean;
  currencySensitive: boolean;
  
  // Sector/geographic exposure
  sectorExposure?: string[];
  geographicExposure?: string[];
  
  // Tax characteristics
  taxAdvantaged: boolean;
  taxDeferral: boolean;
  
  // Liquidity characteristics
  dailyLiquidity: boolean;
  settlementPeriod: number; // Days
  tradingHours?: string;
}

export interface InstrumentClassification {
  id: string;
  instrumentId: string; // External instrument identifier
  securityId?: string | null; // Internal security reference
  symbol?: string;
  instrumentName: string;
  
  // Primary classification
  assetClassId: string;
  assetSubClassId?: string;
  
  // Multiple classification dimensions
  classifications: ClassificationDimension[];
  
  // Sector/Industry classification
  gicsCode?: string; // Global Industry Classification Standard
  gicsSector?: string;
  gicsIndustryGroup?: string;
  gicsIndustry?: string;
  gicsSubIndustry?: string;
  
  // Geographic classification
  countryCode?: string;
  regionCode?: string;
  developedMarket: boolean;
  
  // Market capitalization (for equities)
  marketCapCategory?: 'LARGE_CAP' | 'MID_CAP' | 'SMALL_CAP' | 'MICRO_CAP';
  
  // Style classification (for equities)
  styleClassification?: 'VALUE' | 'GROWTH' | 'BLEND';
  
  // Credit quality (for fixed income)
  creditRating?: string;
  investmentGrade?: boolean;
  
  // ESG classification
  esgScore?: number;
  esgRating?: string;
  sustainabilityCompliant: boolean;
  
  // Regulatory classifications
  accreditedInvestorOnly: boolean;
  institutionalOnly: boolean;
  retailSuitable: boolean;
  
  // Market Data
  primaryExchange?: string;
  currency: string;
  
  // Classification Metadata
  reviewFrequency: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL';
  
  // Additional fields
  tenantId: string;
  emergingMarket?: boolean;
  
  // Status and metadata
  classificationDate: Date;
  lastReviewDate: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ClassificationDimension {
  dimension: string; // e.g., 'MORNINGSTAR_CATEGORY', 'LIPPER_CATEGORY', 'CUSTOM_STRATEGY'
  code: string;
  name: string;
  confidence: number; // 0-100, how confident we are in this classification
  source: string; // Data provider or classification authority
  lastUpdated: Date;
}

export interface AssetAllocation {
  id: string;
  portfolioId?: string;
  name: string;
  description?: string;
  
  // Allocation targets
  allocations: AllocationTarget[];
  
  // Constraints
  constraints: AllocationConstraint[];
  
  // Rebalancing rules
  rebalancingThreshold: number; // Percentage deviation before rebalancing
  rebalancingFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY' | 'TACTICAL';
  
  // Model characteristics
  riskProfile: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE' | 'VERY_AGGRESSIVE';
  timeHorizon: 'SHORT' | 'MEDIUM' | 'LONG' | 'VERY_LONG';
  
  // Status
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
  
  // Strategic vs tactical allocation
  isStrategic: boolean;
  tacticalAdjustment?: number; // Temporary deviation from strategic target
  
  // Metadata
  rationale?: string;
  lastReviewDate?: Date;
}

export interface AllocationConstraint {
  type: 'MIN_ALLOCATION' | 'MAX_ALLOCATION' | 'MAX_CONCENTRATION' | 'MIN_DIVERSIFICATION' | 'ESG_MINIMUM' | 'SECTOR_LIMIT' | 'GEOGRAPHIC_LIMIT';
  target: string; // What the constraint applies to (asset class, sector, instrument, etc.)
  value: number;
  unit: 'PERCENTAGE' | 'DOLLAR_AMOUNT' | 'COUNT';
  description: string;
  isHard: boolean; // Hard constraint (cannot be violated) vs soft constraint (warning)
}

// Request/Response interfaces
export interface ClassifyInstrumentRequest {
  instrumentId: string; // External instrument identifier
  securityId?: string;
  symbol?: string;
  instrumentName: string;
  instrumentType: string;
  additionalData?: Record<string, any>;
  tenantId: string;
  classifiedBy: string;
}

export interface UpdateClassificationRequest {
  instrumentId: string; // External instrument identifier
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
  
  // Asset class breakdown
  assetClassAllocation: AllocationBreakdown[];
  
  // Geographic breakdown
  geographicAllocation: AllocationBreakdown[];
  
  // Sector breakdown (for equities)
  sectorAllocation: AllocationBreakdown[];
  
  // Style analysis (for equities)
  styleAllocation: AllocationBreakdown[];
  
  // Quality breakdown (for fixed income)
  creditQualityAllocation: AllocationBreakdown[];
  
  // ESG analysis
  esgScore: number;
  esgAllocation: AllocationBreakdown[];
  
  // Risk metrics
  portfolioRiskLevel: string;
  diversificationScore: number;
  concentrationRisk: ConcentrationRisk[];
  
  // Compliance
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

// Predefined asset classes
export const STANDARD_ASSET_CLASSES = {
  EQUITY: {
    DOMESTIC_LARGE_CAP: 'Domestic Large Cap Equity',
    DOMESTIC_MID_CAP: 'Domestic Mid Cap Equity',
    DOMESTIC_SMALL_CAP: 'Domestic Small Cap Equity',
    INTERNATIONAL_DEVELOPED: 'International Developed Equity',
    EMERGING_MARKETS: 'Emerging Markets Equity',
    REAL_ESTATE: 'Real Estate Investment Trusts'
  },
  FIXED_INCOME: {
    GOVERNMENT_BONDS: 'Government Bonds',
    CORPORATE_BONDS: 'Corporate Bonds',
    HIGH_YIELD_BONDS: 'High Yield Bonds',
    MUNICIPAL_BONDS: 'Municipal Bonds',
    INTERNATIONAL_BONDS: 'International Bonds',
    TREASURY_BILLS: 'Treasury Bills'
  },
  CASH_EQUIVALENT: {
    MONEY_MARKET: 'Money Market Funds',
    BANK_DEPOSITS: 'Bank Deposits',
    COMMERCIAL_PAPER: 'Commercial Paper'
  },
  ALTERNATIVE: {
    PRIVATE_EQUITY: 'Private Equity',
    HEDGE_FUNDS: 'Hedge Funds',
    COMMODITIES: 'Commodities',
    INFRASTRUCTURE: 'Infrastructure',
    PRIVATE_DEBT: 'Private Debt'
  }
};

// Validation interface
export interface ClassificationValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
  suggestions?: string[];
}