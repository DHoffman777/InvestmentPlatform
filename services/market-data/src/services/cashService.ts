import { PrismaClient, Security } from '@prisma/client';
import { logger } from '../utils/logger';
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
  
  // Cash equivalent characteristics
  maturityDate?: Date;
  issueDate?: Date;
  daysToMaturity?: number;
  minimumDenomination: Prisma.Decimal;
  parValue?: Prisma.Decimal;
  currentYield?: Prisma.Decimal;
  
  // Rates and pricing
  discountRate?: Prisma.Decimal; // For discount instruments like T-bills
  bankDiscountYield?: Prisma.Decimal;
  bondEquivalentYield?: Prisma.Decimal;
  effectiveAnnualRate?: Prisma.Decimal;
  
  // Issuer information
  issuer: string;
  issuerType: 'GOVERNMENT' | 'BANK' | 'CORPORATION' | 'FEDERAL_AGENCY' | 'GSE'; // Government Sponsored Enterprise
  creditRating?: string; // e.g., 'AAA', 'AA+', etc.
  
  // Risk characteristics
  riskLevel: 'LOWEST' | 'LOW' | 'MODERATE';
  isInsured?: boolean; // FDIC insured, etc.
  insuranceProvider?: string;
  
  // Liquidity
  liquidityRating: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'AT_MATURITY';
  marketMaker?: string;
  
  // Interest characteristics
  interestPaymentFrequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL' | 'AT_MATURITY';
  dayCountConvention?: 'ACTUAL_360' | 'ACTUAL_365' | '30_360' | 'ACTUAL_ACTUAL';
  
  // Regulatory
  isMoneyMarketEligible: boolean;
  isBankQualified?: boolean;
  
  isActive?: boolean;
}

export interface CashAccountData {
  symbol: string;
  name: string;
  accountType: 'SAVINGS' | 'CHECKING' | 'MONEY_MARKET' | 'CASH_MANAGEMENT' | 'SWEEP';
  currency: string;
  
  // Account characteristics
  bankName: string;
  routingNumber?: string;
  accountNumber?: string; // Masked/encrypted
  
  // Rates
  currentAPY?: Prisma.Decimal; // Annual Percentage Yield
  currentAPR?: Prisma.Decimal; // Annual Percentage Rate
  
  // Balance tiers and rates
  balanceTiers?: {
    minBalance: Prisma.Decimal;
    maxBalance?: Prisma.Decimal;
    apy: Prisma.Decimal;
  }[];
  
  // Features
  minimumBalance?: Prisma.Decimal;
  maximumBalance?: Prisma.Decimal;
  monthlyMaintenanceFee?: Prisma.Decimal;
  transactionLimits?: {
    dailyLimit?: Prisma.Decimal;
    monthlyLimit?: Prisma.Decimal;
    perTransactionLimit?: Prisma.Decimal;
  };
  
  // FDIC Insurance
  fdicInsured: boolean;
  fdicInsuranceLimit?: Prisma.Decimal;
  
  // Sweep features
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
  instrumentType: 'TREASURY_BILL' | 'TREASURY_NOTE' | 'TREASURY_BOND' | 'TREASURY_STRIP' | 'TIPS'; // Treasury Inflation-Protected Securities
  
  // Treasury characteristics
  maturityDate: Date;
  issueDate: Date;
  auctionDate?: Date;
  settlementDate?: Date;
  
  // Denominations
  parValue: Prisma.Decimal;
  minimumBid: Prisma.Decimal;
  bidIncrement: Prisma.Decimal;
  
  // Auction details
  auctionType?: 'SINGLE_PRICE' | 'MULTIPLE_PRICE';
  competitiveBidAccepted?: Prisma.Decimal;
  noncompetitiveBidAccepted?: Prisma.Decimal;
  totalIssued?: Prisma.Decimal;
  
  // Rates
  discountRate?: Prisma.Decimal; // For bills
  couponRate?: Prisma.Decimal; // For notes/bonds
  yield?: Prisma.Decimal;
  
