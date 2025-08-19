import { AxiosRequestConfig } from 'axios';
import { ApiResponse, ApiError } from '@/types';
declare class ApiClient {
    private client;
    constructor();
    get<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;
    post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;
    put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;
    delete<T>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>>;
}
export declare const apiClient: ApiClient;
export declare const handleApiError: (error: any) => ApiError;
export {};
