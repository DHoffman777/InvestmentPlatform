import { EventEmitter } from 'events';
export interface BusinessContinuityPlan {
    id: string;
    name: string;
    description: string;
    version: string;
    effectiveDate: Date;
    reviewDate: Date;
    nextReviewDate: Date;
    owner: string;
    approver: string;
    status: 'draft' | 'approved' | 'active' | 'suspended' | 'retired';
    riskAssessment: RiskAssessment;
    businessImpactAnalysis: BusinessImpactAnalysis;
    recoveryStrategies: RecoveryStrategy[];
    incidentResponse: IncidentResponsePlan;
    communicationPlan: CommunicationPlan;
    testingSchedule: TestingSchedule;
    dependencies: SystemDependency[];
    complianceRequirements: ComplianceRequirement[];
    createdAt: Date;
    updatedAt: Date;
}
export interface RiskAssessment {
    id: string;
    planId: string;
    assessmentDate: Date;
    methodology: string;
    threats: ThreatAnalysis[];
    vulnerabilities: VulnerabilityAnalysis[];
    riskMatrix: RiskMatrix;
    mitigationStrategies: MitigationStrategy[];
    residualRisk: number;
    overallRiskLevel: 'low' | 'medium' | 'high' | 'critical';
}
export interface ThreatAnalysis {
    id: string;
    type: 'natural_disaster' | 'cyber_attack' | 'pandemic' | 'technology_failure' | 'human_error' | 'supplier_failure' | 'regulatory_change';
    description: string;
    likelihood: 'very_low' | 'low' | 'medium' | 'high' | 'very_high';
    impact: 'minimal' | 'minor' | 'moderate' | 'major' | 'catastrophic';
    riskScore: number;
    sources: string[];
    geographicScope: string[];
    timeHorizon: 'immediate' | 'short_term' | 'medium_term' | 'long_term';
}
export interface VulnerabilityAnalysis {
    id: string;
    area: 'infrastructure' | 'personnel' | 'process' | 'technology' | 'vendor' | 'facility';
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    exploitability: 'difficult' | 'moderate' | 'easy' | 'trivial';
    currentControls: string[];
    gaps: string[];
    recommendedActions: string[];
}
export interface RiskMatrix {
    categories: RiskCategory[];
    tolerance: RiskTolerance;
    appetite: RiskAppetite;
}
export interface RiskCategory {
    name: string;
    inherentRisk: number;
    controlEffectiveness: number;
    residualRisk: number;
    tolerance: number;
    status: 'within_tolerance' | 'approaching_limit' | 'exceeds_tolerance';
}
export interface BusinessImpactAnalysis {
    id: string;
    planId: string;
    analysisDate: Date;
    methodology: string;
    businessFunctions: BusinessFunction[];
    criticalProcesses: CriticalProcess[];
    recoveryObjectives: RecoveryObjective[];
    impactScenarios: ImpactScenario[];
    financialImpact: FinancialImpactAnalysis;
    operationalImpact: OperationalImpactAnalysis;
    reputationalImpact: ReputationalImpactAnalysis;
    regulatoryImpact: RegulatoryImpactAnalysis;
}
export interface BusinessFunction {
    id: string;
    name: string;
    description: string;
    criticality: 'essential' | 'important' | 'desirable' | 'optional';
    minimumStaffing: number;
    peakDemandPeriods: string[];
    dependencies: string[];
    alternativeLocations: string[];
    keyPersonnel: KeyPersonnel[];
    resources: ResourceRequirement[];
    compliance: string[];
}
export interface CriticalProcess {
    id: string;
    name: string;
    function: string;
    description: string;
    rto: number;
    rpo: number;
    mto: number;
    mbco: number;
    dependencies: ProcessDependency[];
    inputs: ProcessInput[];
    outputs: ProcessOutput[];
    resources: ResourceRequirement[];
    alternativeProcedures: string[];
    documentationLocation: string;
}
export interface RecoveryStrategy {
    id: string;
    name: string;
    type: 'preventive' | 'detective' | 'corrective' | 'recovery';
    category: 'people' | 'process' | 'technology' | 'facilities' | 'suppliers';
    description: string;
    businessFunctions: string[];
    activationTriggers: string[];
    procedures: RecoveryProcedure[];
    resources: ResourceRequirement[];
    timeline: RecoveryTimeline;
    costs: RecoveryCosts;
    risks: string[];
    successCriteria: string[];
    rollbackProcedures: string[];
    responsible: string;
    alternateContacts: string[];
}
export interface RecoveryProcedure {
    id: string;
    name: string;
    sequence: number;
    description: string;
    estimatedDuration: number;
    prerequisites: string[];
    steps: ProcedureStep[];
    resources: string[];
    responsible: string;
    verification: string[];
    rollback: string[];
}
export interface ProcedureStep {
    stepNumber: number;
    description: string;
    responsible: string;
    estimatedTime: number;
    dependencies: number[];
    verificationCriteria: string;
    troubleshooting: string[];
}
export interface IncidentResponsePlan {
    id: string;
    name: string;
    scope: string;
    activationCriteria: ActivationCriteria[];
    responseTeam: ResponseTeam;
    escalationMatrix: EscalationLevel[];
    communicationProtocols: CommunicationProtocol[];
    decisionAuthority: DecisionAuthority[];
    resourceAllocation: ResourceAllocation;
    coordinationProcedures: string[];
    documentationRequirements: string[];
    postIncidentActivities: string[];
}
export interface ActivationCriteria {
    trigger: string;
    threshold: string;
    autoActivation: boolean;
    approvalRequired: boolean;
    approver: string;
    notificationRequired: string[];
}
export interface ResponseTeam {
    incidentCommander: TeamMember;
    deputies: TeamMember[];
    functionalLeads: TeamMember[];
    specialists: TeamMember[];
    externalContacts: ExternalContact[];
    alternateTeam: TeamMember[];
}
export interface TeamMember {
    name: string;
    role: string;
    primaryPhone: string;
    alternatePhone: string;
    email: string;
    responsibilities: string[];
    expertise: string[];
    location: string;
    availability: AvailabilitySchedule;
}
export interface CommunicationPlan {
    id: string;
    stakeholderGroups: StakeholderGroup[];
    messageTemplates: MessageTemplate[];
    channels: CommunicationChannel[];
    protocols: CommunicationProtocol[];
    escalationPaths: CommunicationEscalation[];
    approvalProcess: ApprovalProcess;
    monitoringRequirements: string[];
}
export interface TestingSchedule {
    id: string;
    planId: string;
    testTypes: TestType[];
    schedule: TestEvent[];
    participants: TestParticipant[];
    successCriteria: string[];
    reportingRequirements: string[];
    improvementProcess: string;
}
export interface TestType {
    name: string;
    frequency: 'weekly' | 'monthly' | 'quarterly' | 'semi_annual' | 'annual';
    scope: 'component' | 'partial' | 'full' | 'integrated';
    duration: number;
    disruptive: boolean;
    approvalRequired: boolean;
    objectives: string[];
    scenarios: TestScenario[];
}
export interface DisasterEvent {
    id: string;
    type: 'natural' | 'technological' | 'human' | 'biological' | 'environmental';
    category: string;
    severity: 'minor' | 'moderate' | 'major' | 'catastrophic';
    startTime: Date;
    estimatedDuration: number;
    endTime?: Date;
    affectedAreas: string[];
    affectedSystems: string[];
    affectedFunctions: string[];
    impactAssessment: ImpactAssessment;
    responseActions: ResponseAction[];
    status: 'active' | 'contained' | 'resolved' | 'post_incident';
    lessons: string[];
}
export interface RecoveryExecution {
    id: string;
    planId: string;
    eventId: string;
    activatedAt: Date;
    activatedBy: string;
    status: 'initiated' | 'in_progress' | 'completed' | 'failed' | 'cancelled';
    currentPhase: string;
    completedProcedures: string[];
}
/**
 * Business Continuity Management System
 * Provides comprehensive business continuity planning, risk assessment, and disaster recovery
 */