  // TIPS specific (if instrumentType is TIPS)
  inflationIndexRatio?: Prisma.Decimal;
  realYield?: Prisma.Decimal;
  breakEvenInflationRate?: Prisma.Decimal;
  
  // Characteristics
  daysToMaturity: number;
  duration?: Prisma.Decimal; // Modified duration
  convexity?: Prisma.Decimal;
  
  // Payment details
  interestPaymentDates?: Date[];
  principalPaymentDate: Date;
  dayCountConvention: 'ACTUAL_ACTUAL' | 'ACTUAL_360';
  
  isActive?: boolean;
}

export class CashService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Create or update cash equivalent
  async upsertCashEquivalent(cashData: CashEquivalentData): Promise<Security> {
    try {
      logger.info('Upserting cash equivalent', {
        symbol: cashData.symbol,
        instrumentType: cashData.instrumentType,
      });

      const securityData = {
        symbol: cashData.symbol.toUpperCase(),
        name: cashData.name,
        cusip: cashData.cusip,
        isin: cashData.isin,
        assetClass: 'CASH_EQUIVALENT',
        securityType: cashData.instrumentType,
        exchange: 'OTC', // Cash equivalents typically trade OTC
        currency: cashData.currency,
        country: cashData.country,
        sector: 'Cash & Cash Equivalents',
        industry: cashData.instrumentType,
        marketCap: cashData.parValue,
        isActive: cashData.isActive ?? true,
        listingDate: cashData.issueDate,
        maturityDate: cashData.maturityDate,
      };

      const metadata = {
        securityType: cashData.securityType,
        instrumentType: cashData.instrumentType,
        daysToMaturity: cashData.daysToMaturity,
        minimumDenomination: cashData.minimumDenomination.toString(),
        parValue: cashData.parValue?.toString(),
        currentYield: cashData.currentYield?.toString(),
        discountRate: cashData.discountRate?.toString(),
        bankDiscountYield: cashData.bankDiscountYield?.toString(),
        bondEquivalentYield: cashData.bondEquivalentYield?.toString(),
        effectiveAnnualRate: cashData.effectiveAnnualRate?.toString(),
        issuer: cashData.issuer,
        issuerType: cashData.issuerType,
        creditRating: cashData.creditRating,
        riskLevel: cashData.riskLevel,
        isInsured: cashData.isInsured,
        insuranceProvider: cashData.insuranceProvider,
        liquidityRating: cashData.liquidityRating,
        marketMaker: cashData.marketMaker,
        interestPaymentFrequency: cashData.interestPaymentFrequency,
        dayCountConvention: cashData.dayCountConvention,
        isMoneyMarketEligible: cashData.isMoneyMarketEligible,
        isBankQualified: cashData.isBankQualified,
      };

      const security = await this.prisma.security.upsert({
        where: { symbol: securityData.symbol } as any,
        update: {
          ...securityData,
          updatedAt: new Date(),
        },
        create: securityData as any,
      });

      await this.storeCashMetadata(security.id, metadata);

      logger.info('Cash equivalent upserted successfully', {
        securityId: security.id,
        symbol: security.symbol,
      });

      return security;
    } catch (error: any) {
      logger.error('Error upserting cash equivalent', {
        symbol: cashData.symbol,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // Create or update treasury security
  async upsertTreasury(treasuryData: TreasuryData): Promise<Security> {
    try {
      logger.info('Upserting treasury security', {
        symbol: treasuryData.symbol,
        instrumentType: treasuryData.instrumentType,
      });

      const securityData = {
        symbol: treasuryData.symbol.toUpperCase(),
        name: treasuryData.name,
        cusip: treasuryData.cusip,
        isin: treasuryData.isin,
        assetClass: 'TREASURY',
        securityType: treasuryData.instrumentType,
        exchange: 'TREASURY',
        currency: 'USD',
        country: 'US',
        sector: 'Government',
        industry: treasuryData.instrumentType,
        marketCap: treasuryData.totalIssued,
        isActive: treasuryData.isActive ?? true,
        listingDate: treasuryData.issueDate,
        maturityDate: treasuryData.maturityDate,
      };

      const metadata = {
        securityType: treasuryData.securityType,
        instrumentType: treasuryData.instrumentType,
        parValue: treasuryData.parValue.toString(),
        minimumBid: treasuryData.minimumBid.toString(),
        bidIncrement: treasuryData.bidIncrement.toString(),
        auctionType: treasuryData.auctionType,
        competitiveBidAccepted: treasuryData.competitiveBidAccepted?.toString(),
        noncompetitiveBidAccepted: treasuryData.noncompetitiveBidAccepted?.toString(),
        totalIssued: treasuryData.totalIssued?.toString(),
        discountRate: treasuryData.discountRate?.toString(),
        couponRate: treasuryData.couponRate?.toString(),
        yield: treasuryData.yield?.toString(),
        inflationIndexRatio: treasuryData.inflationIndexRatio?.toString(),
        realYield: treasuryData.realYield?.toString(),
        breakEvenInflationRate: treasuryData.breakEvenInflationRate?.toString(),
        daysToMaturity: treasuryData.daysToMaturity,
        duration: treasuryData.duration?.toString(),
        convexity: treasuryData.convexity?.toString(),
        interestPaymentDates: treasuryData.interestPaymentDates,
        principalPaymentDate: treasuryData.principalPaymentDate,
        dayCountConvention: treasuryData.dayCountConvention,
        auctionDate: treasuryData.auctionDate,
        settlementDate: treasuryData.settlementDate,
      };

      const security = await this.prisma.security.upsert({
        where: { symbol: securityData.symbol } as any,
        update: {
          ...securityData,
          updatedAt: new Date(),
        },
        create: securityData as any,
      });

      await this.storeCashMetadata(security.id, metadata);

      logger.info('Treasury security upserted successfully', {
        securityId: security.id,
        symbol: security.symbol,
      });

      return security;
    } catch (error: any) {
      logger.error('Error upserting treasury security', {
        symbol: treasuryData.symbol,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // Search cash instruments
  async searchCashInstruments(filters: {
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
  }): Promise<any[]> {
    try {
      const {
        query,
        assetClass,
        currency,
        limit = 50,
      } = filters;

      const whereClause: any = {
        assetClass: { in: ['CASH_EQUIVALENT', 'TREASURY'] },
        isActive: true,
      };

      if (query) {
        whereClause.OR = [
          { symbol: { contains: query.toUpperCase() } },
          { name: { contains: query, mode: 'insensitive' } },
          { cusip: query },
          { isin: query },
        ];
      }

      if (assetClass) {
        whereClause.assetClass = assetClass;
      }

      if (currency) {
        whereClause.currency = currency;
      }

      if (filters.instrumentType) {
        whereClause.securityType = filters.instrumentType;
      }

      const securities = await this.prisma.security.findMany({
        where: whereClause,
        take: limit,
        orderBy: [
          { symbol: 'asc' },
        ],
      } as any);

      // Get metadata and apply additional filters
      const resultsWithMetadata = await Promise.all(
        securities.map(async (security) => {
          const metadata = await this.getCashMetadata(security.id);

          // Apply metadata-based filters
          if (filters.issuerType && metadata.issuerType !== filters.issuerType) {
            return null;
          }

          if (filters.minYield && metadata.currentYield && 
              parseFloat(metadata.currentYield) < filters.minYield) {
            return null;
          }

          if (filters.maxDaysToMaturity && metadata.daysToMaturity && 
              metadata.daysToMaturity > filters.maxDaysToMaturity) {
            return null;
          }

          if (filters.creditRating && metadata.creditRating !== filters.creditRating) {
            return null;
          }

          if (filters.riskLevel && metadata.riskLevel !== filters.riskLevel) {
            return null;
          }

          return {
            ...security,
            marketCap: (security as any).marketCap?.toNumber(),
            metadata,
            latestQuote: null,
          };
        })
      );

      const filteredResults = resultsWithMetadata.filter(result => result !== null);

      logger.info('Cash instruments search completed', {
        filters,
        resultCount: filteredResults.length,
      });

      return filteredResults;
    } catch (error: any) {
      logger.error('Error searching cash instruments', {
        filters,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // Get cash instrument details
  async getCashInstrumentDetails(symbol: string): Promise<any> {
    try {
      const security = await this.prisma.security.findFirst({
        where: { 
          symbol: symbol.toUpperCase(),
          assetClass: { in: ['CASH_EQUIVALENT', 'TREASURY'] },
        } as any,
      } as any);

      if (!security) {
        return null;
      }

      const metadata = await this.getCashMetadata(security.id);

      return {
        ...security,
        marketCap: (security as any).marketCap?.toNumber(),
        recentQuotes: (security as any).quotes?.map((q: any) => ({
          ...q,
          last: q.last?.toNumber(),
          change: q.change?.toNumber(),
          changePercent: q.changePercent?.toNumber(),
        })) || [],
        priceHistory: (security as any).historicalData?.map((h: any) => ({
          ...h,
          open: h.open.toNumber(),
          high: h.high.toNumber(),
          low: h.low.toNumber(),
          close: h.close.toNumber(),
          adjustedClose: h.adjustedClose.toNumber(),
        })) || [],
        metadata,
      };
    } catch (error: any) {
      logger.error('Error getting cash instrument details', {
        symbol,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // Get current money market rates
  async getMoneyMarketRates(): Promise<any> {
    try {
      // This would typically fetch from Fed, Treasury, or market data providers
      // For now, return sample rates
      const rates = {
        federalFundsRate: 5.25,
        discountRate: 5.50,
        primeRate: 8.25,
        treasuryRates: {
          '1M': 5.45,
          '3M': 5.42,
          '6M': 5.38,
          '1Y': 5.15,
          '2Y': 4.85,
          '5Y': 4.52,
          '10Y': 4.28,
          '30Y': 4.35,
        },
        libor: {
          overnight: 5.18,
          '1W': 5.22,
          '1M': 5.35,
          '3M': 5.41,
          '6M': 5.44,
          '1Y': 5.48,
        },
        commercialPaper: {
          overnight: 5.20,
          '30D': 5.38,
          '60D': 5.35,
          '90D': 5.32,
        },
        certificatesOfDeposit: {
          '1M': 4.25,
          '3M': 4.85,
          '6M': 5.15,
          '1Y': 5.25,
        },
        asOfDate: new Date(),
      };

      return rates;
    } catch (error: any) {
      logger.error('Error getting money market rates', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // Helper method to store cash instrument metadata
  private async storeCashMetadata(securityId: string, metadata: any): Promise<any> {
    try {
      // TODO: Implement metadata storage when fundamental table is available
      // await this.prisma.fundamental.upsert({
      //   where: {
      //     securityId_periodType_periodEnd: {
      //       securityId,
      //       periodType: 'CASH_METADATA',
      //       periodEnd: new Date(),
      //     },
      //   },
      //   update: {
      //     additionalData: metadata,
      //     updatedAt: new Date(),
      //   },
      //   create: {
      //     securityId,
      //     periodType: 'CASH_METADATA',
      //     periodEnd: new Date(),
      //     reportDate: new Date(),
      //     additionalData: metadata,
      //   },
      // });
    } catch (error: any) {
      logger.warn('Could not store cash instrument metadata', { securityId, error });
    }
  }

  // Helper method to retrieve cash instrument metadata
  private async getCashMetadata(securityId: string): Promise<any> {
    try {
      // TODO: Implement metadata retrieval when fundamental table is available
      // const metadata = await this.prisma.fundamental.findFirst({
      //   where: {
      //     securityId,
      //     periodType: 'CASH_METADATA',
      //   },
      //   orderBy: { updatedAt: 'desc' },
      // });

      // return metadata?.additionalData || {};
      return {};
    } catch (error: any) {
      logger.warn('Could not retrieve cash instrument metadata', { securityId, error });
      return {};
    }
  }
}


