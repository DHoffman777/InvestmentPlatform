"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.updatePositionPrice = exports.updatePortfolioValue = exports.clearError = exports.selectPortfolio = exports.refreshPortfolioData = exports.fetchPortfolioPerformance = exports.fetchPortfolioPositions = exports.fetchPortfolioDetails = exports.fetchPortfolios = void 0;
const toolkit_1 = require("@reduxjs/toolkit");
const portfolioService = __importStar(require("@services/portfolioService"));
const initialState = {
    portfolios: [],
    selectedPortfolioId: null,
    selectedPortfolio: null,
    positions: [],
    performance: null,
    isLoading: false,
    isRefreshing: false,
    error: null,
    lastUpdated: null,
};
exports.fetchPortfolios = (0, toolkit_1.createAsyncThunk)('portfolio/fetchPortfolios', async () => {
    const response = await portfolioService.getPortfolios();
    return response;
});
exports.fetchPortfolioDetails = (0, toolkit_1.createAsyncThunk)('portfolio/fetchPortfolioDetails', async (portfolioId) => {
    const response = await portfolioService.getPortfolioDetails(portfolioId);
    return response;
});
exports.fetchPortfolioPositions = (0, toolkit_1.createAsyncThunk)('portfolio/fetchPortfolioPositions', async (portfolioId) => {
    const response = await portfolioService.getPortfolioPositions(portfolioId);
    return response;
});
exports.fetchPortfolioPerformance = (0, toolkit_1.createAsyncThunk)('portfolio/fetchPortfolioPerformance', async (params) => {
    const response = await portfolioService.getPortfolioPerformance(params.portfolioId, params.period);
    return response;
});
exports.refreshPortfolioData = (0, toolkit_1.createAsyncThunk)('portfolio/refreshPortfolioData', async (portfolioId) => {
    const [portfolio, positions, performance] = await Promise.all([
        portfolioService.getPortfolioDetails(portfolioId),
        portfolioService.getPortfolioPositions(portfolioId),
        portfolioService.getPortfolioPerformance(portfolioId, '1M'),
    ]);
    return { portfolio, positions, performance };
});
const portfolioSlice = (0, toolkit_1.createSlice)({
    name: 'portfolio',
    initialState,
    reducers: {
        selectPortfolio: (state, action) => {
            state.selectedPortfolioId = action.payload;
            state.selectedPortfolio =
                state.portfolios.find(p => p.id === action.payload) || null;
        },
        clearError: state => {
            state.error = null;
        },
        updatePortfolioValue: (state, action) => {
            const portfolio = state.portfolios.find(p => p.id === action.payload.portfolioId);
            if (portfolio) {
                portfolio.totalValue = action.payload.newValue;
                portfolio.lastUpdated = new Date();
            }
            if (state.selectedPortfolio &&
                state.selectedPortfolio.id === action.payload.portfolioId) {
                state.selectedPortfolio.totalValue = action.payload.newValue;
                state.selectedPortfolio.lastUpdated = new Date();
            }
        },
        updatePositionPrice: (state, action) => {
            const position = state.positions.find(p => p.symbol === action.payload.symbol);
            if (position) {
                const oldMarketValue = position.marketValue;
                position.currentPrice = action.payload.newPrice;
                position.marketValue = position.quantity * action.payload.newPrice;
                position.unrealizedGainLoss =
                    position.marketValue - position.costBasis;
                position.unrealizedGainLossPercent =
                    (position.unrealizedGainLoss / position.costBasis) * 100;
                position.lastUpdated = new Date();
                const valueChange = position.marketValue - oldMarketValue;
                if (state.selectedPortfolio) {
                    state.selectedPortfolio.totalValue += valueChange;
                    state.selectedPortfolio.lastUpdated = new Date();
                }
            }
        },
    },
    extraReducers: builder => {
        builder
            .addCase(exports.fetchPortfolios.pending, state => {
            state.isLoading = true;
            state.error = null;
        })
            .addCase(exports.fetchPortfolios.fulfilled, (state, action) => {
            state.isLoading = false;
            state.portfolios = action.payload;
            state.lastUpdated = new Date();
        })
            .addCase(exports.fetchPortfolios.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error.message || 'Failed to fetch portfolios';
        })
            .addCase(exports.fetchPortfolioDetails.pending, state => {
            state.isLoading = true;
            state.error = null;
        })
            .addCase(exports.fetchPortfolioDetails.fulfilled, (state, action) => {
            state.isLoading = false;
            state.selectedPortfolio = action.payload;
            const existingIndex = state.portfolios.findIndex(p => p.id === action.payload.id);
            if (existingIndex >= 0) {
                state.portfolios[existingIndex] = action.payload;
            }
            else {
                state.portfolios.push(action.payload);
            }
            state.lastUpdated = new Date();
        })
            .addCase(exports.fetchPortfolioDetails.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error.message || 'Failed to fetch portfolio details';
        })
            .addCase(exports.fetchPortfolioPositions.pending, state => {
            state.isLoading = true;
            state.error = null;
        })
            .addCase(exports.fetchPortfolioPositions.fulfilled, (state, action) => {
            state.isLoading = false;
            state.positions = action.payload;
            state.lastUpdated = new Date();
        })
            .addCase(exports.fetchPortfolioPositions.rejected, (state, action) => {
            state.isLoading = false;
            state.error = action.error.message || 'Failed to fetch positions';
        })
            .addCase(exports.fetchPortfolioPerformance.fulfilled, (state, action) => {
            state.performance = action.payload;
        })
            .addCase(exports.refreshPortfolioData.pending, state => {
            state.isRefreshing = true;
            state.error = null;
        })
            .addCase(exports.refreshPortfolioData.fulfilled, (state, action) => {
            state.isRefreshing = false;
            state.selectedPortfolio = action.payload.portfolio;
            state.positions = action.payload.positions;
            state.performance = action.payload.performance;
            const existingIndex = state.portfolios.findIndex(p => p.id === action.payload.portfolio.id);
            if (existingIndex >= 0) {
                state.portfolios[existingIndex] = action.payload.portfolio;
            }
            state.lastUpdated = new Date();
        })
            .addCase(exports.refreshPortfolioData.rejected, (state, action) => {
            state.isRefreshing = false;
            state.error = action.error.message || 'Failed to refresh portfolio data';
        });
    },
});
_a = portfolioSlice.actions, exports.selectPortfolio = _a.selectPortfolio, exports.clearError = _a.clearError, exports.updatePortfolioValue = _a.updatePortfolioValue, exports.updatePositionPrice = _a.updatePositionPrice;
exports.default = portfolioSlice.reducer;
