import { Router, Request, Response } from 'express';
import { getKafkaService } from '../utils/kafka-mock';
import { logger } from '../utils/logger';
import {
  RiskProfilingService,
  RiskProfileQuestionnaire,
  QuestionResponse
} from '../services/clientRelationship/RiskProfilingService';
import {
  SuitabilityAssessmentRequest,
  RiskTolerance,
  InvestmentExperience,
  LiquidityNeeds
} from '../models/clientRelationship/ClientRelationship';
import { authMiddleware } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';
import { Decimal } from '@prisma/client/runtime/library';

const router = Router();
const kafkaService = getKafkaService();
const riskProfilingService = new RiskProfilingService();

// Validation schemas
const riskQuestionnaireSchema = {
  clientId: {
    required: true,
    type: 'string',
    message: 'Client ID is required'
  },
  questionnaireVersion: {
    required: true,
    type: 'string',
    message: 'Questionnaire version is required'
  },
  responses: {
    required: true,
    type: 'array',
    minLength: 1,
    message: 'At least one response is required'
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
  investmentObjectives: {
    required: true,
    type: 'array',
    minLength: 1,
    message: 'At least one investment objective is required'
  },
  timeHorizon: {
    required: true,
    type: 'number',
    min: 1,
    max: 50,
    message: 'Time horizon must be between 1 and 50 years'
  },
  liquidityNeeds: {
    required: true,
    enum: Object.values(LiquidityNeeds),
    message: 'Valid liquidity needs is required'
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
  },
  investmentExperience: {
    required: true,
    enum: Object.values(InvestmentExperience),
    message: 'Valid investment experience is required'
  }
};

/**
 * @route POST /api/risk-profiling/questionnaire
 * @desc Complete risk profiling questionnaire
 * @access Private
 */
router.post('/questionnaire',
  authMiddleware as any,
  validateRequest(riskQuestionnaireSchema) as any,
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

      const questionnaire = {
        clientId: req.body.clientId,
        questionnaireVersion: req.body.questionnaireVersion,
        completedBy: userId,
        responses: req.body.responses.map((response: any) => ({
          questionId: response.questionId,
          questionText: response.questionText,
          answerValue: response.answerValue,
          answerText: response.answerText,
          weight: response.weight || 1,
          category: response.category
        })) as QuestionResponse[]
      };

      logger.info('Processing risk profiling questionnaire', {
        tenantId,
        clientId: questionnaire.clientId,
        responseCount: questionnaire.responses.length,
        userId
      });

      const result = await riskProfilingService.completeRiskAssessment(
        questionnaire.clientId,
        questionnaire,
        tenantId,
        userId
      );

      res.status(201).json({
        success: true,
        data: result,
        message: 'Risk assessment completed successfully'
      });

    } catch (error: any) {
      logger.error('Error processing risk questionnaire:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'RISK_ASSESSMENT_FAILED'
      });
    }
  }
);

/**
 * @route POST /api/risk-profiling/suitability-assessment
 * @desc Perform comprehensive suitability assessment
 * @access Private
 */
router.post('/suitability-assessment',
  authMiddleware as any,
  validateRequest(suitabilityAssessmentSchema) as any,
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
        annualIncome: new (Decimal as any)(req.body.annualIncome)
      };

      logger.info('Performing suitability assessment', {
        tenantId,
        clientId: assessmentRequest.clientId,
        assessmentType: assessmentRequest.assessmentType,
        userId
      });

      const result = await riskProfilingService.performSuitabilityAssessment(
        assessmentRequest,
        tenantId,
        userId
      );

      res.status(201).json({
        success: true,
        data: result,
        message: 'Suitability assessment completed successfully'
      });

    } catch (error: any) {
      logger.error('Error performing suitability assessment:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'SUITABILITY_ASSESSMENT_FAILED'
      });
    }
  }
);

/**
 * @route GET /api/risk-profiling/clients/:clientId/risk-profile-history
 * @desc Get client's risk profile history
 * @access Private
 */
router.get('/clients/:clientId/risk-profile-history',
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

      logger.info('Retrieving risk profile history', { clientId, tenantId });

      const result = await riskProfilingService.getRiskProfileHistory(clientId, tenantId);

      res.json({
        success: true,
        data: result
      });

    } catch (error: any) {
      logger.error('Error retrieving risk profile history:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'RISK_PROFILE_HISTORY_FAILED'
      });
    }
  }
);

