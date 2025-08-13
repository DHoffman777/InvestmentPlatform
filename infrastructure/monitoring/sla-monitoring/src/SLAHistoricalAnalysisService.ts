import { EventEmitter } from 'events';
import {
  SLAMetric,
  SLABreach,
  SLATrend,
  SLAAnalysis,
  SLAPattern,
  SLAAnomaly,
  SLACorrelation,
  SLAPrediction,
  SLARootCauseAnalysis,
  SLARecommendation,
  SLASeverity,
  SLADefinition
} from './SLADataModel';

export interface HistoricalAnalysisConfig {
  analysisInterval: number;
  lookbackPeriods: {
    short: number;    // 7 days
    medium: number;   // 30 days
    long: number;     // 90 days
    extended: number; // 365 days
  };
  anomalyDetection: {
    enabled: boolean;
    sensitivityThreshold: number;
    minimumDataPoints: number;
    algorithms: ('zscore' | 'iqr' | 'isolation_forest' | 'lstm')[];
  };
  patternRecognition: {
    enabled: boolean;
    minimumPatternLength: number;
    seasonalityThreshold: number;
    trendSignificanceLevel: number;
  };
  correlation: {
    enabled: boolean;
    minimumCorrelationCoefficient: number;
    windowSize: number;
    lagAnalysis: boolean;
  };
  prediction: {
    enabled: boolean;
    horizons: number[]; // prediction horizons in hours
    models: ('linear' | 'arima' | 'prophet' | 'lstm')[];
    confidenceThreshold: number;
  };
}

export interface AnalysisRequest {
  slaIds: string[];
  timeRange: { start: Date; end: Date };
  analysisTypes: ('trends' | 'patterns' | 'anomalies' | 'correlations' | 'predictions' | 'root_cause')[];
  granularity: 'hour' | 'day' | 'week' | 'month';
  includeBaseline: boolean;
  compareWithPrevious: boolean;
}

export interface TimeSeriesData {
  timestamp: Date;
  value: number;
  metadata?: Record<string, any>;
}

export interface StatisticalSummary {
  mean: number;
  median: number;
  mode: number;
  standardDeviation: number;
  variance: number;
  min: number;
  max: number;
  q1: number;
  q3: number;
  iqr: number;
  skewness: number;
  kurtosis: number;
}

export interface SeasonalityAnalysis {
  hasSeasonality: boolean;
  period: number;
  strength: number;
  components: {
    trend: number[];
    seasonal: number[];
    residual: number[];
  };
  peaks: Array<{ timestamp: Date; value: number }>;
  troughs: Array<{ timestamp: Date; value: number }>;
}

export interface ChangePointDetection {
  changePoints: Array<{
    timestamp: Date;
    magnitude: number;
    direction: 'increase' | 'decrease';
    significance: number;
    beforeMean: number;
    afterMean: number;
  }>;
  stability: number;
  volatility: number;
}

export class SLAHistoricalAnalysisService extends EventEmitter {
  private analysisCache: Map<string, SLAAnalysis> = new Map();
  private timeSeriesData: Map<string, TimeSeriesData[]> = new Map();
  private config: HistoricalAnalysisConfig;
  private analysisQueue: Array<{ request: AnalysisRequest; priority: number }> = [];
  private isProcessingQueue = false;

  constructor(config: HistoricalAnalysisConfig) {
    super();
    this.config = config;
    this.startQueueProcessor();
    this.startPeriodicAnalysis();
  }

  async performHistoricalAnalysis(request: AnalysisRequest): Promise<SLAAnalysis[]> {
    const analyses: SLAAnalysis[] = [];
    
    for (const slaId of request.slaIds) {
      try {
        const analysis = await this.analyzeSLA(slaId, request);
        analyses.push(analysis);
        
        // Cache the analysis
        this.analysisCache.set(`${slaId}_${request.timeRange.start.getTime()}_${request.timeRange.end.getTime()}`, analysis);
        
        this.emit('analysisCompleted', { slaId, analysis });
      } catch (error) {
        this.emit('analysisError', { slaId, error: error.message });
      }
    }
    
    return analyses;
  }

