import { EventEmitter } from 'events';
// Mock socket.io types for compilation
class SocketIOServer {
  sockets: { 
    size: number;
    sockets: Map<string, Socket>;
  } = { 
    size: 0,
    sockets: new Map()
  };
  
  constructor(httpServer: any, options?: any) {
    // Mock constructor
  }
  on(event: string, listener: Function): void {}
  emit(event: string, ...args: any[]): void {}
  to(room: string): { emit(event: string, ...args: any[]): void } {
    return { emit: () => {} };
  }
  close(): void {}
}

interface Socket {
  id: string;
  join(room: string): void;
  leave(room: string): void;
  emit(event: string, ...args: any[]): void;
  on(event: string, listener: Function): void;
  disconnect(): void;
}

import { Server as HTTPServer } from 'http';
import { randomUUID } from 'crypto';
import { ActivityData, ActivityFilter, ActivitySeverity, ActivityType } from './ActivityTrackingService';

export interface StreamSubscription {
  id: string;
  userId: string;
  tenantId: string;
  filter: ActivityFilter;
  socketId: string;
  createdAt: Date;
  lastActivity: Date;
  messageCount: number;
  isActive: boolean;
}

export interface StreamMessage {
  id: string;
  type: StreamMessageType;
  timestamp: Date;
  data: any;
  subscriptionId: string;
  correlationId?: string;
}

export enum StreamMessageType {
  ACTIVITY_CREATED = 'activity_created',
  ACTIVITY_UPDATED = 'activity_updated',
  PATTERN_MATCHED = 'pattern_matched',
  SUSPICIOUS_ACTIVITY = 'suspicious_activity',
  COMPLIANCE_VIOLATION = 'compliance_violation',
  SESSION_STARTED = 'session_started',
  SESSION_ENDED = 'session_ended',
  SYSTEM_ALERT = 'system_alert',
  REAL_TIME_METRICS = 'real_time_metrics'
}

export interface RealTimeMetrics {
  timestamp: Date;
  activeUsers: number;
  activeSessions: number;
  activitiesPerMinute: number;
  suspiciousActivitiesPerMinute: number;
  topActivityTypes: Array<{ type: ActivityType; count: number }>;
  riskDistribution: Record<ActivitySeverity, number>;
  complianceViolations: number;
}

export interface StreamingConfig {
  enableRealTimeMetrics: boolean;
  metricsInterval: number;
  maxSubscriptionsPerUser: number;
  messageRetentionTime: number;
  enableMessagePersistence: boolean;
  enableCompression: boolean;
  rateLimitPerMinute: number;
}

export class ActivityStreamingService extends EventEmitter {
  private io: SocketIOServer;
  private subscriptions: Map<string, StreamSubscription> = new Map();
  private userSubscriptions: Map<string, Set<string>> = new Map();
  private messageBuffer: Map<string, StreamMessage[]> = new Map();
  private metricsInterval: NodeJS.Timeout | null = null;
  private config: StreamingConfig;
  private rateLimitMap: Map<string, number[]> = new Map();

  private getErrorMessage(error: unknown): string {
    if ((error as any) instanceof Error) {
      return this.getErrorMessage(error);
    }
    return String(error);
  }

