"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.requireRoles = exports.requirePermissions = exports.authMiddleware = void 0;
const jwt_1 = require("../services/jwt");
const logger_1 = require("../config/logger");
const authMiddleware = async (req, res, next) => {
    try {
        const jwtService = jwt_1.JWTService.getInstance();
        const token = jwtService.extractTokenFromHeader(req.headers.authorization);
        if (!token) {
            res.status(401).json({
                success: false,
                error: 'No token provided',
                message: 'Authentication token is required'
            });
            return;
        }
        const payload = await jwtService.verifyAccessToken(token);
        if (!payload) {
            res.status(401).json({
                success: false,
                error: 'Invalid token',
                message: 'Authentication token is invalid or expired'
            });
            return;
        }
        req.user = payload;
        next();
    }
    catch (error) {
        logger_1.logger.error('Auth middleware error:', error);
        res.status(401).json({
            success: false,
            error: 'Authentication failed',
            message: 'Failed to authenticate token'
        });
    }
};
exports.authMiddleware = authMiddleware;
const requirePermissions = (permissions) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user) {
            res.status(401).json({
                success: false,
                error: 'Not authenticated',
                message: 'Authentication required'
            });
            return;
        }
        const hasPermissions = permissions.every(permission => user.permissions?.includes(permission));
        if (!hasPermissions) {
            res.status(403).json({
                success: false,
                error: 'Insufficient permissions',
                message: `Required permissions: ${permissions.join(', ')}`
            });
            return;
        }
        next();
    };
};
exports.requirePermissions = requirePermissions;
const requireRoles = (roles) => {
    return (req, res, next) => {
        const user = req.user;
        if (!user) {
            res.status(401).json({
                success: false,
                error: 'Not authenticated',
                message: 'Authentication required'
            });
            return;
        }
        const hasRole = roles.some(role => user.roles?.includes(role));
        if (!hasRole) {
            res.status(403).json({
                success: false,
                error: 'Insufficient role',
                message: `Required roles: ${roles.join(', ')}`
            });
            return;
        }
        next();
    };
};
exports.requireRoles = requireRoles;
const optionalAuth = async (req, res, next) => {
    try {
        const jwtService = jwt_1.JWTService.getInstance();
        const token = jwtService.extractTokenFromHeader(req.headers.authorization);
        if (token) {
            const payload = await jwtService.verifyAccessToken(token);
            if (payload) {
                req.user = payload;
            }
        }
        next();
    }
    catch (error) {
        logger_1.logger.warn('Optional auth middleware error:', error);
        next(); // Continue without authentication
    }
};
exports.optionalAuth = optionalAuth;
