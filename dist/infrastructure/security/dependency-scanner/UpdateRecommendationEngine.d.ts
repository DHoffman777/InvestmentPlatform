import { EventEmitter } from 'events';
import { Dependency } from './DependencyInventoryService';
import { VulnerabilityMatch } from './VulnerabilityDatabaseService';
import { RiskAssessment, BusinessContext } from './RiskAssessmentService';
export interface UpdateRecommendation {
    id: string;
    dependencyId: string;
    tenantId: string;
    currentVersion: string;
    recommendedVersion: string;
    updateType: 'PATCH' | 'MINOR' | 'MAJOR' | 'REPLACE';
    urgency: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    confidence: number;
    reason: string;
    description: string;
    securityImpact: SecurityImpact;
    compatibilityRisk: CompatibilityRisk;
    effortEstimate: EffortEstimate;
    timeline: string;
    dependencies: DependencyImpact[];
    testingRequirements: TestingRequirement[];
    rollbackPlan: RollbackPlan;
    approvalRequired: boolean;
    createdAt: Date;
    validUntil: Date;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'IMPLEMENTED' | 'SUPERSEDED';
}
export interface SecurityImpact {
    vulnerabilitiesFixed: string[];
    securityScore: number;
    riskReduction: number;
    newVulnerabilities: string[];
    complianceImpact: string[];
}
export interface CompatibilityRisk {
    breakingChanges: BreakingChange[];
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    impactedFeatures: string[];
    migrationRequired: boolean;
    testingScope: string[];
}
export interface BreakingChange {
    type: 'API' | 'BEHAVIOR' | 'DEPENDENCY' | 'CONFIGURATION' | 'REMOVAL';
    description: string;
    impact: 'LOW' | 'MEDIUM' | 'HIGH';
    migrationPath?: string;
    workaround?: string;
}
export interface EffortEstimate {
    developmentHours: number;
    testingHours: number;
    deploymentHours: number;
    totalHours: number;
    complexity: 'LOW' | 'MEDIUM' | 'HIGH' | 'VERY_HIGH';
    skillsRequired: string[];
    resourcesNeeded: string[];
}
export interface DependencyImpact {
    name: string;
    currentVersion: string;
    newVersion: string;
    changeType: 'UPDATED' | 'ADDED' | 'REMOVED';
    transitiveChanges: TransitiveChange[];
}
export interface TransitiveChange {
    dependencyName: string;
    oldVersion: string;
    newVersion: string;
    impact: 'BENEFICIAL' | 'NEUTRAL' | 'CONCERNING';
}
export interface TestingRequirement {
    type: 'UNIT' | 'INTEGRATION' | 'E2E' | 'SECURITY' | 'PERFORMANCE' | 'COMPATIBILITY';
    description: string;
    priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
    estimatedHours: number;
    automatable: boolean;
}
export interface RollbackPlan {
    strategy: 'VERSION_ROLLBACK' | 'CONFIGURATION_REVERT' | 'FEATURE_FLAG' | 'CANARY_ROLLBACK';
    steps: RollbackStep[];
    estimatedTime: number;
    riskAssessment: string;
    prerequisites: string[];
}
export interface RollbackStep {
    order: number;
    description: string;
    command?: string;
    validationCriteria: string;
    estimatedTime: number;
}
export interface UpdateBatch {
    id: string;
    tenantId: string;
    name: string;
    description: string;
    recommendations: string[];
    batchType: 'SECURITY' | 'MAINTENANCE' | 'FEATURE' | 'MIXED';
    scheduledDate?: Date;
    estimatedDuration: number;
    approvalStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
    dependencies: BatchDependency[];
    prerequisites: string[];
    rollbackPlan: RollbackPlan;
    createdAt: Date;
    createdBy: string;
}
export interface BatchDependency {
    from: string;
    to: string;
    reason: string;
}
export interface VersionInfo {
    version: string;
    releaseDate: Date;
    isLatest: boolean;
    isSecure: boolean;
    vulnerabilities: string[];
    changelogUrl?: string;
    breakingChanges: string[];
    features: string[];
    fixes: string[];
    securityFixes: string[];
    deprecations: string[];
}
export interface UpdateStrategy {
    tenantId: string;
    strategy: 'AGGRESSIVE' | 'BALANCED' | 'CONSERVATIVE' | 'SECURITY_ONLY';
    autoApprovalRules: AutoApprovalRule[];
    testingRequirements: TestingConfig;
    rolloutConfig: RolloutConfig;
    notificationConfig: NotificationConfig;
}
export interface AutoApprovalRule {
    condition: 'PATCH_SECURITY' | 'MINOR_NO_BREAKING' | 'DEV_DEPENDENCIES' | 'LOW_RISK';
    maxRiskScore: number;
    requiresTests: boolean;
    environments: string[];
}
export interface TestingConfig {
    mandatory: string[];
    optional: string[];
    customRules: TestingRule[];
}
export interface TestingRule {
    condition: string;
    requiredTests: string[];
    estimatedHours: number;
}
export interface RolloutConfig {
    strategy: 'IMMEDIATE' | 'STAGED' | 'CANARY' | 'BLUE_GREEN';
    stages: RolloutStage[];
    rollbackTriggers: string[];
    monitoringPeriod: number;
}
export interface RolloutStage {
    name: string;
    percentage: number;
    duration: number;
    successCriteria: string[];
    failureCriteria: string[];
}
export interface NotificationConfig {
    channels: string[];
    events: string[];
    stakeholders: string[];
}
export declare class UpdateRecommendationEngine extends EventEmitter {
    private recommendations;
    private batches;
    private strategies;
    private versionCache;
    constructor();
    generateRecommendations(dependencies: Dependency[], vulnerabilities: VulnerabilityMatch[], riskAssessments: RiskAssessment[], tenantId: string, businessContext?: BusinessContext): Promise<UpdateRecommendation[]>;
    private analyzeUpdate;
    private getAvailableVersions;
    private fetchVersionsFromRegistry;
    private findBestUpdateCandidate;
    private scoreUpdateCandidate;
    private analyzeSecurityImpact;
    private calculateSecurityScore;
    private analyzeCompatibilityRisk;
    private determineTestingScope;
    private estimateEffort;
    private determineSkillsRequired;
    private determineResourcesNeeded;
    private analyzeDependencyImpacts;
    private generateTestingRequirements;
    private createRollbackPlan;
    private determineUrgency;
    private calculateConfidence;
    private estimateTimeline;
    private generateReason;
    private generateDescription;
    private requiresApproval;
    private matchesAutoApprovalRule;
    private determineUpdateType;
    private compareVersions;
    private getDefaultStrategy;
    private generateRecommendationId;
    createUpdateBatch(recommendationIds: string[], tenantId: string, name: string, description: string, createdBy: string): Promise<UpdateBatch>;
    private determineBatchType;
    private analyzeBatchDependencies;
    private generateBatchPrerequisites;
    private createBatchRollbackPlan;
    private generateBatchId;
    getRecommendation(id: string): UpdateRecommendation | undefined;
    getRecommendationsByTenant(tenantId: string): UpdateRecommendation[];
    getBatch(id: string): UpdateBatch | undefined;
    approveRecommendation(id: string, approver: string): boolean;
    rejectRecommendation(id: string, reason: string, rejector: string): boolean;
    setUpdateStrategy(tenantId: string, strategy: UpdateStrategy): void;
    getUpdateStrategy(tenantId: string): UpdateStrategy | undefined;
    getRecommendationMetrics(tenantId?: string): any;
}
