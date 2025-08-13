import { EventEmitter } from 'events';
export interface Currency {
    code: string;
    name: string;
    symbol: string;
    decimalPlaces: number;
    isBaseCurrency: boolean;
    active: boolean;
    region: string;
    centralBank?: string;
}
export interface ExchangeRate {
    fromCurrency: string;
    toCurrency: string;
    rate: number;
    bidRate: number;
    askRate: number;
    timestamp: Date;
    source: string;
    spread: number;
}
export interface CurrencyConversion {
    id: string;
    fromCurrency: string;
    toCurrency: string;
    fromAmount: number;
    toAmount: number;
    exchangeRate: number;
    conversionDate: Date;
    spotRate: number;
    forwardRate?: number;
    hedged: boolean;
    hedgingInstrument?: string;
    transactionCost: number;
    settlementDate: Date;
}
export interface CurrencyHedge {
    id: string;
    portfolioId: string;
    baseCurrency: string;
    targetCurrency: string;
    notionalAmount: number;
    hedgeRatio: number;
    hedgeInstrument: 'forward' | 'option' | 'swap' | 'etf';
    maturityDate: Date;
    strikeRate?: number;
    premium?: number;
    markToMarket: number;
    effectiveDate: Date;
    active: boolean;
}
export interface MultiCurrencyPosition {
    securityId: string;
    originalCurrency: string;
    originalValue: number;
    baseCurrencyValue: number;
    reportingCurrencyValue: number;
    exchangeRate: number;
    unrealizedFXGain: number;
    realizedFXGain: number;
    hedgeRatio: number;
    hedgedValue: number;
    lastUpdated: Date;
}
export interface CurrencyExposure {
    portfolioId: string;
    currency: string;
    exposure: number;
    percentageOfPortfolio: number;
    hedgedExposure: number;
    netExposure: number;
    var90: number;
    beta: number;
}
export interface FXRateProvider {
    name: string;
    priority: number;
    active: boolean;
    supportedCurrencies: string[];
    latency: number;
    accuracy: number;
    cost: number;
}
/**
 * Multi-Currency Management Service
 * Handles currency conversions, hedging, and FX risk management
 */
export declare class MultiCurrencyService extends EventEmitter {
    private supportedCurrencies;
    private exchangeRates;
    private conversions;
    private hedges;
    private rateProviders;
    private baseCurrency;
    constructor(baseCurrency?: string);
    /**
     * Add support for a new currency
     */
    addCurrency(currency: Currency): void;
    /**
     * Get current exchange rate between two currencies
     */
    getExchangeRate(fromCurrency: string, toCurrency: string): ExchangeRate | null;
    /**
     * Convert amount from one currency to another
     */
    convertCurrency(fromCurrency: string, toCurrency: string, amount: number, hedged?: boolean, settlementDate?: Date): Promise<CurrencyConversion>;
    /**
     * Create currency hedge
     */
    createForwardContract(fromCurrency: string, toCurrency: string, notionalAmount: number, maturityDate?: Date): Promise<CurrencyHedge>;
    /**
     * Calculate portfolio currency exposure
     */
    calculateCurrencyExposure(portfolioPositions: any[]): CurrencyExposure[];
    /**
     * Update exchange rates from providers
     */
    updateExchangeRates(): Promise<void>;
    /**
     * Get historical exchange rates
     */
    getHistoricalRates(fromCurrency: string, toCurrency: string, startDate: Date, endDate: Date, frequency?: 'daily' | 'weekly' | 'monthly'): Promise<ExchangeRate[]>;
    /**
     * Mark-to-market all currency hedges
     */
    markToMarketHedges(): Promise<void>;
    /**
     * Get supported currencies
     */
    getSupportedCurrencies(): Currency[];
    /**
     * Set base currency for the service
     */
    setBaseCurrency(currencyCode: string): void;
    private initializeSupportedCurrencies;
    private initializeRateProviders;
    private startRateUpdates;
    private fetchRatesFromProvider;
    private calculateTransactionCost;
    private calculateForwardRate;
    private convertToBaseCurrency;
    private calculateHedgedExposure;
    private getCurrencyVolatility;
    private getCurrencyBeta;
    private getStandardSettlementDate;
}
export default MultiCurrencyService;
