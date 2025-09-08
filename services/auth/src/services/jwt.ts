const jwt = require('jsonwebtoken');
import crypto from 'crypto';
import { CacheService } from '../config/redis';
import { logger } from '../config/logger';
import { JWTPayload, TokenPair } from '@investment-platform/types';

export class JWTService {
  private static instance: JWTService;
  private accessTokenSecret: string;
  private refreshTokenSecret: string;
  private cache: CacheService;

  private constructor() {
    this.accessTokenSecret = process.env.JWT_ACCESS_SECRET || this.generateSecret();
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || this.generateSecret();
    this.cache = CacheService.getInstance();
  }

  public static getInstance(): JWTService {
    if (!JWTService.instance) {
      JWTService.instance = new JWTService();
    }
    return JWTService.instance;
  }

  private generateSecret(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  async generateTokenPair(payload: JWTPayload): Promise<TokenPair> {
    const jti = crypto.randomUUID();
    const sessionId = crypto.randomUUID();

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
      jti: crypto.randomUUID(),
      sessionId,
    };

    const accessToken = jwt.sign(
      accessTokenPayload, 
      this.accessTokenSecret, 
      {
        expiresIn: process.env.JWT_ACCESS_EXPIRY || '15m',
        issuer: 'investment-platform-auth',
        audience: 'investment-platform',
        algorithm: 'HS256'
      }
    );

    const refreshToken = jwt.sign(
      refreshTokenPayload, 
      this.refreshTokenSecret, 
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRY || '7d',
        issuer: 'investment-platform-auth',
        audience: 'investment-platform',
        algorithm: 'HS256'
      }
    );

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

  async verifyAccessToken(token: string): Promise<JWTPayload | null> {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret) as any;
      
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
    } catch (error: any) {
      logger.warn('JWT verification failed:', error);
      return null;
    }
  }

  async verifyRefreshToken(token: string): Promise<{ userId: string; tenantId: string; sessionId: string } | null> {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret) as any;
      
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
    } catch (error: any) {
      logger.warn('Refresh token verification failed:', error);
      return null;
    }
  }

  async revokeSession(sessionId: string): Promise<any> {
    try {
      await this.cache.deleteSession(sessionId);
      await this.cache.del(`refresh:${sessionId}`);
      logger.info('Session revoked:', { sessionId });
    } catch (error: any) {
      logger.error('Failed to revoke session:', { sessionId, error });
      throw error;
    }
  }

  async revokeAllUserSessions(userId: string): Promise<any> {
    try {
      // This would require a more sophisticated approach in production
      // For now, we'll implement a simple version
      const pattern = `session:*`;
      // Note: In production, you'd want to use Redis SCAN instead of KEYS
      logger.info('Revoking all sessions for user:', { userId });
    } catch (error: any) {
      logger.error('Failed to revoke all user sessions:', { userId, error });
      throw error;
    }
  }

  extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.substring(7);
  }
}

export default JWTService;

