export interface MoneyMarketFund {
  fundId: string;
  name: string;
  symbol: string;
  provider: string;
  category: 'GOVERNMENT' | 'PRIME' | 'MUNICIPAL' | 'TREASURY';
  
  // Fund characteristics
  sevenDayYield: number;
  thirtyDayYield: number;
  expenseRatio: number;
  minInvestment: number;
  netAssetValue: number; // Usually $1.00 for MMFs
  
  // Stability metrics
  wamDays: number; // Weighted Average Maturity in days
  walDays: number; // Weighted Average Life in days
  
  // Credit quality
  creditQuality: {
    aaa: number;
    aa: number;
    a: number;
    other: number;
  };
  
  // Liquidity features
  dailyLiquidity: number; // Percentage that can be liquidated daily
  weeklyLiquidity: number; // Percentage that can be liquidated weekly
  gateThreshold?: number; // Minimum threshold below which gates may apply
  
  // Status
  isActive: boolean;
  ratingAgencyCode?: string;
  prospectusDate: Date;
  lastUpdated: Date;
}

export interface SweepAccount {
  accountId: string;
  accountNumber: string;
  provider: string;
  accountType: 'FDIC_INSURED' | 'MONEY_MARKET' | 'TREASURY_BILLS';
  
  // Account characteristics
  currentRate: number;
  tier1Rate?: number; // Rate for first tier of balance
  tier2Rate?: number; // Rate for second tier of balance
  tier1Limit?: number; // Balance limit for tier 1
  
  // FDIC insurance (if applicable)
  fdicInsured: boolean;
  fdicLimit?: number; // Current FDIC insurance limit
  
  // Sweep features
  sweepThreshold: number; // Minimum cash balance before sweep occurs
  sweepFrequency: 'DAILY' | 'WEEKLY' | 'REAL_TIME';
  autoSweepEnabled: boolean;
  
  // Restrictions
  minimumBalance: number;
  maximumBalance?: number;
  monthlyTransactionLimit?: number;
  
  // Status and metadata
  isActive: boolean;
  openDate: Date;
  lastSweepDate?: Date;
  nextSweepDate?: Date;
  
  // Associated portfolio or account
  portfolioId?: string;
  custodianAccount?: string;
}

export interface CashEquivalentPosition {
  id: string;
  portfolioId: string;
  tenantId: string;
  
  // Asset identification
  assetType: 'MONEY_MARKET_FUND' | 'SWEEP_ACCOUNT' | 'TREASURY_BILL' | 'COMMERCIAL_PAPER' | 'CERTIFICATE_OF_DEPOSIT';
  assetId: string; // Fund ID or Account ID
  symbol?: string;
  
  // Position details
  shares?: number; // For MMFs
  balance?: number; // For sweep accounts
  marketValue: number;
  
  // Yield information
  currentYield: number;
  yieldToMaturity?: number; // For fixed maturity instruments
  maturityDate?: Date;
  
  // Cost basis (usually par value for cash equivalents)
  costBasis: number;
  accruedInterest?: number;
  
  // Liquidity information
  liquidityTier: 'T0' | 'T1' | 'T2' | 'T3'; // Same day, next day, 2 days, 3+ days
  minimumRedemption?: number;
  redemptionFee?: number;
  
  // Status
  isActive: boolean;
  isPledged: boolean; // If used as collateral
  
  // Audit fields
  createdAt: Date;
  updatedAt: Date;
  lastPriceUpdate: Date;
}

export interface CashEquivalentTransaction {
  id: string;
  portfolioId: string;
  positionId: string;
  tenantId: string;
  
  // Transaction details
  transactionType: 'PURCHASE' | 'REDEMPTION' | 'DIVIDEND' | 'INTEREST' | 'SWEEP_IN' | 'SWEEP_OUT' | 'MATURITY';
  amount: number;
  shares?: number; // For share-based transactions
  price?: number; // Per share price (usually $1.00 for MMFs)
  
  // Transaction dates
  tradeDate: Date;
  settlementDate: Date;
  valueDate?: Date; // When interest/dividends start accruing
  
  // Sweep-specific information
  sweepType?: 'AUTO' | 'MANUAL';
  triggerEvent?: string; // What caused the sweep
  
  // Interest/dividend information
  interestRate?: number;
  interestPeriod?: {
    startDate: Date;
    endDate: Date;
  };
  
  // Status
  status: 'PENDING' | 'SETTLED' | 'CANCELLED' | 'FAILED';
  
  // External references
  externalTransactionId?: string;
  confirmationNumber?: string;
  
  // Audit fields
  createdAt: Date;
  processedAt?: Date;
  createdBy: string;
}

export interface YieldCalculation {
  positionId: string;
  calculationDate: Date;
  
  // Yield metrics
  currentYield: number;
  effectiveYield: number;
  compoundYield: number;
  taxEquivalentYield?: number; // For municipal funds
  
  // Yield components
  dividendYield?: number;
  interestYield?: number;
  feeAdjustedYield: number;
  
  // Calculation period
  periodDays: number;
  annualizationFactor: number;
  
  // Metadata
  calculationMethod: 'SIMPLE' | 'COMPOUND' | 'SEC_YIELD';
  
  createdAt: Date;
}

export type CashEquivalentAsset = MoneyMarketFund | SweepAccount;
export type CashEquivalentInstrument = CashEquivalentPosition | CashEquivalentTransaction | YieldCalculation;