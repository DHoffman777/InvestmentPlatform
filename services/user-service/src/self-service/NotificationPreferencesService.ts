import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';

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
  channels: string[]; // channel IDs
  frequency: FrequencySettings;
  aggregation: AggregationSettings;
  escalation: EscalationSettings;
  conditions: NotificationCondition[];
  templates: string[]; // template IDs
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
  fixedTimes?: string[]; // HH:mm format
  daysOfWeek?: number[]; // 0-6, Sunday=0
  daysOfMonth?: number[]; // 1-31
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
  muteDuration?: number; // in minutes
  muteReason?: string;
  quietHours: QuietHours;
  emergencyOverride: EmergencyOverride;
  batching: BatchingSettings;
  deduplication: DeduplicationSettings;
  prioritization: PrioritizationSettings;
  fallbackChannel?: string; // channel ID
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
  value: string; // email, phone, category, etc.
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
  deliveryTimeout: number; // in seconds
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
  // Email settings
  emailAddress?: string;
  displayName?: string;
  replyTo?: string;
  htmlEnabled?: boolean;
  attachmentsEnabled?: boolean;
  
  // SMS settings
  phoneNumber?: string;
  countryCode?: string;
  carrier?: string;
  shortCodeEnabled?: boolean;
  
  // Push notification settings
  deviceTokens?: string[];
  appId?: string;
  soundEnabled?: boolean;
  badgeEnabled?: boolean;
  vibrationEnabled?: boolean;
  
  // Webhook settings
  webhookUrl?: string;
  secret?: string;
  headers?: Record<string, string>;
  
  // In-app settings
  displayDuration?: number;
  position?: string;
  style?: string;
  
  // Slack settings
  slackChannel?: string;
  slackWebhook?: string;
  botToken?: string;
  
  // Voice call settings
  voiceNumber?: string;
  language?: string;
  speed?: number;
  
  // Custom channel settings
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
  allowedDays: number[]; // 0-6, Sunday=0
  allowedTimes: Array<{
    start: string; // HH:mm
    end: string;   // HH:mm
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
  condition: string; // JavaScript expression
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
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
  timezone: string;
  daysOfWeek: number[]; // 0-6, Sunday=0
  exceptions: string[]; // category IDs that can override quiet hours
}

export interface EmergencyOverride {
  enabled: boolean;
  categories: string[]; // category IDs
  channels: string[];   // channel IDs
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
  time: string; // HH:mm
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

// Enums
export enum ChannelType {
  EMAIL = 'email',
  SMS = 'sms',
  PUSH = 'push',
  WEBHOOK = 'webhook',
  IN_APP = 'in_app',
  SLACK = 'slack',
  TEAMS = 'teams',
  VOICE = 'voice',
  WHATSAPP = 'whatsapp',
  TELEGRAM = 'telegram'
}

export enum CategoryType {
  TRANSACTIONAL = 'transactional',
  MARKETING = 'marketing',
  SECURITY = 'security',
  SYSTEM = 'system',
  TRADING = 'trading',
  PORTFOLIO = 'portfolio',
  COMPLIANCE = 'compliance',
  BILLING = 'billing',
  SUPPORT = 'support',
  NEWS = 'news'
}

export enum Priority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent',
  CRITICAL = 'critical'
}

export enum ScheduleType {
  IMMEDIATE = 'immediate',
  DELAYED = 'delayed',
  RECURRING = 'recurring',
  CRON = 'cron',
  EVENT_DRIVEN = 'event_driven'
}

export enum SuppressionType {
  EMAIL = 'email',
  PHONE = 'phone',
  DEVICE = 'device',
  CATEGORY = 'category',
  GLOBAL = 'global'
}

export enum ConsentSource {
  REGISTRATION = 'registration',
  WEB_FORM = 'web_form',
  API = 'api',
  ADMIN = 'admin',
  IMPORT = 'import',
  DOUBLE_OPTIN = 'double_optin'
}

export enum RateLimitType {
  PER_MINUTE = 'per_minute',
  PER_HOUR = 'per_hour',
  PER_DAY = 'per_day',
  PER_WEEK = 'per_week',
  PER_MONTH = 'per_month'
}

export enum BackoffType {
  LINEAR = 'linear',
  EXPONENTIAL = 'exponential',
  FIXED = 'fixed'
}

export enum ConditionOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  IN = 'in',
  NOT_IN = 'not_in',
  REGEX = 'regex'
}

