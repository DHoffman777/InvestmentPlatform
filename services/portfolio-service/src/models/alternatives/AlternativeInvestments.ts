// Alternative Investments Models
// Phase 4.2 - Comprehensive alternative investments support including private equity, hedge funds, real estate, and infrastructure

// Alternative Investment Types
export enum AlternativeInvestmentType {
  PRIVATE_EQUITY = 'PRIVATE_EQUITY',
  HEDGE_FUND = 'HEDGE_FUND',
  VENTURE_CAPITAL = 'VENTURE_CAPITAL',
  REAL_ESTATE = 'REAL_ESTATE',
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  COMMODITY_FUND = 'COMMODITY_FUND',
  PRIVATE_DEBT = 'PRIVATE_DEBT',
  FUND_OF_FUNDS = 'FUND_OF_FUNDS',
  DIRECT_INVESTMENT = 'DIRECT_INVESTMENT',
  REIT_PRIVATE = 'REIT_PRIVATE'
}

export enum InvestmentStage {
  SEED = 'SEED',
  SERIES_A = 'SERIES_A',
  SERIES_B = 'SERIES_B',
  SERIES_C = 'SERIES_C',
  LATE_STAGE = 'LATE_STAGE',
  GROWTH = 'GROWTH',
  BUYOUT = 'BUYOUT',
  DISTRESSED = 'DISTRESSED',
  TURNAROUND = 'TURNAROUND',
  MEZZANINE = 'MEZZANINE'
}

export enum FundStatus {
  FUNDRAISING = 'FUNDRAISING',
  INVESTING = 'INVESTING',
  HARVESTING = 'HARVESTING',
  LIQUIDATING = 'LIQUIDATING',
  CLOSED = 'CLOSED'
}

export enum CommitmentStatus {
  COMMITTED = 'COMMITTED',
  CALLED = 'CALLED',
  INVESTED = 'INVESTED',
  REALIZED = 'REALIZED',
  WRITTEN_OFF = 'WRITTEN_OFF'
}

export enum DistributionType {
  CASH = 'CASH',
  STOCK = 'STOCK',
  PIK = 'PIK', // Payment in Kind
  RETURN_OF_CAPITAL = 'RETURN_OF_CAPITAL',
  CAPITAL_GAIN = 'CAPITAL_GAIN'
}

export enum ValuationMethod {
  MARKET_MULTIPLE = 'MARKET_MULTIPLE',
  DCF = 'DCF', // Discounted Cash Flow
  TRANSACTION_MULTIPLE = 'TRANSACTION_MULTIPLE',
  ASSET_BASED = 'ASSET_BASED',
  COST_BASIS = 'COST_BASIS',
  THIRD_PARTY = 'THIRD_PARTY',
  MARK_TO_MARKET = 'MARK_TO_MARKET'
}

export enum GeographicFocus {
  NORTH_AMERICA = 'NORTH_AMERICA',
  EUROPE = 'EUROPE',
  ASIA_PACIFIC = 'ASIA_PACIFIC',
  EMERGING_MARKETS = 'EMERGING_MARKETS',
  GLOBAL = 'GLOBAL',
  CHINA = 'CHINA',
  INDIA = 'INDIA',
  LATIN_AMERICA = 'LATIN_AMERICA'
}

export enum SectorFocus {
  TECHNOLOGY = 'TECHNOLOGY',
  HEALTHCARE = 'HEALTHCARE',
  FINANCIAL_SERVICES = 'FINANCIAL_SERVICES',
  ENERGY = 'ENERGY',
  INDUSTRIALS = 'INDUSTRIALS',
  CONSUMER = 'CONSUMER',
  REAL_ESTATE = 'REAL_ESTATE',
  INFRASTRUCTURE = 'INFRASTRUCTURE',
  DIVERSIFIED = 'DIVERSIFIED'
}

// Core Alternative Investment Definition
export interface AlternativeInvestment {
  id: string;
  tenantId: string;
  
  // Basic Information
  investmentName: string;
  investmentType: AlternativeInvestmentType;
  fundName?: string;
  fundId?: string;
  generalPartner: string;
  administrator?: string;
  
  // Investment Details
  vintage: number; // Year
  fundSize?: number;
  currency: string;
  investmentStage?: InvestmentStage;
  
  // Geographic and Sector Focus
  geographicFocus: GeographicFocus[];
  sectorFocus: SectorFocus[];
  
  // Investment Terms
  commitment: number;
  managementFee: number; // Percentage
  carriedInterest: number; // Percentage
  hurdle?: number; // Hurdle rate percentage
  catchUp?: number; // Catch-up percentage
  
