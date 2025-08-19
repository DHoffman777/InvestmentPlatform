import { EventEmitter } from 'events';
export interface RiskReport {
    reportId: string;
    reportName: string;
    reportType: 'EXECUTIVE_SUMMARY' | 'DETAILED_ANALYSIS' | 'OPERATIONAL_METRICS' | 'REGULATORY_FILING' | 'EXCEPTION_REPORT' | 'TREND_ANALYSIS' | 'CUSTOM';
    frequency: 'REAL_TIME' | 'HOURLY' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ON_DEMAND';
    recipients: string[];
    parameters: ReportParameters;
    generatedAt: Date;
    generatedBy: string;
    dataRange: DateRange;
    format: 'PDF' | 'HTML' | 'EXCEL' | 'CSV' | 'JSON';
    status: 'GENERATING' | 'COMPLETED' | 'FAILED' | 'SCHEDULED';
    filePath?: string;
    fileSize?: number;
    content?: ReportContent;
}
export interface ReportParameters {
    includeExecutiveSummary: boolean;
    includeDetailedMetrics: boolean;
    includeCharts: boolean;
    includeTrendAnalysis: boolean;
    includeExceptions: boolean;
    includeRecommendations: boolean;
    riskThreshold: number;
    counterpartyFilter?: string[];
    securityTypeFilter?: string[];
    portfolioFilter?: string[];
    minimumNotional?: number;
    customFilters?: {
        [key: string]: any;
    };
}
export interface DateRange {
    startDate: Date;
    endDate: Date;
    timezone: string;
}
export interface ReportContent {
    executiveSummary: ExecutiveSummary;
    riskMetrics: RiskMetrics;
    settlementMetrics: SettlementMetrics;
    counterpartyAnalysis: CounterpartyAnalysis;
    trendAnalysis: TrendAnalysis;
    exceptionReports: ExceptionReport[];
    recommendations: Recommendation[];
    charts: ChartData[];
}
export interface ExecutiveSummary {
    reportPeriod: string;
    totalInstructions: number;
    highRiskInstructions: number;
    riskExposure: number;
    avgRiskScore: number;
    settlementSuccessRate: number;
    keyRisks: string[];
    criticalIssues: string[];
    trend: 'IMPROVING' | 'STABLE' | 'DETERIORATING';
}
export interface RiskMetrics {
    overallRiskScore: number;
    riskDistribution: {
        [riskLevel: string]: number;
    };
    exposureLimits: ExposureLimitMetrics[];
    concentrationRisk: ConcentrationMetrics;
    liquidityRisk: LiquidityMetrics;
    operationalRisk: OperationalMetrics;
    marketRisk: MarketRiskMetrics;
}
export interface SettlementMetrics {
    totalVolume: number;
    totalNotional: number;
    settlementSuccessRate: number;
    avgSettlementTime: number;
    failureRate: number;
    delayRate: number;
    avgDelayDuration: number;
    failuresByType: {
        [type: string]: number;
    };
    delaysByType: {
        [type: string]: number;
    };
    performanceByCounterparty: CounterpartyPerformance[];
}
export interface CounterpartyAnalysis {
    totalCounterparties: number;
    highRiskCounterparties: number;
    newCounterparties: number;
    counterpartyRiskDistribution: {
        [riskTier: string]: number;
    };
    topRiskyCounterparties: CounterpartyRiskSummary[];
    concentrationByCounterparty: ConcentrationSummary[];
    performanceMetrics: CounterpartyPerformanceMetrics[];
}
export interface TrendAnalysis {
    riskTrends: TrendDataPoint[];
    volumeTrends: TrendDataPoint[];
    performanceTrends: TrendDataPoint[];
    seasonalPatterns: SeasonalPattern[];
    correlationAnalysis: CorrelationData[];
    predictiveInsights: PredictiveInsight[];
}
export interface ExceptionReport {
    exceptionId: string;
    type: 'LIMIT_BREACH' | 'FAILURE_PREDICTION' | 'UNUSUAL_ACTIVITY' | 'SYSTEM_ALERT' | 'COMPLIANCE_ISSUE';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    description: string;
    affectedInstructions: string[];
    detectedAt: Date;
    status: 'OPEN' | 'INVESTIGATING' | 'RESOLVED' | 'ACKNOWLEDGED';
    assignedTo?: string;
    resolution?: string;
    resolutionTime?: Date;
}
export interface Recommendation {
    id: string;
    category: 'RISK_REDUCTION' | 'PROCESS_IMPROVEMENT' | 'SYSTEM_ENHANCEMENT' | 'POLICY_CHANGE';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    title: string;
    description: string;
    rationale: string;
    expectedBenefit: string;
    implementationCost: 'LOW' | 'MEDIUM' | 'HIGH';
    timeframe: string;
    dependencies: string[];
    kpis: string[];
}
export interface ChartData {
    chartId: string;
    chartType: 'LINE' | 'BAR' | 'PIE' | 'SCATTER' | 'HEATMAP' | 'GAUGE';
    title: string;
    description: string;
    xAxis: string;
    yAxis: string;
    data: any[];
    configuration: any;
}
export interface ExposureLimitMetrics {
    limitType: string;
    totalLimit: number;
    currentUtilization: number;
    utilizationPercentage: number;
    breachCount: number;
    nearBreachCount: number;
}
export interface ConcentrationMetrics {
    maxConcentration: number;
    avgConcentration: number;
    concentrationScore: number;
    highConcentrationCount: number;
    concentrationByAssetClass: {
        [assetClass: string]: number;
    };
}
export interface LiquidityMetrics {
    avgLiquidityScore: number;
    illiquidPositionsCount: number;
    liquidityRiskScore: number;
    marketImpactScore: number;
}
export interface OperationalMetrics {
    systemUptime: number;
    processingCapacity: number;
    errorRate: number;
    avgProcessingTime: number;
    automationRate: number;
}
export interface MarketRiskMetrics {
    volatilityIndex: number;
    correlationRisk: number;
    stressTestResults: StressTestResult[];
    varMeasure: number;
}
export interface CounterpartyPerformance {
    counterpartyId: string;
    name: string;
    successRate: number;
    avgDelayDays: number;
    totalVolume: number;
    riskTier: string;
}
export interface CounterpartyRiskSummary {
    counterpartyId: string;
    name: string;
    riskScore: number;
    riskTier: string;
    exposure: number;
    concentration: number;
    recentIssues: number;
}
export interface ConcentrationSummary {
    counterpartyId: string;
    name: string;
    concentration: number;
    exposure: number;
    riskAdjustedExposure: number;
}
export interface CounterpartyPerformanceMetrics {
    counterpartyId: string;
    name: string;
    metrics: {
        successRate: number;
        avgSettlementTime: number;
        reliabilityScore: number;
        volumeRank: number;
    };
}
export interface TrendDataPoint {
    date: Date;
    value: number;
    label?: string;
    category?: string;
}
export interface SeasonalPattern {
    pattern: string;
    description: string;
    seasonality: number;
    confidence: number;
}
export interface CorrelationData {
    metric1: string;
    metric2: string;
    correlation: number;
    significance: number;
}
export interface PredictiveInsight {
    insight: string;
    confidence: number;
    timeframe: string;
    expectedImpact: string;
    recommendation: string;
}
export interface StressTestResult {
    scenario: string;
    impact: number;
    probability: number;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}
