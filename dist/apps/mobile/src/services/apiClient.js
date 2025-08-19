"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.apiClient = void 0;
const axios_1 = __importDefault(require("axios"));
const react_native_config_1 = __importDefault(require("react-native-config"));
const react_native_encrypted_storage_1 = __importDefault(require("react-native-encrypted-storage"));
const API_BASE_URL = react_native_config_1.default.API_BASE_URL || 'http://localhost:3000/api';
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
class ApiClient {
    client;
    isRefreshing = false;
    failedQueue = [];
    constructor(config = {}) {
        this.client = axios_1.default.create({
            baseURL: config.baseURL || API_BASE_URL,
            timeout: config.timeout || 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });
        this.setupInterceptors();
    }
    setupInterceptors() {
        // Request interceptor to add auth token
        this.client.interceptors.request.use(async (config) => {
            const token = await react_native_encrypted_storage_1.default.getItem(TOKEN_KEY);
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        }, (error) => {
            return Promise.reject(error);
        });
        // Response interceptor to handle token refresh
        this.client.interceptors.response.use((response) => response, async (error) => {
            const originalRequest = error.config;
            if (error.response?.status === 401 && !originalRequest._retry) {
                if (this.isRefreshing) {
                    return new Promise((resolve, reject) => {
                        this.failedQueue.push({ resolve, reject });
                    })
                        .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return this.client(originalRequest);
                    })
                        .catch((err) => {
                        return Promise.reject(err);
                    });
                }
                originalRequest._retry = true;
                this.isRefreshing = true;
                try {
                    const refreshToken = await react_native_encrypted_storage_1.default.getItem(REFRESH_TOKEN_KEY);
                    if (!refreshToken) {
                        throw new Error('No refresh token available');
                    }
                    const response = await axios_1.default.post(`${API_BASE_URL}/auth/refresh`, {
                        refreshToken,
                    });
                    if (response.data.success) {
                        const { token, refreshToken: newRefreshToken } = response.data.data;
                        await Promise.all([
                            react_native_encrypted_storage_1.default.setItem(TOKEN_KEY, token),
                            react_native_encrypted_storage_1.default.setItem(REFRESH_TOKEN_KEY, newRefreshToken),
                        ]);
                        // Process failed queue
                        this.failedQueue.forEach(({ resolve }) => resolve(token));
                        this.failedQueue = [];
                        originalRequest.headers.Authorization = `Bearer ${token}`;
                        return this.client(originalRequest);
                    }
                }
                catch (refreshError) {
                    // Refresh failed, clear tokens and redirect to login
                    await Promise.all([
                        react_native_encrypted_storage_1.default.removeItem(TOKEN_KEY),
                        react_native_encrypted_storage_1.default.removeItem(REFRESH_TOKEN_KEY),
                    ]);
                    this.failedQueue.forEach(({ reject }) => reject(refreshError));
                    this.failedQueue = [];
                    // You might want to emit an event here to redirect to login
                    return Promise.reject(refreshError);
                }
                finally {
                    this.isRefreshing = false;
                }
            }
            return Promise.reject(error);
        });
    }
    async get(url, config) {
        return this.client.get(url, config);
    }
    async post(url, data, config) {
        return this.client.post(url, data, config);
    }
    async put(url, data, config) {
        return this.client.put(url, data, config);
    }
    async patch(url, data, config) {
        return this.client.patch(url, data, config);
    }
    async delete(url, config) {
        return this.client.delete(url, config);
    }
    setBaseURL(baseURL) {
        this.client.defaults.baseURL = baseURL;
    }
    setTimeout(timeout) {
        this.client.defaults.timeout = timeout;
    }
    setDefaultHeaders(headers) {
        Object.assign(this.client.defaults.headers, headers);
    }
    getAxiosInstance() {
        return this.client;
    }
}
exports.apiClient = new ApiClient();
exports.default = exports.apiClient;
