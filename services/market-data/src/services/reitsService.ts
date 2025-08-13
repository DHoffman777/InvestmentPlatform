import { PrismaClient, Security } from '@prisma/client';
import { logger } from '../utils/logger';
import { Decimal } from 'decimal.js';

export interface REITData {
  symbol: string;
  name: string;
  cusip?: string;
  isin?: string;
  securityType: 'REIT';
  exchange: string;
  currency?: string;
  country?: string;
  
  // REIT specific fields
  reitType: 'EQUITY_REIT' | 'MORTGAGE_REIT' | 'HYBRID_REIT';
  propertyTypes: string[]; // e.g., ['Office', 'Retail', 'Residential', 'Industrial']
  marketCap: Decimal;
  dividendYield?: Decimal;
  distributionFrequency?: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL';
  
  // Financial metrics
  fundsFromOperations?: Decimal; // FFO - key REIT metric
  adjustedFFO?: Decimal; // AFFO
  netAssetValue?: Decimal; // NAV per share
  priceToFFO?: Decimal; // P/FFO ratio
  debtToEquityRatio?: Decimal;
  occupancyRate?: Decimal; // As percentage
  
  // Geographic focus
  geographicFocus?: 'DOMESTIC' | 'INTERNATIONAL' | 'GLOBAL';
  primaryMarkets?: string[]; // e.g., ['New York', 'California', 'Texas']
  
  // Management
  managementCompany?: string;
  portfolioManager?: string;
  totalProperties?: number;
  totalSquareFootage?: Decimal;
  
  // Performance metrics
  totalReturn1Y?: Decimal;
  totalReturn3Y?: Decimal;
  totalReturn5Y?: Decimal;
  beta?: Decimal;
  standardDeviation?: Decimal;
  
  isActive?: boolean;
}

export interface MLPData {
  symbol: string;
  name: string;
  cusip?: string;
  isin?: string;
  securityType: 'MLP';
  exchange: string;
  currency?: string;
  country?: string;
  
  // MLP specific fields
  mlpType: 'ENERGY' | 'NATURAL_RESOURCES' | 'INFRASTRUCTURE' | 'REAL_ESTATE' | 'OTHER';
  businessDescription: string;
  sector: string;
  subSector?: string;
  marketCap: Decimal;
  
  // Distribution characteristics
  distributionYield?: Decimal;
  distributionFrequency?: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL';
  distributionCoverage?: Decimal; // Distribution coverage ratio
  distributionGrowthRate?: Decimal; // Annual growth rate
  
  // Financial metrics
  distributableCashFlow?: Decimal; // DCF - key MLP metric
  ebitda?: Decimal;
  debtToEbitda?: Decimal;
  returnOnInvestedCapital?: Decimal; // ROIC
  
  // Asset information
  pipelineMiles?: Decimal; // For pipeline MLPs
  storageCapacity?: Decimal; // For storage MLPs
  processingCapacity?: Decimal; // For processing MLPs
  
  // Geographic presence
  operatingRegions?: string[];
  assetLocations?: string[];
  
  // Management and structure
  generalPartner: string; // GP entity
  incentiveDistributionRights?: boolean; // IDRs
  managementFee?: Decimal;
  
  // Tax considerations
  k1Eligible: boolean; // Issues K-1 tax forms
  qualifiedIncome?: Decimal; // Percentage of income that's tax-advantaged
  
  // Performance metrics
  totalReturn1Y?: Decimal;
  totalReturn3Y?: Decimal;
  totalReturn5Y?: Decimal;
  beta?: Decimal;
  standardDeviation?: Decimal;
  
  isActive?: boolean;
}

