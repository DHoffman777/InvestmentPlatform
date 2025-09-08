import { randomUUID } from 'crypto';
import {
  RealTimeAnalyticsEvent,
  AnalyticsMetricType,
  AnalyticsDataPoint,
  AnalyticsConfiguration
} from '../../models/analytics/Analytics';
import { logger } from '../../utils/logger';
import { EventPublisher } from '../../utils/eventPublisher';

interface MetricThreshold {
  id: string;
  tenantId: string;
  metricType: AnalyticsMetricType;
  entityId: string;
  entityType: 'portfolio' | 'position' | 'client' | 'tenant';
  thresholdType: 'absolute' | 'percentage' | 'variance';
  operator: 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'between';
  value: number | { min: number; max: number };
  severity: 'low' | 'medium' | 'high' | 'critical';
  isActive: boolean;
  description: string;
  createdBy: string;
  createdAt: Date;
}

interface StreamingConnection {
  id: string;
  tenantId: string;
  userId: string;
  dashboardId?: string;
  visualizationIds: string[];
  subscribedMetrics: AnalyticsMetricType[];
  connectionType: 'websocket' | 'sse' | 'webhook';
  endpoint?: string;
  lastActivity: Date;
  isActive: boolean;
}

interface RealTimeUpdate {
  type: 'metric_update' | 'threshold_breach' | 'visualization_refresh' | 'dashboard_update';
  entityId: string;
  entityType: string;
  data: any;
  timestamp: Date;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

interface PerformanceMetrics {
  updateFrequency: number;
  averageLatency: number;
  connectionCount: number;
  errorRate: number;
  throughput: number;
  lastUpdated: Date;
}

export class RealTimeAnalyticsService {
  private eventPublisher: EventPublisher;
  private connections: Map<string, StreamingConnection> = new Map();
  private thresholds: Map<string, MetricThreshold> = new Map();
  private performanceMetrics: PerformanceMetrics;
  private updateIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor(eventPublisher?: EventPublisher) {
    this.eventPublisher = eventPublisher || new EventPublisher('RealTimeAnalyticsService');
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

  async startRealTimeStream(
    tenantId: string,
    userId: string,
    config: {
      dashboardId?: string;
      visualizationIds?: string[];
      metricTypes?: AnalyticsMetricType[];
      connectionType: 'websocket' | 'sse' | 'webhook';
      endpoint?: string;
      refreshInterval?: number;
    }
  ): Promise<StreamingConnection> {
    try {
      logger.info('Starting real-time analytics stream', {
        tenantId,
        userId,
        connectionType: config.connectionType
      });

      const connection: StreamingConnection = {
        id: randomUUID(),
        tenantId,
        userId,
        dashboardId: config.dashboardId,
        visualizationIds: config.visualizationIds || [],
        subscribedMetrics: config.metricTypes || Object.values(AnalyticsMetricType),
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

    } catch (error: any) {
      logger.error('Error starting real-time stream:', error);
      throw error;
    }
  }

  async stopRealTimeStream(connectionId: string): Promise<any> {
    try {
      logger.info('Stopping real-time stream', { connectionId });

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

    } catch (error: any) {
      logger.error('Error stopping real-time stream:', error);
      throw error;
    }
  }

  async createMetricThreshold(threshold: Omit<MetricThreshold, 'id' | 'createdAt'>): Promise<MetricThreshold> {
    try {
      logger.info('Creating metric threshold', {
        tenantId: threshold.tenantId,
        metricType: threshold.metricType,
        entityId: threshold.entityId
      });

      const newThreshold: MetricThreshold = {
        ...threshold,
        id: randomUUID(),
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

    } catch (error: any) {
      logger.error('Error creating metric threshold:', error);
      throw error;
    }
  }

  async updateMetricThreshold(
    thresholdId: string,
    updates: Partial<MetricThreshold>
  ): Promise<MetricThreshold> {
    try {
      logger.info('Updating metric threshold', { thresholdId });

      const existingThreshold = this.thresholds.get(thresholdId);
      if (!existingThreshold) {
        throw new Error('Threshold not found');
      }

      const updatedThreshold: MetricThreshold = {
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

    } catch (error: any) {
      logger.error('Error updating metric threshold:', error);
      throw error;
    }
  }

  async deleteMetricThreshold(thresholdId: string): Promise<any> {
    try {
      logger.info('Deleting metric threshold', { thresholdId });

      const threshold = this.thresholds.get(thresholdId);
      if (!threshold) {
        throw new Error('Threshold not found');
      }

      this.thresholds.delete(thresholdId);

      await this.eventPublisher.publish('analytics.threshold.deleted', {
        tenantId: threshold.tenantId,
        thresholdId
      });

    } catch (error: any) {
      logger.error('Error deleting metric threshold:', error);
      throw error;
    }
  }

  async getActiveConnections(tenantId?: string): Promise<StreamingConnection[]> {
    const connections = Array.from(this.connections.values()).filter(conn => conn.isActive);
    
    if (tenantId) {
      return connections.filter(conn => conn.tenantId === tenantId);
    }

    return connections;
  }

  async getThresholds(tenantId: string, entityId?: string): Promise<MetricThreshold[]> {
    const thresholds = Array.from(this.thresholds.values())
      .filter(threshold => threshold.tenantId === tenantId && threshold.isActive);

    if (entityId) {
      return thresholds.filter(threshold => threshold.entityId === entityId);
    }

    return thresholds;
  }

  async processMetricUpdate(
    tenantId: string,
    metricType: AnalyticsMetricType,
    entityId: string,
    entityType: string,
    currentValue: number,
    previousValue?: number
  ): Promise<any> {
    try {
      logger.debug('Processing metric update', {
        tenantId,
        metricType,
        entityId,
        currentValue
      });

      // Check thresholds
      const entityThresholds = Array.from(this.thresholds.values()).filter(
        threshold => 
          threshold.tenantId === tenantId &&
          threshold.metricType === metricType &&
          threshold.entityId === entityId &&
          threshold.isActive
      );

      for (const threshold of entityThresholds) {
        const breached = this.checkThresholdBreach(currentValue, threshold);
        
        if (breached) {
          await this.handleThresholdBreach(threshold, currentValue, previousValue);
        }
      }

      // Send updates to relevant connections
      const relevantConnections = Array.from(this.connections.values()).filter(
        conn => 
          conn.tenantId === tenantId &&
          conn.subscribedMetrics.includes(metricType) &&
          conn.isActive
      );

      const update: RealTimeUpdate = {
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

    } catch (error: any) {
      logger.error('Error processing metric update:', error);
      throw error;
    }
  }

  async getPerformanceMetrics(): Promise<PerformanceMetrics> {
    return this.performanceMetrics;
  }

  async configureRealTimeSettings(
    tenantId: string,
    config: Partial<AnalyticsConfiguration>
  ): Promise<AnalyticsConfiguration> {
    try {
      logger.info('Configuring real-time analytics settings', { tenantId });

      const currentConfig = await this.getRealTimeConfiguration(tenantId);
      const updatedConfig: AnalyticsConfiguration = {
        ...currentConfig,
        ...config
      };

      await this.saveRealTimeConfiguration(tenantId, updatedConfig);

      await this.eventPublisher.publish('analytics.realtime.config.updated', {
        tenantId,
        changes: Object.keys(config)
      });

      return updatedConfig;

    } catch (error: any) {
      logger.error('Error configuring real-time settings:', error);
      throw error;
    }
  }

  private async processRealtimeUpdates(connectionId: string): Promise<any> {
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
        
        const update: RealTimeUpdate = {
          type: 'metric_update',
          entityId: 'portfolio-1', // Sample entity ID
          entityType: 'portfolio',
          data,
          timestamp: new Date()
        };

        await this.sendUpdateToConnection(connection, update);
      }

    } catch (error: any) {
      logger.error('Error processing real-time updates:', error);
      // Mark connection as inactive on persistent errors
      connection.isActive = false;
    }
  }

  private async generateRealtimeData(
    metricType: AnalyticsMetricType,
    tenantId: string
  ): Promise<AnalyticsDataPoint[]> {
    const now = new Date();
    const data: AnalyticsDataPoint[] = [];

    switch (metricType) {
      case AnalyticsMetricType.PORTFOLIO_PERFORMANCE:
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

      case AnalyticsMetricType.RISK_METRICS:
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

      case AnalyticsMetricType.MARKET_EXPOSURE:
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

  private checkThresholdBreach(value: number, threshold: MetricThreshold): boolean {
    switch (threshold.operator) {
      case 'greater_than':
        return value > (threshold.value as number);
      case 'less_than':
        return value < (threshold.value as number);
      case 'equals':
        return value === (threshold.value as number);
      case 'not_equals':
        return value !== (threshold.value as number);
      case 'between':
        const range = threshold.value as { min: number; max: number };
        return value >= range.min && value <= range.max;
      default:
        return false;
    }
  }

  private async handleThresholdBreach(
    threshold: MetricThreshold,
    currentValue: number,
    previousValue?: number
  ): Promise<any> {
    try {
      logger.warn('Threshold breach detected', {
        thresholdId: threshold.id,
        metricType: threshold.metricType,
        currentValue,
        thresholdValue: threshold.value,
        severity: threshold.severity
      });

      const event: RealTimeAnalyticsEvent = {
        id: randomUUID(),
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
      const relevantConnections = Array.from(this.connections.values()).filter(
        conn => 
          conn.tenantId === threshold.tenantId &&
          conn.subscribedMetrics.includes(threshold.metricType) &&
          conn.isActive
      );

      const update: RealTimeUpdate = {
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

    } catch (error: any) {
      logger.error('Error handling threshold breach:', error);
    }
  }

  private async sendUpdateToConnection(
    connection: StreamingConnection,
    update: RealTimeUpdate
  ): Promise<any> {
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

    } catch (error: any) {
      logger.error('Error sending update to connection:', error);
      // Mark connection as potentially problematic but don't disable immediately
    }
  }

  private async sendWebSocketUpdate(connection: StreamingConnection, update: RealTimeUpdate): Promise<any> {
    // Mock WebSocket implementation
    logger.debug('Sending WebSocket update', { connectionId: connection.id, updateType: update.type });
  }

  private async sendSSEUpdate(connection: StreamingConnection, update: RealTimeUpdate): Promise<any> {
    // Mock Server-Sent Events implementation
    logger.debug('Sending SSE update', { connectionId: connection.id, updateType: update.type });
  }

  private async sendWebhookUpdate(connection: StreamingConnection, update: RealTimeUpdate): Promise<any> {
    // Mock Webhook implementation
    logger.debug('Sending webhook update', { 
      connectionId: connection.id, 
      endpoint: connection.endpoint,
      updateType: update.type 
    });
  }

  private updatePerformanceMetrics(): void {
    this.performanceMetrics = {
      updateFrequency: this.performanceMetrics.updateFrequency + 1,
      averageLatency: Math.random() * 50 + 10, // Mock latency
      connectionCount: this.connections.size,
      errorRate: Math.random() * 0.01, // Mock error rate
      throughput: this.connections.size * 10, // Mock throughput
      lastUpdated: new Date()
    };
  }

  private initializeRealTimeProcessing(): void {
    // Initialize background processes for real-time analytics
    logger.info('Initializing real-time analytics processing');
    
    // Clean up inactive connections every 5 minutes
    setInterval(() => {
      this.cleanupInactiveConnections();
    }, 5 * 60 * 1000);
  }

  private cleanupInactiveConnections(): void {
    const now = new Date();
    const inactiveThreshold = 10 * 60 * 1000; // 10 minutes

    for (const [connectionId, connection] of this.connections.entries()) {
      if (now.getTime() - connection.lastActivity.getTime() > inactiveThreshold) {
        logger.info('Cleaning up inactive connection', { connectionId });
        this.stopRealTimeStream(connectionId);
      }
    }
  }

  private async getRealTimeConfiguration(tenantId: string): Promise<AnalyticsConfiguration> {
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

  private async saveRealTimeConfiguration(tenantId: string, config: AnalyticsConfiguration): Promise<any> {
    logger.debug('Saving real-time configuration', { tenantId });
  }

  private async saveAnalyticsEvent(event: RealTimeAnalyticsEvent): Promise<any> {
    logger.debug('Saving analytics event', { eventId: event.id, eventType: event.eventType });
  }

  async getRecentEvents(
    tenantId: string,
    options?: {
      eventTypes?: string[];
      limit?: number;
      startDate?: Date;
      endDate?: Date;
    }
  ): Promise<RealTimeAnalyticsEvent[]> {
    try {
      logger.info('Retrieving recent analytics events', {
        tenantId,
        options
      });

      // Mock implementation - replace with actual database query
      const mockEvents: RealTimeAnalyticsEvent[] = [
        {
          id: randomUUID(),
          tenantId,
          eventType: 'metric_update',
          metricType: AnalyticsMetricType.PORTFOLIO_PERFORMANCE,
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
    } catch (error: any) {
      logger.error('Error retrieving recent events:', error);
      throw error;
    }
  }

  async configureAlertThresholds(
    tenantId: string,
    thresholds: Array<{
      metricType: AnalyticsMetricType;
      entityId: string;
      entityType: 'portfolio' | 'position' | 'client' | 'tenant';
      thresholdType: 'absolute' | 'percentage' | 'variance';
      operator: 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'between';
      value: number | { min: number; max: number };
      severity: 'low' | 'medium' | 'high' | 'critical';
      description: string;
    }>,
    createdBy: string
  ): Promise<MetricThreshold[]> {
    try {
      logger.info('Configuring alert thresholds', {
        tenantId,
        thresholdCount: thresholds.length,
        createdBy
      });

      const configuredThresholds: MetricThreshold[] = thresholds.map(threshold => ({
        id: randomUUID(),
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

    } catch (error: any) {
      logger.error('Error configuring alert thresholds:', error);
      throw error;
    }
  }
}

