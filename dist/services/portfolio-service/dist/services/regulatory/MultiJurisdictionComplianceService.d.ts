export const __esModule: boolean;
export class MultiJurisdictionComplianceService {
    eventPublisher: eventPublisher_1.EventPublisher;
    jurisdictionProfiles: Map<any, any>;
    assessments: Map<any, any>;
    conflicts: Map<any, any>;
    monitoringRules: Map<any, any>;
    createComplianceAssessment(tenantId: any, scope: any, assessedBy: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        tenantId: any;
        assessmentDate: Date;
        scope: any;
        findings: {
            compliantRequirements: number;
            nonCompliantRequirements: number;
            partialComplianceRequirements: number;
            criticalIssues: number;
            highRiskIssues: number;
        };
        riskScore: number;
        recommendations: {
            priority: string;
            recommendation: string;
            jurisdiction: Regulatory_1.RegulatoryJurisdiction;
            estimatedCost: number;
            implementationTimeframe: string;
        }[];
        assessedBy: any;
        status: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    identifyJurisdictionConflicts(jurisdictions: any, businessActivities: any): Promise<any[]>;
    updateComplianceStatus(requirementId: any, jurisdiction: any, status: any, evidence: any, updatedBy: any): Promise<void>;
    generateComplianceReport(tenantId: any, jurisdictions: any, reportType: any): Promise<{
        summary: {
            totalRequirements: number;
            compliantPercentage: number;
            criticalIssues: number;
            overallRiskScore: number;
        };
        jurisdictionBreakdown: {
            jurisdiction: any;
            complianceRate: number;
            criticalIssues: any;
            nextActions: any;
        }[];
        recommendations: {
            priority: string;
            description: string;
            jurisdiction: Regulatory_1.RegulatoryJurisdiction;
            timeline: string;
        }[];
        conflicts: any[];
    }>;
    monitorComplianceThresholds(tenantId: any): Promise<{
        ruleName: any;
        jurisdiction: any;
        alertLevel: string;
        message: string;
        triggeredAt: Date;
    }[]>;
    getJurisdictionProfile(jurisdiction: any): Promise<any>;
    getComplianceAssessment(assessmentId: any): Promise<any>;
    getComplianceAssessmentsByTenant(tenantId: any): Promise<any[]>;
    initializeJurisdictionProfiles(): void;
    initializeMonitoringRules(): void;
    getApplicableRequirements(scope: any): any[];
    assessRequirements(tenantId: any, requirements: any, scope: any): Promise<{
        compliantRequirements: number;
        nonCompliantRequirements: number;
        partialComplianceRequirements: number;
        criticalIssues: number;
        highRiskIssues: number;
    }>;
    calculateRiskScore(findings: any, requirements: any): number;
    generateRecommendations(requirements: any, findings: any): Promise<{
        priority: string;
        recommendation: string;
        jurisdiction: Regulatory_1.RegulatoryJurisdiction;
        estimatedCost: number;
        implementationTimeframe: string;
    }[]>;
    identifyReportingOverlaps(jurisdictions: any): {
        id: `${string}-${string}-${string}-${string}-${string}`;
        conflictType: string;
        description: string;
        jurisdictionsInvolved: Regulatory_1.RegulatoryJurisdiction[];
        businessImpact: string;
        resolutionStrategy: string;
        status: string;
        identifiedDate: Date;
    }[];
    identifyRegulatoryConflicts(jurisdictions: any, businessActivities: any): any[];
    identifyTaxTreatyConflicts(jurisdictions: any): any[];
    calculateOverallRiskScore(jurisdictions: any): number;
    getComplianceRecommendations(jurisdictions: any): Promise<{
        priority: string;
        description: string;
        jurisdiction: Regulatory_1.RegulatoryJurisdiction;
        timeline: string;
    }[]>;
    evaluateMonitoringRule(tenantId: any, rule: any): Promise<{
        ruleName: any;
        jurisdiction: any;
        alertLevel: string;
        message: string;
        triggeredAt: Date;
    }>;
    executeAutomatedResponse(rule: any, alert: any): Promise<void>;
    generateComplianceAlert(requirement: any, jurisdiction: any): Promise<void>;
}
import eventPublisher_1 = require("../../utils/eventPublisher");
import Regulatory_1 = require("../../models/regulatory/Regulatory");
