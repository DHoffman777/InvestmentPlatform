"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = exports.authenticateToken = exports.requireTenantAccess = exports.requirePermission = exports.requireRole = exports.authMiddleware = void 0;
// Removed local interface - using global Express namespace declaration
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = require("../utils/logger");
const authMiddleware = (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                error: 'Access denied',
                message: 'No token provided or invalid token format',
            });
        }
        const token = authHeader.substring(7);
        const accessSecret = process.env.JWT_ACCESS_SECRET;
        if (!accessSecret) {
            logger_1.logger.error('JWT_ACCESS_SECRET not configured');
            return res.status(500).json({
                error: 'Server configuration error',
                message: 'Authentication service unavailable',
            });
        }
        const decoded = jsonwebtoken_1.default.verify(token, accessSecret);
        // Attach user information to request
        req.user = decoded;
        logger_1.logger.debug('User authenticated', {
            userId: decoded.sub,
            tenantId: decoded.tenantId,
            email: decoded.email,
        });
        next();
    }
    catch (error) {
        logger_1.logger.warn('Authentication failed', {
            error: error instanceof Error ? error.message : 'Unknown error',
            ip: req.ip,
            userAgent: req.get('User-Agent'),
        });
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return res.status(401).json({
                error: 'Token expired',
                message: 'Please login again',
            });
        }
        if (error instanceof jsonwebtoken_1.default.JsonWebTokenError) {
            return res.status(401).json({
                error: 'Invalid token',
                message: 'Please provide a valid token',
            });
        }
        return res.status(401).json({
            error: 'Authentication failed',
            message: 'Invalid or expired token',
        });
    }
};
exports.authMiddleware = authMiddleware;
const requireRole = (requiredRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'Please authenticate first',
            });
        }
        const userRoles = req.user.roles || [];
        const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
        if (!hasRequiredRole) {
            logger_1.logger.warn('Access denied - insufficient roles', {
                userId: req.user.sub,
                userRoles,
                requiredRoles,
            });
            return res.status(403).json({
                error: 'Access denied',
                message: 'Insufficient permissions',
            });
        }
        next();
    };
};
exports.requireRole = requireRole;
const requirePermission = (requiredPermissions) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'Please authenticate first',
            });
        }
        const userPermissions = req.user.permissions || [];
        const hasRequiredPermission = requiredPermissions.some(permission => userPermissions.includes(permission));
        if (!hasRequiredPermission) {
            logger_1.logger.warn('Access denied - insufficient permissions', {
                userId: req.user.sub,
                userPermissions,
                requiredPermissions,
            });
            return res.status(403).json({
                error: 'Access denied',
                message: 'Insufficient permissions',
            });
        }
        next();
    };
};
exports.requirePermission = requirePermission;
const requireTenantAccess = (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({
            error: 'Authentication required',
            message: 'Please authenticate first',
        });
    }
    const requestedTenantId = req.params.tenantId || req.query.tenantId || req.body.tenantId;
    if (requestedTenantId && requestedTenantId !== req.user.tenantId) {
        logger_1.logger.warn('Cross-tenant access attempted', {
            userId: req.user.sub,
            userTenantId: req.user.tenantId,
            requestedTenantId,
        });
        return res.status(403).json({
            error: 'Access denied',
            message: 'Cannot access resources from different tenant',
        });
    }
    next();
};
exports.requireTenantAccess = requireTenantAccess;
exports.authenticateToken = exports.authMiddleware;
exports.requireAuth = exports.authMiddleware;
