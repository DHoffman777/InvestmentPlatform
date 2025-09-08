import { Router, Request, Response } from 'express';
import { getKafkaService } from '../utils/kafka-mock';
import { logger } from '../utils/logger';
import { ClientRelationshipService } from '../services/clientRelationship/ClientRelationshipService';
import {
  ClientProfileRequest,
  MeetingRequest,
  CommunicationRequest,
  SuitabilityAssessmentRequest,
  ClientType,
  ClientStatus,
  RiskTolerance,
  InvestmentExperience,
  LiquidityNeeds,
  MeetingType,
  CommunicationMethod,
  OnboardingStatus
} from '../models/clientRelationship/ClientRelationship';
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { Decimal } from '@prisma/client/runtime/library';

const router = Router();
const kafkaService = getKafkaService();
const clientRelationshipService = new ClientRelationshipService(kafkaService);

// Validation schemas
const clientProfileSchema = {
  clientType: { 
    required: true, 
    enum: Object.values(ClientType),
    message: 'Valid client type is required' 
  },
  email: { 
    required: true, 
    type: 'string', 
    format: 'email',
    message: 'Valid email address is required' 
  },
  firstName: { 
    required: false, 
    type: 'string',
    minLength: 1 
  },
  lastName: { 
    required: false, 
    type: 'string',
    minLength: 1 
  },
  entityName: { 
    required: false, 
    type: 'string',
    minLength: 1 
  },
  primaryAddress: { 
    required: true, 
    type: 'object',
    message: 'Primary address is required' 
  },
  riskTolerance: { 
    required: true, 
    enum: Object.values(RiskTolerance),
    message: 'Valid risk tolerance is required' 
  },
  investmentExperience: { 
    required: true, 
    enum: Object.values(InvestmentExperience),
    message: 'Valid investment experience is required' 
  },
  liquidityNeeds: { 
    required: true, 
    enum: Object.values(LiquidityNeeds),
    message: 'Valid liquidity needs are required' 
  },
  timeHorizon: { 
    required: true, 
    type: 'number',
    min: 1,
    message: 'Time horizon must be at least 1 year' 
  }
};

const meetingRequestSchema = {
  clientId: { 
    required: true, 
    type: 'string',
    message: 'Client ID is required' 
  },
  meetingType: { 
    required: true, 
    enum: Object.values(MeetingType),
    message: 'Valid meeting type is required' 
  },
  title: { 
    required: true, 
    type: 'string',
    minLength: 1,
    message: 'Meeting title is required' 
  },
  scheduledDate: { 
    required: true, 
    type: 'string',
    format: 'date-time',
    message: 'Valid scheduled date is required' 
  },
  duration: { 
    required: true, 
    type: 'number',
    min: 15,
    max: 480,
    message: 'Duration must be between 15 and 480 minutes' 
  }
};

const communicationRequestSchema = {
  clientId: { 
    required: true, 
    type: 'string',
    message: 'Client ID is required' 
  },
  communicationType: { 
    required: true, 
    enum: Object.values(CommunicationMethod),
    message: 'Valid communication type is required' 
  },
  subject: { 
    required: true, 
    type: 'string',
    minLength: 1,
    message: 'Subject is required' 
  },
  content: { 
    required: true, 
    type: 'string',
    minLength: 1,
    message: 'Content is required' 
  },
  direction: { 
    required: true, 
    enum: ['INBOUND', 'OUTBOUND'],
    message: 'Valid direction is required' 
  },
  category: { 
    required: true, 
    type: 'string',
    minLength: 1,
    message: 'Category is required' 
  },
  priority: { 
    required: true, 
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
    message: 'Valid priority is required' 
  }
};

const suitabilityAssessmentSchema = {
  clientId: { 
    required: true, 
    type: 'string',
    message: 'Client ID is required' 
  },
  assessmentType: { 
    required: true, 
    enum: ['INITIAL', 'PERIODIC', 'TRIGGER_EVENT', 'REGULATORY'],
    message: 'Valid assessment type is required' 
  },
  riskTolerance: { 
    required: true, 
    enum: Object.values(RiskTolerance),
    message: 'Valid risk tolerance is required' 
  },
  timeHorizon: { 
    required: true, 
    type: 'number',
    min: 1,
    message: 'Time horizon must be at least 1 year' 
  },
  netWorth: { 
    required: true, 
    type: 'number',
    min: 0,
    message: 'Net worth must be non-negative' 
  },
  annualIncome: { 
    required: true, 
    type: 'number',
    min: 0,
    message: 'Annual income must be non-negative' 
  }
};

