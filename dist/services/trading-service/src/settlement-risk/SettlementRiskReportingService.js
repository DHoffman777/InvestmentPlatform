"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettlementRiskReportingService = void 0;
const events_1 = require("events");
const uuid_1 = require("uuid");
class SettlementRiskReportingService extends events_1.EventEmitter {
    reports;
    reportTemplates;
    reportSchedules;
    generatedReports;
    // Data aggregation and analysis components
    riskDataService;
    settlementDataService;
    counterpartyDataService;
    constructor() {
        super();
        this.reports = new Map();
        this.reportTemplates = new Map();
        this.reportSchedules = new Map();
        this.generatedReports = new Map();
        this.initializeDefaultTemplates();
        this.startScheduledReporting();
    }
    initializeDefaultTemplates() {
        const defaultTemplates = [
            {
                templateId: (0, uuid_1.v4)(),
                templateName: 'Executive Risk Dashboard',
                description: 'High-level risk overview for executive management',
                reportType: 'EXECUTIVE_SUMMARY',
                defaultParameters: {
                    includeExecutiveSummary: true,
                    includeDetailedMetrics: false,
                    includeCharts: true,
                    includeTrendAnalysis: true,
                    includeExceptions: true,
                    includeRecommendations: true,
                    riskThreshold: 0.7
                },
                sections: [
                    {
                        sectionId: (0, uuid_1.v4)(),
                        sectionName: 'Executive Summary',
                        order: 1,
                        isRequired: true,
                        contentType: 'SUMMARY',
                        parameters: {}
                    },
                    {
                        sectionId: (0, uuid_1.v4)(),
                        sectionName: 'Key Risk Metrics',
                        order: 2,
                        isRequired: true,
                        contentType: 'METRICS',
                        parameters: {}
                    },
                    {
                        sectionId: (0, uuid_1.v4)(),
                        sectionName: 'Critical Issues',
                        order: 3,
                        isRequired: true,
                        contentType: 'TABLE',
                        parameters: { maxRows: 10 }
                    }
                ],
                charts: [
                    {
                        chartId: (0, uuid_1.v4)(),
                        chartName: 'Risk Distribution',
                        chartType: 'PIE',
                        dataSource: 'risk_distribution',
                        configuration: { showPercentages: true },
                        isRequired: true
                    },
                    {
                        chartId: (0, uuid_1.v4)(),
                        chartName: 'Risk Trend',
                        chartType: 'LINE',
                        dataSource: 'risk_trends',
                        configuration: { timeframe: '30d' },
                        isRequired: true
                    }
                ],
                isSystem: true,
                createdBy: 'system',
                createdAt: new Date(),
                usageCount: 0
            },
            {
                templateId: (0, uuid_1.v4)(),
                templateName: 'Operational Risk Report',
                description: 'Detailed operational metrics and analysis',
                reportType: 'OPERATIONAL_METRICS',
                defaultParameters: {
                    includeExecutiveSummary: false,
                    includeDetailedMetrics: true,
                    includeCharts: true,
                    includeTrendAnalysis: true,
                    includeExceptions: true,
                    includeRecommendations: false,
                    riskThreshold: 0.5
                },
                sections: [
                    {
                        sectionId: (0, uuid_1.v4)(),
                        sectionName: 'Settlement Metrics',
                        order: 1,
                        isRequired: true,
                        contentType: 'METRICS',
                        parameters: {}
                    },
                    {
                        sectionId: (0, uuid_1.v4)(),
                        sectionName: 'Counterparty Performance',
                        order: 2,
                        isRequired: true,
                        contentType: 'TABLE',
                        parameters: { sortBy: 'risk', maxRows: 25 }
                    },
                    {
                        sectionId: (0, uuid_1.v4)(),
                        sectionName: 'Exception Analysis',
                        order: 3,
                        isRequired: true,
                        contentType: 'TABLE',
                        parameters: { groupBy: 'type' }
                    }
                ],
                charts: [
                    {
                        chartId: (0, uuid_1.v4)(),
                        chartName: 'Settlement Success Rate',
                        chartType: 'GAUGE',
                        dataSource: 'settlement_success_rate',
                        configuration: { target: 98 },
                        isRequired: true
                    },
                    {
                        chartId: (0, uuid_1.v4)(),
                        chartName: 'Counterparty Risk Heatmap',
                        chartType: 'HEATMAP',
                        dataSource: 'counterparty_risk',
                        configuration: { dimensions: ['risk', 'volume'] },
                        isRequired: true
                    }
                ],
                isSystem: true,
                createdBy: 'system',
                createdAt: new Date(),
                usageCount: 0
            },
            {
                templateId: (0, uuid_1.v4)(),
                templateName: 'Regulatory Compliance Report',
                description: 'Report for regulatory filing and compliance',
                reportType: 'REGULATORY_FILING',
                defaultParameters: {
                    includeExecutiveSummary: true,
                    includeDetailedMetrics: true,
                    includeCharts: false,
                    includeTrendAnalysis: false,
                    includeExceptions: true,
                    includeRecommendations: false,
                    riskThreshold: 0.0
                },
                sections: [
                    {
                        sectionId: (0, uuid_1.v4)(),
                        sectionName: 'Compliance Summary',
                        order: 1,
                        isRequired: true,
                        contentType: 'SUMMARY',
                        parameters: {}
                    },
                    {
                        sectionId: (0, uuid_1.v4)(),
                        sectionName: 'Risk Exposures',
                        order: 2,
                        isRequired: true,
                        contentType: 'TABLE',
                        parameters: { includeAll: true }
                    },
                    {
                        sectionId: (0, uuid_1.v4)(),
                        sectionName: 'Limit Breaches',
                        order: 3,
                        isRequired: true,
                        contentType: 'TABLE',
                        parameters: { breachesOnly: true }
                    }
                ],
                charts: [],
                isSystem: true,
                createdBy: 'system',
                createdAt: new Date(),
                usageCount: 0
            }
        ];
        defaultTemplates.forEach(template => {
            this.reportTemplates.set(template.templateId, template);
        });
    }
    startScheduledReporting() {
        // Check for scheduled reports every hour
        setInterval(() => {
            this.processScheduledReports();
        }, 60 * 60 * 1000);
    }
    async processScheduledReports() {
        const now = new Date();
        for (const schedule of this.reportSchedules.values()) {
            if (schedule.isActive && schedule.nextRun <= now) {
                try {
                    await this.generateScheduledReport(schedule);
                }
                catch (error) {
                    this.emit('scheduledReportError', { scheduleId: schedule.scheduleId, error: error instanceof Error ? error.message : 'Unknown error' });
                }
            }
        }
    }
    async generateScheduledReport(schedule) {
        const template = this.reportTemplates.get(schedule.reportTemplate);
        if (!template)
            return;
        const dateRange = this.calculateDateRange(schedule.frequency);
        const report = await this.generateReport({
            reportName: `${template.templateName} - ${this.formatDate(new Date())}`,
            reportType: template.reportType,
            templateId: template.templateId,
            parameters: schedule.parameters,
            recipients: schedule.recipients,
            dateRange,
            format: 'PDF',
            generatedBy: 'system'
        });
        // Update schedule for next run
        schedule.lastRun = new Date();
        schedule.nextRun = this.calculateNextRun(schedule.frequency, schedule.lastRun);
        this.emit('scheduledReportGenerated', { schedule, report });
    }
    calculateDateRange(frequency) {
        const endDate = new Date();
        const startDate = new Date();
        switch (frequency) {
            case 'HOURLY':
                startDate.setHours(startDate.getHours() - 1);
                break;
            case 'DAILY':
                startDate.setDate(startDate.getDate() - 1);
                break;
            case 'WEEKLY':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case 'MONTHLY':
                startDate.setMonth(startDate.getMonth() - 1);
                break;
            case 'QUARTERLY':
                startDate.setMonth(startDate.getMonth() - 3);
                break;
            default:
                startDate.setDate(startDate.getDate() - 1);
        }
        return {
            startDate,
            endDate,
            timezone: 'UTC'
        };
    }
    calculateNextRun(frequency, lastRun) {
        const nextRun = new Date(lastRun);
        switch (frequency) {
            case 'HOURLY':
                nextRun.setHours(nextRun.getHours() + 1);
                break;
            case 'DAILY':
                nextRun.setDate(nextRun.getDate() + 1);
                break;
            case 'WEEKLY':
                nextRun.setDate(nextRun.getDate() + 7);
                break;
            case 'MONTHLY':
                nextRun.setMonth(nextRun.getMonth() + 1);
                break;
            case 'QUARTERLY':
                nextRun.setMonth(nextRun.getMonth() + 3);
                break;
            default:
                nextRun.setDate(nextRun.getDate() + 1);
        }
        return nextRun;
    }
    async generateReport(request) {
        const reportId = (0, uuid_1.v4)();
        const report = {
            reportId,
            reportName: request.reportName,
            reportType: request.reportType,
            frequency: 'ON_DEMAND',
            recipients: request.recipients,
            parameters: request.parameters,
            generatedAt: new Date(),
            generatedBy: request.generatedBy,
            dataRange: request.dateRange,
            format: request.format,
            status: 'GENERATING'
        };
        this.reports.set(reportId, report);
        this.emit('reportGenerationStarted', report);
        try {
            // Generate report content
            const content = await this.generateReportContent(report);
            report.content = content;
            // Generate file based on format
            const filePath = await this.generateReportFile(report);
            report.filePath = filePath;
            report.fileSize = await this.getFileSize(filePath);
            report.status = 'COMPLETED';
            this.generatedReports.set(reportId, report);
            this.emit('reportGenerated', report);
            // Send to recipients
            await this.distributeReport(report);
            return report;
        }
        catch (error) {
            report.status = 'FAILED';
            this.emit('reportGenerationFailed', { report, error: error instanceof Error ? error.message : 'Unknown error' });
            throw error;
        }
    }
    async generateReportContent(report) {
        const content = {
            executiveSummary: await this.generateExecutiveSummary(report),
            riskMetrics: await this.generateRiskMetrics(report),
            settlementMetrics: await this.generateSettlementMetrics(report),
            counterpartyAnalysis: await this.generateCounterpartyAnalysis(report),
            trendAnalysis: await this.generateTrendAnalysis(report),
            exceptionReports: await this.generateExceptionReports(report),
            recommendations: await this.generateRecommendations(report),
            charts: await this.generateCharts(report)
        };
        return content;
    }
    async generateExecutiveSummary(report) {
        // Mock implementation - would aggregate real data
        const mockData = {
            totalInstructions: Math.floor(Math.random() * 10000) + 5000,
            highRiskInstructions: Math.floor(Math.random() * 500) + 100,
            avgRiskScore: Math.random() * 0.3 + 0.4, // 0.4-0.7
            settlementSuccessRate: Math.random() * 0.05 + 0.95, // 95-100%
        };
        return {
            reportPeriod: this.formatDateRange(report.dataRange),
            totalInstructions: mockData.totalInstructions,
            highRiskInstructions: mockData.highRiskInstructions,
            riskExposure: mockData.totalInstructions * 50000000 * mockData.avgRiskScore, // Estimated exposure
            avgRiskScore: mockData.avgRiskScore,
            settlementSuccessRate: mockData.settlementSuccessRate,
            keyRisks: [
                'Counterparty concentration risk in financial services sector',
                'Elevated market volatility impacting settlement timing',
                'System capacity constraints during peak hours'
            ],
            criticalIssues: [
                'Settlement failure rate exceeded threshold for ABC Bank',
                'Liquidity constraints identified for structured products'
            ],
            trend: mockData.avgRiskScore > 0.6 ? 'DETERIORATING' : mockData.avgRiskScore < 0.5 ? 'IMPROVING' : 'STABLE'
        };
    }
    async generateRiskMetrics(report) {
        // Mock risk metrics generation
        return {
            overallRiskScore: Math.random() * 0.4 + 0.3, // 0.3-0.7
            riskDistribution: {
                'VERY_LOW': Math.floor(Math.random() * 2000) + 1000,
                'LOW': Math.floor(Math.random() * 3000) + 2000,
                'MEDIUM': Math.floor(Math.random() * 1500) + 800,
                'HIGH': Math.floor(Math.random() * 500) + 200,
                'VERY_HIGH': Math.floor(Math.random() * 100) + 50
            },
            exposureLimits: [
                {
                    limitType: 'COUNTERPARTY',
                    totalLimit: 100000000,
                    currentUtilization: 75000000,
                    utilizationPercentage: 75,
                    breachCount: 2,
                    nearBreachCount: 5
                },
                {
                    limitType: 'CONCENTRATION',
                    totalLimit: 50000000,
                    currentUtilization: 42000000,
                    utilizationPercentage: 84,
                    breachCount: 0,
                    nearBreachCount: 3
                }
            ],
            concentrationRisk: {
                maxConcentration: 0.25,
                avgConcentration: 0.12,
                concentrationScore: 0.68,
                highConcentrationCount: 8,
                concentrationByAssetClass: {
                    'EQUITY': 0.35,
                    'CORPORATE_BOND': 0.28,
                    'GOVERNMENT_BOND': 0.15,
                    'STRUCTURED_PRODUCT': 0.22
                }
            },
            liquidityRisk: {
                avgLiquidityScore: 72,
                illiquidPositionsCount: 45,
                liquidityRiskScore: 0.32,
                marketImpactScore: 0.18
            },
            operationalRisk: {
                systemUptime: 99.7,
                processingCapacity: 85,
                errorRate: 0.02,
                avgProcessingTime: 23.5,
                automationRate: 87
            },
            marketRisk: {
                volatilityIndex: 0.28,
                correlationRisk: 0.45,
                stressTestResults: [
                    { scenario: 'Market Crash', impact: 0.25, probability: 0.05, severity: 'HIGH' },
                    { scenario: 'Credit Crisis', impact: 0.35, probability: 0.03, severity: 'CRITICAL' }
                ],
                varMeasure: 2500000
            }
        };
    }
    async generateSettlementMetrics(report) {
        const totalVolume = Math.floor(Math.random() * 50000) + 25000;
        const totalNotional = totalVolume * (Math.random() * 100000 + 50000);
        return {
            totalVolume,
            totalNotional,
            settlementSuccessRate: Math.random() * 0.05 + 0.95, // 95-100%
            avgSettlementTime: Math.random() * 12 + 24, // 24-36 hours
            failureRate: Math.random() * 0.03 + 0.01, // 1-4%
            delayRate: Math.random() * 0.08 + 0.05, // 5-13%
            avgDelayDuration: Math.random() * 8 + 4, // 4-12 hours
            failuresByType: {
                'COUNTERPARTY_ISSUE': Math.floor(Math.random() * 50) + 20,
                'SYSTEM_ERROR': Math.floor(Math.random() * 30) + 10,
                'DOCUMENTATION_ERROR': Math.floor(Math.random() * 40) + 15,
                'LIQUIDITY_ISSUE': Math.floor(Math.random() * 25) + 8
            },
            delaysByType: {
                'PROCESSING_DELAY': Math.floor(Math.random() * 150) + 80,
                'APPROVAL_DELAY': Math.floor(Math.random() * 100) + 50,
                'COMMUNICATION_DELAY': Math.floor(Math.random() * 80) + 30,
                'TECHNICAL_DELAY': Math.floor(Math.random() * 60) + 25
            },
            performanceByCounterparty: [
                {
                    counterpartyId: 'cp_001',
                    name: 'Bank ABC',
                    successRate: 0.98,
                    avgDelayDays: 0.2,
                    totalVolume: 15000,
                    riskTier: 'LOW'
                },
                {
                    counterpartyId: 'cp_002',
                    name: 'Investment Firm XYZ',
                    successRate: 0.94,
                    avgDelayDays: 0.8,
                    totalVolume: 8000,
                    riskTier: 'MEDIUM'
                }
            ]
        };
    }
    async generateCounterpartyAnalysis(report) {
        return {
            totalCounterparties: Math.floor(Math.random() * 200) + 150,
            highRiskCounterparties: Math.floor(Math.random() * 25) + 10,
            newCounterparties: Math.floor(Math.random() * 15) + 5,
            counterpartyRiskDistribution: {
                'MINIMAL': Math.floor(Math.random() * 50) + 40,
                'LOW': Math.floor(Math.random() * 80) + 60,
                'MODERATE': Math.floor(Math.random() * 40) + 30,
                'HIGH': Math.floor(Math.random() * 20) + 15,
                'SEVERE': Math.floor(Math.random() * 10) + 5
            },
            topRiskyCounterparties: [
                {
                    counterpartyId: 'cp_high_1',
                    name: 'High Risk Counterparty 1',
                    riskScore: 0.85,
                    riskTier: 'HIGH',
                    exposure: 25000000,
                    concentration: 0.15,
                    recentIssues: 3
                },
                {
                    counterpartyId: 'cp_high_2',
                    name: 'High Risk Counterparty 2',
                    riskScore: 0.78,
                    riskTier: 'HIGH',
                    exposure: 18000000,
                    concentration: 0.12,
                    recentIssues: 2
                }
            ],
            concentrationByCounterparty: [
                {
                    counterpartyId: 'cp_conc_1',
                    name: 'Concentrated Counterparty',
                    concentration: 0.22,
                    exposure: 35000000,
                    riskAdjustedExposure: 28000000
                }
            ],
            performanceMetrics: [
                {
                    counterpartyId: 'cp_perf_1',
                    name: 'Top Performer',
                    metrics: {
                        successRate: 0.995,
                        avgSettlementTime: 1.2,
                        reliabilityScore: 0.92,
                        volumeRank: 1
                    }
                }
            ]
        };
    }
    async generateTrendAnalysis(report) {
        const generateTrendData = (days) => {
            const data = [];
            const endDate = report.dataRange.endDate;
            for (let i = days - 1; i >= 0; i--) {
                const date = new Date(endDate);
                date.setDate(date.getDate() - i);
                data.push({
                    date,
                    value: Math.random() * 0.5 + 0.3, // 0.3-0.8
                    label: this.formatDate(date)
                });
            }
            return data;
        };
        return {
            riskTrends: generateTrendData(30),
            volumeTrends: generateTrendData(30).map(d => ({ ...d, value: d.value * 10000 })),
            performanceTrends: generateTrendData(30).map(d => ({ ...d, value: 0.95 + d.value * 0.05 })),
            seasonalPatterns: [
                {
                    pattern: 'Month-end spike',
                    description: 'Settlement volume increases 40% in last 3 days of month',
                    seasonality: 0.4,
                    confidence: 0.85
                },
                {
                    pattern: 'Friday concentration',
                    description: 'Higher failure rates on Fridays due to weekend processing',
                    seasonality: 0.25,
                    confidence: 0.72
                }
            ],
            correlationAnalysis: [
                {
                    metric1: 'Market Volatility',
                    metric2: 'Settlement Delays',
                    correlation: 0.68,
                    significance: 0.95
                },
                {
                    metric1: 'Trading Volume',
                    metric2: 'System Load',
                    correlation: 0.82,
                    significance: 0.99
                }
            ],
            predictiveInsights: [
                {
                    insight: 'Settlement failure rate likely to increase by 15% next week',
                    confidence: 0.75,
                    timeframe: '7 days',
                    expectedImpact: 'Medium increase in operational load',
                    recommendation: 'Increase monitoring and prepare contingency measures'
                }
            ]
        };
    }
    async generateExceptionReports(report) {
        return [
            {
                exceptionId: (0, uuid_1.v4)(),
                type: 'LIMIT_BREACH',
                severity: 'HIGH',
                description: 'Counterparty exposure limit exceeded by 15%',
                affectedInstructions: ['inst_001', 'inst_002', 'inst_003'],
                detectedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
                status: 'INVESTIGATING',
                assignedTo: 'risk_analyst_1'
            },
            {
                exceptionId: (0, uuid_1.v4)(),
                type: 'FAILURE_PREDICTION',
                severity: 'MEDIUM',
                description: 'High probability of settlement failure detected',
                affectedInstructions: ['inst_004'],
                detectedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
                status: 'OPEN'
            },
            {
                exceptionId: (0, uuid_1.v4)(),
                type: 'UNUSUAL_ACTIVITY',
                severity: 'LOW',
                description: 'Unusual trading pattern detected for counterparty XYZ',
                affectedInstructions: ['inst_005', 'inst_006'],
                detectedAt: new Date(Date.now() - 4 * 60 * 60 * 1000), // 4 hours ago
                status: 'ACKNOWLEDGED',
                assignedTo: 'operations_manager'
            }
        ];
    }
    async generateRecommendations(report) {
        return [
            {
                id: (0, uuid_1.v4)(),
                category: 'RISK_REDUCTION',
                priority: 'HIGH',
                title: 'Implement Dynamic Risk Limits',
                description: 'Implement market-condition-based dynamic risk limits to better manage exposure',
                rationale: 'Static limits do not account for changing market conditions and seasonal patterns',
                expectedBenefit: '25% reduction in limit breaches and improved risk-adjusted returns',
                implementationCost: 'MEDIUM',
                timeframe: '3-6 months',
                dependencies: ['Market data integration', 'Risk model enhancement'],
                kpis: ['Limit breach frequency', 'Risk-adjusted returns', 'Operational efficiency']
            },
            {
                id: (0, uuid_1.v4)(),
                category: 'PROCESS_IMPROVEMENT',
                priority: 'MEDIUM',
                title: 'Enhance Counterparty Communication',
                description: 'Implement proactive communication protocols for high-risk settlements',
                rationale: 'Early communication reduces settlement failures and improves counterparty relationships',
                expectedBenefit: '15% improvement in settlement success rates',
                implementationCost: 'LOW',
                timeframe: '1-2 months',
                dependencies: ['Communication system upgrade'],
                kpis: ['Settlement success rate', 'Counterparty satisfaction', 'Operational costs']
            },
            {
                id: (0, uuid_1.v4)(),
                category: 'SYSTEM_ENHANCEMENT',
                priority: 'CRITICAL',
                title: 'Upgrade Settlement Infrastructure',
                description: 'Modernize settlement systems to handle increased volume and complexity',
                rationale: 'Current system approaching capacity limits with growing business volume',
                expectedBenefit: '50% increase in processing capacity and 30% reduction in processing time',
                implementationCost: 'HIGH',
                timeframe: '12-18 months',
                dependencies: ['Budget approval', 'Vendor selection', 'Regulatory approval'],
                kpis: ['System throughput', 'Processing time', 'System availability', 'Error rates']
            }
        ];
    }
    async generateCharts(report) {
        return [
            {
                chartId: (0, uuid_1.v4)(),
                chartType: 'PIE',
                title: 'Risk Distribution by Level',
                description: 'Distribution of settlements across risk levels',
                xAxis: 'Risk Level',
                yAxis: 'Count',
                data: [
                    { label: 'Very Low', value: 2500, percentage: 40 },
                    { label: 'Low', value: 2000, percentage: 32 },
                    { label: 'Medium', value: 1200, percentage: 19 },
                    { label: 'High', value: 400, percentage: 7 },
                    { label: 'Very High', value: 150, percentage: 2 }
                ],
                configuration: { showPercentages: true, colors: ['#00ff00', '#90ff00', '#ffff00', '#ff9000', '#ff0000'] }
            },
            {
                chartId: (0, uuid_1.v4)(),
                chartType: 'LINE',
                title: 'Settlement Success Rate Trend',
                description: '30-day trend of settlement success rates',
                xAxis: 'Date',
                yAxis: 'Success Rate (%)',
                data: this.generateTimeSeriesData(30, 95, 100),
                configuration: { target: 98, showTarget: true }
            },
            {
                chartId: (0, uuid_1.v4)(),
                chartType: 'BAR',
                title: 'Counterparty Risk Distribution',
                description: 'Number of counterparties by risk tier',
                xAxis: 'Risk Tier',
                yAxis: 'Count',
                data: [
                    { label: 'Minimal', value: 45 },
                    { label: 'Low', value: 70 },
                    { label: 'Moderate', value: 35 },
                    { label: 'High', value: 18 },
                    { label: 'Severe', value: 7 }
                ],
                configuration: { colors: ['#00ff00', '#90ff00', '#ffff00', '#ff9000', '#ff0000'] }
            },
            {
                chartId: (0, uuid_1.v4)(),
                chartType: 'HEATMAP',
                title: 'Risk vs Volume Matrix',
                description: 'Settlement risk mapped against volume',
                xAxis: 'Volume Quintile',
                yAxis: 'Risk Score',
                data: this.generateHeatmapData(),
                configuration: { colorScale: 'risk' }
            }
        ];
    }
    generateTimeSeriesData(days, min, max) {
        const data = [];
        const range = max - min;
        for (let i = 0; i < days; i++) {
            const date = new Date();
            date.setDate(date.getDate() - (days - 1 - i));
            data.push({
                x: this.formatDate(date),
                y: min + Math.random() * range,
                date: date.toISOString().split('T')[0]
            });
        }
        return data;
    }
    generateHeatmapData() {
        const data = [];
        const volumeQuintiles = ['Q1', 'Q2', 'Q3', 'Q4', 'Q5'];
        const riskLevels = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];
        volumeQuintiles.forEach((volume, i) => {
            riskLevels.forEach((risk, j) => {
                data.push({
                    x: volume,
                    y: risk,
                    value: Math.random() * 100,
                    count: Math.floor(Math.random() * 1000) + 100
                });
            });
        });
        return data;
    }
    async generateReportFile(report) {
        // Mock file generation - would use actual reporting libraries
        const fileName = `${report.reportName.replace(/\s+/g, '_')}_${this.formatDate(new Date(), 'file')}.${report.format.toLowerCase()}`;
        const filePath = `/reports/${fileName}`;
        // Simulate file generation delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        return filePath;
    }
    async getFileSize(filePath) {
        // Mock file size - would check actual file
        return Math.floor(Math.random() * 5000000) + 1000000; // 1-6MB
    }
    async distributeReport(report) {
        // Mock report distribution
        for (const recipient of report.recipients) {
            this.emit('reportDistributed', {
                reportId: report.reportId,
                recipient,
                distributedAt: new Date(),
                method: 'email'
            });
        }
    }
    // Utility methods
    formatDate(date, format = 'display') {
        if (format === 'file') {
            return date.toISOString().split('T')[0].replace(/-/g, '');
        }
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
    formatDateRange(range) {
        return `${this.formatDate(range.startDate)} - ${this.formatDate(range.endDate)}`;
    }
    // Public management methods
    createReportTemplate(templateData) {
        const template = {
            ...templateData,
            templateId: (0, uuid_1.v4)(),
            createdAt: new Date(),
            usageCount: 0
        };
        this.reportTemplates.set(template.templateId, template);
        this.emit('reportTemplateCreated', template);
        return template;
    }
    createReportSchedule(scheduleData) {
        const schedule = {
            ...scheduleData,
            scheduleId: (0, uuid_1.v4)(),
            nextRun: this.calculateNextRun(scheduleData.frequency, new Date()),
            createdAt: new Date()
        };
        this.reportSchedules.set(schedule.scheduleId, schedule);
        this.emit('reportScheduleCreated', schedule);
        return schedule;
    }
    updateReportSchedule(scheduleId, updates) {
        const existing = this.reportSchedules.get(scheduleId);
        if (!existing)
            return null;
        const updated = { ...existing, ...updates };
        // Recalculate next run if frequency changed
        if (updates.frequency) {
            updated.nextRun = this.calculateNextRun(updates.frequency, new Date());
        }
        this.reportSchedules.set(scheduleId, updated);
        this.emit('reportScheduleUpdated', updated);
        return updated;
    }
    deleteReportSchedule(scheduleId) {
        const schedule = this.reportSchedules.get(scheduleId);
        if (schedule) {
            this.reportSchedules.delete(scheduleId);
            this.emit('reportScheduleDeleted', { scheduleId, schedule });
            return true;
        }
        return false;
    }
    // Getter methods
    getReport(reportId) {
        return this.reports.get(reportId);
    }
    getReportTemplate(templateId) {
        return this.reportTemplates.get(templateId);
    }
    getAllReportTemplates() {
        return Array.from(this.reportTemplates.values());
    }
    getReportSchedule(scheduleId) {
        return this.reportSchedules.get(scheduleId);
    }
    getAllReportSchedules() {
        return Array.from(this.reportSchedules.values());
    }
    getActiveSchedules() {
        return Array.from(this.reportSchedules.values()).filter(s => s.isActive);
    }
    getReportsForRecipient(recipient) {
        return Array.from(this.reports.values())
            .filter(report => report.recipients.includes(recipient))
            .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());
    }
    getReportsByType(reportType) {
        return Array.from(this.reports.values())
            .filter(report => report.reportType === reportType)
            .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());
    }
    getRecentReports(days = 30) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return Array.from(this.reports.values())
            .filter(report => report.generatedAt >= cutoff)
            .sort((a, b) => b.generatedAt.getTime() - a.generatedAt.getTime());
    }
    generateReportingSummary() {
        const allReports = Array.from(this.reports.values());
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const reportsToday = allReports.filter(r => r.generatedAt >= today).length;
        const activeSchedules = this.getActiveSchedules().length;
        const popularTemplates = Array.from(this.reportTemplates.values())
            .sort((a, b) => b.usageCount - a.usageCount)
            .slice(0, 5)
            .map(t => ({ templateId: t.templateId, name: t.templateName, usageCount: t.usageCount }));
        const reportsByType = {};
        allReports.forEach(report => {
            reportsByType[report.reportType] = (reportsByType[report.reportType] || 0) + 1;
        });
        const completedReports = allReports.filter(r => r.status === 'COMPLETED');
        const successRate = allReports.length > 0 ? completedReports.length / allReports.length : 0;
        return {
            totalReports: allReports.length,
            reportsToday,
            activeSchedules,
            popularTemplates,
            reportsByType,
            avgGenerationTime: 120, // Mock: 2 minutes average
            successRate
        };
    }
}
exports.SettlementRiskReportingService = SettlementRiskReportingService;
