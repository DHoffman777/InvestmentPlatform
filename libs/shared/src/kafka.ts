import { Kafka, Producer, Consumer, KafkaConfig, ProducerConfig, ConsumerConfig } from 'kafkajs';
import { logger } from './logger';

export interface KafkaMessage {
  topic: string;
  key?: string;
  value: any;
  headers?: Record<string, string>;
  timestamp?: Date;
}

export interface KafkaConsumerHandler {
  topic: string;
  groupId: string;
  handler: (message: KafkaMessage) => Promise<void>;
}

export class KafkaService {
  private kafka: Kafka;
  private producer: Producer | null = null;
  private consumers: Map<string, Consumer> = new Map();
  private connected: boolean = false;

  constructor(config: Partial<KafkaConfig> = {}) {
    this.kafka = new Kafka({
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

  async connect(): Promise<void> {
    try {
      // Initialize producer
      this.producer = this.kafka.producer({
        maxInFlightRequests: 1,
        idempotent: true,
        transactionTimeout: 30000,
      } as ProducerConfig);

      await this.producer.connect();
      this.connected = true;
      
      logger.info('Kafka service connected successfully');
    } catch (error) {
      logger.error('Failed to connect to Kafka:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    try {
      // Disconnect all consumers
      for (const [groupId, consumer] of this.consumers) {
        await consumer.disconnect();
        logger.info(`Disconnected Kafka consumer: ${groupId}`);
      }
      this.consumers.clear();

      // Disconnect producer
      if (this.producer) {
        await this.producer.disconnect();
        this.producer = null;
      }

      this.connected = false;
      logger.info('Kafka service disconnected');
    } catch (error) {
      logger.error('Error disconnecting from Kafka:', error);
      throw error;
    }
  }

  async publish(message: KafkaMessage): Promise<void> {
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
      
      logger.debug('Message published to Kafka', {
        topic: message.topic,
        key: message.key,
      });
    } catch (error) {
      logger.error('Failed to publish message to Kafka:', error);
      throw error;
    }
  }

  async publishBatch(messages: KafkaMessage[]): Promise<void> {
    if (!this.producer || !this.connected) {
      throw new Error('Kafka producer not connected');
    }

    try {
      const topicMessages = new Map<string, any[]>();

      // Group messages by topic
      messages.forEach((message) => {
        if (!topicMessages.has(message.topic)) {
          topicMessages.set(message.topic, []);
        }
        
        topicMessages.get(message.topic)!.push({
          key: message.key,
          value: JSON.stringify(message.value),
          headers: {
            timestamp: new Date().toISOString(),
            ...message.headers,
          },
        });
      });

      // Send batch for each topic
      const batchPromises = Array.from(topicMessages.entries()).map(
        ([topic, topicMessageArray]) =>
          this.producer!.send({
            topic,
            messages: topicMessageArray,
          })
      );

      await Promise.all(batchPromises);
      
      logger.debug('Batch messages published to Kafka', {
        messageCount: messages.length,
        topics: Array.from(topicMessages.keys()),
      });
    } catch (error) {
      logger.error('Failed to publish batch messages to Kafka:', error);
      throw error;
    }
  }

  async subscribe(config: KafkaConsumerHandler): Promise<void> {
    const { topic, groupId, handler } = config;

    if (this.consumers.has(groupId)) {
      throw new Error(`Consumer with groupId ${groupId} already exists`);
    }

    try {
      const consumer = this.kafka.consumer({
        groupId,
        sessionTimeout: 30000,
        heartbeatInterval: 3000,
      } as ConsumerConfig);

      await consumer.connect();
      await consumer.subscribe({ topic, fromBeginning: false });

      await consumer.run({
        eachMessage: async ({ topic, partition, message }) => {
          try {
            const kafkaMessage: KafkaMessage = {
              topic,
              key: message.key?.toString(),
              value: message.value ? JSON.parse(message.value.toString()) : null,
              headers: message.headers ? 
                Object.fromEntries(
                  Object.entries(message.headers).map(([key, value]) => [
                    key,
                    value?.toString() || '',
                  ])
                ) : undefined,
            };

            await handler(kafkaMessage);
            
            logger.debug('Message processed successfully', {
              topic,
              partition,
              offset: message.offset,
              key: kafkaMessage.key,
            });
          } catch (error) {
            logger.error('Error processing Kafka message:', error, {
              topic,
              partition,
              offset: message.offset,
              key: message.key?.toString(),
            });

            // Send to DLQ (Dead Letter Queue)
            await this.sendToDLQ(topic, message, error as Error);
          }
        },
      });

      this.consumers.set(groupId, consumer);
      logger.info(`Kafka consumer subscribed`, { topic, groupId });
    } catch (error) {
      logger.error('Failed to subscribe to Kafka topic:', error);
      throw error;
    }
  }

  private async sendToDLQ(originalTopic: string, message: any, error: Error): Promise<void> {
    try {
      const dlqTopic = `dlq.${originalTopic.split('.')[0]}`;
      const dlqMessage: KafkaMessage = {
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
      logger.warn('Message sent to DLQ', { originalTopic, dlqTopic });
    } catch (dlqError) {
      logger.error('Failed to send message to DLQ:', dlqError);
    }
  }

  async createTopics(topics: string[]): Promise<void> {
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
      logger.info('Topics created successfully', { topics });
    } catch (error) {
      logger.error('Failed to create topics:', error);
      throw error;
    }
  }

  async getTopics(): Promise<string[]> {
    try {
      const admin = this.kafka.admin();
      await admin.connect();

      const metadata = await admin.fetchTopicMetadata();
      await admin.disconnect();

      return metadata.topics.map(topic => topic.name);
    } catch (error) {
      logger.error('Failed to fetch topics:', error);
      throw error;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }
}

// Topic constants for the Investment Platform
export const KAFKA_TOPICS = {
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
} as const;

// Event type definitions
export interface UserEvent {
  userId: string;
  tenantId: string;
  action: 'created' | 'updated' | 'deleted' | 'login' | 'logout';
  metadata?: Record<string, any>;
}

export interface PortfolioEvent {
  portfolioId: string;
  tenantId: string;
  userId: string;
  action: 'created' | 'updated' | 'deleted';
  data: Record<string, any>;
}

export interface TradeEvent {
  tradeId: string;
  portfolioId: string;
  tenantId: string;
  symbol: string;
  quantity: number;
  price: number;
  side: 'buy' | 'sell';
  status: 'executed' | 'settled' | 'failed';
  metadata?: Record<string, any>;
}

export interface MarketDataEvent {
  symbol: string;
  price: number;
  volume?: number;
  timestamp: string;
  source: string;
  metadata?: Record<string, any>;
}

export interface NotificationEvent {
  userId: string;
  tenantId: string;
  type: 'email' | 'sms' | 'push';
  recipient: string;
  subject?: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  metadata?: Record<string, any>;
}

// Singleton instance
let kafkaServiceInstance: KafkaService | null = null;

export const getKafkaService = (): KafkaService => {
  if (!kafkaServiceInstance) {
    kafkaServiceInstance = new KafkaService();
  }
  return kafkaServiceInstance;
};

export default KafkaService;