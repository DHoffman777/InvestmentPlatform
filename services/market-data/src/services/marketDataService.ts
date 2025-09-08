import { PrismaClient, Prisma } from '@prisma/client';
import { logger } from '../utils/logger';
import { cacheGetJSON, cacheSetJSON, cacheGet, cacheSet } from '../config/redis';
import axios from 'axios';
import Decimal from 'decimal.js';

export class MarketDataService {
  private prisma: PrismaClient;
  private kafkaService: any; // Will be injected

  constructor(prisma: PrismaClient, kafkaService?: any) {
    this.prisma = prisma;
    this.kafkaService = kafkaService;
  }

  // Get real-time quote for a security
  async getRealtimeQuote(symbol: string): Promise<any> {
    try {
      // Try cache first
      const cacheKey = `quote:${symbol}`;
      let quote = await cacheGetJSON(cacheKey);
      
      if (quote) {
        logger.debug(`Quote cache hit for ${symbol}`);
        return quote;
      }

      // Get from database
      quote = await (this.prisma as any).quote.findFirst({
        where: {
          security: { symbol },
        },
        include: {
          security: {
            select: {
              symbol: true,
              name: true,
              exchange: true,
              currency: true,
            }
          }
        },
        orderBy: { quoteTime: 'desc' }
      });

      if (quote) {
        // Cache for 30 seconds
        await cacheSetJSON(cacheKey, quote, 30);
      }

      return quote;
    } catch (error: any) {
      logger.error('Error fetching realtime quote:', { symbol, error });
      throw error;
    }
  }

  // Get multiple quotes at once
  async getMultipleQuotes(symbols: string[]): Promise<any[]> {
    try {
      const quotes = await Promise.all(
        symbols.map(symbol => this.getRealtimeQuote(symbol))
      );

      return quotes.filter(quote => quote !== null);
    } catch (error: any) {
      logger.error('Error fetching multiple quotes:', { symbols, error });
      throw error;
    }
  }

  // Store a new quote
  async storeQuote(quoteData: {
    symbol: string;
    bid?: number;
    ask?: number;
    last?: number;
    open?: number;
    high?: number;
    low?: number;
    close?: number;
    previousClose?: number;
    volume?: number;
    source: string;
  }): Promise<any> {
    try {
      // Find the security
      const security = await this.prisma.security.findUnique({
        where: { symbol: quoteData.symbol } as any
      });

      if (!security) {
        throw new Error(`Security not found: ${quoteData.symbol}`);
      }

      // Calculate change and change percent
      let change: Prisma.Decimal | undefined;
      let changePercent: Prisma.Decimal | undefined;
      
      if (quoteData.last && quoteData.previousClose) {
        change = new Decimal(quoteData.last).sub(new Decimal(quoteData.previousClose)) as any;
        changePercent = (change as any).div(new Decimal(quoteData.previousClose)).mul(100) as any;
      }

      // Create the quote
      const quote = await (this.prisma as any).quote.create({
        data: {
          securityId: security.id,
          bid: quoteData.bid ? new Prisma.Decimal(quoteData.bid) : null,
          ask: quoteData.ask ? new Prisma.Decimal(quoteData.ask) : null,
          last: quoteData.last ? new Prisma.Decimal(quoteData.last) : null,
          open: quoteData.open ? new Prisma.Decimal(quoteData.open) : null,
          high: quoteData.high ? new Prisma.Decimal(quoteData.high) : null,
          low: quoteData.low ? new Prisma.Decimal(quoteData.low) : null,
          close: quoteData.close ? new Prisma.Decimal(quoteData.close) : null,
          previousClose: quoteData.previousClose ? new Prisma.Decimal(quoteData.previousClose) : null,
          volume: quoteData.volume ? BigInt(quoteData.volume) : null,
          change,
          changePercent,
          quoteTime: new Date(),
          source: quoteData.source,
        },
        include: {
          security: {
            select: {
              symbol: true,
              name: true,
            }
          }
        }
      });

      // Invalidate cache
      const cacheKey = `quote:${quoteData.symbol}`;
      await cacheSetJSON(cacheKey, quote, 30);

      // Publish to Kafka if available
      if (this.kafkaService) {
        await this.kafkaService.publishEvent('market-data.quote.updated', {
          symbol: quoteData.symbol,
          quote,
          timestamp: new Date().toISOString(),
        });
      }

      logger.info('Quote stored', {
        symbol: quoteData.symbol,
        last: quoteData.last,
        source: quoteData.source,
      });

      return quote;
    } catch (error: any) {
      logger.error('Error storing quote:', { quoteData, error });
      throw error;
    }
  }

