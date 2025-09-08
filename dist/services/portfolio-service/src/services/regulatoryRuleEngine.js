"use strict";
// Regulatory Rule Engine
// Phase 3.6 - Dynamic rule evaluation engine for regulatory compliance
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegulatoryRuleEngine = void 0;
const logger_1 = require("../utils/logger");
const ComplianceMonitoring_1 = require("../models/compliance/ComplianceMonitoring");
class RegulatoryRuleEngine {
    prisma;
    kafkaService;
    constructor(prisma, kafkaService) {
        this.prisma = prisma;
        this.kafkaService = kafkaService;
    }
    // Evaluate all applicable regulatory rules for a portfolio
    async evaluateRules(portfolioId, tenantId, context, ruleIds) {
        try {
            const startTime = Date.now();
            logger_1.logger.info('Starting regulatory rule evaluation', {
                portfolioId,
                tenantId,
                contextType: context.type,
                ruleIds: ruleIds?.length || 'all'
            });
            // Get applicable rules
            const rules = await this.getApplicableRules(tenantId, ruleIds);
            const results = [];
            for (const rule of rules) {
                try {
                    const result = await this.evaluateRule(rule, portfolioId, context);
                    results.push(result);
                    // Publish rule evaluation event
                    await this.publishRuleEvaluationEvent(rule, result, portfolioId);
                }
                catch (error) {
                    logger_1.logger.error('Error evaluating rule:', {
                        ruleId: rule.id,
                        ruleCode: rule.regulationCode,
                        error: error instanceof Error ? error.message : 'Unknown error'
                    });
                    // Create error result
                    results.push({
                        ruleId: rule.id,
                        ruleCode: rule.regulationCode,
                        ruleName: rule.regulationName,
                        status: ComplianceMonitoring_1.ComplianceStatus.BREACH,
                        severity: ComplianceMonitoring_1.BreachSeverity.HIGH,
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
            logger_1.logger.info('Regulatory rule evaluation completed', {
                portfolioId,
                rulesEvaluated: rules.length,
                violations: results.filter(r => r.status === ComplianceMonitoring_1.ComplianceStatus.BREACH).length,
                warnings: results.filter(r => r.status === ComplianceMonitoring_1.ComplianceStatus.WARNING).length,
                totalTimeMs: totalTime
            });
            return results;
        }
        catch (error) {
            logger_1.logger.error('Error in regulatory rule evaluation:', error);
            throw error;
        }
    }
    // Evaluate a single regulatory rule
    async evaluateRule(rule, portfolioId, context) {
        const startTime = Date.now();
        try {
            // Parse rule expression
            const ruleExpression = this.parseRuleExpression(rule.ruleExpression);
            // Prepare evaluation context with portfolio data
            const evaluationContext = await this.prepareEvaluationContext(portfolioId, context, rule.parameters);
            // Evaluate rule logic
            const evaluationResult = await this.evaluateRuleLogic(ruleExpression, evaluationContext, rule.ruleLogic);
            const evaluationTime = Date.now() - startTime;
            const result = {
                ruleId: rule.id,
                ruleCode: rule.regulationCode,
                ruleName: rule.regulationName,
                status: evaluationResult.isCompliant ? ComplianceMonitoring_1.ComplianceStatus.COMPLIANT :
                    evaluationResult.isWarning ? ComplianceMonitoring_1.ComplianceStatus.WARNING : ComplianceMonitoring_1.ComplianceStatus.BREACH,
                severity: this.determineSeverity(evaluationResult, rule),
                message: evaluationResult.message,
                actualValue: evaluationResult.actualValue,
                expectedValue: evaluationResult.expectedValue,
                context,
                evaluatedAt: new Date(),
                evaluationTimeMs: evaluationTime,
                details: evaluationResult.details
            };
            logger_1.logger.debug('Rule evaluation completed', {
                ruleCode: rule.regulationCode,
                status: result.status,
                evaluationTimeMs: evaluationTime
            });
            return result;
        }
        catch (error) {
            logger_1.logger.error('Error evaluating rule:', {
                ruleId: rule.id,
                ruleCode: rule.regulationCode,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    // Parse rule expression into structured format
    parseRuleExpression(expression) {
        try {
            // Simple expression parser - in production, would use a more robust parser
            const trimmed = expression.trim();
            // Handle different expression types
            if (trimmed.startsWith('IF ')) {
                return this.parseConditionalExpression(trimmed);
            }
            else if (trimmed.includes(' AND ') || trimmed.includes(' OR ')) {
                return this.parseLogicalExpression(trimmed);
            }
            else {
                return this.parseSimpleExpression(trimmed);
            }
        }
        catch (error) {
            logger_1.logger.error('Error parsing rule expression:', { expression, error });
            throw new Error(`Invalid rule expression: ${expression}`);
        }
    }
    // Parse conditional expression (IF-THEN-ELSE)
    parseConditionalExpression(expression) {
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
    parseLogicalExpression(expression) {
        if (expression.includes(' AND ')) {
            const parts = expression.split(' AND ').map(p => p.trim());
            return {
                type: 'LOGICAL',
                operator: 'AND',
                operands: parts.map(p => this.parseRuleExpression(p))
            };
        }
        else if (expression.includes(' OR ')) {
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
    parseSimpleExpression(expression) {
        const condition = this.parseCondition(expression);
        return {
            type: 'SIMPLE',
            condition
        };
    }
    // Parse condition
    parseCondition(conditionStr) {
        const operators = ['<=', '>=', '!=', '=', '<', '>', 'IN', 'NOT IN', 'CONTAINS', 'MATCHES'];
        for (const op of operators) {
            if (conditionStr.includes(` ${op} `)) {
                const [left, right] = conditionStr.split(` ${op} `).map(s => s.trim());
                return {
                    field: left,
                    operator: op,
                    value: this.parseValue(right)
                };
            }
        }
        throw new Error(`Invalid condition: ${conditionStr}`);
    }
    // Parse value (handle different types)
    parseValue(valueStr) {
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
    async prepareEvaluationContext(portfolioId, context, parameters) {
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
        }
        catch (error) {
            logger_1.logger.error('Error preparing evaluation context:', error);
            throw error;
        }
    }
    // Evaluate rule logic
    async evaluateRuleLogic(expression, context, ruleLogic) {
        try {
            switch (expression.type) {
                case 'SIMPLE':
                    return await this.evaluateSimpleCondition(expression.condition, context);
                case 'LOGICAL':
                    return await this.evaluateLogicalExpression(expression, context);
                case 'CONDITIONAL':
                    return await this.evaluateConditionalExpression(expression, context);
                default:
                    throw new Error(`Unsupported expression type: ${expression.type}`);
            }
        }
        catch (error) {
            logger_1.logger.error('Error evaluating rule logic:', error);
            throw error;
        }
    }
    // Evaluate simple condition
    async evaluateSimpleCondition(condition, context) {
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
    async evaluateLogicalExpression(expression, context) {
        const results = await Promise.all(expression.operands.map(operand => this.evaluateRuleLogic(operand, context, {})));
        let isCompliant;
        if (expression.operator === 'AND') {
            isCompliant = results.every(r => r.isCompliant);
        }
        else { // OR
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
    async evaluateConditionalExpression(expression, context) {
        const conditionResult = await this.evaluateSimpleCondition(expression.condition, context);
        if (conditionResult.isCompliant) {
            return await this.evaluateRuleLogic(expression.thenExpression, context, {});
        }
        else if (expression.elseExpression) {
            return await this.evaluateRuleLogic(expression.elseExpression, context, {});
        }
        else {
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
    resolveFieldValue(field, context) {
        if (typeof field !== 'string') {
            return field;
        }
        // Handle nested field access (e.g., "portfolio.totalValue")
        const fieldParts = field.split('.');
        let value = context;
        for (const part of fieldParts) {
            if (value && typeof value === 'object' && part in value) {
                value = value[part];
            }
            else {
                logger_1.logger.warn('Field not found in context:', { field, availableFields: Object.keys(context) });
                return null;
            }
        }
        return value;
    }
    // Evaluate condition based on operator
    evaluateCondition(operator, actual, expected) {
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
    async getApplicableRules(tenantId, ruleIds) {
        const whereClause = {
            tenantId,
            isActive: true,
            effectiveDate: {
                lte: new Date()
            }
        };
        if (ruleIds && ruleIds.length > 0) {
            whereClause.id = { in: ruleIds };
        }
        return await this.prisma.regulatoryRule.findMany({
            where: whereClause,
            orderBy: [
                { version: 'desc' }
            ]
        });
    }
    // Get portfolio data for evaluation
    async getPortfolioData(portfolioId) {
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
    async getPositionsData(portfolioId) {
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
    calculateAggregatedMetrics(portfolioData, positionsData) {
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
    calculateSectorConcentration(positions, totalValue) {
        const sectorTotals = {};
        for (const position of positions) {
            const sector = position.sector || 'UNKNOWN';
            const value = position.marketValue?.toNumber() || 0;
            sectorTotals[sector] = (sectorTotals[sector] || 0) + value;
        }
        const sectorPercentages = {};
        for (const [sector, value] of Object.entries(sectorTotals)) {
            sectorPercentages[sector] = (value / totalValue) * 100;
        }
        return sectorPercentages;
    }
    // Determine breach severity
    determineSeverity(evaluationResult, rule) {
        if (evaluationResult.isCompliant) {
            return ComplianceMonitoring_1.BreachSeverity.LOW; // Not actually a breach, but need a value
        }
        if (evaluationResult.isWarning) {
            return ComplianceMonitoring_1.BreachSeverity.MEDIUM;
        }
        // Determine severity based on rule type and jurisdiction
        if (rule.jurisdiction === 'SEC' || rule.jurisdiction === 'FINRA') {
            return ComplianceMonitoring_1.BreachSeverity.HIGH;
        }
        return ComplianceMonitoring_1.BreachSeverity.MEDIUM;
    }
    // Publish rule evaluation event
    async publishRuleEvaluationEvent(rule, result, portfolioId) {
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
    async createRule(ruleData, tenantId) {
        try {
            // Validate rule expression
            this.parseRuleExpression(ruleData.ruleExpression);
            const rule = await this.prisma.regulatoryRule.create({
                data: {
                    ...ruleData,
                    tenantId
                }
            });
            logger_1.logger.info('Regulatory rule created', {
                ruleId: rule.id,
                ruleCode: rule.regulationCode,
                jurisdiction: rule.jurisdiction
            });
            return rule;
        }
        catch (error) {
            logger_1.logger.error('Error creating regulatory rule:', error);
            throw error;
        }
    }
    // Update regulatory rule
    async updateRule(ruleId, updates, tenantId) {
        try {
            // Validate rule expression if provided
            if (updates.ruleExpression) {
                this.parseRuleExpression(updates.ruleExpression);
            }
            const rule = await this.prisma.regulatoryRule.update({
                where: {
                    id: ruleId,
                    tenantId
                },
                data: updates
            });
            logger_1.logger.info('Regulatory rule updated', {
                ruleId,
                ruleCode: rule.regulationCode
            });
            return rule;
        }
        catch (error) {
            logger_1.logger.error('Error updating regulatory rule:', error);
            throw error;
        }
    }
    // Deactivate regulatory rule
    async deactivateRule(ruleId, tenantId) {
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
            logger_1.logger.info('Regulatory rule deactivated', { ruleId });
        }
        catch (error) {
            logger_1.logger.error('Error deactivating regulatory rule:', error);
            throw error;
        }
    }
    // Get rule by ID
    async getRule(ruleId, tenantId) {
        try {
            return await this.prisma.regulatoryRule.findFirst({
                where: {
                    id: ruleId,
                    tenantId
                }
            });
        }
        catch (error) {
            logger_1.logger.error('Error fetching regulatory rule:', error);
            return null;
        }
    }
    // Get all rules for tenant
    async getRules(tenantId, filters) {
        try {
            const whereClause = { tenantId };
            if (filters) {
                if (filters.jurisdiction) {
                    whereClause.jurisdiction = filters.jurisdiction;
                }
                if (filters.isActive !== undefined) {
                    whereClause.isActive = filters.isActive;
                }
                if (filters.regulationCode) {
                    whereClause.regulationCode = {
                        contains: filters.regulationCode,
                        mode: 'insensitive'
                    };
                }
            }
            return await this.prisma.regulatoryRule.findMany({
                where: whereClause,
                orderBy: [
                    { jurisdiction: 'asc' },
                    { regulationCode: 'asc' },
                    { version: 'desc' }
                ]
            });
        }
        catch (error) {
            logger_1.logger.error('Error fetching regulatory rules:', error);
            return [];
        }
    }
}
exports.RegulatoryRuleEngine = RegulatoryRuleEngine;
