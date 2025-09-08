import { EventEmitter } from 'events';
import {
  CommunicationRecord,
  CommunicationType,
  CommunicationChannel,
  CommunicationDirection,
  CommunicationStatus,
  CommunicationCategory,
  CommunicationParticipant,
  CommunicationAttachment,
  CommunicationMetadata,
  ComplianceInfo,
  CommunicationThread,
  ThreadStatus,
  Priority,
  Urgency,
  SensitivityLevel,
  EmailProviderConfig,
  PhoneSystemConfig,
  VideoPlatformConfig,
  ChatSystemConfig,
  CRMSystemConfig,
  DocumentManagementConfig,
  IntegrationSettings
} from './CommunicationDataModel';

export interface CommunicationSearchQuery {
  query?: string;
  date_from?: Date;
  date_to?: Date;
  participants?: string[];
  client_id?: string;
  advisor_id?: string;
  type?: CommunicationType[];
  category?: CommunicationCategory[];
  status?: CommunicationStatus[];
  page?: number;
  page_size?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface MultiChannelTrackingConfiguration {
  channels: ChannelConfiguration[];
  integrations: IntegrationSettings;
  real_time_sync: boolean;
  batch_sync_interval_minutes: number;
  max_concurrent_channels: number;
  auto_categorization: boolean;
  duplicate_detection: boolean;
  thread_linking: boolean;
  sentiment_analysis: boolean;
  language_detection: boolean;
  content_enrichment: boolean;
  compliance_scanning: boolean;
  retention_policy_enforcement: boolean;
  encryption_required: boolean;
  audit_logging: boolean;
  performance_monitoring: boolean;
}

export interface ChannelConfiguration {
  channel: CommunicationChannel;
  types: CommunicationType[];
  enabled: boolean;
  priority: number;
  sync_frequency: SyncFrequency;
  retry_attempts: number;
  timeout_seconds: number;
  rate_limit: RateLimit;
  authentication: AuthenticationConfig;
  webhook_settings?: WebhookSettings;
  field_mappings: FieldMapping[];
  transformation_rules: TransformationRule[];
}

export enum SyncFrequency {
  REAL_TIME = 'real_time',
  EVERY_MINUTE = 'every_minute',
  EVERY_5_MINUTES = 'every_5_minutes',
  EVERY_15_MINUTES = 'every_15_minutes',
  EVERY_30_MINUTES = 'every_30_minutes',
  HOURLY = 'hourly',
  DAILY = 'daily'
}

export interface RateLimit {
  requests_per_minute: number;
  requests_per_hour: number;
  requests_per_day: number;
  burst_limit: number;
}

export interface AuthenticationConfig {
  type: AuthenticationType;
  credentials: Record<string, string>;
  token_refresh_interval_minutes: number;
  oauth_settings?: OAuthConfig;
}

export enum AuthenticationType {
  API_KEY = 'api_key',
  OAUTH2 = 'oauth2',
  BASIC_AUTH = 'basic_auth',
  JWT = 'jwt',
  CERTIFICATE = 'certificate',
  CUSTOM = 'custom'
}

export interface OAuthConfig {
  client_id: string;
  client_secret: string;
  redirect_uri: string;
  scope: string[];
  auth_url: string;
  token_url: string;
  refresh_url: string;
}

export interface WebhookSettings {
  enabled: boolean;
  endpoint_url: string;
  secret_key: string;
  events: WebhookEvent[];
  retry_policy: RetryPolicy;
  signature_verification: boolean;
}

export enum WebhookEvent {
  MESSAGE_RECEIVED = 'message_received',
  MESSAGE_SENT = 'message_sent',
  MESSAGE_DELIVERED = 'message_delivered',
  MESSAGE_READ = 'message_read',
  CALL_STARTED = 'call_started',
  CALL_ENDED = 'call_ended',
  MEETING_SCHEDULED = 'meeting_scheduled',
  MEETING_COMPLETED = 'meeting_completed',
  DOCUMENT_SHARED = 'document_shared',
  STATUS_CHANGED = 'status_changed'
}

export interface RetryPolicy {
  max_attempts: number;
  initial_delay_seconds: number;
  max_delay_seconds: number;
  backoff_multiplier: number;
  retry_conditions: string[];
}

export interface FieldMapping {
  source_field: string;
  target_field: string;
  transformation?: string;
  validation_rules?: ValidationRule[];
  is_required: boolean;
  default_value?: any;
}

export interface ValidationRule {
  type: ValidationType;
  parameters: Record<string, any>;
  error_message: string;
}

export enum ValidationType {
  REQUIRED = 'required',
  MIN_LENGTH = 'min_length',
  MAX_LENGTH = 'max_length',
  REGEX = 'regex',
  EMAIL = 'email',
  PHONE = 'phone',
  URL = 'url',
  DATE = 'date',
  NUMBER = 'number',
  ENUM = 'enum',
  CUSTOM = 'custom'
}

export interface TransformationRule {
  field: string;
  type: TransformationType;
  parameters: Record<string, any>;
  condition?: string;
}

export enum TransformationType {
  UPPERCASE = 'uppercase',
  LOWERCASE = 'lowercase',
  TRIM = 'trim',
  REPLACE = 'replace',
  EXTRACT = 'extract',
  FORMAT_DATE = 'format_date',
  FORMAT_PHONE = 'format_phone',
  ENCRYPT = 'encrypt',
  HASH = 'hash',
  SANITIZE = 'sanitize',
  CUSTOM = 'custom'
}

export interface ChannelAdapter {
  channel: CommunicationChannel;
  connect(): Promise<any>;
  disconnect(): Promise<any>;
  isConnected(): boolean;
  fetchMessages(since?: Date): Promise<CommunicationRecord[]>;
  sendMessage(message: OutgoingMessage): Promise<string>;
  updateMessageStatus(messageId: string, status: CommunicationStatus): Promise<any>;
  searchMessages(query: ChannelSearchQuery): Promise<CommunicationRecord[]>;
  getHealth(): Promise<ChannelHealthStatus>;
}

export interface OutgoingMessage {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject?: string;
  content: string;
  type: CommunicationType;
  priority: Priority;
  attachments?: CommunicationAttachment[];
  metadata?: Record<string, any>;
  template_id?: string;
  template_variables?: Record<string, any>;
}

export interface ChannelSearchQuery {
  query?: string;
  date_from?: Date;
  date_to?: Date;
  participants?: string[];
  message_types?: CommunicationType[];
  status?: CommunicationStatus[];
  limit?: number;
  offset?: number;
}

export interface ChannelHealthStatus {
  channel: CommunicationChannel;
  status: ChannelStatus;
  last_sync: Date;
  messages_synced: number;
  errors_count: number;
  last_error?: string;
  response_time_ms: number;
  uptime_percentage: number;
}

export enum ChannelStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNHEALTHY = 'unhealthy',
  OFFLINE = 'offline',
  MAINTENANCE = 'maintenance'
}

