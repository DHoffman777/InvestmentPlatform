import { PrismaClient, Security } from '@prisma/client';
import { logger } from '../utils/logger';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface EquityData {
  symbol: string;
  name: string;
  cusip?: string;
  isin?: string;
  sedol?: string;
  equityType: 'COMMON_STOCK' | 'PREFERRED_STOCK' | 'ADR' | 'GDR';
  exchange: string;
  currency?: string;
  country?: string;
  sector?: string;
  industry?: string;
  marketCap?: Prisma.Decimal;
  sharesOutstanding?: Prisma.Decimal;
  dividendYield?: Prisma.Decimal;
  peRatio?: Prisma.Decimal;
  pbRatio?: Prisma.Decimal;
  beta?: Prisma.Decimal;
  dividendFrequency?: 'ANNUAL' | 'SEMI_ANNUAL' | 'QUARTERLY' | 'MONTHLY' | 'SPECIAL';
  isActive?: boolean;
  listingDate?: Date;
}

export interface PreferredStockData extends EquityData {
  equityType: 'PREFERRED_STOCK';
  dividendRate: Prisma.Decimal;
  parValue: Prisma.Decimal;
  callPrice?: Prisma.Decimal;
  callDate?: Date;
  convertible?: boolean;
  conversionRatio?: Prisma.Decimal;
  cumulative: boolean;
  perpetual: boolean;
  maturityDate?: Date;
}

export interface ADRData extends EquityData {
  equityType: 'ADR' | 'GDR';
  underlyingSymbol: string;
  underlyingExchange: string;
  underlyingCurrency: string;
  adrRatio: string; // e.g., "1:2" meaning 1 ADR = 2 underlying shares
  depositoryBank: string;
  level: 1 | 2 | 3; // ADR levels
  sponsored: boolean;
}