  async analyzeSLA(slaId: string, request: AnalysisRequest): Promise<SLAAnalysis> {
    const timeSeriesData = await this.getTimeSeriesData(slaId, request.timeRange, request.granularity);
    const slaDefinition = await this.getSLADefinition(slaId);
    
    const analysis: SLAAnalysis = {
      slaId,
      timeRange: request.timeRange,
      patterns: [],
      anomalies: [],
      correlations: [],
      predictions: [],
      rootCauseAnalysis: [],
      recommendations: [],
      analysisType: 'historical',
      confidence: 0,
      analysedAt: new Date()
    };

    // Perform requested analyses
    if (request.analysisTypes.includes('patterns')) {
      analysis.patterns = await this.detectPatterns(slaId, timeSeriesData, slaDefinition);
    }
    
    if (request.analysisTypes.includes('anomalies')) {
      analysis.anomalies = await this.detectAnomalies(slaId, timeSeriesData, slaDefinition);
    }
    
    if (request.analysisTypes.includes('correlations')) {
      analysis.correlations = await this.analyzeCorrelations(slaId, request.slaIds, request.timeRange);
    }
    
    if (request.analysisTypes.includes('predictions')) {
      analysis.predictions = await this.generatePredictions(slaId, timeSeriesData, slaDefinition);
    }
    
    if (request.analysisTypes.includes('root_cause')) {
      analysis.rootCauseAnalysis = await this.performRootCauseAnalysis(slaId, request.timeRange);
    }

    // Generate recommendations based on findings
    analysis.recommendations = await this.generateRecommendations(analysis, slaDefinition);
    
    // Calculate overall confidence
    analysis.confidence = this.calculateAnalysisConfidence(analysis);
    
    return analysis;
  }

  async detectPatterns(slaId: string, data: TimeSeriesData[], slaDefinition: SLADefinition): Promise<SLAPattern[]> {
    const patterns: SLAPattern[] = [];
    
    if (data.length < this.config.patternRecognition.minimumPatternLength) {
      return patterns;
    }

    // Detect seasonal patterns
    const seasonalityAnalysis = await this.analyzeSeasonality(data);
    if (seasonalityAnalysis.hasSeasonality) {
      patterns.push({
        type: 'seasonal',
        description: `Seasonal pattern detected with period of ${seasonalityAnalysis.period} ${this.getTimeUnit(seasonalityAnalysis.period)}`,
        frequency: seasonalityAnalysis.period,
        timeWindow: {
          start: data[0].timestamp,
          end: data[data.length - 1].timestamp
        },
        affectedSLAs: [slaId],
        strength: seasonalityAnalysis.strength,
        impact: this.determinePatternImpact(seasonalityAnalysis.strength)
      });
    }

    // Detect trending patterns
    const trendAnalysis = await this.analyzeTrend(data);
    if (Math.abs(trendAnalysis.slope) > this.config.patternRecognition.trendSignificanceLevel) {
      patterns.push({
        type: 'trending',
        description: `${trendAnalysis.direction} trend detected with slope ${trendAnalysis.slope.toFixed(4)}`,
        frequency: 0,
        timeWindow: {
          start: data[0].timestamp,
          end: data[data.length - 1].timestamp
        },
        affectedSLAs: [slaId],
        strength: Math.abs(trendAnalysis.slope),
        impact: trendAnalysis.direction === 'improving' ? 'positive' : 'negative'
      });
    }

    // Detect cyclical patterns
    const cyclicalPatterns = await this.detectCyclicalPatterns(data);
    patterns.push(...cyclicalPatterns.map(cp => ({
      type: 'cyclical' as const,
      description: `Cyclical pattern with period ${cp.period}`,
      frequency: cp.period,
      timeWindow: {
        start: data[0].timestamp,
        end: data[data.length - 1].timestamp
      },
      affectedSLAs: [slaId],
      strength: cp.strength,
      impact: 'neutral' as const
    })));

    // Detect recurring breach patterns
    const breachPatterns = await this.detectBreachPatterns(slaId, data, slaDefinition);
    patterns.push(...breachPatterns);

    return patterns;
  }