export enum RuleAction {
  ALLOW = 'allow',
  BLOCK = 'block',
  MODIFY = 'modify',
  ESCALATE = 'escalate',
  DEFER = 'defer'
}

export enum VariableType {
  STRING = 'string',
  NUMBER = 'number',
  BOOLEAN = 'boolean',
  DATE = 'date',
  ARRAY = 'array',
  OBJECT = 'object'
}

export enum ConditionType {
  TIME_BASED = 'time_based',
  DATA_BASED = 'data_based',
  EVENT_BASED = 'event_based',
  USER_BASED = 'user_based'
}

export enum DeduplicationStrategy {
  FIRST = 'first',
  LAST = 'last',
  MERGE = 'merge',
  COUNT = 'count'
}

export enum FilterOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  CONTAINS = 'contains',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than'
}

export enum BounceAction {
  SUPPRESS = 'suppress',
  RETRY = 'retry',
  IGNORE = 'ignore',
  ESCALATE = 'escalate'
}

export enum DigestFrequency {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

export enum NotificationAction {
  PREFERENCE_UPDATED = 'preference_updated',
  CHANNEL_ADDED = 'channel_added',
  CHANNEL_REMOVED = 'channel_removed',
  CHANNEL_VERIFIED = 'channel_verified',
  CATEGORY_ENABLED = 'category_enabled',
  CATEGORY_DISABLED = 'category_disabled',
  GLOBAL_MUTE = 'global_mute',
  GLOBAL_UNMUTE = 'global_unmute',
  SUPPRESSION_ADDED = 'suppression_added',
  SUPPRESSION_REMOVED = 'suppression_removed'
}

export class NotificationPreferencesService extends EventEmitter {
  private preferences: Map<string, NotificationPreferences> = new Map();
  private defaultCategories: NotificationCategory[] = [];
  private defaultTemplates: NotificationTemplate[] = [];

  constructor() {
    super();
    this.initializeDefaults();
  }

  public async getPreferences(userId: string, tenantId: string): Promise<NotificationPreferences | null> {
    return Array.from(this.preferences.values())
      .find(pref => pref.userId === userId && pref.tenantId === tenantId) || null;
  }

  public async initializePreferences(userId: string, tenantId: string): Promise<NotificationPreferences> {
    const existing = await this.getPreferences(userId, tenantId);
    if (existing) {
      return existing;
    }

    const preferences: NotificationPreferences = {
      id: randomUUID(),
      userId,
      tenantId,
      channels: this.createDefaultChannels(),
      categories: [...this.defaultCategories],
      templates: [...this.defaultTemplates],
      schedules: [],
      globalSettings: this.createDefaultGlobalSettings(),
      personalizations: [],
      suppressions: [],
      deliverySettings: this.createDefaultDeliverySettings(),
      consentSettings: this.createDefaultConsentSettings(),
      lastUpdated: new Date(),
      version: 1,
      auditTrail: []
    };

    this.preferences.set(preferences.id, preferences);
    this.addAuditEntry(preferences, NotificationAction.PREFERENCE_UPDATED, 'Preferences initialized', 'unknown', 'unknown');

    this.emit('preferencesInitialized', preferences);
    return preferences;
  }

  public async updateChannelSettings(
    userId: string,
    tenantId: string,
    channelId: string,
    settings: Partial<ChannelSettings>,
    ipAddress: string,
    userAgent: string
  ): Promise<NotificationChannel | null> {
    const preferences = await this.getPreferences(userId, tenantId);
    if (!preferences) return null;

    const channel = preferences.channels.find(c => c.id === channelId);
    if (!channel) return null;

    const oldSettings = { ...channel.settings };
    channel.settings = { ...channel.settings, ...settings };
    
    preferences.lastUpdated = new Date();
    preferences.version++;

    this.addAuditEntry(preferences, NotificationAction.CHANNEL_VERIFIED, `Channel ${channel.name} settings updated`, ipAddress, userAgent);

    this.emit('channelSettingsUpdated', { preferences, channel, oldSettings });
    return channel;
  }

