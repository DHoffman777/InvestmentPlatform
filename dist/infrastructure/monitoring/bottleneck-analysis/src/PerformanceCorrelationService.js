"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceCorrelationService = exports.ComparisonOperator = exports.TrendDirection = exports.AnomalyType = exports.CausalityDirection = exports.CorrelationType = exports.CorrelationStrength = void 0;
const events_1 = require("events");
const PerformanceDataModel_1 = require("./PerformanceDataModel");
var CorrelationStrength;
(function (CorrelationStrength) {
    CorrelationStrength["VERY_WEAK"] = "very_weak";
    CorrelationStrength["WEAK"] = "weak";
    CorrelationStrength["MODERATE"] = "moderate";
    CorrelationStrength["STRONG"] = "strong";
    CorrelationStrength["VERY_STRONG"] = "very_strong"; // 0.8 - 1.0
})(CorrelationStrength || (exports.CorrelationStrength = CorrelationStrength = {}));
var CorrelationType;
(function (CorrelationType) {
    CorrelationType["POSITIVE"] = "positive";
    CorrelationType["NEGATIVE"] = "negative";
    CorrelationType["NON_LINEAR"] = "non_linear";
    CorrelationType["CYCLICAL"] = "cyclical";
    CorrelationType["LAGGED"] = "lagged";
})(CorrelationType || (exports.CorrelationType = CorrelationType = {}));
var CausalityDirection;
(function (CausalityDirection) {
    CausalityDirection["METRIC1_TO_METRIC2"] = "metric1_to_metric2";
    CausalityDirection["METRIC2_TO_METRIC1"] = "metric2_to_metric1";
    CausalityDirection["BIDIRECTIONAL"] = "bidirectional";
    CausalityDirection["NO_CAUSALITY"] = "no_causality";
    CausalityDirection["COMMON_CAUSE"] = "common_cause";
})(CausalityDirection || (exports.CausalityDirection = CausalityDirection = {}));
var AnomalyType;
(function (AnomalyType) {
    AnomalyType["CORRELATION_BREAK"] = "correlation_break";
    AnomalyType["CORRELATION_REVERSAL"] = "correlation_reversal";
    AnomalyType["UNEXPECTED_CORRELATION"] = "unexpected_correlation";
    AnomalyType["MISSING_CORRELATION"] = "missing_correlation";
})(AnomalyType || (exports.AnomalyType = AnomalyType = {}));
var TrendDirection;
(function (TrendDirection) {
    TrendDirection["STRENGTHENING"] = "strengthening";
    TrendDirection["WEAKENING"] = "weakening";
    TrendDirection["STABLE"] = "stable";
    TrendDirection["OSCILLATING"] = "oscillating";
})(TrendDirection || (exports.TrendDirection = TrendDirection = {}));
var ComparisonOperator;
(function (ComparisonOperator) {
    ComparisonOperator["GREATER_THAN"] = "gt";
    ComparisonOperator["LESS_THAN"] = "lt";
    ComparisonOperator["EQUALS"] = "eq";
    ComparisonOperator["GREATER_THAN_OR_EQUAL"] = "gte";
    ComparisonOperator["LESS_THAN_OR_EQUAL"] = "lte";
    ComparisonOperator["BETWEEN"] = "between";
})(ComparisonOperator || (exports.ComparisonOperator = ComparisonOperator = {}));
class PerformanceCorrelationService extends events_1.EventEmitter {
    config;
    correlationCache = new Map();
    historicalCorrelations = new Map();
    correlationPatterns = new Map();
    anomalyBaselines = new Map();
    activeAnalyses = new Map();
    constructor(config) {
        super();
        this.config = config;
        this.initializeCorrelationPatterns();
        this.startBackgroundTasks();
    }
    initializeCorrelationPatterns() {
        // CPU-Memory correlation pattern
        this.correlationPatterns.set('cpu_memory_correlation', {
            id: 'cpu_memory_correlation',
            name: 'CPU-Memory Usage Correlation',
            description: 'Strong correlation between CPU usage and memory allocation',
            metrics_involved: [
                { service_id: '*', metric_type: PerformanceDataModel_1.PerformanceMetricType.CPU_USAGE, category: PerformanceDataModel_1.PerformanceCategory.CPU },
                { service_id: '*', metric_type: PerformanceDataModel_1.PerformanceMetricType.MEMORY_USAGE, category: PerformanceDataModel_1.PerformanceCategory.MEMORY }
            ],
            typical_correlation_range: [0.6, 0.9],
            expected_causality: CausalityDirection.BIDIRECTIONAL,
            business_significance: 8,
            detection_rules: [{
                    condition: 'correlation_coefficient',
                    threshold: 0.6,
                    operator: ComparisonOperator.GREATER_THAN,
                    confidence: 0.8
                }]
        });
        // Response Time-Throughput correlation pattern
        this.correlationPatterns.set('response_time_throughput', {
            id: 'response_time_throughput',
            name: 'Response Time-Throughput Inverse Correlation',
            description: 'Inverse correlation between response time and throughput',
            metrics_involved: [
                { service_id: '*', metric_type: PerformanceDataModel_1.PerformanceMetricType.RESPONSE_TIME, category: PerformanceDataModel_1.PerformanceCategory.APPLICATION },
                { service_id: '*', metric_type: PerformanceDataModel_1.PerformanceMetricType.THROUGHPUT, category: PerformanceDataModel_1.PerformanceCategory.APPLICATION }
            ],
            typical_correlation_range: [-0.8, -0.4],
            expected_causality: CausalityDirection.BIDIRECTIONAL,
            business_significance: 9,
            detection_rules: [{
                    condition: 'correlation_coefficient',
                    threshold: -0.4,
                    operator: ComparisonOperator.LESS_THAN,
                    confidence: 0.85
                }]
        });
        // Database Query Time-CPU correlation pattern
        this.correlationPatterns.set('db_query_cpu_correlation', {
            id: 'db_query_cpu_correlation',
            name: 'Database Query Time-CPU Correlation',
            description: 'Correlation between database query time and CPU usage',
            metrics_involved: [
                { service_id: '*', metric_type: PerformanceDataModel_1.PerformanceMetricType.DATABASE_QUERY_TIME, category: PerformanceDataModel_1.PerformanceCategory.DATABASE },
                { service_id: '*', metric_type: PerformanceDataModel_1.PerformanceMetricType.CPU_USAGE, category: PerformanceDataModel_1.PerformanceCategory.CPU }
            ],
            typical_correlation_range: [0.3, 0.7],
            expected_causality: CausalityDirection.METRIC1_TO_METRIC2,
            business_significance: 7,
            detection_rules: [{
                    condition: 'correlation_coefficient',
                    threshold: 0.3,
                    operator: ComparisonOperator.GREATER_THAN,
                    confidence: 0.7
                }]
        });
        // Error Rate-Response Time correlation pattern
        this.correlationPatterns.set('error_rate_response_time', {
            id: 'error_rate_response_time',
            name: 'Error Rate-Response Time Correlation',
            description: 'Correlation between error rate and response time degradation',
            metrics_involved: [
                { service_id: '*', metric_type: PerformanceDataModel_1.PerformanceMetricType.ERROR_RATE, category: PerformanceDataModel_1.PerformanceCategory.APPLICATION },
                { service_id: '*', metric_type: PerformanceDataModel_1.PerformanceMetricType.RESPONSE_TIME, category: PerformanceDataModel_1.PerformanceCategory.APPLICATION }
            ],
            typical_correlation_range: [0.4, 0.8],
            expected_causality: CausalityDirection.COMMON_CAUSE,
            business_significance: 9,
            detection_rules: [{
                    condition: 'correlation_coefficient',
                    threshold: 0.4,
                    operator: ComparisonOperator.GREATER_THAN,
                    confidence: 0.8
                }]
        });
        // Network IO-Response Time correlation pattern
        this.correlationPatterns.set('network_io_response_time', {
            id: 'network_io_response_time',
            name: 'Network I/O-Response Time Correlation',
            description: 'Correlation between network I/O latency and overall response time',
            metrics_involved: [
                { service_id: '*', metric_type: PerformanceDataModel_1.PerformanceMetricType.NETWORK_IO, category: PerformanceDataModel_1.PerformanceCategory.NETWORK },
                { service_id: '*', metric_type: PerformanceDataModel_1.PerformanceMetricType.RESPONSE_TIME, category: PerformanceDataModel_1.PerformanceCategory.APPLICATION }
            ],
            typical_correlation_range: [0.5, 0.9],
            expected_causality: CausalityDirection.METRIC1_TO_METRIC2,
            business_significance: 8,
            detection_rules: [{
                    condition: 'correlation_coefficient',
                    threshold: 0.5,
                    operator: ComparisonOperator.GREATER_THAN,
                    confidence: 0.75
                }]
        });
    }
    async analyzeProfile(profile) {
        const analysisId = this.generateAnalysisId();
        try {
            // Start correlation analysis job
            const job = {
                id: analysisId,
                profile_id: profile.id,
                start_time: new Date(),
                status: 'running',
                progress: 0
            };
            this.activeAnalyses.set(analysisId, job);
            const correlations = [];
            // Analyze pairwise correlations
            const pairwiseCorrelations = await this.analyzePairwiseCorrelations(profile);
            correlations.push(...pairwiseCorrelations);
            job.progress = 30;
            // Analyze pattern-based correlations
            const patternCorrelations = await this.analyzePatternCorrelations(profile);
            correlations.push(...patternCorrelations);
            job.progress = 60;
            // Analyze time-lagged correlations
            if (this.config.enableTimeSeriesAnalysis) {
                const laggedCorrelations = await this.analyzeLaggedCorrelations(profile);
                correlations.push(...laggedCorrelations);
                job.progress = 80;
            }
            // Detect correlation anomalies
            const anomalies = await this.detectCorrelationAnomalies(profile, correlations);
            job.progress = 90;
            // Analyze causality if enabled
            if (this.config.enableCausalityAnalysis) {
                await this.analyzeCausality(correlations, profile);
            }
            // Store results
            this.correlationCache.set(profile.id, correlations);
            this.storeTimeSeriesCorrelation(profile, correlations, anomalies);
            job.status = 'completed';
            job.progress = 100;
            job.end_time = new Date();
            this.emit('correlationAnalysisCompleted', {
                analysisId,
                profileId: profile.id,
                correlationsFound: correlations.length,
                anomaliesDetected: anomalies.length,
                duration: job.end_time.getTime() - job.start_time.getTime(),
                timestamp: new Date()
            });
            return correlations;
        }
        catch (error) {
            const job = this.activeAnalyses.get(analysisId);
            if (job) {
                job.status = 'failed';
                job.error = error.message;
                job.end_time = new Date();
            }
            this.emit('correlationAnalysisError', {
                analysisId,
                profileId: profile.id,
                error: error.message,
                timestamp: new Date()
            });
            throw error;
        }
        finally {
            // Cleanup active analysis
            setTimeout(() => {
                this.activeAnalyses.delete(analysisId);
            }, 300000); // Keep for 5 minutes for status queries
        }
    }
    async analyzePairwiseCorrelations(profile) {
        const correlations = [];
        const metrics = profile.metrics;
        if (metrics.length < this.config.minimumSampleSize) {
            return correlations;
        }
        // Group metrics by type for correlation analysis
        const metricGroups = this.groupMetricsByType(metrics);
        const metricTypes = Array.from(metricGroups.keys());
        // Analyze all pairs of metric types
        for (let i = 0; i < metricTypes.length; i++) {
            for (let j = i + 1; j < metricTypes.length; j++) {
                const type1 = metricTypes[i];
                const type2 = metricTypes[j];
                const metrics1 = metricGroups.get(type1) || [];
                const metrics2 = metricGroups.get(type2) || [];
                if (metrics1.length >= this.config.minimumSampleSize &&
                    metrics2.length >= this.config.minimumSampleSize) {
                    const correlation = await this.calculateCorrelation(metrics1, metrics2, profile);
                    if (Math.abs(correlation.correlation_coefficient) >= this.config.correlationThreshold) {
                        correlations.push(correlation);
                    }
                }
            }
        }
        return correlations;
    }
    async analyzePatternCorrelations(profile) {
        const correlations = [];
        for (const [patternId, pattern] of this.correlationPatterns) {
            try {
                const patternCorrelation = await this.analyzePattern(pattern, profile);
                if (patternCorrelation) {
                    correlations.push(patternCorrelation);
                }
            }
            catch (error) {
                console.warn(`Failed to analyze correlation pattern ${patternId}:`, error.message);
            }
        }
        return correlations;
    }
    async analyzePattern(pattern, profile) {
        if (pattern.metrics_involved.length < 2)
            return null;
        const [metric1Id, metric2Id] = pattern.metrics_involved;
        // Find metrics matching the pattern
        const metrics1 = profile.metrics.filter(m => this.matchesMetricIdentifier(m, metric1Id));
        const metrics2 = profile.metrics.filter(m => this.matchesMetricIdentifier(m, metric2Id));
        if (metrics1.length < this.config.minimumSampleSize ||
            metrics2.length < this.config.minimumSampleSize) {
            return null;
        }
        const correlation = await this.calculateCorrelation(metrics1, metrics2, profile);
        // Check if correlation matches expected pattern
        const [minExpected, maxExpected] = pattern.typical_correlation_range;
        const actualCorrelation = correlation.correlation_coefficient;
        if (actualCorrelation >= minExpected && actualCorrelation <= maxExpected) {
            // Enhance correlation with pattern information
            correlation.business_impact = this.calculateBusinessImpact(pattern, correlation);
            correlation.causality_direction = pattern.expected_causality;
            return correlation;
        }
        return null;
    }
    async analyzeLaggedCorrelations(profile) {
        const correlations = [];
        const metrics = profile.metrics;
        // Sort metrics by timestamp for lag analysis
        const sortedMetrics = metrics.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        // Group by metric type
        const metricGroups = this.groupMetricsByType(sortedMetrics);
        const metricTypes = Array.from(metricGroups.keys());
        // Analyze lagged correlations
        for (let i = 0; i < metricTypes.length; i++) {
            for (let j = i + 1; j < metricTypes.length; j++) {
                const type1 = metricTypes[i];
                const type2 = metricTypes[j];
                const metrics1 = metricGroups.get(type1) || [];
                const metrics2 = metricGroups.get(type2) || [];
                if (metrics1.length >= this.config.minimumSampleSize &&
                    metrics2.length >= this.config.minimumSampleSize) {
                    // Try different lag values
                    const maxLag = Math.min(10, Math.floor(metrics1.length / 3));
                    for (let lag = 1; lag <= maxLag; lag++) {
                        const laggedCorrelation = await this.calculateLaggedCorrelation(metrics1, metrics2, lag, profile);
                        if (Math.abs(laggedCorrelation.correlation_coefficient) >= this.config.correlationThreshold) {
                            laggedCorrelation.correlation_type = CorrelationType.LAGGED;
                            correlations.push(laggedCorrelation);
                        }
                    }
                }
            }
        }
        return correlations;
    }
    async calculateCorrelation(metrics1, metrics2, profile, lag = 0) {
        const values1 = metrics1.map(m => m.value);
        const values2 = lag > 0 ? metrics2.slice(lag).map(m => m.value) : metrics2.map(m => m.value);
        // Ensure equal length for correlation calculation
        const minLength = Math.min(values1.length, values2.length);
        const x = values1.slice(0, minLength);
        const y = values2.slice(0, minLength);
        const correlation = this.pearsonCorrelation(x, y);
        const pValue = this.calculatePValue(correlation, minLength);
        const confidenceInterval = this.calculateConfidenceInterval(correlation, minLength);
        const analysis = {
            id: this.generateCorrelationId(),
            metric1: this.createMetricIdentifier(metrics1[0]),
            metric2: this.createMetricIdentifier(metrics2[0]),
            correlation_coefficient: correlation,
            correlation_strength: this.determineCorrelationStrength(correlation),
            correlation_type: this.determineCorrelationType(x, y, correlation),
            p_value: pValue,
            sample_size: minLength,
            time_lag: lag,
            confidence_interval: confidenceInterval,
            analysis_timestamp: new Date(),
            business_impact: this.calculateDefaultBusinessImpact(correlation, metrics1[0], metrics2[0])
        };
        return analysis;
    }
    async calculateLaggedCorrelation(metrics1, metrics2, lag, profile) {
        return await this.calculateCorrelation(metrics1, metrics2, profile, lag);
    }
    async detectCorrelationAnomalies(profile, correlations) {
        const anomalies = [];
        for (const correlation of correlations) {
            const baselineKey = this.getCorrelationBaselineKey(correlation);
            const baseline = this.anomalyBaselines.get(baselineKey);
            if (baseline) {
                const expectedCorrelation = baseline.mean;
                const deviation = Math.abs(correlation.correlation_coefficient - expectedCorrelation);
                const threshold = baseline.stdDev * 2; // 2 standard deviations
                if (deviation > threshold) {
                    const anomaly = {
                        id: this.generateAnomalyId(),
                        correlation_id: correlation.id,
                        expected_correlation: expectedCorrelation,
                        actual_correlation: correlation.correlation_coefficient,
                        deviation_score: deviation / baseline.stdDev,
                        anomaly_type: this.determineAnomalyType(expectedCorrelation, correlation.correlation_coefficient),
                        potential_causes: this.identifyAnomalyCauses(correlation, baseline),
                        detected_at: new Date()
                    };
                    anomalies.push(anomaly);
                }
            }
            // Update baseline
            this.updateCorrelationBaseline(baselineKey, correlation);
        }
        return anomalies;
    }
    async analyzeCausality(correlations, profile) {
        for (const correlation of correlations) {
            // Simplified causality analysis using Granger causality concept
            // In a real implementation, this would use more sophisticated methods
            if (Math.abs(correlation.correlation_coefficient) > 0.6) {
                const metrics1 = profile.metrics.filter(m => m.metric_type === correlation.metric1.metric_type);
                const metrics2 = profile.metrics.filter(m => m.metric_type === correlation.metric2.metric_type);
                const causality = await this.grangerCausalityTest(metrics1, metrics2);
                correlation.causality_direction = causality;
            }
        }
    }
    async grangerCausalityTest(metrics1, metrics2) {
        // Simplified Granger causality test
        // In a real implementation, this would use proper statistical methods
        const values1 = metrics1.map(m => m.value);
        const values2 = metrics2.map(m => m.value);
        // Calculate lagged correlations to determine direction
        const lag1Correlation = this.pearsonCorrelation(values1.slice(0, -1), values2.slice(1));
        const lag2Correlation = this.pearsonCorrelation(values2.slice(0, -1), values1.slice(1));
        if (Math.abs(lag1Correlation) > Math.abs(lag2Correlation) + 0.1) {
            return CausalityDirection.METRIC1_TO_METRIC2;
        }
        else if (Math.abs(lag2Correlation) > Math.abs(lag1Correlation) + 0.1) {
            return CausalityDirection.METRIC2_TO_METRIC1;
        }
        else if (Math.abs(lag1Correlation) > 0.3 && Math.abs(lag2Correlation) > 0.3) {
            return CausalityDirection.BIDIRECTIONAL;
        }
        else {
            return CausalityDirection.NO_CAUSALITY;
        }
    }
    // Utility methods
    groupMetricsByType(metrics) {
        const groups = new Map();
        for (const metric of metrics) {
            if (!groups.has(metric.metric_type)) {
                groups.set(metric.metric_type, []);
            }
            groups.get(metric.metric_type).push(metric);
        }
        return groups;
    }
    matchesMetricIdentifier(metric, identifier) {
        return (identifier.service_id === '*' || metric.context.service_name === identifier.service_id) &&
            metric.metric_type === identifier.metric_type &&
            metric.category === identifier.category;
    }
    createMetricIdentifier(metric) {
        return {
            service_id: metric.context.service_name,
            metric_type: metric.metric_type,
            category: metric.category,
            component: metric.tags.component,
            tags: metric.tags
        };
    }
    pearsonCorrelation(x, y) {
        const n = x.length;
        if (n === 0)
            return 0;
        const sumX = x.reduce((sum, val) => sum + val, 0);
        const sumY = y.reduce((sum, val) => sum + val, 0);
        const sumXY = x.reduce((sum, val, i) => sum + val * y[i], 0);
        const sumXX = x.reduce((sum, val) => sum + val * val, 0);
        const sumYY = y.reduce((sum, val) => sum + val * val, 0);
        const numerator = n * sumXY - sumX * sumY;
        const denominator = Math.sqrt((n * sumXX - sumX * sumX) * (n * sumYY - sumY * sumY));
        return denominator === 0 ? 0 : numerator / denominator;
    }
    calculatePValue(correlation, sampleSize) {
        // Simplified p-value calculation
        const t = correlation * Math.sqrt((sampleSize - 2) / (1 - correlation * correlation));
        const df = sampleSize - 2;
        // Approximate p-value using t-distribution
        return 2 * (1 - this.tCdf(Math.abs(t), df));
    }
    tCdf(t, df) {
        // Simplified t-distribution CDF approximation
        return 0.5 + 0.5 * Math.sign(t) * Math.sqrt(1 - Math.exp(-2 * t * t / Math.PI));
    }
    calculateConfidenceInterval(correlation, sampleSize) {
        const z = 0.5 * Math.log((1 + correlation) / (1 - correlation)); // Fisher z-transformation
        const se = 1 / Math.sqrt(sampleSize - 3);
        const zCritical = 1.96; // 95% confidence interval
        const lowerZ = z - zCritical * se;
        const upperZ = z + zCritical * se;
        const lower = (Math.exp(2 * lowerZ) - 1) / (Math.exp(2 * lowerZ) + 1);
        const upper = (Math.exp(2 * upperZ) - 1) / (Math.exp(2 * upperZ) + 1);
        return [lower, upper];
    }
    determineCorrelationStrength(correlation) {
        const abs = Math.abs(correlation);
        if (abs >= 0.8)
            return CorrelationStrength.VERY_STRONG;
        if (abs >= 0.6)
            return CorrelationStrength.STRONG;
        if (abs >= 0.4)
            return CorrelationStrength.MODERATE;
        if (abs >= 0.2)
            return CorrelationStrength.WEAK;
        return CorrelationStrength.VERY_WEAK;
    }
    determineCorrelationType(x, y, correlation) {
        if (correlation > 0)
            return CorrelationType.POSITIVE;
        if (correlation < 0)
            return CorrelationType.NEGATIVE;
        // Check for non-linear patterns
        const spearmanCorrelation = this.spearmanCorrelation(x, y);
        if (Math.abs(spearmanCorrelation) > Math.abs(correlation) + 0.2) {
            return CorrelationType.NON_LINEAR;
        }
        return CorrelationType.POSITIVE;
    }
    spearmanCorrelation(x, y) {
        // Convert to ranks
        const xRanks = this.convertToRanks(x);
        const yRanks = this.convertToRanks(y);
        return this.pearsonCorrelation(xRanks, yRanks);
    }
    convertToRanks(values) {
        const sorted = values.map((val, idx) => ({ val, idx }))
            .sort((a, b) => a.val - b.val);
        const ranks = new Array(values.length);
        for (let i = 0; i < sorted.length; i++) {
            ranks[sorted[i].idx] = i + 1;
        }
        return ranks;
    }
    calculateBusinessImpact(pattern, correlation) {
        const baseImpact = pattern.business_significance * 10;
        const correlationMultiplier = Math.abs(correlation.correlation_coefficient);
        return {
            impact_score: baseImpact * correlationMultiplier,
            affected_kpis: this.identifyAffectedKPIs(pattern),
            cost_implications: baseImpact * correlationMultiplier * 1000, // Estimated cost in dollars
            user_experience_impact: this.calculateUserExperienceImpact(pattern, correlation),
            operational_impact: this.calculateOperationalImpact(pattern, correlation)
        };
    }
    calculateDefaultBusinessImpact(correlation, metric1, metric2) {
        const baseScore = Math.abs(correlation) * 50;
        return {
            impact_score: baseScore,
            affected_kpis: [metric1.metric_type, metric2.metric_type],
            cost_implications: baseScore * 100,
            user_experience_impact: this.calculateMetricUXImpact(metric1, metric2, correlation),
            operational_impact: this.calculateMetricOperationalImpact(metric1, metric2, correlation)
        };
    }
    identifyAffectedKPIs(pattern) {
        const kpis = [];
        for (const metric of pattern.metrics_involved) {
            switch (metric.metric_type) {
                case PerformanceDataModel_1.PerformanceMetricType.RESPONSE_TIME:
                    kpis.push('Average Response Time', 'User Satisfaction');
                    break;
                case PerformanceDataModel_1.PerformanceMetricType.THROUGHPUT:
                    kpis.push('Requests Per Second', 'System Capacity');
                    break;
                case PerformanceDataModel_1.PerformanceMetricType.ERROR_RATE:
                    kpis.push('Error Rate', 'System Reliability');
                    break;
                case PerformanceDataModel_1.PerformanceMetricType.CPU_USAGE:
                    kpis.push('Resource Utilization', 'Infrastructure Cost');
                    break;
                case PerformanceDataModel_1.PerformanceMetricType.MEMORY_USAGE:
                    kpis.push('Memory Efficiency', 'Resource Cost');
                    break;
            }
        }
        return [...new Set(kpis)]; // Remove duplicates
    }
    calculateUserExperienceImpact(pattern, correlation) {
        let impact = 0;
        for (const metric of pattern.metrics_involved) {
            switch (metric.metric_type) {
                case PerformanceDataModel_1.PerformanceMetricType.RESPONSE_TIME:
                    impact += 30;
                    break;
                case PerformanceDataModel_1.PerformanceMetricType.ERROR_RATE:
                    impact += 40;
                    break;
                case PerformanceDataModel_1.PerformanceMetricType.THROUGHPUT:
                    impact += 20;
                    break;
                default:
                    impact += 10;
            }
        }
        return Math.min(impact * Math.abs(correlation.correlation_coefficient), 100);
    }
    calculateOperationalImpact(pattern, correlation) {
        let impact = 0;
        for (const metric of pattern.metrics_involved) {
            switch (metric.category) {
                case PerformanceDataModel_1.PerformanceCategory.CPU:
                case PerformanceDataModel_1.PerformanceCategory.MEMORY:
                    impact += 25;
                    break;
                case PerformanceDataModel_1.PerformanceCategory.DATABASE:
                    impact += 30;
                    break;
                case PerformanceDataModel_1.PerformanceCategory.NETWORK:
                    impact += 20;
                    break;
                default:
                    impact += 15;
            }
        }
        return Math.min(impact * Math.abs(correlation.correlation_coefficient), 100);
    }
    calculateMetricUXImpact(metric1, metric2, correlation) {
        const impactFactors = {
            [PerformanceDataModel_1.PerformanceMetricType.RESPONSE_TIME]: 30,
            [PerformanceDataModel_1.PerformanceMetricType.ERROR_RATE]: 40,
            [PerformanceDataModel_1.PerformanceMetricType.THROUGHPUT]: 20,
            [PerformanceDataModel_1.PerformanceMetricType.CPU_USAGE]: 10,
            [PerformanceDataModel_1.PerformanceMetricType.MEMORY_USAGE]: 10
        };
        const impact1 = impactFactors[metric1.metric_type] || 5;
        const impact2 = impactFactors[metric2.metric_type] || 5;
        return Math.min((impact1 + impact2) * Math.abs(correlation), 100);
    }
    calculateMetricOperationalImpact(metric1, metric2, correlation) {
        const categoryImpacts = {
            [PerformanceDataModel_1.PerformanceCategory.CPU]: 25,
            [PerformanceDataModel_1.PerformanceCategory.MEMORY]: 25,
            [PerformanceDataModel_1.PerformanceCategory.DATABASE]: 30,
            [PerformanceDataModel_1.PerformanceCategory.NETWORK]: 20,
            [PerformanceDataModel_1.PerformanceCategory.IO]: 20,
            [PerformanceDataModel_1.PerformanceCategory.APPLICATION]: 15
        };
        const impact1 = categoryImpacts[metric1.category] || 10;
        const impact2 = categoryImpacts[metric2.category] || 10;
        return Math.min((impact1 + impact2) * Math.abs(correlation), 100);
    }
    getCorrelationBaselineKey(correlation) {
        return `${correlation.metric1.service_id}_${correlation.metric1.metric_type}_${correlation.metric2.metric_type}`;
    }
    updateCorrelationBaseline(key, correlation) {
        let baseline = this.anomalyBaselines.get(key);
        if (!baseline) {
            baseline = {
                samples: [],
                mean: correlation.correlation_coefficient,
                variance: 0,
                stdDev: 0,
                lastUpdated: new Date()
            };
            this.anomalyBaselines.set(key, baseline);
        }
        else {
            baseline.samples.push(correlation.correlation_coefficient);
            if (baseline.samples.length > 100) {
                baseline.samples.shift(); // Keep only recent samples
            }
            // Recalculate statistics
            const mean = baseline.samples.reduce((sum, val) => sum + val, 0) / baseline.samples.length;
            const variance = baseline.samples.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / baseline.samples.length;
            baseline.mean = mean;
            baseline.variance = variance;
            baseline.stdDev = Math.sqrt(variance);
            baseline.lastUpdated = new Date();
        }
    }
    determineAnomalyType(expected, actual) {
        const diff = actual - expected;
        if (Math.abs(diff) > 0.5) {
            return AnomalyType.CORRELATION_BREAK;
        }
        if (Math.sign(expected) !== Math.sign(actual) && Math.abs(expected) > 0.3) {
            return AnomalyType.CORRELATION_REVERSAL;
        }
        if (Math.abs(expected) < 0.3 && Math.abs(actual) > 0.6) {
            return AnomalyType.UNEXPECTED_CORRELATION;
        }
        if (Math.abs(expected) > 0.6 && Math.abs(actual) < 0.3) {
            return AnomalyType.MISSING_CORRELATION;
        }
        return AnomalyType.CORRELATION_BREAK;
    }
    identifyAnomalyCauses(correlation, baseline) {
        const causes = [];
        if (Math.abs(correlation.correlation_coefficient) < Math.abs(baseline.mean) * 0.5) {
            causes.push('System behavior change');
            causes.push('New deployment or configuration change');
            causes.push('External dependency issues');
        }
        if (correlation.p_value > 0.05) {
            causes.push('Insufficient sample size');
            causes.push('High data variance');
        }
        if (correlation.sample_size < this.config.minimumSampleSize * 2) {
            causes.push('Limited data availability');
        }
        return causes;
    }
    storeTimeSeriesCorrelation(profile, correlations, anomalies) {
        const targetId = profile.target_id;
        if (!this.historicalCorrelations.has(targetId)) {
            this.historicalCorrelations.set(targetId, []);
        }
        const historical = this.historicalCorrelations.get(targetId);
        const timeSeriesCorrelation = {
            profile_id: profile.id,
            timestamp: new Date(),
            correlations,
            anomalous_correlations: anomalies,
            trend_analysis: [] // Would be calculated from historical data
        };
        historical.push(timeSeriesCorrelation);
        // Keep only recent correlations
        if (historical.length > this.config.analysisWindowSize) {
            historical.splice(0, historical.length - this.config.analysisWindowSize);
        }
    }
    startBackgroundTasks() {
        // Cleanup old data periodically
        setInterval(() => {
            this.cleanupOldData();
        }, 3600000); // Every hour
        // Update correlation baselines periodically
        setInterval(() => {
            this.updateBaselines();
        }, 1800000); // Every 30 minutes
    }
    cleanupOldData() {
        const cutoffDate = new Date();
        cutoffDate.setHours(cutoffDate.getHours() - 24); // 24 hours old
        // Clean correlation cache
        for (const [profileId, correlations] of this.correlationCache) {
            const recentCorrelations = correlations.filter(c => c.analysis_timestamp > cutoffDate);
            if (recentCorrelations.length === 0) {
                this.correlationCache.delete(profileId);
            }
            else {
                this.correlationCache.set(profileId, recentCorrelations);
            }
        }
        // Clean historical correlations
        for (const [targetId, historical] of this.historicalCorrelations) {
            const recentHistorical = historical.filter(h => h.timestamp > cutoffDate);
            if (recentHistorical.length === 0) {
                this.historicalCorrelations.delete(targetId);
            }
            else {
                this.historicalCorrelations.set(targetId, recentHistorical);
            }
        }
        // Clean baselines
        cutoffDate.setDate(cutoffDate.getDate() - 7); // 7 days old
        for (const [key, baseline] of this.anomalyBaselines) {
            if (baseline.lastUpdated < cutoffDate) {
                this.anomalyBaselines.delete(key);
            }
        }
    }
    updateBaselines() {
        // Update correlation baselines based on recent data
        for (const [targetId, historical] of this.historicalCorrelations) {
            const recent = historical.slice(-10); // Last 10 correlations
            for (const ts of recent) {
                for (const correlation of ts.correlations) {
                    const key = this.getCorrelationBaselineKey(correlation);
                    this.updateCorrelationBaseline(key, correlation);
                }
            }
        }
    }
    // Public API methods
    getCorrelations(profileId) {
        return this.correlationCache.get(profileId) || [];
    }
    getCorrelationPatterns() {
        return Array.from(this.correlationPatterns.values());
    }
    getAnalysisStatus(analysisId) {
        return this.activeAnalyses.get(analysisId);
    }
    getHistoricalCorrelations(targetId) {
        return this.historicalCorrelations.get(targetId) || [];
    }
    getCorrelationStatistics() {
        return {
            total_patterns: this.correlationPatterns.size,
            active_analyses: this.activeAnalyses.size,
            cached_correlations: Array.from(this.correlationCache.values()).reduce((sum, corrs) => sum + corrs.length, 0),
            historical_entries: Array.from(this.historicalCorrelations.values()).reduce((sum, hist) => sum + hist.length, 0),
            baseline_entries: this.anomalyBaselines.size
        };
    }
    generateAnalysisId() {
        return `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateCorrelationId() {
        return `correlation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateAnomalyId() {
        return `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    async shutdown() {
        // Cleanup resources
        this.correlationCache.clear();
        this.historicalCorrelations.clear();
        this.anomalyBaselines.clear();
        this.activeAnalyses.clear();
        console.log('Performance Correlation Service shutdown complete');
    }
}
exports.PerformanceCorrelationService = PerformanceCorrelationService;
