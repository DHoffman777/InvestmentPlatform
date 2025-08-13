import { EventEmitter } from 'events';
import {
  SLADefinition,
  SLAMeasurementPoint,
  SLAMetric,
  SLAStatus,
  SLAMetricType,
  SLATrend,
  SLAConfiguration
} from './SLADataModel';

export interface SLATrackingConfig {
  refreshInterval: number;
  batchSize: number;
  maxRetries: number;
  timeoutMs: number;
  enableRealTimeTracking: boolean;
  enableTrendAnalysis: boolean;
  dataRetentionDays: number;
  aggregationIntervals: number[];
  validationRules: SLAValidationRule[];
}

export interface SLAValidationRule {
  field: string;
  rule: 'min' | 'max' | 'range' | 'pattern' | 'custom';
  value: any;
  errorMessage: string;
}

export interface SLACalculationContext {
  sla: SLADefinition;
  timeWindow: {
    start: Date;
    end: Date;
  };
  measurements: SLAMeasurementPoint[];
  excludedPeriods: Array<{
    start: Date;
    end: Date;
    reason: string;
  }>;
}

export interface SLADataSource {
  id: string;
  name: string;
  type: 'prometheus' | 'influxdb' | 'elasticsearch' | 'custom' | 'database';
  configuration: Record<string, any>;
  isActive: boolean;
}

export interface SLAAggregationResult {
  value: number;
  count: number;
  min: number;
  max: number;
  average: number;
  percentile95: number;
  percentile99: number;
  standardDeviation: number;
}

export class SLATrackingService extends EventEmitter {
  private slas: Map<string, SLADefinition> = new Map();
  private metrics: Map<string, SLAMetric> = new Map();
  private measurementPoints: Map<string, SLAMeasurementPoint[]> = new Map();
  private dataSources: Map<string, SLADataSource> = new Map();
  private trackingIntervals: Map<string, NodeJS.Timeout> = new Map();
  private config: SLATrackingConfig;
  private calculationQueue: Array<{ slaId: string; priority: number }> = [];
  private isProcessingQueue = false;

  constructor(config: SLATrackingConfig) {
    super();
    this.config = config;
    this.initializeDataSources();
    this.startQueueProcessor();
  }

  async registerSLA(sla: SLADefinition): Promise<void> {
    await this.validateSLA(sla);
    
    this.slas.set(sla.id, sla);
    this.measurementPoints.set(sla.id, []);
    
    if (sla.isActive) {
      await this.startTracking(sla.id);
    }
    
    this.emit('slaRegistered', { slaId: sla.id, sla });
  }

  async unregisterSLA(slaId: string): Promise<void> {
    const sla = this.slas.get(slaId);
    if (!sla) {
      throw new Error(`SLA ${slaId} not found`);
    }

    await this.stopTracking(slaId);
    this.slas.delete(slaId);
    this.metrics.delete(slaId);
    this.measurementPoints.delete(slaId);
    
    this.emit('slaUnregistered', { slaId });
  }

  async startTracking(slaId: string): Promise<void> {
    const sla = this.slas.get(slaId);
    if (!sla) {
      throw new Error(`SLA ${slaId} not found`);
    }

    if (this.trackingIntervals.has(slaId)) {
      await this.stopTracking(slaId);
    }

    const interval = setInterval(async () => {
      try {
        await this.collectMeasurement(slaId);
        this.queueCalculation(slaId, 1);
      } catch (error) {
        this.emit('trackingError', { slaId, error: error.message });
      }
    }, sla.measurement.frequency);

    this.trackingIntervals.set(slaId, interval);
    this.emit('trackingStarted', { slaId });
  }

  async stopTracking(slaId: string): Promise<void> {
    const interval = this.trackingIntervals.get(slaId);
    if (interval) {
      clearInterval(interval);
      this.trackingIntervals.delete(slaId);
      this.emit('trackingStopped', { slaId });
    }
  }

