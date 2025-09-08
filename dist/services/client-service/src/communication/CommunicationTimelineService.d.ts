import { EventEmitter } from 'events';
export interface TimelineEntry {
    id: string;
    communicationId: string;
    tenantId: string;
    clientId: string;
    employeeId: string;
    timestamp: Date;
    entryType: 'communication' | 'task' | 'milestone' | 'note' | 'document' | 'meeting' | 'follow_up' | 'system_event';
    channel: 'email' | 'phone' | 'sms' | 'chat' | 'video_call' | 'in_person' | 'document' | 'system' | 'portal';
    direction: 'inbound' | 'outbound' | 'internal' | 'system';
    status: 'scheduled' | 'completed' | 'cancelled' | 'pending' | 'in_progress' | 'failed';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    subject: string;
    summary: string;
    content?: string;
    participants: Array<{
        id: string;
        name: string;
        email?: string;
        role: 'client' | 'employee' | 'third_party' | 'system';
        participationType: 'primary' | 'cc' | 'bcc' | 'attendee' | 'organizer' | 'optional';
    }>;
    attachments: Array<{
        id: string;
        name: string;
        type: string;
        size: number;
        url: string;
        thumbnailUrl?: string;
    }>;
    tags: string[];
    categories: string[];
    relatedEntries: string[];
    metrics: {
        duration?: number;
        responseTime?: number;
        engagementScore?: number;
        sentimentScore?: number;
        importance?: number;
    };
    compliance: {
        recordingRequired: boolean;
        recordingExists: boolean;
        retentionPeriod: number;
        complianceFlags: string[];
        auditTrail: Array<{
            action: string;
            timestamp: Date;
            userId: string;
            details: string;
        }>;
    };
    customFields: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}
