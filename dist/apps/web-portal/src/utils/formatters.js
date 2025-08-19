"use strict";
// Utility functions for formatting data
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatLargeNumber = exports.formatNumber = exports.formatShortDate = exports.formatDate = exports.formatPercentage = exports.formatCurrency = void 0;
const formatCurrency = (value, options) => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
        ...options,
    }).format(value);
};
exports.formatCurrency = formatCurrency;
const formatPercentage = (value, decimals = 2) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(decimals)}%`;
};
exports.formatPercentage = formatPercentage;
const formatDate = (date, options) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        ...options,
    });
};
exports.formatDate = formatDate;
const formatShortDate = (date) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString('en-US', {
        month: 'short',
        year: '2-digit',
    });
};
exports.formatShortDate = formatShortDate;
const formatNumber = (value, options) => {
    return new Intl.NumberFormat('en-US', options).format(value);
};
exports.formatNumber = formatNumber;
const formatLargeNumber = (value) => {
    if (value >= 1000000) {
        return `$${(value / 1000000).toFixed(1)}M`;
    }
    else if (value >= 1000) {
        return `$${(value / 1000).toFixed(1)}K`;
    }
    else {
        return (0, exports.formatCurrency)(value);
    }
};
exports.formatLargeNumber = formatLargeNumber;