  public async addNotificationChannel(
    userId: string,
    tenantId: string,
    channelData: Omit<NotificationChannel, 'id' | 'verificationStatus' | 'lastUsed' | 'usageCount' | 'successRate'>,
    ipAddress: string,
    userAgent: string
  ): Promise<NotificationChannel> {
    const preferences = await this.getPreferences(userId, tenantId);
    if (!preferences) {
      throw new Error('Notification preferences not found');
    }

    const channel: NotificationChannel = {
      id: randomUUID(),
      verificationStatus: {
        isVerified: false,
        verificationMethod: 'none',
        verificationAttempts: 0
      },
      usageCount: 0,
      successRate: 0,
      ...channelData
    };

    preferences.channels.push(channel);
    preferences.lastUpdated = new Date();
    preferences.version++;

    this.addAuditEntry(preferences, NotificationAction.CHANNEL_ADDED, `Channel ${channel.name} added`, ipAddress, userAgent);

    this.emit('channelAdded', { preferences, channel });
    return channel;
  }

  public async removeNotificationChannel(
    userId: string,
    tenantId: string, 
    channelId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<boolean> {
    const preferences = await this.getPreferences(userId, tenantId);
    if (!preferences) return false;

    const channelIndex = preferences.channels.findIndex(c => c.id === channelId);
    if (channelIndex === -1) return false;

    const channel = preferences.channels[channelIndex];
    
    // Don't allow removal of primary channel if it's the only one
    if (channel.isPrimary && preferences.channels.filter(c => c.isActive).length === 1) {
      throw new Error('Cannot remove the only active notification channel');
    }

    preferences.channels.splice(channelIndex, 1);
    preferences.lastUpdated = new Date();
    preferences.version++;

    this.addAuditEntry(preferences, NotificationAction.CHANNEL_REMOVED, `Channel ${channel.name} removed`, ipAddress, userAgent);

    this.emit('channelRemoved', { preferences, channel });
    return true;
  }

  public async verifyNotificationChannel(
    userId: string,
    tenantId: string,
    channelId: string,
    verificationToken: string,
    ipAddress: string,
    userAgent: string
  ): Promise<boolean> {
    const preferences = await this.getPreferences(userId, tenantId);
    if (!preferences) return false;

    const channel = preferences.channels.find(c => c.id === channelId);
    if (!channel) return false;

    const isValidToken = this.validateVerificationToken(channel, verificationToken);
    
    if (isValidToken) {
      channel.verificationStatus.isVerified = true;
      channel.verifiedAt = new Date();
      
      preferences.lastUpdated = new Date();
      preferences.version++;

      this.addAuditEntry(preferences, NotificationAction.CHANNEL_VERIFIED, `Channel ${channel.name} verified`, ipAddress, userAgent);

      this.emit('channelVerified', { preferences, channel });
      return true;
    } else {
      channel.verificationStatus.verificationAttempts++;
      channel.verificationStatus.lastVerificationAttempt = new Date();
      return false;
    }
  }

  public async updateCategoryPreferences(
    userId: string,
    tenantId: string,
    categoryId: string,
    updates: Partial<NotificationCategory>,
    ipAddress: string,
    userAgent: string
  ): Promise<NotificationCategory | null> {
    const preferences = await this.getPreferences(userId, tenantId);
    if (!preferences) return null;

    const category = preferences.categories.find(c => c.id === categoryId);
    if (!category) return null;

    const wasEnabled = category.isEnabled;
    Object.assign(category, updates);
    
    preferences.lastUpdated = new Date();
    preferences.version++;

    const action = category.isEnabled !== wasEnabled 
      ? (category.isEnabled ? NotificationAction.CATEGORY_ENABLED : NotificationAction.CATEGORY_DISABLED)
      : NotificationAction.PREFERENCE_UPDATED;

    this.addAuditEntry(preferences, action, `Category ${category.name} updated`, ipAddress, userAgent);

    this.emit('categoryPreferencesUpdated', { preferences, category });
    return category;
  }

  public async updateGlobalSettings(
    userId: string,
    tenantId: string,
    settings: Partial<GlobalNotificationSettings>,
    ipAddress: string,
    userAgent: string
  ): Promise<GlobalNotificationSettings | null> {
    const preferences = await this.getPreferences(userId, tenantId);
    if (!preferences) return null;

    const oldGlobalMute = preferences.globalSettings.globalMute;
    Object.assign(preferences.globalSettings, settings);
    
    preferences.lastUpdated = new Date();
    preferences.version++;

    // Track mute/unmute actions
    if (settings.globalMute !== undefined && settings.globalMute !== oldGlobalMute) {
      const action = settings.globalMute ? NotificationAction.GLOBAL_MUTE : NotificationAction.GLOBAL_UNMUTE;
      this.addAuditEntry(preferences, action, `Global notifications ${settings.globalMute ? 'muted' : 'unmuted'}`, ipAddress, userAgent);
    } else {
      this.addAuditEntry(preferences, NotificationAction.PREFERENCE_UPDATED, 'Global settings updated', ipAddress, userAgent);
    }

    this.emit('globalSettingsUpdated', { preferences, oldGlobalMute });
    return preferences.globalSettings;
  }

  public async addSuppression(
    userId: string,
    tenantId: string,
    suppression: Omit<NotificationSuppression, 'id' | 'isActive'>,
    ipAddress: string,
    userAgent: string
  ): Promise<NotificationSuppression> {
    const preferences = await this.getPreferences(userId, tenantId);
    if (!preferences) {
      throw new Error('Notification preferences not found');
    }

    const newSuppression: NotificationSuppression = {
      id: randomUUID(),
      isActive: true,
      ...suppression
    };

    preferences.suppressions.push(newSuppression);
    preferences.lastUpdated = new Date();
    preferences.version++;

    this.addAuditEntry(preferences, NotificationAction.SUPPRESSION_ADDED, `Suppression added: ${suppression.type} - ${suppression.value}`, ipAddress, userAgent);

    this.emit('suppressionAdded', { preferences, suppression: newSuppression });
    return newSuppression;
  }

  public async removeSuppression(
    userId: string,
    tenantId: string,
    suppressionId: string,
    ipAddress: string,
    userAgent: string
  ): Promise<boolean> {
    const preferences = await this.getPreferences(userId, tenantId);
    if (!preferences) return false;

    const suppressionIndex = preferences.suppressions.findIndex(s => s.id === suppressionId);
    if (suppressionIndex === -1) return false;

    const suppression = preferences.suppressions[suppressionIndex];
    preferences.suppressions.splice(suppressionIndex, 1);
    preferences.lastUpdated = new Date();
    preferences.version++;

    this.addAuditEntry(preferences, NotificationAction.SUPPRESSION_REMOVED, `Suppression removed: ${suppression.type} - ${suppression.value}`, ipAddress, userAgent);

    this.emit('suppressionRemoved', { preferences, suppression });
    return true;
  }

  public async createNotificationSchedule(
    userId: string,
    tenantId: string,
    schedule: Omit<NotificationSchedule, 'id' | 'executionCount' | 'lastExecution' | 'nextExecution'>,
    ipAddress: string,
    userAgent: string
  ): Promise<NotificationSchedule> {
    const preferences = await this.getPreferences(userId, tenantId);
    if (!preferences) {
      throw new Error('Notification preferences not found');
    }

    const newSchedule: NotificationSchedule = {
      ...schedule,
      id: randomUUID(),
      executionCount: 0,
      lastExecution: undefined,
      nextExecution: new Date(Date.now() + 24 * 60 * 60 * 1000) // Default 24 hours from now
    };
    
    // Update with correct next execution time
    newSchedule.nextExecution = this.calculateNextExecution(newSchedule);

    preferences.schedules.push(newSchedule);
    preferences.lastUpdated = new Date();
    preferences.version++;

    this.addAuditEntry(preferences, NotificationAction.PREFERENCE_UPDATED, `Schedule created: ${schedule.name}`, ipAddress, userAgent);

    this.emit('scheduleCreated', { preferences, schedule: newSchedule });
    return newSchedule;
  }

  public async updateConsentSettings(
    userId: string,
    tenantId: string,
    consent: Partial<ConsentSettings>,
    ipAddress: string,
    userAgent: string
  ): Promise<ConsentSettings | null> {
    const preferences = await this.getPreferences(userId, tenantId);
    if (!preferences) return null;

    const oldConsent = { ...preferences.consentSettings };
    
    // Update consent with timestamps
    if (consent.marketingConsent !== undefined && consent.marketingConsent !== oldConsent.marketingConsent) {
      consent.marketingConsentDate = new Date();
    }
    if (consent.transactionalConsent !== undefined && consent.transactionalConsent !== oldConsent.transactionalConsent) {
      consent.transactionalConsentDate = new Date();
    }
    if (consent.researchConsent !== undefined && consent.researchConsent !== oldConsent.researchConsent) {
      consent.researchConsentDate = new Date();
    }
    if (consent.thirdPartyConsent !== undefined && consent.thirdPartyConsent !== oldConsent.thirdPartyConsent) {
      consent.thirdPartyConsentDate = new Date();
    }

    Object.assign(preferences.consentSettings, consent);
    preferences.lastUpdated = new Date();
    preferences.version++;

    this.addAuditEntry(preferences, NotificationAction.PREFERENCE_UPDATED, 'Consent settings updated', ipAddress, userAgent);

    this.emit('consentSettingsUpdated', { preferences, oldConsent });
    return preferences.consentSettings;
  }

  public async getNotificationHistory(
    userId: string,
    tenantId: string,
    filter: {
      categoryId?: string;
      channelId?: string;
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    } = {}
  ): Promise<NotificationAuditEntry[]> {
    const preferences = await this.getPreferences(userId, tenantId);
    if (!preferences) return [];

    let entries = [...preferences.auditTrail];

    if (filter.categoryId) {
      entries = entries.filter(entry => entry.category === filter.categoryId);
    }

    if (filter.channelId) {
      entries = entries.filter(entry => entry.channel === filter.channelId);
    }

    if (filter.startDate) {
      entries = entries.filter(entry => entry.timestamp >= filter.startDate!);
    }

    if (filter.endDate) {
      entries = entries.filter(entry => entry.timestamp <= filter.endDate!);
    }

    entries = entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    if (filter.limit) {
      entries = entries.slice(0, filter.limit);
    }

    return entries;
  }

  public async exportPreferences(userId: string, tenantId: string): Promise<any> {
    const preferences = await this.getPreferences(userId, tenantId);
    if (!preferences) return null;

    return {
      userId,
      tenantId,
      exportedAt: new Date(),
      preferences: {
        channels: preferences.channels.map(c => ({
          type: c.type,
          name: c.name,
          isEnabled: c.isEnabled,
          settings: this.sanitizeSettings(c.settings)
        })),
        categories: preferences.categories.map(c => ({
          name: c.name,
          type: c.type,
          isEnabled: c.isEnabled,
          priority: c.priority
        })),
        globalSettings: {
          globalMute: preferences.globalSettings.globalMute,
          quietHours: preferences.globalSettings.quietHours,
          maxDailyNotifications: preferences.globalSettings.maxDailyNotifications
        },
        consentSettings: preferences.consentSettings
      }
    };
  }

  private createDefaultChannels(): NotificationChannel[] {
    return [
      {
        id: randomUUID(),
        type: ChannelType.EMAIL,
        name: 'Primary Email',
        isEnabled: true,
        isPrimary: true,
        settings: {},
        verificationStatus: {
          isVerified: false,
          verificationMethod: 'email',
          verificationAttempts: 0
        },
        rateLimits: [{
          type: RateLimitType.PER_HOUR,
          count: 10,
          windowMinutes: 60,
          currentCount: 0,
          windowStart: new Date(),
          isActive: true
        }],
        deliveryWindow: {
          enabled: false,
          timezone: 'UTC',
          allowedDays: [1, 2, 3, 4, 5], // Monday-Friday
          allowedTimes: [{ start: '09:00', end: '17:00' }],
          blackoutPeriods: []
        },
        retryPolicy: {
          enabled: true,
          maxRetries: 3,
          backoffType: BackoffType.EXPONENTIAL,
          baseDelaySeconds: 60,
          maxDelaySeconds: 3600,
          retryableErrors: ['timeout', 'server_error']
        },
        failureThreshold: 5,
        successRate: 100,
        usageCount: 0,
        isActive: true,
        metadata: {}
      }
    ];
  }

  private createDefaultGlobalSettings(): GlobalNotificationSettings {
    return {
      globalMute: false,
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00',
        timezone: 'UTC',
        daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
        exceptions: []
      },
      emergencyOverride: {
        enabled: true,
        categories: ['security', 'critical'],
        channels: [],
        keywords: ['urgent', 'emergency', 'critical'],
        senders: []
      },
      batching: {
        enabled: false,
        windowMinutes: 60,
        maxBatchSize: 10,
        groupBy: ['category'],
        template: 'default_batch'
      },
      deduplication: {
        enabled: true,
        windowMinutes: 15,
        keyFields: ['subject', 'category'],
        strategy: DeduplicationStrategy.LAST
      },
      prioritization: {
        enabled: true,
        rules: [],
        defaultPriority: Priority.NORMAL
      },
      maxDailyNotifications: 50,
      currentDailyCount: 0,
      lastResetDate: new Date()
    };
  }

