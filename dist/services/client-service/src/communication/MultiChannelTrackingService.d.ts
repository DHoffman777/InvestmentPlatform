import { EventEmitter } from 'events';
import { CommunicationRecord, CommunicationType, CommunicationChannel, CommunicationStatus, CommunicationAttachment, Priority, IntegrationSettings } from './CommunicationDataModel';
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
export declare enum SyncFrequency {
    REAL_TIME = "real_time",
    EVERY_MINUTE = "every_minute",
    EVERY_5_MINUTES = "every_5_minutes",
    EVERY_15_MINUTES = "every_15_minutes",
    EVERY_30_MINUTES = "every_30_minutes",
    HOURLY = "hourly",
    DAILY = "daily"
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
export declare enum AuthenticationType {
    API_KEY = "api_key",
    OAUTH2 = "oauth2",
    BASIC_AUTH = "basic_auth",
    JWT = "jwt",
    CERTIFICATE = "certificate",
    CUSTOM = "custom"
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
export declare enum WebhookEvent {
    MESSAGE_RECEIVED = "message_received",
    MESSAGE_SENT = "message_sent",
    MESSAGE_DELIVERED = "message_delivered",
    MESSAGE_READ = "message_read",
    CALL_STARTED = "call_started",
    CALL_ENDED = "call_ended",
    MEETING_SCHEDULED = "meeting_scheduled",
    MEETING_COMPLETED = "meeting_completed",
    DOCUMENT_SHARED = "document_shared",
    STATUS_CHANGED = "status_changed"
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
export declare enum ValidationType {
    REQUIRED = "required",
    MIN_LENGTH = "min_length",
    MAX_LENGTH = "max_length",
    REGEX = "regex",
    EMAIL = "email",
    PHONE = "phone",
    URL = "url",
    DATE = "date",
    NUMBER = "number",
    ENUM = "enum",
    CUSTOM = "custom"
}
export interface TransformationRule {
    field: string;
    type: TransformationType;
    parameters: Record<string, any>;
    condition?: string;
}
export declare enum TransformationType {
    UPPERCASE = "uppercase",
    LOWERCASE = "lowercase",
    TRIM = "trim",
    REPLACE = "replace",
    EXTRACT = "extract",
    FORMAT_DATE = "format_date",
    FORMAT_PHONE = "format_phone",
    ENCRYPT = "encrypt",
    HASH = "hash",
    SANITIZE = "sanitize",
    CUSTOM = "custom"
}
export interface ChannelAdapter {
    channel: CommunicationChannel;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    isConnected(): boolean;
    fetchMessages(since?: Date): Promise<CommunicationRecord[]>;
    sendMessage(message: OutgoingMessage): Promise<string>;
    updateMessageStatus(messageId: string, status: CommunicationStatus): Promise<void>;
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
export declare enum ChannelStatus {
    HEALTHY = "healthy",
    DEGRADED = "degraded",
    UNHEALTHY = "unhealthy",
    OFFLINE = "offline",
    MAINTENANCE = "maintenance"
}
export declare class MultiChannelTrackingService extends EventEmitter {
    private config;
    private adapters;
    private syncIntervals;
    private rateLimiters;
    private messageCache;
    private threadCache;
    private isRunning;
    private metricsCollector;
    constructor(config: MultiChannelTrackingConfiguration);
    startTracking(): Promise<void>;
    stopTracking(): Promise<void>;
    syncChannel(channel: CommunicationChannel, since?: Date): Promise<number>;
    sendMessage(message: OutgoingMessage, channel: CommunicationChannel): Promise<string>;
    searchMessages(query: CommunicationSearchQuery): Promise<CommunicationRecord[]>;
    getChannelHealth(): Promise<ChannelHealthStatus[]>;
    getMetrics(): Promise<TrackingMetrics>;
    private initializeAdapters;
    private createChannelAdapter;
    private connectAdapter;
    private disconnectAdapter;
    private startSyncIntervals;
    private stopSyncIntervals;
    private startRealTimeListeners;
    private getSyncIntervalMs;
    private processMessages;
    private applyTransformations;
    private enrichMessage;
    private isDuplicate;
    private categorizeMessage;
    private scanCompliance;
    private classifyPrivacy;
    private storeMessage;
    private linkToThread;
    private generateThreadKey;
    private createNewThread;
    private updateThreadStatus;
    private searchMessageCache;
    private matchesQuery;
    private filterAndSortResults;
    private generateContentHash;
    private evaluateCondition;
    private applyTransformation;
    private analyzeSentiment;
    private detectLanguage;
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
export { MultiChannelTrackingService };
