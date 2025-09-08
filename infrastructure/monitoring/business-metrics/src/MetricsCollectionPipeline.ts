import { EventEmitter } from 'events';
import { 
  MetricDefinition, 
  MetricValue, 
  MetricType, 
  AggregationMethod, 
  TimeInterval,
  MetricCalculation,
  ValidationRule
} from './BusinessMetricsDataModel';

export interface CollectionConfig {
  batchSize: number;
  flushInterval: number;
  maxRetries: number;
  retryBackoff: number;
  compressionEnabled: boolean;
  encryptionEnabled: boolean;
  deadLetterQueueEnabled: boolean;
}

export interface DataSource {
  id: string;
  name: string;
  type: 'database' | 'api' | 'file' | 'stream' | 'webhook';
  connectionConfig: Record<string, any>;
  authentication?: AuthConfig;
  rateLimit?: RateLimitConfig;
  isEnabled: boolean;
}

export interface AuthConfig {
  type: 'bearer' | 'basic' | 'oauth2' | 'api_key' | 'certificate';
  credentials: Record<string, any>;
  refreshToken?: string;
  expiresAt?: Date;
}

export interface RateLimitConfig {
  requestsPerSecond: number;
  requestsPerMinute: number;
  requestsPerHour: number;
  burstLimit: number;
}

export interface CollectionJob {
  id: string;
  metricId: string;
  dataSource: DataSource;
  schedule: string;
  query: string;
  parameters: Record<string, any>;
  transformations: DataTransformation[];
  validations: ValidationRule[];
  isEnabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  status: 'idle' | 'running' | 'failed' | 'completed';
  errorCount: number;
  lastError?: string;
}

export interface DataTransformation {
  type: 'map' | 'filter' | 'aggregate' | 'join' | 'pivot' | 'unpivot' | 'calculate';
  configuration: Record<string, any>;
  order: number;
}

export interface CollectionResult {
  jobId: string;
  metricId: string;
  success: boolean;
  recordsProcessed: number;
  recordsInserted: number;
  recordsSkipped: number;
  recordsErrored: number;
  startTime: Date;
  endTime: Date;
  duration: number;
  errors: CollectionError[];
  warnings: string[];
  dataQualityScore: number;
}

export interface CollectionError {
  type: 'connection' | 'query' | 'transformation' | 'validation' | 'storage';
  message: string;
  context?: Record<string, any>;
  timestamp: Date;
  isRetryable: boolean;
}

export class MetricsCollectionPipeline extends EventEmitter {
  private jobs: Map<string, CollectionJob> = new Map();
  private activeJobs: Set<string> = new Set();
  private config: CollectionConfig;
  private dataSources: Map<string, DataSource> = new Map();
  private metricDefinitions: Map<string, MetricDefinition> = new Map();
  private calculations: Map<string, MetricCalculation> = new Map();
  private collectionResults: Map<string, CollectionResult[]> = new Map();
  private deadLetterQueue: CollectionJob[] = [];
  private rateLimiters: Map<string, RateLimiter> = new Map();

  constructor(config: CollectionConfig) {
    super();
    this.config = config;
    this.startScheduler();
  }

  async registerDataSource(dataSource: DataSource): Promise<any> {
    try {
      await this.validateDataSourceConnection(dataSource);
      this.dataSources.set(dataSource.id, dataSource);
      
      if (dataSource.rateLimit) {
        this.rateLimiters.set(dataSource.id, new RateLimiter(dataSource.rateLimit));
      }

      this.emit('dataSourceRegistered', { dataSourceId: dataSource.id });
    } catch (error: any) {
      this.emit('dataSourceRegistrationFailed', { 
        dataSourceId: dataSource.id, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      });
      throw error;
    }
  }

  async registerMetricDefinition(metric: MetricDefinition): Promise<any> {
    this.metricDefinitions.set(metric.id, metric);
    this.emit('metricDefinitionRegistered', { metricId: metric.id });
  }

  async createCollectionJob(job: CollectionJob): Promise<any> {
    const dataSource = this.dataSources.get(job.dataSource.id);
    if (!dataSource) {
      throw new Error(`Data source ${job.dataSource.id} not found`);
    }

    const metric = this.metricDefinitions.get(job.metricId);
    if (!metric) {
      throw new Error(`Metric definition ${job.metricId} not found`);
    }

    job.nextRun = this.calculateNextRun(job.schedule);
    this.jobs.set(job.id, job);
    
    this.emit('collectionJobCreated', { jobId: job.id, metricId: job.metricId });
  }

