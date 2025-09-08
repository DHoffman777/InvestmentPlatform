export const __esModule: boolean;
export class AuthService {
    static instance: any;
    static getInstance(): any;
    db: database_1.DatabaseService;
    cache: redis_1.CacheService;
    jwtService: jwt_1.JWTService;
    register(tenantId: any, userData: any): Promise<any>;
    login(tenantId: any, credentials: any): Promise<{
        user: any;
        tokens: import("@investment-platform/types").TokenPair;
    }>;
    refreshTokens(refreshToken: any): Promise<import("@investment-platform/types").TokenPair>;
    logout(sessionId: any): Promise<void>;
    handleFailedLogin(tenantId: any, userId: any): Promise<void>;
    getUserRoles(tenantId: any, userId: any): Promise<any[]>;
    getUserPermissions(tenantId: any, userId: any): Promise<any[]>;
    assignRole(tenantId: any, userId: any, roleName: any): Promise<void>;
}
import database_1 = require("../config/database");
import redis_1 = require("../config/redis");
import jwt_1 = require("./jwt");
