import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';

// Meeting booking workflow data models
export interface BookingWorkflow {
  id: string;
  tenantId: string;
  name: string;
  description: string;
  type: 'client_meeting' | 'internal_meeting' | 'consultation' | 'review' | 'presentation' | 'custom';
  steps: BookingWorkflowStep[];
  approvalRequired: boolean;
  approvers: string[]; // user IDs
  autoApprove: {
    enabled: boolean;
    conditions: {
      duration?: { max: number }; // minutes
      timeRange?: { start: string; end: string }; // HH:mm format
      daysInAdvance?: { min: number; max: number };
      attendeeCount?: { max: number };
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
    minimumNotice: number; // hours
    maximumAdvanceBooking: number; // days
    allowWeekends: boolean;
    allowHolidays: boolean;
    businessHoursOnly: boolean;
    minimumDuration: number; // minutes
    maximumDuration: number; // minutes
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
  timeout: number; // minutes
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
    coordinates?: { latitude: number; longitude: number };
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
    duration: number; // minutes
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
    priority: number; // 1-10, 10 being highest
  }[];
  timeZone: string;
  duration: number; // minutes
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
    start: string; // HH:mm
    end: string; // HH:mm
    days: number[]; // 0-6, 0 = Sunday
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

export class MeetingBookingService extends EventEmitter {
  private workflows: Map<string, BookingWorkflow> = new Map();
  private bookings: Map<string, MeetingBooking> = new Map();
  private config: MeetingBookingConfig;

  constructor(config: Partial<MeetingBookingConfig> = {}) {
    super();
    
    this.config = {
      defaultWorkflowId: 'default-client-meeting',
      autoApprovalEnabled: true,
      maxAdvanceBookingDays: 90,
      minNoticeHours: 24,
      businessHours: {
        start: '09:00',
        end: '17:00',
        days: [1, 2, 3, 4, 5] // Monday to Friday
      },
      holidays: [],
      maxConcurrentBookings: 5,
      allowDoubleBooking: false,
      conflictResolution: 'manual',
      notificationChannels: ['email'],
      integrationSettings: {
        calendar: true,
        crm: true,
        videoConferencing: true,
        roomBooking: true
      },
      ...config
    };

    this.initializeDefaultWorkflows();
  }

  private initializeDefaultWorkflows(): void {
    // Default client meeting workflow
    const clientMeetingWorkflow: BookingWorkflow = {
      id: 'default-client-meeting',
      tenantId: 'default',
      name: 'Client Meeting Workflow',
      description: 'Standard workflow for client meetings with approval and resource booking',
      type: 'client_meeting',
      steps: [
        {
          id: 'validation',
          name: 'Validate Request',
          description: 'Validate meeting request against business rules',
          order: 1,
          type: 'validation',
          required: true,
          automated: true,
          conditions: [],
          actions: [
            {
              type: 'custom',
              config: { action: 'validate_business_rules' }
            }
          ],
          timeout: 5,
          retryAttempts: 0
        },
        {
          id: 'approval',
          name: 'Manager Approval',
          description: 'Require manager approval for client meetings',
          order: 2,
          type: 'approval',
          required: true,
          automated: false,
          conditions: [
            { field: 'duration', operator: 'greater_than', value: 60 }
          ],
          actions: [
            {
              type: 'request_approval',
              config: { approvers: ['manager'], timeout: 24 }
            }
          ],
          timeout: 1440, // 24 hours
          retryAttempts: 1
        },
        {
          id: 'resource_booking',
          name: 'Book Resources',
          description: 'Book meeting room and required resources',
          order: 3,
          type: 'integration',
          required: true,
          automated: true,
          conditions: [
            { field: 'location.type', operator: 'equals', value: 'physical' }
          ],
          actions: [
            {
              type: 'book_resource',
              config: { resourceTypes: ['room', 'equipment'] }
            }
          ],
          timeout: 10,
          retryAttempts: 2
        },
        {
          id: 'calendar_creation',
          name: 'Create Calendar Event',
          description: 'Create calendar event and send invitations',
          order: 4,
          type: 'integration',
          required: true,
          automated: true,
          conditions: [],
          actions: [
            {
              type: 'create_event',
              config: { sendInvitations: true }
            }
          ],
          timeout: 5,
          retryAttempts: 2
        },
        {
          id: 'notification',
          name: 'Send Confirmations',
          description: 'Send confirmation notifications to all parties',
          order: 5,
          type: 'notification',
          required: true,
          automated: true,
          conditions: [],
          actions: [
            {
              type: 'send_notification',
              config: { 
                template: 'confirmation',
                recipients: ['requester', 'attendees', 'approvers']
              }
            }
          ],
          timeout: 5,
          retryAttempts: 1
        }
      ],
      approvalRequired: true,
      approvers: ['manager'],
      autoApprove: {
        enabled: true,
        conditions: {
          duration: { max: 60 },
          timeRange: { start: '09:00', end: '17:00' },
          daysInAdvance: { min: 1, max: 30 },
          attendeeCount: { max: 5 },
          requesterRoles: ['advisor', 'manager']
        }
      },
      templates: {
        invitationTemplate: 'meeting_invitation',
        confirmationTemplate: 'meeting_confirmation',
        reminderTemplate: 'meeting_reminder',
        cancellationTemplate: 'meeting_cancellation'
      },
      requirements: {
        minimumNotice: 24,
        maximumAdvanceBooking: 90,
        allowWeekends: false,
        allowHolidays: false,
        businessHoursOnly: true,
        minimumDuration: 15,
        maximumDuration: 480,
        requiresApproval: true,
        requiresRoom: true,
        requiresEquipment: false
      },
      notifications: {
        sendToRequester: true,
        sendToAttendees: true,
        sendToApprovers: true,
        customRecipients: [],
        channels: ['email']
      },
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.workflows.set(clientMeetingWorkflow.id, clientMeetingWorkflow);

    // Internal meeting workflow (simpler)
    const internalMeetingWorkflow: BookingWorkflow = {
      ...clientMeetingWorkflow,
      id: 'default-internal-meeting',
      name: 'Internal Meeting Workflow',
      description: 'Simplified workflow for internal meetings',
      type: 'internal_meeting',
      approvalRequired: false,
      steps: clientMeetingWorkflow.steps.filter(step => step.id !== 'approval'),
      autoApprove: {
        enabled: true,
        conditions: {
          duration: { max: 120 },
          attendeeCount: { max: 10 }
        }
      },
      requirements: {
        ...clientMeetingWorkflow.requirements,
        requiresApproval: false,
        requiresRoom: false
      }
    };

    this.workflows.set(internalMeetingWorkflow.id, internalMeetingWorkflow);
  }

  // Workflow management
  async createWorkflow(workflowData: Omit<BookingWorkflow, 'id' | 'createdAt' | 'updatedAt'>): Promise<BookingWorkflow> {
    const workflow: BookingWorkflow = {
      id: randomUUID(),
      ...workflowData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.workflows.set(workflow.id, workflow);

    this.emit('workflowCreated', {
      workflowId: workflow.id,
      tenantId: workflow.tenantId,
      timestamp: new Date()
    });

    return workflow;
  }

  async getWorkflows(tenantId: string): Promise<BookingWorkflow[]> {
    return Array.from(this.workflows.values())
      .filter(workflow => workflow.tenantId === tenantId || workflow.tenantId === 'default');
  }

  async getWorkflow(workflowId: string): Promise<BookingWorkflow | null> {
    return this.workflows.get(workflowId) || null;
  }

  // Booking request processing
  async createBookingRequest(request: BookingRequest): Promise<MeetingBooking> {
    const workflow = this.workflows.get(request.workflowId);
    if (!workflow) {
      throw new Error(`Workflow ${request.workflowId} not found`);
    }

    // Validate request
    await this.validateBookingRequest(request, workflow);

    // Check for conflicts
    const conflicts = await this.checkBookingConflicts(request);
    if (conflicts.some(c => c.severity === 'error')) {
      throw new Error(`Booking conflicts detected: ${conflicts.map(c => c.message).join(', ')}`);
    }

    // Select best time slot
    const selectedTime = await this.selectOptimalTimeSlot(request);

    // Create booking
    const booking: MeetingBooking = {
      id: randomUUID(),
      tenantId: request.tenantId,
      workflowId: request.workflowId,
      requesterId: request.requesterId,
      clientId: request.clientId,
      title: request.title,
      description: request.description,
      type: request.type,
      startTime: selectedTime.startTime,
      endTime: selectedTime.endTime,
      timeZone: request.timeZone,
      location: request.location,
      attendees: request.attendees.map(att => ({
        id: randomUUID(),
        ...att,
        status: 'pending'
      })),
      resources: [],
      agenda: request.agenda || [],
      materials: request.materials?.map(mat => ({
        id: randomUUID(),
        ...mat,
        uploadedBy: request.requesterId,
        uploadedAt: new Date()
      })) || [],
      requirements: request.requirements || {
        catering: false,
        av_equipment: false,
        recording: false,
        interpretation: false,
        accessibility: false,
        parking: false
      },
      workflow: {
        currentStep: 0,
        completedSteps: [],
        pendingSteps: workflow.steps.map(s => s.id),
        approvals: [],
        notifications: []
      },
      status: 'draft',
      priority: request.priority,
      tags: request.tags || [],
      customFields: request.customFields || {},
      integrations: {},
      costs: {
        estimated: 0,
        currency: 'USD',
        breakdown: []
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.bookings.set(booking.id, booking);

    // Start workflow processing
    await this.processWorkflowStep(booking.id);

    this.emit('bookingCreated', {
      bookingId: booking.id,
      tenantId: booking.tenantId,
      requesterId: booking.requesterId,
      timestamp: new Date()
    });

    return booking;
  }

  private async validateBookingRequest(request: BookingRequest, workflow: BookingWorkflow): Promise<any> {
    const errors: string[] = [];

    // Check minimum notice
    const minNoticeMs = workflow.requirements.minimumNotice * 60 * 60 * 1000;
    const earliestTime = request.preferredTimes.reduce((earliest, time) => 
      time.startTime < earliest ? time.startTime : earliest, 
      request.preferredTimes[0].startTime
    );

    if (earliestTime.getTime() - Date.now() < minNoticeMs) {
      errors.push(`Minimum notice of ${workflow.requirements.minimumNotice} hours required`);
    }

    // Check maximum advance booking
    const maxAdvanceMs = workflow.requirements.maximumAdvanceBooking * 24 * 60 * 60 * 1000;
    if (earliestTime.getTime() - Date.now() > maxAdvanceMs) {
      errors.push(`Cannot book more than ${workflow.requirements.maximumAdvanceBooking} days in advance`);
    }

    // Check duration limits
    if (request.duration < workflow.requirements.minimumDuration) {
      errors.push(`Minimum duration is ${workflow.requirements.minimumDuration} minutes`);
    }

    if (request.duration > workflow.requirements.maximumDuration) {
      errors.push(`Maximum duration is ${workflow.requirements.maximumDuration} minutes`);
    }

    // Check business hours
    if (workflow.requirements.businessHoursOnly) {
      const businessStart = this.parseTime(this.config.businessHours.start);
      const businessEnd = this.parseTime(this.config.businessHours.end);

      for (const timeSlot of request.preferredTimes) {
        const startTime = { 
          hour: timeSlot.startTime.getHours(), 
          minute: timeSlot.startTime.getMinutes() 
        };
        const endTime = { 
          hour: timeSlot.endTime.getHours(), 
          minute: timeSlot.endTime.getMinutes() 
        };

        if (!this.isTimeInBusinessHours(startTime, businessStart, businessEnd) ||
            !this.isTimeInBusinessHours(endTime, businessStart, businessEnd)) {
          errors.push('Meeting times must be within business hours');
          break;
        }
      }
    }

    // Check weekends
    if (!workflow.requirements.allowWeekends) {
      for (const timeSlot of request.preferredTimes) {
        const dayOfWeek = timeSlot.startTime.getDay();
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          errors.push('Weekend meetings are not allowed');
          break;
        }
      }
    }

    // Check holidays
    if (!workflow.requirements.allowHolidays) {
      for (const timeSlot of request.preferredTimes) {
        const dateStr = timeSlot.startTime.toDateString();
        if (this.config.holidays.some(holiday => holiday.toDateString() === dateStr)) {
          errors.push('Holiday meetings are not allowed');
          break;
        }
      }
    }

    if (errors.length > 0) {
      throw new Error(`Validation failed: ${errors.join(', ')}`);
    }
  }

  private async checkBookingConflicts(request: BookingRequest): Promise<BookingConflict[]> {
    const conflicts: BookingConflict[] = [];

    // Check attendee availability
    for (const attendee of request.attendees) {
      if (attendee.type === 'required') {
        // Mock conflict check - would integrate with calendar service
        const hasConflict = Math.random() < 0.1; // 10% chance of conflict
        
        if (hasConflict) {
          conflicts.push({
            type: 'attendee_conflict',
            severity: 'error',
            message: `${attendee.name} has a scheduling conflict`,
            affectedItem: attendee.email,
            suggestions: [
              {
                action: 'change_time',
                description: 'Select a different time slot',
                alternativeTime: new Date(request.preferredTimes[0].startTime.getTime() + 60 * 60 * 1000)
              },
              {
                action: 'remove_attendee',
                description: 'Make attendee optional or remove from meeting'
              }
            ]
          });
        }
      }
    }

    // Check concurrent booking limits
    const overlappingBookings = Array.from(this.bookings.values())
      .filter(booking => 
        booking.requesterId === request.requesterId &&
        booking.status !== 'cancelled' &&
        request.preferredTimes.some(time =>
          (time.startTime >= booking.startTime && time.startTime < booking.endTime) ||
          (time.endTime > booking.startTime && time.endTime <= booking.endTime) ||
          (time.startTime <= booking.startTime && time.endTime >= booking.endTime)
        )
      );

    if (overlappingBookings.length >= this.config.maxConcurrentBookings) {
      conflicts.push({
        type: 'time_conflict',
        severity: 'error',
        message: `Maximum concurrent bookings (${this.config.maxConcurrentBookings}) exceeded`,
        affectedItem: request.requesterId,
        suggestions: [
          {
            action: 'change_time',
            description: 'Select a different time with no conflicts'
          }
        ]
      });
    }

    return conflicts;
  }

  private async selectOptimalTimeSlot(request: BookingRequest): Promise<{ startTime: Date; endTime: Date }> {
    // Sort preferred times by priority
    const sortedTimes = request.preferredTimes.sort((a, b) => b.priority - a.priority);
    
    // For now, return the highest priority time slot
    // In a real implementation, this would consider attendee availability,
    // resource availability, and other optimization factors
    const selectedSlot = sortedTimes[0];
    
    return {
      startTime: selectedSlot.startTime,
      endTime: new Date(selectedSlot.startTime.getTime() + request.duration * 60 * 1000)
    };
  }

  // Workflow processing
  private async processWorkflowStep(bookingId: string): Promise<any> {
    const booking = this.bookings.get(bookingId);
    if (!booking) return;

    const workflow = this.workflows.get(booking.workflowId);
    if (!workflow) return;

    const currentStepIndex = booking.workflow.currentStep;
    if (currentStepIndex >= workflow.steps.length) {
      // Workflow complete
      booking.status = 'confirmed';
      booking.confirmedAt = new Date();
      booking.updatedAt = new Date();
      this.bookings.set(bookingId, booking);

      this.emit('bookingConfirmed', {
        bookingId,
        tenantId: booking.tenantId,
        timestamp: new Date()
      });
      return;
    }

    const step = workflow.steps[currentStepIndex];
    
    // Check step conditions
    if (!this.evaluateStepConditions(step, booking)) {
      // Skip this step
      booking.workflow.currentStep++;
      booking.workflow.completedSteps.push(step.id);
      booking.workflow.pendingSteps = booking.workflow.pendingSteps.filter(s => s !== step.id);
      this.bookings.set(bookingId, booking);
      
      // Process next step
      await this.processWorkflowStep(bookingId);
      return;
    }

    try {
      await this.executeWorkflowStep(step, booking);
      
      // Mark step as completed
      booking.workflow.currentStep++;
      booking.workflow.completedSteps.push(step.id);
      booking.workflow.pendingSteps = booking.workflow.pendingSteps.filter(s => s !== step.id);
      booking.updatedAt = new Date();
      this.bookings.set(bookingId, booking);

      // Process next step if automated
      if (step.automated || step.type !== 'approval') {
        await this.processWorkflowStep(bookingId);
      }

    } catch (error: any) {
      console.error(`Workflow step ${step.id} failed for booking ${bookingId}:`, error);
      
      if (step.retryAttempts > 0) {
        // Implement retry logic
        setTimeout(() => {
          this.processWorkflowStep(bookingId);
        }, 5000);
      } else {
        booking.status = 'rejected';
        booking.updatedAt = new Date();
        this.bookings.set(bookingId, booking);

        this.emit('bookingRejected', {
          bookingId,
          tenantId: booking.tenantId,
          reason: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        });
      }
    }
  }

  private evaluateStepConditions(step: BookingWorkflowStep, booking: MeetingBooking): boolean {
    if (step.conditions.length === 0) return true;

    return step.conditions.every(condition => {
      const value = this.getBookingFieldValue(booking, condition.field);
      
      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'not_equals':
          return value !== condition.value;
        case 'greater_than':
          return value > condition.value;
        case 'less_than':
          return value < condition.value;
        case 'contains':
          return Array.isArray(value) ? value.includes(condition.value) : 
                 typeof value === 'string' ? value.includes(condition.value) : false;
        case 'exists':
          return value !== undefined && value !== null;
        default:
          return false;
      }
    });
  }

  private getBookingFieldValue(booking: MeetingBooking, field: string): any {
    const parts = field.split('.');
    let value: any = booking;
    
    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return undefined;
      }
    }

    // Special handling for calculated fields
    if (field === 'duration') {
      return (booking.endTime.getTime() - booking.startTime.getTime()) / (1000 * 60);
    }

    return value;
  }

  private async executeWorkflowStep(step: BookingWorkflowStep, booking: MeetingBooking): Promise<any> {
    for (const action of step.actions) {
      switch (action.type) {
        case 'send_notification':
          await this.sendNotification(booking, action.config);
          break;
        case 'request_approval':
          await this.requestApproval(booking, action.config);
          break;
        case 'book_resource':
          await this.bookResources(booking, action.config);
          break;
        case 'create_event':
          await this.createCalendarEvent(booking, action.config);
          break;
        case 'custom':
          await this.executeCustomAction(booking, action.config);
          break;
      }
    }
  }

  private async sendNotification(booking: MeetingBooking, config: any): Promise<any> {
    // Mock notification implementation
    console.log(`Sending ${config.template} notification for booking ${booking.id}`);
    
    const notification = {
      type: config.template,
      recipient: config.recipients?.[0] || 'requester',
      sent: true,
      sentAt: new Date()
    };

    booking.workflow.notifications.push(notification);
  }

  private async requestApproval(booking: MeetingBooking, config: any): Promise<any> {
    // Update booking status to pending approval
    booking.status = 'pending_approval';
    
    // Add approval request
    const approval = {
      stepId: randomUUID(),
      approverId: config.approvers?.[0] || 'manager',
      status: 'pending' as const,
      comments: undefined,
      timestamp: undefined
    };

    booking.workflow.approvals.push(approval);
    
    console.log(`Approval requested for booking ${booking.id} from ${approval.approverId}`);
  }

  private async bookResources(booking: MeetingBooking, config: any): Promise<any> {
    // Mock resource booking
    if (config.resourceTypes?.includes('room')) {
      booking.resources.push({
        type: 'room',
        id: `room_${randomUUID()}`,
        name: 'Conference Room A',
        quantity: 1,
        status: 'confirmed',
        cost: 50
      });
    }

    if (config.resourceTypes?.includes('equipment')) {
      booking.resources.push({
        type: 'equipment',
        id: `eq_${randomUUID()}`,
        name: 'Projector',
        quantity: 1,
        status: 'confirmed',
        cost: 25
      });
    }

    console.log(`Resources booked for booking ${booking.id}`);
  }

  private async createCalendarEvent(booking: MeetingBooking, config: any): Promise<any> {
    // Mock calendar event creation
    booking.integrations.calendarEventId = `cal_${randomUUID()}`;
    console.log(`Calendar event created for booking ${booking.id}`);
  }

  private async executeCustomAction(booking: MeetingBooking, config: any): Promise<any> {
    // Handle custom actions based on config
    switch (config.action) {
      case 'validate_business_rules':
        // Additional business rule validation
        console.log(`Business rules validated for booking ${booking.id}`);
        break;
      default:
        console.log(`Custom action ${config.action} executed for booking ${booking.id}`);
    }
  }

  // Approval management
  async approveBooking(bookingId: string, approverId: string, comments?: string): Promise<MeetingBooking> {
    const booking = this.bookings.get(bookingId);
    if (!booking) {
      throw new Error(`Booking ${bookingId} not found`);
    }

    // Find pending approval
    const approval = booking.workflow.approvals.find(app => 
      app.approverId === approverId && app.status === 'pending'
    );

    if (!approval) {
      throw new Error('No pending approval found for this approver');
    }

    approval.status = 'approved';
    approval.comments = comments;
    approval.timestamp = new Date();

    booking.status = 'approved';
    booking.updatedAt = new Date();
    this.bookings.set(bookingId, booking);

    // Continue workflow processing
    await this.processWorkflowStep(bookingId);

    this.emit('bookingApproved', {
      bookingId,
      approverId,
      tenantId: booking.tenantId,
      timestamp: new Date()
    });

    return booking;
  }

  async rejectBooking(bookingId: string, approverId: string, reason: string): Promise<MeetingBooking> {
    const booking = this.bookings.get(bookingId);
    if (!booking) {
      throw new Error(`Booking ${bookingId} not found`);
    }

    const approval = booking.workflow.approvals.find(app => 
      app.approverId === approverId && app.status === 'pending'
    );

    if (!approval) {
      throw new Error('No pending approval found for this approver');
    }

    approval.status = 'rejected';
    approval.comments = reason;
    approval.timestamp = new Date();

    booking.status = 'rejected';
    booking.updatedAt = new Date();
    this.bookings.set(bookingId, booking);

    this.emit('bookingRejected', {
      bookingId,
      approverId,
      tenantId: booking.tenantId,
      reason,
      timestamp: new Date()
    });

    return booking;
  }

  // Booking management
  async getBookings(tenantId: string, filters?: {
    status?: MeetingBooking['status'][];
    requesterId?: string;
    clientId?: string;
    startDate?: Date;
    endDate?: Date;
    type?: MeetingBooking['type'][];
  }): Promise<MeetingBooking[]> {
    let bookings = Array.from(this.bookings.values())
      .filter(booking => booking.tenantId === tenantId);

    if (filters) {
      if (filters.status) {
        bookings = bookings.filter(b => filters.status!.includes(b.status));
      }
      if (filters.requesterId) {
        bookings = bookings.filter(b => b.requesterId === filters.requesterId);
      }
      if (filters.clientId) {
        bookings = bookings.filter(b => b.clientId === filters.clientId);
      }
      if (filters.startDate) {
        bookings = bookings.filter(b => b.startTime >= filters.startDate!);
      }
      if (filters.endDate) {
        bookings = bookings.filter(b => b.endTime <= filters.endDate!);
      }
      if (filters.type && filters.type.length > 0) {
        bookings = bookings.filter(b => filters.type!.includes(b.type));
      }
    }

    return bookings.sort((a, b) => a.startTime.getTime() - b.startTime.getTime());
  }

  async getBooking(bookingId: string): Promise<MeetingBooking | null> {
    return this.bookings.get(bookingId) || null;
  }

  async updateBooking(bookingId: string, updates: Partial<MeetingBooking>): Promise<MeetingBooking> {
    const booking = this.bookings.get(bookingId);
    if (!booking) {
      throw new Error(`Booking ${bookingId} not found`);
    }

    const updatedBooking = {
      ...booking,
      ...updates,
      updatedAt: new Date()
    };

    this.bookings.set(bookingId, updatedBooking);

    this.emit('bookingUpdated', {
      bookingId,
      tenantId: booking.tenantId,
      updates,
      timestamp: new Date()
    });

    return updatedBooking;
  }

  async cancelBooking(bookingId: string, reason?: string): Promise<MeetingBooking> {
    const booking = this.bookings.get(bookingId);
    if (!booking) {
      throw new Error(`Booking ${bookingId} not found`);
    }

    booking.status = 'cancelled';
    booking.cancelledAt = new Date();
    booking.updatedAt = new Date();
    
    if (reason) {
      booking.customFields.cancellationReason = reason;
    }

    this.bookings.set(bookingId, booking);

    // Cancel resources and send notifications
    await this.cancelBookingResources(booking);
    await this.sendCancellationNotifications(booking);

    this.emit('bookingCancelled', {
      bookingId,
      tenantId: booking.tenantId,
      reason,
      timestamp: new Date()
    });

    return booking;
  }

  private async cancelBookingResources(booking: MeetingBooking): Promise<any> {
    // Cancel all confirmed resources
    for (const resource of booking.resources) {
      if (resource.status === 'confirmed') {
        resource.status = 'cancelled';
      }
    }

    console.log(`Resources cancelled for booking ${booking.id}`);
  }

  private async sendCancellationNotifications(booking: MeetingBooking): Promise<any> {
    // Send cancellation notifications to all attendees
    console.log(`Cancellation notifications sent for booking ${booking.id}`);
  }

  // Utility methods
  private parseTime(timeStr: string): { hour: number; minute: number } {
    const [hour, minute] = timeStr.split(':').map(Number);
    return { hour, minute };
  }

  private isTimeInBusinessHours(
    time: { hour: number; minute: number },
    businessStart: { hour: number; minute: number },
    businessEnd: { hour: number; minute: number }
  ): boolean {
    const timeMinutes = time.hour * 60 + time.minute;
    const startMinutes = businessStart.hour * 60 + businessStart.minute;
    const endMinutes = businessEnd.hour * 60 + businessEnd.minute;
    
    return timeMinutes >= startMinutes && timeMinutes <= endMinutes;
  }

  // System health and monitoring
  async getSystemHealth(): Promise<{
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
  }> {
    const workflows = {
      total: this.workflows.size,
      active: Array.from(this.workflows.values()).filter(w => w.status === 'active').length
    };

    const bookings = {
      total: this.bookings.size,
      pending: Array.from(this.bookings.values()).filter(b => b.status === 'pending_approval').length,
      confirmed: Array.from(this.bookings.values()).filter(b => b.status === 'confirmed').length,
      cancelled: Array.from(this.bookings.values()).filter(b => b.status === 'cancelled').length
    };

    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';
    
    // Simple health check based on booking success rate
    const totalProcessed = bookings.confirmed + bookings.cancelled;
    if (totalProcessed > 0) {
      const successRate = bookings.confirmed / totalProcessed;
      if (successRate < 0.7) {
        status = 'unhealthy';
      } else if (successRate < 0.9) {
        status = 'degraded';
      }
    }

    return {
      status,
      workflows,
      bookings,
      timestamp: new Date()
    };
  }

  async shutdown(): Promise<any> {
    console.log('Shutting down Meeting Booking Service...');
    
    // Cancel all pending workflows
    const pendingBookings = Array.from(this.bookings.values())
      .filter(booking => booking.status === 'pending_approval' || booking.status === 'draft');
    
    for (const booking of pendingBookings) {
      await this.cancelBooking(booking.id, 'System shutdown');
    }

    this.workflows.clear();
    this.bookings.clear();

    console.log('Meeting Booking Service shutdown complete');
  }
}

export default MeetingBookingService;

