export const __esModule: boolean;
export class ComplianceMonitoringService {
    constructor(prisma: any, kafkaService: any);
    prisma: any;
    kafkaService: any;
    checkInvestmentGuidelines(request: any, tenantId: any, userId: any): Promise<{
        portfolioId: any;
        overallStatus: ComplianceMonitoring_1.ComplianceStatus.COMPLIANT | ComplianceMonitoring_1.ComplianceStatus.WARNING | ComplianceMonitoring_1.ComplianceStatus.BREACH;
        checkResults: ({
            ruleId: any;
            ruleName: any;
            ruleType: any;
            status: any;
            actualValue: any;
            limitValue: any;
            message: any;
            severity: any;
        } | {
            ruleId: any;
            ruleName: any;
            ruleType: any;
            status: ComplianceMonitoring_1.ComplianceStatus;
            message: string;
            actualValue?: undefined;
            limitValue?: undefined;
            severity?: undefined;
        })[];
        blockedTransactions: any[];
        warnings: string[];
        timestamp: Date;
    }>;
    checkAllocationGuidelines(portfolio: any, guideline: any, transactionId: any): Promise<{
        status: ComplianceMonitoring_1.ComplianceStatus;
        actualValue: any;
        limitValue: any;
        message: string;
        severity: ComplianceMonitoring_1.BreachSeverity;
        ruleId: string;
        ruleName: string;
        ruleType: ComplianceMonitoring_1.ComplianceRuleType;
    }[]>;
    checkComplianceRule(portfolio: any, rule: any, transactionId: any): Promise<{
        ruleId: any;
        ruleName: any;
        ruleType: any;
        status: any;
        actualValue: any;
        limitValue: any;
        message: any;
        severity: any;
    } | {
        ruleId: any;
        ruleName: any;
        ruleType: any;
        status: ComplianceMonitoring_1.ComplianceStatus;
        message: string;
        actualValue?: undefined;
        limitValue?: undefined;
        severity?: undefined;
    }>;
    monitorConcentrationLimits(portfolioId: any, tenantId: any, userId: any): Promise<{
        ruleId: any;
        ruleName: any;
        ruleType: any;
        status: ComplianceMonitoring_1.ComplianceStatus;
        actualValue: number;
        limitValue: any;
        message: string;
        severity: ComplianceMonitoring_1.BreachSeverity;
    }[]>;
    screenRestrictedList(portfolioId: any, instrumentIds: any, tenantId: any, userId: any): Promise<{
        ruleId: any;
        ruleName: string;
        ruleType: ComplianceMonitoring_1.ComplianceRuleType;
        status: ComplianceMonitoring_1.ComplianceStatus;
        message: string;
        severity: any;
    }[]>;
    verifySuitability(clientId: any, portfolioId: any, tenantId: any, userId: any): Promise<{
        id: string;
        tenantId: any;
        clientId: any;
        portfolioId: any;
        checkType: string;
        checkDate: Date;
        overallSuitability: string;
        suitabilityScore: number;
        riskAlignmentScore: any;
        objectiveAlignmentScore: any;
        concentrationScore: any;
        liquidityScore: any;
        suitabilityIssues: any;
        recommendations: any;
        requiredActions: any;
        performedBy: any;
        createdAt: Date;
        updatedAt: Date;
    }>;
    detectBreaches(tenantId: any, portfolioIds: any): Promise<any[]>;
    searchBreaches(request: any, tenantId: any): Promise<{
        breaches: any;
        total: any;
        aggregateMetrics: {
            totalBreaches: any;
            criticalBreaches: any;
            unresolvedBreaches: any;
            averageResolutionTime: any;
        };
        pagination: {
            limit: any;
            offset: any;
            hasMore: boolean;
        };
    }>;
    checkAllocationLimit(name: any, actualValue: any, minValue: any, maxValue: any, unit?: string): {
        status: ComplianceMonitoring_1.ComplianceStatus;
        actualValue: any;
        limitValue: any;
        message: string;
        severity: ComplianceMonitoring_1.BreachSeverity;
    };
    determineSeverity(actualValue: any, limitValue: any, isMinimum?: boolean): ComplianceMonitoring_1.BreachSeverity;
    generateId(): string;
    getPortfolioData(portfolioId: any, tenantId: any): Promise<any>;
    getApplicableGuidelines(portfolioId: any, tenantId: any): Promise<any[]>;
    getApplicableRules(portfolioId: any, tenantId: any, ruleTypes: any): Promise<any[]>;
    calculatePortfolioAllocations(portfolio: any): Promise<{
        equity: number;
        fixedIncome: number;
        cash: number;
        alternatives: number;
    }>;
    calculateSectorAllocations(portfolio: any): Promise<{}>;
    calculateConcentrations(portfolio: any): Promise<{
        securities: {};
        issuers: {};
    }>;
    createBreachesFromResults(results: any, portfolioId: any, tenantId: any, userId: any): Promise<void>;
    logComplianceCheck(request: any, results: any, status: any, tenantId: any, userId: any): Promise<void>;
    publishComplianceEvent(portfolioId: any, status: any, results: any, userId: any): Promise<void>;
    publishSuitabilityEvent(check: any, userId: any): Promise<void>;
}
import ComplianceMonitoring_1 = require("../models/compliance/ComplianceMonitoring");
