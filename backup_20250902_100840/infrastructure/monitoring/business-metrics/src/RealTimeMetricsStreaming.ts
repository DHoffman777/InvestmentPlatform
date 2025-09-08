import { EventEmitter } from 'events';
import WebSocket from 'ws';
import {
  MetricValue,
  MetricDefinition,
  BusinessKPI,
  MetricAlert,
  AlertSeverity
} from './BusinessMetricsDataModel';

export interface StreamingConfig {
  port: number;
  maxConnections: number;
  heartbeatInterval: number;
  bufferSize: number;
  compressionEnabled: boolean;
  rateLimitPerClient: number;
  authenticationRequired: boolean;
}

export interface StreamSubscription {
  id: string;
  clientId: string;
  tenantId: string;
  userId: string;
  metricIds: string[];
  kpiIds: string[];
  filters: StreamFilter[];
  aggregationLevel: 'raw' | 'minute' | 'hour' | 'day';
  maxUpdateFrequency: number;
  isActive: boolean;
  createdAt: Date;
  lastUpdated: Date;
}

export interface StreamFilter {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains';
  value: any;
}

export interface StreamMessage {
  type: 'metric_update' | 'kpi_update' | 'alert' | 'heartbeat' | 'error' | 'subscription_status';
  timestamp: Date;
  subscriptionId?: string;
  payload: any;
  sequenceNumber: number;
}

export interface StreamClient {
  id: string;
  socket: WebSocket;
  tenantId: string;
  userId: string;
  subscriptions: Set<string>;
  isAuthenticated: boolean;
  lastHeartbeat: Date;
  connectedAt: Date;
  messageCount: number;
  bytesTransferred: number;
  rateLimitBucket: number;
  rateLimitLastRefill: Date;
}

export interface MetricStreamData {
  metricId: string;
  subscriptionId: string;
  current: MetricValue;
  previous?: MetricValue;
  change: {
    absolute: number;
    percentage: number;
    trend: 'up' | 'down' | 'stable';
  };
  aggregation?: {
    period: string;
    value: number;
    count: number;
  };
}

export interface KPIStreamData {
  kpiId: string;
  subscriptionId: string;
  name: string;
  current: number;
  target?: number;
  status: 'on_track' | 'at_risk' | 'off_track';
  change: {
    absolute: number;
    percentage: number;
    period: string;
  };
  components: ComponentMetric[];
}

export interface ComponentMetric {
  metricId: string;
  name: string;
  value: number;
  weight: number;
  contribution: number;
}

export interface AlertStreamData {
  alertId: string;
  subscriptionId: string;
  type: 'threshold' | 'anomaly' | 'trend' | 'missing_data';
  severity: AlertSeverity;
  message: string;
  metricId?: string;
  kpiId?: string;
  currentValue: number;
  threshold?: number;
  triggeredAt: Date;
  context: Record<string, any>;
}

export class RealTimeMetricsStreaming extends EventEmitter {
  private config: StreamingConfig;
  private server: WebSocket.Server;
  private clients: Map<string, StreamClient> = new Map();
  private subscriptions: Map<string, StreamSubscription> = new Map();
  private metricBuffer: Map<string, MetricValue[]> = new Map();
  private sequenceCounter: number = 0;
  private aggregationCache: Map<string, any> = new Map();
  private heartbeatTimer: NodeJS.Timeout;
  private cleanupTimer: NodeJS.Timeout;

  constructor(config: StreamingConfig) {
    super();
    this.config = config;
    this.server = new WebSocket.Server({ 
      port: config.port,
      maxPayload: 1024 * 1024
    });
    
    this.setupWebSocketServer();
    this.startHeartbeat();
    this.startCleanupTimer();
  }

  private setupWebSocketServer(): void {
    this.server.on('connection', (socket: WebSocket, request) => {
      const client = this.createClient(socket, request);
      this.handleClientConnection(client);
    });

    this.server.on('error', (error) => {
      this.emit('serverError', error);
    });

    this.emit('serverStarted', { port: this.config.port });
  }

