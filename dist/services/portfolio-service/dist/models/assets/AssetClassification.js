"use strict";
// Asset Classification and Categorization System
// Provides comprehensive taxonomy for investment instruments
Object.defineProperty(exports, "__esModule", { value: true });
exports.STANDARD_ASSET_CLASSES = void 0;
// Predefined asset classes
exports.STANDARD_ASSET_CLASSES = {
    EQUITY: {
        DOMESTIC_LARGE_CAP: 'Domestic Large Cap Equity',
        DOMESTIC_MID_CAP: 'Domestic Mid Cap Equity',
        DOMESTIC_SMALL_CAP: 'Domestic Small Cap Equity',
        INTERNATIONAL_DEVELOPED: 'International Developed Equity',
        EMERGING_MARKETS: 'Emerging Markets Equity',
        REAL_ESTATE: 'Real Estate Investment Trusts'
    },
    FIXED_INCOME: {
        GOVERNMENT_BONDS: 'Government Bonds',
        CORPORATE_BONDS: 'Corporate Bonds',
        HIGH_YIELD_BONDS: 'High Yield Bonds',
        MUNICIPAL_BONDS: 'Municipal Bonds',
        INTERNATIONAL_BONDS: 'International Bonds',
        TREASURY_BILLS: 'Treasury Bills'
    },
    CASH_EQUIVALENT: {
        MONEY_MARKET: 'Money Market Funds',
        BANK_DEPOSITS: 'Bank Deposits',
        COMMERCIAL_PAPER: 'Commercial Paper'
    },
    ALTERNATIVE: {
        PRIVATE_EQUITY: 'Private Equity',
        HEDGE_FUNDS: 'Hedge Funds',
        COMMODITIES: 'Commodities',
        INFRASTRUCTURE: 'Infrastructure',
        PRIVATE_DEBT: 'Private Debt'
    }
};
