import { JWTPayload, TokenPair } from '@investment-platform/types';
export declare class JWTService {
    private static instance;
    private accessTokenSecret;
    private refreshTokenSecret;
    private cache;
    private constructor();
    static getInstance(): JWTService;
    private generateSecret;
    generateTokenPair(payload: JWTPayload): Promise<TokenPair>;
    verifyAccessToken(token: string): Promise<JWTPayload | null>;
    verifyRefreshToken(token: string): Promise<{
        userId: string;
        tenantId: string;
        sessionId: string;
    } | null>;
    revokeSession(sessionId: string): Promise<void>;
    revokeAllUserSessions(userId: string): Promise<void>;
    extractTokenFromHeader(authHeader: string | undefined): string | null;
}
export default JWTService;
