import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
const { body, param, query, validationResult } = require('express-validator');
import { ClientPortalService } from '../services/clientPortal/ClientPortalService';
import { DashboardWidgetService } from '../services/clientPortal/DashboardWidgetService';
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import {
  DashboardWidgetType,
  MessageStatus,
  MessageType,
  AlertPriority,
  DashboardDataRequest
} from '../models/clientPortal/ClientPortal';
import { logger } from '../utils/logger';

const router = express.Router();
const prisma = new PrismaClient();
const clientPortalService = new ClientPortalService(prisma);
const dashboardWidgetService = new DashboardWidgetService(prisma);

// Validation schemas
const dashboardLayoutUpdateSchema = [
  body('name').optional().isLength({ min: 1, max: 255 }).withMessage('Name must be 1-255 characters'),
  body('description').optional().isLength({ max: 1000 }).withMessage('Description must be less than 1000 characters'),
  body('widgets').optional().isArray().withMessage('Widgets must be an array'),
  body('theme').optional().isObject().withMessage('Theme must be an object'),
  body('theme.primaryColor').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Invalid primary color format'),
  body('theme.secondaryColor').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Invalid secondary color format'),
  body('theme.backgroundColor').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Invalid background color format')
];

const dashboardDataSchema = [
  body('widgetTypes').isArray({ min: 1 }).withMessage('At least one widget type required'),
  body('widgetTypes.*').isIn(Object.values(DashboardWidgetType)).withMessage('Invalid widget type'),
  body('dateRange').optional().isObject().withMessage('Date range must be an object'),
  body('dateRange.startDate').optional().isISO8601().withMessage('Invalid start date'),
  body('dateRange.endDate').optional().isISO8601().withMessage('Invalid end date'),
  body('portfolioIds').optional().isArray().withMessage('Portfolio IDs must be an array'),
  body('portfolioIds.*').optional().isUUID().withMessage('Invalid portfolio ID format')
];

const preferencesUpdateSchema = [
  body('theme').optional().isIn(['LIGHT', 'DARK', 'AUTO']).withMessage('Invalid theme'),
  body('language').optional().isString().withMessage('Language must be a string'),
  body('timezone').optional().isString().withMessage('Timezone must be a string'),
  body('currency').optional().isString().withMessage('Currency must be a string'),
  body('dateFormat').optional().isString().withMessage('Date format must be a string'),
  body('emailNotifications').optional().isObject().withMessage('Email notifications must be an object'),
  body('pushNotifications').optional().isObject().withMessage('Push notifications must be an object'),
  body('sessionTimeout').optional().isInt({ min: 300, max: 7200 }).withMessage('Session timeout must be 5-120 minutes')
];

// Dashboard Routes

// Get dashboard layout
router.get('/dashboard/layout',
  authMiddleware as any,
  [query('layoutId').optional().isUUID().withMessage('Invalid layout ID')],
  validateRequest,
  async (req: any, res: any) => {
    try {
      const tenantId = req.user?.tenantId;
      const clientId = req.user?.clientId;
      const layoutId = req.query.layoutId as string;

      if (!tenantId || !clientId) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        });
      }

      logger.info('Retrieving dashboard layout', { tenantId, clientId, layoutId });

      const layout = await clientPortalService.getDashboardLayout(tenantId, clientId, layoutId);

      res.json({
        success: true,
        data: { layout },
        message: 'Dashboard layout retrieved successfully'
      });

    } catch (error: any) {
      logger.error('Error retrieving dashboard layout:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'LAYOUT_RETRIEVAL_FAILED'
      });
    }
  }
);

// Update dashboard layout
router.put('/dashboard/layout/:layoutId',
  authMiddleware as any,
  [param('layoutId').isUUID().withMessage('Valid layout ID required') as any],
  dashboardLayoutUpdateSchema,
  validateRequest,
  async (req: any, res: any) => {
    try {
      const tenantId = req.user?.tenantId;
      const clientId = req.user?.clientId;
      const { layoutId } = req.params;

      if (!tenantId || !clientId) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        });
      }

      logger.info('Updating dashboard layout', { tenantId, clientId, layoutId });

      const updatedLayout = await clientPortalService.updateDashboardLayout(
        tenantId,
        clientId,
        layoutId,
        req.body
      );

      res.json({
        success: true,
        data: { layout: updatedLayout },
        message: 'Dashboard layout updated successfully'
      });

    } catch (error: any) {
      logger.error('Error updating dashboard layout:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'LAYOUT_UPDATE_FAILED'
      });
    }
  }
);

