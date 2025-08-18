import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Portfolio {
  id: string;
  name: string;
  description: string;
  totalValue: number;
  dayChange: number;
  dayChangePercent: number;
  totalReturn: number;
  totalReturnPercent: number;
  cash: number;
  lastUpdated: string;
  positions: Position[];
  performance: PerformanceData[];
  assetAllocation: AssetAllocation[];
}

export interface Position {
  id: string;
  symbol: string;
  name: string;
  quantity: number;
  averageCost: number;
  currentPrice: number;
  marketValue: number;
  unrealizedGainLoss: number;
  unrealizedGainLossPercent: number;
  assetClass: string;
  sector: string;
  lastUpdated: string;
}

export interface PerformanceData {
  date: string;
  value: number;
  benchmarkValue?: number;
}

export interface AssetAllocation {
  assetClass: string;
  value: number;
  percentage: number;
  target: number;
  color: string;
}

interface PortfolioState {
  portfolios: Portfolio[];
  selectedPortfolioId: string | null;
  selectedPortfolio: Portfolio | null;
  isLoading: boolean;
  error: string | null;
  lastUpdated: string | null;
  filters: {
    assetClass: string | null;
    sector: string | null;
    minValue: number | null;
    maxValue: number | null;
  };
  sortBy: {
    field: string;
    direction: 'asc' | 'desc';
  };
}

const initialState: PortfolioState = {
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

const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState,
  reducers: {
    fetchPortfoliosStart: (state) => {
      state.isLoading = true;
      state.error = null;
    },
    fetchPortfoliosSuccess: (state, action: PayloadAction<Portfolio[]>) => {
      state.portfolios = action.payload;
      state.isLoading = false;
      state.error = null;
      state.lastUpdated = new Date().toISOString();
    },
    fetchPortfoliosFailure: (state, action: PayloadAction<string>) => {
      state.isLoading = false;
      state.error = action.payload;
    },
    selectPortfolio: (state, action: PayloadAction<string>) => {
      state.selectedPortfolioId = action.payload;
      state.selectedPortfolio = state.portfolios.find(p => p.id === action.payload) || null;
    },
    updatePortfolio: (state, action: PayloadAction<Portfolio>) => {
      const index = state.portfolios.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.portfolios[index] = action.payload;
      }
      if (state.selectedPortfolioId === action.payload.id) {
        state.selectedPortfolio = action.payload;
      }
    },
    updatePortfolioPositions: (state, action: PayloadAction<{ portfolioId: string; positions: Position[] }>) => {
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
    updateFilters: (state, action: PayloadAction<Partial<PortfolioState['filters']>>) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    updateSortBy: (state, action: PayloadAction<{ field: string; direction: 'asc' | 'desc' }>) => {
      state.sortBy = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    refreshPortfolioData: (state, action: PayloadAction<string>) => {
      // Trigger refresh for specific portfolio
      state.isLoading = true;
      state.error = null;
    },
  },
});

export const {
  fetchPortfoliosStart,
  fetchPortfoliosSuccess,
  fetchPortfoliosFailure,
  selectPortfolio,
  updatePortfolio,
  updatePortfolioPositions,
  updateFilters,
  updateSortBy,
  clearError,
  refreshPortfolioData,
} = portfolioSlice.actions;

export default portfolioSlice.reducer;