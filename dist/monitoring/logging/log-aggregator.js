const fs = require('fs').promises;
const path = require('path');
const { EventEmitter } = require('events');
const zlib = require('zlib');
const { promisify } = require('util');
const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);
/**
 * Investment Platform Log Aggregation and Analysis System
 * Comprehensive log collection, aggregation, and analysis for financial services
 */
class LogAggregator extends EventEmitter {
    constructor() {
        super();
        this.logs = new Map(); // In-memory log storage
        this.indices = new Map(); // Search indices
        this.metrics = {
            totalLogs: 0,
            errorLogs: 0,
            warningLogs: 0,
            infoLogs: 0,
            debugLogs: 0,
            logsSizeBytes: 0,
            logsPerSecond: 0,
            sources: new Map(),
            patterns: new Map()
        };
        this.config = {
            retention: {
                maxLogs: parseInt(process.env.MAX_LOGS) || 100000,
                maxAge: parseInt(process.env.LOG_RETENTION_HOURS) || 168, // 7 days
                compressionAge: parseInt(process.env.LOG_COMPRESSION_HOURS) || 24, // 1 day
                cleanupInterval: parseInt(process.env.LOG_CLEANUP_INTERVAL) || 3600000 // 1 hour
            },
            parsing: {
                structured: process.env.STRUCTURED_LOGS === 'true',
                timestampFormats: [
                    'YYYY-MM-DD HH:mm:ss.SSS',
                    'YYYY-MM-DDTHH:mm:ss.SSSZ',
                    'MMM DD HH:mm:ss'
                ],
                logLevels: ['error', 'warn', 'info', 'debug', 'trace'],
                maxLineLength: parseInt(process.env.MAX_LOG_LINE_LENGTH) || 32768
            },
            analysis: {
                errorPatterns: [
                    /error|exception|failure|failed|crash|panic/i,
                    /\d{3}\s+(bad|unauthorized|forbidden|not found)/i,
                    /timeout|connection.*refused|network.*error/i
                ],
                securityPatterns: [
                    /authentication.*failed|invalid.*credentials|unauthorized.*access/i,
                    /brute.*force|suspicious.*activity|intrusion.*detected/i,
                    /sql.*injection|xss|csrf|security.*violation/i
                ],
                performancePatterns: [
                    /slow.*query|performance.*degraded|high.*latency/i,
                    /memory.*leak|out.*of.*memory|gc.*pressure/i,
                    /connection.*pool.*exhausted|too.*many.*requests/i
                ],
                businessPatterns: [
                    /trade.*executed|portfolio.*updated|transaction.*completed/i,
                    /risk.*threshold.*exceeded|compliance.*violation/i,
                    /user.*login|user.*logout|session.*expired/i
                ]
            },
            storage: {
                directory: process.env.LOG_STORAGE_DIR || path.join(__dirname, 'logs'),
                compression: process.env.LOG_COMPRESSION === 'true',
                indexing: process.env.LOG_INDEXING === 'true',
                sharding: process.env.LOG_SHARDING === 'true'
            },
            streaming: {
                enabled: process.env.LOG_STREAMING === 'true',
                batchSize: parseInt(process.env.LOG_BATCH_SIZE) || 100,
                flushInterval: parseInt(process.env.LOG_FLUSH_INTERVAL) || 5000 // 5 seconds
            },
            alerts: {
                errorThreshold: parseInt(process.env.ERROR_LOG_THRESHOLD) || 10,
                errorTimeWindow: parseInt(process.env.ERROR_TIME_WINDOW) || 300000, // 5 minutes
                securityAlertEnabled: process.env.SECURITY_ALERTS === 'true',
                performanceAlertEnabled: process.env.PERFORMANCE_ALERTS === 'true'
            }
        };
        this.buffer = []; // Streaming buffer
        this.cleanupTimer = null;
        this.flushTimer = null;
        this.alertCounts = new Map();
        this.initializeLogAggregator();
    }
    // Initialize log aggregation system
    initializeLogAggregator() {
        console.log('📝 Initializing Log Aggregator...');
        console.log(`📊 Max logs in memory: ${this.config.retention.maxLogs.toLocaleString()}`);
        console.log(`⏰ Retention period: ${this.config.retention.maxAge} hours`);
        console.log(`🗜️ Compression enabled: ${this.config.storage.compression}`);
        // Create storage directory
        this.initializeStorage();
        // Start cleanup timer
        this.startCleanupTimer();
        // Start streaming if enabled
        if (this.config.streaming.enabled) {
            this.startStreaming();
        }
        // Initialize indices
        this.initializeIndices();
        console.log('✅ Log Aggregator initialized');
    }
    // Initialize storage directory
    async initializeStorage() {
        try {
            await fs.mkdir(this.config.storage.directory, { recursive: true });
            console.log(`📁 Log storage directory: ${this.config.storage.directory}`);
        }
        catch (error) {
            console.error('Failed to create log storage directory:', error.message);
        }
    }
    // Initialize search indices
    initializeIndices() {
        if (!this.config.storage.indexing)
            return;
        this.indices.set('timestamp', new Map());
        this.indices.set('level', new Map());
        this.indices.set('source', new Map());
        this.indices.set('message', new Map());
        this.indices.set('traceId', new Map());
        console.log('🗂️ Search indices initialized');
    }
    // Ingest log entry
    ingest(logData) {
        try {
            const parsedLog = this.parseLogEntry(logData);
            const logId = this.generateLogId();
            // Add metadata
            parsedLog.id = logId;
            parsedLog.ingestedAt = Date.now();
            parsedLog.size = JSON.stringify(parsedLog).length;
            // Store in memory
            this.logs.set(logId, parsedLog);
            // Update metrics
            this.updateMetrics(parsedLog);
            // Update indices
            this.updateIndices(logId, parsedLog);
            // Add to streaming buffer
            if (this.config.streaming.enabled) {
                this.buffer.push(parsedLog);
            }
            // Analyze log for patterns
            this.analyzeLog(parsedLog);
            // Emit events
            this.emit('log', parsedLog);
            this.emit(`log:${parsedLog.level}`, parsedLog);
            // Check for alerts
            this.checkAlerts(parsedLog);
            return logId;
        }
        catch (error) {
            console.error('Failed to ingest log:', error.message);
            this.emit('error', error);
            return null;
        }
    }
    // Parse log entry from various formats
    parseLogEntry(logData) {
        let parsed = {};
        if (typeof logData === 'string') {
            // Parse unstructured log line
            parsed = this.parseUnstructuredLog(logData);
        }
        else if (typeof logData === 'object') {
            // Structured log object
            parsed = { ...logData };
        }
        else {
            throw new Error('Invalid log data format');
        }
        // Ensure required fields
        parsed.timestamp = parsed.timestamp || Date.now();
        parsed.level = this.normalizeLogLevel(parsed.level || 'info');
        parsed.message = parsed.message || parsed.msg || '';
        parsed.source = parsed.source || parsed.service || 'unknown';
        // Parse timestamp if string
        if (typeof parsed.timestamp === 'string') {
            parsed.timestamp = this.parseTimestamp(parsed.timestamp);
        }
        // Extract additional fields
        if (parsed.traceId || parsed.trace_id) {
            parsed.traceId = parsed.traceId || parsed.trace_id;
        }
        if (parsed.userId || parsed.user_id) {
            parsed.userId = parsed.userId || parsed.user_id;
        }
        if (parsed.requestId || parsed.request_id) {
            parsed.requestId = parsed.requestId || parsed.request_id;
        }
        return parsed;
    }
    // Parse unstructured log line
    parseUnstructuredLog(logLine) {
        const parsed = { raw: logLine };
        // Extract timestamp
        const timestampMatch = logLine.match(/\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(\.\d{3})?([Z\+\-]\d{2}:?\d{2})?/);
        if (timestampMatch) {
            parsed.timestamp = this.parseTimestamp(timestampMatch[0]);
        }
        // Extract log level
        const levelMatch = logLine.match(/\b(ERROR|WARN|INFO|DEBUG|TRACE|FATAL)\b/i);
        if (levelMatch) {
            parsed.level = levelMatch[1].toLowerCase();
        }
        // Extract source/service
        const sourceMatch = logLine.match(/\[([\w\-]+)\]/) || logLine.match(/service[=:]\s*(\w+)/i);
        if (sourceMatch) {
            parsed.source = sourceMatch[1];
        }
        // Extract trace ID
        const traceMatch = logLine.match(/trace[_\-]?id[=:]\s*([a-f0-9\-]+)/i);
        if (traceMatch) {
            parsed.traceId = traceMatch[1];
        }
        // Extract user ID
        const userMatch = logLine.match(/user[_\-]?id[=:]\s*(\w+)/i);
        if (userMatch) {
            parsed.userId = userMatch[1];
        }
        // The rest is the message
        parsed.message = logLine
            .replace(timestampMatch?.[0] || '', '')
            .replace(levelMatch?.[0] || '', '')
            .replace(sourceMatch?.[0] || '', '')
            .trim();
        return parsed;
    }
    // Parse timestamp from various formats
    parseTimestamp(timestampStr) {
        const timestamp = new Date(timestampStr);
        return isNaN(timestamp.getTime()) ? Date.now() : timestamp.getTime();
    }
    // Normalize log level
    normalizeLogLevel(level) {
        const normalized = level.toLowerCase();
        const mapping = {
            'fatal': 'error',
            'err': 'error',
            'warning': 'warn',
            'information': 'info',
            'verbose': 'debug'
        };
        return mapping[normalized] || normalized;
    }
    // Update metrics
    updateMetrics(log) {
        this.metrics.totalLogs++;
        this.metrics.logsPerSecond = this.calculateLogsPerSecond();
        this.metrics.logsSizeBytes += log.size;
        // Update level counts
        switch (log.level) {
            case 'error':
                this.metrics.errorLogs++;
                break;
            case 'warn':
                this.metrics.warningLogs++;
                break;
            case 'info':
                this.metrics.infoLogs++;
                break;
            case 'debug':
                this.metrics.debugLogs++;
                break;
        }
        // Update source counts
        const sourceCount = this.metrics.sources.get(log.source) || 0;
        this.metrics.sources.set(log.source, sourceCount + 1);
    }
    // Update search indices
    updateIndices(logId, log) {
        if (!this.config.storage.indexing)
            return;
        // Timestamp index (by hour)
        const hourKey = Math.floor(log.timestamp / (60 * 60 * 1000));
        this.addToIndex('timestamp', hourKey, logId);
        // Level index
        this.addToIndex('level', log.level, logId);
        // Source index
        this.addToIndex('source', log.source, logId);
        // Trace ID index
        if (log.traceId) {
            this.addToIndex('traceId', log.traceId, logId);
        }
        // Message keywords index (simple word tokenization)
        const words = log.message.toLowerCase().split(/\W+/).filter(word => word.length > 2);
        words.forEach(word => {
            this.addToIndex('message', word, logId);
        });
    }
    // Add entry to index
    addToIndex(indexName, key, logId) {
        const index = this.indices.get(indexName);
        if (!index)
            return;
        if (!index.has(key)) {
            index.set(key, new Set());
        }
        index.get(key).add(logId);
    }
    // Analyze log for patterns and anomalies
    analyzeLog(log) {
        const patterns = this.config.analysis;
        // Check error patterns
        if (this.matchesPatterns(log.message, patterns.errorPatterns)) {
            this.incrementPatternCount('error_patterns');
            this.emit('pattern:error', log);
        }
        // Check security patterns
        if (this.matchesPatterns(log.message, patterns.securityPatterns)) {
            this.incrementPatternCount('security_patterns');
            this.emit('pattern:security', log);
        }
        // Check performance patterns
        if (this.matchesPatterns(log.message, patterns.performancePatterns)) {
            this.incrementPatternCount('performance_patterns');
            this.emit('pattern:performance', log);
        }
        // Check business patterns
        if (this.matchesPatterns(log.message, patterns.businessPatterns)) {
            this.incrementPatternCount('business_patterns');
            this.emit('pattern:business', log);
        }
    }
    // Check if message matches patterns
    matchesPatterns(message, patterns) {
        return patterns.some(pattern => pattern.test(message));
    }
    // Increment pattern count
    incrementPatternCount(patternType) {
        const count = this.metrics.patterns.get(patternType) || 0;
        this.metrics.patterns.set(patternType, count + 1);
    }
    // Check for alert conditions
    checkAlerts(log) {
        const now = Date.now();
        const timeWindow = this.config.alerts.errorTimeWindow;
        // Error threshold alerts
        if (log.level === 'error') {
            const windowKey = `error_${Math.floor(now / timeWindow)}`;
            const errorCount = this.alertCounts.get(windowKey) || 0;
            this.alertCounts.set(windowKey, errorCount + 1);
            if (errorCount + 1 >= this.config.alerts.errorThreshold) {
                this.emit('alert:error_threshold', {
                    type: 'error_threshold',
                    count: errorCount + 1,
                    window: timeWindow,
                    log
                });
            }
        }
        // Security alerts
        if (this.config.alerts.securityAlertEnabled &&
            this.matchesPatterns(log.message, this.config.analysis.securityPatterns)) {
            this.emit('alert:security', {
                type: 'security_pattern',
                pattern: 'security',
                log
            });
        }
        // Performance alerts
        if (this.config.alerts.performanceAlertEnabled &&
            this.matchesPatterns(log.message, this.config.analysis.performancePatterns)) {
            this.emit('alert:performance', {
                type: 'performance_pattern',
                pattern: 'performance',
                log
            });
        }
    }
    // Search logs
    search(query) {
        const results = [];
        const options = {
            level: query.level,
            source: query.source,
            message: query.message,
            traceId: query.traceId,
            startTime: query.startTime,
            endTime: query.endTime,
            limit: query.limit || 100
        };
        // If using indices, search efficiently
        if (this.config.storage.indexing && this.canUseIndex(options)) {
            return this.searchWithIndex(options);
        }
        // Fallback to full scan
        let count = 0;
        for (const [logId, log] of this.logs.entries()) {
            if (count >= options.limit)
                break;
            if (this.matchesQuery(log, options)) {
                results.push(log);
                count++;
            }
        }
        return results.sort((a, b) => b.timestamp - a.timestamp);
    }
    // Check if can use index for search
    canUseIndex(options) {
        return options.level || options.source || options.traceId ||
            (options.message && options.message.length > 2);
    }
    // Search using indices
    searchWithIndex(options) {
        let candidateIds = new Set();
        // Get candidates from most selective index
        if (options.traceId) {
            const traceIndex = this.indices.get('traceId');
            candidateIds = traceIndex.get(options.traceId) || new Set();
        }
        else if (options.level) {
            const levelIndex = this.indices.get('level');
            candidateIds = levelIndex.get(options.level) || new Set();
        }
        else if (options.source) {
            const sourceIndex = this.indices.get('source');
            candidateIds = sourceIndex.get(options.source) || new Set();
        }
        else if (options.message) {
            const messageIndex = this.indices.get('message');
            const words = options.message.toLowerCase().split(/\W+/).filter(w => w.length > 2);
            if (words.length > 0) {
                candidateIds = messageIndex.get(words[0]) || new Set();
                for (let i = 1; i < words.length; i++) {
                    const wordIds = messageIndex.get(words[i]) || new Set();
                    candidateIds = new Set([...candidateIds].filter(id => wordIds.has(id)));
                }
            }
        }
        // Filter candidates
        const results = [];
        let count = 0;
        for (const logId of candidateIds) {
            if (count >= options.limit)
                break;
            const log = this.logs.get(logId);
            if (log && this.matchesQuery(log, options)) {
                results.push(log);
                count++;
            }
        }
        return results.sort((a, b) => b.timestamp - a.timestamp);
    }
    // Check if log matches query
    matchesQuery(log, options) {
        if (options.level && log.level !== options.level)
            return false;
        if (options.source && log.source !== options.source)
            return false;
        if (options.traceId && log.traceId !== options.traceId)
            return false;
        if (options.startTime && log.timestamp < options.startTime)
            return false;
        if (options.endTime && log.timestamp > options.endTime)
            return false;
        if (options.message) {
            const messageRegex = new RegExp(options.message.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
            if (!messageRegex.test(log.message))
                return false;
        }
        return true;
    }
    // Get logs by trace ID
    getLogsByTraceId(traceId) {
        if (this.config.storage.indexing) {
            const traceIndex = this.indices.get('traceId');
            const logIds = traceIndex.get(traceId) || new Set();
            return Array.from(logIds)
                .map(id => this.logs.get(id))
                .filter(log => log)
                .sort((a, b) => a.timestamp - b.timestamp);
        }
        // Fallback to full scan
        return Array.from(this.logs.values())
            .filter(log => log.traceId === traceId)
            .sort((a, b) => a.timestamp - b.timestamp);
    }
    // Get recent logs
    getRecentLogs(count = 100, level = null) {
        const logs = Array.from(this.logs.values())
            .filter(log => !level || log.level === level)
            .sort((a, b) => b.timestamp - a.timestamp)
            .slice(0, count);
        return logs;
    }
    // Get log statistics
    getStats() {
        const now = Date.now();
        const hourAgo = now - (60 * 60 * 1000);
        const recentLogs = Array.from(this.logs.values())
            .filter(log => log.timestamp > hourAgo);
        const recentErrors = recentLogs.filter(log => log.level === 'error').length;
        const recentWarnings = recentLogs.filter(log => log.level === 'warn').length;
        return {
            timestamp: now,
            total: {
                logs: this.metrics.totalLogs,
                errors: this.metrics.errorLogs,
                warnings: this.metrics.warningLogs,
                info: this.metrics.infoLogs,
                debug: this.metrics.debugLogs,
                sizeBytes: this.metrics.logsSizeBytes
            },
            recent: {
                logs: recentLogs.length,
                errors: recentErrors,
                warnings: recentWarnings,
                logsPerSecond: this.calculateLogsPerSecond()
            },
            sources: Object.fromEntries(this.metrics.sources.entries()),
            patterns: Object.fromEntries(this.metrics.patterns.entries()),
            memory: {
                logsInMemory: this.logs.size,
                indicesCount: this.indices.size,
                bufferSize: this.buffer.length
            }
        };
    }
    // Calculate logs per second
    calculateLogsPerSecond() {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;
        const recentLogs = Array.from(this.logs.values())
            .filter(log => log.ingestedAt > oneMinuteAgo);
        return Math.round(recentLogs.length / 60);
    }
    // Generate unique log ID
    generateLogId() {
        return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    // Start streaming buffer management
    startStreaming() {
        console.log('🌊 Starting log streaming...');
        this.flushTimer = setInterval(() => {
            this.flushBuffer();
        }, this.config.streaming.flushInterval);
    }
    // Flush streaming buffer
    async flushBuffer() {
        if (this.buffer.length === 0)
            return;
        const logsToFlush = this.buffer.splice(0, this.config.streaming.batchSize);
        try {
            await this.persistLogs(logsToFlush);
            this.emit('logs:flushed', { count: logsToFlush.length });
        }
        catch (error) {
            console.error('Failed to flush logs:', error.message);
            // Put logs back in buffer
            this.buffer.unshift(...logsToFlush);
        }
    }
    // Persist logs to storage
    async persistLogs(logs) {
        if (!this.config.storage.directory)
            return;
        const timestamp = new Date();
        const filename = `logs_${timestamp.getFullYear()}-${String(timestamp.getMonth() + 1).padStart(2, '0')}-${String(timestamp.getDate()).padStart(2, '0')}_${String(timestamp.getHours()).padStart(2, '0')}.jsonl`;
        const filepath = path.join(this.config.storage.directory, filename);
        const logLines = logs.map(log => JSON.stringify(log)).join('\n') + '\n';
        if (this.config.storage.compression) {
            const compressed = await gzip(logLines);
            await fs.appendFile(filepath + '.gz', compressed);
        }
        else {
            await fs.appendFile(filepath, logLines);
        }
    }
    // Start cleanup timer
    startCleanupTimer() {
        this.cleanupTimer = setInterval(() => {
            this.cleanupOldLogs();
        }, this.config.retention.cleanupInterval);
    }
    // Cleanup old logs
    cleanupOldLogs() {
        const now = Date.now();
        const cutoff = now - (this.config.retention.maxAge * 60 * 60 * 1000);
        let cleaned = 0;
        // Clean memory logs
        for (const [logId, log] of this.logs.entries()) {
            if (log.timestamp < cutoff) {
                this.logs.delete(logId);
                cleaned++;
            }
        }
        // Limit total logs in memory
        if (this.logs.size > this.config.retention.maxLogs) {
            const excess = this.logs.size - this.config.retention.maxLogs;
            const oldestLogs = Array.from(this.logs.entries())
                .sort(([, a], [, b]) => a.timestamp - b.timestamp)
                .slice(0, excess);
            oldestLogs.forEach(([logId]) => {
                this.logs.delete(logId);
                cleaned++;
            });
        }
        // Clean indices
        this.cleanupIndices(cutoff);
        // Clean alert counts
        this.cleanupAlertCounts();
        if (cleaned > 0) {
            console.log(`🧹 Cleaned up ${cleaned} old logs`);
        }
    }
    // Cleanup old indices
    cleanupIndices(cutoff) {
        if (!this.config.storage.indexing)
            return;
        const validLogIds = new Set(this.logs.keys());
        for (const [indexName, index] of this.indices.entries()) {
            for (const [key, logIds] of index.entries()) {
                const validIds = new Set();
                for (const logId of logIds) {
                    if (validLogIds.has(logId)) {
                        validIds.add(logId);
                    }
                }
                if (validIds.size === 0) {
                    index.delete(key);
                }
                else {
                    index.set(key, validIds);
                }
            }
        }
    }
    // Cleanup old alert counts
    cleanupAlertCounts() {
        const now = Date.now();
        const cutoff = now - (this.config.alerts.errorTimeWindow * 2);
        for (const [key, timestamp] of this.alertCounts.entries()) {
            if (timestamp < cutoff) {
                this.alertCounts.delete(key);
            }
        }
    }
    // Export logs in various formats
    async exportLogs(options = {}) {
        const logs = this.search({
            startTime: options.startTime,
            endTime: options.endTime,
            level: options.level,
            source: options.source,
            limit: options.limit || 10000
        });
        const exportDir = path.join(__dirname, 'exports');
        await fs.mkdir(exportDir, { recursive: true });
        const timestamp = Date.now();
        const filename = `logs_export_${timestamp}`;
        switch (options.format || 'json') {
            case 'json':
                const jsonFile = path.join(exportDir, `${filename}.json`);
                await fs.writeFile(jsonFile, JSON.stringify(logs, null, 2));
                console.log(`📤 Logs exported to ${jsonFile}`);
                return jsonFile;
            case 'csv':
                const csvFile = path.join(exportDir, `${filename}.csv`);
                const csvContent = this.convertToCSV(logs);
                await fs.writeFile(csvFile, csvContent);
                console.log(`📤 Logs exported to ${csvFile}`);
                return csvFile;
            case 'jsonl':
                const jsonlFile = path.join(exportDir, `${filename}.jsonl`);
                const jsonlContent = logs.map(log => JSON.stringify(log)).join('\n');
                await fs.writeFile(jsonlFile, jsonlContent);
                console.log(`📤 Logs exported to ${jsonlFile}`);
                return jsonlFile;
            default:
                throw new Error(`Unsupported export format: ${options.format}`);
        }
    }
    // Convert logs to CSV format
    convertToCSV(logs) {
        if (logs.length === 0)
            return '';
        const headers = ['timestamp', 'level', 'source', 'message', 'traceId', 'userId'];
        const csvRows = [headers.join(',')];
        logs.forEach(log => {
            const row = headers.map(header => {
                const value = log[header] || '';
                // Escape quotes and wrap in quotes if contains comma
                return typeof value === 'string' && (value.includes(',') || value.includes('"'))
                    ? `"${value.replace(/"/g, '""')}"`
                    : value;
            });
            csvRows.push(row.join(','));
        });
        return csvRows.join('\n');
    }
    // Generate log analysis report
    async generateReport() {
        const reportDir = path.join(__dirname, 'reports');
        await fs.mkdir(reportDir, { recursive: true });
        const stats = this.getStats();
        const recentErrors = this.getRecentLogs(50, 'error');
        const topSources = Array.from(this.metrics.sources.entries())
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10);
        const report = {
            generatedAt: Date.now(),
            summary: stats,
            recentErrors,
            topSources: Object.fromEntries(topSources),
            patterns: Object.fromEntries(this.metrics.patterns.entries()),
            configuration: {
                retention: this.config.retention,
                storage: this.config.storage,
                alerts: this.config.alerts
            }
        };
        const reportFile = path.join(reportDir, `log-analysis-${Date.now()}.json`);
        await fs.writeFile(reportFile, JSON.stringify(report, null, 2));
        console.log(`📊 Log analysis report generated: ${reportFile}`);
        return reportFile;
    }
    // Shutdown cleanup
    shutdown() {
        console.log('🔄 Shutting down Log Aggregator...');
        if (this.cleanupTimer) {
            clearInterval(this.cleanupTimer);
        }
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
        }
        // Flush remaining buffer
        if (this.buffer.length > 0) {
            this.flushBuffer();
        }
        // Generate final report
        this.generateReport();
        console.log('✅ Log Aggregator shutdown complete');
    }
}
// Create Express middleware for automatic log ingestion
function createLogMiddleware(aggregator) {
    return (req, res, next) => {
        const startTime = Date.now();
        // Override console methods to capture logs
        const originalConsole = {};
        ['log', 'info', 'warn', 'error', 'debug'].forEach(level => {
            originalConsole[level] = console[level];
            console[level] = (...args) => {
                const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : String(arg)).join(' ');
                aggregator.ingest({
                    level: level === 'log' ? 'info' : level,
                    message,
                    source: 'express-app',
                    traceId: req.traceContext?.traceId,
                    userId: req.user?.id,
                    requestId: req.id,
                    url: req.url,
                    method: req.method
                });
                // Call original console method
                originalConsole[level](...args);
            };
        });
        // Restore console methods after request
        res.on('finish', () => {
            Object.assign(console, originalConsole);
            // Log request completion
            aggregator.ingest({
                level: 'info',
                message: `${req.method} ${req.url} ${res.statusCode} ${Date.now() - startTime}ms`,
                source: 'express-access',
                method: req.method,
                url: req.url,
                statusCode: res.statusCode,
                responseTime: Date.now() - startTime,
                traceId: req.traceContext?.traceId,
                userId: req.user?.id
            });
        });
        next();
    };
}
module.exports = {
    LogAggregator,
    createLogMiddleware
};