export declare class BusinessContinuityManager extends EventEmitter {
    private plans;
    private activeEvents;
    private recoveryExecutions;
    private testResults;
    constructor();
    /**
     * Create business continuity plan
     */
    createPlan(planData: Omit<BusinessContinuityPlan, 'id' | 'createdAt' | 'updatedAt'>): Promise<BusinessContinuityPlan>;
    /**
     * Conduct risk assessment
     */
    conductRiskAssessment(planId: string, assessmentData: Omit<RiskAssessment, 'id' | 'planId'>): Promise<RiskAssessment>;
    /**
     * Perform business impact analysis
     */
    performBusinessImpactAnalysis(planId: string, biaData: Omit<BusinessImpactAnalysis, 'id' | 'planId'>): Promise<BusinessImpactAnalysis>;
    /**
     * Activate disaster response
     */
    activateDisasterResponse(planId: string, eventData: Omit<DisasterEvent, 'id' | 'status' | 'responseActions' | 'lessons'>): Promise<{
        event: DisasterEvent;
        execution: RecoveryExecution;
    }>;
    /**
     * Execute recovery procedures
     */
    executeRecoveryProcedure(executionId: string, procedureId: string, executedBy: string): Promise<ProcedureExecutionResult>;
    /**
     * Schedule and execute BCP tests
     */
    scheduleTest(planId: string, testType: string, scheduledDate: Date, participants: string[]): Promise<TestEvent>;
    /**
     * Generate BCP dashboard metrics
     */
    generateDashboard(): BCPDashboard;
    private initiateRecoveryExecution;
    private calculateOverallRisk;
    private calculateResidualRisk;
    private validateRecoveryObjectives;
    private calculateAverageRTO;
    private calculateAverageRPO;
    private sendEmergencyNotifications;
    private sendNotification;
    private findRecoveryProcedure;
    private executeStep;
    private handleStepFailure;
    private isStrategyApplicable;
    private allocateResources;
    private threatLevelToNumber;
    private severityToNumber;
    private calculateOverallReadiness;
    private calculateRiskMetrics;
    private calculateTestingMetrics;
    private calculateComplianceStatus;
    private getRecentEvents;
    private getUpcomingTests;
    private getActionItems;
    private getTestObjectives;
    private getTestScenarios;
    private getTestDuration;
    private isApprovalRequired;
    private initializeDefaultPlans;
    private startMonitoring;
    private performHealthChecks;
    private checkPlanReviews;
}
interface MitigationStrategy {
    id: string;
    name: string;
    description: string;
    type: 'preventive' | 'protective' | 'corrective';
    effectiveness: number;
    cost: number;
    timeframe: string;
    responsible: string;
    status: 'planned' | 'implemented' | 'verified';
}
interface RiskTolerance {
    level: 'low' | 'medium' | 'high';
    threshold: number;
}
interface RiskAppetite {
    level: 'low' | 'medium' | 'high';
    statement: string;
}
interface KeyPersonnel {
    name: string;
    role: string;
    criticality: 'essential' | 'important' | 'desirable';
    backup: string[];
    skills: string[];
    crossTraining: string[];
}
interface ResourceRequirement {
    type: 'personnel' | 'technology' | 'facility' | 'vendor' | 'financial';
    description: string;
    quantity: number;
    availability: string;
    cost: number;
    alternative: string[];
}
interface ProcessDependency {
    type: 'upstream' | 'downstream' | 'supporting';
    process: string;
    criticality: 'essential' | 'important' | 'desirable';
    impact: string;
    alternative: string[];
}
interface ProcessInput {
    name: string;
    source: string;
    frequency: string;
    format: string;
    criticality: 'essential' | 'important' | 'desirable';
}
interface ProcessOutput {
    name: string;
    destination: string[];
    frequency: string;
    format: string;
    qualityMetrics: string[];
}
interface RecoveryTimeline {
    phases: RecoveryPhase[];
    milestones: RecoveryMilestone[];
    dependencies: TimelineDependency[];
}
interface RecoveryPhase {
    name: string;
    startTime: number;
    duration: number;
    objectives: string[];
    procedures: string[];
    resources: string[];
    successCriteria: string[];
}
interface RecoveryMilestone {
    name: string;
    targetTime: number;
    criteria: string[];
    responsible: string;
    dependencies: string[];
}
interface TimelineDependency {
    predecessor: string;
    successor: string;
    type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish';
    lag: number;
}
interface RecoveryCosts {
    setup: number;
    ongoing: number;
    total: number;
    breakdown: {
        [category: string]: number;
    };
}
interface EscalationLevel {
    level: number;
    title: string;
    criteria: string[];
    authority: string[];
    timeframe: number;
    notifications: string[];
}
interface CommunicationProtocol {
    name: string;
    purpose: string;
    frequency: string;
    participants: string[];
    methods: string[];
    templates: string[];
}
interface DecisionAuthority {
    role: string;
    scope: string[];
    limitations: string[];
    escalation: string;
}
interface ResourceAllocation {
    personnel: number;
    budget: number;
    facilities: number;
    technology: number;
    vendors: number;
}
interface StakeholderGroup {
    name: string;
    contacts: StakeholderContact[];
    messagePriority: 'immediate' | 'urgent' | 'normal' | 'low';
    emergencyNotification: boolean;
    businessHours: boolean;
}
interface StakeholderContact {
    name: string;
    role: string;
    email: string;
    phone: string;
    alternatePhone?: string;
    preferredMethod: 'email' | 'phone' | 'sms' | 'all';
}
interface MessageTemplate {
    id: string;
    name: string;
    purpose: string;
    urgency: 'emergency' | 'urgent' | 'normal';
    subject: string;
    body: string;
    variables: string[];
    approval: boolean;
}
interface CommunicationChannel {
    type: 'email' | 'phone' | 'sms' | 'radio' | 'satellite' | 'social_media';
    primary: boolean;
    capacity: number;
    reliability: number;
    cost: number;
    setup: string[];
}
interface CommunicationEscalation {
    trigger: string;
    timeframe: number;
    escalateTo: string[];
    method: string[];
    approval: boolean;
}
interface ApprovalProcess {
    required: boolean;
    approvers: string[];
    timeframe: number;
}
interface TestEvent {
    id: string;
    planId: string;
    type: string;
    scheduledDate: Date;
    actualDate?: Date;
    status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'passed' | 'failed';
    participants: TestParticipant[];
    objectives: string[];
    scenarios: TestScenario[];
    duration: number;
    approvalRequired: boolean;
    approver?: string;
    results?: TestResult;
    createdAt: Date;
}
interface TestParticipant {
    name: string;
    role: string;
    confirmed: boolean;
}
interface TestScenario {
    id: string;
    name: string;
    description: string;
    duration: number;
    complexity: 'low' | 'medium' | 'high';
    objectives: string[];
}
interface TestResult {
    id: string;
    testId: string;
    overallResult: 'pass' | 'fail' | 'partial';
    score: number;
    objectives: ObjectiveResult[];
    findings: TestFinding[];
    recommendations: string[];
    nextActions: string[];
    completedAt: Date;
}
interface ObjectiveResult {
    objective: string;
    result: 'achieved' | 'partially_achieved' | 'not_achieved';
    evidence: string[];
    gaps: string[];
}
interface TestFinding {
    type: 'strength' | 'weakness' | 'gap' | 'improvement';
    category: string;
    description: string;
    impact: 'low' | 'medium' | 'high' | 'critical';
    recommendation: string;
    responsible: string;
    targetDate?: Date;
}
interface SystemDependency {
    name: string;
    type: 'internal' | 'external' | 'vendor' | 'partner';
    criticality: 'essential' | 'important' | 'desirable';
    rto: number;
    rpo: number;
    alternatives: string[];
    contact: string;
    sla: string;
}
interface ComplianceRequirement {
    regulation: string;
    requirement: string;
    description: string;
    status: 'compliant' | 'non_compliant' | 'pending' | 'not_applicable';
    evidence: string[];
    lastReview: Date;
    nextReview: Date;
    responsible: string;
}
interface ImpactAssessment {
    financial: FinancialImpact;
    operational: OperationalImpact;
    reputational: ReputationalImpact;
    regulatory: RegulatoryImpact;
    overall: 'minimal' | 'minor' | 'moderate' | 'major' | 'catastrophic';
}
interface FinancialImpact {
    directCosts: number;
    indirectCosts: number;
    lostRevenue: number;
    regulatoryFines: number;
}
interface OperationalImpact {
    affectedProcesses: string[];
    staffingRequirements: number;
    alternativeProcesses: string[];
}
interface ReputationalImpact {
    severity: 'low' | 'medium' | 'high' | 'critical';
    duration: 'short_term' | 'medium_term' | 'long_term' | 'permanent';
    mitigation: string[];
}
interface RegulatoryImpact {
    requirements: string[];
    penalties: string[];
    reporting: string[];
}
interface ResponseAction {
    id: string;
    type: 'immediate' | 'short_term' | 'long_term';
    description: string;
    responsible: string;
    status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
    startTime?: Date;
    completionTime?: Date;
    resources: string[];
}
interface ImpactScenario {
    name: string;
    description: string;
    probability: number;
    timeframe: string;
    impact: ImpactAssessment;
}
interface RecoveryObjective {
    process: string;
    rto: number;
    rpo: number;
    mto: number;
    mbco: number;
    justification: string;
}
interface FinancialImpactAnalysis {
    directCosts: number;
    indirectCosts: number;
    lostRevenue: number;
    regulatoryFines: number;
}
interface OperationalImpactAnalysis {
    affectedProcesses: string[];
    staffingRequirements: number;
    alternativeProcesses: string[];
}
interface ReputationalImpactAnalysis {
    severity: 'low' | 'medium' | 'high' | 'critical';
    duration: 'short_term' | 'medium_term' | 'long_term' | 'permanent';
    mitigation: string[];
}
interface RegulatoryImpactAnalysis {
    requirements: string[];
    penalties: string[];
    reporting: string[];
}
interface ExternalContact {
    organization: string;
    name: string;
    role: string;
    phone: string;
    email: string;
    services: string[];
    availability: string;
}
interface AvailabilitySchedule {
    hours: string;
    timeZone: string;
    holidays: boolean;
    backup: string;
}
interface ProcedureExecutionResult {
    procedureId: string;
    executedBy: string;
    startTime: Date;
    endTime: Date;
    duration: number;
    success: boolean;
    stepResults: StepExecutionResult[];
    issues: string[];
}
interface StepExecutionResult {
    stepNumber: number;
    success: boolean;
    startTime: Date;
    endTime: Date;
    actualDuration: number;
    estimatedDuration: number;
    executedBy: string;
    error?: string;
    verificationResult: string;
}
interface BCPDashboard {
    summary: {
        totalPlans: number;
        activePlans: number;
        pendingReviews: number;
        activeIncidents: number;
        activeRecoveries: number;
        overallReadiness: number;
    };
    riskMetrics: {
        criticalRisk: number;
        highRisk: number;
        mediumRisk: number;
        lowRisk: number;
        averageResidualRisk: number;
    };
    testingMetrics: {
        totalTests: number;
        recentTests: number;
        passedTests: number;
        failedTests: number;
        upcomingTests: number;
        overdueTests: number;
    };
    complianceStatus: {
        totalRequirements: number;
        compliantRequirements: number;
        compliancePercentage: number;
        pendingRequirements: number;
        nonCompliantRequirements: number;
    };
    recentEvents: any[];
    upcomingTests: any[];
    actionItems: any[];
    lastUpdated: Date;
}
export default BusinessContinuityManager;
