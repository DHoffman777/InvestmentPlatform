"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomatedScalingRecommendationEngine = void 0;
const events_1 = require("events");
const CapacityPlanningDataModel_1 = require("./CapacityPlanningDataModel");
class AutomatedScalingRecommendationEngine extends events_1.EventEmitter {
    recommendations = new Map();
    evaluationTimer;
    config;
    decisionEngine;
    riskAssessor;
    costOptimizer;
    performanceAnalyzer;
    constructor(config) {
        super();
        this.config = config;
        this.decisionEngine = new DecisionEngine(config);
        this.riskAssessor = new RiskAssessor(config.riskTolerance);
        this.costOptimizer = new CostOptimizer();
        this.performanceAnalyzer = new PerformanceAnalyzer();
        this.startEvaluation();
    }
    async generateRecommendations(context) {
        const startTime = Date.now();
        const resourceId = context.resourceId;
        this.emit('recommendationGenerationStarted', { resourceId });
        try {
            const candidates = await this.identifyRecommendationCandidates(context);
            const scoredRecommendations = await this.scoreRecommendations(candidates, context);
            const filteredRecommendations = await this.filterRecommendations(scoredRecommendations, context);
            const finalRecommendations = await this.optimizeRecommendationSet(filteredRecommendations, context);
            for (const recommendation of finalRecommendations) {
                recommendation.id = this.generateRecommendationId();
                recommendation.generatedAt = new Date();
                recommendation.validUntil = new Date(Date.now() + this.config.recommendationValidityPeriod);
                this.recommendations.set(recommendation.id, recommendation);
                this.emit('recommendationGenerated', {
                    recommendationId: recommendation.id,
                    resourceId,
                    type: recommendation.type,
                    priority: recommendation.priority
                });
            }
            const generationTime = Date.now() - startTime;
            this.emit('recommendationGenerationCompleted', {
                resourceId,
                count: finalRecommendations.length,
                generationTime
            });
            return finalRecommendations;
        }
        catch (error) {
            this.emit('recommendationGenerationFailed', { resourceId, error: error.message });
            throw error;
        }
    }
    async batchGenerateRecommendations(contexts) {
        const batchId = this.generateBatchId();
        this.emit('batchRecommendationStarted', { batchId, resources: contexts.length });
        const results = new Map();
        const startTime = Date.now();
        const batches = this.chunkArray(contexts, 5);
        for (const batch of batches) {
            const batchPromises = batch.map(context => this.generateRecommendations(context)
                .then(recommendations => ({ resourceId: context.resourceId, recommendations }))
                .catch(error => {
                console.error(`Batch recommendation failed for ${context.resourceId}:`, error);
                return { resourceId: context.resourceId, recommendations: [] };
            }));
            const batchResults = await Promise.all(batchPromises);
            for (const result of batchResults) {
                results.set(result.resourceId, result.recommendations);
            }
        }
        const batchTime = Date.now() - startTime;
        this.emit('batchRecommendationCompleted', {
            batchId,
            resources: results.size,
            totalRecommendations: Array.from(results.values()).reduce((sum, recs) => sum + recs.length, 0),
            batchTime
        });
        return results;
    }
    async evaluateRecommendationEffectiveness(recommendationId) {
        const recommendation = this.recommendations.get(recommendationId);
        if (!recommendation) {
            throw new Error(`Recommendation ${recommendationId} not found`);
        }
        const effectiveness = {
            implementationRate: recommendation.implemented ? 1.0 : 0.0,
            successRate: 0.85,
            costSavings: recommendation.impact.cost * 0.8,
            performanceImprovement: recommendation.impact.performance * 0.9,
            userSatisfaction: recommendation.feedback?.rating || 0.7,
            lessons: this.extractLessonsLearned(recommendation)
        };
        return effectiveness;
    }
    async updateRecommendationFeedback(recommendationId, feedback) {
        const recommendation = this.recommendations.get(recommendationId);
        if (!recommendation) {
            throw new Error(`Recommendation ${recommendationId} not found`);
        }
        recommendation.feedback = {
            ...feedback,
            submittedAt: new Date()
        };
        this.emit('feedbackReceived', { recommendationId, rating: feedback.rating });
        await this.updateRecommendationModels(recommendation, feedback);
    }
    async getRecommendationsByResource(resourceId) {
        return Array.from(this.recommendations.values())
            .filter(rec => rec.resourceId === resourceId)
            .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());
    }
    async getRecommendationsByPriority(priority) {
        return Array.from(this.recommendations.values())
            .filter(rec => rec.priority === priority)
            .sort((a, b) => b.confidence - a.confidence);
    }
    async getActiveRecommendations() {
        const now = new Date();
        return Array.from(this.recommendations.values())
            .filter(rec => rec.validUntil > now && !rec.implemented)
            .sort((a, b) => b.confidence - a.confidence);
    }
    async identifyRecommendationCandidates(context) {
        const candidates = [];
        if (this.config.enableProactiveRecommendations) {
            candidates.push(...await this.generateProactiveRecommendations(context));
        }
        candidates.push(...await this.generateReactiveRecommendations(context));
        if (this.config.enableCostOptimization) {
            candidates.push(...await this.generateCostOptimizationRecommendations(context));
        }
        if (this.config.enablePerformanceTuning) {
            candidates.push(...await this.generatePerformanceTuningRecommendations(context));
        }
        return candidates;
    }
    async generateProactiveRecommendations(context) {
        const recommendations = [];
        for (const prediction of context.predictions) {
            const futureValues = prediction.predictions.slice(0, 24);
            const maxPredicted = Math.max(...futureValues.map(p => p.value));
            const minPredicted = Math.min(...futureValues.map(p => p.value));
            const currentCapacity = await this.getCurrentCapacity(context.resourceId);
            const utilizationThreshold = 80;
            if (maxPredicted > utilizationThreshold) {
                const targetCapacity = Math.ceil(currentCapacity * (maxPredicted / utilizationThreshold));
                recommendations.push({
                    id: '',
                    resourceId: context.resourceId,
                    type: CapacityPlanningDataModel_1.RecommendationType.PROACTIVE_SCALING,
                    action: {
                        type: 'scale_up',
                        target: { instances: targetCapacity },
                        constraints: {
                            timeWindow: {
                                start: new Date(),
                                end: new Date(Date.now() + 24 * 60 * 60 * 1000)
                            }
                        }
                    },
                    reasoning: `Predicted ${prediction.metric} will reach ${maxPredicted.toFixed(1)}%, exceeding ${utilizationThreshold}% threshold`,
                    impact: {
                        performance: this.estimatePerformanceImpact('scale_up', currentCapacity, targetCapacity),
                        cost: this.estimateCostImpact(currentCapacity, targetCapacity),
                        risk: this.riskAssessor.assessScalingRisk('scale_up', currentCapacity, targetCapacity)
                    },
                    timeline: {
                        immediate: [{
                                order: 1,
                                description: 'Schedule proactive scaling',
                                action: 'schedule_scaling',
                                estimatedDuration: 300000,
                                risk: 'low'
                            }],
                        shortTerm: [{
                                order: 1,
                                description: 'Execute scaling operation',
                                action: 'scale_up',
                                estimatedDuration: 600000,
                                risk: 'medium'
                            }],
                        longTerm: [{
                                order: 1,
                                description: 'Monitor performance',
                                action: 'monitor',
                                estimatedDuration: 3600000,
                                risk: 'low'
                            }]
                    },
                    priority: maxPredicted > 90 ? 'critical' : 'high',
                    confidence: prediction.metadata.modelAccuracy,
                    generatedAt: new Date(),
                    validUntil: new Date(),
                    implemented: false
                });
            }
        }
        return recommendations;
    }
    async generateReactiveRecommendations(context) {
        const recommendations = [];
        const currentMetrics = context.currentMetrics;
        const cpuUsage = currentMetrics.cpu.usage;
        const memoryUsage = currentMetrics.memory.usage;
        const diskUsage = currentMetrics.disk.usage;
        const currentCapacity = await this.getCurrentCapacity(context.resourceId);
        if (cpuUsage > 85 || memoryUsage > 90) {
            const urgency = cpuUsage > 95 || memoryUsage > 95 ? 'critical' : 'high';
            const targetCapacity = Math.ceil(currentCapacity * 1.5);
            recommendations.push({
                id: '',
                resourceId: context.resourceId,
                type: CapacityPlanningDataModel_1.RecommendationType.REACTIVE_SCALING,
                action: {
                    type: 'scale_up',
                    target: { instances: targetCapacity },
                    constraints: {}
                },
                reasoning: `High resource utilization detected: CPU ${cpuUsage.toFixed(1)}%, Memory ${memoryUsage.toFixed(1)}%`,
                impact: {
                    performance: this.estimatePerformanceImpact('scale_up', currentCapacity, targetCapacity),
                    cost: this.estimateCostImpact(currentCapacity, targetCapacity),
                    risk: this.riskAssessor.assessScalingRisk('scale_up', currentCapacity, targetCapacity)
                },
                timeline: {
                    immediate: [{
                            order: 1,
                            description: 'Execute emergency scaling',
                            action: 'emergency_scale_up',
                            estimatedDuration: 300000,
                            risk: 'medium'
                        }],
                    shortTerm: [],
                    longTerm: []
                },
                priority: urgency,
                confidence: 0.9,
                generatedAt: new Date(),
                validUntil: new Date(),
                implemented: false
            });
        }
        if (cpuUsage < 20 && memoryUsage < 30 && diskUsage < 40) {
            const targetCapacity = Math.max(1, Math.floor(currentCapacity * 0.7));
            if (targetCapacity < currentCapacity) {
                recommendations.push({
                    id: '',
                    resourceId: context.resourceId,
                    type: CapacityPlanningDataModel_1.RecommendationType.REACTIVE_SCALING,
                    action: {
                        type: 'scale_down',
                        target: { instances: targetCapacity },
                        constraints: {}
                    },
                    reasoning: `Low resource utilization detected: CPU ${cpuUsage.toFixed(1)}%, Memory ${memoryUsage.toFixed(1)}%, Disk ${diskUsage.toFixed(1)}%`,
                    impact: {
                        performance: this.estimatePerformanceImpact('scale_down', currentCapacity, targetCapacity),
                        cost: this.estimateCostImpact(currentCapacity, targetCapacity),
                        risk: this.riskAssessor.assessScalingRisk('scale_down', currentCapacity, targetCapacity)
                    },
                    timeline: {
                        immediate: [],
                        shortTerm: [{
                                order: 1,
                                description: 'Plan scale down operation',
                                action: 'plan_scale_down',
                                estimatedDuration: 300000,
                                risk: 'low'
                            }],
                        longTerm: [{
                                order: 1,
                                description: 'Execute scale down',
                                action: 'scale_down',
                                estimatedDuration: 600000,
                                risk: 'medium'
                            }]
                    },
                    priority: 'medium',
                    confidence: 0.8,
                    generatedAt: new Date(),
                    validUntil: new Date(),
                    implemented: false
                });
            }
        }
        return recommendations;
    }
    async generateCostOptimizationRecommendations(context) {
        const recommendations = [];
        const costAnalysis = await this.costOptimizer.analyzeCosts(context);
        if (costAnalysis.potentialSavings > 100) {
            for (const optimization of costAnalysis.optimizations) {
                recommendations.push({
                    id: '',
                    resourceId: context.resourceId,
                    type: CapacityPlanningDataModel_1.RecommendationType.COST_OPTIMIZATION,
                    action: {
                        type: 'optimize',
                        target: optimization.target,
                        constraints: { budget: costAnalysis.potentialSavings }
                    },
                    reasoning: optimization.reasoning,
                    impact: {
                        performance: optimization.performanceImpact,
                        cost: optimization.costSavings,
                        risk: optimization.risk
                    },
                    timeline: {
                        immediate: [],
                        shortTerm: optimization.steps,
                        longTerm: []
                    },
                    priority: optimization.costSavings > 500 ? 'high' : 'medium',
                    confidence: optimization.confidence,
                    generatedAt: new Date(),
                    validUntil: new Date(),
                    implemented: false
                });
            }
        }
        return recommendations;
    }
    async generatePerformanceTuningRecommendations(context) {
        const recommendations = [];
        const performanceAnalysis = await this.performanceAnalyzer.analyze(context);
        for (const bottleneck of performanceAnalysis.bottlenecks) {
            recommendations.push({
                id: '',
                resourceId: context.resourceId,
                type: CapacityPlanningDataModel_1.RecommendationType.PERFORMANCE_TUNING,
                action: {
                    type: bottleneck.recommendedAction,
                    target: bottleneck.target,
                    constraints: {}
                },
                reasoning: bottleneck.description,
                impact: {
                    performance: bottleneck.expectedImprovement,
                    cost: bottleneck.estimatedCost,
                    risk: bottleneck.risk
                },
                timeline: {
                    immediate: bottleneck.immediateSteps,
                    shortTerm: bottleneck.shortTermSteps,
                    longTerm: bottleneck.longTermSteps
                },
                priority: bottleneck.severity === 'high' ? 'high' : 'medium',
                confidence: bottleneck.confidence,
                generatedAt: new Date(),
                validUntil: new Date(),
                implemented: false
            });
        }
        return recommendations;
    }
    async scoreRecommendations(recommendations, context) {
        const scoredRecommendations = [];
        for (const recommendation of recommendations) {
            const score = await this.calculateRecommendationScore(recommendation, context);
            scoredRecommendations.push({ recommendation, score });
        }
        return scoredRecommendations.sort((a, b) => b.score.overall - a.score.overall);
    }
    async calculateRecommendationScore(recommendation, context) {
        const performance = Math.max(0, recommendation.impact.performance) / 100;
        const cost = Math.max(0, 1 - Math.abs(recommendation.impact.cost) / 1000);
        const risk = Math.max(0, 1 - recommendation.impact.risk);
        const urgency = this.calculateUrgency(recommendation, context);
        const feasibility = await this.calculateFeasibility(recommendation, context);
        const weights = {
            performance: 0.25,
            cost: 0.20,
            risk: 0.20,
            urgency: 0.20,
            feasibility: 0.15
        };
        const overall = performance * weights.performance +
            cost * weights.cost +
            risk * weights.risk +
            urgency * weights.urgency +
            feasibility * weights.feasibility;
        return { performance, cost, risk, urgency, feasibility, overall };
    }
    calculateUrgency(recommendation, context) {
        const priorityScores = { critical: 1.0, high: 0.8, medium: 0.5, low: 0.2 };
        let urgency = priorityScores[recommendation.priority];
        if (context.businessContext.criticalPeriod) {
            urgency *= 1.2;
        }
        if (!context.businessContext.isBusinessHours) {
            urgency *= 0.8;
        }
        return Math.min(1.0, urgency);
    }
    async calculateFeasibility(recommendation, context) {
        let feasibility = 1.0;
        if (recommendation.action.constraints?.budget) {
            const availableBudget = this.config.scalingConstraints.budgetLimit;
            if (recommendation.impact.cost > availableBudget) {
                feasibility *= 0.3;
            }
        }
        const recentScalings = context.recentRecommendations.filter(r => r.implemented &&
            Date.now() - r.generatedAt.getTime() < this.config.scalingConstraints.minCooldownPeriod);
        if (recentScalings.length > 0) {
            feasibility *= 0.6;
        }
        const dependencies = this.config.scalingConstraints.dependencies[context.resourceId] || [];
        if (dependencies.length > 0) {
            feasibility *= 0.8;
        }
        return feasibility;
    }
    async filterRecommendations(scoredRecommendations, context) {
        const filtered = scoredRecommendations.filter(sr => sr.recommendation.confidence >= this.config.minConfidenceThreshold &&
            sr.score.overall >= 0.5);
        return filtered
            .slice(0, this.config.maxRecommendationsPerResource)
            .map(sr => sr.recommendation);
    }
    async optimizeRecommendationSet(recommendations, context) {
        const conflictResolution = await this.resolveRecommendationConflicts(recommendations);
        const optimized = await this.applyBusinessRules(conflictResolution, context);
        return optimized;
    }
    async resolveRecommendationConflicts(recommendations) {
        const scaleUpRecommendations = recommendations.filter(r => r.action.type === 'scale_up');
        const scaleDownRecommendations = recommendations.filter(r => r.action.type === 'scale_down');
        const otherRecommendations = recommendations.filter(r => r.action.type !== 'scale_up' && r.action.type !== 'scale_down');
        if (scaleUpRecommendations.length > 0 && scaleDownRecommendations.length > 0) {
            const bestScaleUp = scaleUpRecommendations.reduce((best, current) => current.confidence > best.confidence ? current : best);
            const bestScaleDown = scaleDownRecommendations.reduce((best, current) => current.confidence > best.confidence ? current : best);
            if (bestScaleUp.confidence > bestScaleDown.confidence) {
                return [bestScaleUp, ...otherRecommendations];
            }
            else {
                return [bestScaleDown, ...otherRecommendations];
            }
        }
        return recommendations;
    }
    async applyBusinessRules(recommendations, context) {
        return recommendations.filter(recommendation => {
            if (!context.businessContext.isBusinessHours && recommendation.priority === 'critical') {
                return false;
            }
            if (recommendation.action.type === 'scale_down' && context.businessContext.expectedLoad !== 'low') {
                return false;
            }
            return true;
        });
    }
    async updateRecommendationModels(recommendation, feedback) {
        await this.decisionEngine.updateModel(recommendation, feedback);
    }
    extractLessonsLearned(recommendation) {
        const lessons = [];
        if (recommendation.feedback) {
            if (recommendation.feedback.rating < 3) {
                lessons.push('Low user satisfaction - review recommendation criteria');
            }
            if (recommendation.feedback.actualImpact) {
                const expectedPerf = recommendation.impact.performance;
                const actualPerf = recommendation.feedback.actualImpact.performance;
                if (Math.abs(expectedPerf - actualPerf) > 20) {
                    lessons.push('Performance impact prediction needs improvement');
                }
            }
        }
        return lessons;
    }
    estimatePerformanceImpact(action, currentCapacity, targetCapacity) {
        const capacityRatio = targetCapacity / currentCapacity;
        if (action === 'scale_up') {
            return Math.min(50, (capacityRatio - 1) * 100);
        }
        else if (action === 'scale_down') {
            return Math.max(-30, (1 - capacityRatio) * -100);
        }
        return 0;
    }
    estimateCostImpact(currentCapacity, targetCapacity) {
        const capacityDelta = Math.abs(targetCapacity - currentCapacity);
        const monthlyCostPerUnit = 100;
        return capacityDelta * monthlyCostPerUnit;
    }
    async getCurrentCapacity(resourceId) {
        return 2;
    }
    chunkArray(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }
    startEvaluation() {
        this.evaluationTimer = setInterval(async () => {
            try {
                await this.performScheduledEvaluation();
            }
            catch (error) {
                this.emit('scheduledEvaluationError', { error: error.message });
            }
        }, this.config.evaluationInterval);
    }
    async performScheduledEvaluation() {
        console.log('Performing scheduled recommendation evaluation...');
        const expiredRecommendations = Array.from(this.recommendations.values())
            .filter(rec => rec.validUntil <= new Date());
        for (const recommendation of expiredRecommendations) {
            this.recommendations.delete(recommendation.id);
            this.emit('recommendationExpired', { recommendationId: recommendation.id });
        }
    }
    generateRecommendationId() {
        return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateBatchId() {
        return `batch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    getRecommendation(recommendationId) {
        return this.recommendations.get(recommendationId) || null;
    }
    getAllRecommendations() {
        return Array.from(this.recommendations.values());
    }
    async shutdown() {
        if (this.evaluationTimer) {
            clearInterval(this.evaluationTimer);
        }
        this.recommendations.clear();
        this.emit('shutdown');
    }
}
exports.AutomatedScalingRecommendationEngine = AutomatedScalingRecommendationEngine;
class DecisionEngine {
    config;
    constructor(config) {
        this.config = config;
    }
    async updateModel(recommendation, feedback) {
        console.log(`Updating decision model based on feedback for recommendation ${recommendation.id}`);
    }
}
class RiskAssessor {
    riskTolerance;
    constructor(riskTolerance) {
        this.riskTolerance = riskTolerance;
    }
    assessScalingRisk(action, currentCapacity, targetCapacity) {
        const capacityChange = Math.abs(targetCapacity - currentCapacity) / currentCapacity;
        let baseRisk = capacityChange * 0.5;
        if (action === 'scale_down') {
            baseRisk *= 1.5;
        }
        const riskMultipliers = { low: 1.2, medium: 1.0, high: 0.8 };
        return Math.min(1.0, baseRisk * riskMultipliers[this.riskTolerance]);
    }
}
class CostOptimizer {
    async analyzeCosts(context) {
        const currentCost = context.inventory.costs.monthly * (context.inventory.specifications.cpu.cores || 1);
        const potentialSavings = currentCost * 0.3;
        const optimizations = [];
        if (context.currentMetrics.cpu.usage < 50) {
            optimizations.push({
                target: { cpu: context.inventory.specifications.cpu.cores * 0.75 },
                reasoning: 'CPU utilization consistently below 50% - right-sizing opportunity',
                performanceImpact: -10,
                costSavings: potentialSavings * 0.6,
                risk: 0.2,
                confidence: 0.8,
                steps: [{
                        order: 1,
                        description: 'Analyze historical CPU patterns',
                        action: 'analyze_patterns',
                        estimatedDuration: 300000,
                        risk: 'low'
                    }]
            });
        }
        return { potentialSavings, optimizations };
    }
}
class PerformanceAnalyzer {
    async analyze(context) {
        const bottlenecks = [];
        if (context.currentMetrics.cpu.usage > 80) {
            bottlenecks.push({
                type: 'cpu',
                severity: 'high',
                description: 'CPU utilization consistently above 80%',
                recommendedAction: 'scale_up',
                target: { cpu: context.inventory.specifications.cpu.cores * 1.5 },
                expectedImprovement: 30,
                estimatedCost: 200,
                risk: 0.1,
                confidence: 0.9,
                immediateSteps: [{
                        order: 1,
                        description: 'Monitor CPU hotspots',
                        action: 'monitor_cpu',
                        estimatedDuration: 300000,
                        risk: 'low'
                    }],
                shortTermSteps: [{
                        order: 1,
                        description: 'Scale CPU resources',
                        action: 'scale_cpu',
                        estimatedDuration: 600000,
                        risk: 'medium'
                    }],
                longTermSteps: []
            });
        }
        return { bottlenecks };
    }
}