  // Get historical data for a security
  async getHistoricalData(
    symbol: string, 
    startDate: Date, 
    endDate: Date,
    source?: string
  ): Promise<any[]> {
    try {
      const whereClause: any = {
        security: { symbol },
        date: {
          gte: startDate,
          lte: endDate,
        },
      };

      if (source) {
        whereClause.source = source;
      }

      const historicalData = await (this.prisma as any).historicalData.findMany({
        where: whereClause,
        include: {
          security: {
            select: {
              symbol: true,
              name: true,
            }
          }
        },
        orderBy: { date: 'asc' }
      });

      return historicalData;
    } catch (error: any) {
      logger.error('Error fetching historical data:', { symbol, startDate, endDate, error });
      throw error;
    }
  }

  // Store historical data
  async storeHistoricalData(historicalData: {
    symbol: string;
    date: Date;
    open: number;
    high: number;
    low: number;
    close: number;
    adjustedClose: number;
    volume: number;
    source: string;
    dividend?: number;
    splitRatio?: number;
  }): Promise<any> {
    try {
      // Find the security
      const security = await this.prisma.security.findUnique({
        where: { symbol: historicalData.symbol } as any
      });

      if (!security) {
        throw new Error(`Security not found: ${historicalData.symbol}`);
      }

      // Upsert historical data
      const data = await (this.prisma as any).historicalData.upsert({
        where: {
          securityId_date_source: {
            securityId: security.id,
            date: historicalData.date,
            source: historicalData.source,
          }
        },
        update: {
          open: new Prisma.Decimal(historicalData.open),
          high: new Prisma.Decimal(historicalData.high),
          low: new Prisma.Decimal(historicalData.low),
          close: new Prisma.Decimal(historicalData.close),
          adjustedClose: new Prisma.Decimal(historicalData.adjustedClose),
          volume: BigInt(historicalData.volume),
          dividend: historicalData.dividend ? new Prisma.Decimal(historicalData.dividend) : null,
          splitRatio: historicalData.splitRatio ? new Prisma.Decimal(historicalData.splitRatio) : null,
        },
        create: {
          securityId: security.id,
          date: historicalData.date,
          open: new Prisma.Decimal(historicalData.open),
          high: new Prisma.Decimal(historicalData.high),
          low: new Prisma.Decimal(historicalData.low),
          close: new Prisma.Decimal(historicalData.close),
          adjustedClose: new Prisma.Decimal(historicalData.adjustedClose),
          volume: BigInt(historicalData.volume),
          source: historicalData.source,
          dividend: historicalData.dividend ? new Prisma.Decimal(historicalData.dividend) : null,
          splitRatio: historicalData.splitRatio ? new Prisma.Decimal(historicalData.splitRatio) : null,
        },
        include: {
          security: {
            select: {
              symbol: true,
              name: true,
            }
          }
        }
      });

      return data;
    } catch (error: any) {
      logger.error('Error storing historical data:', { historicalData, error });
      throw error;
    }
  }

  // Create or update a security
  async upsertSecurity(securityData: {
    symbol: string;
    name: string;
    cusip?: string;
    isin?: string;
    assetClass: string;
    securityType: string;
    exchange: string;
    currency?: string;
    country?: string;
    sector?: string;
    industry?: string;
    marketCap?: number;
  }): Promise<any> {
    try {
      const security = await this.prisma.security.upsert({
        where: { symbol: securityData.symbol } as any,
        update: {
          name: securityData.name,
          // cusip: securityData.cusip,
          // isin: securityData.isin,
          // assetClass: securityData.assetClass,
          securityType: securityData.securityType,
          exchange: securityData.exchange,
          currency: securityData.currency || 'USD',
          // country: securityData.country,
          // sector: securityData.sector,
          // industry: securityData.industry,
          // marketCap: securityData.marketCap ? new Prisma.Decimal(securityData.marketCap) : null,
        } as any,
        create: {
          symbol: securityData.symbol,
          name: securityData.name,
          // cusip: securityData.cusip,
          // isin: securityData.isin,
          // assetClass: securityData.assetClass,
          securityType: securityData.securityType,
          exchange: securityData.exchange,
          currency: securityData.currency || 'USD',
          // country: securityData.country,
          // sector: securityData.sector,
          // industry: securityData.industry,
          // marketCap: securityData.marketCap ? new Prisma.Decimal(securityData.marketCap) : null,
        } as any
      });

      logger.info('Security upserted', {
        symbol: securityData.symbol,
        name: securityData.name,
      });

      return security;
    } catch (error: any) {
      logger.error('Error upserting security:', { securityData, error });
      throw error;
    }
  }

