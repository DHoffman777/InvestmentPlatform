import { EventEmitter } from 'events';
import {
  PerformanceProfile,
  PerformanceBottleneck,
  PerformanceMetric,
  BottleneckType,
  BottleneckSeverity,
  PerformanceMetricType,
  PerformanceCategory,
  BottleneckContext,
  NetworkTiming,
  MemoryAllocation,
  CpuProfile,
  IoProfile,
  RootCause,
  RootCauseCategory,
  Evidence,
  EvidenceType
} from './PerformanceDataModel';

export interface BottleneckDetectionConfig {
  enableRealTimeDetection: boolean;
  detectionThresholds: DetectionThresholds;
  analysisWindowSize: number;
  minSampleSize: number;
  confidenceThreshold: number;
  enableMachineLearning: boolean;
  enableStatisticalAnalysis: boolean;
  enablePatternMatching: boolean;
}

export interface DetectionThresholds {
  cpuUsageThreshold: number;
  memoryUsageThreshold: number;
  responseTimeThreshold: number;
  throughputThreshold: number;
  errorRateThreshold: number;
  queueSizeThreshold: number;
  ioLatencyThreshold: number;
  networkLatencyThreshold: number;
}

export interface BottleneckDetectionAlgorithm {
  name: string;
  type: AlgorithmType;
  detectBottlenecks: (profile: PerformanceProfile) => Promise<PerformanceBottleneck[]>;
  enabled: boolean;
  confidence: number;
}

export enum AlgorithmType {
  THRESHOLD_BASED = 'threshold_based',
  STATISTICAL = 'statistical',
  MACHINE_LEARNING = 'machine_learning',
  PATTERN_MATCHING = 'pattern_matching',
  CORRELATION_BASED = 'correlation_based',
  ANOMALY_DETECTION = 'anomaly_detection'
}

export class BottleneckDetectionService extends EventEmitter {
  private detectionAlgorithms: Map<string, BottleneckDetectionAlgorithm> = new Map();
  private historicalProfiles: PerformanceProfile[] = [];
  private detectedBottlenecks: Map<string, PerformanceBottleneck[]> = new Map();
  private anomalyBaselines: Map<string, AnomalyBaseline> = new Map();
  private activeBottlenecks: Map<string, PerformanceBottleneck> = new Map();

  constructor(private config: BottleneckDetectionConfig) {
    super();
    this.initializeDetectionAlgorithms();
    this.startBackgroundTasks();
  }

  private initializeDetectionAlgorithms(): void {
    // Threshold-based detection
    this.detectionAlgorithms.set('threshold_cpu', {
      name: 'CPU Threshold Detection',
      type: AlgorithmType.THRESHOLD_BASED,
      detectBottlenecks: this.detectCpuBottlenecks.bind(this),
      enabled: true,
      confidence: 0.8
    });

    this.detectionAlgorithms.set('threshold_memory', {
      name: 'Memory Threshold Detection',
      type: AlgorithmType.THRESHOLD_BASED,
      detectBottlenecks: this.detectMemoryBottlenecks.bind(this),
      enabled: true,
      confidence: 0.8
    });

    this.detectionAlgorithms.set('threshold_io', {
      name: 'I/O Threshold Detection',
      type: AlgorithmType.THRESHOLD_BASED,
      detectBottlenecks: this.detectIoBottlenecks.bind(this),
      enabled: true,
      confidence: 0.8
    });

    this.detectionAlgorithms.set('threshold_network', {
      name: 'Network Threshold Detection',
      type: AlgorithmType.THRESHOLD_BASED,
      detectBottlenecks: this.detectNetworkBottlenecks.bind(this),
      enabled: true,
      confidence: 0.8
    });

    // Statistical analysis
    if (this.config.enableStatisticalAnalysis) {
      this.detectionAlgorithms.set('statistical_outlier', {
        name: 'Statistical Outlier Detection',
        type: AlgorithmType.STATISTICAL,
        detectBottlenecks: this.detectStatisticalOutliers.bind(this),
        enabled: true,
        confidence: 0.9
      });

      this.detectionAlgorithms.set('trend_analysis', {
        name: 'Performance Trend Analysis',
        type: AlgorithmType.STATISTICAL,
        detectBottlenecks: this.detectPerformanceTrends.bind(this),
        enabled: true,
        confidence: 0.85
      });
    }

    // Pattern matching
    if (this.config.enablePatternMatching) {
      this.detectionAlgorithms.set('pattern_lock_contention', {
        name: 'Lock Contention Pattern Detection',
        type: AlgorithmType.PATTERN_MATCHING,
        detectBottlenecks: this.detectLockContentionPatterns.bind(this),
        enabled: true,
        confidence: 0.75
      });

      this.detectionAlgorithms.set('pattern_resource_starvation', {
        name: 'Resource Starvation Pattern Detection',
        type: AlgorithmType.PATTERN_MATCHING,
        detectBottlenecks: this.detectResourceStarvationPatterns.bind(this),
        enabled: true,
        confidence: 0.8
      });
    }

    // Correlation-based detection
    this.detectionAlgorithms.set('correlation_analysis', {
      name: 'Performance Correlation Analysis',
      type: AlgorithmType.CORRELATION_BASED,
      detectBottlenecks: this.detectCorrelationBottlenecks.bind(this),
      enabled: true,
      confidence: 0.7
    });

    // Anomaly detection
    this.detectionAlgorithms.set('anomaly_detection', {
      name: 'Anomaly Detection',
      type: AlgorithmType.ANOMALY_DETECTION,
      detectBottlenecks: this.detectAnomalies.bind(this),
      enabled: true,
      confidence: 0.85
    });
  }

