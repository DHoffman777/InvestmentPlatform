import { EventEmitter } from 'events';
import { CronJob } from 'cron';
import { DependencyInventoryService, DependencyInventory, ScanOptions } from './DependencyInventoryService';
import { VulnerabilityDatabaseService, ScanReport } from './VulnerabilityDatabaseService';

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

export class AutomatedScanningWorkflowService extends EventEmitter {
  private schedules: Map<string, ScanSchedule> = new Map();
  private cronJobs: Map<string, CronJob> = new Map();
  private executions: Map<string, WorkflowExecution> = new Map();
  private triggers: Map<string, ScanTrigger> = new Map();
  private activeExecutions: Set<string> = new Set();

  constructor(
    private dependencyService: DependencyInventoryService,
    private vulnerabilityService: VulnerabilityDatabaseService
  ) {
    super();
    this.setupEventListeners();
  }

  private setupEventListeners(): void {
    this.dependencyService.on('scanCompleted', (event) => {
      this.emit('inventoryScanCompleted', event);
    });

    this.vulnerabilityService.on('scanCompleted', (event) => {
      this.emit('vulnerabilityScanCompleted', event);
    });
  }

  async createSchedule(schedule: Omit<ScanSchedule, 'id' | 'createdAt' | 'updatedAt'>): Promise<ScanSchedule> {
    const newSchedule: ScanSchedule = {
      ...schedule,
      id: this.generateScheduleId(),
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Validate cron expression
    if (!this.isValidCronExpression(newSchedule.cronExpression)) {
      throw new Error('Invalid cron expression');
    }

    // Validate project paths
    for (const projectPath of newSchedule.projectPaths) {
      if (!(await this.isValidProjectPath(projectPath))) {
        throw new Error(`Invalid project path: ${projectPath}`);
      }
    }

    this.schedules.set(newSchedule.id, newSchedule);

    if (newSchedule.enabled) {
      this.startSchedule(newSchedule.id);
    }

    this.emit('scheduleCreated', { scheduleId: newSchedule.id });
    return newSchedule;
  }

  async updateSchedule(scheduleId: string, updates: Partial<ScanSchedule>): Promise<ScanSchedule> {
    const existing = this.schedules.get(scheduleId);
    if (!existing) {
      throw new Error(`Schedule not found: ${scheduleId}`);
    }

    const updated: ScanSchedule = {
      ...existing,
      ...updates,
      id: scheduleId,
      updatedAt: new Date()
    };

    // Validate cron expression if changed
    if (updates.cronExpression && !this.isValidCronExpression(updates.cronExpression)) {
      throw new Error('Invalid cron expression');
    }

    this.schedules.set(scheduleId, updated);

    // Restart schedule if cron expression or enabled status changed
    if (updates.cronExpression || updates.enabled !== undefined) {
      this.stopSchedule(scheduleId);
      if (updated.enabled) {
        this.startSchedule(scheduleId);
      }
    }

    this.emit('scheduleUpdated', { scheduleId });
    return updated;
  }

  deleteSchedule(scheduleId: string): boolean {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) return false;

    this.stopSchedule(scheduleId);
    this.schedules.delete(scheduleId);

    this.emit('scheduleDeleted', { scheduleId });
    return true;
  }

  private startSchedule(scheduleId: string): void {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule || !schedule.enabled) return;

    const job = new CronJob(
      schedule.cronExpression,
      () => { this.executeSchedule(scheduleId, 'SCHEDULE'); },
      null,
      true,
      schedule.timezone || 'UTC',
      null,
      false
    );

    this.cronJobs.set(scheduleId, job);

    // Update next run time
    schedule.nextRun = job.nextDate().toJSDate();
    this.schedules.set(scheduleId, schedule);

