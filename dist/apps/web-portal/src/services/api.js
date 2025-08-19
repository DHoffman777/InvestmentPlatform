"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleApiError = exports.apiClient = void 0;
const axios_1 = __importDefault(require("axios"));
// API client configuration
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';
class ApiClient {
    client;
    constructor() {
        this.client = axios_1.default.create({
            baseURL: BASE_URL,
            timeout: 10000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        // Request interceptor to add auth token
        this.client.interceptors.request.use((config) => {
            if (typeof window !== 'undefined') {
                const token = localStorage.getItem('auth_token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
            }
            return config;
        }, (error) => {
            return Promise.reject(error);
        });
        // Response interceptor for error handling
        this.client.interceptors.response.use((response) => response, (error) => {
            if (error.response?.status === 401) {
                // Handle unauthorized - redirect to login
                if (typeof window !== 'undefined') {
                    window.location.href = '/auth/login';
                }
            }
            return Promise.reject(error);
        });
    }
    async get(url, config) {
        const response = await this.client.get(url, config);
        return response.data;
    }
    async post(url, data, config) {
        const response = await this.client.post(url, data, config);
        return response.data;
    }
    async put(url, data, config) {
        const response = await this.client.put(url, data, config);
        return response.data;
    }
    async delete(url, config) {
        const response = await this.client.delete(url, config);
        return response.data;
    }
}
exports.apiClient = new ApiClient();
// Helper function to handle API errors
const handleApiError = (error) => {
    if (error.response?.data) {
        return error.response.data;
    }
    return {
        message: error.message || 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
    };
};
exports.handleApiError = handleApiError;
