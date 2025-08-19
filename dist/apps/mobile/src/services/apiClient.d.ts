import { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
export interface ApiClientConfig {
    baseURL?: string;
    timeout?: number;
    retries?: number;
}
declare class ApiClient {
    private client;
    private isRefreshing;
    private failedQueue;
    constructor(config?: ApiClientConfig);
    private setupInterceptors;
    get<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<AxiosResponse<T>>;
    setBaseURL(baseURL: string): void;
    setTimeout(timeout: number): void;
    setDefaultHeaders(headers: Record<string, string>): void;
    getAxiosInstance(): AxiosInstance;
}
export declare const apiClient: ApiClient;
export default apiClient;
