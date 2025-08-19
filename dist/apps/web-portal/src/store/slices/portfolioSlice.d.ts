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
export declare const fetchPortfoliosStart: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"portfolio/fetchPortfoliosStart">, fetchPortfoliosSuccess: import("@reduxjs/toolkit").ActionCreatorWithPayload<Portfolio[], "portfolio/fetchPortfoliosSuccess">, fetchPortfoliosFailure: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "portfolio/fetchPortfoliosFailure">, selectPortfolio: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "portfolio/selectPortfolio">, updatePortfolio: import("@reduxjs/toolkit").ActionCreatorWithPayload<Portfolio, "portfolio/updatePortfolio">, updatePortfolioPositions: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    portfolioId: string;
    positions: Position[];
}, "portfolio/updatePortfolioPositions">, updateFilters: import("@reduxjs/toolkit").ActionCreatorWithPayload<Partial<{
    assetClass: string | null;
    sector: string | null;
    minValue: number | null;
    maxValue: number | null;
}>, "portfolio/updateFilters">, updateSortBy: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    field: string;
    direction: "asc" | "desc";
}, "portfolio/updateSortBy">, clearError: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"portfolio/clearError">, refreshPortfolioData: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "portfolio/refreshPortfolioData">;
declare const _default: import("redux").Reducer<PortfolioState>;
export default _default;