  async executeJob(jobId: string): Promise<CollectionResult> {
    const job = this.jobs.get(jobId);
    if (!job) {
      throw new Error(`Job ${jobId} not found`);
    }

    if (this.activeJobs.has(jobId)) {
      throw new Error(`Job ${jobId} is already running`);
    }

    const result: CollectionResult = {
      jobId,
      metricId: job.metricId,
      success: false,
      recordsProcessed: 0,
      recordsInserted: 0,
      recordsSkipped: 0,
      recordsErrored: 0,
      startTime: new Date(),
      endTime: new Date(),
      duration: 0,
      errors: [],
      warnings: [],
      dataQualityScore: 0
    };

    try {
      this.activeJobs.add(jobId);
      job.status = 'running';
      job.lastRun = new Date();

      this.emit('jobStarted', { jobId, metricId: job.metricId });

      const rawData = await this.collectData(job);
      const transformedData = await this.transformData(rawData, job.transformations);
      const validatedData = await this.validateData(transformedData, job.validations);
      const metricValues = await this.convertToMetricValues(validatedData, job.metricId);
      
      result.recordsProcessed = rawData.length;
      result.recordsInserted = await this.storeMetricValues(metricValues);
      result.recordsSkipped = transformedData.skipped || 0;
      result.recordsErrored = transformedData.errors || 0;
      result.dataQualityScore = this.calculateDataQualityScore(result);
      
      job.status = 'completed';
      job.errorCount = 0;
      job.nextRun = this.calculateNextRun(job.schedule);
      result.success = true;

      this.emit('jobCompleted', { jobId, result });

    } catch (error: any) {
      job.status = 'failed';
      job.errorCount++;
      job.lastError = error instanceof Error ? error.message : 'Unknown error';
      
      result.errors.push({
        type: 'validation' as 'storage' | 'query' | 'connection' | 'transformation' | 'validation',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date(),
        isRetryable: this.isRetryableError(error)
      });

      if (job.errorCount >= this.config.maxRetries) {
        if (this.config.deadLetterQueueEnabled) {
          this.deadLetterQueue.push(job);
        }
        job.isEnabled = false;
      }

      this.emit('jobFailed', { jobId, error: error instanceof Error ? error.message : 'Unknown error', result });
      throw error;

    } finally {
      result.endTime = new Date();
      result.duration = result.endTime.getTime() - result.startTime.getTime();
      
      this.activeJobs.delete(jobId);
      this.storeCollectionResult(result);
    }

    return result;
  }

  async collectData(job: CollectionJob): Promise<any[]> {
    const dataSource = this.dataSources.get(job.dataSource.id);
    if (!dataSource) {
      throw new Error(`Data source ${job.dataSource.id} not found`);
    }

    const rateLimiter = this.rateLimiters.get(dataSource.id);
    if (rateLimiter && !await rateLimiter.canMakeRequest()) {
      throw new Error('Rate limit exceeded for data source');
    }

    switch (dataSource.type) {
      case 'database':
        return await this.collectFromDatabase(dataSource, job);
      case 'api':
        return await this.collectFromAPI(dataSource, job);
      case 'file':
        return await this.collectFromFile(dataSource, job);
      case 'stream':
        return await this.collectFromStream(dataSource, job);
      case 'webhook':
        return await this.collectFromWebhook(dataSource, job);
      default:
        throw new Error(`Unsupported data source type: ${dataSource.type}`);
    }
  }

  private async collectFromDatabase(dataSource: DataSource, job: CollectionJob): Promise<any[]> {
    return [];
  }