class MultiChannelTrackingService extends EventEmitter {
  private config: MultiChannelTrackingConfiguration;
  private adapters: Map<CommunicationChannel, ChannelAdapter>;
  private syncIntervals: Map<CommunicationChannel, NodeJS.Timeout>;
  private rateLimiters: Map<CommunicationChannel, RateLimiter>;
  private messageCache: Map<string, CommunicationRecord>;
  private threadCache: Map<string, CommunicationThread>;
  private isRunning: boolean = false;
  private metricsCollector: MetricsCollector;

  constructor(config: MultiChannelTrackingConfiguration) {
    super();
    this.config = config;
    this.adapters = new Map();
    this.syncIntervals = new Map();
    this.rateLimiters = new Map();
    this.messageCache = new Map();
    this.threadCache = new Map();
    this.metricsCollector = new MetricsCollector();
    this.initializeAdapters();
  }

  async startTracking(): Promise<any> {
    if (this.isRunning) {
      throw new Error('Multi-channel tracking is already running');
    }

    try {
      // Connect to all enabled channels
      const connectionPromises = Array.from(this.adapters.values()).map(adapter => 
        this.connectAdapter(adapter)
      );
      await Promise.all(connectionPromises);

      // Start sync intervals for each channel
      this.startSyncIntervals();

      // Start real-time listeners if enabled
      if (this.config.real_time_sync) {
        this.startRealTimeListeners();
      }

      this.isRunning = true;
      this.emit('tracking_started');
      console.log('Multi-channel tracking started successfully');

    } catch (error: any) {
      console.error('Failed to start multi-channel tracking:', error);
      throw error;
    }
  }

  async stopTracking(): Promise<any> {
    if (!this.isRunning) {
      return;
    }

    try {
      // Stop sync intervals
      this.stopSyncIntervals();

      // Disconnect from all channels
      const disconnectionPromises = Array.from(this.adapters.values()).map(adapter => 
        this.disconnectAdapter(adapter)
      );
      await Promise.all(disconnectionPromises);

      this.isRunning = false;
      this.emit('tracking_stopped');
      console.log('Multi-channel tracking stopped successfully');

    } catch (error: any) {
      console.error('Error stopping multi-channel tracking:', error);
      throw error;
    }
  }

