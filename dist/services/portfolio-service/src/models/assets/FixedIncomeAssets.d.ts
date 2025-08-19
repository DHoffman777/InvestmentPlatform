export interface FixedIncomeBond {
    bondId: string;
    cusip: string;
    isin?: string;
    issuerName: string;
    bondType: 'GOVERNMENT' | 'CORPORATE' | 'MUNICIPAL' | 'TREASURY' | 'AGENCY';
    faceValue: number;
    couponRate: number;
    maturityDate: Date;
    issueDate: Date;
    firstCouponDate?: Date;
    paymentFrequency: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL' | 'ZERO_COUPON';
    dayCountConvention: 'ACT_360' | 'ACT_365' | '30_360' | 'ACT_ACT';
    moodysRating?: string;
    spRating?: string;
    fitchRating?: string;
    currentPrice: number;
    yieldToMaturity: number;
    yieldToCall?: number;
    duration: number;
    modifiedDuration: number;
    convexity: number;
    isCallable: boolean;
    callDate?: Date;
    callPrice?: number;
    isPutable: boolean;
    putDate?: Date;
    putPrice?: number;
    isTaxExempt: boolean;
    isSubjectToAMT: boolean;
    isActive: boolean;
    isDefaulted: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface TreasuryBill {
    billId: string;
    cusip: string;
    maturityDate: Date;
    issueDate: Date;
    faceValue: number;
    discountRate: number;
    currentPrice: number;
    yieldToMaturity: number;
    termDays: number;
    termWeeks: number;
    auctionDate: Date;
    competitiveBid: boolean;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface FixedIncomePosition {
    id: string;
    portfolioId: string;
    tenantId: string;
    assetType: 'GOVERNMENT_BOND' | 'CORPORATE_BOND' | 'MUNICIPAL_BOND' | 'TREASURY_BILL' | 'AGENCY_BOND';
    assetId: string;
    cusip: string;
    symbol?: string;
    faceValue: number;
    quantity: number;
    marketValue: number;
    costBasis: number;
    accruedInterest: number;
    currentYield: number;
    yieldToMaturity: number;
    yieldToCall?: number;
    taxEquivalentYield?: number;
    duration: number;
    modifiedDuration: number;
    convexity: number;
    purchaseDate: Date;
    maturityDate: Date;
    nextCouponDate?: Date;
    taxLots: FixedIncomeTaxLot[];
    isActive: boolean;
    isPledged: boolean;
    pledgedAmount?: number;
    createdAt: Date;
    updatedAt: Date;
    lastPriceUpdate: Date;
}
export interface FixedIncomeTaxLot {
    id: string;
    positionId: string;
    quantity: number;
    purchasePrice: number;
    purchaseDate: Date;
    costBasis: number;
    accruedInterestAtPurchase: number;
    originalPremiumDiscount: number;
    remainingPremiumDiscount: number;
    isActive: boolean;
    createdAt: Date;
}
export interface FixedIncomeTransaction {
    id: string;
    portfolioId: string;
    positionId?: string;
    tenantId: string;
    transactionType: 'BUY' | 'SELL' | 'COUPON_PAYMENT' | 'PRINCIPAL_PAYMENT' | 'MATURITY' | 'CALL' | 'PUT';
    cusip: string;
    symbol?: string;
    assetType: string;
    quantity: number;
    price: number;
    faceValue: number;
    accruedInterest: number;
    netAmount: number;
    commission: number;
    fees: number;
    markupMarkdown: number;
    tradeDate: Date;
    settlementDate: Date;
    exDate?: Date;
    paymentDate?: Date;
    yieldAtTrade: number;
    status: 'PENDING' | 'SETTLED' | 'CANCELLED' | 'FAILED';
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
}
export interface CouponPayment {
    id: string;
    positionId: string;
    tenantId: string;
    paymentDate: Date;
    recordDate: Date;
    exDate: Date;
    couponRate: number;
    paymentAmount: number;
    faceValueHeld: number;
    taxableAmount: number;
    taxExemptAmount: number;
    status: 'SCHEDULED' | 'PAID' | 'REINVESTED';
    createdAt: Date;
    processedAt?: Date;
}
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
export interface BondAnalytics {
    priceValue01: number;
    dv01: number;
    effectiveDuration: number;
    effectiveConvexity: number;
    optionAdjustedSpread?: number;
    zSpread?: number;
}
export interface FixedIncomeValidationResult {
    isValid: boolean;
    errors: string[];
    warnings?: string[];
}
