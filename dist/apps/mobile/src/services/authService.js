"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestPasswordReset = exports.changePassword = exports.validateSession = exports.isTokenExpired = exports.clearStoredTokens = exports.getStoredUser = exports.getStoredRefreshToken = exports.getStoredToken = exports.clearSavedCredentials = exports.getSavedCredentials = exports.saveCredentialsForBiometrics = exports.logout = exports.refreshToken = exports.login = void 0;
const react_native_encrypted_storage_1 = __importDefault(require("react-native-encrypted-storage"));
const apiClient_1 = require("./apiClient");
const CREDENTIALS_KEY = 'biometric_credentials';
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';
const login = async (credentials) => {
    try {
        const response = await apiClient_1.apiClient.post('/auth/login', credentials);
        if (response.data.success && response.data.data) {
            const { token, refreshToken, user, expiresAt } = response.data.data;
            await Promise.all([
                react_native_encrypted_storage_1.default.setItem(TOKEN_KEY, token),
                react_native_encrypted_storage_1.default.setItem(REFRESH_TOKEN_KEY, refreshToken),
                react_native_encrypted_storage_1.default.setItem(USER_KEY, JSON.stringify(user)),
            ]);
            return {
                token,
                refreshToken,
                user,
                expiresAt: new Date(expiresAt),
            };
        }
        throw new Error(response.data.error || 'Login failed');
    }
    catch (error) {
        console.error('Login error:', error);
        throw new Error(error.response?.data?.error || 'Network error');
    }
};
exports.login = login;
const refreshToken = async (currentRefreshToken) => {
    try {
        const response = await apiClient_1.apiClient.post('/auth/refresh', {
            refreshToken: currentRefreshToken,
        });
        if (response.data.success && response.data.data) {
            const { token, refreshToken, user, expiresAt } = response.data.data;
            await Promise.all([
                react_native_encrypted_storage_1.default.setItem(TOKEN_KEY, token),
                react_native_encrypted_storage_1.default.setItem(REFRESH_TOKEN_KEY, refreshToken),
                react_native_encrypted_storage_1.default.setItem(USER_KEY, JSON.stringify(user)),
            ]);
            return {
                token,
                refreshToken,
                user,
                expiresAt: new Date(expiresAt),
            };
        }
        throw new Error(response.data.error || 'Token refresh failed');
    }
    catch (error) {
        console.error('Token refresh error:', error);
        await (0, exports.clearStoredTokens)();
        throw new Error(error.response?.data?.error || 'Token refresh failed');
    }
};
exports.refreshToken = refreshToken;
const logout = async () => {
    try {
        const token = await react_native_encrypted_storage_1.default.getItem(TOKEN_KEY);
        if (token) {
            await apiClient_1.apiClient.post('/auth/logout', {}, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
        }
    }
    catch (error) {
        console.error('Logout error:', error);
    }
    finally {
        await (0, exports.clearStoredTokens)();
    }
};
exports.logout = logout;
const saveCredentialsForBiometrics = async (credentials) => {
    try {
        await react_native_encrypted_storage_1.default.setItem(CREDENTIALS_KEY, JSON.stringify(credentials));
    }
    catch (error) {
        console.error('Error saving credentials for biometrics:', error);
        throw new Error('Failed to save credentials for biometric authentication');
    }
};
exports.saveCredentialsForBiometrics = saveCredentialsForBiometrics;
const getSavedCredentials = async () => {
    try {
        const credentialsStr = await react_native_encrypted_storage_1.default.getItem(CREDENTIALS_KEY);
        return credentialsStr ? JSON.parse(credentialsStr) : null;
    }
    catch (error) {
        console.error('Error retrieving saved credentials:', error);
        return null;
    }
};
exports.getSavedCredentials = getSavedCredentials;
const clearSavedCredentials = async () => {
    try {
        await react_native_encrypted_storage_1.default.removeItem(CREDENTIALS_KEY);
    }
    catch (error) {
        console.error('Error clearing saved credentials:', error);
    }
};
exports.clearSavedCredentials = clearSavedCredentials;
const getStoredToken = async () => {
    try {
        return await react_native_encrypted_storage_1.default.getItem(TOKEN_KEY);
    }
    catch (error) {
        console.error('Error retrieving stored token:', error);
        return null;
    }
};
exports.getStoredToken = getStoredToken;
const getStoredRefreshToken = async () => {
    try {
        return await react_native_encrypted_storage_1.default.getItem(REFRESH_TOKEN_KEY);
    }
    catch (error) {
        console.error('Error retrieving stored refresh token:', error);
        return null;
    }
};
exports.getStoredRefreshToken = getStoredRefreshToken;
const getStoredUser = async () => {
    try {
        const userStr = await react_native_encrypted_storage_1.default.getItem(USER_KEY);
        return userStr ? JSON.parse(userStr) : null;
    }
    catch (error) {
        console.error('Error retrieving stored user:', error);
        return null;
    }
};
exports.getStoredUser = getStoredUser;
const clearStoredTokens = async () => {
    try {
        await Promise.all([
            react_native_encrypted_storage_1.default.removeItem(TOKEN_KEY),
            react_native_encrypted_storage_1.default.removeItem(REFRESH_TOKEN_KEY),
            react_native_encrypted_storage_1.default.removeItem(USER_KEY),
        ]);
    }
    catch (error) {
        console.error('Error clearing stored tokens:', error);
    }
};
exports.clearStoredTokens = clearStoredTokens;
const isTokenExpired = (token) => {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        const currentTime = Date.now() / 1000;
        return payload.exp < currentTime;
    }
    catch (error) {
        console.error('Error checking token expiration:', error);
        return true;
    }
};
exports.isTokenExpired = isTokenExpired;
const validateSession = async () => {
    try {
        const token = await (0, exports.getStoredToken)();
        if (!token || (0, exports.isTokenExpired)(token)) {
            return false;
        }
        const response = await apiClient_1.apiClient.get('/auth/validate', {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        return response.data.success;
    }
    catch (error) {
        console.error('Session validation error:', error);
        return false;
    }
};
exports.validateSession = validateSession;
const changePassword = async (currentPassword, newPassword) => {
    try {
        const token = await (0, exports.getStoredToken)();
        if (!token) {
            throw new Error('No authentication token found');
        }
        const response = await apiClient_1.apiClient.post('/auth/change-password', {
            currentPassword,
            newPassword,
        }, {
            headers: {
                Authorization: `Bearer ${token}`,
            },
        });
        if (!response.data.success) {
            throw new Error(response.data.error || 'Password change failed');
        }
    }
    catch (error) {
        console.error('Password change error:', error);
        throw new Error(error.response?.data?.error || 'Password change failed');
    }
};
exports.changePassword = changePassword;
const requestPasswordReset = async (email) => {
    try {
        const response = await apiClient_1.apiClient.post('/auth/request-password-reset', {
            email,
        });
        if (!response.data.success) {
            throw new Error(response.data.error || 'Password reset request failed');
        }
    }
    catch (error) {
        console.error('Password reset request error:', error);
        throw new Error(error.response?.data?.error || 'Password reset request failed');
    }
};
exports.requestPasswordReset = requestPasswordReset;
