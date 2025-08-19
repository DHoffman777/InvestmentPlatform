"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceEfficiencyAnalyticsService = void 0;
const events_1 = require("events");
const ResourceDataModel_1 = require("./ResourceDataModel");
class ResourceEfficiencyAnalyticsService extends events_1.EventEmitter {
    config;
    benchmarks = new Map();
    insights = new Map();
    wasteAnalyses = new Map();
    optimizationOpportunities = new Map();
    analysisScheduler;
    constructor(config) {
        super();
        this.config = config;
        this.initializeBenchmarks();
        this.startAnalysisScheduler();
    }
    async analyzeResourceEfficiency(snapshot) {
        const efficiency = await this.calculateEfficiencyScore(snapshot);
        const benchmarks = await this.getBenchmarks(snapshot.resourceType);
        const wasteAnalysis = await this.analyzeWaste(snapshot);
        const opportunities = await this.identifyOptimizationOpportunities(snapshot);
        const resourceEfficiency = {
            score: efficiency.overall,
            breakdown: efficiency.breakdown,
            benchmarks: {
                industry: benchmarks.industry.average,
                internal: benchmarks.internal.average,
                target: benchmarks.target
            },
            improvements: {
                potential: this.calculateImprovementPotential(efficiency, benchmarks),
                priority: this.determineImprovementPriority(efficiency, wasteAnalysis),
                estimated_savings: wasteAnalysis.totalWaste,
                effort_required: this.estimateEffort(opportunities)
            },
            waste: {
                over_provisioned: wasteAnalysis.wasteBreakdown.overProvisioned.percentage,
                under_utilized: wasteAnalysis.wasteBreakdown.underUtilized.percentage,
                idle_resources: wasteAnalysis.wasteBreakdown.idle.percentage,
                inefficient_allocation: wasteAnalysis.wasteBreakdown.inefficientAllocation.percentage
            }
        };
        // Generate insights
        const insights = await this.generateEfficiencyInsights(snapshot, resourceEfficiency, wasteAnalysis);
        this.storeInsights(snapshot.resourceId, insights);
        // Store waste analysis
        this.storeWasteAnalysis(snapshot.resourceId, wasteAnalysis);
        // Store optimization opportunities
        this.storeOptimizationOpportunities(snapshot.resourceId, opportunities);
        this.emit('efficiencyAnalyzed', {
            resourceId: snapshot.resourceId,
            efficiency: resourceEfficiency,
            insights: insights.length,
            opportunities: opportunities.length,
            timestamp: new Date()
        });
        return resourceEfficiency;
    }
    async calculateEfficiencyScore(snapshot) {
        // Calculate utilization efficiency (0-1 scale)
        const utilizationScore = this.calculateUtilizationEfficiency(snapshot.utilization);
        // Calculate performance efficiency
        const performanceScore = this.calculatePerformanceEfficiency(snapshot);
        // Calculate cost efficiency
        const costScore = this.config.costAnalysisEnabled
            ? await this.calculateCostEfficiency(snapshot)
            : 0.8; // Default if cost analysis disabled
        // Calculate reliability efficiency
        const reliabilityScore = this.calculateReliabilityEfficiency(snapshot.health);
        const breakdown = {
            utilization: utilizationScore,
            performance: performanceScore,
            cost: costScore,
            reliability: reliabilityScore
        };
        // Weighted overall score
        const weights = { utilization: 0.3, performance: 0.25, cost: 0.25, reliability: 0.2 };
        const overall = (breakdown.utilization * weights.utilization +
            breakdown.performance * weights.performance +
            breakdown.cost * weights.cost +
            breakdown.reliability * weights.reliability);
        return { overall, breakdown };
    }
    calculateUtilizationEfficiency(utilization) {
        // Ideal utilization range is 70-85% for most resources
        const idealRange = { min: 0.7, max: 0.85 };
        const scores = [
            this.scoreUtilization(utilization.cpu, idealRange),
            this.scoreUtilization(utilization.memory, idealRange),
            this.scoreUtilization(utilization.storage, idealRange),
            this.scoreUtilization(utilization.network, idealRange)
        ].filter(score => score > 0); // Filter out zero values
        return scores.length > 0 ? scores.reduce((sum, score) => sum + score, 0) / scores.length : 0;
    }
    scoreUtilization(usage, idealRange) {
        if (usage === 0)
            return 0; // Resource not in use
        if (usage >= idealRange.min && usage <= idealRange.max) {
            return 1.0; // Optimal usage
        }
        else if (usage < idealRange.min) {
            // Under-utilized - linear penalty
            return usage / idealRange.min;
        }
        else {
            // Over-utilized - exponential penalty
            const excess = usage - idealRange.max;
            return Math.max(0, 1 - (excess * 2));
        }
    }
    calculatePerformanceEfficiency(snapshot) {
        // Calculate performance efficiency based on response times, throughput, etc.
        const performanceMetrics = snapshot.metrics.filter(m => m.metricType === ResourceDataModel_1.ResourceMetricType.APP_RESPONSE_TIME ||
            m.metricType === ResourceDataModel_1.ResourceMetricType.APP_THROUGHPUT ||
            m.metricType === ResourceDataModel_1.ResourceMetricType.DB_QUERY_EXECUTION_TIME);
        if (performanceMetrics.length === 0) {
            return 0.8; // Default performance score
        }
        // Implement performance scoring logic
        let performanceScore = 0.8;
        // Check response time metrics
        const responseTimeMetrics = performanceMetrics.filter(m => m.metricType === ResourceDataModel_1.ResourceMetricType.APP_RESPONSE_TIME);
        if (responseTimeMetrics.length > 0) {
            const avgResponseTime = responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length;
            // Assume target response time is 500ms
            const targetResponseTime = 500;
            performanceScore *= Math.max(0.1, Math.min(1, targetResponseTime / avgResponseTime));
        }
        return Math.min(1, performanceScore);
    }
    async calculateCostEfficiency(snapshot) {
        // Calculate cost per unit of work/output
        const costData = await this.getCostData(snapshot.resourceId);
        if (!costData) {
            return 0.8; // Default if no cost data
        }
        // Calculate cost efficiency metrics
        const utilizationCostRatio = snapshot.utilization.overall / (costData.costs.total.amount / 1000);
        const industryBenchmark = 0.75; // Benchmark cost efficiency
        return Math.min(1, utilizationCostRatio / industryBenchmark);
    }
    calculateReliabilityEfficiency(health) {
        // Convert health score to efficiency score
        return health.score;
    }
    async analyzeWaste(snapshot) {
        const overProvisionedAnalysis = this.analyzeOverProvisioning(snapshot);
        const underUtilizedAnalysis = this.analyzeUnderUtilization(snapshot);
        const idleAnalysis = this.analyzeIdleResources(snapshot);
        const inefficientAllocationAnalysis = this.analyzeInefficientAllocation(snapshot);
        const totalWaste = (overProvisionedAnalysis.amount +
            underUtilizedAnalysis.amount +
            idleAnalysis.amount +
            inefficientAllocationAnalysis.amount);
        return {
            resourceId: snapshot.resourceId,
            totalWaste,
            wasteBreakdown: {
                overProvisioned: overProvisionedAnalysis,
                underUtilized: underUtilizedAnalysis,
                idle: idleAnalysis,
                inefficientAllocation: inefficientAllocationAnalysis
            },
            recommendations: this.generateWasteRecommendations(snapshot, {
                overProvisionedAnalysis,
                underUtilizedAnalysis,
                idleAnalysis,
                inefficientAllocationAnalysis
            }),
            timestamp: new Date()
        };
    }
    analyzeOverProvisioning(snapshot) {
        const resources = [];
        let totalWaste = 0;
        // Check CPU over-provisioning
        if (snapshot.utilization.cpu < this.config.wasteThresholds.overProvisioned) {
            const cpuWaste = (this.config.wasteThresholds.overProvisioned - snapshot.utilization.cpu) * 100;
            resources.push({
                type: ResourceDataModel_1.ResourceType.CPU,
                allocated: 100,
                used: snapshot.utilization.cpu * 100,
                waste: cpuWaste
            });
            totalWaste += cpuWaste;
        }
        // Check memory over-provisioning
        if (snapshot.utilization.memory < this.config.wasteThresholds.overProvisioned) {
            const memoryWaste = (this.config.wasteThresholds.overProvisioned - snapshot.utilization.memory) * 100;
            resources.push({
                type: ResourceDataModel_1.ResourceType.MEMORY,
                allocated: 100,
                used: snapshot.utilization.memory * 100,
                waste: memoryWaste
            });
            totalWaste += memoryWaste;
        }
        return {
            amount: totalWaste,
            percentage: totalWaste > 0 ? (totalWaste / (resources.length * 100)) * 100 : 0,
            resources
        };
    }
    analyzeUnderUtilization(snapshot) {
        const resources = [];
        let totalUnderUtilization = 0;
        const utilizationMetrics = [
            { type: ResourceDataModel_1.ResourceType.CPU, usage: snapshot.utilization.cpu, capacity: 1 },
            { type: ResourceDataModel_1.ResourceType.MEMORY, usage: snapshot.utilization.memory, capacity: 1 },
            { type: ResourceDataModel_1.ResourceType.STORAGE, usage: snapshot.utilization.storage, capacity: 1 },
            { type: ResourceDataModel_1.ResourceType.NETWORK, usage: snapshot.utilization.network, capacity: 1 }
        ];
        for (const metric of utilizationMetrics) {
            if (metric.usage < this.config.wasteThresholds.underUtilized && metric.usage > 0) {
                const efficiency = metric.usage / metric.capacity;
                resources.push({
                    type: metric.type,
                    capacity: metric.capacity * 100,
                    usage: metric.usage * 100,
                    efficiency
                });
                totalUnderUtilization += (1 - efficiency) * 100;
            }
        }
        return {
            amount: totalUnderUtilization,
            percentage: totalUnderUtilization > 0 ? (totalUnderUtilization / (resources.length * 100)) * 100 : 0,
            resources
        };
    }
    analyzeIdleResources(snapshot) {
        const isIdle = snapshot.utilization.overall < this.config.wasteThresholds.idle;
        const idleDuration = isIdle ? 3600000 : 0; // 1 hour if idle
        const costImpact = isIdle ? 100 : 0; // Estimated cost impact
        return {
            amount: isIdle ? 100 : 0,
            percentage: isIdle ? 100 : 0,
            duration: idleDuration,
            cost_impact: costImpact
        };
    }
    analyzeInefficientAllocation(snapshot) {
        const misallocations = [];
        let totalInefficiency = 0;
        // Analyze CPU allocation efficiency
        const optimalCpuAllocation = this.calculateOptimalAllocation(snapshot.utilization.cpu, ResourceDataModel_1.ResourceType.CPU);
        if (Math.abs(optimalCpuAllocation - 100) > 10) {
            misallocations.push({
                resource: 'cpu',
                current: 100,
                optimal: optimalCpuAllocation,
                waste: Math.abs(100 - optimalCpuAllocation)
            });
            totalInefficiency += Math.abs(100 - optimalCpuAllocation);
        }
        // Analyze memory allocation efficiency
        const optimalMemoryAllocation = this.calculateOptimalAllocation(snapshot.utilization.memory, ResourceDataModel_1.ResourceType.MEMORY);
        if (Math.abs(optimalMemoryAllocation - 100) > 10) {
            misallocations.push({
                resource: 'memory',
                current: 100,
                optimal: optimalMemoryAllocation,
                waste: Math.abs(100 - optimalMemoryAllocation)
            });
            totalInefficiency += Math.abs(100 - optimalMemoryAllocation);
        }
        return {
            amount: totalInefficiency,
            percentage: totalInefficiency > 0 ? (totalInefficiency / (misallocations.length * 100)) * 100 : 0,
            misallocations
        };
    }
    calculateOptimalAllocation(currentUtilization, resourceType) {
        // Calculate optimal allocation based on utilization patterns
        const targetUtilization = this.config.efficiencyTargets[resourceType.toString()] || 0.8;
        return Math.ceil((currentUtilization / targetUtilization) * 100);
    }
    generateWasteRecommendations(snapshot, wasteData) {
        const recommendations = [];
        if (wasteData.overProvisionedAnalysis.amount > 0) {
            recommendations.push({
                action: 'Reduce over-provisioned resources',
                impact: wasteData.overProvisionedAnalysis.amount,
                effort: 'low',
                priority: 90
            });
        }
        if (wasteData.underUtilizedAnalysis.amount > 0) {
            recommendations.push({
                action: 'Optimize resource utilization',
                impact: wasteData.underUtilizedAnalysis.amount,
                effort: 'medium',
                priority: 70
            });
        }
        if (wasteData.idleAnalysis.amount > 0) {
            recommendations.push({
                action: 'Schedule or terminate idle resources',
                impact: wasteData.idleAnalysis.amount,
                effort: 'low',
                priority: 95
            });
        }
        return recommendations.sort((a, b) => b.priority - a.priority);
    }
    async identifyOptimizationOpportunities(snapshot) {
        const opportunities = [];
        // Rightsizing opportunity
        const rightsizingOpp = await this.analyzeRightsizingOpportunity(snapshot);
        if (rightsizingOpp) {
            opportunities.push(rightsizingOpp);
        }
        // Consolidation opportunity
        const consolidationOpp = await this.analyzeConsolidationOpportunity(snapshot);
        if (consolidationOpp) {
            opportunities.push(consolidationOpp);
        }
        // Scheduling opportunity
        const schedulingOpp = await this.analyzeSchedulingOpportunity(snapshot);
        if (schedulingOpp) {
            opportunities.push(schedulingOpp);
        }
        return opportunities.sort((a, b) => b.priority - a.priority);
    }
    async analyzeRightsizingOpportunity(snapshot) {
        const utilizationThreshold = 0.3; // 30% utilization threshold
        if (snapshot.utilization.overall < utilizationThreshold) {
            return {
                id: this.generateOpportunityId(),
                resourceId: snapshot.resourceId,
                type: 'rightsizing',
                title: 'Rightsize under-utilized resource',
                description: `Resource is only ${(snapshot.utilization.overall * 100).toFixed(1)}% utilized. Consider downsizing.`,
                currentState: {
                    configuration: { size: 'current' },
                    utilization: snapshot.utilization.overall,
                    cost: 1000, // Estimated current cost
                    performance: 0.8
                },
                proposedState: {
                    configuration: { size: 'smaller' },
                    utilization: snapshot.utilization.overall / 0.7, // Target 70% utilization
                    cost: 700, // Estimated new cost
                    performance: 0.8
                },
                benefits: {
                    cost_reduction: 300,
                    performance_improvement: 0,
                    efficiency_gain: 0.4,
                    risk_mitigation: 0.1
                },
                implementation: {
                    complexity: 'low',
                    timeline: '1-2 weeks',
                    steps: ['Analyze workload patterns', 'Schedule maintenance window', 'Resize resource', 'Monitor performance'],
                    risks: ['Potential performance impact during peak loads'],
                    dependencies: ['Maintenance window approval']
                },
                roi: {
                    investment: 1000,
                    annual_savings: 3600,
                    payback_period_months: 3,
                    net_present_value: 10800
                },
                confidence: 0.85,
                priority: 80,
                created_at: new Date()
            };
        }
        return null;
    }
    async analyzeConsolidationOpportunity(snapshot) {
        // Analyze if multiple resources can be consolidated
        if (snapshot.utilization.overall < 0.5) {
            return {
                id: this.generateOpportunityId(),
                resourceId: snapshot.resourceId,
                type: 'consolidation',
                title: 'Consolidate with other resources',
                description: 'Low utilization suggests this resource could be consolidated with others.',
                currentState: {
                    configuration: { instances: 1 },
                    utilization: snapshot.utilization.overall,
                    cost: 1000,
                    performance: 0.8
                },
                proposedState: {
                    configuration: { instances: 0.5 },
                    utilization: snapshot.utilization.overall * 2,
                    cost: 500,
                    performance: 0.8
                },
                benefits: {
                    cost_reduction: 500,
                    performance_improvement: 0,
                    efficiency_gain: 0.5,
                    risk_mitigation: 0.2
                },
                implementation: {
                    complexity: 'medium',
                    timeline: '2-4 weeks',
                    steps: ['Identify consolidation candidates', 'Plan migration', 'Execute consolidation', 'Validate performance'],
                    risks: ['Resource contention', 'Migration complexity'],
                    dependencies: ['Other low-utilization resources']
                },
                roi: {
                    investment: 2000,
                    annual_savings: 6000,
                    payback_period_months: 4,
                    net_present_value: 16000
                },
                confidence: 0.7,
                priority: 70,
                created_at: new Date()
            };
        }
        return null;
    }
    async analyzeSchedulingOpportunity(snapshot) {
        // Analyze if resource can be scheduled on/off based on usage patterns
        const hasUsagePattern = snapshot.trends && snapshot.trends.seasonal.length > 0;
        if (hasUsagePattern && snapshot.utilization.overall < 0.8) {
            return {
                id: this.generateOpportunityId(),
                resourceId: snapshot.resourceId,
                type: 'scheduling',
                title: 'Implement scheduled scaling',
                description: 'Usage patterns suggest resource can be scheduled for optimal efficiency.',
                currentState: {
                    configuration: { schedule: 'always_on' },
                    utilization: snapshot.utilization.overall,
                    cost: 1000,
                    performance: 0.8
                },
                proposedState: {
                    configuration: { schedule: 'business_hours' },
                    utilization: snapshot.utilization.overall * 1.5,
                    cost: 650,
                    performance: 0.8
                },
                benefits: {
                    cost_reduction: 350,
                    performance_improvement: 0,
                    efficiency_gain: 0.3,
                    risk_mitigation: 0.1
                },
                implementation: {
                    complexity: 'low',
                    timeline: '1 week',
                    steps: ['Configure auto-scaling rules', 'Set up monitoring', 'Test scheduling', 'Deploy to production'],
                    risks: ['Startup delays', 'Scheduling conflicts'],
                    dependencies: ['Auto-scaling infrastructure']
                },
                roi: {
                    investment: 500,
                    annual_savings: 4200,
                    payback_period_months: 1.4,
                    net_present_value: 12100
                },
                confidence: 0.8,
                priority: 75,
                created_at: new Date()
            };
        }
        return null;
    }
    async generateEfficiencyInsights(snapshot, efficiency, wasteAnalysis) {
        const insights = [];
        // Low efficiency insight
        if (efficiency.score < 0.6) {
            insights.push({
                id: this.generateInsightId(),
                resourceId: snapshot.resourceId,
                type: 'optimization_opportunity',
                severity: efficiency.score < 0.4 ? 'critical' : 'high',
                title: 'Low Resource Efficiency Detected',
                description: `Resource efficiency is ${(efficiency.score * 100).toFixed(1)}%, below optimal levels.`,
                impact: {
                    efficiency_improvement: (0.8 - efficiency.score) * 100,
                    cost_savings: wasteAnalysis.totalWaste,
                    performance_gain: 20,
                    risk_reduction: 15
                },
                evidence: {
                    metrics: ['utilization', 'cost', 'performance'],
                    timeRange: { start: new Date(Date.now() - 3600000), end: new Date() },
                    data_points: snapshot.metrics.length,
                    confidence: 0.85
                },
                recommendations: [
                    'Review resource allocation',
                    'Implement auto-scaling',
                    'Consider rightsizing',
                    'Optimize workload patterns'
                ],
                priority_score: efficiency.score < 0.4 ? 95 : 80,
                created_at: new Date()
            });
        }
        // Waste detection insight
        if (wasteAnalysis.totalWaste > 20) {
            insights.push({
                id: this.generateInsightId(),
                resourceId: snapshot.resourceId,
                type: 'waste_detection',
                severity: wasteAnalysis.totalWaste > 50 ? 'high' : 'medium',
                title: 'Resource Waste Detected',
                description: `${wasteAnalysis.totalWaste.toFixed(1)}% resource waste identified across multiple categories.`,
                impact: {
                    efficiency_improvement: wasteAnalysis.totalWaste,
                    cost_savings: wasteAnalysis.totalWaste * 10, // $10 per % waste
                    performance_gain: 0,
                    risk_reduction: 5
                },
                evidence: {
                    metrics: ['cpu_utilization', 'memory_utilization', 'storage_utilization'],
                    timeRange: { start: new Date(Date.now() - 3600000), end: new Date() },
                    data_points: snapshot.metrics.length,
                    confidence: 0.9
                },
                recommendations: wasteAnalysis.recommendations.map(r => r.action),
                priority_score: wasteAnalysis.totalWaste > 50 ? 90 : 70,
                created_at: new Date()
            });
        }
        // Benchmark comparison insight
        const benchmark = await this.getBenchmarks(snapshot.resourceType);
        if (efficiency.score < benchmark.industry.average * 0.8) {
            insights.push({
                id: this.generateInsightId(),
                resourceId: snapshot.resourceId,
                type: 'benchmark_comparison',
                severity: 'medium',
                title: 'Below Industry Benchmark',
                description: `Resource efficiency is ${((1 - efficiency.score / benchmark.industry.average) * 100).toFixed(1)}% below industry average.`,
                impact: {
                    efficiency_improvement: (benchmark.industry.average - efficiency.score) * 100,
                    cost_savings: 200,
                    performance_gain: 10,
                    risk_reduction: 20
                },
                evidence: {
                    metrics: ['efficiency_score', 'industry_benchmark'],
                    timeRange: { start: new Date(Date.now() - 86400000), end: new Date() },
                    data_points: 100,
                    confidence: 0.75
                },
                recommendations: [
                    'Review industry best practices',
                    'Implement efficiency improvements',
                    'Benchmark against top performers'
                ],
                priority_score: 65,
                created_at: new Date()
            });
        }
        return insights;
    }
    async getBenchmarks(resourceType) {
        let benchmark = this.benchmarks.get(resourceType);
        if (!benchmark) {
            // Create default benchmark
            benchmark = {
                resourceType,
                industry: {
                    average: 0.75,
                    p50: 0.72,
                    p75: 0.82,
                    p90: 0.89,
                    p95: 0.93
                },
                internal: {
                    average: 0.68,
                    best: 0.91,
                    worst: 0.42,
                    variance: 0.15
                },
                target: 0.85,
                lastUpdated: new Date(),
                sampleSize: 1000
            };
            this.benchmarks.set(resourceType, benchmark);
        }
        return benchmark;
    }
    initializeBenchmarks() {
        // Initialize default benchmarks for different resource types
        const resourceTypes = Object.values(ResourceDataModel_1.ResourceType);
        for (const resourceType of resourceTypes) {
            this.benchmarks.set(resourceType, {
                resourceType,
                industry: {
                    average: 0.75,
                    p50: 0.72,
                    p75: 0.82,
                    p90: 0.89,
                    p95: 0.93
                },
                internal: {
                    average: 0.68,
                    best: 0.91,
                    worst: 0.42,
                    variance: 0.15
                },
                target: 0.85,
                lastUpdated: new Date(),
                sampleSize: 1000
            });
        }
    }
    startAnalysisScheduler() {
        this.analysisScheduler = setInterval(async () => {
            try {
                await this.runScheduledAnalysis();
            }
            catch (error) {
                console.error('Scheduled efficiency analysis failed:', error.message);
            }
        }, this.config.analysisInterval);
    }
    async runScheduledAnalysis() {
        // Update benchmarks
        if (this.config.enableBenchmarking) {
            await this.updateBenchmarks();
        }
        // Clean up expired insights
        await this.cleanupExpiredInsights();
        this.emit('analysisCompleted', {
            timestamp: new Date(),
            benchmarks_updated: this.config.enableBenchmarking,
            insights_cleaned: true
        });
    }
    async updateBenchmarks() {
        // Implementation for updating industry and internal benchmarks
        for (const [resourceType, benchmark] of this.benchmarks) {
            // Simulate benchmark updates
            benchmark.lastUpdated = new Date();
            benchmark.sampleSize += Math.floor(Math.random() * 100);
            // Small variations in benchmarks
            const variation = (Math.random() - 0.5) * 0.02; // ±1% variation
            benchmark.industry.average = Math.max(0.5, Math.min(0.95, benchmark.industry.average + variation));
        }
    }
    async cleanupExpiredInsights() {
        const now = new Date();
        for (const [resourceId, insights] of this.insights) {
            const validInsights = insights.filter(insight => !insight.expires_at || insight.expires_at > now);
            if (validInsights.length !== insights.length) {
                this.insights.set(resourceId, validInsights);
            }
        }
    }
    // Storage methods
    storeInsights(resourceId, insights) {
        if (!this.insights.has(resourceId)) {
            this.insights.set(resourceId, []);
        }
        const existingInsights = this.insights.get(resourceId);
        existingInsights.push(...insights);
        // Keep only last 50 insights per resource
        if (existingInsights.length > 50) {
            existingInsights.splice(0, existingInsights.length - 50);
        }
    }
    storeWasteAnalysis(resourceId, analysis) {
        if (!this.wasteAnalyses.has(resourceId)) {
            this.wasteAnalyses.set(resourceId, []);
        }
        const analyses = this.wasteAnalyses.get(resourceId);
        analyses.push(analysis);
        // Keep only last 10 analyses
        if (analyses.length > 10) {
            analyses.splice(0, analyses.length - 10);
        }
    }
    storeOptimizationOpportunities(resourceId, opportunities) {
        this.optimizationOpportunities.set(resourceId, opportunities);
    }
    // Getter methods
    getInsights(resourceId) {
        return this.insights.get(resourceId) || [];
    }
    getWasteAnalyses(resourceId) {
        return this.wasteAnalyses.get(resourceId) || [];
    }
    getOptimizationOpportunities(resourceId) {
        return this.optimizationOpportunities.get(resourceId) || [];
    }
    getBenchmark(resourceType) {
        return this.benchmarks.get(resourceType);
    }
    // Helper methods
    generateInsightId() {
        return `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateOpportunityId() {
        return `opportunity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    calculateImprovementPotential(efficiency, benchmarks) {
        return Math.max(0, (benchmarks.target - efficiency.overall) * 100);
    }
    determineImprovementPriority(efficiency, wasteAnalysis) {
        if (efficiency.overall < 0.4 || wasteAnalysis.totalWaste > 60)
            return 'critical';
        if (efficiency.overall < 0.6 || wasteAnalysis.totalWaste > 40)
            return 'high';
        if (efficiency.overall < 0.75 || wasteAnalysis.totalWaste > 20)
            return 'medium';
        return 'low';
    }
    estimateEffort(opportunities) {
        if (opportunities.length === 0)
            return 'low';
        const complexities = opportunities.map(o => o.implementation.complexity);
        const highComplexityCount = complexities.filter(c => c === 'high').length;
        const mediumComplexityCount = complexities.filter(c => c === 'medium').length;
        if (highComplexityCount > 0)
            return 'high';
        if (mediumComplexityCount > opportunities.length / 2)
            return 'medium';
        return 'low';
    }
    async getCostData(resourceId) {
        // Implementation would fetch actual cost data
        return null;
    }
    async shutdown() {
        if (this.analysisScheduler) {
            clearInterval(this.analysisScheduler);
        }
        this.emit('shutdown');
    }
}
exports.ResourceEfficiencyAnalyticsService = ResourceEfficiencyAnalyticsService;