  async analyzeProfile(profile: PerformanceProfile): Promise<PerformanceBottleneck[]> {
    const allBottlenecks: PerformanceBottleneck[] = [];

    // Run each detection algorithm
    for (const [algorithmId, algorithm] of this.detectionAlgorithms) {
      if (!algorithm.enabled) continue;

      try {
        const bottlenecks = await algorithm.detectBottlenecks(profile);
        
        // Add algorithm metadata to bottlenecks
        bottlenecks.forEach(bottleneck => {
          bottleneck.confidence = Math.min(bottleneck.confidence, algorithm.confidence);
          if (!bottleneck.context) {
            bottleneck.context = {};
          }
          (bottleneck.context as any).detection_algorithm = algorithmId;
        });

        allBottlenecks.push(...bottlenecks);
        
        this.emit('algorithmCompleted', {
          algorithmId,
          profileId: profile.id,
          bottlenecksFound: bottlenecks.length,
          timestamp: new Date()
        });
      } catch (error: any) {
        console.error(`Bottleneck detection algorithm ${algorithmId} failed:`, error instanceof Error ? error.message : 'Unknown error');
        this.emit('algorithmError', {
          algorithmId,
          profileId: profile.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        });
      }
    }

    // Deduplicate and merge similar bottlenecks
    const mergedBottlenecks = this.mergeBottlenecks(allBottlenecks);

    // Filter by confidence threshold
    const filteredBottlenecks = mergedBottlenecks.filter(
      bottleneck => bottleneck.confidence >= this.config.confidenceThreshold
    );

    // Store results
    this.detectedBottlenecks.set(profile.id, filteredBottlenecks);

    // Add to historical data
    this.historicalProfiles.push(profile);
    if (this.historicalProfiles.length > 1000) {
      this.historicalProfiles.shift(); // Keep only recent profiles
    }

    this.emit('bottlenecksDetected', {
      profileId: profile.id,
      bottlenecks: filteredBottlenecks,
      totalAnalyzed: allBottlenecks.length,
      timestamp: new Date()
    });

    return filteredBottlenecks;
  }

  private async detectCpuBottlenecks(profile: PerformanceProfile): Promise<PerformanceBottleneck[]> {
    const bottlenecks: PerformanceBottleneck[] = [];
    const cpuMetrics = profile.metrics.filter(m => m.category === PerformanceCategory.CPU);

    if (cpuMetrics.length === 0) return bottlenecks;

    const avgCpuUsage = cpuMetrics.reduce((sum, m) => sum + m.value, 0) / cpuMetrics.length;
    const maxCpuUsage = Math.max(...cpuMetrics.map(m => m.value));

    if (avgCpuUsage > this.config.detectionThresholds.cpuUsageThreshold) {
      const bottleneck: PerformanceBottleneck = {
        id: this.generateBottleneckId(),
        profile_id: profile.id,
        type: BottleneckType.CPU_BOUND,
        severity: this.calculateSeverity(avgCpuUsage, this.config.detectionThresholds.cpuUsageThreshold),
        component: 'cpu',
        operation: 'cpu_usage',
        duration_ms: profile.duration_ms,
        percentage_of_total: (avgCpuUsage / 100) * 100,
        impact_score: this.calculateImpactScore(avgCpuUsage, maxCpuUsage),
        root_causes: await this.analyzeCpuRootCauses(cpuMetrics, profile),
        context: this.createCpuContext(cpuMetrics),
        detected_at: new Date(),
        confidence: 0.9
      };

      bottlenecks.push(bottleneck);
    }

    return bottlenecks;
  }

  private async detectMemoryBottlenecks(profile: PerformanceProfile): Promise<PerformanceBottleneck[]> {
    const bottlenecks: PerformanceBottleneck[] = [];
    const memoryMetrics = profile.metrics.filter(m => m.category === PerformanceCategory.MEMORY);

    if (memoryMetrics.length === 0) return bottlenecks;

    const avgMemoryUsage = memoryMetrics.reduce((sum, m) => sum + m.value, 0) / memoryMetrics.length;
    const maxMemoryUsage = Math.max(...memoryMetrics.map(m => m.value));

    if (avgMemoryUsage > this.config.detectionThresholds.memoryUsageThreshold) {
      const bottleneck: PerformanceBottleneck = {
        id: this.generateBottleneckId(),
        profile_id: profile.id,
        type: BottleneckType.MEMORY_BOUND,
        severity: this.calculateSeverity(avgMemoryUsage, this.config.detectionThresholds.memoryUsageThreshold),
        component: 'memory',
        operation: 'memory_allocation',
        duration_ms: profile.duration_ms,
        percentage_of_total: (avgMemoryUsage / maxMemoryUsage) * 100,
        impact_score: this.calculateImpactScore(avgMemoryUsage, maxMemoryUsage),
        root_causes: await this.analyzeMemoryRootCauses(memoryMetrics, profile),
        context: this.createMemoryContext(memoryMetrics),
        detected_at: new Date(),
        confidence: 0.85
      };

      bottlenecks.push(bottleneck);
    }

    return bottlenecks;
  }

