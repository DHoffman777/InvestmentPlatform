import { EventEmitter } from 'events';
export interface MeetingNotes {
    id: string;
    tenantId: string;
    meetingId: string;
    authorId: string;
    authorName: string;
    title: string;
    content: {
        text: string;
        html?: string;
        format: 'plain' | 'markdown' | 'html' | 'rich_text';
    };
    sections: {
        id: string;
        type: 'agenda' | 'discussion' | 'decisions' | 'action_items' | 'questions' | 'notes' | 'custom';
        title: string;
        content: string;
        order: number;
        timestamps?: {
            startTime?: Date;
            endTime?: Date;
        };
        participants?: string[];
    }[];
    attachments: {
        id: string;
        name: string;
        type: 'document' | 'image' | 'audio' | 'video' | 'link' | 'other';
        url: string;
        size?: number;
        mimeType?: string;
        uploadedBy: string;
        uploadedAt: Date;
        description?: string;
    }[];
    tags: string[];
    keywords: string[];
    sentiment: {
        overall: 'positive' | 'neutral' | 'negative';
        score: number;
        confidence: number;
        keyPhrases: {
            phrase: string;
            sentiment: 'positive' | 'neutral' | 'negative';
            confidence: number;
        }[];
    };
    accessibility: {
        transcription?: {
            available: boolean;
            language: string;
            confidence: number;
            speakers?: {
                id: string;
                name: string;
                segments: {
                    startTime: number;
                    endTime: number;
                    text: string;
                    confidence: number;
                }[];
            }[];
        };
        translation?: {
            originalLanguage: string;
            translations: {
                language: string;
                content: string;
                confidence: number;
            }[];
        };
    };
    sharing: {
        visibility: 'private' | 'team' | 'organization' | 'public';
        sharedWith: {
            userId: string;
            userName: string;
            permission: 'view' | 'comment' | 'edit';
            sharedAt: Date;
        }[];
        allowComments: boolean;
        allowExport: boolean;
    };
    version: {
        number: number;
        changelog: {
            version: number;
            authorId: string;
            authorName: string;
            changes: string;
            timestamp: Date;
        }[];
    };
    status: 'draft' | 'published' | 'archived';
    createdAt: Date;
    updatedAt: Date;
}
export interface FollowUpItem {
    id: string;
    tenantId: string;
    meetingId: string;
    notesId?: string;
    type: 'action_item' | 'decision' | 'question' | 'reminder' | 'task' | 'custom';
    title: string;
    description: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
    assignedTo: {
        userId: string;
        userName: string;
        email: string;
        role?: string;
    }[];
    createdBy: {
        userId: string;
        userName: string;
    };
    dueDate?: Date;
    completedDate?: Date;
    estimatedHours?: number;
    actualHours?: number;
    dependencies: {
        itemId: string;
        type: 'blocks' | 'depends_on' | 'related';
    }[];
    attachments: {
        id: string;
        name: string;
        url: string;
        type: string;
    }[];
    comments: {
        id: string;
        authorId: string;
        authorName: string;
        content: string;
        timestamp: Date;
        edited?: {
            timestamp: Date;
            reason?: string;
        };
    }[];
    updates: {
        id: string;
        authorId: string;
        authorName: string;
        type: 'status_change' | 'assignment' | 'due_date' | 'comment' | 'completion';
        oldValue?: any;
        newValue?: any;
        description: string;
        timestamp: Date;
    }[];
    integrations: {
        taskId?: string;
        crmId?: string;
        projectId?: string;
    };
    recurrence?: {
        pattern: 'daily' | 'weekly' | 'monthly' | 'quarterly';
        interval: number;
        endDate?: Date;
        nextDueDate?: Date;
    };
    metrics: {
        timeToComplete?: number;
        reopenCount: number;
        commentCount: number;
        assignmentCount: number;
    };
    createdAt: Date;
    updatedAt: Date;
}
export interface NotesTemplate {
    id: string;
    tenantId: string;
    name: string;
    description?: string;
    type: 'meeting_type' | 'department' | 'project' | 'custom';
    applicableFor: string[];
    sections: {
        type: MeetingNotes['sections'][0]['type'];
        title: string;
        defaultContent?: string;
        required: boolean;
        order: number;
        prompts?: string[];
    }[];
    settings: {
        autoGenerateSummary: boolean;
        extractActionItems: boolean;
        enableTranscription: boolean;
        defaultTags: string[];
        requiredFields: string[];
    };
    status: 'active' | 'inactive' | 'draft';
    createdAt: Date;
    updatedAt: Date;
}
export interface MeetingSummary {
    id: string;
    tenantId: string;
    meetingId: string;
    notesId: string;
    generatedBy: 'ai' | 'manual';
    summary: {
        executive: string;
        keyPoints: string[];
        decisions: string[];
        actionItems: string[];
        nextSteps: string[];
    };
    participants: {
        userId: string;
        userName: string;
        contribution: {
            speakingTime?: number;
            keyContributions: string[];
            actionItemsAssigned: number;
        };
    }[];
    insights: {
        meetingEffectiveness: number;
        participationBalance: number;
        actionableOutcomes: number;
        followUpRequired: boolean;
        risks: string[];
        opportunities: string[];
    };
    aiAnalysis?: {
        model: string;
        confidence: number;
        processingTime: number;
        suggestions: {
            type: 'improvement' | 'follow_up' | 'action' | 'concern';
            message: string;
            priority: 'low' | 'medium' | 'high';
        }[];
    };
    createdAt: Date;
    updatedAt: Date;
}
export interface NotesConfig {
    autoSave: {
        enabled: boolean;
        intervalSeconds: number;
    };
    aiFeatures: {
        enableSummaryGeneration: boolean;
        enableActionItemExtraction: boolean;
        enableSentimentAnalysis: boolean;
        enableTranscription: boolean;
        enableTranslation: boolean;
        languages: string[];
    };
    sharing: {
        defaultVisibility: MeetingNotes['sharing']['visibility'];
        allowPublicSharing: boolean;
        requireApprovalForSharing: boolean;
        maxSharedUsers: number;
    };
    storage: {
        retentionDays: number;
        archiveAfterDays: number;
        maxFileSizeMB: number;
        allowedFileTypes: string[];
    };
    followUp: {
        autoCreateFromActionItems: boolean;
        defaultDueDays: number;
        enableReminders: boolean;
        reminderDaysBefore: number[];
        escalationEnabled: boolean;
        escalationDays: number;
    };
    integrations: {
        calendar: boolean;
        crm: boolean;
        projectManagement: boolean;
        taskManagement: boolean;
        documentStorage: boolean;
    };
}
export declare class MeetingNotesService extends EventEmitter {
    private notes;
    private followUps;
    private templates;
    private summaries;
    private config;
    private autoSaveTimers;
    constructor(config?: Partial<NotesConfig>);
    private initializeDefaultTemplates;
    private startBackgroundTasks;
    createNotes(notesData: Omit<MeetingNotes, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<MeetingNotes>;
    createNotesFromTemplate(templateId: string, meetingData: {
        meetingId: string;
        tenantId: string;
        authorId: string;
        authorName: string;
        title: string;
    }): Promise<MeetingNotes>;
    getNotes(notesId: string): Promise<MeetingNotes | null>;
    getNotesByMeeting(meetingId: string): Promise<MeetingNotes[]>;
    updateNotes(notesId: string, updates: Partial<MeetingNotes>, authorId: string, authorName: string): Promise<MeetingNotes>;
    private generateChangeDescription;
    private startAutoSave;
    createFollowUp(followUpData: Omit<FollowUpItem, 'id' | 'createdAt' | 'updatedAt' | 'metrics'>): Promise<FollowUpItem>;
    private extractAndCreateFollowUps;
    getFollowUps(filters?: {
        meetingId?: string;
        notesId?: string;
        tenantId?: string;
        assignedTo?: string;
        status?: FollowUpItem['status'][];
        type?: FollowUpItem['type'][];
        overdue?: boolean;
    }): Promise<FollowUpItem[]>;
    updateFollowUp(followUpId: string, updates: Partial<FollowUpItem>, authorId: string, authorName: string): Promise<FollowUpItem>;
    private determineUpdateType;
    private extractOldValue;
    private extractNewValue;
    private generateUpdateDescription;
    addFollowUpComment(followUpId: string, comment: string, authorId: string, authorName: string): Promise<FollowUpItem>;
    private scheduleFollowUpReminders;
    private sendFollowUpReminder;
    private checkOverdueFollowUps;
    private analyzeSentiment;
    private generateSummary;
    private extractKeyPoints;
    private extractDecisions;
    private extractActionItems;
    private analyzeParticipation;
    private countActionableItems;
    private hasFollowUpItems;
    private identifyRisks;
    private identifyOpportunities;
    createTemplate(templateData: Omit<NotesTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<NotesTemplate>;
    getTemplates(tenantId: string): Promise<NotesTemplate[]>;
    private archiveOldNotes;
    getSystemHealth(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        notes: {
            total: number;
            draft: number;
            published: number;
            archived: number;
        };
        followUps: {
            total: number;
            pending: number;
            overdue: number;
            completed: number;
        };
        templates: {
            total: number;
            active: number;
        };
        summaries: {
            total: number;
            recent: number;
        };
        timestamp: Date;
    }>;
    shutdown(): Promise<any>;
}
export default MeetingNotesService;
