"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AutomatedScanningWorkflowService = void 0;
const events_1 = require("events");
const cron_1 = require("cron");
class AutomatedScanningWorkflowService extends events_1.EventEmitter {
    dependencyService;
    vulnerabilityService;
    schedules = new Map();
    cronJobs = new Map();
    executions = new Map();
    triggers = new Map();
    activeExecutions = new Set();
    constructor(dependencyService, vulnerabilityService) {
        super();
        this.dependencyService = dependencyService;
        this.vulnerabilityService = vulnerabilityService;
        this.setupEventListeners();
    }
    setupEventListeners() {
        this.dependencyService.on('scanCompleted', (event) => {
            this.emit('inventoryScanCompleted', event);
        });
        this.vulnerabilityService.on('scanCompleted', (event) => {
            this.emit('vulnerabilityScanCompleted', event);
        });
    }
    async createSchedule(schedule) {
        const newSchedule = {
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
    async updateSchedule(scheduleId, updates) {
        const existing = this.schedules.get(scheduleId);
        if (!existing) {
            throw new Error(`Schedule not found: ${scheduleId}`);
        }
        const updated = {
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
    deleteSchedule(scheduleId) {
        const schedule = this.schedules.get(scheduleId);
        if (!schedule)
            return false;
        this.stopSchedule(scheduleId);
        this.schedules.delete(scheduleId);
        this.emit('scheduleDeleted', { scheduleId });
        return true;
    }
    startSchedule(scheduleId) {
        const schedule = this.schedules.get(scheduleId);
        if (!schedule || !schedule.enabled)
            return;
        const job = new cron_1.CronJob(schedule.cronExpression, () => this.executeSchedule(scheduleId, 'SCHEDULE'), null, true, schedule.timezone || 'UTC');
        this.cronJobs.set(scheduleId, job);
        // Update next run time
        schedule.nextRun = job.nextDate().toJSDate();
        this.schedules.set(scheduleId, schedule);
        this.emit('scheduleStarted', { scheduleId, nextRun: schedule.nextRun });
    }
    stopSchedule(scheduleId) {
        const job = this.cronJobs.get(scheduleId);
        if (job) {
            job.stop();
            this.cronJobs.delete(scheduleId);
            this.emit('scheduleStopped', { scheduleId });
        }
    }
    async executeSchedule(scheduleId, triggeredBy, triggeredByUser) {
        const schedule = this.schedules.get(scheduleId);
        if (!schedule) {
            throw new Error(`Schedule not found: ${scheduleId}`);
        }
        if (this.activeExecutions.has(scheduleId)) {
            throw new Error(`Schedule ${scheduleId} is already running`);
        }
        const execution = {
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
        }
        catch (error) {
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
        }
        finally {
            this.activeExecutions.delete(scheduleId);
            this.executions.set(execution.id, execution);
        }
        return execution;
    }
    async executeInventoryScans(schedule, execution) {
        const results = [];
        for (const projectPath of schedule.projectPaths) {
            try {
                this.emit('projectScanStarted', {
                    executionId: execution.id,
                    projectPath
                });
                const inventory = await this.dependencyService.scanProject(projectPath, schedule.tenantId, this.extractProjectName(projectPath), schedule.scanOptions);
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
            }
            catch (error) {
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
    async executeVulnerabilityScans(schedule, execution, inventoryResults) {
        const results = [];
        for (const inventoryResult of inventoryResults) {
            if (inventoryResult.status !== 'SUCCESS')
                continue;
            try {
                this.emit('vulnerabilityScanStarted', {
                    executionId: execution.id,
                    inventoryId: inventoryResult.inventoryId
                });
                const inventory = this.dependencyService.getInventory(inventoryResult.inventoryId);
                if (!inventory)
                    continue;
                const dependencies = inventory.packageFiles.flatMap(pf => pf.dependencies);
                const scanReport = await this.vulnerabilityService.scanDependencies(dependencies, inventoryResult.inventoryId, schedule.vulnerabilityScanOptions);
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
            }
            catch (error) {
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
    async sendNotifications(schedule, execution) {
        for (const notification of schedule.notifications) {
            if (!notification.enabled)
                continue;
            for (const trigger of notification.triggers) {
                if (this.shouldTriggerNotification(trigger, execution)) {
                    try {
                        await this.sendNotification(notification, schedule, execution);
                        this.emit('notificationSent', {
                            scheduleId: schedule.id,
                            executionId: execution.id,
                            type: notification.type
                        });
                    }
                    catch (error) {
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
    shouldTriggerNotification(trigger, execution) {
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
    async sendNotification(notification, schedule, execution) {
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
    formatNotificationMessage(notification, schedule, execution) {
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
    renderTemplate(template, data) {
        return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
            const keys = key.trim().split('.');
            let value = data;
            for (const k of keys) {
                value = value?.[k];
            }
            return value?.toString() || match;
        });
    }
    async sendEmailNotification(config, message) {
        // Email implementation would go here
        console.log('Email notification sent:', { recipients: config.recipients, message });
    }
    async sendSlackNotification(config, message) {
        if (!config.webhookUrl)
            return;
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
    async sendWebhookNotification(config, message, execution) {
        if (!config.url)
            return;
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
    async sendTeamsNotification(config, message) {
        if (!config.teamsWebhook)
            return;
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
    async createJiraIssue(config, message, execution) {
        if (!config.jiraConfig)
            return;
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
    async sendFailureNotifications(schedule, execution, error) {
        for (const notification of schedule.notifications) {
            if (!notification.enabled)
                continue;
            const hasFailureTrigger = notification.triggers.some(t => t.condition === 'scan_failed');
            if (hasFailureTrigger) {
                try {
                    await this.sendNotification(notification, schedule, execution);
                }
                catch (notifError) {
                    console.error('Failed to send failure notification:', notifError.message);
                }
            }
        }
    }
    isValidCronExpression(expression) {
        try {
            new cron_1.CronJob(expression, () => { });
            return true;
        }
        catch {
            return false;
        }
    }
    async isValidProjectPath(projectPath) {
        try {
            const fs = await Promise.resolve().then(() => __importStar(require('fs/promises')));
            const stat = await fs.stat(projectPath);
            return stat.isDirectory();
        }
        catch {
            return false;
        }
    }
    extractProjectName(projectPath) {
        const path = await Promise.resolve().then(() => __importStar(require('path')));
        return path.basename(projectPath);
    }
    generateScheduleId() {
        return `sched_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateExecutionId() {
        return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    // Public API methods
    getSchedule(scheduleId) {
        return this.schedules.get(scheduleId);
    }
    getSchedulesByTenant(tenantId) {
        return Array.from(this.schedules.values())
            .filter(s => s.tenantId === tenantId);
    }
    getExecution(executionId) {
        return this.executions.get(executionId);
    }
    getExecutionsBySchedule(scheduleId, limit = 10) {
        return Array.from(this.executions.values())
            .filter(e => e.scheduleId === scheduleId)
            .sort((a, b) => b.startTime.getTime() - a.startTime.getTime())
            .slice(0, limit);
    }
    async enableSchedule(scheduleId) {
        const schedule = this.schedules.get(scheduleId);
        if (!schedule) {
            throw new Error(`Schedule not found: ${scheduleId}`);
        }
        schedule.enabled = true;
        schedule.updatedAt = new Date();
        this.schedules.set(scheduleId, schedule);
        this.startSchedule(scheduleId);
    }
    async disableSchedule(scheduleId) {
        const schedule = this.schedules.get(scheduleId);
        if (!schedule) {
            throw new Error(`Schedule not found: ${scheduleId}`);
        }
        schedule.enabled = false;
        schedule.updatedAt = new Date();
        this.schedules.set(scheduleId, schedule);
        this.stopSchedule(scheduleId);
    }
    cancelExecution(executionId) {
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
    getActiveExecutions() {
        return Array.from(this.executions.values())
            .filter(e => e.status === 'RUNNING');
    }
    getWorkflowMetrics(tenantId) {
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
            .reduce((sum, e) => sum + e.duration, 0) / Math.max(1, executions.filter(e => e.duration).length);
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
    cleanup(olderThanDays = 30) {
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
exports.AutomatedScanningWorkflowService = AutomatedScanningWorkflowService;