/**
 * @route POST /api/client-relationship/profiles
 * @desc Create a new client profile
 * @access Private
 */
router.post('/profiles', 
  authMiddleware as any, 
  validateRequest(clientProfileSchema),
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

      const clientRequest: ClientProfileRequest = req.body;

      logger.info('Creating client profile', { 
        tenantId, 
        clientType: clientRequest.clientType,
        userId 
      });

      const result = await clientRelationshipService.createClientProfile(
        tenantId, 
        clientRequest, 
        userId
      );

      res.status(201).json({
        success: true,
        data: result,
        message: 'Client profile created successfully'
      });

    } catch (error: any) {
      logger.error('Error creating client profile:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'CLIENT_CREATION_FAILED' 
      });
    }
  }
);

/**
 * @route GET /api/client-relationship/profiles/:clientId
 * @desc Get client profile details
 * @access Private
 */
router.get('/profiles/:clientId', 
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

      logger.info('Retrieving client profile', { clientId, tenantId });

      const result = await clientRelationshipService.getClientProfile(clientId, tenantId);

      res.json({
        success: true,
        data: result
      });

    } catch (error: any) {
      logger.error('Error retrieving client profile:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'CLIENT_RETRIEVAL_FAILED' 
      });
    }
  }
);

/**
 * @route PUT /api/client-relationship/profiles/:clientId
 * @desc Update client profile
 * @access Private
 */
router.put('/profiles/:clientId', 
  authMiddleware as any,
  async (req: any, res: any) => {
    try {
      const { clientId } = req.params;
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;

      if (!tenantId || !userId) {
        return res.status(401).json({ 
          error: 'Authentication required',
          code: 'UNAUTHORIZED' 
        });
      }

      const updates = req.body;

      logger.info('Updating client profile', { clientId, tenantId, userId });

      const result = await clientRelationshipService.updateClientProfile(
        clientId, 
        tenantId, 
        updates, 
        userId
      );

      res.json({
        success: true,
        data: result,
        message: 'Client profile updated successfully'
      });

    } catch (error: any) {
      logger.error('Error updating client profile:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'CLIENT_UPDATE_FAILED' 
      });
    }
  }
);

/**
 * @route GET /api/client-relationship/profiles
 * @desc List client profiles with filtering and pagination
 * @access Private
 */
router.get('/profiles', 
  authMiddleware as any,
  async (req: any, res: any) => {
    try {
      const tenantId = req.user?.tenantId;
      const { 
        status, 
        clientType, 
        riskTolerance, 
        assignedAdvisor,
        page = 1, 
        limit = 50,
        search 
      } = req.query;

      if (!tenantId) {
        return res.status(401).json({ 
          error: 'Authentication required',
          code: 'UNAUTHORIZED' 
        });
      }

      logger.info('Listing client profiles', { 
        tenantId, 
        filters: { status, clientType, riskTolerance, assignedAdvisor, search } 
      });

      // This would implement actual filtering and pagination
      res.json({
        success: true,
        data: {
          clients: [],
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total: 0,
            pages: 0
          }
        }
      });

    } catch (error: any) {
      logger.error('Error listing client profiles:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'CLIENT_LIST_FAILED' 
      });
    }
  }
);

/**
 * @route POST /api/client-relationship/meetings
 * @desc Schedule a client meeting
 * @access Private
 */
router.post('/meetings', 
  authMiddleware as any,
  validateRequest(meetingRequestSchema),
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

      const meetingRequest: MeetingRequest = {
        ...req.body,
        scheduledDate: new Date(req.body.scheduledDate),
        advisors: req.body.advisors || [{ userId, name: 'Current User', role: 'Advisor', isRequired: true }],
        clients: req.body.clients || [],
        agenda: req.body.agenda || []
      };

      logger.info('Scheduling client meeting', { 
        tenantId, 
        clientId: meetingRequest.clientId,
        meetingType: meetingRequest.meetingType,
        userId 
      });

      const result = await clientRelationshipService.scheduleMeeting(
        meetingRequest, 
        tenantId, 
        userId
      );

      res.status(201).json({
        success: true,
        data: result,
        message: 'Meeting scheduled successfully'
      });

    } catch (error: any) {
      logger.error('Error scheduling meeting:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'MEETING_SCHEDULING_FAILED' 
      });
    }
  }
);