export interface TimelineView {
    id: string;
    tenantId: string;
    clientId: string;
    viewType: 'chronological' | 'grouped' | 'filtered' | 'summary' | 'interactive';
    dateRange: {
        start: Date;
        end: Date;
    };
    filters: {
        entryTypes?: string[];
        channels?: string[];
        directions?: string[];
        statuses?: string[];
        priorities?: string[];
        tags?: string[];
        categories?: string[];
        participants?: string[];
        hasAttachments?: boolean;
        recordingsOnly?: boolean;
    };
    grouping: {
        enabled: boolean;
        groupBy: 'date' | 'type' | 'channel' | 'participant' | 'category' | 'custom';
        sortOrder: 'asc' | 'desc';
        showSummaries: boolean;
    };
    visualization: {
        layout: 'list' | 'timeline' | 'calendar' | 'gantt' | 'network' | 'cards';
        showMetrics: boolean;
        showPreview: boolean;
        compactMode: boolean;
        colorCoding: Record<string, string>;
        icons: Record<string, string>;
    };
    analytics: {
        totalEntries: number;
        entryDistribution: Record<string, number>;
        channelDistribution: Record<string, number>;
        engagementMetrics: {
            averageResponseTime: number;
            averageEngagement: number;
            averageSentiment: number;
            totalDuration: number;
        };
        trends: Array<{
            period: string;
            metric: string;
            value: number;
            change: number;
        }>;
    };
    exportOptions: {
        formats: Array<'pdf' | 'excel' | 'json' | 'csv' | 'html'>;
        includeAttachments: boolean;
        includeRecordings: boolean;
        watermark: boolean;
    };
    permissions: {
        viewLevel: 'basic' | 'detailed' | 'full';
        allowExport: boolean;
        allowEdit: boolean;
        allowDelete: boolean;
        restrictedFields: string[];
    };
    createdAt: Date;
    updatedAt: Date;
}
export interface TimelineTemplate {
    id: string;
    tenantId: string;
    name: string;
    description: string;
    templateType: 'client_onboarding' | 'project_management' | 'issue_resolution' | 'compliance_review' | 'custom';
    isDefault: boolean;
    isActive: boolean;
    structure: {
        phases: Array<{
            id: string;
            name: string;
            description: string;
            duration: number;
            isRequired: boolean;
            dependencies: string[];
            milestones: Array<{
                id: string;
                name: string;
                description: string;
                daysFromStart: number;
                isRequired: boolean;
                criteria: string[];
                autoComplete: boolean;
            }>;
            tasks: Array<{
                id: string;
                name: string;
                description: string;
                assigneeRole: string;
                dueOffset: number;
                priority: 'low' | 'medium' | 'high' | 'urgent';
                category: string;
                estimatedDuration: number;
                dependencies: string[];
                autoGenerate: boolean;
            }>;
        }>;
        communications: Array<{
            id: string;
            name: string;
            description: string;
            channel: string;
            trigger: 'phase_start' | 'phase_end' | 'milestone' | 'task_complete' | 'date' | 'manual';
            template: string;
            recipients: string[];
            isRequired: boolean;
        }>;
    };
    customization: {
        allowPhaseModification: boolean;
        allowTaskModification: boolean;
        allowCommunicationModification: boolean;
        requiredFields: string[];
        optionalFields: string[];
        validationRules: Record<string, any>;
    };
    usage: {
        timesUsed: number;
        successRate: number;
        averageCompletionTime: number;
        clientFeedback: number;
    };
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface TimelineAlert {
    id: string;
    tenantId: string;
    clientId: string;
    alertType: 'overdue_task' | 'missed_communication' | 'upcoming_deadline' | 'compliance_issue' | 'engagement_drop' | 'template_deviation';
    severity: 'info' | 'warning' | 'error' | 'critical';
    title: string;
    description: string;
    relatedEntryId?: string;
    triggerCondition: string;
    suggestedActions: string[];
    autoResolve: boolean;
    escalation: {
        enabled: boolean;
        escalateAfter: number;
        escalateTo: string[];
        escalationLevel: number;
    };
    resolution: {
        status: 'open' | 'acknowledged' | 'in_progress' | 'resolved' | 'dismissed';
        resolvedBy?: string;
        resolvedAt?: Date;
        resolution?: string;
        followUpRequired: boolean;
    };
    createdAt: Date;
    updatedAt: Date;
}
export interface TimelineConfig {
    defaultViewType: TimelineView['viewType'];
    maxTimelineLength: number;
    autoRefreshInterval: number;
    enableRealTimeUpdates: boolean;
    enablePredictiveInsights: boolean;
    defaultGrouping: TimelineView['grouping'];
    defaultVisualization: TimelineView['visualization'];
    retentionPeriod: number;
    complianceSettings: {
        auditTrailEnabled: boolean;
        recordingIntegration: boolean;
        complianceValidation: boolean;
        automaticClassification: boolean;
    };
    alertSettings: {
        enableAlerts: boolean;
        defaultEscalationTime: number;
        alertChannels: string[];
        quietHours: {
            enabled: boolean;
            start: string;
            end: string;
            timezone: string;
        };
    };
    integrations: {
        calendarSystems: string[];
        crmSystems: string[];
        documentSystems: string[];
        communicationPlatforms: string[];
    };
}
export declare class CommunicationTimelineService extends EventEmitter {
    private config;
    private timelineEntries;
    private timelineViews;
    private timelineTemplates;
    private activeAlerts;
    private realTimeConnections;
    private scheduledTasks;
    constructor(config: TimelineConfig);
    private initializeService;
    addTimelineEntry(entryData: Omit<TimelineEntry, 'id' | 'createdAt' | 'updatedAt'>): Promise<TimelineEntry>;
    updateTimelineEntry(entryId: string, updates: Partial<TimelineEntry>): Promise<TimelineEntry>;
    deleteTimelineEntry(entryId: string, reason: string, deletedBy: string): Promise<any>;
    createTimelineView(clientId: string, tenantId: string, viewConfig: Partial<TimelineView>): Promise<TimelineView>;
    getTimelineView(viewId: string): Promise<TimelineView>;
    createTimelineTemplate(tenantId: string, templateData: Omit<TimelineTemplate, 'id' | 'usage' | 'createdAt' | 'updatedAt'>): Promise<TimelineTemplate>;
    applyTemplate(templateId: string, clientId: string, startDate: Date, customizations?: Record<string, any>): Promise<{
        entriesCreated: TimelineEntry[];
        templateInstanceId: string;
    }>;
    searchTimeline(tenantId: string, searchCriteria: {
        clientIds?: string[];
        dateRange?: {
            start: Date;
            end: Date;
        };
        textSearch?: string;
        entryTypes?: string[];
        channels?: string[];
        tags?: string[];
        categories?: string[];
        participants?: string[];
        hasAttachments?: boolean;
        hasRecordings?: boolean;
        priorities?: string[];
        statuses?: string[];
        complianceFlags?: string[];
    }, options?: {
        limit?: number;
        offset?: number;
        sortBy?: 'timestamp' | 'priority' | 'relevance';
        sortOrder?: 'asc' | 'desc';
        includeArchived?: boolean;
    }): Promise<{
        entries: TimelineEntry[];
        totalCount: number;
        facets: Record<string, Record<string, number>>;
    }>;
    exportTimeline(viewId: string, exportFormat: 'pdf' | 'excel' | 'json' | 'csv' | 'html', options?: {
        includeAttachments?: boolean;
        includeRecordings?: boolean;
        watermark?: boolean;
        password?: string;
    }): Promise<{
        exportId: string;
        downloadUrl: string;
        expiresAt: Date;
    }>;
    generatePredictiveInsights(clientId: string, tenantId: string): Promise<{
        insights: Array<{
            type: 'upcoming_task' | 'overdue_item' | 'engagement_pattern' | 'communication_gap' | 'milestone_risk';
            confidence: number;
            description: string;
            recommendation: string;
            impact: 'low' | 'medium' | 'high';
            timeline: string;
            data: Record<string, any>;
        }>;
        recommendations: Array<{
            action: string;
            priority: 'low' | 'medium' | 'high' | 'urgent';
            category: string;
            description: string;
            estimatedEffort: string;
            expectedOutcome: string;
        }>;
    }>;
    private validateTimelineEntry;
    private enrichTimelineEntry;
    private updateRelatedViews;
    private checkEntryAlerts;
    private broadcastUpdate;
    private initializeRealTimeUpdates;
    private scheduleMaintenanceTasks;
    private initializeAlertMonitoring;
    private getClientTimelineEntries;
    private calculateViewAnalytics;
    private entryMatchesViewFilters;
    private calculateSearchFacets;
    private calculateRelevanceScore;
    private analyzeCommunicationPattern;
    private createAlert;
    private validateComplianceRequirements;
    private classifyEntry;
    private calculateEngagementScore;
    private calculateSentimentScore;
    private determineComplianceFlags;
    private validateEntryDeletion;
    private sanitizeEntryForBroadcast;
    private prepareExportData;
    private generateExportFile;
    private performMaintenanceCleanup;
    private processAlertQueue;
    private monitorForAlertConditions;
    shutdown(): Promise<any>;
}
