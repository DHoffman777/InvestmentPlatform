"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.refreshPortfolioData = exports.clearError = exports.updateSortBy = exports.updateFilters = exports.updatePortfolioPositions = exports.updatePortfolio = exports.selectPortfolio = exports.fetchPortfoliosFailure = exports.fetchPortfoliosSuccess = exports.fetchPortfoliosStart = void 0;
const toolkit_1 = require("@reduxjs/toolkit");
const initialState = {
    portfolios: [],
    selectedPortfolioId: null,
    selectedPortfolio: null,
    isLoading: false,
    error: null,
    lastUpdated: null,
    filters: {
        assetClass: null,
        sector: null,
        minValue: null,
        maxValue: null,
    },
    sortBy: {
        field: 'name',
        direction: 'asc',
    },
};
const portfolioSlice = (0, toolkit_1.createSlice)({
    name: 'portfolio',
    initialState,
    reducers: {
        fetchPortfoliosStart: (state) => {
            state.isLoading = true;
            state.error = null;
        },
        fetchPortfoliosSuccess: (state, action) => {
            state.portfolios = action.payload;
            state.isLoading = false;
            state.error = null;
            state.lastUpdated = new Date().toISOString();
        },
        fetchPortfoliosFailure: (state, action) => {
            state.isLoading = false;
            state.error = action.payload;
        },
        selectPortfolio: (state, action) => {
            state.selectedPortfolioId = action.payload;
            state.selectedPortfolio = state.portfolios.find(p => p.id === action.payload) || null;
        },
        updatePortfolio: (state, action) => {
            const index = state.portfolios.findIndex(p => p.id === action.payload.id);
            if (index !== -1) {
                state.portfolios[index] = action.payload;
            }
            if (state.selectedPortfolioId === action.payload.id) {
                state.selectedPortfolio = action.payload;
            }
        },
        updatePortfolioPositions: (state, action) => {
            const portfolio = state.portfolios.find(p => p.id === action.payload.portfolioId);
            if (portfolio) {
                portfolio.positions = action.payload.positions;
                portfolio.lastUpdated = new Date().toISOString();
            }
            if (state.selectedPortfolioId === action.payload.portfolioId && state.selectedPortfolio) {
                state.selectedPortfolio.positions = action.payload.positions;
                state.selectedPortfolio.lastUpdated = new Date().toISOString();
            }
        },
        updateFilters: (state, action) => {
            state.filters = { ...state.filters, ...action.payload };
        },
        updateSortBy: (state, action) => {
            state.sortBy = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
        refreshPortfolioData: (state, action) => {
            // Trigger refresh for specific portfolio
            state.isLoading = true;
            state.error = null;
        },
    },
});
_a = portfolioSlice.actions, exports.fetchPortfoliosStart = _a.fetchPortfoliosStart, exports.fetchPortfoliosSuccess = _a.fetchPortfoliosSuccess, exports.fetchPortfoliosFailure = _a.fetchPortfoliosFailure, exports.selectPortfolio = _a.selectPortfolio, exports.updatePortfolio = _a.updatePortfolio, exports.updatePortfolioPositions = _a.updatePortfolioPositions, exports.updateFilters = _a.updateFilters, exports.updateSortBy = _a.updateSortBy, exports.clearError = _a.clearError, exports.refreshPortfolioData = _a.refreshPortfolioData;
exports.default = portfolioSlice.reducer;
