import { PrismaClient, Security } from '@prisma/client';
import { logger } from '../utils/logger';
import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

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
  marketCap: Prisma.Decimal;
  dividendYield?: Prisma.Decimal;
  distributionFrequency?: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL';
  
  // Financial metrics
  fundsFromOperations?: Prisma.Decimal; // FFO - key REIT metric
  adjustedFFO?: Prisma.Decimal; // AFFO
  netAssetValue?: Prisma.Decimal; // NAV per share
  priceToFFO?: Prisma.Decimal; // P/FFO ratio
  debtToEquityRatio?: Prisma.Decimal;
  occupancyRate?: Prisma.Decimal; // As percentage
  
  // Geographic focus
  geographicFocus?: 'DOMESTIC' | 'INTERNATIONAL' | 'GLOBAL';
  primaryMarkets?: string[]; // e.g., ['New York', 'California', 'Texas']
  
  // Management
  managementCompany?: string;
  portfolioManager?: string;
  totalProperties?: number;
  totalSquareFootage?: Prisma.Decimal;
  
  // Performance metrics
  totalReturn1Y?: Prisma.Decimal;
  totalReturn3Y?: Prisma.Decimal;
  totalReturn5Y?: Prisma.Decimal;
  beta?: Prisma.Decimal;
  standardDeviation?: Prisma.Decimal;
  
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
  marketCap: Prisma.Decimal;
  
  // Distribution characteristics
  distributionYield?: Prisma.Decimal;
  distributionFrequency?: 'MONTHLY' | 'QUARTERLY' | 'SEMI_ANNUAL' | 'ANNUAL';
  distributionCoverage?: Prisma.Decimal; // Distribution coverage ratio
  distributionGrowthRate?: Prisma.Decimal; // Annual growth rate
  
  // Financial metrics
  distributableCashFlow?: Prisma.Decimal; // DCF - key MLP metric
  ebitda?: Prisma.Decimal;
  debtToEbitda?: Prisma.Decimal;
  returnOnInvestedCapital?: Prisma.Decimal; // ROIC
  
  // Asset information
  pipelineMiles?: Prisma.Decimal; // For pipeline MLPs
  storageCapacity?: Prisma.Decimal; // For storage MLPs
  processingCapacity?: Prisma.Decimal; // For processing MLPs
  
  // Geographic presence
  operatingRegions?: string[];
  assetLocations?: string[];
  
  // Management and structure
  generalPartner: string; // GP entity
  incentiveDistributionRights?: boolean; // IDRs
  managementFee?: Prisma.Decimal;
  
  // Tax considerations
  k1Eligible: boolean; // Issues K-1 tax forms
  qualifiedIncome?: Prisma.Decimal; // Percentage of income that's tax-advantaged
  
  // Performance metrics
  totalReturn1Y?: Prisma.Decimal;
  totalReturn3Y?: Prisma.Decimal;
  totalReturn5Y?: Prisma.Decimal;
  beta?: Prisma.Decimal;
  standardDeviation?: Prisma.Decimal;
  
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
        where: { symbol: securityData.symbol } as Prisma.SecurityWhereUniqueInput,
        update: {
          ...securityData,
          updatedAt: new Date(),
        },
        create: securityData as unknown as Prisma.SecurityCreateInput,
      });

      await this.storeREITMetadata(security.id, metadata);

      logger.info('REIT upserted successfully', {
        securityId: security.id,
        symbol: security.symbol,
      });

      return security;
    } catch (error: any) {
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
        where: { symbol: securityData.symbol } as Prisma.SecurityWhereUniqueInput,
        update: {
          ...securityData,
          updatedAt: new Date(),
        },
        create: securityData as unknown as Prisma.SecurityCreateInput,
      });

      await this.storeREITMetadata(security.id, metadata);

      logger.info('MLP upserted successfully', {
        securityId: security.id,
        symbol: security.symbol,
      });

      return security;
    } catch (error: any) {
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
          { symbol: 'asc' },
        ],
      }) as any[];

      // Get metadata and apply additional filters
      const resultsWithMetadata = await Promise.all(
        securities.map(async (security) => {
          const metadata = await this.getREITMetadata(security.id);

          // Apply metadata-based filters
          if (filters.reitType && (security as any).assetClass === 'REIT' && 
              metadata.reitType !== filters.reitType) {
            return null;
          }

          if (filters.mlpType && (security as any).assetClass === 'MLP' && 
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
            latestQuote: null,
          };
        })
      );

      const filteredResults = resultsWithMetadata.filter(result => result !== null);

      logger.info('REITs/MLPs search completed', {
        filters,
        resultCount: filteredResults.length,
      });

      return filteredResults;
    } catch (error: any) {
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
      const security = await this.prisma.security.findFirst({
        where: { 
          symbol: symbol.toUpperCase(),
        },
      }) as any;

      if (!security) {
        return null;
      }

      const metadata = await this.getREITMetadata(security.id);

      return {
        ...security,
        marketCap: security.marketCap?.toNumber(),
        recentQuotes: [],
        priceHistory: [],
        distributions: [],
        metadata,
      };
    } catch (error: any) {
      logger.error('Error getting REIT/MLP details', {
        symbol,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  // Helper method to store REIT/MLP metadata
  private async storeREITMetadata(securityId: string, metadata: any): Promise<any> {
    try {
      // Temporarily disabled until fundamental model is available
      // await this.prisma.fundamental.upsert({
      // where: {
      //   securityId_periodType_periodEnd: {
      //     securityId,
      //     periodType: 'REIT_MLP_METADATA',
      //     periodEnd: new Date(),
      //   },
      // },
      // update: {
      //   additionalData: metadata,
      //   updatedAt: new Date(),
      // },
      // create: {
      //   securityId,
      //   periodType: 'REIT_MLP_METADATA',
      //   periodEnd: new Date(),
      //   reportDate: new Date(),
      //   additionalData: metadata,
      // },
      // });
    } catch (error: any) {
      logger.warn('Could not store REIT/MLP metadata', { securityId, error });
    }
  }

  // Helper method to retrieve REIT/MLP metadata
  private async getREITMetadata(securityId: string): Promise<any> {
    try {
      // Temporarily disabled until fundamental model is available
      // const metadata = await this.prisma.fundamental.findFirst({
      //   where: {
      //     securityId,
      //     periodType: 'REIT_MLP_METADATA',
      //   },
      //   orderBy: { updatedAt: 'desc' },
      // });
      // return metadata?.additionalData || {};
      return {};
    } catch (error: any) {
      logger.warn('Could not retrieve REIT/MLP metadata', { securityId, error });
      return {};
    }
  }
}