  private async detectIoBottlenecks(profile: PerformanceProfile): Promise<PerformanceBottleneck[]> {
    const bottlenecks: PerformanceBottleneck[] = [];
    const ioMetrics = profile.metrics.filter(m => m.category === PerformanceCategory.IO);

    if (ioMetrics.length === 0) return bottlenecks;

    const avgIoLatency = ioMetrics.reduce((sum, m) => sum + m.value, 0) / ioMetrics.length;

    if (avgIoLatency > this.config.detectionThresholds.ioLatencyThreshold) {
      const bottleneck: PerformanceBottleneck = {
        id: this.generateBottleneckId(),
        profile_id: profile.id,
        type: BottleneckType.IO_BOUND,
        severity: this.calculateSeverity(avgIoLatency, this.config.detectionThresholds.ioLatencyThreshold),
        component: 'io_subsystem',
        operation: 'disk_io',
        duration_ms: profile.duration_ms,
        percentage_of_total: (avgIoLatency / profile.duration_ms) * 100,
        impact_score: this.calculateImpactScore(avgIoLatency, this.config.detectionThresholds.ioLatencyThreshold),
        root_causes: await this.analyzeIoRootCauses(ioMetrics, profile),
        context: this.createIoContext(ioMetrics),
        detected_at: new Date(),
        confidence: 0.8
      };

      bottlenecks.push(bottleneck);
    }

    return bottlenecks;
  }

  private async detectNetworkBottlenecks(profile: PerformanceProfile): Promise<PerformanceBottleneck[]> {
    const bottlenecks: PerformanceBottleneck[] = [];
    const networkMetrics = profile.metrics.filter(m => m.category === PerformanceCategory.NETWORK);

    if (networkMetrics.length === 0) return bottlenecks;

    const avgNetworkLatency = networkMetrics.reduce((sum, m) => sum + m.value, 0) / networkMetrics.length;

    if (avgNetworkLatency > this.config.detectionThresholds.networkLatencyThreshold) {
      const bottleneck: PerformanceBottleneck = {
        id: this.generateBottleneckId(),
        profile_id: profile.id,
        type: BottleneckType.NETWORK_BOUND,
        severity: this.calculateSeverity(avgNetworkLatency, this.config.detectionThresholds.networkLatencyThreshold),
        component: 'network',
        operation: 'network_io',
        duration_ms: profile.duration_ms,
        percentage_of_total: (avgNetworkLatency / profile.duration_ms) * 100,
        impact_score: this.calculateImpactScore(avgNetworkLatency, this.config.detectionThresholds.networkLatencyThreshold),
        root_causes: await this.analyzeNetworkRootCauses(networkMetrics, profile),
        context: this.createNetworkContext(networkMetrics),
        detected_at: new Date(),
        confidence: 0.75
      };

      bottlenecks.push(bottleneck);
    }

    return bottlenecks;
  }

  private async detectStatisticalOutliers(profile: PerformanceProfile): Promise<PerformanceBottleneck[]> {
    const bottlenecks: PerformanceBottleneck[] = [];

    if (this.historicalProfiles.length < this.config.minSampleSize) {
      return bottlenecks; // Not enough historical data
    }

    // Analyze each metric type for outliers
    const metricTypes = [
      PerformanceMetricType.RESPONSE_TIME,
      PerformanceMetricType.CPU_USAGE,
      PerformanceMetricType.MEMORY_USAGE,
      PerformanceMetricType.THROUGHPUT
    ];

    for (const metricType of metricTypes) {
      const currentMetrics = profile.metrics.filter(m => m.metric_type === metricType);
      if (currentMetrics.length === 0) continue;

      const currentAvg = currentMetrics.reduce((sum, m) => sum + m.value, 0) / currentMetrics.length;
      
      // Get historical averages for this metric type
      const historicalAverages = this.historicalProfiles.map(p => {
        const metrics = p.metrics.filter(m => m.metric_type === metricType);
        return metrics.length > 0 ? metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length : 0;
      }).filter(avg => avg > 0);

      if (historicalAverages.length < this.config.minSampleSize) continue;

      const { mean, stdDev } = this.calculateStatistics(historicalAverages);
      const zScore = Math.abs((currentAvg - mean) / stdDev);

      // If current value is more than 2 standard deviations from historical mean
      if (zScore > 2) {
        const bottleneck: PerformanceBottleneck = {
          id: this.generateBottleneckId(),
          profile_id: profile.id,
          type: this.mapMetricTypeToBottleneckType(metricType),
          severity: zScore > 3 ? BottleneckSeverity.HIGH : BottleneckSeverity.MEDIUM,
          component: this.mapMetricTypeToComponent(metricType),
          operation: metricType,
          duration_ms: profile.duration_ms,
          percentage_of_total: 100,
          impact_score: Math.min(zScore * 20, 100),
          root_causes: [{
            id: this.generateRootCauseId(),
            category: RootCauseCategory.CODE_INEFFICIENCY,
            description: `Statistical outlier detected: ${zScore.toFixed(2)} standard deviations from historical average`,
            confidence: Math.min(zScore / 3, 1),
            evidence: [{
              type: EvidenceType.METRIC_CORRELATION,
              description: `Current average: ${currentAvg.toFixed(2)}, Historical average: ${mean.toFixed(2)}, Standard deviation: ${stdDev.toFixed(2)}`,
              data: { currentAvg, historicalMean: mean, stdDev, zScore },
              strength: Math.min(zScore / 3, 1),
              timestamp: new Date()
            }],
            fix_suggestions: [],
            impact_assessment: {
              performance_impact: Math.min(zScore * 20, 100),
              user_experience_impact: Math.min(zScore * 15, 100),
              resource_cost_impact: Math.min(zScore * 10, 100),
              business_impact: Math.min(zScore * 10, 100),
              affected_operations: [metricType],
              affected_users: 0
            }
          }],
          context: {
            statistical_analysis: {
              z_score: zScore,
              historical_mean: mean,
              historical_std_dev: stdDev,
              current_value: currentAvg,
              sample_size: historicalAverages.length
            }
          } as any,
          detected_at: new Date(),
          confidence: Math.min(zScore / 3, 0.95)
        };

        bottlenecks.push(bottleneck);
      }
    }

    return bottlenecks;
  }