// Get dashboard data
router.post('/dashboard/data',
  authMiddleware as any,
  dashboardDataSchema,
  validateRequest,
  async (req: any, res: any) => {
    try {
      const tenantId = req.user?.tenantId;
      const clientId = req.user?.clientId;

      if (!tenantId || !clientId) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        });
      }

      const request: DashboardDataRequest = {
        clientId,
        widgetTypes: req.body.widgetTypes,
        dateRange: req.body.dateRange ? {
          startDate: new Date(req.body.dateRange.startDate),
          endDate: new Date(req.body.dateRange.endDate)
        } : undefined,
        portfolioIds: req.body.portfolioIds
      };

      logger.info('Retrieving dashboard data', {
        tenantId,
        clientId,
        widgetTypes: request.widgetTypes
      });

      const dashboardData = await clientPortalService.getDashboardData(request);

      res.json({
        success: true,
        data: dashboardData,
        message: 'Dashboard data retrieved successfully'
      });

    } catch (error: any) {
      logger.error('Error retrieving dashboard data:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'DASHBOARD_DATA_FAILED'
      });
    }
  }
);

// Refresh widget data
router.post('/dashboard/widgets/:widgetId/refresh',
  authMiddleware as any,
  [param('widgetId').isUUID().withMessage('Valid widget ID required') as any],
  validateRequest,
  async (req: any, res: any) => {
    try {
      const tenantId = req.user?.tenantId;
      const clientId = req.user?.clientId;
      const { widgetId } = req.params;

      if (!tenantId || !clientId) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        });
      }

      logger.info('Refreshing widget data', { tenantId, clientId, widgetId });

      const result = await dashboardWidgetService.refreshWidget(widgetId, {
        tenantId,
        clientId,
        portfolioIds: req.body.portfolioIds
      });

      res.json({
        success: true,
        data: result,
        message: 'Widget refreshed successfully'
      });

    } catch (error: any) {
      logger.error('Error refreshing widget:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'WIDGET_REFRESH_FAILED'
      });
    }
  }
);

// Messages Routes

// Get client messages
router.get('/messages',
  authMiddleware as any,
  [
    query('status').optional().isIn(Object.values(MessageStatus)).withMessage('Invalid message status'),
    query('type').optional().isIn(Object.values(MessageType)).withMessage('Invalid message type'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be non-negative')
  ],
  validateRequest,
  async (req: any, res: any) => {
    try {
      const tenantId = req.user?.tenantId;
      const clientId = req.user?.clientId;

      if (!tenantId || !clientId) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        });
      }

      const options = {
        status: req.query.status as MessageStatus,
        type: req.query.type as MessageType,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
      };

      logger.info('Retrieving client messages', { tenantId, clientId, options });

      const result = await clientPortalService.getClientMessages(clientId, options);

      res.json({
        success: true,
        data: result,
        message: 'Messages retrieved successfully'
      });

    } catch (error: any) {
      logger.error('Error retrieving messages:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'MESSAGES_RETRIEVAL_FAILED'
      });
    }
  }
);

// Mark message as read
router.put('/messages/:messageId/read',
  authMiddleware as any,
  [param('messageId').isUUID().withMessage('Valid message ID required') as any],
  validateRequest,
  async (req: any, res: any) => {
    try {
      const tenantId = req.user?.tenantId;
      const clientId = req.user?.clientId;
      const { messageId } = req.params;

      if (!tenantId || !clientId) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        });
      }

      logger.info('Marking message as read', { tenantId, clientId, messageId });

      await clientPortalService.markMessageAsRead(tenantId, clientId, messageId);

      res.json({
        success: true,
        message: 'Message marked as read'
      });

    } catch (error: any) {
      logger.error('Error marking message as read:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'MESSAGE_UPDATE_FAILED'
      });
    }
  }
);

// Preferences Routes

// Get client preferences
router.get('/preferences',
  authMiddleware as any,
  async (req: any, res: any) => {
    try {
      const tenantId = req.user?.tenantId;
      const clientId = req.user?.clientId;

      if (!tenantId || !clientId) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        });
      }

      logger.info('Retrieving client preferences', { tenantId, clientId });

      const preferences = await clientPortalService.getClientPreferences(tenantId, clientId);

      res.json({
        success: true,
        data: { preferences },
        message: 'Preferences retrieved successfully'
      });

    } catch (error: any) {
      logger.error('Error retrieving preferences:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'PREFERENCES_RETRIEVAL_FAILED'
      });
    }
  }
);

// Update client preferences
router.put('/preferences',
  authMiddleware as any,
  preferencesUpdateSchema,
  validateRequest,
  async (req: any, res: any) => {
    try {
      const tenantId = req.user?.tenantId;
      const clientId = req.user?.clientId;

      if (!tenantId || !clientId) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        });
      }

      logger.info('Updating client preferences', { tenantId, clientId });

      const updatedPreferences = await clientPortalService.updateClientPreferences(
        tenantId,
        clientId,
        req.body
      );

      res.json({
        success: true,
        data: { preferences: updatedPreferences },
        message: 'Preferences updated successfully'
      });

    } catch (error: any) {
      logger.error('Error updating preferences:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'PREFERENCES_UPDATE_FAILED'
      });
    }
  }
);

