import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth';
import { JWTService } from '../services/jwt';
import { logger } from '../config/logger';
import { CreateUserRequest, LoginRequest } from '@investment-platform/types';

export class AuthController {
  private authService: AuthService;
  private jwtService: JWTService;

  constructor() {
    this.authService = AuthService.getInstance();
    this.jwtService = JWTService.getInstance();
  }

  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Missing tenant ID',
          message: 'Tenant ID is required in headers'
        });
        return;
      }

      const userData: CreateUserRequest = req.body;
      
      const user = await this.authService.register(tenantId, userData);
      
      res.status(201).json({
        success: true,
        data: {
          user,
          message: 'User registered successfully. Please verify your email address.'
        }
      });
    } catch (error) {
      logger.error('Registration controller error:', error);
      next(error);
    }
  };

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const tenantId = req.headers['x-tenant-id'] as string;
      if (!tenantId) {
        res.status(400).json({
          success: false,
          error: 'Missing tenant ID',
          message: 'Tenant ID is required in headers'
        });
        return;
      }

      const credentials: LoginRequest = req.body;
      
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
    } catch (error) {
      logger.error('Login controller error:', error);
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

  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
    } catch (error) {
      logger.error('Token refresh controller error:', error);
      res.status(401).json({
        success: false,
        error: 'Token refresh failed',
        message: 'Invalid or expired refresh token'
      });
    }
  };

  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const sessionId = (req as any).user?.sessionId;
      
      if (sessionId) {
        await this.authService.logout(sessionId);
      }

      // Clear refresh token cookie
      res.clearCookie('refreshToken');

      res.status(200).json({
        success: true,
        message: 'Logged out successfully'
      });
    } catch (error) {
      logger.error('Logout controller error:', error);
      next(error);
    }
  };

  me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = (req as any).user;
      
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
    } catch (error) {
      logger.error('Me controller error:', error);
      next(error);
    }
  };

  verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // TODO: Implement email verification
      res.status(501).json({
        success: false,
        error: 'Not implemented',
        message: 'Email verification not yet implemented'
      });
    } catch (error) {
      logger.error('Email verification controller error:', error);
      next(error);
    }
  };

  forgotPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // TODO: Implement forgot password
      res.status(501).json({
        success: false,
        error: 'Not implemented',
        message: 'Forgot password not yet implemented'
      });
    } catch (error) {
      logger.error('Forgot password controller error:', error);
      next(error);
    }
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // TODO: Implement reset password
      res.status(501).json({
        success: false,
        error: 'Not implemented',
        message: 'Reset password not yet implemented'
      });
    } catch (error) {
      logger.error('Reset password controller error:', error);
      next(error);
    }
  };
}

export default new AuthController();