  private async detectPerformanceTrends(profile: PerformanceProfile): Promise<PerformanceBottleneck[]> {
    const bottlenecks: PerformanceBottleneck[] = [];

    if (this.historicalProfiles.length < this.config.analysisWindowSize) {
      return bottlenecks;
    }

    // Analyze trends for key metrics
    const recentProfiles = this.historicalProfiles.slice(-this.config.analysisWindowSize);
    
    const responseTimeTrend = this.calculateTrend(
      recentProfiles.map(p => this.getAverageMetricValue(p, PerformanceMetricType.RESPONSE_TIME))
    );

    if (responseTimeTrend.slope > 0.1 && responseTimeTrend.correlation > 0.7) { // Degrading performance
      const bottleneck: PerformanceBottleneck = {
        id: this.generateBottleneckId(),
        profile_id: profile.id,
        type: BottleneckType.ALGORITHM_INEFFICIENCY,
        severity: BottleneckSeverity.MEDIUM,
        component: 'application',
        operation: 'performance_degradation',
        duration_ms: profile.duration_ms,
        percentage_of_total: 100,
        impact_score: Math.min(responseTimeTrend.slope * 100, 100),
        root_causes: [{
          id: this.generateRootCauseId(),
          category: RootCauseCategory.CODE_INEFFICIENCY,
          description: 'Performance degradation trend detected over recent operations',
          confidence: responseTimeTrend.correlation,
          evidence: [{
            type: EvidenceType.TIMING_ANALYSIS,
            description: `Performance degrading at ${(responseTimeTrend.slope * 100).toFixed(2)}% per operation`,
            data: responseTimeTrend,
            strength: responseTimeTrend.correlation,
            timestamp: new Date()
          }],
          fix_suggestions: [],
          impact_assessment: {
            performance_impact: Math.min(responseTimeTrend.slope * 100, 100),
            user_experience_impact: Math.min(responseTimeTrend.slope * 80, 100),
            resource_cost_impact: Math.min(responseTimeTrend.slope * 60, 100),
            business_impact: Math.min(responseTimeTrend.slope * 40, 100),
            affected_operations: ['all'],
            affected_users: 0
          }
        }],
        context: {
          trend_analysis: responseTimeTrend
        } as any,
        detected_at: new Date(),
        confidence: responseTimeTrend.correlation
      };

      bottlenecks.push(bottleneck);
    }

    return bottlenecks;
  }

  private async detectLockContentionPatterns(profile: PerformanceProfile): Promise<PerformanceBottleneck[]> {
    const bottlenecks: PerformanceBottleneck[] = [];

    // Look for patterns indicating lock contention
    // This is a simplified pattern - in practice, you'd need more sophisticated analysis
    const cpuMetrics = profile.metrics.filter(m => m.category === PerformanceCategory.CPU);
    const responseTimeMetrics = profile.metrics.filter(m => m.metric_type === PerformanceMetricType.RESPONSE_TIME);

    if (cpuMetrics.length === 0 || responseTimeMetrics.length === 0) return bottlenecks;

    const avgCpuUsage = cpuMetrics.reduce((sum, m) => sum + m.value, 0) / cpuMetrics.length;
    const avgResponseTime = responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length;

    // Pattern: Low CPU usage but high response time might indicate lock contention
    if (avgCpuUsage < 30 && avgResponseTime > this.config.detectionThresholds.responseTimeThreshold * 2) {
      const bottleneck: PerformanceBottleneck = {
        id: this.generateBottleneckId(),
        profile_id: profile.id,
        type: BottleneckType.LOCK_CONTENTION,
        severity: BottleneckSeverity.HIGH,
        component: 'application',
        operation: 'lock_contention',
        duration_ms: profile.duration_ms,
        percentage_of_total: 100,
        impact_score: 80,
        root_causes: [{
          id: this.generateRootCauseId(),
          category: RootCauseCategory.ARCHITECTURAL_ISSUE,
          description: 'Lock contention pattern detected: low CPU usage with high response times',
          confidence: 0.7,
          evidence: [{
            type: EvidenceType.PATTERN_MATCHING,
            description: `CPU usage: ${avgCpuUsage.toFixed(2)}%, Response time: ${avgResponseTime.toFixed(2)}ms`,
            data: { avgCpuUsage, avgResponseTime },
            strength: 0.7,
            timestamp: new Date()
          }],
          fix_suggestions: [],
          impact_assessment: {
            performance_impact: 80,
            user_experience_impact: 90,
            resource_cost_impact: 30,
            business_impact: 70,
            affected_operations: ['all'],
            affected_users: 0
          }
        }],
        context: {
          pattern_analysis: {
            cpu_usage: avgCpuUsage,
            response_time: avgResponseTime,
            pattern_type: 'lock_contention'
          }
        } as any,
        detected_at: new Date(),
        confidence: 0.7
      };

      bottlenecks.push(bottleneck);
    }

    return bottlenecks;
  }