/**
 * @route GET /api/risk-profiling/clients/:clientId/suitability-alerts
 * @desc Get active suitability alerts for client
 * @access Private
 */
router.get('/clients/:clientId/suitability-alerts',
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

      logger.info('Retrieving suitability alerts', { clientId, tenantId });

      const result = await riskProfilingService.getActiveSuitabilityAlerts(clientId, tenantId);

      res.json({
        success: true,
        data: result
      });

    } catch (error: any) {
      logger.error('Error retrieving suitability alerts:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'SUITABILITY_ALERTS_FAILED'
      });
    }
  }
);

/**
 * @route POST /api/risk-profiling/clients/:clientId/monitor-suitability
 * @desc Run suitability monitoring for client
 * @access Private
 */
router.post('/clients/:clientId/monitor-suitability',
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

      logger.info('Running suitability monitoring', { clientId, tenantId });

      const result = await riskProfilingService.monitorSuitability(clientId, tenantId);

      res.json({
        success: true,
        data: result,
        message: `Generated ${result.length} suitability alerts`
      });

    } catch (error: any) {
      logger.error('Error monitoring suitability:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'SUITABILITY_MONITORING_FAILED'
      });
    }
  }
);

/**
 * @route PUT /api/risk-profiling/alerts/:alertId/acknowledge
 * @desc Acknowledge a suitability alert
 * @access Private
 */
router.put('/alerts/:alertId/acknowledge',
  authMiddleware as any,
  async (req: any, res: any) => {
    try {
      const { alertId } = req.params;
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      const { notes } = req.body;

      if (!tenantId || !userId) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        });
      }

      logger.info('Acknowledging suitability alert', { alertId, tenantId, userId });

      // Update alert in database  
      const { getPrismaClient } = await import('../utils/prisma');
      const prisma = getPrismaClient();
      const updatedAlert = await prisma.riskMonitoringAlert.update({
        where: { id: alertId },
        data: {
          isAcknowledged: true,
          acknowledgedBy: userId,
          acknowledgedDate: new Date(),
          notes: notes || null
        }
      });

      // Publish acknowledgment event
      await kafkaService.publish('suitability_alert.acknowledged', {
        alertId,
        acknowledgedBy: userId,
        tenantId,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        data: updatedAlert,
        message: 'Alert acknowledged successfully'
      });

    } catch (error: any) {
      logger.error('Error acknowledging alert:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'ALERT_ACKNOWLEDGMENT_FAILED'
      });
    }
  }
);

/**
 * @route PUT /api/risk-profiling/alerts/:alertId/resolve
 * @desc Resolve a suitability alert
 * @access Private
 */
router.put('/alerts/:alertId/resolve',
  authMiddleware as any,
  async (req: any, res: any) => {
    try {
      const { alertId } = req.params;
      const tenantId = req.user?.tenantId;
      const userId = req.user?.id;
      const { resolution } = req.body;

      if (!tenantId || !userId) {
        return res.status(401).json({
          error: 'Authentication required',
          code: 'UNAUTHORIZED'
        });
      }

      if (!resolution) {
        return res.status(400).json({
          error: 'Resolution description is required',
          code: 'MISSING_RESOLUTION'
        });
      }

      logger.info('Resolving suitability alert', { alertId, tenantId, userId });

      // Update alert in database  
      const { getPrismaClient } = await import('../utils/prisma');
      const prisma = getPrismaClient();
      const updatedAlert = await prisma.riskMonitoringAlert.update({
        where: { id: alertId },
        data: {
          isResolved: true,
          resolvedDate: new Date(),
          resolution,
          isAcknowledged: true,
          acknowledgedBy: userId,
          acknowledgedDate: new Date()
        }
      });

      // Publish resolution event
      await kafkaService.publish('suitability_alert.resolved', {
        alertId,
        resolvedBy: userId,
        resolution,
        tenantId,
        timestamp: new Date().toISOString()
      });

      res.json({
        success: true,
        data: updatedAlert,
        message: 'Alert resolved successfully'
      });

    } catch (error: any) {
      logger.error('Error resolving alert:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'ALERT_RESOLUTION_FAILED'
      });
    }
  }
);

