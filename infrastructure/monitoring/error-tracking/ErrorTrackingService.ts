import { EventEmitter } from 'events';
import { createHash } from 'crypto';
import { Logger } from 'winston';
import { createLogger, format, transports } from 'winston';
import { PrismaClient } from '@prisma/client';

export interface ErrorMetadata {
  userId?: string;
  sessionId?: string;
  requestId?: string;
  userAgent?: string;
  ipAddress?: string;
  endpoint?: string;
  method?: string;
  statusCode?: number;
  responseTime?: number;
  memoryUsage?: NodeJS.MemoryUsage;
  customData?: Record<string, any>;
}

export interface ErrorContext {
  service: string;
  version: string;
  environment: string;
  timestamp: Date;
  traceId?: string;
  spanId?: string;
  parentSpanId?: string;
}

export interface StructuredError {
  id: string;
  fingerprint: string;
  message: string;
  category: ErrorCategory;
  severity: ErrorSeverity;
  errorType: string;
  stack?: string;
  context: ErrorContext;
  metadata: ErrorMetadata;
  count: number;
  firstSeen: Date;
  lastSeen: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
  tags: string[];
  affectedUsers: string[];
  relatedErrors: string[];
}

export enum ErrorCategory {
  AUTHENTICATION = 'authentication',
  AUTHORIZATION = 'authorization',
  VALIDATION = 'validation',
  DATABASE = 'database',
  EXTERNAL_API = 'external_api',
  NETWORK = 'network',
  PERFORMANCE = 'performance',
  BUSINESS_LOGIC = 'business_logic',
  SYSTEM = 'system',
  SECURITY = 'security',
  COMPLIANCE = 'compliance',
  TRADING = 'trading',
  PORTFOLIO = 'portfolio',
  MARKET_DATA = 'market_data',
  SETTLEMENT = 'settlement',
  UNKNOWN = 'unknown'
}

export enum ErrorSeverity {
  CRITICAL = 'critical',    // System down, data corruption, security breach
  HIGH = 'high',           // Major functionality broken, significant user impact
  MEDIUM = 'medium',       // Feature broken, moderate user impact
  LOW = 'low',            // Minor issues, minimal user impact
  INFO = 'info'           // Informational, no user impact
}

export interface ErrorPattern {
  id: string;
  name: string;
  description: string;
  pattern: RegExp;
  category: ErrorCategory;
  severity: ErrorSeverity;
  tags: string[];
  recoveryActions: string[];
}

export interface ErrorAggregation {
  fingerprint: string;
  count: number;
  affectedUsers: number;
  firstSeen: Date;
  lastSeen: Date;
  trend: 'increasing' | 'decreasing' | 'stable';
  hourlyDistribution: number[];
  topAffectedEndpoints: Array<{ endpoint: string; count: number }>;
  topAffectedUsers: Array<{ userId: string; count: number }>;
}

export class ErrorTrackingService extends EventEmitter {
  private logger: Logger;
  private prisma: PrismaClient;
  private errorPatterns: Map<string, ErrorPattern> = new Map();
  private aggregationCache: Map<string, ErrorAggregation> = new Map();
  private readonly maxStackFrames = 50;
  private readonly aggregationWindow = 60 * 60 * 1000; // 1 hour

  constructor(prisma: PrismaClient) {
    super();
    this.prisma = prisma;
    this.logger = this.createStructuredLogger();
    this.initializeErrorPatterns();
    this.startAggregationUpdater();
  }

