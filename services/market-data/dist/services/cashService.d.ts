import { PrismaClient, Security } from '@prisma/client';
import { Decimal } from 'decimal.js';
export interface CashEquivalentData {
    symbol: string;
    name: string;
    cusip?: string;
    isin?: string;
    securityType: 'CASH_EQUIVALENT';
    instrumentType: 'TREASURY_BILL' | 'COMMERCIAL_PAPER' | 'CERTIFICATE_OF_DEPOSIT' | 'BANKERS_ACCEPTANCE' | 'MONEY_MARKET_DEPOSIT' | 'REPURCHASE_AGREEMENT' | 'FEDERAL_FUNDS';
    currency: string;
    country: string;
    maturityDate?: Date;
    issueDate?: Date;
    daysToMaturity?: number;
    minimumDenomination: Decimal;
    parValue?: Decimal;
    currentYield?: Decimal;
    discountRate?: Decimal;
    bankDiscountYield?: Decimal;
    bondEquivalentYield?: Decimal;
    effectiveAnnualRate?: Decimal;
    issuer: string;
    issuerType: 'GOVERNMENT' | 'BANK' | 'CORPORATION' | 'FEDERAL_AGENCY' | 'GSE';
    creditRating?: string;
    riskLevel: 'LOWEST' | 'LOW' | 'MODERATE';
    isInsured?: boolean;
    insuranceProvider?: string;
    liquidityRating: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'AT_MATURITY';
    marketMaker?: string;
    interestPaymentFrequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL' | 'AT_MATURITY';
    dayCountConvention?: 'ACTUAL_360' | 'ACTUAL_365' | '30_360' | 'ACTUAL_ACTUAL';
    isMoneyMarketEligible: boolean;
    isBankQualified?: boolean;
    isActive?: boolean;
}
export interface CashAccountData {
    symbol: string;
    name: string;
    accountType: 'SAVINGS' | 'CHECKING' | 'MONEY_MARKET' | 'CASH_MANAGEMENT' | 'SWEEP';
    currency: string;
    bankName: string;
    routingNumber?: string;
    accountNumber?: string;
    currentAPY?: Decimal;
    currentAPR?: Decimal;
    balanceTiers?: {
        minBalance: Decimal;
        maxBalance?: Decimal;
        apy: Decimal;
    }[];
    minimumBalance?: Decimal;
    maximumBalance?: Decimal;
    monthlyMaintenanceFee?: Decimal;
    transactionLimits?: {
        dailyLimit?: Decimal;
        monthlyLimit?: Decimal;
        perTransactionLimit?: Decimal;
    };
    fdicInsured: boolean;
    fdicInsuranceLimit?: Decimal;
    isSweepAccount?: boolean;
    sweepThreshold?: Decimal;
    sweepTargetFunds?: string[];
    isActive?: boolean;
}
export interface TreasuryData {
    symbol: string;
    name: string;
    cusip: string;
    isin?: string;
    securityType: 'TREASURY';
    instrumentType: 'TREASURY_BILL' | 'TREASURY_NOTE' | 'TREASURY_BOND' | 'TREASURY_STRIP' | 'TIPS';
    maturityDate: Date;
    issueDate: Date;
    auctionDate?: Date;
    settlementDate?: Date;
    parValue: Decimal;
    minimumBid: Decimal;
    bidIncrement: Decimal;
    auctionType?: 'SINGLE_PRICE' | 'MULTIPLE_PRICE';
    competitiveBidAccepted?: Decimal;
    noncompetitiveBidAccepted?: Decimal;
    totalIssued?: Decimal;
    discountRate?: Decimal;
    couponRate?: Decimal;
    yield?: Decimal;
    inflationIndexRatio?: Decimal;
    realYield?: Decimal;
    breakEvenInflationRate?: Decimal;
    daysToMaturity: number;
    duration?: Decimal;
    convexity?: Decimal;
    interestPaymentDates?: Date[];
    principalPaymentDate: Date;
    dayCountConvention: 'ACTUAL_ACTUAL' | 'ACTUAL_360';
    isActive?: boolean;
}
export declare class CashService {
    private prisma;
    constructor(prisma: PrismaClient);
    upsertCashEquivalent(cashData: CashEquivalentData): Promise<Security>;
    upsertTreasury(treasuryData: TreasuryData): Promise<Security>;
    searchCashInstruments(filters: {
        query?: string;
        assetClass?: 'CASH_EQUIVALENT' | 'TREASURY';
        instrumentType?: string;
        issuerType?: 'GOVERNMENT' | 'BANK' | 'CORPORATION' | 'FEDERAL_AGENCY' | 'GSE';
        minYield?: number;
        maxDaysToMaturity?: number;
        creditRating?: string;
        riskLevel?: 'LOWEST' | 'LOW' | 'MODERATE';
        currency?: string;
        limit?: number;
    }): Promise<any[]>;
    getCashInstrumentDetails(symbol: string): Promise<any>;
    getMoneyMarketRates(): Promise<any>;
    private storeCashMetadata;
    private getCashMetadata;
}
//# sourceMappingURL=cashService.d.ts.map