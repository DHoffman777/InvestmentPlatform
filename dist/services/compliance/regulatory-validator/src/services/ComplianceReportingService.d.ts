import { EventEmitter } from 'events';
import { ComplianceReport, RegulatoryValidatorConfig } from '../types';
import { ComplianceAuditService } from './ComplianceAuditService';
import { RegulatoryRuleEngine } from './RegulatoryRuleEngine';
export declare class ComplianceReportingService extends EventEmitter {
    private config;
    private auditService;
    private ruleEngine;
    constructor(config: RegulatoryValidatorConfig, auditService: ComplianceAuditService, ruleEngine: RegulatoryRuleEngine);
    generateComplianceReport(reportType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'AD_HOC', title: string, description: string, period: {
        startDate: Date;
        endDate: Date;
    }, scope: {
        entityTypes: string[];
        entityIds?: string[];
        jurisdictions: string[];
        frameworks: string[];
    }, customSections?: string[]): Promise<ComplianceReport>;
    private generateReportSections;
    private generateExecutiveSummary;
    private generateComplianceOverview;
    private generateFrameworkAnalysis;
    private generateRiskAssessment;
    private generateRulePerformanceAnalysis;
    private generateTrendAnalysis;
    private generateExceptionAnalysis;
    private generateAlertSummary;
    private generateRecommendationsSection;
    private generateRecommendations;
    private generateReportId;
    private calculateTotalEntities;
    private calculateCompliantEntities;
    private calculateNonCompliantEntities;
    private getActiveExceptionsCount;
    private calculateNextReviewDate;
    private getDistributionList;
    private getTimeIntervals;
    exportReport(report: ComplianceReport, format: 'PDF' | 'HTML' | 'JSON' | 'EXCEL'): Promise<{
        filePath: string;
        content?: string;
    }>;
    private generateHTMLReport;
}
