import { Request as ExpressRequest, Response, NextFunction } from 'express';

// Removed local interface - using global Express namespace declaration
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger';

interface LocalJWTPayload {
  sub: string;
  id: string;
  userId: string;
  clientId?: string;
  email: string;
  tenantId: string;
  roles: string[];
  permissions: string[];
  iat: number;
  exp: number;
  sessionId?: string;
}

// Extend the Express Request type locally
interface Request extends ExpressRequest {
  user?: LocalJWTPayload;
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
    
    const decoded = jwt.verify(token, accessSecret) as LocalJWTPayload;
    
    // Attach user information to request
    req.user = decoded;
    
    logger.debug('User authenticated', {
      userId: decoded.sub,
      tenantId: decoded.tenantId,
      email: decoded.email,
    });
    
    next();
  } catch (error: any) {
    logger.warn('Authentication failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      ip: req.ip,
      userAgent: req.get('User-Agent'),
    });
    
    if ((error as any) instanceof jwt.TokenExpiredError) {
      return res.status(401).json({
        error: 'Token expired',
        message: 'Please login again',
      });
    }
    
    if ((error as any) instanceof jwt.JsonWebTokenError) {
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
    
    const userRoles = (req.user as LocalJWTPayload).roles || [];
    const hasRequiredRole = requiredRoles.some(role => userRoles.includes(role));
    
    if (!hasRequiredRole) {
      logger.warn('Access denied - insufficient roles', {
        userId: (req.user as LocalJWTPayload).sub,
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
    
    const userPermissions = (req.user as LocalJWTPayload).permissions || [];
    const hasRequiredPermission = requiredPermissions.some(permission => 
      userPermissions.includes(permission)
    );
    
    if (!hasRequiredPermission) {
      logger.warn('Access denied - insufficient permissions', {
        userId: (req.user as LocalJWTPayload).sub,
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
  
  if (requestedTenantId && requestedTenantId !== (req.user as LocalJWTPayload).tenantId) {
    logger.warn('Cross-tenant access attempted', {
      userId: (req.user as LocalJWTPayload).sub,
      userTenantId: (req.user as LocalJWTPayload).tenantId,
      requestedTenantId,
    });
    
    return res.status(403).json({
      error: 'Access denied',
      message: 'Cannot access resources from different tenant',
    });
  }
  
  next();
};

export const authenticateToken = authMiddleware;
export const requireAuth = authMiddleware;

