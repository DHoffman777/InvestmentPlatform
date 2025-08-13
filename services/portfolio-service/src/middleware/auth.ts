import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

interface JWTPayload {
  sub: string;
  email: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
  iat: number;
  exp: number;
}

declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
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
      logger.error('JWT_ACCESS_SECRET not configured');
      return res.status(500).json({
        error: 'Server configuration error',
        message: 'Authentication service unavailable',
      });
    }
    
    const decoded = jwt.verify(token, accessSecret) as JWTPayload;
    
    // Attach user information to request
    req.user = decoded;
    
    logger.debug('User authenticated', {
      userId: decoded.sub,
      tenantId: decoded.tenantId,
      email: decoded.email,
    });
    
    next();
  } catch (error) {
    logger.warn('Authentication failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    
    if (error instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please login again',
      });
    }
    
    if (error instanceof jwt.JsonWebTokenError) {
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

export const requireRole = (requiredRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please authenticate first',
      });
    }
    
    const userRoles = req.user.roles || [];
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      logger.warn('Access denied - insufficient roles', {
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

export const requirePermission = (requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'Please authenticate first',
      });
    }
    
    const userPermissions = req.user.permissions || [];
    const hasRequiredPermission = requiredPermissions.some(permission => 
      userPermissions.includes(permission)
    );
    
    if (!hasRequiredPermission) {
      logger.warn('Access denied - insufficient permissions', {
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

export const requireTenantAccess = (req: Request, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication required',
      message: 'Please authenticate first',
    });
  }
  
  const requestedTenantId = req.params.tenantId || req.query.tenantId || req.body.tenantId;
  
  if (requestedTenantId && requestedTenantId !== req.user.tenantId) {
    logger.warn('Cross-tenant access attempted', {
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