  private createStructuredLogger(): Logger {
    return createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json(),
        format.printf(({ timestamp, level, message, ...meta }) => {
          return JSON.stringify({
            timestamp,
            level,
            message,
            service: 'error-tracking',
            ...meta
          });
        })
      ),
      transports: [
        new transports.File({
          filename: 'logs/error-tracking.log',
          maxsize: 100 * 1024 * 1024, // 100MB
          maxFiles: 10
        }),
        new transports.Console({
          format: format.combine(
            format.colorize(),
            format.simple()
          )
        })
      ]
    });
  }

  private initializeErrorPatterns(): void {
    const patterns: ErrorPattern[] = [
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

  public async captureError(
    error: Error,
    context: ErrorContext,
    metadata: ErrorMetadata = {}
  ): Promise<StructuredError> {
    const fingerprint = this.generateFingerprint(error, context);
    const category = this.categorizeError(error);
    const severity = this.assessSeverity(error, category, metadata);
    const pattern = this.matchErrorPattern(error);

    const structuredError: StructuredError = {
      id: this.generateErrorId(),
      fingerprint,
      message: error.message,
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

  private generateFingerprint(error: Error, context: ErrorContext): string {
    const components = [
      error.constructor.name,
      error.message.replace(/\d+/g, 'N'), // Replace numbers with N
      context.service,
      context.environment,
      this.extractStackSignature(error.stack)
    ];

    const signature = components.join('|');
    return createHash('sha256').update(signature).digest('hex').substring(0, 16);
  }

  private extractStackSignature(stack?: string): string {
    if (!stack) return '';
    
    const lines = stack.split('\n').slice(1, 4); // Take top 3 stack frames
    return lines
      .map(line => line.trim().replace(/:\d+:\d+/g, '')) // Remove line numbers
      .join('|');
  }

  private categorizeError(error: Error): ErrorCategory {
    const message = error.message.toLowerCase();
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

  private assessSeverity(
    error: Error,
    category: ErrorCategory,
    metadata: ErrorMetadata
  ): ErrorSeverity {
    // Check if error matches a pattern with predefined severity
    for (const pattern of this.errorPatterns.values()) {
      if (pattern.pattern.test(error.message) || 
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

  private matchErrorPattern(error: Error): ErrorPattern | null {
    const combined = `${error.message} ${error.stack || ''}`;
    
    for (const pattern of this.errorPatterns.values()) {
      if (pattern.pattern.test(combined)) {
        return pattern;
      }
    }
    
    return null;
  }

  private cleanStack(stack?: string): string | undefined {
    if (!stack) return undefined;
    
    const lines = stack.split('\n');
    const cleanLines = lines
      .slice(0, this.maxStackFrames + 1) // +1 for the error message line
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    return cleanLines.join('\n');
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private async storeError(error: StructuredError): Promise<void> {
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
      } else {
        // Create new error record
        await this.prisma.error.create({
          data: {
            id: error.id,
            fingerprint: error.fingerprint,
            message: error.message,
            category: error.category,
            severity: error.severity,
            errorType: error.errorType,
            stack: error.stack,
            context: error.context as any,
            metadata: error.metadata as any,
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
    } catch (dbError) {
      this.logger.error('Failed to store error in database', {
        error: dbError,
        originalErrorId: error.id
      });
    }
  }

  private async updateAggregation(error: StructuredError): Promise<void> {
    const existing = this.aggregationCache.get(error.fingerprint);
    
    if (existing) {
      existing.count++;
      existing.lastSeen = error.lastSeen;
      existing.affectedUsers = new Set([
        ...Array.from({ length: existing.affectedUsers }),
        ...error.affectedUsers
      ]).size;
    } else {
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

  private startAggregationUpdater(): void {
    setInterval(() => {
      this.processAggregations();
    }, this.aggregationWindow);
  }

  private async processAggregations(): Promise<void> {
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
            topAffectedEndpoints: aggregation.topAffectedEndpoints as any,
            topAffectedUsers: aggregation.topAffectedUsers as any
          },
          create: {
            fingerprint,
            count: aggregation.count,
            affectedUsers: aggregation.affectedUsers,
            firstSeen: aggregation.firstSeen,
            lastSeen: aggregation.lastSeen,
            trend: aggregation.trend,
            hourlyDistribution: aggregation.hourlyDistribution,
            topAffectedEndpoints: aggregation.topAffectedEndpoints as any,
            topAffectedUsers: aggregation.topAffectedUsers as any
          }
        });
      } catch (error) {
        this.logger.error('Failed to update aggregation', {
          fingerprint,
          error: error.message
        });
      }
    }
  }

  public async getErrorById(errorId: string): Promise<StructuredError | null> {
    try {
      const error = await this.prisma.error.findUnique({
        where: { id: errorId }
      });
      
      return error as StructuredError | null;
    } catch (error) {
      this.logger.error('Failed to get error by ID', {
        errorId,
        error: error.message
      });
      return null;
    }
  }

  public async getErrorsByFingerprint(fingerprint: string): Promise<StructuredError[]> {
    try {
      const errors = await this.prisma.error.findMany({
        where: { fingerprint },
        orderBy: { lastSeen: 'desc' }
      });
      
      return errors as StructuredError[];
    } catch (error) {
      this.logger.error('Failed to get errors by fingerprint', {
        fingerprint,
        error: error.message
      });
      return [];
    }
  }

  public async getRecentErrors(
    limit: number = 100,
    severity?: ErrorSeverity,
    category?: ErrorCategory
  ): Promise<StructuredError[]> {
    try {
      const where: any = {};
      
      if (severity) where.severity = severity;
      if (category) where.category = category;
      
      const errors = await this.prisma.error.findMany({
        where,
        orderBy: { lastSeen: 'desc' },
        take: limit
      });
      
      return errors as StructuredError[];
    } catch (error) {
      this.logger.error('Failed to get recent errors', {
        limit,
        severity,
        category,
        error: error.message
      });
      return [];
    }
  }

  public async resolveError(
    errorId: string,
    resolvedBy: string,
    resolution?: string
  ): Promise<boolean> {
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
    } catch (error) {
      this.logger.error('Failed to resolve error', {
        errorId,
        resolvedBy,
        error: error.message
      });
      return false;
    }
  }

  public async getErrorStatistics(timeRange: string = '24h'): Promise<any> {
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
    } catch (error) {
      this.logger.error('Failed to get error statistics', {
        timeRange,
        error: error.message
      });
      return null;
    }
  }

  private parseTimeRange(timeRange: string): number {
    const unit = timeRange.slice(-1);
    const value = parseInt(timeRange.slice(0, -1));
    
    switch (unit) {
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      case 'w': return value * 7 * 24 * 60 * 60 * 1000;
      default: return 24 * 60 * 60 * 1000; // Default to 24 hours
    }
  }

  private groupBy(array: any[], key: string): Record<string, any> {
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

  public addErrorPattern(pattern: ErrorPattern): void {
    this.errorPatterns.set(pattern.id, pattern);
    this.logger.info('Error pattern added', { patternId: pattern.id, name: pattern.name });
  }

  public removeErrorPattern(patternId: string): boolean {
    const removed = this.errorPatterns.delete(patternId);
    if (removed) {
      this.logger.info('Error pattern removed', { patternId });
    }
    return removed;
  }

  public getErrorPatterns(): ErrorPattern[] {
    return Array.from(this.errorPatterns.values());
  }

  public async shutdown(): Promise<void> {
    this.logger.info('Shutting down error tracking service');
    await this.processAggregations(); // Final aggregation update
    this.removeAllListeners();
  }
}