export class EquitiesService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Create or update equity security
  async upsertEquity(equityData: EquityData | PreferredStockData | ADRData): Promise<Security> {
    try {
      logger.info('Upserting equity security', {
        symbol: equityData.symbol,
        equityType: equityData.equityType,
      });

      const securityData = {
        symbol: equityData.symbol.toUpperCase(),
        name: equityData.name,
        cusip: equityData.cusip,
        isin: equityData.isin,
        sedol: equityData.sedol,
        assetClass: 'EQUITY',
        securityType: equityData.equityType,
        exchange: equityData.exchange,
        currency: equityData.currency || 'USD',
        country: equityData.country,
        sector: equityData.sector,
        industry: equityData.industry,
        marketCap: equityData.marketCap,
        isActive: equityData.isActive ?? true,
        listingDate: equityData.listingDate,
      };

      // Create extended metadata for specialized equity types
      let metadata: any = {
        dividendYield: equityData.dividendYield?.toString(),
        peRatio: equityData.peRatio?.toString(),
        pbRatio: equityData.pbRatio?.toString(),
        beta: equityData.beta?.toString(),
        sharesOutstanding: equityData.sharesOutstanding?.toString(),
        dividendFrequency: equityData.dividendFrequency,
      };

      // Add preferred stock specific metadata
      if (equityData.equityType === 'PREFERRED_STOCK') {
        const preferredData = equityData as PreferredStockData;
        metadata = {
          ...metadata,
          dividendRate: preferredData.dividendRate.toString(),
          parValue: preferredData.parValue.toString(),
          callPrice: preferredData.callPrice?.toString(),
          callDate: preferredData.callDate?.toISOString(),
          convertible: preferredData.convertible,
          conversionRatio: preferredData.conversionRatio?.toString(),
          cumulative: preferredData.cumulative,
          perpetual: preferredData.perpetual,
          maturityDate: preferredData.maturityDate?.toISOString(),
        };
      }

      // Add ADR/GDR specific metadata
      if (equityData.equityType === 'ADR' || equityData.equityType === 'GDR') {
        const adrData = equityData as ADRData;
        metadata = {
          ...metadata,
          underlyingSymbol: adrData.underlyingSymbol,
          underlyingExchange: adrData.underlyingExchange,
          underlyingCurrency: adrData.underlyingCurrency,
          adrRatio: adrData.adrRatio,
          depositoryBank: adrData.depositoryBank,
          level: adrData.level,
          sponsored: adrData.sponsored,
        };
      }

      const security = await this.prisma.security.upsert({
        where: { symbol: securityData.symbol } as Prisma.SecurityWhereUniqueInput,
        update: {
          ...securityData,
          updatedAt: new Date(),
        },
        create: securityData as unknown as Prisma.SecurityCreateInput,
      });

      // Store extended equity metadata (this would ideally be in a separate table)
      await this.storeEquityMetadata(security.id, metadata);

      logger.info('Equity security upserted successfully', {
        securityId: security.id,
        symbol: security.symbol,
        equityType: equityData.equityType,
      });

      return security;
    } catch (error: any) {
      logger.error('Error upserting equity security', {
        symbol: equityData.symbol,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // Get equity with extended information
  async getEquityDetails(symbol: string): Promise<any> {
    try {
      const security = await this.prisma.security.findFirst({
        where: { 
          symbol: symbol.toUpperCase(),
        },
      }) as any;

      if (!security) {
        return null;
      }

      // Get extended equity metadata
      const metadata = await this.getEquityMetadata(security.id);

      return {
        ...security,
        marketCap: security.marketCap?.toNumber(),
        latestQuote: null,
        recentHistory: [],
        recentActions: [],
        fundamentals: null,
        equityMetadata: metadata,
      };
    } catch (error: any) {
      logger.error('Error getting equity details', {
        symbol,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // Search equities with filtering
  async searchEquities(filters: {
    query?: string;
    equityType?: 'COMMON_STOCK' | 'PREFERRED_STOCK' | 'ADR' | 'GDR';
    exchange?: string;
    sector?: string;
    country?: string;
    minMarketCap?: number;
    maxMarketCap?: number;
    limit?: number;
  }): Promise<any[]> {
    try {
      const {
        query,
        equityType,
        exchange,
        sector,
        country,
        minMarketCap,
        maxMarketCap,
        limit = 50,
      } = filters;

      const whereClause: any = {
        assetClass: 'EQUITY',
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

      if (equityType) {
        whereClause.securityType = equityType;
      }

      if (exchange) {
        whereClause.exchange = exchange;
      }

      if (sector) {
        whereClause.sector = sector;
      }

      if (country) {
        whereClause.country = country;
      }

      if (minMarketCap !== undefined || maxMarketCap !== undefined) {
        whereClause.marketCap = {};
        if (minMarketCap !== undefined) {
          whereClause.marketCap.gte = new Decimal(minMarketCap);
        }
        if (maxMarketCap !== undefined) {
          whereClause.marketCap.lte = new Decimal(maxMarketCap);
        }
      }

      const securities = await this.prisma.security.findMany({
        where: whereClause,
        take: limit,
        orderBy: [
          { symbol: 'asc' },
        ],
      }) as any[];

      logger.info('Equity search completed', {
        filters,
        resultCount: securities.length,
      });

      return securities;
    } catch (error: any) {
      logger.error('Error searching equities', {
        filters,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // Get dividend history for equity
  async getDividendHistory(symbol: string, limit: number = 20): Promise<any[]> {
    try {
      const security = await this.prisma.security.findUnique({
        where: { symbol: symbol.toUpperCase() } as Prisma.SecurityWhereUniqueInput,
      });

      if (!security) {
        throw new Error('Security not found');
      }

      const dividends = await this.prisma.corporateAction.findMany({
        where: {
          securityId: security.id,
          actionType: 'DIVIDEND',
          status: 'PROCESSED',
        },
        take: limit,
        orderBy: { exDate: 'desc' },
      });

      return dividends.map((dividend: any) => ({
        ...dividend,
        value: dividend.value?.toNumber(),
      }));
    } catch (error: any) {
      logger.error('Error getting dividend history', {
        symbol,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // Calculate dividend metrics
  async calculateDividendMetrics(symbol: string): Promise<{
    dividendYield: number | null;
    annualDividend: number | null;
    payoutRatio: number | null;
    dividendGrowthRate: number | null;
  }> {
    try {
      const security = await this.prisma.security.findUnique({
        where: { symbol: symbol.toUpperCase() } as Prisma.SecurityWhereUniqueInput,
      }) as any;

      if (!security) {
        throw new Error('Security not found');
      }

      // Get last 12 months of dividends
      const oneYearAgo = new Date();
      oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

      const recentDividends = await this.prisma.corporateAction.findMany({
        where: {
          securityId: security.id,
          actionType: 'DIVIDEND',
          exDate: { gte: oneYearAgo },
          status: 'PROCESSED',
        },
        orderBy: { exDate: 'desc' },
      });

      const annualDividend = recentDividends.reduce(
        (sum, div: any) => sum + (div.value?.toNumber() || 0),
        0
      );

      const currentPrice = 0; // Since we're not including quotes
      const dividendYield = currentPrice && annualDividend > 0 
        ? (annualDividend / currentPrice) * 100
        : null;

      const eps = 0; // Since we're not including fundamentals
      const payoutRatio = eps && annualDividend > 0
        ? (annualDividend / eps) * 100
        : null;

      // Calculate dividend growth rate (simplified - comparing to previous year)
      const twoYearsAgo = new Date(oneYearAgo);
      twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 1);

      const previousYearDividends = await this.prisma.corporateAction.findMany({
        where: {
          securityId: security.id,
          actionType: 'DIVIDEND',
          exDate: { gte: twoYearsAgo, lt: oneYearAgo },
          status: 'PROCESSED',
        },
      });

      const previousAnnualDividend = previousYearDividends.reduce(
        (sum, div: any) => sum + (div.value?.toNumber() || 0),
        0
      );

      const dividendGrowthRate = previousAnnualDividend > 0 && annualDividend > 0
        ? ((annualDividend - previousAnnualDividend) / previousAnnualDividend) * 100
        : null;

      return {
        dividendYield,
        annualDividend: annualDividend > 0 ? annualDividend : null,
        payoutRatio,
        dividendGrowthRate,
      };
    } catch (error: any) {
      logger.error('Error calculating dividend metrics', {
        symbol,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // Helper method to store extended equity metadata
  private async storeEquityMetadata(securityId: string, metadata: any): Promise<any> {
    // This is a placeholder - in a production system, you'd want a separate table
    // @ts-ignore - fundamental model may not exist yet
    // for now, we'll store this in the fundamental data as additional data
    try {
      // Temporarily disabled until fundamental model is available
      // await this.prisma.fundamental.upsert({...
    } catch (error: any) {
      logger.warn('Could not store equity metadata', { securityId, error });
    }
  }

  // Helper method to retrieve extended equity metadata
  private async getEquityMetadata(securityId: string): Promise<any> {
    try {
      // Temporarily disabled until fundamental model is available
      // const metadata = await this.prisma.fundamental.findFirst({...
      return {};
    } catch (error: any) {
      logger.warn('Could not retrieve equity metadata', { securityId, error });
      return {};
    }
  }
}


