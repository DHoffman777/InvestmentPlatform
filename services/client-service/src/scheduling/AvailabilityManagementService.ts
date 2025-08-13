import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';

// Availability management data models
export interface AvailabilityProfile {
  id: string;
  tenantId: string;
  userId: string;
  name: string;
  description?: string;
  timeZone: string;
  isDefault: boolean;
  workingHours: {
    [key: string]: { // day of week (0-6, 0 = Sunday)
      enabled: boolean;
      start: string; // HH:mm format
      end: string; // HH:mm format
      breaks: {
        start: string;
        end: string;
        title: string;
        type: 'lunch' | 'break' | 'buffer' | 'custom';
      }[];
    };
  };
  availability: {
    // Define regular availability patterns
    patterns: {
      type: 'recurring' | 'one_time' | 'blackout';
      startDate: Date;
      endDate?: Date;
      startTime: string; // HH:mm
      endTime: string; // HH:mm
      daysOfWeek: number[]; // 0-6
      frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
      title: string;
      description?: string;
      maxBookings?: number;
      minAdvanceBooking?: number; // hours
      maxAdvanceBooking?: number; // days
      bufferTime?: {
        before: number; // minutes
        after: number; // minutes
      };
    }[];
    exceptions: {
      id: string;
      date: Date;
      type: 'available' | 'unavailable' | 'limited';
      startTime?: string;
      endTime?: string;
      maxBookings?: number;
      reason?: string;
      title: string;
      recurring?: {
        pattern: 'weekly' | 'monthly' | 'yearly';
        until?: Date;
      };
    }[];
    // Specific time blocks that override patterns
    overrides: {
      id: string;
      startDateTime: Date;
      endDateTime: Date;
      type: 'available' | 'unavailable' | 'busy' | 'tentative';
      title: string;
      description?: string;
      maxBookings?: number;
      bookingIds?: string[];
    }[];
  };
  preferences: {
    meetingTypes: {
      type: string;
      duration: {
        min: number; // minutes
        max: number; // minutes
        default: number;
      };
      bufferTime: {
        before: number;
        after: number;
      };
      maxPerDay: number;
      allowBackToBack: boolean;
      preferredTimes?: {
        start: string;
        end: string;
      };
    }[];
    notificationSettings: {
      newBookingRequest: boolean;
      bookingConfirmation: boolean;
      bookingCancellation: boolean;
      dailySummary: boolean;
      weeklyReport: boolean;
      channels: ('email' | 'sms' | 'push' | 'slack')[];
      leadTime: number; // minutes before meeting
    };
    bookingSettings: {
      autoAccept: boolean;
      requireApproval: boolean;
      allowRescheduling: boolean;
      allowCancellation: boolean;
      minimumNotice: number; // hours
      maximumAdvanceBooking: number; // days
      bufferBetweenMeetings: number; // minutes
    };
  };
  status: 'active' | 'inactive' | 'draft';
  createdAt: Date;
  updatedAt: Date;
}

export interface AvailabilitySlot {
  id: string;
  userId: string;
  profileId: string;
  startDateTime: Date;
  endDateTime: Date;
  status: 'available' | 'booked' | 'blocked' | 'tentative';
  slotType: 'regular' | 'exception' | 'override';
  maxBookings: number;
  currentBookings: number;
  bookingIds: string[];
  meetingTypes: string[];
  bufferTime: {
    before: number;
    after: number;
  };
  cost?: number; // for paid consultations
  metadata: {
    sourceType: 'pattern' | 'exception' | 'override' | 'manual';
    sourceId?: string;
    generatedAt: Date;
    expiresAt?: Date;
  };
}

export interface AvailabilityQuery {
  userIds: string[];
  startDate: Date;
  endDate: Date;
  duration: number; // minutes
  meetingType?: string;
  timeZone?: string;
  includeUnavailable?: boolean;
  bufferTime?: {
    before: number;
    after: number;
  };
  preferences?: {
    timeOfDay?: 'morning' | 'afternoon' | 'evening';
    daysOfWeek?: number[];
    maxResults?: number;
    groupConsecutive?: boolean;
  };
}

export interface AvailabilityResult {
  userId: string;
  userName: string;
  totalAvailableSlots: number;
  slots: AvailabilitySlot[];
  conflicts: {
    startDateTime: Date;
    endDateTime: Date;
    reason: string;
    type: 'booked' | 'blocked' | 'outside_hours' | 'holiday' | 'exception';
  }[];
  nextAvailable?: Date;
  recommendations?: {
    type: 'alternative_time' | 'alternative_duration' | 'alternative_user';
    suggestion: string;
    confidence: number;
  }[];
}

