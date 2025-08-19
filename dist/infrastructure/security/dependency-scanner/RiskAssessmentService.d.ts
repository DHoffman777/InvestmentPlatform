import { EventEmitter } from 'events';
import { Dependency } from './DependencyInventoryService';
import { Vulnerability } from './VulnerabilityDatabaseService';
export interface RiskAssessment {
    id: string;
    dependencyId: string;
    tenantId: string;
    assessmentDate: Date;
    overallRiskScore: number;
    riskLevel: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'MINIMAL';
    riskFactors: RiskFactor[];
    businessImpactScore: number;
    technicalRiskScore: number;
    exploitabilityScore: number;
    environmentalScore: number;
    mitigationStrategies: MitigationStrategy[];
    priority: number;
    assessedBy: string;
    validUntil: Date;
    lastUpdated: Date;
}
export interface RiskFactor {
    id: string;
    category: 'VULNERABILITY' | 'DEPENDENCY' | 'ENVIRONMENT' | 'BUSINESS' | 'OPERATIONAL';
    type: string;
    description: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
    weight: number;
    score: number;
    weightedScore: number;
    evidence: string[];
    source: string;
    detectedAt: Date;
}
export interface MitigationStrategy {
    id: string;
    type: 'UPDATE' | 'PATCH' | 'REPLACE' | 'CONFIGURE' | 'MONITOR' | 'ACCEPT';
    description: string;
    effort: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
    cost: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
    timeline: string;
    effectiveness: number;
    feasibility: number;
    recommendedAction: string;
    prerequisites: string[];
    risks: string[];
    benefits: string[];
    priority: number;
}
export interface BusinessContext {
    tenantId: string;
    applicationCriticality: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    environmentType: 'PRODUCTION' | 'STAGING' | 'DEVELOPMENT' | 'TEST';
    dataClassification: 'PUBLIC' | 'INTERNAL' | 'CONFIDENTIAL' | 'RESTRICTED';
    regulatoryRequirements: string[];
    businessOperatingHours: {
        timezone: string;
        operatingDays: string[];
        startTime: string;
        endTime: string;
    };
    maintenanceWindows: MaintenanceWindow[];
    stakeholders: Stakeholder[];
    complianceFrameworks: string[];
}
export interface MaintenanceWindow {
    id: string;
    name: string;
    description: string;
    schedule: {
        dayOfWeek: number;
        startTime: string;
        endTime: string;
        timezone: string;
    };
    type: 'REGULAR' | 'EMERGENCY' | 'PLANNED';
    approvalRequired: boolean;
}
export interface Stakeholder {
    id: string;
    name: string;
    role: string;
    department: string;
    contactInfo: {
        email: string;
        phone?: string;
        slack?: string;
    };
    responsibilities: string[];
    escalationLevel: number;
}
export interface RiskAssessmentCriteria {
    vulnerabilityWeights: {
        critical: number;
        high: number;
        medium: number;
        low: number;
        info: number;
    };
    dependencyFactors: {
        directDependency: number;
        transitiveDependency: number;
        maintenanceStatus: number;
        popularityScore: number;
        ageScore: number;
        licenseRisk: number;
    };
    environmentalFactors: {
        production: number;
        staging: number;
        development: number;
        test: number;
    };
    businessFactors: {
        criticalApplication: number;
        highApplication: number;
        mediumApplication: number;
        lowApplication: number;
    };
    exploitabilityFactors: {
        publicExploit: number;
        proofOfConcept: number;
        functional: number;
        unproven: number;
        notDefined: number;
    };
}
export interface PrioritizationResult {
    assessmentId: string;
    dependency: Dependency;
    vulnerabilities: Vulnerability[];
    riskScore: number;
    priority: number;
    recommendedAction: string;
    timeline: string;
    effort: string;
    justification: string;
}
export declare class RiskAssessmentService extends EventEmitter {
    private assessments;
    private businessContexts;
    private assessmentCriteria;
    constructor();
    private getDefaultCriteria;
    assessRisk(dependency: Dependency, vulnerabilities: Vulnerability[], tenantId: string, businessContext?: BusinessContext, assessedBy?: string): Promise<RiskAssessment>;
    private calculateRiskFactors;
    private calculateDependencyRiskFactors;
    private calculateEnvironmentalRiskFactors;
    private calculateBusinessRiskFactors;
    private calculateBusinessImpactScore;
    private calculateTechnicalRiskScore;
    private calculateExploitabilityScore;
    private calculateEnvironmentalScore;
    private calculateOverallRiskScore;
    private determineRiskLevel;
    private generateMitigationStrategies;
    private calculatePriority;
    prioritizeRiskAssessments(assessments: RiskAssessment[], tenantId: string): Promise<PrioritizationResult[]>;
    private generatePriorityJustification;
    private assessMaintenanceStatus;
    private calculatePackageAgeScore;
    private assessLicenseRisk;
    private mapSeverityToScore;
    private mapEnvironmentToScore;
    private mapDataClassificationToSeverity;
    private mapDataClassificationToScore;
    private mapCriticalityToScore;
    private determineUpdateEffort;
    private determineUpdateCost;
    private determineUpdateTimeline;
    private determineUpdateFeasibility;
    private determineReplacementTimeline;
    private determineReplacementFeasibility;
    private hasConfigurationMitigation;
    private getDefaultBusinessContext;
    private getDependencyFromAssessment;
    private getVulnerabilitiesFromAssessment;
    private generateAssessmentId;
    private generateFactorId;
    private generateStrategyId;
    setBusinessContext(tenantId: string, context: BusinessContext): void;
    getBusinessContext(tenantId: string): BusinessContext | undefined;
    updateAssessmentCriteria(criteria: Partial<RiskAssessmentCriteria>): void;
    getAssessment(assessmentId: string): RiskAssessment | undefined;
    getAssessmentsByTenant(tenantId: string): RiskAssessment[];
    getHighRiskAssessments(tenantId?: string): RiskAssessment[];
    reassessRisk(assessmentId: string): Promise<RiskAssessment>;
    getRiskMetrics(tenantId?: string): any;
}
