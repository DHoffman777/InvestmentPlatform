"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ResourceUtilizationService = void 0;
const events_1 = require("events");
const ResourceDataModel_1 = require("./ResourceDataModel");
class ResourceUtilizationService extends events_1.EventEmitter {
    config;
    metrics = new Map();
    snapshots = new Map();
    dataSources = new Map();
    collections = new Map();
    qualityValidators = new Map();
    constructor(config) {
        super();
        this.config = config;
        this.setupQualityValidators();
        this.startCollectionScheduler();
    }
    async addDataSource(dataSource) {
        this.dataSources.set(dataSource.id, dataSource);
        await this.validateDataSource(dataSource);
        this.emit('dataSourceAdded', { dataSourceId: dataSource.id, type: dataSource.type });
    }
    async removeDataSource(dataSourceId) {
        this.dataSources.delete(dataSourceId);
        const intervalId = this.collections.get(dataSourceId);
        if (intervalId) {
            clearInterval(intervalId);
            this.collections.delete(dataSourceId);
        }
        this.emit('dataSourceRemoved', { dataSourceId });
    }
    async collectMetrics(resourceIds) {
        const allMetrics = [];
        const targetResources = resourceIds || Array.from(this.dataSources.keys());
        for (const resourceId of targetResources) {
            try {
                const resourceMetrics = await this.collectResourceMetrics(resourceId);
                allMetrics.push(...resourceMetrics);
                if (this.config.enableRealTimeStreaming) {
                    this.emit('metricsCollected', { resourceId, metrics: resourceMetrics, timestamp: new Date() });
                }
            }
            catch (error) {
                console.error(`Failed to collect metrics for resource ${resourceId}:`, error instanceof Error ? error.message : 'Unknown error');
                this.emit('collectionError', { resourceId, error: error instanceof Error ? error.message : 'Unknown error', timestamp: new Date() });
            }
        }
        return allMetrics;
    }
    async collectResourceMetrics(resourceId) {
        const dataSource = this.dataSources.get(resourceId);
        if (!dataSource) {
            throw new Error(`Data source not found for resource: ${resourceId}`);
        }
        const metrics = [];
        const timestamp = new Date();
        try {
            switch (dataSource.type) {
                case 'prometheus':
                    metrics.push(...await this.collectPrometheusMetrics(dataSource, timestamp));
                    break;
                case 'cloudwatch':
                    metrics.push(...await this.collectCloudWatchMetrics(dataSource, timestamp));
                    break;
                case 'kubernetes':
                    metrics.push(...await this.collectKubernetesMetrics(dataSource, timestamp));
                    break;
                case 'docker':
                    metrics.push(...await this.collectDockerMetrics(dataSource, timestamp));
                    break;
                case 'system':
                    metrics.push(...await this.collectSystemMetrics(dataSource, timestamp));
                    break;
                default:
                    metrics.push(...await this.collectCustomMetrics(dataSource, timestamp));
            }
            // Store metrics with quality validation
            const validatedMetrics = this.config.enableQualityValidation
                ? await this.validateMetrics(metrics)
                : metrics;
            this.storeMetrics(resourceId, validatedMetrics);
            return validatedMetrics;
        }
        catch (error) {
            dataSource.errorCount++;
            dataSource.reliability = Math.max(0, dataSource.reliability - 0.1);
            throw error;
        }
    }
    async collectPrometheusMetrics(dataSource, timestamp) {
        const metrics = [];
        // Simulate Prometheus metric collection
        const prometheusQueries = [
            { query: 'cpu_usage_percent', type: ResourceDataModel_1.ResourceMetricType.CPU_USAGE_PERCENT },
            { query: 'memory_usage_percent', type: ResourceDataModel_1.ResourceMetricType.MEMORY_USAGE_PERCENT },
            { query: 'disk_usage_percent', type: ResourceDataModel_1.ResourceMetricType.DISK_USAGE_PERCENT },
            { query: 'network_bytes_in', type: ResourceDataModel_1.ResourceMetricType.NETWORK_BYTES_IN },
            { query: 'network_bytes_out', type: ResourceDataModel_1.ResourceMetricType.NETWORK_BYTES_OUT }
        ];
        for (const query of prometheusQueries) {
            const value = await this.executePrometheusQuery(dataSource, query.query);
            metrics.push({
                id: this.generateMetricId(),
                resourceId: dataSource.id,
                resourceType: this.inferResourceType(dataSource),
                metricType: query.type,
                value,
                unit: this.getMetricUnit(query.type),
                timestamp,
                metadata: {
                    collectionMethod: 'pull',
                    accuracy: 0.95,
                    confidence: 0.9,
                    dataSource: dataSource.id,
                    collector: 'prometheus',
                    version: '1.0.0'
                },
                tags: dataSource.configuration.tags || {},
                dimensions: this.extractDimensions(dataSource),
                source: dataSource,
                quality: { completeness: 1, accuracy: 0.95, timeliness: 1, consistency: 0.9, validity: 1, overall: 0.95, issues: [] }
            });
        }
        return metrics;
    }
    async collectCloudWatchMetrics(dataSource, timestamp) {
        const metrics = [];
        // AWS CloudWatch metric collection simulation
        const cloudWatchMetrics = [
            { metricName: 'CPUUtilization', type: ResourceDataModel_1.ResourceMetricType.CPU_USAGE_PERCENT },
            { metricName: 'MemoryUtilization', type: ResourceDataModel_1.ResourceMetricType.MEMORY_USAGE_PERCENT },
            { metricName: 'NetworkIn', type: ResourceDataModel_1.ResourceMetricType.NETWORK_BYTES_IN },
            { metricName: 'NetworkOut', type: ResourceDataModel_1.ResourceMetricType.NETWORK_BYTES_OUT },
            { metricName: 'DatabaseConnections', type: ResourceDataModel_1.ResourceMetricType.DB_CONNECTIONS_ACTIVE }
        ];
        for (const metric of cloudWatchMetrics) {
            const value = await this.executeCloudWatchQuery(dataSource, metric.metricName);
            metrics.push({
                id: this.generateMetricId(),
                resourceId: dataSource.id,
                resourceType: this.inferResourceType(dataSource),
                metricType: metric.type,
                value,
                unit: this.getMetricUnit(metric.type),
                timestamp,
                metadata: {
                    collectionMethod: 'pull',
                    accuracy: 0.98,
                    confidence: 0.95,
                    dataSource: dataSource.id,
                    collector: 'cloudwatch',
                    version: '1.0.0'
                },
                tags: dataSource.configuration.tags || {},
                dimensions: this.extractDimensions(dataSource),
                source: dataSource,
                quality: { completeness: 1, accuracy: 0.98, timeliness: 0.95, consistency: 0.9, validity: 1, overall: 0.96, issues: [] }
            });
        }
        return metrics;
    }
    async collectKubernetesMetrics(dataSource, timestamp) {
        const metrics = [];
        // Kubernetes metrics collection simulation
        const k8sMetrics = [
            { metric: 'pod_cpu_usage', type: ResourceDataModel_1.ResourceMetricType.CPU_USAGE_PERCENT },
            { metric: 'pod_memory_usage', type: ResourceDataModel_1.ResourceMetricType.MEMORY_USAGE_PERCENT },
            { metric: 'pod_network_rx_bytes', type: ResourceDataModel_1.ResourceMetricType.NETWORK_BYTES_IN },
            { metric: 'pod_network_tx_bytes', type: ResourceDataModel_1.ResourceMetricType.NETWORK_BYTES_OUT },
            { metric: 'container_restart_count', type: ResourceDataModel_1.ResourceMetricType.CONTAINER_RESTART_COUNT }
        ];
        for (const metric of k8sMetrics) {
            const value = await this.executeKubernetesQuery(dataSource, metric.metric);
            metrics.push({
                id: this.generateMetricId(),
                resourceId: dataSource.id,
                resourceType: ResourceDataModel_1.ResourceType.KUBERNETES_POD,
                metricType: metric.type,
                value,
                unit: this.getMetricUnit(metric.type),
                timestamp,
                metadata: {
                    collectionMethod: 'pull',
                    accuracy: 0.92,
                    confidence: 0.88,
                    dataSource: dataSource.id,
                    collector: 'kubernetes',
                    version: '1.0.0'
                },
                tags: dataSource.configuration.tags || {},
                dimensions: this.extractDimensions(dataSource),
                source: dataSource,
                quality: { completeness: 0.95, accuracy: 0.92, timeliness: 0.9, consistency: 0.85, validity: 0.95, overall: 0.91, issues: [] }
            });
        }
        return metrics;
    }
    async collectDockerMetrics(dataSource, timestamp) {
        const metrics = [];
        // Docker metrics collection simulation
        const dockerMetrics = [
            { stat: 'cpu_percent', type: ResourceDataModel_1.ResourceMetricType.CONTAINER_CPU_USAGE },
            { stat: 'memory_usage', type: ResourceDataModel_1.ResourceMetricType.CONTAINER_MEMORY_USAGE },
            { stat: 'network_rx_bytes', type: ResourceDataModel_1.ResourceMetricType.CONTAINER_NETWORK_IO },
            { stat: 'block_read_bytes', type: ResourceDataModel_1.ResourceMetricType.CONTAINER_DISK_IO }
        ];
        for (const metric of dockerMetrics) {
            const value = await this.executeDockerStatsQuery(dataSource, metric.stat);
            metrics.push({
                id: this.generateMetricId(),
                resourceId: dataSource.id,
                resourceType: ResourceDataModel_1.ResourceType.DOCKER_CONTAINER,
                metricType: metric.type,
                value,
                unit: this.getMetricUnit(metric.type),
                timestamp,
                metadata: {
                    collectionMethod: 'pull',
                    accuracy: 0.90,
                    confidence: 0.85,
                    dataSource: dataSource.id,
                    collector: 'docker',
                    version: '1.0.0'
                },
                tags: dataSource.configuration.tags || {},
                dimensions: this.extractDimensions(dataSource),
                source: dataSource,
                quality: { completeness: 0.9, accuracy: 0.90, timeliness: 0.95, consistency: 0.8, validity: 0.92, overall: 0.89, issues: [] }
            });
        }
        return metrics;
    }
    async collectSystemMetrics(dataSource, timestamp) {
        const metrics = [];
        // System metrics collection simulation
        const systemMetrics = [
            { name: 'cpu_usage', type: ResourceDataModel_1.ResourceMetricType.CPU_USAGE_PERCENT },
            { name: 'memory_usage', type: ResourceDataModel_1.ResourceMetricType.MEMORY_USAGE_PERCENT },
            { name: 'disk_usage', type: ResourceDataModel_1.ResourceMetricType.DISK_USAGE_PERCENT },
            { name: 'load_average', type: ResourceDataModel_1.ResourceMetricType.CPU_LOAD_AVERAGE },
            { name: 'disk_io_read', type: ResourceDataModel_1.ResourceMetricType.DISK_READ_IOPS },
            { name: 'disk_io_write', type: ResourceDataModel_1.ResourceMetricType.DISK_WRITE_IOPS }
        ];
        for (const metric of systemMetrics) {
            const value = await this.collectSystemMetric(dataSource, metric.name);
            metrics.push({
                id: this.generateMetricId(),
                resourceId: dataSource.id,
                resourceType: ResourceDataModel_1.ResourceType.CPU, // Will be determined by metric type
                metricType: metric.type,
                value,
                unit: this.getMetricUnit(metric.type),
                timestamp,
                metadata: {
                    collectionMethod: 'pull',
                    accuracy: 0.93,
                    confidence: 0.87,
                    dataSource: dataSource.id,
                    collector: 'system',
                    version: '1.0.0'
                },
                tags: dataSource.configuration.tags || {},
                dimensions: this.extractDimensions(dataSource),
                source: dataSource,
                quality: { completeness: 0.95, accuracy: 0.93, timeliness: 1, consistency: 0.88, validity: 0.96, overall: 0.92, issues: [] }
            });
        }
        return metrics;
    }
    async collectCustomMetrics(dataSource, timestamp) {
        const metrics = [];
        // Custom metrics collection - can be extended for specific needs
        const customConfig = dataSource.configuration.custom_metrics || [];
        for (const metricConfig of customConfig) {
            const value = await this.executeCustomQuery(dataSource, metricConfig);
            metrics.push({
                id: this.generateMetricId(),
                resourceId: dataSource.id,
                resourceType: metricConfig.resource_type || ResourceDataModel_1.ResourceType.CUSTOM,
                metricType: metricConfig.metric_type,
                value,
                unit: metricConfig.unit || 'count',
                timestamp,
                metadata: {
                    collectionMethod: 'custom',
                    accuracy: metricConfig.accuracy || 0.85,
                    confidence: metricConfig.confidence || 0.8,
                    dataSource: dataSource.id,
                    collector: 'custom',
                    version: '1.0.0'
                },
                tags: { ...dataSource.configuration.tags, ...metricConfig.tags } || {},
                dimensions: this.extractDimensions(dataSource),
                source: dataSource,
                quality: { completeness: 0.8, accuracy: 0.85, timeliness: 0.9, consistency: 0.75, validity: 0.9, overall: 0.84, issues: [] }
            });
        }
        return metrics;
    }
    async generateSnapshot(resourceId) {
        const resourceMetrics = this.metrics.get(resourceId) || [];
        const recentMetrics = this.getRecentMetrics(resourceMetrics, 3600000); // Last hour
        if (recentMetrics.length === 0) {
            throw new Error(`No recent metrics available for resource: ${resourceId}`);
        }
        const utilization = this.calculateUtilization(recentMetrics);
        const health = await this.assessResourceHealth(resourceId, recentMetrics);
        const capacity = await this.analyzeCapacity(resourceId, recentMetrics);
        const trends = await this.analyzeTrends(resourceId);
        const anomalies = await this.detectAnomalies(resourceId, recentMetrics);
        const snapshot = {
            id: this.generateSnapshotId(),
            timestamp: new Date(),
            resourceId,
            resourceType: recentMetrics[0]?.resourceType || ResourceDataModel_1.ResourceType.CUSTOM,
            metrics: recentMetrics,
            utilization,
            efficiency: await this.calculateEfficiency(resourceId, utilization, recentMetrics),
            health,
            capacity,
            trends,
            anomalies,
            recommendations: await this.generateRecommendations(resourceId, {
                utilization,
                health,
                capacity,
                trends,
                anomalies
            })
        };
        this.storeSnapshot(resourceId, snapshot);
        this.emit('snapshotGenerated', { resourceId, snapshot, timestamp: new Date() });
        return snapshot;
    }
    calculateUtilization(metrics) {
        const utilizationByType = new Map();
        // Group metrics by type
        for (const metric of metrics) {
            if (!utilizationByType.has(metric.metricType)) {
                utilizationByType.set(metric.metricType, []);
            }
            utilizationByType.get(metric.metricType).push(metric.value);
        }
        // Calculate utilization for each resource type
        const cpu = this.calculateAverageUtilization(utilizationByType.get(ResourceDataModel_1.ResourceMetricType.CPU_USAGE_PERCENT) || []);
        const memory = this.calculateAverageUtilization(utilizationByType.get(ResourceDataModel_1.ResourceMetricType.MEMORY_USAGE_PERCENT) || []);
        const storage = this.calculateAverageUtilization(utilizationByType.get(ResourceDataModel_1.ResourceMetricType.DISK_USAGE_PERCENT) || []);
        const network = this.calculateNetworkUtilization(metrics);
        const overall = (cpu + memory + storage + network) / 4;
        const allValues = [cpu, memory, storage, network].filter(v => v > 0);
        return {
            overall,
            cpu,
            memory,
            storage,
            network,
            custom: {},
            peak: {
                value: Math.max(...allValues),
                timestamp: new Date(),
                duration: 3600000 // 1 hour
            },
            average: overall,
            p95: this.calculatePercentile(allValues, 95),
            p99: this.calculatePercentile(allValues, 99),
            trend: this.determineTrend(allValues)
        };
    }
    async assessResourceHealth(resourceId, metrics) {
        const healthScore = this.calculateHealthScore(metrics);
        const status = this.determineHealthStatus(healthScore);
        return {
            status,
            score: healthScore,
            indicators: {
                availability: this.calculateAvailabilityScore(metrics),
                performance: this.calculatePerformanceScore(metrics),
                errors: this.calculateErrorScore(metrics),
                capacity: this.calculateCapacityScore(metrics)
            },
            issues: await this.identifyHealthIssues(resourceId, metrics),
            lastHealthCheck: new Date(),
            healthHistory: []
        };
    }
    async analyzeCapacity(resourceId, metrics) {
        return {
            current: {
                total: this.calculateTotalCapacity(metrics),
                used: this.calculateUsedCapacity(metrics),
                available: this.calculateAvailableCapacity(metrics),
                reserved: this.calculateReservedCapacity(metrics)
            },
            limits: {
                soft: this.getSoftLimits(resourceId),
                hard: this.getHardLimits(resourceId),
                configured: this.getConfiguredLimits(resourceId),
                theoretical: this.getTheoreticalLimits(resourceId)
            },
            forecast: {
                timeHorizon: '30 days',
                predicted: await this.forecastCapacity(resourceId, metrics),
                confidence: 0.85,
                assumptions: ['Linear growth', 'Current usage patterns continue', 'No major changes in workload']
            },
            scaling: {
                auto_scaling_enabled: false,
                scale_up_threshold: 80,
                scale_down_threshold: 20,
                min_capacity: {},
                max_capacity: {},
                scaling_history: []
            }
        };
    }
    async analyzeTrends(resourceId) {
        const historicalMetrics = this.metrics.get(resourceId) || [];
        return {
            short_term: this.analyzeTrendPeriod(historicalMetrics, 24 * 60 * 60 * 1000), // 24 hours
            medium_term: this.analyzeTrendPeriod(historicalMetrics, 7 * 24 * 60 * 60 * 1000), // 7 days
            long_term: this.analyzeTrendPeriod(historicalMetrics, 30 * 24 * 60 * 60 * 1000), // 30 days
            seasonal: [],
            growth: {
                rate: 0.02, // 2% growth
                acceleration: 0.001,
                projected: [],
                drivers: []
            },
            cycles: []
        };
    }
    async detectAnomalies(resourceId, metrics) {
        const anomalies = [];
        for (const metric of metrics) {
            const historicalData = this.getHistoricalMetrics(resourceId, metric.metricType);
            const anomaly = this.detectMetricAnomaly(metric, historicalData);
            if (anomaly) {
                anomalies.push(anomaly);
            }
        }
        return anomalies;
    }
    // Helper methods (implementation details)
    generateMetricId() {
        return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateSnapshotId() {
        return `snapshot_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    async executePrometheusQuery(dataSource, query) {
        // Simulate Prometheus query execution
        return Math.random() * 100;
    }
    async executeCloudWatchQuery(dataSource, metricName) {
        // Simulate CloudWatch query execution
        return Math.random() * 100;
    }
    async executeKubernetesQuery(dataSource, metric) {
        // Simulate Kubernetes metrics query
        return Math.random() * 100;
    }
    async executeDockerStatsQuery(dataSource, stat) {
        // Simulate Docker stats query
        return Math.random() * 100;
    }
    async collectSystemMetric(dataSource, metricName) {
        // Simulate system metric collection
        return Math.random() * 100;
    }
    async executeCustomQuery(dataSource, metricConfig) {
        // Simulate custom metric collection
        return Math.random() * 100;
    }
    inferResourceType(dataSource) {
        // Infer resource type from data source configuration
        return dataSource.configuration.resource_type || ResourceDataModel_1.ResourceType.CUSTOM;
    }
    getMetricUnit(metricType) {
        const unitMap = {
            [ResourceDataModel_1.ResourceMetricType.CPU_USAGE_PERCENT]: 'percent',
            [ResourceDataModel_1.ResourceMetricType.MEMORY_USAGE_PERCENT]: 'percent',
            [ResourceDataModel_1.ResourceMetricType.DISK_USAGE_PERCENT]: 'percent',
            [ResourceDataModel_1.ResourceMetricType.NETWORK_BYTES_IN]: 'bytes',
            [ResourceDataModel_1.ResourceMetricType.NETWORK_BYTES_OUT]: 'bytes',
            [ResourceDataModel_1.ResourceMetricType.DB_CONNECTIONS_ACTIVE]: 'count',
            [ResourceDataModel_1.ResourceMetricType.CONTAINER_RESTART_COUNT]: 'count',
            // Add more mappings as needed
        };
        return unitMap[metricType] || 'count';
    }
    extractDimensions(dataSource) {
        return {
            environment: dataSource.configuration.environment || 'unknown',
            region: dataSource.configuration.region || 'unknown',
            service: dataSource.configuration.service || 'unknown'
        };
    }
    storeMetrics(resourceId, metrics) {
        if (!this.metrics.has(resourceId)) {
            this.metrics.set(resourceId, []);
        }
        const resourceMetrics = this.metrics.get(resourceId);
        resourceMetrics.push(...metrics);
        // Implement retention policy
        const retentionMs = this.config.dataRetentionHours * 60 * 60 * 1000;
        const cutoffTime = new Date(Date.now() - retentionMs);
        const filteredMetrics = resourceMetrics.filter(m => m.timestamp > cutoffTime);
        this.metrics.set(resourceId, filteredMetrics);
    }
    storeSnapshot(resourceId, snapshot) {
        if (!this.snapshots.has(resourceId)) {
            this.snapshots.set(resourceId, []);
        }
        const resourceSnapshots = this.snapshots.get(resourceId);
        resourceSnapshots.push(snapshot);
        // Keep only last 100 snapshots
        if (resourceSnapshots.length > 100) {
            resourceSnapshots.splice(0, resourceSnapshots.length - 100);
        }
    }
    startCollectionScheduler() {
        setInterval(async () => {
            try {
                await this.collectMetrics();
            }
            catch (error) {
                console.error('Scheduled metric collection failed:', error instanceof Error ? error.message : 'Unknown error');
            }
        }, this.config.refreshInterval);
    }
    setupQualityValidators() {
        // Implementation for metric quality validation
    }
    async validateDataSource(dataSource) {
        // Implementation for data source validation
    }
    async validateMetrics(metrics) {
        // Implementation for metric validation
        return metrics;
    }
    getRecentMetrics(metrics, timeWindowMs) {
        const cutoffTime = new Date(Date.now() - timeWindowMs);
        return metrics.filter(m => m.timestamp > cutoffTime);
    }
    calculateAverageUtilization(values) {
        if (values.length === 0)
            return 0;
        return values.reduce((sum, val) => sum + val, 0) / values.length;
    }
    calculateNetworkUtilization(metrics) {
        // Implementation for network utilization calculation
        return 0;
    }
    calculatePercentile(values, percentile) {
        if (values.length === 0)
            return 0;
        const sorted = values.sort((a, b) => a - b);
        const index = Math.ceil((percentile / 100) * sorted.length) - 1;
        return sorted[index];
    }
    determineTrend(values) {
        // Simple trend analysis
        if (values.length < 2)
            return 'stable';
        const first = values[0];
        const last = values[values.length - 1];
        const change = (last - first) / first;
        if (Math.abs(change) < 0.05)
            return 'stable';
        return change > 0 ? 'increasing' : 'decreasing';
    }
    // Additional helper methods would be implemented here...
    calculateHealthScore(metrics) { return 0.85; }
    determineHealthStatus(score) { return 'healthy'; }
    calculateAvailabilityScore(metrics) { return 0.95; }
    calculatePerformanceScore(metrics) { return 0.85; }
    calculateErrorScore(metrics) { return 0.05; }
    calculateCapacityScore(metrics) { return 0.75; }
    async identifyHealthIssues(resourceId, metrics) { return []; }
    calculateTotalCapacity(metrics) { return {}; }
    calculateUsedCapacity(metrics) { return {}; }
    calculateAvailableCapacity(metrics) { return {}; }
    calculateReservedCapacity(metrics) { return {}; }
    getSoftLimits(resourceId) { return {}; }
    getHardLimits(resourceId) { return {}; }
    getConfiguredLimits(resourceId) { return {}; }
    getTheoreticalLimits(resourceId) { return {}; }
    async forecastCapacity(resourceId, metrics) { return {}; }
    analyzeTrendPeriod(metrics, periodMs) { return {}; }
    getHistoricalMetrics(resourceId, metricType) { return []; }
    detectMetricAnomaly(metric, historicalData) { return null; }
    async calculateEfficiency(resourceId, utilization, metrics) { return {}; }
    async generateRecommendations(resourceId, context) { return []; }
    async shutdown() {
        // Clear all intervals
        for (const intervalId of this.collections.values()) {
            clearInterval(intervalId);
        }
        this.collections.clear();
        this.emit('shutdown');
    }
}
exports.ResourceUtilizationService = ResourceUtilizationService;
