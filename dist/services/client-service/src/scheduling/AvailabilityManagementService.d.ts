import { EventEmitter } from 'events';
export interface AvailabilityProfile {
    id: string;
    tenantId: string;
    userId: string;
    name: string;
    description?: string;
    timeZone: string;
    isDefault: boolean;
    workingHours: {
        [key: string]: {
            enabled: boolean;
            start: string;
            end: string;
            breaks: {
                start: string;
                end: string;
                title: string;
                type: 'lunch' | 'break' | 'buffer' | 'custom';
            }[];
        };
    };
    availability: {
        patterns: {
            type: 'recurring' | 'one_time' | 'blackout';
            startDate: Date;
            endDate?: Date;
            startTime: string;
            endTime: string;
            daysOfWeek: number[];
            frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly';
            title: string;
            description?: string;
            maxBookings?: number;
            minAdvanceBooking?: number;
            maxAdvanceBooking?: number;
            bufferTime?: {
                before: number;
                after: number;
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
                min: number;
                max: number;
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
            leadTime: number;
        };
        bookingSettings: {
            autoAccept: boolean;
            requireApproval: boolean;
            allowRescheduling: boolean;
            allowCancellation: boolean;
            minimumNotice: number;
            maximumAdvanceBooking: number;
            bufferBetweenMeetings: number;
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
    cost?: number;
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
    duration: number;
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
    defaultBufferTime: number;
    maxAdvanceBookingDays: number;
    minAdvanceBookingHours: number;
    slotGenerationWindow: number;
    slotDuration: number;
    maxSlotsPerQuery: number;
    cacheEnabled: boolean;
    cacheTtlMinutes: number;
    optimizationEnabled: boolean;
    allowOverlappingSlots: boolean;
}
export declare class AvailabilityManagementService extends EventEmitter {
    private profiles;
    private slots;
    private config;
    private slotCache;
    constructor(config?: Partial<AvailabilityConfig>);
    private initializeDefaultProfiles;
    private defaultProfileTemplate;
    private startSlotGenerationScheduler;
    private generateDailySlots;
    createProfile(profileData: Omit<AvailabilityProfile, 'id' | 'createdAt' | 'updatedAt'>): Promise<AvailabilityProfile>;
    createDefaultProfile(tenantId: string, userId: string, customizations?: Partial<AvailabilityProfile>): Promise<AvailabilityProfile>;
    getProfiles(tenantId: string, userId?: string): Promise<AvailabilityProfile[]>;
    getProfile(profileId: string): Promise<AvailabilityProfile | null>;
    getDefaultProfile(tenantId: string, userId: string): Promise<AvailabilityProfile | null>;
    updateProfile(profileId: string, updates: Partial<AvailabilityProfile>): Promise<AvailabilityProfile>;
    deleteProfile(profileId: string): Promise<any>;
    private generateSlotsForProfile;
    private generateSlotsFromPattern;
    private generateDaySlotsFromPattern;
    private applyAvailabilityExceptions;
    private applyException;
    private createExceptionSlots;
    private applyAvailabilityOverrides;
    private applyOverride;
    private regenerateSlotsForProfile;
    getAvailability(query: AvailabilityQuery): Promise<AvailabilityResult[]>;
    private getUserAvailability;
    private optimizeAvailabilityResults;
    private groupConsecutiveSlots;
    private mergeSlots;
    private generateRecommendations;
    getBulkAvailability(request: BulkAvailabilityRequest): Promise<AvailabilityResult[][]>;
    private applyLoadBalancing;
    bookSlot(slotId: string, bookingId: string, meetingType?: string): Promise<AvailabilitySlot>;
    releaseSlot(slotId: string, bookingId: string): Promise<AvailabilitySlot>;
    private generateCacheKey;
    private parseTime;
    private maxTime;
    private minTime;
    private compareTime;
    private timesOverlap;
    private timeOverlapsSlot;
    private slotsOverlap;
    getSystemHealth(): Promise<{
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
    }>;
    shutdown(): Promise<any>;
}
export default AvailabilityManagementService;
