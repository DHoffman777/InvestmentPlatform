import { BusinessIntelligenceReport } from '../../models/analytics/Analytics';
import { EventPublisher } from '../../utils/eventPublisher';
interface ReportGenerationRequest {
    tenantId: string;
    reportType: BusinessIntelligenceReport['reportType'];
    category: BusinessIntelligenceReport['category'];
    name: string;
    description?: string;
    periodCovered: {
        startDate: Date;
        endDate: Date;
    };
    entities?: {
        portfolios?: string[];
        clients?: string[];
        advisors?: string[];
    };
    includeInsights?: boolean;
    format?: BusinessIntelligenceReport['format'];
    recipients?: string[];
}
interface BIIntegrationConfig {
    provider: 'power_bi' | 'tableau' | 'qlik' | 'looker' | 'custom';
    connectionString: string;
    apiKey?: string;
    refreshSchedule: string;
    dataSetIds: string[];
    enabled: boolean;
    autoRefresh: boolean;
    lastSync?: Date;
}
interface ExecutiveSummary {
    period: {
        startDate: Date;
        endDate: Date;
    };
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
}
interface MarketIntelligence {
    marketOverview: {
        marketCondition: 'bullish' | 'bearish' | 'neutral';
        volatilityLevel: 'low' | 'medium' | 'high';
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
        outlook: 'positive' | 'negative' | 'neutral';
        weight: number;
    }[];
    economicIndicators: {
        indicator: string;
        value: number;
        previousValue: number;
        impact: 'positive' | 'negative' | 'neutral';
    }[];
    alerts: {
        type: 'opportunity' | 'risk' | 'trend';
        message: string;
        priority: 'high' | 'medium' | 'low';
        actionRequired: boolean;
    }[];
}
interface ClientAnalysis {
    demographics: {
        totalClients: number;
        newClients: number;
        clientRetention: number;
        avgAccountSize: number;
        clientsByRiskProfile: Record<string, number>;
        clientsByAge: Record<string, number>;
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
}
export declare class BusinessIntelligenceService {
    private eventPublisher;
    private reports;
    private biIntegrations;
    private reportTemplates;
    private scheduledReports;
    constructor(eventPublisher?: EventPublisher);
    generateReport(request: ReportGenerationRequest): Promise<BusinessIntelligenceReport>;
    generateExecutiveSummary(tenantId: string, period: {
        startDate: Date;
        endDate: Date;
    }): Promise<ExecutiveSummary>;
    generateMarketIntelligence(): Promise<MarketIntelligence>;
    generateClientAnalysis(tenantId: string, period: {
        startDate: Date;
        endDate: Date;
    }): Promise<ClientAnalysis>;
    configureBIIntegration(tenantId: string, config: Omit<BIIntegrationConfig, 'lastSync'>): Promise<BIIntegrationConfig>;
    syncWithBITool(tenantId: string): Promise<any>;
    scheduleAutomatedReports(tenantId: string, reportConfigs: {
        category: BusinessIntelligenceReport['category'];
        frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
        recipients: string[];
        format: BusinessIntelligenceReport['format'];
    }[]): Promise<any>;
    getReportHistory(tenantId: string, category?: BusinessIntelligenceReport['category'], limit?: number): Promise<BusinessIntelligenceReport[]>;
    exportReport(reportId: string, format: 'pdf' | 'excel' | 'json' | 'html'): Promise<{
        content: string;
        mimeType: string;
        filename: string;
    }>;
    private gatherMetrics;
    private gatherInsights;
    private generateKeyFindings;
    private generateRecommendations;
    private createReportVisualizations;
    private createMetric;
    private getMetricUnit;
    private generateReportDescription;
    private gatherPerformanceData;
    private gatherRiskData;
    private gatherBusinessData;
    private gatherAlertsData;
    private gatherMarketData;
    private gatherSectorData;
    private gatherEconomicData;
    private generateMarketAlerts;
    private gatherClientDemographics;
    private gatherSatisfactionMetrics;
    private gatherEngagementMetrics;
    private identifyGrowthOpportunities;
    private testBIConnection;
    private prepareBISyncData;
    private pushDataToBITool;
    private getScheduleInterval;
    private generateScheduledReport;
    private scheduleReportDelivery;
    private generatePDFReport;
    private generateExcelReport;
    private generateHTMLReport;
    private initializeReportTemplates;
    private initializeBIIntegrations;
}
export {};
