import { EventEmitter } from 'events';
import { Logger } from 'winston';
import { createLogger, format, transports } from 'winston';
import { PrismaClient } from '@prisma/client';
import { StructuredError, ErrorCategory, ErrorSeverity } from './ErrorTrackingService';

export interface CorrelationRule {
  id: string;
  name: string;
  description: string;
  type: CorrelationType;
  conditions: CorrelationCondition[];
  timeWindow: number; // milliseconds
  confidence: number; // 0-1
  enabled: boolean;
  actions: CorrelationAction[];
}

export enum CorrelationType {
  TEMPORAL = 'temporal',      // Errors occurring close in time
  CAUSAL = 'causal',         // One error likely caused by another
  CONTEXTUAL = 'contextual', // Errors in same context (service, user, etc.)
  PATTERN = 'pattern',       // Matching error patterns
  CASCADE = 'cascade'        // Error cascade/propagation
}

export interface CorrelationCondition {
  field: string; // 'service', 'category', 'severity', 'userId', etc.
  operator: 'equals' | 'contains' | 'matches' | 'in' | 'exists';
  value: any;
  weight: number; // 0-1, importance of this condition
}

export interface CorrelationAction {
  type: 'merge' | 'link' | 'escalate' | 'notify' | 'suggest_fix';
  parameters: Record<string, any>;
}

export interface ErrorCorrelation {
  id: string;
  primaryErrorId: string;
  relatedErrorIds: string[];
  correlationType: CorrelationType;
  confidence: number;
  strength: number; // 0-1, how strong the correlation is
  createdAt: Date;
  updatedAt: Date;
  metadata: {
    commonAttributes: Record<string, any>;
    timeDifference?: number;
    rootCause?: string;
    impactAssessment?: string;
  };
}

export interface RootCauseAnalysis {
  errorId: string;
  possibleCauses: PossibleCause[];
  investigationSteps: InvestigationStep[];
  relatedErrors: string[];
  systemContext: SystemContext;
  analysis: {
    rootCauseConfidence: number;
    impactAssessment: string;
    resolutionComplexity: 'low' | 'medium' | 'high';
    estimatedResolutionTime: number; // minutes
  };
}

export interface PossibleCause {
  cause: string;
  probability: number; // 0-1
  evidence: string[];
  category: 'technical' | 'business' | 'external' | 'user';
  investigationRequired: boolean;
}

export interface InvestigationStep {
  step: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: number; // minutes
  tools: string[];
  expectedOutcome: string;
}

export interface SystemContext {
  service: string;
  version: string;
  environment: string;
  deploymentTime?: Date;
  recentChanges: Change[];
  systemHealth: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkLatency: number;
  };
  dependencies: ServiceDependency[];
}

export interface Change {
  type: 'deployment' | 'config' | 'infrastructure' | 'data';
  timestamp: Date;
  description: string;
  author: string;
  impact: 'high' | 'medium' | 'low';
}

export interface ServiceDependency {
  service: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  errorRate: number;
  lastCheck: Date;
}

export interface CorrelationPattern {
  id: string;
  name: string;
  pattern: RegExp;
  category: ErrorCategory;
  indicatedCauses: string[];
  confidence: number;
  examples: string[];
}

export class ErrorCorrelationService extends EventEmitter {
  private logger: Logger;
  private prisma: PrismaClient;
  private correlationRules: Map<string, CorrelationRule> = new Map();
  private correlationPatterns: Map<string, CorrelationPattern> = new Map();
  private correlationCache: Map<string, ErrorCorrelation[]> = new Map();
  private readonly cacheTimeout = 10 * 60 * 1000; // 10 minutes

  constructor(prisma: PrismaClient) {
    super();
    this.prisma = prisma;
    this.logger = this.createLogger();
    this.initializeDefaultRules();
    this.initializeCorrelationPatterns();
    this.startCorrelationProcessor();
  }