export class REITsService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  // Create or update REIT
  async upsertREIT(reitData: REITData): Promise<Security> {
    try {
      logger.info('Upserting REIT', {
        symbol: reitData.symbol,
        reitType: reitData.reitType,
      });

      const securityData = {
        symbol: reitData.symbol.toUpperCase(),
        name: reitData.name,
        cusip: reitData.cusip,
        isin: reitData.isin,
        assetClass: 'REIT',
        securityType: reitData.reitType,
        exchange: reitData.exchange,
        currency: reitData.currency || 'USD',
        country: reitData.country || 'US',
        sector: 'Real Estate',
        industry: `${reitData.reitType} - ${reitData.propertyTypes.join(', ')}`,
        marketCap: reitData.marketCap,
        isActive: reitData.isActive ?? true,
      };

      const metadata = {
        securityType: reitData.securityType,
        reitType: reitData.reitType,
        propertyTypes: reitData.propertyTypes,
        dividendYield: reitData.dividendYield?.toString(),
        distributionFrequency: reitData.distributionFrequency,
        fundsFromOperations: reitData.fundsFromOperations?.toString(),
        adjustedFFO: reitData.adjustedFFO?.toString(),
        netAssetValue: reitData.netAssetValue?.toString(),
        priceToFFO: reitData.priceToFFO?.toString(),
        debtToEquityRatio: reitData.debtToEquityRatio?.toString(),
        occupancyRate: reitData.occupancyRate?.toString(),
        geographicFocus: reitData.geographicFocus,
        primaryMarkets: reitData.primaryMarkets,
        managementCompany: reitData.managementCompany,
        portfolioManager: reitData.portfolioManager,
        totalProperties: reitData.totalProperties,
        totalSquareFootage: reitData.totalSquareFootage?.toString(),
        totalReturn1Y: reitData.totalReturn1Y?.toString(),
        totalReturn3Y: reitData.totalReturn3Y?.toString(),
        totalReturn5Y: reitData.totalReturn5Y?.toString(),
        beta: reitData.beta?.toString(),
        standardDeviation: reitData.standardDeviation?.toString(),
      };

      const security = await this.prisma.security.upsert({
        where: { symbol: securityData.symbol },
        update: {
          ...securityData,
          updatedAt: new Date(),
        },
        create: securityData,
      });

      await this.storeREITMetadata(security.id, metadata);

      logger.info('REIT upserted successfully', {
        securityId: security.id,
        symbol: security.symbol,
      });

      return security;
    } catch (error) {
      logger.error('Error upserting REIT', {
        symbol: reitData.symbol,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // Create or update MLP
  async upsertMLP(mlpData: MLPData): Promise<Security> {
    try {
      logger.info('Upserting MLP', {
        symbol: mlpData.symbol,
        mlpType: mlpData.mlpType,
      });

      const securityData = {
        symbol: mlpData.symbol.toUpperCase(),
        name: mlpData.name,
        cusip: mlpData.cusip,
        isin: mlpData.isin,
        assetClass: 'MLP',
        securityType: mlpData.mlpType,
        exchange: mlpData.exchange,
        currency: mlpData.currency || 'USD',
        country: mlpData.country || 'US',
        sector: mlpData.sector,
        industry: mlpData.subSector || mlpData.mlpType,
        marketCap: mlpData.marketCap,
        isActive: mlpData.isActive ?? true,
      };

      const metadata = {
        securityType: mlpData.securityType,
        mlpType: mlpData.mlpType,
        businessDescription: mlpData.businessDescription,
        distributionYield: mlpData.distributionYield?.toString(),
        distributionFrequency: mlpData.distributionFrequency,
        distributionCoverage: mlpData.distributionCoverage?.toString(),
        distributionGrowthRate: mlpData.distributionGrowthRate?.toString(),
        distributableCashFlow: mlpData.distributableCashFlow?.toString(),
        ebitda: mlpData.ebitda?.toString(),
        debtToEbitda: mlpData.debtToEbitda?.toString(),
        returnOnInvestedCapital: mlpData.returnOnInvestedCapital?.toString(),
        pipelineMiles: mlpData.pipelineMiles?.toString(),
        storageCapacity: mlpData.storageCapacity?.toString(),
        processingCapacity: mlpData.processingCapacity?.toString(),
        operatingRegions: mlpData.operatingRegions,
        assetLocations: mlpData.assetLocations,
        generalPartner: mlpData.generalPartner,
        incentiveDistributionRights: mlpData.incentiveDistributionRights,
        managementFee: mlpData.managementFee?.toString(),
        k1Eligible: mlpData.k1Eligible,
        qualifiedIncome: mlpData.qualifiedIncome?.toString(),
        totalReturn1Y: mlpData.totalReturn1Y?.toString(),
        totalReturn3Y: mlpData.totalReturn3Y?.toString(),
        totalReturn5Y: mlpData.totalReturn5Y?.toString(),
        beta: mlpData.beta?.toString(),
        standardDeviation: mlpData.standardDeviation?.toString(),
      };

      const security = await this.prisma.security.upsert({
        where: { symbol: securityData.symbol },
        update: {
          ...securityData,
          updatedAt: new Date(),
        },
        create: securityData,
      });

      await this.storeREITMetadata(security.id, metadata);

      logger.info('MLP upserted successfully', {
        securityId: security.id,
        symbol: security.symbol,
      });

      return security;
    } catch (error) {
      logger.error('Error upserting MLP', {
        symbol: mlpData.symbol,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // Search REITs and MLPs with advanced filtering
  async searchREITsAndMLPs(filters: {
    query?: string;
    securityType?: 'REIT' | 'MLP';
    reitType?: 'EQUITY_REIT' | 'MORTGAGE_REIT' | 'HYBRID_REIT';
    mlpType?: 'ENERGY' | 'NATURAL_RESOURCES' | 'INFRASTRUCTURE' | 'REAL_ESTATE' | 'OTHER';
    propertyTypes?: string[];
    minMarketCap?: number;
    maxMarketCap?: number;
    minDividendYield?: number;
    maxPriceToFFO?: number;
    geographicFocus?: string;
    sector?: string;
    limit?: number;
  }): Promise<any[]> {
    try {
      const {
        query,
        securityType,
        minMarketCap,
        maxMarketCap,
        sector,
        limit = 50,
      } = filters;

      const whereClause: any = {
        assetClass: { in: ['REIT', 'MLP'] },
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

      if (securityType === 'REIT') {
        whereClause.assetClass = 'REIT';
      } else if (securityType === 'MLP') {
        whereClause.assetClass = 'MLP';
      }

      if (sector) {
        whereClause.sector = { contains: sector, mode: 'insensitive' };
      }

      if (minMarketCap !== undefined) {
        whereClause.marketCap = { gte: new Decimal(minMarketCap) };
      }

      if (maxMarketCap !== undefined) {
        whereClause.marketCap = {
          ...whereClause.marketCap,
          lte: new Decimal(maxMarketCap),
        };
      }

      const securities = await this.prisma.security.findMany({
        where: whereClause,
        take: limit,
        orderBy: [
          { marketCap: 'desc' },
          { symbol: 'asc' },
        ],
        include: {
          quotes: {
            take: 1,
            orderBy: { quoteTime: 'desc' },
          },
        },
      });

      // Get metadata and apply additional filters
      const resultsWithMetadata = await Promise.all(
        securities.map(async (security) => {
          const metadata = await this.getREITMetadata(security.id);

          // Apply metadata-based filters
          if (filters.reitType && security.assetClass === 'REIT' && 
              metadata.reitType !== filters.reitType) {
            return null;
          }

          if (filters.mlpType && security.assetClass === 'MLP' && 
              metadata.mlpType !== filters.mlpType) {
            return null;
          }

          if (filters.propertyTypes && metadata.propertyTypes && 
              !filters.propertyTypes.some(type => metadata.propertyTypes.includes(type))) {
            return null;
          }

          if (filters.minDividendYield && metadata.dividendYield && 
              parseFloat(metadata.dividendYield) < filters.minDividendYield) {
            return null;
          }

          if (filters.maxPriceToFFO && metadata.priceToFFO && 
              parseFloat(metadata.priceToFFO) > filters.maxPriceToFFO) {
            return null;
          }

          if (filters.geographicFocus && metadata.geographicFocus !== filters.geographicFocus) {
            return null;
          }

          return {
            ...security,
            marketCap: security.marketCap?.toNumber(),
            metadata,
            latestQuote: security.quotes[0] ? {
              ...security.quotes[0],
              last: security.quotes[0].last?.toNumber(),
              change: security.quotes[0].change?.toNumber(),
              changePercent: security.quotes[0].changePercent?.toNumber(),
            } : null,
          };
        })
      );

      const filteredResults = resultsWithMetadata.filter(result => result !== null);

      logger.info('REITs/MLPs search completed', {
        filters,
        resultCount: filteredResults.length,
      });

      return filteredResults;
    } catch (error) {
      logger.error('Error searching REITs/MLPs', {
        filters,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // Get detailed REIT/MLP information
  async getREITOrMLPDetails(symbol: string): Promise<any> {
    try {
      const security = await this.prisma.security.findUnique({
        where: { 
          symbol: symbol.toUpperCase(),
          assetClass: { in: ['REIT', 'MLP'] },
        },
        include: {
          quotes: {
            take: 5,
            orderBy: { quoteTime: 'desc' },
          },
          historicalData: {
            take: 90,
            orderBy: { date: 'desc' },
          },
          corporateActions: {
            where: {
              actionType: { in: ['DIVIDEND', 'DISTRIBUTION'] },
              status: 'PROCESSED',
            },
            take: 20,
            orderBy: { exDate: 'desc' },
          },
        },
      });

      if (!security) {
        return null;
      }

      const metadata = await this.getREITMetadata(security.id);

      return {
        ...security,
        marketCap: security.marketCap?.toNumber(),
        recentQuotes: security.quotes.map(q => ({
          ...q,
          last: q.last?.toNumber(),
          change: q.change?.toNumber(),
          changePercent: q.changePercent?.toNumber(),
        })),
        priceHistory: security.historicalData.map(h => ({
          ...h,
          open: h.open.toNumber(),
          high: h.high.toNumber(),
          low: h.low.toNumber(),
          close: h.close.toNumber(),
          adjustedClose: h.adjustedClose.toNumber(),
        })),
        distributions: security.corporateActions.map(ca => ({
          ...ca,
          value: ca.value?.toNumber(),
        })),
        metadata,
      };
    } catch (error) {
      logger.error('Error getting REIT/MLP details', {
        symbol,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // Helper method to store REIT/MLP metadata
  private async storeREITMetadata(securityId: string, metadata: any): Promise<void> {
    try {
      await this.prisma.fundamental.upsert({
        where: {
          securityId_periodType_periodEnd: {
            securityId,
            periodType: 'REIT_MLP_METADATA',
            periodEnd: new Date(),
          },
        },
        update: {
          additionalData: metadata,
          updatedAt: new Date(),
        },
        create: {
          securityId,
          periodType: 'REIT_MLP_METADATA',
          periodEnd: new Date(),
          reportDate: new Date(),
          additionalData: metadata,
        },
      });
    } catch (error) {
      logger.warn('Could not store REIT/MLP metadata', { securityId, error });
    }
  }

  // Helper method to retrieve REIT/MLP metadata
  private async getREITMetadata(securityId: string): Promise<any> {
    try {
      const metadata = await this.prisma.fundamental.findFirst({
        where: {
          securityId,
          periodType: 'REIT_MLP_METADATA',
        },
        orderBy: { updatedAt: 'desc' },
      });

      return metadata?.additionalData || {};
    } catch (error) {
      logger.warn('Could not retrieve REIT/MLP metadata', { securityId, error });
      return {};
    }
  }
}