import { EventEmitter } from 'events';
import { Dependency } from './DependencyInventoryService';
export interface DependencyPolicy {
    id: string;
    tenantId: string;
    name: string;
    description: string;
    version: string;
    enabled: boolean;
    priority: number;
    scope: PolicyScope;
    rules: PolicyRule[];
    enforcement: EnforcementConfig;
    exceptions: PolicyException[];
    metadata: PolicyMetadata;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    approvedBy?: string;
    approvedAt?: Date;
}
export interface PolicyScope {
    environments: string[];
    projects: string[];
    ecosystems: string[];
    dependencyTypes: ('direct' | 'transitive')[];
    scopes: ('production' | 'development' | 'optional' | 'peer')[];
}
export interface PolicyRule {
    id: string;
    name: string;
    description: string;
    type: 'VULNERABILITY' | 'LICENSE' | 'AGE' | 'MAINTENANCE' | 'CONFIGURATION' | 'CUSTOM';
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
    enabled: boolean;
    conditions: RuleCondition[];
    actions: RuleAction[];
    metadata: RuleMetadata;
}
export interface RuleCondition {
    field: string;
    operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'starts_with' | 'ends_with' | 'matches' | 'greater_than' | 'less_than' | 'greater_equal' | 'less_equal' | 'in' | 'not_in' | 'exists' | 'not_exists';
    value: any;
    logicalOperator?: 'AND' | 'OR';
}
export interface RuleAction {
    type: 'BLOCK' | 'WARN' | 'LOG' | 'NOTIFY' | 'AUTO_FIX' | 'CREATE_ISSUE' | 'ESCALATE';
    config: ActionConfig;
    enabled: boolean;
}
export interface ActionConfig {
    blockingMessage?: string;
    warningMessage?: string;
    logLevel?: 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';
    notificationChannels?: string[];
    recipients?: string[];
    escalationLevel?: number;
    autoFixStrategy?: 'UPDATE' | 'REPLACE' | 'CONFIGURE' | 'REMOVE';
    issueTracker?: {
        system: 'JIRA' | 'GITHUB' | 'GITLAB' | 'AZURE_DEVOPS';
        project: string;
        issueType: string;
        priority: string;
        assignee?: string;
        labels?: string[];
    };
    customWebhook?: {
        url: string;
        method: 'POST' | 'PUT' | 'PATCH';
        headers?: Record<string, string>;
        payload?: Record<string, any>;
    };
}
export interface RuleMetadata {
    tags: string[];
    category: string;
    rationale: string;
    references: string[];
    lastUpdated: Date;
    impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
}
export interface PolicyMetadata {
    framework?: string;
    regulation?: string;
    tags: string[];
    owner: string;
    reviewers: string[];
    lastReview: Date;
    nextReview: Date;
    changeLog: PolicyChange[];
}
export interface PolicyChange {
    version: string;
    date: Date;
    author: string;
    description: string;
    changes: string[];
}
export interface PolicyException {
    id: string;
    ruleId: string;
    dependency: string;
    reason: string;
    justification: string;
    approvedBy: string;
    approvedAt: Date;
    expiresAt: Date;
    conditions: string[];
    reviewSchedule: {
        frequency: 'MONTHLY' | 'QUARTERLY' | 'ANNUALLY';
        nextReview: Date;
        reviewer: string;
    };
    status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
}
export interface PolicyViolation {
    id: string;
    tenantId: string;
    policyId: string;
    ruleId: string;
    dependency: Dependency;
    violationType: string;
    severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW' | 'INFO';
    message: string;
    details: ViolationDetails;
    context: ViolationContext;
    status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'SUPPRESSED' | 'FALSE_POSITIVE';
    firstDetected: Date;
    lastSeen: Date;
    resolvedAt?: Date;
    resolvedBy?: string;
    resolution?: string;
    assignedTo?: string;
    dueDate?: Date;
    tags: string[];
}
export interface ViolationDetails {
    rule: PolicyRule;
    triggeredConditions: RuleCondition[];
    actualValues: Record<string, any>;
    evidence: ViolationEvidence[];
    impact: string;
    recommendation: string;
}
export interface ViolationEvidence {
    type: 'SCAN_RESULT' | 'CONFIGURATION' | 'METADATA' | 'VULNERABILITY' | 'LICENSE';
    source: string;
    content: any;
    timestamp: Date;
}
export interface ViolationContext {
    project: string;
    environment: string;
    ecosystem: string;
    packageFile: string;
    scanId?: string;
    buildId?: string;
    commitId?: string;
    pullRequestId?: string;
}
export interface PolicyEvaluation {
    dependencyId: string;
    policyId: string;
    status: 'COMPLIANT' | 'VIOLATION' | 'WARNING' | 'EXCEPTION' | 'SKIPPED';
    violations: PolicyViolation[];
    warnings: PolicyViolation[];
    exceptions: PolicyException[];
    evaluatedAt: Date;
    evaluationDuration: number;
    metadata: {
        rulesEvaluated: number;
        rulesTriggered: number;
        actionsExecuted: number;
    };
}
export interface PolicyEnforcementResult {
    evaluationId: string;
    tenantId: string;
    totalDependencies: number;
    evaluatedDependencies: number;
    skippedDependencies: number;
    compliantDependencies: number;
    violatingDependencies: number;
    warningDependencies: number;
    evaluations: PolicyEvaluation[];
    executedActions: ExecutedAction[];
    summary: EnforcementSummary;
    startTime: Date;
    endTime: Date;
    duration: number;
}
export interface ExecutedAction {
    violationId: string;
    actionType: string;
    status: 'SUCCESS' | 'FAILED' | 'SKIPPED';
    result?: any;
    error?: string;
    executedAt: Date;
    executionDuration: number;
}
export interface EnforcementSummary {
    policiesEvaluated: number;
    rulesEvaluated: number;
    violationsDetected: number;
    actionsExecuted: number;
    blockedDependencies: number;
    severityBreakdown: Record<string, number>;
    policyBreakdown: Record<string, number>;
}
export interface PolicyTemplate {
    id: string;
    name: string;
    description: string;
    category: 'SECURITY' | 'LICENSE' | 'MAINTENANCE' | 'COMPLIANCE' | 'CUSTOM';
    framework?: string;
    rules: Omit<PolicyRule, 'id'>[];
    defaultScope: PolicyScope;
    metadata: {
        version: string;
        author: string;
        tags: string[];
        references: string[];
    };
}
export declare class DependencyPolicyService extends EventEmitter {
    private policies;
    private violations;
    private evaluationHistory;
    private templates;
    constructor();
    private initializeDefaultTemplates;
    createPolicy(tenantId: string, policyData: Omit<DependencyPolicy, 'id' | 'createdAt' | 'updatedAt'>, createdBy: string): Promise<DependencyPolicy>;
    createPolicyFromTemplate(tenantId: string, templateId: string, customizations: {
        name?: string;
        scope?: Partial<PolicyScope>;
        ruleOverrides?: Record<string, Partial<PolicyRule>>;
    }, createdBy: string): Promise<DependencyPolicy>;
    private validatePolicy;
    private validateRule;
    private validateCondition;
    private validateAction;
    evaluatePolicies(dependencies: Dependency[], tenantId: string, context?: {
        project?: string;
        environment?: string;
        scanId?: string;
        buildId?: string;
        commitId?: string;
    }): Promise<PolicyEnforcementResult>;
    private evaluateDependency;
    private isDependencyInScope;
    private findActiveException;
    private evaluateRuleConditions;
    private enrichDependencyData;
    private evaluateCondition;
    private getFieldValue;
    private createViolation;
    private generateViolationMessage;
    private generateEvidence;
    private generateImpactDescription;
    private generateRecommendation;
    private determineEvaluationStatus;
    private executeViolationActions;
    private executeAction;
    private executeBlockAction;
    private executeWarnAction;
    private executeLogAction;
    private executeNotifyAction;
    private executeAutoFixAction;
    private executeCreateIssueAction;
    private executeEscalateAction;
    private calculateSeverityBreakdown;
    private calculatePolicyBreakdown;
    private generatePolicyId;
    private generateRuleId;
    private generateViolationId;
    private generateEvaluationId;
    getPolicy(policyId: string): DependencyPolicy | undefined;
    getPoliciesByTenant(tenantId: string): DependencyPolicy[];
    getTemplate(templateId: string): PolicyTemplate | undefined;
    getTemplates(): PolicyTemplate[];
    getViolation(violationId: string): PolicyViolation | undefined;
    getViolationsByTenant(tenantId: string): PolicyViolation[];
    getEvaluationResult(evaluationId: string): PolicyEnforcementResult | undefined;
    updatePolicy(policyId: string, updates: Partial<DependencyPolicy>, updatedBy: string): Promise<DependencyPolicy>;
    resolveViolation(violationId: string, resolution: string, resolvedBy: string): Promise<PolicyViolation>;
    getPolicyMetrics(tenantId?: string): any;
    private getViolationsBySeverity;
    private getViolationsByType;
}
interface EnforcementConfig {
    mode: 'ENFORCING' | 'PERMISSIVE' | 'DISABLED';
    continueOnError: boolean;
    parallel: boolean;
    timeout: number;
    retryAttempts: number;
}
export {};
