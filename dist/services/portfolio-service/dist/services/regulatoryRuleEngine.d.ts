export const __esModule: boolean;
export class RegulatoryRuleEngine {
    constructor(prisma: any, kafkaService: any);
    prisma: any;
    kafkaService: any;
    evaluateRules(portfolioId: any, tenantId: any, context: any, ruleIds: any): Promise<({
        ruleId: any;
        ruleCode: any;
        ruleName: any;
        status: ComplianceMonitoring_1.ComplianceStatus;
        severity: ComplianceMonitoring_1.BreachSeverity;
        message: any;
        actualValue: any;
        expectedValue: any;
        context: any;
        evaluatedAt: Date;
        evaluationTimeMs: number;
        details: any;
    } | {
        ruleId: any;
        ruleCode: any;
        ruleName: any;
        status: ComplianceMonitoring_1.ComplianceStatus;
        severity: ComplianceMonitoring_1.BreachSeverity;
        message: string;
        actualValue: any;
        expectedValue: any;
        context: any;
        evaluatedAt: Date;
        evaluationTimeMs: number;
    })[]>;
    evaluateRule(rule: any, portfolioId: any, context: any): Promise<{
        ruleId: any;
        ruleCode: any;
        ruleName: any;
        status: ComplianceMonitoring_1.ComplianceStatus;
        severity: ComplianceMonitoring_1.BreachSeverity;
        message: any;
        actualValue: any;
        expectedValue: any;
        context: any;
        evaluatedAt: Date;
        evaluationTimeMs: number;
        details: any;
    }>;
    parseRuleExpression(expression: any): any;
    parseConditionalExpression(expression: any): any;
    parseLogicalExpression(expression: any): {
        type: string;
        operator: string;
        operands: any;
    };
    parseSimpleExpression(expression: any): {
        type: string;
        condition: {
            field: any;
            operator: string;
            value: any;
        };
    };
    parseCondition(conditionStr: any): {
        field: any;
        operator: string;
        value: any;
    };
    parseValue(valueStr: any): any;
    prepareEvaluationContext(portfolioId: any, context: any, parameters: any): Promise<any>;
    evaluateRuleLogic(expression: any, context: any, ruleLogic: any): any;
    evaluateSimpleCondition(condition: any, context: any): Promise<{
        isCompliant: boolean;
        isWarning: boolean;
        message: string;
        actualValue: any;
        expectedValue: any;
    }>;
    evaluateLogicalExpression(expression: any, context: any): Promise<{
        isCompliant: boolean;
        isWarning: boolean;
        message: string;
        actualValue: any[];
        expectedValue: any[];
    }>;
    evaluateConditionalExpression(expression: any, context: any): any;
    resolveFieldValue(field: any, context: any): any;
    evaluateCondition(operator: any, actual: any, expected: any): boolean;
    getApplicableRules(tenantId: any, ruleIds: any): Promise<any>;
    getPortfolioData(portfolioId: any): Promise<{
        id: any;
        totalValue: number;
        cashBalance: number;
        totalEquity: number;
        totalFixedIncome: number;
        totalAlternatives: number;
    }>;
    getPositionsData(portfolioId: any): Promise<{
        securityId: string;
        symbol: string;
        quantity: number;
        marketValue: number;
        assetClass: string;
        sector: string;
    }[]>;
    calculateAggregatedMetrics(portfolioData: any, positionsData: any): {
        equityAllocation: number;
        fixedIncomeAllocation: number;
        cashAllocation: number;
        alternativeAllocation: number;
        positionCount: any;
        largestPosition: number;
        sectorConcentration: {};
    };
    calculateSectorConcentration(positions: any, totalValue: any): {};
    determineSeverity(evaluationResult: any, rule: any): ComplianceMonitoring_1.BreachSeverity.LOW | ComplianceMonitoring_1.BreachSeverity.MEDIUM | ComplianceMonitoring_1.BreachSeverity.HIGH;
    publishRuleEvaluationEvent(rule: any, result: any, portfolioId: any): Promise<void>;
    createRule(ruleData: any, tenantId: any): Promise<any>;
    updateRule(ruleId: any, updates: any, tenantId: any): Promise<any>;
    deactivateRule(ruleId: any, tenantId: any): Promise<void>;
    getRule(ruleId: any, tenantId: any): Promise<any>;
    getRules(tenantId: any, filters: any): Promise<any>;
}
import ComplianceMonitoring_1 = require("../models/compliance/ComplianceMonitoring");
