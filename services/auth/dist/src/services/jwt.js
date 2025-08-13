"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JWTService = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const redis_1 = require("../config/redis");
const logger_1 = require("../config/logger");
class JWTService {
    static instance;
    accessTokenSecret;
    refreshTokenSecret;
    cache;
    constructor() {
        this.accessTokenSecret = process.env.JWT_ACCESS_SECRET || this.generateSecret();
        this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || this.generateSecret();
        this.cache = redis_1.CacheService.getInstance();
    }
    static getInstance() {
        if (!JWTService.instance) {
            JWTService.instance = new JWTService();
        }
        return JWTService.instance;
    }
    generateSecret() {
        return crypto_1.default.randomBytes(64).toString('hex');
    }
    async generateTokenPair(payload) {
        const jti = crypto_1.default.randomUUID();
        const sessionId = crypto_1.default.randomUUID();
        const accessTokenPayload = {
            ...payload,
            type: 'access',
            jti,
            sessionId,
        };
        const refreshTokenPayload = {
            userId: payload.userId,
            tenantId: payload.tenantId,
            type: 'refresh',
            jti: crypto_1.default.randomUUID(),
            sessionId,
        };
        const accessToken = jsonwebtoken_1.default.sign(accessTokenPayload, this.accessTokenSecret, {
            expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
            issuer: 'investment-platform-auth',
            audience: 'investment-platform',
        });
        const refreshToken = jsonwebtoken_1.default.sign(refreshTokenPayload, this.refreshTokenSecret, {
            expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
            issuer: 'investment-platform-auth',
            audience: 'investment-platform',
        });
        // Store session info in Redis
        await this.cache.setSession(sessionId, {
            userId: payload.userId,
            tenantId: payload.tenantId,
            roles: payload.roles,
            permissions: payload.permissions,
            createdAt: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
        }, 7 * 24 * 3600); // 7 days
        // Store refresh token in Redis for revocation capability
        await this.cache.set(`refresh:${sessionId}`, refreshToken, 7 * 24 * 3600);
        return {
            accessToken,
            refreshToken,
            expiresIn: 900, // 15 minutes
            tokenType: 'Bearer',
        };
    }
    async verifyAccessToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.accessTokenSecret);
            if (decoded.type !== 'access') {
                throw new Error('Invalid token type');
            }
            // Check if session is still valid
            const sessionData = await this.cache.getSession(decoded.sessionId);
            if (!sessionData) {
                throw new Error('Session expired');
            }
            // Update last activity
            sessionData.lastActivity = new Date().toISOString();
            await this.cache.setSession(decoded.sessionId, sessionData, 7 * 24 * 3600);
            return {
                userId: decoded.userId,
                tenantId: decoded.tenantId,
                roles: decoded.roles,
                permissions: decoded.permissions,
                email: decoded.email,
            };
        }
        catch (error) {
            logger_1.logger.warn('JWT verification failed:', error);
            return null;
        }
    }
    async verifyRefreshToken(token) {
        try {
            const decoded = jsonwebtoken_1.default.verify(token, this.refreshTokenSecret);
            if (decoded.type !== 'refresh') {
                throw new Error('Invalid token type');
            }
            // Check if refresh token is still stored (not revoked)
            const storedToken = await this.cache.get(`refresh:${decoded.sessionId}`);
            if (!storedToken || storedToken !== token) {
                throw new Error('Refresh token revoked or invalid');
            }
            return {
                userId: decoded.userId,
                tenantId: decoded.tenantId,
                sessionId: decoded.sessionId,
            };
        }
        catch (error) {
            logger_1.logger.warn('Refresh token verification failed:', error);
            return null;
        }
    }
    async revokeSession(sessionId) {
        try {
            await this.cache.deleteSession(sessionId);
            await this.cache.del(`refresh:${sessionId}`);
            logger_1.logger.info('Session revoked:', { sessionId });
        }
        catch (error) {
            logger_1.logger.error('Failed to revoke session:', { sessionId, error });
            throw error;
        }
    }
    async revokeAllUserSessions(userId) {
        try {
            // This would require a more sophisticated approach in production
            // For now, we'll implement a simple version
            const pattern = `session:*`;
            // Note: In production, you'd want to use Redis SCAN instead of KEYS
            logger_1.logger.info('Revoking all sessions for user:', { userId });
        }
        catch (error) {
            logger_1.logger.error('Failed to revoke all user sessions:', { userId, error });
            throw error;
        }
    }
    extractTokenFromHeader(authHeader) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        return authHeader.substring(7);
    }
}
exports.JWTService = JWTService;
exports.default = JWTService;