  async detectAnomalies(slaId: string, data: TimeSeriesData[], slaDefinition: SLADefinition): Promise<SLAAnomaly[]> {
    const anomalies: SLAAnomaly[] = [];
    
    if (data.length < this.config.anomalyDetection.minimumDataPoints) {
      return anomalies;
    }

    const values = data.map(d => d.value);
    const statistics = this.calculateStatisticalSummary(values);

    // Z-Score based anomaly detection
    if (this.config.anomalyDetection.algorithms.includes('zscore')) {
      const zScoreAnomalies = this.detectZScoreAnomalies(data, statistics);
      anomalies.push(...zScoreAnomalies.map(a => ({
        id: this.generateAnomalyId(),
        timestamp: a.timestamp,
        value: a.value,
        expectedValue: statistics.mean,
        deviation: Math.abs(a.value - statistics.mean),
        severity: this.categorizeAnomalySeverity(Math.abs(a.zScore)),
        description: `Z-score anomaly (z=${a.zScore.toFixed(2)})`,
        possibleCauses: this.inferPossibleCauses(a, slaDefinition),
        investigated: false
      })));
    }

    // IQR based anomaly detection
    if (this.config.anomalyDetection.algorithms.includes('iqr')) {
      const iqrAnomalies = this.detectIQRAnomalies(data, statistics);
      anomalies.push(...iqrAnomalies);
    }

    // Isolation Forest (simplified implementation)
    if (this.config.anomalyDetection.algorithms.includes('isolation_forest')) {
      const isolationAnomalies = await this.detectIsolationForestAnomalies(data);
      anomalies.push(...isolationAnomalies);
    }

    return anomalies;
  }

  async analyzeCorrelations(slaId: string, allSlaIds: string[], timeRange: { start: Date; end: Date }): Promise<SLACorrelation[]> {
    const correlations: SLACorrelation[] = [];
    
    if (!this.config.correlation.enabled || allSlaIds.length < 2) {
      return correlations;
    }

    const targetData = await this.getTimeSeriesData(slaId, timeRange, 'hour');
    
    for (const otherSlaId of allSlaIds) {
      if (otherSlaId === slaId) continue;
      
      const otherData = await this.getTimeSeriesData(otherSlaId, timeRange, 'hour');
      const correlation = this.calculatePearsonCorrelation(targetData, otherData);
      
      if (Math.abs(correlation.coefficient) >= this.config.correlation.minimumCorrelationCoefficient) {
        correlations.push({
          slaId1: slaId,
          slaId2: otherSlaId,
          coefficient: correlation.coefficient,
          strength: this.categorizeCorrelationStrength(Math.abs(correlation.coefficient)),
          timeWindow: timeRange,
          description: `${correlation.coefficient > 0 ? 'Positive' : 'Negative'} correlation with strength ${Math.abs(correlation.coefficient).toFixed(3)}`
        });
      }
    }

    return correlations;
  }

  async generatePredictions(slaId: string, data: TimeSeriesData[], slaDefinition: SLADefinition): Promise<SLAPrediction[]> {
    const predictions: SLAPrediction[] = [];
    
    if (!this.config.prediction.enabled || data.length < 24) {
      return predictions;
    }

    for (const horizon of this.config.prediction.horizons) {
      for (const model of this.config.prediction.models) {
        try {
          const prediction = await this.generateSinglePrediction(data, horizon, model, slaDefinition);
          if (prediction.probability >= this.config.prediction.confidenceThreshold) {
            predictions.push(prediction);
          }
        } catch (error) {
          console.warn(`Failed to generate ${model} prediction for ${horizon}h horizon:`, error.message);
        }
      }
    }

    return predictions;
  }

  async performRootCauseAnalysis(slaId: string, timeRange: { start: Date; end: Date }): Promise<SLARootCauseAnalysis[]> {
    const rootCauseAnalyses: SLARootCauseAnalysis[] = [];
    
    // Get breaches in the time range
    const breaches = await this.getBreachesInTimeRange(slaId, timeRange);
    
    for (const breach of breaches) {
      const analysis = await this.analyzeBreachRootCause(breach, slaId);
      rootCauseAnalyses.push(analysis);
    }
    
    return rootCauseAnalyses;
  }