export interface BulkAvailabilityRequest {
  queries: AvailabilityQuery[];
  optimization: {
    preferredUsers?: string[];
    loadBalancing: boolean;
    costOptimization: boolean;
    timeOptimization: boolean;
  };
  constraints: {
    maxResultsPerQuery: number;
    includeAlternatives: boolean;
    groupResults: boolean;
  };
}

export interface AvailabilityConfig {
  defaultTimeZone: string;
  defaultWorkingHours: {
    start: string;
    end: string;
  };
  defaultBufferTime: number; // minutes
  maxAdvanceBookingDays: number;
  minAdvanceBookingHours: number;
  slotGenerationWindow: number; // days ahead to generate slots
  slotDuration: number; // default slot duration in minutes
  maxSlotsPerQuery: number;
  cacheEnabled: boolean;
  cacheTtlMinutes: number;
  optimizationEnabled: boolean;
  allowOverlappingSlots: boolean;
}

export class AvailabilityManagementService extends EventEmitter {
  private profiles: Map<string, AvailabilityProfile> = new Map();
  private slots: Map<string, AvailabilitySlot> = new Map();
  private config: AvailabilityConfig;
  private slotCache: Map<string, { result: AvailabilityResult[]; expiry: Date }> = new Map();

  constructor(config: Partial<AvailabilityConfig> = {}) {
    super();
    
    this.config = {
      defaultTimeZone: 'UTC',
      defaultWorkingHours: {
        start: '09:00',
        end: '17:00'
      },
      defaultBufferTime: 15,
      maxAdvanceBookingDays: 90,
      minAdvanceBookingHours: 2,
      slotGenerationWindow: 30,
      slotDuration: 30,
      maxSlotsPerQuery: 100,
      cacheEnabled: true,
      cacheTtlMinutes: 15,
      optimizationEnabled: true,
      allowOverlappingSlots: false,
      ...config
    };

    this.initializeDefaultProfiles();
    this.startSlotGenerationScheduler();
  }

  private initializeDefaultProfiles(): void {
    // Create a default profile template
    const defaultProfile: Omit<AvailabilityProfile, 'id' | 'tenantId' | 'userId' | 'createdAt' | 'updatedAt'> = {
      name: 'Default Working Hours',
      description: 'Standard business hours availability',
      timeZone: this.config.defaultTimeZone,
      isDefault: true,
      workingHours: {
        '1': { // Monday
          enabled: true,
          start: '09:00',
          end: '17:00',
          breaks: [
            { start: '12:00', end: '13:00', title: 'Lunch Break', type: 'lunch' },
            { start: '15:00', end: '15:15', title: 'Afternoon Break', type: 'break' }
          ]
        },
        '2': { // Tuesday
          enabled: true,
          start: '09:00',
          end: '17:00',
          breaks: [
            { start: '12:00', end: '13:00', title: 'Lunch Break', type: 'lunch' }
          ]
        },
        '3': { // Wednesday
          enabled: true,
          start: '09:00',
          end: '17:00',
          breaks: [
            { start: '12:00', end: '13:00', title: 'Lunch Break', type: 'lunch' }
          ]
        },
        '4': { // Thursday
          enabled: true,
          start: '09:00',
          end: '17:00',
          breaks: [
            { start: '12:00', end: '13:00', title: 'Lunch Break', type: 'lunch' }
          ]
        },
        '5': { // Friday
          enabled: true,
          start: '09:00',
          end: '16:00',
          breaks: [
            { start: '12:00', end: '13:00', title: 'Lunch Break', type: 'lunch' }
          ]
        },
        '0': { // Sunday
          enabled: false,
          start: '00:00',
          end: '00:00',
          breaks: []
        },
        '6': { // Saturday
          enabled: false,
          start: '00:00',
          end: '00:00',
          breaks: []
        }
      },
      availability: {
        patterns: [
          {
            type: 'recurring',
            startDate: new Date(),
            startTime: '09:00',
            endTime: '17:00',
            daysOfWeek: [1, 2, 3, 4, 5],
            frequency: 'weekly',
            title: 'Regular Business Hours',
            description: 'Standard availability Monday through Friday',
            maxBookings: 8,
            minAdvanceBooking: 2,
            maxAdvanceBooking: 30,
            bufferTime: {
              before: 15,
              after: 15
            }
          }
        ],
        exceptions: [],
        overrides: []
      },
      preferences: {
        meetingTypes: [
          {
            type: 'consultation',
            duration: { min: 30, max: 120, default: 60 },
            bufferTime: { before: 15, after: 15 },
            maxPerDay: 4,
            allowBackToBack: false,
            preferredTimes: { start: '10:00', end: '16:00' }
          },
          {
            type: 'review',
            duration: { min: 15, max: 60, default: 30 },
            bufferTime: { before: 5, after: 10 },
            maxPerDay: 6,
            allowBackToBack: true
          }
        ],
        notificationSettings: {
          newBookingRequest: true,
          bookingConfirmation: true,
          bookingCancellation: true,
          dailySummary: true,
          weeklyReport: false,
          channels: ['email'],
          leadTime: 15
        },
        bookingSettings: {
          autoAccept: false,
          requireApproval: true,
          allowRescheduling: true,
          allowCancellation: true,
          minimumNotice: 24,
          maximumAdvanceBooking: 60,
          bufferBetweenMeetings: 15
        }
      },
      status: 'active'
    };

    // Store as template for creating user profiles
    this.defaultProfileTemplate = defaultProfile;
  }

