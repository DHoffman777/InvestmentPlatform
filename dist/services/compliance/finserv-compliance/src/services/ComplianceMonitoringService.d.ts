import { EventEmitter } from 'events';
import { ComplianceViolation, SuitabilityAssessment, BestExecutionAnalysis, AntiMoneyLaunderingCheck, TradeReporting, FinancialServicesConfig, CorrectiveAction } from '../types';
export declare class ComplianceMonitoringService extends EventEmitter {
    private config;
    private redis;
    constructor(config: FinancialServicesConfig);
    recordViolation(violation: Omit<ComplianceViolation, 'id'>): Promise<ComplianceViolation>;
    conductSuitabilityAssessment(clientId: string, productType: string, conductedBy: string): Promise<SuitabilityAssessment>;
    performBestExecutionAnalysis(startDate: Date, endDate: Date, orderType?: string, securityType?: string): Promise<BestExecutionAnalysis>;
    performAMLCheck(clientId: string, checkType?: 'INITIAL' | 'PERIODIC' | 'ENHANCED' | 'TRANSACTION_BASED'): Promise<AntiMoneyLaunderingCheck>;
    scheduleTradeReporting(tradeId: string, reportingRegime: 'CAT' | 'OATS' | 'BLUE_SHEETS' | 'LARGE_TRADER' | 'FORM_13F' | 'SECTION_16' | 'EMIR' | 'MIFID_II'): Promise<TradeReporting>;
    assignCorrectiveAction(violationId: string, action: Omit<CorrectiveAction, 'id'>): Promise<CorrectiveAction>;
    getComplianceMetrics(period: {
        startDate: Date;
        endDate: Date;
    }): Promise<{
        violations: {
            total: number;
            byType: Record<string, number>;
            bySeverity: Record<string, number>;
            open: number;
            resolved: number;
        };
        suitability: {
            assessments: number;
            suitable: number;
            unsuitable: number;
            conditionallyApproved: number;
        };
        aml: {
            checks: number;
            highRisk: number;
            prohibited: number;
            enhancedDueDiligence: number;
        };
        training: {
            required: number;
            completed: number;
            overdue: number;
            complianceRate: number;
        };
        reporting: {
            scheduled: number;
            submitted: number;
            late: number;
            rejected: number;
        };
    }>;
    private setupPeriodicChecks;
    private performPeriodicViolationReview;
    private checkTrainingDeadlines;
    private checkReportingDeadlines;
    private generateViolationId;
    private generateAssessmentId;
    private generateAnalysisId;
    private generateAMLCheckId;
    private generateTradeReportingId;
    private generateCorrectiveActionId;
    private updateViolationMetrics;
    private requiresImmediateReporting;
    private triggerImmediateReporting;
    private getClientProfile;
    private getProductInformation;
    private determineSuitability;
    private generateSuitabilityReasoning;
    private generateSuitabilityConditions;
    private generateAlternatives;
    private analyzeMarketCenters;
    private calculateExecutionMetrics;
    private calculateQualityMetrics;
    private determineReportPeriod;
    private assessBestExecutionCompliance;
    private generateExecutionImprovements;
    private identifyExecutionIssues;
    private performScreening;
    private performSanctionsCheck;
    private performPEPCheck;
    private performAdverseMediaCheck;
    private calculateAMLRiskScore;
    private determineRiskLevel;
    private determineAMLDecision;
    private determineDueDiligenceLevel;
    private determineMonitoringFrequency;
    private calculateReportingDeadline;
    private getTradeData;
    private extractRequiredFields;
    private getRegulatoryAuthority;
    private scheduleAutomaticSubmission;
    private getViolation;
    cleanup(): Promise<void>;
}
