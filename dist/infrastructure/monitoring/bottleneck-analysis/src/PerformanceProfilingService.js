"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceProfilingService = void 0;
const events_1 = require("events");
const PerformanceDataModel_1 = require("./PerformanceDataModel");
class PerformanceProfilingService extends events_1.EventEmitter {
    config;
    activeProfiles = new Map();
    completedProfiles = new Map();
    profilingIntervals = new Map();
    metricsCollectors = new Map();
    constructor(config) {
        super();
        this.config = config;
        this.initializeMetricsCollectors();
        this.startBackgroundTasks();
    }
    initializeMetricsCollectors() {
        // Application profiler
        this.metricsCollectors.set(PerformanceDataModel_1.PerformanceDataSource.APPLICATION_PROFILER, {
            collect: async (context) => this.collectApplicationMetrics(context),
            enabled: true
        });
        // System monitor
        this.metricsCollectors.set(PerformanceDataModel_1.PerformanceDataSource.SYSTEM_MONITOR, {
            collect: async (context) => this.collectSystemMetrics(context),
            enabled: true
        });
        // Database profiler
        this.metricsCollectors.set(PerformanceDataModel_1.PerformanceDataSource.DATABASE_PROFILER, {
            collect: async (context) => this.collectDatabaseMetrics(context),
            enabled: true
        });
        // Network monitor
        this.metricsCollectors.set(PerformanceDataModel_1.PerformanceDataSource.NETWORK_MONITOR, {
            collect: async (context) => this.collectNetworkMetrics(context),
            enabled: true
        });
        // Custom instrumentation
        this.metricsCollectors.set(PerformanceDataModel_1.PerformanceDataSource.CUSTOM_INSTRUMENTATION, {
            collect: async (context) => this.collectCustomMetrics(context),
            enabled: this.config.enableAdvancedMetrics
        });
    }
    async startProfiling(targetId, targetType, configuration) {
        const profileId = this.generateProfileId();
        if (this.activeProfiles.size >= this.config.maxConcurrentProfiles) {
            throw new Error('Maximum concurrent profiles limit reached');
        }
        const defaultConfig = {
            sampling_rate: this.config.defaultSamplingRate,
            include_memory_profiling: true,
            include_cpu_profiling: true,
            include_io_profiling: true,
            include_network_profiling: true,
            include_database_profiling: true,
            include_cache_profiling: true,
            custom_metrics: [],
            filters: [],
            thresholds: []
        };
        const finalConfig = { ...defaultConfig, ...configuration };
        const profile = {
            id: profileId,
            target_id: targetId,
            target_type: targetType,
            start_time: new Date(),
            end_time: new Date(),
            duration_ms: 0,
            status: PerformanceDataModel_1.ProfileStatus.RUNNING,
            metrics: [],
            bottlenecks: [],
            summary: this.createEmptyProfileSummary(),
            configuration: finalConfig
        };
        this.activeProfiles.set(profileId, profile);
        // Start metrics collection
        this.startMetricsCollection(profileId, finalConfig);
        // Set maximum duration timeout
        setTimeout(() => {
            if (this.activeProfiles.has(profileId)) {
                this.stopProfiling(profileId);
            }
        }, this.config.maxProfileDuration);
        this.emit('profilingStarted', { profileId, targetId, targetType, timestamp: new Date() });
        return profileId;
    }
    async stopProfiling(profileId) {
        const profile = this.activeProfiles.get(profileId);
        if (!profile) {
            throw new Error(`Profile ${profileId} not found`);
        }
        // Stop metrics collection
        this.stopMetricsCollection(profileId);
        // Update profile
        profile.end_time = new Date();
        profile.duration_ms = profile.end_time.getTime() - profile.start_time.getTime();
        profile.status = PerformanceDataModel_1.ProfileStatus.COMPLETED;
        profile.summary = await this.generateProfileSummary(profile);
        // Move to completed profiles
        this.activeProfiles.delete(profileId);
        this.completedProfiles.set(profileId, profile);
        this.emit('profilingCompleted', {
            profileId,
            profile,
            duration: profile.duration_ms,
            timestamp: new Date()
        });
        return profile;
    }
    startMetricsCollection(profileId, configuration) {
        const interval = setInterval(async () => {
            try {
                await this.collectMetricsForProfile(profileId, configuration);
            }
            catch (error) {
                console.error(`Metrics collection failed for profile ${profileId}:`, error.message);
                this.emit('metricsCollectionError', { profileId, error: error.message, timestamp: new Date() });
            }
        }, 1000 / configuration.sampling_rate);
        this.profilingIntervals.set(profileId, interval);
    }
    stopMetricsCollection(profileId) {
        const interval = this.profilingIntervals.get(profileId);
        if (interval) {
            clearInterval(interval);
            this.profilingIntervals.delete(profileId);
        }
    }
    async collectMetricsForProfile(profileId, configuration) {
        const profile = this.activeProfiles.get(profileId);
        if (!profile)
            return;
        const context = {
            service_name: profile.target_id,
            environment: process.env.NODE_ENV || 'development',
            version: '1.0.0',
            load_level: this.determineLoadLevel()
        };
        const metrics = [];
        // Collect metrics from enabled sources
        for (const [source, collector] of this.metricsCollectors) {
            if (!collector.enabled)
                continue;
            try {
                const sourceMetrics = await collector.collect(context);
                metrics.push(...sourceMetrics);
            }
            catch (error) {
                console.warn(`Failed to collect metrics from ${source}:`, error.message);
            }
        }
        // Add metrics to profile
        profile.metrics.push(...metrics);
        // Emit real-time streaming if enabled
        if (this.config.enableRealtimeStreaming) {
            this.emit('metricsCollected', {
                profileId,
                metrics,
                timestamp: new Date()
            });
        }
    }
    async collectApplicationMetrics(context) {
        const metrics = [];
        const timestamp = new Date();
        // CPU metrics
        const cpuUsage = process.cpuUsage();
        metrics.push({
            id: this.generateMetricId(),
            timestamp,
            source: PerformanceDataModel_1.PerformanceDataSource.APPLICATION_PROFILER,
            category: PerformanceDataModel_1.PerformanceCategory.CPU,
            metric_type: PerformanceDataModel_1.PerformanceMetricType.CPU_USAGE,
            value: (cpuUsage.user + cpuUsage.system) / 1000, // Convert to milliseconds
            unit: 'ms',
            context,
            tags: { component: 'nodejs', process: 'main' }
        });
        // Memory metrics
        const memoryUsage = process.memoryUsage();
        metrics.push({
            id: this.generateMetricId(),
            timestamp,
            source: PerformanceDataModel_1.PerformanceDataSource.APPLICATION_PROFILER,
            category: PerformanceDataModel_1.PerformanceCategory.MEMORY,
            metric_type: PerformanceDataModel_1.PerformanceMetricType.MEMORY_USAGE,
            value: memoryUsage.heapUsed / 1024 / 1024, // Convert to MB
            unit: 'MB',
            context,
            tags: { type: 'heap_used' }
        }, {
            id: this.generateMetricId(),
            timestamp,
            source: PerformanceDataModel_1.PerformanceDataSource.APPLICATION_PROFILER,
            category: PerformanceDataModel_1.PerformanceCategory.MEMORY,
            metric_type: PerformanceDataModel_1.PerformanceMetricType.MEMORY_USAGE,
            value: memoryUsage.heapTotal / 1024 / 1024,
            unit: 'MB',
            context,
            tags: { type: 'heap_total' }
        });
        // Event loop lag
        const eventLoopLag = this.measureEventLoopLag();
        metrics.push({
            id: this.generateMetricId(),
            timestamp,
            source: PerformanceDataModel_1.PerformanceDataSource.APPLICATION_PROFILER,
            category: PerformanceDataModel_1.PerformanceCategory.APPLICATION,
            metric_type: PerformanceDataModel_1.PerformanceMetricType.RESPONSE_TIME,
            value: eventLoopLag,
            unit: 'ms',
            context,
            tags: { component: 'event_loop' }
        });
        return metrics;
    }
    async collectSystemMetrics(context) {
        const metrics = [];
        const timestamp = new Date();
        try {
            // System load average (Unix-like systems)
            if (process.platform !== 'win32') {
                const os = require('os');
                const loadAvg = os.loadavg();
                metrics.push({
                    id: this.generateMetricId(),
                    timestamp,
                    source: PerformanceDataModel_1.PerformanceDataSource.SYSTEM_MONITOR,
                    category: PerformanceDataModel_1.PerformanceCategory.CPU,
                    metric_type: PerformanceDataModel_1.PerformanceMetricType.CPU_USAGE,
                    value: loadAvg[0], // 1-minute load average
                    unit: 'load',
                    context,
                    tags: { period: '1min' }
                });
                // Free memory
                const freeMemory = os.freemem() / 1024 / 1024 / 1024; // Convert to GB
                const totalMemory = os.totalmem() / 1024 / 1024 / 1024;
                metrics.push({
                    id: this.generateMetricId(),
                    timestamp,
                    source: PerformanceDataModel_1.PerformanceDataSource.SYSTEM_MONITOR,
                    category: PerformanceDataModel_1.PerformanceCategory.MEMORY,
                    metric_type: PerformanceDataModel_1.PerformanceMetricType.MEMORY_USAGE,
                    value: (totalMemory - freeMemory) / totalMemory * 100,
                    unit: '%',
                    context,
                    tags: { type: 'system_memory_usage' }
                });
            }
        }
        catch (error) {
            console.warn('Failed to collect system metrics:', error.message);
        }
        return metrics;
    }
    async collectDatabaseMetrics(context) {
        const metrics = [];
        const timestamp = new Date();
        // Simulate database query metrics
        // In a real implementation, this would integrate with database monitoring tools
        const queryTime = Math.random() * 100 + 10; // Simulated query time
        metrics.push({
            id: this.generateMetricId(),
            timestamp,
            source: PerformanceDataModel_1.PerformanceDataSource.DATABASE_PROFILER,
            category: PerformanceDataModel_1.PerformanceCategory.DATABASE,
            metric_type: PerformanceDataModel_1.PerformanceMetricType.DATABASE_QUERY_TIME,
            value: queryTime,
            unit: 'ms',
            context,
            tags: { database: 'postgresql', query_type: 'select' }
        });
        return metrics;
    }
    async collectNetworkMetrics(context) {
        const metrics = [];
        const timestamp = new Date();
        // Simulate network metrics
        // In a real implementation, this would integrate with network monitoring tools
        const networkLatency = Math.random() * 50 + 5; // Simulated network latency
        metrics.push({
            id: this.generateMetricId(),
            timestamp,
            source: PerformanceDataModel_1.PerformanceDataSource.NETWORK_MONITOR,
            category: PerformanceDataModel_1.PerformanceCategory.NETWORK,
            metric_type: PerformanceDataModel_1.PerformanceMetricType.NETWORK_IO,
            value: networkLatency,
            unit: 'ms',
            context,
            tags: { type: 'latency', destination: 'external_api' }
        });
        return metrics;
    }
    async collectCustomMetrics(context) {
        const metrics = [];
        // Custom business logic metrics would be collected here
        // This is a placeholder for application-specific metrics
        return metrics;
    }
    measureEventLoopLag() {
        const start = process.hrtime.bigint();
        return new Promise((resolve) => {
            setImmediate(() => {
                const lag = Number(process.hrtime.bigint() - start) / 1000000; // Convert to milliseconds
                resolve(lag);
            });
        }); // Type assertion for immediate return
    }
    determineLoadLevel() {
        const cpuUsage = process.cpuUsage();
        const totalCpuTime = cpuUsage.user + cpuUsage.system;
        if (totalCpuTime < 100000)
            return PerformanceDataModel_1.LoadLevel.LOW;
        if (totalCpuTime < 500000)
            return PerformanceDataModel_1.LoadLevel.MEDIUM;
        if (totalCpuTime < 1000000)
            return PerformanceDataModel_1.LoadLevel.HIGH;
        return PerformanceDataModel_1.LoadLevel.PEAK;
    }
    createEmptyProfileSummary() {
        return {
            total_duration_ms: 0,
            cpu_time_ms: 0,
            wall_time_ms: 0,
            memory_peak_mb: 0,
            memory_average_mb: 0,
            io_operations: 0,
            network_requests: 0,
            database_queries: 0,
            cache_hits: 0,
            cache_misses: 0,
            bottleneck_count: 0,
            performance_score: 0,
            efficiency_rating: PerformanceDataModel_1.EfficiencyRating.FAIR
        };
    }
    async generateProfileSummary(profile) {
        const metrics = profile.metrics;
        const cpuMetrics = metrics.filter(m => m.category === PerformanceDataModel_1.PerformanceCategory.CPU);
        const memoryMetrics = metrics.filter(m => m.category === PerformanceDataModel_1.PerformanceCategory.MEMORY);
        const databaseMetrics = metrics.filter(m => m.category === PerformanceDataModel_1.PerformanceCategory.DATABASE);
        const networkMetrics = metrics.filter(m => m.category === PerformanceDataModel_1.PerformanceCategory.NETWORK);
        const summary = {
            total_duration_ms: profile.duration_ms,
            cpu_time_ms: cpuMetrics.reduce((sum, m) => sum + m.value, 0),
            wall_time_ms: profile.duration_ms,
            memory_peak_mb: Math.max(...memoryMetrics.map(m => m.value), 0),
            memory_average_mb: memoryMetrics.reduce((sum, m) => sum + m.value, 0) / Math.max(memoryMetrics.length, 1),
            io_operations: metrics.filter(m => m.category === PerformanceDataModel_1.PerformanceCategory.IO).length,
            network_requests: networkMetrics.length,
            database_queries: databaseMetrics.length,
            cache_hits: 0, // Would be calculated from cache metrics
            cache_misses: 0,
            bottleneck_count: profile.bottlenecks.length,
            performance_score: this.calculatePerformanceScore(metrics),
            efficiency_rating: this.calculateEfficiencyRating(metrics)
        };
        return summary;
    }
    calculatePerformanceScore(metrics) {
        if (metrics.length === 0)
            return 0;
        // Simple scoring algorithm based on various performance indicators
        let score = 100;
        // CPU penalty
        const avgCpuUsage = metrics
            .filter(m => m.category === PerformanceDataModel_1.PerformanceCategory.CPU)
            .reduce((sum, m, _, arr) => sum + m.value / arr.length, 0);
        if (avgCpuUsage > 80)
            score -= 20;
        else if (avgCpuUsage > 60)
            score -= 10;
        // Memory penalty
        const avgMemoryUsage = metrics
            .filter(m => m.category === PerformanceDataModel_1.PerformanceCategory.MEMORY)
            .reduce((sum, m, _, arr) => sum + m.value / arr.length, 0);
        if (avgMemoryUsage > 80)
            score -= 20;
        else if (avgMemoryUsage > 60)
            score -= 10;
        // Response time penalty
        const avgResponseTime = metrics
            .filter(m => m.metric_type === PerformanceDataModel_1.PerformanceMetricType.RESPONSE_TIME)
            .reduce((sum, m, _, arr) => sum + m.value / arr.length, 0);
        if (avgResponseTime > 1000)
            score -= 30;
        else if (avgResponseTime > 500)
            score -= 15;
        else if (avgResponseTime > 200)
            score -= 5;
        return Math.max(0, Math.min(100, score));
    }
    calculateEfficiencyRating(metrics) {
        const score = this.calculatePerformanceScore(metrics);
        if (score >= 90)
            return PerformanceDataModel_1.EfficiencyRating.EXCELLENT;
        if (score >= 80)
            return PerformanceDataModel_1.EfficiencyRating.GOOD;
        if (score >= 60)
            return PerformanceDataModel_1.EfficiencyRating.FAIR;
        if (score >= 40)
            return PerformanceDataModel_1.EfficiencyRating.POOR;
        return PerformanceDataModel_1.EfficiencyRating.CRITICAL;
    }
    startBackgroundTasks() {
        // Auto-profiling based on performance thresholds
        if (this.config.autoProfilingEnabled) {
            setInterval(() => {
                this.checkAutoProfilingTriggers();
            }, 60000); // Check every minute
        }
        // Cleanup old completed profiles
        setInterval(() => {
            this.cleanupOldProfiles();
        }, 3600000); // Cleanup every hour
    }
    async checkAutoProfilingTriggers() {
        try {
            const currentMetrics = await this.collectCurrentSystemMetrics();
            for (const metric of currentMetrics) {
                if (this.shouldTriggerAutoProfiling(metric)) {
                    const profileId = await this.startProfiling('auto-triggered', PerformanceDataModel_1.ProfileTargetType.SYSTEM_COMPONENT);
                    this.emit('autoProfilingTriggered', {
                        profileId,
                        trigger: metric,
                        timestamp: new Date()
                    });
                    break; // Only start one auto-profile at a time
                }
            }
        }
        catch (error) {
            console.error('Auto-profiling trigger check failed:', error.message);
        }
    }
    async collectCurrentSystemMetrics() {
        const context = {
            service_name: 'system',
            environment: process.env.NODE_ENV || 'development',
            version: '1.0.0',
            load_level: PerformanceDataModel_1.LoadLevel.MEDIUM
        };
        return this.collectSystemMetrics(context);
    }
    shouldTriggerAutoProfiling(metric) {
        // CPU usage threshold
        if (metric.metric_type === PerformanceDataModel_1.PerformanceMetricType.CPU_USAGE &&
            metric.value > this.config.autoProfilingThreshold) {
            return true;
        }
        // Memory usage threshold
        if (metric.metric_type === PerformanceDataModel_1.PerformanceMetricType.MEMORY_USAGE &&
            metric.value > this.config.autoProfilingThreshold) {
            return true;
        }
        return false;
    }
    cleanupOldProfiles() {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.config.storageRetentionDays);
        const profilesToDelete = [];
        for (const [profileId, profile] of this.completedProfiles) {
            if (profile.end_time < cutoffDate) {
                profilesToDelete.push(profileId);
            }
        }
        for (const profileId of profilesToDelete) {
            this.completedProfiles.delete(profileId);
        }
        if (profilesToDelete.length > 0) {
            this.emit('profilesCleanedUp', {
                count: profilesToDelete.length,
                timestamp: new Date()
            });
        }
    }
    // Public API methods
    getActiveProfiles() {
        return Array.from(this.activeProfiles.values());
    }
    getCompletedProfiles() {
        return Array.from(this.completedProfiles.values());
    }
    getProfile(profileId) {
        return this.activeProfiles.get(profileId) || this.completedProfiles.get(profileId);
    }
    async getProfilesByTarget(targetId) {
        const profiles = [];
        for (const profile of this.completedProfiles.values()) {
            if (profile.target_id === targetId) {
                profiles.push(profile);
            }
        }
        return profiles;
    }
    getProfilingStatistics() {
        return {
            active_profiles: this.activeProfiles.size,
            completed_profiles: this.completedProfiles.size,
            auto_profiling_enabled: this.config.autoProfilingEnabled,
            max_concurrent_profiles: this.config.maxConcurrentProfiles,
            storage_retention_days: this.config.storageRetentionDays
        };
    }
    generateProfileId() {
        return `profile_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateMetricId() {
        return `metric_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    async shutdown() {
        // Stop all active profiling
        const activeProfileIds = Array.from(this.activeProfiles.keys());
        for (const profileId of activeProfileIds) {
            try {
                await this.stopProfiling(profileId);
            }
            catch (error) {
                console.error(`Failed to stop profile ${profileId}:`, error.message);
            }
        }
        // Clear intervals
        for (const interval of this.profilingIntervals.values()) {
            clearInterval(interval);
        }
        this.profilingIntervals.clear();
        console.log('Performance Profiling Service shutdown complete');
    }
}
exports.PerformanceProfilingService = PerformanceProfilingService;
