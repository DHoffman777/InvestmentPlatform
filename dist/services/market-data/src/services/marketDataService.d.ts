import { PrismaClient } from '@prisma/client';
export declare class MarketDataService {
    private prisma;
    private kafkaService;
    constructor(prisma: PrismaClient, kafkaService?: any);
    getRealtimeQuote(symbol: string): Promise<any>;
    getMultipleQuotes(symbols: string[]): Promise<any[]>;
    storeQuote(quoteData: {
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
    }): Promise<any>;
    getHistoricalData(symbol: string, startDate: Date, endDate: Date, source?: string): Promise<any[]>;
    storeHistoricalData(historicalData: {
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
    }): Promise<any>;
    upsertSecurity(securityData: {
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
    }): Promise<any>;
    searchSecurities(query: string, limit?: number): Promise<any[]>;
    getCorporateActions(symbol: string, startDate?: Date, endDate?: Date): Promise<any[]>;
    storeCorporateAction(corporateActionData: {
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
    }): Promise<any>;
    isMarketOpen(market?: string): Promise<boolean>;
}
