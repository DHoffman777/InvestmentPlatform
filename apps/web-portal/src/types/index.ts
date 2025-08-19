// Export common types used throughout the application
export * from '../store/slices/authSlice';
export * from '../store/slices/portfolioSlice';
export * from '../store/slices/uiSlice';

// API Response types
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

// Common UI component props
export interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Chart data interfaces
export interface ChartDataPoint {
  date: string;
  value: number;
  [key: string]: any;
}

// Form types
export interface FormFieldError {
  field: string;
  message: string;
}