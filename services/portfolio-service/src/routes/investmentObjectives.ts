import { Router, Request, Response } from 'express';
import { getKafkaService } from '../utils/kafka-mock';
import { logger } from '../utils/logger';
import {
  InvestmentObjectivesService,
  InvestmentObjectiveRequest,
  InvestmentRestrictionRequest
} from '../services/clientRelationship/InvestmentObjectivesService';
// RestrictionType not exported from ClientRelationship model
// Using string type instead
type RestrictionType = string;
type RiskTolerance = string;
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { Decimal } from '@prisma/client/runtime/library';

const router = Router();
const kafkaService = getKafkaService();
const investmentObjectivesService = new InvestmentObjectivesService();

// Validation schemas
const investmentObjectiveSchema = {
  clientId: {
    required: true,
    type: 'string',
    message: 'Client ID is required'
  },
  objective: {
    required: true,
    type: 'string',
    minLength: 5,
    maxLength: 500,
    message: 'Objective must be 5-500 characters'
  },
  priority: {
    required: true,
    type: 'number',
    min: 1,
    max: 20,
    message: 'Priority must be between 1 and 20'
  },
  targetAllocation: {
    required: false,
    type: 'number',
    min: 0,
    max: 100,
    message: 'Target allocation must be between 0 and 100 percent'
  },
  description: {
    required: false,
    type: 'string',
    maxLength: 1000
  },
  timeHorizon: {
    required: false,
    type: 'number',
    min: 1,
    max: 50,
    message: 'Time horizon must be between 1 and 50 years'
  },
  expectedReturn: {
    required: false,
    type: 'number',
    min: -50,
    max: 100,
    message: 'Expected return must be between -50% and 100%'
  },
  riskLevel: {
    required: false,
    enum: ['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE', 'VERY_AGGRESSIVE'],
    message: 'Valid risk level is required'
  }
};

const investmentRestrictionSchema = {
  clientId: {
    required: true,
    type: 'string',
    message: 'Client ID is required'
  },
  restrictionType: {
    required: true,
    enum: ['POSITION_LIMIT', 'SECTOR_LIMIT', 'ISSUER_LIMIT', 'ESG_RESTRICTION'],
    message: 'Valid restriction type is required'
  },
  description: {
    required: true,
    type: 'string',
    minLength: 10,
    maxLength: 1000,
    message: 'Description must be 10-1000 characters'
  },
  appliesTo: {
    required: true,
    type: 'string',
    minLength: 2,
    maxLength: 200,
    message: 'Applies to field must be 2-200 characters'
  },
  isActive: {
    required: true,
    type: 'boolean',
    message: 'Active status is required'
  },
  threshold: {
    required: false,
    type: 'number',
    min: 0,
    max: 100,
    message: 'Threshold must be between 0 and 100'
  },
  violationAction: {
    required: false,
    enum: ['ALERT', 'BLOCK', 'OVERRIDE_REQUIRED'],
    message: 'Valid violation action is required'
  }
};

/**
 * @route POST /api/investment-objectives/objectives
 * @desc Create investment objective for a client
 * @access Private
 */
router.post('/objectives',
  authMiddleware as any,
  validateRequest(investmentObjectiveSchema),
  async (req: any, res: any) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        });
      }

      const objectiveRequest: InvestmentObjectiveRequest = {
        ...req.body,
        targetAllocation: req.body.targetAllocation ? new (Decimal as any)(req.body.targetAllocation) : undefined,
        expectedReturn: req.body.expectedReturn ? new (Decimal as any)(req.body.expectedReturn) : undefined
      };

      logger.info('Creating investment objective', {
        tenantId,
        clientId: objectiveRequest.clientId,
        objective: objectiveRequest.objective,
        userId
      });

      const result = await investmentObjectivesService.createInvestmentObjective(
        objectiveRequest,
        tenantId,
        userId
      );

      res.status(201).json({
        success: true,
        data: result,
        message: 'Investment objective created successfully'
      });

    } catch (error: any) {
      logger.error('Error creating investment objective:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'OBJECTIVE_CREATION_FAILED'
      });
    }
  }
);

/**
 * @route POST /api/investment-objectives/restrictions
 * @desc Create investment restriction for a client
 * @access Private
 */
router.post('/restrictions',
  authMiddleware as any,
  validateRequest(investmentRestrictionSchema),
  async (req: any, res: any) => {
    try {
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        });
      }

      const restrictionRequest: InvestmentRestrictionRequest = {
        ...req.body,
        threshold: req.body.threshold ? new (Decimal as any)(req.body.threshold) : undefined,
        effectiveDate: req.body.effectiveDate ? new Date(req.body.effectiveDate) : undefined,
        expirationDate: req.body.expirationDate ? new Date(req.body.expirationDate) : undefined
      };

      logger.info('Creating investment restriction', {
        tenantId,
        clientId: restrictionRequest.clientId,
        restrictionType: restrictionRequest.restrictionType,
        userId
      });

      const result = await investmentObjectivesService.createInvestmentRestriction(
        restrictionRequest,
        tenantId,
        userId
      );

      res.status(201).json({
        success: true,
        data: result,
        message: 'Investment restriction created successfully'
      });

    } catch (error: any) {
      logger.error('Error creating investment restriction:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'RESTRICTION_CREATION_FAILED'
      });
    }
  }
);