    this.emit('scheduleStarted', { scheduleId, nextRun: schedule.nextRun });
  }

  private stopSchedule(scheduleId: string): void {
    const job = this.cronJobs.get(scheduleId);
    if (job) {
      job.stop();
      this.cronJobs.delete(scheduleId);
      this.emit('scheduleStopped', { scheduleId });
    }
  }

  async executeSchedule(
    scheduleId: string,
    triggeredBy: 'SCHEDULE' | 'MANUAL' | 'WEBHOOK' | 'API',
    triggeredByUser?: string
  ): Promise<WorkflowExecution> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      throw new Error(`Schedule not found: ${scheduleId}`);
    }

    if (this.activeExecutions.has(scheduleId)) {
      throw new Error(`Schedule ${scheduleId} is already running`);
    }

    const execution: WorkflowExecution = {
      id: this.generateExecutionId(),
      scheduleId,
      tenantId: schedule.tenantId,
      status: 'PENDING',
      startTime: new Date(),
      inventoryResults: [],
      vulnerabilityResults: [],
      totalProjects: schedule.projectPaths.length,
      totalDependencies: 0,
      totalVulnerabilities: 0,
      criticalVulnerabilities: 0,
      highVulnerabilities: 0,
      errors: [],
      triggeredBy,
      triggeredByUser
    };

    this.executions.set(execution.id, execution);
    this.activeExecutions.add(scheduleId);

    try {
      this.emit('executionStarted', { executionId: execution.id, scheduleId });
      
      execution.status = 'RUNNING';
      this.executions.set(execution.id, execution);

      // Execute dependency scans for all projects
      const inventoryResults = await this.executeInventoryScans(schedule, execution);
      execution.inventoryResults = inventoryResults;

      // Execute vulnerability scans
      const vulnerabilityResults = await this.executeVulnerabilityScans(schedule, execution, inventoryResults);
      execution.vulnerabilityResults = vulnerabilityResults;

      // Calculate totals
      execution.totalDependencies = inventoryResults.reduce((sum, r) => sum + r.dependencyCount, 0);
      execution.totalVulnerabilities = vulnerabilityResults.reduce((sum, r) => sum + r.vulnerabilityCount, 0);
      execution.criticalVulnerabilities = vulnerabilityResults.reduce((sum, r) => sum + (r.severityBreakdown.CRITICAL || 0), 0);
      execution.highVulnerabilities = vulnerabilityResults.reduce((sum, r) => sum + (r.severityBreakdown.HIGH || 0), 0);

      execution.status = 'COMPLETED';
      execution.endTime = new Date();
      execution.duration = execution.endTime.getTime() - execution.startTime.getTime();

      // Update schedule's last run time
      schedule.lastRun = execution.startTime;
      this.schedules.set(scheduleId, schedule);

      // Send notifications
      await this.sendNotifications(schedule, execution);

      this.emit('executionCompleted', { 
        executionId: execution.id, 
        scheduleId,
        vulnerabilities: execution.totalVulnerabilities,
        criticalCount: execution.criticalVulnerabilities
      });

    } catch (error: any) {
      execution.status = 'FAILED';
      execution.endTime = new Date();
      execution.duration = execution.endTime.getTime() - execution.startTime.getTime();
      execution.errors.push(error instanceof Error ? error.message : 'Unknown error');

      await this.sendFailureNotifications(schedule, execution, error instanceof Error ? error.message : 'Unknown error');

      this.emit('executionFailed', { 
        executionId: execution.id, 
        scheduleId,
        error: error.message
      });
    } finally {
      this.activeExecutions.delete(scheduleId);
      this.executions.set(execution.id, execution);
    }

    return execution;
  }

  private async executeInventoryScans(
    schedule: ScanSchedule,
    execution: WorkflowExecution
  ): Promise<InventoryResult[]> {
    const results: InventoryResult[] = [];

    for (const projectPath of schedule.projectPaths) {
      try {
        this.emit('projectScanStarted', { 
          executionId: execution.id, 
          projectPath 
        });

        const inventory = await this.dependencyService.scanProject(
          projectPath,
          schedule.tenantId,
          await this.extractProjectName(projectPath),
          schedule.scanOptions
        );

        results.push({
          projectPath,
          inventoryId: inventory.id,
          dependencyCount: inventory.totalDependencies,
          ecosystems: inventory.ecosystems,
          scanDuration: inventory.scanDuration,
          status: 'SUCCESS'
        });

        this.emit('projectScanCompleted', { 
          executionId: execution.id, 
          projectPath,
          dependencyCount: inventory.totalDependencies
        });

      } catch (error: any) {
        results.push({
          projectPath,
          inventoryId: '',
          dependencyCount: 0,
          ecosystems: [],
          scanDuration: 0,
          status: 'FAILED',
          error: error.message
        });

        execution.errors.push(`Inventory scan failed for ${projectPath}: ${error instanceof Error ? error.message : 'Unknown error'}`);

        this.emit('projectScanFailed', { 
          executionId: execution.id, 
          projectPath,
          error: error.message
        });
      }
    }

    return results;
  }

  private async executeVulnerabilityScans(
    schedule: ScanSchedule,
    execution: WorkflowExecution,
    inventoryResults: InventoryResult[]
  ): Promise<VulnerabilityResult[]> {
    const results: VulnerabilityResult[] = [];

    for (const inventoryResult of inventoryResults) {
      if (inventoryResult.status !== 'SUCCESS') continue;

      try {
        this.emit('vulnerabilityScanStarted', { 
          executionId: execution.id, 
          inventoryId: inventoryResult.inventoryId 
        });

        const inventory = this.dependencyService.getInventory(inventoryResult.inventoryId);
        if (!inventory) continue;

        const dependencies = inventory.packageFiles.flatMap(pf => pf.dependencies);
        
        const scanReport = await this.vulnerabilityService.scanDependencies(
          dependencies,
          inventoryResult.inventoryId,
          schedule.vulnerabilityScanOptions
        );

        results.push({
          inventoryId: inventoryResult.inventoryId,
          scanId: scanReport.scanId,
          vulnerabilityCount: scanReport.totalVulnerabilities,
          severityBreakdown: scanReport.severityBreakdown,
          scanDuration: scanReport.scanDuration,
          status: 'SUCCESS'
        });

        this.emit('vulnerabilityScanCompleted', { 
          executionId: execution.id, 
          inventoryId: inventoryResult.inventoryId,
          vulnerabilities: scanReport.totalVulnerabilities
        });

      } catch (error: any) {
        results.push({
          inventoryId: inventoryResult.inventoryId,
          scanId: '',
          vulnerabilityCount: 0,
          severityBreakdown: {},
          scanDuration: 0,
          status: 'FAILED',
          error: error.message
        });

        execution.errors.push(`Vulnerability scan failed for ${inventoryResult.inventoryId}: ${error instanceof Error ? error.message : 'Unknown error'}`);

        this.emit('vulnerabilityScanFailed', { 
          executionId: execution.id, 
          inventoryId: inventoryResult.inventoryId,
          error: error.message
        });
      }
    }

    return results;
  }

  private async sendNotifications(
    schedule: ScanSchedule,
    execution: WorkflowExecution
  ): Promise<any> {
    for (const notification of schedule.notifications) {
      if (!notification.enabled) continue;

      for (const trigger of notification.triggers) {
        if (this.shouldTriggerNotification(trigger, execution)) {
          try {
            await this.sendNotification(notification, schedule, execution);
            this.emit('notificationSent', { 
              scheduleId: schedule.id,
              executionId: execution.id,
              type: notification.type
            });
          } catch (error: any) {
            this.emit('notificationFailed', { 
              scheduleId: schedule.id,
              executionId: execution.id,
              type: notification.type,
              error: error.message
            });
          }
          break; // Only send once per notification config
        }
      }
    }
  }

  private shouldTriggerNotification(
    trigger: NotificationTrigger,
    execution: WorkflowExecution
  ): boolean {
    switch (trigger.condition) {
      case 'always':
        return true;
      case 'vulnerabilities_found':
        return execution.totalVulnerabilities > 0;
      case 'critical_vulnerabilities':
        return execution.criticalVulnerabilities >= (trigger.threshold || 1);
      case 'high_vulnerabilities':
        return execution.highVulnerabilities >= (trigger.threshold || 1);
      case 'new_vulnerabilities':
        // Would require comparison with previous scan - simplified for now
        return execution.totalVulnerabilities > 0;
      case 'scan_failed':
        return execution.status === 'FAILED';
      default:
        return false;
    }
  }

  private async sendNotification(
    notification: NotificationConfig,
    schedule: ScanSchedule,
    execution: WorkflowExecution
  ): Promise<any> {
    const message = this.formatNotificationMessage(notification, schedule, execution);

    switch (notification.type) {
      case 'email':
        await this.sendEmailNotification(notification.config, message);
        break;
      case 'slack':
        await this.sendSlackNotification(notification.config, message);
        break;
      case 'webhook':
        await this.sendWebhookNotification(notification.config, message, execution);
        break;
      case 'teams':
        await this.sendTeamsNotification(notification.config, message);
        break;
      case 'jira':
        await this.createJiraIssue(notification.config, message, execution);
        break;
    }
  }

  private formatNotificationMessage(
    notification: NotificationConfig,
    schedule: ScanSchedule,
    execution: WorkflowExecution
  ): string {
    if (notification.template) {
      return this.renderTemplate(notification.template, { schedule, execution });
    }

    return `
Dependency Scan Results - ${schedule.name}

Execution ID: ${execution.id}
Status: ${execution.status}
Duration: ${Math.round((execution.duration || 0) / 1000)}s

Results:
- Total Projects: ${execution.totalProjects}
- Total Dependencies: ${execution.totalDependencies}
- Total Vulnerabilities: ${execution.totalVulnerabilities}
- Critical: ${execution.criticalVulnerabilities}
- High: ${execution.highVulnerabilities}

${execution.errors.length > 0 ? `Errors:\n${execution.errors.join('\n')}` : ''}
    `.trim();
  }

  private renderTemplate(template: string, data: any): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const keys = key.trim().split('.');
      let value = data;
      for (const k of keys) {
        value = value?.[k];
      }
      return value?.toString() || match;
    });
  }

  private async sendEmailNotification(config: any, message: string): Promise<any> {
    // Email implementation would go here
    console.log('Email notification sent:', { recipients: config.recipients, message });
  }

  private async sendSlackNotification(config: any, message: string): Promise<any> {
    if (!config.webhookUrl) return;

    const payload = {
      text: message,
      username: 'Dependency Scanner',
      icon_emoji: ':warning:'
    };

    const response = await fetch(config.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Slack notification failed: ${response.statusText}`);
    }
  }

  private async sendWebhookNotification(config: any, message: string, execution: WorkflowExecution): Promise<any> {
    if (!config.url) return;

    const payload = {
      message,
      execution: {
        id: execution.id,
        status: execution.status,
        startTime: execution.startTime,
        endTime: execution.endTime,
        totalVulnerabilities: execution.totalVulnerabilities,
        criticalVulnerabilities: execution.criticalVulnerabilities,
        highVulnerabilities: execution.highVulnerabilities
      }
    };

    const response = await fetch(config.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Webhook notification failed: ${response.statusText}`);
    }
  }

  private async sendTeamsNotification(config: any, message: string): Promise<any> {
    if (!config.teamsWebhook) return;

    const payload = {
      '@type': 'MessageCard',
      '@context': 'https://schema.org/extensions',
      summary: 'Dependency Scan Results',
      themeColor: '0078D7',
      sections: [{
        activityTitle: 'Dependency Scan Completed',
        activitySubtitle: 'Security vulnerability scan results',
        text: message
      }]
    };

    const response = await fetch(config.teamsWebhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`Teams notification failed: ${response.statusText}`);
    }
  }

  private async createJiraIssue(config: any, message: string, execution: WorkflowExecution): Promise<any> {
    if (!config.jiraConfig) return;

    const { url, username, token, project, issueType } = config.jiraConfig;

    const payload = {
      fields: {
        project: { key: project },
        summary: `Dependency Scan - ${execution.criticalVulnerabilities} Critical, ${execution.highVulnerabilities} High Vulnerabilities`,
        description: message,
        issuetype: { name: issueType },
        priority: execution.criticalVulnerabilities > 0 ? { name: 'Critical' } : { name: 'High' }
      }
    };

    const response = await fetch(`${url}/rest/api/2/issue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${username}:${token}`).toString('base64')}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      throw new Error(`JIRA issue creation failed: ${response.statusText}`);
    }
  }

  private async sendFailureNotifications(
    schedule: ScanSchedule,
    execution: WorkflowExecution,
    error: string
  ): Promise<any> {
    for (const notification of schedule.notifications) {
      if (!notification.enabled) continue;

      const hasFailureTrigger = notification.triggers.some(t => t.condition === 'scan_failed');
      if (hasFailureTrigger) {
        try {
          await this.sendNotification(notification, schedule, execution);
        } catch (notifError) {
          console.error('Failed to send failure notification:', (notifError as Error).message);
        }
      }
    }
  }

  private isValidCronExpression(expression: string): boolean {
    try {
      new CronJob(expression, () => {});
      return true;
    } catch {
      return false;
    }
  }

  private async isValidProjectPath(projectPath: string): Promise<boolean> {
    try {
      const fs = await import('fs/promises');
      const stat = await fs.stat(projectPath);
      return stat.isDirectory();
    } catch {
      return false;
    }
  }

  private async extractProjectName(projectPath: string): Promise<string> {
    const path = await import('path');
    return path.basename(projectPath);
  }

  private generateScheduleId(): string {
    return `sched_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateExecutionId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Public API methods
  getSchedule(scheduleId: string): ScanSchedule | undefined {
    return this.schedules.get(scheduleId);
  }

  getSchedulesByTenant(tenantId: string): ScanSchedule[] {
    return Array.from(this.schedules.values())
      .filter(s => s.tenantId === tenantId);
  }

  getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  getExecutionsBySchedule(scheduleId: string, limit: number = 10): WorkflowExecution[] {
    return Array.from(this.executions.values())
      .filter(e => e.scheduleId === scheduleId)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
      .slice(0, limit);
  }

  async enableSchedule(scheduleId: string): Promise<any> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      throw new Error(`Schedule not found: ${scheduleId}`);
    }

    schedule.enabled = true;
    schedule.updatedAt = new Date();
    this.schedules.set(scheduleId, schedule);
    
    this.startSchedule(scheduleId);
  }

  async disableSchedule(scheduleId: string): Promise<any> {
    const schedule = this.schedules.get(scheduleId);
    if (!schedule) {
      throw new Error(`Schedule not found: ${scheduleId}`);
    }

    schedule.enabled = false;
    schedule.updatedAt = new Date();
    this.schedules.set(scheduleId, schedule);
    
    this.stopSchedule(scheduleId);
  }

  cancelExecution(executionId: string): boolean {
    const execution = this.executions.get(executionId);
    if (!execution || execution.status !== 'RUNNING') {
      return false;
    }

    execution.status = 'CANCELLED';
    execution.endTime = new Date();
    execution.duration = execution.endTime.getTime() - execution.startTime.getTime();
    
    this.executions.set(executionId, execution);
    this.activeExecutions.delete(execution.scheduleId);

    this.emit('executionCancelled', { executionId });
    return true;
  }

  getActiveExecutions(): WorkflowExecution[] {
    return Array.from(this.executions.values())
      .filter(e => e.status === 'RUNNING');
  }

  getWorkflowMetrics(tenantId?: string): any {
    const schedules = tenantId 
      ? this.getSchedulesByTenant(tenantId)
      : Array.from(this.schedules.values());
    
    const executions = Array.from(this.executions.values())
      .filter(e => !tenantId || e.tenantId === tenantId);

    const totalSchedules = schedules.length;
    const enabledSchedules = schedules.filter(s => s.enabled).length;
    const totalExecutions = executions.length;
    const successfulExecutions = executions.filter(e => e.status === 'COMPLETED').length;
    const failedExecutions = executions.filter(e => e.status === 'FAILED').length;
    const avgExecutionDuration = executions
      .filter(e => e.duration)
      .reduce((sum, e) => sum + e.duration!, 0) / Math.max(1, executions.filter(e => e.duration).length);

    const totalVulnerabilities = executions.reduce((sum, e) => sum + e.totalVulnerabilities, 0);
    const totalCritical = executions.reduce((sum, e) => sum + e.criticalVulnerabilities, 0);
    const totalHigh = executions.reduce((sum, e) => sum + e.highVulnerabilities, 0);

    return {
      schedules: {
        total: totalSchedules,
        enabled: enabledSchedules,
        disabled: totalSchedules - enabledSchedules
      },
      executions: {
        total: totalExecutions,
        successful: successfulExecutions,
        failed: failedExecutions,
        successRate: totalExecutions > 0 ? successfulExecutions / totalExecutions : 0,
        avgDuration: Math.round(avgExecutionDuration)
      },
      vulnerabilities: {
        total: totalVulnerabilities,
        critical: totalCritical,
        high: totalHigh
      },
      activeExecutions: this.activeExecutions.size
    };
  }

  cleanup(olderThanDays: number = 30): void {
    const cutoffDate = new Date(Date.now() - (olderThanDays * 24 * 60 * 60 * 1000));
    
    for (const [executionId, execution] of this.executions.entries()) {
      if (execution.startTime < cutoffDate && execution.status !== 'RUNNING') {
        this.executions.delete(executionId);
      }
    }

    this.emit('cleanupCompleted', { 
      cutoffDate, 
      remainingExecutions: this.executions.size 
    });
  }
}