  // Key Dates
  commitmentDate: Date;
  firstClosingDate?: Date;
  finalClosingDate?: Date;
  investmentPeriod?: {
    startDate: Date;
    endDate: Date;
  };
  fundTerm: number; // Years
  
  // Current Status
  status: FundStatus;
  isActive: boolean;
  
  // Performance Metrics
  currentNAV?: number;
  totalCalled: number;
  totalDistributed: number;
  unrealizedValue: number;
  
  // Identifiers
  cusip?: string;
  isin?: string;
  lei?: string; // Legal Entity Identifier
  
  // Documentation
  documents: InvestmentDocument[];
  
  // Risk and ESG
  riskRating?: string;
  esgScore?: number;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  updatedBy: string;
}

// Capital Call and Distribution Tracking
export interface CapitalCall {
  id: string;
  investmentId: string;
  tenantId: string;
  
  // Call Details
  callNumber: number;
  callDate: Date;
  dueDate: Date;
  callAmount: number;
  
  // Purpose and allocation
  purpose: string;
  investmentAllocations: CallAllocation[];
  
  // Management
  managementFeeAmount?: number;
  expenseAmount?: number;
  
  // Status
  status: CommitmentStatus;
  fundedDate?: Date;
  fundedAmount?: number;
  
  // Interest and penalties
  interestRate?: number;
  penaltyRate?: number;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface CallAllocation {
  portfolioCompanyId?: string;
  portfolioCompanyName?: string;
  allocationAmount: number;
  allocationPercentage: number;
  purpose: string;
}

export interface Distribution {
  id: string;
  investmentId: string;
  tenantId: string;
  
  // Distribution Details
  distributionNumber: number;
  distributionDate: Date;
  paymentDate: Date;
  totalAmount: number;
  
  // Distribution Components
  distributionComponents: DistributionComponent[];
  
  // Tax Information
  taxableAmount?: number;
  returnOfCapital?: number;
  capitalGain?: number;
  
  // Source
  sourceCompanies: DistributionSource[];
  
  // Status
  status: 'ANNOUNCED' | 'PAID' | 'PENDING' | 'CANCELLED';
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface DistributionComponent {
  type: DistributionType;
  amount: number;
  currency: string;
  description?: string;
}

export interface DistributionSource {
  portfolioCompanyId?: string;
  portfolioCompanyName?: string;
  sourceAmount: number;
  sourceType: 'EXIT' | 'DIVIDEND' | 'RECAPITALIZATION' | 'OTHER';
}

// NAV and Valuation Tracking
export interface NAVUpdate {
  id: string;
  investmentId: string;
  tenantId: string;
  
  // Valuation Details
  asOfDate: Date;
  reportingDate: Date;
  netAssetValue: number;
  sharePrice?: number;
  
  // Portfolio Level Metrics
  grossAssetValue: number;
  totalLiabilities: number;
  unrealizedGain: number;
  realizedGain: number;
  
  // Performance Metrics
  irr?: number; // Internal Rate of Return
  multiple?: number; // Investment Multiple
  pmeIndex?: number; // Public Market Equivalent
  
  // Valuation Methods
  valuationMethod: ValuationMethod;
  valuationSource: 'FUND_REPORT' | 'THIRD_PARTY' | 'INTERNAL' | 'AUDITED';
  
  // Portfolio Companies
  portfolioCompanies: PortfolioCompanyValuation[];
  
  // Quality Metrics
  confidenceLevel: 'HIGH' | 'MEDIUM' | 'LOW';
  dataQualityScore: number; // 0-100
  
  // Metadata  
  createdAt: Date;
  updatedBy: string;
}

export interface PortfolioCompanyValuation {
  companyId: string;
  companyName: string;
  sector: string;
  valuation: number;
  valuationMethod: ValuationMethod;
  ownership: number; // Percentage
  costBasis: number;
  unrealizedGain: number;
  isPartialRealization: boolean;
}

// Portfolio Company Management
export interface PortfolioCompany {
  id: string;
  investmentId: string;
  tenantId: string;
  
  // Company Details
  companyName: string;
  businessDescription: string;
  sector: SectorFocus;
  geography: GeographicFocus;
  
  // Investment Details
  initialInvestmentDate: Date;
  initialInvestmentAmount: number;
  currentOwnership: number;
  totalInvested: number;
  
  // Company Metrics
  currentRevenue?: number;
  currentEBITDA?: number;
  employeeCount?: number;
  
  // Key People
  ceo?: string;
  boardMembers: BoardMember[];
  
  // Investment Thesis
  investmentThesis: string;
  keyValueDrivers: string[];
  exitStrategy?: string;
  
  // Status
  status: 'ACTIVE' | 'EXITED' | 'WRITTEN_OFF' | 'BANKRUPTCY';
  
  // Performance
  performanceMetrics: CompanyPerformanceMetric[];
  
