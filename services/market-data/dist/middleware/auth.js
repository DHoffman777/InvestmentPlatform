"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireTenantAccess = exports.requirePermission = exports.authenticateJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const logger_1 = require("../utils/logger");
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        logger_1.logger.warn('Authentication failed: No token provided', {
            path: req.path,
            method: req.method,
            ip: req.ip,
        });
        return res.status(401).json({
            error: 'Authentication required',
            message: 'No token provided',
        });
    }
    try {
        const secret = process.env.JWT_SECRET;
        if (!secret) {
            throw new Error('JWT_SECRET not configured');
        }
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        req.user = decoded;
        next();
    }
    catch (error) {
        logger_1.logger.warn('Authentication failed: Invalid token', {
            path: req.path,
            method: req.method,
            ip: req.ip,
            error: error instanceof Error ? error.message : 'Unknown error',
        });
        if (error instanceof jsonwebtoken_1.default.TokenExpiredError) {
            return res.status(401).json({
                error: 'Token expired',
                message: 'Please log in again',
            });
        }
        return res.status(403).json({
            error: 'Invalid token',
            message: 'Access denied',
        });
    }
};
exports.authenticateJWT = authenticateJWT;
const requirePermission = (requiredPermissions) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                error: 'Authentication required',
                message: 'User not authenticated',
            });
        }
        const userPermissions = req.user.permissions || [];
        const hasPermission = requiredPermissions.some(permission => userPermissions.includes(permission));
        if (!hasPermission) {
            logger_1.logger.warn('Authorization failed: Insufficient permissions', {
                userId: req.user.sub,
                tenantId: req.user.tenantId,
                requiredPermissions,
                userPermissions,
                path: req.path,
                method: req.method,
            });
            return res.status(403).json({
                error: 'Insufficient permissions',
                message: 'Access denied',
                required: requiredPermissions,
            });
        }
        next();
    };
};
exports.requirePermission = requirePermission;
const requireTenantAccess = (req, res, next) => {
    if (!req.user?.tenantId) {
        logger_1.logger.warn('Authorization failed: No tenant ID', {
            userId: req.user?.sub,
            path: req.path,
            method: req.method,
        });
        return res.status(403).json({
            error: 'Tenant access required',
            message: 'Invalid tenant access',
        });
    }
    next();
};
exports.requireTenantAccess = requireTenantAccess;
//# sourceMappingURL=auth.js.map