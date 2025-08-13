export interface MoneyMarketFund {
    fundId: string;
    name: string;
    symbol: string;
    provider: string;
    category: 'GOVERNMENT' | 'PRIME' | 'MUNICIPAL' | 'TREASURY';
    sevenDayYield: number;
    thirtyDayYield: number;
    expenseRatio: number;
    minInvestment: number;
    netAssetValue: number;
    wamDays: number;
    walDays: number;
    creditQuality: {
        aaa: number;
        aa: number;
        a: number;
        other: number;
    };
    dailyLiquidity: number;
    weeklyLiquidity: number;
    gateThreshold?: number;
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
    currentRate: number;
    tier1Rate?: number;
    tier2Rate?: number;
    tier1Limit?: number;
    fdicInsured: boolean;
    fdicLimit?: number;
    sweepThreshold: number;
    sweepFrequency: 'DAILY' | 'WEEKLY' | 'REAL_TIME';
    autoSweepEnabled: boolean;
    minimumBalance: number;
    maximumBalance?: number;
    monthlyTransactionLimit?: number;
    isActive: boolean;
    openDate: Date;
    lastSweepDate?: Date;
    nextSweepDate?: Date;
    portfolioId?: string;
    custodianAccount?: string;
}
export interface CashEquivalentPosition {
    id: string;
    portfolioId: string;
    tenantId: string;
    assetType: 'MONEY_MARKET_FUND' | 'SWEEP_ACCOUNT' | 'TREASURY_BILL' | 'COMMERCIAL_PAPER' | 'CERTIFICATE_OF_DEPOSIT';
    assetId: string;
    symbol?: string;
    shares?: number;
    balance?: number;
    marketValue: number;
    currentYield: number;
    yieldToMaturity?: number;
    maturityDate?: Date;
    costBasis: number;
    accruedInterest?: number;
    liquidityTier: 'T0' | 'T1' | 'T2' | 'T3';
    minimumRedemption?: number;
    redemptionFee?: number;
    isActive: boolean;
    isPledged: boolean;
    createdAt: Date;
    updatedAt: Date;
    lastPriceUpdate: Date;
}
export interface CashEquivalentTransaction {
    id: string;
    portfolioId: string;
    positionId: string;
    tenantId: string;
    transactionType: 'PURCHASE' | 'REDEMPTION' | 'DIVIDEND' | 'INTEREST' | 'SWEEP_IN' | 'SWEEP_OUT' | 'MATURITY';
    amount: number;
    shares?: number;
    price?: number;
    tradeDate: Date;
    settlementDate: Date;
    valueDate?: Date;
    sweepType?: 'AUTO' | 'MANUAL';
    triggerEvent?: string;
    interestRate?: number;
    interestPeriod?: {
        startDate: Date;
        endDate: Date;
    };
    status: 'PENDING' | 'SETTLED' | 'CANCELLED' | 'FAILED';
    externalTransactionId?: string;
    confirmationNumber?: string;
    createdAt: Date;
    processedAt?: Date;
    createdBy: string;
}
export interface YieldCalculation {
    positionId: string;
    calculationDate: Date;
    currentYield: number;
    effectiveYield: number;
    compoundYield: number;
    taxEquivalentYield?: number;
    dividendYield?: number;
    interestYield?: number;
    feeAdjustedYield: number;
    periodDays: number;
    annualizationFactor: number;
    calculationMethod: 'SIMPLE' | 'COMPOUND' | 'SEC_YIELD';
    createdAt: Date;
}
export type CashEquivalentAsset = MoneyMarketFund | SweepAccount;
export type CashEquivalentInstrument = CashEquivalentPosition | CashEquivalentTransaction | YieldCalculation;
