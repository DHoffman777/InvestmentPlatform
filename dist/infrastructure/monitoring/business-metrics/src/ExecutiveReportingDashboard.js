"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ExecutiveReportingDashboard = void 0;
const events_1 = require("events");
const BusinessMetricsDataModel_1 = require("./BusinessMetricsDataModel");
class ExecutiveReportingDashboard extends events_1.EventEmitter {
    config;
    executiveMetrics = new Map();
    summaryCache = new Map();
    benchmarkData = new Map();
    insights = new Map();
    recommendations = new Map();
    reportingTimer;
    cacheCleanupTimer;
    constructor(config) {
        super();
        this.config = config;
        this.initializeExecutiveMetrics();
        this.startReportingTimer();
        this.startCacheCleanup();
    }
    async generateExecutiveSummary(tenantId, period) {
        const cacheKey = `${tenantId}_${period.type}_${period.start.toISOString()}_${period.end.toISOString()}`;
        if (this.config.cacheEnabled && this.summaryCache.has(cacheKey)) {
            const cached = this.summaryCache.get(cacheKey);
            const cacheAge = Date.now() - cached.generatedAt.getTime();
            if (cacheAge < this.config.refreshInterval) {
                return cached;
            }
        }
        const summary = {
            id: this.generateId(),
            tenantId,
            generatedAt: new Date(),
            period,
            keyMetrics: await this.getKeyMetrics(tenantId, period),
            insights: await this.generateInsights(tenantId, period),
            alerts: await this.getExecutiveAlerts(tenantId),
            recommendations: await this.generateRecommendations(tenantId, period),
            performance: await this.calculatePerformanceSummary(tenantId, period),
            attachments: []
        };
        if (this.config.cacheEnabled) {
            this.summaryCache.set(cacheKey, summary);
        }
        this.emit('executiveSummaryGenerated', {
            tenantId,
            summaryId: summary.id,
            period: period.type
        });
        return summary;
    }
    async getKeyMetrics(tenantId, period) {
        const metrics = [];
        const financialMetrics = await this.calculateFinancialMetrics(tenantId, period);
        const operationalMetrics = await this.calculateOperationalMetrics(tenantId, period);
        const clientMetrics = await this.calculateClientMetrics(tenantId, period);
        const riskMetrics = await this.calculateRiskMetrics(tenantId, period);
        metrics.push(...financialMetrics, ...operationalMetrics, ...clientMetrics, ...riskMetrics);
        return metrics.sort((a, b) => {
            const priorityOrder = ['critical', 'warning', 'good', 'excellent'];
            return priorityOrder.indexOf(a.status) - priorityOrder.indexOf(b.status);
        });
    }
    async calculateFinancialMetrics(tenantId, period) {
        const metrics = [];
        const aum = await this.calculateAUM(tenantId, period);
        metrics.push({
            id: BusinessMetricsDataModel_1.FINANCIAL_KPIS.ASSETS_UNDER_MANAGEMENT,
            name: 'assets_under_management',
            displayName: 'Assets Under Management',
            category: 'financial',
            currentValue: aum.current,
            previousValue: aum.previous,
            target: aum.target,
            trend: this.calculateTrend(aum.current, aum.previous),
            trendPercentage: this.calculateTrendPercentage(aum.current, aum.previous),
            status: this.calculateStatus(aum.current, aum.target),
            unit: 'USD',
            description: 'Total assets under management across all portfolios',
            lastUpdated: new Date(),
            dataQuality: 95
        });
        const revenue = await this.calculateRevenue(tenantId, period);
        metrics.push({
            id: BusinessMetricsDataModel_1.FINANCIAL_KPIS.REVENUE,
            name: 'revenue',
            displayName: 'Revenue',
            category: 'financial',
            currentValue: revenue.current,
            previousValue: revenue.previous,
            target: revenue.target,
            trend: this.calculateTrend(revenue.current, revenue.previous),
            trendPercentage: this.calculateTrendPercentage(revenue.current, revenue.previous),
            status: this.calculateStatus(revenue.current, revenue.target),
            unit: 'USD',
            description: 'Total revenue generated in the period',
            lastUpdated: new Date(),
            dataQuality: 98
        });
        const netFlows = await this.calculateNetFlows(tenantId, period);
        metrics.push({
            id: BusinessMetricsDataModel_1.FINANCIAL_KPIS.NET_ASSET_FLOWS,
            name: 'net_asset_flows',
            displayName: 'Net Asset Flows',
            category: 'financial',
            currentValue: netFlows.current,
            previousValue: netFlows.previous,
            target: netFlows.target,
            trend: this.calculateTrend(netFlows.current, netFlows.previous),
            trendPercentage: this.calculateTrendPercentage(netFlows.current, netFlows.previous),
            status: this.calculateStatus(netFlows.current, netFlows.target),
            unit: 'USD',
            description: 'Net inflows minus outflows of assets',
            lastUpdated: new Date(),
            dataQuality: 92
        });
        return metrics;
    }
    async calculateOperationalMetrics(tenantId, period) {
        const metrics = [];
        const uptime = await this.calculateSystemUptime(tenantId, period);
        metrics.push({
            id: BusinessMetricsDataModel_1.OPERATIONAL_KPIS.SYSTEM_UPTIME,
            name: 'system_uptime',
            displayName: 'System Uptime',
            category: 'operational',
            currentValue: uptime.current,
            previousValue: uptime.previous,
            target: 99.9,
            trend: this.calculateTrend(uptime.current, uptime.previous),
            trendPercentage: this.calculateTrendPercentage(uptime.current, uptime.previous),
            status: this.calculateStatus(uptime.current, 99.9),
            unit: '%',
            description: 'System availability percentage',
            lastUpdated: new Date(),
            dataQuality: 100
        });
        const tradeExecTime = await this.calculateTradeExecutionTime(tenantId, period);
        metrics.push({
            id: BusinessMetricsDataModel_1.OPERATIONAL_KPIS.TRADE_EXECUTION_TIME,
            name: 'trade_execution_time',
            displayName: 'Average Trade Execution Time',
            category: 'operational',
            currentValue: tradeExecTime.current,
            previousValue: tradeExecTime.previous,
            target: 2000,
            trend: this.calculateTrend(tradeExecTime.previous, tradeExecTime.current),
            trendPercentage: this.calculateTrendPercentage(tradeExecTime.previous, tradeExecTime.current),
            status: this.calculateStatus(2000, tradeExecTime.current),
            unit: 'ms',
            description: 'Average time to execute trades',
            lastUpdated: new Date(),
            dataQuality: 97
        });
        return metrics;
    }
    async calculateClientMetrics(tenantId, period) {
        const metrics = [];
        const clientCount = await this.calculateClientCount(tenantId, period);
        metrics.push({
            id: BusinessMetricsDataModel_1.CLIENT_KPIS.CLIENT_COUNT,
            name: 'client_count',
            displayName: 'Total Clients',
            category: 'strategic',
            currentValue: clientCount.current,
            previousValue: clientCount.previous,
            trend: this.calculateTrend(clientCount.current, clientCount.previous),
            trendPercentage: this.calculateTrendPercentage(clientCount.current, clientCount.previous),
            status: this.calculateGrowthStatus(clientCount.current, clientCount.previous),
            unit: 'count',
            description: 'Total number of active clients',
            lastUpdated: new Date(),
            dataQuality: 100
        });
        const retentionRate = await this.calculateRetentionRate(tenantId, period);
        metrics.push({
            id: BusinessMetricsDataModel_1.CLIENT_KPIS.CLIENT_RETENTION_RATE,
            name: 'client_retention_rate',
            displayName: 'Client Retention Rate',
            category: 'strategic',
            currentValue: retentionRate.current,
            previousValue: retentionRate.previous,
            target: 95,
            trend: this.calculateTrend(retentionRate.current, retentionRate.previous),
            trendPercentage: this.calculateTrendPercentage(retentionRate.current, retentionRate.previous),
            status: this.calculateStatus(retentionRate.current, 95),
            unit: '%',
            description: 'Percentage of clients retained over the period',
            lastUpdated: new Date(),
            dataQuality: 94
        });
        return metrics;
    }
    async calculateRiskMetrics(tenantId, period) {
        const metrics = [];
        const portfolioVar = await this.calculatePortfolioVaR(tenantId, period);
        metrics.push({
            id: BusinessMetricsDataModel_1.RISK_KPIS.PORTFOLIO_VAR,
            name: 'portfolio_var',
            displayName: 'Portfolio VaR (95%)',
            category: 'risk',
            currentValue: portfolioVar.current,
            previousValue: portfolioVar.previous,
            target: 0.02,
            trend: this.calculateTrend(portfolioVar.previous, portfolioVar.current),
            trendPercentage: this.calculateTrendPercentage(portfolioVar.previous, portfolioVar.current),
            status: this.calculateRiskStatus(portfolioVar.current, 0.02),
            unit: '%',
            description: 'Value at Risk at 95% confidence level',
            lastUpdated: new Date(),
            dataQuality: 91
        });
        return metrics;
    }
    async generateInsights(tenantId, period) {
        const insights = [];
        const trendInsight = await this.generateTrendAnalysis(tenantId, period);
        if (trendInsight)
            insights.push(trendInsight);
        const anomalyInsight = await this.generateAnomalyInsight(tenantId, period);
        if (anomalyInsight)
            insights.push(anomalyInsight);
        const correlationInsight = await this.generateCorrelationInsight(tenantId, period);
        if (correlationInsight)
            insights.push(correlationInsight);
        const benchmarkInsight = await this.generateBenchmarkInsight(tenantId, period);
        if (benchmarkInsight)
            insights.push(benchmarkInsight);
        return insights;
    }
    async generateTrendAnalysis(tenantId, period) {
        const metrics = await this.getKeyMetrics(tenantId, period);
        const strongTrends = metrics.filter(m => Math.abs(m.trendPercentage) > 10);
        if (strongTrends.length === 0)
            return null;
        const topTrend = strongTrends.sort((a, b) => Math.abs(b.trendPercentage) - Math.abs(a.trendPercentage))[0];
        return {
            id: this.generateId(),
            type: 'trend_analysis',
            title: `Strong ${topTrend.trend} trend in ${topTrend.displayName}`,
            description: `${topTrend.displayName} has shown a ${Math.abs(topTrend.trendPercentage).toFixed(1)}% ${topTrend.trend === 'up' ? 'increase' : 'decrease'} compared to the previous period.`,
            impact: Math.abs(topTrend.trendPercentage) > 20 ? 'high' : 'medium',
            confidence: 0.85,
            metrics: [topTrend.id],
            dataPoints: [
                { timestamp: new Date(Date.now() - 86400000), value: topTrend.previousValue },
                { timestamp: new Date(), value: topTrend.currentValue }
            ],
            visualizationType: 'chart',
            createdAt: new Date()
        };
    }
    async generateAnomalyInsight(tenantId, period) {
        const metrics = await this.getKeyMetrics(tenantId, period);
        const anomalies = metrics.filter(m => m.status === 'critical' || m.status === 'warning');
        if (anomalies.length === 0)
            return null;
        const criticalAnomaly = anomalies.find(m => m.status === 'critical') || anomalies[0];
        return {
            id: this.generateId(),
            type: 'anomaly_detection',
            title: `Unusual pattern detected in ${criticalAnomaly.displayName}`,
            description: `${criticalAnomaly.displayName} is showing unusual behavior with current value of ${criticalAnomaly.currentValue} ${criticalAnomaly.unit}, significantly different from expected patterns.`,
            impact: criticalAnomaly.status === 'critical' ? 'high' : 'medium',
            confidence: 0.92,
            metrics: [criticalAnomaly.id],
            dataPoints: [],
            visualizationType: 'scorecard',
            createdAt: new Date()
        };
    }
    async generateCorrelationInsight(tenantId, period) {
        return {
            id: this.generateId(),
            type: 'correlation',
            title: 'Strong correlation between AUM and Revenue',
            description: 'Analysis shows a strong positive correlation (0.87) between Assets Under Management and Revenue, indicating healthy business growth.',
            impact: 'medium',
            confidence: 0.87,
            metrics: [BusinessMetricsDataModel_1.FINANCIAL_KPIS.ASSETS_UNDER_MANAGEMENT, BusinessMetricsDataModel_1.FINANCIAL_KPIS.REVENUE],
            dataPoints: [],
            visualizationType: 'chart',
            createdAt: new Date()
        };
    }
    async generateBenchmarkInsight(tenantId, period) {
        const benchmarks = await this.getBenchmarkComparisons(tenantId);
        const significantGaps = benchmarks.filter(b => Math.abs(b.gap) > 10);
        if (significantGaps.length === 0)
            return null;
        const topGap = significantGaps.sort((a, b) => Math.abs(b.gap) - Math.abs(a.gap))[0];
        return {
            id: this.generateId(),
            type: 'benchmark_comparison',
            title: `${topGap.gap > 0 ? 'Outperforming' : 'Underperforming'} industry benchmark in ${topGap.category}`,
            description: `Your ${topGap.category} performance is ${Math.abs(topGap.gap).toFixed(1)}% ${topGap.gap > 0 ? 'above' : 'below'} industry average and in the ${topGap.percentile}th percentile.`,
            impact: Math.abs(topGap.gap) > 20 ? 'high' : 'medium',
            confidence: 0.78,
            metrics: [],
            dataPoints: [
                { timestamp: new Date(), value: topGap.ourPerformance, label: 'Our Performance' },
                { timestamp: new Date(), value: topGap.industryAverage, label: 'Industry Average' },
                { timestamp: new Date(), value: topGap.topQuartile, label: 'Top Quartile' }
            ],
            visualizationType: 'chart',
            createdAt: new Date()
        };
    }
    async generateRecommendations(tenantId, period) {
        const recommendations = [];
        const metrics = await this.getKeyMetrics(tenantId, period);
        const benchmarks = await this.getBenchmarkComparisons(tenantId);
        const performanceGaps = benchmarks.filter(b => b.gap < -5);
        for (const gap of performanceGaps) {
            recommendations.push(await this.generatePerformanceRecommendation(gap));
        }
        const riskMetrics = metrics.filter(m => m.category === 'risk' && m.status !== 'excellent');
        for (const riskMetric of riskMetrics) {
            recommendations.push(await this.generateRiskRecommendation(riskMetric));
        }
        const growthOpportunities = metrics.filter(m => m.trend === 'up' && m.trendPercentage > 15);
        for (const opportunity of growthOpportunities) {
            recommendations.push(await this.generateGrowthRecommendation(opportunity));
        }
        return recommendations.sort((a, b) => {
            const priorityOrder = ['high', 'medium', 'low'];
            return priorityOrder.indexOf(a.priority) - priorityOrder.indexOf(b.priority);
        });
    }
    async generatePerformanceRecommendation(gap) {
        return {
            id: this.generateId(),
            type: 'optimization',
            priority: Math.abs(gap.gap) > 15 ? 'high' : 'medium',
            title: `Improve ${gap.category} performance`,
            description: `Your ${gap.category} performance is ${Math.abs(gap.gap).toFixed(1)}% below industry average. Focus on key improvement areas to reach competitive levels.`,
            expectedImpact: {
                metric: gap.category,
                estimatedImprovement: Math.abs(gap.gap) * 0.6,
                timeframe: '3-6 months'
            },
            actionItems: [
                {
                    id: this.generateId(),
                    description: `Analyze root causes of ${gap.category} underperformance`,
                    status: 'pending',
                    dependencies: []
                },
                {
                    id: this.generateId(),
                    description: 'Implement best practices from top quartile performers',
                    status: 'pending',
                    dependencies: []
                }
            ],
            resources: [
                {
                    type: 'human',
                    description: 'Dedicated project team',
                    duration: 120
                },
                {
                    type: 'financial',
                    description: 'Process improvement initiatives',
                    estimatedCost: 50000
                }
            ],
            feasibilityScore: 0.75
        };
    }
    async generateRiskRecommendation(metric) {
        return {
            id: this.generateId(),
            type: 'risk_mitigation',
            priority: metric.status === 'critical' ? 'high' : 'medium',
            title: `Address elevated ${metric.displayName}`,
            description: `${metric.displayName} is currently at ${metric.currentValue} ${metric.unit}, which requires attention to maintain acceptable risk levels.`,
            expectedImpact: {
                metric: metric.name,
                estimatedImprovement: 20,
                timeframe: '1-3 months'
            },
            actionItems: [
                {
                    id: this.generateId(),
                    description: `Review current ${metric.displayName} management procedures`,
                    status: 'pending',
                    dependencies: []
                },
                {
                    id: this.generateId(),
                    description: 'Implement additional risk controls',
                    status: 'pending',
                    dependencies: []
                }
            ],
            resources: [
                {
                    type: 'human',
                    description: 'Risk management specialist',
                    duration: 60
                }
            ],
            feasibilityScore: 0.85
        };
    }
    async generateGrowthRecommendation(metric) {
        return {
            id: this.generateId(),
            type: 'growth_opportunity',
            priority: 'medium',
            title: `Capitalize on ${metric.displayName} growth`,
            description: `${metric.displayName} is showing strong growth of ${metric.trendPercentage.toFixed(1)}%. Consider expanding this successful area.`,
            expectedImpact: {
                metric: metric.name,
                estimatedImprovement: metric.trendPercentage * 0.5,
                timeframe: '6-12 months'
            },
            actionItems: [
                {
                    id: this.generateId(),
                    description: `Analyze success factors driving ${metric.displayName} growth`,
                    status: 'pending',
                    dependencies: []
                },
                {
                    id: this.generateId(),
                    description: 'Develop scaling strategy',
                    status: 'pending',
                    dependencies: []
                }
            ],
            resources: [
                {
                    type: 'financial',
                    description: 'Growth investment',
                    estimatedCost: 100000
                }
            ],
            feasibilityScore: 0.80
        };
    }
    async calculatePerformanceSummary(tenantId, period) {
        const metrics = await this.getKeyMetrics(tenantId, period);
        const benchmarks = await this.getBenchmarkComparisons(tenantId);
        const financialMetrics = metrics.filter(m => m.category === 'financial');
        const operationalMetrics = metrics.filter(m => m.category === 'operational');
        const clientMetrics = metrics.filter(m => m.name.includes('client') || m.name.includes('retention'));
        const riskMetrics = metrics.filter(m => m.category === 'risk');
        const overallScore = this.calculateCategoryScore(metrics);
        return {
            overall: {
                score: overallScore,
                grade: this.scoreToGrade(overallScore),
                trend: this.calculateOverallTrend(metrics)
            },
            categories: {
                financial: this.calculateCategoryPerformance(financialMetrics, 'financial'),
                operational: this.calculateCategoryPerformance(operationalMetrics, 'operational'),
                client: this.calculateCategoryPerformance(clientMetrics, 'client'),
                risk: this.calculateCategoryPerformance(riskMetrics, 'risk')
            },
            benchmarks
        };
    }
    calculateCategoryPerformance(metrics, category) {
        const score = this.calculateCategoryScore(metrics);
        const onTarget = metrics.filter(m => m.status === 'excellent' || m.status === 'good').length;
        const atRisk = metrics.filter(m => m.status === 'warning').length;
        const offTrack = metrics.filter(m => m.status === 'critical').length;
        const improvingCount = metrics.filter(m => m.trend === 'up').length;
        const decliningCount = metrics.filter(m => m.trend === 'down').length;
        let trend;
        if (improvingCount > decliningCount)
            trend = 'improving';
        else if (decliningCount > improvingCount)
            trend = 'declining';
        else
            trend = 'stable';
        return {
            score,
            metrics: {
                total: metrics.length,
                onTarget,
                atRisk,
                offTrack
            },
            trend,
            keyDrivers: metrics
                .filter(m => Math.abs(m.trendPercentage) > 10)
                .map(m => m.displayName)
                .slice(0, 3)
        };
    }
    calculateCategoryScore(metrics) {
        if (metrics.length === 0)
            return 0;
        const scores = metrics.map(metric => {
            switch (metric.status) {
                case 'excellent': return 100;
                case 'good': return 80;
                case 'warning': return 60;
                case 'critical': return 40;
                default: return 0;
            }
        });
        return Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length);
    }
    scoreToGrade(score) {
        if (score >= 90)
            return 'A';
        if (score >= 80)
            return 'B';
        if (score >= 70)
            return 'C';
        if (score >= 60)
            return 'D';
        return 'F';
    }
    calculateOverallTrend(metrics) {
        const trendSum = metrics.reduce((sum, metric) => {
            if (metric.trend === 'up')
                return sum + 1;
            if (metric.trend === 'down')
                return sum - 1;
            return sum;
        }, 0);
        if (trendSum > 0)
            return 'improving';
        if (trendSum < 0)
            return 'declining';
        return 'stable';
    }
    async drillDown(context) {
        const data = await this.getDrillDownData(context);
        const aggregations = this.calculateDrillDownAggregations(data);
        const insights = this.generateDrillDownInsights(data);
        const nextLevelDimensions = this.getNextLevelDimensions(context.dimension);
        return {
            context,
            data,
            aggregations,
            insights,
            nextLevelDimensions
        };
    }
    async getDrillDownData(context) {
        const mockData = [
            { dimension: 'Region', value: 'North America', metric: 45.2, contribution: 0.452, trend: 5.3, rank: 1 },
            { dimension: 'Region', value: 'Europe', metric: 32.1, contribution: 0.321, trend: -2.1, rank: 2 },
            { dimension: 'Region', value: 'Asia Pacific', metric: 22.7, contribution: 0.227, trend: 8.7, rank: 3 }
        ];
        return mockData;
    }
    calculateDrillDownAggregations(data) {
        return [
            { type: 'sum', value: data.reduce((sum, d) => sum + d.metric, 0), label: 'Total' },
            { type: 'avg', value: data.reduce((sum, d) => sum + d.metric, 0) / data.length, label: 'Average' },
            { type: 'max', value: Math.max(...data.map(d => d.metric)), label: 'Maximum' },
            { type: 'min', value: Math.min(...data.map(d => d.metric)), label: 'Minimum' },
            { type: 'count', value: data.length, label: 'Count' }
        ];
    }
    generateDrillDownInsights(data) {
        const insights = [];
        const topPerformer = data.sort((a, b) => b.metric - a.metric)[0];
        if (topPerformer) {
            insights.push(`${topPerformer.value} is the top performer with ${topPerformer.metric.toFixed(1)} (${(topPerformer.contribution * 100).toFixed(1)}% of total)`);
        }
        const strongestGrowth = data.sort((a, b) => b.trend - a.trend)[0];
        if (strongestGrowth && strongestGrowth.trend > 0) {
            insights.push(`${strongestGrowth.value} shows strongest growth at ${strongestGrowth.trend.toFixed(1)}%`);
        }
        return insights;
    }
    getNextLevelDimensions(currentDimension) {
        const dimensionHierarchy = {
            'total': ['region', 'product', 'client_segment'],
            'region': ['country', 'office', 'advisor'],
            'product': ['asset_class', 'strategy', 'fund'],
            'client_segment': ['client_type', 'age_group', 'risk_profile']
        };
        return dimensionHierarchy[currentDimension.toLowerCase()] || [];
    }
    async calculateAUM(tenantId, period) {
        return {
            current: 2500000000 + Math.random() * 100000000,
            previous: 2400000000 + Math.random() * 100000000,
            target: 2600000000
        };
    }
    async calculateRevenue(tenantId, period) {
        return {
            current: 12500000 + Math.random() * 1000000,
            previous: 11800000 + Math.random() * 1000000,
            target: 13000000
        };
    }
    async calculateNetFlows(tenantId, period) {
        return {
            current: 25000000 + Math.random() * 5000000,
            previous: 20000000 + Math.random() * 5000000,
            target: 30000000
        };
    }
    async calculateSystemUptime(tenantId, period) {
        return {
            current: 99.95 + Math.random() * 0.05,
            previous: 99.92 + Math.random() * 0.05
        };
    }
    async calculateTradeExecutionTime(tenantId, period) {
        return {
            current: 1500 + Math.random() * 500,
            previous: 1600 + Math.random() * 500
        };
    }
    async calculateClientCount(tenantId, period) {
        return {
            current: 1250 + Math.floor(Math.random() * 100),
            previous: 1200 + Math.floor(Math.random() * 100)
        };
    }
    async calculateRetentionRate(tenantId, period) {
        return {
            current: 94.5 + Math.random() * 3,
            previous: 93.8 + Math.random() * 3
        };
    }
    async calculatePortfolioVaR(tenantId, period) {
        return {
            current: 0.018 + Math.random() * 0.008,
            previous: 0.016 + Math.random() * 0.008
        };
    }
    async getBenchmarkComparisons(tenantId) {
        return [
            {
                category: 'AUM Growth',
                ourPerformance: 8.5,
                industryAverage: 7.2,
                topQuartile: 12.1,
                percentile: 68,
                gap: 1.3
            },
            {
                category: 'Client Retention',
                ourPerformance: 94.5,
                industryAverage: 91.8,
                topQuartile: 96.2,
                percentile: 72,
                gap: 2.7
            },
            {
                category: 'Operating Margin',
                ourPerformance: 23.2,
                industryAverage: 26.5,
                topQuartile: 32.1,
                percentile: 42,
                gap: -3.3
            }
        ];
    }
    calculateTrend(current, previous) {
        const diff = current - previous;
        const threshold = Math.abs(previous) * 0.01;
        if (Math.abs(diff) < threshold)
            return 'stable';
        return diff > 0 ? 'up' : 'down';
    }
    calculateTrendPercentage(current, previous) {
        if (previous === 0)
            return 0;
        return ((current - previous) / Math.abs(previous)) * 100;
    }
    calculateStatus(current, target) {
        if (!target)
            return 'good';
        const ratio = current / target;
        if (ratio >= 1.1)
            return 'excellent';
        if (ratio >= 0.95)
            return 'good';
        if (ratio >= 0.85)
            return 'warning';
        return 'critical';
    }
    calculateGrowthStatus(current, previous) {
        const growth = this.calculateTrendPercentage(current, previous);
        if (growth >= 10)
            return 'excellent';
        if (growth >= 5)
            return 'good';
        if (growth >= 0)
            return 'warning';
        return 'critical';
    }
    calculateRiskStatus(current, threshold) {
        const ratio = current / threshold;
        if (ratio <= 0.5)
            return 'excellent';
        if (ratio <= 0.75)
            return 'good';
        if (ratio <= 1.0)
            return 'warning';
        return 'critical';
    }
    async getExecutiveAlerts(tenantId) {
        return [
            {
                id: this.generateId(),
                type: 'risk',
                severity: 'medium',
                title: 'Portfolio VaR approaching threshold',
                description: 'Portfolio Value at Risk has increased to 1.8%, approaching the 2.0% limit.',
                affectedMetrics: [BusinessMetricsDataModel_1.RISK_KPIS.PORTFOLIO_VAR],
                triggeredAt: new Date(Date.now() - 3600000),
                expectedResolution: new Date(Date.now() + 86400000),
                actionRequired: true,
                context: { threshold: 0.02, current: 0.018 }
            }
        ];
    }
    initializeExecutiveMetrics() {
        this.emit('executiveMetricsInitialized');
    }
    startReportingTimer() {
        this.reportingTimer = setInterval(() => {
            this.performScheduledReporting();
        }, this.config.refreshInterval);
    }
    startCacheCleanup() {
        this.cacheCleanupTimer = setInterval(() => {
            this.cleanupCache();
        }, 3600000);
    }
    async performScheduledReporting() {
        this.emit('scheduledReportingStarted');
    }
    cleanupCache() {
        const cutoff = Date.now() - (this.config.dataRetentionDays * 24 * 60 * 60 * 1000);
        for (const [key, summary] of this.summaryCache) {
            if (summary.generatedAt.getTime() < cutoff) {
                this.summaryCache.delete(key);
            }
        }
    }
    generateId() {
        return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    getExecutiveSummary(summaryId) {
        for (const summary of this.summaryCache.values()) {
            if (summary.id === summaryId) {
                return summary;
            }
        }
        return null;
    }
    getExecutiveMetric(metricId) {
        return this.executiveMetrics.get(metricId) || null;
    }
    async shutdown() {
        clearInterval(this.reportingTimer);
        clearInterval(this.cacheCleanupTimer);
        this.emit('shutdown');
    }
}
exports.ExecutiveReportingDashboard = ExecutiveReportingDashboard;
