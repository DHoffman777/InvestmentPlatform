"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiCurrencyService = void 0;
const events_1 = require("events");
const crypto_1 = require("crypto");
/**
 * Multi-Currency Management Service
 * Handles currency conversions, hedging, and FX risk management
 */
class MultiCurrencyService extends events_1.EventEmitter {
    supportedCurrencies = new Map();
    exchangeRates = new Map();
    conversions = new Map();
    hedges = new Map();
    rateProviders = [];
    baseCurrency = 'USD';
    constructor(baseCurrency = 'USD') {
        super();
        this.baseCurrency = baseCurrency;
        this.initializeSupportedCurrencies();
        this.initializeRateProviders();
        this.startRateUpdates();
    }
    /**
     * Add support for a new currency
     */
    addCurrency(currency) {
        try {
            this.supportedCurrencies.set(currency.code, currency);
            this.emit('currencyAdded', {
                currencyCode: currency.code,
                name: currency.name,
                region: currency.region,
                timestamp: new Date()
            });
        }
        catch (error) {
            this.emit('currencyError', {
                operation: 'add_currency',
                currencyCode: currency.code,
                error: error instanceof Error ? error.message : String(error),
                timestamp: new Date()
            });
            throw error;
        }
    }
    /**
     * Get current exchange rate between two currencies
     */
    getExchangeRate(fromCurrency, toCurrency) {
        if (fromCurrency === toCurrency) {
            return {
                fromCurrency,
                toCurrency,
                rate: 1,
                bidRate: 1,
                askRate: 1,
                timestamp: new Date(),
                source: 'system',
                spread: 0
            };
        }
        const directRate = this.exchangeRates.get(`${fromCurrency}/${toCurrency}`);
        if (directRate) {
            return directRate;
        }
        // Try inverse rate
        const inverseRate = this.exchangeRates.get(`${toCurrency}/${fromCurrency}`);
        if (inverseRate) {
            return {
                fromCurrency,
                toCurrency,
                rate: 1 / inverseRate.rate,
                bidRate: 1 / inverseRate.askRate,
                askRate: 1 / inverseRate.bidRate,
                timestamp: inverseRate.timestamp,
                source: inverseRate.source,
                spread: inverseRate.spread
            };
        }
        // Try cross rate through base currency
        const fromBaseRate = this.exchangeRates.get(`${this.baseCurrency}/${fromCurrency}`);
        const toBaseRate = this.exchangeRates.get(`${this.baseCurrency}/${toCurrency}`);
        if (fromBaseRate && toBaseRate) {
            const crossRate = toBaseRate.rate / fromBaseRate.rate;
            return {
                fromCurrency,
                toCurrency,
                rate: crossRate,
                bidRate: crossRate * 0.9995, // Approximate bid
                askRate: crossRate * 1.0005, // Approximate ask
                timestamp: new Date(Math.min(fromBaseRate.timestamp.getTime(), toBaseRate.timestamp.getTime())),
                source: 'calculated',
                spread: 0.001
            };
        }
        return null;
    }
    /**
     * Convert amount from one currency to another
     */
    async convertCurrency(fromCurrency, toCurrency, amount, hedged = false, settlementDate) {
        try {
            const exchangeRate = this.getExchangeRate(fromCurrency, toCurrency);
            if (!exchangeRate) {
                throw new Error(`Exchange rate not available for ${fromCurrency}/${toCurrency}`);
            }
            const convertedAmount = amount * exchangeRate.rate;
            const transactionCost = this.calculateTransactionCost(amount, fromCurrency, toCurrency);
            const conversion = {
                id: (0, crypto_1.randomUUID)(),
                fromCurrency,
                toCurrency,
                fromAmount: amount,
                toAmount: convertedAmount - transactionCost,
                exchangeRate: exchangeRate.rate,
                conversionDate: new Date(),
                spotRate: exchangeRate.rate,
                hedged,
                transactionCost,
                settlementDate: settlementDate || this.getStandardSettlementDate(fromCurrency, toCurrency)
            };
            if (hedged) {
                const hedge = await this.createForwardContract(fromCurrency, toCurrency, amount, settlementDate);
                conversion.hedgingInstrument = hedge.id;
                conversion.forwardRate = hedge.strikeRate;
            }
            this.conversions.set(conversion.id, conversion);
            this.emit('currencyConverted', {
                conversionId: conversion.id,
                fromCurrency,
                toCurrency,
                amount,
                convertedAmount: conversion.toAmount,
                rate: exchangeRate.rate,
                hedged,
                timestamp: new Date()
            });
            return conversion;
        }
        catch (error) {
            this.emit('conversionError', {
                fromCurrency,
                toCurrency,
                amount,
                error: error instanceof Error ? error.message : String(error),
                timestamp: new Date()
            });
            throw error;
        }
    }
    /**
     * Create currency hedge
     */
    async createForwardContract(fromCurrency, toCurrency, notionalAmount, maturityDate) {
        try {
            const currentRate = this.getExchangeRate(fromCurrency, toCurrency);
            if (!currentRate) {
                throw new Error(`Cannot create hedge: no rate available for ${fromCurrency}/${toCurrency}`);
            }
            const maturity = maturityDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000); // 90 days default
            const forwardRate = this.calculateForwardRate(fromCurrency, toCurrency, maturity);
            const hedge = {
                id: (0, crypto_1.randomUUID)(),
                portfolioId: 'temp', // Would be set by caller
                baseCurrency: fromCurrency,
                targetCurrency: toCurrency,
                notionalAmount,
                hedgeRatio: 100, // Full hedge by default
                hedgeInstrument: 'forward',
                maturityDate: maturity,
                strikeRate: forwardRate,
                markToMarket: 0,
                effectiveDate: new Date(),
                active: true
            };
            this.hedges.set(hedge.id, hedge);
            this.emit('hedgeCreated', {
                hedgeId: hedge.id,
                fromCurrency,
                toCurrency,
                notionalAmount,
                forwardRate,
                maturityDate: maturity,
                timestamp: new Date()
            });
            return hedge;
        }
        catch (error) {
            this.emit('hedgeError', {
                operation: 'create_forward',
                fromCurrency,
                toCurrency,
                error: error instanceof Error ? error.message : String(error),
                timestamp: new Date()
            });
            throw error;
        }
    }
    /**
     * Calculate portfolio currency exposure
     */
    calculateCurrencyExposure(portfolioPositions) {
        const exposureMap = new Map();
        let totalPortfolioValue = 0;
        // Calculate exposure by currency
        for (const position of portfolioPositions) {
            const currency = position.currency || this.baseCurrency;
            const baseValue = this.convertToBaseCurrency(position.marketValue, currency);
            exposureMap.set(currency, (exposureMap.get(currency) || 0) + baseValue);
            totalPortfolioValue += baseValue;
        }
        const exposures = [];
        for (const [currency, exposure] of exposureMap.entries()) {
            const percentageOfPortfolio = (exposure / totalPortfolioValue) * 100;
            // Calculate hedged exposure
            const hedgedExposure = this.calculateHedgedExposure(currency, exposure);
            const netExposure = exposure - hedgedExposure;
            // Calculate VaR (simplified calculation)
            const volatility = this.getCurrencyVolatility(currency);
            const var90 = netExposure * volatility * 1.645; // 90% confidence interval
            exposures.push({
                portfolioId: 'temp', // Would be provided by caller
                currency,
                exposure,
                percentageOfPortfolio,
                hedgedExposure,
                netExposure,
                var90,
                beta: this.getCurrencyBeta(currency)
            });
        }
        return exposures.sort((a, b) => b.percentageOfPortfolio - a.percentageOfPortfolio);
    }
    /**
     * Update exchange rates from providers
     */
    async updateExchangeRates() {
        try {
            for (const provider of this.rateProviders.filter(p => p.active)) {
                const rates = await this.fetchRatesFromProvider(provider);
                for (const rate of rates) {
                    const key = `${rate.fromCurrency}/${rate.toCurrency}`;
                    this.exchangeRates.set(key, rate);
                }
            }
            this.emit('ratesUpdated', {
                providerCount: this.rateProviders.filter(p => p.active).length,
                rateCount: this.exchangeRates.size,
                timestamp: new Date()
            });
        }
        catch (error) {
            this.emit('rateUpdateError', {
                error: error instanceof Error ? error.message : String(error),
                timestamp: new Date()
            });
        }
    }
    /**
     * Get historical exchange rates
     */
    async getHistoricalRates(fromCurrency, toCurrency, startDate, endDate, frequency = 'daily') {
        // In production, this would fetch from a historical data provider
        const rates = [];
        const daysDiff = Math.floor((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        const increment = frequency === 'daily' ? 1 : frequency === 'weekly' ? 7 : 30;
        for (let i = 0; i <= daysDiff; i += increment) {
            const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
            const baseRate = 1.1 + Math.random() * 0.2; // Simulated rate
            rates.push({
                fromCurrency,
                toCurrency,
                rate: baseRate,
                bidRate: baseRate * 0.999,
                askRate: baseRate * 1.001,
                timestamp: date,
                source: 'historical',
                spread: 0.002
            });
        }
        return rates;
    }
    /**
     * Mark-to-market all currency hedges
     */
    async markToMarketHedges() {
        for (const [hedgeId, hedge] of this.hedges.entries()) {
            if (!hedge.active)
                continue;
            const currentRate = this.getExchangeRate(hedge.baseCurrency, hedge.targetCurrency);
            if (currentRate) {
                const mtmValue = (currentRate.rate - hedge.strikeRate) * hedge.notionalAmount;
                hedge.markToMarket = mtmValue;
                this.hedges.set(hedgeId, hedge);
            }
        }
        this.emit('hedgesMarkedToMarket', {
            hedgeCount: Array.from(this.hedges.values()).filter(h => h.active).length,
            timestamp: new Date()
        });
    }
    /**
     * Get supported currencies
     */
    getSupportedCurrencies() {
        return Array.from(this.supportedCurrencies.values())
            .filter(c => c.active)
            .sort((a, b) => a.code.localeCompare(b.code));
    }
    /**
     * Set base currency for the service
     */
    setBaseCurrency(currencyCode) {
        const currency = this.supportedCurrencies.get(currencyCode);
        if (!currency) {
            throw new Error(`Currency ${currencyCode} not supported`);
        }
        this.baseCurrency = currencyCode;
        this.emit('baseCurrencyChanged', {
            newBaseCurrency: currencyCode,
            timestamp: new Date()
        });
    }
    // Private helper methods
    initializeSupportedCurrencies() {
        const currencies = [
            { code: 'USD', name: 'US Dollar', symbol: '$', decimalPlaces: 2, isBaseCurrency: true, active: true, region: 'North America' },
            { code: 'EUR', name: 'Euro', symbol: '€', decimalPlaces: 2, isBaseCurrency: false, active: true, region: 'Europe' },
            { code: 'GBP', name: 'British Pound', symbol: '£', decimalPlaces: 2, isBaseCurrency: false, active: true, region: 'Europe' },
            { code: 'JPY', name: 'Japanese Yen', symbol: '¥', decimalPlaces: 0, isBaseCurrency: false, active: true, region: 'Asia' },
            { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF', decimalPlaces: 2, isBaseCurrency: false, active: true, region: 'Europe' },
            { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$', decimalPlaces: 2, isBaseCurrency: false, active: true, region: 'North America' },
            { code: 'AUD', name: 'Australian Dollar', symbol: 'A$', decimalPlaces: 2, isBaseCurrency: false, active: true, region: 'Asia Pacific' },
            { code: 'CNY', name: 'Chinese Yuan', symbol: '¥', decimalPlaces: 2, isBaseCurrency: false, active: true, region: 'Asia' },
            { code: 'SEK', name: 'Swedish Krona', symbol: 'kr', decimalPlaces: 2, isBaseCurrency: false, active: true, region: 'Europe' },
            { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr', decimalPlaces: 2, isBaseCurrency: false, active: true, region: 'Europe' }
        ];
        for (const currency of currencies) {
            this.supportedCurrencies.set(currency.code, currency);
        }
    }
    initializeRateProviders() {
        this.rateProviders = [
            {
                name: 'Bloomberg',
                priority: 1,
                active: true,
                supportedCurrencies: ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD'],
                latency: 50,
                accuracy: 99.9,
                cost: 0.01
            },
            {
                name: 'Reuters',
                priority: 2,
                active: true,
                supportedCurrencies: ['USD', 'EUR', 'GBP', 'JPY', 'CHF'],
                latency: 75,
                accuracy: 99.8,
                cost: 0.008
            },
            {
                name: 'ECB',
                priority: 3,
                active: true,
                supportedCurrencies: ['EUR', 'USD', 'GBP', 'JPY'],
                latency: 200,
                accuracy: 99.5,
                cost: 0
            }
        ];
    }
    startRateUpdates() {
        // Update rates every 30 seconds
        setInterval(() => {
            this.updateExchangeRates();
        }, 30000);
        // Mark-to-market hedges every 5 minutes
        setInterval(() => {
            this.markToMarketHedges();
        }, 300000);
    }
    async fetchRatesFromProvider(provider) {
        // In production, this would make actual API calls to rate providers
        const rates = [];
        for (const currency of provider.supportedCurrencies) {
            if (currency !== this.baseCurrency) {
                const baseRate = 1.0 + Math.random() * 0.5; // Simulated rate
                const spread = 0.001 + Math.random() * 0.002;
                rates.push({
                    fromCurrency: this.baseCurrency,
                    toCurrency: currency,
                    rate: baseRate,
                    bidRate: baseRate * (1 - spread),
                    askRate: baseRate * (1 + spread),
                    timestamp: new Date(),
                    source: provider.name,
                    spread
                });
            }
        }
        return rates;
    }
    calculateTransactionCost(amount, fromCurrency, toCurrency) {
        // Simple cost calculation - in production would be more sophisticated
        const baseCost = Math.min(amount * 0.001, 50); // 0.1% or $50 max
        return baseCost;
    }
    calculateForwardRate(fromCurrency, toCurrency, maturityDate) {
        const spotRate = this.getExchangeRate(fromCurrency, toCurrency)?.rate || 1;
        const daysToMaturity = Math.floor((maturityDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        // Simplified forward rate calculation (interest rate differential)
        const interestRateDiff = 0.02; // 2% annual difference
        const forwardPoints = spotRate * (interestRateDiff * daysToMaturity / 365);
        return spotRate + forwardPoints;
    }
    convertToBaseCurrency(amount, currency) {
        if (currency === this.baseCurrency)
            return amount;
        const rate = this.getExchangeRate(currency, this.baseCurrency);
        return rate ? amount * rate.rate : amount;
    }
    calculateHedgedExposure(currency, totalExposure) {
        const activeHedges = Array.from(this.hedges.values())
            .filter(h => h.active && (h.baseCurrency === currency || h.targetCurrency === currency));
        return activeHedges.reduce((sum, hedge) => sum + hedge.notionalAmount * (hedge.hedgeRatio / 100), 0);
    }
    getCurrencyVolatility(currency) {
        // In production, this would be calculated from historical data
        const volatilities = {
            'USD': 0.08,
            'EUR': 0.12,
            'GBP': 0.15,
            'JPY': 0.11,
            'CHF': 0.10,
            'CAD': 0.09,
            'AUD': 0.14
        };
        return volatilities[currency] || 0.12;
    }
    getCurrencyBeta(currency) {
        // In production, this would be calculated from regression analysis
        const betas = {
            'USD': 1.0,
            'EUR': 0.85,
            'GBP': 0.92,
            'JPY': -0.15,
            'CHF': -0.25,
            'CAD': 0.75,
            'AUD': 1.15
        };
        return betas[currency] || 0.8;
    }
    getStandardSettlementDate(fromCurrency, toCurrency) {
        // Standard FX settlement is T+2
        const settlementDate = new Date();
        settlementDate.setDate(settlementDate.getDate() + 2);
        // Skip weekends
        while (settlementDate.getDay() === 0 || settlementDate.getDay() === 6) {
            settlementDate.setDate(settlementDate.getDate() + 1);
        }
        return settlementDate;
    }
}
exports.MultiCurrencyService = MultiCurrencyService;
exports.default = MultiCurrencyService;
