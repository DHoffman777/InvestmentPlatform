interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    tenantId: string;
    preferences: {
        theme: 'light' | 'dark';
        language: string;
        timezone: string;
        currency: string;
    };
}
interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    sessionExpiry: number | null;
    lastActivity: number;
}
export declare const loginStart: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"auth/loginStart">, loginSuccess: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    user: User;
    token: string;
    expiresAt: number;
}, "auth/loginSuccess">, loginFailure: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"auth/loginFailure">, logout: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"auth/logout">, updateLastActivity: import("@reduxjs/toolkit").ActionCreatorWithoutPayload<"auth/updateLastActivity">, updateUserPreferences: import("@reduxjs/toolkit").ActionCreatorWithPayload<Partial<{
    theme: "light" | "dark";
    language: string;
    timezone: string;
    currency: string;
}>, "auth/updateUserPreferences">, refreshToken: import("@reduxjs/toolkit").ActionCreatorWithPayload<{
    token: string;
    expiresAt: number;
}, "auth/refreshToken">;
declare const _default: import("redux").Reducer<AuthState>;
export default _default;
