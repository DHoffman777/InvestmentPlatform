import { BestExecutionReport, RegulatoryFiling } from '../../models/regulatory/Regulatory';
interface ExecutionVenueData {
    venueId: string;
    venueName: string;
    venueType: 'exchange' | 'dark_pool' | 'market_maker' | 'ecn' | 'ats' | 'other';
    orderFlow: {
        totalOrders: number;
        totalShares: number;
        totalNotionalValue: number;
        marketOrders: number;
        limitOrders: number;
        otherOrders: number;
    };
    executionMetrics: {
        priceImprovement: number;
        marketableOrderFillRate: number;
        nonMarketableOrderFillRate: number;
        averageEffectiveSpread: number;
        averageRealizedSpread: number;
        priceImprovementRate: number;
    };
}
interface BestExecutionReportData {
    tenantId: string;
    reportingPeriod: {
        startDate: Date;
        endDate: Date;
    };
    reportType: 'quarterly' | 'annual' | 'ad_hoc';
    executionVenues: ExecutionVenueData[];
    orderAnalysis: {
        totalOrders: number;
        ordersByAssetClass: Array<{
            assetClass: string;
            orderCount: number;
            shareVolume: number;
            notionalValue: number;
        }>;
        ordersBySize: Array<{
            sizeRange: string;
            orderCount: number;
            averageExecutionQuality: number;
        }>;
        ordersByTimeOfDay: Array<{
            timeRange: string;
            orderCount: number;
            executionQuality: number;
        }>;
    };
    conflictsOfInterest?: {
        identified: boolean;
        description?: string;
        mitigationMeasures?: string[];
    };
}
interface BestExecutionValidationResult {
    isValid: boolean;
    errors: Array<{
        section: string;
        field: string;
        message: string;
        severity: 'error' | 'warning';
    }>;
    warnings: Array<{
        section: string;
        field: string;
        message: string;
    }>;
    completionPercentage: number;
    analysisResults: {
        totalExecutionValue: number;
        venueConcentration: number;
        averageExecutionQuality: number;
        complianceScore: number;
    };
}
interface ExecutionQualityMetrics {
    implementation_shortfall: number;
    volume_weighted_average_price_variance: number;
    effective_spread: number;
    realized_spread: number;
    price_improvement_opportunity: number;
    market_impact: number;
    timing_risk: number;
    opportunity_cost: number;
}
export declare class BestExecutionService {
    private eventPublisher;
    private reports;
    private filings;
    constructor();
    createBestExecutionReport(data: BestExecutionReportData): Promise<BestExecutionReport>;
    validateBestExecutionReport(reportId: string): Promise<BestExecutionValidationResult>;
    submitBestExecutionReport(reportId: string, submittedBy: string): Promise<RegulatoryFiling>;
    generateExecutionQualityAnalysis(reportId: string): Promise<{
        overallMetrics: ExecutionQualityMetrics;
        venueComparison: Array<{
            venueName: string;
            venueType: string;
            executionScore: number;
            strengths: string[];
            improvements: string[];
            recommendation: 'increase' | 'maintain' | 'decrease' | 'discontinue';
        }>;
        recommendations: {
            immediate: string[];
            shortTerm: string[];
            longTerm: string[];
        };
        benchmarkComparison: {
            industryAverages: Record<string, number>;
            relativePerformance: 'above_market' | 'at_market' | 'below_market';
            improvementOpportunities: string[];
        };
    }>;
    getBestExecutionReport(reportId: string): Promise<BestExecutionReport | null>;
    getBestExecutionReportsByTenant(tenantId: string): Promise<BestExecutionReport[]>;
    updateBestExecutionReport(reportId: string, updates: Partial<BestExecutionReport>): Promise<BestExecutionReport>;
    private calculateExecutionQualityMetrics;
    private calculateVenueConcentration;
    private calculateAverageExecutionQuality;
    private calculateVenueExecutionScore;
    private calculateComplianceScore;
    private calculateDueDate;
}
export {};
