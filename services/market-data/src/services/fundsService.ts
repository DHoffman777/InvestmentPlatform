import { PrismaClient, Security, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';
import Decimal from 'decimal.js';

export interface ETFData {
  symbol: string;
  name: string;
  cusip?: string;
  isin?: string;
  fundType: 'ETF';
  exchange: string;
  currency?: string;
  country?: string;
  sector?: string;
  category?: string;
  
  // ETF specific fields
  managementFee: Prisma.Decimal;
  expenseRatio: Prisma.Decimal;
  trackingIndex?: string;
  assetClass: 'EQUITY_ETF' | 'BOND_ETF' | 'COMMODITY_ETF' | 'CURRENCY_ETF' | 'REAL_ESTATE_ETF' | 'MIXED_ETF';
  launchDate: Date;
  totalAssets?: Prisma.Decimal;
  investmentStyle?: string;
  marketCapFocus?: string;
  geographicFocus?: string;
  beta?: Prisma.Decimal;
  standardDeviation?: Prisma.Decimal;
  sharpeRatio?: Prisma.Decimal;
  dividendYield?: Prisma.Decimal;
}

export interface MutualFundData {
  symbol: string;
  name: string;
  cusip?: string;
  isin?: string;
  fundType: 'MUTUAL_FUND';
  shareClass: string;
  currency?: string;
  country?: string;
  
  // Mutual fund specific fields
  managementFee: Prisma.Decimal;
  expenseRatio: Prisma.Decimal;
  frontLoad?: Prisma.Decimal;
  deferredLoad?: Prisma.Decimal;
  purchaseFee?: Prisma.Decimal;
  redemptionFee?: Prisma.Decimal;
  marketingFee?: Prisma.Decimal;
  
  assetClass: 'EQUITY_FUND' | 'BOND_FUND' | 'MONEY_MARKET_FUND' | 'BALANCED_FUND' | 'ALTERNATIVE_FUND';
  inceptionDate: Date;
  totalAssets?: Prisma.Decimal;
  
  minimumInvestment?: Prisma.Decimal;
  minimumAdditionalInvestment?: Prisma.Decimal;
  
  fundFamily?: string;
  fundManager?: string;
  investmentStyle?: string;
  
  morningstarRating?: number;
  morningstarCategory?: string;
  
  turnoverRatio?: Prisma.Decimal;
  beta?: Prisma.Decimal;
  standardDeviation?: Prisma.Decimal;
  sharpeRatio?: Prisma.Decimal;
  alphaRatio?: Prisma.Decimal;
  r2?: Prisma.Decimal;
  
  dividendFrequency?: string;
  capitalGainFrequency?: string;
  dividendYield?: Prisma.Decimal;
}

export interface FundSearchFilters {
  fundType?: 'ETF' | 'MUTUAL_FUND';
  assetClass?: string;
  minAUM?: number;
  maxExpenseRatio?: number;
  fundFamily?: string;
  investmentStyle?: string;
  marketCapFocus?: string;
  geographicFocus?: string;
  minRating?: number;
}

export interface FundPerformanceMetrics {
  returns: {
    oneDay: number;
    oneWeek: number;
    oneMonth: number;
    threeMonths: number;
    sixMonths: number;
    ytd: number;
    oneYear: number;
    threeYears: number;
    fiveYears: number;
    tenYears: number;
    sinceInception: number;
  };
  riskMetrics: {
    standardDeviation: number;
    beta: number;
    sharpeRatio: number;
    sortinoRatio: number;
    informationRatio: number;
    treynorRatio: number;
    maxDrawdown: number;
    upCapture: number;
    downCapture: number;
  };
  benchmarkComparison: {
    benchmarkSymbol: string;
    benchmarkName: string;
    excessReturn: number;
    trackingError: number;
    informationRatio: number;
  };
}

export class FundsService {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient) {
    this.prisma = prisma || new PrismaClient();
  }

  // Create or update ETF
  async upsertETF(etfData: ETFData): Promise<Security> {
    try {
      logger.info('Upserting ETF', {
        symbol: etfData.symbol,
        assetClass: etfData.assetClass,
        exchange: etfData.exchange,
      });

      const securityData = {
        symbol: etfData.symbol.toUpperCase(),
        name: etfData.name,
        cusip: etfData.cusip,
        isin: etfData.isin,
        assetClass: 'ETF',
        securityType: etfData.assetClass,
        exchange: etfData.exchange,
        currency: etfData.currency || 'USD',
        country: etfData.country || 'US',
        sector: etfData.sector,
        industry: etfData.category,
        isActive: true,
        listingDate: etfData.launchDate,
        marketCap: etfData.totalAssets,
      };

      // Store additional ETF metadata
      const metadata = {
        fundType: 'ETF',
        managementFee: etfData.managementFee?.toString(),
        expenseRatio: etfData.expenseRatio?.toString(),
        trackingIndex: etfData.trackingIndex,
        investmentStyle: etfData.investmentStyle,
        marketCapFocus: etfData.marketCapFocus,
        geographicFocus: etfData.geographicFocus,
        beta: etfData.beta?.toString(),
        standardDeviation: etfData.standardDeviation?.toString(),
      };

      const security = await this.prisma.security.upsert({
        where: { symbol: securityData.symbol } as any,
        update: {
          ...securityData,
          updatedAt: new Date(),
        },
        create: securityData as any,
      });

      await this.storeFundMetadata(security.id, metadata);

      logger.info('ETF upserted successfully', {
        securityId: security.id,
        symbol: security.symbol,
      });

      return security;
    } catch (error: any) {
      logger.error('Error upserting ETF', {
        symbol: etfData.symbol,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // Create or update mutual fund
  async upsertMutualFund(fundData: MutualFundData): Promise<Security> {
    try {
      logger.info('Upserting mutual fund', {
        symbol: fundData.symbol,
        fundType: fundData.fundType,
        shareClass: fundData.shareClass,
      });

      const securityData = {
        symbol: fundData.symbol.toUpperCase(),
        name: fundData.name,
        cusip: fundData.cusip,
        isin: fundData.isin,
        assetClass: 'MUTUAL_FUND',
        securityType: fundData.assetClass,
        exchange: 'MUTUALFUND', // Mutual funds don't trade on exchanges
        currency: fundData.currency || 'USD',
        country: fundData.country || 'US',
        isActive: true,
        listingDate: fundData.inceptionDate,
        marketCap: fundData.totalAssets,
      };

      // Store additional fund metadata
      const metadata = {
        fundType: 'MUTUAL_FUND',
        shareClass: fundData.shareClass,
        managementFee: fundData.managementFee?.toString(),
        expenseRatio: fundData.expenseRatio?.toString(),
        frontLoad: fundData.frontLoad?.toString(),
        deferredLoad: fundData.deferredLoad?.toString(),
        purchaseFee: fundData.purchaseFee?.toString(),
        redemptionFee: fundData.redemptionFee?.toString(),
        marketingFee: fundData.marketingFee?.toString(),
        minimumInvestment: fundData.minimumInvestment?.toString(),
        minimumAdditionalInvestment: fundData.minimumAdditionalInvestment?.toString(),
        fundFamily: fundData.fundFamily,
        fundManager: fundData.fundManager,
        investmentStyle: fundData.investmentStyle,
        morningstarRating: fundData.morningstarRating,
        morningstarCategory: fundData.morningstarCategory,
        turnoverRatio: fundData.turnoverRatio?.toString(),
        beta: fundData.beta?.toString(),
        standardDeviation: fundData.standardDeviation?.toString(),
        sharpeRatio: fundData.sharpeRatio?.toString(),
        alphaRatio: fundData.alphaRatio?.toString(),
        r2: fundData.r2?.toString(),
        dividendFrequency: fundData.dividendFrequency,
        capitalGainFrequency: fundData.capitalGainFrequency,
        dividendYield: fundData.dividendYield?.toString(),
      };

      const security = await this.prisma.security.upsert({
        where: { symbol: securityData.symbol } as any,
        update: {
          ...securityData,
          updatedAt: new Date(),
        },
        create: securityData as any,
      });

      await this.storeFundMetadata(security.id, metadata);

      logger.info('Mutual fund upserted successfully', {
        securityId: security.id,
        symbol: security.symbol,
      });

      return security;
    } catch (error: any) {
      logger.error('Error upserting mutual fund', {
        symbol: fundData.symbol,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // Search for funds with filters
  async searchFunds(
    filters: FundSearchFilters,
    limit: number = 100,
    offset: number = 0
  ): Promise<any[]> {
    try {
      const { 
        fundType, 
        assetClass, 
        minAUM, 
        maxExpenseRatio,
        fundFamily,
        investmentStyle,
        marketCapFocus,
        geographicFocus,
        minRating
      } = filters;

      const whereClause: any = {
        isActive: true,
      };

      if (fundType === 'ETF') {
        whereClause.assetClass = 'ETF';
      } else if (fundType === 'MUTUAL_FUND') {
        whereClause.assetClass = 'MUTUAL_FUND';
      }

      if (assetClass) {
        whereClause.securityType = assetClass;
      }

      if (minAUM !== undefined) {
        whereClause.marketCap = { gte: new Decimal(minAUM) };
      }

      const securities = await this.prisma.security.findMany({
        where: whereClause,
        take: limit,
        orderBy: [
          { symbol: 'asc' },
        ] as any,
      });

      // Get metadata for each fund
      const fundsWithMetadata = await Promise.all(
        securities.map(async (security) => {
          const metadata = await this.getFundMetadata(security.id);
          
          // Apply additional filters based on metadata
          if (maxExpenseRatio && metadata.expenseRatio && 
              parseFloat(metadata.expenseRatio) > maxExpenseRatio) {
            return null;
          }

          if (filters.investmentStyle && metadata.investmentStyle !== filters.investmentStyle) {
            return null;
          }

          if (filters.marketCapFocus && metadata.marketCapFocus !== filters.marketCapFocus) {
            return null;
          }

          if (filters.geographicFocus && metadata.geographicFocus !== filters.geographicFocus) {
            return null;
          }

          if (filters.fundFamily && metadata.fundFamily !== filters.fundFamily) {
            return null;
          }

          if (minRating && metadata.morningstarRating && 
              metadata.morningstarRating < minRating) {
            return null;
          }

          return {
            ...security,
            marketCap: (security as any).marketCap?.toNumber(),
            fundMetadata: metadata,
            latestQuote: (security as any).quotes?.[0] ? {
              ...(security as any).quotes[0],
              last: (security as any).quotes[0].last?.toNumber(),
              change: (security as any).quotes[0].change?.toNumber(),
              changePercent: (security as any).quotes[0].changePercent?.toNumber(),
            } : null,
          };
        })
      );

      const filteredFunds = fundsWithMetadata.filter(fund => fund !== null);

      logger.info('Fund search completed', {
        totalResults: filteredFunds.length,
        filters,
      });

      return filteredFunds;
    } catch (error: any) {
      logger.error('Error searching funds', {
        filters,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // Get fund details with performance metrics
  async getFundDetails(symbol: string): Promise<any> {
    try {
      const security = await this.prisma.security.findUnique({
        where: { 
          symbol: symbol.toUpperCase(),
        } as any,
      });

      if (!security) {
        throw new Error('Fund not found');
      }

      const metadata = await this.getFundMetadata(security.id);

      return {
        ...security,
        marketCap: (security as any).marketCap?.toNumber(),
        recentQuotes: ((security as any).quotes || []).map((q: any) => ({
          ...q,
          last: q.last?.toNumber(),
          change: q.change?.toNumber(),
          changePercent: q.changePercent?.toNumber(),
        })),
        priceHistory: ((security as any).historicalData || []).map((h: any) => ({
          ...h,
          open: h.open.toNumber(),
          high: h.high.toNumber(),
          low: h.low.toNumber(),
          close: h.close.toNumber(),
          adjustedClose: h.adjustedClose.toNumber(),
        })),
        distributions: ((security as any).corporateActions || []).map((ca: any) => ({
          ...ca,
          value: ca.value?.toNumber(),
        })),
        fundMetadata: metadata,
      };
    } catch (error: any) {
      logger.error('Error getting fund details', {
        symbol,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // Get fund families
  async getFundFamilies(): Promise<{ name: string; count: number; totalAUM: number }[]> {
    try {
      // This would ideally be a proper aggregation query
      // For now, we'll use the metadata stored in fundamentals
      const fundamentals = await (this.prisma as any).fundamental?.findMany({
        where: {
          periodType: 'FUND_METADATA',
        },
        select: {
          additionalData: true,
          security: {
            select: {
              marketCap: true,
            },
          },
        },
      });

      const familyData = new Map<string, { count: number; totalAUM: Prisma.Decimal }>();

      fundamentals.forEach((fund: any) => {
        const metadata = fund.additionalData as any;
        const fundFamily = metadata?.fundFamily;
        const aum = fund.security?.marketCap || new Decimal(0);

        if (fundFamily) {
          const existing = familyData.get(fundFamily) || { count: 0, totalAUM: new Decimal(0) };
          familyData.set(fundFamily, {
            count: existing.count + 1,
            totalAUM: existing.totalAUM.add(aum),
          });
        }
      });

      const result = Array.from(familyData.entries())
        .map(([name, data]) => ({
          name,
          count: data.count,
          totalAUM: data.totalAUM.toNumber(),
        }))
        .sort((a, b) => b.totalAUM - a.totalAUM);

      return result;
    } catch (error: any) {
      logger.error('Error getting fund families', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // Store fund metadata in fundamentals table
  private async storeFundMetadata(securityId: string, metadata: any): Promise<void> {
    await (this.prisma as any).fundamental?.upsert({
      where: {
        securityId_periodType_periodEnd: {
          securityId,
          periodType: 'FUND_METADATA',
          periodEnd: new Date(),
        },
      },
      update: {
        additionalData: metadata,
        updatedAt: new Date(),
      },
      create: {
        securityId,
        periodType: 'FUND_METADATA',
        periodEnd: new Date(),
        reportDate: new Date(),
        additionalData: metadata,
      },
    });
  }

  // Get fund metadata
  private async getFundMetadata(securityId: string): Promise<any> {
    const result = await (this.prisma as any).fundamental?.findFirst({
      where: {
        securityId,
        periodType: 'FUND_METADATA',
      },
      orderBy: {
        periodEnd: 'desc',
      },
    });

    return result?.additionalData || {};
  }

  // Calculate fund performance metrics
  async calculateFundPerformance(
    symbol: string,
    benchmarkSymbol?: string
  ): Promise<FundPerformanceMetrics> {
    // This is a placeholder implementation
    // Actual implementation would calculate real metrics
    return {
      returns: {
        oneDay: 0.5,
        oneWeek: 1.2,
        oneMonth: 2.3,
        threeMonths: 5.6,
        sixMonths: 8.9,
        ytd: 12.4,
        oneYear: 15.3,
        threeYears: 28.7,
        fiveYears: 45.2,
        tenYears: 89.3,
        sinceInception: 125.6,
      },
      riskMetrics: {
        standardDeviation: 12.5,
        beta: 1.05,
        sharpeRatio: 1.23,
        sortinoRatio: 1.45,
        informationRatio: 0.89,
        treynorRatio: 0.15,
        maxDrawdown: -18.5,
        upCapture: 102.3,
        downCapture: 89.5,
      },
      benchmarkComparison: {
        benchmarkSymbol: benchmarkSymbol || 'SPY',
        benchmarkName: 'SPDR S&P 500 ETF',
        excessReturn: 2.3,
        trackingError: 3.5,
        informationRatio: 0.66,
      },
    };
  }
}