  private createLogger(): Logger {
    return createLogger({
      level: 'info',
      format: format.combine(
        format.timestamp(),
        format.errors({ stack: true }),
        format.json()
      ),
      transports: [
        new transports.File({
          filename: 'logs/error-correlation.log',
          maxsize: 50 * 1024 * 1024, // 50MB
          maxFiles: 5
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

  private initializeDefaultRules(): void {
    const defaultRules: CorrelationRule[] = [
      {
        id: 'database_cascade',
        name: 'Database Connection Cascade',
        description: 'Database connection errors often cause cascading failures',
        type: CorrelationType.CASCADE,
        conditions: [
          {
            field: 'category',
            operator: 'equals',
            value: ErrorCategory.DATABASE,
            weight: 0.8
          },
          {
            field: 'message',
            operator: 'contains',
            value: 'connection',
            weight: 0.6
          }
        ],
        timeWindow: 5 * 60 * 1000, // 5 minutes
        confidence: 0.85,
        enabled: true,
        actions: [
          {
            type: 'link',
            parameters: { linkType: 'cascade' }
          },
          {
            type: 'escalate',
            parameters: { severity: ErrorSeverity.HIGH }
          }
        ]
      },
      {
        id: 'trading_temporal',
        name: 'Trading System Temporal Correlation',
        description: 'Trading errors occurring within short time window',
        type: CorrelationType.TEMPORAL,
        conditions: [
          {
            field: 'category',
            operator: 'equals',
            value: ErrorCategory.TRADING,
            weight: 0.9
          }
        ],
        timeWindow: 2 * 60 * 1000, // 2 minutes
        confidence: 0.75,
        enabled: true,
        actions: [
          {
            type: 'merge',
            parameters: { strategy: 'similar_errors' }
          },
          {
            type: 'notify',
            parameters: { channels: ['trading-team'] }
          }
        ]
      },
      {
        id: 'user_context',
        name: 'User Context Correlation',
        description: 'Errors affecting the same user or session',
        type: CorrelationType.CONTEXTUAL,
        conditions: [
          {
            field: 'metadata.userId',
            operator: 'exists',
            value: true,
            weight: 0.7
          }
        ],
        timeWindow: 10 * 60 * 1000, // 10 minutes
        confidence: 0.6,
        enabled: true,
        actions: [
          {
            type: 'link',
            parameters: { linkType: 'user_session' }
          }
        ]
      },
      {
        id: 'authentication_pattern',
        name: 'Authentication Failure Pattern',
        description: 'Authentication failures often indicate broader issues',
        type: CorrelationType.PATTERN,
        conditions: [
          {
            field: 'category',
            operator: 'equals',
            value: ErrorCategory.AUTHENTICATION,
            weight: 0.8
          },
          {
            field: 'count',
            operator: 'in',
            value: [5, 10, 20], // Threshold values
            weight: 0.5
          }
        ],
        timeWindow: 15 * 60 * 1000, // 15 minutes
        confidence: 0.7,
        enabled: true,
        actions: [
          {
            type: 'suggest_fix',
            parameters: { 
              suggestions: [
                'Check authentication service status',
                'Verify token validation logic',
                'Review rate limiting configuration'
              ]
            }
          }
        ]
      },
      {
        id: 'performance_degradation',
        name: 'Performance Degradation Causal',
        description: 'Performance issues often cause other errors',
        type: CorrelationType.CAUSAL,
        conditions: [
          {
            field: 'category',
            operator: 'equals',
            value: ErrorCategory.PERFORMANCE,
            weight: 0.6
          },
          {
            field: 'metadata.responseTime',
            operator: 'exists',
            value: true,
            weight: 0.4
          }
        ],
        timeWindow: 30 * 60 * 1000, // 30 minutes
        confidence: 0.65,
        enabled: true,
        actions: [
          {
            type: 'link',
            parameters: { linkType: 'causal_relationship' }
          }
        ]
      }
    ];

    defaultRules.forEach(rule => {
      this.correlationRules.set(rule.id, rule);
    });
  }

  private initializeCorrelationPatterns(): void {
    const patterns: CorrelationPattern[] = [
      {
        id: 'db_connection_timeout',
        name: 'Database Connection Timeout',
        pattern: /database.*timeout|connection.*timeout|pool.*exhausted/i,
        category: ErrorCategory.DATABASE,
        indicatedCauses: [
          'Database server overload',
          'Network connectivity issues',
          'Connection pool misconfiguration',
          'Long-running queries blocking connections'
        ],
        confidence: 0.9,
        examples: [
          'Database connection timeout after 30 seconds',
          'Connection pool exhausted - no available connections'
        ]
      },
      {
        id: 'memory_exhaustion',
        name: 'Memory Exhaustion Pattern',
        pattern: /out.*of.*memory|memory.*exhausted|heap.*overflow|gc.*overhead/i,
        category: ErrorCategory.SYSTEM,
        indicatedCauses: [
          'Memory leak in application code',
          'Insufficient heap size allocation',
          'Large object creation without cleanup',
          'Recursive function calls'
        ],
        confidence: 0.95,
        examples: [
          'Java heap space out of memory',
          'GC overhead limit exceeded'
        ]
      },
      {
        id: 'trading_rejection',
        name: 'Trading Order Rejection',
        pattern: /order.*rejected|trade.*failed|insufficient.*funds|market.*closed/i,
        category: ErrorCategory.TRADING,
        indicatedCauses: [
          'Insufficient account balance',
          'Market hours violation',
          'Trading limits exceeded',
          'Invalid order parameters'
        ],
        confidence: 0.85,
        examples: [
          'Order rejected due to insufficient funds',
          'Trade failed - market is closed'
        ]
      },
      {
        id: 'auth_token_expired',
        name: 'Authentication Token Issues',
        pattern: /token.*expired|invalid.*token|unauthorized.*access|session.*timeout/i,
        category: ErrorCategory.AUTHENTICATION,
        indicatedCauses: [
          'Token expiration time too short',
          'Clock synchronization issues',
          'Token validation service down',
          'User session management problems'
        ],
        confidence: 0.8,
        examples: [
          'JWT token has expired',
          'Invalid or malformed token'
        ]
      }
    ];

    patterns.forEach(pattern => {
      this.correlationPatterns.set(pattern.id, pattern);
    });
  }

  public async correlateError(error: StructuredError): Promise<ErrorCorrelation[]> {
    const correlations: ErrorCorrelation[] = [];

    // Check cache first
    const cacheKey = `correlations_${error.fingerprint}`;
    const cached = this.correlationCache.get(cacheKey);
    if (cached && this.isCacheValid(cached[0]?.createdAt)) {
      return cached;
    }

    try {
      // Find potential correlations using each rule
      for (const rule of this.correlationRules.values()) {
        if (!rule.enabled) continue;

        const correlation = await this.findCorrelationByRule(error, rule);
        if (correlation) {
          correlations.push(correlation);
        }
      }

      // Store correlations in database and cache
      for (const correlation of correlations) {
        await this.storeCorrelation(correlation);
      }

      this.correlationCache.set(cacheKey, correlations);
      this.emit('correlationsFound', { errorId: error.id, correlations });

      return correlations;

    } catch (error) {
      this.logger.error('Failed to correlate error', {
        errorId: error.id,
        error: error.message
      });
      return [];
    }
  }

  private async findCorrelationByRule(
    error: StructuredError,
    rule: CorrelationRule
  ): Promise<ErrorCorrelation | null> {
    const timeWindow = new Date(error.lastSeen.getTime() - rule.timeWindow);
    
    // Build query to find related errors
    const relatedErrors = await this.findRelatedErrors(error, rule, timeWindow);
    
    if (relatedErrors.length === 0) {
      return null;
    }

    // Calculate correlation confidence
    const confidence = this.calculateCorrelationConfidence(error, relatedErrors, rule);
    
    if (confidence < rule.confidence) {
      return null;
    }

    // Calculate correlation strength
    const strength = this.calculateCorrelationStrength(error, relatedErrors, rule.type);

    // Extract common attributes
    const commonAttributes = this.extractCommonAttributes(error, relatedErrors);

    return {
      id: this.generateCorrelationId(),
      primaryErrorId: error.id,
      relatedErrorIds: relatedErrors.map(e => e.id),
      correlationType: rule.type,
      confidence,
      strength,
      createdAt: new Date(),
      updatedAt: new Date(),
      metadata: {
        commonAttributes,
        timeDifference: this.calculateTimeDifference(error, relatedErrors),
        rootCause: await this.suggestRootCause(error, relatedErrors),
        impactAssessment: this.assessImpact(error, relatedErrors)
      }
    };
  }

  private async findRelatedErrors(
    error: StructuredError,
    rule: CorrelationRule,
    timeWindow: Date
  ): Promise<StructuredError[]> {
    const whereConditions: any = {
      AND: [
        { id: { not: error.id } },
        { lastSeen: { gte: timeWindow } }
      ]
    };

    // Apply rule conditions
    for (const condition of rule.conditions) {
      const conditionClause = this.buildConditionClause(condition, error);
      if (conditionClause) {
        whereConditions.AND.push(conditionClause);
      }
    }

    const relatedErrors = await this.prisma.error.findMany({
      where: whereConditions,
      orderBy: { lastSeen: 'desc' },
      take: 20 // Limit to prevent excessive correlations
    });

    return relatedErrors as StructuredError[];
  }

  private buildConditionClause(condition: CorrelationCondition, error: StructuredError): any {
    switch (condition.operator) {
      case 'equals':
        if (condition.field.includes('.')) {
          // Handle nested fields (e.g., metadata.userId)
          const [parent, child] = condition.field.split('.');
          return {
            [parent]: {
              path: [child],
              equals: condition.value
            }
          };
        } else {
          return { [condition.field]: condition.value };
        }

      case 'contains':
        return {
          [condition.field]: {
            contains: condition.value,
            mode: 'insensitive'
          }
        };

      case 'matches':
        // PostgreSQL regex matching
        return {
          [condition.field]: {
            search: condition.value
          }
        };

      case 'in':
        return {
          [condition.field]: {
            in: Array.isArray(condition.value) ? condition.value : [condition.value]
          }
        };

      case 'exists':
        if (condition.field.includes('.')) {
          const [parent, child] = condition.field.split('.');
          return {
            [parent]: {
              path: [child],
              not: condition.value ? null : { not: null }
            }
          };
        } else {
          return {
            [condition.field]: condition.value ? { not: null } : null
          };
        }

      default:
        return null;
    }
  }

  private calculateCorrelationConfidence(
    error: StructuredError,
    relatedErrors: StructuredError[],
    rule: CorrelationRule
  ): number {
    let totalWeight = 0;
    let matchedWeight = 0;

    for (const condition of rule.conditions) {
      totalWeight += condition.weight;
      
      if (this.conditionMatches(condition, error, relatedErrors)) {
        matchedWeight += condition.weight;
      }
    }

    const baseConfidence = totalWeight > 0 ? matchedWeight / totalWeight : 0;
    
    // Adjust confidence based on number of related errors and time proximity
    const countFactor = Math.min(relatedErrors.length / 5, 1); // More related errors = higher confidence
    const timeFactor = this.calculateTimeProximityFactor(error, relatedErrors);
    
    return Math.min(baseConfidence * (1 + countFactor * 0.2) * (1 + timeFactor * 0.1), 1);
  }

  private conditionMatches(
    condition: CorrelationCondition,
    error: StructuredError,
    relatedErrors: StructuredError[]
  ): boolean {
    // Check if the condition is met by the related errors
    return relatedErrors.some(relatedError => {
      const value = this.getFieldValue(relatedError, condition.field);
      
      switch (condition.operator) {
        case 'equals':
          return value === condition.value;
        case 'contains':
          return typeof value === 'string' && value.toLowerCase().includes(condition.value.toLowerCase());
        case 'matches':
          return typeof value === 'string' && new RegExp(condition.value, 'i').test(value);
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(value);
        case 'exists':
          return condition.value ? value !== null && value !== undefined : value === null || value === undefined;
        default:
          return false;
      }
    });
  }

  private getFieldValue(error: StructuredError, field: string): any {
    if (field.includes('.')) {
      const parts = field.split('.');
      let value: any = error;
      
      for (const part of parts) {
        if (value && typeof value === 'object') {
          value = value[part];
        } else {
          return null;
        }
      }
      
      return value;
    } else {
      return (error as any)[field];
    }
  }

  private calculateCorrelationStrength(
    error: StructuredError,
    relatedErrors: StructuredError[],
    type: CorrelationType
  ): number {
    switch (type) {
      case CorrelationType.TEMPORAL:
        return this.calculateTimeProximityFactor(error, relatedErrors);
        
      case CorrelationType.CONTEXTUAL:
        return this.calculateContextSimilarity(error, relatedErrors);
        
      case CorrelationType.CAUSAL:
        return this.calculateCausalStrength(error, relatedErrors);
        
      case CorrelationType.CASCADE:
        return this.calculateCascadeStrength(error, relatedErrors);
        
      case CorrelationType.PATTERN:
        return this.calculatePatternMatchStrength(error, relatedErrors);
        
      default:
        return 0.5;
    }
  }

  private calculateTimeProximityFactor(error: StructuredError, relatedErrors: StructuredError[]): number {
    if (relatedErrors.length === 0) return 0;

    const errorTime = error.lastSeen.getTime();
    const avgTimeDiff = relatedErrors.reduce((sum, relatedError) => {
      return sum + Math.abs(errorTime - relatedError.lastSeen.getTime());
    }, 0) / relatedErrors.length;

    // Closer in time = higher factor (exponential decay)
    const maxTime = 30 * 60 * 1000; // 30 minutes
    return Math.exp(-avgTimeDiff / maxTime);
  }

  private calculateContextSimilarity(error: StructuredError, relatedErrors: StructuredError[]): number {
    if (relatedErrors.length === 0) return 0;

    const contextFields = ['service', 'environment', 'version'];
    let totalSimilarity = 0;

    for (const relatedError of relatedErrors) {
      let fieldMatches = 0;
      
      for (const field of contextFields) {
        if (error.context[field as keyof typeof error.context] === 
            relatedError.context[field as keyof typeof relatedError.context]) {
          fieldMatches++;
        }
      }
      
      totalSimilarity += fieldMatches / contextFields.length;
    }

    return totalSimilarity / relatedErrors.length;
  }

  private calculateCausalStrength(error: StructuredError, relatedErrors: StructuredError[]): number {
    // Look for patterns that indicate causal relationships
    const causalPatterns = [
      { pattern: /timeout/i, strength: 0.8 },
      { pattern: /connection.*failed/i, strength: 0.9 },
      { pattern: /out.*of.*memory/i, strength: 0.85 },
      { pattern: /database.*error/i, strength: 0.7 }
    ];

    let maxStrength = 0;

    for (const relatedError of relatedErrors) {
      for (const causalPattern of causalPatterns) {
        if (causalPattern.pattern.test(relatedError.message)) {
          maxStrength = Math.max(maxStrength, causalPattern.strength);
        }
      }
    }

    return maxStrength;
  }

  private calculateCascadeStrength(error: StructuredError, relatedErrors: StructuredError[]): number {
    // Cascade strength based on error severity progression and time sequence
    let cascadeScore = 0;
    const severityWeight = {
      [ErrorSeverity.CRITICAL]: 4,
      [ErrorSeverity.HIGH]: 3,
      [ErrorSeverity.MEDIUM]: 2,
      [ErrorSeverity.LOW]: 1,
      [ErrorSeverity.INFO]: 0
    };

    const sortedErrors = relatedErrors.sort((a, b) => a.firstSeen.getTime() - b.firstSeen.getTime());
    
    for (let i = 0; i < sortedErrors.length - 1; i++) {
      const currentError = sortedErrors[i];
      const nextError = sortedErrors[i + 1];
      
      if (severityWeight[currentError.severity] >= severityWeight[nextError.severity]) {
        cascadeScore += 0.2; // Severity escalation or maintenance
      }
      
      // Time proximity in cascade
      const timeDiff = nextError.firstSeen.getTime() - currentError.firstSeen.getTime();
      if (timeDiff < 5 * 60 * 1000) { // Within 5 minutes
        cascadeScore += 0.3;
      }
    }

    return Math.min(cascadeScore, 1);
  }

  private calculatePatternMatchStrength(error: StructuredError, relatedErrors: StructuredError[]): number {
    const allErrors = [error, ...relatedErrors];
    let patternStrength = 0;

    for (const pattern of this.correlationPatterns.values()) {
      const matchingErrors = allErrors.filter(e => pattern.pattern.test(e.message));
      if (matchingErrors.length > 1) {
        const matchRatio = matchingErrors.length / allErrors.length;
        patternStrength = Math.max(patternStrength, matchRatio * pattern.confidence);
      }
    }

    return patternStrength;
  }

  private extractCommonAttributes(error: StructuredError, relatedErrors: StructuredError[]): Record<string, any> {
    const allErrors = [error, ...relatedErrors];
    const commonAttributes: Record<string, any> = {};

    // Check common context attributes
    const contextFields = ['service', 'environment', 'version'];
    for (const field of contextFields) {
      const values = allErrors.map(e => e.context[field as keyof typeof e.context]);
      const uniqueValues = [...new Set(values)];
      
      if (uniqueValues.length === 1) {
        commonAttributes[field] = uniqueValues[0];
      }
    }

    // Check common categories and severities
    const categories = [...new Set(allErrors.map(e => e.category))];
    const severities = [...new Set(allErrors.map(e => e.severity))];
    
    if (categories.length === 1) {
      commonAttributes.category = categories[0];
    }
    
    if (severities.length <= 2) {
      commonAttributes.severities = severities;
    }

    return commonAttributes;
  }

  private calculateTimeDifference(error: StructuredError, relatedErrors: StructuredError[]): number {
    if (relatedErrors.length === 0) return 0;

    const times = [error.firstSeen, ...relatedErrors.map(e => e.firstSeen)].map(d => d.getTime());
    return Math.max(...times) - Math.min(...times);
  }

  private async suggestRootCause(error: StructuredError, relatedErrors: StructuredError[]): Promise<string> {
    // Analyze error patterns to suggest root causes
    const allErrors = [error, ...relatedErrors];
    
    for (const pattern of this.correlationPatterns.values()) {
      const matchingErrors = allErrors.filter(e => pattern.pattern.test(e.message));
      if (matchingErrors.length > 0) {
        return pattern.indicatedCauses[0]; // Return most likely cause
      }
    }

    // Fallback to category-based suggestions
    const categoryMap = {
      [ErrorCategory.DATABASE]: 'Database connectivity or performance issues',
      [ErrorCategory.AUTHENTICATION]: 'Authentication service or token management problems',
      [ErrorCategory.TRADING]: 'Trading system configuration or market connectivity issues',
      [ErrorCategory.NETWORK]: 'Network connectivity or timeout issues',
      [ErrorCategory.PERFORMANCE]: 'System resource constraints or optimization needs'
    };

    return categoryMap[error.category] || 'Unknown root cause - further investigation required';
  }

  private assessImpact(error: StructuredError, relatedErrors: StructuredError[]): string {
    const allErrors = [error, ...relatedErrors];
    const totalAffectedUsers = new Set(allErrors.flatMap(e => e.affectedUsers)).size;
    const criticalErrors = allErrors.filter(e => e.severity === ErrorSeverity.CRITICAL).length;
    const totalOccurrences = allErrors.reduce((sum, e) => sum + e.count, 0);

    if (criticalErrors > 0 || totalAffectedUsers > 100) {
      return 'High impact - affecting critical systems or many users';
    } else if (totalAffectedUsers > 10 || totalOccurrences > 50) {
      return 'Medium impact - affecting multiple users or frequent occurrences';
    } else {
      return 'Low impact - limited user or system impact';
    }
  }

  public async performRootCauseAnalysis(errorId: string): Promise<RootCauseAnalysis> {
    try {
      const error = await this.prisma.error.findUnique({
        where: { id: errorId }
      }) as StructuredError;

      if (!error) {
        throw new Error(`Error not found: ${errorId}`);
      }

      // Get correlations for this error
      const correlations = await this.correlateError(error);
      const relatedErrors = await this.getRelatedErrorsFromCorrelations(correlations);

      // Analyze possible causes
      const possibleCauses = await this.analyzePossibleCauses(error, relatedErrors);
      
      // Generate investigation steps
      const investigationSteps = this.generateInvestigationSteps(error, possibleCauses);
      
      // Get system context
      const systemContext = await this.getSystemContext(error);
      
      // Perform analysis
      const analysis = this.performAnalysis(error, relatedErrors, possibleCauses);

      const rootCauseAnalysis: RootCauseAnalysis = {
        errorId,
        possibleCauses,
        investigationSteps,
        relatedErrors: relatedErrors.map(e => e.id),
        systemContext,
        analysis
      };

      this.emit('rootCauseAnalysisCompleted', rootCauseAnalysis);
      return rootCauseAnalysis;

    } catch (error) {
      this.logger.error('Failed to perform root cause analysis', {
        errorId,
        error: error.message
      });
      throw error;
    }
  }

  private async getRelatedErrorsFromCorrelations(correlations: ErrorCorrelation[]): Promise<StructuredError[]> {
    const relatedErrorIds = new Set<string>();
    correlations.forEach(correlation => {
      correlation.relatedErrorIds.forEach(id => relatedErrorIds.add(id));
    });

    if (relatedErrorIds.size === 0) return [];

    const relatedErrors = await this.prisma.error.findMany({
      where: {
        id: { in: Array.from(relatedErrorIds) }
      }
    });

    return relatedErrors as StructuredError[];
  }

  private async analyzePossibleCauses(
    error: StructuredError,
    relatedErrors: StructuredError[]
  ): Promise<PossibleCause[]> {
    const causes: PossibleCause[] = [];
    const allErrors = [error, ...relatedErrors];

    // Pattern-based cause analysis
    for (const pattern of this.correlationPatterns.values()) {
      const matchingErrors = allErrors.filter(e => pattern.pattern.test(e.message));
      if (matchingErrors.length > 0) {
        pattern.indicatedCauses.forEach((cause, index) => {
          causes.push({
            cause,
            probability: pattern.confidence * (1 - index * 0.1), // Decrease probability for subsequent causes
            evidence: matchingErrors.map(e => e.message),
            category: this.categorizeCause(cause),
            investigationRequired: pattern.confidence < 0.8
          });
        });
      }
    }

    // Category-based cause analysis
    const categoryAnalysis = this.analyzeCausesByCategory(error, relatedErrors);
    causes.push(...categoryAnalysis);

    // Sort by probability and return top 10
    return causes
      .sort((a, b) => b.probability - a.probability)
      .slice(0, 10);
  }

  private categorizeCause(cause: string): 'technical' | 'business' | 'external' | 'user' {
    const technicalKeywords = ['server', 'database', 'network', 'timeout', 'connection', 'memory', 'cpu'];
    const businessKeywords = ['rules', 'validation', 'logic', 'workflow', 'process'];
    const externalKeywords = ['api', 'service', 'provider', 'vendor', 'third-party'];
    const userKeywords = ['input', 'user', 'client', 'request', 'session'];

    const lowerCause = cause.toLowerCase();

    if (technicalKeywords.some(keyword => lowerCause.includes(keyword))) {
      return 'technical';
    } else if (businessKeywords.some(keyword => lowerCause.includes(keyword))) {
      return 'business';
    } else if (externalKeywords.some(keyword => lowerCause.includes(keyword))) {
      return 'external';
    } else if (userKeywords.some(keyword => lowerCause.includes(keyword))) {
      return 'user';
    } else {
      return 'technical'; // Default
    }
  }

  private analyzeCausesByCategory(error: StructuredError, relatedErrors: StructuredError[]): PossibleCause[] {
    const causes: PossibleCause[] = [];

    // Add category-specific analysis logic here
    switch (error.category) {
      case ErrorCategory.DATABASE:
        causes.push({
          cause: 'Database connection pool exhaustion',
          probability: 0.7,
          evidence: ['Multiple database connection errors'],
          category: 'technical',
          investigationRequired: true
        });
        break;
        
      case ErrorCategory.TRADING:
        causes.push({
          cause: 'Market data feed interruption',
          probability: 0.6,
          evidence: ['Trading errors during market hours'],
          category: 'external',
          investigationRequired: true
        });
        break;
    }

    return causes;
  }

  private generateInvestigationSteps(
    error: StructuredError,
    possibleCauses: PossibleCause[]
  ): InvestigationStep[] {
    const steps: InvestigationStep[] = [];

    // Add general investigation steps
    steps.push({
      step: 'Check system logs',
      description: 'Review application and system logs around the time of the error',
      priority: 'high',
      estimatedTime: 15,
      tools: ['Log aggregation system', 'Kibana', 'Splunk'],
      expectedOutcome: 'Identify error patterns and contextual information'
    });

    // Add cause-specific investigation steps
    possibleCauses.forEach(cause => {
      if (cause.investigationRequired) {
        const step = this.generateInvestigationStepForCause(cause);
        if (step) {
          steps.push(step);
        }
      }
    });

    return steps.slice(0, 8); // Limit to 8 steps
  }

  private generateInvestigationStepForCause(cause: PossibleCause): InvestigationStep | null {
    const causeText = cause.cause.toLowerCase();

    if (causeText.includes('database')) {
      return {
        step: 'Investigate database performance',
        description: 'Check database connection pools, slow queries, and server performance',
        priority: 'high',
        estimatedTime: 30,
        tools: ['Database monitoring', 'Query analyzer', 'Performance dashboard'],
        expectedOutcome: 'Identify database bottlenecks or connection issues'
      };
    } else if (causeText.includes('memory')) {
      return {
        step: 'Analyze memory usage',
        description: 'Review memory consumption patterns and potential memory leaks',
        priority: 'medium',
        estimatedTime: 20,
        tools: ['APM tools', 'Memory profiler', 'Heap dumps'],
        expectedOutcome: 'Identify memory consumption issues'
      };
    }

    return null;
  }

  private async getSystemContext(error: StructuredError): Promise<SystemContext> {
    // In a real implementation, this would gather actual system metrics
    return {
      service: error.context.service,
      version: error.context.version,
      environment: error.context.environment,
      deploymentTime: new Date(Date.now() - 24 * 60 * 60 * 1000), // Mock: 1 day ago
      recentChanges: [
        {
          type: 'deployment',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
          description: 'Updated trading service to version 2.1.3',
          author: 'devops-team',
          impact: 'medium'
        }
      ],
      systemHealth: {
        cpuUsage: 65,
        memoryUsage: 78,
        diskUsage: 45,
        networkLatency: 12
      },
      dependencies: [
        {
          service: 'database',
          status: 'healthy',
          responseTime: 25,
          errorRate: 0.1,
          lastCheck: new Date()
        },
        {
          service: 'market-data-service',
          status: 'degraded',
          responseTime: 150,
          errorRate: 2.5,
          lastCheck: new Date()
        }
      ]
    };
  }

  private performAnalysis(
    error: StructuredError,
    relatedErrors: StructuredError[],
    possibleCauses: PossibleCause[]
  ): any {
    const topCause = possibleCauses[0];
    const rootCauseConfidence = topCause ? topCause.probability : 0.3;
    
    const allErrors = [error, ...relatedErrors];
    const criticalCount = allErrors.filter(e => e.severity === ErrorSeverity.CRITICAL).length;
    const totalAffectedUsers = new Set(allErrors.flatMap(e => e.affectedUsers)).size;

    let impactAssessment: string;
    let resolutionComplexity: 'low' | 'medium' | 'high';
    let estimatedResolutionTime: number;

    if (criticalCount > 0 || totalAffectedUsers > 100) {
      impactAssessment = 'High business impact - immediate attention required';
      resolutionComplexity = 'high';
      estimatedResolutionTime = 120; // 2 hours
    } else if (totalAffectedUsers > 10 || allErrors.length > 5) {
      impactAssessment = 'Medium business impact - should be addressed promptly';
      resolutionComplexity = 'medium';
      estimatedResolutionTime = 60; // 1 hour
    } else {
      impactAssessment = 'Low business impact - can be scheduled for resolution';
      resolutionComplexity = 'low';
      estimatedResolutionTime = 30; // 30 minutes
    }

    return {
      rootCauseConfidence,
      impactAssessment,
      resolutionComplexity,
      estimatedResolutionTime
    };
  }

  private async storeCorrelation(correlation: ErrorCorrelation): Promise<void> {
    try {
      await this.prisma.errorCorrelation.create({
        data: {
          id: correlation.id,
          primaryErrorId: correlation.primaryErrorId,
          relatedErrorIds: correlation.relatedErrorIds,
          correlationType: correlation.correlationType,
          confidence: correlation.confidence,
          strength: correlation.strength,
          metadata: correlation.metadata as any,
          createdAt: correlation.createdAt,
          updatedAt: correlation.updatedAt
        }
      });
    } catch (error) {
      this.logger.error('Failed to store correlation', {
        correlationId: correlation.id,
        error: error.message
      });
    }
  }

  private startCorrelationProcessor(): void {
    // Process correlations every 5 minutes
    setInterval(() => {
      this.processRecentErrors();
    }, 5 * 60 * 1000);

    // Clean up old cache entries every hour
    setInterval(() => {
      this.cleanupCache();
    }, 60 * 60 * 1000);
  }

  private async processRecentErrors(): Promise<void> {
    try {
      const recentErrors = await this.prisma.error.findMany({
        where: {
          lastSeen: {
            gte: new Date(Date.now() - 10 * 60 * 1000) // Last 10 minutes
          }
        },
        orderBy: { lastSeen: 'desc' },
        take: 50
      });

      for (const error of recentErrors) {
        await this.correlateError(error as StructuredError);
      }
    } catch (error) {
      this.logger.error('Failed to process recent errors for correlation', {
        error: error.message
      });
    }
  }

  private cleanupCache(): void {
    const cutoff = Date.now() - this.cacheTimeout;
    
    for (const [key, correlations] of this.correlationCache.entries()) {
      if (correlations.length > 0 && correlations[0].createdAt.getTime() < cutoff) {
        this.correlationCache.delete(key);
      }
    }
  }

  private isCacheValid(createdAt: Date): boolean {
    return Date.now() - createdAt.getTime() < this.cacheTimeout;
  }

  private generateCorrelationId(): string {
    return `corr_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  public addCorrelationRule(rule: CorrelationRule): void {
    this.correlationRules.set(rule.id, rule);
    this.logger.info('Correlation rule added', { ruleId: rule.id });
  }

  public addCorrelationPattern(pattern: CorrelationPattern): void {
    this.correlationPatterns.set(pattern.id, pattern);
    this.logger.info('Correlation pattern added', { patternId: pattern.id });
  }

  public getCorrelationRules(): CorrelationRule[] {
    return Array.from(this.correlationRules.values());
  }

  public getCorrelationPatterns(): CorrelationPattern[] {
    return Array.from(this.correlationPatterns.values());
  }

  public async getCorrelationsForError(errorId: string): Promise<ErrorCorrelation[]> {
    try {
      const correlations = await this.prisma.errorCorrelation.findMany({
        where: {
          OR: [
            { primaryErrorId: errorId },
            { relatedErrorIds: { has: errorId } }
          ]
        },
        orderBy: { confidence: 'desc' }
      });

      return correlations as ErrorCorrelation[];
    } catch (error) {
      this.logger.error('Failed to get correlations for error', {
        errorId,
        error: error.message
      });
      return [];
    }
  }

  public async shutdown(): Promise<void> {
    this.logger.info('Shutting down error correlation service');
    this.correlationCache.clear();
    this.removeAllListeners();
  }
}