/**
 * @route GET /api/investment-objectives/clients/:clientId/objectives
 * @desc Get all investment objectives for a client
 * @access Private
 */
router.get('/clients/:clientId/objectives',
  authMiddleware as any,
  async (req: any, res: any) => {
    try {
      const { clientId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        });
      }

      logger.info('Retrieving client objectives', { clientId, tenantId });

      const result = await investmentObjectivesService.getClientObjectives(clientId, tenantId);

      res.json({
        success: true,
        data: result
      });

    } catch (error: any) {
      logger.error('Error retrieving client objectives:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'OBJECTIVES_RETRIEVAL_FAILED'
      });
    }
  }
);

/**
 * @route GET /api/investment-objectives/clients/:clientId/restrictions
 * @desc Get all investment restrictions for a client
 * @access Private
 */
router.get('/clients/:clientId/restrictions',
  authMiddleware as any,
  async (req: any, res: any) => {
    try {
      const { clientId } = req.params;
      const tenantId = req.user?.tenantId;
      const { includeInactive = false } = req.query;

      if (!tenantId) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        });
      }

      logger.info('Retrieving client restrictions', { 
        clientId, 
        tenantId, 
        includeInactive: includeInactive === 'true' 
      });

      const result = await investmentObjectivesService.getClientRestrictions(
        clientId, 
        tenantId, 
        includeInactive === 'true'
      );

      res.json({
        success: true,
        data: result
      });

    } catch (error: any) {
      logger.error('Error retrieving client restrictions:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'RESTRICTIONS_RETRIEVAL_FAILED'
      });
    }
  }
);

/**
 * @route PUT /api/investment-objectives/objectives/:objectiveId
 * @desc Update investment objective
 * @access Private
 */
router.put('/objectives/:objectiveId',
  authMiddleware as any,
  async (req: any, res: any) => {
    try {
      const { objectiveId } = req.params;
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        });
      }

      const updates = {
        ...req.body,
        targetAllocation: req.body.targetAllocation ? new (Decimal as any)(req.body.targetAllocation) : undefined,
        expectedReturn: req.body.expectedReturn ? new (Decimal as any)(req.body.expectedReturn) : undefined
      };

      logger.info('Updating investment objective', { objectiveId, tenantId, userId });

      const result = await investmentObjectivesService.updateObjective(
        objectiveId,
        updates,
        tenantId,
        userId
      );

      res.json({
        success: true,
        data: result,
        message: 'Investment objective updated successfully'
      });

    } catch (error: any) {
      logger.error('Error updating investment objective:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'OBJECTIVE_UPDATE_FAILED'
      });
    }
  }
);

/**
 * @route PUT /api/investment-objectives/restrictions/:restrictionId
 * @desc Update investment restriction
 * @access Private
 */
router.put('/restrictions/:restrictionId',
  authMiddleware as any,
  async (req: any, res: any) => {
    try {
      const { restrictionId } = req.params;
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        });
      }

      const updates = {
        ...req.body,
        threshold: req.body.threshold ? new (Decimal as any)(req.body.threshold) : undefined,
        effectiveDate: req.body.effectiveDate ? new Date(req.body.effectiveDate) : undefined,
        expirationDate: req.body.expirationDate ? new Date(req.body.expirationDate) : undefined
      };

      logger.info('Updating investment restriction', { restrictionId, tenantId, userId });

      const result = await investmentObjectivesService.updateRestriction(
        restrictionId,
        updates,
        tenantId,
        userId
      );

      res.json({
        success: true,
        data: result,
        message: 'Investment restriction updated successfully'
      });

    } catch (error: any) {
      logger.error('Error updating investment restriction:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'RESTRICTION_UPDATE_FAILED'
      });
    }
  }
);

/**
 * @route DELETE /api/investment-objectives/objectives/:objectiveId
 * @desc Delete investment objective
 * @access Private
 */
router.delete('/objectives/:objectiveId',
  authMiddleware as any,
  async (req: any, res: any) => {
    try {
      const { objectiveId } = req.params;
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        });
      }

      logger.info('Deleting investment objective', { objectiveId, tenantId, userId });

      await investmentObjectivesService.deleteObjective(objectiveId, tenantId, userId);

      res.json({
        success: true,
        message: 'Investment objective deleted successfully'
      });

    } catch (error: any) {
      logger.error('Error deleting investment objective:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'OBJECTIVE_DELETION_FAILED'
      });
    }
  }
);