  async generateRecommendations(analysis: SLAAnalysis, slaDefinition: SLADefinition): Promise<SLARecommendation[]> {
    const recommendations: SLARecommendation[] = [];
    
    // Recommendations based on patterns
    for (const pattern of analysis.patterns) {
      if (pattern.type === 'trending' && pattern.impact === 'negative') {
        recommendations.push({
          id: this.generateRecommendationId(),
          slaId: analysis.slaId,
          type: 'optimization',
          priority: 'high',
          title: 'Address Negative Trend',
          description: `SLA showing ${pattern.description}. Investigate root causes and implement corrective measures.`,
          expectedBenefit: 'Prevent further performance degradation',
          implementationEffort: 'medium',
          estimatedImpact: 75,
          timeline: '2-4 weeks',
          status: 'pending'
        });
      }
      
      if (pattern.type === 'seasonal' && pattern.strength > 0.7) {
        recommendations.push({
          id: this.generateRecommendationId(),
          slaId: analysis.slaId,
          type: 'process_improvement',
          priority: 'medium',
          title: 'Optimize for Seasonal Patterns',
          description: `Strong seasonal pattern detected. Consider proactive scaling or maintenance scheduling.`,
          expectedBenefit: 'Improved performance during peak periods',
          implementationEffort: 'low',
          estimatedImpact: 50,
          timeline: '1-2 weeks',
          status: 'pending'
        });
      }
    }

    // Recommendations based on anomalies
    const criticalAnomalies = analysis.anomalies.filter(a => a.severity === SLASeverity.CRITICAL);
    if (criticalAnomalies.length > 0) {
      recommendations.push({
        id: this.generateRecommendationId(),
        slaId: analysis.slaId,
        type: 'alerting',
        priority: 'high',
        title: 'Enhance Anomaly Detection',
        description: `${criticalAnomalies.length} critical anomalies detected. Consider tightening monitoring thresholds.`,
        expectedBenefit: 'Earlier detection of performance issues',
        implementationEffort: 'low',
        estimatedImpact: 60,
        timeline: '1 week',
        status: 'pending'
      });
    }

    // Recommendations based on correlations
    const strongCorrelations = analysis.correlations.filter(c => c.strength === 'strong');
    if (strongCorrelations.length > 0) {
      recommendations.push({
        id: this.generateRecommendationId(),
        slaId: analysis.slaId,
        type: 'process_improvement',
        priority: 'medium',
        title: 'Leverage Service Correlations',
        description: `Strong correlations found with ${strongCorrelations.length} other services. Consider coordinated monitoring and scaling.`,
        expectedBenefit: 'Improved overall system performance',
        implementationEffort: 'medium',
        estimatedImpact: 40,
        timeline: '3-4 weeks',
        status: 'pending'
      });
    }

    return recommendations;
  }

  private async getTimeSeriesData(slaId: string, timeRange: { start: Date; end: Date }, granularity: string): Promise<TimeSeriesData[]> {
    // This would typically query the SLA tracking service
    // For now, generate mock time series data
    const data: TimeSeriesData[] = [];
    const intervalMs = this.getGranularityInterval(granularity);
    const baseValue = 99.5; // Base SLA value
    
    for (let time = timeRange.start.getTime(); time <= timeRange.end.getTime(); time += intervalMs) {
      const timestamp = new Date(time);
      const noise = (Math.random() - 0.5) * 2; // -1 to 1
      const seasonality = Math.sin((time / (24 * 60 * 60 * 1000)) * 2 * Math.PI) * 0.5; // Daily pattern
      const value = baseValue + noise + seasonality;
      
      data.push({
        timestamp,
        value: Math.max(0, Math.min(100, value)), // Clamp between 0-100
        metadata: { slaId, granularity }
      });
    }
    
    return data;
  }

  private async getSLADefinition(slaId: string): Promise<SLADefinition> {
    // This would typically query the SLA definition service
    // For now, return a mock definition
    return {
      id: slaId,
      name: `SLA ${slaId}`,
      description: 'Mock SLA definition',
      serviceId: 'service-1',
      serviceName: 'Mock Service',
      metricType: 'availability' as any,
      targetValue: 99.5,
      unit: '%',
      thresholds: {
        target: 99.5,
        warning: 99.0,
        critical: 98.0,
        escalation: 97.0,
        acceptable: 99.0,
        excellent: 99.9
      },
      measurement: {
        frequency: 60000,
        aggregationMethod: 'avg',
        excludeMaintenanceWindows: true,
        excludeWeekends: false,
        excludeHolidays: false,
        dataSource: 'prometheus',
        queryTemplate: 'mock_query',
        validationRules: []
      },
      timeWindow: {
        type: 'rolling',
        duration: 86400000 // 24 hours
      },
      penalties: [],
      notifications: [],
      tags: {},
      isActive: true,
      version: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: 'system',
      updatedBy: 'system'
    };
  }

