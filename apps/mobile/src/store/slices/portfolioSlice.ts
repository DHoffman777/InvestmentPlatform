import {createSlice, createAsyncThunk, PayloadAction} from '@reduxjs/toolkit';
import {Portfolio, Position, PerformanceMetrics} from '@types/index';
import * as portfolioService from '@services/portfolioService';

interface PortfolioState {
  portfolios: Portfolio[];
  selectedPortfolioId: string | null;
  selectedPortfolio: Portfolio | null;
  positions: Position[];
  performance: PerformanceMetrics | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error: string | null;
  lastUpdated: Date | null;
}

const initialState: PortfolioState = {
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

export const fetchPortfolios = createAsyncThunk(
  'portfolio/fetchPortfolios',
  async () => {
    const response = await portfolioService.getPortfolios();
    return response;
  },
);

export const fetchPortfolioDetails = createAsyncThunk(
  'portfolio/fetchPortfolioDetails',
  async (portfolioId: string) => {
    const response = await portfolioService.getPortfolioDetails(portfolioId);
    return response;
  },
);

export const fetchPortfolioPositions = createAsyncThunk(
  'portfolio/fetchPortfolioPositions',
  async (portfolioId: string) => {
    const response = await portfolioService.getPortfolioPositions(portfolioId);
    return response;
  },
);

export const fetchPortfolioPerformance = createAsyncThunk(
  'portfolio/fetchPortfolioPerformance',
  async (params: {portfolioId: string; period: string}) => {
    const response = await portfolioService.getPortfolioPerformance(
      params.portfolioId,
      params.period,
    );
    return response;
  },
);

export const refreshPortfolioData = createAsyncThunk(
  'portfolio/refreshPortfolioData',
  async (portfolioId: string) => {
    const [portfolio, positions, performance] = await Promise.all([
      portfolioService.getPortfolioDetails(portfolioId),
      portfolioService.getPortfolioPositions(portfolioId),
      portfolioService.getPortfolioPerformance(portfolioId, '1M'),
    ]);
    return {portfolio, positions, performance};
  },
);

const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {
    selectPortfolio: (state, action: PayloadAction<string>) => {
      state.selectedPortfolioId = action.payload;
      state.selectedPortfolio =
        state.portfolios.find(p => p.id === action.payload) || null;
    },
    clearError: state => {
      state.error = null;
    },
    updatePortfolioValue: (
      state,
      action: PayloadAction<{portfolioId: string; newValue: number}>,
    ) => {
      const portfolio = state.portfolios.find(
        p => p.id === action.payload.portfolioId,
      );
      if (portfolio) {
        portfolio.totalValue = action.payload.newValue;
        portfolio.lastUpdated = new Date();
      }
      if (
        state.selectedPortfolio &&
        state.selectedPortfolio.id === action.payload.portfolioId
      ) {
        state.selectedPortfolio.totalValue = action.payload.newValue;
        state.selectedPortfolio.lastUpdated = new Date();
      }
    },
    updatePositionPrice: (
      state,
      action: PayloadAction<{symbol: string; newPrice: number}>,
    ) => {
      const position = state.positions.find(
        p => p.symbol === action.payload.symbol,
      );
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
      .addCase(fetchPortfolios.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPortfolios.fulfilled, (state, action) => {
        state.isLoading = false;
        state.portfolios = action.payload;
        state.lastUpdated = new Date();
      })
      .addCase(fetchPortfolios.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch portfolios';
      })
      .addCase(fetchPortfolioDetails.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPortfolioDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.selectedPortfolio = action.payload;
        const existingIndex = state.portfolios.findIndex(
          p => p.id === action.payload.id,
        );
        if (existingIndex >= 0) {
          state.portfolios[existingIndex] = action.payload;
        } else {
          state.portfolios.push(action.payload);
        }
        state.lastUpdated = new Date();
      })
      .addCase(fetchPortfolioDetails.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch portfolio details';
      })
      .addCase(fetchPortfolioPositions.pending, state => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchPortfolioPositions.fulfilled, (state, action) => {
        state.isLoading = false;
        state.positions = action.payload;
        state.lastUpdated = new Date();
      })
      .addCase(fetchPortfolioPositions.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message || 'Failed to fetch positions';
      })
      .addCase(fetchPortfolioPerformance.fulfilled, (state, action) => {
        state.performance = action.payload;
      })
      .addCase(refreshPortfolioData.pending, state => {
        state.isRefreshing = true;
        state.error = null;
      })
      .addCase(refreshPortfolioData.fulfilled, (state, action) => {
        state.isRefreshing = false;
        state.selectedPortfolio = action.payload.portfolio;
        state.positions = action.payload.positions;
        state.performance = action.payload.performance;
        const existingIndex = state.portfolios.findIndex(
          p => p.id === action.payload.portfolio.id,
        );
        if (existingIndex >= 0) {
          state.portfolios[existingIndex] = action.payload.portfolio;
        }
        state.lastUpdated = new Date();
      })
      .addCase(refreshPortfolioData.rejected, (state, action) => {
        state.isRefreshing = false;
        state.error = action.error.message || 'Failed to refresh portfolio data';
      });
  },
});

export const {selectPortfolio, clearError, updatePortfolioValue, updatePositionPrice} =
  portfolioSlice.actions;
export default portfolioSlice.reducer;