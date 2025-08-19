"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiPerformanceOptimizer = void 0;
const events_1 = require("events");
class ApiPerformanceOptimizer extends events_1.EventEmitter {
    metrics = new Map();
    optimizations = new Map();
    alerts = new Map();
    maxMetricsPerEndpoint = 10000;
    // Performance thresholds
    thresholds = {
        slowResponseTime: 2000, // 2 seconds
        highErrorRate: 0.05, // 5%
        lowThroughput: 10, // 10 requests per second
        p95Threshold: 5000, // 5 seconds
    };
    constructor() {
        super();
        this.startPeriodicAnalysis();
    }
    // Express middleware for capturing API metrics
    metricsMiddleware() {
        return (req, res, next) => {
            const startTime = Date.now();
            const startMemory = process.memoryUsage().heapUsed;
            res.on('finish', () => {
                const endTime = Date.now();
                const responseTime = endTime - startTime;
                const endMemory = process.memoryUsage().heapUsed;
                const metrics = {
                    endpoint: this.normalizeEndpoint(req.path),
                    method: req.method,
                    responseTime,
                    statusCode: res.statusCode,
                    requestSize: parseInt(req.get('content-length') || '0'),
                    responseSize: parseInt(res.get('content-length') || '0'),
                    timestamp: new Date(startTime),
                    userAgent: req.get('user-agent'),
                    clientId: req.headers['x-client-id'],
                    traceId: req.headers['x-trace-id'],
                    memoryUsage: endMemory - startMemory,
                };
                this.recordMetrics(metrics);
            });
            next();
        };
    }
    normalizeEndpoint(path) {
        // Normalize paths with IDs to patterns
        return path
            .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
            .replace(/\/\d+/g, '/:id')
            .replace(/\/[0-9a-f]{24}/gi, '/:id'); // MongoDB ObjectId pattern
    }
    recordMetrics(metrics) {
        const endpointKey = `${metrics.method} ${metrics.endpoint}`;
        const endpointMetrics = this.metrics.get(endpointKey) || [];
        endpointMetrics.push(metrics);
        // Maintain maximum metrics per endpoint
        if (endpointMetrics.length > this.maxMetricsPerEndpoint) {
            endpointMetrics.splice(0, endpointMetrics.length - this.maxMetricsPerEndpoint);
        }
        this.metrics.set(endpointKey, endpointMetrics);
        // Emit events for real-time monitoring
        this.emit('metricsRecorded', metrics);
        // Check for immediate alerts
        this.checkForAlerts(endpointKey, metrics);
    }
    checkForAlerts(endpointKey, metrics) {
        // Check for slow response
        if (metrics.responseTime > this.thresholds.slowResponseTime) {
            this.createAlert(endpointKey, 'SLOW_RESPONSE', {
                message: `Slow response detected: ${metrics.responseTime}ms`,
                currentValue: metrics.responseTime,
                threshold: this.thresholds.slowResponseTime,
                severity: metrics.responseTime > 5000 ? 'CRITICAL' : 'HIGH',
            });
        }
        // Check error rate (would require recent metrics analysis)
        if (metrics.statusCode >= 500) {
            this.createAlert(endpointKey, 'HIGH_ERROR_RATE', {
                message: `Server error detected: ${metrics.statusCode}`,
                currentValue: metrics.statusCode,
                threshold: 500,
                severity: 'HIGH',
            });
        }
    }
    createAlert(endpointKey, alertType, options) {
        const alertId = `${endpointKey}_${alertType}_${Date.now()}`;
        const alert = {
            id: alertId,
            endpoint: endpointKey,
            alertType,
            severity: options.severity,
            message: options.message,
            currentValue: options.currentValue,
            threshold: options.threshold,
            triggeredAt: new Date(),
            recommendedActions: this.getRecommendedActions(alertType),
        };
        this.alerts.set(alertId, alert);
        this.emit('alertTriggered', alert);
    }
    getRecommendedActions(alertType) {
        switch (alertType) {
            case 'SLOW_RESPONSE':
                return [
                    'Check database query performance',
                    'Review external service calls',
                    'Consider implementing caching',
                    'Optimize expensive operations',
                ];
            case 'HIGH_ERROR_RATE':
                return [
                    'Check application logs for errors',
                    'Review recent deployments',
                    'Verify external service health',
                    'Check resource availability',
                ];
            case 'LOW_THROUGHPUT':
                return [
                    'Scale application instances',
                    'Optimize database connections',
                    'Review rate limiting configuration',
                    'Check for resource bottlenecks',
                ];
            case 'RESOURCE_EXHAUSTION':
                return [
                    'Scale resources immediately',
                    'Check for memory leaks',
                    'Review connection pooling',
                    'Optimize resource usage',
                ];
            default:
                return ['Investigate performance issue'];
        }
    }
    analyzeEndpoint(endpoint, method, timeWindow = 3600000) {
        const endpointKey = `${method} ${endpoint}`;
        const endpointMetrics = this.metrics.get(endpointKey);
        if (!endpointMetrics || endpointMetrics.length === 0) {
            return null;
        }
        const cutoffTime = new Date(Date.now() - timeWindow);
        const recentMetrics = endpointMetrics.filter(m => m.timestamp >= cutoffTime);
        if (recentMetrics.length === 0) {
            return null;
        }
        // Calculate statistics
        const responseTimes = recentMetrics.map(m => m.responseTime).sort((a, b) => a - b);
        const errorCount = recentMetrics.filter(m => m.statusCode >= 400).length;
        const totalRequests = recentMetrics.length;
        const analysis = {
            endpoint,
            method,
            totalRequests,
            averageResponseTime: responseTimes.reduce((sum, time) => sum + time, 0) / responseTimes.length,
            p50ResponseTime: this.percentile(responseTimes, 0.5),
            p95ResponseTime: this.percentile(responseTimes, 0.95),
            p99ResponseTime: this.percentile(responseTimes, 0.99),
            errorRate: errorCount / totalRequests,
            throughput: totalRequests / (timeWindow / 1000),
            trends: this.calculateTrends(endpointKey, timeWindow),
            slowestRequests: recentMetrics
                .sort((a, b) => b.responseTime - a.responseTime)
                .slice(0, 10),
            optimization: this.generateOptimizationRecommendations(recentMetrics),
        };
        return analysis;
    }
    percentile(sortedArray, percentile) {
        const index = (percentile * (sortedArray.length - 1));
        const lower = Math.floor(index);
        const upper = Math.ceil(index);
        const weight = index % 1;
        if (sortedArray[lower] === undefined)
            return 0;
        if (sortedArray[upper] === undefined)
            return sortedArray[lower];
        return sortedArray[lower] * (1 - weight) + sortedArray[upper] * weight;
    }
    calculateTrends(endpointKey, timeWindow) {
        const endpointMetrics = this.metrics.get(endpointKey) || [];
        const cutoffTime = new Date(Date.now() - timeWindow);
        const halfWindowTime = new Date(Date.now() - timeWindow / 2);
        const olderMetrics = endpointMetrics.filter(m => m.timestamp >= cutoffTime && m.timestamp < halfWindowTime);
        const newerMetrics = endpointMetrics.filter(m => m.timestamp >= halfWindowTime);
        if (olderMetrics.length === 0 || newerMetrics.length === 0) {
            return { responseTimeChange: 0, throughputChange: 0, errorRateChange: 0 };
        }
        const olderAvgResponseTime = olderMetrics.reduce((sum, m) => sum + m.responseTime, 0) / olderMetrics.length;
        const newerAvgResponseTime = newerMetrics.reduce((sum, m) => sum + m.responseTime, 0) / newerMetrics.length;
        const olderThroughput = olderMetrics.length / (timeWindow / 2 / 1000);
        const newerThroughput = newerMetrics.length / (timeWindow / 2 / 1000);
        const olderErrorRate = olderMetrics.filter(m => m.statusCode >= 400).length / olderMetrics.length;
        const newerErrorRate = newerMetrics.filter(m => m.statusCode >= 400).length / newerMetrics.length;
        return {
            responseTimeChange: ((newerAvgResponseTime - olderAvgResponseTime) / olderAvgResponseTime) * 100,
            throughputChange: ((newerThroughput - olderThroughput) / olderThroughput) * 100,
            errorRateChange: ((newerErrorRate - olderErrorRate) / Math.max(olderErrorRate, 0.001)) * 100,
        };
    }
    generateOptimizationRecommendations(metrics) {
        const avgResponseTime = metrics.reduce((sum, m) => sum + m.responseTime, 0) / metrics.length;
        const p95ResponseTime = this.percentile(metrics.map(m => m.responseTime).sort((a, b) => a - b), 0.95);
        const errorRate = metrics.filter(m => m.statusCode >= 400).length / metrics.length;
        const recommendations = [];
        let priority = 'LOW';
        let estimatedImpact = 0;
        // Analyze response time
        if (avgResponseTime > 2000) {
            recommendations.push('Implement response caching');
            recommendations.push('Optimize database queries');
            priority = 'HIGH';
            estimatedImpact += 40;
        }
        if (p95ResponseTime > 5000) {
            recommendations.push('Add request timeouts');
            recommendations.push('Implement circuit breakers');
            priority = 'CRITICAL';
            estimatedImpact += 30;
        }
        // Analyze payload sizes
        const avgRequestSize = metrics.reduce((sum, m) => sum + m.requestSize, 0) / metrics.length;
        const avgResponseSize = metrics.reduce((sum, m) => sum + m.responseSize, 0) / metrics.length;
        if (avgResponseSize > 1024 * 1024) { // 1MB
            recommendations.push('Implement response compression');
            recommendations.push('Add pagination for large datasets');
            estimatedImpact += 25;
        }
        if (avgRequestSize > 100 * 1024) { // 100KB
            recommendations.push('Implement request validation');
            recommendations.push('Add request size limits');
            estimatedImpact += 15;
        }
        // Analyze error rates
        if (errorRate > 0.05) {
            recommendations.push('Improve error handling');
            recommendations.push('Add request validation');
            if (priority === 'LOW')
                priority = 'MEDIUM';
            estimatedImpact += 20;
        }
        // Memory usage patterns
        const avgMemoryUsage = metrics.reduce((sum, m) => sum + (m.memoryUsage || 0), 0) / metrics.length;
        if (avgMemoryUsage > 50 * 1024 * 1024) { // 50MB
            recommendations.push('Optimize memory usage');
            recommendations.push('Implement object pooling');
            estimatedImpact += 20;
        }
        return {
            priority,
            recommendations,
            estimatedImpact: Math.min(estimatedImpact, 100),
        };
    }
    createOptimization(optimization) {
        const id = `opt_${Date.now()}_${optimization.endpoint.replace(/[^a-zA-Z0-9]/g, '_')}`;
        const newOptimization = {
            ...optimization,
            id,
            status: 'PENDING',
            createdAt: new Date(),
        };
        this.optimizations.set(id, newOptimization);
        this.emit('optimizationCreated', newOptimization);
        return id;
    }
    updateOptimizationStatus(id, status, metrics) {
        const optimization = this.optimizations.get(id);
        if (!optimization)
            return false;
        optimization.status = status;
        if (status === 'IMPLEMENTED') {
            optimization.implementedAt = new Date();
            if (metrics) {
                optimization.afterMetrics = metrics;
            }
        }
        this.emit('optimizationUpdated', optimization);
        return true;
    }
    getOptimizationsByPriority() {
        const optimizations = Array.from(this.optimizations.values());
        const priorityOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        return optimizations.sort((a, b) => {
            const aPriority = a.estimatedGain > 50 ? 'HIGH' : a.estimatedGain > 25 ? 'MEDIUM' : 'LOW';
            const bPriority = b.estimatedGain > 50 ? 'HIGH' : b.estimatedGain > 25 ? 'MEDIUM' : 'LOW';
            return (priorityOrder[bPriority] || 0) -
                (priorityOrder[aPriority] || 0);
        });
    }
    generatePerformanceReport(timeWindow = 86400000) {
        const endpointAnalyses = [];
        let totalRequests = 0;
        let totalResponseTime = 0;
        let totalErrors = 0;
        // Analyze all endpoints
        for (const [endpointKey, metrics] of this.metrics.entries()) {
            const [method, endpoint] = endpointKey.split(' ', 2);
            const analysis = this.analyzeEndpoint(endpoint, method, timeWindow);
            if (analysis) {
                endpointAnalyses.push(analysis);
                totalRequests += analysis.totalRequests;
                totalResponseTime += analysis.averageResponseTime * analysis.totalRequests;
                totalErrors += analysis.totalRequests * analysis.errorRate;
            }
        }
        const activeAlerts = Array.from(this.alerts.values()).filter(alert => !alert.resolvedAt);
        const recommendedOptimizations = this.getOptimizationsByPriority().slice(0, 10);
        return {
            summary: {
                totalEndpoints: endpointAnalyses.length,
                totalRequests,
                averageResponseTime: totalRequests > 0 ? totalResponseTime / totalRequests : 0,
                errorRate: totalRequests > 0 ? totalErrors / totalRequests : 0,
                slowestEndpoints: endpointAnalyses
                    .sort((a, b) => b.averageResponseTime - a.averageResponseTime)
                    .slice(0, 5)
                    .map(a => ({ endpoint: `${a.method} ${a.endpoint}`, avgResponseTime: a.averageResponseTime })),
            },
            endpointAnalyses: endpointAnalyses.sort((a, b) => b.averageResponseTime - a.averageResponseTime),
            activeAlerts,
            recommendedOptimizations,
        };
    }
    generateAutomaticOptimizations() {
        const optimizations = [];
        const report = this.generatePerformanceReport();
        for (const analysis of report.endpointAnalyses) {
            // Only create optimizations for endpoints that need them
            if (analysis.optimization.priority === 'LOW')
                continue;
            // Caching optimization
            if (analysis.averageResponseTime > 1000 && analysis.errorRate < 0.01) {
                optimizations.push({
                    id: '', // Will be set when created
                    endpoint: analysis.endpoint,
                    type: 'CACHING',
                    title: `Implement caching for ${analysis.method} ${analysis.endpoint}`,
                    description: `Average response time of ${analysis.averageResponseTime}ms indicates caching opportunity`,
                    implementation: `
            // Add Redis caching middleware
            const cacheKey = generateCacheKey(req);
            const cached = await redis.get(cacheKey);
            if (cached) return res.json(JSON.parse(cached));
            
            // Process request normally
            const result = await processRequest(req);
            await redis.setex(cacheKey, 300, JSON.stringify(result)); // 5 minute cache
            res.json(result);
          `,
                    estimatedGain: Math.min(60, analysis.averageResponseTime / 100),
                    complexity: 'MEDIUM',
                    status: 'PENDING',
                    createdAt: new Date(),
                });
            }
            // Compression optimization
            if (analysis.totalRequests > 100) { // High-traffic endpoint
                const avgResponseSize = analysis.slowestRequests.reduce((sum, req) => sum + req.responseSize, 0) /
                    Math.max(analysis.slowestRequests.length, 1);
                if (avgResponseSize > 10 * 1024) { // 10KB
                    optimizations.push({
                        id: '', // Will be set when created
                        endpoint: analysis.endpoint,
                        type: 'COMPRESSION',
                        title: `Enable compression for ${analysis.method} ${analysis.endpoint}`,
                        description: `Large response sizes (avg ${Math.round(avgResponseSize / 1024)}KB) can benefit from compression`,
                        implementation: `
              // Add compression middleware
              app.use(compression({
                filter: (req, res) => {
                  if (req.headers['x-no-compression']) return false;
                  return compression.filter(req, res);
                },
                level: 6, // Good balance of compression vs CPU
                threshold: 1024 // Only compress responses > 1KB
              }));
            `,
                        estimatedGain: 25,
                        complexity: 'LOW',
                        status: 'PENDING',
                        createdAt: new Date(),
                    });
                }
            }
            // Pagination optimization
            if (analysis.p95ResponseTime > 3000 && analysis.endpoint.includes('list') || analysis.endpoint.includes('search')) {
                optimizations.push({
                    id: '', // Will be set when created
                    endpoint: analysis.endpoint,
                    type: 'PAGINATION',
                    title: `Implement pagination for ${analysis.method} ${analysis.endpoint}`,
                    description: `P95 response time of ${analysis.p95ResponseTime}ms suggests large result sets`,
                    implementation: `
            // Add pagination parameters
            const page = parseInt(req.query.page as string) || 1;
            const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
            const offset = (page - 1) * limit;
            
            const results = await query.limit(limit).offset(offset);
            const total = await query.count();
            
            res.json({
              data: results,
              pagination: {
                page,
                limit,
                total,
                pages: Math.ceil(total / limit)
              }
            });
          `,
                    estimatedGain: 40,
                    complexity: 'MEDIUM',
                    status: 'PENDING',
                    createdAt: new Date(),
                });
            }
            // Async processing optimization
            if (analysis.averageResponseTime > 5000 && analysis.method === 'POST') {
                optimizations.push({
                    id: '', // Will be set when created
                    endpoint: analysis.endpoint,
                    type: 'ASYNC_PROCESSING',
                    title: `Implement async processing for ${analysis.method} ${analysis.endpoint}`,
                    description: `Long response times (${analysis.averageResponseTime}ms) suggest heavy processing`,
                    implementation: `
            // Move heavy processing to background job
            const jobId = await jobQueue.add('processRequest', {
              requestData: req.body,
              userId: req.user.id
            });
            
            res.status(202).json({
              message: 'Request accepted for processing',
              jobId,
              statusUrl: \`/api/jobs/\${jobId}/status\`
            });
          `,
                    estimatedGain: 70,
                    complexity: 'HIGH',
                    status: 'PENDING',
                    createdAt: new Date(),
                });
            }
        }
        // Create the optimizations
        const createdOptimizations = [];
        for (const opt of optimizations) {
            const id = this.createOptimization(opt);
            const created = this.optimizations.get(id);
            if (created) {
                createdOptimizations.push(created);
            }
        }
        return createdOptimizations;
    }
    startPeriodicAnalysis() {
        // Run analysis every 5 minutes
        setInterval(() => {
            this.emit('periodicAnalysis', this.generatePerformanceReport());
        }, 5 * 60 * 1000);
    }
    getMetricsForEndpoint(endpoint, method) {
        const endpointKey = `${method} ${endpoint}`;
        return this.metrics.get(endpointKey) || [];
    }
    clearMetrics(endpoint, method) {
        if (endpoint && method) {
            const endpointKey = `${method} ${endpoint}`;
            this.metrics.delete(endpointKey);
        }
        else {
            this.metrics.clear();
        }
    }
    getActiveAlerts() {
        return Array.from(this.alerts.values()).filter(alert => !alert.resolvedAt);
    }
    resolveAlert(alertId) {
        const alert = this.alerts.get(alertId);
        if (alert && !alert.resolvedAt) {
            alert.resolvedAt = new Date();
            this.emit('alertResolved', alert);
            return true;
        }
        return false;
    }
}
exports.ApiPerformanceOptimizer = ApiPerformanceOptimizer;
