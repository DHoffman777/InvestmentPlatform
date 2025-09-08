"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityStreamingService = exports.StreamMessageType = void 0;
const events_1 = require("events");
// Mock socket.io types for compilation
class SocketIOServer {
    sockets = {
        size: 0,
        sockets: new Map()
    };
    constructor(httpServer, options) {
        // Mock constructor
    }
    on(event, listener) { }
    emit(event, ...args) { }
    to(room) {
        return { emit: () => { } };
    }
    close() { }
}
const crypto_1 = require("crypto");
const ActivityTrackingService_1 = require("./ActivityTrackingService");
var StreamMessageType;
(function (StreamMessageType) {
    StreamMessageType["ACTIVITY_CREATED"] = "activity_created";
    StreamMessageType["ACTIVITY_UPDATED"] = "activity_updated";
    StreamMessageType["PATTERN_MATCHED"] = "pattern_matched";
    StreamMessageType["SUSPICIOUS_ACTIVITY"] = "suspicious_activity";
    StreamMessageType["COMPLIANCE_VIOLATION"] = "compliance_violation";
    StreamMessageType["SESSION_STARTED"] = "session_started";
    StreamMessageType["SESSION_ENDED"] = "session_ended";
    StreamMessageType["SYSTEM_ALERT"] = "system_alert";
    StreamMessageType["REAL_TIME_METRICS"] = "real_time_metrics";
})(StreamMessageType || (exports.StreamMessageType = StreamMessageType = {}));
class ActivityStreamingService extends events_1.EventEmitter {
    io;
    subscriptions = new Map();
    userSubscriptions = new Map();
    messageBuffer = new Map();
    metricsInterval = null;
    config;
    rateLimitMap = new Map();
    getErrorMessage(error) {
        if (error instanceof Error) {
            return this.getErrorMessage(error);
        }
        return String(error);
    }
    constructor(httpServer, config = {}) {
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
    async subscribe(userId, tenantId, socketId, filter = {}) {
        // Check rate limiting
        if (!this.checkRateLimit(userId)) {
            throw new Error('Rate limit exceeded');
        }
        // Check subscription limits
        const userSubs = this.userSubscriptions.get(userId) || new Set();
        if (userSubs.size >= this.config.maxSubscriptionsPerUser) {
            throw new Error('Maximum subscriptions reached');
        }
        const subscription = {
            id: (0, crypto_1.randomUUID)(),
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
    async unsubscribe(subscriptionId) {
        const subscription = this.subscriptions.get(subscriptionId);
        if (!subscription)
            return false;
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
    async broadcastActivity(activity) {
        const message = {
            id: (0, crypto_1.randomUUID)(),
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
    async broadcastPatternMatch(pattern, activity) {
        const message = {
            id: (0, crypto_1.randomUUID)(),
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
    async broadcastSuspiciousActivity(activity) {
        const message = {
            id: (0, crypto_1.randomUUID)(),
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
    async broadcastComplianceViolation(activity) {
        const message = {
            id: (0, crypto_1.randomUUID)(),
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
    async broadcastSystemAlert(alertType, data) {
        const message = {
            id: (0, crypto_1.randomUUID)(),
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
    async getSubscriptionStats() {
        const totalSubscriptions = this.subscriptions.size;
        const activeSubscriptions = Array.from(this.subscriptions.values())
            .filter(sub => sub.isActive).length;
        const subscriptionsByUser = {};
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
    async getSubscription(subscriptionId) {
        return this.subscriptions.get(subscriptionId);
    }
    async getUserSubscriptions(userId) {
        const subscriptionIds = this.userSubscriptions.get(userId) || new Set();
        return Array.from(subscriptionIds)
            .map(id => this.subscriptions.get(id))
            .filter(Boolean);
    }
    async getMessageHistory(subscriptionId, limit = 100) {
        if (!this.config.enableMessagePersistence) {
            return [];
        }
        const messages = this.messageBuffer.get(subscriptionId) || [];
        return messages
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
            .slice(0, limit);
    }
    setupSocketHandlers() {
        this.io.on('connection', (socket) => {
            console.log(`Client connected: ${socket.id}`);
            socket.on('subscribe', async (data) => {
                try {
                    const subscription = await this.subscribe(data.userId, data.tenantId, socket.id, data.filter || {});
                    socket.emit('subscriptionCreated', {
                        subscriptionId: subscription.id,
                        message: 'Successfully subscribed to activity stream'
                    });
                    socket.join(`tenant:${data.tenantId}`);
                    socket.join(`user:${data.userId}`);
                    socket.join(`subscription:${subscription.id}`);
                }
                catch (error) {
                    socket.emit('subscriptionError', {
                        error: this.getErrorMessage(error)
                    });
                }
            });
            socket.on('unsubscribe', async (data) => {
                try {
                    const success = await this.unsubscribe(data.subscriptionId);
                    socket.emit('unsubscribed', {
                        subscriptionId: data.subscriptionId,
                        success
                    });
                    socket.leave(`subscription:${data.subscriptionId}`);
                }
                catch (error) {
                    socket.emit('unsubscribeError', {
                        error: this.getErrorMessage(error)
                    });
                }
            });
            socket.on('getHistory', async (data) => {
                try {
                    const history = await this.getMessageHistory(data.subscriptionId, data.limit || 100);
                    socket.emit('messageHistory', {
                        subscriptionId: data.subscriptionId,
                        messages: history
                    });
                }
                catch (error) {
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
    async sendMessage(subscription, message) {
        if (!subscription.isActive)
            return;
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
        }
        catch (error) {
            console.error('Error sending message:', error);
            subscription.isActive = false;
        }
    }
    findMatchingSubscriptions(activity) {
        return Array.from(this.subscriptions.values())
            .filter(subscription => {
            if (!subscription.isActive)
                return false;
            return this.matchesFilter(activity, subscription.filter);
        });
    }
    matchesFilter(activity, filter) {
        if (filter.userId && activity.userId !== filter.userId)
            return false;
        if (filter.tenantId && activity.tenantId !== filter.tenantId)
            return false;
        if (filter.activityType?.length &&
            !filter.activityType.includes(activity.activityType))
            return false;
        if (filter.activityCategory?.length &&
            !filter.activityCategory.includes(activity.activityCategory))
            return false;
        if (filter.severity?.length &&
            !filter.severity.includes(activity.severity))
            return false;
        if (filter.startDate && activity.timestamp < filter.startDate)
            return false;
        if (filter.endDate && activity.timestamp > filter.endDate)
            return false;
        if (filter.ipAddress && activity.ipAddress !== filter.ipAddress)
            return false;
        if (filter.resource && !activity.resource.includes(filter.resource))
            return false;
        if (filter.tags?.length &&
            !filter.tags.some(tag => activity.tags.includes(tag)))
            return false;
        if (filter.riskScoreMin !== undefined &&
            (activity.riskScore || 0) < filter.riskScoreMin)
            return false;
        if (filter.riskScoreMax !== undefined &&
            (activity.riskScore || 0) > filter.riskScoreMax)
            return false;
        if (filter.sensitiveData !== undefined &&
            activity.sensitiveData !== filter.sensitiveData)
            return false;
        if (filter.complianceFlags?.length &&
            !filter.complianceFlags.some(flag => activity.complianceFlags?.includes(flag)))
            return false;
        return true;
    }
    isComplianceSubscription(subscription) {
        return (subscription.filter.complianceFlags?.length ?? 0) > 0 ||
            subscription.filter.activityType?.includes(ActivityTrackingService_1.ActivityType.COMPLIANCE) ||
            subscription.filter.tags?.some(tag => tag.includes('compliance')) || false;
    }
    checkRateLimit(userId) {
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
    startMetricsStreaming() {
        if (!this.config.enableRealTimeMetrics)
            return;
        this.metricsInterval = setInterval(async () => {
            try {
                const metrics = await this.generateRealTimeMetrics();
                await this.broadcastMetrics(metrics);
            }
            catch (error) {
                console.error('Error generating real-time metrics:', error);
            }
        }, this.config.metricsInterval);
    }
    async generateRealTimeMetrics() {
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
                [ActivityTrackingService_1.ActivitySeverity.LOW]: 0,
                [ActivityTrackingService_1.ActivitySeverity.MEDIUM]: 0,
                [ActivityTrackingService_1.ActivitySeverity.HIGH]: 0,
                [ActivityTrackingService_1.ActivitySeverity.CRITICAL]: 0
            },
            complianceViolations: 0
        };
    }
    async broadcastMetrics(metrics) {
        const message = {
            id: (0, crypto_1.randomUUID)(),
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
    cleanupSocketSubscriptions(socketId) {
        const subscriptionsToRemove = [];
        for (const [id, subscription] of this.subscriptions) {
            if (subscription.socketId === socketId) {
                subscriptionsToRemove.push(id);
            }
        }
        for (const subscriptionId of subscriptionsToRemove) {
            this.unsubscribe(subscriptionId);
        }
    }
    startCleanupTimer() {
        setInterval(() => {
            this.cleanupInactiveSubscriptions();
            this.cleanupRateLimit();
        }, 5 * 60 * 1000); // Every 5 minutes
    }
    cleanupInactiveSubscriptions() {
        const cutoff = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes
        const subscriptionsToRemove = [];
        for (const [id, subscription] of this.subscriptions) {
            if (!subscription.isActive || subscription.lastActivity < cutoff) {
                subscriptionsToRemove.push(id);
            }
        }
        for (const subscriptionId of subscriptionsToRemove) {
            this.unsubscribe(subscriptionId);
        }
    }
    cleanupRateLimit() {
        const now = Date.now();
        for (const [userId, requests] of this.rateLimitMap) {
            const recentRequests = requests.filter(time => now - time < 60000);
            if (recentRequests.length === 0) {
                this.rateLimitMap.delete(userId);
            }
            else {
                this.rateLimitMap.set(userId, recentRequests);
            }
        }
    }
    stop() {
        if (this.metricsInterval) {
            clearInterval(this.metricsInterval);
            this.metricsInterval = null;
        }
        this.io.close();
    }
}
exports.ActivityStreamingService = ActivityStreamingService;
