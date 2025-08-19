import { EventEmitter } from 'events';
export interface CalendarProvider {
    id: string;
    name: string;
    type: 'microsoft' | 'google' | 'outlook' | 'exchange' | 'caldav' | 'icalendar';
    apiVersion: string;
    authType: 'oauth2' | 'basic' | 'api_key' | 'saml';
    capabilities: {
        createEvents: boolean;
        updateEvents: boolean;
        deleteEvents: boolean;
        readEvents: boolean;
        managePermissions: boolean;
        recurring: boolean;
        attachments: boolean;
        reminders: boolean;
        timeZones: boolean;
        availability: boolean;
    };
    rateLimits: {
        requestsPerMinute: number;
        requestsPerHour: number;
        requestsPerDay: number;
    };
    status: 'active' | 'inactive' | 'error' | 'maintenance';
    lastSyncTime?: Date;
    errorDetails?: string;
}
export interface CalendarConnection {
    id: string;
    tenantId: string;
    userId: string;
    providerId: string;
    accountId: string;
    accountEmail: string;
    displayName: string;
    accessToken: string;
    refreshToken?: string;
    tokenExpiry?: Date;
    scopes: string[];
    permissions: {
        read: boolean;
        write: boolean;
        delete: boolean;
        share: boolean;
    };
    syncSettings: {
        enabled: boolean;
        syncDirection: 'bidirectional' | 'inbound' | 'outbound';
        syncFrequency: number;
        lastSync?: Date;
        nextSync?: Date;
        conflictResolution: 'manual' | 'auto_overwrite' | 'auto_merge';
    };
    status: 'connected' | 'disconnected' | 'error' | 'pending_auth';
    createdAt: Date;
    updatedAt: Date;
}
export interface CalendarEvent {
    id: string;
    externalId?: string;
    connectionId: string;
    tenantId: string;
    organizerId: string;
    title: string;
    description?: string;
    location?: {
        name: string;
        address?: string;
        coordinates?: {
            latitude: number;
            longitude: number;
        };
        room?: string;
        virtual?: {
            platform: string;
            meetingId: string;
            joinUrl: string;
            passcode?: string;
        };
    };
    startTime: Date;
    endTime: Date;
    timeZone: string;
    allDay: boolean;
    recurrence?: {
        pattern: 'daily' | 'weekly' | 'monthly' | 'yearly';
        interval: number;
        endDate?: Date;
        count?: number;
        daysOfWeek?: number[];
        dayOfMonth?: number;
        monthOfYear?: number;
        exceptions?: Date[];
    };
    attendees: {
        email: string;
        name?: string;
        type: 'required' | 'optional' | 'resource';
        status: 'accepted' | 'declined' | 'tentative' | 'pending';
        responseTime?: Date;
    }[];
    reminders: {
        type: 'email' | 'popup' | 'sms';
        minutesBefore: number;
        sent?: boolean;
        sentAt?: Date;
    }[];
    attachments: {
        id: string;
        name: string;
        size: number;
        mimeType: string;
        url?: string;
    }[];
    categories: string[];
    tags: string[];
    priority: 'low' | 'normal' | 'high' | 'urgent';
    visibility: 'public' | 'private' | 'confidential';
    availability: 'busy' | 'free' | 'tentative' | 'out_of_office';
    status: 'confirmed' | 'tentative' | 'cancelled';
    metadata: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
    syncedAt?: Date;
}
export interface CalendarAvailability {
    userId: string;
    date: Date;
    timeZone: string;
    slots: {
        startTime: Date;
        endTime: Date;
        status: 'available' | 'busy' | 'tentative' | 'out_of_office';
        eventId?: string;
        eventTitle?: string;
    }[];
    workingHours: {
        start: string;
        end: string;
        enabled: boolean;
    };
    breaks: {
        start: string;
        end: string;
        title: string;
    }[];
    exceptions: {
        date: Date;
        type: 'holiday' | 'vacation' | 'sick' | 'custom';
        title: string;
    }[];
}
export interface CalendarSync {
    id: string;
    connectionId: string;
    syncType: 'full' | 'incremental' | 'delta';
    startTime: Date;
    endTime?: Date;
    status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
    eventsProcessed: number;
    eventsCreated: number;
    eventsUpdated: number;
    eventsDeleted: number;
    errors: {
        eventId?: string;
        error: string;
        timestamp: Date;
    }[];
    progress: number;
    estimatedCompletion?: Date;
    metadata: Record<string, any>;
}
export interface CalendarIntegrationConfig {
    maxConnections: number;
    syncIntervalMinutes: number;
    retryAttempts: number;
    retryDelayMs: number;
    batchSize: number;
    maxEventDuration: number;
    defaultReminders: number[];
    allowedDomains: string[];
    blockedDomains: string[];
    encryptionEnabled: boolean;
    auditEnabled: boolean;
    cacheEnabled: boolean;
    cacheTtlMinutes: number;
}
export declare class CalendarIntegrationService extends EventEmitter {
    private providers;
    private connections;
    private events;
    private syncJobs;
    private config;
    constructor(config?: Partial<CalendarIntegrationConfig>);
    private initializeProviders;
    private startSyncScheduler;
    getProviders(): Promise<CalendarProvider[]>;
    getProvider(providerId: string): Promise<CalendarProvider | null>;
    updateProviderStatus(providerId: string, status: CalendarProvider['status'], errorDetails?: string): Promise<void>;
    createConnection(connectionData: Omit<CalendarConnection, 'id' | 'createdAt' | 'updatedAt'>): Promise<CalendarConnection>;
    getConnections(tenantId: string, userId?: string): Promise<CalendarConnection[]>;
    getConnection(connectionId: string): Promise<CalendarConnection | null>;
    updateConnection(connectionId: string, updates: Partial<CalendarConnection>): Promise<CalendarConnection>;
    deleteConnection(connectionId: string): Promise<void>;
    createEvent(eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<CalendarEvent>;
    getEvents(connectionId: string, filters?: {
        startDate?: Date;
        endDate?: Date;
        categories?: string[];
        attendees?: string[];
        status?: CalendarEvent['status'][];
    }): Promise<CalendarEvent[]>;
    updateEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent>;
    deleteEvent(eventId: string): Promise<void>;
    getAvailability(userId: string, startDate: Date, endDate: Date, timeZone?: string): Promise<CalendarAvailability[]>;
    findAvailableSlots(userIds: string[], duration: number, // minutes
    startDate: Date, endDate: Date, workingHoursOnly?: boolean): Promise<{
        startTime: Date;
        endTime: Date;
        availableUsers: string[];
    }[]>;
    private isTimeSlotAvailable;
    private parseTime;
    private isTimeInRange;
    scheduleSync(connectionId: string, syncType?: CalendarSync['syncType']): Promise<string>;
    getSyncStatus(syncId: string): Promise<CalendarSync | null>;
    cancelSync(syncId: string): Promise<void>;
    private performSync;
    private simulateSync;
    private performScheduledSync;
    private updateSyncStatus;
    private syncEventToProvider;
    private deleteEventFromProvider;
    getSystemHealth(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        providers: Record<string, 'active' | 'inactive' | 'error'>;
        connections: {
            total: number;
            active: number;
            error: number;
        };
        syncJobs: {
            pending: number;
            running: number;
            failed: number;
        };
        timestamp: Date;
    }>;
    shutdown(): Promise<void>;
}
export default CalendarIntegrationService;
