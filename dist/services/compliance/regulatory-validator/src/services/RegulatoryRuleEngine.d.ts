import { EventEmitter } from 'events';
import { RegulatoryRule, ComplianceValidationRequest, ComplianceValidationResult, RegulatoryValidatorConfig } from '../types';
export declare class RegulatoryRuleEngine extends EventEmitter {
    private config;
    private rules;
    private rulesByCategory;
    private performanceMetrics;
    constructor(config: RegulatoryValidatorConfig);
    private initializeDefaultRules;
    addRule(rule: RegulatoryRule): void;
    updateRule(ruleId: string, updates: Partial<RegulatoryRule>): boolean;
    removeRule(ruleId: string): boolean;
    validateEntity(request: ComplianceValidationRequest): Promise<ComplianceValidationResult>;
    private validateRule;
    private evaluateCondition;
    private getNestedValue;
    private generateRuleMessage;
    private extractRelevantValues;
    private gatherEvidence;
    private generateRecommendation;
    private estimateEffort;
    private calculateDeadline;
    private calculateDataQualityScore;
    private calculateConfidenceLevel;
    getRulesByCategory(category: string): RegulatoryRule[];
    getAllRules(): RegulatoryRule[];
    getRule(ruleId: string): RegulatoryRule | undefined;
    getPerformanceMetrics(): Array<{
        ruleId: string;
        executionCount: number;
        averageExecutionTime: number;
        successRate: number;
    }>;
    enableRule(ruleId: string): boolean;
    disableRule(ruleId: string): boolean;
    getEnabledRulesCount(): number;
    getRulesByJurisdiction(jurisdiction: string): RegulatoryRule[];
}
