import { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
  user?: any;
  userId?: string;
  tenantId?: string;
}

import { JWTService } from '../services/jwt';
import { logger } from '../config/logger';
import { JWTPayload } from '@investment-platform/types';
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload & { sessionId?: string };
    }
  }
}
export const authMiddleware = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<any> => {
  try {
    const jwtService = JWTService.getInstance();
    
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
  } catch (error: any) {
    logger.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      error: 'Authentication failed',
      message: 'Failed to authenticate token'
    });
  }
};
export const requirePermissions = (permissions: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const user = req.user;
    
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
        message: 'Authentication required'
      });
      return;
    }
    const hasPermissions = permissions.every(permission => 
      user.permissions?.includes(permission)
    );
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
export const requireRoles = (roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const user = req.user;
    
    if (!user) {
      res.status(401).json({
        success: false,
        error: 'Not authenticated',
        message: 'Authentication required'
      });
      return;
    }
    const hasRole = roles.some(role => 
      user.roles?.includes(role)
    );
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
export const optionalAuth = async (
  req: Request, 
  res: Response, 
  next: NextFunction
): Promise<any> => {
  try {
    const jwtService = JWTService.getInstance();
    const token = jwtService.extractTokenFromHeader(req.headers.authorization);
    
    if (token) {
      const payload = await jwtService.verifyAccessToken(token);
      if (payload) {
        req.user = payload;
      }
    }
    
    next();
  } catch (error: any) {
    logger.warn('Optional auth middleware error:', error);
    next(); // Continue without authentication
  }
};


