import { EventEmitter } from 'events';
import { DependencyInventoryService, ScanOptions } from './DependencyInventoryService';
import { VulnerabilityDatabaseService } from './VulnerabilityDatabaseService';
export interface ScanSchedule {
    id: string;
    tenantId: string;
    name: string;
    description?: string;
    projectPaths: string[];
    cronExpression: string;
    timezone?: string;
    enabled: boolean;
    scanOptions: ScanOptions;
    vulnerabilityScanOptions: {
        databases?: string[];
        severityThreshold?: string;
        includeTransitive?: boolean;
        maxConcurrency?: number;
    };
    notifications: NotificationConfig[];
    lastRun?: Date;
    nextRun?: Date;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
}
export interface NotificationConfig {
    type: 'email' | 'slack' | 'webhook' | 'teams' | 'jira';
    enabled: boolean;
    config: {
        recipients?: string[];
        channels?: string[];
        url?: string;
        webhookUrl?: string;
        slackToken?: string;
        teamsWebhook?: string;
        jiraConfig?: {
            url: string;
            username: string;
            token: string;
            project: string;
            issueType: string;
        };
    };
    triggers: NotificationTrigger[];
    template?: string;
}
export interface NotificationTrigger {
    condition: 'always' | 'vulnerabilities_found' | 'critical_vulnerabilities' | 'high_vulnerabilities' | 'new_vulnerabilities' | 'scan_failed';
    threshold?: number;
    severityLevel?: string;
}
export interface WorkflowExecution {
    id: string;
    scheduleId: string;
    tenantId: string;
    status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
    startTime: Date;
    endTime?: Date;
    duration?: number;
    inventoryResults: InventoryResult[];
    vulnerabilityResults: VulnerabilityResult[];
    totalProjects: number;
    totalDependencies: number;
    totalVulnerabilities: number;
    criticalVulnerabilities: number;
    highVulnerabilities: number;
    errors: string[];
    triggeredBy: 'SCHEDULE' | 'MANUAL' | 'WEBHOOK' | 'API';
    triggeredByUser?: string;
}
export interface InventoryResult {
    projectPath: string;
    inventoryId: string;
    dependencyCount: number;
    ecosystems: string[];
    scanDuration: number;
    status: 'SUCCESS' | 'FAILED';
    error?: string;
}
export interface VulnerabilityResult {
    inventoryId: string;
    scanId: string;
    vulnerabilityCount: number;
    severityBreakdown: Record<string, number>;
    scanDuration: number;
    status: 'SUCCESS' | 'FAILED';
    error?: string;
}
export interface ScanTrigger {
    id: string;
    tenantId: string;
    name: string;
    type: 'file_change' | 'git_commit' | 'pull_request' | 'schedule' | 'manual';
    enabled: boolean;
    config: {
        watchedFiles?: string[];
        gitRepository?: string;
        branches?: string[];
        webhookSecret?: string;
        scheduleExpression?: string;
    };
    actions: TriggerAction[];
    lastTriggered?: Date;
    createdAt: Date;
}
export interface TriggerAction {
    type: 'scan_dependencies' | 'scan_vulnerabilities' | 'send_notification' | 'create_issue' | 'update_policy';
    config: any;
    enabled: boolean;
}
export declare class AutomatedScanningWorkflowService extends EventEmitter {
    private dependencyService;
    private vulnerabilityService;
    private schedules;
    private cronJobs;
    private executions;
    private triggers;
    private activeExecutions;
    constructor(dependencyService: DependencyInventoryService, vulnerabilityService: VulnerabilityDatabaseService);
    private setupEventListeners;
    createSchedule(schedule: Omit<ScanSchedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<ScanSchedule>;
    updateSchedule(scheduleId: string, updates: Partial<ScanSchedule>): Promise<ScanSchedule>;
    deleteSchedule(scheduleId: string): boolean;
    private startSchedule;
    private stopSchedule;
    executeSchedule(scheduleId: string, triggeredBy: 'SCHEDULE' | 'MANUAL' | 'WEBHOOK' | 'API', triggeredByUser?: string): Promise<WorkflowExecution>;
    private executeInventoryScans;
    private executeVulnerabilityScans;
    private sendNotifications;
    private shouldTriggerNotification;
    private sendNotification;
    private formatNotificationMessage;
    private renderTemplate;
    private sendEmailNotification;
    private sendSlackNotification;
    private sendWebhookNotification;
    private sendTeamsNotification;
    private createJiraIssue;
    private sendFailureNotifications;
    private isValidCronExpression;
    private isValidProjectPath;
    private extractProjectName;
    private generateScheduleId;
    private generateExecutionId;
    getSchedule(scheduleId: string): ScanSchedule | undefined;
    getSchedulesByTenant(tenantId: string): ScanSchedule[];
    getExecution(executionId: string): WorkflowExecution | undefined;
    getExecutionsBySchedule(scheduleId: string, limit?: number): WorkflowExecution[];
    enableSchedule(scheduleId: string): Promise<void>;
    disableSchedule(scheduleId: string): Promise<void>;
    cancelExecution(executionId: string): boolean;
    getActiveExecutions(): WorkflowExecution[];
    getWorkflowMetrics(tenantId?: string): any;
    cleanup(olderThanDays?: number): void;
}