  private async detectResourceStarvationPatterns(profile: PerformanceProfile): Promise<PerformanceBottleneck[]> {
    const bottlenecks: PerformanceBottleneck[] = [];

    // Look for patterns indicating resource starvation
    const memoryMetrics = profile.metrics.filter(m => m.category === PerformanceCategory.MEMORY);
    const ioMetrics = profile.metrics.filter(m => m.category === PerformanceCategory.IO);

    if (memoryMetrics.length === 0) return bottlenecks;

    const maxMemoryUsage = Math.max(...memoryMetrics.map(m => m.value));
    const memoryVariability = this.calculateVariability(memoryMetrics.map(m => m.value));

    // Pattern: High memory usage with high variability might indicate memory pressure
    if (maxMemoryUsage > 85 && memoryVariability > 0.3) {
      const bottleneck: PerformanceBottleneck = {
        id: this.generateBottleneckId(),
        profile_id: profile.id,
        type: BottleneckType.RESOURCE_STARVATION,
        severity: BottleneckSeverity.HIGH,
        component: 'memory',
        operation: 'memory_pressure',
        duration_ms: profile.duration_ms,
        percentage_of_total: 100,
        impact_score: 85,
        root_causes: [{
          id: this.generateRootCauseId(),
          category: RootCauseCategory.RESOURCE_CONTENTION,
          description: 'Memory pressure pattern detected: high usage with high variability',
          confidence: 0.8,
          evidence: [{
            type: EvidenceType.PATTERN_MATCHING,
            description: `Max memory usage: ${maxMemoryUsage.toFixed(2)}%, Variability: ${memoryVariability.toFixed(2)}`,
            data: { maxMemoryUsage, memoryVariability },
            strength: 0.8,
            timestamp: new Date()
          }],
          fix_suggestions: [],
          impact_assessment: {
            performance_impact: 85,
            user_experience_impact: 80,
            resource_cost_impact: 90,
            business_impact: 60,
            affected_operations: ['memory_allocation'],
            affected_users: 0
          }
        }],
        context: {
          pattern_analysis: {
            max_memory_usage: maxMemoryUsage,
            memory_variability: memoryVariability,
            pattern_type: 'resource_starvation'
          }
        } as any,
        detected_at: new Date(),
        confidence: 0.8
      };

      bottlenecks.push(bottleneck);
    }

    return bottlenecks;
  }

  private async detectCorrelationBottlenecks(profile: PerformanceProfile): Promise<PerformanceBottleneck[]> {
    const bottlenecks: PerformanceBottleneck[] = [];

    // Analyze correlations between different metrics
    const responseTimeMetrics = profile.metrics.filter(m => m.metric_type === PerformanceMetricType.RESPONSE_TIME);
    const cpuMetrics = profile.metrics.filter(m => m.category === PerformanceCategory.CPU);
    const memoryMetrics = profile.metrics.filter(m => m.category === PerformanceCategory.MEMORY);

    if (responseTimeMetrics.length === 0 || cpuMetrics.length === 0) return bottlenecks;

    // Calculate correlation between response time and CPU usage
    const correlation = this.calculateCorrelation(
      responseTimeMetrics.map(m => m.value),
      cpuMetrics.map(m => m.value)
    );

    if (Math.abs(correlation) > 0.7) { // Strong correlation
      const bottleneck: PerformanceBottleneck = {
        id: this.generateBottleneckId(),
        profile_id: profile.id,
        type: correlation > 0 ? BottleneckType.CPU_BOUND : BottleneckType.ALGORITHM_INEFFICIENCY,
        severity: BottleneckSeverity.MEDIUM,
        component: 'application',
        operation: 'correlated_performance',
        duration_ms: profile.duration_ms,
        percentage_of_total: 100,
        impact_score: Math.abs(correlation) * 100,
        root_causes: [{
          id: this.generateRootCauseId(),
          category: RootCauseCategory.CODE_INEFFICIENCY,
          description: `Strong correlation detected between response time and CPU usage (${correlation.toFixed(2)})`,
          confidence: Math.abs(correlation),
          evidence: [{
            type: EvidenceType.METRIC_CORRELATION,
            description: `Correlation coefficient: ${correlation.toFixed(2)}`,
            data: { correlation, metric1: 'response_time', metric2: 'cpu_usage' },
            strength: Math.abs(correlation),
            timestamp: new Date()
          }],
          fix_suggestions: [],
          impact_assessment: {
            performance_impact: Math.abs(correlation) * 100,
            user_experience_impact: Math.abs(correlation) * 90,
            resource_cost_impact: Math.abs(correlation) * 60,
            business_impact: Math.abs(correlation) * 50,
            affected_operations: ['all'],
            affected_users: 0
          }
        }],
        context: {
          correlation_analysis: {
            correlation_coefficient: correlation,
            metric_1: 'response_time',
            metric_2: 'cpu_usage'
          }
        } as any,
        detected_at: new Date(),
        confidence: Math.abs(correlation)
      };

      bottlenecks.push(bottleneck);
    }

    return bottlenecks;
  }