  async collectMeasurement(slaId: string): Promise<SLAMeasurementPoint> {
    const sla = this.slas.get(slaId);
    if (!sla) {
      throw new Error(`SLA ${slaId} not found`);
    }

    const dataSource = this.dataSources.get(sla.measurement.dataSource);
    if (!dataSource) {
      throw new Error(`Data source ${sla.measurement.dataSource} not found`);
    }

    const value = await this.queryDataSource(dataSource, sla);
    const measurement: SLAMeasurementPoint = {
      id: this.generateMeasurementId(),
      slaId,
      timestamp: new Date(),
      value,
      unit: sla.unit,
      metadata: {
        dataSource: dataSource.id,
        query: sla.measurement.queryTemplate,
        aggregationMethod: sla.measurement.aggregationMethod
      },
      tags: sla.tags,
      source: dataSource.name,
      isValid: true
    };

    // Validate measurement
    const validationResult = await this.validateMeasurement(measurement, sla);
    if (!validationResult.isValid) {
      measurement.isValid = false;
      measurement.excludeFromCalculation = true;
      measurement.exclusionReason = validationResult.reason;
    }

    // Store measurement
    const measurements = this.measurementPoints.get(slaId) || [];
    measurements.push(measurement);
    
    // Keep only recent measurements based on retention policy
    const retentionCutoff = new Date(Date.now() - (this.config.dataRetentionDays * 24 * 60 * 60 * 1000));
    const filteredMeasurements = measurements.filter(m => m.timestamp >= retentionCutoff);
    this.measurementPoints.set(slaId, filteredMeasurements);

    this.emit('measurementCollected', { slaId, measurement });
    return measurement;
  }

  async calculateSLAMetric(slaId: string, timeWindow?: { start: Date; end: Date }): Promise<SLAMetric> {
    const sla = this.slas.get(slaId);
    if (!sla) {
      throw new Error(`SLA ${slaId} not found`);
    }

    const window = timeWindow || this.getDefaultTimeWindow(sla);
    const measurements = await this.getMeasurements(slaId, window);
    const validMeasurements = measurements.filter(m => m.isValid && !m.excludeFromCalculation);

    if (validMeasurements.length === 0) {
      return this.createEmptyMetric(slaId, sla, window);
    }

    const context: SLACalculationContext = {
      sla,
      timeWindow: window,
      measurements: validMeasurements,
      excludedPeriods: await this.getExcludedPeriods(sla, window)
    };

    const aggregationResult = await this.aggregateValues(validMeasurements, sla);
    const currentValue = aggregationResult.value;
    const compliancePercentage = this.calculateCompliancePercentage(currentValue, sla);
    const status = this.determineStatus(currentValue, sla, compliancePercentage);
    const trends = await this.calculateTrends(slaId, window);
    const breaches = await this.identifyBreaches(slaId, window, currentValue, sla);

    const metric: SLAMetric = {
      slaId,
      timeWindow: window,
      currentValue,
      targetValue: sla.targetValue,
      unit: sla.unit,
      status,
      compliancePercentage,
      measurements: validMeasurements,
      trends,
      breaches,
      calculatedAt: new Date()
    };

    this.metrics.set(slaId, metric);
    this.emit('metricCalculated', { slaId, metric });

    return metric;
  }

  async getMeasurements(
    slaId: string, 
    timeWindow: { start: Date; end: Date }
  ): Promise<SLAMeasurementPoint[]> {
    const allMeasurements = this.measurementPoints.get(slaId) || [];
    return allMeasurements.filter(m => 
      m.timestamp >= timeWindow.start && m.timestamp <= timeWindow.end
    );
  }

  async getMetric(slaId: string): Promise<SLAMetric | null> {
    return this.metrics.get(slaId) || null;
  }

  async getAllMetrics(): Promise<SLAMetric[]> {
    return Array.from(this.metrics.values());
  }

  async getMetricsByService(serviceId: string): Promise<SLAMetric[]> {
    const serviceSLAs = Array.from(this.slas.values())
      .filter(sla => sla.serviceId === serviceId);
    
    const metrics: SLAMetric[] = [];
    for (const sla of serviceSLAs) {
      const metric = this.metrics.get(sla.id);
      if (metric) {
        metrics.push(metric);
      }
    }
    
    return metrics;
  }

  async getSLAHistory(
    slaId: string, 
    timeWindow: { start: Date; end: Date },
    aggregationInterval: number = 3600000 // 1 hour default
  ): Promise<SLAMetric[]> {
    const history: SLAMetric[] = [];
    const intervals = Math.ceil((timeWindow.end.getTime() - timeWindow.start.getTime()) / aggregationInterval);
    
    for (let i = 0; i < intervals; i++) {
      const intervalStart = new Date(timeWindow.start.getTime() + (i * aggregationInterval));
      const intervalEnd = new Date(Math.min(
        intervalStart.getTime() + aggregationInterval,
        timeWindow.end.getTime()
      ));
      
      try {
        const metric = await this.calculateSLAMetric(slaId, {
          start: intervalStart,
          end: intervalEnd
        });
        history.push(metric);
      } catch (error) {
        console.warn(`Failed to calculate metric for interval ${i}:`, error.message);
      }
    }
    
    return history;
  }

