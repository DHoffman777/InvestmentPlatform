export * from '../store/slices/authSlice';
export * from '../store/slices/portfolioSlice';
export * from '../store/slices/uiSlice';
export interface ApiResponse<T> {
    data: T;
    message: string;
    success: boolean;
    timestamp: string;
}
export interface ApiError {
    message: string;
    code: string;
    details?: any;
}
export interface BaseComponentProps {
    className?: string;
    children?: React.ReactNode;
}
export interface ChartDataPoint {
    date: string;
    value: number;
    [key: string]: any;
}
export interface FormFieldError {
    field: string;
    message: string;
}