  private analyzeSeasonality(data: TimeSeriesData[]): SeasonalityAnalysis {
    const values = data.map(d => d.value);
    
    // Simple autocorrelation-based seasonality detection
    const maxLag = Math.min(Math.floor(data.length / 4), 168); // Max 1 week for hourly data
    let bestPeriod = 0;
    let maxCorrelation = 0;
    
    for (let lag = 2; lag <= maxLag; lag++) {
      const correlation = this.calculateAutocorrelation(values, lag);
      if (correlation > maxCorrelation) {
        maxCorrelation = correlation;
        bestPeriod = lag;
      }
    }
    
    const hasSeasonality = maxCorrelation > this.config.patternRecognition.seasonalityThreshold;
    
    return {
      hasSeasonality,
      period: bestPeriod,
      strength: maxCorrelation,
      components: {
        trend: [], // Would implement proper decomposition
        seasonal: [],
        residual: []
      },
      peaks: [],
      troughs: []
    };
  }

  private analyzeTrend(data: TimeSeriesData[]): { slope: number; direction: 'improving' | 'degrading' | 'stable' } {
    const n = data.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = data.map(d => d.value);
    
    // Linear regression
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = y.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    let direction: 'improving' | 'degrading' | 'stable';
    if (Math.abs(slope) < 0.001) {
      direction = 'stable';
    } else {
      direction = slope > 0 ? 'improving' : 'degrading';
    }
    
    return { slope, direction };
  }

  private detectCyclicalPatterns(data: TimeSeriesData[]): Array<{ period: number; strength: number }> {
    // Simplified cyclical pattern detection using FFT-like approach
    const patterns: Array<{ period: number; strength: number }> = [];
    const values = data.map(d => d.value);
    const n = values.length;
    
    // Check for common cyclical periods (in data points)
    const testPeriods = [24, 48, 72, 168]; // Common patterns: daily, bi-daily, 3-day, weekly
    
    for (const period of testPeriods) {
      if (period >= n / 2) continue;
      
      let correlation = 0;
      let count = 0;
      
      for (let i = 0; i < n - period; i++) {
        correlation += values[i] * values[i + period];
        count++;
      }
      
      const strength = count > 0 ? correlation / count : 0;
      
      if (strength > 0.5) {
        patterns.push({ period, strength });
      }
    }
    
    return patterns;
  }

  private async detectBreachPatterns(slaId: string, data: TimeSeriesData[], slaDefinition: SLADefinition): Promise<SLAPattern[]> {
    const patterns: SLAPattern[] = [];
    const breaches = data.filter(d => d.value < slaDefinition.thresholds.warning);
    
    if (breaches.length < 3) return patterns;
    
    // Analyze breach timing
    const breachIntervals = [];
    for (let i = 1; i < breaches.length; i++) {
      const interval = breaches[i].timestamp.getTime() - breaches[i-1].timestamp.getTime();
      breachIntervals.push(interval);
    }
    
    // Check for recurring breach pattern
    if (breachIntervals.length > 2) {
      const avgInterval = breachIntervals.reduce((sum, interval) => sum + interval, 0) / breachIntervals.length;
      const variance = breachIntervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / breachIntervals.length;
      const stdDev = Math.sqrt(variance);
      
      // If intervals are consistent (low variance), it's a recurring pattern
      if (stdDev / avgInterval < 0.3) {
        patterns.push({
          type: 'recurring',
          description: `Recurring breach pattern every ${Math.round(avgInterval / (60 * 60 * 1000))} hours`,
          frequency: avgInterval,
          timeWindow: {
            start: breaches[0].timestamp,
            end: breaches[breaches.length - 1].timestamp
          },
          affectedSLAs: [slaId],
          strength: 1 - (stdDev / avgInterval),
          impact: 'negative'
        });
      }
    }
    
    return patterns;
  }

  private calculateStatisticalSummary(values: number[]): StatisticalSummary {
    const sortedValues = [...values].sort((a, b) => a - b);
    const n = values.length;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / n;
    const median = n % 2 === 0 ? 
      (sortedValues[n/2 - 1] + sortedValues[n/2]) / 2 : 
      sortedValues[Math.floor(n/2)];
    
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / n;
    const standardDeviation = Math.sqrt(variance);
    
    const q1Index = Math.floor(n * 0.25);
    const q3Index = Math.floor(n * 0.75);
    const q1 = sortedValues[q1Index];
    const q3 = sortedValues[q3Index];
    const iqr = q3 - q1;
    
    // Calculate skewness and kurtosis
    const skewness = values.reduce((sum, val) => sum + Math.pow((val - mean) / standardDeviation, 3), 0) / n;
    const kurtosis = values.reduce((sum, val) => sum + Math.pow((val - mean) / standardDeviation, 4), 0) / n - 3;
    
    // Mode calculation (simplified)
    const mode = mean; // Simplified - would need proper mode calculation
    
    return {
      mean,
      median,
      mode,
      standardDeviation,
      variance,
      min: sortedValues[0],
      max: sortedValues[n - 1],
      q1,
      q3,
      iqr,
      skewness,
      kurtosis
    };
  }

