import { User, CreateUserRequest, LoginRequest, TokenPair } from '@investment-platform/types';
export declare class AuthService {
    private static instance;
    private db;
    private cache;
    private jwtService;
    private constructor();
    static getInstance(): AuthService;
    register(tenantId: string, userData: CreateUserRequest): Promise<User>;
    login(tenantId: string, credentials: LoginRequest): Promise<{
        user: User;
        tokens: TokenPair;
    }>;
    refreshTokens(refreshToken: string): Promise<TokenPair>;
    logout(sessionId: string): Promise<any>;
    private handleFailedLogin;
    private getUserRoles;
    private getUserPermissions;
    private assignRole;
}

