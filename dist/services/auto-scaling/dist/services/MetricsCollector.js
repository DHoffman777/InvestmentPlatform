"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsCollector = void 0;
const events_1 = require("events");
const axios_1 = __importDefault(require("axios"));
class MetricsCollector extends events_1.EventEmitter {
    constructor(config) {
        super();
        this.config = config;
        this.metricsCache = new Map();
        this.lastCollectionTime = new Date();
    }
    start() {
        console.log('Starting metrics collection...');
        this.collectionInterval = setInterval(async () => {
            try {
                await this.collectAllMetrics();
            }
            catch (error) {
                console.error('Metrics collection failed:', error);
                this.emit('error', { type: 'collection_failed', error });
            }
        }, this.config.metrics.collectionInterval * 1000);
        // Initial collection
        this.collectAllMetrics();
    }
    stop() {
        if (this.collectionInterval) {
            clearInterval(this.collectionInterval);
            this.collectionInterval = undefined;
        }
        console.log('Metrics collection stopped');
    }
    async collectAllMetrics() {
        const services = this.getMonitoredServices();
        const collectionPromises = services.map(service => this.collectServiceMetrics(service));
        const results = await Promise.allSettled(collectionPromises);
        let successCount = 0;
        let errorCount = 0;
        results.forEach((result, index) => {
            if (result.status === 'fulfilled') {
                successCount++;
                this.metricsCache.set(services[index], result.value);
                this.emit('metricsCollected', { service: services[index], metrics: result.value });
            }
            else {
                errorCount++;
                console.error(`Failed to collect metrics for ${services[index]}:`, result.reason);
                this.emit('collectionError', { service: services[index], error: result.reason });
            }
        });
        this.lastCollectionTime = new Date();
        this.emit('collectionCycle', {
            timestamp: this.lastCollectionTime,
            totalServices: services.length,
            successful: successCount,
            failed: errorCount
        });
    }
    getMonitoredServices() {
        // Extract service names from scaling rules
        const services = new Set();
        for (const rule of this.config.scaling.rules) {
            rule.action.targetServices.forEach(service => services.add(service));
        }
        return Array.from(services);
    }
    async collectServiceMetrics(serviceName) {
        const timestamp = new Date();
        const metrics = {
            serviceName,
            timestamp,
            instances: await this.getInstanceMetrics(serviceName),
            resources: await this.getResourceMetrics(serviceName),
            performance: await this.getPerformanceMetrics(serviceName),
            customMetrics: await this.getCustomMetrics(serviceName),
        };
        return metrics;
    }
    async getInstanceMetrics(serviceName) {
        try {
            // Mock implementation - in real scenario, this would query Kubernetes or Docker API
            const mockData = {
                current: Math.floor(Math.random() * 5) + 2, // 2-6 instances
                desired: Math.floor(Math.random() * 5) + 2,
                healthy: 0,
                unhealthy: 0,
            };
            mockData.healthy = Math.floor(mockData.current * 0.9); // 90% healthy
            mockData.unhealthy = mockData.current - mockData.healthy;
            return mockData;
        }
        catch (error) {
            console.error(`Failed to get instance metrics for ${serviceName}:`, error);
            return { current: 0, desired: 0, healthy: 0, unhealthy: 0 };
        }
    }
    async getResourceMetrics(serviceName) {
        try {
            // Mock implementation - in real scenario, this would query monitoring system
            return {
                cpu: {
                    usage: Math.random() * 100, // 0-100%
                    request: 500, // 0.5 CPU cores in millicores
                    limit: 1000, // 1 CPU core in millicores
                },
                memory: {
                    usage: Math.random() * 100, // 0-100%
                    request: 512 * 1024 * 1024, // 512MB
                    limit: 1024 * 1024 * 1024, // 1GB
                },
                network: {
                    inbound: Math.random() * 10000000, // bytes/sec
                    outbound: Math.random() * 10000000, // bytes/sec
                },
            };
        }
        catch (error) {
            console.error(`Failed to get resource metrics for ${serviceName}:`, error);
            return {
                cpu: { usage: 0, request: 0, limit: 0 },
                memory: { usage: 0, request: 0, limit: 0 },
                network: { inbound: 0, outbound: 0 },
            };
        }
    }
    async getPerformanceMetrics(serviceName) {
        try {
            // Mock implementation - in real scenario, this would query APM system
            return {
                responseTime: Math.random() * 1000 + 100, // 100-1100ms
                throughput: Math.random() * 1000 + 50, // 50-1050 req/sec
                errorRate: Math.random() * 5, // 0-5%
                queueLength: Math.floor(Math.random() * 100), // 0-100 queued requests
            };
        }
        catch (error) {
            console.error(`Failed to get performance metrics for ${serviceName}:`, error);
            return { responseTime: 0, throughput: 0, errorRate: 0, queueLength: 0 };
        }
    }
    async getCustomMetrics(serviceName) {
        try {
            const customMetrics = {};
            // Financial services specific metrics
            if (serviceName.includes('portfolio')) {
                customMetrics.portfolioCalculationsPerSecond = Math.random() * 100;
                customMetrics.positionUpdatesPerSecond = Math.random() * 500;
                customMetrics.riskCalculationsPerSecond = Math.random() * 50;
            }
            if (serviceName.includes('market-data')) {
                customMetrics.priceUpdatesPerSecond = Math.random() * 10000;
                customMetrics.quotesServedPerSecond = Math.random() * 5000;
                customMetrics.marketDataLatency = Math.random() * 50 + 10; // 10-60ms
            }
            if (serviceName.includes('trading')) {
                customMetrics.ordersPerSecond = Math.random() * 1000;
                customMetrics.tradesPerSecond = Math.random() * 500;
                customMetrics.orderBookDepth = Math.random() * 1000000;
            }
            if (serviceName.includes('compliance')) {
                customMetrics.complianceChecksPerSecond = Math.random() * 200;
                customMetrics.ruleViolationsPerHour = Math.random() * 10;
            }
            return customMetrics;
        }
        catch (error) {
            console.error(`Failed to get custom metrics for ${serviceName}:`, error);
            return {};
        }
    }
    async queryPrometheusMetric(query) {
        if (!this.config.metrics.prometheusUrl) {
            throw new Error('Prometheus URL not configured');
        }
        try {
            const response = await axios_1.default.get(`${this.config.metrics.prometheusUrl}/api/v1/query`, {
                params: { query },
                timeout: 5000,
            });
            if (response.data.status === 'success' && response.data.data.result.length > 0) {
                const result = response.data.data.result[0];
                return parseFloat(result.value[1]);
            }
            return 0;
        }
        catch (error) {
            console.error('Failed to query Prometheus:', error);
            throw error;
        }
    }
    async evaluateMetricSource(source) {
        let value = 0;
        try {
            switch (source.type) {
                case 'prometheus':
                    if (source.query) {
                        value = await this.queryPrometheusMetric(source.query);
                    }
                    break;
                case 'custom':
                    if (source.endpoint) {
                        const response = await axios_1.default.get(source.endpoint, { timeout: 5000 });
                        value = typeof response.data === 'number' ? response.data : response.data.value || 0;
                    }
                    break;
                case 'kubernetes':
                    // Implementation would query Kubernetes metrics API
                    value = Math.random() * 100; // Mock value
                    break;
                case 'system':
                    // Implementation would query system metrics
                    value = Math.random() * 100; // Mock value
                    break;
                default:
                    console.warn(`Unknown metric source type: ${source.type}`);
            }
        }
        catch (error) {
            console.error(`Failed to evaluate metric source ${source.name}:`, error);
            value = 0;
        }
        const thresholdMet = this.evaluateThreshold(value, source.threshold, source.comparison);
        return {
            value,
            thresholdMet,
            timestamp: new Date(),
        };
    }
    evaluateThreshold(value, threshold, comparison) {
        switch (comparison) {
            case 'greater_than':
                return value > threshold;
            case 'less_than':
                return value < threshold;
            case 'equal':
                return Math.abs(value - threshold) < 0.001; // Float comparison tolerance
            case 'not_equal':
                return Math.abs(value - threshold) >= 0.001;
            default:
                return false;
        }
    }
    getServiceMetrics(serviceName) {
        return this.metricsCache.get(serviceName);
    }
    getAllMetrics() {
        return new Map(this.metricsCache);
    }
    getLastCollectionTime() {
        return this.lastCollectionTime;
    }
    async validateMetricsHealth() {
        const issues = [];
        const now = new Date();
        const timeSinceLastCollection = now.getTime() - this.lastCollectionTime.getTime();
        const maxCollectionAge = this.config.metrics.collectionInterval * 2 * 1000; // 2x collection interval
        if (timeSinceLastCollection > maxCollectionAge) {
            issues.push(`Metrics collection is stale (${Math.floor(timeSinceLastCollection / 1000)}s ago)`);
        }
        if (this.metricsCache.size === 0) {
            issues.push('No metrics data available');
        }
        // Check for services with stale metrics
        const staleServices = [];
        for (const [serviceName, metrics] of this.metricsCache.entries()) {
            const metricsAge = now.getTime() - metrics.timestamp.getTime();
            if (metricsAge > maxCollectionAge) {
                staleServices.push(serviceName);
            }
        }
        if (staleServices.length > 0) {
            issues.push(`Stale metrics for services: ${staleServices.join(', ')}`);
        }
        return {
            healthy: issues.length === 0,
            issues,
            lastCollection: this.lastCollectionTime,
            servicesMonitored: this.metricsCache.size,
        };
    }
}
exports.MetricsCollector = MetricsCollector;