  // Exit Information
  exitDate?: Date;
  exitValuation?: number;
  exitMultiple?: number;
  exitType?: 'IPO' | 'TRADE_SALE' | 'SECONDARY' | 'WRITE_OFF';
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface BoardMember {
  name: string;
  role: string;
  appointedDate: Date;
  isIndependent: boolean;
}

export interface CompanyPerformanceMetric {
  metricName: string;
  value: number;
  unit: string;
  asOfDate: Date;
  isAudited: boolean;
}

// J-Curve Analysis
export interface JCurveAnalysis {
  id: string;
  investmentId: string;
  tenantId: string;
  
  // Analysis Parameters
  analysisDate: Date;
  timeHorizon: number; // Years
  
  // J-Curve Metrics
  jCurvePoints: JCurvePoint[];
  
  // Key Metrics
  bottomOfJCurve: {
    date: Date;
    irr: number;
    multiple: number;
  };
  
  crossoverPoint?: {
    date: Date;
    irr: number;
    multiple: number;
  };
  
  projectedFinalMetrics: {
    projectedIRR: number;
    projectedMultiple: number;
    confidenceInterval: {
      low: number;
      high: number;
    };
  };
  
  // Benchmarking
  peerGroupComparison?: {
    peerGroupName: string;
    relativeiRR: number;
    relativeMultiple: number;
  };
  
  createdAt: Date;
  updatedBy: string;
}

export interface JCurvePoint {
  date: Date;
  quartersSinceInception: number;
  cumulativeCashFlow: number;
  unrealizedValue: number;
  totalValue: number;
  irr: number;
  multiple: number;
}

// Alternative Investment Position
export interface AlternativeInvestmentPosition {
  id: string;
  tenantId: string;
  portfolioId: string;
  investmentId: string;
  
  // Position Details
  commitment: number;
  totalCalled: number;
  totalDistributed: number;
  currentNAV: number;
  unrealizedValue: number;
  
  // Performance
  currentIRR: number;
  currentMultiple: number;
  
  // Calculated Fields
  unfundedCommitment: number;
  distributedToInvested: number; // DPI
  residualToInvested: number; // RVPI
  totalToInvested: number; // TVPI
  
  // Cash Flow Summary
  totalCashInvested: number;
  totalCashReceived: number;
  netCashFlow: number;
  
  // Risk Metrics
  concentrationRisk: number;
  liquidityRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  
  // Status
  isActive: boolean;
  lastValuationDate: Date;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

// Due Diligence and Documentation
export interface InvestmentDocument {
  id: string;
  investmentId: string;
  
  // Document Details
  documentType: DocumentType;
  documentName: string;
  fileName: string;
  filePath: string;
  
  // Metadata
  uploadDate: Date;
  uploadedBy: string;
  fileSize: number;
  mimeType: string;
  
  // Classification
  confidentialityLevel: 'PUBLIC' | 'CONFIDENTIAL' | 'RESTRICTED';
  documentCategory: 'LEGAL' | 'FINANCIAL' | 'OPERATIONAL' | 'COMPLIANCE';
  
  // Versioning
  version: number;
  isLatestVersion: boolean;
  
  // Access Control
  accessList: string[];
  
  createdAt: Date;
}

export enum DocumentType {
  PRIVATE_PLACEMENT_MEMORANDUM = 'PRIVATE_PLACEMENT_MEMORANDUM',
  LIMITED_PARTNERSHIP_AGREEMENT = 'LIMITED_PARTNERSHIP_AGREEMENT',
  SUBSCRIPTION_AGREEMENT = 'SUBSCRIPTION_AGREEMENT',
  QUARTERLY_REPORT = 'QUARTERLY_REPORT',
  ANNUAL_REPORT = 'ANNUAL_REPORT',
  CAPITAL_CALL_NOTICE = 'CAPITAL_CALL_NOTICE',
  DISTRIBUTION_NOTICE = 'DISTRIBUTION_NOTICE',
  NAV_STATEMENT = 'NAV_STATEMENT',
  AUDIT_REPORT = 'AUDIT_REPORT',
  TAX_DOCUMENT = 'TAX_DOCUMENT',
  SIDE_LETTER = 'SIDE_LETTER',
  AMENDMENT = 'AMENDMENT'
}

// Fund Analytics and Reporting
export interface FundAnalytics {
  investmentId: string;
  tenantId: string;
  asOfDate: Date;
  
  // Performance Summary
  performanceSummary: {
    totalCommitment: number;
    totalCalled: number;
    totalDistributed: number;
    currentNAV: number;
    grossIRR: number;
    netIRR: number;
    grossMultiple: number;
    netMultiple: number;
    dpi: number; // Distributed to Paid-In
    rvpi: number; // Residual Value to Paid-In
    tvpi: number; // Total Value to Paid-In
  };
  
