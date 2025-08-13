"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnomalyDetectionService = void 0;
const crypto_1 = require("crypto");
const Analytics_1 = require("../../models/analytics/Analytics");
const logger_1 = require("../../utils/logger");
const eventPublisher_1 = require("../../utils/eventPublisher");
class AnomalyDetectionService {
    eventPublisher;
    anomalies = new Map();
    detectionConfigs = new Map();
    modelCache = new Map(); // Cache for trained models
    defaultConfig = {
        enabled: true,
        sensitivity: 'medium',
        methods: ['statistical_threshold', 'isolation_forest', 'lstm_autoencoder'],
        thresholds: {
            statistical: 0.05, // p-value threshold
            isolation_forest: -0.1, // Anomaly score threshold
            lstm_autoencoder: 0.3, // Reconstruction error threshold
            local_outlier_factor: 1.5, // LOF threshold
            one_class_svm: 0.0 // Decision function threshold
        },
        minDataPoints: 30,
        alertThreshold: 0.7
    };
    constructor() {
        this.eventPublisher = new eventPublisher_1.EventPublisher();
        this.initializeDefaultConfigs();
    }
    async detectAnomalies(request) {
        try {
            logger_1.logger.info('Starting anomaly detection', {
                tenantId: request.tenantId,
                entityId: request.entityId,
                metricType: request.metricType,
                dataPoints: request.data.length
            });
            if (request.data.length < this.defaultConfig.minDataPoints) {
                logger_1.logger.warn('Insufficient data for anomaly detection', {
                    required: this.defaultConfig.minDataPoints,
                    provided: request.data.length
                });
                return [];
            }
            const config = this.getDetectionConfig(request.tenantId);
            const context = await this.buildAnomalyContext(request.data, request.metricType);
            const detectedAnomalies = [];
            const methods = request.detectionMethods || config.methods;
            for (const method of methods) {
                try {
                    const anomaly = await this.runDetectionMethod(method, request, context, config);
                    if (anomaly) {
                        detectedAnomalies.push(anomaly);
                    }
                }
                catch (error) {
                    logger_1.logger.error(`Error in ${method} detection:`, error);
                }
            }
            // Store and process detected anomalies
            for (const anomaly of detectedAnomalies) {
                this.anomalies.set(anomaly.id, anomaly);
                if (anomaly.anomalyScore >= config.alertThreshold) {
                    await this.generateAnomalyAlert(anomaly, request.tenantId);
                }
            }
            await this.eventPublisher.publish('analytics.anomalies.detected', {
                tenantId: request.tenantId,
                entityId: request.entityId,
                anomalyCount: detectedAnomalies.length,
                highSeverityCount: detectedAnomalies.filter(a => a.severity === 'high' || a.severity === 'critical').length
            });
            return detectedAnomalies;
        }
        catch (error) {
            logger_1.logger.error('Error in anomaly detection:', error);
            throw error;
        }
    }
    async runStatisticalAnomalyDetection(data, sensitivity = 'medium') {
        try {
            const values = data.map(d => d.value);
            const baseline = this.calculateStatisticalBaseline(values);
            // Get the latest value to test
            const latestValue = values[values.length - 1];
            const zScore = Math.abs((latestValue - baseline.mean) / baseline.standardDeviation);
            // Determine threshold based on sensitivity
            const zThresholds = { low: 3.0, medium: 2.5, high: 2.0 };
            const threshold = zThresholds[sensitivity];
            const isAnomaly = zScore > threshold;
            const score = Math.min(1.0, zScore / 4.0); // Normalize to 0-1
            const confidence = this.calculateStatisticalConfidence(zScore, values.length);
            return {
                isAnomaly,
                score,
                zScore,
                confidence,
                baseline
            };
        }
        catch (error) {
            logger_1.logger.error('Error in statistical anomaly detection:', error);
            throw error;
        }
    }
    async runIsolationForestDetection(data, features = ['value'], contamination = 0.1) {
        try {
            // Extract feature matrix
            const featureMatrix = this.extractFeatureMatrix(data, features);
            // Mock Isolation Forest implementation
            const isolationScores = featureMatrix.map(() => (Math.random() - 0.5) * 0.4); // -0.2 to 0.2
            const latestScore = isolationScores[isolationScores.length - 1];
            const isAnomaly = latestScore < -0.1; // Negative scores indicate anomalies
            const score = Math.abs(latestScore) * 5; // Normalize to 0-1
            const confidence = this.calculateIsolationConfidence(latestScore, isolationScores);
            // Calculate feature contributions
            const featureContributions = {};
            features.forEach(feature => {
                featureContributions[feature] = Math.random() * 0.5 + 0.25; // 0.25-0.75
            });
            return {
                isAnomaly,
                score,
                confidence,
                outlierFactor: latestScore,
                featureContributions
            };
        }
        catch (error) {
            logger_1.logger.error('Error in isolation forest detection:', error);
            throw error;
        }
    }
    async runLSTMAutoencoderDetection(data, sequenceLength = 10, threshold = 0.3) {
        try {
            if (data.length < sequenceLength) {
                throw new Error('Insufficient data for LSTM autoencoder');
            }
            // Mock LSTM autoencoder implementation
            const sequences = this.createSequences(data.map(d => d.value), sequenceLength);
            const reconstructionErrors = sequences.map(() => Math.random() * 0.6); // 0-0.6
            const latestError = reconstructionErrors[reconstructionErrors.length - 1];
            const isAnomaly = latestError > threshold;
            const score = Math.min(1.0, latestError / 0.6);
            const confidence = this.calculateAutoencoderConfidence(latestError, reconstructionErrors);
            const sequencePattern = this.classifySequencePattern(latestError, threshold);
            return {
                isAnomaly,
                score,
                reconstructionError: latestError,
                confidence,
                sequencePattern
            };
        }
        catch (error) {
            logger_1.logger.error('Error in LSTM autoencoder detection:', error);
            throw error;
        }
    }
    async monitorRealTimeAnomalies(tenantId, entityId, metricType, newDataPoint, historicalData) {
        try {
            // Create detection request with the new data point
            const allData = [...historicalData, newDataPoint];
            const request = {
                tenantId,
                entityId,
                entityType: 'portfolio',
                metricType,
                data: allData.slice(-100), // Use last 100 points
                sensitivity: 'medium'
            };
            const anomalies = await this.detectAnomalies(request);
            // Return the most recent anomaly if any
            if (anomalies.length > 0) {
                const latestAnomaly = anomalies.sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime())[0];
                // Generate real-time alert for high-severity anomalies
                if (latestAnomaly.severity === 'high' || latestAnomaly.severity === 'critical') {
                    await this.generateRealTimeAnomalyEvent(latestAnomaly, tenantId);
                }
                return latestAnomaly;
            }
            return null;
        }
        catch (error) {
            logger_1.logger.error('Error in real-time anomaly monitoring:', error);
            return null;
        }
    }
    async getAnomaliesByEntity(entityId, entityType, metricType, severity, resolved) {
        let anomalies = Array.from(this.anomalies.values()).filter(anomaly => anomaly.entityId === entityId && anomaly.entityType === entityType);
        if (metricType) {
            anomalies = anomalies.filter(anomaly => anomaly.metricType === metricType);
        }
        if (severity) {
            anomalies = anomalies.filter(anomaly => anomaly.severity === severity);
        }
        if (resolved !== undefined) {
            anomalies = anomalies.filter(anomaly => Boolean(anomaly.resolvedAt) === resolved);
        }
        return anomalies.sort((a, b) => b.detectedAt.getTime() - a.detectedAt.getTime());
    }
    async resolveAnomaly(anomalyId, resolvedBy, resolution, falsePositive = false) {
        const anomaly = this.anomalies.get(anomalyId);
        if (!anomaly) {
            throw new Error('Anomaly not found');
        }
        anomaly.resolvedAt = new Date();
        anomaly.falsePositive = falsePositive;
        // Update anomaly with resolution info (extend interface if needed)
        const updatedAnomaly = {
            ...anomaly,
            resolution,
            resolvedBy
        };
        this.anomalies.set(anomalyId, updatedAnomaly);
        await this.eventPublisher.publish('analytics.anomaly.resolved', {
            anomalyId,
            resolvedBy,
            falsePositive,
            entityId: anomaly.entityId
        });
        return updatedAnomaly;
    }
    async updateDetectionConfig(tenantId, config) {
        const currentConfig = this.getDetectionConfig(tenantId);
        const updatedConfig = { ...currentConfig, ...config };
        this.detectionConfigs.set(tenantId, updatedConfig);
        await this.eventPublisher.publish('analytics.anomaly_config.updated', {
            tenantId,
            changes: Object.keys(config)
        });
        return updatedConfig;
    }
    async runDetectionMethod(method, request, context, config) {
        let result;
        let anomalyType = 'statistical';
        switch (method) {
            case 'statistical_threshold':
                result = await this.runStatisticalAnomalyDetection(request.data, request.sensitivity || 'medium');
                anomalyType = 'statistical';
                break;
            case 'isolation_forest':
                result = await this.runIsolationForestDetection(request.data);
                anomalyType = 'pattern';
                break;
            case 'lstm_autoencoder':
                result = await this.runLSTMAutoencoderDetection(request.data);
                anomalyType = 'pattern';
                break;
            case 'local_outlier_factor':
                result = await this.runLocalOutlierFactorDetection(request.data);
                anomalyType = 'statistical';
                break;
            case 'one_class_svm':
                result = await this.runOneClassSVMDetection(request.data);
                anomalyType = 'pattern';
                break;
            default:
                logger_1.logger.warn(`Unsupported detection method: ${method}`);
                return null;
        }
        if (!result.isAnomaly) {
            return null;
        }
        // Create anomaly detection record
        const currentValue = request.data[request.data.length - 1].value;
        const expectedValue = this.calculateExpectedValue(request.data, context);
        const deviation = Math.abs(currentValue - expectedValue);
        const anomaly = {
            id: (0, crypto_1.randomUUID)(),
            entityId: request.entityId,
            entityType: request.entityType,
            metricType: request.metricType,
            anomalyType,
            severity: this.determineSeverity(result.score, method),
            detectionMethod: method,
            anomalyScore: result.score,
            threshold: config.thresholds[method],
            currentValue,
            expectedValue,
            deviation,
            context: {
                historicalMean: context.historicalData.reduce((sum, d) => sum + d.value, 0) / context.historicalData.length,
                historicalStdDev: this.calculateStandardDeviation(context.historicalData.map(d => d.value)),
                recentTrend: context.trend.direction,
                seasonalPattern: context.seasonality.detected ? `${context.seasonality.period}-period` : undefined
            },
            rootCause: await this.analyzeRootCause(result, request, context),
            recommendedActions: this.generateRecommendedActions(anomalyType, request.metricType, result.score),
            detectedAt: new Date()
        };
        return anomaly;
    }
    async buildAnomalyContext(data, metricType) {
        const values = data.map(d => d.value);
        return {
            historicalData: data.slice(0, -1), // All but the last point
            seasonality: this.detectSeasonality(values),
            trend: this.analyzeTrend(values),
            volatilityRegime: this.classifyVolatilityRegime(values),
            marketConditions: this.assessMarketConditions(data)
        };
    }
    extractFeatureMatrix(data, features) {
        return data.map(point => {
            return features.map(feature => {
                if (feature === 'value')
                    return point.value;
                return point.metadata?.[feature] || 0;
            });
        });
    }
    calculateStatisticalBaseline(values) {
        const sorted = [...values].sort((a, b) => a - b);
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / (values.length - 1);
        const standardDeviation = Math.sqrt(variance);
        const q1Index = Math.floor(sorted.length * 0.25);
        const q3Index = Math.floor(sorted.length * 0.75);
        const medianIndex = Math.floor(sorted.length * 0.5);
        return {
            mean,
            standardDeviation,
            median: sorted[medianIndex],
            iqr: sorted[q3Index] - sorted[q1Index]
        };
    }
    calculateStatisticalConfidence(zScore, sampleSize) {
        // Confidence based on z-score and sample size
        const zConfidence = Math.min(1.0, zScore / 4.0);
        const sampleConfidence = Math.min(1.0, sampleSize / 100);
        return (zConfidence * 0.7) + (sampleConfidence * 0.3);
    }
    calculateIsolationConfidence(score, allScores) {
        const absoluteScore = Math.abs(score);
        const meanAbsScore = allScores.reduce((sum, s) => sum + Math.abs(s), 0) / allScores.length;
        return Math.min(1.0, absoluteScore / (meanAbsScore * 2));
    }
    calculateAutoencoderConfidence(error, allErrors) {
        const maxError = Math.max(...allErrors);
        const meanError = allErrors.reduce((sum, e) => sum + e, 0) / allErrors.length;
        return Math.min(1.0, (error - meanError) / (maxError - meanError));
    }
    createSequences(data, sequenceLength) {
        const sequences = [];
        for (let i = 0; i <= data.length - sequenceLength; i++) {
            sequences.push(data.slice(i, i + sequenceLength));
        }
        return sequences;
    }
    classifySequencePattern(error, threshold) {
        if (error > threshold * 1.5)
            return 'anomalous';
        if (error > threshold * 0.8)
            return 'uncertain';
        return 'normal';
    }
    async runLocalOutlierFactorDetection(data) {
        // Mock LOF implementation
        const values = data.map(d => d.value);
        const latestValue = values[values.length - 1];
        // Calculate local density and LOF score
        const lofScore = this.calculateMockLOFScore(latestValue, values);
        const isAnomaly = lofScore > 1.5;
        return {
            isAnomaly,
            score: Math.min(1.0, lofScore / 3.0),
            confidence: 0.8,
            lofScore
        };
    }
    async runOneClassSVMDetection(data) {
        // Mock One-Class SVM implementation
        const values = data.map(d => d.value);
        const latestValue = values[values.length - 1];
        // Decision function score (negative for outliers)
        const decisionScore = (Math.random() - 0.3) * 2; // -0.6 to 1.4
        const isAnomaly = decisionScore < 0;
        return {
            isAnomaly,
            score: Math.max(0, -decisionScore),
            confidence: 0.75,
            decisionScore
        };
    }
    calculateMockLOFScore(value, values) {
        // Simplified LOF calculation
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const stdDev = this.calculateStandardDeviation(values);
        const deviation = Math.abs(value - mean) / stdDev;
        return 1.0 + (deviation * 0.3); // Base score + deviation factor
    }
    calculateStandardDeviation(values) {
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        return Math.sqrt(variance);
    }
    detectSeasonality(values) {
        // Simple seasonality detection
        const periods = [7, 30, 90, 252]; // Daily, monthly, quarterly, yearly
        let bestPeriod = 0;
        let bestStrength = 0;
        for (const period of periods) {
            if (values.length >= period * 2) {
                const strength = this.calculateSeasonalStrength(values, period);
                if (strength > bestStrength) {
                    bestStrength = strength;
                    bestPeriod = period;
                }
            }
        }
        return {
            detected: bestStrength > 0.3,
            period: bestPeriod,
            strength: bestStrength
        };
    }
    calculateSeasonalStrength(values, period) {
        // Mock seasonal strength calculation
        return Math.random() * 0.8; // 0-0.8
    }
    analyzeTrend(values) {
        if (values.length < 3) {
            return { direction: 'stable', strength: 0, changePoints: [] };
        }
        // Simple linear trend analysis
        const n = values.length;
        const sumX = (n * (n - 1)) / 2;
        const sumY = values.reduce((sum, val) => sum + val, 0);
        const sumXY = values.reduce((sum, val, i) => sum + val * i, 0);
        const sumX2 = (n * (n - 1) * (2 * n - 1)) / 6;
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const strength = Math.abs(slope) / (this.calculateStandardDeviation(values) / Math.sqrt(n));
        let direction = 'stable';
        if (slope > 0.1)
            direction = 'increasing';
        else if (slope < -0.1)
            direction = 'decreasing';
        return {
            direction,
            strength: Math.min(1.0, strength),
            changePoints: [] // Would be calculated with change point detection
        };
    }
    classifyVolatilityRegime(values) {
        const volatility = this.calculateStandardDeviation(values);
        const meanValue = values.reduce((sum, val) => sum + val, 0) / values.length;
        const cv = volatility / Math.abs(meanValue); // Coefficient of variation
        if (cv < 0.1)
            return 'low';
        if (cv < 0.3)
            return 'medium';
        return 'high';
    }
    assessMarketConditions(data) {
        // Mock market conditions assessment
        return {
            bullish: Math.random() * 0.6 + 0.2, // 0.2-0.8
            bearish: Math.random() * 0.4 + 0.1, // 0.1-0.5
            sideways: Math.random() * 0.5 + 0.2 // 0.2-0.7
        };
    }
    calculateExpectedValue(data, context) {
        // Simple expected value calculation
        const recentData = data.slice(-10);
        const recentMean = recentData.reduce((sum, d) => sum + d.value, 0) / recentData.length;
        // Adjust for trend
        if (context.trend.direction === 'increasing') {
            return recentMean * (1 + context.trend.strength * 0.1);
        }
        else if (context.trend.direction === 'decreasing') {
            return recentMean * (1 - context.trend.strength * 0.1);
        }
        return recentMean;
    }
    determineSeverity(score, method) {
        // Adjust thresholds based on method
        const methodMultipliers = {
            statistical_threshold: 1.0,
            isolation_forest: 1.2,
            lstm_autoencoder: 0.9,
            local_outlier_factor: 1.1,
            one_class_svm: 1.0
        };
        const adjustedScore = score * methodMultipliers[method];
        if (adjustedScore >= 0.9)
            return 'critical';
        if (adjustedScore >= 0.7)
            return 'high';
        if (adjustedScore >= 0.5)
            return 'medium';
        return 'low';
    }
    async analyzeRootCause(result, request, context) {
        // Mock root cause analysis
        const factors = [
            'Market volatility spike',
            'Sector-specific event',
            'Position concentration',
            'Liquidity constraint',
            'Data quality issue',
            'Model drift',
            'External market shock'
        ];
        const primaryFactor = factors[Math.floor(Math.random() * factors.length)];
        const contributingFactors = factors.filter(f => f !== primaryFactor).slice(0, 2);
        return {
            primaryFactor,
            contributingFactors,
            confidence: 0.7 + Math.random() * 0.25 // 0.7-0.95
        };
    }
    generateRecommendedActions(type, metricType, score) {
        const actions = [];
        if (score > 0.8) {
            actions.push('Immediate review required');
            actions.push('Consider position adjustment');
        }
        if (type === 'statistical') {
            actions.push('Verify data quality');
            actions.push('Check for outlier transactions');
        }
        else {
            actions.push('Analyze pattern changes');
            actions.push('Review model assumptions');
        }
        switch (metricType) {
            case Analytics_1.AnalyticsMetricType.PORTFOLIO_PERFORMANCE:
                actions.push('Review performance attribution');
                break;
            case Analytics_1.AnalyticsMetricType.RISK_METRICS:
                actions.push('Assess risk limit breaches');
                break;
            case Analytics_1.AnalyticsMetricType.LIQUIDITY_ANALYSIS:
                actions.push('Check liquidity constraints');
                break;
        }
        return actions;
    }
    async generateAnomalyAlert(anomaly, tenantId) {
        await this.eventPublisher.publish('analytics.anomaly.alert', {
            tenantId,
            anomalyId: anomaly.id,
            entityId: anomaly.entityId,
            severity: anomaly.severity,
            metricType: anomaly.metricType,
            anomalyScore: anomaly.anomalyScore,
            detectionMethod: anomaly.detectionMethod
        });
    }
    async generateRealTimeAnomalyEvent(anomaly, tenantId) {
        const event = {
            id: (0, crypto_1.randomUUID)(),
            tenantId,
            eventType: 'anomaly_detected',
            metricType: anomaly.metricType,
            entityId: anomaly.entityId,
            entityType: anomaly.entityType,
            timestamp: new Date(),
            data: {
                anomalyId: anomaly.id,
                severity: anomaly.severity,
                anomalyScore: anomaly.anomalyScore,
                detectionMethod: anomaly.detectionMethod,
                currentValue: anomaly.currentValue,
                expectedValue: anomaly.expectedValue,
                deviation: anomaly.deviation
            },
            severity: anomaly.severity,
            acknowledged: false
        };
        await this.eventPublisher.publish('analytics.realtime.anomaly', event);
    }
    getDetectionConfig(tenantId) {
        return this.detectionConfigs.get(tenantId) || this.defaultConfig;
    }
    initializeDefaultConfigs() {
        // Initialize default configurations for different tenant types
        this.detectionConfigs.set('default', this.defaultConfig);
        // High-sensitivity config for critical portfolios
        this.detectionConfigs.set('high-sensitivity', {
            ...this.defaultConfig,
            sensitivity: 'high',
            thresholds: {
                statistical: 0.01,
                isolation_forest: -0.05,
                lstm_autoencoder: 0.2,
                local_outlier_factor: 1.2,
                one_class_svm: -0.1
            },
            alertThreshold: 0.5
        });
        // Low-sensitivity config for stable portfolios
        this.detectionConfigs.set('low-sensitivity', {
            ...this.defaultConfig,
            sensitivity: 'low',
            thresholds: {
                statistical: 0.1,
                isolation_forest: -0.2,
                lstm_autoencoder: 0.5,
                local_outlier_factor: 2.0,
                one_class_svm: 0.1
            },
            alertThreshold: 0.8
        });
    }
}
exports.AnomalyDetectionService = AnomalyDetectionService;