// Analytics Routes

// Get portal analytics
router.get('/analytics',
  authMiddleware as any,
  [
    query('startDate').optional().isISO8601().withMessage('Invalid start date'),
    query('endDate').optional().isISO8601().withMessage('Invalid end date')
  ],
  validateRequest,
  async (req: any, res: any) => {
    try {
      const tenantId = req.user?.tenantId;
      const clientId = req.user?.clientId;

      if (!tenantId || !clientId) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        });
      }

      const period = {
        startDate: req.query.startDate ? 
          new Date(req.query.startDate as string) : 
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        endDate: req.query.endDate ? 
          new Date(req.query.endDate as string) : 
          new Date()
      };

      logger.info('Retrieving portal analytics', { tenantId, clientId, period });

      const analytics = await clientPortalService.getPortalAnalytics(tenantId, clientId, period);

      res.json({
        success: true,
        data: { analytics },
        message: 'Analytics retrieved successfully'
      });

    } catch (error: any) {
      logger.error('Error retrieving analytics:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'ANALYTICS_RETRIEVAL_FAILED'
      });
    }
  }
);

// Session Management Routes

// Create portal session (login)
router.post('/session',
  authMiddleware as any,
  [
    body('deviceInfo').isObject().withMessage('Device info is required'),
    body('deviceInfo.userAgent').isString().withMessage('User agent is required'),
    body('deviceInfo.deviceType').isIn(['DESKTOP', 'MOBILE', 'TABLET']).withMessage('Invalid device type')
  ],
  validateRequest,
  async (req: any, res: any) => {
    try {
      const tenantId = req.user?.tenantId;
      const clientId = req.user?.clientId;
      const userId = req.user?.id;

      if (!tenantId || !clientId || !userId) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        });
      }

      const deviceInfo = {
        ...req.body.deviceInfo,
        ipAddress: req.ip,
        os: req.get('sec-ch-ua-platform') || 'Unknown',
        browser: req.get('user-agent')?.split(' ')[0] || 'Unknown'
      };

      logger.info('Creating portal session', { tenantId, clientId, userId });

      const session = await clientPortalService.createPortalSession(
        tenantId,
        clientId,
        userId,
        deviceInfo
      );

      res.status(201).json({
        success: true,
        data: { 
          sessionId: session.id,
          sessionToken: session.sessionToken,
          expiresAt: session.expiresAt
        },
        message: 'Portal session created successfully'
      });

    } catch (error: any) {
      logger.error('Error creating portal session:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'SESSION_CREATION_FAILED'
      });
    }
  }
);

// Health check for client portal
router.get('/health',
  async (req: any, res: any) => {
    try {
      res.json({
        success: true,
        data: {
          service: 'client-portal',
          status: 'healthy',
          timestamp: new Date().toISOString(),
          uptime: process.uptime()
        },
        message: 'Client portal service is healthy'
      });

    } catch (error: any) {
      logger.error('Error in client portal health check:', error);
      res.status(503).json({
        error: 'Service unavailable',
        code: 'HEALTH_CHECK_FAILED'
      });
    }
  }
);

// Configuration endpoint for white-labeling
router.get('/configuration',
  authMiddleware as any,
  async (req: any, res: any) => {
    try {
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        });
      }

      // Mock portal configuration - would come from tenant settings
      const configuration = {
        branding: {
          companyName: 'Investment Platform',
          logoUrl: '/assets/logo.png',
          faviconUrl: '/assets/favicon.ico',
          primaryColor: '#1976D2',
          secondaryColor: '#424242',
          accentColor: '#FF5722',
          fontFamily: 'Roboto, sans-serif'
        },
        features: {
          dashboard: true,
          portfolio: true,
          documents: true,
          messages: true,
          reports: true,
          alerts: true,
          watchlist: true,
          goals: true,
          settings: true
        },
        security: {
          sessionTimeoutMinutes: 30,
          maxLoginAttempts: 5,
          lockoutDurationMinutes: 15,
          requireMfa: false,
          allowedDevices: ['DESKTOP', 'MOBILE', 'TABLET']
        },
        customization: {
          allowThemeChange: true,
          allowWidgetCustomization: true,
          allowLayoutChange: true,
          defaultLanguage: 'en-US',
          supportedLanguages: ['en-US', 'es-ES', 'fr-FR']
        }
      };

      res.json({
        success: true,
        data: { configuration },
        message: 'Portal configuration retrieved successfully'
      });

    } catch (error: any) {
      logger.error('Error retrieving portal configuration:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'CONFIGURATION_RETRIEVAL_FAILED'
      });
    }
  }
);

export default router;