  private async collectFromAPI(dataSource: DataSource, job: CollectionJob): Promise<any[]> {
    const url = this.buildAPIUrl(dataSource, job);
    const headers = await this.buildAPIHeaders(dataSource);
    
    try {
      const response = await fetch(url, { headers });
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : [data];
    } catch (error: any) {
      throw new Error(`Failed to collect from API: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async collectFromFile(dataSource: DataSource, job: CollectionJob): Promise<any[]> {
    return [];
  }

  private async collectFromStream(dataSource: DataSource, job: CollectionJob): Promise<any[]> {
    return [];
  }

  private async collectFromWebhook(dataSource: DataSource, job: CollectionJob): Promise<any[]> {
    return [];
  }

  async transformData(data: any[], transformations: DataTransformation[]): Promise<any> {
    let result = data;
    let skipped = 0;
    let errors = 0;

    for (const transformation of transformations.sort((a, b) => a.order - b.order)) {
      try {
        switch (transformation.type) {
          case 'map':
            result = this.mapTransformation(result, transformation.configuration);
            break;
          case 'filter':
            const filtered = this.filterTransformation(result, transformation.configuration);
            skipped += result.length - filtered.length;
            result = filtered;
            break;
          case 'aggregate':
            result = this.aggregateTransformation(result, transformation.configuration);
            break;
          case 'calculate':
            result = this.calculateTransformation(result, transformation.configuration);
            break;
          default:
            throw new Error(`Unsupported transformation type: ${transformation.type}`);
        }
      } catch (error: any) {
        errors++;
        this.emit('transformationError', { 
          transformation: transformation.type, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    }

    return { data: result, skipped, errors };
  }

  private mapTransformation(data: any[], config: any): any[] {
    const mapping = config.mapping || {};
    return data.map(item => {
      const mapped: any = {};
      Object.entries(mapping).forEach(([targetField, sourceField]) => {
        mapped[targetField] = this.getNestedValue(item, sourceField as string);
      });
      return mapped;
    });
  }

  private filterTransformation(data: any[], config: any): any[] {
    const conditions = config.conditions || [];
    return data.filter((item: any) => {
      return conditions.every((condition: any) => {
        const value = this.getNestedValue(item, condition.field);
        return this.evaluateCondition(value, condition.operator, condition.value);
      });
    });
  }

  private aggregateTransformation(data: any[], config: any): any[] {
    const groupBy = config.groupBy || [];
    const aggregations = config.aggregations || [];
    
    const groups = new Map();
    
    data.forEach(item => {
      const key = groupBy.map((field: string) => this.getNestedValue(item, field)).join('|');
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(item);
    });

    return Array.from(groups.entries()).map(([key, items]) => {
      const result: any = {};
      
      groupBy.forEach((field: string, index: number) => {
        result[field] = key.split('|')[index];
      });
      
      aggregations.forEach((agg: any) => {
        const values = items.map((item: any) => this.getNestedValue(item, agg.field));
        result[agg.alias || `${agg.method}_${agg.field}`] = this.calculateAggregation(values, agg.method);
      });
      
      return result;
    });
  }

  private calculateTransformation(data: any[], config: any): any[] {
    const formula = config.formula;
    const resultField = config.resultField;
    
    return data.map(item => {
      try {
        const result = this.evaluateFormula(formula, item);
        return { ...item, [resultField]: result };
      } catch (error: any) {
        return item;
      }
    });
  }

  async validateData(data: any, validations: ValidationRule[]): Promise<any[]> {
    if (!data.data || !Array.isArray(data.data)) {
      return [];
    }

    return data.data.filter((item: any) => {
      return validations.every(validation => {
        try {
          return this.executeValidation(item, validation);
        } catch (error: any) {
          this.emit('validationError', { 
            validation: validation.type, 
            error: error instanceof Error ? error.message : 'Unknown error', 
            item 
          });
          return validation.errorAction !== 'fail';
        }
      });
    });
  }

  private executeValidation(item: any, validation: ValidationRule): boolean {
    switch (validation.type) {
      case 'range':
        const value = this.getNestedValue(item, validation.configuration.field);
        const min = validation.configuration.min;
        const max = validation.configuration.max;
        return (min === undefined || value >= min) && (max === undefined || value <= max);
        
      case 'comparison':
        const leftValue = this.getNestedValue(item, validation.configuration.leftField);
        const rightValue = this.getNestedValue(item, validation.configuration.rightField);
        return this.evaluateCondition(leftValue, validation.configuration.operator, rightValue);
        
      case 'trend':
        return true;
        
      case 'custom':
        return this.evaluateFormula(validation.configuration.formula, item);
        
      default:
        return true;
    }
  }

  async convertToMetricValues(data: any[], metricId: string): Promise<MetricValue[]> {
    const metric = this.metricDefinitions.get(metricId);
    if (!metric) {
      throw new Error(`Metric definition ${metricId} not found`);
    }

    return data.map((item, index) => ({
      id: `${metricId}_${Date.now()}_${index}`,
      metricId,
      tenantId: metric.tenantId,
      timestamp: this.extractTimestamp(item) || new Date(),
      value: this.extractValue(item, metric),
      dimensions: this.extractDimensions(item, metric.dimensions),
      tags: { ...metric.tags, source: 'pipeline' },
      aggregationPeriod: metric.defaultTimeInterval,
      dataQuality: this.calculateItemDataQuality(item),
      source: 'collection_pipeline',
      createdAt: new Date()
    }));
  }

  async storeMetricValues(values: MetricValue[]): Promise<number> {
    try {
      const batches = this.createBatches(values, this.config.batchSize);
      let totalInserted = 0;

      for (const batch of batches) {
        totalInserted += batch.length;
        this.emit('metricValuesBatch', { count: batch.length, values: batch });
      }

      return totalInserted;
    } catch (error: any) {
      this.emit('storageError', { error: error instanceof Error ? error.message : 'Unknown error', count: values.length });
      throw error;
    }
  }

  private createBatches<T>(items: T[], batchSize: number): T[][] {
    const batches: T[][] = [];
    for (let i = 0; i < items.length; i += batchSize) {
      batches.push(items.slice(i, i + batchSize));
    }
    return batches;
  }

  private calculateDataQualityScore(result: CollectionResult): number {
    const totalRecords = result.recordsProcessed;
    if (totalRecords === 0) return 0;

    const successRate = (result.recordsInserted + result.recordsSkipped) / totalRecords;
    const errorRate = result.recordsErrored / totalRecords;
    
    return Math.max(0, Math.min(100, (successRate * 100) - (errorRate * 50)));
  }

  private calculateItemDataQuality(item: any): number {
    const fields = Object.keys(item);
    const nonNullFields = fields.filter(field => item[field] !== null && item[field] !== undefined);
    
    return Math.round((nonNullFields.length / fields.length) * 100);
  }

  private extractTimestamp(item: any): Date | null {
    const timestampFields = ['timestamp', 'created_at', 'date', 'time'];
    
    for (const field of timestampFields) {
      if (item[field]) {
        const date = new Date(item[field]);
        if (!isNaN(date.getTime())) {
          return date;
        }
      }
    }
    
    return null;
  }

  private extractValue(item: any, metric: MetricDefinition): number {
    const valueField = metric.sourceColumn || 'value';
    const value = this.getNestedValue(item, valueField);
    
    if (typeof value === 'number') {
      return value;
    }
    
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      if (!isNaN(parsed)) {
        return parsed;
      }
    }
    
    return 0;
  }

  private extractDimensions(item: any, dimensionFields: string[]): Record<string, string> {
    const dimensions: Record<string, string> = {};
    
    dimensionFields.forEach(field => {
      const value = this.getNestedValue(item, field);
      dimensions[field] = String(value || '');
    });
    
    return dimensions;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  private evaluateCondition(leftValue: any, operator: string, rightValue: any): boolean {
    switch (operator) {
      case 'eq': return leftValue === rightValue;
      case 'ne': return leftValue !== rightValue;
      case 'gt': return leftValue > rightValue;
      case 'gte': return leftValue >= rightValue;
      case 'lt': return leftValue < rightValue;
      case 'lte': return leftValue <= rightValue;
      case 'contains': return String(leftValue).includes(String(rightValue));
      case 'startsWith': return String(leftValue).startsWith(String(rightValue));
      case 'endsWith': return String(leftValue).endsWith(String(rightValue));
      default: return false;
    }
  }

  private calculateAggregation(values: number[], method: AggregationMethod): number {
    if (values.length === 0) return 0;

    switch (method) {
      case AggregationMethod.SUM:
        return values.reduce((sum, val) => sum + val, 0);
      case AggregationMethod.AVERAGE:
        return values.reduce((sum, val) => sum + val, 0) / values.length;
      case AggregationMethod.MIN:
        return Math.min(...values);
      case AggregationMethod.MAX:
        return Math.max(...values);
      case AggregationMethod.COUNT:
        return values.length;
      case AggregationMethod.DISTINCT_COUNT:
        return new Set(values).size;
      default:
        return values[0] || 0;
    }
  }

  private evaluateFormula(formula: string, context: any): any {
    try {
      const func = new Function(...Object.keys(context), `return ${formula}`);
      return func(...Object.values(context));
    } catch (error: any) {
      throw new Error(`Formula evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildAPIUrl(dataSource: DataSource, job: CollectionJob): string {
    let url = dataSource.connectionConfig.baseUrl || '';
    
    if (job.query) {
      url += job.query;
    }
    
    if (job.parameters && Object.keys(job.parameters).length > 0) {
      const params = new URLSearchParams();
      Object.entries(job.parameters).forEach(([key, value]) => {
        params.append(key, String(value));
      });
      url += `?${params.toString()}`;
    }
    
    return url;
  }

  private async buildAPIHeaders(dataSource: DataSource): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'InvestmentPlatform/1.0'
    };

    if (dataSource.authentication) {
      switch (dataSource.authentication.type) {
        case 'bearer':
          headers['Authorization'] = `Bearer ${dataSource.authentication.credentials.token}`;
          break;
        case 'api_key':
          headers[dataSource.authentication.credentials.headerName] = dataSource.authentication.credentials.apiKey;
          break;
        case 'basic':
          const credentials = btoa(`${dataSource.authentication.credentials.username}:${dataSource.authentication.credentials.password}`);
          headers['Authorization'] = `Basic ${credentials}`;
          break;
      }
    }

    return headers;
  }

  private async validateDataSourceConnection(dataSource: DataSource): Promise<any> {
    switch (dataSource.type) {
      case 'api':
        const testUrl = dataSource.connectionConfig.healthCheckUrl || dataSource.connectionConfig.baseUrl;
        if (testUrl) {
          const response = await fetch(testUrl);
          if (!response.ok) {
            throw new Error(`API health check failed: ${response.status}`);
          }
        }
        break;
      default:
        break;
    }
  }

  private calculateNextRun(schedule: string): Date {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 5);
    return now;
  }