  private createDefaultDeliverySettings(): DeliverySettings {
    return {
      maxRetries: 3,
      retryBackoffMultiplier: 2,
      failoverEnabled: true,
      deliveryTimeout: 30,
      confirmationRequired: false,
      readReceiptTracking: true,
      linkTracking: true,
      openTracking: true,
      unsubscribeTracking: true,
      bounceHandling: {
        hardBounceAction: BounceAction.SUPPRESS,
        softBounceAction: BounceAction.RETRY,
        maxSoftBounces: 5,
        suppressAfterBounce: true,
        notifyOnBounce: false
      },
      spamFiltering: true
    };
  }

  private createDefaultConsentSettings(): ConsentSettings {
    return {
      marketingConsent: false,
      transactionalConsent: true,
      transactionalConsentDate: new Date(),
      researchConsent: false,
      thirdPartyConsent: false,
      consentVersion: '1.0',
      consentSource: ConsentSource.REGISTRATION,
      complianceFlags: [],
      gdprCompliant: true,
      ccpaCompliant: true,
      canSpamCompliant: true
    };
  }

  private validateVerificationToken(channel: NotificationChannel, token: string): boolean {
    // Simplified validation - would use proper token verification
    const expectedToken = channel.verificationStatus.verificationToken;
    const expiry = channel.verificationStatus.verificationExpiry;
    
    return expectedToken === token && (expiry ? expiry > new Date() : false);
  }

