import { User } from '@types/index';
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
export declare const login: (credentials: LoginCredentials) => Promise<LoginResponse>;
export declare const refreshToken: (currentRefreshToken: string) => Promise<LoginResponse>;
export declare const logout: () => Promise<void>;
export declare const saveCredentialsForBiometrics: (credentials: LoginCredentials) => Promise<void>;
export declare const getSavedCredentials: () => Promise<LoginCredentials | null>;
export declare const clearSavedCredentials: () => Promise<void>;
export declare const getStoredToken: () => Promise<string | null>;
export declare const getStoredRefreshToken: () => Promise<string | null>;
export declare const getStoredUser: () => Promise<User | null>;
export declare const clearStoredTokens: () => Promise<void>;
export declare const isTokenExpired: (token: string) => boolean;
export declare const validateSession: () => Promise<boolean>;
export declare const changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
export declare const requestPasswordReset: (email: string) => Promise<void>;
export {};