  private isRetryableError(error: any): boolean {
    const retryableErrors = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN'];
    return retryableErrors.some(code => error.code === code || error instanceof Error ? error.message : 'Unknown error'.includes(code));
  }

  private storeCollectionResult(result: CollectionResult): void {
    if (!this.collectionResults.has(result.jobId)) {
      this.collectionResults.set(result.jobId, []);
    }
    
    const results = this.collectionResults.get(result.jobId)!;
    results.push(result);
    
    if (results.length > 100) {
      results.shift();
    }
  }

  private startScheduler(): void {
    setInterval(() => {
      this.processScheduledJobs();
    }, 60000);
  }

  private async processScheduledJobs(): Promise<any> {
    const now = new Date();
    
    for (const [jobId, job] of this.jobs) {
      if (job.isEnabled && 
          job.status !== 'running' && 
          job.nextRun && 
          job.nextRun <= now) {
        
        try {
          await this.executeJob(jobId);
        } catch (error: any) {
          this.emit('scheduledJobError', { jobId, error: error instanceof Error ? error.message : 'Unknown error' });
        }
      }
    }
  }

  getJobStatus(jobId: string): CollectionJob | null {
    return this.jobs.get(jobId) || null;
  }

  getJobResults(jobId: string, limit: number = 10): CollectionResult[] {
    const results = this.collectionResults.get(jobId) || [];
    return results.slice(-limit);
  }

  getActiveJobs(): string[] {
    return Array.from(this.activeJobs);
  }

  getDeadLetterQueue(): CollectionJob[] {
    return [...this.deadLetterQueue];
  }
}

class RateLimiter {
  private requests: Date[] = [];
  private config: RateLimitConfig;

  constructor(config: RateLimitConfig) {
    this.config = config;
  }

  async canMakeRequest(): Promise<boolean> {
    const now = new Date();
    
    this.requests = this.requests.filter(timestamp => 
      now.getTime() - timestamp.getTime() < 60000
    );

    if (this.requests.length >= this.config.requestsPerMinute) {
      return false;
    }

    const recentRequests = this.requests.filter(timestamp => 
      now.getTime() - timestamp.getTime() < 1000
    );

    if (recentRequests.length >= this.config.requestsPerSecond) {
      return false;
    }

    this.requests.push(now);
    return true;
  }
}

