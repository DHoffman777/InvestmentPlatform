import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';

// Calendar integration data models
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
    syncFrequency: number; // minutes
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
    start: string; // HH:mm format
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
  progress: number; // 0-100
  estimatedCompletion?: Date;
  metadata: Record<string, any>;
}

export interface CalendarIntegrationConfig {
  maxConnections: number;
  syncIntervalMinutes: number;
  retryAttempts: number;
  retryDelayMs: number;
  batchSize: number;
  maxEventDuration: number; // hours
  defaultReminders: number[]; // minutes before
  allowedDomains: string[];
  blockedDomains: string[];
  encryptionEnabled: boolean;
  auditEnabled: boolean;
  cacheEnabled: boolean;
  cacheTtlMinutes: number;
}

export class CalendarIntegrationService extends EventEmitter {
  private providers: Map<string, CalendarProvider> = new Map();
  private connections: Map<string, CalendarConnection> = new Map();
  private events: Map<string, CalendarEvent> = new Map();
  private syncJobs: Map<string, CalendarSync> = new Map();
  private config: CalendarIntegrationConfig;

  constructor(config: Partial<CalendarIntegrationConfig> = {}) {
    super();
    
    this.config = {
      maxConnections: 10,
      syncIntervalMinutes: 15,
      retryAttempts: 3,
      retryDelayMs: 5000,
      batchSize: 100,
      maxEventDuration: 24,
      defaultReminders: [15, 5],
      allowedDomains: [],
      blockedDomains: [],
      encryptionEnabled: true,
      auditEnabled: true,
      cacheEnabled: true,
      cacheTtlMinutes: 60,
      ...config
    };

    this.initializeProviders();
    this.startSyncScheduler();
  }

  private initializeProviders(): void {
    // Microsoft Outlook/Exchange
    this.providers.set('microsoft-outlook', {
      id: 'microsoft-outlook',
      name: 'Microsoft Outlook',
      type: 'microsoft',
      apiVersion: 'v1.0',
      authType: 'oauth2',
      capabilities: {
        createEvents: true,
        updateEvents: true,
        deleteEvents: true,
        readEvents: true,
        managePermissions: true,
        recurring: true,
        attachments: true,
        reminders: true,
        timeZones: true,
        availability: true
      },
      rateLimits: {
        requestsPerMinute: 120,
        requestsPerHour: 10000,
        requestsPerDay: 1000000
      },
      status: 'active'
    });

    // Google Calendar
    this.providers.set('google-calendar', {
      id: 'google-calendar',
      name: 'Google Calendar',
      type: 'google',
      apiVersion: 'v3',
      authType: 'oauth2',
      capabilities: {
        createEvents: true,
        updateEvents: true,
        deleteEvents: true,
        readEvents: true,
        managePermissions: true,
        recurring: true,
        attachments: true,
        reminders: true,
        timeZones: true,
        availability: true
      },
      rateLimits: {
        requestsPerMinute: 100,
        requestsPerHour: 1000000,
        requestsPerDay: 1000000000
      },
      status: 'active'
    });

    // Exchange Server
    this.providers.set('exchange-server', {
      id: 'exchange-server',
      name: 'Exchange Server',
      type: 'exchange',
      apiVersion: '2016',
      authType: 'basic',
      capabilities: {
        createEvents: true,
        updateEvents: true,
        deleteEvents: true,
        readEvents: true,
        managePermissions: true,
        recurring: true,
        attachments: true,
        reminders: true,
        timeZones: true,
        availability: true
      },
      rateLimits: {
        requestsPerMinute: 60,
        requestsPerHour: 3600,
        requestsPerDay: 86400
      },
      status: 'active'
    });

    // CalDAV (generic)
    this.providers.set('caldav', {
      id: 'caldav',
      name: 'CalDAV',
      type: 'caldav',
      apiVersion: '1.0',
      authType: 'basic',
      capabilities: {
        createEvents: true,
        updateEvents: true,
        deleteEvents: true,
        readEvents: true,
        managePermissions: false,
        recurring: true,
        attachments: false,
        reminders: true,
        timeZones: true,
        availability: false
      },
      rateLimits: {
        requestsPerMinute: 30,
        requestsPerHour: 1800,
        requestsPerDay: 43200
      },
      status: 'active'
    });
  }

