import { EventEmitter } from 'events';
export interface BookingWorkflow {
    id: string;
    tenantId: string;
    name: string;
    description: string;
    type: 'client_meeting' | 'internal_meeting' | 'consultation' | 'review' | 'presentation' | 'custom';
    steps: BookingWorkflowStep[];
    approvalRequired: boolean;
    approvers: string[];
    autoApprove: {
        enabled: boolean;
        conditions: {
            duration?: {
                max: number;
            };
            timeRange?: {
                start: string;
                end: string;
            };
            daysInAdvance?: {
                min: number;
                max: number;
            };
            attendeeCount?: {
                max: number;
            };
            requesterRoles?: string[];
        };
    };
    templates: {
        invitationTemplate: string;
        confirmationTemplate: string;
        reminderTemplate: string;
        cancellationTemplate: string;
    };
    requirements: {
        minimumNotice: number;
        maximumAdvanceBooking: number;
        allowWeekends: boolean;
        allowHolidays: boolean;
        businessHoursOnly: boolean;
        minimumDuration: number;
        maximumDuration: number;
        requiresApproval: boolean;
        requiresRoom: boolean;
        requiresEquipment: boolean;
    };
    notifications: {
        sendToRequester: boolean;
        sendToAttendees: boolean;
        sendToApprovers: boolean;
        customRecipients: string[];
        channels: ('email' | 'sms' | 'push' | 'slack')[];
    };
    status: 'active' | 'inactive' | 'draft';
    createdAt: Date;
    updatedAt: Date;
}
export interface BookingWorkflowStep {
    id: string;
    name: string;
    description: string;
    order: number;
    type: 'validation' | 'approval' | 'notification' | 'integration' | 'custom';
    required: boolean;
    automated: boolean;
    conditions: {
        field: string;
        operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'exists';
        value: any;
    }[];
    actions: {
        type: 'send_notification' | 'request_approval' | 'book_resource' | 'create_event' | 'custom';
        config: Record<string, any>;
    }[];
    timeout: number;
    retryAttempts: number;
}
export interface MeetingBooking {
    id: string;
    tenantId: string;
    workflowId: string;
    requesterId: string;
    clientId?: string;
    title: string;
    description?: string;
    type: 'client_meeting' | 'internal_meeting' | 'consultation' | 'review' | 'presentation' | 'custom';
    startTime: Date;
    endTime: Date;
    timeZone: string;
    location?: {
        type: 'physical' | 'virtual' | 'hybrid';
        address?: string;
        room?: string;
        coordinates?: {
            latitude: number;
            longitude: number;
        };
        virtual?: {
            platform: 'zoom' | 'teams' | 'webex' | 'google_meet' | 'custom';
            meetingId?: string;
            joinUrl?: string;
            passcode?: string;
            dialIn?: string;
        };
    };
    attendees: {
        id: string;
        email: string;
        name: string;
        type: 'required' | 'optional' | 'organizer';
        status: 'pending' | 'accepted' | 'declined' | 'tentative';
        responseTime?: Date;
        role?: string;
        isExternal: boolean;
    }[];
    resources: {
        type: 'room' | 'equipment' | 'catering' | 'parking' | 'custom';
        id: string;
        name: string;
        quantity: number;
        status: 'requested' | 'confirmed' | 'unavailable' | 'cancelled';
        cost?: number;
    }[];
    agenda: {
        item: string;
        duration: number;
        presenter?: string;
        materials?: string[];
    }[];
    materials: {
        id: string;
        name: string;
        type: 'document' | 'presentation' | 'spreadsheet' | 'link' | 'other';
        url?: string;
        size?: number;
        uploadedBy: string;
        uploadedAt: Date;
    }[];
    requirements: {
        catering: boolean;
        av_equipment: boolean;
        recording: boolean;
        interpretation: boolean;
        accessibility: boolean;
        parking: boolean;
        customRequirements?: string[];
    };
    workflow: {
        currentStep: number;
        completedSteps: string[];
        pendingSteps: string[];
        approvals: {
            stepId: string;
            approverId: string;
            status: 'pending' | 'approved' | 'rejected';
            comments?: string;
            timestamp?: Date;
        }[];
        notifications: {
            type: string;
            recipient: string;
            sent: boolean;
            sentAt?: Date;
            error?: string;
        }[];
    };
    status: 'draft' | 'pending_approval' | 'approved' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';
    priority: 'low' | 'normal' | 'high' | 'urgent';
    tags: string[];
    customFields: Record<string, any>;
    integrations: {
        calendarEventId?: string;
        crmId?: string;
        taskId?: string;
        recordingId?: string;
    };
    costs: {
        estimated: number;
        actual?: number;
        currency: string;
        breakdown: {
            category: string;
            amount: number;
            description?: string;
        }[];
    };
    createdAt: Date;
    updatedAt: Date;
    confirmedAt?: Date;
    cancelledAt?: Date;
}
export interface BookingRequest {
    tenantId: string;
    workflowId: string;
    requesterId: string;
    clientId?: string;
    title: string;
    description?: string;
    type: MeetingBooking['type'];
    preferredTimes: {
        startTime: Date;
        endTime: Date;
        priority: number;
    }[];
    timeZone: string;
    duration: number;
    attendees: {
        email: string;
        name: string;
        type: 'required' | 'optional';
        role?: string;
        isExternal: boolean;
    }[];
    location?: MeetingBooking['location'];
    requirements?: MeetingBooking['requirements'];
    agenda?: MeetingBooking['agenda'];
    materials?: Omit<MeetingBooking['materials'][0], 'id' | 'uploadedBy' | 'uploadedAt'>[];
    priority: MeetingBooking['priority'];
    tags?: string[];
    customFields?: Record<string, any>;
}
export interface BookingConflict {
    type: 'attendee_conflict' | 'resource_conflict' | 'time_conflict' | 'policy_violation';
    severity: 'error' | 'warning' | 'info';
    message: string;
    affectedItem: string;
    suggestions: {
        action: 'change_time' | 'remove_attendee' | 'change_resource' | 'override';
        description: string;
        alternativeTime?: Date;
        alternativeResource?: string;
    }[];
}
export interface MeetingBookingConfig {
    defaultWorkflowId: string;
    autoApprovalEnabled: boolean;
    maxAdvanceBookingDays: number;
    minNoticeHours: number;
    businessHours: {
        start: string;
        end: string;
        days: number[];
    };
    holidays: Date[];
    maxConcurrentBookings: number;
    allowDoubleBooking: boolean;
    conflictResolution: 'manual' | 'auto_reschedule' | 'auto_decline';
    notificationChannels: ('email' | 'sms' | 'push' | 'slack')[];
    integrationSettings: {
        calendar: boolean;
        crm: boolean;
        videoConferencing: boolean;
        roomBooking: boolean;
    };
}
export declare class MeetingBookingService extends EventEmitter {
    private workflows;
    private bookings;
    private config;
    constructor(config?: Partial<MeetingBookingConfig>);
    private initializeDefaultWorkflows;
    createWorkflow(workflowData: Omit<BookingWorkflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<BookingWorkflow>;
    getWorkflows(tenantId: string): Promise<BookingWorkflow[]>;
    getWorkflow(workflowId: string): Promise<BookingWorkflow | null>;
    createBookingRequest(request: BookingRequest): Promise<MeetingBooking>;
    private validateBookingRequest;
    private checkBookingConflicts;
    private selectOptimalTimeSlot;
    private processWorkflowStep;
    private evaluateStepConditions;
    private getBookingFieldValue;
    private executeWorkflowStep;
    private sendNotification;
    private requestApproval;
    private bookResources;
    private createCalendarEvent;
    private executeCustomAction;
    approveBooking(bookingId: string, approverId: string, comments?: string): Promise<MeetingBooking>;
    rejectBooking(bookingId: string, approverId: string, reason: string): Promise<MeetingBooking>;
    getBookings(tenantId: string, filters?: {
        status?: MeetingBooking['status'][];
        requesterId?: string;
        clientId?: string;
        startDate?: Date;
        endDate?: Date;
        type?: MeetingBooking['type'][];
    }): Promise<MeetingBooking[]>;
    getBooking(bookingId: string): Promise<MeetingBooking | null>;
    updateBooking(bookingId: string, updates: Partial<MeetingBooking>): Promise<MeetingBooking>;
    cancelBooking(bookingId: string, reason?: string): Promise<MeetingBooking>;
    private cancelBookingResources;
    private sendCancellationNotifications;
    private parseTime;
    private isTimeInBusinessHours;
    getSystemHealth(): Promise<{
        status: 'healthy' | 'degraded' | 'unhealthy';
        workflows: {
            total: number;
            active: number;
        };
        bookings: {
            total: number;
            pending: number;
            confirmed: number;
            cancelled: number;
        };
        timestamp: Date;
    }>;
    shutdown(): Promise<any>;
}
export default MeetingBookingService;
