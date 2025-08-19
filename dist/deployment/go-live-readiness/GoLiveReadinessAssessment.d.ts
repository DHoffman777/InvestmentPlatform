import { EventEmitter } from 'events';
/**
 * Go-Live Readiness Assessment Framework
 * Comprehensive production readiness validation for Investment Management Platform
 */
export interface GoLiveAssessmentConfig {
    assessmentName: string;
    environment: string;
    launchDate: Date;
    stakeholders: Stakeholder[];
    assessmentAreas: AssessmentArea[];
    criteriaWeights: CriteriaWeights;
    reporting: ReadinessReportingConfig;
    escalationRules: EscalationRule[];
}
export interface Stakeholder {
    name: string;
    role: string;
    email: string;
    responsibilities: string[];
    signOffRequired: boolean;
}
export type AssessmentArea = 'technical_readiness' | 'security_readiness' | 'compliance_readiness' | 'operational_readiness' | 'business_readiness' | 'infrastructure_readiness' | 'data_readiness' | 'performance_readiness' | 'support_readiness' | 'training_readiness';
export interface CriteriaWeights {
    technical: number;
    security: number;
    compliance: number;
    operational: number;
    business: number;
    infrastructure: number;
    data: number;
    performance: number;
    support: number;
    training: number;
}
export interface ReadinessReportingConfig {
    formats: ('html' | 'pdf' | 'json' | 'excel')[];
    outputDir: string;
    executiveReport: boolean;
    detailedReport: boolean;
    stakeholderReports: boolean;
    dashboardUrl?: string;
}
export interface EscalationRule {
    trigger: EscalationTrigger;
    recipients: string[];
    actions: string[];
    timeline: number;
}
export interface EscalationTrigger {
    criteriaType: AssessmentArea;
    threshold: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
}
export interface GoLiveReadinessResult {
    assessmentId: string;
    config: GoLiveAssessmentConfig;
    assessmentDate: Date;
    overallReadiness: ReadinessStatus;
    readinessScore: number;
    areaAssessments: AreaAssessment[];
    blockers: ReadinessBlocker[];
    risks: ReadinessRisk[];
    recommendations: ReadinessRecommendation[];
    signOffs: SignOffStatus[];
    timeline: ReadinessTimeline[];
}
export type ReadinessStatus = 'GO' | 'NO_GO' | 'CONDITIONAL_GO' | 'DEFER';
export interface AreaAssessment {
    area: AssessmentArea;
    status: ReadinessStatus;
    score: number;
    weight: number;
    weightedScore: number;
    criteria: CriteriaAssessment[];
    summary: string;
    issues: string[];
    mitigations: string[];
}
export interface CriteriaAssessment {
    id: string;
    name: string;
    description: string;
    status: CriteriaStatus;
    score: number;
    evidence: Evidence[];
    comments: string;
    responsible: string;
    dueDate?: Date;
    completedDate?: Date;
}
export type CriteriaStatus = 'COMPLETE' | 'IN_PROGRESS' | 'NOT_STARTED' | 'BLOCKED' | 'N/A';
export interface Evidence {
    type: 'document' | 'test_result' | 'screenshot' | 'sign_off' | 'certificate';
    url?: string;
    description: string;
    timestamp: Date;
    verified: boolean;
}
export interface ReadinessBlocker {
    id: string;
    title: string;
    description: string;
    impact: 'HIGH' | 'MEDIUM' | 'LOW';
    area: AssessmentArea;
    owner: string;
    dueDate: Date;
    status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED';
    resolution?: string;
}
export interface ReadinessRisk {
    id: string;
    title: string;
    description: string;
    probability: 'HIGH' | 'MEDIUM' | 'LOW';
    impact: 'HIGH' | 'MEDIUM' | 'LOW';
    riskScore: number;
    area: AssessmentArea;
    mitigation: string;
    owner: string;
    contingencyPlan?: string;
}
export interface ReadinessRecommendation {
    id: string;
    title: string;
    description: string;
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    area: AssessmentArea;
    effort: 'LOW' | 'MEDIUM' | 'HIGH';
    timeline: string;
    benefit: string;
    implementation: string[];
}
export interface SignOffStatus {
    stakeholder: string;
    role: string;
    area?: AssessmentArea;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CONDITIONAL';
    date?: Date;
    comments?: string;
    conditions?: string[];
}
export interface ReadinessTimeline {
    milestone: string;
    dueDate: Date;
    status: 'COMPLETE' | 'ON_TRACK' | 'AT_RISK' | 'OVERDUE';
    dependencies: string[];
    owner: string;
}
export declare class GoLiveReadinessAssessment extends EventEmitter {
    private config;
    private assessmentId;
    private areaAssessments;
    private blockers;
    private risks;
    constructor(config: GoLiveAssessmentConfig);
    /**
     * Execute comprehensive go-live readiness assessment
     */
    executeReadinessAssessment(): Promise<GoLiveReadinessResult>;
    /**
     * Execute technical readiness assessment
     */
    assessTechnicalReadiness(): Promise<AreaAssessment>;
    /**
     * Execute security readiness assessment
     */
    assessSecurityReadiness(): Promise<AreaAssessment>;
    /**
     * Execute operational readiness assessment
     */
    assessOperationalReadiness(): Promise<AreaAssessment>;
    /**
     * Execute performance readiness assessment
     */
    assessPerformanceReadiness(): Promise<AreaAssessment>;
    /**
     * Execute business readiness assessment
     */
    assessBusinessReadiness(): Promise<AreaAssessment>;
    /**
     * Execute data readiness assessment
     */
    assessDataReadiness(): Promise<AreaAssessment>;
    private initializeAssessment;
    private executeAreaAssessments;
    private identifyBlockersAndRisks;
    private generateRecommendations;
    private collectSignOffs;
    private createReadinessTimeline;
    private calculateOverallReadiness;
    private calculateReadinessScore;
    private calculateAreaScore;
    private generateReadinessReports;
    private generateReadinessReport;
    private generateHTMLReadinessReport;
    private handleEscalations;
}
export default GoLiveReadinessAssessment;
