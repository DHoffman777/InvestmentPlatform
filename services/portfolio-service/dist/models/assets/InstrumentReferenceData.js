"use strict";
// Instrument Reference Data Models
// Comprehensive instrument master data and corporate actions processing
Object.defineProperty(exports, "__esModule", { value: true });
exports.STANDARD_DATA_VENDORS = exports.CURRENCY_CODES = exports.STANDARD_EXCHANGES = void 0;
// Constants
exports.STANDARD_EXCHANGES = {
    US: {
        NYSE: 'New York Stock Exchange',
        NASDAQ: 'NASDAQ',
        AMEX: 'American Stock Exchange',
        BATS: 'BATS Global Markets',
        IEX: 'Investors Exchange'
    },
    INTERNATIONAL: {
        LSE: 'London Stock Exchange',
        TSE: 'Tokyo Stock Exchange',
        HKE: 'Hong Kong Exchange',
        FSE: 'Frankfurt Stock Exchange',
        TSX: 'Toronto Stock Exchange'
    }
};
exports.CURRENCY_CODES = [
    'USD', 'EUR', 'GBP', 'JPY', 'CAD', 'AUD', 'CHF', 'CNY', 'HKD', 'SGD'
];
exports.STANDARD_DATA_VENDORS = [
    'Bloomberg',
    'Refinitiv',
    'Morningstar',
    'FactSet',
    'S&P Market Intelligence',
    'Quandl',
    'Alpha Vantage',
    'IEX Cloud',
    'Yahoo Finance',
    'Internal'
];