  private async detectAnomalies(profile: PerformanceProfile): Promise<PerformanceBottleneck[]> {
    const bottlenecks: PerformanceBottleneck[] = [];

    // Simple anomaly detection based on baseline metrics
    const profileSignature = this.calculateProfileSignature(profile);
    const baselineKey = `${profile.target_type}_${profile.target_id}`;
    
    let baseline = this.anomalyBaselines.get(baselineKey);
    
    if (!baseline) {
      // Create new baseline
      baseline = {
        samples: [profileSignature],
        mean: profileSignature,
        variance: 0,
        lastUpdated: new Date()
      };
      this.anomalyBaselines.set(baselineKey, baseline);
      return bottlenecks; // Not enough data for anomaly detection
    }

    // Calculate anomaly score
    const anomalyScore = this.calculateAnomalyScore(profileSignature, baseline);
    
    if (anomalyScore > 2) { // Anomaly threshold
      const bottleneck: PerformanceBottleneck = {
        id: this.generateBottleneckId(),
        profile_id: profile.id,
        type: BottleneckType.ALGORITHM_INEFFICIENCY,
        severity: anomalyScore > 3 ? BottleneckSeverity.HIGH : BottleneckSeverity.MEDIUM,
        component: 'application',
        operation: 'anomaly_detected',
        duration_ms: profile.duration_ms,
        percentage_of_total: 100,
        impact_score: Math.min(anomalyScore * 25, 100),
        root_causes: [{
          id: this.generateRootCauseId(),
          category: RootCauseCategory.CODE_INEFFICIENCY,
          description: `Anomalous performance pattern detected (score: ${anomalyScore.toFixed(2)})`,
          confidence: Math.min(anomalyScore / 3, 0.95),
          evidence: [{
            type: EvidenceType.PATTERN_MATCHING,
            description: `Anomaly score: ${anomalyScore.toFixed(2)} (threshold: 2.0)`,
            data: { anomalyScore, baseline: baseline.mean, current: profileSignature },
            strength: Math.min(anomalyScore / 3, 1),
            timestamp: new Date()
          }],
          fix_suggestions: [],
          impact_assessment: {
            performance_impact: Math.min(anomalyScore * 25, 100),
            user_experience_impact: Math.min(anomalyScore * 20, 100),
            resource_cost_impact: Math.min(anomalyScore * 15, 100),
            business_impact: Math.min(anomalyScore * 10, 100),
            affected_operations: ['all'],
            affected_users: 0
          }
        }],
        context: {
          anomaly_detection: {
            anomaly_score: anomalyScore,
            baseline_mean: baseline.mean,
            baseline_variance: baseline.variance,
            current_signature: profileSignature
          }
        } as any,
        detected_at: new Date(),
        confidence: Math.min(anomalyScore / 3, 0.95)
      };

      bottlenecks.push(bottleneck);
    }

    // Update baseline
    this.updateAnomalyBaseline(baselineKey, profileSignature);

    return bottlenecks;
  }

  // Helper methods for root cause analysis
  private async analyzeCpuRootCauses(cpuMetrics: PerformanceMetric[], profile: PerformanceProfile): Promise<RootCause[]> {
    const rootCauses: RootCause[] = [];

    const avgCpuUsage = cpuMetrics.reduce((sum, m) => sum + m.value, 0) / cpuMetrics.length;
    const maxCpuUsage = Math.max(...cpuMetrics.map(m => m.value));

    if (maxCpuUsage > 95) {
      rootCauses.push({
        id: this.generateRootCauseId(),
        category: RootCauseCategory.CODE_INEFFICIENCY,
        description: 'CPU usage consistently high, indicating potential algorithm inefficiency or infinite loops',
        confidence: 0.8,
        evidence: [{
          type: EvidenceType.RESOURCE_UTILIZATION,
          description: `Maximum CPU usage: ${maxCpuUsage.toFixed(2)}%`,
          data: { maxCpuUsage, avgCpuUsage },
          strength: 0.9,
          timestamp: new Date()
        }],
        fix_suggestions: [],
        impact_assessment: {
          performance_impact: 90,
          user_experience_impact: 85,
          resource_cost_impact: 80,
          business_impact: 70,
          affected_operations: ['cpu_intensive_operations'],
          affected_users: 0
        }
      });
    }

    return rootCauses;
  }

  private async analyzeMemoryRootCauses(memoryMetrics: PerformanceMetric[], profile: PerformanceProfile): Promise<RootCause[]> {
    const rootCauses: RootCause[] = [];

    const memoryTrend = this.calculateTrend(memoryMetrics.map(m => m.value));
    
    if (memoryTrend.slope > 0.5) { // Memory leak pattern
      rootCauses.push({
        id: this.generateRootCauseId(),
        category: RootCauseCategory.CODE_INEFFICIENCY,
        description: 'Memory usage increasing over time, indicating potential memory leak',
        confidence: memoryTrend.correlation,
        evidence: [{
          type: EvidenceType.TIMING_ANALYSIS,
          description: `Memory usage increasing at ${(memoryTrend.slope * 100).toFixed(2)}% per sample`,
          data: memoryTrend,
          strength: memoryTrend.correlation,
          timestamp: new Date()
        }],
        fix_suggestions: [],
        impact_assessment: {
          performance_impact: 85,
          user_experience_impact: 70,
          resource_cost_impact: 95,
          business_impact: 60,
          affected_operations: ['memory_allocation'],
          affected_users: 0
        }
      });
    }

    return rootCauses;
  }

  private async analyzeIoRootCauses(ioMetrics: PerformanceMetric[], profile: PerformanceProfile): Promise<RootCause[]> {
    const rootCauses: RootCause[] = [];

    const avgIoLatency = ioMetrics.reduce((sum, m) => sum + m.value, 0) / ioMetrics.length;

    if (avgIoLatency > 100) { // High I/O latency
      rootCauses.push({
        id: this.generateRootCauseId(),
        category: RootCauseCategory.INFRASTRUCTURE_LIMIT,
        description: 'High I/O latency detected, may indicate disk performance issues',
        confidence: 0.75,
        evidence: [{
          type: EvidenceType.RESOURCE_UTILIZATION,
          description: `Average I/O latency: ${avgIoLatency.toFixed(2)}ms`,
          data: { avgIoLatency },
          strength: 0.8,
          timestamp: new Date()
        }],
        fix_suggestions: [],
        impact_assessment: {
          performance_impact: 80,
          user_experience_impact: 75,
          resource_cost_impact: 60,
          business_impact: 50,
          affected_operations: ['disk_operations'],
          affected_users: 0
        }
      });
    }

    return rootCauses;
  }

