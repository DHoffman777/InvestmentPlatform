"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationPreferencesService = exports.NotificationAction = exports.DigestFrequency = exports.BounceAction = exports.FilterOperator = exports.DeduplicationStrategy = exports.ConditionType = exports.VariableType = exports.RuleAction = exports.ConditionOperator = exports.BackoffType = exports.RateLimitType = exports.ConsentSource = exports.SuppressionType = exports.ScheduleType = exports.Priority = exports.CategoryType = exports.ChannelType = void 0;
const events_1 = require("events");
const crypto_1 = require("crypto");
// Enums
var ChannelType;
(function (ChannelType) {
    ChannelType["EMAIL"] = "email";
    ChannelType["SMS"] = "sms";
    ChannelType["PUSH"] = "push";
    ChannelType["WEBHOOK"] = "webhook";
    ChannelType["IN_APP"] = "in_app";
    ChannelType["SLACK"] = "slack";
    ChannelType["TEAMS"] = "teams";
    ChannelType["VOICE"] = "voice";
    ChannelType["WHATSAPP"] = "whatsapp";
    ChannelType["TELEGRAM"] = "telegram";
})(ChannelType || (exports.ChannelType = ChannelType = {}));
var CategoryType;
(function (CategoryType) {
    CategoryType["TRANSACTIONAL"] = "transactional";
    CategoryType["MARKETING"] = "marketing";
    CategoryType["SECURITY"] = "security";
    CategoryType["SYSTEM"] = "system";
    CategoryType["TRADING"] = "trading";
    CategoryType["PORTFOLIO"] = "portfolio";
    CategoryType["COMPLIANCE"] = "compliance";
    CategoryType["BILLING"] = "billing";
    CategoryType["SUPPORT"] = "support";
    CategoryType["NEWS"] = "news";
})(CategoryType || (exports.CategoryType = CategoryType = {}));
var Priority;
(function (Priority) {
    Priority["LOW"] = "low";
    Priority["NORMAL"] = "normal";
    Priority["HIGH"] = "high";
    Priority["URGENT"] = "urgent";
    Priority["CRITICAL"] = "critical";
})(Priority || (exports.Priority = Priority = {}));
var ScheduleType;
(function (ScheduleType) {
    ScheduleType["IMMEDIATE"] = "immediate";
    ScheduleType["DELAYED"] = "delayed";
    ScheduleType["RECURRING"] = "recurring";
    ScheduleType["CRON"] = "cron";
    ScheduleType["EVENT_DRIVEN"] = "event_driven";
})(ScheduleType || (exports.ScheduleType = ScheduleType = {}));
var SuppressionType;
(function (SuppressionType) {
    SuppressionType["EMAIL"] = "email";
    SuppressionType["PHONE"] = "phone";
    SuppressionType["DEVICE"] = "device";
    SuppressionType["CATEGORY"] = "category";
    SuppressionType["GLOBAL"] = "global";
})(SuppressionType || (exports.SuppressionType = SuppressionType = {}));
var ConsentSource;
(function (ConsentSource) {
    ConsentSource["REGISTRATION"] = "registration";
    ConsentSource["WEB_FORM"] = "web_form";
    ConsentSource["API"] = "api";
    ConsentSource["ADMIN"] = "admin";
    ConsentSource["IMPORT"] = "import";
    ConsentSource["DOUBLE_OPTIN"] = "double_optin";
})(ConsentSource || (exports.ConsentSource = ConsentSource = {}));
var RateLimitType;
(function (RateLimitType) {
    RateLimitType["PER_MINUTE"] = "per_minute";
    RateLimitType["PER_HOUR"] = "per_hour";
    RateLimitType["PER_DAY"] = "per_day";
    RateLimitType["PER_WEEK"] = "per_week";
    RateLimitType["PER_MONTH"] = "per_month";
})(RateLimitType || (exports.RateLimitType = RateLimitType = {}));
var BackoffType;
(function (BackoffType) {
    BackoffType["LINEAR"] = "linear";
    BackoffType["EXPONENTIAL"] = "exponential";
    BackoffType["FIXED"] = "fixed";
})(BackoffType || (exports.BackoffType = BackoffType = {}));
var ConditionOperator;
(function (ConditionOperator) {
    ConditionOperator["EQUALS"] = "equals";
    ConditionOperator["NOT_EQUALS"] = "not_equals";
    ConditionOperator["GREATER_THAN"] = "greater_than";
    ConditionOperator["LESS_THAN"] = "less_than";
    ConditionOperator["CONTAINS"] = "contains";
    ConditionOperator["NOT_CONTAINS"] = "not_contains";
    ConditionOperator["STARTS_WITH"] = "starts_with";
    ConditionOperator["ENDS_WITH"] = "ends_with";
    ConditionOperator["IN"] = "in";
    ConditionOperator["NOT_IN"] = "not_in";
    ConditionOperator["REGEX"] = "regex";
})(ConditionOperator || (exports.ConditionOperator = ConditionOperator = {}));
var RuleAction;
(function (RuleAction) {
    RuleAction["ALLOW"] = "allow";
    RuleAction["BLOCK"] = "block";
    RuleAction["MODIFY"] = "modify";
    RuleAction["ESCALATE"] = "escalate";
    RuleAction["DEFER"] = "defer";
})(RuleAction || (exports.RuleAction = RuleAction = {}));
var VariableType;
(function (VariableType) {
    VariableType["STRING"] = "string";
    VariableType["NUMBER"] = "number";
    VariableType["BOOLEAN"] = "boolean";
    VariableType["DATE"] = "date";
    VariableType["ARRAY"] = "array";
    VariableType["OBJECT"] = "object";
})(VariableType || (exports.VariableType = VariableType = {}));
var ConditionType;
(function (ConditionType) {
    ConditionType["TIME_BASED"] = "time_based";
    ConditionType["DATA_BASED"] = "data_based";
    ConditionType["EVENT_BASED"] = "event_based";
    ConditionType["USER_BASED"] = "user_based";
})(ConditionType || (exports.ConditionType = ConditionType = {}));
var DeduplicationStrategy;
(function (DeduplicationStrategy) {
    DeduplicationStrategy["FIRST"] = "first";
    DeduplicationStrategy["LAST"] = "last";
    DeduplicationStrategy["MERGE"] = "merge";
    DeduplicationStrategy["COUNT"] = "count";
})(DeduplicationStrategy || (exports.DeduplicationStrategy = DeduplicationStrategy = {}));
var FilterOperator;
(function (FilterOperator) {
    FilterOperator["EQUALS"] = "equals";
    FilterOperator["NOT_EQUALS"] = "not_equals";
    FilterOperator["CONTAINS"] = "contains";
    FilterOperator["GREATER_THAN"] = "greater_than";
    FilterOperator["LESS_THAN"] = "less_than";
})(FilterOperator || (exports.FilterOperator = FilterOperator = {}));
var BounceAction;
(function (BounceAction) {
    BounceAction["SUPPRESS"] = "suppress";
    BounceAction["RETRY"] = "retry";
    BounceAction["IGNORE"] = "ignore";
    BounceAction["ESCALATE"] = "escalate";
})(BounceAction || (exports.BounceAction = BounceAction = {}));
var DigestFrequency;
(function (DigestFrequency) {
    DigestFrequency["DAILY"] = "daily";
    DigestFrequency["WEEKLY"] = "weekly";
    DigestFrequency["MONTHLY"] = "monthly";
})(DigestFrequency || (exports.DigestFrequency = DigestFrequency = {}));
var NotificationAction;
(function (NotificationAction) {
    NotificationAction["PREFERENCE_UPDATED"] = "preference_updated";
    NotificationAction["CHANNEL_ADDED"] = "channel_added";
    NotificationAction["CHANNEL_REMOVED"] = "channel_removed";
    NotificationAction["CHANNEL_VERIFIED"] = "channel_verified";
    NotificationAction["CATEGORY_ENABLED"] = "category_enabled";
    NotificationAction["CATEGORY_DISABLED"] = "category_disabled";
    NotificationAction["GLOBAL_MUTE"] = "global_mute";
    NotificationAction["GLOBAL_UNMUTE"] = "global_unmute";
    NotificationAction["SUPPRESSION_ADDED"] = "suppression_added";
    NotificationAction["SUPPRESSION_REMOVED"] = "suppression_removed";
})(NotificationAction || (exports.NotificationAction = NotificationAction = {}));
class NotificationPreferencesService extends events_1.EventEmitter {
    preferences = new Map();
    defaultCategories = [];
    defaultTemplates = [];
    constructor() {
        super();
        this.initializeDefaults();
    }
    async getPreferences(userId, tenantId) {
        return Array.from(this.preferences.values())
            .find(pref => pref.userId === userId && pref.tenantId === tenantId) || null;
    }
    async initializePreferences(userId, tenantId) {
        const existing = await this.getPreferences(userId, tenantId);
        if (existing) {
            return existing;
        }
        const preferences = {
            id: (0, crypto_1.randomUUID)(),
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
    async updateChannelSettings(userId, tenantId, channelId, settings, ipAddress, userAgent) {
        const preferences = await this.getPreferences(userId, tenantId);
        if (!preferences)
            return null;
        const channel = preferences.channels.find(c => c.id === channelId);
        if (!channel)
            return null;
        const oldSettings = { ...channel.settings };
        channel.settings = { ...channel.settings, ...settings };
        preferences.lastUpdated = new Date();
        preferences.version++;
        this.addAuditEntry(preferences, NotificationAction.CHANNEL_VERIFIED, `Channel ${channel.name} settings updated`, ipAddress, userAgent);
        this.emit('channelSettingsUpdated', { preferences, channel, oldSettings });
        return channel;
    }
    async addNotificationChannel(userId, tenantId, channelData, ipAddress, userAgent) {
        const preferences = await this.getPreferences(userId, tenantId);
        if (!preferences) {
            throw new Error('Notification preferences not found');
        }
        const channel = {
            id: (0, crypto_1.randomUUID)(),
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
    async removeNotificationChannel(userId, tenantId, channelId, ipAddress, userAgent) {
        const preferences = await this.getPreferences(userId, tenantId);
        if (!preferences)
            return false;
        const channelIndex = preferences.channels.findIndex(c => c.id === channelId);
        if (channelIndex === -1)
            return false;
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
    async verifyNotificationChannel(userId, tenantId, channelId, verificationToken, ipAddress, userAgent) {
        const preferences = await this.getPreferences(userId, tenantId);
        if (!preferences)
            return false;
        const channel = preferences.channels.find(c => c.id === channelId);
        if (!channel)
            return false;
        const isValidToken = this.validateVerificationToken(channel, verificationToken);
        if (isValidToken) {
            channel.verificationStatus.isVerified = true;
            channel.verifiedAt = new Date();
            preferences.lastUpdated = new Date();
            preferences.version++;
            this.addAuditEntry(preferences, NotificationAction.CHANNEL_VERIFIED, `Channel ${channel.name} verified`, ipAddress, userAgent);
            this.emit('channelVerified', { preferences, channel });
            return true;
        }
        else {
            channel.verificationStatus.verificationAttempts++;
            channel.verificationStatus.lastVerificationAttempt = new Date();
            return false;
        }
    }
    async updateCategoryPreferences(userId, tenantId, categoryId, updates, ipAddress, userAgent) {
        const preferences = await this.getPreferences(userId, tenantId);
        if (!preferences)
            return null;
        const category = preferences.categories.find(c => c.id === categoryId);
        if (!category)
            return null;
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
    async updateGlobalSettings(userId, tenantId, settings, ipAddress, userAgent) {
        const preferences = await this.getPreferences(userId, tenantId);
        if (!preferences)
            return null;
        const oldGlobalMute = preferences.globalSettings.globalMute;
        Object.assign(preferences.globalSettings, settings);
        preferences.lastUpdated = new Date();
        preferences.version++;
        // Track mute/unmute actions
        if (settings.globalMute !== undefined && settings.globalMute !== oldGlobalMute) {
            const action = settings.globalMute ? NotificationAction.GLOBAL_MUTE : NotificationAction.GLOBAL_UNMUTE;
            this.addAuditEntry(preferences, action, `Global notifications ${settings.globalMute ? 'muted' : 'unmuted'}`, ipAddress, userAgent);
        }
        else {
            this.addAuditEntry(preferences, NotificationAction.PREFERENCE_UPDATED, 'Global settings updated', ipAddress, userAgent);
        }
        this.emit('globalSettingsUpdated', { preferences, oldGlobalMute });
        return preferences.globalSettings;
    }
    async addSuppression(userId, tenantId, suppression, ipAddress, userAgent) {
        const preferences = await this.getPreferences(userId, tenantId);
        if (!preferences) {
            throw new Error('Notification preferences not found');
        }
        const newSuppression = {
            id: (0, crypto_1.randomUUID)(),
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
    async removeSuppression(userId, tenantId, suppressionId, ipAddress, userAgent) {
        const preferences = await this.getPreferences(userId, tenantId);
        if (!preferences)
            return false;
        const suppressionIndex = preferences.suppressions.findIndex(s => s.id === suppressionId);
        if (suppressionIndex === -1)
            return false;
        const suppression = preferences.suppressions[suppressionIndex];
        preferences.suppressions.splice(suppressionIndex, 1);
        preferences.lastUpdated = new Date();
        preferences.version++;
        this.addAuditEntry(preferences, NotificationAction.SUPPRESSION_REMOVED, `Suppression removed: ${suppression.type} - ${suppression.value}`, ipAddress, userAgent);
        this.emit('suppressionRemoved', { preferences, suppression });
        return true;
    }
    async createNotificationSchedule(userId, tenantId, schedule, ipAddress, userAgent) {
        const preferences = await this.getPreferences(userId, tenantId);
        if (!preferences) {
            throw new Error('Notification preferences not found');
        }
        const newSchedule = {
            ...schedule,
            id: (0, crypto_1.randomUUID)(),
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
    async updateConsentSettings(userId, tenantId, consent, ipAddress, userAgent) {
        const preferences = await this.getPreferences(userId, tenantId);
        if (!preferences)
            return null;
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
    async getNotificationHistory(userId, tenantId, filter = {}) {
        const preferences = await this.getPreferences(userId, tenantId);
        if (!preferences)
            return [];
        let entries = [...preferences.auditTrail];
        if (filter.categoryId) {
            entries = entries.filter(entry => entry.category === filter.categoryId);
        }
        if (filter.channelId) {
            entries = entries.filter(entry => entry.channel === filter.channelId);
        }
        if (filter.startDate) {
            entries = entries.filter(entry => entry.timestamp >= filter.startDate);
        }
        if (filter.endDate) {
            entries = entries.filter(entry => entry.timestamp <= filter.endDate);
        }
        entries = entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        if (filter.limit) {
            entries = entries.slice(0, filter.limit);
        }
        return entries;
    }
    async exportPreferences(userId, tenantId) {
        const preferences = await this.getPreferences(userId, tenantId);
        if (!preferences)
            return null;
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
    createDefaultChannels() {
        return [
            {
                id: (0, crypto_1.randomUUID)(),
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
    createDefaultGlobalSettings() {
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
    createDefaultDeliverySettings() {
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
    createDefaultConsentSettings() {
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
    validateVerificationToken(channel, token) {
        // Simplified validation - would use proper token verification
        const expectedToken = channel.verificationStatus.verificationToken;
        const expiry = channel.verificationStatus.verificationExpiry;
        return expectedToken === token && (expiry ? expiry > new Date() : false);
    }
    calculateNextExecution(schedule) {
        // Simplified calculation - would use proper cron parsing
        const now = new Date();
        return new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now
    }
    sanitizeSettings(settings) {
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
    addAuditEntry(preferences, action, details, ipAddress, userAgent) {
        const entry = {
            id: (0, crypto_1.randomUUID)(),
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
    initializeDefaults() {
        // Initialize default categories
        this.defaultCategories = [
            {
                id: (0, crypto_1.randomUUID)(),
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
                id: (0, crypto_1.randomUUID)(),
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
exports.NotificationPreferencesService = NotificationPreferencesService;
