import EncryptedStorage from 'react-native-encrypted-storage';
import Config from 'react-native-config';
import {ApiResponse, User} from '@types/index';
import {apiClient} from './apiClient';

interface LoginResponse {
  token: string;
  refreshToken: string;
  user: User;
  expiresAt: Date;
}

interface LoginCredentials {
  email: string;
  password: string;
}

const CREDENTIALS_KEY = 'biometric_credentials';
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user_data';

export const login = async (
  credentials: LoginCredentials,
): Promise<LoginResponse> => {
  try {
    const response = await apiClient.post<ApiResponse<LoginResponse>>(
      '/auth/login',
      credentials,
    );

    if (response.data.success && response.data.data) {
      const {token, refreshToken, user, expiresAt} = response.data.data;

      await Promise.all([
        EncryptedStorage.setItem(TOKEN_KEY, token),
        EncryptedStorage.setItem(REFRESH_TOKEN_KEY, refreshToken),
        EncryptedStorage.setItem(USER_KEY, JSON.stringify(user)),
      ]);

      return {
        token,
        refreshToken,
        user,
        expiresAt: new Date(expiresAt),
      };
    }

    throw new Error(response.data.error || 'Login failed');
  } catch (error: any) {
    console.error('Login error:', error);
    throw new Error(error.response?.data?.error || 'Network error');
  }
};

export const refreshToken = async (
  currentRefreshToken: string,
): Promise<LoginResponse> => {
  try {
    const response = await apiClient.post<ApiResponse<LoginResponse>>(
      '/auth/refresh',
      {
        refreshToken: currentRefreshToken,
      },
    );

    if (response.data.success && response.data.data) {
      const {token, refreshToken, user, expiresAt} = response.data.data;

      await Promise.all([
        EncryptedStorage.setItem(TOKEN_KEY, token),
        EncryptedStorage.setItem(REFRESH_TOKEN_KEY, refreshToken),
        EncryptedStorage.setItem(USER_KEY, JSON.stringify(user)),
      ]);

      return {
        token,
        refreshToken,
        user,
        expiresAt: new Date(expiresAt),
      };
    }

    throw new Error(response.data.error || 'Token refresh failed');
  } catch (error: any) {
    console.error('Token refresh error:', error);
    await clearStoredTokens();
    throw new Error(error.response?.data?.error || 'Token refresh failed');
  }
};

export const logout = async (): Promise<void> => {
  try {
    const token = await EncryptedStorage.getItem(TOKEN_KEY);
    if (token) {
      await apiClient.post(
        '/auth/logout',
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        },
      );
    }
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    await clearStoredTokens();
  }
};

export const saveCredentialsForBiometrics = async (
  credentials: LoginCredentials,
): Promise<void> => {
  try {
    await EncryptedStorage.setItem(
      CREDENTIALS_KEY,
      JSON.stringify(credentials),
    );
  } catch (error) {
    console.error('Error saving credentials for biometrics:', error);
    throw new Error('Failed to save credentials for biometric authentication');
  }
};

export const getSavedCredentials = async (): Promise<LoginCredentials | null> => {
  try {
    const credentialsStr = await EncryptedStorage.getItem(CREDENTIALS_KEY);
    return credentialsStr ? JSON.parse(credentialsStr) : null;
  } catch (error) {
    console.error('Error retrieving saved credentials:', error);
    return null;
  }
};

export const clearSavedCredentials = async (): Promise<void> => {
  try {
    await EncryptedStorage.removeItem(CREDENTIALS_KEY);
  } catch (error) {
    console.error('Error clearing saved credentials:', error);
  }
};

export const getStoredToken = async (): Promise<string | null> => {
  try {
    return await EncryptedStorage.getItem(TOKEN_KEY);
  } catch (error) {
    console.error('Error retrieving stored token:', error);
    return null;
  }
};

export const getStoredRefreshToken = async (): Promise<string | null> => {
  try {
    return await EncryptedStorage.getItem(REFRESH_TOKEN_KEY);
  } catch (error) {
    console.error('Error retrieving stored refresh token:', error);
    return null;
  }
};

export const getStoredUser = async (): Promise<User | null> => {
  try {
    const userStr = await EncryptedStorage.getItem(USER_KEY);
    return userStr ? JSON.parse(userStr) : null;
  } catch (error) {
    console.error('Error retrieving stored user:', error);
    return null;
  }
};

export const clearStoredTokens = async (): Promise<void> => {
  try {
    await Promise.all([
      EncryptedStorage.removeItem(TOKEN_KEY),
      EncryptedStorage.removeItem(REFRESH_TOKEN_KEY),
      EncryptedStorage.removeItem(USER_KEY),
    ]);
  } catch (error) {
    console.error('Error clearing stored tokens:', error);
  }
};

export const isTokenExpired = (token: string): boolean => {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    const currentTime = Date.now() / 1000;
    return payload.exp < currentTime;
  } catch (error) {
    console.error('Error checking token expiration:', error);
    return true;
  }
};

export const validateSession = async (): Promise<boolean> => {
  try {
    const token = await getStoredToken();
    if (!token || isTokenExpired(token)) {
      return false;
    }

    const response = await apiClient.get('/auth/validate', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    return response.data.success;
  } catch (error) {
    console.error('Session validation error:', error);
    return false;
  }
};

export const changePassword = async (
  currentPassword: string,
  newPassword: string,
): Promise<void> => {
  try {
    const token = await getStoredToken();
    if (!token) {
      throw new Error('No authentication token found');
    }

    const response = await apiClient.post(
      '/auth/change-password',
      {
        currentPassword,
        newPassword,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (!response.data.success) {
      throw new Error(response.data.error || 'Password change failed');
    }
  } catch (error: any) {
    console.error('Password change error:', error);
    throw new Error(error.response?.data?.error || 'Password change failed');
  }
};

export const requestPasswordReset = async (email: string): Promise<void> => {
  try {
    const response = await apiClient.post('/auth/request-password-reset', {
      email,
    });

    if (!response.data.success) {
      throw new Error(response.data.error || 'Password reset request failed');
    }
  } catch (error: any) {
    console.error('Password reset request error:', error);
    throw new Error(
      error.response?.data?.error || 'Password reset request failed',
    );
  }
};