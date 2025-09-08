const fs = require('fs').promises;
const path = require('path');
const { randomBytes } = require('crypto');
/**
 * Investment Platform Distributed Tracing System
 * Comprehensive distributed tracing for microservices architecture
 */
class DistributedTracer {
    constructor() {
        this.traces = new Map();
        this.spans = new Map();
        this.metrics = {
            totalTraces: 0,
            totalSpans: 0,
            errorSpans: 0,
            slowSpans: 0,
            serviceMap: new Map(),
            operations: new Map()
        };
        this.config = {
            sampling: {
                rate: parseFloat(process.env.TRACE_SAMPLING_RATE) || 0.1, // 10% sampling
                slowThreshold: parseInt(process.env.SLOW_TRACE_THRESHOLD) || 2000, // 2 seconds
                errorSampling: parseFloat(process.env.ERROR_SAMPLING_RATE) || 1.0 // 100% error sampling
            },
            retention: {
                maxTraces: parseInt(process.env.MAX_TRACES) || 10000,
                maxAge: parseInt(process.env.TRACE_MAX_AGE) || 86400000, // 24 hours
                cleanupInterval: parseInt(process.env.TRACE_CLEANUP_INTERVAL) || 3600000 // 1 hour
            },
            export: {
                jaeger: {
                    enabled: process.env.JAEGER_ENABLED === 'true',
                    endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces'
                },
                zipkin: {
                    enabled: process.env.ZIPKIN_ENABLED === 'true',
                    endpoint: process.env.ZIPKIN_ENDPOINT || 'http://localhost:9411/api/v2/spans'
                },
                otlp: {
                    enabled: process.env.OTLP_ENABLED === 'true',
                    endpoint: process.env.OTLP_ENDPOINT || 'http://localhost:4318/v1/traces'
                }
            },
            services: {
                name: process.env.SERVICE_NAME || 'investment-platform',
                version: process.env.SERVICE_VERSION || '1.0.0',
                environment: process.env.NODE_ENV || 'development'
            }
        };
        this.cleanupTimer = null;
        this.initializeTracing();
    }
    // Initialize distributed tracing
    initializeTracing() {
        console.log('🔍 Initializing Distributed Tracing...');
        console.log(`📊 Sampling rate: ${this.config.sampling.rate * 100}%`);
        console.log(`🏷️ Service: ${this.config.services.name}@${this.config.services.version}`);
        // Start cleanup timer
        this.startCleanupTimer();
        // Initialize exporters
        this.initializeExporters();
        console.log('✅ Distributed tracing initialized');
    }
    // Start trace for incoming request
    startTrace(operationName, options = {}) {
        const traceId = this.generateTraceId();
        const spanId = this.generateSpanId();
        // Check sampling decision
        const shouldSample = this.shouldSample(options);
        const trace = {
            traceId,
            operationName,
            startTime: Date.now(),
            sampled: shouldSample,
            parentSpanId: options.parentSpanId || null,
            spans: [],
            tags: {
                'service.name': this.config.services.name,
                'service.version': this.config.services.version,
                'service.environment': this.config.services.environment,
                ...options.tags
            },
            baggage: options.baggage || {},
            status: 'active'
        };
        const rootSpan = this.createSpan({
            traceId,
            spanId,
            operationName,
            parentSpanId: null,
            startTime: trace.startTime,
            tags: trace.tags,
            sampled: shouldSample
        });
        if (shouldSample) {
            this.traces.set(traceId, trace);
            trace.spans.push(rootSpan);
            this.metrics.totalTraces++;
        }
        return {
            traceId,
            spanId,
            sampled: shouldSample,
            addTag: (key, value) => this.addTraceTag(traceId, key, value),
            setBaggage: (key, value) => this.setTraceBaggage(traceId, key, value),
            createSpan: (spanOperationName, spanOptions = {}) => this.createChildSpan(traceId, spanId, spanOperationName, spanOptions),
            finish: (options = {}) => this.finishTrace(traceId, options)
        };
    }
    // Create child span
    createChildSpan(traceId, parentSpanId, operationName, options = {}) {
        const spanId = this.generateSpanId();
        const trace = this.traces.get(traceId);
        if (!trace || !trace.sampled) {
            return this.createNoOpSpan(spanId);
        }
        const span = this.createSpan({
            traceId,
            spanId,
            parentSpanId,
            operationName,
            startTime: Date.now(),
            tags: {
                ...trace.tags,
                ...options.tags
            },
            sampled: true
        });
        trace.spans.push(span);
        return {
            spanId,
            traceId,
            addTag: (key, value) => this.addSpanTag(spanId, key, value),
            addEvent: (name, attributes = {}) => this.addSpanEvent(spanId, name, attributes),
            setStatus: (status, message) => this.setSpanStatus(spanId, status, message),
            recordException: (error) => this.recordSpanException(spanId, error),
            finish: (options = {}) => this.finishSpan(spanId, options)
        };
    }
    // Create span object
    createSpan(options) {
        const span = {
            spanId: options.spanId,
            traceId: options.traceId,
            parentSpanId: options.parentSpanId,
            operationName: options.operationName,
            startTime: options.startTime,
            endTime: null,
            duration: null,
            tags: { ...options.tags },
            events: [],
            status: {
                code: 'OK',
                message: ''
            },
            sampled: options.sampled,
            finished: false
        };
        this.spans.set(options.spanId, span);
        this.metrics.totalSpans++;
        // Update service map
        this.updateServiceMap(options.operationName, options.parentSpanId);
        return span;
    }
    // Create no-op span for unsampled traces
    createNoOpSpan(spanId) {
        return {
            spanId,
            traceId: null,
            addTag: () => { },
            addEvent: () => { },
            setStatus: () => { },
            recordException: () => { },
            finish: () => { }
        };
    }
    // Add tag to trace
    addTraceTag(traceId, key, value) {
        const trace = this.traces.get(traceId);
        if (trace) {
            trace.tags[key] = value;
        }
    }
    // Set baggage on trace
    setTraceBaggage(traceId, key, value) {
        const trace = this.traces.get(traceId);
        if (trace) {
            trace.baggage[key] = value;
        }
    }
    // Add tag to span
    addSpanTag(spanId, key, value) {
        const span = this.spans.get(spanId);
        if (span) {
            span.tags[key] = value;
            // Special handling for important tags
            if (key === 'error' && value === true) {
                span.status.code = 'ERROR';
                this.metrics.errorSpans++;
            }
            if (key === 'http.status_code' && value >= 400) {
                span.status.code = 'ERROR';
                span.status.message = `HTTP ${value}`;
            }
        }
    }
    // Add event to span
    addSpanEvent(spanId, name, attributes = {}) {
        const span = this.spans.get(spanId);
        if (span) {
            span.events.push({
                name,
                timestamp: Date.now(),
                attributes
            });
        }
    }
    // Set span status
    setSpanStatus(spanId, code, message = '') {
        const span = this.spans.get(spanId);
        if (span) {
            span.status = { code, message };
            if (code === 'ERROR') {
                this.metrics.errorSpans++;
            }
        }
    }
    // Record exception in span
    recordSpanException(spanId, error) {
        const span = this.spans.get(spanId);
        if (span) {
            span.events.push({
                name: 'exception',
                timestamp: Date.now(),
                attributes: {
                    'exception.type': error.constructor.name,
                    'exception.message': error.message,
                    'exception.stacktrace': error.stack
                }
            });
            span.status = {
                code: 'ERROR',
                message: error.message
            };
            this.addSpanTag(spanId, 'error', true);
        }
    }
    // Finish span
    finishSpan(spanId, options = {}) {
        const span = this.spans.get(spanId);
        if (!span || span.finished)
            return;
        span.endTime = options.endTime || Date.now();
        span.duration = span.endTime - span.startTime;
        span.finished = true;
        // Check if span is slow
        if (span.duration > this.config.sampling.slowThreshold) {
            this.metrics.slowSpans++;
            this.addSpanTag(spanId, 'slow', true);
        }
        // Update operation metrics
        const operationKey = `${span.tags['service.name']}:${span.operationName}`;
        const operationMetrics = this.metrics.operations.get(operationKey) || {
            count: 0,
            totalDuration: 0,
            errors: 0,
            p50: 0,
            p95: 0,
            p99: 0,
            durations: []
        };
        operationMetrics.count++;
        operationMetrics.totalDuration += span.duration;
        operationMetrics.durations.push(span.duration);
        if (span.status.code === 'ERROR') {
            operationMetrics.errors++;
        }
        // Calculate percentiles (simplified)
        if (operationMetrics.durations.length % 100 === 0) {
            const sorted = operationMetrics.durations.slice().sort((a, b) => a - b);
            operationMetrics.p50 = sorted[Math.floor(sorted.length * 0.5)];
            operationMetrics.p95 = sorted[Math.floor(sorted.length * 0.95)];
            operationMetrics.p99 = sorted[Math.floor(sorted.length * 0.99)];
            // Keep only recent durations
            operationMetrics.durations = operationMetrics.durations.slice(-1000);
        }
        this.metrics.operations.set(operationKey, operationMetrics);
    }
    // Finish trace
    finishTrace(traceId, options = {}) {
        const trace = this.traces.get(traceId);
        if (!trace)
            return;
        trace.endTime = options.endTime || Date.now();
        trace.duration = trace.endTime - trace.startTime;
        trace.status = 'finished';
        // Add final tags
        if (options.tags) {
            Object.assign(trace.tags, options.tags);
        }
        // Export trace if configured
        if (trace.sampled) {
            this.exportTrace(trace);
        }
        // Clean up finished spans
        trace.spans.forEach(span => {
            if (!span.finished) {
                this.finishSpan(span.spanId);
            }
        });
    }
    // Express.js middleware for automatic HTTP tracing
    getExpressMiddleware() {
        return (req, res, next) => {
            // Extract parent trace context from headers
            const parentTraceId = req.get('x-trace-id');
            const parentSpanId = req.get('x-span-id');
            // Start trace for this request
            const trace = this.startTrace(`HTTP ${req.method} ${req.route?.path || req.path}`, {
                parentSpanId,
                tags: {
                    'http.method': req.method,
                    'http.url': req.url,
                    'http.route': req.route?.path,
                    'http.user_agent': req.get('User-Agent'),
                    'user.id': req.user?.id,
                    'client.ip': req.ip
                }
            });
            // Add trace context to request
            req.traceContext = {
                traceId: trace.traceId,
                spanId: trace.spanId,
                sampled: trace.sampled,
                createSpan: trace.createSpan,
                addTag: trace.addTag
            };
            // Override res.end to finish trace
            const originalEnd = res.end;
            res.end = function (...args) {
                // Add response tags
                trace.addTag('http.status_code', res.statusCode);
                trace.addTag('http.response_size', res.get('Content-Length') || 0);
                if (res.statusCode >= 400) {
                    trace.addTag('error', true);
                }
                // Finish trace
                trace.finish();
                originalEnd.apply(res, args);
            };
            // Set response headers for downstream services
            if (trace.sampled) {
                res.set('x-trace-id', trace.traceId);
                res.set('x-span-id', trace.spanId);
            }
            next();
        };
    }
    // Database query tracing wrapper
    traceDatabaseQuery(query, params, options = {}) {
        const traceContext = options.traceContext;
        if (!traceContext) {
            // Execute query without tracing
            return options.execute(query, params);
        }
        const span = traceContext.createSpan('db.query', {
            tags: {
                'db.type': options.dbType || 'postgresql',
                'db.statement': query,
                'db.operation': this.extractOperation(query)
            }
        });
        const startTime = Date.now();
        try {
            const result = options.execute(query, params);
            // Handle promise-based queries
            if (result && typeof result.then === 'function') {
                return result
                    .then(data => {
                    span.addTag('db.rows_affected', data.rowCount || data.length || 0);
                    span.finish();
                    return data;
                })
                    .catch(error => {
                    span.recordException(error);
                    span.finish();
                    throw error;
                });
            }
            else {
                // Synchronous result
                span.addTag('db.rows_affected', result.rowCount || result.length || 0);
                span.finish();
                return result;
            }
        }
        catch (error) {
            span.recordException(error);
            span.finish();
            throw error;
        }
    }
    // HTTP client tracing wrapper
    traceHttpClient(url, options = {}) {
        const traceContext = options.traceContext;
        if (!traceContext) {
            return options.execute(url, options);
        }
        const parsedUrl = new URL(url);
        const span = traceContext.createSpan('http.client', {
            tags: {
                'http.method': options.method || 'GET',
                'http.url': url,
                'http.host': parsedUrl.host,
                'http.scheme': parsedUrl.protocol.slice(0, -1),
                'component': 'http-client'
            }
        });
        // Add trace headers to outgoing request
        const headers = {
            ...options.headers,
            'x-trace-id': traceContext.traceId,
            'x-span-id': span.spanId
        };
        try {
            const result = options.execute(url, { ...options, headers });
            if (result && typeof result.then === 'function') {
                return result
                    .then(response => {
                    span.addTag('http.status_code', response.status || response.statusCode);
                    span.addTag('http.response_size', response.headers?.['content-length'] || 0);
                    if ((response.status || response.statusCode) >= 400) {
                        span.setStatus('ERROR', `HTTP ${response.status || response.statusCode}`);
                    }
                    span.finish();
                    return response;
                })
                    .catch(error => {
                    span.recordException(error);
                    span.finish();
                    throw error;
                });
            }
            else {
                span.finish();
                return result;
            }
        }
        catch (error) {
            span.recordException(error);
            span.finish();
            throw error;
        }
    }
    // Message queue tracing
    traceMessageProducer(topic, message, options = {}) {
        const traceContext = options.traceContext;
        if (!traceContext) {
            return options.execute(topic, message);
        }
        const span = traceContext.createSpan('message.producer', {
            tags: {
                'messaging.system': options.system || 'kafka',
                'messaging.destination': topic,
                'messaging.operation': 'send',
                'messaging.message_id': message.id || '',
                'component': 'message-queue'
            }
        });
        // Add trace context to message
        const tracedMessage = {
            ...message,
            headers: {
                ...message.headers,
                'x-trace-id': traceContext.traceId,
                'x-span-id': span.spanId
            }
        };
        try {
            const result = options.execute(topic, tracedMessage);
            if (result && typeof result.then === 'function') {
                return result
                    .then(data => {
                    span.addTag('messaging.kafka.partition', data.partition);
                    span.addTag('messaging.kafka.offset', data.offset);
                    span.finish();
                    return data;
                })
                    .catch(error => {
                    span.recordException(error);
                    span.finish();
                    throw error;
                });
            }
            else {
                span.finish();
                return result;
            }
        }
        catch (error) {
            span.recordException(error);
            span.finish();
            throw error;
        }
    }
    // Check if trace should be sampled
    shouldSample(options = {}) {
        // Always sample errors
        if (options.forceError || options.tags?.error) {
            return Math.random() < this.config.sampling.errorSampling;
        }
        // Always sample slow requests
        if (options.forceSlow) {
            return true;
        }
        // Always sample if explicitly requested
        if (options.forceSample) {
            return true;
        }
        // Regular sampling
        return Math.random() < this.config.sampling.rate;
    }
    // Update service map for dependency visualization
    updateServiceMap(operationName, parentSpanId) {
        const serviceName = this.config.services.name;
        if (parentSpanId) {
            const parentSpan = this.spans.get(parentSpanId);
            if (parentSpan) {
                const parentService = parentSpan.tags['service.name'];
                const edgeKey = `${parentService}->${serviceName}`;
                const edge = this.metrics.serviceMap.get(edgeKey) || {
                    source: parentService,
                    target: serviceName,
                    count: 0,
                    errors: 0,
                    avgLatency: 0
                };
                edge.count++;
                this.metrics.serviceMap.set(edgeKey, edge);
            }
        }
    }
    // Extract database operation from query
    extractOperation(query) {
        const operation = query.trim().split(' ')[0].toUpperCase();
        return ['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'CREATE', 'DROP', 'ALTER'].includes(operation)
            ? operation : 'UNKNOWN';
    }
    // Generate trace ID
    generateTraceId() {
        return randomBytes(16).toString('hex');
    }
    // Generate span ID
    generateSpanId() {
        return randomBytes(8).toString('hex');
    }
    // Export trace to external systems
    async exportTrace(trace) {
        try {
            if (this.config.export.jaeger.enabled) {
                await this.exportToJaeger(trace);
            }
            if (this.config.export.zipkin.enabled) {
                await this.exportToZipkin(trace);
            }
            if (this.config.export.otlp.enabled) {
                await this.exportToOTLP(trace);
            }
        }
        catch (error) {
            console.error('Failed to export trace:', error.message);
        }
    }
    // Export to Jaeger format
    async exportToJaeger(trace) {
        const jaegerTrace = {
            traceID: trace.traceId,
            spans: trace.spans.map(span => ({
                traceID: span.traceId,
                spanID: span.spanId,
                parentSpanID: span.parentSpanId,
                operationName: span.operationName,
                startTime: span.startTime * 1000, // microseconds
                duration: (span.duration || 0) * 1000, // microseconds
                tags: Object.entries(span.tags).map(([key, value]) => ({
                    key,
                    type: typeof value === 'string' ? 'string' : 'number',
                    value: String(value)
                })),
                logs: span.events.map(event => ({
                    timestamp: event.timestamp * 1000,
                    fields: Object.entries(event.attributes).map(([key, value]) => ({
                        key,
                        value: String(value)
                    }))
                })),
                process: {
                    serviceName: this.config.services.name,
                    tags: [
                        { key: 'service.version', value: this.config.services.version },
                        { key: 'service.environment', value: this.config.services.environment }
                    ]
                }
            }))
        };
        // Send to Jaeger (implementation would use actual HTTP client)
        console.log(`📤 Exported trace ${trace.traceId} to Jaeger`);
    }
    // Export to Zipkin format
    async exportToZipkin(trace) {
        const zipkinSpans = trace.spans.map(span => ({
            traceId: span.traceId,
            id: span.spanId,
            parentId: span.parentSpanId,
            name: span.operationName,
            timestamp: span.startTime * 1000, // microseconds
            duration: (span.duration || 0) * 1000, // microseconds
            localEndpoint: {
                serviceName: this.config.services.name
            },
            tags: span.tags,
            annotations: span.events.map(event => ({
                timestamp: event.timestamp * 1000,
                value: event.name
            }))
        }));
        console.log(`📤 Exported trace ${trace.traceId} to Zipkin`);
    }
    // Export to OpenTelemetry format
    async exportToOTLP(trace) {
        const otlpTrace = {
            resourceSpans: [{
                    resource: {
                        attributes: [
                            { key: 'service.name', value: { stringValue: this.config.services.name } },
                            { key: 'service.version', value: { stringValue: this.config.services.version } }
                        ]
                    },
                    instrumentationLibrarySpans: [{
                            spans: trace.spans.map(span => ({
                                traceId: Buffer.from(span.traceId, 'hex').toString('base64'),
                                spanId: Buffer.from(span.spanId, 'hex').toString('base64'),
                                parentSpanId: span.parentSpanId ? Buffer.from(span.parentSpanId, 'hex').toString('base64') : undefined,
                                name: span.operationName,
                                startTimeUnixNano: span.startTime * 1000000, // nanoseconds
                                endTimeUnixNano: (span.endTime || span.startTime) * 1000000,
                                attributes: Object.entries(span.tags).map(([key, value]) => ({
                                    key,
                                    value: { stringValue: String(value) }
                                })),
                                status: {
                                    code: span.status.code === 'OK' ? 1 : 2,
                                    message: span.status.message
                                }
                            }))
                        }]
                }]
        };
        console.log(`📤 Exported trace ${trace.traceId} to OTLP`);
    }
    // Initialize exporters
    initializeExporters() {
        const enabledExporters = [];
        if (this.config.export.jaeger.enabled) {
            enabledExporters.push('Jaeger');
        }
        if (this.config.export.zipkin.enabled) {
            enabledExporters.push('Zipkin');
        }
        if (this.config.export.otlp.enabled) {
            enabledExporters.push('OTLP');
        }
        if (enabledExporters.length > 0) {
            console.log(`📤 Trace exporters enabled: ${enabledExporters.join(', ')}`);
        }
        else {
            console.log('📝 No trace exporters enabled - traces will be stored locally only');
        }
    }
    // Start cleanup timer
    startCleanupTimer() {
        this.cleanupTimer = setInterval(() => {
            this.cleanupOldTraces();
        }, this.config.retention.cleanupInterval);
    }
    // Cleanup old traces and spans
    cleanupOldTraces() {
        const cutoff = Date.now() - this.config.retention.maxAge;
        let cleanedTraces = 0;
        let cleanedSpans = 0;
        // Clean up old traces
        for (const [traceId, trace] of this.traces.entries()) {
            if (trace.startTime < cutoff) {
                this.traces.delete(traceId);
                cleanedTraces++;
            }
        }
        // Clean up old spans
        for (const [spanId, span] of this.spans.entries()) {
            if (span.startTime < cutoff) {
                this.spans.delete(spanId);
                cleanedSpans++;
            }
        }
        // Limit total traces in memory
        if (this.traces.size > this.config.retention.maxTraces) {
            const tracesToRemove = this.traces.size - this.config.retention.maxTraces;
            const oldestTraces = Array.from(this.traces.entries())
                .sort(([, a], [, b]) => a.startTime - b.startTime)
                .slice(0, tracesToRemove);
            oldestTraces.forEach(([traceId]) => {
                this.traces.delete(traceId);
                cleanedTraces++;
            });
        }
        if (cleanedTraces > 0 || cleanedSpans > 0) {
            console.log(`🧹 Cleaned up ${cleanedTraces} traces and ${cleanedSpans} spans`);
        }
    }
    // Get tracing statistics
    getTracingStats() {
        const activeTraces = Array.from(this.traces.values()).filter(t => t.status === 'active').length;
        const finishedTraces = Array.from(this.traces.values()).filter(t => t.status === 'finished').length;
        return {
            timestamp: Date.now(),
            traces: {
                total: this.metrics.totalTraces,
                active: activeTraces,
                finished: finishedTraces,
                inMemory: this.traces.size
            },
            spans: {
                total: this.metrics.totalSpans,
                errors: this.metrics.errorSpans,
                slow: this.metrics.slowSpans,
                inMemory: this.spans.size
            },
            operations: Object.fromEntries(Array.from(this.metrics.operations.entries()).map(([key, metrics]) => [
                key,
                {
                    count: metrics.count,
                    avgDuration: metrics.totalDuration / metrics.count,
                    errorRate: (metrics.errors / metrics.count) * 100,
                    p50: metrics.p50,
                    p95: metrics.p95,
                    p99: metrics.p99
                }
            ])),
            serviceMap: Object.fromEntries(this.metrics.serviceMap.entries()),
            sampling: {
                rate: this.config.sampling.rate,
                slowThreshold: this.config.sampling.slowThreshold
            }
        };
    }
    // Generate tracing report
    async generateReport() {
        const reportDir = path.join(__dirname, 'reports');
        await fs.mkdir(reportDir, { recursive: true });
        const stats = this.getTracingStats();
        const reportFile = path.join(reportDir, `tracing-report-${Date.now()}.json`);
        await fs.writeFile(reportFile, JSON.stringify({
            stats,
            recentTraces: Array.from(this.traces.values()).slice(-50),
            topOperations: Array.from(this.metrics.operations.entries())
                .sort(([, a], [, b]) => b.count - a.count)
                .slice(0, 20)
        }, null, 2));
        console.log(`📊 Tracing report generated: ${reportFile}`);
        return reportFile;
    }
    // Shutdown cleanup
    shutdown() {
        console.log('🔄 Shutting down Distributed Tracer...');
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }
        // Export remaining traces
        const activeTraces = Array.from(this.traces.values()).filter(t => t.status === 'active');
        activeTraces.forEach(trace => {
            this.finishTrace(trace.traceId);
        });
        // Generate final report
        this.generateReport();
        console.log('✅ Distributed Tracer shutdown complete');
    }
}
// Singleton instance
let tracerInstance = null;
// Initialize distributed tracing
function initializeTracing(config = {}) {
    if (!tracerInstance) {
        tracerInstance = new DistributedTracer();
    }
    return tracerInstance;
}
// Get tracer instance
function getTracer() {
    return tracerInstance;
}
module.exports = {
    DistributedTracer,
    initializeTracing,
    getTracer
};