  private detectZScoreAnomalies(data: TimeSeriesData[], stats: StatisticalSummary): Array<{ timestamp: Date; value: number; zScore: number }> {
    const threshold = this.config.anomalyDetection.sensitivityThreshold;
    const anomalies: Array<{ timestamp: Date; value: number; zScore: number }> = [];
    
    for (const point of data) {
      const zScore = (point.value - stats.mean) / stats.standardDeviation;
      if (Math.abs(zScore) > threshold) {
        anomalies.push({
          timestamp: point.timestamp,
          value: point.value,
          zScore
        });
      }
    }
    
    return anomalies;
  }

  private detectIQRAnomalies(data: TimeSeriesData[], stats: StatisticalSummary): SLAAnomaly[] {
    const lowerBound = stats.q1 - 1.5 * stats.iqr;
    const upperBound = stats.q3 + 1.5 * stats.iqr;
    const anomalies: SLAAnomaly[] = [];
    
    for (const point of data) {
      if (point.value < lowerBound || point.value > upperBound) {
        anomalies.push({
          id: this.generateAnomalyId(),
          timestamp: point.timestamp,
          value: point.value,
          expectedValue: stats.median,
          deviation: Math.abs(point.value - stats.median),
          severity: this.categorizeAnomalySeverity(Math.abs(point.value - stats.median) / stats.iqr),
          description: `IQR outlier (value: ${point.value}, bounds: [${lowerBound.toFixed(2)}, ${upperBound.toFixed(2)}])`,
          possibleCauses: ['Data quality issue', 'System anomaly', 'External factor'],
          investigated: false
        });
      }
    }
    
    return anomalies;
  }

  private async detectIsolationForestAnomalies(data: TimeSeriesData[]): Promise<SLAAnomaly[]> {
    // Simplified isolation forest implementation
    // In practice, would use a proper machine learning library
    const anomalies: SLAAnomaly[] = [];
    const values = data.map(d => d.value);
    const stats = this.calculateStatisticalSummary(values);
    
    // Use a simplified approach based on distance from mean
    const threshold = 2.5 * stats.standardDeviation;
    
    for (const point of data) {
      const distance = Math.abs(point.value - stats.mean);
      if (distance > threshold) {
        anomalies.push({
          id: this.generateAnomalyId(),
          timestamp: point.timestamp,
          value: point.value,
          expectedValue: stats.mean,
          deviation: distance,
          severity: this.categorizeAnomalySeverity(distance / stats.standardDeviation),
          description: `Isolation forest anomaly (distance: ${distance.toFixed(2)})`,
          possibleCauses: ['Outlier behavior', 'System stress', 'Configuration change'],
          investigated: false
        });
      }
    }
    
    return anomalies;
  }

  private calculatePearsonCorrelation(data1: TimeSeriesData[], data2: TimeSeriesData[]): { coefficient: number; significance: number } {
    // Align data by timestamp
    const aligned = this.alignTimeSeries(data1, data2);
    const values1 = aligned.map(d => d.value1);
    const values2 = aligned.map(d => d.value2);
    
    const n = values1.length;
    if (n < 2) return { coefficient: 0, significance: 0 };
    
    const mean1 = values1.reduce((sum, val) => sum + val, 0) / n;
    const mean2 = values2.reduce((sum, val) => sum + val, 0) / n;
    
    let numerator = 0;
    let denominator1 = 0;
    let denominator2 = 0;
    
    for (let i = 0; i < n; i++) {
      const diff1 = values1[i] - mean1;
      const diff2 = values2[i] - mean2;
      
      numerator += diff1 * diff2;
      denominator1 += diff1 * diff1;
      denominator2 += diff2 * diff2;
    }
    
    const coefficient = numerator / Math.sqrt(denominator1 * denominator2);
    
    // Simple significance test (t-test approximation)
    const tStat = coefficient * Math.sqrt((n - 2) / (1 - coefficient * coefficient));
    const significance = Math.abs(tStat);
    
    return { coefficient: isNaN(coefficient) ? 0 : coefficient, significance };
  }

