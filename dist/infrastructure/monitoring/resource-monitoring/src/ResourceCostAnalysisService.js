"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceCostAnalysisService = void 0;
const events_1 = require("events");
const ResourceDataModel_1 = require("./ResourceDataModel");
class ResourceCostAnalysisService extends events_1.EventEmitter {
    config;
    costModels = new Map();
    costData = new Map();
    correlations = new Map();
    alerts = new Map();
    exchangeRates = new Map();
    analysisScheduler;
    costUpdateScheduler;
    constructor(config) {
        super();
        this.config = config;
        this.initializeCostModels();
        this.initializeExchangeRates();
        this.startSchedulers();
    }
    async analyzeCostCorrelations(resourceId, snapshot, historicalData) {
        const analysisPeriod = {
            start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days
            end: new Date()
        };
        // Get cost data for analysis period
        const costHistory = await this.getCostHistory(resourceId, analysisPeriod);
        // Analyze correlations
        const correlations = {
            utilization_cost: await this.analyzeUtilizationCostCorrelation(historicalData, costHistory),
            performance_cost: await this.analyzePerformanceCostCorrelation(historicalData, costHistory),
            efficiency_cost: await this.analyzeEfficiencyCostCorrelation(historicalData, costHistory),
            time_cost: await this.analyzeTimeCostCorrelation(historicalData, costHistory),
            workload_cost: await this.analyzeWorkloadCostCorrelation(historicalData, costHistory)
        };
        // Identify cost drivers
        const costDrivers = await this.identifyCostDrivers(resourceId, historicalData, costHistory);
        // Detect cost anomalies
        const costAnomalies = await this.detectCostAnomalies(resourceId, costHistory);
        // Find optimization opportunities
        const optimizationOpportunities = await this.findCostOptimizationOpportunities(resourceId, snapshot, costHistory, correlations);
        // Generate forecast
        const forecast = await this.generateCostForecast(resourceId, costHistory, historicalData);
        // Generate recommendations
        const recommendations = await this.generateCostRecommendations(resourceId, correlations, costDrivers, optimizationOpportunities);
        const correlation = {
            resource_id: resourceId,
            analysis_period: analysisPeriod,
            correlations,
            cost_drivers: costDrivers,
            cost_anomalies: costAnomalies,
            optimization_opportunities: optimizationOpportunities,
            forecast,
            recommendations
        };
        // Store correlation analysis
        this.correlations.set(resourceId, correlation);
        // Generate alerts if needed
        await this.checkCostAlerts(resourceId, correlation);
        this.emit('costAnalysisCompleted', {
            resourceId,
            correlation,
            savingsOpportunities: optimizationOpportunities.length,
            totalPotentialSavings: optimizationOpportunities.reduce((sum, opp) => sum + opp.savings_amount, 0),
            timestamp: new Date()
        });
        return correlation;
    }
    async analyzeUtilizationCostCorrelation(utilizationData, costData) {
        if (utilizationData.length === 0 || costData.length === 0) {
            return this.getEmptyCorrelationAnalysis();
        }
        // Align data by timestamp and calculate correlation
        const alignedData = this.alignUtilizationAndCostData(utilizationData, costData);
        const utilizationValues = alignedData.map(d => d.utilization.overall);
        const costValues = alignedData.map(d => d.cost);
        const correlation = this.calculateCorrelation(utilizationValues, costValues);
        const rSquared = Math.pow(correlation, 2);
        return {
            correlation_coefficient: correlation,
            r_squared: rSquared,
            p_value: this.calculatePValue(correlation, alignedData.length),
            significance: this.determineSignificance(correlation, alignedData.length),
            trend: correlation > 0.1 ? 'positive' : correlation < -0.1 ? 'negative' : 'neutral',
            strength: this.determineCorrelationStrength(Math.abs(correlation)),
            data_points: alignedData.length,
            time_lags: await this.calculateTimeLags(utilizationValues, costValues),
            confidence_interval: this.calculateConfidenceInterval(correlation, alignedData.length)
        };
    }
    async analyzePerformanceCostCorrelation(utilizationData, costData) {
        // Extract performance metrics (response time, throughput, etc.)
        const performanceValues = utilizationData.map(snapshot => {
            const responseTimeMetrics = snapshot.metrics.filter(m => m.metricType === ResourceDataModel_1.ResourceMetricType.APP_RESPONSE_TIME);
            return responseTimeMetrics.length > 0
                ? responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length
                : 0;
        });
        const alignedData = this.alignPerformanceAndCostData(performanceValues, costData);
        if (alignedData.length === 0) {
            return this.getEmptyCorrelationAnalysis();
        }
        const correlation = this.calculateCorrelation(alignedData.map(d => d.performance), alignedData.map(d => d.cost));
        return {
            correlation_coefficient: correlation,
            r_squared: Math.pow(correlation, 2),
            p_value: this.calculatePValue(correlation, alignedData.length),
            significance: this.determineSignificance(correlation, alignedData.length),
            trend: correlation > 0.1 ? 'positive' : correlation < -0.1 ? 'negative' : 'neutral',
            strength: this.determineCorrelationStrength(Math.abs(correlation)),
            data_points: alignedData.length,
            time_lags: await this.calculateTimeLags(alignedData.map(d => d.performance), alignedData.map(d => d.cost)),
            confidence_interval: this.calculateConfidenceInterval(correlation, alignedData.length)
        };
    }
    async analyzeEfficiencyCostCorrelation(utilizationData, costData) {
        const efficiencyValues = utilizationData.map(snapshot => snapshot.efficiency?.score || 0);
        const alignedData = this.alignEfficiencyAndCostData(efficiencyValues, costData);
        if (alignedData.length === 0) {
            return this.getEmptyCorrelationAnalysis();
        }
        const correlation = this.calculateCorrelation(alignedData.map(d => d.efficiency), alignedData.map(d => d.cost));
        return {
            correlation_coefficient: correlation,
            r_squared: Math.pow(correlation, 2),
            p_value: this.calculatePValue(correlation, alignedData.length),
            significance: this.determineSignificance(correlation, alignedData.length),
            trend: correlation > 0.1 ? 'positive' : correlation < -0.1 ? 'negative' : 'neutral',
            strength: this.determineCorrelationStrength(Math.abs(correlation)),
            data_points: alignedData.length,
            time_lags: await this.calculateTimeLags(alignedData.map(d => d.efficiency), alignedData.map(d => d.cost)),
            confidence_interval: this.calculateConfidenceInterval(correlation, alignedData.length)
        };
    }
    async analyzeTimeCostCorrelation(utilizationData, costData) {
        // Analyze cost patterns over time (seasonal, daily, weekly patterns)
        const timeValues = costData.map((_, index) => index); // Simple time index
        const costValues = costData.map(cost => cost.costs.total.amount);
        if (costValues.length === 0) {
            return this.getEmptyCorrelationAnalysis();
        }
        const correlation = this.calculateCorrelation(timeValues, costValues);
        return {
            correlation_coefficient: correlation,
            r_squared: Math.pow(correlation, 2),
            p_value: this.calculatePValue(correlation, costValues.length),
            significance: this.determineSignificance(correlation, costValues.length),
            trend: correlation > 0.1 ? 'positive' : correlation < -0.1 ? 'negative' : 'neutral',
            strength: this.determineCorrelationStrength(Math.abs(correlation)),
            data_points: costValues.length,
            time_lags: [],
            confidence_interval: this.calculateConfidenceInterval(correlation, costValues.length)
        };
    }
    async analyzeWorkloadCostCorrelation(utilizationData, costData) {
        // Analyze correlation between workload characteristics and cost
        const workloadValues = utilizationData.map(snapshot => {
            // Combine various workload indicators
            return (snapshot.utilization.cpu + snapshot.utilization.memory +
                snapshot.utilization.storage + snapshot.utilization.network) / 4;
        });
        const alignedData = this.alignWorkloadAndCostData(workloadValues, costData);
        if (alignedData.length === 0) {
            return this.getEmptyCorrelationAnalysis();
        }
        const correlation = this.calculateCorrelation(alignedData.map(d => d.workload), alignedData.map(d => d.cost));
        return {
            correlation_coefficient: correlation,
            r_squared: Math.pow(correlation, 2),
            p_value: this.calculatePValue(correlation, alignedData.length),
            significance: this.determineSignificance(correlation, alignedData.length),
            trend: correlation > 0.1 ? 'positive' : correlation < -0.1 ? 'negative' : 'neutral',
            strength: this.determineCorrelationStrength(Math.abs(correlation)),
            data_points: alignedData.length,
            time_lags: await this.calculateTimeLags(alignedData.map(d => d.workload), alignedData.map(d => d.cost)),
            confidence_interval: this.calculateConfidenceInterval(correlation, alignedData.length)
        };
    }
    async identifyCostDrivers(resourceId, utilizationData, costData) {
        const drivers = [];
        // Analyze compute cost driver
        const computeCostContribution = this.calculateCostContribution('compute', costData);
        if (computeCostContribution > 0.1) { // 10% threshold
            drivers.push({
                factor: 'Compute Resources',
                impact_percentage: computeCostContribution * 100,
                cost_contribution: this.calculateAbsoluteCostContribution('compute', costData),
                trend: this.calculateCostTrend('compute', costData),
                controllability: 'high',
                optimization_potential: this.calculateOptimizationPotential('compute'),
                priority: computeCostContribution > 0.5 ? 'critical' : computeCostContribution > 0.3 ? 'high' : 'medium',
                description: 'CPU and memory costs based on provisioned capacity and utilization',
                recommendations: [
                    'Consider rightsizing instances',
                    'Implement auto-scaling',
                    'Use spot instances where appropriate'
                ]
            });
        }
        // Analyze storage cost driver
        const storageCostContribution = this.calculateCostContribution('storage', costData);
        if (storageCostContribution > 0.1) {
            drivers.push({
                factor: 'Storage Resources',
                impact_percentage: storageCostContribution * 100,
                cost_contribution: this.calculateAbsoluteCostContribution('storage', costData),
                trend: this.calculateCostTrend('storage', costData),
                controllability: 'medium',
                optimization_potential: this.calculateOptimizationPotential('storage'),
                priority: storageCostContribution > 0.4 ? 'critical' : storageCostContribution > 0.2 ? 'high' : 'medium',
                description: 'Storage costs including persistent volumes and backup storage',
                recommendations: [
                    'Implement data lifecycle policies',
                    'Use appropriate storage tiers',
                    'Clean up unused storage'
                ]
            });
        }
        // Analyze network cost driver
        const networkCostContribution = this.calculateCostContribution('network', costData);
        if (networkCostContribution > 0.05) {
            drivers.push({
                factor: 'Network Resources',
                impact_percentage: networkCostContribution * 100,
                cost_contribution: this.calculateAbsoluteCostContribution('network', costData),
                trend: this.calculateCostTrend('network', costData),
                controllability: 'medium',
                optimization_potential: this.calculateOptimizationPotential('network'),
                priority: networkCostContribution > 0.3 ? 'high' : 'medium',
                description: 'Data transfer and network infrastructure costs',
                recommendations: [
                    'Optimize data transfer patterns',
                    'Use CDN for static content',
                    'Minimize cross-region traffic'
                ]
            });
        }
        return drivers.sort((a, b) => {
            const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
        });
    }
    async detectCostAnomalies(resourceId, costData) {
        const anomalies = [];
        if (costData.length < 7) { // Need at least a week of data
            return anomalies;
        }
        const costs = costData.map(c => c.costs.total.amount);
        const timestamps = costData.map(c => c.period.start);
        // Calculate statistical thresholds
        const mean = costs.reduce((sum, cost) => sum + cost, 0) / costs.length;
        const stdDev = Math.sqrt(costs.reduce((sum, cost) => sum + Math.pow(cost - mean, 2), 0) / costs.length);
        const upperThreshold = mean + (2.5 * stdDev);
        const lowerThreshold = Math.max(0, mean - (2.5 * stdDev));
        // Detect anomalies
        for (let i = 0; i < costs.length; i++) {
            const cost = costs[i];
            const timestamp = timestamps[i];
            if (cost > upperThreshold) {
                anomalies.push({
                    id: this.generateAnomalyId(),
                    timestamp,
                    type: 'spike',
                    severity: cost > upperThreshold * 1.5 ? 'critical' : 'high',
                    cost_impact: cost - mean,
                    percentage_change: ((cost - mean) / mean) * 100,
                    duration_hours: 24, // Assume daily data points
                    expected_cost: mean,
                    actual_cost: cost,
                    confidence: 0.85,
                    potential_causes: [
                        'Unexpected workload increase',
                        'Resource scaling event',
                        'Pricing model change',
                        'New service deployment'
                    ],
                    correlated_metrics: [],
                    business_impact: {
                        severity: cost > upperThreshold * 2 ? 'critical' : 'high',
                        description: 'Unexpected cost increase may impact budget',
                        affected_services: [resourceId]
                    },
                    resolution_status: 'open'
                });
            }
            else if (cost < lowerThreshold) {
                anomalies.push({
                    id: this.generateAnomalyId(),
                    timestamp,
                    type: 'drop',
                    severity: 'medium',
                    cost_impact: mean - cost,
                    percentage_change: ((mean - cost) / mean) * 100,
                    duration_hours: 24,
                    expected_cost: mean,
                    actual_cost: cost,
                    confidence: 0.8,
                    potential_causes: [
                        'Service downtime',
                        'Reduced workload',
                        'Resource deallocation',
                        'Pricing discount applied'
                    ],
                    correlated_metrics: [],
                    business_impact: {
                        severity: 'low',
                        description: 'Unexpected cost decrease may indicate service issues',
                        affected_services: [resourceId]
                    },
                    resolution_status: 'open'
                });
            }
        }
        return anomalies;
    }
    async findCostOptimizationOpportunities(resourceId, snapshot, costData, correlations) {
        const opportunities = [];
        // Rightsizing opportunity
        if (snapshot.utilization.overall < 0.3) { // Less than 30% utilization
            const currentCost = costData.length > 0 ? costData[costData.length - 1].costs.total.amount : 1000;
            const optimizedCost = currentCost * 0.6; // Assume 40% savings
            opportunities.push({
                id: this.generateOpportunityId(),
                type: 'rightsizing',
                title: 'Rightsize Under-utilized Resource',
                description: `Resource utilization is only ${(snapshot.utilization.overall * 100).toFixed(1)}%. Consider downsizing.`,
                current_cost: currentCost,
                optimized_cost: optimizedCost,
                savings_amount: currentCost - optimizedCost,
                savings_percentage: 40,
                implementation: {
                    effort: 'low',
                    risk: 'low',
                    timeline: '1-2 days',
                    steps: [
                        'Analyze peak usage patterns',
                        'Calculate optimal resource size',
                        'Schedule maintenance window',
                        'Resize resource',
                        'Monitor performance'
                    ],
                    dependencies: ['Performance baseline', 'Maintenance approval'],
                    rollback_plan: ['Restore original size', 'Monitor metrics']
                },
                impact_analysis: {
                    performance_impact: -0.05, // Slight performance impact
                    availability_impact: 0,
                    operational_impact: 0.1,
                    user_experience_impact: 0
                },
                roi: {
                    investment_cost: 500,
                    payback_period_months: 1.25,
                    annual_savings: (currentCost - optimizedCost) * 12,
                    three_year_npv: (currentCost - optimizedCost) * 36 - 500
                },
                confidence: 0.85,
                priority: 80
            });
        }
        // Scheduling opportunity
        if (this.hasSchedulingOpportunity(snapshot)) {
            const currentCost = costData.length > 0 ? costData[costData.length - 1].costs.total.amount : 1000;
            const optimizedCost = currentCost * 0.7; // 30% savings
            opportunities.push({
                id: this.generateOpportunityId(),
                type: 'scheduling',
                title: 'Implement Scheduled Scaling',
                description: 'Usage patterns suggest resource can be scheduled for optimal cost efficiency.',
                current_cost: currentCost,
                optimized_cost: optimizedCost,
                savings_amount: currentCost - optimizedCost,
                savings_percentage: 30,
                implementation: {
                    effort: 'low',
                    risk: 'low',
                    timeline: '3-5 days',
                    steps: [
                        'Analyze usage patterns',
                        'Configure auto-scaling policies',
                        'Set up scheduling rules',
                        'Test scaling behavior',
                        'Monitor cost impact'
                    ],
                    dependencies: ['Auto-scaling infrastructure', 'Monitoring setup'],
                    rollback_plan: ['Disable scheduling', 'Restore manual scaling']
                },
                impact_analysis: {
                    performance_impact: 0,
                    availability_impact: 0.05, // Slight impact during scaling
                    operational_impact: 0.1,
                    user_experience_impact: 0
                },
                roi: {
                    investment_cost: 200,
                    payback_period_months: 0.7,
                    annual_savings: (currentCost - optimizedCost) * 12,
                    three_year_npv: (currentCost - optimizedCost) * 36 - 200
                },
                confidence: 0.75,
                priority: 70
            });
        }
        // Pricing model opportunity
        const pricingOpportunity = await this.analyzePricingModelOpportunity(resourceId, costData);
        if (pricingOpportunity) {
            opportunities.push(pricingOpportunity);
        }
        return opportunities.sort((a, b) => b.priority - a.priority);
    }
    async generateCostForecast(resourceId, costData, utilizationData) {
        const horizon = this.config.forecastHorizons[0] || 30; // Default 30 days
        const predictions = [];
        if (costData.length < 7) {
            // Not enough data for reliable forecast
            return {
                horizon_days: horizon,
                predictions: [],
                models_used: [],
                accuracy_metrics: { mae: 0, mape: 0, rmse: 0, r_squared: 0 },
                assumptions: ['Insufficient historical data'],
                risk_factors: [],
                scenarios: []
            };
        }
        // Simple linear trend forecast
        const costs = costData.map(c => c.costs.total.amount);
        const trend = this.calculateLinearTrend(costs);
        const lastCost = costs[costs.length - 1];
        for (let day = 1; day <= horizon; day++) {
            const predictedCost = lastCost + (trend * day);
            const uncertainty = Math.abs(predictedCost * 0.1); // 10% uncertainty
            predictions.push({
                date: new Date(Date.now() + day * 24 * 60 * 60 * 1000),
                predicted_cost: Math.max(0, predictedCost),
                confidence_lower: Math.max(0, predictedCost - uncertainty),
                confidence_upper: predictedCost + uncertainty,
                factors: {
                    trend: trend * day,
                    seasonal: 0,
                    utilization: 0
                }
            });
        }
        return {
            horizon_days: horizon,
            predictions,
            models_used: ['linear_trend'],
            accuracy_metrics: {
                mae: this.calculateMAE(costs),
                mape: this.calculateMAPE(costs),
                rmse: this.calculateRMSE(costs),
                r_squared: 0.7
            },
            assumptions: [
                'Current utilization patterns continue',
                'No major infrastructure changes',
                'Pricing remains stable'
            ],
            risk_factors: [
                { factor: 'Workload spikes', probability: 0.3, impact: 0.5 },
                { factor: 'Pricing changes', probability: 0.1, impact: 0.2 }
            ],
            scenarios: [
                {
                    name: 'Conservative',
                    description: 'Current trends continue with minimal growth',
                    probability: 0.6,
                    cost_range: {
                        min: predictions[predictions.length - 1].confidence_lower,
                        max: predictions[predictions.length - 1].predicted_cost
                    }
                },
                {
                    name: 'Growth',
                    description: 'Increased utilization drives higher costs',
                    probability: 0.3,
                    cost_range: {
                        min: predictions[predictions.length - 1].predicted_cost,
                        max: predictions[predictions.length - 1].confidence_upper
                    }
                }
            ]
        };
    }
    async generateCostRecommendations(resourceId, correlations, costDrivers, opportunities) {
        const recommendations = [];
        // High-impact optimization recommendations
        for (const opportunity of opportunities.slice(0, 3)) { // Top 3 opportunities
            recommendations.push({
                id: this.generateRecommendationId(),
                type: 'immediate',
                category: 'cost_reduction',
                title: opportunity.title,
                description: opportunity.description,
                rationale: `Potential savings of $${opportunity.savings_amount.toFixed(2)} (${opportunity.savings_percentage}%)`,
                expected_savings: opportunity.savings_amount,
                implementation: {
                    priority: opportunity.priority > 75 ? 'high' : 'medium',
                    effort: opportunity.implementation.effort,
                    timeline: opportunity.implementation.timeline,
                    steps: opportunity.implementation.steps,
                    risks: [`Performance impact: ${opportunity.impact_analysis.performance_impact}`],
                    success_metrics: [
                        'Cost reduction achieved',
                        'Performance maintained',
                        'User experience preserved'
                    ]
                },
                dependencies: opportunity.implementation.dependencies,
                conflicts: [],
                confidence: opportunity.confidence,
                created_at: new Date(),
                expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
            });
        }
        // Cost driver recommendations
        for (const driver of costDrivers.filter(d => d.priority === 'critical')) {
            recommendations.push({
                id: this.generateRecommendationId(),
                type: 'short_term',
                category: 'efficiency_improvement',
                title: `Optimize ${driver.factor}`,
                description: `${driver.factor} contributes ${driver.impact_percentage.toFixed(1)}% of total cost`,
                rationale: `High cost contribution with ${driver.controllability} controllability`,
                expected_savings: driver.cost_contribution * (driver.optimization_potential / 100),
                implementation: {
                    priority: driver.priority === 'critical' ? 'high' : 'medium',
                    effort: driver.optimization_potential > 30 ? 'medium' : 'low',
                    timeline: '1-2 weeks',
                    steps: driver.recommendations,
                    risks: ['Operational complexity', 'Learning curve'],
                    success_metrics: [
                        'Cost contribution reduced',
                        'Efficiency improved',
                        'No service disruption'
                    ]
                },
                dependencies: ['Cost analysis tools', 'Monitoring setup'],
                conflicts: [],
                confidence: 0.8,
                created_at: new Date(),
                expires_at: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000) // 60 days
            });
        }
        return recommendations.sort((a, b) => {
            const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
            const aPriority = priorityOrder[a.implementation.priority];
            const bPriority = priorityOrder[b.implementation.priority];
            if (aPriority !== bPriority)
                return bPriority - aPriority;
            return b.expected_savings - a.expected_savings;
        });
    }
    async checkCostAlerts(resourceId, correlation) {
        const alerts = [];
        // Check for anomaly alerts
        for (const anomaly of correlation.cost_anomalies) {
            if (anomaly.severity === 'critical' || anomaly.severity === 'high') {
                alerts.push({
                    id: this.generateAlertId(),
                    resource_id: resourceId,
                    type: 'anomaly_detected',
                    severity: anomaly.severity === 'critical' ? 'critical' : 'warning',
                    title: `Cost ${anomaly.type} detected`,
                    description: `${anomaly.percentage_change.toFixed(1)}% cost ${anomaly.type} detected`,
                    current_cost: anomaly.actual_cost,
                    threshold_cost: anomaly.expected_cost,
                    time_window: {
                        start: new Date(anomaly.timestamp.getTime() - 24 * 60 * 60 * 1000),
                        end: anomaly.timestamp
                    },
                    triggered_at: new Date(),
                    actions_taken: [],
                    escalation_level: 0,
                    notifications_sent: []
                });
            }
        }
        // Check for forecast alerts
        const forecast = correlation.forecast;
        if (forecast.predictions.length > 0) {
            const lastPrediction = forecast.predictions[forecast.predictions.length - 1];
            const currentCost = this.getCurrentCost(resourceId);
            if (lastPrediction.predicted_cost > currentCost * 1.5) { // 50% increase predicted
                alerts.push({
                    id: this.generateAlertId(),
                    resource_id: resourceId,
                    type: 'forecast_warning',
                    severity: 'warning',
                    title: 'Cost increase forecast',
                    description: `${((lastPrediction.predicted_cost / currentCost - 1) * 100).toFixed(1)}% cost increase predicted`,
                    current_cost: currentCost,
                    forecast_cost: lastPrediction.predicted_cost,
                    time_window: {
                        start: new Date(),
                        end: lastPrediction.date
                    },
                    triggered_at: new Date(),
                    actions_taken: [],
                    escalation_level: 0,
                    notifications_sent: []
                });
            }
        }
        // Store alerts
        if (alerts.length > 0) {
            this.storeAlerts(resourceId, alerts);
            this.emit('costAlertsGenerated', {
                resourceId,
                alerts: alerts.length,
                criticalAlerts: alerts.filter(a => a.severity === 'critical').length,
                timestamp: new Date()
            });
        }
    }
    // Helper methods and implementations
    initializeCostModels() {
        // Initialize default cost models for different resource types
        const defaultModel = {
            id: 'default',
            name: 'Default Cost Model',
            description: 'Default pricing model for resource cost calculation',
            resource_type: ResourceDataModel_1.ResourceType.CUSTOM,
            pricing_model: 'hourly',
            cost_factors: [
                {
                    type: 'compute',
                    name: 'CPU Hours',
                    unit: 'hour',
                    unit_cost: 0.10
                },
                {
                    type: 'storage',
                    name: 'Storage GB',
                    unit: 'GB',
                    unit_cost: 0.05
                }
            ],
            base_cost: 0,
            currency: 'USD',
            effective_date: new Date(),
            provider: 'internal',
            region: 'us-east-1'
        };
        this.costModels.set('default', defaultModel);
    }
    initializeExchangeRates() {
        // Initialize exchange rates for supported currencies
        this.exchangeRates.set('USD', 1.0);
        this.exchangeRates.set('EUR', 0.85);
        this.exchangeRates.set('GBP', 0.73);
        this.exchangeRates.set('JPY', 110.0);
    }
    startSchedulers() {
        // Analysis scheduler
        this.analysisScheduler = setInterval(async () => {
            try {
                await this.performScheduledAnalysis();
            }
            catch (error) {
                console.error('Scheduled cost analysis failed:', error.message);
            }
        }, this.config.analysisInterval);
        // Cost update scheduler
        this.costUpdateScheduler = setInterval(async () => {
            try {
                await this.updateCostData();
            }
            catch (error) {
                console.error('Cost data update failed:', error.message);
            }
        }, this.config.costUpdateInterval);
    }
    async performScheduledAnalysis() {
        // Perform analysis for all resources
        for (const resourceId of this.costData.keys()) {
            try {
                // This would normally trigger analysis with current snapshot
                this.emit('analysisScheduled', { resourceId, timestamp: new Date() });
            }
            catch (error) {
                console.error(`Analysis failed for resource ${resourceId}:`, error.message);
            }
        }
    }
    async updateCostData() {
        // Update cost data from cost providers
        this.emit('costDataUpdated', { timestamp: new Date() });
    }
    // Storage and retrieval methods
    storeAlerts(resourceId, alerts) {
        if (!this.alerts.has(resourceId)) {
            this.alerts.set(resourceId, []);
        }
        const resourceAlerts = this.alerts.get(resourceId);
        resourceAlerts.push(...alerts);
        // Keep only last 50 alerts
        if (resourceAlerts.length > 50) {
            resourceAlerts.splice(0, resourceAlerts.length - 50);
        }
    }
    // Getter methods
    getCostCorrelation(resourceId) {
        return this.correlations.get(resourceId);
    }
    getCostAlerts(resourceId) {
        return this.alerts.get(resourceId) || [];
    }
    getCostModels() {
        return Array.from(this.costModels.values());
    }
    // Helper method implementations (simplified for brevity)
    async getCostHistory(resourceId, period) {
        return this.costData.get(resourceId) || [];
    }
    getCurrentCost(resourceId) {
        const costs = this.costData.get(resourceId) || [];
        return costs.length > 0 ? costs[costs.length - 1].costs.total.amount : 0;
    }
    calculateCorrelation(x, y) {
        if (x.length !== y.length || x.length === 0)
            return 0;
        const n = x.length;
        const sumX = x.reduce((sum, val) => sum + val, 0);
        const sumY = y.reduce((sum, val) => sum + val, 0);
        const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
        const sumXX = x.reduce((sum, val) => sum + val * val, 0);
        const sumYY = y.reduce((sum, val) => sum + val * val, 0);
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
        return denominator === 0 ? 0 : numerator / denominator;
    }
    // Additional simplified helper methods...
    getEmptyCorrelationAnalysis() {
        return {
            correlation_coefficient: 0,
            r_squared: 0,
            p_value: 1,
            significance: 'none',
            trend: 'neutral',
            strength: 'none',
            data_points: 0,
            time_lags: [],
            confidence_interval: { lower: 0, upper: 0 }
        };
    }
    alignUtilizationAndCostData(utilization, cost) { return []; }
    alignPerformanceAndCostData(performance, cost) { return []; }
    alignEfficiencyAndCostData(efficiency, cost) { return []; }
    alignWorkloadAndCostData(workload, cost) { return []; }
    calculatePValue(correlation, sampleSize) { return 0.05; }
    determineSignificance(correlation, sampleSize) { return 'medium'; }
    determineCorrelationStrength(correlation) {
        if (correlation > 0.7)
            return 'strong';
        if (correlation > 0.4)
            return 'moderate';
        if (correlation > 0.2)
            return 'weak';
        return 'none';
    }
    async calculateTimeLags(x, y) { return []; }
    calculateConfidenceInterval(correlation, sampleSize) {
        return { lower: correlation - 0.1, upper: correlation + 0.1 };
    }
    calculateCostContribution(type, costData) { return 0.3; }
    calculateAbsoluteCostContribution(type, costData) { return 300; }
    calculateCostTrend(type, costData) { return 'stable'; }
    calculateOptimizationPotential(type) { return 25; }
    hasSchedulingOpportunity(snapshot) { return snapshot.utilization.overall < 0.8; }
    async analyzePricingModelOpportunity(resourceId, costData) { return null; }
    calculateLinearTrend(values) { return 0.05; }
    calculateMAE(values) { return 50; }
    calculateMAPE(values) { return 10; }
    calculateRMSE(values) { return 75; }
    generateAnomalyId() { return `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`; }
    generateOpportunityId() { return `opp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`; }
    generateRecommendationId() { return `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`; }
    generateAlertId() { return `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`; }
    async shutdown() {
        if (this.analysisScheduler) {
            clearInterval(this.analysisScheduler);
        }
        if (this.costUpdateScheduler) {
            clearInterval(this.costUpdateScheduler);
        }
        this.emit('shutdown');
    }
}
exports.ResourceCostAnalysisService = ResourceCostAnalysisService;