  private createClient(socket: WebSocket, request: any): StreamClient {
    const clientId = this.generateClientId();
    
    const client: StreamClient = {
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

  private handleClientConnection(client: StreamClient): void {
    this.emit('clientConnected', { clientId: client.id });

    client.socket.on('message', (data: Buffer) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleClientMessage(client, message);
      } catch (error: any) {
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

  private async handleClientMessage(client: StreamClient, message: any): Promise<any> {
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

  private async handleAuthentication(client: StreamClient, payload: any): Promise<any> {
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
      } else {
        this.sendMessage(client, {
          type: 'authentication_failed',
          timestamp: new Date(),
          payload: { message: 'Authentication failed' },
          sequenceNumber: this.getNextSequenceNumber()
        });
      }
    } catch (error: any) {
      this.sendError(client, 'Authentication error');
    }
  }

  private async handleSubscription(client: StreamClient, payload: any): Promise<any> {
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
      
    } catch (error: any) {
      this.sendError(client, `Subscription failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async handleUnsubscription(client: StreamClient, payload: any): Promise<any> {
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

  private async createSubscription(client: StreamClient, payload: any): Promise<StreamSubscription> {
    const subscription: StreamSubscription = {
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

  private async sendInitialData(client: StreamClient, subscription: StreamSubscription): Promise<any> {
    for (const metricId of subscription.metricIds) {
      const latestValue = await this.getLatestMetricValue(metricId);
      if (latestValue) {
        const streamData: MetricStreamData = {
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

  async publishMetricUpdate(metricValue: MetricValue): Promise<any> {
    this.addToBuffer(metricValue);
    
    const relevantSubscriptions = Array.from(this.subscriptions.values())
      .filter(sub => sub.isActive && sub.metricIds.includes(metricValue.metricId));

    for (const subscription of relevantSubscriptions) {
      if (this.matchesFilters(metricValue, subscription.filters)) {
        const client = this.clients.get(subscription.clientId);
        if (client && client.socket.readyState === WebSocket.OPEN) {
          
          const previous = await this.getPreviousMetricValue(metricValue.metricId);
          const streamData: MetricStreamData = {
            metricId: metricValue.metricId,
            subscriptionId: subscription.id,
            current: metricValue,
            previous,
            change: this.calculateChange(metricValue, previous)
          };

          if (subscription.aggregationLevel !== 'raw') {
            streamData.aggregation = await this.getAggregation(
              metricValue.metricId, 
              subscription.aggregationLevel
            );
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

  async publishKPIUpdate(kpiId: string, kpiData: KPIStreamData): Promise<any> {
    const relevantSubscriptions = Array.from(this.subscriptions.values())
      .filter(sub => sub.isActive && sub.kpiIds.includes(kpiId));

    for (const subscription of relevantSubscriptions) {
      const client = this.clients.get(subscription.clientId);
      if (client && client.socket.readyState === WebSocket.OPEN) {
        
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

  async publishAlert(alert: MetricAlert): Promise<any> {
    const alertData: AlertStreamData = {
      alertId: alert.id,
      subscriptionId: '',
      type: alert.alertType as any,
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
        return sub.isActive && (
          (alert.metricId && sub.metricIds.includes(alert.metricId)) ||
          (alert.kpiTargetId && sub.kpiIds.includes(alert.kpiTargetId))
        );
      });

    for (const subscription of relevantSubscriptions) {
      const client = this.clients.get(subscription.clientId);
      if (client && client.socket.readyState === WebSocket.OPEN) {
        
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

  private sendMessage(client: StreamClient, message: StreamMessage): void {
    if (client.socket.readyState === WebSocket.OPEN) {
      const data = JSON.stringify(message);
      
      if (this.config.compressionEnabled && data.length > 1024) {
        client.socket.send(data, { compress: true });
      } else {
        client.socket.send(data);
      }
      
      client.messageCount++;
      client.bytesTransferred += data.length;
    }
  }

  private sendError(client: StreamClient, message: string): void {
    this.sendMessage(client, {
      type: 'error',
      timestamp: new Date(),
      payload: { message },
      sequenceNumber: this.getNextSequenceNumber()
    });
  }

  private handleClientDisconnection(client: StreamClient): void {
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

  private checkRateLimit(client: StreamClient): boolean {
    const now = new Date();
    const timeSinceRefill = now.getTime() - client.rateLimitLastRefill.getTime();
    
    if (timeSinceRefill >= 1000) {
      client.rateLimitBucket = Math.min(
        this.config.rateLimitPerClient,
        client.rateLimitBucket + Math.floor(timeSinceRefill / 1000) * this.config.rateLimitPerClient
      );
      client.rateLimitLastRefill = now;
    }
    
    if (client.rateLimitBucket > 0) {
      client.rateLimitBucket--;
      return true;
    }
    
    return false;
  }

  private async validateAuthentication(token: string): Promise<boolean> {
    return token && token.length > 10;
  }

  private addToBuffer(metricValue: MetricValue): void {
    if (!this.metricBuffer.has(metricValue.metricId)) {
      this.metricBuffer.set(metricValue.metricId, []);
    }
    
    const buffer = this.metricBuffer.get(metricValue.metricId)!;
    buffer.push(metricValue);
    
    if (buffer.length > this.config.bufferSize) {
      buffer.shift();
    }
  }

  private async getLatestMetricValue(metricId: string): Promise<MetricValue | null> {
    const buffer = this.metricBuffer.get(metricId);
    return buffer && buffer.length > 0 ? buffer[buffer.length - 1] : null;
  }

  private async getPreviousMetricValue(metricId: string): Promise<MetricValue | null> {
    const buffer = this.metricBuffer.get(metricId);
    return buffer && buffer.length > 1 ? buffer[buffer.length - 2] : null;
  }

  private async getLatestKPIValue(kpiId: string): Promise<KPIStreamData | null> {
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

  private calculateChange(current: MetricValue, previous: MetricValue | null): any {
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

  private matchesFilters(metricValue: MetricValue, filters: StreamFilter[]): boolean {
    return filters.every(filter => {
      const fieldValue = this.getFieldValue(metricValue, filter.field);
      return this.evaluateFilter(fieldValue, filter.operator, filter.value);
    });
  }

  private getFieldValue(metricValue: MetricValue, field: string): any {
    const parts = field.split('.');
    let value: any = metricValue;
    
    for (const part of parts) {
      value = value?.[part];
    }
    
    return value;
  }

  private evaluateFilter(fieldValue: any, operator: string, filterValue: any): boolean {
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

  private async getAggregation(metricId: string, level: string): Promise<any> {
    const cacheKey = `${metricId}_${level}`;
    
    if (this.aggregationCache.has(cacheKey)) {
      const cached = this.aggregationCache.get(cacheKey);
      if (Date.now() - cached.timestamp < 60000) {
        return cached.data;
      }
    }
    
    const buffer = this.metricBuffer.get(metricId) || [];
    const now = new Date();
    let periodMs: number;
    
    switch (level) {
      case 'minute': periodMs = 60 * 1000; break;
      case 'hour': periodMs = 60 * 60 * 1000; break;
      case 'day': periodMs = 24 * 60 * 60 * 1000; break;
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

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.clients.forEach(client => {
        if (client.socket.readyState === WebSocket.OPEN) {
          const timeSinceLastHeartbeat = Date.now() - client.lastHeartbeat.getTime();
          
          if (timeSinceLastHeartbeat > this.config.heartbeatInterval * 2) {
            client.socket.terminate();
          } else {
            client.socket.ping();
          }
        }
      });
    }, this.config.heartbeatInterval);
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanupInactiveClients();
      this.cleanupBuffers();
      this.cleanupAggregationCache();
    }, 300000);
  }

  private cleanupInactiveClients(): void {
    const now = Date.now();
    const timeout = 5 * 60 * 1000;
    
    this.clients.forEach((client, clientId) => {
      if (now - client.lastHeartbeat.getTime() > timeout) {
        if (client.socket.readyState === WebSocket.OPEN) {
          client.socket.terminate();
        }
        this.handleClientDisconnection(client);
      }
    });
  }

  private cleanupBuffers(): void {
    const maxAge = 24 * 60 * 60 * 1000;
    const cutoff = new Date(Date.now() - maxAge);
    
    this.metricBuffer.forEach((buffer, metricId) => {
      const filtered = buffer.filter(value => value.timestamp >= cutoff);
      if (filtered.length !== buffer.length) {
        this.metricBuffer.set(metricId, filtered);
      }
    });
  }

  private cleanupAggregationCache(): void {
    const maxAge = 5 * 60 * 1000;
    const cutoff = Date.now() - maxAge;
    
    this.aggregationCache.forEach((cached, key) => {
      if (cached.timestamp < cutoff) {
        this.aggregationCache.delete(key);
      }
    });
  }

  private getNextSequenceNumber(): number {
    return ++this.sequenceCounter;
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateSubscriptionId(): string {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  getConnectedClients(): number {
    return this.clients.size;
  }

  getActiveSubscriptions(): number {
    return this.subscriptions.size;
  }

  getServerStats(): any {
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

  async shutdown(): Promise<any> {
    clearInterval(this.heartbeatTimer);
    clearInterval(this.cleanupTimer);
    
    this.clients.forEach(client => {
      if (client.socket.readyState === WebSocket.OPEN) {
        client.socket.close();
      }
    });
    
    this.server.close();
    this.emit('serverShutdown');
  }
}

