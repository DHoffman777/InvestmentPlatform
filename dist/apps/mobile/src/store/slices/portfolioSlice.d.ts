import { Portfolio, Position, PerformanceMetrics } from '@types/index';
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
export declare const fetchPortfolios: import("@reduxjs/toolkit").AsyncThunk<any, void, {
    state?: unknown;
    dispatch?: import("redux-thunk").ThunkDispatch<unknown, unknown, import("redux").UnknownAction>;
    extra?: unknown;
    rejectValue?: unknown;
    serializedErrorType?: unknown;
    pendingMeta?: unknown;
    fulfilledMeta?: unknown;
    rejectedMeta?: unknown;
}>;
export declare const fetchPortfolioDetails: import("@reduxjs/toolkit").AsyncThunk<any, string, {
    state?: unknown;
    dispatch?: import("redux-thunk").ThunkDispatch<unknown, unknown, import("redux").UnknownAction>;
    extra?: unknown;
    rejectValue?: unknown;
    serializedErrorType?: unknown;
    pendingMeta?: unknown;
    fulfilledMeta?: unknown;
    rejectedMeta?: unknown;
}>;
export declare const fetchPortfolioPositions: import("@reduxjs/toolkit").AsyncThunk<any, string, {
    state?: unknown;
    dispatch?: import("redux-thunk").ThunkDispatch<unknown, unknown, import("redux").UnknownAction>;
    extra?: unknown;
    rejectValue?: unknown;
    serializedErrorType?: unknown;
    pendingMeta?: unknown;
    fulfilledMeta?: unknown;
    rejectedMeta?: unknown;
}>;
export declare const fetchPortfolioPerformance: import("@reduxjs/toolkit").AsyncThunk<any, {
    portfolioId: string;
    period: string;
}, {
    state?: unknown;
    dispatch?: import("redux-thunk").ThunkDispatch<unknown, unknown, import("redux").UnknownAction>;
    extra?: unknown;
    rejectValue?: unknown;
    serializedErrorType?: unknown;
    pendingMeta?: unknown;
    fulfilledMeta?: unknown;
    rejectedMeta?: unknown;
}>;
export declare const refreshPortfolioData: import("@reduxjs/toolkit").AsyncThunk<{
    portfolio: any;
    positions: any;
    performance: any;
}, string, {
    state?: unknown;
    dispatch?: import("redux-thunk").ThunkDispatch<unknown, unknown, import("redux").UnknownAction>;
    extra?: unknown;
    rejectValue?: unknown;
    serializedErrorType?: unknown;
    pendingMeta?: unknown;
    fulfilledMeta?: unknown;
    rejectedMeta?: unknown;
}>;
export declare const selectPortfolio: import("@reduxjs/toolkit").ActionCreatorWithPayload<string, "portfolio/selectPortfolio">, clearError: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"portfolio/clearError">, updatePortfolioValue: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    portfolioId: string;
    newValue: number;
}, "portfolio/updatePortfolioValue">, updatePositionPrice: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    symbol: string;
    newPrice: number;
}, "portfolio/updatePositionPrice">;
declare const _default: import("redux").Reducer<PortfolioState>;
export default _default;