  private async generateSinglePrediction(
    data: TimeSeriesData[], 
    horizon: number, 
    model: string, 
    slaDefinition: SLADefinition
  ): Promise<SLAPrediction> {
    // Simplified prediction models
    const values = data.map(d => d.value);
    const n = values.length;
    
    let predictedValue: number;
    let confidence: number;
    
    switch (model) {
      case 'linear':
        const trend = this.analyzeTrend(data);
        predictedValue = values[n - 1] + trend.slope * horizon;
        confidence = 0.7;
        break;
        
      case 'arima':
        // Simplified ARIMA - using moving average
        const windowSize = Math.min(24, n);
        const recentValues = values.slice(-windowSize);
        predictedValue = recentValues.reduce((sum, val) => sum + val, 0) / windowSize;
        confidence = 0.8;
        break;
        
      case 'prophet':
        // Simplified Prophet - combining trend and seasonality
        const trendAnalysis = this.analyzeTrend(data);
        const seasonalityAnalysis = this.analyzeSeasonality(data);
        predictedValue = values[n - 1] + trendAnalysis.slope * horizon;
        if (seasonalityAnalysis.hasSeasonality) {
          const seasonalComponent = Math.sin((horizon / seasonalityAnalysis.period) * 2 * Math.PI) * seasonalityAnalysis.strength;
          predictedValue += seasonalComponent;
        }
        confidence = 0.85;
        break;
        
      default:
        predictedValue = values[n - 1];
        confidence = 0.5;
    }
    
    // Calculate confidence interval
    const stats = this.calculateStatisticalSummary(values);
    const confidenceInterval = {
      lower: predictedValue - 1.96 * stats.standardDeviation,
      upper: predictedValue + 1.96 * stats.standardDeviation
    };
    
    return {
      slaId: slaDefinition.id,
      predictedValue,
      confidenceInterval,
      probability: confidence,
      timeHorizon: horizon,
      model,
      accuracy: confidence,
      factors: this.identifyPredictionFactors(data, model)
    };
  }

  private async getBreachesInTimeRange(slaId: string, timeRange: { start: Date; end: Date }): Promise<SLABreach[]> {
    // This would typically query the breach detection service
    // For now, return mock breaches
    return [];
  }

  private async analyzeBreachRootCause(breach: SLABreach, slaId: string): Promise<SLARootCauseAnalysis> {
    // Simplified root cause analysis
    return {
      breachId: breach.id,
      causes: [
        {
          category: 'infrastructure',
          description: 'High system load',
          likelihood: 0.7,
          impact: 0.8,
          evidence: ['CPU usage spike', 'Memory pressure']
        }
      ],
      primaryCause: 'High system load',
      contributingFactors: ['Network latency', 'Database slow queries'],
      evidence: ['Monitoring data', 'Log analysis'],
      resolution: 'Scale up infrastructure',
      preventiveMeasures: ['Implement auto-scaling', 'Optimize queries'],
      confidence: 0.75
    };
  }

  private calculateAutocorrelation(values: number[], lag: number): number {
    const n = values.length;
    if (lag >= n) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / n;
    let numerator = 0;
    let denominator = 0;
    
    for (let i = 0; i < n - lag; i++) {
      numerator += (values[i] - mean) * (values[i + lag] - mean);
    }
    
    for (let i = 0; i < n; i++) {
      denominator += (values[i] - mean) * (values[i] - mean);
    }
    
    return denominator === 0 ? 0 : numerator / denominator;
  }

  private alignTimeSeries(data1: TimeSeriesData[], data2: TimeSeriesData[]): Array<{ timestamp: Date; value1: number; value2: number }> {
    const aligned: Array<{ timestamp: Date; value1: number; value2: number }> = [];
    
    // Simple alignment by timestamp (in practice, would need interpolation)
    const map1 = new Map(data1.map(d => [d.timestamp.getTime(), d.value]));
    const map2 = new Map(data2.map(d => [d.timestamp.getTime(), d.value]));
    
    for (const [timestamp, value1] of map1) {
      const value2 = map2.get(timestamp);
      if (value2 !== undefined) {
        aligned.push({
          timestamp: new Date(timestamp),
          value1,
          value2
        });
      }
    }
    
    return aligned;
  }