  private async analyzeNetworkRootCauses(networkMetrics: PerformanceMetric[], profile: PerformanceProfile): Promise<RootCause[]> {
    const rootCauses: RootCause[] = [];

    const avgNetworkLatency = networkMetrics.reduce((sum, m) => sum + m.value, 0) / networkMetrics.length;

    if (avgNetworkLatency > 200) { // High network latency
      rootCauses.push({
        id: this.generateRootCauseId(),
        category: RootCauseCategory.EXTERNAL_DEPENDENCY,
        description: 'High network latency detected, may indicate network congestion or distant endpoints',
        confidence: 0.7,
        evidence: [{
          type: EvidenceType.RESOURCE_UTILIZATION,
          description: `Average network latency: ${avgNetworkLatency.toFixed(2)}ms`,
          data: { avgNetworkLatency },
          strength: 0.75,
          timestamp: new Date()
        }],
        fix_suggestions: [],
        impact_assessment: {
          performance_impact: 70,
          user_experience_impact: 80,
          resource_cost_impact: 40,
          business_impact: 60,
          affected_operations: ['network_operations'],
          affected_users: 0
        }
      });
    }

    return rootCauses;
  }

  // Context creation methods
  private createCpuContext(cpuMetrics: PerformanceMetric[]): BottleneckContext {
    const avgUsage = cpuMetrics.reduce((sum, m) => sum + m.value, 0) / cpuMetrics.length;
    
    return {
      cpu_profile: {
        user_time_ms: avgUsage * 0.7, // Estimated user time
        system_time_ms: avgUsage * 0.3, // Estimated system time
        idle_time_ms: 100 - avgUsage,
        cpu_usage_percentage: avgUsage,
        context_switches: 0 // Would need actual data
      }
    };
  }

  private createMemoryContext(memoryMetrics: PerformanceMetric[]): BottleneckContext {
    const avgUsage = memoryMetrics.reduce((sum, m) => sum + m.value, 0) / memoryMetrics.length;
    
    return {
      memory_allocation: {
        heap_size_mb: avgUsage * 1.2, // Estimated heap size
        used_heap_mb: avgUsage,
        external_memory_mb: avgUsage * 0.1,
        gc_duration_ms: 0, // Would need actual GC data
        gc_frequency: 0
      }
    };
  }

  private createIoContext(ioMetrics: PerformanceMetric[]): BottleneckContext {
    return {
      io_profile: {
        read_operations: ioMetrics.length / 2,
        write_operations: ioMetrics.length / 2,
        read_bytes: 0, // Would need actual data
        write_bytes: 0,
        read_time_ms: ioMetrics.reduce((sum, m) => sum + m.value, 0) / 2,
        write_time_ms: ioMetrics.reduce((sum, m) => sum + m.value, 0) / 2
      }
    };
  }

  private createNetworkContext(networkMetrics: PerformanceMetric[]): BottleneckContext {
    const avgLatency = networkMetrics.reduce((sum, m) => sum + m.value, 0) / networkMetrics.length;
    
    return {
      network_timing: {
        dns_lookup_ms: avgLatency * 0.1,
        tcp_connection_ms: avgLatency * 0.15,
        ssl_handshake_ms: avgLatency * 0.2,
        request_sent_ms: avgLatency * 0.05,
        waiting_ms: avgLatency * 0.4,
        content_download_ms: avgLatency * 0.1
      }
    };
  }

  // Utility methods
  private mergeBottlenecks(bottlenecks: PerformanceBottleneck[]): PerformanceBottleneck[] {
    // Simple deduplication based on type and component
    const merged: PerformanceBottleneck[] = [];
    const seen = new Set<string>();

    for (const bottleneck of bottlenecks) {
      const key = `${bottleneck.type}_${bottleneck.component}`;
      if (!seen.has(key)) {
        seen.add(key);
        merged.push(bottleneck);
      }
    }

    return merged;
  }

  private calculateSeverity(value: number, threshold: number): BottleneckSeverity {
    const ratio = value / threshold;
    
    if (ratio > 3) return BottleneckSeverity.CRITICAL;
    if (ratio > 2) return BottleneckSeverity.HIGH;
    if (ratio > 1.5) return BottleneckSeverity.MEDIUM;
    return BottleneckSeverity.LOW;
  }

  private calculateImpactScore(current: number, baseline: number): number {
    return Math.min((current / baseline) * 50, 100);
  }

  private calculateStatistics(values: number[]): { mean: number; stdDev: number } {
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    const stdDev = Math.sqrt(variance);
    
    return { mean, stdDev };
  }

  private calculateTrend(values: number[]): { slope: number; correlation: number } {
    const n = values.length;
    const xSum = (n * (n - 1)) / 2; // Sum of indices 0,1,2,...,n-1
    const ySum = values.reduce((sum, val) => sum + val, 0);
    const xySum = values.reduce((sum, val, idx) => sum + val * idx, 0);
    const xxSum = (n * (n - 1) * (2 * n - 1)) / 6; // Sum of squares of indices
    
    const slope = (n * xySum - xSum * ySum) / (n * xxSum - xSum * xSum);
    
    // Calculate correlation coefficient
    const yMean = ySum / n;
    const xMean = xSum / n;
    
    let numerator = 0;
    let denomX = 0;
    let denomY = 0;
    
    for (let i = 0; i < n; i++) {
      const xDiff = i - xMean;
      const yDiff = values[i] - yMean;
      numerator += xDiff * yDiff;
      denomX += xDiff * xDiff;
      denomY += yDiff * yDiff;
    }
    
    const correlation = numerator / Math.sqrt(denomX * denomY);
    
    return { slope: slope || 0, correlation: correlation || 0 };
  }

  private calculateVariability(values: number[]): number {
    if (values.length === 0) return 0;
    
    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    
    return Math.sqrt(variance) / mean; // Coefficient of variation
  }

