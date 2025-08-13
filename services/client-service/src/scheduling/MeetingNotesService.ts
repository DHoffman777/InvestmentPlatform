import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';

// Meeting notes and follow-up data models
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
    participants?: string[]; // user IDs who contributed to this section
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
    score: number; // -1 to 1
    confidence: number; // 0 to 1
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
    taskId?: string; // External task system ID
    crmId?: string; // CRM system ID
    projectId?: string; // Project management system ID
  };
  recurrence?: {
    pattern: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    interval: number;
    endDate?: Date;
    nextDueDate?: Date;
  };
  metrics: {
    timeToComplete?: number; // minutes
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
  applicableFor: string[]; // meeting types, departments, etc.
  sections: {
    type: MeetingNotes['sections'][0]['type'];
    title: string;
    defaultContent?: string;
    required: boolean;
    order: number;
    prompts?: string[]; // suggested questions or topics
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
    executive: string; // Brief executive summary
    keyPoints: string[]; // Main discussion points
    decisions: string[]; // Key decisions made
    actionItems: string[]; // Action items identified
    nextSteps: string[]; // Next steps planned
  };
  participants: {
    userId: string;
    userName: string;
    contribution: {
      speakingTime?: number; // minutes
      keyContributions: string[];
      actionItemsAssigned: number;
    };
  }[];
  insights: {
    meetingEffectiveness: number; // 0-10 score
    participationBalance: number; // 0-10 score
    actionableOutcomes: number; // count
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

export class MeetingNotesService extends EventEmitter {
  private notes: Map<string, MeetingNotes> = new Map();
  private followUps: Map<string, FollowUpItem> = new Map();
  private templates: Map<string, NotesTemplate> = new Map();
  private summaries: Map<string, MeetingSummary> = new Map();
  private config: NotesConfig;
  private autoSaveTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(config: Partial<NotesConfig> = {}) {
    super();
    
    this.config = {
      autoSave: {
        enabled: true,
        intervalSeconds: 30
      },
      aiFeatures: {
        enableSummaryGeneration: true,
        enableActionItemExtraction: true,
        enableSentimentAnalysis: true,
        enableTranscription: true,
        enableTranslation: false,
        languages: ['en', 'es', 'fr', 'de']
      },
      sharing: {
        defaultVisibility: 'team',
        allowPublicSharing: false,
        requireApprovalForSharing: true,
        maxSharedUsers: 50
      },
      storage: {
        retentionDays: 2555, // 7 years
        archiveAfterDays: 365,
        maxFileSizeMB: 100,
        allowedFileTypes: ['pdf', 'doc', 'docx', 'txt', 'md', 'jpg', 'png', 'mp3', 'mp4']
      },
      followUp: {
        autoCreateFromActionItems: true,
        defaultDueDays: 7,
        enableReminders: true,
        reminderDaysBefore: [1, 3, 7],
        escalationEnabled: true,
        escalationDays: 14
      },
      integrations: {
        calendar: true,
        crm: true,
        projectManagement: true,
        taskManagement: true,
        documentStorage: true
      },
      ...config
    };

    this.initializeDefaultTemplates();
    this.startBackgroundTasks();
  }

  private initializeDefaultTemplates(): void {
    // Client meeting template
    this.templates.set('client_meeting', {
      id: 'client_meeting',
      tenantId: 'default',
      name: 'Client Meeting Notes',
      description: 'Template for client consultation and review meetings',
      type: 'meeting_type',
      applicableFor: ['client_meeting', 'consultation', 'review'],
      sections: [
        {
          type: 'agenda',
          title: 'Meeting Agenda',
          defaultContent: '1. Welcome and introductions\n2. Review of current portfolio\n3. Discussion of goals and objectives\n4. Questions and concerns\n5. Next steps',
          required: true,
          order: 1,
          prompts: [
            'What are the main topics to cover?',
            'Are there any specific client concerns to address?',
            'What updates need to be provided?'
          ]
        },
        {
          type: 'discussion',
          title: 'Discussion Points',
          required: true,
          order: 2,
          prompts: [
            'What were the key topics discussed?',
            'What questions did the client ask?',
            'What concerns were raised?'
          ]
        },
        {
          type: 'decisions',
          title: 'Decisions Made',
          required: true,
          order: 3,
          prompts: [
            'What decisions were made during the meeting?',
            'Were any investment changes approved?',
            'What strategy adjustments were agreed upon?'
          ]
        },
        {
          type: 'action_items',
          title: 'Action Items',
          required: true,
          order: 4,
          prompts: [
            'What follow-up actions are needed?',
            'Who is responsible for each action?',
            'What are the deadlines?'
          ]
        },
        {
          type: 'notes',
          title: 'Additional Notes',
          required: false,
          order: 5
        }
      ],
      settings: {
        autoGenerateSummary: true,
        extractActionItems: true,
        enableTranscription: true,
        defaultTags: ['client_meeting', 'consultation'],
        requiredFields: ['discussion', 'action_items']
      },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Internal meeting template
    this.templates.set('internal_meeting', {
      id: 'internal_meeting',
      tenantId: 'default',
      name: 'Internal Team Meeting',
      description: 'Template for internal team meetings and planning sessions',
      type: 'meeting_type',
      applicableFor: ['internal_meeting', 'team_meeting', 'planning'],
      sections: [
        {
          type: 'agenda',
          title: 'Agenda',
          required: true,
          order: 1
        },
        {
          type: 'discussion',
          title: 'Discussion',
          required: true,
          order: 2
        },
        {
          type: 'decisions',
          title: 'Decisions',
          required: false,
          order: 3
        },
        {
          type: 'action_items',
          title: 'Action Items',
          required: true,
          order: 4
        }
      ],
      settings: {
        autoGenerateSummary: true,
        extractActionItems: true,
        enableTranscription: false,
        defaultTags: ['internal', 'team_meeting'],
        requiredFields: ['discussion']
      },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  private startBackgroundTasks(): void {
    // Check for overdue follow-ups every hour
    setInterval(() => {
      this.checkOverdueFollowUps().catch(error => {
        console.error('Error checking overdue follow-ups:', error);
      });
    }, 60 * 60 * 1000);

    // Archive old notes daily
    setInterval(() => {
      this.archiveOldNotes().catch(error => {
        console.error('Error archiving old notes:', error);
      });
    }, 24 * 60 * 60 * 1000);
  }

  // Notes management
  async createNotes(notesData: Omit<MeetingNotes, 'id' | 'createdAt' | 'updatedAt' | 'version'>): Promise<MeetingNotes> {
    const notes: MeetingNotes = {
      id: randomUUID(),
      ...notesData,
      version: {
        number: 1,
        changelog: [
          {
            version: 1,
            authorId: notesData.authorId,
            authorName: notesData.authorName,
            changes: 'Initial creation',
            timestamp: new Date()
          }
        ]
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.notes.set(notes.id, notes);

    // Start auto-save if enabled
    if (this.config.autoSave.enabled) {
      this.startAutoSave(notes.id);
    }

    // Auto-extract action items if enabled
    if (this.config.followUp.autoCreateFromActionItems) {
      await this.extractAndCreateFollowUps(notes);
    }

    // Generate AI analysis if enabled
    if (this.config.aiFeatures.enableSummaryGeneration) {
      this.generateSummary(notes.id).catch(error => {
        console.error('Error generating summary:', error);
      });
    }

    this.emit('notesCreated', {
      notesId: notes.id,
      meetingId: notes.meetingId,
      tenantId: notes.tenantId,
      authorId: notes.authorId,
      timestamp: new Date()
    });

    return notes;
  }

  async createNotesFromTemplate(templateId: string, meetingData: {
    meetingId: string;
    tenantId: string;
    authorId: string;
    authorName: string;
    title: string;
  }): Promise<MeetingNotes> {
    const template = this.templates.get(templateId);
    if (!template) {
      throw new Error(`Template ${templateId} not found`);
    }

    const notes: Omit<MeetingNotes, 'id' | 'createdAt' | 'updatedAt' | 'version'> = {
      tenantId: meetingData.tenantId,
      meetingId: meetingData.meetingId,
      authorId: meetingData.authorId,
      authorName: meetingData.authorName,
      title: meetingData.title,
      content: {
        text: `Notes for ${meetingData.title}`,
        format: 'plain'
      },
      sections: template.sections.map(section => ({
        id: randomUUID(),
        type: section.type,
        title: section.title,
        content: section.defaultContent || '',
        order: section.order
      })),
      attachments: [],
      tags: template.settings.defaultTags,
      keywords: [],
      sentiment: {
        overall: 'neutral',
        score: 0,
        confidence: 0,
        keyPhrases: []
      },
      accessibility: {},
      sharing: {
        visibility: this.config.sharing.defaultVisibility,
        sharedWith: [],
        allowComments: true,
        allowExport: true
      },
      status: 'draft'
    };

    return this.createNotes(notes);
  }

  async getNotes(notesId: string): Promise<MeetingNotes | null> {
    return this.notes.get(notesId) || null;
  }

  async getNotesByMeeting(meetingId: string): Promise<MeetingNotes[]> {
    return Array.from(this.notes.values())
      .filter(notes => notes.meetingId === meetingId)
      .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
  }

  async updateNotes(notesId: string, updates: Partial<MeetingNotes>, authorId: string, authorName: string): Promise<MeetingNotes> {
    const notes = this.notes.get(notesId);
    if (!notes) {
      throw new Error(`Notes ${notesId} not found`);
    }

    // Create version history entry
    const newVersion = notes.version.number + 1;
    const changelog = [...notes.version.changelog];
    changelog.push({
      version: newVersion,
      authorId,
      authorName,
      changes: this.generateChangeDescription(notes, updates),
      timestamp: new Date()
    });

    const updatedNotes = {
      ...notes,
      ...updates,
      version: {
        number: newVersion,
        changelog
      },
      updatedAt: new Date()
    };

    this.notes.set(notesId, updatedNotes);

    // Update AI analysis if content changed
    if (updates.content || updates.sections) {
      if (this.config.aiFeatures.enableSentimentAnalysis) {
        await this.analyzeSentiment(notesId);
      }
      
      if (this.config.aiFeatures.enableSummaryGeneration) {
        this.generateSummary(notesId).catch(error => {
          console.error('Error regenerating summary:', error);
        });
      }
    }

    this.emit('notesUpdated', {
      notesId,
      meetingId: notes.meetingId,
      tenantId: notes.tenantId,
      authorId,
      version: newVersion,
      timestamp: new Date()
    });

    return updatedNotes;
  }

  private generateChangeDescription(original: MeetingNotes, updates: Partial<MeetingNotes>): string {
    const changes: string[] = [];
    
    if (updates.title && updates.title !== original.title) {
      changes.push('title updated');
    }
    if (updates.content) {
      changes.push('content modified');
    }
    if (updates.sections) {
      changes.push('sections updated');
    }
    if (updates.tags && JSON.stringify(updates.tags) !== JSON.stringify(original.tags)) {
      changes.push('tags modified');
    }
    if (updates.sharing) {
      changes.push('sharing settings changed');
    }
    if (updates.status && updates.status !== original.status) {
      changes.push(`status changed to ${updates.status}`);
    }

    return changes.length > 0 ? changes.join(', ') : 'minor updates';
  }

  private startAutoSave(notesId: string): void {
    // Clear existing timer
    if (this.autoSaveTimers.has(notesId)) {
      clearInterval(this.autoSaveTimers.get(notesId)!);
    }

    // Start new auto-save timer
    const timer = setInterval(() => {
      const notes = this.notes.get(notesId);
      if (notes && notes.status === 'draft') {
        // Auto-save logic would go here
        console.log(`Auto-saving notes ${notesId}`);
      }
    }, this.config.autoSave.intervalSeconds * 1000);

    this.autoSaveTimers.set(notesId, timer);
  }

  // Follow-up management
  async createFollowUp(followUpData: Omit<FollowUpItem, 'id' | 'createdAt' | 'updatedAt' | 'metrics'>): Promise<FollowUpItem> {
    const followUp: FollowUpItem = {
      id: randomUUID(),
      ...followUpData,
      metrics: {
        reopenCount: 0,
        commentCount: 0,
        assignmentCount: followUpData.assignedTo.length
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.followUps.set(followUp.id, followUp);

    // Schedule reminders if enabled
    if (this.config.followUp.enableReminders && followUp.dueDate) {
      this.scheduleFollowUpReminders(followUp);
    }

    this.emit('followUpCreated', {
      followUpId: followUp.id,
      meetingId: followUp.meetingId,
      tenantId: followUp.tenantId,
      assignedTo: followUp.assignedTo.map(a => a.userId),
      timestamp: new Date()
    });

    return followUp;
  }

  private async extractAndCreateFollowUps(notes: MeetingNotes): Promise<void> {
    // Find action items section
    const actionItemsSection = notes.sections.find(section => section.type === 'action_items');
    if (!actionItemsSection || !actionItemsSection.content.trim()) return;

    // Simple extraction - split by lines and look for action patterns
    const actionLines = actionItemsSection.content
      .split('\n')
      .filter(line => line.trim())
      .filter(line => 
        line.includes('TODO:') || 
        line.includes('Action:') || 
        line.match(/^\d+\./) || 
        line.match(/^[-*]/)
      );

    for (const line of actionLines) {
      const cleanLine = line.replace(/^[-*\d\.]\s*/, '').replace(/^(TODO:|Action:)\s*/i, '').trim();
      
      if (cleanLine.length > 10) { // Minimum meaningful length
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + this.config.followUp.defaultDueDays);

        await this.createFollowUp({
          tenantId: notes.tenantId,
          meetingId: notes.meetingId,
          notesId: notes.id,
          type: 'action_item',
          title: cleanLine.length > 100 ? cleanLine.substring(0, 97) + '...' : cleanLine,
          description: cleanLine,
          priority: 'normal',
          status: 'pending',
          assignedTo: [], // Would need to extract from text or assign to meeting organizer
          createdBy: {
            userId: notes.authorId,
            userName: notes.authorName
          },
          dueDate,
          dependencies: [],
          attachments: [],
          comments: [],
          updates: [],
          integrations: {}
        });
      }
    }
  }

  async getFollowUps(filters?: {
    meetingId?: string;
    notesId?: string;
    tenantId?: string;
    assignedTo?: string;
    status?: FollowUpItem['status'][];
    type?: FollowUpItem['type'][];
    overdue?: boolean;
  }): Promise<FollowUpItem[]> {
    let followUps = Array.from(this.followUps.values());

    if (filters) {
      if (filters.meetingId) {
        followUps = followUps.filter(item => item.meetingId === filters.meetingId);
      }
      if (filters.notesId) {
        followUps = followUps.filter(item => item.notesId === filters.notesId);
      }
      if (filters.tenantId) {
        followUps = followUps.filter(item => item.tenantId === filters.tenantId);
      }
      if (filters.assignedTo) {
        followUps = followUps.filter(item => 
          item.assignedTo.some(assignee => assignee.userId === filters.assignedTo)
        );
      }
      if (filters.status && filters.status.length > 0) {
        followUps = followUps.filter(item => filters.status!.includes(item.status));
      }
      if (filters.type && filters.type.length > 0) {
        followUps = followUps.filter(item => filters.type!.includes(item.type));
      }
      if (filters.overdue) {
        const now = new Date();
        followUps = followUps.filter(item => 
          item.dueDate && item.dueDate < now && item.status !== 'completed'
        );
      }
    }

    return followUps.sort((a, b) => {
      // Sort by priority first, then by due date
      const priorityOrder = { urgent: 4, high: 3, normal: 2, low: 1 };
      const aPriority = priorityOrder[a.priority];
      const bPriority = priorityOrder[b.priority];
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority;
      }
      
      if (a.dueDate && b.dueDate) {
        return a.dueDate.getTime() - b.dueDate.getTime();
      }
      
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }

  async updateFollowUp(followUpId: string, updates: Partial<FollowUpItem>, authorId: string, authorName: string): Promise<FollowUpItem> {
    const followUp = this.followUps.get(followUpId);
    if (!followUp) {
      throw new Error(`Follow-up ${followUpId} not found`);
    }

    // Track updates
    const updateEntry = {
      id: randomUUID(),
      authorId,
      authorName,
      type: this.determineUpdateType(followUp, updates),
      oldValue: this.extractOldValue(followUp, updates),
      newValue: this.extractNewValue(updates),
      description: this.generateUpdateDescription(followUp, updates),
      timestamp: new Date()
    };

    const updatedFollowUp = {
      ...followUp,
      ...updates,
      updates: [...followUp.updates, updateEntry],
      updatedAt: new Date()
    };

    // Update metrics
    if (updates.status === 'completed' && followUp.status !== 'completed') {
      updatedFollowUp.completedDate = new Date();
      updatedFollowUp.metrics.timeToComplete = 
        (updatedFollowUp.completedDate.getTime() - followUp.createdAt.getTime()) / (1000 * 60);
    }

    if (updates.assignedTo && updates.assignedTo.length !== followUp.assignedTo.length) {
      updatedFollowUp.metrics.assignmentCount++;
    }

    this.followUps.set(followUpId, updatedFollowUp);

    this.emit('followUpUpdated', {
      followUpId,
      meetingId: followUp.meetingId,
      tenantId: followUp.tenantId,
      updateType: updateEntry.type,
      authorId,
      timestamp: new Date()
    });

    return updatedFollowUp;
  }

  private determineUpdateType(original: FollowUpItem, updates: Partial<FollowUpItem>): FollowUpItem['updates'][0]['type'] {
    if (updates.status && updates.status !== original.status) {
      return updates.status === 'completed' ? 'completion' : 'status_change';
    }
    if (updates.assignedTo && JSON.stringify(updates.assignedTo) !== JSON.stringify(original.assignedTo)) {
      return 'assignment';
    }
    if (updates.dueDate && updates.dueDate.getTime() !== original.dueDate?.getTime()) {
      return 'due_date';
    }
    return 'comment';
  }

  private extractOldValue(original: FollowUpItem, updates: Partial<FollowUpItem>): any {
    if (updates.status) return original.status;
    if (updates.assignedTo) return original.assignedTo;
    if (updates.dueDate) return original.dueDate;
    return null;
  }

  private extractNewValue(updates: Partial<FollowUpItem>): any {
    return updates.status || updates.assignedTo || updates.dueDate || null;
  }

  private generateUpdateDescription(original: FollowUpItem, updates: Partial<FollowUpItem>): string {
    if (updates.status && updates.status !== original.status) {
      return `Status changed from ${original.status} to ${updates.status}`;
    }
    if (updates.assignedTo) {
      return `Assignment updated`;
    }
    if (updates.dueDate) {
      return `Due date updated to ${updates.dueDate.toLocaleDateString()}`;
    }
    return 'Follow-up updated';
  }

  async addFollowUpComment(followUpId: string, comment: string, authorId: string, authorName: string): Promise<FollowUpItem> {
    const followUp = this.followUps.get(followUpId);
    if (!followUp) {
      throw new Error(`Follow-up ${followUpId} not found`);
    }

    const commentEntry = {
      id: randomUUID(),
      authorId,
      authorName,
      content: comment,
      timestamp: new Date()
    };

    followUp.comments.push(commentEntry);
    followUp.metrics.commentCount++;
    followUp.updatedAt = new Date();

    this.followUps.set(followUpId, followUp);

    this.emit('followUpCommented', {
      followUpId,
      commentId: commentEntry.id,
      authorId,
      timestamp: new Date()
    });

    return followUp;
  }

  private scheduleFollowUpReminders(followUp: FollowUpItem): void {
    if (!followUp.dueDate) return;

    for (const daysBefore of this.config.followUp.reminderDaysBefore) {
      const reminderTime = new Date(followUp.dueDate);
      reminderTime.setDate(reminderTime.getDate() - daysBefore);
      
      if (reminderTime > new Date()) {
        const delay = reminderTime.getTime() - Date.now();
        
        setTimeout(() => {
          this.sendFollowUpReminder(followUp.id, daysBefore);
        }, delay);
      }
    }
  }

  private async sendFollowUpReminder(followUpId: string, daysBefore: number): Promise<void> {
    const followUp = this.followUps.get(followUpId);
    if (!followUp || followUp.status === 'completed' || followUp.status === 'cancelled') {
      return;
    }

    console.log(`Sending follow-up reminder for ${followUpId} (${daysBefore} days before due)`);
    
    this.emit('followUpReminder', {
      followUpId,
      daysBefore,
      assignedTo: followUp.assignedTo.map(a => a.userId),
      timestamp: new Date()
    });
  }

  private async checkOverdueFollowUps(): Promise<void> {
    const now = new Date();
    const overdueFollowUps = Array.from(this.followUps.values())
      .filter(item => 
        item.dueDate && 
        item.dueDate < now && 
        item.status !== 'completed' && 
        item.status !== 'cancelled' &&
        item.status !== 'overdue'
      );

    for (const followUp of overdueFollowUps) {
      followUp.status = 'overdue';
      followUp.updatedAt = new Date();
      this.followUps.set(followUp.id, followUp);

      this.emit('followUpOverdue', {
        followUpId: followUp.id,
        daysPastDue: Math.ceil((now.getTime() - followUp.dueDate!.getTime()) / (1000 * 60 * 60 * 24)),
        assignedTo: followUp.assignedTo.map(a => a.userId),
        timestamp: new Date()
      });
    }
  }

  // AI-powered features
  private async analyzeSentiment(notesId: string): Promise<void> {
    const notes = this.notes.get(notesId);
    if (!notes) return;

    // Mock sentiment analysis - replace with actual AI service
    const text = notes.content.text + ' ' + notes.sections.map(s => s.content).join(' ');
    
    // Simple mock analysis based on keywords
    const positiveWords = ['good', 'great', 'excellent', 'positive', 'successful', 'agreement', 'progress'];
    const negativeWords = ['bad', 'poor', 'negative', 'concern', 'problem', 'issue', 'disagreement'];
    
    const words = text.toLowerCase().split(/\s+/);
    const positiveCount = words.filter(word => positiveWords.includes(word)).length;
    const negativeCount = words.filter(word => negativeWords.includes(word)).length;
    
    let overall: 'positive' | 'neutral' | 'negative' = 'neutral';
    let score = 0;
    
    if (positiveCount > negativeCount) {
      overall = 'positive';
      score = Math.min(0.8, positiveCount / words.length * 10);
    } else if (negativeCount > positiveCount) {
      overall = 'negative';
      score = Math.max(-0.8, -negativeCount / words.length * 10);
    }

    notes.sentiment = {
      overall,
      score,
      confidence: 0.7, // Mock confidence
      keyPhrases: [
        ...positiveWords.filter(word => words.includes(word)).map(phrase => ({
          phrase,
          sentiment: 'positive' as const,
          confidence: 0.8
        })),
        ...negativeWords.filter(word => words.includes(word)).map(phrase => ({
          phrase,
          sentiment: 'negative' as const,
          confidence: 0.8
        }))
      ]
    };

    this.notes.set(notesId, notes);
  }

  private async generateSummary(notesId: string): Promise<void> {
    const notes = this.notes.get(notesId);
    if (!notes) return;

    // Mock AI summary generation
    const summary: MeetingSummary = {
      id: randomUUID(),
      tenantId: notes.tenantId,
      meetingId: notes.meetingId,
      notesId: notes.id,
      generatedBy: 'ai',
      summary: {
        executive: 'Meeting focused on reviewing current status and planning next steps.',
        keyPoints: this.extractKeyPoints(notes),
        decisions: this.extractDecisions(notes),
        actionItems: this.extractActionItems(notes),
        nextSteps: ['Follow up on action items', 'Schedule next meeting', 'Distribute notes to all attendees']
      },
      participants: this.analyzeParticipation(notes),
      insights: {
        meetingEffectiveness: Math.random() * 3 + 7, // 7-10 range
        participationBalance: Math.random() * 4 + 6, // 6-10 range
        actionableOutcomes: this.countActionableItems(notes),
        followUpRequired: this.hasFollowUpItems(notes),
        risks: this.identifyRisks(notes),
        opportunities: this.identifyOpportunities(notes)
      },
      aiAnalysis: {
        model: 'gpt-4',
        confidence: 0.85,
        processingTime: 2.3,
        suggestions: [
          {
            type: 'improvement',
            message: 'Consider adding more specific deadlines to action items',
            priority: 'medium'
          },
          {
            type: 'follow_up',
            message: 'Schedule follow-up meeting in 2 weeks to review progress',
            priority: 'high'
          }
        ]
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.summaries.set(summary.id, summary);

    this.emit('summaryGenerated', {
      summaryId: summary.id,
      notesId: notes.id,
      meetingId: notes.meetingId,
      timestamp: new Date()
    });
  }

  private extractKeyPoints(notes: MeetingNotes): string[] {
    const discussionSection = notes.sections.find(s => s.type === 'discussion');
    if (!discussionSection) return [];

    // Simple extraction - split by sentences and take meaningful ones
    return discussionSection.content
      .split('.')
      .filter(sentence => sentence.trim().length > 20)
      .slice(0, 5)
      .map(sentence => sentence.trim());
  }

  private extractDecisions(notes: MeetingNotes): string[] {
    const decisionsSection = notes.sections.find(s => s.type === 'decisions');
    if (!decisionsSection) return [];

    return decisionsSection.content
      .split('\n')
      .filter(line => line.trim())
      .slice(0, 3);
  }

  private extractActionItems(notes: MeetingNotes): string[] {
    const actionSection = notes.sections.find(s => s.type === 'action_items');
    if (!actionSection) return [];

    return actionSection.content
      .split('\n')
      .filter(line => line.trim())
      .slice(0, 5);
  }

  private analyzeParticipation(notes: MeetingNotes): MeetingSummary['participants'] {
    // Mock participation analysis
    return [
      {
        userId: notes.authorId,
        userName: notes.authorName,
        contribution: {
          keyContributions: ['Led discussion', 'Provided updates'],
          actionItemsAssigned: 2
        }
      }
    ];
  }

  private countActionableItems(notes: MeetingNotes): number {
    const actionSection = notes.sections.find(s => s.type === 'action_items');
    if (!actionSection) return 0;

    return actionSection.content.split('\n').filter(line => line.trim()).length;
  }

  private hasFollowUpItems(notes: MeetingNotes): boolean {
    return this.countActionableItems(notes) > 0;
  }

  private identifyRisks(notes: MeetingNotes): string[] {
    // Simple keyword-based risk identification
    const content = notes.content.text.toLowerCase();
    const risks: string[] = [];

    if (content.includes('delay') || content.includes('behind')) {
      risks.push('Project timeline concerns');
    }
    if (content.includes('budget') || content.includes('cost')) {
      risks.push('Budget constraints');
    }
    if (content.includes('concern') || content.includes('issue')) {
      risks.push('Unresolved concerns');
    }

    return risks;
  }

  private identifyOpportunities(notes: MeetingNotes): string[] {
    // Simple keyword-based opportunity identification
    const content = notes.content.text.toLowerCase();
    const opportunities: string[] = [];

    if (content.includes('expand') || content.includes('grow')) {
      opportunities.push('Growth opportunities');
    }
    if (content.includes('improve') || content.includes('optimize')) {
      opportunities.push('Process improvements');
    }
    if (content.includes('new') || content.includes('additional')) {
      opportunities.push('New initiatives');
    }

    return opportunities;
  }

  // Template management
  async createTemplate(templateData: Omit<NotesTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<NotesTemplate> {
    const template: NotesTemplate = {
      id: randomUUID(),
      ...templateData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.templates.set(template.id, template);

    this.emit('templateCreated', {
      templateId: template.id,
      tenantId: template.tenantId,
      timestamp: new Date()
    });

    return template;
  }

  async getTemplates(tenantId: string): Promise<NotesTemplate[]> {
    return Array.from(this.templates.values())
      .filter(template => template.tenantId === tenantId || template.tenantId === 'default');
  }

  // Utility methods
  private async archiveOldNotes(): Promise<void> {
    const archiveDate = new Date();
    archiveDate.setDate(archiveDate.getDate() - this.config.storage.archiveAfterDays);

    const notesToArchive = Array.from(this.notes.values())
      .filter(notes => 
        notes.status !== 'archived' &&
        notes.updatedAt < archiveDate
      );

    for (const notes of notesToArchive) {
      notes.status = 'archived';
      notes.updatedAt = new Date();
      this.notes.set(notes.id, notes);

      this.emit('notesArchived', {
        notesId: notes.id,
        meetingId: notes.meetingId,
        timestamp: new Date()
      });
    }

    console.log(`Archived ${notesToArchive.length} old notes`);
  }

  // System health and monitoring
  async getSystemHealth(): Promise<{
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
  }> {
    const notes = {
      total: this.notes.size,
      draft: Array.from(this.notes.values()).filter(n => n.status === 'draft').length,
      published: Array.from(this.notes.values()).filter(n => n.status === 'published').length,
      archived: Array.from(this.notes.values()).filter(n => n.status === 'archived').length
    };

    const followUps = {
      total: this.followUps.size,
      pending: Array.from(this.followUps.values()).filter(f => f.status === 'pending').length,
      overdue: Array.from(this.followUps.values()).filter(f => f.status === 'overdue').length,
      completed: Array.from(this.followUps.values()).filter(f => f.status === 'completed').length
    };

    const templates = {
      total: this.templates.size,
      active: Array.from(this.templates.values()).filter(t => t.status === 'active').length
    };

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const summaries = {
      total: this.summaries.size,
      recent: Array.from(this.summaries.values()).filter(s => s.createdAt >= oneDayAgo).length
    };

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    // Simple health check
    if (followUps.overdue > followUps.total * 0.3) {
      status = 'unhealthy';
    } else if (followUps.overdue > followUps.total * 0.1) {
      status = 'degraded';
    }

    return {
      status,
      notes,
      followUps,
      templates,
      summaries,
      timestamp: new Date()
    };
  }

  async shutdown(): Promise<void> {
    console.log('Shutting down Meeting Notes Service...');
    
    // Clear auto-save timers
    for (const timer of this.autoSaveTimers.values()) {
      clearInterval(timer);
    }
    this.autoSaveTimers.clear();

    // Clear all data
    this.notes.clear();
    this.followUps.clear();
    this.templates.clear();
    this.summaries.clear();

    console.log('Meeting Notes Service shutdown complete');
  }
}

export default MeetingNotesService;