  async recalculate(slaId: string): Promise<void> {
    const sla = this.slas.get(slaId);
    if (!sla) {
      throw new Error(`SLA ${slaId} not found`);
    }

    await this.calculateSLAMetric(slaId);
    this.emit('recalculationCompleted', { slaId });
  }

  async recalculateAll(): Promise<void> {
    const slaIds = Array.from(this.slas.keys());
    for (const slaId of slaIds) {
      try {
        await this.recalculate(slaId);
      } catch (error) {
        this.emit('recalculationError', { slaId, error: error.message });
      }
    }
  }

  private async queryDataSource(dataSource: SLADataSource, sla: SLADefinition): Promise<number> {
    // This is a mock implementation - in real scenarios, this would connect to actual data sources
    switch (dataSource.type) {
      case 'prometheus':
        return this.queryPrometheus(dataSource, sla);
      case 'influxdb':
        return this.queryInfluxDB(dataSource, sla);
      case 'elasticsearch':
        return this.queryElasticsearch(dataSource, sla);
      case 'database':
        return this.queryDatabase(dataSource, sla);
      default:
        return this.simulateMetricValue(sla.metricType);
    }
  }

  private async queryPrometheus(dataSource: SLADataSource, sla: SLADefinition): Promise<number> {
    // Mock Prometheus query
    console.log(`Querying Prometheus for SLA ${sla.id}: ${sla.measurement.queryTemplate}`);
    return this.simulateMetricValue(sla.metricType);
  }

  private async queryInfluxDB(dataSource: SLADataSource, sla: SLADefinition): Promise<number> {
    // Mock InfluxDB query
    console.log(`Querying InfluxDB for SLA ${sla.id}: ${sla.measurement.queryTemplate}`);
    return this.simulateMetricValue(sla.metricType);
  }

  private async queryElasticsearch(dataSource: SLADataSource, sla: SLADefinition): Promise<number> {
    // Mock Elasticsearch query
    console.log(`Querying Elasticsearch for SLA ${sla.id}: ${sla.measurement.queryTemplate}`);
    return this.simulateMetricValue(sla.metricType);
  }

  private async queryDatabase(dataSource: SLADataSource, sla: SLADefinition): Promise<number> {
    // Mock database query
    console.log(`Querying database for SLA ${sla.id}: ${sla.measurement.queryTemplate}`);
    return this.simulateMetricValue(sla.metricType);
  }

  private simulateMetricValue(metricType: SLAMetricType): number {
    switch (metricType) {
      case SLAMetricType.AVAILABILITY:
      case SLAMetricType.UPTIME:
        return 99.5 + (Math.random() * 0.5); // 99.5-100%
      case SLAMetricType.RESPONSE_TIME:
        return 100 + (Math.random() * 200); // 100-300ms
      case SLAMetricType.THROUGHPUT:
        return 1000 + (Math.random() * 500); // 1000-1500 rps
      case SLAMetricType.ERROR_RATE:
        return Math.random() * 5; // 0-5%
      case SLAMetricType.TRANSACTION_SUCCESS_RATE:
        return 95 + (Math.random() * 5); // 95-100%
      case SLAMetricType.DATA_ACCURACY:
        return 98 + (Math.random() * 2); // 98-100%
      case SLAMetricType.RECOVERY_TIME:
        return 5 + (Math.random() * 10); // 5-15 minutes
      default:
        return Math.random() * 100;
    }
  }

