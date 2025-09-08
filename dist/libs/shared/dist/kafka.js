"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getKafkaService = exports.KAFKA_TOPICS = exports.KafkaService = void 0;
const kafkajs_1 = require("kafkajs");
const logger_1 = require("./logger");
class KafkaService {
    constructor(config = {}) {
        this.producer = null;
        this.consumers = new Map();
        this.connected = false;
        this.kafka = new kafkajs_1.Kafka({
            clientId: 'investment-platform',
            brokers: config.brokers || [process.env.KAFKA_BROKERS || 'kafka:9092'],
            connectionTimeout: 30000,
            requestTimeout: 30000,
            retry: {
                initialRetryTime: 100,
                retries: 8,
            },
            ...config,
        });
    }
    async connect() {
        try {
            // Initialize producer
            this.producer = this.kafka.producer({
                maxInFlightRequests: 1,
                idempotent: true,
                transactionTimeout: 30000,
            });
            await this.producer.connect();
            this.connected = true;
            logger_1.logger.info('Kafka service connected successfully');
        }
        catch (error) {
            logger_1.logger.error('Failed to connect to Kafka:', error);
            throw error;
        }
    }
    async disconnect() {
        try {
            // Disconnect all consumers
            for (const [groupId, consumer] of this.consumers) {
                await consumer.disconnect();
                logger_1.logger.info(`Disconnected Kafka consumer: ${groupId}`);
            }
            this.consumers.clear();
            // Disconnect producer
            if (this.producer) {
                await this.producer.disconnect();
                this.producer = null;
            }
            this.connected = false;
            logger_1.logger.info('Kafka service disconnected');
        }
        catch (error) {
            logger_1.logger.error('Error disconnecting from Kafka:', error);
            throw error;
        }
    }
    async publish(message) {
        if (!this.producer || !this.connected) {
            throw new Error('Kafka producer not connected');
        }
        try {
            const kafkaMessage = {
                topic: message.topic,
                messages: [
                    {
                        key: message.key,
                        value: JSON.stringify(message.value),
                        headers: {
                            timestamp: new Date().toISOString(),
                            ...message.headers,
                        },
                    },
                ],
            };
            await this.producer.send(kafkaMessage);
            logger_1.logger.debug('Message published to Kafka', {
                topic: message.topic,
                key: message.key,
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to publish message to Kafka:', error);
            throw error;
        }
    }
    async publishBatch(messages) {
        if (!this.producer || !this.connected) {
            throw new Error('Kafka producer not connected');
        }
        try {
            const topicMessages = new Map();
            // Group messages by topic
            messages.forEach((message) => {
                if (!topicMessages.has(message.topic)) {
                    topicMessages.set(message.topic, []);
                }
                topicMessages.get(message.topic).push({
                    key: message.key,
                    value: JSON.stringify(message.value),
                    headers: {
                        timestamp: new Date().toISOString(),
                        ...message.headers,
                    },
                });
            });
            // Send batch for each topic
            const batchPromises = Array.from(topicMessages.entries()).map(([topic, topicMessageArray]) => this.producer.send({
                topic,
                messages: topicMessageArray,
            }));
            await Promise.all(batchPromises);
            logger_1.logger.debug('Batch messages published to Kafka', {
                messageCount: messages.length,
                topics: Array.from(topicMessages.keys()),
            });
        }
        catch (error) {
            logger_1.logger.error('Failed to publish batch messages to Kafka:', error);
            throw error;
        }
    }
    async subscribe(config) {
        const { topic, groupId, handler } = config;
        if (this.consumers.has(groupId)) {
            throw new Error(`Consumer with groupId ${groupId} already exists`);
        }
        try {
            const consumer = this.kafka.consumer({
                groupId,
                sessionTimeout: 30000,
                heartbeatInterval: 3000,
            });
            await consumer.connect();
            await consumer.subscribe({ topic, fromBeginning: false });
            await consumer.run({
                eachMessage: async ({ topic, partition, message }) => {
                    try {
                        const kafkaMessage = {
                            topic,
                            key: message.key?.toString(),
                            value: message.value ? JSON.parse(message.value.toString()) : null,
                            headers: message.headers ?
                                Object.fromEntries(Object.entries(message.headers).map(([key, value]) => [
                                    key,
                                    value?.toString() || '',
                                ])) : undefined,
                        };
                        await handler(kafkaMessage);
                        logger_1.logger.debug('Message processed successfully', {
                            topic,
                            partition,
                            offset: message.offset,
                            key: kafkaMessage.key,
                        });
                    }
                    catch (error) {
                        logger_1.logger.error('Error processing Kafka message:', error, {
                            topic,
                            partition,
                            offset: message.offset,
                            key: message.key?.toString(),
                        });
                        // Send to DLQ (Dead Letter Queue)
                        await this.sendToDLQ(topic, message, error);
                    }
                },
            });
            this.consumers.set(groupId, consumer);
            logger_1.logger.info(`Kafka consumer subscribed`, { topic, groupId });
        }
        catch (error) {
            logger_1.logger.error('Failed to subscribe to Kafka topic:', error);
            throw error;
        }
    }
    async sendToDLQ(originalTopic, message, error) {
        try {
            const dlqTopic = `dlq.${originalTopic.split('.')[0]}`;
            const dlqMessage = {
                topic: dlqTopic,
                key: message.key?.toString(),
                value: {
                    originalTopic,
                    originalMessage: message.value ? JSON.parse(message.value.toString()) : null,
                    error: {
                        message: error instanceof Error ? error.message : 'Unknown error',
                        stack: error.stack,
                    },
                    timestamp: new Date().toISOString(),
                },
                headers: {
                    'dlq-original-topic': originalTopic,
                    'dlq-error': error instanceof Error ? error.message : 'Unknown error',
                    ...message.headers,
                },
            };
            await this.publish(dlqMessage);
            logger_1.logger.warn('Message sent to DLQ', { originalTopic, dlqTopic });
        }
        catch (dlqError) {
            logger_1.logger.error('Failed to send message to DLQ:', dlqError);
        }
    }
    async createTopics(topics) {
        try {
            const admin = this.kafka.admin();
            await admin.connect();
            const topicConfigs = topics.map(topic => ({
                topic,
                numPartitions: 3,
                replicationFactor: 1,
            }));
            await admin.createTopics({
                topics: topicConfigs,
            });
            await admin.disconnect();
            logger_1.logger.info('Topics created successfully', { topics });
        }
        catch (error) {
            logger_1.logger.error('Failed to create topics:', error);
            throw error;
        }
    }
    async getTopics() {
        try {
            const admin = this.kafka.admin();
            await admin.connect();
            const metadata = await admin.fetchTopicMetadata();
            await admin.disconnect();
            return metadata.topics.map(topic => topic.name);
        }
        catch (error) {
            logger_1.logger.error('Failed to fetch topics:', error);
            throw error;
        }
    }
    isConnected() {
        return this.connected;
    }
}
exports.KafkaService = KafkaService;
// Topic constants for the Investment Platform
exports.KAFKA_TOPICS = {
    // Authentication
    AUTH_USER_EVENTS: 'auth.user.events',
    AUTH_SESSION_EVENTS: 'auth.session.events',
    // Portfolio
    PORTFOLIO_CREATED: 'portfolio.created',
    PORTFOLIO_UPDATED: 'portfolio.updated',
    PORTFOLIO_DELETED: 'portfolio.deleted',
    // Trades
    TRADE_EXECUTED: 'trade.executed',
    TRADE_SETTLED: 'trade.settled',
    TRADE_FAILED: 'trade.failed',
    // Market Data
    MARKET_PRICES: 'market.prices',
    MARKET_CORPORATE_ACTIONS: 'market.corporate-actions',
    // Audit & Compliance
    AUDIT_LOGS: 'audit.logs',
    COMPLIANCE_VIOLATIONS: 'compliance.violations',
    // Notifications
    NOTIFICATIONS_EMAIL: 'notifications.email',
    NOTIFICATIONS_SMS: 'notifications.sms',
    NOTIFICATIONS_PUSH: 'notifications.push',
    // Reporting
    REPORT_GENERATION_REQUESTED: 'report.generation.requested',
    REPORT_GENERATION_COMPLETED: 'report.generation.completed',
    // Dead Letter Queues
    DLQ_AUTH: 'dlq.auth',
    DLQ_PORTFOLIO: 'dlq.portfolio',
    DLQ_TRADE: 'dlq.trade',
    DLQ_NOTIFICATION: 'dlq.notification',
};
// Singleton instance
let kafkaServiceInstance = null;
const getKafkaService = () => {
    if (!kafkaServiceInstance) {
        kafkaServiceInstance = new KafkaService();
    }
    return kafkaServiceInstance;
};
exports.getKafkaService = getKafkaService;
exports.default = KafkaService;
