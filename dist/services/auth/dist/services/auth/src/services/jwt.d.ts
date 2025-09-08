export const __esModule: boolean;
export default JWTService;
export class JWTService {
    static instance: any;
    static getInstance(): any;
    accessTokenSecret: any;
    refreshTokenSecret: any;
    cache: redis_1.CacheService;
    generateSecret(): any;
    generateTokenPair(payload: any): Promise<{
        accessToken: never;
        refreshToken: never;
        expiresIn: number;
        tokenType: string;
    }>;
    verifyAccessToken(token: any): Promise<{
        userId: any;
        tenantId: any;
        roles: any;
        permissions: any;
        email: any;
    }>;
    verifyRefreshToken(token: any): Promise<{
        userId: any;
        tenantId: any;
        sessionId: any;
    }>;
    revokeSession(sessionId: any): Promise<void>;
    revokeAllUserSessions(userId: any): Promise<void>;
    extractTokenFromHeader(authHeader: any): any;
}
import redis_1 = require("../config/redis");