  private defaultProfileTemplate: any;

  private startSlotGenerationScheduler(): void {
    // Generate slots daily at midnight
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const msUntilMidnight = tomorrow.getTime() - now.getTime();
    
    setTimeout(() => {
      this.generateDailySlots();
      
      // Then run every 24 hours
      setInterval(() => {
        this.generateDailySlots();
      }, 24 * 60 * 60 * 1000);
    }, msUntilMidnight);
  }

  private async generateDailySlots(): Promise<void> {
    console.log('Generating daily availability slots...');
    
    for (const profile of this.profiles.values()) {
      if (profile.status === 'active') {
        await this.generateSlotsForProfile(profile);
      }
    }
  }

  // Profile management
  async createProfile(profileData: Omit<AvailabilityProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<AvailabilityProfile> {
    // Check if user already has a default profile
    if (profileData.isDefault) {
      const existingDefault = Array.from(this.profiles.values())
        .find(p => p.tenantId === profileData.tenantId && 
                   p.userId === profileData.userId && 
                   p.isDefault);
      
      if (existingDefault) {
        existingDefault.isDefault = false;
        this.profiles.set(existingDefault.id, existingDefault);
      }
    }

    const profile: AvailabilityProfile = {
      id: randomUUID(),
      ...profileData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.profiles.set(profile.id, profile);
    
    // Generate initial slots for this profile
    await this.generateSlotsForProfile(profile);

    this.emit('profileCreated', {
      profileId: profile.id,
      tenantId: profile.tenantId,
      userId: profile.userId,
      timestamp: new Date()
    });

    return profile;
  }

  async createDefaultProfile(tenantId: string, userId: string, customizations?: Partial<AvailabilityProfile>): Promise<AvailabilityProfile> {
    const profileData = {
      ...this.defaultProfileTemplate,
      tenantId,
      userId,
      ...customizations
    };

    return this.createProfile(profileData);
  }

  async getProfiles(tenantId: string, userId?: string): Promise<AvailabilityProfile[]> {
    return Array.from(this.profiles.values())
      .filter(profile => 
        profile.tenantId === tenantId && 
        (!userId || profile.userId === userId)
      );
  }

  async getProfile(profileId: string): Promise<AvailabilityProfile | null> {
    return this.profiles.get(profileId) || null;
  }

  async getDefaultProfile(tenantId: string, userId: string): Promise<AvailabilityProfile | null> {
    return Array.from(this.profiles.values())
      .find(profile => 
        profile.tenantId === tenantId && 
        profile.userId === userId && 
        profile.isDefault
      ) || null;
  }

  async updateProfile(profileId: string, updates: Partial<AvailabilityProfile>): Promise<AvailabilityProfile> {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      throw new Error(`Profile ${profileId} not found`);
    }

    const updatedProfile = {
      ...profile,
      ...updates,
      updatedAt: new Date()
    };

    this.profiles.set(profileId, updatedProfile);
    
    // Regenerate slots if availability settings changed
    if (updates.workingHours || updates.availability) {
      await this.regenerateSlotsForProfile(updatedProfile);
    }

    this.emit('profileUpdated', {
      profileId,
      tenantId: profile.tenantId,
      userId: profile.userId,
      updates,
      timestamp: new Date()
    });

    return updatedProfile;
  }

  async deleteProfile(profileId: string): Promise<void> {
    const profile = this.profiles.get(profileId);
    if (!profile) {
      throw new Error(`Profile ${profileId} not found`);
    }

    // Remove associated slots
    const profileSlots = Array.from(this.slots.values())
      .filter(slot => slot.profileId === profileId);
    
    for (const slot of profileSlots) {
      this.slots.delete(slot.id);
    }

    this.profiles.delete(profileId);

    this.emit('profileDeleted', {
      profileId,
      tenantId: profile.tenantId,
      userId: profile.userId,
      timestamp: new Date()
    });
  }

  // Slot generation and management
  private async generateSlotsForProfile(profile: AvailabilityProfile): Promise<void> {
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + this.config.slotGenerationWindow);

    // Clear existing future slots for this profile
    const existingSlots = Array.from(this.slots.values())
      .filter(slot => 
        slot.profileId === profile.id && 
        slot.startDateTime >= startDate
      );
    
    for (const slot of existingSlots) {
      this.slots.delete(slot.id);
    }

    // Generate new slots based on availability patterns
    for (const pattern of profile.availability.patterns) {
      if (pattern.type === 'blackout') continue;
      
      await this.generateSlotsFromPattern(profile, pattern, startDate, endDate);
    }

    // Apply exceptions
    await this.applyAvailabilityExceptions(profile, startDate, endDate);

    // Apply overrides
    await this.applyAvailabilityOverrides(profile, startDate, endDate);

    console.log(`Generated slots for profile ${profile.id} (${profile.name})`);
  }