/**
 * @route GET /api/client-relationship/meetings
 * @desc Get meetings with filtering
 * @access Private
 */
router.get('/meetings', 
  authMiddleware as any,
  async (req: any, res: any) => {
    try {
      const tenantId = req.user?.tenantId;
      const { 
        clientId, 
        meetingType, 
        status, 
        dateFrom, 
        dateTo,
        page = 1, 
        limit = 50 
      } = req.query;

      if (!tenantId) {
        return res.status(401).json({ 
          error: 'Authentication required',
          code: 'UNAUTHORIZED' 
        });
      }

      logger.info('Retrieving meetings', { 
        tenantId, 
        filters: { clientId, meetingType, status, dateFrom, dateTo } 
      });

      // This would implement actual filtering
      res.json({
        success: true,
        data: {
          meetings: [],
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total: 0,
            pages: 0
          }
        }
      });

    } catch (error: any) {
      logger.error('Error retrieving meetings:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'MEETINGS_RETRIEVAL_FAILED' 
      });
    }
  }
);

/**
 * @route POST /api/client-relationship/communications
 * @desc Record client communication
 * @access Private
 */
router.post('/communications', 
  authMiddleware as any,
  validateRequest(communicationRequestSchema),
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

      const communicationRequest: CommunicationRequest = {
        ...req.body,
        followUpRequired: req.body.followUpRequired || false,
        followUpDate: req.body.followUpDate ? new Date(req.body.followUpDate) : undefined
      };

      logger.info('Recording client communication', { 
        tenantId, 
        clientId: communicationRequest.clientId,
        communicationType: communicationRequest.communicationType,
        userId 
      });

      const result = await clientRelationshipService.recordCommunication(
        communicationRequest, 
        tenantId, 
        userId
      );

      res.status(201).json({
        success: true,
        data: result,
        message: 'Communication recorded successfully'
      });

    } catch (error: any) {
      logger.error('Error recording communication:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'COMMUNICATION_RECORDING_FAILED' 
      });
    }
  }
);

/**
 * @route GET /api/client-relationship/communications/:clientId
 * @desc Get communication history for a client
 * @access Private
 */
router.get('/communications/:clientId', 
  authMiddleware as any,
  async (req: any, res: any) => {
    try {
      const { clientId } = req.params;
      const tenantId = req.user?.tenantId;
      const { 
        communicationType, 
        category, 
        dateFrom, 
        dateTo,
        page = 1, 
        limit = 50 
      } = req.query;

      if (!tenantId) {
        return res.status(401).json({ 
          error: 'Authentication required',
          code: 'UNAUTHORIZED' 
        });
      }

      logger.info('Retrieving communication history', { 
        clientId, 
        tenantId, 
        filters: { communicationType, category, dateFrom, dateTo } 
      });

      // This would implement actual filtering
      res.json({
        success: true,
        data: {
          communications: [],
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total: 0,
            pages: 0
          }
        }
      });

    } catch (error: any) {
      logger.error('Error retrieving communication history:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'COMMUNICATION_HISTORY_FAILED' 
      });
    }
  }
);

/**
 * @route POST /api/client-relationship/suitability-assessments
 * @desc Create suitability assessment
 * @access Private
 */
router.post('/suitability-assessments', 
  authMiddleware as any,
  validateRequest(suitabilityAssessmentSchema),
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

      const assessmentRequest: SuitabilityAssessmentRequest = {
        ...req.body,
        netWorth: new (Decimal as any)(req.body.netWorth),
        annualIncome: new (Decimal as any)(req.body.annualIncome),
        investmentObjectives: req.body.investmentObjectives || [],
        liquidityNeeds: req.body.liquidityNeeds || LiquidityNeeds.MODERATE,
        investmentExperience: req.body.investmentExperience || InvestmentExperience.MODERATE
      };

      logger.info('Creating suitability assessment', { 
        tenantId, 
        clientId: assessmentRequest.clientId,
        assessmentType: assessmentRequest.assessmentType,
        userId 
      });

      const result = await clientRelationshipService.createSuitabilityAssessment(
        assessmentRequest, 
        tenantId, 
        userId
      );

      res.status(201).json({
        success: true,
        data: result,
        message: 'Suitability assessment created successfully'
      });

    } catch (error: any) {
      logger.error('Error creating suitability assessment:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'SUITABILITY_ASSESSMENT_FAILED' 
      });
    }
  }
);

