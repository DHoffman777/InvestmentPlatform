import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';

// Video conferencing integration data models
export interface VideoProvider {
  id: string;
  name: string;
  type: 'zoom' | 'teams' | 'webex' | 'google_meet' | 'gotomeeting' | 'custom';
  apiVersion: string;
  authType: 'oauth2' | 'jwt' | 'api_key' | 'basic';
  capabilities: {
    createMeeting: boolean;
    updateMeeting: boolean;
    deleteMeeting: boolean;
    joinMeeting: boolean;
    recording: boolean;
    transcription: boolean;
    breakoutRooms: boolean;
    screenSharing: boolean;
    chatMessages: boolean;
    polls: boolean;
    whiteboardSharing: boolean;
    liveStreaming: boolean;
    webinar: boolean;
    authentication: boolean;
    waitingRoom: boolean;
    passwordProtection: boolean;
  };
  limits: {
    maxParticipants: number;
    maxDuration: number; // minutes
    maxMeetingsPerDay: number;
    maxConcurrentMeetings: number;
    storageQuotaGB?: number;
  };
  pricing: {
    tier: 'free' | 'basic' | 'pro' | 'enterprise' | 'custom';
    costPerMinute?: number;
    monthlyQuota?: number;
  };
  status: 'active' | 'inactive' | 'error' | 'maintenance';
  config: {
    apiKey?: string;
    clientId?: string;
    clientSecret?: string;
    baseUrl?: string;
    webhookUrl?: string;
    customSettings?: Record<string, any>;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface VideoMeeting {
  id: string;
  tenantId: string;
  providerId: string;
  externalId: string; // Provider's meeting ID
  meetingId: string; // Our internal meeting ID
  title: string;
  description?: string;
  host: {
    userId: string;
    userName: string;
    email: string;
  };
  settings: {
    password?: string;
    waitingRoom: boolean;
    authentication: boolean;
    recording: {
      enabled: boolean;
      autoStart: boolean;
      cloudRecording: boolean;
      localRecording: boolean;
      recordParticipantVideo: boolean;
      recordSharedScreen: boolean;
      recordGalleryView: boolean;
      recordSpeakerView: boolean;
    };
    audio: {
      participantsMuted: boolean;
      allowUnmute: boolean;
      joinBeforeHost: boolean;
    };
    video: {
      hostVideoOn: boolean;
      participantVideoOn: boolean;
      enableVirtualBackground: boolean;
    };
    chat: {
      enabled: boolean;
      allowPrivateChat: boolean;
      saveChat: boolean;
      fileSharing: boolean;
    };
    screen: {
      shareEnabled: boolean;
      whoCanShare: 'host' | 'all' | 'participants';
      allowAnnotation: boolean;
    };
    features: {
      breakoutRooms: boolean;
      polls: boolean;
      whiteboard: boolean;
      reactions: boolean;
      liveTranscription: boolean;
      liveStreaming: boolean;
      webinar: boolean;
    };
    security: {
      encryption: boolean;
      e2eEncryption: boolean;
      dataCenter?: string;
      attendeeAuth: boolean;
      hostKeyRequired: boolean;
    };
  };
  schedule: {
    startTime: Date;
    endTime: Date;
    timeZone: string;
    recurrence?: {
      type: 'daily' | 'weekly' | 'monthly';
      interval: number;
      endDate?: Date;
      count?: number;
      daysOfWeek?: number[];
    };
  };
  access: {
    joinUrl: string;
    hostUrl?: string;
    joinId?: string;
    password?: string;
    dialIn?: {
      numbers: {
        country: string;
        number: string;
        type: 'toll' | 'toll_free';
      }[];
      conferenceId: string;
      hostPin?: string;
      participantPin?: string;
    };
    sip?: {
      address: string;
      username?: string;
      password?: string;
    };
    h323?: {
      ip: string;
      meetingId: string;
    };
  };
  participants: {
    userId?: string;
    email: string;
    name: string;
    role: 'host' | 'co_host' | 'participant' | 'attendee';
    status: 'invited' | 'joined' | 'left' | 'waiting' | 'declined';
    joinTime?: Date;
    leaveTime?: Date;
    duration?: number; // minutes
    deviceInfo?: {
      type: 'desktop' | 'mobile' | 'tablet' | 'phone' | 'browser';
      os: string;
      browser?: string;
      version?: string;
    };
    network?: {
      ip?: string;
      location?: string;
      quality: 'good' | 'fair' | 'poor';
    };
  }[];
  recording: {
    available: boolean;
    recordings: {
      id: string;
      type: 'video' | 'audio' | 'chat' | 'transcript';
      format: string;
      size: number; // bytes
      duration?: number; // seconds
      url?: string;
      downloadUrl?: string;
      startTime: Date;
      endTime: Date;
      status: 'processing' | 'ready' | 'failed' | 'expired';
      expiryDate?: Date;
    }[];
    settings: {
      autoDelete: boolean;
      retentionDays: number;
      shareEnabled: boolean;
      downloadEnabled: boolean;
      transcriptionEnabled: boolean;
    };
  };
  analytics: {
    totalParticipants: number;
    peakParticipants: number;
    averageDuration: number;
    totalDuration: number;
    joinRate: number; // percentage of invited who joined
    engagementMetrics: {
      chatMessages: number;
      pollsAnswered: number;
      reactionsUsed: number;
      screenShareTime: number;
      speakingTime: Record<string, number>; // userId -> minutes
    };
    qualityMetrics: {
      averageVideoQuality: number; // 1-5
      averageAudioQuality: number; // 1-5
      connectionIssues: number;
      dropoutRate: number;
    };
  };
  status: 'scheduled' | 'waiting' | 'started' | 'ended' | 'cancelled';
  metadata: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  endedAt?: Date;
}

export interface MeetingTemplate {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  providerId: string;
  defaultSettings: VideoMeeting['settings'];
  schedule: {
    defaultDuration: number; // minutes
    defaultTimeZone: string;
    allowRecurrence: boolean;
  };
  participants: {
    defaultRole: 'participant' | 'attendee';
    requireRegistration: boolean;
    maxParticipants?: number;
    allowGuests: boolean;
  };
  branding: {
    customLogo?: string;
    customBackground?: string;
    customColors?: {
      primary: string;
      secondary: string;
    };
    customWelcomeMessage?: string;
  };
  integrations: {
    calendar: boolean;
    crm: boolean;
    recording: boolean;
    transcription: boolean;
    analytics: boolean;
  };
  status: 'active' | 'inactive' | 'draft';
  createdAt: Date;
  updatedAt: Date;
}

export interface WebhookEvent {
  id: string;
  providerId: string;
  eventType: 'meeting.started' | 'meeting.ended' | 'participant.joined' | 'participant.left' | 
            'recording.ready' | 'meeting.created' | 'meeting.updated' | 'meeting.deleted';
  meetingId: string;
  externalMeetingId: string;
  timestamp: Date;
  data: Record<string, any>;
  signature?: string;
  processed: boolean;
  processedAt?: Date;
  error?: string;
}

export interface VideoConferencingConfig {
  defaultProvider: string;
  webhookEnabled: boolean;
  webhookSecret: string;
  recordingEnabled: boolean;
  transcriptionEnabled: boolean;
  maxMeetingDuration: number; // minutes
  maxParticipants: number;
  autoCleanupEnabled: boolean;
  cleanupAfterDays: number;
  qualityMonitoring: boolean;
  analyticsRetentionDays: number;
  securitySettings: {
    enforcePasswordProtection: boolean;
    requireAuthentication: boolean;
    enableWaitingRoom: boolean;
    enableEncryption: boolean;
    allowGuestAccess: boolean;
  };
  compliance: {
    enableRecordingConsent: boolean;
    dataRetentionDays: number;
    gdprCompliant: boolean;
    hipaaCompliant: boolean;
    soxCompliant: boolean;
  };
}

export class VideoConferencingService extends EventEmitter {
  private providers: Map<string, VideoProvider> = new Map();
  private meetings: Map<string, VideoMeeting> = new Map();
  private templates: Map<string, MeetingTemplate> = new Map();
  private webhooks: Map<string, WebhookEvent> = new Map();
  private config: VideoConferencingConfig;

  constructor(config: Partial<VideoConferencingConfig> = {}) {
    super();
    
    this.config = {
      defaultProvider: 'zoom',
      webhookEnabled: true,
      webhookSecret: randomUUID(),
      recordingEnabled: true,
      transcriptionEnabled: true,
      maxMeetingDuration: 480, // 8 hours
      maxParticipants: 500,
      autoCleanupEnabled: true,
      cleanupAfterDays: 30,
      qualityMonitoring: true,
      analyticsRetentionDays: 365,
      securitySettings: {
        enforcePasswordProtection: true,
        requireAuthentication: false,
        enableWaitingRoom: true,
        enableEncryption: true,
        allowGuestAccess: true
      },
      compliance: {
        enableRecordingConsent: true,
        dataRetentionDays: 2555, // 7 years
        gdprCompliant: true,
        hipaaCompliant: false,
        soxCompliant: false
      },
      ...config
    };

    this.initializeProviders();
    this.initializeDefaultTemplates();
    this.startBackgroundTasks();
  }

  private initializeProviders(): void {
    // Zoom provider
    this.providers.set('zoom', {
      id: 'zoom',
      name: 'Zoom',
      type: 'zoom',
      apiVersion: 'v2',
      authType: 'jwt',
      capabilities: {
        createMeeting: true,
        updateMeeting: true,
        deleteMeeting: true,
        joinMeeting: true,
        recording: true,
        transcription: true,
        breakoutRooms: true,
        screenSharing: true,
        chatMessages: true,
        polls: true,
        whiteboardSharing: true,
        liveStreaming: true,
        webinar: true,
        authentication: true,
        waitingRoom: true,
        passwordProtection: true
      },
      limits: {
        maxParticipants: 500,
        maxDuration: 1440, // 24 hours
        maxMeetingsPerDay: 100,
        maxConcurrentMeetings: 10,
        storageQuotaGB: 1000
      },
      pricing: {
        tier: 'pro',
        costPerMinute: 0.02
      },
      status: 'active',
      config: {
        baseUrl: 'https://api.zoom.us/v2',
        webhookUrl: '/webhooks/zoom'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Microsoft Teams provider
    this.providers.set('teams', {
      id: 'teams',
      name: 'Microsoft Teams',
      type: 'teams',
      apiVersion: 'v1.0',
      authType: 'oauth2',
      capabilities: {
        createMeeting: true,
        updateMeeting: true,
        deleteMeeting: true,
        joinMeeting: true,
        recording: true,
        transcription: true,
        breakoutRooms: true,
        screenSharing: true,
        chatMessages: true,
        polls: false,
        whiteboardSharing: true,
        liveStreaming: true,
        webinar: false,
        authentication: true,
        waitingRoom: true,
        passwordProtection: false
      },
      limits: {
        maxParticipants: 1000,
        maxDuration: 1440,
        maxMeetingsPerDay: 250,
        maxConcurrentMeetings: 20,
        storageQuotaGB: 10000
      },
      pricing: {
        tier: 'enterprise'
      },
      status: 'active',
      config: {
        baseUrl: 'https://graph.microsoft.com/v1.0',
        webhookUrl: '/webhooks/teams'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Google Meet provider
    this.providers.set('google_meet', {
      id: 'google_meet',
      name: 'Google Meet',
      type: 'google_meet',
      apiVersion: 'v2',
      authType: 'oauth2',
      capabilities: {
        createMeeting: true,
        updateMeeting: true,
        deleteMeeting: true,
        joinMeeting: true,
        recording: true,
        transcription: true,
        breakoutRooms: true,
        screenSharing: true,
        chatMessages: true,
        polls: false,
        whiteboardSharing: false,
        liveStreaming: true,
        webinar: false,
        authentication: true,
        waitingRoom: false,
        passwordProtection: false
      },
      limits: {
        maxParticipants: 250,
        maxDuration: 480, // 8 hours
        maxMeetingsPerDay: 100,
        maxConcurrentMeetings: 5,
        storageQuotaGB: 100
      },
      pricing: {
        tier: 'pro'
      },
      status: 'active',
      config: {
        baseUrl: 'https://meet.googleapis.com/v2',
        webhookUrl: '/webhooks/google_meet'
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  private initializeDefaultTemplates(): void {
    // Client meeting template
    this.templates.set('client_meeting', {
      id: 'client_meeting',
      tenantId: 'default',
      name: 'Client Meeting',
      description: 'Template for client consultations and reviews',
      providerId: this.config.defaultProvider,
      defaultSettings: {
        password: undefined,
        waitingRoom: true,
        authentication: false,
        recording: {
          enabled: true,
          autoStart: false,
          cloudRecording: true,
          localRecording: false,
          recordParticipantVideo: true,
          recordSharedScreen: true,
          recordGalleryView: false,
          recordSpeakerView: true
        },
        audio: {
          participantsMuted: true,
          allowUnmute: true,
          joinBeforeHost: false
        },
        video: {
          hostVideoOn: true,
          participantVideoOn: true,
          enableVirtualBackground: true
        },
        chat: {
          enabled: true,
          allowPrivateChat: false,
          saveChat: true,
          fileSharing: false
        },
        screen: {
          shareEnabled: true,
          whoCanShare: 'host',
          allowAnnotation: false
        },
        features: {
          breakoutRooms: false,
          polls: false,
          whiteboard: true,
          reactions: false,
          liveTranscription: true,
          liveStreaming: false,
          webinar: false
        },
        security: {
          encryption: true,
          e2eEncryption: false,
          attendeeAuth: false,
          hostKeyRequired: true
        }
      },
      schedule: {
        defaultDuration: 60,
        defaultTimeZone: 'UTC',
        allowRecurrence: false
      },
      participants: {
        defaultRole: 'participant',
        requireRegistration: false,
        maxParticipants: 10,
        allowGuests: true
      },
      branding: {
        customWelcomeMessage: 'Welcome to your investment consultation'
      },
      integrations: {
        calendar: true,
        crm: true,
        recording: true,
        transcription: true,
        analytics: true
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
      providerId: this.config.defaultProvider,
      defaultSettings: {
        password: undefined,
        waitingRoom: false,
        authentication: true,
        recording: {
          enabled: false,
          autoStart: false,
          cloudRecording: false,
          localRecording: false,
          recordParticipantVideo: false,
          recordSharedScreen: true,
          recordGalleryView: false,
          recordSpeakerView: false
        },
        audio: {
          participantsMuted: false,
          allowUnmute: true,
          joinBeforeHost: true
        },
        video: {
          hostVideoOn: true,
          participantVideoOn: false,
          enableVirtualBackground: true
        },
        chat: {
          enabled: true,
          allowPrivateChat: true,
          saveChat: false,
          fileSharing: true
        },
        screen: {
          shareEnabled: true,
          whoCanShare: 'all',
          allowAnnotation: true
        },
        features: {
          breakoutRooms: true,
          polls: true,
          whiteboard: true,
          reactions: true,
          liveTranscription: false,
          liveStreaming: false,
          webinar: false
        },
        security: {
          encryption: true,
          e2eEncryption: false,
          attendeeAuth: true,
          hostKeyRequired: false
        }
      },
      schedule: {
        defaultDuration: 30,
        defaultTimeZone: 'UTC',
        allowRecurrence: true
      },
      participants: {
        defaultRole: 'participant',
        requireRegistration: false,
        allowGuests: false
      },
      branding: {
        customWelcomeMessage: 'Welcome to the internal team meeting'
      },
      integrations: {
        calendar: true,
        crm: false,
        recording: false,
        transcription: false,
        analytics: true
      },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }

  private startBackgroundTasks(): void {
    // Clean up old meetings daily
    setInterval(() => {
      this.cleanupOldMeetings().catch(error => {
        console.error('Error cleaning up old meetings:', error);
      });
    }, 24 * 60 * 60 * 1000);

    // Process webhooks every 30 seconds
    setInterval(() => {
      this.processWebhooks().catch(error => {
        console.error('Error processing webhooks:', error);
      });
    }, 30 * 1000);

    // Update meeting analytics hourly
    setInterval(() => {
      this.updateMeetingAnalytics().catch(error => {
        console.error('Error updating meeting analytics:', error);
      });
    }, 60 * 60 * 1000);
  }

  // Provider management
  async getProviders(): Promise<VideoProvider[]> {
    return Array.from(this.providers.values());
  }

  async getProvider(providerId: string): Promise<VideoProvider | null> {
    return this.providers.get(providerId) || null;
  }

  async updateProvider(providerId: string, updates: Partial<VideoProvider>): Promise<VideoProvider> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    const updatedProvider = {
      ...provider,
      ...updates,
      updatedAt: new Date()
    };

    this.providers.set(providerId, updatedProvider);

    this.emit('providerUpdated', {
      providerId,
      updates,
      timestamp: new Date()
    });

    return updatedProvider;
  }

  // Meeting management
  async createMeeting(meetingData: {
    tenantId: string;
    meetingId: string;
    title: string;
    description?: string;
    host: VideoMeeting['host'];
    startTime: Date;
    endTime: Date;
    timeZone: string;
    participants: {
      email: string;
      name: string;
      role?: 'host' | 'co_host' | 'participant' | 'attendee';
    }[];
    templateId?: string;
    providerId?: string;
    customSettings?: Partial<VideoMeeting['settings']>;
  }): Promise<VideoMeeting> {
    const providerId = meetingData.providerId || this.config.defaultProvider;
    const provider = this.providers.get(providerId);
    
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    if (provider.status !== 'active') {
      throw new Error(`Provider ${providerId} is not active`);
    }

    // Get template settings
    let templateSettings: VideoMeeting['settings'] | undefined;
    if (meetingData.templateId) {
      const template = this.templates.get(meetingData.templateId);
      if (template) {
        templateSettings = template.defaultSettings;
      }
    }

    // Merge settings: template defaults + custom overrides + security enforcements
    const settings = this.mergeSettings(templateSettings, meetingData.customSettings);

    // Create external meeting with provider
    const externalMeeting = await this.createExternalMeeting(provider, meetingData, settings);

    const videoMeeting: VideoMeeting = {
      id: randomUUID(),
      tenantId: meetingData.tenantId,
      providerId,
      externalId: externalMeeting.id,
      meetingId: meetingData.meetingId,
      title: meetingData.title,
      description: meetingData.description,
      host: meetingData.host,
      settings,
      schedule: {
        startTime: meetingData.startTime,
        endTime: meetingData.endTime,
        timeZone: meetingData.timeZone
      },
      access: externalMeeting.access,
      participants: meetingData.participants.map(p => ({
        email: p.email,
        name: p.name,
        role: p.role || 'participant',
        status: 'invited'
      })),
      recording: {
        available: false,
        recordings: [],
        settings: {
          autoDelete: this.config.autoCleanupEnabled,
          retentionDays: this.config.compliance.dataRetentionDays,
          shareEnabled: true,
          downloadEnabled: true,
          transcriptionEnabled: this.config.transcriptionEnabled
        }
      },
      analytics: {
        totalParticipants: 0,
        peakParticipants: 0,
        averageDuration: 0,
        totalDuration: 0,
        joinRate: 0,
        engagementMetrics: {
          chatMessages: 0,
          pollsAnswered: 0,
          reactionsUsed: 0,
          screenShareTime: 0,
          speakingTime: {}
        },
        qualityMetrics: {
          averageVideoQuality: 0,
          averageAudioQuality: 0,
          connectionIssues: 0,
          dropoutRate: 0
        }
      },
      status: 'scheduled',
      metadata: {},
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.meetings.set(videoMeeting.id, videoMeeting);

    this.emit('meetingCreated', {
      meetingId: videoMeeting.id,
      externalId: videoMeeting.externalId,
      providerId,
      tenantId: meetingData.tenantId,
      timestamp: new Date()
    });

    return videoMeeting;
  }

  private mergeSettings(
    templateSettings?: VideoMeeting['settings'], 
    customSettings?: Partial<VideoMeeting['settings']>
  ): VideoMeeting['settings'] {
    const baseSettings: VideoMeeting['settings'] = {
      waitingRoom: this.config.securitySettings.enableWaitingRoom,
      authentication: this.config.securitySettings.requireAuthentication,
      recording: {
        enabled: this.config.recordingEnabled,
        autoStart: false,
        cloudRecording: true,
        localRecording: false,
        recordParticipantVideo: true,
        recordSharedScreen: true,
        recordGalleryView: false,
        recordSpeakerView: true
      },
      audio: {
        participantsMuted: false,
        allowUnmute: true,
        joinBeforeHost: false
      },
      video: {
        hostVideoOn: true,
        participantVideoOn: false,
        enableVirtualBackground: false
      },
      chat: {
        enabled: true,
        allowPrivateChat: false,
        saveChat: false,
        fileSharing: false
      },
      screen: {
        shareEnabled: true,
        whoCanShare: 'host',
        allowAnnotation: false
      },
      features: {
        breakoutRooms: false,
        polls: false,
        whiteboard: false,
        reactions: false,
        liveTranscription: this.config.transcriptionEnabled,
        liveStreaming: false,
        webinar: false
      },
      security: {
        encryption: this.config.securitySettings.enableEncryption,
        e2eEncryption: false,
        attendeeAuth: this.config.securitySettings.requireAuthentication,
        hostKeyRequired: false
      }
    };

    // Merge template settings
    const mergedSettings = templateSettings ? 
      this.deepMerge(baseSettings, templateSettings) : baseSettings;

    // Apply custom settings
    const finalSettings = customSettings ? 
      this.deepMerge(mergedSettings, customSettings) : mergedSettings;

    // Enforce security policies
    if (this.config.securitySettings.enforcePasswordProtection) {
      finalSettings.password = finalSettings.password || this.generateMeetingPassword();
    }

    return finalSettings;
  }

  private deepMerge(target: any, source: any): any {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] !== null && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(target[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  private generateMeetingPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 8; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  private async createExternalMeeting(
    provider: VideoProvider, 
    meetingData: any, 
    settings: VideoMeeting['settings']
  ): Promise<{ id: string; access: VideoMeeting['access'] }> {
    // Mock external API call - replace with actual provider implementations
    console.log(`Creating ${provider.name} meeting: ${meetingData.title}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const externalId = `${provider.type}_${randomUUID()}`;
    const meetingNumber = Math.floor(Math.random() * 900000000) + 100000000;
    
    const access: VideoMeeting['access'] = {
      joinUrl: `https://${provider.type}.com/j/${meetingNumber}`,
      hostUrl: `https://${provider.type}.com/s/${meetingNumber}?role=host`,
      joinId: meetingNumber.toString(),
      password: settings.password,
      dialIn: {
        numbers: [
          { country: 'US', number: '+1-555-123-4567', type: 'toll' },
          { country: 'US', number: '+1-800-123-4567', type: 'toll_free' }
        ],
        conferenceId: meetingNumber.toString(),
        hostPin: '123456',
        participantPin: '789012'
      }
    };

    if (provider.capabilities.authentication) {
      access.sip = {
        address: `${meetingNumber}@${provider.type}.com`,
        username: meetingData.host.email,
        password: settings.password
      };
    }

    return { id: externalId, access };
  }

  async getMeeting(meetingId: string): Promise<VideoMeeting | null> {
    return this.meetings.get(meetingId) || null;
  }

  async getMeetingByExternalId(externalId: string): Promise<VideoMeeting | null> {
    return Array.from(this.meetings.values())
      .find(meeting => meeting.externalId === externalId) || null;
  }

  async getMeetings(filters?: {
    tenantId?: string;
    providerId?: string;
    status?: VideoMeeting['status'][];
    startDate?: Date;
    endDate?: Date;
    hostId?: string;
  }): Promise<VideoMeeting[]> {
    let meetings = Array.from(this.meetings.values());

    if (filters) {
      if (filters.tenantId) {
        meetings = meetings.filter(m => m.tenantId === filters.tenantId);
      }
      if (filters.providerId) {
        meetings = meetings.filter(m => m.providerId === filters.providerId);
      }
      if (filters.status && filters.status.length > 0) {
        meetings = meetings.filter(m => filters.status!.includes(m.status));
      }
      if (filters.startDate) {
        meetings = meetings.filter(m => m.schedule.startTime >= filters.startDate!);
      }
      if (filters.endDate) {
        meetings = meetings.filter(m => m.schedule.endTime <= filters.endDate!);
      }
      if (filters.hostId) {
        meetings = meetings.filter(m => m.host.userId === filters.hostId);
      }
    }

    return meetings.sort((a, b) => a.schedule.startTime.getTime() - b.schedule.startTime.getTime());
  }

  async updateMeeting(meetingId: string, updates: Partial<VideoMeeting>): Promise<VideoMeeting> {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) {
      throw new Error(`Meeting ${meetingId} not found`);
    }

    // Update external meeting if necessary
    if (updates.schedule || updates.settings || updates.title || updates.description) {
      await this.updateExternalMeeting(meeting, updates);
    }

    const updatedMeeting = {
      ...meeting,
      ...updates,
      updatedAt: new Date()
    };

    this.meetings.set(meetingId, updatedMeeting);

    this.emit('meetingUpdated', {
      meetingId,
      externalId: meeting.externalId,
      providerId: meeting.providerId,
      updates,
      timestamp: new Date()
    });

    return updatedMeeting;
  }

  private async updateExternalMeeting(meeting: VideoMeeting, updates: Partial<VideoMeeting>): Promise<any> {
    const provider = this.providers.get(meeting.providerId);
    if (!provider) {
      throw new Error(`Provider ${meeting.providerId} not found`);
    }

    console.log(`Updating ${provider.name} meeting ${meeting.externalId}`);
    
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  async deleteMeeting(meetingId: string): Promise<any> {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) {
      throw new Error(`Meeting ${meetingId} not found`);
    }

    // Delete external meeting
    await this.deleteExternalMeeting(meeting);

    this.meetings.delete(meetingId);

    this.emit('meetingDeleted', {
      meetingId,
      externalId: meeting.externalId,
      providerId: meeting.providerId,
      timestamp: new Date()
    });
  }

  private async deleteExternalMeeting(meeting: VideoMeeting): Promise<any> {
    const provider = this.providers.get(meeting.providerId);
    if (!provider) return;

    console.log(`Deleting ${provider.name} meeting ${meeting.externalId}`);
    
    // Mock API call
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  // Meeting control
  async startMeeting(meetingId: string): Promise<VideoMeeting> {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) {
      throw new Error(`Meeting ${meetingId} not found`);
    }

    meeting.status = 'started';
    meeting.startedAt = new Date();
    meeting.updatedAt = new Date();

    this.meetings.set(meetingId, meeting);

    this.emit('meetingStarted', {
      meetingId,
      externalId: meeting.externalId,
      providerId: meeting.providerId,
      timestamp: new Date()
    });

    return meeting;
  }

  async endMeeting(meetingId: string): Promise<VideoMeeting> {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) {
      throw new Error(`Meeting ${meetingId} not found`);
    }

    meeting.status = 'ended';
    meeting.endedAt = new Date();
    meeting.updatedAt = new Date();

    // Calculate final analytics
    if (meeting.startedAt) {
      meeting.analytics.totalDuration = 
        (meeting.endedAt.getTime() - meeting.startedAt.getTime()) / (1000 * 60);
    }

    this.meetings.set(meetingId, meeting);

    // Process recordings if available
    if (meeting.settings.recording.enabled) {
      this.processRecordings(meetingId).catch(error => {
        console.error('Error processing recordings:', error);
      });
    }

    this.emit('meetingEnded', {
      meetingId,
      externalId: meeting.externalId,
      providerId: meeting.providerId,
      duration: meeting.analytics.totalDuration,
      participants: meeting.analytics.totalParticipants,
      timestamp: new Date()
    });

    return meeting;
  }

  // Participant management
  async joinMeeting(meetingId: string, participant: {
    userId?: string;
    email: string;
    name: string;
    deviceInfo?: VideoMeeting['participants'][0]['deviceInfo'];
  }): Promise<VideoMeeting> {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) {
      throw new Error(`Meeting ${meetingId} not found`);
    }

    // Find existing participant or add new
    let existingParticipant = meeting.participants.find(p => p.email === participant.email);
    
    if (existingParticipant) {
      existingParticipant.status = 'joined';
      existingParticipant.joinTime = new Date();
      existingParticipant.deviceInfo = participant.deviceInfo;
    } else {
      meeting.participants.push({
        ...participant,
        role: 'participant',
        status: 'joined',
        joinTime: new Date()
      });
    }

    // Update analytics
    meeting.analytics.totalParticipants = meeting.participants.filter(p => p.status === 'joined').length;
    meeting.analytics.peakParticipants = Math.max(
      meeting.analytics.peakParticipants,
      meeting.analytics.totalParticipants
    );

    meeting.updatedAt = new Date();
    this.meetings.set(meetingId, meeting);

    this.emit('participantJoined', {
      meetingId,
      participantEmail: participant.email,
      participantName: participant.name,
      totalParticipants: meeting.analytics.totalParticipants,
      timestamp: new Date()
    });

    return meeting;
  }

  async leaveMeeting(meetingId: string, participantEmail: string): Promise<VideoMeeting> {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) {
      throw new Error(`Meeting ${meetingId} not found`);
    }

    const participant = meeting.participants.find(p => p.email === participantEmail);
    if (participant && participant.status === 'joined') {
      participant.status = 'left';
      participant.leaveTime = new Date();
      
      if (participant.joinTime) {
        participant.duration = (participant.leaveTime.getTime() - participant.joinTime.getTime()) / (1000 * 60);
      }
    }

    // Update analytics
    meeting.analytics.totalParticipants = meeting.participants.filter(p => p.status === 'joined').length;
    meeting.updatedAt = new Date();
    this.meetings.set(meetingId, meeting);

    this.emit('participantLeft', {
      meetingId,
      participantEmail,
      duration: participant?.duration,
      totalParticipants: meeting.analytics.totalParticipants,
      timestamp: new Date()
    });

    return meeting;
  }

  // Recording management
  private async processRecordings(meetingId: string): Promise<any> {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) return;

    console.log(`Processing recordings for meeting ${meetingId}`);

    // Mock recording processing
    const recordings: VideoMeeting['recording']['recordings'] = [];

    if (meeting.settings.recording.recordParticipantVideo) {
      recordings.push({
        id: randomUUID(),
        type: 'video',
        format: 'mp4',
        size: Math.floor(Math.random() * 500000000) + 100000000, // 100-600MB
        duration: meeting.analytics.totalDuration * 60, // seconds
        startTime: meeting.startedAt!,
        endTime: meeting.endedAt!,
        status: 'processing',
        url: `https://recordings.example.com/${meetingId}/video.mp4`
      });
    }

    if (meeting.settings.recording.recordSharedScreen) {
      recordings.push({
        id: randomUUID(),
        type: 'video',
        format: 'mp4',
        size: Math.floor(Math.random() * 300000000) + 50000000,
        duration: meeting.analytics.totalDuration * 60,
        startTime: meeting.startedAt!,
        endTime: meeting.endedAt!,
        status: 'processing',
        url: `https://recordings.example.com/${meetingId}/screen.mp4`
      });
    }

    if (meeting.settings.chat.saveChat && meeting.analytics.engagementMetrics.chatMessages > 0) {
      recordings.push({
        id: randomUUID(),
        type: 'chat',
        format: 'txt',
        size: Math.floor(Math.random() * 10000) + 1000,
        startTime: meeting.startedAt!,
        endTime: meeting.endedAt!,
        status: 'ready',
        url: `https://recordings.example.com/${meetingId}/chat.txt`,
        downloadUrl: `https://recordings.example.com/${meetingId}/chat.txt?download=true`
      });
    }

    if (meeting.settings.features.liveTranscription) {
      recordings.push({
        id: randomUUID(),
        type: 'transcript',
        format: 'txt',
        size: Math.floor(Math.random() * 50000) + 5000,
        duration: meeting.analytics.totalDuration * 60,
        startTime: meeting.startedAt!,
        endTime: meeting.endedAt!,
        status: 'processing',
        url: `https://recordings.example.com/${meetingId}/transcript.txt`
      });
    }

    meeting.recording.available = recordings.length > 0;
    meeting.recording.recordings = recordings;
    meeting.updatedAt = new Date();
    
    this.meetings.set(meetingId, meeting);

    // Simulate processing completion
    setTimeout(() => {
      this.completeRecordingProcessing(meetingId);
    }, 30000); // 30 seconds
  }

  private async completeRecordingProcessing(meetingId: string): Promise<any> {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) return;

    // Mark all recordings as ready
    for (const recording of meeting.recording.recordings) {
      if (recording.status === 'processing') {
        recording.status = 'ready';
        recording.downloadUrl = recording.url + '?download=true';
        
        // Set expiry date based on retention policy
        if (meeting.recording.settings.autoDelete) {
          const expiryDate = new Date();
          expiryDate.setDate(expiryDate.getDate() + meeting.recording.settings.retentionDays);
          recording.expiryDate = expiryDate;
        }
      }
    }

    meeting.updatedAt = new Date();
    this.meetings.set(meetingId, meeting);

    this.emit('recordingsReady', {
      meetingId,
      recordings: meeting.recording.recordings.length,
      timestamp: new Date()
    });
  }

  async getRecordings(meetingId: string): Promise<VideoMeeting['recording']['recordings']> {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) {
      throw new Error(`Meeting ${meetingId} not found`);
    }

    return meeting.recording.recordings;
  }

  async downloadRecording(meetingId: string, recordingId: string): Promise<string> {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) {
      throw new Error(`Meeting ${meetingId} not found`);
    }

    const recording = meeting.recording.recordings.find(r => r.id === recordingId);
    if (!recording) {
      throw new Error(`Recording ${recordingId} not found`);
    }

    if (recording.status !== 'ready') {
      throw new Error(`Recording ${recordingId} is not ready for download`);
    }

    return recording.downloadUrl || recording.url!;
  }

  // Webhook processing
  async processWebhookEvent(providerId: string, eventType: string, data: any, signature?: string): Promise<any> {
    // Verify webhook signature if provided
    if (signature && !this.verifyWebhookSignature(data, signature)) {
      throw new Error('Invalid webhook signature');
    }

    const webhookEvent: WebhookEvent = {
      id: randomUUID(),
      providerId,
      eventType: eventType as WebhookEvent['eventType'],
      meetingId: data.meetingId || data.id,
      externalMeetingId: data.externalId || data.meetingId,
      timestamp: new Date(),
      data,
      signature,
      processed: false
    };

    this.webhooks.set(webhookEvent.id, webhookEvent);

    // Process immediately for real-time events
    if (['meeting.started', 'meeting.ended', 'participant.joined', 'participant.left'].includes(eventType)) {
      await this.processWebhookEventInternal(webhookEvent);
    }
  }

  private async processWebhooks(): Promise<any> {
    const unprocessedWebhooks = Array.from(this.webhooks.values())
      .filter(webhook => !webhook.processed)
      .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

    for (const webhook of unprocessedWebhooks.slice(0, 10)) { // Process 10 at a time
      try {
        await this.processWebhookEventInternal(webhook);
      } catch (error: any) {
        webhook.error = error instanceof Error ? error.message : 'Unknown error';
        webhook.processed = true;
        webhook.processedAt = new Date();
        this.webhooks.set(webhook.id, webhook);
      }
    }
  }

  private async processWebhookEventInternal(webhook: WebhookEvent): Promise<any> {
    const meeting = await this.getMeetingByExternalId(webhook.externalMeetingId);
    if (!meeting) {
      console.warn(`Meeting not found for webhook: ${webhook.externalMeetingId}`);
      webhook.processed = true;
      webhook.processedAt = new Date();
      this.webhooks.set(webhook.id, webhook);
      return;
    }

    switch (webhook.eventType) {
      case 'meeting.started':
        await this.startMeeting(meeting.id);
        break;

      case 'meeting.ended':
        await this.endMeeting(meeting.id);
        break;

      case 'participant.joined':
        await this.joinMeeting(meeting.id, {
          email: webhook.data.participant.email,
          name: webhook.data.participant.name,
          userId: webhook.data.participant.userId,
          deviceInfo: webhook.data.participant.device
        });
        break;

      case 'participant.left':
        await this.leaveMeeting(meeting.id, webhook.data.participant.email);
        break;

      case 'recording.ready':
        await this.handleRecordingReady(meeting.id, webhook.data);
        break;

      default:
        console.log(`Unhandled webhook event: ${webhook.eventType}`);
    }

    webhook.processed = true;
    webhook.processedAt = new Date();
    this.webhooks.set(webhook.id, webhook);
  }

  private verifyWebhookSignature(data: any, signature: string): boolean {
    // Mock signature verification - implement actual verification based on provider
    return signature.length > 10;
  }

  private async handleRecordingReady(meetingId: string, data: any): Promise<any> {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) return;

    // Update recording status
    const recording = meeting.recording.recordings.find(r => r.id === data.recordingId);
    if (recording) {
      recording.status = 'ready';
      recording.url = data.downloadUrl;
      recording.downloadUrl = data.downloadUrl;
      meeting.updatedAt = new Date();
      this.meetings.set(meetingId, meeting);
    }
  }

  // Analytics and monitoring
  private async updateMeetingAnalytics(): Promise<any> {
    const activeMeetings = Array.from(this.meetings.values())
      .filter(meeting => meeting.status === 'started');

    for (const meeting of activeMeetings) {
      // Mock analytics updates
      meeting.analytics.engagementMetrics.chatMessages += Math.floor(Math.random() * 5);
      meeting.analytics.engagementMetrics.reactionsUsed += Math.floor(Math.random() * 3);
      
      // Update quality metrics
      meeting.analytics.qualityMetrics.averageVideoQuality = Math.random() * 2 + 3; // 3-5 range
      meeting.analytics.qualityMetrics.averageAudioQuality = Math.random() * 2 + 3; // 3-5 range
      
      meeting.updatedAt = new Date();
      this.meetings.set(meeting.id, meeting);
    }
  }

  async getMeetingAnalytics(meetingId: string): Promise<VideoMeeting['analytics']> {
    const meeting = this.meetings.get(meetingId);
    if (!meeting) {
      throw new Error(`Meeting ${meetingId} not found`);
    }

    return meeting.analytics;
  }

  async getProviderAnalytics(providerId: string, dateRange?: { start: Date; end: Date }): Promise<{
    totalMeetings: number;
    totalDuration: number;
    averageDuration: number;
    totalParticipants: number;
    averageParticipants: number;
    recordingRate: number;
    qualityMetrics: {
      averageVideoQuality: number;
      averageAudioQuality: number;
      connectionIssues: number;
    };
    usageByDay: { date: string; meetings: number; duration: number }[];
  }> {
    let meetings = Array.from(this.meetings.values())
      .filter(meeting => meeting.providerId === providerId);

    if (dateRange) {
      meetings = meetings.filter(meeting =>
        meeting.schedule.startTime >= dateRange.start &&
        meeting.schedule.startTime <= dateRange.end
      );
    }

    const totalMeetings = meetings.length;
    const totalDuration = meetings.reduce((sum, m) => sum + m.analytics.totalDuration, 0);
    const totalParticipants = meetings.reduce((sum, m) => sum + m.analytics.totalParticipants, 0);
    const recordedMeetings = meetings.filter(m => m.recording.available).length;

    // Group meetings by day for usage chart
    const usageByDay = meetings.reduce((acc, meeting) => {
      const date = meeting.schedule.startTime.toISOString().split('T')[0];
      const existing = acc.find(item => item.date === date);
      
      if (existing) {
        existing.meetings++;
        existing.duration += meeting.analytics.totalDuration;
      } else {
        acc.push({
          date,
          meetings: 1,
          duration: meeting.analytics.totalDuration
        });
      }
      
      return acc;
    }, [] as { date: string; meetings: number; duration: number }[]);

    return {
      totalMeetings,
      totalDuration,
      averageDuration: totalMeetings > 0 ? totalDuration / totalMeetings : 0,
      totalParticipants,
      averageParticipants: totalMeetings > 0 ? totalParticipants / totalMeetings : 0,
      recordingRate: totalMeetings > 0 ? (recordedMeetings / totalMeetings) * 100 : 0,
      qualityMetrics: {
        averageVideoQuality: meetings.length > 0 ? 
          meetings.reduce((sum, m) => sum + m.analytics.qualityMetrics.averageVideoQuality, 0) / meetings.length : 0,
        averageAudioQuality: meetings.length > 0 ?
          meetings.reduce((sum, m) => sum + m.analytics.qualityMetrics.averageAudioQuality, 0) / meetings.length : 0,
        connectionIssues: meetings.reduce((sum, m) => sum + m.analytics.qualityMetrics.connectionIssues, 0)
      },
      usageByDay: usageByDay.sort((a, b) => a.date.localeCompare(b.date))
    };
  }

  // Template management
  async createTemplate(templateData: Omit<MeetingTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<MeetingTemplate> {
    const template: MeetingTemplate = {
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

  async getTemplates(tenantId: string): Promise<MeetingTemplate[]> {
    return Array.from(this.templates.values())
      .filter(template => template.tenantId === tenantId || template.tenantId === 'default');
  }

  // Cleanup and maintenance
  private async cleanupOldMeetings(): Promise<any> {
    if (!this.config.autoCleanupEnabled) return;

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.cleanupAfterDays);

    const meetingsToCleanup = Array.from(this.meetings.values())
      .filter(meeting => 
        meeting.status === 'ended' &&
        meeting.endedAt &&
        meeting.endedAt < cutoffDate
      );

    for (const meeting of meetingsToCleanup) {
      // Archive recordings if needed
      if (meeting.recording.available) {
        await this.archiveRecordings(meeting);
      }

      // Remove meeting data
      this.meetings.delete(meeting.id);
    }

    console.log(`Cleaned up ${meetingsToCleanup.length} old meetings`);
  }

  private async archiveRecordings(meeting: VideoMeeting): Promise<any> {
    console.log(`Archiving recordings for meeting ${meeting.id}`);
    
    // Mock archival process
    for (const recording of meeting.recording.recordings) {
      if (recording.status === 'ready' && !recording.expiryDate) {
        // Mark as archived
        console.log(`Archived recording ${recording.id}`);
      }
    }
  }

  // System health and monitoring
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    providers: {
      total: number;
      active: number;
      error: number;
    };
    meetings: {
      total: number;
      scheduled: number;
      active: number;
      ended: number;
    };
    recordings: {
      total: number;
      processing: number;
      ready: number;
      failed: number;
    };
    webhooks: {
      pending: number;
      processed: number;
      failed: number;
    };
    timestamp: Date;
  }> {
    const providers = {
      total: this.providers.size,
      active: Array.from(this.providers.values()).filter(p => p.status === 'active').length,
      error: Array.from(this.providers.values()).filter(p => p.status === 'error').length
    };

    const meetings = {
      total: this.meetings.size,
      scheduled: Array.from(this.meetings.values()).filter(m => m.status === 'scheduled').length,
      active: Array.from(this.meetings.values()).filter(m => m.status === 'started').length,
      ended: Array.from(this.meetings.values()).filter(m => m.status === 'ended').length
    };

    const allRecordings = Array.from(this.meetings.values())
      .flatMap(m => m.recording.recordings);

    const recordings = {
      total: allRecordings.length,
      processing: allRecordings.filter(r => r.status === 'processing').length,
      ready: allRecordings.filter(r => r.status === 'ready').length,
      failed: allRecordings.filter(r => r.status === 'failed').length
    };

    const webhooks = {
      pending: Array.from(this.webhooks.values()).filter(w => !w.processed).length,
      processed: Array.from(this.webhooks.values()).filter(w => w.processed && !w.error).length,
      failed: Array.from(this.webhooks.values()).filter(w => w.error).length
    };

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    if (providers.error > 0 || webhooks.failed > 10) {
      status = 'degraded';
    }
    
    if (providers.active === 0 || webhooks.failed > 50) {
      status = 'unhealthy';
    }

    return {
      status,
      providers,
      meetings,
      recordings,
      webhooks,
      timestamp: new Date()
    };
  }

  async shutdown(): Promise<any> {
    console.log('Shutting down Video Conferencing Service...');
    
    // End all active meetings
    const activeMeetings = Array.from(this.meetings.values())
      .filter(meeting => meeting.status === 'started');
    
    for (const meeting of activeMeetings) {
      await this.endMeeting(meeting.id);
    }

    // Clear all data
    this.providers.clear();
    this.meetings.clear();
    this.templates.clear();
    this.webhooks.clear();

    console.log('Video Conferencing Service shutdown complete');
  }
}

export default VideoConferencingService;

