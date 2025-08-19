"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CapacityPlanningService = void 0;
const events_1 = require("events");
class CapacityPlanningService extends events_1.EventEmitter {
    planningResults = new Map();
    // Base costs per unit (monthly, in USD)
    baseCosts = {
        cpuCoreHour: 0.05, // Per CPU core per hour
        memoryGBHour: 0.01, // Per GB RAM per hour
        storageGBMonth: 0.10, // Per GB storage per month
        networkGBMonth: 0.02, // Per GB network transfer per month
        serverInstanceMonth: 100, // Base server cost per month
        monitoringMonth: 50, // Monitoring costs per server per month
        backupGBMonth: 0.05, // Backup storage per GB per month
        supportEngineersMonth: 8000, // Support engineer salary per month
        licensingPerCoreMonth: 20, // Software licensing per core per month
    };
    constructor() {
        super();
    }
    async generateCapacityPlan(config) {
        const planId = this.generatePlanId();
        try {
            const result = {
                id: planId,
                config,
                generatedAt: new Date(),
                projections: {
                    timeline: [],
                    bottlenecks: [],
                    scalingRecommendations: [],
                    costProjections: [],
                },
                scenarios: [],
                riskAssessment: {
                    overallRisk: 'LOW',
                    risks: [],
                },
            };
            // Generate projections
            result.projections.timeline = this.generateCapacityProjections(config);
            result.projections.bottlenecks = this.analyzeBottlenecks(result.projections.timeline, config);
            result.projections.scalingRecommendations = this.generateScalingRecommendations(result.projections.timeline, result.projections.bottlenecks, config);
            result.projections.costProjections = this.generateCostProjections(result.projections.timeline, config);
            // Generate scenarios
            result.scenarios = this.generateCapacityScenarios(config);
            // Perform risk assessment
            result.riskAssessment = this.assessRisks(result, config);
            this.planningResults.set(planId, result);
            this.emit('planGenerated', { planId, result });
            return planId;
        }
        catch (error) {
            this.emit('planError', { planId, error: error.message });
            throw error;
        }
    }
    generateCapacityProjections(config) {
        const projections = [];
        const startDate = new Date();
        // Baseline metrics
        let currentUsers = 1000; // Assumed baseline
        let currentRequestsPerSecond = 50; // Assumed baseline
        for (let month = 0; month < config.growthProjections.planningHorizon; month++) {
            const projectionDate = new Date(startDate);
            projectionDate.setMonth(projectionDate.getMonth() + month);
            // Apply growth rates
            const userGrowthFactor = Math.pow(1 + config.growthProjections.userGrowthRate / 100, month);
            const requestGrowthFactor = Math.pow(1 + config.growthProjections.requestGrowthRate / 100, month);
            const projectedUsers = Math.round(currentUsers * userGrowthFactor);
            const projectedRPS = Math.round(currentRequestsPerSecond * requestGrowthFactor);
            // Apply seasonality
            const seasonalityMultiplier = this.getSeasonalityMultiplier(projectionDate, config);
            const seasonalRPS = Math.round(projectedRPS * seasonalityMultiplier);
            // Calculate required capacity
            const requiredCapacity = this.calculateRequiredCapacity(projectedUsers, seasonalRPS, config);
            // Calculate utilization projections
            const utilizationProjections = this.calculateUtilizationProjections(requiredCapacity, config.currentCapacity);
            projections.push({
                month: projectionDate,
                expectedUsers: projectedUsers,
                expectedRequestsPerSecond: seasonalRPS,
                requiredCapacity,
                utilizationProjections,
            });
        }
        return projections;
    }
    getSeasonalityMultiplier(date, config) {
        const month = date.getMonth() + 1; // 1-12
        const seasonality = config.businessPatterns.seasonality.find(s => s.month === month);
        return seasonality?.multiplier || 1.0;
    }
    calculateRequiredCapacity(users, rps, config) {
        // Simple capacity calculation based on load patterns
        const cpuUtilizationPerRPS = 0.1; // 10% CPU utilization per RPS
        const memoryUtilizationPerUser = 2; // 2MB per active user
        const networkUtilizationPerRPS = 0.5; // 0.5 Mbps per RPS
        const storageGrowthPerUser = 10; // 10MB storage per user
        const requiredCpuCores = Math.ceil((rps * cpuUtilizationPerRPS) / (config.targetMetrics.maxCpuUtilization / 100));
        const requiredMemoryGB = Math.ceil((users * memoryUtilizationPerUser) / 1024); // Convert MB to GB
        const requiredNetworkMbps = Math.ceil(rps * networkUtilizationPerRPS);
        const requiredStorageGB = Math.ceil((users * storageGrowthPerUser) / 1024); // Convert MB to GB
        const requiredServers = Math.ceil(Math.max(requiredCpuCores / 8, // Assuming 8 cores per server
        requiredMemoryGB / 32, // Assuming 32GB per server
        requiredNetworkMbps / 1000 // Assuming 1Gbps per server
        ));
        return {
            servers: requiredServers,
            cpuCores: requiredCpuCores,
            memoryGB: requiredMemoryGB,
            networkMbps: requiredNetworkMbps,
            storageGB: requiredStorageGB,
        };
    }
    calculateUtilizationProjections(requiredCapacity, currentCapacity) {
        return {
            cpu: Math.min((requiredCapacity.cpuCores / currentCapacity.cpuCores) * 100, 100),
            memory: Math.min((requiredCapacity.memoryGB / currentCapacity.memoryGB) * 100, 100),
            network: Math.min((requiredCapacity.networkMbps / currentCapacity.networkMbps) * 100, 100),
            storage: Math.min((requiredCapacity.storageGB / (currentCapacity.memoryGB * 4)) * 100, 100), // Estimate storage capacity
        };
    }
    analyzeBottlenecks(projections, config) {
        const bottlenecks = [];
        for (const projection of projections) {
            // Check CPU bottleneck
            if (projection.utilizationProjections.cpu > config.targetMetrics.maxCpuUtilization) {
                bottlenecks.push({
                    resource: 'CPU',
                    severity: this.getSeverity(projection.utilizationProjections.cpu),
                    expectedTime: projection.month,
                    currentUtilization: projection.utilizationProjections.cpu / projections.length, // Average
                    projectedUtilization: projection.utilizationProjections.cpu,
                    impact: 'Application performance degradation, increased response times',
                    mitigation: [
                        'Add more CPU cores to existing servers',
                        'Scale horizontally with additional servers',
                        'Optimize application code for better CPU efficiency',
                        'Implement CPU-efficient caching strategies',
                    ],
                });
            }
            // Check Memory bottleneck
            if (projection.utilizationProjections.memory > config.targetMetrics.maxMemoryUtilization) {
                bottlenecks.push({
                    resource: 'MEMORY',
                    severity: this.getSeverity(projection.utilizationProjections.memory),
                    expectedTime: projection.month,
                    currentUtilization: projection.utilizationProjections.memory / projections.length,
                    projectedUtilization: projection.utilizationProjections.memory,
                    impact: 'Memory pressure, potential OOM errors, application instability',
                    mitigation: [
                        'Increase memory capacity on existing servers',
                        'Add more servers to distribute memory load',
                        'Optimize application memory usage',
                        'Implement memory-efficient data structures',
                    ],
                });
            }
            // Check Network bottleneck
            if (projection.utilizationProjections.network > 80) { // 80% network utilization threshold
                bottlenecks.push({
                    resource: 'NETWORK',
                    severity: this.getSeverity(projection.utilizationProjections.network),
                    expectedTime: projection.month,
                    currentUtilization: projection.utilizationProjections.network / projections.length,
                    projectedUtilization: projection.utilizationProjections.network,
                    impact: 'Network congestion, increased latency, potential timeouts',
                    mitigation: [
                        'Upgrade network infrastructure',
                        'Implement CDN for static assets',
                        'Optimize data transfer protocols',
                        'Add load balancers with better network capacity',
                    ],
                });
            }
            // Check Storage bottleneck
            if (projection.utilizationProjections.storage > 85) { // 85% storage utilization threshold
                bottlenecks.push({
                    resource: 'STORAGE',
                    severity: this.getSeverity(projection.utilizationProjections.storage),
                    expectedTime: projection.month,
                    currentUtilization: projection.utilizationProjections.storage / projections.length,
                    projectedUtilization: projection.utilizationProjections.storage,
                    impact: 'Storage space exhaustion, application failures, data loss risk',
                    mitigation: [
                        'Add additional storage capacity',
                        'Implement data archiving strategies',
                        'Optimize data storage efficiency',
                        'Set up automated storage scaling',
                    ],
                });
            }
        }
        return bottlenecks;
    }
    getSeverity(utilization) {
        if (utilization >= 95)
            return 'CRITICAL';
        if (utilization >= 85)
            return 'HIGH';
        if (utilization >= 75)
            return 'MEDIUM';
        return 'LOW';
    }
    generateScalingRecommendations(projections, bottlenecks, config) {
        const recommendations = [];
        // Group bottlenecks by time
        const bottlenecksByTime = new Map();
        for (const bottleneck of bottlenecks) {
            const key = bottleneck.expectedTime.toISOString().substring(0, 7); // YYYY-MM
            const existing = bottlenecksByTime.get(key) || [];
            existing.push(bottleneck);
            bottlenecksByTime.set(key, existing);
        }
        for (const [timeKey, timeBottlenecks] of bottlenecksByTime.entries()) {
            const triggerDate = new Date(timeKey + '-01');
            // Determine scaling strategy based on bottlenecks
            const hasMultipleResourceBottlenecks = timeBottlenecks.length > 1;
            const hasCriticalBottleneck = timeBottlenecks.some(b => b.severity === 'CRITICAL');
            if (hasMultipleResourceBottlenecks || hasCriticalBottleneck) {
                // Horizontal scaling recommendation
                recommendations.push({
                    trigger: triggerDate,
                    type: 'HORIZONTAL',
                    action: `Add ${Math.ceil(timeBottlenecks.length / 2)} additional server instances`,
                    reasoning: `Multiple resource constraints detected (${timeBottlenecks.map(b => b.resource).join(', ')})`,
                    estimatedCost: this.estimateHorizontalScalingCost(Math.ceil(timeBottlenecks.length / 2)),
                    alternatives: [
                        {
                            action: 'Vertical scaling of existing servers',
                            cost: this.estimateVerticalScalingCost(timeBottlenecks),
                            pros: ['Lower operational complexity', 'Faster implementation'],
                            cons: ['Single point of failure', 'Limited scaling potential'],
                        },
                        {
                            action: 'Hybrid approach with targeted upgrades',
                            cost: this.estimateHybridScalingCost(timeBottlenecks),
                            pros: ['Optimized resource allocation', 'Cost-effective'],
                            cons: ['More complex implementation', 'Requires careful planning'],
                        },
                    ],
                });
            }
            else {
                // Vertical scaling recommendation
                const primaryBottleneck = timeBottlenecks[0];
                recommendations.push({
                    trigger: triggerDate,
                    type: 'VERTICAL',
                    action: this.generateVerticalScalingAction(primaryBottleneck),
                    reasoning: `Primary constraint in ${primaryBottleneck.resource} capacity`,
                    estimatedCost: this.estimateVerticalScalingCost([primaryBottleneck]),
                    alternatives: [
                        {
                            action: 'Horizontal scaling with additional servers',
                            cost: this.estimateHorizontalScalingCost(1),
                            pros: ['Better fault tolerance', 'Linear scaling'],
                            cons: ['Higher operational complexity', 'More expensive'],
                        },
                    ],
                });
            }
        }
        return recommendations.sort((a, b) => a.trigger.getTime() - b.trigger.getTime());
    }
    generateVerticalScalingAction(bottleneck) {
        switch (bottleneck.resource) {
            case 'CPU':
                return 'Upgrade to servers with additional CPU cores (double current capacity)';
            case 'MEMORY':
                return 'Increase memory capacity by 50-100% on current servers';
            case 'NETWORK':
                return 'Upgrade network infrastructure to higher bandwidth';
            case 'STORAGE':
                return 'Add additional storage capacity or upgrade to faster storage';
            default:
                return 'Upgrade server capacity for better performance';
        }
    }
    estimateHorizontalScalingCost(additionalServers) {
        return additionalServers * this.baseCosts.serverInstanceMonth;
    }
    estimateVerticalScalingCost(bottlenecks) {
        let cost = 0;
        for (const bottleneck of bottlenecks) {
            switch (bottleneck.resource) {
                case 'CPU':
                    cost += 8 * this.baseCosts.cpuCoreHour * 24 * 30; // 8 additional cores
                    break;
                case 'MEMORY':
                    cost += 32 * this.baseCosts.memoryGBHour * 24 * 30; // 32GB additional memory
                    break;
                case 'STORAGE':
                    cost += 1000 * this.baseCosts.storageGBMonth; // 1TB additional storage
                    break;
                default:
                    cost += this.baseCosts.serverInstanceMonth * 0.5; // 50% upgrade cost
            }
        }
        return cost;
    }
    estimateHybridScalingCost(bottlenecks) {
        const horizontalCost = this.estimateHorizontalScalingCost(1);
        const verticalCost = this.estimateVerticalScalingCost(bottlenecks);
        return (horizontalCost + verticalCost) * 0.75; // 25% efficiency gain
    }
    generateCostProjections(projections, config) {
        return projections.map(projection => {
            const infrastructure = {
                compute: projection.requiredCapacity.servers * this.baseCosts.serverInstanceMonth +
                    projection.requiredCapacity.cpuCores * this.baseCosts.cpuCoreHour * 24 * 30 +
                    projection.requiredCapacity.memoryGB * this.baseCosts.memoryGBHour * 24 * 30,
                storage: projection.requiredCapacity.storageGB * this.baseCosts.storageGBMonth,
                network: projection.expectedRequestsPerSecond * 100 * this.baseCosts.networkGBMonth, // Estimate network usage
                monitoring: projection.requiredCapacity.servers * this.baseCosts.monitoringMonth,
                backup: projection.requiredCapacity.storageGB * 0.3 * this.baseCosts.backupGBMonth, // 30% backup ratio
            };
            const operational = {
                support: Math.ceil(projection.requiredCapacity.servers / 10) * this.baseCosts.supportEngineersMonth,
                maintenance: infrastructure.compute * 0.1, // 10% of compute costs
                licensing: projection.requiredCapacity.cpuCores * this.baseCosts.licensingPerCoreMonth,
            };
            return {
                month: projection.month,
                infrastructure,
                operational,
                total: Object.values(infrastructure).reduce((sum, cost) => sum + cost, 0) +
                    Object.values(operational).reduce((sum, cost) => sum + cost, 0),
            };
        });
    }
    generateCapacityScenarios(config) {
        const scenarios = [];
        // Conservative scenario
        const conservativeConfig = {
            ...config,
            growthProjections: {
                ...config.growthProjections,
                userGrowthRate: config.growthProjections.userGrowthRate * 0.5,
                requestGrowthRate: config.growthProjections.requestGrowthRate * 0.5,
                dataGrowthRate: config.growthProjections.dataGrowthRate * 0.5,
            },
        };
        scenarios.push({
            name: 'Conservative Growth',
            description: 'Lower growth rates with minimal market expansion',
            assumptions: [
                'Market growth slower than expected',
                'Limited new feature adoption',
                'Conservative user acquisition',
            ],
            projections: this.generateCapacityProjections(conservativeConfig),
            confidence: 80,
        });
        // Aggressive scenario
        const aggressiveConfig = {
            ...config,
            growthProjections: {
                ...config.growthProjections,
                userGrowthRate: config.growthProjections.userGrowthRate * 2,
                requestGrowthRate: config.growthProjections.requestGrowthRate * 2,
                dataGrowthRate: config.growthProjections.dataGrowthRate * 2,
            },
        };
        scenarios.push({
            name: 'Aggressive Growth',
            description: 'High growth rates with rapid market expansion',
            assumptions: [
                'Successful market penetration',
                'High new feature adoption',
                'Viral growth patterns',
            ],
            projections: this.generateCapacityProjections(aggressiveConfig),
            confidence: 40,
        });
        // Baseline scenario (original config)
        scenarios.push({
            name: 'Baseline Growth',
            description: 'Expected growth based on current trends',
            assumptions: [
                'Steady market growth',
                'Normal feature adoption',
                'Consistent user acquisition',
            ],
            projections: this.generateCapacityProjections(config),
            confidence: 70,
        });
        return scenarios;
    }
    assessRisks(result, config) {
        const risks = [];
        // Capacity risks
        const criticalBottlenecks = result.projections.bottlenecks.filter(b => b.severity === 'CRITICAL');
        if (criticalBottlenecks.length > 0) {
            risks.push({
                type: 'CAPACITY',
                severity: 'CRITICAL',
                probability: 80,
                impact: 'System overload and potential service outage',
                mitigation: [
                    'Implement early warning systems',
                    'Prepare emergency scaling procedures',
                    'Set up automated scaling triggers',
                ],
                contingency: 'Emergency horizontal scaling with cloud resources',
            });
        }
        // Cost risks
        const highCostMonths = result.projections.costProjections.filter(c => c.total > 50000);
        if (highCostMonths.length > 0) {
            risks.push({
                type: 'COST',
                severity: 'HIGH',
                probability: 60,
                impact: 'Budget overruns and financial constraints',
                mitigation: [
                    'Implement cost monitoring and alerts',
                    'Optimize resource utilization',
                    'Negotiate better pricing with vendors',
                ],
                contingency: 'Scale back non-essential services temporarily',
            });
        }
        // Performance risks
        const responseTimeRisk = config.targetMetrics.maxResponseTime < 500;
        if (responseTimeRisk) {
            risks.push({
                type: 'PERFORMANCE',
                severity: 'MEDIUM',
                probability: 50,
                impact: 'Aggressive response time targets may be difficult to maintain',
                mitigation: [
                    'Implement comprehensive performance monitoring',
                    'Optimize application code proactively',
                    'Set up performance testing pipeline',
                ],
                contingency: 'Adjust response time targets based on actual performance',
            });
        }
        // Technical risks
        const singlePointOfFailure = config.currentCapacity.servers < 3;
        if (singlePointOfFailure) {
            risks.push({
                type: 'TECHNICAL',
                severity: 'HIGH',
                probability: 70,
                impact: 'Limited redundancy increases outage risk',
                mitigation: [
                    'Implement multi-server deployment',
                    'Set up failover mechanisms',
                    'Create comprehensive backup procedures',
                ],
                contingency: 'Emergency server provisioning and data recovery',
            });
        }
        // Determine overall risk
        const overallRisk = risks.some(r => r.severity === 'CRITICAL') ? 'CRITICAL' :
            risks.some(r => r.severity === 'HIGH') ? 'HIGH' :
                risks.some(r => r.severity === 'MEDIUM') ? 'MEDIUM' : 'LOW';
        return {
            overallRisk,
            risks,
        };
    }
    async analyzeLoadTestResults(loadTestResults, currentCapacity) {
        const avgThroughput = loadTestResults.reduce((sum, result) => sum + result.summary.throughput, 0) / loadTestResults.length;
        const avgResponseTime = loadTestResults.reduce((sum, result) => sum + result.summary.avgResponseTime, 0) / loadTestResults.length;
        // Estimate capacity utilization based on load test results
        const capacityUtilization = {
            cpu: Math.min((avgThroughput / 100) * 50, 100), // Rough estimate
            memory: Math.min((avgThroughput / 100) * 30, 100), // Rough estimate
            network: Math.min((avgThroughput / 100) * 20, 100), // Rough estimate
        };
        const scalingRecommendations = [];
        const performanceBottlenecks = [];
        // Generate recommendations based on results
        if (avgResponseTime > 2000) {
            performanceBottlenecks.push('High average response time indicates performance issues');
            scalingRecommendations.push('Consider horizontal scaling or performance optimization');
        }
        if (capacityUtilization.cpu > 80) {
            performanceBottlenecks.push('High CPU utilization detected');
            scalingRecommendations.push('Add more CPU cores or scale horizontally');
        }
        if (capacityUtilization.memory > 80) {
            performanceBottlenecks.push('High memory utilization detected');
            scalingRecommendations.push('Increase memory capacity or optimize memory usage');
        }
        const errorRate = loadTestResults.reduce((sum, result) => sum + result.summary.errorRate, 0) / loadTestResults.length;
        if (errorRate > 5) {
            performanceBottlenecks.push('High error rate indicates system instability');
            scalingRecommendations.push('Investigate error causes and implement stability improvements');
        }
        return {
            capacityUtilization,
            scalingRecommendations,
            performanceBottlenecks,
        };
    }
    generatePlanId() {
        return `plan_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
    getCapacityPlan(planId) {
        return this.planningResults.get(planId);
    }
    getAllPlans() {
        return Array.from(this.planningResults.values());
    }
    async exportPlanToCSV(planId) {
        const plan = this.planningResults.get(planId);
        if (!plan) {
            throw new Error('Plan not found');
        }
        // Simple CSV export of timeline projections
        let csv = 'Month,Users,RPS,Servers,CPU Cores,Memory GB,Storage GB,Cost\n';
        for (let i = 0; i < plan.projections.timeline.length; i++) {
            const projection = plan.projections.timeline[i];
            const cost = plan.projections.costProjections[i];
            csv += [
                projection.month.toISOString().substring(0, 7),
                projection.expectedUsers,
                projection.expectedRequestsPerSecond,
                projection.requiredCapacity.servers,
                projection.requiredCapacity.cpuCores,
                projection.requiredCapacity.memoryGB,
                projection.requiredCapacity.storageGB,
                cost ? cost.total.toFixed(2) : '0',
            ].join(',') + '\n';
        }
        return csv;
    }
}
exports.CapacityPlanningService = CapacityPlanningService;