/**
 * @route GET /api/client-relationship/suitability-assessments/:clientId
 * @desc Get suitability assessments for a client
 * @access Private
 */
router.get('/suitability-assessments/:clientId', 
  authMiddleware as any,
  async (req: any, res: any) => {
    try {
      const { clientId } = req.params;
      const tenantId = req.user?.tenantId;
      const { assessmentType, page = 1, limit = 50 } = req.query;

      if (!tenantId) {
        return res.status(401).json({ 
          error: 'Authentication required',
          code: 'UNAUTHORIZED' 
        });
      }

      logger.info('Retrieving suitability assessments', { 
        clientId, 
        tenantId, 
        assessmentType 
      });

      // This would implement actual filtering
      res.json({
        success: true,
        data: {
          assessments: [],
          pagination: {
            page: parseInt(page as string),
            limit: parseInt(limit as string),
            total: 0,
            pages: 0
          }
        }
      });

    } catch (error: any) {
      logger.error('Error retrieving suitability assessments:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'SUITABILITY_RETRIEVAL_FAILED' 
      });
    }
  }
);

/**
 * @route GET /api/client-relationship/onboarding/:clientId
 * @desc Get onboarding workflow status
 * @access Private
 */
router.get('/onboarding/:clientId', 
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

      logger.info('Retrieving onboarding workflow', { clientId, tenantId });

      // This would retrieve actual workflow data
      res.json({
        success: true,
        data: {
          workflowId: 'workflow-123',
          clientId,
          status: OnboardingStatus.IN_PROGRESS,
          currentStep: 3,
          totalSteps: 8,
          completionPercentage: 37.5,
          estimatedCompletionDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
          steps: []
        }
      });

    } catch (error: any) {
      logger.error('Error retrieving onboarding workflow:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'ONBOARDING_RETRIEVAL_FAILED' 
      });
    }
  }
);

/**
 * @route PUT /api/client-relationship/onboarding/:workflowId/steps/:stepNumber
 * @desc Update onboarding step status
 * @access Private
 */
router.put('/onboarding/:workflowId/steps/:stepNumber', 
  authMiddleware as any,
  async (req: any, res: any) => {
    try {
      const { workflowId, stepNumber } = req.params;
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      const { notes } = req.body;

      if (!tenantId || !userId) {
        return res.status(401).json({ 
          error: 'Authentication required',
          code: 'UNAUTHORIZED' 
        });
      }

      logger.info('Updating onboarding step', { 
        workflowId, 
        stepNumber, 
        tenantId, 
        userId 
      });

      const result = await clientRelationshipService.updateOnboardingStep(
        workflowId, 
        parseInt(stepNumber), 
        tenantId, 
        userId, 
        notes
      );

      res.json({
        success: true,
        data: result,
        message: 'Onboarding step updated successfully'
      });

    } catch (error: any) {
      logger.error('Error updating onboarding step:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'ONBOARDING_UPDATE_FAILED' 
      });
    }
  }
);

/**
 * @route GET /api/client-relationship/analytics/:clientId
 * @desc Get client analytics
 * @access Private
 */
router.get('/analytics/:clientId', 
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

      logger.info('Generating client analytics', { clientId, tenantId });

      const result = await clientRelationshipService.getClientAnalytics(clientId, tenantId);

      res.json({
        success: true,
        data: result
      });

    } catch (error: any) {
      logger.error('Error generating client analytics:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'ANALYTICS_GENERATION_FAILED' 
      });
    }
  }
);

/**
 * @route GET /api/client-relationship/segmentation
 * @desc Get client segmentation analysis
 * @access Private
 */
router.get('/segmentation', 
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

      logger.info('Generating client segmentation', { tenantId });

      const result = await clientRelationshipService.getClientSegmentation(tenantId);

      res.json({
        success: true,
        data: result
      });

    } catch (error: any) {
      logger.error('Error generating client segmentation:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'SEGMENTATION_GENERATION_FAILED' 
      });
    }
  }
);

export default router;

