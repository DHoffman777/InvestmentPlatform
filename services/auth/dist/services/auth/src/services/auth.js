"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const crypto_1 = __importDefault(require("crypto"));
const database_1 = require("../config/database");
const redis_1 = require("../config/redis");
const jwt_1 = require("./jwt");
const logger_1 = require("../config/logger");
class AuthService {
    static instance;
    db;
    cache;
    jwtService;
    constructor() {
        this.db = database_1.DatabaseService.getInstance();
        this.cache = redis_1.CacheService.getInstance();
        this.jwtService = jwt_1.JWTService.getInstance();
    }
    static getInstance() {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }
    async register(tenantId, userData) {
        try {
            await this.db.setTenantContext(tenantId);
            const existingUser = await this.db.queryOne('SELECT id FROM users WHERE email = $1', [userData.email.toLowerCase()]);
            if (existingUser) {
                throw new Error('User already exists with this email');
            }
            const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
            const hashedPassword = await bcrypt_1.default.hash(userData.password, saltRounds);
            const userId = crypto_1.default.randomUUID();
            const now = new Date().toISOString();
            const user = await this.db.queryOne(`INSERT INTO users (
          id, email, first_name, last_name, password_hash, 
          status, created_at, updated_at, email_verified
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, email, first_name, last_name, status, created_at, updated_at, email_verified, last_login`, [
                userId,
                userData.email.toLowerCase(),
                userData.firstName,
                userData.lastName,
                hashedPassword,
                'PENDING_VERIFICATION',
                now,
                now,
                false
            ]);
            if (!user) {
                throw new Error('Failed to create user');
            }
            await this.assignRole(tenantId, userId, 'CLIENT');
            logger_1.logger.info('User registered successfully:', { userId, email: userData.email, tenantId });
            return user;
        }
        catch (error) {
            logger_1.logger.error('Registration failed:', { email: userData.email, tenantId, error });
            throw error;
        }
    }
    async login(tenantId, credentials) {
        try {
            await this.db.setTenantContext(tenantId);
            const user = await this.db.queryOne('SELECT * FROM users WHERE email = $1 AND status != $2', [credentials.email.toLowerCase(), 'DELETED']);
            if (!user) {
                throw new Error('Invalid credentials');
            }
            const isValidPassword = await bcrypt_1.default.compare(credentials.password, user.password_hash);
            if (!isValidPassword) {
                await this.handleFailedLogin(tenantId, user.id);
                throw new Error('Invalid credentials');
            }
            if (user.status === 'SUSPENDED') {
                throw new Error('Account is suspended');
            }
            if (user.status === 'LOCKED') {
                throw new Error('Account is locked due to multiple failed login attempts');
            }
            const roles = await this.getUserRoles(tenantId, user.id);
            const permissions = await this.getUserPermissions(tenantId, user.id);
            await this.db.query('UPDATE users SET last_login = $1, failed_login_attempts = 0 WHERE id = $2', [new Date().toISOString(), user.id]);
            const tokens = await this.jwtService.generateTokenPair({
                userId: user.id,
                tenantId,
                email: user.email,
                roles: roles.map(r => r.name),
                permissions: permissions.map(p => p.name),
            });
            const { password_hash, ...userWithoutPassword } = user;
            logger_1.logger.info('User logged in successfully:', { userId: user.id, email: user.email, tenantId });
            return {
                user: userWithoutPassword,
                tokens
            };
        }
        catch (error) {
            logger_1.logger.error('Login failed:', { email: credentials.email, tenantId, error });
            throw error;
        }
    }
    async refreshTokens(refreshToken) {
        try {
            const tokenData = await this.jwtService.verifyRefreshToken(refreshToken);
            if (!tokenData) {
                throw new Error('Invalid refresh token');
            }
            await this.db.setTenantContext(tokenData.tenantId);
            const user = await this.db.queryOne('SELECT * FROM users WHERE id = $1 AND status != $2', [tokenData.userId, 'DELETED']);
            if (!user) {
                throw new Error('User not found');
            }
            const roles = await this.getUserRoles(tokenData.tenantId, user.id);
            const permissions = await this.getUserPermissions(tokenData.tenantId, user.id);
            await this.jwtService.revokeSession(tokenData.sessionId);
            const tokens = await this.jwtService.generateTokenPair({
                userId: user.id,
                tenantId: tokenData.tenantId,
                email: user.email,
                roles: roles.map(r => r.name),
                permissions: permissions.map(p => p.name),
            });
            logger_1.logger.info('Tokens refreshed successfully:', { userId: user.id, tenantId: tokenData.tenantId });
            return tokens;
        }
        catch (error) {
            logger_1.logger.error('Token refresh failed:', error);
            throw error;
        }
    }
    async logout(sessionId) {
        try {
            await this.jwtService.revokeSession(sessionId);
            logger_1.logger.info('User logged out successfully:', { sessionId });
        }
        catch (error) {
            logger_1.logger.error('Logout failed:', { sessionId, error });
            throw error;
        }
    }
    async handleFailedLogin(tenantId, userId) {
        const maxAttempts = parseInt(process.env.MAX_LOGIN_ATTEMPTS || '5');
        const lockoutDuration = parseInt(process.env.LOCKOUT_DURATION || '900');
        await this.db.query('UPDATE users SET failed_login_attempts = failed_login_attempts + 1 WHERE id = $1', [userId]);
        const user = await this.db.queryOne('SELECT failed_login_attempts FROM users WHERE id = $1', [userId]);
        if (user && user.failed_login_attempts >= maxAttempts) {
            await this.db.query('UPDATE users SET status = $1, locked_until = $2 WHERE id = $3', [
                'LOCKED',
                new Date(Date.now() + lockoutDuration * 1000).toISOString(),
                userId
            ]);
            logger_1.logger.warn('User account locked due to failed login attempts:', {
                userId,
                tenantId,
                attempts: user.failed_login_attempts
            });
        }
    }
    async getUserRoles(tenantId, userId) {
        return this.db.query(`SELECT r.* FROM roles r
       JOIN user_roles ur ON r.id = ur.role_id
       WHERE ur.user_id = $1`, [userId]);
    }
    async getUserPermissions(tenantId, userId) {
        return this.db.query(`SELECT DISTINCT p.name FROM permissions p
       JOIN role_permissions rp ON p.id = rp.permission_id
       JOIN user_roles ur ON rp.role_id = ur.role_id
       WHERE ur.user_id = $1`, [userId]);
    }
    async assignRole(tenantId, userId, roleName) {
        const role = await this.db.queryOne('SELECT id FROM roles WHERE name = $1', [roleName]);
        if (role) {
            await this.db.query('INSERT INTO user_roles (user_id, role_id, assigned_at) VALUES ($1, $2, $3)', [userId, role.id, new Date().toISOString()]);
        }
    }
}
exports.AuthService = AuthService;