  private async generateSlotsFromPattern(
    profile: AvailabilityProfile,
    pattern: AvailabilityProfile['availability']['patterns'][0],
    startDate: Date,
    endDate: Date
  ): Promise<void> {
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      
      if (pattern.daysOfWeek.includes(dayOfWeek)) {
        const workingHours = profile.workingHours[dayOfWeek.toString()];
        
        if (workingHours && workingHours.enabled) {
          await this.generateDaySlotsFromPattern(
            profile,
            pattern,
            currentDate,
            workingHours
          );
        }
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  private async generateDaySlotsFromPattern(
    profile: AvailabilityProfile,
    pattern: AvailabilityProfile['availability']['patterns'][0],
    date: Date,
    workingHours: AvailabilityProfile['workingHours'][string]
  ): Promise<void> {
    const patternStart = this.parseTime(pattern.startTime);
    const patternEnd = this.parseTime(pattern.endTime);
    const workStart = this.parseTime(workingHours.start);
    const workEnd = this.parseTime(workingHours.end);

    // Use the more restrictive time range
    const effectiveStart = this.maxTime(patternStart, workStart);
    const effectiveEnd = this.minTime(patternEnd, workEnd);

    if (this.compareTime(effectiveStart, effectiveEnd) >= 0) return;

    // Generate slots in increments
    const slotDurationMs = this.config.slotDuration * 60 * 1000;
    let currentTime = new Date(date);
    currentTime.setHours(effectiveStart.hour, effectiveStart.minute, 0, 0);

    const endDateTime = new Date(date);
    endDateTime.setHours(effectiveEnd.hour, effectiveEnd.minute, 0, 0);

    while (currentTime < endDateTime) {
      const slotEnd = new Date(currentTime.getTime() + slotDurationMs);
      
      if (slotEnd > endDateTime) break;

      // Check if slot overlaps with breaks
      const overlapsBreak = workingHours.breaks.some(breakTime => {
        const breakStart = this.parseTime(breakTime.start);
        const breakEnd = this.parseTime(breakTime.end);
        
        return this.timesOverlap(
          { hour: currentTime.getHours(), minute: currentTime.getMinutes() },
          { hour: slotEnd.getHours(), minute: slotEnd.getMinutes() },
          breakStart,
          breakEnd
        );
      });

      if (!overlapsBreak) {
        const slot: AvailabilitySlot = {
          id: randomUUID(),
          userId: profile.userId,
          profileId: profile.id,
          startDateTime: new Date(currentTime),
          endDateTime: new Date(slotEnd),
          status: 'available',
          slotType: 'regular',
          maxBookings: pattern.maxBookings || 1,
          currentBookings: 0,
          bookingIds: [],
          meetingTypes: [], // Would be set based on pattern config
          bufferTime: pattern.bufferTime || {
            before: this.config.defaultBufferTime,
            after: this.config.defaultBufferTime
          },
          metadata: {
            sourceType: 'pattern',
            sourceId: `${pattern.type}_${pattern.frequency}`,
            generatedAt: new Date()
          }
        };

        this.slots.set(slot.id, slot);
      }

      currentTime = new Date(currentTime.getTime() + slotDurationMs);
    }
  }

  private async applyAvailabilityExceptions(
    profile: AvailabilityProfile,
    startDate: Date,
    endDate: Date
  ): Promise<void> {
    for (const exception of profile.availability.exceptions) {
      if (exception.date >= startDate && exception.date <= endDate) {
        await this.applyException(profile, exception);
      }
    }
  }

  private async applyException(
    profile: AvailabilityProfile,
    exception: AvailabilityProfile['availability']['exceptions'][0]
  ): Promise<void> {
    const daySlots = Array.from(this.slots.values())
      .filter(slot => 
        slot.profileId === profile.id &&
        slot.startDateTime.toDateString() === exception.date.toDateString()
      );

    switch (exception.type) {
      case 'unavailable':
        // Remove or block affected slots
        for (const slot of daySlots) {
          if (!exception.startTime || !exception.endTime ||
              this.timeOverlapsSlot(slot, exception.startTime, exception.endTime)) {
            slot.status = 'blocked';
          }
        }
        break;
        
      case 'limited':
        // Reduce max bookings for affected slots
        for (const slot of daySlots) {
          if (!exception.startTime || !exception.endTime ||
              this.timeOverlapsSlot(slot, exception.startTime, exception.endTime)) {
            slot.maxBookings = Math.min(slot.maxBookings, exception.maxBookings || 1);
          }
        }
        break;
        
      case 'available':
        // Add additional availability (override working hours)
        if (exception.startTime && exception.endTime) {
          await this.createExceptionSlots(profile, exception);
        }
        break;
    }
  }

  private async createExceptionSlots(
    profile: AvailabilityProfile,
    exception: AvailabilityProfile['availability']['exceptions'][0]
  ): Promise<void> {
    if (!exception.startTime || !exception.endTime) return;

    const startTime = this.parseTime(exception.startTime);
    const endTime = this.parseTime(exception.endTime);
    
    const slotDurationMs = this.config.slotDuration * 60 * 1000;
    let currentTime = new Date(exception.date);
    currentTime.setHours(startTime.hour, startTime.minute, 0, 0);

    const endDateTime = new Date(exception.date);
    endDateTime.setHours(endTime.hour, endTime.minute, 0, 0);

    while (currentTime < endDateTime) {
      const slotEnd = new Date(currentTime.getTime() + slotDurationMs);
      
      if (slotEnd > endDateTime) break;

      const slot: AvailabilitySlot = {
        id: randomUUID(),
        userId: profile.userId,
        profileId: profile.id,
        startDateTime: new Date(currentTime),
        endDateTime: new Date(slotEnd),
        status: 'available',
        slotType: 'exception',
        maxBookings: exception.maxBookings || 1,
        currentBookings: 0,
        bookingIds: [],
        meetingTypes: [],
        bufferTime: {
          before: this.config.defaultBufferTime,
          after: this.config.defaultBufferTime
        },
        metadata: {
          sourceType: 'exception',
          sourceId: exception.id,
          generatedAt: new Date()
        }
      };

      this.slots.set(slot.id, slot);
      currentTime = new Date(currentTime.getTime() + slotDurationMs);
    }
  }

  private async applyAvailabilityOverrides(
    profile: AvailabilityProfile,
    startDate: Date,
    endDate: Date
  ): Promise<void> {
    for (const override of profile.availability.overrides) {
      if (override.startDateTime <= endDate && override.endDateTime >= startDate) {
        await this.applyOverride(profile, override);
      }
    }
  }

  private async applyOverride(
    profile: AvailabilityProfile,
    override: AvailabilityProfile['availability']['overrides'][0]
  ): Promise<void> {
    // Remove existing slots that overlap with override
    const overlappingSlots = Array.from(this.slots.values())
      .filter(slot => 
        slot.profileId === profile.id &&
        this.slotsOverlap(slot, override.startDateTime, override.endDateTime)
      );

    for (const slot of overlappingSlots) {
      this.slots.delete(slot.id);
    }

    // Create override slot if available
    if (override.type === 'available') {
      const slot: AvailabilitySlot = {
        id: randomUUID(),
        userId: profile.userId,
        profileId: profile.id,
        startDateTime: override.startDateTime,
        endDateTime: override.endDateTime,
        status: 'available',
        slotType: 'override',
        maxBookings: override.maxBookings || 1,
        currentBookings: override.bookingIds?.length || 0,
        bookingIds: override.bookingIds || [],
        meetingTypes: [],
        bufferTime: {
          before: this.config.defaultBufferTime,
          after: this.config.defaultBufferTime
        },
        metadata: {
          sourceType: 'override',
          sourceId: override.id,
          generatedAt: new Date()
        }
      };

      this.slots.set(slot.id, slot);
    }
  }

  private async regenerateSlotsForProfile(profile: AvailabilityProfile): Promise<void> {
    console.log(`Regenerating slots for profile ${profile.id}...`);
    await this.generateSlotsForProfile(profile);
  }

  // Availability querying
  async getAvailability(query: AvailabilityQuery): Promise<AvailabilityResult[]> {
    const cacheKey = this.generateCacheKey(query);
    
    // Check cache first
    if (this.config.cacheEnabled && this.slotCache.has(cacheKey)) {
      const cached = this.slotCache.get(cacheKey)!;
      if (cached.expiry > new Date()) {
        return cached.result;
      }
      this.slotCache.delete(cacheKey);
    }

    const results: AvailabilityResult[] = [];

    for (const userId of query.userIds) {
      const userResult = await this.getUserAvailability(userId, query);
      results.push(userResult);
    }

    // Apply query preferences and optimizations
    const optimizedResults = await this.optimizeAvailabilityResults(results, query);

    // Cache results
    if (this.config.cacheEnabled) {
      const expiry = new Date();
      expiry.setMinutes(expiry.getMinutes() + this.config.cacheTtlMinutes);
      
      this.slotCache.set(cacheKey, {
        result: optimizedResults,
        expiry
      });
    }

    return optimizedResults;
  }

  private async getUserAvailability(userId: string, query: AvailabilityQuery): Promise<AvailabilityResult> {
    // Get user's active profiles
    const userProfiles = Array.from(this.profiles.values())
      .filter(profile => profile.userId === userId && profile.status === 'active');

    if (userProfiles.length === 0) {
      return {
        userId,
        userName: `User ${userId}`,
        totalAvailableSlots: 0,
        slots: [],
        conflicts: []
      };
    }

    // Get all slots for user within date range
    const userSlots = Array.from(this.slots.values())
      .filter(slot => 
        slot.userId === userId &&
        slot.startDateTime >= query.startDate &&
        slot.endDateTime <= query.endDate &&
        (query.includeUnavailable || slot.status === 'available')
      );

    // Filter slots by duration and meeting type
    const filteredSlots = userSlots.filter(slot => {
      const slotDuration = (slot.endDateTime.getTime() - slot.startDateTime.getTime()) / (1000 * 60);
      
      // Check duration
      if (slotDuration < query.duration) return false;
      
      // Check meeting type compatibility
      if (query.meetingType && slot.meetingTypes.length > 0) {
        if (!slot.meetingTypes.includes(query.meetingType)) return false;
      }
      
      // Apply time preferences
      if (query.preferences?.timeOfDay) {
        const hour = slot.startDateTime.getHours();
        switch (query.preferences.timeOfDay) {
          case 'morning':
            if (hour < 6 || hour >= 12) return false;
            break;
          case 'afternoon':
            if (hour < 12 || hour >= 17) return false;
            break;
          case 'evening':
            if (hour < 17 || hour >= 22) return false;
            break;
        }
      }
      
      // Apply day preferences
      if (query.preferences?.daysOfWeek) {
        const dayOfWeek = slot.startDateTime.getDay();
        if (!query.preferences.daysOfWeek.includes(dayOfWeek)) return false;
      }
      
      return true;
    });

    // Find conflicts (unavailable times in the query range)
    const conflicts = userSlots
      .filter(slot => slot.status !== 'available')
      .map(slot => ({
        startDateTime: slot.startDateTime,
        endDateTime: slot.endDateTime,
        reason: `Slot is ${slot.status}`,
        type: slot.status as 'booked' | 'blocked' | 'outside_hours' | 'holiday' | 'exception'
      }));

    // Find next available slot after query end date
    const nextAvailable = Array.from(this.slots.values())
      .filter(slot => 
        slot.userId === userId &&
        slot.startDateTime > query.endDate &&
        slot.status === 'available'
      )
      .sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime())[0]?.startDateTime;

    // Limit results
    const maxResults = Math.min(
      filteredSlots.length,
      query.preferences?.maxResults || this.config.maxSlotsPerQuery
    );

    return {
      userId,
      userName: `User ${userId}`, // Would come from user service
      totalAvailableSlots: filteredSlots.length,
      slots: filteredSlots.slice(0, maxResults),
      conflicts,
      nextAvailable
    };
  }

  private async optimizeAvailabilityResults(
    results: AvailabilityResult[],
    query: AvailabilityQuery
  ): Promise<AvailabilityResult[]> {
    if (!this.config.optimizationEnabled) return results;

    // Sort users by availability count (descending)
    results.sort((a, b) => b.totalAvailableSlots - a.totalAvailableSlots);

    // Group consecutive slots if requested
    if (query.preferences?.groupConsecutive) {
      for (const result of results) {
        result.slots = this.groupConsecutiveSlots(result.slots);
      }
    }

    // Add recommendations
    for (const result of results) {
      result.recommendations = await this.generateRecommendations(result, query);
    }

    return results;
  }

  private groupConsecutiveSlots(slots: AvailabilitySlot[]): AvailabilitySlot[] {
    if (slots.length <= 1) return slots;

    const grouped: AvailabilitySlot[] = [];
    const sortedSlots = slots.sort((a, b) => a.startDateTime.getTime() - b.startDateTime.getTime());

    let currentGroup = [sortedSlots[0]];

    for (let i = 1; i < sortedSlots.length; i++) {
      const currentSlot = sortedSlots[i];
      const lastInGroup = currentGroup[currentGroup.length - 1];

      // Check if slots are consecutive (allowing for buffer time)
      const timeDiff = currentSlot.startDateTime.getTime() - lastInGroup.endDateTime.getTime();
      const maxGap = (lastInGroup.bufferTime.after + currentSlot.bufferTime.before) * 60 * 1000;

      if (timeDiff <= maxGap) {
        currentGroup.push(currentSlot);
      } else {
        // Create merged slot for current group
        if (currentGroup.length > 1) {
          const mergedSlot = this.mergeSlots(currentGroup);
          grouped.push(mergedSlot);
        } else {
          grouped.push(currentGroup[0]);
        }
        
        currentGroup = [currentSlot];
      }
    }

    // Handle last group
    if (currentGroup.length > 1) {
      const mergedSlot = this.mergeSlots(currentGroup);
      grouped.push(mergedSlot);
    } else {
      grouped.push(currentGroup[0]);
    }

    return grouped;
  }

  private mergeSlots(slots: AvailabilitySlot[]): AvailabilitySlot {
    const firstSlot = slots[0];
    const lastSlot = slots[slots.length - 1];

    return {
      ...firstSlot,
      id: randomUUID(),
      endDateTime: lastSlot.endDateTime,
      maxBookings: slots.reduce((sum, slot) => sum + slot.maxBookings, 0),
      currentBookings: slots.reduce((sum, slot) => sum + slot.currentBookings, 0),
      bookingIds: slots.flatMap(slot => slot.bookingIds),
      metadata: {
        ...firstSlot.metadata,
        sourceType: 'manual',
        sourceId: `merged_${slots.length}_slots`
      }
    };
  }

  private async generateRecommendations(
    result: AvailabilityResult,
    query: AvailabilityQuery
  ): Promise<AvailabilityResult['recommendations']> {
    const recommendations: AvailabilityResult['recommendations'] = [];

    // Suggest alternative times if few slots available
    if (result.totalAvailableSlots < 3 && result.nextAvailable) {
      recommendations.push({
        type: 'alternative_time',
        suggestion: `Consider booking after ${result.nextAvailable.toLocaleDateString()}`,
        confidence: 0.8
      });
    }

    // Suggest shorter duration if no slots found
    if (result.totalAvailableSlots === 0 && query.duration > 30) {
      recommendations.push({
        type: 'alternative_duration',
        suggestion: `Try booking a shorter meeting (${Math.max(15, query.duration - 15)} minutes)`,
        confidence: 0.7
      });
    }

    return recommendations;
  }

  // Bulk availability querying
  async getBulkAvailability(request: BulkAvailabilityRequest): Promise<AvailabilityResult[][]> {
    const results: AvailabilityResult[][] = [];

    // Process queries in parallel for performance
    const promises = request.queries.map(query => this.getAvailability(query));
    const queryResults = await Promise.all(promises);

    for (let i = 0; i < queryResults.length; i++) {
      let result = queryResults[i];

      // Apply optimization preferences
      if (request.optimization.loadBalancing) {
        result = this.applyLoadBalancing(result);
      }

      // Limit results per query
      if (request.constraints.maxResultsPerQuery > 0) {
        result = result.map(userResult => ({
          ...userResult,
          slots: userResult.slots.slice(0, request.constraints.maxResultsPerQuery)
        }));
      }

      results.push(result);
    }

    return results;
  }

  private applyLoadBalancing(results: AvailabilityResult[]): AvailabilityResult[] {
    // Simple load balancing: distribute suggestions across users with availability
    const availableUsers = results.filter(r => r.totalAvailableSlots > 0);
    
    if (availableUsers.length <= 1) return results;

    // Sort by current booking load (fewer bookings first)
    availableUsers.sort((a, b) => {
      const aBookings = a.slots.reduce((sum, slot) => sum + slot.currentBookings, 0);
      const bBookings = b.slots.reduce((sum, slot) => sum + slot.currentBookings, 0);
      return aBookings - bBookings;
    });

    return availableUsers;
  }

  // Slot booking management
  async bookSlot(slotId: string, bookingId: string, meetingType?: string): Promise<AvailabilitySlot> {
    const slot = this.slots.get(slotId);
    if (!slot) {
      throw new Error(`Slot ${slotId} not found`);
    }

    if (slot.status !== 'available') {
      throw new Error(`Slot ${slotId} is not available (status: ${slot.status})`);
    }

    if (slot.currentBookings >= slot.maxBookings) {
      throw new Error(`Slot ${slotId} is fully booked`);
    }

    // Check meeting type compatibility
    if (meetingType && slot.meetingTypes.length > 0 && !slot.meetingTypes.includes(meetingType)) {
      throw new Error(`Slot ${slotId} does not support meeting type: ${meetingType}`);
    }

    slot.currentBookings++;
    slot.bookingIds.push(bookingId);

    if (slot.currentBookings >= slot.maxBookings) {
      slot.status = 'booked';
    }

    this.slots.set(slotId, slot);

    this.emit('slotBooked', {
      slotId,
      bookingId,
      userId: slot.userId,
      startDateTime: slot.startDateTime,
      timestamp: new Date()
    });

    return slot;
  }

  async releaseSlot(slotId: string, bookingId: string): Promise<AvailabilitySlot> {
    const slot = this.slots.get(slotId);
    if (!slot) {
      throw new Error(`Slot ${slotId} not found`);
    }

    const bookingIndex = slot.bookingIds.indexOf(bookingId);
    if (bookingIndex === -1) {
      throw new Error(`Booking ${bookingId} not found in slot ${slotId}`);
    }

    slot.bookingIds.splice(bookingIndex, 1);
    slot.currentBookings = Math.max(0, slot.currentBookings - 1);

    if (slot.currentBookings < slot.maxBookings && slot.status === 'booked') {
      slot.status = 'available';
    }

    this.slots.set(slotId, slot);

    this.emit('slotReleased', {
      slotId,
      bookingId,
      userId: slot.userId,
      startDateTime: slot.startDateTime,
      timestamp: new Date()
    });

    return slot;
  }

  // Utility methods
  private generateCacheKey(query: AvailabilityQuery): string {
    return `${query.userIds.join(',')}_${query.startDate.getTime()}_${query.endDate.getTime()}_${query.duration}_${query.meetingType || 'any'}`;
  }

  private parseTime(timeStr: string): { hour: number; minute: number } {
    const [hour, minute] = timeStr.split(':').map(Number);
    return { hour, minute };
  }

  private maxTime(a: { hour: number; minute: number }, b: { hour: number; minute: number }): { hour: number; minute: number } {
    return this.compareTime(a, b) >= 0 ? a : b;
  }

  private minTime(a: { hour: number; minute: number }, b: { hour: number; minute: number }): { hour: number; minute: number } {
    return this.compareTime(a, b) <= 0 ? a : b;
  }

  private compareTime(a: { hour: number; minute: number }, b: { hour: number; minute: number }): number {
    const aMinutes = a.hour * 60 + a.minute;
    const bMinutes = b.hour * 60 + b.minute;
    return aMinutes - bMinutes;
  }

  private timesOverlap(
    start1: { hour: number; minute: number },
    end1: { hour: number; minute: number },
    start2: { hour: number; minute: number },
    end2: { hour: number; minute: number }
  ): boolean {
    const start1Minutes = start1.hour * 60 + start1.minute;
    const end1Minutes = end1.hour * 60 + end1.minute;
    const start2Minutes = start2.hour * 60 + start2.minute;
    const end2Minutes = end2.hour * 60 + end2.minute;

    return start1Minutes < end2Minutes && end1Minutes > start2Minutes;
  }

  private timeOverlapsSlot(slot: AvailabilitySlot, startTime: string, endTime: string): boolean {
    const slotStart = { hour: slot.startDateTime.getHours(), minute: slot.startDateTime.getMinutes() };
    const slotEnd = { hour: slot.endDateTime.getHours(), minute: slot.endDateTime.getMinutes() };
    const exceptionStart = this.parseTime(startTime);
    const exceptionEnd = this.parseTime(endTime);

    return this.timesOverlap(slotStart, slotEnd, exceptionStart, exceptionEnd);
  }

  private slotsOverlap(slot: AvailabilitySlot, startDateTime: Date, endDateTime: Date): boolean {
    return slot.startDateTime < endDateTime && slot.endDateTime > startDateTime;
  }

  // System health and monitoring
  async getSystemHealth(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy';
    profiles: {
      total: number;
      active: number;
    };
    slots: {
      total: number;
      available: number;
      booked: number;
      blocked: number;
    };
    cache: {
      entries: number;
      hitRate?: number;
    };
    timestamp: Date;
  }> {
    const profiles = {
      total: this.profiles.size,
      active: Array.from(this.profiles.values()).filter(p => p.status === 'active').length
    };

    const slots = {
      total: this.slots.size,
      available: Array.from(this.slots.values()).filter(s => s.status === 'available').length,
      booked: Array.from(this.slots.values()).filter(s => s.status === 'booked').length,
      blocked: Array.from(this.slots.values()).filter(s => s.status === 'blocked').length
    };

    const cache = {
      entries: this.slotCache.size
    };

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    // Simple health check
    if (profiles.active === 0) {
      status = 'unhealthy';
    } else if (slots.available < slots.total * 0.1) {
      status = 'degraded';
    }

    return {
      status,
      profiles,
      slots,
      cache,
      timestamp: new Date()
    };
  }

  async shutdown(): Promise<void> {
    console.log('Shutting down Availability Management Service...');
    
    // Clear all data
    this.profiles.clear();
    this.slots.clear();
    this.slotCache.clear();

    console.log('Availability Management Service shutdown complete');
  }
}

export default AvailabilityManagementService;