  // Benchmarking
  benchmarkComparison: {
    benchmarkName: string;
    benchmarkIRR: number;
    benchmarkMultiple: number;
    relativePerformance: number;
    percentileRanking: number;
  };
  
  // Risk Analysis
  riskMetrics: {
    volatility: number;
    downSideDeviation: number;
    maxDrawdown: number;
    sharpeRatio: number;
    betaToPublicMarkets?: number;
  };
  
  // Concentration Analysis
  concentrationMetrics: {
    portfolioCompanyCount: number;
    top5Concentration: number;
    top10Concentration: number;
    sectorConcentration: Record<string, number>;
    geographicConcentration: Record<string, number>;
  };
  
  // Cash Flow Analysis
  cashFlowMetrics: {
    averageHoldPeriod: number;
    timeToFirstDistribution: number;
    distributionFrequency: number;
    callingPattern: CallPattern[];
  };
  
  calculatedAt: Date;
  calculatedBy: string;
}

export interface CallPattern {
  year: number;
  quarterlyCallAmounts: number[];
  cumulativeCallRate: number;
}

// API Request/Response Types
export interface CreateAlternativeInvestmentRequest {
  investmentData: Omit<AlternativeInvestment, 'id' | 'createdAt' | 'updatedAt'>;
  initialCommitment?: {
    portfolioId: string;
    commitmentAmount: number;
  };
}

export interface AlternativeInvestmentSearchRequest {
  tenantId: string;
  investmentTypes?: AlternativeInvestmentType[];
  generalPartners?: string[];
  vintages?: number[];
  sectorFocus?: SectorFocus[];
  geographicFocus?: GeographicFocus[];
  fundStatuses?: FundStatus[];
  commitmentRange?: {
    min: number;
    max: number;
  };
  performanceMetrics?: {
    minIRR?: number;
    minMultiple?: number;
  };
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface AlternativeInvestmentSearchResponse {
  investments: AlternativeInvestment[];
  total: number;
  aggregations: {
    byInvestmentType: Record<AlternativeInvestmentType, number>;
    byVintage: Record<number, number>;
    bySectorFocus: Record<SectorFocus, number>;
    byGeographicFocus: Record<GeographicFocus, number>;
    totalCommitments: number;
    averageCommitment: number;
    totalNAV: number;
  };
  pagination: {
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

export interface PortfolioAlternativesAnalytics {
  portfolioId: string;
  tenantId: string;
  asOfDate: Date;
  
  // Portfolio Summary
  summary: {
    totalInvestments: number;
    totalCommitments: number;
    totalCalled: number;
    totalDistributed: number;
    totalNAV: number;
    unfundedCommitments: number;
    weightedAverageIRR: number;
    weightedAverageMultiple: number;
  };
  
  // Diversification
  diversification: {
    byInvestmentType: Record<AlternativeInvestmentType, number>;
    byVintage: Record<number, number>;
    bySector: Record<SectorFocus, number>;
    byGeography: Record<GeographicFocus, number>;
    byGeneralPartner: Record<string, number>;
  };
  
  // Performance Analytics
  performance: {
    topPerformers: {
      investmentId: string;
      investmentName: string;
      irr: number;
      multiple: number;
    }[];
    underPerformers: {
      investmentId: string;
      investmentName: string;
      irr: number;
      multiple: number;
    }[];
    vintagePerformance: Record<number, { irr: number; multiple: number; count: number }>;
  };
  
  // Liquidity and Cash Flow
  liquidityProfile: {
    expectedDistributions: {
      year: number;
      expectedAmount: number;
    }[];
    expectedCapitalCalls: {
      year: number;
      expectedAmount: number;
    }[];
    liquidityRatio: number;
  };
  
  // Risk Metrics
  riskMetrics: {
    concentrationRisk: number;
    vintageConcentration: number;
    gpConcentration: number;
    illiquidityRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  };
}

// ESG and Impact Investing
export interface ESGMetrics {
  investmentId: string;
  asOfDate: Date;
  
  // ESG Scores
  overallESGScore: number;
  environmentalScore: number;
  socialScore: number;
  governanceScore: number;
  
  // Specific Metrics
  carbonFootprint?: number;
  diversityMetrics?: {
    boardDiversity: number;
    workforceDiversity: number;
    leadershipDiversity: number;
  };
  
  // Impact Metrics
  impactMetrics?: {
    metricName: string;
    value: number;
    unit: string;
    targetValue?: number;
  }[];
  
  // Compliance
  sustainabilityCompliance: boolean;
  impactReportingCompliance: boolean;
  
  lastUpdated: Date;
  dataSource: string;
}