  private calculateNextExecution(schedule: NotificationSchedule): Date {
    // Simplified calculation - would use proper cron parsing
    const now = new Date();
    return new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
  }

  private sanitizeSettings(settings: ChannelSettings): Partial<ChannelSettings> {
    // Remove sensitive information for export
    const sanitized = { ...settings };
    delete sanitized.secret;
    delete sanitized.botToken;
    if (sanitized.phoneNumber) {
      sanitized.phoneNumber = sanitized.phoneNumber.replace(/\d(?=\d{4})/g, '*');
    }
    if (sanitized.emailAddress) {
      const [user, domain] = sanitized.emailAddress.split('@');
      sanitized.emailAddress = `${user.slice(0, 2)}***@${domain}`;
    }
    return sanitized;
  }

  private addAuditEntry(
    preferences: NotificationPreferences,
    action: NotificationAction,
    details: string,
    ipAddress: string,
    userAgent: string
  ): void {
    const entry: NotificationAuditEntry = {
      id: randomUUID(),
      timestamp: new Date(),
      userId: preferences.userId,
      action,
      details: { description: details },
      ipAddress,
      userAgent
    };

    preferences.auditTrail.push(entry);
    
    // Limit audit trail size
    if (preferences.auditTrail.length > 1000) {
      preferences.auditTrail = preferences.auditTrail.slice(-1000);
    }
  }