/**
 * @route DELETE /api/investment-objectives/restrictions/:restrictionId
 * @desc Delete investment restriction
 * @access Private
 */
router.delete('/restrictions/:restrictionId',
  authMiddleware as any,
  async (req: any, res: any) => {
    try {
      const { restrictionId } = req.params;
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        });
      }

      logger.info('Deleting investment restriction', { restrictionId, tenantId, userId });

      await investmentObjectivesService.deleteRestriction(restrictionId, tenantId, userId);

      res.json({
        success: true,
        message: 'Investment restriction deleted successfully'
      });

    } catch (error: any) {
      logger.error('Error deleting investment restriction:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'RESTRICTION_DELETION_FAILED'
      });
    }
  }
);

/**
 * @route GET /api/investment-objectives/clients/:clientId/objectives/analysis
 * @desc Analyze client's investment objectives
 * @access Private
 */
router.get('/clients/:clientId/objectives/analysis',
  authMiddleware as any,
  async (req: any, res: any) => {
    try {
      const { clientId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        });
      }

      logger.info('Analyzing client objectives', { clientId, tenantId });

      const result = await investmentObjectivesService.analyzeObjectives(clientId, tenantId);

      res.json({
        success: true,
        data: result
      });

    } catch (error: any) {
      logger.error('Error analyzing client objectives:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'OBJECTIVES_ANALYSIS_FAILED'
      });
    }
  }
);

/**
 * @route GET /api/investment-objectives/clients/:clientId/restrictions/analysis
 * @desc Analyze client's investment restrictions
 * @access Private
 */
router.get('/clients/:clientId/restrictions/analysis',
  authMiddleware as any,
  async (req: any, res: any) => {
    try {
      const { clientId } = req.params;
      const tenantId = req.user?.tenantId;

      if (!tenantId) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        });
      }

      logger.info('Analyzing client restrictions', { clientId, tenantId });

      const result = await investmentObjectivesService.analyzeRestrictions(clientId, tenantId);

      res.json({
        success: true,
        data: result
      });

    } catch (error: any) {
      logger.error('Error analyzing client restrictions:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'RESTRICTIONS_ANALYSIS_FAILED'
      });
    }
  }
);

/**
 * @route GET /api/investment-objectives/restriction-types
 * @desc Get available restriction types
 * @access Private
 */
router.get('/restriction-types',
  authMiddleware as any,
  async (req: any, res: any) => {
    try {
      const restrictionTypes = ['POSITION_LIMIT', 'SECTOR_LIMIT', 'ISSUER_LIMIT', 'ESG_RESTRICTION'].map(type => ({
        value: type,
        label: type.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
        description: getRestrictionTypeDescription(type as RestrictionType)
      }));

      res.json({
        success: true,
        data: restrictionTypes
      });

    } catch (error: any) {
      logger.error('Error retrieving restriction types:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'RESTRICTION_TYPES_FAILED'
      });
    }
  }
);

/**
 * @route GET /api/investment-objectives/risk-levels
 * @desc Get available risk levels
 * @access Private
 */
router.get('/risk-levels',
  authMiddleware as any,
  async (req: any, res: any) => {
    try {
      const riskLevels = ['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE', 'VERY_AGGRESSIVE'].map((level: string) => ({
        value: level,
        label: level.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase()),
        description: getRiskLevelDescription(level),
        numericValue: getRiskLevelNumber(level)
      }));

      res.json({
        success: true,
        data: riskLevels
      });

    } catch (error: any) {
      logger.error('Error retrieving risk levels:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'RISK_LEVELS_FAILED'
      });
    }
  }
);

// Helper functions
function getRestrictionTypeDescription(type: RestrictionType): string {
  const descriptions: Record<string, string> = {
    'POSITION_LIMIT': 'Maximum position size limit',
    'SECTOR_LIMIT': 'Limitation on sector exposure or investment',
    'ISSUER_LIMIT': 'Maximum allocation limit for single issuer',
    'ESG_RESTRICTION': 'Environmental, Social, and Governance screening criteria'
  };
  return descriptions[type] || 'Investment restriction';
}

function getRiskLevelDescription(level: string): string {
  const descriptions: Record<string, string> = {
    'CONSERVATIVE': 'Low risk, focus on capital preservation',
    'MODERATE': 'Balanced approach to risk and return',
    'AGGRESSIVE': 'Higher risk, seeking higher returns',
    'VERY_AGGRESSIVE': 'Maximum risk for maximum potential returns'
  };
  return descriptions[level] || 'Risk tolerance level';
}

function getRiskLevelNumber(level: string): number {
  const riskMap: Record<string, number> = {
    'CONSERVATIVE': 1,
    'MODERATE': 2,
    'AGGRESSIVE': 3,
    'VERY_AGGRESSIVE': 4
  };
  return riskMap[level] || 2;
}

export default router;