/**
 * @route GET /api/risk-profiling/risk-tolerance-levels
 * @desc Get available risk tolerance levels with descriptions
 * @access Private
 */
router.get('/risk-tolerance-levels',
  authMiddleware as any,
  async (req: any, res: any) => {
    try {
      const riskToleranceLevels = Object.values(RiskTolerance).map(level => ({
        value: level,
        label: level.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase()),
        description: getRiskToleranceDescription(level),
        numericValue: getRiskToleranceNumeric(level),
        assetAllocationGuidance: getAssetAllocationGuidance(level)
      }));

      res.json({
        success: true,
        data: riskToleranceLevels
      });

    } catch (error: any) {
      logger.error('Error retrieving risk tolerance levels:', error);
      res.status(500).json({
        error: 'Internal server error',
        code: 'RISK_TOLERANCE_LEVELS_FAILED'
      });
    }
  }
);

/**
 * @route GET /api/risk-profiling/questionnaire-template/:version?
 * @desc Get risk profiling questionnaire template
 * @access Private
 */
router.get('/questionnaire-template/:version?',
  authMiddleware as any,
  async (req: any, res: any) => {
    try {
      const { version = 'latest' } = req.params;

      logger.info('Retrieving questionnaire template', { version });

      // Return standard questionnaire template
      const template = getQuestionnaireTemplate(version);

      res.json({
        success: true,
        data: template
      });

    } catch (error: any) {
      logger.error('Error retrieving questionnaire template:', error);
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Internal server error',
        code: 'QUESTIONNAIRE_TEMPLATE_FAILED'
      });
    }
  }
);

// Helper functions
function getRiskToleranceDescription(level: RiskTolerance): string {
  const descriptions = {
    [RiskTolerance.CONSERVATIVE]: 'Low risk, focuses on capital preservation with minimal volatility. Suitable for investors prioritizing security over growth.',
    [RiskTolerance.MODERATE_CONSERVATIVE]: 'Below-average risk with some growth potential. Balanced approach leaning toward stability.',
    [RiskTolerance.MODERATE]: 'Balanced approach to risk and return. Accepts moderate volatility for potential growth.',
    [RiskTolerance.MODERATE_AGGRESSIVE]: 'Above-average risk for higher potential returns. Comfortable with significant volatility.',
    [RiskTolerance.AGGRESSIVE]: 'High risk tolerance seeking maximum growth potential. Comfortable with high volatility and potential losses.'
  };
  return descriptions[level] || 'Risk tolerance level';
}

function getRiskToleranceNumeric(level: RiskTolerance): number {
  const riskMap = {
    [RiskTolerance.CONSERVATIVE]: 1,
    [RiskTolerance.MODERATE_CONSERVATIVE]: 2,
    [RiskTolerance.MODERATE]: 3,
    [RiskTolerance.MODERATE_AGGRESSIVE]: 4,
    [RiskTolerance.AGGRESSIVE]: 5
  };
  return riskMap[level] || 3;
}

function getAssetAllocationGuidance(level: RiskTolerance): string {
  const guidance = {
    [RiskTolerance.CONSERVATIVE]: 'Bonds: 60-70%, Stocks: 20-30%, Cash: 10-15%',
    [RiskTolerance.MODERATE_CONSERVATIVE]: 'Bonds: 40-60%, Stocks: 30-50%, Cash: 5-15%',
    [RiskTolerance.MODERATE]: 'Bonds: 30-50%, Stocks: 40-60%, Alternatives: 0-10%, Cash: 2-10%',
    [RiskTolerance.MODERATE_AGGRESSIVE]: 'Stocks: 55-75%, Bonds: 15-35%, Alternatives: 2-12%, Cash: 1-8%',
    [RiskTolerance.AGGRESSIVE]: 'Stocks: 65-85%, Alternatives: 5-25%, Bonds: 3-15%, Cash: 0-7%'
  };
  return guidance[level] || guidance[RiskTolerance.MODERATE];
}