  async syncChannel(channel: CommunicationChannel, since?: Date): Promise<number> {
    const adapter = this.adapters.get(channel);
    if (!adapter) {
      throw new Error(`No adapter found for channel: ${channel}`);
    }

    if (!adapter.isConnected()) {
      await this.connectAdapter(adapter);
    }

    try {
      const startTime = Date.now();
      const messages = await adapter.fetchMessages(since);
      const processedCount = await this.processMessages(messages, channel);
      
      const syncTime = Date.now() - startTime;
      this.metricsCollector.recordSync(channel, processedCount, syncTime);
      
      this.emit('channel_synced', {
        channel,
        messages_processed: processedCount,
        sync_time_ms: syncTime
      });

      return processedCount;

    } catch (error: any) {
      console.error(`Error syncing channel ${channel}:`, error);
      this.metricsCollector.recordError(channel, error as Error);
      this.emit('sync_error', { channel, error });
      throw error;
    }
  }

  async sendMessage(message: OutgoingMessage, channel: CommunicationChannel): Promise<string> {
    const adapter = this.adapters.get(channel);
    if (!adapter) {
      throw new Error(`No adapter found for channel: ${channel}`);
    }

    // Check rate limits
    const rateLimiter = this.rateLimiters.get(channel);
    if (rateLimiter && !rateLimiter.canMakeRequest()) {
      throw new Error(`Rate limit exceeded for channel: ${channel}`);
    }

    try {
      const messageId = await adapter.sendMessage(message);
      
      // Record the sent message
      const communicationRecord = await this.createCommunicationRecord(message, messageId, channel);
      await this.storeMessage(communicationRecord);
      
      this.emit('message_sent', { channel, message_id: messageId });
      return messageId;

    } catch (error: any) {
      console.error(`Error sending message via ${channel}:`, error);
      this.metricsCollector.recordError(channel, error as Error);
      throw error;
    }
  }

  async searchMessages(query: CommunicationSearchQuery): Promise<CommunicationRecord[]> {
    const results: CommunicationRecord[] = [];

    // Search in local cache first
    const cachedResults = this.searchMessageCache(query);
    results.push(...cachedResults);

    // Search in connected channels if needed
    if (results.length < (query.page_size || 50)) {
      const channelSearchPromises = Array.from(this.adapters.entries()).map(async ([channel, adapter]) => {
        if (adapter.isConnected()) {
          try {
            const channelQuery: ChannelSearchQuery = {
              query: query.query,
              date_from: query.date_from,
              date_to: query.date_to,
              participants: query.participants,
              message_types: query.type,
              status: query.status,
              limit: query.page_size,
              offset: (query.page || 1 - 1) * (query.page_size || 20)
            };
            return await adapter.searchMessages(channelQuery);
          } catch (error: any) {
            console.error(`Error searching in channel ${channel}:`, error);
            return [];
          }
        }
        return [];
      });

      const channelResults = await Promise.all(channelSearchPromises);
      channelResults.forEach(channelResult => results.push(...channelResult));
    }

    // Apply additional filtering and sorting
    return this.filterAndSortResults(results, query);
  }

  async getChannelHealth(): Promise<ChannelHealthStatus[]> {
    const healthPromises = Array.from(this.adapters.entries()).map(async ([channel, adapter]) => {
      try {
        return await adapter.getHealth();
      } catch (error: any) {
        return {
          channel,
          status: ChannelStatus.OFFLINE,
          last_sync: new Date(0),
          messages_synced: 0,
          errors_count: 1,
          last_error: error instanceof Error ? error.message : 'Unknown error',
          response_time_ms: 0,
          uptime_percentage: 0
        };
      }
    });

    return await Promise.all(healthPromises);
  }

  async getMetrics(): Promise<TrackingMetrics> {
    return this.metricsCollector.getMetrics();
  }

  private initializeAdapters(): void {
    for (const channelConfig of this.config.channels) {
      if (channelConfig.enabled) {
        const adapter = this.createChannelAdapter(channelConfig);
        this.adapters.set(channelConfig.channel, adapter);
        
        const rateLimiter = new RateLimiter(channelConfig.rate_limit);
        this.rateLimiters.set(channelConfig.channel, rateLimiter);
      }
    }
  }

  private createChannelAdapter(config: ChannelConfiguration): ChannelAdapter {
    switch (config.channel) {
      case CommunicationChannel.EMAIL_SYSTEM:
        return new EmailChannelAdapter(config, this.config.integrations.email_providers[0]);
      case CommunicationChannel.PHONE_SYSTEM:
        return new PhoneChannelAdapter(config, this.config.integrations.phone_systems[0]);
      case CommunicationChannel.VIDEO_PLATFORM:
        return new VideoChannelAdapter(config, this.config.integrations.video_platforms[0]);
      case CommunicationChannel.MESSAGING_SYSTEM:
        return new ChatChannelAdapter(config, this.config.integrations.chat_systems[0]);
      case CommunicationChannel.CRM_SYSTEM:
        return new CRMChannelAdapter(config, this.config.integrations.crm_systems[0]);
      case CommunicationChannel.DOCUMENT_PORTAL:
        return new DocumentChannelAdapter(config, this.config.integrations.document_management[0]);
      default:
        throw new Error(`Unsupported channel: ${config.channel}`);
    }
  }

