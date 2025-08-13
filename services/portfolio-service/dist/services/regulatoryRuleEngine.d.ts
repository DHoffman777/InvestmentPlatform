import { PrismaClient } from '@prisma/client';
import { getKafkaService } from '../utils/kafka-mock';
import { RegulatoryRule, RuleEvaluationContext, RuleEvaluationResult } from '../models/compliance/ComplianceMonitoring';
export declare class RegulatoryRuleEngine {
    private prisma;
    private kafkaService;
    constructor(prisma: PrismaClient, kafkaService: ReturnType<typeof getKafkaService>);
    evaluateRules(portfolioId: string, tenantId: string, context: RuleEvaluationContext, ruleIds?: string[]): Promise<RuleEvaluationResult[]>;
    private evaluateRule;
    private parseRuleExpression;
    private parseConditionalExpression;
    private parseLogicalExpression;
    private parseSimpleExpression;
    private parseCondition;
    private parseValue;
    private prepareEvaluationContext;
    private evaluateRuleLogic;
    private evaluateSimpleCondition;
    private evaluateLogicalExpression;
    private evaluateConditionalExpression;
    private resolveFieldValue;
    private evaluateCondition;
    private getApplicableRules;
    private getPortfolioData;
    private getPositionsData;
    private calculateAggregatedMetrics;
    private calculateSectorConcentration;
    private determineSeverity;
    private publishRuleEvaluationEvent;
    createRule(ruleData: Omit<RegulatoryRule, 'id' | 'createdAt' | 'updatedAt'>, tenantId: string): Promise<RegulatoryRule>;
    updateRule(ruleId: string, updates: Partial<RegulatoryRule>, tenantId: string): Promise<RegulatoryRule>;
    deactivateRule(ruleId: string, tenantId: string): Promise<void>;
    getRule(ruleId: string, tenantId: string): Promise<RegulatoryRule | null>;
    getRules(tenantId: string, filters?: {
        jurisdiction?: string;
        isActive?: boolean;
        regulationCode?: string;
    }): Promise<RegulatoryRule[]>;
}
