"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorTrackingService = exports.ErrorSeverity = exports.ErrorCategory = void 0;
const events_1 = require("events");
const crypto_1 = require("crypto");
const winston_1 = require("winston");
var ErrorCategory;
(function (ErrorCategory) {
    ErrorCategory["AUTHENTICATION"] = "authentication";
    ErrorCategory["AUTHORIZATION"] = "authorization";
    ErrorCategory["VALIDATION"] = "validation";
    ErrorCategory["DATABASE"] = "database";
    ErrorCategory["EXTERNAL_API"] = "external_api";
    ErrorCategory["NETWORK"] = "network";
    ErrorCategory["PERFORMANCE"] = "performance";
    ErrorCategory["BUSINESS_LOGIC"] = "business_logic";
    ErrorCategory["SYSTEM"] = "system";
    ErrorCategory["SECURITY"] = "security";
    ErrorCategory["COMPLIANCE"] = "compliance";
    ErrorCategory["TRADING"] = "trading";
    ErrorCategory["PORTFOLIO"] = "portfolio";
    ErrorCategory["MARKET_DATA"] = "market_data";
    ErrorCategory["SETTLEMENT"] = "settlement";
    ErrorCategory["UNKNOWN"] = "unknown";
})(ErrorCategory || (exports.ErrorCategory = ErrorCategory = {}));
var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["CRITICAL"] = "critical";
    ErrorSeverity["HIGH"] = "high";
    ErrorSeverity["MEDIUM"] = "medium";
    ErrorSeverity["LOW"] = "low";
    ErrorSeverity["INFO"] = "info"; // Informational, no user impact
})(ErrorSeverity || (exports.ErrorSeverity = ErrorSeverity = {}));
class ErrorTrackingService extends events_1.EventEmitter {
    logger;
    prisma;
    errorPatterns = new Map();
    aggregationCache = new Map();
    maxStackFrames = 50;
    aggregationWindow = 60 * 60 * 1000; // 1 hour
    constructor(prisma) {
        super();
        this.prisma = prisma;
        this.logger = this.createStructuredLogger();
        this.initializeErrorPatterns();
        this.startAggregationUpdater();
    }
    createStructuredLogger() {
        return (0, winston_1.createLogger)({
            level: 'info',
            format: winston_1.format.combine(winston_1.format.timestamp(), winston_1.format.errors({ stack: true }), winston_1.format.json(), winston_1.format.printf(({ timestamp, level, message, ...meta }) => {
                return JSON.stringify({
                    timestamp,
                    level,
                    message,
                    service: 'error-tracking',
                    ...meta
                });
            })),
            transports: [
                new winston_1.transports.File({
                    filename: 'logs/error-tracking.log',
                    maxsize: 100 * 1024 * 1024, // 100MB
                    maxFiles: 10
                }),
                new winston_1.transports.Console({
                    format: winston_1.format.combine(winston_1.format.colorize(), winston_1.format.simple())
                })
            ]
        });
    }
    initializeErrorPatterns() {
        const patterns = [
            {
                id: 'database_connection_failed',
                name: 'Database Connection Failed',
                description: 'Failed to connect to database',
                pattern: /connection.*failed|ECONNREFUSED.*database|timeout.*database/i,
                category: ErrorCategory.DATABASE,
                severity: ErrorSeverity.CRITICAL,
                tags: ['database', 'connectivity'],
                recoveryActions: [
                    'Check database server status',
                    'Verify connection string',
                    'Check network connectivity',
                    'Review connection pool settings'
                ]
            },
            {
                id: 'authentication_failed',
                name: 'Authentication Failed',
                description: 'User authentication failure',
                pattern: /authentication.*failed|invalid.*token|unauthorized/i,
                category: ErrorCategory.AUTHENTICATION,
                severity: ErrorSeverity.HIGH,
                tags: ['auth', 'security'],
                recoveryActions: [
                    'Check token validity',
                    'Verify user credentials',
                    'Review authentication service status',
                    'Check session management'
                ]
            },
            {
                id: 'trading_order_failed',
                name: 'Trading Order Failed',
                description: 'Order execution or processing failure',
                pattern: /order.*failed|execution.*error|trading.*rejected/i,
                category: ErrorCategory.TRADING,
                severity: ErrorSeverity.HIGH,
                tags: ['trading', 'orders'],
                recoveryActions: [
                    'Check market connectivity',
                    'Verify order parameters',
                    'Review trading limits',
                    'Check counterparty status'
                ]
            },
            {
                id: 'market_data_stale',
                name: 'Market Data Stale',
                description: 'Market data feed interruption or delay',
                pattern: /market.*data.*stale|feed.*disconnected|price.*outdated/i,
                category: ErrorCategory.MARKET_DATA,
                severity: ErrorSeverity.MEDIUM,
                tags: ['market-data', 'feed'],
                recoveryActions: [
                    'Check market data provider status',
                    'Verify feed connections',
                    'Switch to backup data source',
                    'Review data quality metrics'
                ]
            },
            {
                id: 'compliance_violation',
                name: 'Compliance Violation',
                description: 'Regulatory or compliance rule violation',
                pattern: /compliance.*violation|regulatory.*breach|limit.*exceeded/i,
                category: ErrorCategory.COMPLIANCE,
                severity: ErrorSeverity.HIGH,
                tags: ['compliance', 'regulatory'],
                recoveryActions: [
                    'Review compliance rules',
                    'Check position limits',
                    'Verify regulatory requirements',
                    'Escalate to compliance team'
                ]
            },
            {
                id: 'memory_exhaustion',
                name: 'Memory Exhaustion',
                description: 'System running out of memory',
                pattern: /out.*of.*memory|memory.*exhausted|heap.*overflow/i,
                category: ErrorCategory.SYSTEM,
                severity: ErrorSeverity.CRITICAL,
                tags: ['memory', 'performance'],
                recoveryActions: [
                    'Review memory usage patterns',
                    'Check for memory leaks',
                    'Scale system resources',
                    'Optimize memory allocation'
                ]
            }
        ];
        patterns.forEach(pattern => {
            this.errorPatterns.set(pattern.id, pattern);
        });
    }
    async captureError(error, context, metadata = {}) {
        const fingerprint = this.generateFingerprint(error, context);
        const category = this.categorizeError(error);
        const severity = this.assessSeverity(error, category, metadata);
        const pattern = this.matchErrorPattern(error);
        const structuredError = {
            id: this.generateErrorId(),
            fingerprint,
            message: error instanceof Error ? error.message : 'Unknown error',
            category,
            severity,
            errorType: error.constructor.name,
            stack: this.cleanStack(error.stack),
            context,
            metadata: {
                ...metadata,
                memoryUsage: process.memoryUsage()
            },
            count: 1,
            firstSeen: new Date(),
            lastSeen: new Date(),
            resolved: false,
            tags: pattern ? pattern.tags : [category],
            affectedUsers: metadata.userId ? [metadata.userId] : [],
            relatedErrors: []
        };
        // Log the structured error
        this.logger.error('Error captured', {
            errorId: structuredError.id,
            fingerprint: structuredError.fingerprint,
            category: structuredError.category,
            severity: structuredError.severity,
            message: structuredError.message,
            context: structuredError.context,
            metadata: structuredError.metadata,
            pattern: pattern?.name
        });
        // Store in database
        await this.storeError(structuredError);
        // Update aggregation
        await this.updateAggregation(structuredError);
        // Emit events for real-time processing
        this.emit('errorCaptured', structuredError);
        this.emit('errorSeverity', { severity, error: structuredError });
        if (severity === ErrorSeverity.CRITICAL) {
            this.emit('criticalError', structuredError);
        }
        return structuredError;
    }
    generateFingerprint(error, context) {
        const components = [
            error.constructor.name,
            error instanceof Error ? error.message : 'Unknown error'.replace(/\d+/g, 'N'), // Replace numbers with N
            context.service,
            context.environment,
            this.extractStackSignature(error.stack)
        ];
        const signature = components.join('|');
        return (0, crypto_1.createHash)('sha256').update(signature).digest('hex').substring(0, 16);
    }
    extractStackSignature(stack) {
        if (!stack)
            return '';
        const lines = stack.split('\n').slice(1, 4); // Take top 3 stack frames
        return lines
            .map(line => line.trim().replace(/:\d+:\d+/g, '')) // Remove line numbers
            .join('|');
    }
    categorizeError(error) {
        const message = error instanceof Error ? error.message : 'Unknown error'.toLowerCase();
        const stack = (error.stack || '').toLowerCase();
        const combined = `${message} ${stack}`;
        // Check predefined patterns
        for (const pattern of this.errorPatterns.values()) {
            if (pattern.pattern.test(combined)) {
                return pattern.category;
            }
        }
        // Fallback categorization based on error type and message
        if (error.name.includes('Auth') || message.includes('unauthorized')) {
            return ErrorCategory.AUTHENTICATION;
        }
        if (message.includes('permission') || message.includes('forbidden')) {
            return ErrorCategory.AUTHORIZATION;
        }
        if (message.includes('validation') || message.includes('invalid')) {
            return ErrorCategory.VALIDATION;
        }
        if (message.includes('database') || message.includes('sql')) {
            return ErrorCategory.DATABASE;
        }
        if (message.includes('network') || message.includes('timeout')) {
            return ErrorCategory.NETWORK;
        }
        if (message.includes('performance') || message.includes('slow')) {
            return ErrorCategory.PERFORMANCE;
        }
        return ErrorCategory.UNKNOWN;
    }
    assessSeverity(error, category, metadata) {
        // Check if error matches a pattern with predefined severity
        for (const pattern of this.errorPatterns.values()) {
            if (pattern.pattern.test(error instanceof Error ? error.message : 'Unknown error') ||
                (error.stack && pattern.pattern.test(error.stack))) {
                return pattern.severity;
            }
        }
        // Category-based severity assessment
        switch (category) {
            case ErrorCategory.SECURITY:
            case ErrorCategory.SYSTEM:
                return ErrorSeverity.CRITICAL;
            case ErrorCategory.DATABASE:
            case ErrorCategory.TRADING:
            case ErrorCategory.COMPLIANCE:
                return ErrorSeverity.HIGH;
            case ErrorCategory.AUTHENTICATION:
            case ErrorCategory.AUTHORIZATION:
            case ErrorCategory.MARKET_DATA:
                return ErrorSeverity.MEDIUM;
            case ErrorCategory.VALIDATION:
            case ErrorCategory.PERFORMANCE:
                return ErrorSeverity.LOW;
            default:
                return ErrorSeverity.MEDIUM;
        }
    }
    matchErrorPattern(error) {
        const combined = `${error instanceof Error ? error.message : 'Unknown error'} ${error.stack || ''}`;
        for (const pattern of this.errorPatterns.values()) {
            if (pattern.pattern.test(combined)) {
                return pattern;
            }
        }
        return null;
    }
    cleanStack(stack) {
        if (!stack)
            return undefined;
        const lines = stack.split('\n');
        const cleanLines = lines
            .slice(0, this.maxStackFrames + 1) // +1 for the error message line
            .map(line => line.trim())
            .filter(line => line.length > 0);
        return cleanLines.join('\n');
    }
    generateErrorId() {
        return `err_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
    }
    async storeError(error) {
        try {
            // Check if error with same fingerprint exists
            const existingError = await this.prisma.error.findFirst({
                where: { fingerprint: error.fingerprint }
            });
            if (existingError) {
                // Update existing error
                await this.prisma.error.update({
                    where: { id: existingError.id },
                    data: {
                        count: { increment: 1 },
                        lastSeen: error.lastSeen,
                        affectedUsers: {
                            set: Array.from(new Set([
                                ...existingError.affectedUsers,
                                ...error.affectedUsers
                            ]))
                        }
                    }
                });
            }
            else {
                // Create new error record
                await this.prisma.error.create({
                    data: {
                        id: error.id,
                        fingerprint: error.fingerprint,
                        message: error instanceof Error ? error.message : 'Unknown error',
                        category: error.category,
                        severity: error.severity,
                        errorType: error.errorType,
                        stack: error.stack,
                        context: error.context,
                        metadata: error.metadata,
                        count: error.count,
                        firstSeen: error.firstSeen,
                        lastSeen: error.lastSeen,
                        resolved: error.resolved,
                        tags: error.tags,
                        affectedUsers: error.affectedUsers,
                        relatedErrors: error.relatedErrors
                    }
                });
            }
        }
        catch (dbError) {
            this.logger.error('Failed to store error in database', {
                error: dbError,
                originalErrorId: error.id
            });
        }
    }
    async updateAggregation(error) {
        const existing = this.aggregationCache.get(error.fingerprint);
        if (existing) {
            existing.count++;
            existing.lastSeen = error.lastSeen;
            existing.affectedUsers = new Set([
                ...Array.from({ length: existing.affectedUsers }),
                ...error.affectedUsers
            ]).size;
        }
        else {
            this.aggregationCache.set(error.fingerprint, {
                fingerprint: error.fingerprint,
                count: 1,
                affectedUsers: error.affectedUsers.length,
                firstSeen: error.firstSeen,
                lastSeen: error.lastSeen,
                trend: 'stable',
                hourlyDistribution: new Array(24).fill(0),
                topAffectedEndpoints: [],
                topAffectedUsers: []
            });
        }
    }
    startAggregationUpdater() {
        setInterval(() => {
            this.processAggregations();
        }, this.aggregationWindow);
    }
    async processAggregations() {
        for (const [fingerprint, aggregation] of this.aggregationCache.entries()) {
            try {
                await this.prisma.errorAggregation.upsert({
                    where: { fingerprint },
                    update: {
                        count: aggregation.count,
                        affectedUsers: aggregation.affectedUsers,
                        lastSeen: aggregation.lastSeen,
                        trend: aggregation.trend,
                        hourlyDistribution: aggregation.hourlyDistribution,
                        topAffectedEndpoints: aggregation.topAffectedEndpoints,
                        topAffectedUsers: aggregation.topAffectedUsers
                    },
                    create: {
                        fingerprint,
                        count: aggregation.count,
                        affectedUsers: aggregation.affectedUsers,
                        firstSeen: aggregation.firstSeen,
                        lastSeen: aggregation.lastSeen,
                        trend: aggregation.trend,
                        hourlyDistribution: aggregation.hourlyDistribution,
                        topAffectedEndpoints: aggregation.topAffectedEndpoints,
                        topAffectedUsers: aggregation.topAffectedUsers
                    }
                });
            }
            catch (error) {
                this.logger.error('Failed to update aggregation', {
                    fingerprint,
                    error: error.message
                });
            }
        }
    }
    async getErrorById(errorId) {
        try {
            const error = await this.prisma.error.findUnique({
                where: { id: errorId }
            });
            return error;
        }
        catch (error) {
            this.logger.error('Failed to get error by ID', {
                errorId,
                error: error.message
            });
            return null;
        }
    }
    async getErrorsByFingerprint(fingerprint) {
        try {
            const errors = await this.prisma.error.findMany({
                where: { fingerprint },
                orderBy: { lastSeen: 'desc' }
            });
            return errors;
        }
        catch (error) {
            this.logger.error('Failed to get errors by fingerprint', {
                fingerprint,
                error: error.message
            });
            return [];
        }
    }
    async getRecentErrors(limit = 100, severity, category) {
        try {
            const where = {};
            if (severity)
                where.severity = severity;
            if (category)
                where.category = category;
            const errors = await this.prisma.error.findMany({
                where,
                orderBy: { lastSeen: 'desc' },
                take: limit
            });
            return errors;
        }
        catch (error) {
            this.logger.error('Failed to get recent errors', {
                limit,
                severity,
                category,
                error: error.message
            });
            return [];
        }
    }
    async resolveError(errorId, resolvedBy, resolution) {
        try {
            await this.prisma.error.update({
                where: { id: errorId },
                data: {
                    resolved: true,
                    resolvedAt: new Date(),
                    resolvedBy,
                    resolution
                }
            });
            this.emit('errorResolved', { errorId, resolvedBy, resolution });
            return true;
        }
        catch (error) {
            this.logger.error('Failed to resolve error', {
                errorId,
                resolvedBy,
                error: error.message
            });
            return false;
        }
    }
    async getErrorStatistics(timeRange = '24h') {
        try {
            const timeRangeMs = this.parseTimeRange(timeRange);
            const since = new Date(Date.now() - timeRangeMs);
            const stats = await this.prisma.error.groupBy({
                by: ['category', 'severity'],
                where: {
                    lastSeen: { gte: since }
                },
                _count: { id: true },
                _sum: { count: true }
            });
            return {
                totalErrors: stats.reduce((sum, stat) => sum + (stat._sum.count || 0), 0),
                uniqueErrors: stats.length,
                bySeverity: this.groupBy(stats, 'severity'),
                byCategory: this.groupBy(stats, 'category'),
                timeRange,
                since
            };
        }
        catch (error) {
            this.logger.error('Failed to get error statistics', {
                timeRange,
                error: error.message
            });
            return null;
        }
    }
    parseTimeRange(timeRange) {
        const unit = timeRange.slice(-1);
        const value = parseInt(timeRange.slice(0, -1));
        switch (unit) {
            case 'h': return value * 60 * 60 * 1000;
            case 'd': return value * 24 * 60 * 60 * 1000;
            case 'w': return value * 7 * 24 * 60 * 60 * 1000;
            default: return 24 * 60 * 60 * 1000; // Default to 24 hours
        }
    }
    groupBy(array, key) {
        return array.reduce((result, item) => {
            const group = item[key];
            if (!result[group]) {
                result[group] = { count: 0, sum: 0 };
            }
            result[group].count += item._count.id;
            result[group].sum += item._sum.count || 0;
            return result;
        }, {});
    }
    addErrorPattern(pattern) {
        this.errorPatterns.set(pattern.id, pattern);
        this.logger.info('Error pattern added', { patternId: pattern.id, name: pattern.name });
    }
    removeErrorPattern(patternId) {
        const removed = this.errorPatterns.delete(patternId);
        if (removed) {
            this.logger.info('Error pattern removed', { patternId });
        }
        return removed;
    }
    getErrorPatterns() {
        return Array.from(this.errorPatterns.values());
    }
    async shutdown() {
        this.logger.info('Shutting down error tracking service');
        await this.processAggregations(); // Final aggregation update
        this.removeAllListeners();
    }
}
exports.ErrorTrackingService = ErrorTrackingService;
