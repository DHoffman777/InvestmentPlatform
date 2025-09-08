export const __esModule: boolean;
export class BestExecutionService {
    eventPublisher: eventPublisher_1.EventPublisher;
    reports: Map<any, any>;
    filings: Map<any, any>;
    createBestExecutionReport(data: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        tenantId: any;
        reportingPeriod: any;
        reportType: any;
        executionVenues: any;
        orderAnalysis: any;
        bestExecutionAnalysis: {
            executionQualityMetrics: any;
            venueSelection: {
                primaryFactors: string[];
                selectionProcess: string;
                regularReviewProcess: string;
            };
            conflictsOfInterest: any;
        };
        regulatoryInfo: {
            rule605Compliance: boolean;
            rule606Compliance: boolean;
            mifidIICompliance: boolean;
            additionalRequirements: any[];
        };
        status: Regulatory_1.FilingStatus;
        submittedBy: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    validateBestExecutionReport(reportId: any): Promise<{
        isValid: boolean;
        errors: {
            section: string;
            field: string;
            message: string;
            severity: string;
        }[];
        warnings: {
            section: string;
            field: string;
            message: string;
        }[];
        completionPercentage: number;
        analysisResults: {
            totalExecutionValue: number;
            venueConcentration: any;
            averageExecutionQuality: any;
            complianceScore: number;
        };
    }>;
    submitBestExecutionReport(reportId: any, submittedBy: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        tenantId: any;
        formType: Regulatory_1.FormType;
        jurisdiction: Regulatory_1.RegulatoryJurisdiction;
        filingDate: Date;
        reportingPeriodEnd: any;
        dueDate: Date;
        formData: any;
        status: Regulatory_1.FilingStatus;
        workflowStage: string;
        reviewers: any[];
        attachments: any[];
        complianceChecks: {
            checkType: string;
            status: string;
            message: string;
            checkedAt: Date;
        }[];
        auditTrail: {
            action: string;
            performedBy: any;
            performedAt: Date;
            details: {
                reportType: any;
                venuesAnalyzed: any;
                totalExecutionValue: number;
            };
        }[];
        createdBy: any;
        createdAt: Date;
        updatedAt: Date;
    }>;
    generateExecutionQualityAnalysis(reportId: any): Promise<{
        overallMetrics: any;
        venueComparison: any;
        recommendations: {
            immediate: string[];
            shortTerm: string[];
            longTerm: string[];
        };
        benchmarkComparison: {
            industryAverages: {
                priceImprovement: number;
                fillRate: number;
                effectiveSpread: number;
                implementationShortfall: number;
            };
            relativePerformance: string;
            improvementOpportunities: string[];
        };
    }>;
    getBestExecutionReport(reportId: any): Promise<any>;
    getBestExecutionReportsByTenant(tenantId: any): Promise<any[]>;
    updateBestExecutionReport(reportId: any, updates: any): Promise<any>;
    calculateExecutionQualityMetrics(venues: any): any;
    calculateVenueConcentration(venues: any): any;
    calculateAverageExecutionQuality(venues: any): any;
    calculateVenueExecutionScore(metrics: any): number;
    calculateComplianceScore(errorCount: any, warningCount: any): number;
    calculateDueDate(reportType: any, periodEnd: any): Date;
}
import eventPublisher_1 = require("../../utils/eventPublisher");
import Regulatory_1 = require("../../models/regulatory/Regulatory");
