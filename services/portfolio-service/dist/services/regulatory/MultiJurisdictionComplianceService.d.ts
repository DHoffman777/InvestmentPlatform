import { RegulatoryJurisdiction } from '../../models/regulatory/Regulatory';
interface JurisdictionRequirement {
    id: string;
    jurisdiction: RegulatoryJurisdiction;
    requirementType: 'registration' | 'reporting' | 'disclosure' | 'operational' | 'capital' | 'conduct';
    requirementName: string;
    description: string;
    applicabilityConditions: string[];
    compliance: {
        status: 'compliant' | 'non_compliant' | 'partial' | 'not_applicable' | 'under_review';
        lastAssessed: Date;
        nextAssessmentDue: Date;
        responsiblePerson: string;
        evidence: string[];
        remediation?: {
            requiredActions: string[];
            targetDate: Date;
            status: 'planned' | 'in_progress' | 'completed';
        };
    };
    regulatoryBody: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    penalties: {
        monetary?: number;
        businessImpact?: string;
        reputationalRisk?: string;
    };
}
interface JurisdictionProfile {
    jurisdiction: RegulatoryJurisdiction;
    jurisdictionName: string;
    regulatoryBodies: string[];
    businessActivities: string[];
    clientTypes: string[];
    assetThresholds: Record<string, number>;
    reportingFrequency: Record<string, 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'annually'>;
    keyRequirements: JurisdictionRequirement[];
    localRepresentative?: {
        name: string;
        contact: string;
        licenseNumber?: string;
    };
    lastReview: Date;
    nextReview: Date;
}
interface ComplianceAssessment {
    id: string;
    tenantId: string;
    assessmentDate: Date;
    scope: {
        jurisdictions: RegulatoryJurisdiction[];
        businessActivities: string[];
        clientSegments: string[];
        assessmentPeriod: {
            startDate: Date;
            endDate: Date;
        };
    };
    findings: {
        compliantRequirements: number;
        nonCompliantRequirements: number;
        partialComplianceRequirements: number;
        criticalIssues: number;
        highRiskIssues: number;
    };
    riskScore: number;
    recommendations: Array<{
        priority: 'critical' | 'high' | 'medium' | 'low';
        recommendation: string;
        jurisdiction: RegulatoryJurisdiction;
        estimatedCost?: number;
        implementationTimeframe: string;
    }>;
    assessedBy: string;
    approvedBy?: string;
    status: 'draft' | 'review' | 'approved' | 'archived';
    createdAt: Date;
    updatedAt: Date;
}
interface CrossJurisdictionConflict {
    id: string;
    conflictType: 'reporting_overlap' | 'regulatory_conflict' | 'tax_treaty' | 'operational_requirement';
    description: string;
    jurisdictionsInvolved: RegulatoryJurisdiction[];
    businessImpact: 'high' | 'medium' | 'low';
    resolutionStrategy: string;
    status: 'identified' | 'analyzing' | 'resolved' | 'accepted_risk';
    identifiedDate: Date;
    resolvedDate?: Date;
}
export declare class MultiJurisdictionComplianceService {
    private eventPublisher;
    private jurisdictionProfiles;
    private assessments;
    private conflicts;
    private monitoringRules;
    constructor();
    createComplianceAssessment(tenantId: string, scope: ComplianceAssessment['scope'], assessedBy: string): Promise<ComplianceAssessment>;
    identifyJurisdictionConflicts(jurisdictions: RegulatoryJurisdiction[], businessActivities: string[]): Promise<CrossJurisdictionConflict[]>;
    updateComplianceStatus(requirementId: string, jurisdiction: RegulatoryJurisdiction, status: JurisdictionRequirement['compliance']['status'], evidence: string[], updatedBy: string): Promise<void>;
    generateComplianceReport(tenantId: string, jurisdictions: RegulatoryJurisdiction[], reportType: 'summary' | 'detailed' | 'executive'): Promise<{
        summary: {
            totalRequirements: number;
            compliantPercentage: number;
            criticalIssues: number;
            overallRiskScore: number;
        };
        jurisdictionBreakdown: Array<{
            jurisdiction: RegulatoryJurisdiction;
            complianceRate: number;
            criticalIssues: number;
            nextActions: string[];
        }>;
        recommendations: Array<{
            priority: string;
            description: string;
            jurisdiction: RegulatoryJurisdiction;
            timeline: string;
        }>;
        conflicts: CrossJurisdictionConflict[];
    }>;
    monitorComplianceThresholds(tenantId: string): Promise<Array<{
        ruleName: string;
        jurisdiction: RegulatoryJurisdiction;
        alertLevel: 'warning' | 'critical';
        message: string;
        triggeredAt: Date;
    }>>;
    getJurisdictionProfile(jurisdiction: RegulatoryJurisdiction): Promise<JurisdictionProfile | null>;
    getComplianceAssessment(assessmentId: string): Promise<ComplianceAssessment | null>;
    getComplianceAssessmentsByTenant(tenantId: string): Promise<ComplianceAssessment[]>;
    private initializeJurisdictionProfiles;
    private initializeMonitoringRules;
    private getApplicableRequirements;
    private assessRequirements;
    private calculateRiskScore;
    private generateRecommendations;
    private identifyReportingOverlaps;
    private identifyRegulatoryConflicts;
    private identifyTaxTreatyConflicts;
    private calculateOverallRiskScore;
    private getComplianceRecommendations;
    private evaluateMonitoringRule;
    private executeAutomatedResponse;
    private generateComplianceAlert;
}
export {};