  private async connectAdapter(adapter: ChannelAdapter): Promise<any> {
    try {
      await adapter.connect();
      console.log(`Connected to channel: ${adapter.channel}`);
    } catch (error: any) {
      console.error(`Failed to connect to channel ${adapter.channel}:`, error);
      throw error;
    }
  }

  private async disconnectAdapter(adapter: ChannelAdapter): Promise<any> {
    try {
      await adapter.disconnect();
      console.log(`Disconnected from channel: ${adapter.channel}`);
    } catch (error: any) {
      console.error(`Error disconnecting from channel ${adapter.channel}:`, error);
    }
  }

  private startSyncIntervals(): void {
    for (const [channel, adapter] of this.adapters) {
      const config = this.config.channels.find(c => c.channel === channel);
      if (config && config.sync_frequency !== SyncFrequency.REAL_TIME) {
        const intervalMs = this.getSyncIntervalMs(config.sync_frequency);
        const interval = setInterval(async () => {
          try {
            await this.syncChannel(channel);
          } catch (error: any) {
            console.error(`Scheduled sync failed for channel ${channel}:`, error);
          }
        }, intervalMs);
        
        this.syncIntervals.set(channel, interval);
      }
    }
  }

  private stopSyncIntervals(): void {
    for (const [channel, interval] of this.syncIntervals) {
      clearInterval(interval);
    }
    this.syncIntervals.clear();
  }

  private startRealTimeListeners(): void {
    for (const [channel, adapter] of this.adapters) {
      // Set up real-time event listeners for each adapter
      // Implementation would depend on the specific adapter capabilities
      console.log(`Setting up real-time listener for channel: ${channel}`);
    }
  }

  private getSyncIntervalMs(frequency: SyncFrequency): number {
    switch (frequency) {
      case SyncFrequency.EVERY_MINUTE: return 60 * 1000;
      case SyncFrequency.EVERY_5_MINUTES: return 5 * 60 * 1000;
      case SyncFrequency.EVERY_15_MINUTES: return 15 * 60 * 1000;
      case SyncFrequency.EVERY_30_MINUTES: return 30 * 60 * 1000;
      case SyncFrequency.HOURLY: return 60 * 60 * 1000;
      case SyncFrequency.DAILY: return 24 * 60 * 60 * 1000;
      default: return 15 * 60 * 1000; // Default to 15 minutes
    }
  }

  private async processMessages(messages: CommunicationRecord[], channel: CommunicationChannel): Promise<number> {
    let processedCount = 0;

    for (const message of messages) {
      try {
        // Apply transformations
        const transformedMessage = await this.applyTransformations(message, channel);
        
        // Enrich with additional data
        const enrichedMessage = await this.enrichMessage(transformedMessage, channel);
        
        // Detect duplicates
        if (this.config.duplicate_detection && await this.isDuplicate(enrichedMessage)) {
          continue;
        }
        
        // Auto-categorize if enabled
        if (this.config.auto_categorization) {
          enrichedMessage.category = await this.categorizeMessage(enrichedMessage);
        }
        
        // Perform compliance scanning
        if (this.config.compliance_scanning) {
          enrichedMessage.compliance = await this.scanCompliance(enrichedMessage);
        }
        
        // Store the message
        await this.storeMessage(enrichedMessage);
        
        // Link to threads if enabled
        if (this.config.thread_linking) {
          await this.linkToThread(enrichedMessage);
        }
        
        processedCount++;
        
      } catch (error: any) {
        console.error(`Error processing message ${message.id}:`, error);
        this.metricsCollector.recordError(channel, error as Error);
      }
    }

    return processedCount;
  }

  private async applyTransformations(message: CommunicationRecord, channel: CommunicationChannel): Promise<CommunicationRecord> {
    const config = this.config.channels.find(c => c.channel === channel);
    if (!config || !config.transformation_rules.length) {
      return message;
    }

    const transformedMessage = { ...message };
    
    for (const rule of config.transformation_rules) {
      if (rule.condition && !this.evaluateCondition(rule.condition, transformedMessage)) {
        continue;
      }
      
      const fieldValue = transformedMessage[rule.field as keyof CommunicationRecord];
      (transformedMessage as any)[rule.field] = await this.applyTransformation(fieldValue, rule);
    }
    
    return transformedMessage;
  }

  private async enrichMessage(message: CommunicationRecord, channel: CommunicationChannel): Promise<CommunicationRecord> {
    const enrichedMessage = { ...message };
    
    if (this.config.content_enrichment) {
      // Add sentiment analysis
      if (this.config.sentiment_analysis) {
        (enrichedMessage.metadata as any).sentiment = await this.analyzeSentiment(message.content);
      }
      
      // Add language detection
      if (this.config.language_detection) {
        (enrichedMessage.metadata as any).language = await this.detectLanguage(message.content);
      }
      
      // Add additional metadata
      (enrichedMessage.metadata as any).processed_at = new Date();
      (enrichedMessage.metadata as any).processing_version = '1.0';
      (enrichedMessage.metadata as any).source_channel = channel;
    }
    
    return enrichedMessage;
  }

