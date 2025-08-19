"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealTimeMetricsStreaming = void 0;
const events_1 = require("events");
const ws_1 = __importDefault(require("ws"));
class RealTimeMetricsStreaming extends events_1.EventEmitter {
    config;
    server;
    clients = new Map();
    subscriptions = new Map();
    metricBuffer = new Map();
    sequenceCounter = 0;
    aggregationCache = new Map();
    heartbeatTimer;
    cleanupTimer;
    constructor(config) {
        super();
        this.config = config;
        this.server = new ws_1.default.Server({
            port: config.port,
            maxPayload: 1024 * 1024
        });
        this.setupWebSocketServer();
        this.startHeartbeat();
        this.startCleanupTimer();
    }
    setupWebSocketServer() {
        this.server.on('connection', (socket, request) => {
            const client = this.createClient(socket, request);
            this.handleClientConnection(client);
        });
        this.server.on('error', (error) => {
            this.emit('serverError', error);
        });
        this.emit('serverStarted', { port: this.config.port });
    }
    createClient(socket, request) {
        const clientId = this.generateClientId();
        const client = {
            id: clientId,
            socket,
            tenantId: '',
            userId: '',
            subscriptions: new Set(),
            isAuthenticated: !this.config.authenticationRequired,
            lastHeartbeat: new Date(),
            connectedAt: new Date(),
            messageCount: 0,
            bytesTransferred: 0,
            rateLimitBucket: this.config.rateLimitPerClient,
            rateLimitLastRefill: new Date()
        };
        this.clients.set(clientId, client);
        return client;
    }
    handleClientConnection(client) {
        this.emit('clientConnected', { clientId: client.id });
        client.socket.on('message', (data) => {
            try {
                const message = JSON.parse(data.toString());
                this.handleClientMessage(client, message);
            }
            catch (error) {
                this.sendError(client, 'Invalid message format');
            }
        });
        client.socket.on('close', () => {
            this.handleClientDisconnection(client);
        });
        client.socket.on('error', (error) => {
            this.emit('clientError', { clientId: client.id, error });
            this.handleClientDisconnection(client);
        });
        client.socket.on('pong', () => {
            client.lastHeartbeat = new Date();
        });
        if (this.config.authenticationRequired) {
            this.sendMessage(client, {
                type: 'authentication_required',
                timestamp: new Date(),
                payload: { message: 'Authentication required' },
                sequenceNumber: this.getNextSequenceNumber()
            });
        }
    }
    async handleClientMessage(client, message) {
        if (!this.checkRateLimit(client)) {
            this.sendError(client, 'Rate limit exceeded');
            return;
        }
        switch (message.type) {
            case 'authenticate':
                await this.handleAuthentication(client, message.payload);
                break;
            case 'subscribe':
                await this.handleSubscription(client, message.payload);
                break;
            case 'unsubscribe':
                await this.handleUnsubscription(client, message.payload);
                break;
            case 'heartbeat':
                client.lastHeartbeat = new Date();
                this.sendMessage(client, {
                    type: 'heartbeat',
                    timestamp: new Date(),
                    payload: { status: 'ok' },
                    sequenceNumber: this.getNextSequenceNumber()
                });
                break;
            default:
                this.sendError(client, `Unknown message type: ${message.type}`);
        }
    }
    async handleAuthentication(client, payload) {
        try {
            const isValid = await this.validateAuthentication(payload.token);
            if (isValid) {
                client.isAuthenticated = true;
                client.tenantId = payload.tenantId;
                client.userId = payload.userId;
                this.sendMessage(client, {
                    type: 'authentication_success',
                    timestamp: new Date(),
                    payload: { message: 'Authentication successful' },
                    sequenceNumber: this.getNextSequenceNumber()
                });
                this.emit('clientAuthenticated', { clientId: client.id, userId: client.userId });
            }
            else {
                this.sendMessage(client, {
                    type: 'authentication_failed',
                    timestamp: new Date(),
                    payload: { message: 'Authentication failed' },
                    sequenceNumber: this.getNextSequenceNumber()
                });
            }
        }
        catch (error) {
            this.sendError(client, 'Authentication error');
        }
    }
    async handleSubscription(client, payload) {
        if (!client.isAuthenticated) {
            this.sendError(client, 'Authentication required');
            return;
        }
        try {
            const subscription = await this.createSubscription(client, payload);
            client.subscriptions.add(subscription.id);
            this.sendMessage(client, {
                type: 'subscription_status',
                timestamp: new Date(),
                subscriptionId: subscription.id,
                payload: {
                    status: 'active',
                    subscription: {
                        id: subscription.id,
                        metricIds: subscription.metricIds,
                        kpiIds: subscription.kpiIds,
                        filters: subscription.filters
                    }
                },
                sequenceNumber: this.getNextSequenceNumber()
            });
            await this.sendInitialData(client, subscription);
            this.emit('subscriptionCreated', {
                clientId: client.id,
                subscriptionId: subscription.id
            });
        }
        catch (error) {
            this.sendError(client, `Subscription failed: ${error.message}`);
        }
    }
    async handleUnsubscription(client, payload) {
        const subscriptionId = payload.subscriptionId;
        if (client.subscriptions.has(subscriptionId)) {
            client.subscriptions.delete(subscriptionId);
            this.subscriptions.delete(subscriptionId);
            this.sendMessage(client, {
                type: 'subscription_status',
                timestamp: new Date(),
                subscriptionId,
                payload: { status: 'cancelled' },
                sequenceNumber: this.getNextSequenceNumber()
            });
            this.emit('subscriptionCancelled', {
                clientId: client.id,
                subscriptionId
            });
        }
    }
    async createSubscription(client, payload) {
        const subscription = {
            id: this.generateSubscriptionId(),
            clientId: client.id,
            tenantId: client.tenantId,
            userId: client.userId,
            metricIds: payload.metricIds || [],
            kpiIds: payload.kpiIds || [],
            filters: payload.filters || [],
            aggregationLevel: payload.aggregationLevel || 'raw',
            maxUpdateFrequency: Math.max(1000, payload.maxUpdateFrequency || 5000),
            isActive: true,
            createdAt: new Date(),
            lastUpdated: new Date()
        };
        this.subscriptions.set(subscription.id, subscription);
        return subscription;
    }
    async sendInitialData(client, subscription) {
        for (const metricId of subscription.metricIds) {
            const latestValue = await this.getLatestMetricValue(metricId);
            if (latestValue) {
                const streamData = {
                    metricId,
                    subscriptionId: subscription.id,
                    current: latestValue,
                    change: {
                        absolute: 0,
                        percentage: 0,
                        trend: 'stable'
                    }
                };
                this.sendMessage(client, {
                    type: 'metric_update',
                    timestamp: new Date(),
                    subscriptionId: subscription.id,
                    payload: streamData,
                    sequenceNumber: this.getNextSequenceNumber()
                });
            }
        }
        for (const kpiId of subscription.kpiIds) {
            const kpiData = await this.getLatestKPIValue(kpiId);
            if (kpiData) {
                this.sendMessage(client, {
                    type: 'kpi_update',
                    timestamp: new Date(),
                    subscriptionId: subscription.id,
                    payload: kpiData,
                    sequenceNumber: this.getNextSequenceNumber()
                });
            }
        }
    }
    async publishMetricUpdate(metricValue) {
        this.addToBuffer(metricValue);
        const relevantSubscriptions = Array.from(this.subscriptions.values())
            .filter(sub => sub.isActive && sub.metricIds.includes(metricValue.metricId));
        for (const subscription of relevantSubscriptions) {
            if (this.matchesFilters(metricValue, subscription.filters)) {
                const client = this.clients.get(subscription.clientId);
                if (client && client.socket.readyState === ws_1.default.OPEN) {
                    const previous = await this.getPreviousMetricValue(metricValue.metricId);
                    const streamData = {
                        metricId: metricValue.metricId,
                        subscriptionId: subscription.id,
                        current: metricValue,
                        previous,
                        change: this.calculateChange(metricValue, previous)
                    };
                    if (subscription.aggregationLevel !== 'raw') {
                        streamData.aggregation = await this.getAggregation(metricValue.metricId, subscription.aggregationLevel);
                    }
                    this.sendMessage(client, {
                        type: 'metric_update',
                        timestamp: new Date(),
                        subscriptionId: subscription.id,
                        payload: streamData,
                        sequenceNumber: this.getNextSequenceNumber()
                    });
                }
            }
        }
    }
    async publishKPIUpdate(kpiId, kpiData) {
        const relevantSubscriptions = Array.from(this.subscriptions.values())
            .filter(sub => sub.isActive && sub.kpiIds.includes(kpiId));
        for (const subscription of relevantSubscriptions) {
            const client = this.clients.get(subscription.clientId);
            if (client && client.socket.readyState === ws_1.default.OPEN) {
                kpiData.subscriptionId = subscription.id;
                this.sendMessage(client, {
                    type: 'kpi_update',
                    timestamp: new Date(),
                    subscriptionId: subscription.id,
                    payload: kpiData,
                    sequenceNumber: this.getNextSequenceNumber()
                });
            }
        }
    }
    async publishAlert(alert) {
        const alertData = {
            alertId: alert.id,
            subscriptionId: '',
            type: alert.alertType,
            severity: alert.severity,
            message: alert.message,
            metricId: alert.metricId,
            kpiId: alert.kpiTargetId,
            currentValue: alert.currentValue,
            threshold: alert.threshold,
            triggeredAt: alert.triggeredAt,
            context: alert.dimensions
        };
        const relevantSubscriptions = Array.from(this.subscriptions.values())
            .filter(sub => {
            return sub.isActive && ((alert.metricId && sub.metricIds.includes(alert.metricId)) ||
                (alert.kpiTargetId && sub.kpiIds.includes(alert.kpiTargetId)));
        });
        for (const subscription of relevantSubscriptions) {
            const client = this.clients.get(subscription.clientId);
            if (client && client.socket.readyState === ws_1.default.OPEN) {
                alertData.subscriptionId = subscription.id;
                this.sendMessage(client, {
                    type: 'alert',
                    timestamp: new Date(),
                    subscriptionId: subscription.id,
                    payload: alertData,
                    sequenceNumber: this.getNextSequenceNumber()
                });
            }
        }
    }
    sendMessage(client, message) {
        if (client.socket.readyState === ws_1.default.OPEN) {
            const data = JSON.stringify(message);
            if (this.config.compressionEnabled && data.length > 1024) {
                client.socket.send(data, { compress: true });
            }
            else {
                client.socket.send(data);
            }
            client.messageCount++;
            client.bytesTransferred += data.length;
        }
    }
    sendError(client, message) {
        this.sendMessage(client, {
            type: 'error',
            timestamp: new Date(),
            payload: { message },
            sequenceNumber: this.getNextSequenceNumber()
        });
    }
    handleClientDisconnection(client) {
        client.subscriptions.forEach(subscriptionId => {
            this.subscriptions.delete(subscriptionId);
        });
        this.clients.delete(client.id);
        this.emit('clientDisconnected', {
            clientId: client.id,
            connectedDuration: Date.now() - client.connectedAt.getTime(),
            messageCount: client.messageCount,
            bytesTransferred: client.bytesTransferred
        });
    }
    checkRateLimit(client) {
        const now = new Date();
        const timeSinceRefill = now.getTime() - client.rateLimitLastRefill.getTime();
        if (timeSinceRefill >= 1000) {
            client.rateLimitBucket = Math.min(this.config.rateLimitPerClient, client.rateLimitBucket + Math.floor(timeSinceRefill / 1000) * this.config.rateLimitPerClient);
            client.rateLimitLastRefill = now;
        }
        if (client.rateLimitBucket > 0) {
            client.rateLimitBucket--;
            return true;
        }
        return false;
    }
    async validateAuthentication(token) {
        return token && token.length > 10;
    }
    addToBuffer(metricValue) {
        if (!this.metricBuffer.has(metricValue.metricId)) {
            this.metricBuffer.set(metricValue.metricId, []);
        }
        const buffer = this.metricBuffer.get(metricValue.metricId);
        buffer.push(metricValue);
        if (buffer.length > this.config.bufferSize) {
            buffer.shift();
        }
    }
    async getLatestMetricValue(metricId) {
        const buffer = this.metricBuffer.get(metricId);
        return buffer && buffer.length > 0 ? buffer[buffer.length - 1] : null;
    }
    async getPreviousMetricValue(metricId) {
        const buffer = this.metricBuffer.get(metricId);
        return buffer && buffer.length > 1 ? buffer[buffer.length - 2] : null;
    }
    async getLatestKPIValue(kpiId) {
        return {
            kpiId,
            subscriptionId: '',
            name: `KPI ${kpiId}`,
            current: Math.random() * 1000,
            target: 1000,
            status: 'on_track',
            change: {
                absolute: Math.random() * 50 - 25,
                percentage: Math.random() * 10 - 5,
                period: '24h'
            },
            components: []
        };
    }
    calculateChange(current, previous) {
        if (!previous) {
            return {
                absolute: 0,
                percentage: 0,
                trend: 'stable'
            };
        }
        const absolute = current.value - previous.value;
        const percentage = previous.value !== 0 ? (absolute / previous.value) * 100 : 0;
        const trend = absolute > 0 ? 'up' : absolute < 0 ? 'down' : 'stable';
        return { absolute, percentage, trend };
    }
    matchesFilters(metricValue, filters) {
        return filters.every(filter => {
            const fieldValue = this.getFieldValue(metricValue, filter.field);
            return this.evaluateFilter(fieldValue, filter.operator, filter.value);
        });
    }
    getFieldValue(metricValue, field) {
        const parts = field.split('.');
        let value = metricValue;
        for (const part of parts) {
            value = value?.[part];
        }
        return value;
    }
    evaluateFilter(fieldValue, operator, filterValue) {
        switch (operator) {
            case 'eq': return fieldValue === filterValue;
            case 'ne': return fieldValue !== filterValue;
            case 'gt': return fieldValue > filterValue;
            case 'gte': return fieldValue >= filterValue;
            case 'lt': return fieldValue < filterValue;
            case 'lte': return fieldValue <= filterValue;
            case 'in': return Array.isArray(filterValue) && filterValue.includes(fieldValue);
            case 'contains': return String(fieldValue).includes(String(filterValue));
            default: return true;
        }
    }
    async getAggregation(metricId, level) {
        const cacheKey = `${metricId}_${level}`;
        if (this.aggregationCache.has(cacheKey)) {
            const cached = this.aggregationCache.get(cacheKey);
            if (Date.now() - cached.timestamp < 60000) {
                return cached.data;
            }
        }
        const buffer = this.metricBuffer.get(metricId) || [];
        const now = new Date();
        let periodMs;
        switch (level) {
            case 'minute':
                periodMs = 60 * 1000;
                break;
            case 'hour':
                periodMs = 60 * 60 * 1000;
                break;
            case 'day':
                periodMs = 24 * 60 * 60 * 1000;
                break;
            default: periodMs = 60 * 1000;
        }
        const cutoff = new Date(now.getTime() - periodMs);
        const relevantValues = buffer.filter(v => v.timestamp >= cutoff);
        if (relevantValues.length === 0) {
            return null;
        }
        const sum = relevantValues.reduce((acc, v) => acc + v.value, 0);
        const avg = sum / relevantValues.length;
        const aggregation = {
            period: level,
            value: avg,
            count: relevantValues.length,
            min: Math.min(...relevantValues.map(v => v.value)),
            max: Math.max(...relevantValues.map(v => v.value))
        };
        this.aggregationCache.set(cacheKey, {
            data: aggregation,
            timestamp: Date.now()
        });
        return aggregation;
    }
    startHeartbeat() {
        this.heartbeatTimer = setInterval(() => {
            this.clients.forEach(client => {
                if (client.socket.readyState === ws_1.default.OPEN) {
                    const timeSinceLastHeartbeat = Date.now() - client.lastHeartbeat.getTime();
                    if (timeSinceLastHeartbeat > this.config.heartbeatInterval * 2) {
                        client.socket.terminate();
                    }
                    else {
                        client.socket.ping();
                    }
                }
            });
        }, this.config.heartbeatInterval);
    }
    startCleanupTimer() {
        this.cleanupTimer = setInterval(() => {
            this.cleanupInactiveClients();
            this.cleanupBuffers();
            this.cleanupAggregationCache();
        }, 300000);
    }
    cleanupInactiveClients() {
        const now = Date.now();
        const timeout = 5 * 60 * 1000;
        this.clients.forEach((client, clientId) => {
            if (now - client.lastHeartbeat.getTime() > timeout) {
                if (client.socket.readyState === ws_1.default.OPEN) {
                    client.socket.terminate();
                }
                this.handleClientDisconnection(client);
            }
        });
    }
    cleanupBuffers() {
        const maxAge = 24 * 60 * 60 * 1000;
        const cutoff = new Date(Date.now() - maxAge);
        this.metricBuffer.forEach((buffer, metricId) => {
            const filtered = buffer.filter(value => value.timestamp >= cutoff);
            if (filtered.length !== buffer.length) {
                this.metricBuffer.set(metricId, filtered);
            }
        });
    }
    cleanupAggregationCache() {
        const maxAge = 5 * 60 * 1000;
        const cutoff = Date.now() - maxAge;
        this.aggregationCache.forEach((cached, key) => {
            if (cached.timestamp < cutoff) {
                this.aggregationCache.delete(key);
            }
        });
    }
    getNextSequenceNumber() {
        return ++this.sequenceCounter;
    }
    generateClientId() {
        return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateSubscriptionId() {
        return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    getConnectedClients() {
        return this.clients.size;
    }
    getActiveSubscriptions() {
        return this.subscriptions.size;
    }
    getServerStats() {
        const clients = Array.from(this.clients.values());
        return {
            connectedClients: this.clients.size,
            activeSubscriptions: this.subscriptions.size,
            totalMessages: clients.reduce((sum, c) => sum + c.messageCount, 0),
            totalBytesTransferred: clients.reduce((sum, c) => sum + c.bytesTransferred, 0),
            bufferSize: Array.from(this.metricBuffer.values()).reduce((sum, buf) => sum + buf.length, 0),
            cacheSize: this.aggregationCache.size,
            uptime: process.uptime()
        };
    }
    async shutdown() {
        clearInterval(this.heartbeatTimer);
        clearInterval(this.cleanupTimer);
        this.clients.forEach(client => {
            if (client.socket.readyState === ws_1.default.OPEN) {
                client.socket.close();
            }
        });
        this.server.close();
        this.emit('serverShutdown');
    }
}
exports.RealTimeMetricsStreaming = RealTimeMetricsStreaming;