  private async aggregateValues(
    measurements: SLAMeasurementPoint[], 
    sla: SLADefinition
  ): Promise<SLAAggregationResult> {
    const values = measurements.map(m => m.value).sort((a, b) => a - b);
    
    if (values.length === 0) {
      return {
        value: 0,
        count: 0,
        min: 0,
        max: 0,
        average: 0,
        percentile95: 0,
        percentile99: 0,
        standardDeviation: 0
      };
    }

    const count = values.length;
    const min = values[0];
    const max = values[values.length - 1];
    const sum = values.reduce((acc, val) => acc + val, 0);
    const average = sum / count;

    // Calculate percentiles
    const p95Index = Math.floor(0.95 * count);
    const p99Index = Math.floor(0.99 * count);
    const percentile95 = values[Math.min(p95Index, count - 1)];
    const percentile99 = values[Math.min(p99Index, count - 1)];

    // Calculate standard deviation
    const variance = values.reduce((acc, val) => acc + Math.pow(val - average, 2), 0) / count;
    const standardDeviation = Math.sqrt(variance);

    let aggregatedValue: number;
    switch (sla.measurement.aggregationMethod) {
      case 'min':
        aggregatedValue = min;
        break;
      case 'max':
        aggregatedValue = max;
        break;
      case 'sum':
        aggregatedValue = sum;
        break;
      case 'count':
        aggregatedValue = count;
        break;
      case 'percentile':
        const percentileIndex = Math.floor((sla.measurement.percentileValue || 95) / 100 * count);
        aggregatedValue = values[Math.min(percentileIndex, count - 1)];
        break;
      case 'avg':
      default:
        aggregatedValue = average;
        break;
    }

    return {
      value: aggregatedValue,
      count,
      min,
      max,
      average,
      percentile95,
      percentile99,
      standardDeviation
    };
  }

  private calculateCompliancePercentage(currentValue: number, sla: SLADefinition): number {
    const target = sla.targetValue;
    
    // For availability, uptime, success rates (higher is better)
    if ([SLAMetricType.AVAILABILITY, SLAMetricType.UPTIME, SLAMetricType.TRANSACTION_SUCCESS_RATE].includes(sla.metricType)) {
      return Math.min(100, (currentValue / target) * 100);
    }
    
    // For response time, error rate (lower is better)
    if ([SLAMetricType.RESPONSE_TIME, SLAMetricType.ERROR_RATE].includes(sla.metricType)) {
      return Math.max(0, 100 - ((currentValue - target) / target) * 100);
    }
    
    // Default calculation
    return Math.min(100, (currentValue / target) * 100);
  }

  private determineStatus(currentValue: number, sla: SLADefinition, compliancePercentage: number): SLAStatus {
    const thresholds = sla.thresholds;
    
    if (compliancePercentage < thresholds.critical) {
      return SLAStatus.BREACHED;
    }
    
    if (compliancePercentage < thresholds.warning) {
      return SLAStatus.AT_RISK;
    }
    
    return SLAStatus.COMPLIANT;
  }

  private async calculateTrends(slaId: string, timeWindow: { start: Date; end: Date }): Promise<SLATrend[]> {
    const measurements = await this.getMeasurements(slaId, timeWindow);
    if (measurements.length < 5) {
      return [];
    }

    const values = measurements.map(m => m.value);
    const timestamps = measurements.map(m => m.timestamp.getTime());
    
    // Simple linear regression for trend calculation
    const n = values.length;
    const sumX = timestamps.reduce((sum, x) => sum + x, 0);
    const sumY = values.reduce((sum, y) => sum + y, 0);
    const sumXY = timestamps.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumXX = timestamps.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const intercept = (sumY - slope * sumX) / n;
    
    const direction = slope > 0.001 ? 'improving' : slope < -0.001 ? 'degrading' : 'stable';
    const magnitude = Math.abs(slope);
    
    // Calculate R-squared for confidence
    const yMean = sumY / n;
    const ssRes = values.reduce((sum, y, i) => {
      const predicted = slope * timestamps[i] + intercept;
      return sum + Math.pow(y - predicted, 2);
    }, 0);
    const ssTot = values.reduce((sum, y) => sum + Math.pow(y - yMean, 2), 0);
    const rSquared = 1 - (ssRes / ssTot);
    
    return [{
      direction,
      magnitude,
      confidence: Math.max(0, Math.min(1, rSquared)),
      timeRange: timeWindow,
      description: `${direction} trend with ${(rSquared * 100).toFixed(1)}% confidence`
    }];
  }

  private async identifyBreaches(
    slaId: string, 
    timeWindow: { start: Date; end: Date }, 
    currentValue: number, 
    sla: SLADefinition
  ): Promise<any[]> {
    // This would typically query stored breach data
    // For now, return empty array as breach detection is handled separately
    return [];
  }

  private getDefaultTimeWindow(sla: SLADefinition): { start: Date; end: Date } {
    const end = new Date();
    const start = new Date(end.getTime() - sla.timeWindow.duration);
    return { start, end };
  }