  private calculateAnalysisConfidence(analysis: SLAAnalysis): number {
    let totalConfidence = 0;
    let componentCount = 0;
    
    if (analysis.patterns.length > 0) {
      const avgPatternStrength = analysis.patterns.reduce((sum, p) => sum + (p.strength || 0), 0) / analysis.patterns.length;
      totalConfidence += avgPatternStrength;
      componentCount++;
    }
    
    if (analysis.predictions.length > 0) {
      const avgPredictionAccuracy = analysis.predictions.reduce((sum, p) => sum + p.accuracy, 0) / analysis.predictions.length;
      totalConfidence += avgPredictionAccuracy;
      componentCount++;
    }
    
    if (analysis.correlations.length > 0) {
      const avgCorrelationStrength = analysis.correlations.reduce((sum, c) => {
        const strength = c.strength === 'strong' ? 0.9 : c.strength === 'moderate' ? 0.6 : 0.3;
        return sum + strength;
      }, 0) / analysis.correlations.length;
      totalConfidence += avgCorrelationStrength;
      componentCount++;
    }
    
    return componentCount > 0 ? totalConfidence / componentCount : 0.5;
  }

  private getGranularityInterval(granularity: string): number {
    switch (granularity) {
      case 'hour':
        return 60 * 60 * 1000;
      case 'day':
        return 24 * 60 * 60 * 1000;
      case 'week':
        return 7 * 24 * 60 * 60 * 1000;
      case 'month':
        return 30 * 24 * 60 * 60 * 1000;
      default:
        return 60 * 60 * 1000;
    }
  }

  private getTimeUnit(period: number): string {
    if (period < 60) return 'minutes';
    if (period < 1440) return 'hours';
    if (period < 10080) return 'days';
    return 'weeks';
  }

  private determinePatternImpact(strength: number): 'positive' | 'negative' | 'neutral' {
    return strength > 0.7 ? 'positive' : strength < -0.7 ? 'negative' : 'neutral';
  }

  private categorizeAnomalySeverity(deviation: number): SLASeverity {
    if (deviation > 3) return SLASeverity.CRITICAL;
    if (deviation > 2.5) return SLASeverity.HIGH;
    if (deviation > 2) return SLASeverity.MEDIUM;
    return SLASeverity.LOW;
  }

  private categorizeCorrelationStrength(coefficient: number): 'weak' | 'moderate' | 'strong' {
    if (coefficient >= 0.7) return 'strong';
    if (coefficient >= 0.4) return 'moderate';
    return 'weak';
  }

  private inferPossibleCauses(anomaly: any, slaDefinition: SLADefinition): string[] {
    const causes = ['System overload', 'Network issues', 'Configuration change'];
    
    if (anomaly.value < slaDefinition.thresholds.critical) {
      causes.push('Service outage', 'Database connectivity issues');
    }
    
    return causes;
  }

  private identifyPredictionFactors(data: TimeSeriesData[], model: string): string[] {
    const factors = ['Historical trend', 'Recent performance'];
    
    if (model === 'prophet') {
      factors.push('Seasonal patterns', 'Holiday effects');
    }
    
    if (model === 'arima') {
      factors.push('Autoregressive components', 'Moving averages');
    }
    
    return factors;
  }

  private startQueueProcessor(): void {
    setInterval(async () => {
      if (!this.isProcessingQueue && this.analysisQueue.length > 0) {
        this.isProcessingQueue = true;
        
        try {
          const item = this.analysisQueue.shift();
          if (item) {
            await this.performHistoricalAnalysis(item.request);
          }
        } catch (error) {
          console.error('Analysis queue processing error:', error);
        } finally {
          this.isProcessingQueue = false;
        }
      }
    }, 5000);
  }

  private startPeriodicAnalysis(): void {
    setInterval(async () => {
      // Trigger periodic analysis for active SLAs
      this.emit('periodicAnalysisTriggered');
    }, this.config.analysisInterval);
  }

  private generateAnomalyId(): string {
    return `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRecommendationId(): string {
    return `recommendation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async shutdown(): Promise<void> {
    this.analysisCache.clear();
    this.timeSeriesData.clear();
    this.analysisQueue = [];
    
    this.emit('shutdown');
  }
}