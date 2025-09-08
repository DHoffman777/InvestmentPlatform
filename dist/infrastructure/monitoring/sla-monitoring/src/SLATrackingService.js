"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SLATrackingService = void 0;
const events_1 = require("events");
const SLADataModel_1 = require("./SLADataModel");
class SLATrackingService extends events_1.EventEmitter {
    slas = new Map();
    metrics = new Map();
    measurementPoints = new Map();
    dataSources = new Map();
    trackingIntervals = new Map();
    config;
    calculationQueue = [];
    isProcessingQueue = false;
    constructor(config) {
        super();
        this.config = config;
        this.initializeDataSources();
        this.startQueueProcessor();
    }
    async registerSLA(sla) {
        await this.validateSLA(sla);
        this.slas.set(sla.id, sla);
        this.measurementPoints.set(sla.id, []);
        if (sla.isActive) {
            await this.startTracking(sla.id);
        }
        this.emit('slaRegistered', { slaId: sla.id, sla });
    }
    async unregisterSLA(slaId) {
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
    async startTracking(slaId) {
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
            }
            catch (error) {
                this.emit('trackingError', { slaId, error: error instanceof Error ? error.message : 'Unknown error' });
            }
        }, sla.measurement.frequency);
        this.trackingIntervals.set(slaId, interval);
        this.emit('trackingStarted', { slaId });
    }
    async stopTracking(slaId) {
        const interval = this.trackingIntervals.get(slaId);
        if (interval) {
            clearInterval(interval);
            this.trackingIntervals.delete(slaId);
            this.emit('trackingStopped', { slaId });
        }
    }
    async collectMeasurement(slaId) {
        const sla = this.slas.get(slaId);
        if (!sla) {
            throw new Error(`SLA ${slaId} not found`);
        }
        const dataSource = this.dataSources.get(sla.measurement.dataSource);
        if (!dataSource) {
            throw new Error(`Data source ${sla.measurement.dataSource} not found`);
        }
        const value = await this.queryDataSource(dataSource, sla);
        const measurement = {
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
    async calculateSLAMetric(slaId, timeWindow) {
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
        const context = {
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
        const metric = {
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
    async getMeasurements(slaId, timeWindow) {
        const allMeasurements = this.measurementPoints.get(slaId) || [];
        return allMeasurements.filter(m => m.timestamp >= timeWindow.start && m.timestamp <= timeWindow.end);
    }
    async getMetric(slaId) {
        return this.metrics.get(slaId) || null;
    }
    async getAllMetrics() {
        return Array.from(this.metrics.values());
    }
    async getMetricsByService(serviceId) {
        const serviceSLAs = Array.from(this.slas.values())
            .filter(sla => sla.serviceId === serviceId);
        const metrics = [];
        for (const sla of serviceSLAs) {
            const metric = this.metrics.get(sla.id);
            if (metric) {
                metrics.push(metric);
            }
        }
        return metrics;
    }
    async getSLAHistory(slaId, timeWindow, aggregationInterval = 3600000 // 1 hour default
    ) {
        const history = [];
        const intervals = Math.ceil((timeWindow.end.getTime() - timeWindow.start.getTime()) / aggregationInterval);
        for (let i = 0; i < intervals; i++) {
            const intervalStart = new Date(timeWindow.start.getTime() + (i * aggregationInterval));
            const intervalEnd = new Date(Math.min(intervalStart.getTime() + aggregationInterval, timeWindow.end.getTime()));
            try {
                const metric = await this.calculateSLAMetric(slaId, {
                    start: intervalStart,
                    end: intervalEnd
                });
                history.push(metric);
            }
            catch (error) {
                console.warn(`Failed to calculate metric for interval ${i}:`, error instanceof Error ? error.message : 'Unknown error');
            }
        }
        return history;
    }
    async recalculate(slaId) {
        const sla = this.slas.get(slaId);
        if (!sla) {
            throw new Error(`SLA ${slaId} not found`);
        }
        await this.calculateSLAMetric(slaId);
        this.emit('recalculationCompleted', { slaId });
    }
    async recalculateAll() {
        const slaIds = Array.from(this.slas.keys());
        for (const slaId of slaIds) {
            try {
                await this.recalculate(slaId);
            }
            catch (error) {
                this.emit('recalculationError', { slaId, error: error instanceof Error ? error.message : 'Unknown error' });
            }
        }
    }
    async queryDataSource(dataSource, sla) {
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
    async queryPrometheus(dataSource, sla) {
        // Mock Prometheus query
        console.log(`Querying Prometheus for SLA ${sla.id}: ${sla.measurement.queryTemplate}`);
        return this.simulateMetricValue(sla.metricType);
    }
    async queryInfluxDB(dataSource, sla) {
        // Mock InfluxDB query
        console.log(`Querying InfluxDB for SLA ${sla.id}: ${sla.measurement.queryTemplate}`);
        return this.simulateMetricValue(sla.metricType);
    }
    async queryElasticsearch(dataSource, sla) {
        // Mock Elasticsearch query
        console.log(`Querying Elasticsearch for SLA ${sla.id}: ${sla.measurement.queryTemplate}`);
        return this.simulateMetricValue(sla.metricType);
    }
    async queryDatabase(dataSource, sla) {
        // Mock database query
        console.log(`Querying database for SLA ${sla.id}: ${sla.measurement.queryTemplate}`);
        return this.simulateMetricValue(sla.metricType);
    }
    simulateMetricValue(metricType) {
        switch (metricType) {
            case SLADataModel_1.SLAMetricType.AVAILABILITY:
            case SLADataModel_1.SLAMetricType.UPTIME:
                return 99.5 + (Math.random() * 0.5); // 99.5-100%
            case SLADataModel_1.SLAMetricType.RESPONSE_TIME:
                return 100 + (Math.random() * 200); // 100-300ms
            case SLADataModel_1.SLAMetricType.THROUGHPUT:
                return 1000 + (Math.random() * 500); // 1000-1500 rps
            case SLADataModel_1.SLAMetricType.ERROR_RATE:
                return Math.random() * 5; // 0-5%
            case SLADataModel_1.SLAMetricType.TRANSACTION_SUCCESS_RATE:
                return 95 + (Math.random() * 5); // 95-100%
            case SLADataModel_1.SLAMetricType.DATA_ACCURACY:
                return 98 + (Math.random() * 2); // 98-100%
            case SLADataModel_1.SLAMetricType.RECOVERY_TIME:
                return 5 + (Math.random() * 10); // 5-15 minutes
            default:
                return Math.random() * 100;
        }
    }
    async aggregateValues(measurements, sla) {
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
        let aggregatedValue;
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
    calculateCompliancePercentage(currentValue, sla) {
        const target = sla.targetValue;
        // For availability, uptime, success rates (higher is better)
        if ([SLADataModel_1.SLAMetricType.AVAILABILITY, SLADataModel_1.SLAMetricType.UPTIME, SLADataModel_1.SLAMetricType.TRANSACTION_SUCCESS_RATE].includes(sla.metricType)) {
            return Math.min(100, (currentValue / target) * 100);
        }
        // For response time, error rate (lower is better)
        if ([SLADataModel_1.SLAMetricType.RESPONSE_TIME, SLADataModel_1.SLAMetricType.ERROR_RATE].includes(sla.metricType)) {
            return Math.max(0, 100 - ((currentValue - target) / target) * 100);
        }
        // Default calculation
        return Math.min(100, (currentValue / target) * 100);
    }
    determineStatus(currentValue, sla, compliancePercentage) {
        const thresholds = sla.thresholds;
        if (compliancePercentage < thresholds.critical) {
            return SLADataModel_1.SLAStatus.BREACHED;
        }
        if (compliancePercentage < thresholds.warning) {
            return SLADataModel_1.SLAStatus.AT_RISK;
        }
        return SLADataModel_1.SLAStatus.COMPLIANT;
    }
    async calculateTrends(slaId, timeWindow) {
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
    async identifyBreaches(slaId, timeWindow, currentValue, sla) {
        // This would typically query stored breach data
        // For now, return empty array as breach detection is handled separately
        return [];
    }
    getDefaultTimeWindow(sla) {
        const end = new Date();
        const start = new Date(end.getTime() - sla.timeWindow.duration);
        return { start, end };
    }
    createEmptyMetric(slaId, sla, timeWindow) {
        return {
            slaId,
            timeWindow,
            currentValue: 0,
            targetValue: sla.targetValue,
            unit: sla.unit,
            status: SLADataModel_1.SLAStatus.UNKNOWN,
            compliancePercentage: 0,
            measurements: [],
            trends: [],
            breaches: [],
            calculatedAt: new Date()
        };
    }
    async getExcludedPeriods(sla, timeWindow) {
        const excludedPeriods = [];
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
    async validateSLA(sla) {
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
    async validateMeasurement(measurement, sla) {
        for (const rule of this.config.validationRules) {
            const fieldValue = measurement[rule.field];
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
    queueCalculation(slaId, priority) {
        // Remove existing entry for this SLA
        this.calculationQueue = this.calculationQueue.filter(item => item.slaId !== slaId);
        // Add new entry
        this.calculationQueue.push({ slaId, priority });
        // Sort by priority (higher first)
        this.calculationQueue.sort((a, b) => b.priority - a.priority);
    }
    startQueueProcessor() {
        setInterval(async () => {
            if (!this.isProcessingQueue && this.calculationQueue.length > 0) {
                this.isProcessingQueue = true;
                try {
                    const item = this.calculationQueue.shift();
                    if (item) {
                        await this.calculateSLAMetric(item.slaId);
                    }
                }
                catch (error) {
                    console.error('Queue processing error:', error);
                }
                finally {
                    this.isProcessingQueue = false;
                }
            }
        }, 1000);
    }
    initializeDataSources() {
        // Initialize default data sources
        const defaultSources = [
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
    generateMeasurementId() {
        return `measurement_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    async shutdown() {
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
exports.SLATrackingService = SLATrackingService;