  private initializeDefaults(): void {
    // Initialize default categories
    this.defaultCategories = [
      {
        id: randomUUID(),
        name: 'Trading Alerts',
        type: CategoryType.TRADING,
        priority: Priority.HIGH,
        isEnabled: true,
        channels: [],
        frequency: {
          immediate: true,
          batching: { enabled: false, windowMinutes: 0, maxItems: 0, template: '' },
          digest: { enabled: false, frequency: DigestFrequency.DAILY, time: '09:00', daysOfWeek: [], template: '' },
          throttling: { enabled: false, maxPerHour: 0, maxPerDay: 0, burstLimit: 0 }
        },
        aggregation: { enabled: false, windowMinutes: 0, maxItems: 0, groupBy: [], template: '' },
        escalation: { enabled: false, levels: [], timeoutMinutes: 0, maxEscalations: 0 },
        conditions: [],
        templates: [],
        customRules: [],
        complianceFlags: [],
        regulatoryRequirements: [],
        description: 'Trading execution and market alerts',
        subcategories: []
      },
      {
        id: randomUUID(),
        name: 'Security Notifications',
        type: CategoryType.SECURITY,
        priority: Priority.CRITICAL,
        isEnabled: true,
        channels: [],
        frequency: {
          immediate: true,
          batching: { enabled: false, windowMinutes: 0, maxItems: 0, template: '' },
          digest: { enabled: false, frequency: DigestFrequency.DAILY, time: '09:00', daysOfWeek: [], template: '' },
          throttling: { enabled: false, maxPerHour: 0, maxPerDay: 0, burstLimit: 0 }
        },
        aggregation: { enabled: false, windowMinutes: 0, maxItems: 0, groupBy: [], template: '' },
        escalation: { enabled: true, levels: [], timeoutMinutes: 15, maxEscalations: 3 },
        conditions: [],
        templates: [],
        customRules: [],
        complianceFlags: [],
        regulatoryRequirements: [],
        description: 'Security and authentication related notifications',
        subcategories: []
      }
    ];
  }
}