  private createEmptyMetric(slaId: string, sla: SLADefinition, timeWindow: { start: Date; end: Date }): SLAMetric {
    return {
      slaId,
      timeWindow,
      currentValue: 0,
      targetValue: sla.targetValue,
      unit: sla.unit,
      status: SLAStatus.UNKNOWN,
      compliancePercentage: 0,
      measurements: [],
      trends: [],
      breaches: [],
      calculatedAt: new Date()
    };
  }

  private async getExcludedPeriods(
    sla: SLADefinition, 
    timeWindow: { start: Date; end: Date }
  ): Promise<Array<{ start: Date; end: Date; reason: string }>> {
    const excludedPeriods: Array<{ start: Date; end: Date; reason: string }> = [];
    
    if (sla.businessHours?.maintenanceWindows) {
      for (const maintenance of sla.businessHours.maintenanceWindows) {
        if (maintenance.isActive && 
            maintenance.startTime < timeWindow.end && 
            maintenance.endTime > timeWindow.start) {
          excludedPeriods.push({
            start: new Date(Math.max(maintenance.startTime.getTime(), timeWindow.start.getTime())),
            end: new Date(Math.min(maintenance.endTime.getTime(), timeWindow.end.getTime())),
            reason: `Maintenance: ${maintenance.name}`
          });
        }
      }
    }
    
    return excludedPeriods;
  }

  private async validateSLA(sla: SLADefinition): Promise<void> {
    if (!sla.id || !sla.name || !sla.serviceId) {
      throw new Error('SLA must have id, name, and serviceId');
    }
    
    if (!sla.targetValue || sla.targetValue <= 0) {
      throw new Error('SLA must have a positive target value');
    }
    
    if (!sla.measurement.frequency || sla.measurement.frequency <= 0) {
      throw new Error('SLA must have a positive measurement frequency');
    }
  }

  private async validateMeasurement(
    measurement: SLAMeasurementPoint, 
    sla: SLADefinition
  ): Promise<{ isValid: boolean; reason?: string }> {
    for (const rule of this.config.validationRules) {
      const fieldValue = (measurement as any)[rule.field];
      
      switch (rule.rule) {
        case 'min':
          if (fieldValue < rule.value) {
            return { isValid: false, reason: rule.errorMessage };
          }
          break;
        case 'max':
          if (fieldValue > rule.value) {
            return { isValid: false, reason: rule.errorMessage };
          }
          break;
        case 'range':
          if (fieldValue < rule.value.min || fieldValue > rule.value.max) {
            return { isValid: false, reason: rule.errorMessage };
          }
          break;
      }
    }
    
    return { isValid: true };
  }

  private queueCalculation(slaId: string, priority: number): void {
    // Remove existing entry for this SLA
    this.calculationQueue = this.calculationQueue.filter(item => item.slaId !== slaId);
    
    // Add new entry
    this.calculationQueue.push({ slaId, priority });
    
    // Sort by priority (higher first)
    this.calculationQueue.sort((a, b) => b.priority - a.priority);
  }

  private startQueueProcessor(): void {
    setInterval(async () => {
      if (!this.isProcessingQueue && this.calculationQueue.length > 0) {
        this.isProcessingQueue = true;
        
        try {
          const item = this.calculationQueue.shift();
          if (item) {
            await this.calculateSLAMetric(item.slaId);
          }
        } catch (error) {
          console.error('Queue processing error:', error);
        } finally {
          this.isProcessingQueue = false;
        }
      }
    }, 1000);
  }

  private initializeDataSources(): void {
    // Initialize default data sources
    const defaultSources: SLADataSource[] = [
      {
        id: 'prometheus-default',
        name: 'Prometheus Default',
        type: 'prometheus',
        configuration: { url: 'http://prometheus:9090' },
        isActive: true
      },
      {
        id: 'influxdb-default',
        name: 'InfluxDB Default',
        type: 'influxdb',
        configuration: { url: 'http://influxdb:8086' },
        isActive: true
      }
    ];
    
    defaultSources.forEach(source => {
      this.dataSources.set(source.id, source);
    });
  }

  private generateMeasurementId(): string {
    return `measurement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async shutdown(): Promise<void> {
    // Stop all tracking intervals
    for (const [slaId, interval] of this.trackingIntervals) {
      clearInterval(interval);
    }
    
    this.trackingIntervals.clear();
    this.slas.clear();
    this.metrics.clear();
    this.measurementPoints.clear();
    this.calculationQueue = [];
    
    this.emit('shutdown');
  }
}