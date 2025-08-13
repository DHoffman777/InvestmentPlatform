"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_1 = require("../services/auth");
const jwt_1 = require("../services/jwt");
const logger_1 = require("../config/logger");
class AuthController {
    authService;
    jwtService;
    constructor() {
        this.authService = auth_1.AuthService.getInstance();
        this.jwtService = jwt_1.JWTService.getInstance();
    }
    register = async (req, res, next) => {
        try {
            const tenantId = req.headers['x-tenant-id'];
            if (!tenantId) {
                res.status(400).json({
                    success: false,
                    error: 'Missing tenant ID',
                    message: 'Tenant ID is required in headers'
                });
                return;
            }
            const userData = req.body;
            const user = await this.authService.register(tenantId, userData);
            res.status(201).json({
                success: true,
                data: {
                    user,
                    message: 'User registered successfully. Please verify your email address.'
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Registration controller error:', error);
            next(error);
        }
    };
    login = async (req, res, next) => {
        try {
            const tenantId = req.headers['x-tenant-id'];
            if (!tenantId) {
                res.status(400).json({
                    success: false,
                    error: 'Missing tenant ID',
                    message: 'Tenant ID is required in headers'
                });
                return;
            }
            const credentials = req.body;
            const result = await this.authService.login(tenantId, credentials);
            // Set secure HTTP-only cookie for refresh token
            res.cookie('refreshToken', result.tokens.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });
            res.status(200).json({
                success: true,
                data: {
                    user: result.user,
                    accessToken: result.tokens.accessToken,
                    expiresIn: result.tokens.expiresIn,
                    tokenType: result.tokens.tokenType
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Login controller error:', error);
            if (error instanceof Error) {
                if (error.message.includes('Invalid credentials') ||
                    error.message.includes('suspended') ||
                    error.message.includes('locked')) {
                    res.status(401).json({
                        success: false,
                        error: 'Authentication failed',
                        message: error.message
                    });
                    return;
                }
            }
            next(error);
        }
    };
    refreshToken = async (req, res, next) => {
        try {
            const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
            if (!refreshToken) {
                res.status(401).json({
                    success: false,
                    error: 'Missing refresh token',
                    message: 'Refresh token is required'
                });
                return;
            }
            const tokens = await this.authService.refreshTokens(refreshToken);
            // Update refresh token cookie
            res.cookie('refreshToken', tokens.refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                sameSite: 'strict',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
            });
            res.status(200).json({
                success: true,
                data: {
                    accessToken: tokens.accessToken,
                    expiresIn: tokens.expiresIn,
                    tokenType: tokens.tokenType
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Token refresh controller error:', error);
            res.status(401).json({
                success: false,
                error: 'Token refresh failed',
                message: 'Invalid or expired refresh token'
            });
        }
    };
    logout = async (req, res, next) => {
        try {
            const sessionId = req.user?.sessionId;
            if (sessionId) {
                await this.authService.logout(sessionId);
            }
            // Clear refresh token cookie
            res.clearCookie('refreshToken');
            res.status(200).json({
                success: true,
                message: 'Logged out successfully'
            });
        }
        catch (error) {
            logger_1.logger.error('Logout controller error:', error);
            next(error);
        }
    };
    me = async (req, res, next) => {
        try {
            const user = req.user;
            if (!user) {
                res.status(401).json({
                    success: false,
                    error: 'Not authenticated',
                    message: 'Authentication required'
                });
                return;
            }
            res.status(200).json({
                success: true,
                data: { user }
            });
        }
        catch (error) {
            logger_1.logger.error('Me controller error:', error);
            next(error);
        }
    };
    verifyEmail = async (req, res, next) => {
        try {
            // TODO: Implement email verification
            res.status(501).json({
                success: false,
                error: 'Not implemented',
                message: 'Email verification not yet implemented'
            });
        }
        catch (error) {
            logger_1.logger.error('Email verification controller error:', error);
            next(error);
        }
    };
    forgotPassword = async (req, res, next) => {
        try {
            // TODO: Implement forgot password
            res.status(501).json({
                success: false,
                error: 'Not implemented',
                message: 'Forgot password not yet implemented'
            });
        }
        catch (error) {
            logger_1.logger.error('Forgot password controller error:', error);
            next(error);
        }
    };
    resetPassword = async (req, res, next) => {
        try {
            // TODO: Implement reset password
            res.status(501).json({
                success: false,
                error: 'Not implemented',
                message: 'Reset password not yet implemented'
            });
        }
        catch (error) {
            logger_1.logger.error('Reset password controller error:', error);
            next(error);
        }
    };
}
exports.AuthController = AuthController;
exports.default = new AuthController();