  private async isDuplicate(message: CommunicationRecord): Promise<boolean> {
    // Check cache first
    if (this.messageCache.has(message.id)) {
      return true;
    }
    
    // Check for similar messages based on content hash, timestamp, and participants
    const contentHash = await this.generateContentHash(message);
    const duplicateKey = `${contentHash}_${message.timestamp.getTime()}_${message.participants.map(p => p.id).sort().join(',')}`;
    
    return this.messageCache.has(duplicateKey);
  }

  private async categorizeMessage(message: CommunicationRecord): Promise<CommunicationCategory> {
    // Simple keyword-based categorization
    const content = message.content.toLowerCase();
    const subject = message.subject?.toLowerCase() || '';
    
    if (content.includes('complaint') || content.includes('issue') || content.includes('problem')) {
      return CommunicationCategory.COMPLAINT;
    }
    if (content.includes('trade') || content.includes('buy') || content.includes('sell')) {
      return CommunicationCategory.TRADE_EXECUTION;
    }
    if (content.includes('portfolio') || content.includes('performance') || content.includes('return')) {
      return CommunicationCategory.PORTFOLIO_REVIEW;
    }
    if (content.includes('account') || subject.includes('account')) {
      return CommunicationCategory.ACCOUNT_MANAGEMENT;
    }
    if (content.includes('compliance') || content.includes('regulation')) {
      return CommunicationCategory.COMPLIANCE_MATTER;
    }
    
    return CommunicationCategory.GENERAL_INQUIRY;
  }

  private async scanCompliance(message: CommunicationRecord): Promise<ComplianceInfo> {
    // Basic compliance scanning implementation
    const compliance: ComplianceInfo = {
      retention_required: true,
      retention_period_years: 7, // Standard financial services retention
      legal_hold: false,
      regulatory_requirements: ['SEC Rule 17a-4', 'FINRA Rule 4511'],
      privacy_classification: this.classifyPrivacy(message),
      access_restrictions: [],
      audit_trail_required: true,
      encryption_required: this.config.encryption_required,
      review_status: 'pending' as any,
      compliance_notes: 'Auto-generated compliance info'
    };
    
    return compliance;
  }

  private classifyPrivacy(message: CommunicationRecord): any {
    const content = message.content.toLowerCase();
    
    if (content.includes('ssn') || content.includes('social security') || 
        content.includes('account number') || content.includes('password')) {
      return 'sensitive_personal_data';
    }
    if (content.includes('balance') || content.includes('investment') || 
        content.includes('portfolio')) {
      return 'financial_data';
    }
    
    return 'internal';
  }

  private async storeMessage(message: CommunicationRecord): Promise<any> {
    // Store in cache
    this.messageCache.set(message.id, message);
    
    // Store in database (implementation would depend on the database layer)
    // await this.database.storeCommunicationRecord(message);
    
    this.emit('message_stored', message);
  }

  private async linkToThread(message: CommunicationRecord): Promise<any> {
    // Simple thread linking based on subject and participants
    const threadKey = this.generateThreadKey(message);
    
    let thread = this.threadCache.get(threadKey);
    if (!thread) {
      thread = this.createNewThread(message);
      this.threadCache.set(threadKey, thread);
    } else {
      thread.messages.push(message);
      thread.updated_at = new Date();
    }
    
    // Update thread status based on message
    this.updateThreadStatus(thread, message);
  }

  private generateThreadKey(message: CommunicationRecord): string {
    const participantIds = message.participants.map(p => p.id).sort().join(',');
    const subjectKey = message.subject?.toLowerCase().replace(/^(re:|fwd:)\s*/i, '') || 'no-subject';
    return `${participantIds}_${subjectKey}`;
  }

