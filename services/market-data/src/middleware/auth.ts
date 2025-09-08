import { Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
  user?: any;
  userId?: string;
  tenantId?: string;
}
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
  sessionId?: string;
}

// Using the global declaration from portfolio-service
// declare global {
//   namespace Express {
//     interface Request {
//       user?: JWTPayload & { sessionId?: string };
//     }
//   }
// }

export const authenticateJWT = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    logger.warn('Authentication failed: No token provided', {
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

    const decoded = jwt.verify(token, secret) as JWTPayload;
    (req as any).user = decoded;
    next();
  } catch (error: any) {
    logger.warn('Authentication failed: Invalid token', {
      path: req.path,
      method: req.method,
      ip: req.ip,
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    if ((error as any) instanceof jwt.TokenExpiredError) {
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

export const requirePermission = (requiredPermissions: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!(req as any).user) {
      return res.status(401).json({
        error: 'Authentication required',
        message: 'User not authenticated',
      });
    }

    const userPermissions = (req as any).user?.permissions || [];
    const hasPermission = requiredPermissions.some(permission => 
      userPermissions.includes(permission)
    );

    if (!hasPermission) {
      logger.warn('Authorization failed: Insufficient permissions', {
        userId: (req as any).user?.sub,
        tenantId: (req as any).user?.tenantId,
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

export const requireTenantAccess = (req: Request, res: Response, next: NextFunction) => {
  if (!(req as any).user?.tenantId) {
    logger.warn('Authorization failed: No tenant ID', {
      userId: (req as any).user?.sub,
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

