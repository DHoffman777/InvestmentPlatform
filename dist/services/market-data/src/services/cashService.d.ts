import { PrismaClient, Security } from '@prisma/client';
import { Prisma } from '@prisma/client';
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
    minimumDenomination: Prisma.Decimal;
    parValue?: Prisma.Decimal;
    currentYield?: Prisma.Decimal;
    discountRate?: Prisma.Decimal;
    bankDiscountYield?: Prisma.Decimal;
    bondEquivalentYield?: Prisma.Decimal;
    effectiveAnnualRate?: Prisma.Decimal;
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
    currentAPY?: Prisma.Decimal;
    currentAPR?: Prisma.Decimal;
    balanceTiers?: {
        minBalance: Prisma.Decimal;
        maxBalance?: Prisma.Decimal;
        apy: Prisma.Decimal;
    }[];
    minimumBalance?: Prisma.Decimal;
    maximumBalance?: Prisma.Decimal;
    monthlyMaintenanceFee?: Prisma.Decimal;
    transactionLimits?: {
        dailyLimit?: Prisma.Decimal;
        monthlyLimit?: Prisma.Decimal;
        perTransactionLimit?: Prisma.Decimal;
    };
    fdicInsured: boolean;
    fdicInsuranceLimit?: Prisma.Decimal;
    isSweepAccount?: boolean;
    sweepThreshold?: Prisma.Decimal;
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
    parValue: Prisma.Decimal;
    minimumBid: Prisma.Decimal;
    bidIncrement: Prisma.Decimal;
    auctionType?: 'SINGLE_PRICE' | 'MULTIPLE_PRICE';
    competitiveBidAccepted?: Prisma.Decimal;
    noncompetitiveBidAccepted?: Prisma.Decimal;
    totalIssued?: Prisma.Decimal;
    discountRate?: Prisma.Decimal;
    couponRate?: Prisma.Decimal;
    yield?: Prisma.Decimal;
    inflationIndexRatio?: Prisma.Decimal;
    realYield?: Prisma.Decimal;
    breakEvenInflationRate?: Prisma.Decimal;
    daysToMaturity: number;
    duration?: Prisma.Decimal;
    convexity?: Prisma.Decimal;
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