export interface ReportTemplate {
    templateId: string;
    templateName: string;
    description: string;
    reportType: RiskReport['reportType'];
    defaultParameters: ReportParameters;
    sections: ReportSection[];
    charts: ChartTemplate[];
    isSystem: boolean;
    createdBy: string;
    createdAt: Date;
    usageCount: number;
}
export interface ReportSection {
    sectionId: string;
    sectionName: string;
    order: number;
    isRequired: boolean;
    contentType: 'SUMMARY' | 'TABLE' | 'CHART' | 'TEXT' | 'METRICS';
    parameters: any;
}
export interface ChartTemplate {
    chartId: string;
    chartName: string;
    chartType: ChartData['chartType'];
    dataSource: string;
    configuration: any;
    isRequired: boolean;
}
export interface ReportSchedule {
    scheduleId: string;
    reportTemplate: string;
    frequency: RiskReport['frequency'];
    recipients: string[];
    parameters: ReportParameters;
    nextRun: Date;
    lastRun?: Date;
    isActive: boolean;
    createdBy: string;
    createdAt: Date;
}
export declare class SettlementRiskReportingService extends EventEmitter {
    private reports;
    private reportTemplates;
    private reportSchedules;
    private generatedReports;
    private riskDataService;
    private settlementDataService;
    private counterpartyDataService;
    constructor();
    private initializeDefaultTemplates;
    private startScheduledReporting;
    private processScheduledReports;
    private generateScheduledReport;
    private calculateDateRange;
    private calculateNextRun;
    generateReport(request: {
        reportName: string;
        reportType: RiskReport['reportType'];
        templateId?: string;
        parameters: ReportParameters;
        recipients: string[];
        dateRange: DateRange;
        format: RiskReport['format'];
        generatedBy: string;
    }): Promise<RiskReport>;
    private generateReportContent;
    private generateExecutiveSummary;
    private generateRiskMetrics;
    private generateSettlementMetrics;
    private generateCounterpartyAnalysis;
    private generateTrendAnalysis;
    private generateExceptionReports;
    private generateRecommendations;
    private generateCharts;
    private generateTimeSeriesData;
    private generateHeatmapData;
    private generateReportFile;
    private getFileSize;
    private distributeReport;
    private formatDate;
    private formatDateRange;
    createReportTemplate(templateData: Omit<ReportTemplate, 'templateId' | 'createdAt' | 'usageCount'>): ReportTemplate;
    createReportSchedule(scheduleData: Omit<ReportSchedule, 'scheduleId' | 'nextRun' | 'createdAt'>): ReportSchedule;
    updateReportSchedule(scheduleId: string, updates: Partial<ReportSchedule>): ReportSchedule | null;
    deleteReportSchedule(scheduleId: string): boolean;
    getReport(reportId: string): RiskReport | undefined;
    getReportTemplate(templateId: string): ReportTemplate | undefined;
    getAllReportTemplates(): ReportTemplate[];
    getReportSchedule(scheduleId: string): ReportSchedule | undefined;
    getAllReportSchedules(): ReportSchedule[];
    getActiveSchedules(): ReportSchedule[];
    getReportsForRecipient(recipient: string): RiskReport[];
    getReportsByType(reportType: RiskReport['reportType']): RiskReport[];
    getRecentReports(days?: number): RiskReport[];
    generateReportingSummary(): {
        totalReports: number;
        reportsToday: number;
        activeSchedules: number;
        popularTemplates: {
            templateId: string;
            name: string;
            usageCount: number;
        }[];
        reportsByType: {
            [type: string]: number;
        };
        avgGenerationTime: number;
        successRate: number;
    };
}