  private calculateCorrelation(x: number[], y: number[]): number {
    const n = Math.min(x.length, y.length);
    if (n === 0) return 0;
    
    const xMean = x.slice(0, n).reduce((sum, val) => sum + val, 0) / n;
    const yMean = y.slice(0, n).reduce((sum, val) => sum + val, 0) / n;
    
    let numerator = 0;
    let denomX = 0;
    let denomY = 0;
    
    for (let i = 0; i < n; i++) {
      const xDiff = x[i] - xMean;
      const yDiff = y[i] - yMean;
      numerator += xDiff * yDiff;
      denomX += xDiff * xDiff;
      denomY += yDiff * yDiff;
    }
    
    return denomX === 0 || denomY === 0 ? 0 : numerator / Math.sqrt(denomX * denomY);
  }

  private calculateProfileSignature(profile: PerformanceProfile): number {
    // Simple signature based on key metrics
    const responseTime = this.getAverageMetricValue(profile, PerformanceMetricType.RESPONSE_TIME);
    const cpuUsage = this.getAverageMetricValue(profile, PerformanceMetricType.CPU_USAGE);
    const memoryUsage = this.getAverageMetricValue(profile, PerformanceMetricType.MEMORY_USAGE);
    
    return responseTime * 0.5 + cpuUsage * 0.3 + memoryUsage * 0.2;
  }

  private calculateAnomalyScore(current: number, baseline: AnomalyBaseline): number {
    if (baseline.variance === 0) return 0;
    return Math.abs(current - baseline.mean) / Math.sqrt(baseline.variance);
  }

  private updateAnomalyBaseline(key: string, newValue: number): void {
    const baseline = this.anomalyBaselines.get(key);
    if (!baseline) return;
    
    baseline.samples.push(newValue);
    if (baseline.samples.length > 100) {
      baseline.samples.shift(); // Keep only recent samples
    }
    
    // Recalculate mean and variance
    const mean = baseline.samples.reduce((sum, val) => sum + val, 0) / baseline.samples.length;
    const variance = baseline.samples.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / baseline.samples.length;
    
    baseline.mean = mean;
    baseline.variance = variance;
    baseline.lastUpdated = new Date();
  }

  private getAverageMetricValue(profile: PerformanceProfile, metricType: PerformanceMetricType): number {
    const metrics = profile.metrics.filter(m => m.metric_type === metricType);
    return metrics.length > 0 ? metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length : 0;
  }

  private mapMetricTypeToBottleneckType(metricType: PerformanceMetricType): BottleneckType {
    switch (metricType) {
      case PerformanceMetricType.CPU_USAGE:
        return BottleneckType.CPU_BOUND;
      case PerformanceMetricType.MEMORY_USAGE:
        return BottleneckType.MEMORY_BOUND;
      case PerformanceMetricType.DISK_IO:
        return BottleneckType.IO_BOUND;
      case PerformanceMetricType.NETWORK_IO:
        return BottleneckType.NETWORK_BOUND;
      default:
        return BottleneckType.ALGORITHM_INEFFICIENCY;
    }
  }

  private mapMetricTypeToComponent(metricType: PerformanceMetricType): string {
    switch (metricType) {
      case PerformanceMetricType.CPU_USAGE:
        return 'cpu';
      case PerformanceMetricType.MEMORY_USAGE:
        return 'memory';
      case PerformanceMetricType.DISK_IO:
        return 'io_subsystem';
      case PerformanceMetricType.NETWORK_IO:
        return 'network';
      default:
        return 'application';
    }
  }

  private startBackgroundTasks(): void {
    // Cleanup old data periodically
    setInterval(() => {
      this.cleanupHistoricalData();
    }, 3600000); // Every hour
  }

  private cleanupHistoricalData(): void {
    // Keep only recent historical profiles
    if (this.historicalProfiles.length > 1000) {
      this.historicalProfiles = this.historicalProfiles.slice(-500);
    }
    
    // Clean up old baselines
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 7); // 7 days old
    
    for (const [key, baseline] of this.anomalyBaselines) {
      if (baseline.lastUpdated < cutoffDate) {
        this.anomalyBaselines.delete(key);
      }
    }
  }

  // Public API methods
  public getDetectedBottlenecks(profileId: string): PerformanceBottleneck[] {
    return this.detectedBottlenecks.get(profileId) || [];
  }

  public getDetectionAlgorithms(): BottleneckDetectionAlgorithm[] {
    return Array.from(this.detectionAlgorithms.values());
  }

  public enableAlgorithm(algorithmId: string): void {
    const algorithm = this.detectionAlgorithms.get(algorithmId);
    if (algorithm) {
      algorithm.enabled = true;
    }
  }

  public disableAlgorithm(algorithmId: string): void {
    const algorithm = this.detectionAlgorithms.get(algorithmId);
    if (algorithm) {
      algorithm.enabled = false;
    }
  }

  public getDetectionStatistics(): any {
    return {
      total_algorithms: this.detectionAlgorithms.size,
      enabled_algorithms: Array.from(this.detectionAlgorithms.values()).filter(a => a.enabled).length,
      historical_profiles: this.historicalProfiles.length,
      anomaly_baselines: this.anomalyBaselines.size,
      total_bottlenecks_detected: Array.from(this.detectedBottlenecks.values()).reduce((sum, bottlenecks) => sum + bottlenecks.length, 0)
    };
  }

  private generateBottleneckId(): string {
    return `bottleneck_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private generateRootCauseId(): string {
    return `rootcause_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  public async shutdown(): Promise<any> {
    // Cleanup resources
    this.historicalProfiles.length = 0;
    this.detectedBottlenecks.clear();
    this.anomalyBaselines.clear();
    
    console.log('Bottleneck Detection Service shutdown complete');
  }
  public getBottlenecks(): any[] {
    return Array.from(this.activeBottlenecks.values());
  }
}

interface AnomalyBaseline {
  samples: number[];
  mean: number;
  variance: number;
  lastUpdated: Date;
}

