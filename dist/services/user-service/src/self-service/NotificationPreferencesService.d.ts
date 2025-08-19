import { EventEmitter } from 'events';
export interface NotificationPreferences {
    id: string;
    userId: string;
    tenantId: string;
    channels: NotificationChannel[];
    categories: NotificationCategory[];
    templates: NotificationTemplate[];
    schedules: NotificationSchedule[];
    globalSettings: GlobalNotificationSettings;
    personalizations: NotificationPersonalization[];
    suppressions: NotificationSuppression[];
    deliverySettings: DeliverySettings;
    consentSettings: ConsentSettings;
    lastUpdated: Date;
    version: number;
    auditTrail: NotificationAuditEntry[];
}
export interface NotificationChannel {
    id: string;
    type: ChannelType;
    name: string;
    isEnabled: boolean;
    isPrimary: boolean;
    settings: ChannelSettings;
    verificationStatus: VerificationStatus;
    verifiedAt?: Date;
    rateLimits: RateLimit[];
    deliveryWindow: DeliveryWindow;
    retryPolicy: RetryPolicy;
    failureThreshold: number;
    successRate: number;
    lastUsed?: Date;
    usageCount: number;
    isActive: boolean;
    metadata: Record<string, any>;
}
export interface NotificationCategory {
    id: string;
    name: string;
    type: CategoryType;
    priority: Priority;
    isEnabled: boolean;
    channels: string[];
    frequency: FrequencySettings;
    aggregation: AggregationSettings;
    escalation: EscalationSettings;
    conditions: NotificationCondition[];
    templates: string[];
    customRules: CustomRule[];
    complianceFlags: string[];
    regulatoryRequirements: string[];
    description: string;
    parentCategoryId?: string;
    subcategories: string[];
}
export interface NotificationTemplate {
    id: string;
    name: string;
    categoryId: string;
    channelType: ChannelType;
    subject: string;
    content: TemplateContent;
    variables: TemplateVariable[];
    localization: LocalizationSettings[];
    styling: TemplateStyle;
    attachments: TemplateAttachment[];
    previewData: Record<string, any>;
    isActive: boolean;
    version: number;
    createdAt: Date;
    updatedAt: Date;
    usage: TemplateUsage;
}
export interface NotificationSchedule {
    id: string;
    name: string;
    categoryIds: string[];
    isEnabled: boolean;
    scheduleType: ScheduleType;
    cronExpression?: string;
    intervalMinutes?: number;
    fixedTimes?: string[];
    daysOfWeek?: number[];
    daysOfMonth?: number[];
    timezone: string;
    startDate?: Date;
    endDate?: Date;
    maxExecutions?: number;
    executionCount: number;
    lastExecution?: Date;
    nextExecution?: Date;
    conditions: ScheduleCondition[];
}
export interface GlobalNotificationSettings {
    globalMute: boolean;
    muteDuration?: number;
    muteReason?: string;
    quietHours: QuietHours;
    emergencyOverride: EmergencyOverride;
    batching: BatchingSettings;
    deduplication: DeduplicationSettings;
    prioritization: PrioritizationSettings;
    fallbackChannel?: string;
    maxDailyNotifications: number;
    currentDailyCount: number;
    lastResetDate: Date;
}
export interface NotificationPersonalization {
    id: string;
    userId: string;
    categoryId: string;
    channelId: string;
    customSettings: Record<string, any>;
    keywords: string[];
    filters: PersonalizationFilter[];
    preferences: PersonalizationPreference[];
    aiLearning: AILearningData;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface NotificationSuppression {
    id: string;
    type: SuppressionType;
    value: string;
    reason: string;
    isTemporary: boolean;
    startDate: Date;
    endDate?: Date;
    isActive: boolean;
    createdBy: string;
    metadata: Record<string, any>;
}
export interface DeliverySettings {
    maxRetries: number;
    retryBackoffMultiplier: number;
    failoverEnabled: boolean;
    deliveryTimeout: number;
    confirmationRequired: boolean;
    readReceiptTracking: boolean;
    linkTracking: boolean;
    openTracking: boolean;
    unsubscribeTracking: boolean;
    bounceHandling: BounceHandlingSettings;
    spamFiltering: boolean;
}
export interface ConsentSettings {
    marketingConsent: boolean;
    marketingConsentDate?: Date;
    transactionalConsent: boolean;
    transactionalConsentDate?: Date;
    researchConsent: boolean;
    researchConsentDate?: Date;
    thirdPartyConsent: boolean;
    thirdPartyConsentDate?: Date;
    consentVersion: string;
    consentSource: ConsentSource;
    withdrawalDate?: Date;
    withdrawalReason?: string;
    complianceFlags: string[];
    gdprCompliant: boolean;
    ccpaCompliant: boolean;
    canSpamCompliant: boolean;
}
export interface ChannelSettings {
    emailAddress?: string;
    displayName?: string;
    replyTo?: string;
    htmlEnabled?: boolean;
    attachmentsEnabled?: boolean;
    phoneNumber?: string;
    countryCode?: string;
    carrier?: string;
    shortCodeEnabled?: boolean;
    deviceTokens?: string[];
    appId?: string;
    soundEnabled?: boolean;
    badgeEnabled?: boolean;
    vibrationEnabled?: boolean;
    webhookUrl?: string;
    secret?: string;
    headers?: Record<string, string>;
    displayDuration?: number;
    position?: string;
    style?: string;
    slackChannel?: string;
    slackWebhook?: string;
    botToken?: string;
    voiceNumber?: string;
    language?: string;
    speed?: number;
    customEndpoint?: string;
    authentication?: Record<string, any>;
}
export interface VerificationStatus {
    isVerified: boolean;
    verificationMethod: string;
    verificationToken?: string;
    verificationExpiry?: Date;
    verificationAttempts: number;
    lastVerificationAttempt?: Date;
}
export interface RateLimit {
    type: RateLimitType;
    count: number;
    windowMinutes: number;
    currentCount: number;
    windowStart: Date;
    isActive: boolean;
}
export interface DeliveryWindow {
    enabled: boolean;
    timezone: string;
    allowedDays: number[];
    allowedTimes: Array<{
        start: string;
        end: string;
    }>;
    blackoutPeriods: Array<{
        start: Date;
        end: Date;
        reason: string;
    }>;
}
export interface RetryPolicy {
    enabled: boolean;
    maxRetries: number;
    backoffType: BackoffType;
    baseDelaySeconds: number;
    maxDelaySeconds: number;
    retryableErrors: string[];
}
export interface FrequencySettings {
    immediate: boolean;
    batching: BatchingConfig;
    digest: DigestConfig;
    throttling: ThrottlingConfig;
}
export interface AggregationSettings {
    enabled: boolean;
    windowMinutes: number;
    maxItems: number;
    groupBy: string[];
    template: string;
}
export interface EscalationSettings {
    enabled: boolean;
    levels: EscalationLevel[];
    timeoutMinutes: number;
    maxEscalations: number;
}
export interface NotificationCondition {
    id: string;
    field: string;
    operator: ConditionOperator;
    value: any;
    isActive: boolean;
}
export interface CustomRule {
    id: string;
    name: string;
    condition: string;
    action: RuleAction;
    priority: number;
    isActive: boolean;
}
export interface TemplateContent {
    text: string;
    html?: string;
    markdown?: string;
    json?: Record<string, any>;
    attachmentUrls?: string[];
}
export interface TemplateVariable {
    name: string;
    type: VariableType;
    defaultValue?: any;
    isRequired: boolean;
    validation?: ValidationRule;
    description: string;
}
export interface LocalizationSettings {
    locale: string;
    subject: string;
    content: TemplateContent;
    variables: Record<string, string>;
}
export interface TemplateStyle {
    theme: string;
    colors: Record<string, string>;
    fonts: Record<string, string>;
    layout: string;
    customCss?: string;
}
export interface TemplateAttachment {
    name: string;
    url: string;
    mimeType: string;
    size: number;
    isInline: boolean;
}
export interface TemplateUsage {
    sentCount: number;
    deliveredCount: number;
    openedCount: number;
    clickedCount: number;
    bounceCount: number;
    complaintCount: number;
    unsubscribeCount: number;
    lastUsed?: Date;
}
export interface ScheduleCondition {
    type: ConditionType;
    expression: string;
    parameters: Record<string, any>;
}
export interface QuietHours {
    enabled: boolean;
    startTime: string;
    endTime: string;
    timezone: string;
    daysOfWeek: number[];
    exceptions: string[];
}
export interface EmergencyOverride {
    enabled: boolean;
    categories: string[];
    channels: string[];
    keywords: string[];
    senders: string[];
}
export interface BatchingSettings {
    enabled: boolean;
    windowMinutes: number;
    maxBatchSize: number;
    groupBy: string[];
    template: string;
}
export interface DeduplicationSettings {
    enabled: boolean;
    windowMinutes: number;
    keyFields: string[];
    strategy: DeduplicationStrategy;
}
export interface PrioritizationSettings {
    enabled: boolean;
    rules: PriorityRule[];
    defaultPriority: Priority;
}
export interface PersonalizationFilter {
    field: string;
    operator: FilterOperator;
    value: any;
    weight: number;
}
export interface PersonalizationPreference {
    key: string;
    value: any;
    learnedFrom: string;
    confidence: number;
    lastUpdated: Date;
}
export interface AILearningData {
    openRate: number;
    clickRate: number;
    engagementScore: number;
    preferredTime: string;
    preferredChannel: string;
    topics: string[];
    lastLearning: Date;
}
export interface BounceHandlingSettings {
    hardBounceAction: BounceAction;
    softBounceAction: BounceAction;
    maxSoftBounces: number;
    suppressAfterBounce: boolean;
    notifyOnBounce: boolean;
}
export interface BatchingConfig {
    enabled: boolean;
    windowMinutes: number;
    maxItems: number;
    template: string;
}
export interface DigestConfig {
    enabled: boolean;
    frequency: DigestFrequency;
    time: string;
    daysOfWeek: number[];
    template: string;
}
export interface ThrottlingConfig {
    enabled: boolean;
    maxPerHour: number;
    maxPerDay: number;
    burstLimit: number;
}
export interface EscalationLevel {
    level: number;
    delayMinutes: number;
    channels: string[];
    recipients: string[];
    template?: string;
}
export interface PriorityRule {
    condition: string;
    priority: Priority;
    boost: number;
}
export interface ValidationRule {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    required?: boolean;
}
export interface NotificationAuditEntry {
    id: string;
    timestamp: Date;
    userId: string;
    action: NotificationAction;
    category?: string;
    channel?: string;
    details: Record<string, any>;
    ipAddress: string;
    userAgent: string;
}
export declare enum ChannelType {
    EMAIL = "email",
    SMS = "sms",
    PUSH = "push",
    WEBHOOK = "webhook",
    IN_APP = "in_app",
    SLACK = "slack",
    TEAMS = "teams",
    VOICE = "voice",
    WHATSAPP = "whatsapp",
    TELEGRAM = "telegram"
}
export declare enum CategoryType {
    TRANSACTIONAL = "transactional",
    MARKETING = "marketing",
    SECURITY = "security",
    SYSTEM = "system",
    TRADING = "trading",
    PORTFOLIO = "portfolio",
    COMPLIANCE = "compliance",
    BILLING = "billing",
    SUPPORT = "support",
    NEWS = "news"
}
export declare enum Priority {
    LOW = "low",
    NORMAL = "normal",
    HIGH = "high",
    URGENT = "urgent",
    CRITICAL = "critical"
}
export declare enum ScheduleType {
    IMMEDIATE = "immediate",
    DELAYED = "delayed",
    RECURRING = "recurring",
    CRON = "cron",
    EVENT_DRIVEN = "event_driven"
}
export declare enum SuppressionType {
    EMAIL = "email",
    PHONE = "phone",
    DEVICE = "device",
    CATEGORY = "category",
    GLOBAL = "global"
}
export declare enum ConsentSource {
    REGISTRATION = "registration",
    WEB_FORM = "web_form",
    API = "api",
    ADMIN = "admin",
    IMPORT = "import",
    DOUBLE_OPTIN = "double_optin"
}
export declare enum RateLimitType {
    PER_MINUTE = "per_minute",
    PER_HOUR = "per_hour",
    PER_DAY = "per_day",
    PER_WEEK = "per_week",
    PER_MONTH = "per_month"
}
export declare enum BackoffType {
    LINEAR = "linear",
    EXPONENTIAL = "exponential",
    FIXED = "fixed"
}
export declare enum ConditionOperator {
    EQUALS = "equals",
    NOT_EQUALS = "not_equals",
    GREATER_THAN = "greater_than",
    LESS_THAN = "less_than",
    CONTAINS = "contains",
    NOT_CONTAINS = "not_contains",
    STARTS_WITH = "starts_with",
    ENDS_WITH = "ends_with",
    IN = "in",
    NOT_IN = "not_in",
    REGEX = "regex"
}
export declare enum RuleAction {
    ALLOW = "allow",
    BLOCK = "block",
    MODIFY = "modify",
    ESCALATE = "escalate",
    DEFER = "defer"
}
export declare enum VariableType {
    STRING = "string",
    NUMBER = "number",
    BOOLEAN = "boolean",
    DATE = "date",
    ARRAY = "array",
    OBJECT = "object"
}
export declare enum ConditionType {
    TIME_BASED = "time_based",
    DATA_BASED = "data_based",
    EVENT_BASED = "event_based",
    USER_BASED = "user_based"
}
export declare enum DeduplicationStrategy {
    FIRST = "first",
    LAST = "last",
    MERGE = "merge",
    COUNT = "count"
}
export declare enum FilterOperator {
    EQUALS = "equals",
    NOT_EQUALS = "not_equals",
    CONTAINS = "contains",
    GREATER_THAN = "greater_than",
    LESS_THAN = "less_than"
}
export declare enum BounceAction {
    SUPPRESS = "suppress",
    RETRY = "retry",
    IGNORE = "ignore",
    ESCALATE = "escalate"
}
export declare enum DigestFrequency {
    DAILY = "daily",
    WEEKLY = "weekly",
    MONTHLY = "monthly"
}
export declare enum NotificationAction {
    PREFERENCE_UPDATED = "preference_updated",
    CHANNEL_ADDED = "channel_added",
    CHANNEL_REMOVED = "channel_removed",
    CHANNEL_VERIFIED = "channel_verified",
    CATEGORY_ENABLED = "category_enabled",
    CATEGORY_DISABLED = "category_disabled",
    GLOBAL_MUTE = "global_mute",
    GLOBAL_UNMUTE = "global_unmute",
    SUPPRESSION_ADDED = "suppression_added",
    SUPPRESSION_REMOVED = "suppression_removed"
}
export declare class NotificationPreferencesService extends EventEmitter {
    private preferences;
    private defaultCategories;
    private defaultTemplates;
    constructor();
    getPreferences(userId: string, tenantId: string): Promise<NotificationPreferences | null>;
    initializePreferences(userId: string, tenantId: string): Promise<NotificationPreferences>;
    updateChannelSettings(userId: string, tenantId: string, channelId: string, settings: Partial<ChannelSettings>, ipAddress: string, userAgent: string): Promise<NotificationChannel | null>;
    addNotificationChannel(userId: string, tenantId: string, channelData: Omit<NotificationChannel, 'id' | 'verificationStatus' | 'lastUsed' | 'usageCount' | 'successRate'>, ipAddress: string, userAgent: string): Promise<NotificationChannel>;
    removeNotificationChannel(userId: string, tenantId: string, channelId: string, ipAddress: string, userAgent: string): Promise<boolean>;
    verifyNotificationChannel(userId: string, tenantId: string, channelId: string, verificationToken: string, ipAddress: string, userAgent: string): Promise<boolean>;
    updateCategoryPreferences(userId: string, tenantId: string, categoryId: string, updates: Partial<NotificationCategory>, ipAddress: string, userAgent: string): Promise<NotificationCategory | null>;
    updateGlobalSettings(userId: string, tenantId: string, settings: Partial<GlobalNotificationSettings>, ipAddress: string, userAgent: string): Promise<GlobalNotificationSettings | null>;
    addSuppression(userId: string, tenantId: string, suppression: Omit<NotificationSuppression, 'id' | 'isActive'>, ipAddress: string, userAgent: string): Promise<NotificationSuppression>;
    removeSuppression(userId: string, tenantId: string, suppressionId: string, ipAddress: string, userAgent: string): Promise<boolean>;
    createNotificationSchedule(userId: string, tenantId: string, schedule: Omit<NotificationSchedule, 'id' | 'executionCount' | 'lastExecution' | 'nextExecution'>, ipAddress: string, userAgent: string): Promise<NotificationSchedule>;
    updateConsentSettings(userId: string, tenantId: string, consent: Partial<ConsentSettings>, ipAddress: string, userAgent: string): Promise<ConsentSettings | null>;
    getNotificationHistory(userId: string, tenantId: string, filter?: {
        categoryId?: string;
        channelId?: string;
        startDate?: Date;
        endDate?: Date;
        limit?: number;
    }): Promise<NotificationAuditEntry[]>;
    exportPreferences(userId: string, tenantId: string): Promise<any>;
    private createDefaultChannels;
    private createDefaultGlobalSettings;
    private createDefaultDeliverySettings;
    private createDefaultConsentSettings;
    private validateVerificationToken;
    private calculateNextExecution;
    private sanitizeSettings;
    private addAuditEntry;
    private initializeDefaults;
}