  // Search securities
  async searchSecurities(query: string, limit: number = 10): Promise<any[]> {
    try {
      const securities = await this.prisma.security.findMany({
        where: {
          OR: [
            { symbol: { contains: query, mode: 'insensitive' } },
            { name: { contains: query, mode: 'insensitive' } },
            // { cusip: { contains: query, mode: 'insensitive' } },
            // { isin: { contains: query, mode: 'insensitive' } },
          ],
          isActive: true,
        },
        take: limit,
        orderBy: [
          { symbol: 'asc' }
        ]
      });

      return securities;
    } catch (error: any) {
      logger.error('Error searching securities:', { query, error });
      throw error;
    }
  }

  // Get corporate actions for a security
  async getCorporateActions(symbol: string, startDate?: Date, endDate?: Date): Promise<any[]> {
    try {
      const whereClause: any = {
        security: { symbol },
      };

      if (startDate || endDate) {
        whereClause.exDate = {};
        if (startDate) whereClause.exDate.gte = startDate;
        if (endDate) whereClause.exDate.lte = endDate;
      }

      const corporateActions = await (this.prisma as any).corporateAction.findMany({
        where: whereClause,
        include: {
          security: {
            select: {
              symbol: true,
              name: true,
            }
          }
        },
        orderBy: { exDate: 'desc' }
      });

      return corporateActions;
    } catch (error: any) {
      logger.error('Error fetching corporate actions:', { symbol, error });
      throw error;
    }
  }

  // Store corporate action
  async storeCorporateAction(corporateActionData: {
    symbol: string;
    actionType: string;
    exDate: Date;
    recordDate?: Date;
    payDate?: Date;
    announcementDate?: Date;
    effectiveDate?: Date;
    description: string;
    value?: number;
    ratio?: string;
    currency?: string;
  }): Promise<any> {
    try {
      // Find the security
      const security = await this.prisma.security.findUnique({
        where: { symbol: corporateActionData.symbol } as any
      });

      if (!security) {
        throw new Error(`Security not found: ${corporateActionData.symbol}`);
      }

      const corporateAction = await (this.prisma as any).corporateAction.create({
        data: {
          securityId: security.id,
          actionType: corporateActionData.actionType,
          exDate: corporateActionData.exDate || undefined,
          recordDate: corporateActionData.recordDate || undefined,
          payDate: corporateActionData.payDate || undefined,
          announcementDate: corporateActionData.announcementDate,
          effectiveDate: corporateActionData.effectiveDate,
          description: corporateActionData.description,
          value: corporateActionData.value ? new Prisma.Decimal(corporateActionData.value) : null,
          ratio: corporateActionData.ratio,
          currency: corporateActionData.currency || 'USD',
        },
        include: {
          security: {
            select: {
              symbol: true,
              name: true,
            }
          }
        }
      });

      // Publish to Kafka if available
      if (this.kafkaService) {
        await this.kafkaService.publishEvent('market-data.corporate-action.created', {
          symbol: corporateActionData.symbol,
          corporateAction,
          timestamp: new Date().toISOString(),
        });
      }

      logger.info('Corporate action stored', {
        symbol: corporateActionData.symbol,
        actionType: corporateActionData.actionType,
        exDate: corporateActionData.exDate,
      });

      return corporateAction;
    } catch (error: any) {
      logger.error('Error storing corporate action:', { corporateActionData, error });
      throw error;
    }
  }

  // Check if market is open
  async isMarketOpen(market: string = 'NYSE'): Promise<boolean> {
    try {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      // Check if today is a holiday
      const holiday = await (this.prisma as any).holiday.findFirst({
        where: {
          date: today,
          market,
        }
      });

      if (holiday) {
        return false;
      }

      // Check if it's weekend
      const dayOfWeek = now.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 6) { // Sunday or Saturday
        return false;
      }

      // Check market hours (9:30 AM to 4:00 PM ET)
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTime = currentHour * 100 + currentMinute;

      return currentTime >= 930 && currentTime <= 1600;
    } catch (error: any) {
      logger.error('Error checking market status:', { market, error });
      return false;
    }
  }
}

