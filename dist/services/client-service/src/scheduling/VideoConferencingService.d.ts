import { EventEmitter } from 'events';
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
        maxDuration: number;
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
    externalId: string;
    meetingId: string;
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
        duration?: number;
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
            size: number;
            duration?: number;
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
        joinRate: number;
        engagementMetrics: {
            chatMessages: number;
            pollsAnswered: number;
            reactionsUsed: number;
            screenShareTime: number;
            speakingTime: Record<string, number>;
        };
        qualityMetrics: {
            averageVideoQuality: number;
            averageAudioQuality: number;
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
        defaultDuration: number;
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
    eventType: 'meeting.started' | 'meeting.ended' | 'participant.joined' | 'participant.left' | 'recording.ready' | 'meeting.created' | 'meeting.updated' | 'meeting.deleted';
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
    maxMeetingDuration: number;
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
export declare class VideoConferencingService extends EventEmitter {
    private providers;
    private meetings;
    private templates;
    private webhooks;
    private config;
    constructor(config?: Partial<VideoConferencingConfig>);
    private initializeProviders;
    private initializeDefaultTemplates;
    private startBackgroundTasks;
    getProviders(): Promise<VideoProvider[]>;
    getProvider(providerId: string): Promise<VideoProvider | null>;
    updateProvider(providerId: string, updates: Partial<VideoProvider>): Promise<VideoProvider>;
    createMeeting(meetingData: {
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
    }): Promise<VideoMeeting>;
    private mergeSettings;
    private deepMerge;
    private generateMeetingPassword;
    private createExternalMeeting;
    getMeeting(meetingId: string): Promise<VideoMeeting | null>;
    getMeetingByExternalId(externalId: string): Promise<VideoMeeting | null>;
    getMeetings(filters?: {
        tenantId?: string;
        providerId?: string;
        status?: VideoMeeting['status'][];
        startDate?: Date;
        endDate?: Date;
        hostId?: string;
    }): Promise<VideoMeeting[]>;
    updateMeeting(meetingId: string, updates: Partial<VideoMeeting>): Promise<VideoMeeting>;
    private updateExternalMeeting;
    deleteMeeting(meetingId: string): Promise<void>;
    private deleteExternalMeeting;
    startMeeting(meetingId: string): Promise<VideoMeeting>;
    endMeeting(meetingId: string): Promise<VideoMeeting>;
    joinMeeting(meetingId: string, participant: {
        userId?: string;
        email: string;
        name: string;
        deviceInfo?: VideoMeeting['participants'][0]['deviceInfo'];
    }): Promise<VideoMeeting>;
    leaveMeeting(meetingId: string, participantEmail: string): Promise<VideoMeeting>;
    private processRecordings;
    private completeRecordingProcessing;
    getRecordings(meetingId: string): Promise<VideoMeeting['recording']['recordings']>;
    downloadRecording(meetingId: string, recordingId: string): Promise<string>;
    processWebhookEvent(providerId: string, eventType: string, data: any, signature?: string): Promise<void>;
    private processWebhooks;
    private processWebhookEventInternal;
    private verifyWebhookSignature;
    private handleRecordingReady;
    private updateMeetingAnalytics;
    getMeetingAnalytics(meetingId: string): Promise<VideoMeeting['analytics']>;
    getProviderAnalytics(providerId: string, dateRange?: {
        start: Date;
        end: Date;
    }): Promise<{
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
        usageByDay: {
            date: string;
            meetings: number;
            duration: number;
        }[];
    }>;
    createTemplate(templateData: Omit<MeetingTemplate, 'id' | 'createdAt' | 'updatedAt'>): Promise<MeetingTemplate>;
    getTemplates(tenantId: string): Promise<MeetingTemplate[]>;
    private cleanupOldMeetings;
    private archiveRecordings;
    getSystemHealth(): Promise<{
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
    }>;
    shutdown(): Promise<void>;
}
export default VideoConferencingService;
