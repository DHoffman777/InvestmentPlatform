"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealTimeAnalyticsService = void 0;
const crypto_1 = require("crypto");
const Analytics_1 = require("../../models/analytics/Analytics");
const logger_1 = require("../../utils/logger");
const eventPublisher_1 = require("../../utils/eventPublisher");
class RealTimeAnalyticsService {
    eventPublisher;
    connections = new Map();
    thresholds = new Map();
    performanceMetrics;
    updateIntervals = new Map();
    constructor(eventPublisher) {
        this.eventPublisher = eventPublisher || new eventPublisher_1.EventPublisher('RealTimeAnalyticsService');
        this.performanceMetrics = {
            updateFrequency: 0,
            averageLatency: 0,
            connectionCount: 0,
            errorRate: 0,
            throughput: 0,
            lastUpdated: new Date()
        };
        this.initializeRealTimeProcessing();
    }
    async startRealTimeStream(tenantId, userId, config) {
        try {
            logger_1.logger.info('Starting real-time analytics stream', {
                tenantId,
                userId,
                connectionType: config.connectionType
            });
            const connection = {
                id: (0, crypto_1.randomUUID)(),
                tenantId,
                userId,
                dashboardId: config.dashboardId,
                visualizationIds: config.visualizationIds || [],
                subscribedMetrics: config.metricTypes || Object.values(Analytics_1.AnalyticsMetricType),
                connectionType: config.connectionType,
                endpoint: config.endpoint,
                lastActivity: new Date(),
                isActive: true
            };
            this.connections.set(connection.id, connection);
            // Start periodic updates for this connection
            const interval = setInterval(async () => {
                await this.processRealtimeUpdates(connection.id);
            }, config.refreshInterval || 5000);
            this.updateIntervals.set(connection.id, interval);
            await this.eventPublisher.publish('analytics.realtime.stream.started', {
                tenantId,
                connectionId: connection.id,
                userId,
                subscribedMetrics: connection.subscribedMetrics
            });
            this.updatePerformanceMetrics();
            return connection;
        }
        catch (error) {
            logger_1.logger.error('Error starting real-time stream:', error);
            throw error;
        }
    }
    async stopRealTimeStream(connectionId) {
        try {
            logger_1.logger.info('Stopping real-time stream', { connectionId });
            const connection = this.connections.get(connectionId);
            if (!connection) {
                throw new Error('Connection not found');
            }
            connection.isActive = false;
            this.connections.delete(connectionId);
            // Clear interval
            const interval = this.updateIntervals.get(connectionId);
            if (interval) {
                clearInterval(interval);
                this.updateIntervals.delete(connectionId);
            }
            await this.eventPublisher.publish('analytics.realtime.stream.stopped', {
                tenantId: connection.tenantId,
                connectionId,
                userId: connection.userId
            });
            this.updatePerformanceMetrics();
        }
        catch (error) {
            logger_1.logger.error('Error stopping real-time stream:', error);
            throw error;
        }
    }
    async createMetricThreshold(threshold) {
        try {
            logger_1.logger.info('Creating metric threshold', {
                tenantId: threshold.tenantId,
                metricType: threshold.metricType,
                entityId: threshold.entityId
            });
            const newThreshold = {
                ...threshold,
                id: (0, crypto_1.randomUUID)(),
                createdAt: new Date()
            };
            this.thresholds.set(newThreshold.id, newThreshold);
            await this.eventPublisher.publish('analytics.threshold.created', {
                tenantId: threshold.tenantId,
                thresholdId: newThreshold.id,
                metricType: threshold.metricType,
                entityId: threshold.entityId
            });
            return newThreshold;
        }
        catch (error) {
            logger_1.logger.error('Error creating metric threshold:', error);
            throw error;
        }
    }
    async updateMetricThreshold(thresholdId, updates) {
        try {
            logger_1.logger.info('Updating metric threshold', { thresholdId });
            const existingThreshold = this.thresholds.get(thresholdId);
            if (!existingThreshold) {
                throw new Error('Threshold not found');
            }
            const updatedThreshold = {
                ...existingThreshold,
                ...updates
            };
            this.thresholds.set(thresholdId, updatedThreshold);
            await this.eventPublisher.publish('analytics.threshold.updated', {
                tenantId: existingThreshold.tenantId,
                thresholdId,
                changes: Object.keys(updates)
            });
            return updatedThreshold;
        }
        catch (error) {
            logger_1.logger.error('Error updating metric threshold:', error);
            throw error;
        }
    }
    async deleteMetricThreshold(thresholdId) {
        try {
            logger_1.logger.info('Deleting metric threshold', { thresholdId });
            const threshold = this.thresholds.get(thresholdId);
            if (!threshold) {
                throw new Error('Threshold not found');
            }
            this.thresholds.delete(thresholdId);
            await this.eventPublisher.publish('analytics.threshold.deleted', {
                tenantId: threshold.tenantId,
                thresholdId
            });
        }
        catch (error) {
            logger_1.logger.error('Error deleting metric threshold:', error);
            throw error;
        }
    }
    async getActiveConnections(tenantId) {
        const connections = Array.from(this.connections.values()).filter(conn => conn.isActive);
        if (tenantId) {
            return connections.filter(conn => conn.tenantId === tenantId);
        }
        return connections;
    }
    async getThresholds(tenantId, entityId) {
        const thresholds = Array.from(this.thresholds.values())
            .filter(threshold => threshold.tenantId === tenantId && threshold.isActive);
        if (entityId) {
            return thresholds.filter(threshold => threshold.entityId === entityId);
        }
        return thresholds;
    }
    async processMetricUpdate(tenantId, metricType, entityId, entityType, currentValue, previousValue) {
        try {
            logger_1.logger.debug('Processing metric update', {
                tenantId,
                metricType,
                entityId,
                currentValue
            });
            // Check thresholds
            const entityThresholds = Array.from(this.thresholds.values()).filter(threshold => threshold.tenantId === tenantId &&
                threshold.metricType === metricType &&
                threshold.entityId === entityId &&
                threshold.isActive);
            for (const threshold of entityThresholds) {
                const breached = this.checkThresholdBreach(currentValue, threshold);
                if (breached) {
                    await this.handleThresholdBreach(threshold, currentValue, previousValue);
                }
            }
            // Send updates to relevant connections
            const relevantConnections = Array.from(this.connections.values()).filter(conn => conn.tenantId === tenantId &&
                conn.subscribedMetrics.includes(metricType) &&
                conn.isActive);
            const update = {
                type: 'metric_update',
                entityId,
                entityType,
                data: {
                    metricType,
                    currentValue,
                    previousValue,
                    change: previousValue ? currentValue - previousValue : 0,
                    changePercent: previousValue ? ((currentValue - previousValue) / previousValue * 100) : 0,
                    timestamp: new Date()
                },
                timestamp: new Date()
            };
            for (const connection of relevantConnections) {
                await this.sendUpdateToConnection(connection, update);
            }
            this.updatePerformanceMetrics();
        }
        catch (error) {
            logger_1.logger.error('Error processing metric update:', error);
            throw error;
        }
    }
    async getPerformanceMetrics() {
        return this.performanceMetrics;
    }
    async configureRealTimeSettings(tenantId, config) {
        try {
            logger_1.logger.info('Configuring real-time analytics settings', { tenantId });
            const currentConfig = await this.getRealTimeConfiguration(tenantId);
            const updatedConfig = {
                ...currentConfig,
                ...config
            };
            await this.saveRealTimeConfiguration(tenantId, updatedConfig);
            await this.eventPublisher.publish('analytics.realtime.config.updated', {
                tenantId,
                changes: Object.keys(config)
            });
            return updatedConfig;
        }
        catch (error) {
            logger_1.logger.error('Error configuring real-time settings:', error);
            throw error;
        }
    }
    async processRealtimeUpdates(connectionId) {
        const connection = this.connections.get(connectionId);
        if (!connection || !connection.isActive) {
            return;
        }
        try {
            // Update last activity
            connection.lastActivity = new Date();
            // Generate sample real-time data for subscribed metrics
            for (const metricType of connection.subscribedMetrics) {
                const data = await this.generateRealtimeData(metricType, connection.tenantId);
                const update = {
                    type: 'metric_update',
                    entityId: 'portfolio-1', // Sample entity ID
                    entityType: 'portfolio',
                    data,
                    timestamp: new Date()
                };
                await this.sendUpdateToConnection(connection, update);
            }
        }
        catch (error) {
            logger_1.logger.error('Error processing real-time updates:', error);
            // Mark connection as inactive on persistent errors
            connection.isActive = false;
        }
    }
    async generateRealtimeData(metricType, tenantId) {
        const now = new Date();
        const data = [];
        switch (metricType) {
            case Analytics_1.AnalyticsMetricType.PORTFOLIO_PERFORMANCE:
                data.push({
                    timestamp: now,
                    value: 1000000 + (Math.random() - 0.5) * 50000,
                    label: 'Portfolio Value',
                    metadata: {
                        change: (Math.random() - 0.5) * 10000,
                        changePercent: (Math.random() - 0.5) * 2
                    }
                });
                break;
            case Analytics_1.AnalyticsMetricType.RISK_METRICS:
                data.push({
                    timestamp: now,
                    value: 1.5 + Math.random() * 0.5,
                    label: 'VaR (95%)',
                    metadata: {
                        confidence: 95,
                        method: 'Historical Simulation'
                    }
                });
                break;
            case Analytics_1.AnalyticsMetricType.MARKET_EXPOSURE:
                data.push({
                    timestamp: now,
                    value: Math.random() * 100,
                    label: 'Market Beta',
                    metadata: {
                        benchmark: 'S&P 500'
                    }
                });
                break;
            default:
                data.push({
                    timestamp: now,
                    value: Math.random() * 100,
                    label: metricType,
                    metadata: {}
                });
        }
        return data;
    }
    checkThresholdBreach(value, threshold) {
        switch (threshold.operator) {
            case 'greater_than':
                return value > threshold.value;
            case 'less_than':
                return value < threshold.value;
            case 'equals':
                return value === threshold.value;
            case 'not_equals':
                return value !== threshold.value;
            case 'between':
                const range = threshold.value;
                return value >= range.min && value <= range.max;
            default:
                return false;
        }
    }
    async handleThresholdBreach(threshold, currentValue, previousValue) {
        try {
            logger_1.logger.warn('Threshold breach detected', {
                thresholdId: threshold.id,
                metricType: threshold.metricType,
                currentValue,
                thresholdValue: threshold.value,
                severity: threshold.severity
            });
            const event = {
                id: (0, crypto_1.randomUUID)(),
                tenantId: threshold.tenantId,
                eventType: 'threshold_breach',
                metricType: threshold.metricType,
                entityId: threshold.entityId,
                entityType: threshold.entityType,
                timestamp: new Date(),
                data: {
                    thresholdId: threshold.id,
                    currentValue,
                    previousValue,
                    thresholdValue: threshold.value,
                    description: threshold.description
                },
                severity: threshold.severity,
                processed: false,
                createdAt: new Date(),
                acknowledged: false
            };
            await this.saveAnalyticsEvent(event);
            // Send real-time notification to relevant connections
            const relevantConnections = Array.from(this.connections.values()).filter(conn => conn.tenantId === threshold.tenantId &&
                conn.subscribedMetrics.includes(threshold.metricType) &&
                conn.isActive);
            const update = {
                type: 'threshold_breach',
                entityId: threshold.entityId,
                entityType: threshold.entityType,
                data: event,
                timestamp: new Date(),
                severity: threshold.severity
            };
            for (const connection of relevantConnections) {
                await this.sendUpdateToConnection(connection, update);
            }
        }
        catch (error) {
            logger_1.logger.error('Error handling threshold breach:', error);
        }
    }
    async sendUpdateToConnection(connection, update) {
        try {
            switch (connection.connectionType) {
                case 'websocket':
                    await this.sendWebSocketUpdate(connection, update);
                    break;
                case 'sse':
                    await this.sendSSEUpdate(connection, update);
                    break;
                case 'webhook':
                    await this.sendWebhookUpdate(connection, update);
                    break;
            }
        }
        catch (error) {
            logger_1.logger.error('Error sending update to connection:', error);
            // Mark connection as potentially problematic but don't disable immediately
        }
    }
    async sendWebSocketUpdate(connection, update) {
        // Mock WebSocket implementation
        logger_1.logger.debug('Sending WebSocket update', { connectionId: connection.id, updateType: update.type });
    }
    async sendSSEUpdate(connection, update) {
        // Mock Server-Sent Events implementation
        logger_1.logger.debug('Sending SSE update', { connectionId: connection.id, updateType: update.type });
    }
    async sendWebhookUpdate(connection, update) {
        // Mock Webhook implementation
        logger_1.logger.debug('Sending webhook update', {
            connectionId: connection.id,
            endpoint: connection.endpoint,
            updateType: update.type
        });
    }
    updatePerformanceMetrics() {
        this.performanceMetrics = {
            updateFrequency: this.performanceMetrics.updateFrequency + 1,
            averageLatency: Math.random() * 50 + 10, // Mock latency
            connectionCount: this.connections.size,
            errorRate: Math.random() * 0.01, // Mock error rate
            throughput: this.connections.size * 10, // Mock throughput
            lastUpdated: new Date()
        };
    }
    initializeRealTimeProcessing() {
        // Initialize background processes for real-time analytics
        logger_1.logger.info('Initializing real-time analytics processing');
        // Clean up inactive connections every 5 minutes
        setInterval(() => {
            this.cleanupInactiveConnections();
        }, 5 * 60 * 1000);
    }
    cleanupInactiveConnections() {
        const now = new Date();
        const inactiveThreshold = 10 * 60 * 1000; // 10 minutes
        for (const [connectionId, connection] of this.connections.entries()) {
            if (now.getTime() - connection.lastActivity.getTime() > inactiveThreshold) {
                logger_1.logger.info('Cleaning up inactive connection', { connectionId });
                this.stopRealTimeStream(connectionId);
            }
        }
    }
    async getRealTimeConfiguration(tenantId) {
        // Mock configuration retrieval
        return {
            tenantId,
            realTimeEnabled: true,
            refreshIntervals: {
                metrics: 5000,
                visualizations: 10000,
                dashboards: 30000,
                predictions: 300000
            },
            dataRetention: {
                rawData: 90,
                aggregatedData: 365,
                predictions: 180,
                anomalies: 730
            },
            machineLearning: {
                enabled: true,
                autoRetrain: true,
                retrainFrequency: 7,
                predictionHorizon: 30,
                confidenceThreshold: 0.8
            },
            anomalyDetection: {
                enabled: true,
                sensitivity: 'medium',
                methods: ['isolation_forest', 'statistical_threshold'],
                alertThreshold: 0.7
            },
            businessIntelligence: {
                enabled: true,
                autoGenerateReports: true,
                reportFrequency: 'weekly',
                insightCategories: ['performance', 'risk', 'allocation']
            },
            integrations: {}
        };
    }
    async saveRealTimeConfiguration(tenantId, config) {
        logger_1.logger.debug('Saving real-time configuration', { tenantId });
    }
    async saveAnalyticsEvent(event) {
        logger_1.logger.debug('Saving analytics event', { eventId: event.id, eventType: event.eventType });
    }
    async getRecentEvents(tenantId, options) {
        try {
            logger_1.logger.info('Retrieving recent analytics events', {
                tenantId,
                options
            });
            // Mock implementation - replace with actual database query
            const mockEvents = [
                {
                    id: (0, crypto_1.randomUUID)(),
                    tenantId,
                    eventType: 'metric_update',
                    metricType: Analytics_1.AnalyticsMetricType.PORTFOLIO_PERFORMANCE,
                    entityId: 'portfolio-1',
                    entityType: 'portfolio',
                    severity: 'low',
                    timestamp: new Date(),
                    data: {
                        performance: 0.125,
                        benchmark: 0.118,
                        source: 'real_time_analytics'
                    },
                    processed: false,
                    createdAt: new Date()
                }
            ];
            return mockEvents;
        }
        catch (error) {
            logger_1.logger.error('Error retrieving recent events:', error);
            throw error;
        }
    }
    async configureAlertThresholds(tenantId, thresholds, createdBy) {
        try {
            logger_1.logger.info('Configuring alert thresholds', {
                tenantId,
                thresholdCount: thresholds.length,
                createdBy
            });
            const configuredThresholds = thresholds.map(threshold => ({
                id: (0, crypto_1.randomUUID)(),
                tenantId,
                ...threshold,
                isActive: true,
                createdBy,
                createdAt: new Date()
            }));
            // Store thresholds
            configuredThresholds.forEach(threshold => {
                this.thresholds.set(threshold.id, threshold);
            });
            await this.eventPublisher.publish('analytics.thresholds.configured', {
                tenantId,
                thresholdCount: configuredThresholds.length,
                createdBy
            });
            return configuredThresholds;
        }
        catch (error) {
            logger_1.logger.error('Error configuring alert thresholds:', error);
            throw error;
        }
    }
}
exports.RealTimeAnalyticsService = RealTimeAnalyticsService;
