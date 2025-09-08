export const __esModule: boolean;
export class ScalingDecisionEngine extends events_1<[never]> {
    constructor(config: any, financialProfile: any);
    config: any;
    financialProfile: any;
    decisionHistory: Map<any, any>;
    cooldownTimers: Map<any, any>;
    conditionStates: Map<any, any>;
    makeScalingDecision(serviceName: any, metrics: any, allMetrics: any): Promise<{
        timestamp: any;
        serviceName: any;
        currentInstances: any;
        recommendedInstances: any;
        confidence: any;
        reasoning: any[];
        triggeredRules: any[];
        metricsUsed: {};
        action: string;
        urgency: string;
    }>;
    getApplicableRules(serviceName: any): any;
    evaluateRule(rule: any, serviceName: any, metrics: any, allMetrics: any): Promise<{
        rule: any;
        triggered: boolean;
        conditionResults: any[];
        confidence: number;
    }>;
    evaluateCondition(condition: any, serviceName: any, metrics: any, allMetrics: any): Promise<{
        condition: any;
        satisfied: boolean;
        value: any;
        duration: number;
    }>;
    extractMetricValue(metricName: any, metrics: any, allMetrics: any): any;
    evaluateThreshold(value: any, threshold: any, comparison: any): boolean;
    calculateRuleConfidence(conditionResults: any): number;
    createDecisionFromRule(serviceName: any, metrics: any, timestamp: any, ruleEvaluation: any): {
        timestamp: any;
        serviceName: any;
        currentInstances: any;
        recommendedInstances: any;
        confidence: any;
        reasoning: any[];
        triggeredRules: any[];
        metricsUsed: {};
        action: string;
        urgency: string;
    };
    createMaintainDecision(serviceName: any, metrics: any, timestamp: any, reason: any): {
        timestamp: any;
        serviceName: any;
        currentInstances: any;
        recommendedInstances: any;
        confidence: number;
        reasoning: any[];
        triggeredRules: any[];
        metricsUsed: {};
        action: string;
        urgency: string;
    };
    determineUrgency(conditionResults: any, confidence: any): "low" | "medium" | "high" | "critical";
    applyFinancialConstraints(decision: any, metrics: any): void;
    isMarketHours(date: any): boolean;
    getCurrentTradingPattern(date: any): {
        name: string;
        multiplier: any;
    };
    validateDecisionLimits(decision: any, metrics: any): void;
    isInCooldown(serviceName: any): boolean;
    getConditionState(conditionKey: any): any;
    setConditionState(conditionKey: any, state: any): void;
    addDecisionToHistory(serviceName: any, decision: any): void;
    setCooldown(serviceName: any, action: any): void;
    getDecisionHistory(serviceName: any, limit: any): any;
    generatePrediction(serviceName: any, timeHorizonMinutes: any): Promise<{
        serviceName: any;
        timeHorizon: any;
        predictions: {
            timestamp: Date;
            predictedLoad: number;
            recommendedInstances: number;
            confidence: number;
        }[];
        seasonalPatterns: {
            dayOfWeek: number;
            hourOfDay: number;
            expectedMultiplier: number;
        }[];
        trendAnalysis: {
            direction: string;
            rate: number;
            confidence: number;
        };
    }>;
    getSeasonalMultiplier(date: any): 0.8 | 1.5 | 0.6;
    generateSeasonalPatterns(): {
        dayOfWeek: number;
        hourOfDay: number;
        expectedMultiplier: number;
    }[];
}
import events_1 = require("events");
