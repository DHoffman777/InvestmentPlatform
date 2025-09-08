export const __esModule: boolean;
export default MultiCurrencyService;
/**
 * Multi-Currency Management Service
 * Handles currency conversions, hedging, and FX risk management
 */
export class MultiCurrencyService extends events_1<[never]> {
    constructor(baseCurrency?: string);
    supportedCurrencies: Map<any, any>;
    exchangeRates: Map<any, any>;
    conversions: Map<any, any>;
    hedges: Map<any, any>;
    rateProviders: any[];
    baseCurrency: string;
    /**
     * Add support for a new currency
     */
    addCurrency(currency: any): void;
    /**
     * Get current exchange rate between two currencies
     */
    getExchangeRate(fromCurrency: any, toCurrency: any): any;
    /**
     * Convert amount from one currency to another
     */
    convertCurrency(fromCurrency: any, toCurrency: any, amount: any, hedged: boolean, settlementDate: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        fromCurrency: any;
        toCurrency: any;
        fromAmount: any;
        toAmount: number;
        exchangeRate: any;
        conversionDate: Date;
        spotRate: any;
        hedged: boolean;
        transactionCost: number;
        settlementDate: any;
    }>;
    /**
     * Create currency hedge
     */
    createForwardContract(fromCurrency: any, toCurrency: any, notionalAmount: any, maturityDate: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        portfolioId: string;
        baseCurrency: any;
        targetCurrency: any;
        notionalAmount: any;
        hedgeRatio: number;
        hedgeInstrument: string;
        maturityDate: any;
        strikeRate: any;
        markToMarket: number;
        effectiveDate: Date;
        active: boolean;
    }>;
    /**
     * Calculate portfolio currency exposure
     */
    calculateCurrencyExposure(portfolioPositions: any): {
        portfolioId: string;
        currency: any;
        exposure: any;
        percentageOfPortfolio: number;
        hedgedExposure: any;
        netExposure: number;
        var90: number;
        beta: any;
    }[];
    /**
     * Update exchange rates from providers
     */
    updateExchangeRates(): Promise<void>;
    /**
     * Get historical exchange rates
     */
    getHistoricalRates(fromCurrency: any, toCurrency: any, startDate: any, endDate: any, frequency?: string): Promise<{
        fromCurrency: any;
        toCurrency: any;
        rate: number;
        bidRate: number;
        askRate: number;
        timestamp: Date;
        source: string;
        spread: number;
    }[]>;
    /**
     * Mark-to-market all currency hedges
     */
    markToMarketHedges(): Promise<void>;
    /**
     * Get supported currencies
     */
    getSupportedCurrencies(): any[];
    /**
     * Set base currency for the service
     */
    setBaseCurrency(currencyCode: any): void;
    initializeSupportedCurrencies(): void;
    initializeRateProviders(): void;
    startRateUpdates(): void;
    fetchRatesFromProvider(provider: any): Promise<{
        fromCurrency: string;
        toCurrency: any;
        rate: number;
        bidRate: number;
        askRate: number;
        timestamp: Date;
        source: any;
        spread: number;
    }[]>;
    calculateTransactionCost(amount: any, fromCurrency: any, toCurrency: any): number;
    calculateForwardRate(fromCurrency: any, toCurrency: any, maturityDate: any): any;
    convertToBaseCurrency(amount: any, currency: any): any;
    calculateHedgedExposure(currency: any, totalExposure: any): any;
    getCurrencyVolatility(currency: any): any;
    getCurrencyBeta(currency: any): any;
    getStandardSettlementDate(fromCurrency: any, toCurrency: any): Date;
}
import events_1 = require("events");
