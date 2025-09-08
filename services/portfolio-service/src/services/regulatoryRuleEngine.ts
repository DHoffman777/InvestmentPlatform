// Regulatory Rule Engine
// Phase 3.6 - Dynamic rule evaluation engine for regulatory compliance

import { PrismaClient } from '@prisma/client';
import { getKafkaService } from '../utils/kafka-mock';
import { logger } from '../utils/logger';
import {
  RegulatoryRule,
  RuleEvaluationContext,
  RuleEvaluationResult,
  RuleExpression,
  RuleCondition,
  RuleOperator,
  ComplianceStatus,
  BreachSeverity
} from '../models/compliance/ComplianceMonitoring';

export class RegulatoryRuleEngine {
  constructor(
    private prisma: PrismaClient,
    private kafkaService: ReturnType<typeof getKafkaService>
  ) {}

  // Evaluate all applicable regulatory rules for a portfolio
  async evaluateRules(
    portfolioId: string,
    tenantId: string,
    context: RuleEvaluationContext,
    ruleIds?: string[]
  ): Promise<RuleEvaluationResult[]> {
    try {
      const startTime = Date.now();
      
      logger.info('Starting regulatory rule evaluation', {
        portfolioId,
        tenantId,
        contextType: context.type,
        ruleIds: ruleIds?.length || 'all'
      });

      // Get applicable rules
      const rules = await this.getApplicableRules(tenantId, ruleIds);
      
      const results: RuleEvaluationResult[] = [];
      
      for (const rule of rules) {
        try {
          const result = await this.evaluateRule(rule, portfolioId, context);
          results.push(result);
          
          // Publish rule evaluation event
          await this.publishRuleEvaluationEvent(rule, result, portfolioId);
          
        } catch (error: any) {
          logger.error('Error evaluating rule:', {
            ruleId: rule.id,
            ruleCode: rule.regulationCode,
            error: error instanceof Error ? error.message : 'Unknown error'
          });
          
          // Create error result
          results.push({
            ruleId: rule.id,
            ruleCode: rule.regulationCode,
            ruleName: rule.regulationName,
            status: ComplianceStatus.BREACH,
            severity: BreachSeverity.HIGH,
            message: `Rule evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
            actualValue: null,
            expectedValue: null,
            context,
            evaluatedAt: new Date(),
            evaluationTimeMs: 0
          });
        }
      }

      const totalTime = Date.now() - startTime;
      
      logger.info('Regulatory rule evaluation completed', {
        portfolioId,
        rulesEvaluated: rules.length,
        violations: results.filter(r => r.status === ComplianceStatus.BREACH).length,
        warnings: results.filter(r => r.status === ComplianceStatus.WARNING).length,
        totalTimeMs: totalTime
      });

      return results;

    } catch (error: any) {
      logger.error('Error in regulatory rule evaluation:', error);
      throw error;
    }
  }

  // Evaluate a single regulatory rule
  private async evaluateRule(
    rule: RegulatoryRule,
    portfolioId: string,
    context: RuleEvaluationContext
  ): Promise<RuleEvaluationResult> {
    const startTime = Date.now();
    
    try {
      // Parse rule expression
      const ruleExpression = this.parseRuleExpression(rule.ruleExpression);
      
      // Prepare evaluation context with portfolio data
      const evaluationContext = await this.prepareEvaluationContext(
        portfolioId,
        context,
        rule.parameters
      );
      
      // Evaluate rule logic
      const evaluationResult = await this.evaluateRuleLogic(
        ruleExpression,
        evaluationContext,
        rule.ruleLogic
      );
      
      const evaluationTime = Date.now() - startTime;
      
      const result: RuleEvaluationResult = {
        ruleId: rule.id,
        ruleCode: rule.regulationCode,
        ruleName: rule.regulationName,
        status: evaluationResult.isCompliant ? ComplianceStatus.COMPLIANT : 
               evaluationResult.isWarning ? ComplianceStatus.WARNING : ComplianceStatus.BREACH,
        severity: this.determineSeverity(evaluationResult, rule),
        message: evaluationResult.message,
        actualValue: evaluationResult.actualValue,
        expectedValue: evaluationResult.expectedValue,
        context,
        evaluatedAt: new Date(),
        evaluationTimeMs: evaluationTime,
        details: evaluationResult.details
      };
      
      logger.debug('Rule evaluation completed', {
        ruleCode: rule.regulationCode,
        status: result.status,
        evaluationTimeMs: evaluationTime
      });
      
      return result;
      
    } catch (error: any) {
      logger.error('Error evaluating rule:', {
        ruleId: rule.id,
        ruleCode: rule.regulationCode,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      throw error;
    }
  }

  // Parse rule expression into structured format
  private parseRuleExpression(expression: string): RuleExpression {
    try {
      // Simple expression parser - in production, would use a more robust parser
      const trimmed = expression.trim();
      
      // Handle different expression types
      if (trimmed.startsWith('IF ')) {
        return this.parseConditionalExpression(trimmed);
      } else if (trimmed.includes(' AND ') || trimmed.includes(' OR ')) {
        return this.parseLogicalExpression(trimmed);
      } else {
        return this.parseSimpleExpression(trimmed);
      }
      
    } catch (error: any) {
      logger.error('Error parsing rule expression:', { expression, error });
      throw new Error(`Invalid rule expression: ${expression}`);
    }
  }

  // Parse conditional expression (IF-THEN-ELSE)
  private parseConditionalExpression(expression: string): RuleExpression {
    const ifMatch = expression.match(/^IF\s+(.+?)\s+THEN\s+(.+?)(?:\s+ELSE\s+(.+?))?$/i);
    
    if (!ifMatch) {
      throw new Error(`Invalid conditional expression: ${expression}`);
    }
    
    return {
      type: 'CONDITIONAL',
      condition: this.parseCondition(ifMatch[1]),
      thenExpression: this.parseRuleExpression(ifMatch[2]),
      elseExpression: ifMatch[3] ? this.parseRuleExpression(ifMatch[3]) : undefined
    };
  }

  // Parse logical expression (AND/OR)
  private parseLogicalExpression(expression: string): RuleExpression {
    if (expression.includes(' AND ')) {
      const parts = expression.split(' AND ').map(p => p.trim());
      return {
        type: 'LOGICAL',
        operator: 'AND',
        operands: parts.map(p => this.parseRuleExpression(p))
      };
    } else if (expression.includes(' OR ')) {
      const parts = expression.split(' OR ').map(p => p.trim());
      return {
        type: 'LOGICAL',
        operator: 'OR',
        operands: parts.map(p => this.parseRuleExpression(p))
      };
    }
    
    throw new Error(`Invalid logical expression: ${expression}`);
  }

  // Parse simple expression
  private parseSimpleExpression(expression: string): RuleExpression {
    const condition = this.parseCondition(expression);
    return {
      type: 'SIMPLE',
      condition
    };
  }

  // Parse condition
  private parseCondition(conditionStr: string): RuleCondition {
    const operators = ['<=', '>=', '!=', '=', '<', '>', 'IN', 'NOT IN', 'CONTAINS', 'MATCHES'];
    
    for (const op of operators) {
      if (conditionStr.includes(` ${op} `)) {
        const [left, right] = conditionStr.split(` ${op} `).map(s => s.trim());
        return {
          field: left,
          operator: op as RuleOperator,
          value: this.parseValue(right)
        };
      }
    }
    
    throw new Error(`Invalid condition: ${conditionStr}`);
  }

  // Parse value (handle different types)
  private parseValue(valueStr: string): any {
    const trimmed = valueStr.trim();
    
    // String literal
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
      return trimmed.slice(1, -1);
    }
    
    // Array literal
    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
      const items = trimmed.slice(1, -1).split(',').map(s => s.trim());
      return items.map(item => this.parseValue(item));
    }
    
    // Number
    if (/^\d+(\.\d+)?$/.test(trimmed)) {
      return parseFloat(trimmed);
    }
    
    // Boolean
    if (trimmed === 'true' || trimmed === 'false') {
      return trimmed === 'true';
    }
    
    // Field reference
    return trimmed;
  }

  // Prepare evaluation context with portfolio data
  private async prepareEvaluationContext(
    portfolioId: string,
    context: RuleEvaluationContext,
    parameters: Record<string, any>
  ): Promise<Record<string, any>> {
    try {
      // Get portfolio data
      const portfolioData = await this.getPortfolioData(portfolioId);
      
      // Get positions data
      const positionsData = await this.getPositionsData(portfolioId);
      
      // Calculate aggregated metrics
      const aggregatedMetrics = this.calculateAggregatedMetrics(portfolioData, positionsData);
      
      return {
        ...context.data,
        portfolio: portfolioData,
        positions: positionsData,
        metrics: aggregatedMetrics,
        parameters
      };
      
    } catch (error: any) {
      logger.error('Error preparing evaluation context:', error);
      throw error;
    }
  }

  // Evaluate rule logic
  private async evaluateRuleLogic(
    expression: RuleExpression,
    context: Record<string, any>,
    ruleLogic: Record<string, any>
  ): Promise<{
    isCompliant: boolean;
    isWarning: boolean;
    message: string;
    actualValue: any;
    expectedValue: any;
    details?: Record<string, any>;
  }> {
    try {
      switch (expression.type) {
        case 'SIMPLE':
          return await this.evaluateSimpleCondition(expression.condition!, context);
          
        case 'LOGICAL':
          return await this.evaluateLogicalExpression(expression, context);
          
        case 'CONDITIONAL':
          return await this.evaluateConditionalExpression(expression, context);
          
        default:
          throw new Error(`Unsupported expression type: ${expression.type}`);
      }
      
    } catch (error: any) {
      logger.error('Error evaluating rule logic:', error);
      throw error;
    }
  }

  // Evaluate simple condition
  private async evaluateSimpleCondition(
    condition: RuleCondition,
    context: Record<string, any>
  ): Promise<{
    isCompliant: boolean;
    isWarning: boolean;
    message: string;
    actualValue: any;
    expectedValue: any;
  }> {
    const actualValue = this.resolveFieldValue(condition.field, context);
    const expectedValue = this.resolveFieldValue(condition.value, context);
    
    const isCompliant = this.evaluateCondition(condition.operator, actualValue, expectedValue);
    
    return {
      isCompliant,
      isWarning: false, // Simple conditions don't have warnings
      message: isCompliant 
        ? `Condition satisfied: ${condition.field} ${condition.operator} ${expectedValue}`
        : `Condition violated: ${condition.field} ${condition.operator} ${expectedValue} (actual: ${actualValue})`,
      actualValue,
      expectedValue
    };
  }

  // Evaluate logical expression
  private async evaluateLogicalExpression(
    expression: RuleExpression,
    context: Record<string, any>
  ): Promise<{
    isCompliant: boolean;
    isWarning: boolean;
    message: string;
    actualValue: any;
    expectedValue: any;
  }> {
    const results = await Promise.all(
      expression.operands!.map(operand => this.evaluateRuleLogic(operand, context, {}))
    );
    
    let isCompliant: boolean;
    if (expression.operator === 'AND') {
      isCompliant = results.every(r => r.isCompliant);
    } else { // OR
      isCompliant = results.some(r => r.isCompliant);
    }
    
    const messages = results.map(r => r.message);
    
    return {
      isCompliant,
      isWarning: false,
      message: `${expression.operator} condition: ${messages.join(` ${expression.operator} `)}`,
      actualValue: results.map(r => r.actualValue),
      expectedValue: results.map(r => r.expectedValue)
    };
  }

  // Evaluate conditional expression
  private async evaluateConditionalExpression(
    expression: RuleExpression,
    context: Record<string, any>
  ): Promise<{
    isCompliant: boolean;
    isWarning: boolean;
    message: string;
    actualValue: any;
    expectedValue: any;
  }> {
    const conditionResult = await this.evaluateSimpleCondition(expression.condition!, context);
    
    if (conditionResult.isCompliant) {
      return await this.evaluateRuleLogic(expression.thenExpression!, context, {});
    } else if (expression.elseExpression) {
      return await this.evaluateRuleLogic(expression.elseExpression, context, {});
    } else {
      return {
        isCompliant: true, // If condition is false and no else clause, rule is satisfied
        isWarning: false,
        message: 'Conditional rule: condition not met, no else clause',
        actualValue: conditionResult.actualValue,
        expectedValue: conditionResult.expectedValue
      };
    }
  }

  // Resolve field value from context
  private resolveFieldValue(field: string | any, context: Record<string, any>): any {
    if (typeof field !== 'string') {
      return field;
    }
    
    // Handle nested field access (e.g., "portfolio.totalValue")
    const fieldParts = field.split('.');
    let value = context;
    
    for (const part of fieldParts) {
      if (value && typeof value === 'object' && part in value) {
        value = value[part];
      } else {
        logger.warn('Field not found in context:', { field, availableFields: Object.keys(context) });
        return null;
      }
    }
    
    return value;
  }

  // Evaluate condition based on operator
  private evaluateCondition(operator: RuleOperator, actual: any, expected: any): boolean {
    switch (operator) {
      case '=':
        return actual === expected;
      case '!=':
        return actual !== expected;
      case '<':
        return actual < expected;
      case '<=':
        return actual <= expected;
      case '>':
        return actual > expected;
      case '>=':
        return actual >= expected;
      case 'IN':
        return Array.isArray(expected) && expected.includes(actual);
      case 'NOT IN':
        return Array.isArray(expected) && !expected.includes(actual);
      case 'CONTAINS':
        return Array.isArray(actual) && actual.includes(expected);
      case 'MATCHES':
        return typeof actual === 'string' && new RegExp(expected).test(actual);
      default:
        throw new Error(`Unsupported operator: ${operator}`);
    }
  }

  // Get applicable regulatory rules
  private async getApplicableRules(tenantId: string, ruleIds?: string[]): Promise<RegulatoryRule[]> {
    const whereClause: any = {
      tenantId,
      isActive: true,
      effectiveDate: {
        lte: new Date()
      }
    };
    
    if (ruleIds && ruleIds.length > 0) {
      whereClause.id = { in: ruleIds };
    }
    
    const rules = await this.prisma.regulatoryRule.findMany({
      where: whereClause,
      orderBy: [
        // { version: 'desc' } // Field doesn't exist in RegulatoryRuleOrderByWithRelationInput
        { createdAt: 'desc' }
      ]
    });
    
    return rules as unknown as RegulatoryRule[];
  }

  // Get portfolio data for evaluation
  private async getPortfolioData(portfolioId: string): Promise<Record<string, any>> {
    // This would fetch actual portfolio data from the database
    // Placeholder implementation
    return {
      id: portfolioId,
      totalValue: 1000000,
      cashBalance: 50000,
      totalEquity: 700000,
      totalFixedIncome: 200000,
      totalAlternatives: 50000
    };
  }

  // Get positions data for evaluation
  private async getPositionsData(portfolioId: string): Promise<Record<string, any>[]> {
    // This would fetch actual positions data from the database
    // Placeholder implementation
    return [
      {
        securityId: 'INST_001',
        symbol: 'AAPL',
        quantity: 1000,
        marketValue: 150000,
        assetClass: 'EQUITY',
        sector: 'TECHNOLOGY'
      }
    ];
  }

  // Calculate aggregated metrics
  private calculateAggregatedMetrics(
    portfolioData: Record<string, any>,
    positionsData: Record<string, any>[]
  ): Record<string, any> {
    const totalValue = portfolioData.totalValue?.toNumber() || 0;
    
    return {
      equityAllocation: ((portfolioData.totalEquity || 0) / totalValue) * 100,
      fixedIncomeAllocation: ((portfolioData.totalFixedIncome || 0) / totalValue) * 100,
      cashAllocation: ((portfolioData.cashBalance || 0) / totalValue) * 100,
      alternativeAllocation: ((portfolioData.totalAlternatives || 0) / totalValue) * 100,
      positionCount: positionsData.length,
      largestPosition: Math.max(...positionsData.map(p => (p.marketValue?.toNumber() || 0) / totalValue * 100)),
      sectorConcentration: this.calculateSectorConcentration(positionsData, totalValue)
    };
  }

  // Calculate sector concentration
  private calculateSectorConcentration(
    positions: Record<string, any>[],
    totalValue: number
  ): Record<string, number> {
    const sectorTotals: Record<string, number> = {};
    
    for (const position of positions) {
      const sector = position.sector || 'UNKNOWN';
      const value = position.marketValue?.toNumber() || 0;
      sectorTotals[sector] = (sectorTotals[sector] || 0) + value;
    }
    
    const sectorPercentages: Record<string, number> = {};
    for (const [sector, value] of Object.entries(sectorTotals)) {
      sectorPercentages[sector] = (value / totalValue) * 100;
    }
    
    return sectorPercentages;
  }

  // Determine breach severity
  private determineSeverity(
    evaluationResult: { isCompliant: boolean; isWarning: boolean },
    rule: RegulatoryRule
  ): BreachSeverity {
    if (evaluationResult.isCompliant) {
      return BreachSeverity.LOW; // Not actually a breach, but need a value
    }
    
    if (evaluationResult.isWarning) {
      return BreachSeverity.MEDIUM;
    }
    
    // Determine severity based on rule type and jurisdiction
    if (rule.jurisdiction === 'SEC' || rule.jurisdiction === 'FINRA') {
      return BreachSeverity.HIGH;
    }
    
    return BreachSeverity.MEDIUM;
  }

  // Publish rule evaluation event
  private async publishRuleEvaluationEvent(
    rule: RegulatoryRule,
    result: RuleEvaluationResult,
    portfolioId: string
  ): Promise<any> {
    await this.kafkaService.publishEvent('regulatory.rule.evaluated', {
      ruleId: rule.id,
      ruleCode: rule.regulationCode,
      portfolioId,
      status: result.status,
      severity: result.severity,
      evaluatedAt: result.evaluatedAt.toISOString(),
      evaluationTimeMs: result.evaluationTimeMs
    });
  }

  // Create new regulatory rule
  async createRule(
    ruleData: Omit<RegulatoryRule, 'id' | 'createdAt' | 'updatedAt'>,
    tenantId: string
  ): Promise<RegulatoryRule> {
    try {
      // Validate rule expression
      this.parseRuleExpression(ruleData.ruleExpression);
      
      const rule = await this.prisma.regulatoryRule.create({
        data: {
          ruleName: ruleData.regulationName,
          isActive: ruleData.isActive,
          jurisdiction: ruleData.jurisdiction,
          ruleType: 'REGULATORY_LIMIT', // Default value
          ruleDefinition: {
            regulationCode: ruleData.regulationCode,
            regulationName: ruleData.regulationName,
            regulatoryBody: ruleData.regulatoryBody,
            ruleExpression: ruleData.ruleExpression,
            ruleLogic: ruleData.ruleLogic,
            parameters: ruleData.parameters,
            version: ruleData.version,
            effectiveDate: ruleData.effectiveDate?.toISOString(),
            lastUpdated: ruleData.lastUpdated?.toISOString()
          },
          tenantId
        } as any
      });
      
      logger.info('Regulatory rule created', {
        ruleId: rule.id,
        ruleCode: (rule as any).ruleDefinition?.regulationCode,
        jurisdiction: rule.jurisdiction
      });
      
      // Convert back to RegulatoryRule type
      const mappedRule: RegulatoryRule = {
        id: rule.id,
        tenantId: rule.tenantId,
        regulationCode: (rule as any).ruleDefinition?.regulationCode || '',
        regulationName: rule.ruleName,
        regulatoryBody: (rule as any).ruleDefinition?.regulatoryBody || '',
        ruleExpression: (rule as any).ruleDefinition?.ruleExpression || '',
        ruleLogic: (rule as any).ruleDefinition?.ruleLogic || {},
        parameters: (rule as any).ruleDefinition?.parameters || [],
        version: (rule as any).ruleDefinition?.version || '1.0',
        effectiveDate: (rule as any).ruleDefinition?.effectiveDate ? new Date((rule as any).ruleDefinition.effectiveDate) : new Date(),
        lastUpdated: (rule as any).ruleDefinition?.lastUpdated ? new Date((rule as any).ruleDefinition.lastUpdated) : new Date(),
        isActive: rule.isActive,
        jurisdiction: rule.jurisdiction,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt
      };
      
      return mappedRule;
      
    } catch (error: any) {
      logger.error('Error creating regulatory rule:', error);
      throw error;
    }
  }

  // Update regulatory rule
  async updateRule(
    ruleId: string,
    updates: Partial<RegulatoryRule>,
    tenantId: string
  ): Promise<RegulatoryRule> {
    try {
      // Validate rule expression if provided
      if (updates.ruleExpression) {
        this.parseRuleExpression(updates.ruleExpression);
      }
      
      const updateData: any = {};
      
      // Map RegulatoryRule fields to Prisma model fields
      if (updates.regulationName !== undefined) updateData.ruleName = updates.regulationName;
      if (updates.isActive !== undefined) updateData.isActive = updates.isActive;
      if (updates.jurisdiction !== undefined) updateData.jurisdiction = updates.jurisdiction;
      
      // Build ruleDefinition object for nested fields
      const ruleDefinitionUpdates: any = {};
      if (updates.regulationCode !== undefined) ruleDefinitionUpdates.regulationCode = updates.regulationCode;
      if (updates.regulationName !== undefined) ruleDefinitionUpdates.regulationName = updates.regulationName;
      if (updates.regulatoryBody !== undefined) ruleDefinitionUpdates.regulatoryBody = updates.regulatoryBody;
      if (updates.ruleExpression !== undefined) ruleDefinitionUpdates.ruleExpression = updates.ruleExpression;
      if (updates.ruleLogic !== undefined) ruleDefinitionUpdates.ruleLogic = updates.ruleLogic;
      if (updates.parameters !== undefined) ruleDefinitionUpdates.parameters = updates.parameters;
      if (updates.version !== undefined) ruleDefinitionUpdates.version = updates.version;
      if (updates.effectiveDate !== undefined) ruleDefinitionUpdates.effectiveDate = updates.effectiveDate.toISOString();
      if (updates.lastUpdated !== undefined) ruleDefinitionUpdates.lastUpdated = updates.lastUpdated.toISOString();
      
      if (Object.keys(ruleDefinitionUpdates).length > 0) {
        updateData.ruleDefinition = ruleDefinitionUpdates;
      }
      
      const rule = await this.prisma.regulatoryRule.update({
        where: {
          id: ruleId,
          tenantId
        } as any,
        data: updateData
      });
      
      logger.info('Regulatory rule updated', {
        ruleId,
        ruleCode: (rule as any).ruleDefinition?.regulationCode
      });
      
      // Convert back to RegulatoryRule type
      const mappedRule: RegulatoryRule = {
        id: rule.id,
        tenantId: rule.tenantId,
        regulationCode: (rule as any).ruleDefinition?.regulationCode || '',
        regulationName: rule.ruleName,
        regulatoryBody: (rule as any).ruleDefinition?.regulatoryBody || '',
        ruleExpression: (rule as any).ruleDefinition?.ruleExpression || '',
        ruleLogic: (rule as any).ruleDefinition?.ruleLogic || {},
        parameters: (rule as any).ruleDefinition?.parameters || [],
        version: (rule as any).ruleDefinition?.version || '1.0',
        effectiveDate: (rule as any).ruleDefinition?.effectiveDate ? new Date((rule as any).ruleDefinition.effectiveDate) : new Date(),
        lastUpdated: (rule as any).ruleDefinition?.lastUpdated ? new Date((rule as any).ruleDefinition.lastUpdated) : new Date(),
        isActive: rule.isActive,
        jurisdiction: rule.jurisdiction,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt
      };
      
      return mappedRule;
      
    } catch (error: any) {
      logger.error('Error updating regulatory rule:', error);
      throw error;
    }
  }

  // Deactivate regulatory rule
  async deactivateRule(ruleId: string, tenantId: string): Promise<any> {
    try {
      await this.prisma.regulatoryRule.update({
        where: {
          id: ruleId,
          tenantId
        },
        data: {
          isActive: false,
          updatedAt: new Date()
        }
      });
      
      logger.info('Regulatory rule deactivated', { ruleId });
      
    } catch (error: any) {
      logger.error('Error deactivating regulatory rule:', error);
      throw error;
    }
  }

  // Get rule by ID
  async getRule(ruleId: string, tenantId: string): Promise<RegulatoryRule | null> {
    try {
      const rule = await this.prisma.regulatoryRule.findFirst({
        where: {
          id: ruleId,
          tenantId
        }
      });
      
      if (!rule) return null;
      
      // Convert to RegulatoryRule type
      const mappedRule: RegulatoryRule = {
        id: rule.id,
        tenantId: rule.tenantId,
        regulationCode: (rule as any).ruleDefinition?.regulationCode || '',
        regulationName: rule.ruleName,
        regulatoryBody: (rule as any).ruleDefinition?.regulatoryBody || '',
        ruleExpression: (rule as any).ruleDefinition?.ruleExpression || '',
        ruleLogic: (rule as any).ruleDefinition?.ruleLogic || {},
        parameters: (rule as any).ruleDefinition?.parameters || [],
        version: (rule as any).ruleDefinition?.version || '1.0',
        effectiveDate: (rule as any).ruleDefinition?.effectiveDate ? new Date((rule as any).ruleDefinition.effectiveDate) : new Date(),
        lastUpdated: (rule as any).ruleDefinition?.lastUpdated ? new Date((rule as any).ruleDefinition.lastUpdated) : new Date(),
        isActive: rule.isActive,
        jurisdiction: rule.jurisdiction,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt
      };
      
      return mappedRule;
    } catch (error: any) {
      logger.error('Error fetching regulatory rule:', error);
      return null;
    }
  }

  // Get all rules for tenant
  async getRules(
    tenantId: string,
    filters?: {
      jurisdiction?: string;
      isActive?: boolean;
      regulationCode?: string;
    }
  ): Promise<RegulatoryRule[]> {
    try {
      const whereClause: any = { tenantId };
      
      if (filters) {
        if (filters.jurisdiction) {
          whereClause.jurisdiction = filters.jurisdiction;
        }
        if (filters.isActive !== undefined) {
          whereClause.isActive = filters.isActive;
        }
        if (filters.regulationCode) {
          // Search in ruleDefinition JSON field
          whereClause.ruleDefinition = {
            path: ['regulationCode'],
            string_contains: filters.regulationCode
          };
        }
      }
      
      const rules = await this.prisma.regulatoryRule.findMany({
        where: whereClause,
        orderBy: [
          { jurisdiction: 'asc' },
          // { regulationCode: 'asc' }, // Field doesn't exist
          // { version: 'desc' } // Field doesn't exist
          { createdAt: 'desc' }
        ]
      });
      
      // Convert to RegulatoryRule type
      return rules.map(rule => ({
        id: rule.id,
        tenantId: rule.tenantId,
        regulationCode: (rule as any).ruleDefinition?.regulationCode || '',
        regulationName: rule.ruleName,
        regulatoryBody: (rule as any).ruleDefinition?.regulatoryBody || '',
        ruleExpression: (rule as any).ruleDefinition?.ruleExpression || '',
        ruleLogic: (rule as any).ruleDefinition?.ruleLogic || {},
        parameters: (rule as any).ruleDefinition?.parameters || [],
        version: (rule as any).ruleDefinition?.version || '1.0',
        effectiveDate: (rule as any).ruleDefinition?.effectiveDate ? new Date((rule as any).ruleDefinition.effectiveDate) : new Date(),
        lastUpdated: (rule as any).ruleDefinition?.lastUpdated ? new Date((rule as any).ruleDefinition.lastUpdated) : new Date(),
        isActive: rule.isActive,
        jurisdiction: rule.jurisdiction,
        createdAt: rule.createdAt,
        updatedAt: rule.updatedAt
      })) as RegulatoryRule[];
    } catch (error: any) {
      logger.error('Error fetching regulatory rules:', error);
      return [];
    }
  }
}