function getQuestionnaireTemplate(version: string) {
  // Standard risk profiling questionnaire template
  return {
    version: version === 'latest' ? '2024.1' : version,
    sections: [
      {
        sectionId: 'risk_capacity',
        title: 'Financial Capacity',
        description: 'Questions about your financial situation and ability to take risk',
        questions: [
          {
            questionId: 'rc_01',
            questionText: 'What is your approximate net worth (excluding primary residence)?',
            type: 'single_choice',
            weight: 1.5,
            category: 'RISK_CAPACITY',
            options: [
              { value: 1, text: 'Less than $100,000' },
              { value: 2, text: '$100,000 - $250,000' },
              { value: 3, text: '$250,000 - $500,000' },
              { value: 4, text: '$500,000 - $1,000,000' },
              { value: 5, text: 'More than $1,000,000' }
            ]
          },
          {
            questionId: 'rc_02',
            questionText: 'What percentage of your total investable assets does this portfolio represent?',
            type: 'single_choice',
            weight: 1.2,
            category: 'RISK_CAPACITY',
            options: [
              { value: 1, text: 'More than 75%' },
              { value: 2, text: '50% - 75%' },
              { value: 3, text: '25% - 50%' },
              { value: 4, text: '10% - 25%' },
              { value: 5, text: 'Less than 10%' }
            ]
          }
        ]
      },
      {
        sectionId: 'risk_tolerance',
        title: 'Risk Tolerance',
        description: 'Questions about your comfort level with investment risk',
        questions: [
          {
            questionId: 'rt_01',
            questionText: 'If your portfolio lost 20% of its value in one year, what would you do?',
            type: 'single_choice',
            weight: 2.0,
            category: 'RISK_TOLERANCE',
            options: [
              { value: 1, text: 'Sell all investments immediately' },
              { value: 2, text: 'Sell some investments to reduce risk' },
              { value: 3, text: 'Hold current investments' },
              { value: 4, text: 'Buy more investments at lower prices' },
              { value: 5, text: 'Invest additional money to take advantage of the decline' }
            ]
          },
          {
            questionId: 'rt_02',
            questionText: 'How would you describe your investment philosophy?',
            type: 'single_choice',
            weight: 1.8,
            category: 'RISK_TOLERANCE',
            options: [
              { value: 1, text: 'Preserve capital at all costs' },
              { value: 2, text: 'Slow and steady wins the race' },
              { value: 3, text: 'Balanced approach to risk and return' },
              { value: 4, text: 'Take calculated risks for better returns' },
              { value: 5, text: 'Go big or go home' }
            ]
          }
        ]
      },
      {
        sectionId: 'investment_knowledge',
        title: 'Investment Knowledge',
        description: 'Questions about your investment experience and knowledge',
        questions: [
          {
            questionId: 'ik_01',
            questionText: 'How would you rate your investment knowledge?',
            type: 'single_choice',
            weight: 1.5,
            category: 'INVESTMENT_KNOWLEDGE',
            options: [
              { value: 1, text: 'Novice - Very limited knowledge' },
              { value: 2, text: 'Limited - Basic understanding' },
              { value: 3, text: 'Moderate - Good understanding' },
              { value: 4, text: 'Extensive - Very knowledgeable' },
              { value: 5, text: 'Professional - Expert level' }
            ]
          }
        ]
      },
      {
        sectionId: 'time_horizon',
        title: 'Time Horizon',
        description: 'Questions about your investment timeline',
        questions: [
          {
            questionId: 'th_01',
            questionText: 'When do you expect to begin withdrawing from this portfolio?',
            type: 'single_choice',
            weight: 1.3,
            category: 'TIME_HORIZON',
            options: [
              { value: 1, text: 'Within 2 years' },
              { value: 2, text: '2-5 years' },
              { value: 3, text: '5-10 years' },
              { value: 4, text: '10-20 years' },
              { value: 5, text: 'More than 20 years' }
            ]
          }
        ]
      },
      {
        sectionId: 'liquidity',
        title: 'Liquidity Needs',
        description: 'Questions about your cash flow and liquidity requirements',
        questions: [
          {
            questionId: 'lq_01',
            questionText: 'What are your liquidity needs for this portfolio?',
            type: 'single_choice',
            weight: 1.0,
            category: 'LIQUIDITY',
            options: [
              { value: 1, text: 'Need immediate access to funds' },
              { value: 2, text: 'May need access within 6 months' },
              { value: 3, text: 'Moderate liquidity needs' },
              { value: 4, text: 'Limited liquidity needs' },
              { value: 5, text: 'No liquidity needs - long-term investment' }
            ]
          }
        ]
      }
    ]
  };
}

export default router;