  constructor(httpServer: HTTPServer, config: Partial<StreamingConfig> = {}) {
    super();
    
    this.config = {
      enableRealTimeMetrics: true,
      metricsInterval: 5000, // 5 seconds
      maxSubscriptionsPerUser: 10,
      messageRetentionTime: 24 * 60 * 60 * 1000, // 24 hours
      enableMessagePersistence: true,
      enableCompression: true,
      rateLimitPerMinute: 100,
      ...config
    };

    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      },
      compression: this.config.enableCompression,
      transports: ['websocket', 'polling']
    });

    this.setupSocketHandlers();
    this.startMetricsStreaming();
    this.startCleanupTimer();
  }

  public async subscribe(
    userId: string,
    tenantId: string,
    socketId: string,
    filter: ActivityFilter = {}
  ): Promise<StreamSubscription> {
    // Check rate limiting
    if (!this.checkRateLimit(userId)) {
      throw new Error('Rate limit exceeded');
    }

    // Check subscription limits
    const userSubs = this.userSubscriptions.get(userId) || new Set();
    if (userSubs.size >= this.config.maxSubscriptionsPerUser) {
      throw new Error('Maximum subscriptions reached');
    }

    const subscription: StreamSubscription = {
      id: randomUUID(),
      userId,
      tenantId,
      filter,
      socketId,
      createdAt: new Date(),
      lastActivity: new Date(),
      messageCount: 0,
      isActive: true
    };

    this.subscriptions.set(subscription.id, subscription);
    userSubs.add(subscription.id);
    this.userSubscriptions.set(userId, userSubs);

    // Initialize message buffer if persistence is enabled
    if (this.config.enableMessagePersistence) {
      this.messageBuffer.set(subscription.id, []);
    }

    this.emit('subscriptionCreated', subscription);
    return subscription;
  }

  public async unsubscribe(subscriptionId: string): Promise<boolean> {
    const subscription = this.subscriptions.get(subscriptionId);
    if (!subscription) return false;

    // Remove from user subscriptions
    const userSubs = this.userSubscriptions.get(subscription.userId);
    if (userSubs) {
      userSubs.delete(subscriptionId);
      if (userSubs.size === 0) {
        this.userSubscriptions.delete(subscription.userId);
      }
    }

    // Remove subscription and buffer
    this.subscriptions.delete(subscriptionId);
    this.messageBuffer.delete(subscriptionId);

    this.emit('subscriptionRemoved', subscription);
    return true;
  }

  public async broadcastActivity(activity: ActivityData): Promise<any> {
    const message: StreamMessage = {
      id: randomUUID(),
      type: StreamMessageType.ACTIVITY_CREATED,
      timestamp: new Date(),
      data: activity,
      subscriptionId: '', // Will be set per subscription
      correlationId: activity.correlationId
    };

    const matchingSubscriptions = this.findMatchingSubscriptions(activity);
    
    for (const subscription of matchingSubscriptions) {
      await this.sendMessage(subscription, {
        ...message,
        subscriptionId: subscription.id
      });
    }
  }

  public async broadcastPatternMatch(pattern: any, activity: ActivityData): Promise<any> {
    const message: StreamMessage = {
      id: randomUUID(),
      type: StreamMessageType.PATTERN_MATCHED,
      timestamp: new Date(),
      data: { pattern, activity },
      subscriptionId: '',
      correlationId: activity.correlationId
    };

    const matchingSubscriptions = this.findMatchingSubscriptions(activity);
    
    for (const subscription of matchingSubscriptions) {
      await this.sendMessage(subscription, {
        ...message,
        subscriptionId: subscription.id
      });
    }
  }

  public async broadcastSuspiciousActivity(activity: ActivityData): Promise<any> {
    const message: StreamMessage = {
      id: randomUUID(),
      type: StreamMessageType.SUSPICIOUS_ACTIVITY,
      timestamp: new Date(),
      data: activity,
      subscriptionId: '',
      correlationId: activity.correlationId
    };

    // Send to all subscriptions for suspicious activities
    const allSubscriptions = Array.from(this.subscriptions.values())
      .filter(sub => sub.isActive);
    
    for (const subscription of allSubscriptions) {
      await this.sendMessage(subscription, {
        ...message,
        subscriptionId: subscription.id
      });
    }
  }

  public async broadcastComplianceViolation(activity: ActivityData): Promise<any> {
    const message: StreamMessage = {
      id: randomUUID(),
      type: StreamMessageType.COMPLIANCE_VIOLATION,
      timestamp: new Date(),
      data: activity,
      subscriptionId: '',
      correlationId: activity.correlationId
    };

    // Send to compliance-focused subscriptions
    const complianceSubscriptions = Array.from(this.subscriptions.values())
      .filter(sub => sub.isActive && this.isComplianceSubscription(sub));
    
    for (const subscription of complianceSubscriptions) {
      await this.sendMessage(subscription, {
        ...message,
        subscriptionId: subscription.id
      });
    }
  }

  public async broadcastSystemAlert(alertType: string, data: any): Promise<any> {
    const message: StreamMessage = {
      id: randomUUID(),
      type: StreamMessageType.SYSTEM_ALERT,
      timestamp: new Date(),
      data: { alertType, data },
      subscriptionId: ''
    };

    // Send to all active subscriptions
    const allSubscriptions = Array.from(this.subscriptions.values())
      .filter(sub => sub.isActive);
    
    for (const subscription of allSubscriptions) {
      await this.sendMessage(subscription, {
        ...message,
        subscriptionId: subscription.id
      });
    }
  }

  public async getSubscriptionStats(): Promise<{
    totalSubscriptions: number;
    activeSubscriptions: number;
    subscriptionsByUser: Record<string, number>;
    messagesSent: number;
  }> {
    const totalSubscriptions = this.subscriptions.size;
    const activeSubscriptions = Array.from(this.subscriptions.values())
      .filter(sub => sub.isActive).length;

    const subscriptionsByUser: Record<string, number> = {};
    for (const [userId, subIds] of this.userSubscriptions) {
      subscriptionsByUser[userId] = subIds.size;
    }

    const messagesSent = Array.from(this.subscriptions.values())
      .reduce((sum, sub) => sum + sub.messageCount, 0);

    return {
      totalSubscriptions,
      activeSubscriptions,
      subscriptionsByUser,
      messagesSent
    };
  }

  public async getSubscription(subscriptionId: string): Promise<StreamSubscription | undefined> {
    return this.subscriptions.get(subscriptionId);
  }

  public async getUserSubscriptions(userId: string): Promise<StreamSubscription[]> {
    const subscriptionIds = this.userSubscriptions.get(userId) || new Set();
    return Array.from(subscriptionIds)
      .map(id => this.subscriptions.get(id))
      .filter(Boolean) as StreamSubscription[];
  }

  public async getMessageHistory(subscriptionId: string, limit: number = 100): Promise<StreamMessage[]> {
    if (!this.config.enableMessagePersistence) {
      return [];
    }

    const messages = this.messageBuffer.get(subscriptionId) || [];
    return messages
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, limit);
  }

  private setupSocketHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);

      socket.on('subscribe', async (data: {
        userId: string;
        tenantId: string;
        filter?: ActivityFilter;
      }) => {
        try {
          const subscription = await this.subscribe(
            data.userId,
            data.tenantId,
            socket.id,
            data.filter || {}
          );

          socket.emit('subscriptionCreated', {
            subscriptionId: subscription.id,
            message: 'Successfully subscribed to activity stream'
          });

          socket.join(`tenant:${data.tenantId}`);
          socket.join(`user:${data.userId}`);
          socket.join(`subscription:${subscription.id}`);

        } catch (error: any) {
          socket.emit('subscriptionError', {
            error: this.getErrorMessage(error)
          });
        }
      });

      socket.on('unsubscribe', async (data: { subscriptionId: string }) => {
        try {
          const success = await this.unsubscribe(data.subscriptionId);
          socket.emit('unsubscribed', {
            subscriptionId: data.subscriptionId,
            success
          });

          socket.leave(`subscription:${data.subscriptionId}`);
        } catch (error: any) {
          socket.emit('unsubscribeError', {
            error: this.getErrorMessage(error)
          });
        }
      });

      socket.on('getHistory', async (data: {
        subscriptionId: string;
        limit?: number;
      }) => {
        try {
          const history = await this.getMessageHistory(
            data.subscriptionId,
            data.limit || 100
          );

          socket.emit('messageHistory', {
            subscriptionId: data.subscriptionId,
            messages: history
          });
        } catch (error: any) {
          socket.emit('historyError', {
            error: this.getErrorMessage(error)
          });
        }
      });

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
        this.cleanupSocketSubscriptions(socket.id);
      });
    });
  }

  private async sendMessage(subscription: StreamSubscription, message: StreamMessage): Promise<any> {
    if (!subscription.isActive) return;

    const socket = this.io.sockets.sockets.get(subscription.socketId);
    if (!socket) {
      subscription.isActive = false;
      return;
    }

    try {
      socket.emit('activityMessage', message);
      
      subscription.messageCount++;
      subscription.lastActivity = new Date();

      // Store message in buffer if persistence is enabled
      if (this.config.enableMessagePersistence) {
        const buffer = this.messageBuffer.get(subscription.id) || [];
        buffer.push(message);
        
        // Keep only recent messages
        const cutoff = new Date(Date.now() - this.config.messageRetentionTime);
        const filteredBuffer = buffer.filter(msg => msg.timestamp > cutoff);
        this.messageBuffer.set(subscription.id, filteredBuffer);
      }

    } catch (error: any) {
      console.error('Error sending message:', error);
      subscription.isActive = false;
    }
  }

  private findMatchingSubscriptions(activity: ActivityData): StreamSubscription[] {
    return Array.from(this.subscriptions.values())
      .filter(subscription => {
        if (!subscription.isActive) return false;
        return this.matchesFilter(activity, subscription.filter);
      });
  }

  private matchesFilter(activity: ActivityData, filter: ActivityFilter): boolean {
    if (filter.userId && activity.userId !== filter.userId) return false;
    if (filter.tenantId && activity.tenantId !== filter.tenantId) return false;
    
    if (filter.activityType?.length && 
        !filter.activityType.includes(activity.activityType)) return false;
    
    if (filter.activityCategory?.length && 
        !filter.activityCategory.includes(activity.activityCategory)) return false;
    
    if (filter.severity?.length && 
        !filter.severity.includes(activity.severity)) return false;
    
    if (filter.startDate && activity.timestamp < filter.startDate) return false;
    if (filter.endDate && activity.timestamp > filter.endDate) return false;
    
    if (filter.ipAddress && activity.ipAddress !== filter.ipAddress) return false;
    
    if (filter.resource && !activity.resource.includes(filter.resource)) return false;
    
    if (filter.tags?.length && 
        !filter.tags.some(tag => activity.tags.includes(tag))) return false;
    
    if (filter.riskScoreMin !== undefined && 
        (activity.riskScore || 0) < filter.riskScoreMin) return false;
    
    if (filter.riskScoreMax !== undefined && 
        (activity.riskScore || 0) > filter.riskScoreMax) return false;
    
    if (filter.sensitiveData !== undefined && 
        activity.sensitiveData !== filter.sensitiveData) return false;
    
    if (filter.complianceFlags?.length && 
        !filter.complianceFlags.some(flag => activity.complianceFlags?.includes(flag))) return false;

    return true;
  }

  private isComplianceSubscription(subscription: StreamSubscription): boolean {
    return (subscription.filter.complianceFlags?.length ?? 0) > 0 ||
           subscription.filter.activityType?.includes(ActivityType.COMPLIANCE) ||
           subscription.filter.tags?.some(tag => tag.includes('compliance')) || false;
  }

  private checkRateLimit(userId: string): boolean {
    const now = Date.now();
    const userRequests = this.rateLimitMap.get(userId) || [];
    
    // Filter requests from the last minute
    const recentRequests = userRequests.filter(time => now - time < 60000);
    
    if (recentRequests.length >= this.config.rateLimitPerMinute) {
      return false;
    }
    
    recentRequests.push(now);
    this.rateLimitMap.set(userId, recentRequests);
    return true;
  }

  private startMetricsStreaming(): void {
    if (!this.config.enableRealTimeMetrics) return;

    this.metricsInterval = setInterval(async () => {
      try {
        const metrics = await this.generateRealTimeMetrics();
        await this.broadcastMetrics(metrics);
      } catch (error: any) {
        console.error('Error generating real-time metrics:', error);
      }
    }, this.config.metricsInterval);
  }

  private async generateRealTimeMetrics(): Promise<RealTimeMetrics> {
    // In production, this would pull from the activity service
    const now = new Date();
    const oneMinuteAgo = new Date(now.getTime() - 60000);

    return {
      timestamp: now,
      activeUsers: this.userSubscriptions.size,
      activeSessions: Array.from(this.subscriptions.values())
        .filter(sub => sub.isActive).length,
      activitiesPerMinute: 0, // Would be calculated from recent activities
      suspiciousActivitiesPerMinute: 0,
      topActivityTypes: [],
      riskDistribution: {
        [ActivitySeverity.LOW]: 0,
        [ActivitySeverity.MEDIUM]: 0,
        [ActivitySeverity.HIGH]: 0,
        [ActivitySeverity.CRITICAL]: 0
      },
      complianceViolations: 0
    };
  }

  private async broadcastMetrics(metrics: RealTimeMetrics): Promise<any> {
    const message: StreamMessage = {
      id: randomUUID(),
      type: StreamMessageType.REAL_TIME_METRICS,
      timestamp: new Date(),
      data: metrics,
      subscriptionId: ''
    };

    // Send metrics to all active subscriptions
    const activeSubscriptions = Array.from(this.subscriptions.values())
      .filter(sub => sub.isActive);
    
    for (const subscription of activeSubscriptions) {
      await this.sendMessage(subscription, {
        ...message,
        subscriptionId: subscription.id
      });
    }
  }

  private cleanupSocketSubscriptions(socketId: string): void {
    const subscriptionsToRemove: string[] = [];

    for (const [id, subscription] of this.subscriptions) {
      if (subscription.socketId === socketId) {
        subscriptionsToRemove.push(id);
      }
    }

    for (const subscriptionId of subscriptionsToRemove) {
      this.unsubscribe(subscriptionId);
    }
  }

  private startCleanupTimer(): void {
    setInterval(() => {
      this.cleanupInactiveSubscriptions();
      this.cleanupRateLimit();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  private cleanupInactiveSubscriptions(): void {
    const cutoff = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes
    const subscriptionsToRemove: string[] = [];

    for (const [id, subscription] of this.subscriptions) {
      if (!subscription.isActive || subscription.lastActivity < cutoff) {
        subscriptionsToRemove.push(id);
      }
    }

    for (const subscriptionId of subscriptionsToRemove) {
      this.unsubscribe(subscriptionId);
    }
  }

  private cleanupRateLimit(): void {
    const now = Date.now();
    
    for (const [userId, requests] of this.rateLimitMap) {
      const recentRequests = requests.filter(time => now - time < 60000);
      
      if (recentRequests.length === 0) {
        this.rateLimitMap.delete(userId);
      } else {
        this.rateLimitMap.set(userId, recentRequests);
      }
    }
  }

  public stop(): void {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval);
      this.metricsInterval = null;
    }
    
    this.io.close();
  }
}

