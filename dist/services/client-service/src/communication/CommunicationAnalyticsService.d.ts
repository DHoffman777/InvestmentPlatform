import { EventEmitter } from 'events';
export interface CommunicationMetrics {
    totalCommunications: number;
    communicationsByChannel: Record<string, number>;
    communicationsByType: Record<string, number>;
    communicationsByPriority: Record<string, number>;
    responseTimeMetrics: {
        averageResponseTime: number;
        medianResponseTime: number;
        p95ResponseTime: number;
        slaComplianceRate: number;
    };
    volumeMetrics: {
        dailyAverage: number;
        weeklyAverage: number;
        monthlyAverage: number;
        peakHours: Array<{
            hour: number;
            count: number;
        }>;
        peakDays: Array<{
            day: string;
            count: number;
        }>;
    };
    sentimentAnalysis: {
        positive: number;
        neutral: number;
        negative: number;
        averageSentimentScore: number;
    };
    clientEngagementMetrics: {
        uniqueClientsContacted: number;
        averageCommunicationsPerClient: number;
        highFrequencyClients: Array<{
            clientId: string;
            count: number;
        }>;
        clientSatisfactionScore: number;
    };
}
export interface CommunicationTrend {
    id: string;
    tenantId: string;
    period: {
        start: Date;
        end: Date;
        type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    };
    metrics: CommunicationMetrics;
    trends: {
        volumeChange: number;
        responseTimeChange: number;
        sentimentChange: number;
        channelDistributionChange: Record<string, number>;
    };
    insights: Array<{
        type: 'volume_spike' | 'response_delay' | 'sentiment_decline' | 'channel_shift' | 'client_escalation';
        description: string;
        severity: 'low' | 'medium' | 'high' | 'critical';
        recommendation: string;
        confidence: number;
    }>;
    generatedAt: Date;
}
export interface CommunicationAnalyticsConfig {
    enableRealTimeAnalytics: boolean;
    metricsRetentionDays: number;
    sentimentAnalysisEnabled: boolean;
    responseTimeSlaHours: number;
    highVolumeThreshold: number;
    lowSentimentThreshold: number;
    analysisIntervals: {
        realTime: number;
        hourly: number;
        daily: number;
        weekly: number;
    };
    alertThresholds: {
        volumeSpike: number;
        responseTimeDelay: number;
        sentimentDrop: number;
        slaViolation: number;
    };
}
export interface ClientCommunicationProfile {
    clientId: string;
    tenantId: string;
    communicationPreferences: {
        preferredChannels: string[];
        frequencyTolerance: 'low' | 'medium' | 'high';
        bestContactTimes: Array<{
            dayOfWeek: number;
            startHour: number;
            endHour: number;
        }>;
        communicationStyle: 'formal' | 'casual' | 'technical';
    };
    historicalMetrics: {
        totalCommunications: number;
        averageResponseTime: number;
        satisfactionScore: number;
        lastContactDate: Date;
        communicationFrequency: number;
    };
    behaviorAnalysis: {
        responsiveness: 'high' | 'medium' | 'low';
        preferredTopics: string[];
        escalationPatterns: Array<{
            trigger: string;
            frequency: number;
            averageResolutionTime: number;
        }>;
        communicationEffectiveness: number;
    };
    predictiveInsights: {
        nextContactProbability: number;
        churnRisk: number;
        satisfactionTrend: 'improving' | 'stable' | 'declining';
        recommendedActions: string[];
    };
    updatedAt: Date;
}
export interface CommunicationReport {
    id: string;
    tenantId: string;
    reportType: 'summary' | 'detailed' | 'compliance' | 'performance' | 'client_analysis';
    period: {
        start: Date;
        end: Date;
    };
    generatedAt: Date;
    generatedBy: string;
    sections: Array<{
        title: string;
        type: 'metrics' | 'charts' | 'table' | 'insights' | 'recommendations';
        data: any;
        visualization?: {
            chartType: 'line' | 'bar' | 'pie' | 'heatmap' | 'scatter' | 'histogram';
            config: Record<string, any>;
        };
    }>;
    executiveSummary: {
        keyMetrics: Array<{
            name: string;
            value: string | number;
            change: number;
        }>;
        topInsights: string[];
        criticalIssues: string[];
        recommendations: string[];
    };
    exportFormats: Array<'pdf' | 'excel' | 'csv' | 'json'>;
}
export declare class CommunicationAnalyticsService extends EventEmitter {
    private config;
    private metricsCache;
    private trendsCache;
    private clientProfiles;
    private activeAnalytics;
    private reportsCache;
    constructor(config: CommunicationAnalyticsConfig);
    private initializeAnalytics;
    private startRealTimeAnalytics;
    private schedulePeriodicAnalytics;
    calculateCommunicationMetrics(tenantId: string, period: {
        start: Date;
        end: Date;
    }, filters?: {
        channels?: string[];
        types?: string[];
        clientIds?: string[];
        employeeIds?: string[];
    }): Promise<CommunicationMetrics>;
    generateCommunicationTrends(tenantId: string, period: {
        start: Date;
        end: Date;
        type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
    }): Promise<CommunicationTrend>;
    generateClientCommunicationProfile(clientId: string, tenantId: string): Promise<ClientCommunicationProfile>;
    generateCommunicationReport(tenantId: string, reportType: CommunicationReport['reportType'], period: {
        start: Date;
        end: Date;
    }, options?: {
        includeCharts?: boolean;
        includeClientAnalysis?: boolean;
        includeCompliance?: boolean;
        exportFormats?: Array<'pdf' | 'excel' | 'csv' | 'json'>;
        recipients?: string[];
    }): Promise<CommunicationReport>;
    performSentimentAnalysis(communications: any[], options?: {
        includeEmotions?: boolean;
        includeTopics?: boolean;
        batchSize?: number;
    }): Promise<Array<{
        communicationId: string;
        sentiment: 'positive' | 'neutral' | 'negative';
        score: number;
        confidence: number;
        emotions?: Record<string, number>;
        topics?: Array<{
            topic: string;
            relevance: number;
        }>;
    }>>;
    identifyClientRiskFactors(clientId: string, tenantId: string): Promise<Array<{
        factor: 'high_frequency' | 'low_satisfaction' | 'escalation_pattern' | 'communication_gap' | 'sentiment_decline';
        severity: 'low' | 'medium' | 'high' | 'critical';
        description: string;
        recommendation: string;
        confidence: number;
    }>>;
    private performRealTimeAnalysis;
    private performHourlyAnalysis;
    private performDailyAnalysis;
    private performWeeklyAnalysis;
    private aggregateByField;
    private calculateResponseTimeMetrics;
    private calculateVolumeMetrics;
    private calculateSentimentMetrics;
    private calculateClientEngagementMetrics;
    private calculateTrendChanges;
    private generateTrendInsights;
    private generateId;
    private calculatePreviousPeriod;
    private determinePeriodType;
    private getCommunications;
    private getClientCommunications;
    private getRecentCommunications;
    private getActiveTenants;
    private analyzeClientPreferences;
    private calculateClientMetrics;
    private analyzeClientBehavior;
    private generateClientInsights;
    private buildReportSections;
    private generateExecutiveSummary;
    private distributeReport;
    private analyzeCommunicationSentiment;
    private processRealTimeAlerts;
    private checkMetricThresholds;
    private updateClientProfiles;
    private performMaintenanceTasks;
    private calculateAverageClientSatisfaction;
    shutdown(): Promise<any>;
}
