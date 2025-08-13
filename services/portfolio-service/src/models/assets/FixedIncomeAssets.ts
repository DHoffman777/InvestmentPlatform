// Fixed Income Asset Types and Models
// Supports government bonds, corporate bonds, municipal bonds, and treasury securities

export interface FixedIncomeBond {
  bondId: string;
  cusip: string;
  isin?: string;
  issuerName: string;
  bondType: 'GOVERNMENT' | 'CORPORATE' | 'MUNICIPAL' | 'TREASURY' | 'AGENCY';
  
  // Bond characteristics
  faceValue: number;
  couponRate: number;
  maturityDate: Date;
  issueDate: Date;
  firstCouponDate?: Date;
  
  // Payment details
  paymentFrequency: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL' | 'ZERO_COUPON';
  dayCountConvention: 'ACT_360' | 'ACT_365' | '30_360' | 'ACT_ACT';
  
  // Ratings and risk
  moodysRating?: string;
  spRating?: string;
  fitchRating?: string;
  
  // Market data
  currentPrice: number;
  yieldToMaturity: number;
  yieldToCall?: number;
  duration: number;
  modifiedDuration: number;
  convexity: number;
  
  // Call/put features
  isCallable: boolean;
  callDate?: Date;
  callPrice?: number;
  isPutable: boolean;
  putDate?: Date;
  putPrice?: number;
  
  // Tax treatment
  isTaxExempt: boolean;
  isSubjectToAMT: boolean;
  
  // Status
  isActive: boolean;
  isDefaulted: boolean;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface TreasuryBill {
  billId: string;
  cusip: string;
  maturityDate: Date;
  issueDate: Date;
  
  // Treasury bill characteristics
  faceValue: number;
  discountRate: number;
  currentPrice: number;
  yieldToMaturity: number;
  
  // Term
  termDays: number;
  termWeeks: number;
  
  // Auction details
  auctionDate: Date;
  competitiveBid: boolean;
  
  // Status
  isActive: boolean;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
}

export interface FixedIncomePosition {
  id: string;
  portfolioId: string;
  tenantId: string;
  
  // Asset identification
  assetType: 'GOVERNMENT_BOND' | 'CORPORATE_BOND' | 'MUNICIPAL_BOND' | 'TREASURY_BILL' | 'AGENCY_BOND';
  assetId: string;
  cusip: string;
  symbol?: string;
  
  // Position details
  faceValue: number;
  quantity: number; // Number of bonds
  marketValue: number;
  costBasis: number;
  accruedInterest: number;
  
  // Yield metrics
  currentYield: number;
  yieldToMaturity: number;
  yieldToCall?: number;
  taxEquivalentYield?: number;
  
  // Risk metrics
  duration: number;
  modifiedDuration: number;
  convexity: number;
  
  // Dates
  purchaseDate: Date;
  maturityDate: Date;
  nextCouponDate?: Date;
  
  // Tax lot information
  taxLots: FixedIncomeTaxLot[];
  
  // Status
  isActive: boolean;
  isPledged: boolean;
  pledgedAmount?: number;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastPriceUpdate: Date;
}

export interface FixedIncomeTaxLot {
  id: string;
  positionId: string;
  
  // Tax lot details
  quantity: number;
  purchasePrice: number;
  purchaseDate: Date;
  costBasis: number;
  accruedInterestAtPurchase: number;
  
  // Premium/discount tracking
  originalPremiumDiscount: number;
  remainingPremiumDiscount: number;
  
  // Status
  isActive: boolean;
  
  // Metadata
  createdAt: Date;
}

export interface FixedIncomeTransaction {
  id: string;
  portfolioId: string;
  positionId?: string;
  tenantId: string;
  
  // Transaction identification
  transactionType: 'BUY' | 'SELL' | 'COUPON_PAYMENT' | 'PRINCIPAL_PAYMENT' | 'MATURITY' | 'CALL' | 'PUT';
  
  // Asset details
  cusip: string;
  symbol?: string;
  assetType: string;
  
  // Transaction details
  quantity: number;
  price: number;
  faceValue: number;
  accruedInterest: number;
  netAmount: number;
  
  // Fees and charges
  commission: number;
  fees: number;
  markupMarkdown: number;
  
  // Dates
  tradeDate: Date;
  settlementDate: Date;
  exDate?: Date;
  paymentDate?: Date;
  
  // Yield information
  yieldAtTrade: number;
  
  // Status and processing
  status: 'PENDING' | 'SETTLED' | 'CANCELLED' | 'FAILED';
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

export interface CouponPayment {
  id: string;
  positionId: string;
  tenantId: string;
  
  // Payment details
  paymentDate: Date;
  recordDate: Date;
  exDate: Date;
  
  // Amounts
  couponRate: number;
  paymentAmount: number;
  faceValueHeld: number;
  
  // Tax information
  taxableAmount: number;
  taxExemptAmount: number;
  
  // Status
  status: 'SCHEDULED' | 'PAID' | 'REINVESTED';
  
  // Metadata
  createdAt: Date;
  processedAt?: Date;
}

// Request/Response interfaces
export interface CreateFixedIncomePositionRequest {
  portfolioId: string;
  tenantId: string;
  assetType: string;
  cusip: string;
  symbol?: string;
  quantity: number;
  purchasePrice: number;
  faceValue: number;
  maturityDate: string;
  couponRate?: number;
  createdBy: string;
}

export interface FixedIncomeTradeRequest {
  portfolioId: string;
  tenantId: string;
  transactionType: 'BUY' | 'SELL';
  cusip: string;
  quantity: number;
  price: number;
  tradeDate: string;
  settlementDate: string;
  executedBy: string;
}

export interface FixedIncomeValuationRequest {
  positionId: string;
  tenantId: string;
  valuationDate?: string;
  includePricingSources?: boolean;
}

export interface CouponProcessingRequest {
  positionId: string;
  paymentDate: string;
  couponRate: number;
  reinvestOption?: 'CASH' | 'REINVEST';
  tenantId: string;
  processedBy: string;
}

// Yield calculation types
export interface YieldCalculationResult {
  currentYield: number;
  yieldToMaturity: number;
  yieldToCall?: number;
  yieldToWorst: number;
  taxEquivalentYield?: number;
  duration: number;
  modifiedDuration: number;
  convexity: number;
  calculationDate: Date;
}

// Bond analytics interfaces
export interface BondAnalytics {
  priceValue01: number; // Price value of a basis point
  dv01: number; // Dollar value of a basis point
  effectiveDuration: number;
  effectiveConvexity: number;
  optionAdjustedSpread?: number;
  zSpread?: number;
}

// Validation result interface
export interface FixedIncomeValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}