export const __esModule: boolean;
export class BusinessIntelligenceService {
    constructor(eventPublisher: any);
    eventPublisher: any;
    reports: Map<any, any>;
    biIntegrations: Map<any, any>;
    reportTemplates: Map<any, any>;
    scheduledReports: Map<any, any>;
    generateReport(request: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        tenantId: any;
        name: any;
        description: any;
        category: any;
        reportType: any;
        visualizations: string[];
        metrics: {
            id: `${string}-${string}-${string}-${string}-${string}`;
            name: any;
            type: any;
            value: any;
            previousValue: any;
            changeValue: number;
            changePercent: number;
            unit: string;
            description: string;
            calculationMethod: string;
            lastUpdated: Date;
            confidence: number;
        }[];
        insights: {
            id: `${string}-${string}-${string}-${string}-${string}`;
            type: string;
            title: string;
            description: string;
            confidence: number;
            impact: string;
            category: string;
            entities: {
                portfolios: any;
            };
            insights: {
                key: string;
                value: number;
                explanation: string;
            }[];
            recommendations: {
                action: string;
                reasoning: string;
                expectedImpact: string;
                priority: string;
            }[];
            supportingData: {};
            generatedAt: Date;
            validUntil: Date;
        }[];
        keyFindings: any[];
        recommendations: {
            title: string;
            description: string;
            priority: string;
            timeframe: string;
        }[];
        generatedAt: Date;
        periodCovered: any;
        recipients: any;
        deliveryMethod: string;
        format: any;
    }>;
    generateExecutiveSummary(tenantId: any, period: any): Promise<{
        period: any;
        totalAssets: number;
        totalClients: number;
        performanceHighlights: {
            bestPerforming: {
                name: string;
                return: number;
            }[];
            worstPerforming: {
                name: string;
                return: number;
            }[];
            avgReturn: number;
            benchmarkComparison: number;
        };
        riskMetrics: {
            avgVaR: number;
            maxDrawdown: number;
            volatility: number;
            sharpeRatio: number;
        };
        keyAlerts: {
            high: number;
            medium: number;
            low: number;
        };
        businessMetrics: {
            newClients: number;
            assetsGrowth: number;
            revenueGrowth: number;
            clientSatisfaction: number;
        };
    }>;
    generateMarketIntelligence(): Promise<{
        marketOverview: {
            marketCondition: string;
            volatilityLevel: string;
            majorIndices: {
                name: string;
                value: number;
                change: number;
                changePercent: number;
            }[];
        };
        sectorAnalysis: {
            sector: string;
            performance: number;
            outlook: string;
            weight: number;
        }[];
        economicIndicators: {
            indicator: string;
            value: number;
            previousValue: number;
            impact: string;
        }[];
        alerts: {
            type: string;
            message: string;
            priority: string;
            actionRequired: boolean;
        }[];
    }>;
    generateClientAnalysis(tenantId: any, period: any): Promise<{
        demographics: {
            totalClients: number;
            newClients: number;
            clientRetention: number;
            avgAccountSize: number;
            clientsByRiskProfile: {
                Conservative: number;
                Moderate: number;
                Aggressive: number;
            };
            clientsByAge: {
                '25-35': number;
                '36-50': number;
                '51-65': number;
                '65+': number;
            };
        };
        satisfactionMetrics: {
            overallSatisfaction: number;
            npsScore: number;
            responseRate: number;
            keyDrivers: string[];
        };
        engagementMetrics: {
            loginFrequency: number;
            documentViews: number;
            messagesSent: number;
            meetingsScheduled: number;
        };
        growthOpportunities: {
            crossSelling: {
                client: string;
                opportunity: string;
                value: number;
            }[];
            referralPotential: {
                client: string;
                score: number;
            }[];
            atRiskClients: {
                client: string;
                riskScore: number;
                reason: string;
            }[];
        };
    }>;
    configureBIIntegration(tenantId: any, config: any): Promise<any>;
    syncWithBITool(tenantId: any): Promise<void>;
    scheduleAutomatedReports(tenantId: any, reportConfigs: any): Promise<void>;
    getReportHistory(tenantId: any, category: any, limit?: number): Promise<any[]>;
    exportReport(reportId: any, format: any): Promise<{
        content: string;
        mimeType: string;
        filename: string;
    }>;
    gatherMetrics(request: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        name: any;
        type: any;
        value: any;
        previousValue: any;
        changeValue: number;
        changePercent: number;
        unit: string;
        description: string;
        calculationMethod: string;
        lastUpdated: Date;
        confidence: number;
    }[]>;
    gatherInsights(request: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        type: string;
        title: string;
        description: string;
        confidence: number;
        impact: string;
        category: string;
        entities: {
            portfolios: any;
        };
        insights: {
            key: string;
            value: number;
            explanation: string;
        }[];
        recommendations: {
            action: string;
            reasoning: string;
            expectedImpact: string;
            priority: string;
        }[];
        supportingData: {};
        generatedAt: Date;
        validUntil: Date;
    }[]>;
    generateKeyFindings(metrics: any, insights: any, request: any): Promise<any[]>;
    generateRecommendations(keyFindings: any, request: any): Promise<{
        title: string;
        description: string;
        priority: string;
        timeframe: string;
    }[]>;
    createReportVisualizations(category: any, metrics: any): Promise<string[]>;
    createMetric(name: any, type: any, value: any, previousValue: any): {
        id: `${string}-${string}-${string}-${string}-${string}`;
        name: any;
        type: any;
        value: any;
        previousValue: any;
        changeValue: number;
        changePercent: number;
        unit: string;
        description: string;
        calculationMethod: string;
        lastUpdated: Date;
        confidence: number;
    };
    getMetricUnit(type: any): "" | "%" | "ratio";
    generateReportDescription(category: any): any;
    gatherPerformanceData(tenantId: any, period: any): Promise<{
        topPerformers: {
            name: string;
            return: number;
        }[];
        bottomPerformers: {
            name: string;
            return: number;
        }[];
        avgReturn: number;
        benchmarkComparison: number;
    }>;
    gatherRiskData(tenantId: any, period: any): Promise<{
        avgVaR: number;
        maxDrawdown: number;
        volatility: number;
        sharpeRatio: number;
    }>;
    gatherBusinessData(tenantId: any, period: any): Promise<{
        totalAssets: number;
        totalClients: number;
        newClients: number;
        assetsGrowth: number;
        revenueGrowth: number;
        clientSatisfaction: number;
    }>;
    gatherAlertsData(tenantId: any, period: any): Promise<{
        severity: string;
        type: string;
    }[]>;
    gatherMarketData(): Promise<{
        condition: string;
        volatilityLevel: string;
        indices: {
            name: string;
            value: number;
            change: number;
            changePercent: number;
        }[];
    }>;
    gatherSectorData(): Promise<{
        sector: string;
        performance: number;
        outlook: string;
        weight: number;
    }[]>;
    gatherEconomicData(): Promise<{
        indicator: string;
        value: number;
        previousValue: number;
        impact: string;
    }[]>;
    generateMarketAlerts(): Promise<{
        type: string;
        message: string;
        priority: string;
        actionRequired: boolean;
    }[]>;
    gatherClientDemographics(tenantId: any, period: any): Promise<{
        totalClients: number;
        newClients: number;
        clientRetention: number;
        avgAccountSize: number;
        clientsByRiskProfile: {
            Conservative: number;
            Moderate: number;
            Aggressive: number;
        };
        clientsByAge: {
            '25-35': number;
            '36-50': number;
            '51-65': number;
            '65+': number;
        };
    }>;
    gatherSatisfactionMetrics(tenantId: any, period: any): Promise<{
        overallSatisfaction: number;
        npsScore: number;
        responseRate: number;
        keyDrivers: string[];
    }>;
    gatherEngagementMetrics(tenantId: any, period: any): Promise<{
        loginFrequency: number;
        documentViews: number;
        messagesSent: number;
        meetingsScheduled: number;
    }>;
    identifyGrowthOpportunities(tenantId: any, period: any): Promise<{
        crossSelling: {
            client: string;
            opportunity: string;
            value: number;
        }[];
        referralPotential: {
            client: string;
            score: number;
        }[];
        atRiskClients: {
            client: string;
            riskScore: number;
            reason: string;
        }[];
    }>;
    testBIConnection(config: any): Promise<boolean>;
    prepareBISyncData(tenantId: any): Promise<{
        portfolios: any[];
        clients: any[];
        metrics: any[];
        totalRecords: number;
    }>;
    pushDataToBITool(config: any, data: any): Promise<void>;
    getScheduleInterval(frequency: any): any;
    generateScheduledReport(tenantId: any, config: any): Promise<void>;
    scheduleReportDelivery(report: any): Promise<void>;
    generatePDFReport(report: any): Promise<string>;
    generateExcelReport(report: any): Promise<string>;
    generateHTMLReport(report: any): Promise<string>;
    initializeReportTemplates(): void;
    initializeBIIntegrations(): void;
}