  private createNewThread(message: CommunicationRecord): CommunicationThread {
    return {
      id: `thread_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      subject: message.subject || 'No Subject',
      participants: message.participants,
      messages: [message],
      created_at: message.timestamp,
      updated_at: message.timestamp,
      status: ThreadStatus.ACTIVE,
      category: message.category,
      tags: message.tags,
      priority: message.metadata.priority,
      client_id: message.client_id,
      advisor_id: message.advisor_id,
      business_context: message.metadata.business_context,
      compliance_info: message.compliance
    };
  }

  private updateThreadStatus(thread: CommunicationThread, message: CommunicationRecord): void {
    // Update thread status based on message direction and type
    if (message.direction === CommunicationDirection.INBOUND) {
      thread.status = ThreadStatus.AWAITING_RESPONSE;
    } else if (message.direction === CommunicationDirection.OUTBOUND) {
      thread.status = ThreadStatus.ACTIVE;
    }
  }

  private searchMessageCache(query: CommunicationSearchQuery): CommunicationRecord[] {
    const results: CommunicationRecord[] = [];
    
    for (const message of this.messageCache.values()) {
      if (this.matchesQuery(message, query)) {
        results.push(message);
      }
    }
    
    return results;
  }

  private matchesQuery(message: CommunicationRecord, query: CommunicationSearchQuery): boolean {
    // Simple query matching implementation
    if (query.query && !message.content.toLowerCase().includes(query.query.toLowerCase()) &&
        !message.subject?.toLowerCase().includes(query.query.toLowerCase())) {
      return false;
    }
    
    if (query.client_id && message.client_id !== query.client_id) {
      return false;
    }
    
    if (query.advisor_id && message.advisor_id !== query.advisor_id) {
      return false;
    }
    
    if (query.type && !query.type.includes(message.type)) {
      return false;
    }
    
    if (query.category && !query.category.includes(message.category)) {
      return false;
    }
    
    if (query.date_from && message.timestamp < query.date_from) {
      return false;
    }
    
    if (query.date_to && message.timestamp > query.date_to) {
      return false;
    }
    
    return true;
  }

  private filterAndSortResults(results: CommunicationRecord[], query: CommunicationSearchQuery): CommunicationRecord[] {
    // Remove duplicates
    const uniqueResults = results.filter((message, index, self) => 
      index === self.findIndex(m => m.id === message.id)
    );
    
    // Sort results
    const sortField = query.sort_by || 'timestamp' as any;
    const sortOrder = query.sort_order || 'desc' as any;
    
    uniqueResults.sort((a, b) => {
      const aValue = a[sortField as keyof CommunicationRecord];
      const bValue = b[sortField as keyof CommunicationRecord];
      
      let comparison = 0;
      if (aValue != null && bValue != null) {
        if (aValue < bValue) comparison = -1;
        if (aValue > bValue) comparison = 1;
      }
      
      return sortOrder === 'desc' ? -comparison : comparison;
    });
    
    // Apply pagination
    const page = query.page || 1;
    const pageSize = query.page_size || 20;
    const startIndex = (page - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    
    return uniqueResults.slice(startIndex, endIndex);
  }

  private async generateContentHash(message: CommunicationRecord): Promise<string> {
    // Simple hash generation for duplicate detection
    const hashInput = `${message.content}_${message.subject}_${message.type}`;
    return Buffer.from(hashInput).toString('base64').substr(0, 32);
  }

  private evaluateCondition(condition: string, message: CommunicationRecord): boolean {
    // Simple condition evaluation (in a real implementation, use a proper expression parser)
    try {
      // This is a simplified implementation - in production use a safe expression evaluator
      return true; // Placeholder
    } catch (error: any) {
      console.error('Error evaluating condition:', error);
      return false;
    }
  }

  private async applyTransformation(value: any, rule: TransformationRule): Promise<any> {
    switch (rule.type) {
      case TransformationType.UPPERCASE:
        return typeof value === 'string' ? value.toUpperCase() : value;
      case TransformationType.LOWERCASE:
        return typeof value === 'string' ? value.toLowerCase() : value;
      case TransformationType.TRIM:
        return typeof value === 'string' ? value.trim() : value;
      case TransformationType.REPLACE:
        if (typeof value === 'string' && rule.parameters.from && rule.parameters.to) {
          return value.replace(new RegExp(rule.parameters.from, 'g'), rule.parameters.to);
        }
        return value;
      default:
        return value;
    }
  }

  private async analyzeSentiment(content: string): Promise<SentimentResult> {
    // Placeholder sentiment analysis
    return {
      score: 0.5,
      label: 'neutral',
      confidence: 0.75
    };
  }

  private async detectLanguage(content: string): Promise<string> {
    // Placeholder language detection
    return 'en';
  }

  private async createCommunicationRecord(message: OutgoingMessage, messageId: string, channel: CommunicationChannel): Promise<CommunicationRecord> {
    return {
      id: messageId,
      client_id: '',
      advisor_id: '',
      type: message.type,
      channel,
      direction: CommunicationDirection.OUTBOUND,
      subject: message.subject,
      content: message.content,
      timestamp: new Date(),
      status: CommunicationStatus.SENT,
      category: CommunicationCategory.GENERAL_INQUIRY,
      tags: [],
      attachments: message.attachments || [],
      participants: message.to.map(to => ({
        id: to,
        name: to,
        email: to,
        phone: '',
        role: 'recipient' as any,
        is_client: false,
        is_internal: false
      })) as unknown as CommunicationParticipant[],
      metadata: {
        priority: message.priority,
        urgency: 'MEDIUM' as any,
        sensitivity: SensitivityLevel.INTERNAL,
        language: 'en',
        timezone: 'UTC',
        ...(message.metadata || {})
      } as CommunicationMetadata,
      compliance: {
        retention_required: true,
        retention_period_years: 7,
        legal_hold: false,
        regulatory_requirements: [],
        privacy_classification: 'internal' as any,
        access_restrictions: [],
        audit_trail_required: true,
        encryption_required: false,
        review_status: 'pending' as any,
        compliance_notes: ''
      },
      created_at: new Date(),
      updated_at: new Date(),
      created_by: 'system',
      updated_by: 'system'
    };
  }
}

interface SentimentResult {
  score: number;
  label: string;
  confidence: number;
}

class RateLimiter {
  private requests: number[] = [];
  private limit: RateLimit;

  constructor(limit: RateLimit) {
    this.limit = limit;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    
    // Clean old requests
    this.requests = this.requests.filter(time => now - time < 60000); // Last minute
    
    return this.requests.length < this.limit.requests_per_minute;
  }

  recordRequest(): void {
    this.requests.push(Date.now());
  }
}

class MetricsCollector {
  private metrics: TrackingMetrics = {
    total_messages: 0,
    messages_by_channel: {} as Record<CommunicationChannel, number>,
    sync_operations: 0,
    sync_errors: 0,
    average_sync_time: 0,
    uptime_percentage: 100,
    last_sync_times: {} as Record<CommunicationChannel, Date>,
    error_counts: {} as Record<CommunicationChannel, number>
  };

  recordSync(channel: CommunicationChannel, messageCount: number, syncTime: number): void {
    this.metrics.total_messages += messageCount;
    this.metrics.messages_by_channel[channel] = (this.metrics.messages_by_channel[channel] || 0) + messageCount;
    this.metrics.sync_operations++;
    this.metrics.last_sync_times[channel] = new Date();
    
    // Update average sync time
    this.metrics.average_sync_time = (this.metrics.average_sync_time + syncTime) / 2;
  }

  recordError(channel: CommunicationChannel, error: Error): void {
    this.metrics.sync_errors++;
    this.metrics.error_counts[channel] = (this.metrics.error_counts[channel] || 0) + 1;
  }

  getMetrics(): TrackingMetrics {
    return { ...this.metrics };
  }
}

interface TrackingMetrics {
  total_messages: number;
  messages_by_channel: Record<CommunicationChannel, number>;
  sync_operations: number;
  sync_errors: number;
  average_sync_time: number;
  uptime_percentage: number;
  last_sync_times: Record<CommunicationChannel, Date>;
  error_counts: Record<CommunicationChannel, number>;
}

// Base class for channel adapters
abstract class BaseChannelAdapter implements ChannelAdapter {
  protected config: ChannelConfiguration;
  protected connected: boolean = false;

  constructor(config: ChannelConfiguration) {
    this.config = config;
  }

  abstract get channel(): CommunicationChannel;
  abstract connect(): Promise<any>;
  abstract disconnect(): Promise<any>;
  abstract fetchMessages(since?: Date): Promise<CommunicationRecord[]>;
  abstract sendMessage(message: OutgoingMessage): Promise<string>;
  abstract updateMessageStatus(messageId: string, status: CommunicationStatus): Promise<any>;
  abstract searchMessages(query: ChannelSearchQuery): Promise<CommunicationRecord[]>;

  isConnected(): boolean {
    return this.connected;
  }

  async getHealth(): Promise<ChannelHealthStatus> {
    return {
      channel: this.channel,
      status: this.connected ? ChannelStatus.HEALTHY : ChannelStatus.OFFLINE,
      last_sync: new Date(),
      messages_synced: 0,
      errors_count: 0,
      response_time_ms: 0,
      uptime_percentage: this.connected ? 100 : 0
    };
  }
}

// Example implementations of channel adapters
class EmailChannelAdapter extends BaseChannelAdapter {
  private emailConfig: EmailProviderConfig;

  constructor(config: ChannelConfiguration, emailConfig: EmailProviderConfig) {
    super(config);
    this.emailConfig = emailConfig;
  }

  get channel(): CommunicationChannel {
    return CommunicationChannel.EMAIL_SYSTEM;
  }

  async connect(): Promise<any> {
    // Implement email provider connection
    this.connected = true;
  }

  async disconnect(): Promise<any> {
    this.connected = false;
  }

  async fetchMessages(since?: Date): Promise<CommunicationRecord[]> {
    // Implement email fetching
    return [];
  }

  async sendMessage(message: OutgoingMessage): Promise<string> {
    // Implement email sending
    return `email_${Date.now()}`;
  }

  async updateMessageStatus(messageId: string, status: CommunicationStatus): Promise<any> {
    // Implement status update
  }

  async searchMessages(query: ChannelSearchQuery): Promise<CommunicationRecord[]> {
    // Implement email search
    return [];
  }
}

class PhoneChannelAdapter extends BaseChannelAdapter {
  private phoneConfig: PhoneSystemConfig;

  constructor(config: ChannelConfiguration, phoneConfig: PhoneSystemConfig) {
    super(config);
    this.phoneConfig = phoneConfig;
  }

  get channel(): CommunicationChannel {
    return CommunicationChannel.PHONE_SYSTEM;
  }

  async connect(): Promise<any> {
    this.connected = true;
  }

  async disconnect(): Promise<any> {
    this.connected = false;
  }

  async fetchMessages(since?: Date): Promise<CommunicationRecord[]> {
    return [];
  }

  async sendMessage(message: OutgoingMessage): Promise<string> {
    return `call_${Date.now()}`;
  }

  async updateMessageStatus(messageId: string, status: CommunicationStatus): Promise<any> {
  }

  async searchMessages(query: ChannelSearchQuery): Promise<CommunicationRecord[]> {
    return [];
  }
}

class VideoChannelAdapter extends BaseChannelAdapter {
  private videoConfig: VideoPlatformConfig;

  constructor(config: ChannelConfiguration, videoConfig: VideoPlatformConfig) {
    super(config);
    this.videoConfig = videoConfig;
  }

  get channel(): CommunicationChannel {
    return CommunicationChannel.VIDEO_PLATFORM;
  }

  async connect(): Promise<any> {
    this.connected = true;
  }

  async disconnect(): Promise<any> {
    this.connected = false;
  }

  async fetchMessages(since?: Date): Promise<CommunicationRecord[]> {
    return [];
  }

  async sendMessage(message: OutgoingMessage): Promise<string> {
    return `meeting_${Date.now()}`;
  }

  async updateMessageStatus(messageId: string, status: CommunicationStatus): Promise<any> {
  }

  async searchMessages(query: ChannelSearchQuery): Promise<CommunicationRecord[]> {
    return [];
  }
}

class ChatChannelAdapter extends BaseChannelAdapter {
  private chatConfig: ChatSystemConfig;

  constructor(config: ChannelConfiguration, chatConfig: ChatSystemConfig) {
    super(config);
    this.chatConfig = chatConfig;
  }

  get channel(): CommunicationChannel {
    return CommunicationChannel.MESSAGING_SYSTEM;
  }

  async connect(): Promise<any> {
    this.connected = true;
  }

  async disconnect(): Promise<any> {
    this.connected = false;
  }

  async fetchMessages(since?: Date): Promise<CommunicationRecord[]> {
    return [];
  }

  async sendMessage(message: OutgoingMessage): Promise<string> {
    return `chat_${Date.now()}`;
  }

  async updateMessageStatus(messageId: string, status: CommunicationStatus): Promise<any> {
  }

  async searchMessages(query: ChannelSearchQuery): Promise<CommunicationRecord[]> {
    return [];
  }
}

class CRMChannelAdapter extends BaseChannelAdapter {
  private crmConfig: CRMSystemConfig;

  constructor(config: ChannelConfiguration, crmConfig: CRMSystemConfig) {
    super(config);
    this.crmConfig = crmConfig;
  }

  get channel(): CommunicationChannel {
    return CommunicationChannel.CRM_SYSTEM;
  }

  async connect(): Promise<any> {
    this.connected = true;
  }

  async disconnect(): Promise<any> {
    this.connected = false;
  }

  async fetchMessages(since?: Date): Promise<CommunicationRecord[]> {
    return [];
  }

  async sendMessage(message: OutgoingMessage): Promise<string> {
    return `crm_${Date.now()}`;
  }

  async updateMessageStatus(messageId: string, status: CommunicationStatus): Promise<any> {
  }

  async searchMessages(query: ChannelSearchQuery): Promise<CommunicationRecord[]> {
    return [];
  }
}

class DocumentChannelAdapter extends BaseChannelAdapter {
  private docConfig: DocumentManagementConfig;

  constructor(config: ChannelConfiguration, docConfig: DocumentManagementConfig) {
    super(config);
    this.docConfig = docConfig;
  }

  get channel(): CommunicationChannel {
    return CommunicationChannel.DOCUMENT_PORTAL;
  }

  async connect(): Promise<any> {
    this.connected = true;
  }

  async disconnect(): Promise<any> {
    this.connected = false;
  }

  async fetchMessages(since?: Date): Promise<CommunicationRecord[]> {
    return [];
  }

  async sendMessage(message: OutgoingMessage): Promise<string> {
    return `doc_${Date.now()}`;
  }

  async updateMessageStatus(messageId: string, status: CommunicationStatus): Promise<any> {
  }

  async searchMessages(query: ChannelSearchQuery): Promise<CommunicationRecord[]> {
    return [];
  }
}

export { MultiChannelTrackingService };