  private startSyncScheduler(): void {
    setInterval(() => {
      this.performScheduledSync().catch(error => {
        console.error('Scheduled sync error:', error);
        this.emit('syncError', { error: error instanceof Error ? error.message : 'Unknown error', timestamp: new Date() });
      });
    }, this.config.syncIntervalMinutes * 60 * 1000);
  }

  // Provider management
  async getProviders(): Promise<CalendarProvider[]> {
    return Array.from(this.providers.values());
  }

  async getProvider(providerId: string): Promise<CalendarProvider | null> {
    return this.providers.get(providerId) || null;
  }

  async updateProviderStatus(providerId: string, status: CalendarProvider['status'], errorDetails?: string): Promise<any> {
    const provider = this.providers.get(providerId);
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`);
    }

    provider.status = status;
    provider.lastSyncTime = new Date();
    if (errorDetails) {
      provider.errorDetails = errorDetails;
    }

    this.emit('providerStatusChanged', { providerId, status, errorDetails });
  }

  // Connection management
  async createConnection(connectionData: Omit<CalendarConnection, 'id' | 'createdAt' | 'updatedAt'>): Promise<CalendarConnection> {
    // Validate provider exists
    const provider = this.providers.get(connectionData.providerId);
    if (!provider) {
      throw new Error(`Provider ${connectionData.providerId} not found`);
    }

    // Check connection limits
    const existingConnections = Array.from(this.connections.values())
      .filter(conn => conn.tenantId === connectionData.tenantId && conn.userId === connectionData.userId);
    
    if (existingConnections.length >= this.config.maxConnections) {
      throw new Error(`Maximum connections (${this.config.maxConnections}) reached for user`);
    }

    // Validate domain if restrictions exist
    if (this.config.allowedDomains.length > 0) {
      const domain = connectionData.accountEmail.split('@')[1];
      if (!this.config.allowedDomains.includes(domain)) {
        throw new Error(`Domain ${domain} is not allowed`);
      }
    }

    if (this.config.blockedDomains.length > 0) {
      const domain = connectionData.accountEmail.split('@')[1];
      if (this.config.blockedDomains.includes(domain)) {
        throw new Error(`Domain ${domain} is blocked`);
      }
    }

    const connection: CalendarConnection = {
      id: randomUUID(),
      ...connectionData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.connections.set(connection.id, connection);

    // Emit event for audit logging
    this.emit('connectionCreated', {
      connectionId: connection.id,
      tenantId: connection.tenantId,
      userId: connection.userId,
      providerId: connection.providerId,
      timestamp: new Date()
    });

    // Start initial sync if enabled
    if (connection.syncSettings.enabled) {
      this.scheduleSync(connection.id, 'full');
    }

    return connection;
  }

  async getConnections(tenantId: string, userId?: string): Promise<CalendarConnection[]> {
    return Array.from(this.connections.values())
      .filter(conn => conn.tenantId === tenantId && (!userId || conn.userId === userId));
  }

  async getConnection(connectionId: string): Promise<CalendarConnection | null> {
    return this.connections.get(connectionId) || null;
  }

  async updateConnection(connectionId: string, updates: Partial<CalendarConnection>): Promise<CalendarConnection> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error(`Connection ${connectionId} not found`);
    }

    const updatedConnection = {
      ...connection,
      ...updates,
      updatedAt: new Date()
    };

    this.connections.set(connectionId, updatedConnection);

    this.emit('connectionUpdated', {
      connectionId,
      updates,
      timestamp: new Date()
    });

    return updatedConnection;
  }

  async deleteConnection(connectionId: string): Promise<any> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error(`Connection ${connectionId} not found`);
    }

    // Cancel any active sync jobs
    const activeSyncs = Array.from(this.syncJobs.values())
      .filter(sync => sync.connectionId === connectionId && sync.status === 'running');
    
    for (const sync of activeSyncs) {
      await this.cancelSync(sync.id);
    }

    // Delete associated events
    const connectionEvents = Array.from(this.events.values())
      .filter(event => event.connectionId === connectionId);
    
    for (const event of connectionEvents) {
      this.events.delete(event.id);
    }

    this.connections.delete(connectionId);

    this.emit('connectionDeleted', {
      connectionId,
      tenantId: connection.tenantId,
      userId: connection.userId,
      timestamp: new Date()
    });
  }

  // Event management
  async createEvent(eventData: Omit<CalendarEvent, 'id' | 'createdAt' | 'updatedAt'>): Promise<CalendarEvent> {
    const connection = this.connections.get(eventData.connectionId);
    if (!connection) {
      throw new Error(`Connection ${eventData.connectionId} not found`);
    }

    if (!connection.permissions.write) {
      throw new Error('Write permission not granted for this connection');
    }

    // Validate event duration
    const durationHours = (eventData.endTime.getTime() - eventData.startTime.getTime()) / (1000 * 60 * 60);
    if (durationHours > this.config.maxEventDuration) {
      throw new Error(`Event duration exceeds maximum allowed (${this.config.maxEventDuration} hours)`);
    }

    const event: CalendarEvent = {
      id: randomUUID(),
      ...eventData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.events.set(event.id, event);

    // Sync to external calendar if connection is active
    if (connection.status === 'connected') {
      try {
        await this.syncEventToProvider(event, connection);
      } catch (error: any) {
        console.error(`Failed to sync event to provider:`, error);
        this.emit('syncError', {
          eventId: event.id,
          connectionId: connection.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        });
      }
    }

    this.emit('eventCreated', {
      eventId: event.id,
      connectionId: event.connectionId,
      tenantId: event.tenantId,
      timestamp: new Date()
    });

    return event;
  }

  async getEvents(connectionId: string, filters?: {
    startDate?: Date;
    endDate?: Date;
    categories?: string[];
    attendees?: string[];
    status?: CalendarEvent['status'][];
  }): Promise<CalendarEvent[]> {
    let events = Array.from(this.events.values())
      .filter(event => event.connectionId === connectionId);

    if (filters) {
      if (filters.startDate) {
        events = events.filter(event => event.startTime >= filters.startDate!);
      }
      if (filters.endDate) {
        events = events.filter(event => event.endTime <= filters.endDate!);
      }
      if (filters.categories && filters.categories.length > 0) {
        events = events.filter(event => 
          event.categories.some(cat => filters.categories!.includes(cat))
        );
      }
      if (filters.attendees && filters.attendees.length > 0) {
        events = events.filter(event =>
          event.attendees.some(att => filters.attendees!.includes(att.email))
        );
      }
      if (filters.status && filters.status.length > 0) {
        events = events.filter(event => filters.status!.includes(event.status));
      }
    }

    return events.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  async updateEvent(eventId: string, updates: Partial<CalendarEvent>): Promise<CalendarEvent> {
    const event = this.events.get(eventId);
    if (!event) {
      throw new Error(`Event ${eventId} not found`);
    }

    const connection = this.connections.get(event.connectionId);
    if (!connection || !connection.permissions.write) {
      throw new Error('Write permission not granted for this connection');
    }

    const updatedEvent = {
      ...event,
      ...updates,
      updatedAt: new Date()
    };

    this.events.set(eventId, updatedEvent);

    // Sync changes to external calendar
    if (connection.status === 'connected') {
      try {
        await this.syncEventToProvider(updatedEvent, connection);
      } catch (error: any) {
        console.error(`Failed to sync event update to provider:`, error);
        this.emit('syncError', {
          eventId: eventId,
          connectionId: connection.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        });
      }
    }

    this.emit('eventUpdated', {
      eventId,
      connectionId: event.connectionId,
      updates,
      timestamp: new Date()
    });

    return updatedEvent;
  }

  async deleteEvent(eventId: string): Promise<any> {
    const event = this.events.get(eventId);
    if (!event) {
      throw new Error(`Event ${eventId} not found`);
    }

    const connection = this.connections.get(event.connectionId);
    if (!connection || !connection.permissions.delete) {
      throw new Error('Delete permission not granted for this connection');
    }

    // Remove from external calendar
    if (connection.status === 'connected' && event.externalId) {
      try {
        await this.deleteEventFromProvider(event, connection);
      } catch (error: any) {
        console.error(`Failed to delete event from provider:`, error);
        this.emit('syncError', {
          eventId: eventId,
          connectionId: connection.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        });
      }
    }

    this.events.delete(eventId);

    this.emit('eventDeleted', {
      eventId,
      connectionId: event.connectionId,
      tenantId: event.tenantId,
      timestamp: new Date()
    });
  }

  // Availability management
  async getAvailability(userId: string, startDate: Date, endDate: Date, timeZone: string = 'UTC'): Promise<CalendarAvailability[]> {
    const userConnections = Array.from(this.connections.values())
      .filter(conn => conn.userId === userId && conn.status === 'connected');

    const availabilityData: CalendarAvailability[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dayAvailability: CalendarAvailability = {
        userId,
        date: new Date(currentDate),
        timeZone,
        slots: [],
        workingHours: {
          start: '09:00',
          end: '17:00',
          enabled: true
        },
        breaks: [
          { start: '12:00', end: '13:00', title: 'Lunch Break' }
        ],
        exceptions: []
      };

      // Get all events for this day across all connections
      const dayEvents: CalendarEvent[] = [];
      for (const connection of userConnections) {
        const connectionEvents = await this.getEvents(connection.id, {
          startDate: new Date(currentDate.setHours(0, 0, 0, 0)),
          endDate: new Date(currentDate.setHours(23, 59, 59, 999))
        });
        dayEvents.push(...connectionEvents);
      }

      // Generate time slots (15-minute intervals)
      for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 15) {
          const slotStart = new Date(currentDate);
          slotStart.setHours(hour, minute, 0, 0);
          const slotEnd = new Date(slotStart);
          slotEnd.setMinutes(slotEnd.getMinutes() + 15);

          // Check if slot conflicts with any event
          const conflictingEvent = dayEvents.find(event =>
            (slotStart >= event.startTime && slotStart < event.endTime) ||
            (slotEnd > event.startTime && slotEnd <= event.endTime) ||
            (slotStart <= event.startTime && slotEnd >= event.endTime)
          );

          const slot = {
            startTime: slotStart,
            endTime: slotEnd,
            status: conflictingEvent ? 
              (conflictingEvent.availability === 'free' ? 'available' : 
               conflictingEvent.availability as 'busy' | 'tentative' | 'out_of_office') : 
              'available' as const,
            eventId: conflictingEvent?.id,
            eventTitle: conflictingEvent?.title
          };

          dayAvailability.slots.push(slot);
        }
      }

      availabilityData.push(dayAvailability);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return availabilityData;
  }

  async findAvailableSlots(
    userIds: string[],
    duration: number, // minutes
    startDate: Date,
    endDate: Date,
    workingHoursOnly: boolean = true
  ): Promise<{
    startTime: Date;
    endTime: Date;
    availableUsers: string[];
  }[]> {
    const availableSlots: {
      startTime: Date;
      endTime: Date;
      availableUsers: string[];
    }[] = [];

    // Get availability for all users
    const allAvailability = new Map<string, CalendarAvailability[]>();
    for (const userId of userIds) {
      const userAvailability = await this.getAvailability(userId, startDate, endDate);
      allAvailability.set(userId, userAvailability);
    }

    const currentTime = new Date(startDate);
    while (currentTime <= endDate) {
      const slotEnd = new Date(currentTime.getTime() + duration * 60 * 1000);
      
      if (slotEnd > endDate) break;

      // Check availability for all users in this time slot
      const availableUsers: string[] = [];
      
      for (const userId of userIds) {
        const userAvailability = allAvailability.get(userId);
        if (!userAvailability) continue;

        const dayAvailability = userAvailability.find(day => 
          day.date.toDateString() === currentTime.toDateString()
        );

        if (!dayAvailability) continue;

        // Check if the entire duration is available
        const isAvailable = this.isTimeSlotAvailable(
          currentTime,
          slotEnd,
          dayAvailability,
          workingHoursOnly
        );

        if (isAvailable) {
          availableUsers.push(userId);
        }
      }

      // If at least one user is available, add the slot
      if (availableUsers.length > 0) {
        availableSlots.push({
          startTime: new Date(currentTime),
          endTime: new Date(slotEnd),
          availableUsers: [...availableUsers]
        });
      }

      // Move to next 15-minute slot
      currentTime.setMinutes(currentTime.getMinutes() + 15);
    }

    return availableSlots;
  }

  private isTimeSlotAvailable(
    startTime: Date,
    endTime: Date,
    availability: CalendarAvailability,
    workingHoursOnly: boolean
  ): boolean {
    if (workingHoursOnly && availability.workingHours.enabled) {
      const workStart = this.parseTime(availability.workingHours.start);
      const workEnd = this.parseTime(availability.workingHours.end);
      const slotStart = { hour: startTime.getHours(), minute: startTime.getMinutes() };
      const slotEnd = { hour: endTime.getHours(), minute: endTime.getMinutes() };

      if (!this.isTimeInRange(slotStart, workStart, workEnd) ||
          !this.isTimeInRange(slotEnd, workStart, workEnd)) {
        return false;
      }
    }

    // Check if any slot in the time range is busy
    const conflictingSlots = availability.slots.filter(slot =>
      (startTime >= slot.startTime && startTime < slot.endTime) ||
      (endTime > slot.startTime && endTime <= slot.endTime) ||
      (startTime <= slot.startTime && endTime >= slot.endTime)
    );

    return !conflictingSlots.some(slot => 
      slot.status === 'busy' || slot.status === 'out_of_office'
    );
  }

  private parseTime(timeStr: string): { hour: number; minute: number } {
    const [hour, minute] = timeStr.split(':').map(Number);
    return { hour, minute };
  }

  private isTimeInRange(
    time: { hour: number; minute: number },
    start: { hour: number; minute: number },
    end: { hour: number; minute: number }
  ): boolean {
    const timeMinutes = time.hour * 60 + time.minute;
    const startMinutes = start.hour * 60 + start.minute;
    const endMinutes = end.hour * 60 + end.minute;
    
    return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
  }

  // Sync management
  async scheduleSync(connectionId: string, syncType: CalendarSync['syncType'] = 'incremental'): Promise<string> {
    const connection = this.connections.get(connectionId);
    if (!connection) {
      throw new Error(`Connection ${connectionId} not found`);
    }

    const syncId = randomUUID();
    const sync: CalendarSync = {
      id: syncId,
      connectionId,
      syncType,
      startTime: new Date(),
      status: 'pending',
      eventsProcessed: 0,
      eventsCreated: 0,
      eventsUpdated: 0,
      eventsDeleted: 0,
      errors: [],
      progress: 0,
      metadata: {}
    };

    this.syncJobs.set(syncId, sync);

    // Start sync in background
    this.performSync(syncId).catch(error => {
      console.error(`Sync ${syncId} failed:`, error);
      this.updateSyncStatus(syncId, 'failed', error instanceof Error ? error.message : 'Unknown error');
    });

    return syncId;
  }

  async getSyncStatus(syncId: string): Promise<CalendarSync | null> {
    return this.syncJobs.get(syncId) || null;
  }

  async cancelSync(syncId: string): Promise<any> {
    const sync = this.syncJobs.get(syncId);
    if (!sync) {
      throw new Error(`Sync ${syncId} not found`);
    }

    if (sync.status === 'running') {
      sync.status = 'cancelled';
      this.syncJobs.set(syncId, sync);
      
      this.emit('syncCancelled', { syncId, timestamp: new Date() });
    }
  }

  private async performSync(syncId: string): Promise<any> {
    const sync = this.syncJobs.get(syncId);
    if (!sync) return;

    const connection = this.connections.get(sync.connectionId);
    if (!connection) {
      throw new Error(`Connection ${sync.connectionId} not found`);
    }

    sync.status = 'running';
    this.syncJobs.set(syncId, sync);

    try {
      // Mock sync implementation - replace with actual provider APIs
      await this.simulateSync(sync, connection);
      
      sync.status = 'completed';
      sync.endTime = new Date();
      sync.progress = 100;
      
      // Update connection sync time
      connection.syncSettings.lastSync = new Date();
      connection.syncSettings.nextSync = new Date(Date.now() + this.config.syncIntervalMinutes * 60 * 1000);
      this.connections.set(connection.id, connection);

    } catch (error: any) {
      sync.status = 'failed';
      sync.errors.push({
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      });
    }

    this.syncJobs.set(syncId, sync);
    
    this.emit('syncCompleted', {
      syncId,
      connectionId: sync.connectionId,
      status: sync.status,
      eventsProcessed: sync.eventsProcessed,
      timestamp: new Date()
    });
  }

  private async simulateSync(sync: CalendarSync, connection: CalendarConnection): Promise<any> {
    // Simulate sync progress
    const totalEvents = Math.floor(Math.random() * 50) + 10;
    
    for (let i = 0; i < totalEvents; i++) {
      if (sync.status === 'cancelled') break;

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 100));
      
      sync.eventsProcessed++;
      sync.progress = Math.floor((i + 1) / totalEvents * 100);
      
      // Randomly simulate operations
      const operation = Math.random();
      if (operation < 0.4) {
        sync.eventsCreated++;
      } else if (operation < 0.7) {
        sync.eventsUpdated++;
      } else if (operation < 0.8) {
        sync.eventsDeleted++;
      }

      this.syncJobs.set(sync.id, sync);
    }
  }

  private async performScheduledSync(): Promise<any> {
    const now = new Date();
    const connectionsToSync = Array.from(this.connections.values())
      .filter(conn => 
        conn.status === 'connected' &&
        conn.syncSettings.enabled &&
        conn.syncSettings.nextSync &&
        conn.syncSettings.nextSync <= now
      );

    for (const connection of connectionsToSync) {
      try {
        await this.scheduleSync(connection.id, 'incremental');
      } catch (error: any) {
        console.error(`Failed to schedule sync for connection ${connection.id}:`, error);
      }
    }
  }

  private updateSyncStatus(syncId: string, status: CalendarSync['status'], errorMessage?: string): void {
    const sync = this.syncJobs.get(syncId);
    if (!sync) return;

    sync.status = status;
    if (errorMessage) {
      sync.errors.push({
        error: errorMessage,
        timestamp: new Date()
      });
    }

    this.syncJobs.set(syncId, sync);
  }

  // Provider-specific sync methods (mock implementations)
  private async syncEventToProvider(event: CalendarEvent, connection: CalendarConnection): Promise<any> {
    const provider = this.providers.get(connection.providerId);
    if (!provider) {
      throw new Error(`Provider ${connection.providerId} not found`);
    }

    // Mock implementation - replace with actual provider API calls
    console.log(`Syncing event ${event.id} to ${provider.name}`);
    
    // Simulate API call delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    // Update event with external ID
    event.externalId = `ext_${randomUUID()}`;
    event.syncedAt = new Date();
  }

  private async deleteEventFromProvider(event: CalendarEvent, connection: CalendarConnection): Promise<any> {
    const provider = this.providers.get(connection.providerId);
    if (!provider) {
      throw new Error(`Provider ${connection.providerId} not found`);
    }

    // Mock implementation
    console.log(`Deleting event ${event.externalId} from ${provider.name}`);
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // System health and monitoring
  async getSystemHealth(): Promise<{
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
  }> {
    const providers = Object.fromEntries(
      Array.from(this.providers.values()).map(p => [p.id, p.status === 'active' ? 'active' : p.status])
    );

    const connections = {
      total: this.connections.size,
      active: Array.from(this.connections.values()).filter(c => c.status === 'connected').length,
      error: Array.from(this.connections.values()).filter(c => c.status === 'error').length
    };

    const syncJobs = {
      pending: Array.from(this.syncJobs.values()).filter(s => s.status === 'pending').length,
      running: Array.from(this.syncJobs.values()).filter(s => s.status === 'running').length,
      failed: Array.from(this.syncJobs.values()).filter(s => s.status === 'failed').length
    };

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    if (connections.error > 0 || syncJobs.failed > 0) {
      status = 'degraded';
    }
    if (connections.error > connections.active || syncJobs.failed > 5) {
      status = 'unhealthy';
    }

    return {
      status,
      providers: providers as Record<string, 'active' | 'error' | 'inactive'>,
      connections,
      syncJobs,
      timestamp: new Date()
    };
  }

  async shutdown(): Promise<any> {
    console.log('Shutting down Calendar Integration Service...');

    // Cancel all running sync jobs
    const runningSyncs = Array.from(this.syncJobs.values())
      .filter(sync => sync.status === 'running');
    
    for (const sync of runningSyncs) {
      await this.cancelSync(sync.id);
    }

    // Clear all data
    this.connections.clear();
    this.events.clear();
    this.syncJobs.clear();

    console.log('Calendar Integration Service shutdown complete');
  }
}

export default CalendarIntegrationService;

