import { EventEmitter } from 'events';
export interface MeetingMetrics {
    id: string;
    tenantId: string;
    meetingId: string;
    period: {
        start: Date;
        end: Date;
        type: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
    };
    attendance: {
        invited: number;
        attended: number;
        declined: number;
        noShow: number;
        attendanceRate: number;
        avgJoinTime: number;
        avgDuration: number;
        onTimeRate: number;
    };
    engagement: {
        participationRate: number;
        chatMessages: number;
        screenShares: number;
        pollsAnswered: number;
        reactionsUsed: number;
        questionsAsked: number;
        avgSpeakingTime: number;
        silencePercentage: number;
        interactionScore: number;
    };
    productivity: {
        agendaItemsCovered: number;
        agendaCompletionRate: number;
        decisionsRecorded: number;
        actionItemsCreated: number;
        actionItemsCompleted: number;
        followUpMeetingsScheduled: number;
        meetingEffectivenessScore: number;
        timeBoxAdherence: number;
    };
    technical: {
        avgVideoQuality: number;
        avgAudioQuality: number;
        connectionIssues: number;
        techSupportRequests: number;
        deviceBreakdown: Record<string, number>;
        browserBreakdown: Record<string, number>;
        networkQuality: {
            excellent: number;
            good: number;
            fair: number;
            poor: number;
        };
        recordingSuccessRate: number;
    };
    satisfaction: {
        overallRating: number;
        responseRate: number;
        ratings: {
            content: number;
            facilitation: number;
            technology: number;
            duration: number;
            timing: number;
        };
        npsScore?: number;
        feedbackCount: number;
        improvementSuggestions: string[];
    };
    cost: {
        estimated: number;
        actual?: number;
        currency: string;
        breakdown: {
            personnel: number;
            technology: number;
            facilities: number;
            materials: number;
        };
        costPerParticipant: number;
        costPerMinute: number;
    };
    outcomes: {
        objectives: {
            defined: number;
            achieved: number;
            partially_achieved: number;
            not_achieved: number;
            achievementRate: number;
        };
        nextSteps: {
            defined: number;
            assigned: number;
            started: number;
            completionRate: number;
        };
        roi: {
            estimated?: number;
            actual?: number;
            paybackPeriod?: number;
        };
    };
    createdAt: Date;
    updatedAt: Date;
}
export interface AnalyticsReport {
    id: string;
    tenantId: string;
    name: string;
    description?: string;
    type: 'executive_summary' | 'detailed_analysis' | 'comparison' | 'trend_analysis' | 'department_report' | 'user_report' | 'meeting_type_report' | 'custom';
    period: {
        start: Date;
        end: Date;
        comparison?: {
            start: Date;
            end: Date;
        };
    };
    filters: {
        meetingTypes?: string[];
        departments?: string[];
        users?: string[];
        locations?: string[];
        minParticipants?: number;
        maxParticipants?: number;
        minDuration?: number;
        maxDuration?: number;
        tags?: string[];
    };
    metrics: {
        totalMeetings: number;
        totalHours: number;
        totalParticipants: number;
        avgMeetingDuration: number;
        avgParticipants: number;
        topPerformingMeetings: {
            meetingId: string;
            title: string;
            score: number;
            reason: string;
        }[];
        underperformingMeetings: {
            meetingId: string;
            title: string;
            score: number;
            issues: string[];
        }[];
        trends: {
            metric: string;
            direction: 'up' | 'down' | 'stable';
            change: number;
            significance: 'high' | 'medium' | 'low';
        }[];
        benchmarks: {
            metric: string;
            current: number;
            industry?: number;
            internal?: number;
            target?: number;
            status: 'above' | 'meeting' | 'below';
        }[];
    };
    insights: {
        type: 'positive' | 'negative' | 'neutral' | 'opportunity' | 'risk';
        category: 'attendance' | 'engagement' | 'productivity' | 'technical' | 'satisfaction' | 'cost';
        message: string;
        impact: 'high' | 'medium' | 'low';
        confidence: number;
        recommendations?: string[];
    }[];
    recommendations: {
        id: string;
        category: 'scheduling' | 'facilitation' | 'technology' | 'process' | 'training';
        priority: 'high' | 'medium' | 'low';
        title: string;
        description: string;
        expectedImpact: string;
        effort: 'low' | 'medium' | 'high';
        timeline: string;
        cost?: number;
        roi?: number;
        status: 'pending' | 'in_progress' | 'completed' | 'declined';
    }[];
    visualizations: {
        type: 'line_chart' | 'bar_chart' | 'pie_chart' | 'heatmap' | 'gauge' | 'scatter_plot' | 'funnel';
        title: string;
        data: any;
        config?: Record<string, any>;
    }[];
    export: {
        formats: ('pdf' | 'excel' | 'powerpoint' | 'csv' | 'json')[];
        scheduledDelivery?: {
            enabled: boolean;
            frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
            recipients: string[];
            nextDelivery?: Date;
        };
    };
    status: 'generating' | 'ready' | 'failed' | 'archived';
    generatedBy: {
        userId: string;
        userName: string;
    };
    createdAt: Date;
    updatedAt: Date;
}
export interface AnalyticsDashboard {
    id: string;
    tenantId: string;
    name: string;
    description?: string;
    layout: {
        widgets: {
            id: string;
            type: 'metric_card' | 'chart' | 'table' | 'heatmap' | 'gauge' | 'trend_indicator';
            title: string;
            position: {
                x: number;
                y: number;
                width: number;
                height: number;
            };
            config: {
                metric?: string;
                dataSource?: string;
                filters?: Record<string, any>;
                visualization?: Record<string, any>;
                refreshInterval?: number;
                thresholds?: {
                    good: number;
                    warning: number;
                    critical: number;
                };
            };
        }[];
        theme: {
            primaryColor: string;
            secondaryColor: string;
            backgroundColor: string;
            fontFamily: string;
        };
    };
    permissions: {
        viewers: string[];
        editors: string[];
        public: boolean;
    };
    realTimeEnabled: boolean;
    refreshInterval: number;
    lastUpdated: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface MeetingBenchmark {
    id: string;
    category: 'attendance' | 'engagement' | 'productivity' | 'technical' | 'satisfaction' | 'cost';
    metric: string;
    industry?: {
        value: number;
        source: string;
        lastUpdated: Date;
    };
    internal?: {
        value: number;
        calculation: 'average' | 'median' | 'percentile_75' | 'percentile_90';
        period: number;
        lastCalculated: Date;
    };
    target?: {
        value: number;
        setBy: string;
        reasoning: string;
        deadline?: Date;
    };
    thresholds: {
        excellent: number;
        good: number;
        fair: number;
        poor: number;
    };
    unit: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface PredictiveInsight {
    id: string;
    tenantId: string;
    type: 'trend_forecast' | 'anomaly_detection' | 'optimization_opportunity' | 'risk_prediction';
    metric: string;
    category: string;
    prediction: {
        timeframe: number;
        confidence: number;
        value?: number;
        direction?: 'increase' | 'decrease' | 'stable';
        magnitude?: 'high' | 'medium' | 'low';
    };
    factors: {
        factor: string;
        influence: number;
        confidence: number;
    }[];
    recommendations: {
        action: string;
        impact: string;
        effort: 'low' | 'medium' | 'high';
        priority: 'high' | 'medium' | 'low';
    }[];
    model: {
        type: 'linear_regression' | 'arima' | 'prophet' | 'random_forest' | 'neural_network';
        accuracy: number;
        lastTrained: Date;
        features: string[];
    };
    status: 'active' | 'inactive' | 'outdated';
    createdAt: Date;
    updatedAt: Date;
}
export interface AnalyticsConfig {
    enabled: boolean;
    realTimeProcessing: boolean;
    batchProcessingInterval: number;
    retentionDays: number;
    anonymizeData: boolean;
    enablePredictive: boolean;
    benchmarkSources: string[];
    defaultDashboard: string;
    alertThresholds: {
        lowAttendance: number;
        poorEngagement: number;
        highCancellationRate: number;
        techIssues: number;
        lowSatisfaction: number;
    };
    exportFormats: string[];
    scheduledReports: boolean;
    apiRateLimit: number;
}
export declare class MeetingAnalyticsService extends EventEmitter {
    private metrics;
    private reports;
    private dashboards;
    private benchmarks;
    private insights;
    private config;
    constructor(config?: Partial<AnalyticsConfig>);
    private initializeBenchmarks;
    private initializeDefaultDashboard;
    private startBackgroundProcessing;
    collectMeetingMetrics(meetingData: {
        meetingId: string;
        tenantId: string;
        title: string;
        type: string;
        startTime: Date;
        endTime: Date;
        participants: any[];
        engagement?: any;
        outcomes?: any;
        technical?: any;
        cost?: any;
    }): Promise<MeetingMetrics>;
    private calculateAttendanceMetrics;
    private calculateEngagementMetrics;
    private calculateProductivityMetrics;
    private calculateTechnicalMetrics;
    private calculateSatisfactionMetrics;
    private calculateCostMetrics;
    private calculateOutcomeMetrics;
    private processMetricsRealTime;
    private checkAlertThresholds;
    private updateDashboards;
    generateReport(reportRequest: {
        tenantId: string;
        type: AnalyticsReport['type'];
        name: string;
        description?: string;
        period: {
            start: Date;
            end: Date;
        };
        filters?: AnalyticsReport['filters'];
        comparison?: {
            start: Date;
            end: Date;
        };
        userId: string;
        userName: string;
    }): Promise<AnalyticsReport>;
    private calculateReportMetrics;
    private generateReportInsights;
    private generateRecommendations;
    private generateVisualizations;
    createDashboard(dashboardData: Omit<AnalyticsDashboard, 'id' | 'createdAt' | 'updatedAt' | 'lastUpdated'>): Promise<AnalyticsDashboard>;
    getDashboards(tenantId: string): Promise<AnalyticsDashboard[]>;
    getDashboard(dashboardId: string): Promise<AnalyticsDashboard | null>;
    private generatePredictiveInsights;
    private updatePredictiveModels;
    private processMetricsBatch;
    private updateInternalBenchmarks;
    private cleanupOldMetrics;
    getMetrics(filters?: {
        tenantId?: string;
        meetingId?: string;
        startDate?: Date;
        endDate?: Date;
    }): Promise<MeetingMetrics[]>;
    getReports(tenantId: string): Promise<AnalyticsReport[]>;
    getReport(reportId: string): Promise<AnalyticsReport | null>;
    getBenchmarks(): Promise<MeetingBenchmark[]>;
    getPredictiveInsights(tenantId: string): Promise<PredictiveInsight[]>;
    getSystemHealth(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        metrics: {
            total: number;
            recent: number;
        };
        reports: {
            total: number;
            generating: number;
            failed: number;
        };
        dashboards: {
            total: number;
            realTime: number;
        };
        insights: {
            total: number;
            active: number;
        };
        processing: {
            realTimeEnabled: boolean;
            lastBatchProcessing: Date;
            queueSize: number;
        };
        timestamp: Date;
    }>;
    shutdown(): Promise<any>;
}
export default MeetingAnalyticsService;
