"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RootCauseAnalysisService = exports.ActionType = exports.ComparisonOperator = exports.ConditionType = void 0;
const events_1 = require("events");
const PerformanceDataModel_1 = require("./PerformanceDataModel");
var ConditionType;
(function (ConditionType) {
    ConditionType["METRIC_THRESHOLD"] = "metric_threshold";
    ConditionType["METRIC_TREND"] = "metric_trend";
    ConditionType["METRIC_CORRELATION"] = "metric_correlation";
    ConditionType["PATTERN_MATCH"] = "pattern_match";
    ConditionType["HISTORICAL_COMPARISON"] = "historical_comparison";
})(ConditionType || (exports.ConditionType = ConditionType = {}));
var ComparisonOperator;
(function (ComparisonOperator) {
    ComparisonOperator["GREATER_THAN"] = "gt";
    ComparisonOperator["LESS_THAN"] = "lt";
    ComparisonOperator["EQUALS"] = "eq";
    ComparisonOperator["GREATER_THAN_OR_EQUAL"] = "gte";
    ComparisonOperator["LESS_THAN_OR_EQUAL"] = "lte";
    ComparisonOperator["BETWEEN"] = "between";
})(ComparisonOperator || (exports.ComparisonOperator = ComparisonOperator = {}));
var ActionType;
(function (ActionType) {
    ActionType["GENERATE_ROOT_CAUSE"] = "generate_root_cause";
    ActionType["COLLECT_EVIDENCE"] = "collect_evidence";
    ActionType["SUGGEST_FIX"] = "suggest_fix";
    ActionType["ESCALATE_ANALYSIS"] = "escalate_analysis";
})(ActionType || (exports.ActionType = ActionType = {}));
class RootCauseAnalysisService extends events_1.EventEmitter {
    config;
    analysisRules = new Map();
    analyzedBottlenecks = new Map();
    historicalAnalyses = new Map();
    patternDatabase = new Map();
    constructor(config) {
        super();
        this.config = config;
        this.initializeAnalysisRules();
        this.initializePatternDatabase();
    }
    initializeAnalysisRules() {
        // CPU-related rules
        this.analysisRules.set('cpu_high_usage', {
            id: 'cpu_high_usage',
            name: 'High CPU Usage Analysis',
            category: PerformanceDataModel_1.RootCauseCategory.CODE_INEFFICIENCY,
            conditions: [
                {
                    type: ConditionType.METRIC_THRESHOLD,
                    metric: PerformanceDataModel_1.PerformanceMetricType.CPU_USAGE,
                    operator: ComparisonOperator.GREATER_THAN,
                    value: 80
                }
            ],
            action: {
                type: ActionType.GENERATE_ROOT_CAUSE,
                description: 'Analyze high CPU usage patterns',
                evidenceGenerator: this.generateCpuEvidences.bind(this),
                fixSuggestionGenerator: this.generateCpuFixSuggestions.bind(this)
            },
            confidence: 0.85,
            enabled: true
        });
        // Memory-related rules
        this.analysisRules.set('memory_leak', {
            id: 'memory_leak',
            name: 'Memory Leak Detection',
            category: PerformanceDataModel_1.RootCauseCategory.CODE_INEFFICIENCY,
            conditions: [
                {
                    type: ConditionType.METRIC_TREND,
                    metric: PerformanceDataModel_1.PerformanceMetricType.MEMORY_USAGE,
                    operator: ComparisonOperator.GREATER_THAN,
                    value: 0.1, // 10% increase trend
                    timeWindow: 300000 // 5 minutes
                }
            ],
            action: {
                type: ActionType.GENERATE_ROOT_CAUSE,
                description: 'Analyze memory leak patterns',
                evidenceGenerator: this.generateMemoryLeakEvidences.bind(this),
                fixSuggestionGenerator: this.generateMemoryLeakFixSuggestions.bind(this)
            },
            confidence: 0.9,
            enabled: true
        });
        // Database-related rules
        this.analysisRules.set('slow_queries', {
            id: 'slow_queries',
            name: 'Slow Database Query Analysis',
            category: PerformanceDataModel_1.RootCauseCategory.DATA_ISSUE,
            conditions: [
                {
                    type: ConditionType.METRIC_THRESHOLD,
                    metric: PerformanceDataModel_1.PerformanceMetricType.DATABASE_QUERY_TIME,
                    operator: ComparisonOperator.GREATER_THAN,
                    value: 1000 // 1 second
                }
            ],
            action: {
                type: ActionType.GENERATE_ROOT_CAUSE,
                description: 'Analyze slow database queries',
                evidenceGenerator: this.generateSlowQueryEvidences.bind(this),
                fixSuggestionGenerator: this.generateSlowQueryFixSuggestions.bind(this)
            },
            confidence: 0.8,
            enabled: true
        });
        // Network-related rules
        this.analysisRules.set('network_latency', {
            id: 'network_latency',
            name: 'High Network Latency Analysis',
            category: PerformanceDataModel_1.RootCauseCategory.EXTERNAL_DEPENDENCY,
            conditions: [
                {
                    type: ConditionType.METRIC_THRESHOLD,
                    metric: PerformanceDataModel_1.PerformanceMetricType.NETWORK_IO,
                    operator: ComparisonOperator.GREATER_THAN,
                    value: 200 // 200ms
                }
            ],
            action: {
                type: ActionType.GENERATE_ROOT_CAUSE,
                description: 'Analyze network latency issues',
                evidenceGenerator: this.generateNetworkEvidences.bind(this),
                fixSuggestionGenerator: this.generateNetworkFixSuggestions.bind(this)
            },
            confidence: 0.75,
            enabled: true
        });
        // I/O-related rules
        this.analysisRules.set('disk_io_bottleneck', {
            id: 'disk_io_bottleneck',
            name: 'Disk I/O Bottleneck Analysis',
            category: PerformanceDataModel_1.RootCauseCategory.INFRASTRUCTURE_LIMIT,
            conditions: [
                {
                    type: ConditionType.METRIC_THRESHOLD,
                    metric: PerformanceDataModel_1.PerformanceMetricType.DISK_IO,
                    operator: ComparisonOperator.GREATER_THAN,
                    value: 100 // 100ms
                }
            ],
            action: {
                type: ActionType.GENERATE_ROOT_CAUSE,
                description: 'Analyze disk I/O performance issues',
                evidenceGenerator: this.generateDiskIoEvidences.bind(this),
                fixSuggestionGenerator: this.generateDiskIoFixSuggestions.bind(this)
            },
            confidence: 0.8,
            enabled: true
        });
        // Lock contention rules
        this.analysisRules.set('lock_contention', {
            id: 'lock_contention',
            name: 'Lock Contention Analysis',
            category: PerformanceDataModel_1.RootCauseCategory.ARCHITECTURAL_ISSUE,
            conditions: [
                {
                    type: ConditionType.PATTERN_MATCH,
                    operator: ComparisonOperator.EQUALS,
                    value: 1 // Pattern match for lock contention
                }
            ],
            action: {
                type: ActionType.GENERATE_ROOT_CAUSE,
                description: 'Analyze lock contention patterns',
                evidenceGenerator: this.generateLockContentionEvidences.bind(this),
                fixSuggestionGenerator: this.generateLockContentionFixSuggestions.bind(this)
            },
            confidence: 0.7,
            enabled: true
        });
        // Garbage collection rules
        this.analysisRules.set('gc_overhead', {
            id: 'gc_overhead',
            name: 'Garbage Collection Overhead Analysis',
            category: PerformanceDataModel_1.RootCauseCategory.CONFIGURATION_ERROR,
            conditions: [
                {
                    type: ConditionType.METRIC_THRESHOLD,
                    metric: PerformanceDataModel_1.PerformanceMetricType.GARBAGE_COLLECTION_TIME,
                    operator: ComparisonOperator.GREATER_THAN,
                    value: 100 // 100ms GC time
                }
            ],
            action: {
                type: ActionType.GENERATE_ROOT_CAUSE,
                description: 'Analyze garbage collection overhead',
                evidenceGenerator: this.generateGcEvidences.bind(this),
                fixSuggestionGenerator: this.generateGcFixSuggestions.bind(this)
            },
            confidence: 0.85,
            enabled: true
        });
    }
    initializePatternDatabase() {
        // Common performance patterns
        this.patternDatabase.set('memory_leak_pattern', {
            id: 'memory_leak_pattern',
            name: 'Memory Leak Pattern',
            description: 'Continuous memory usage increase over time',
            indicators: ['increasing_memory_trend', 'gc_frequency_increase'],
            confidence: 0.9
        });
        this.patternDatabase.set('cpu_spike_pattern', {
            id: 'cpu_spike_pattern',
            name: 'CPU Spike Pattern',
            description: 'Sudden CPU usage spikes',
            indicators: ['high_cpu_variance', 'periodic_spikes'],
            confidence: 0.8
        });
        this.patternDatabase.set('thread_pool_exhaustion', {
            id: 'thread_pool_exhaustion',
            name: 'Thread Pool Exhaustion',
            description: 'Thread pool running out of available threads',
            indicators: ['high_queue_size', 'low_throughput', 'high_response_time'],
            confidence: 0.85
        });
        this.patternDatabase.set('database_connection_pool_exhaustion', {
            id: 'database_connection_pool_exhaustion',
            name: 'Database Connection Pool Exhaustion',
            description: 'Database connection pool running out of connections',
            indicators: ['high_connection_wait_time', 'database_timeout_errors'],
            confidence: 0.9
        });
    }
    async analyzeBottleneck(bottleneck, profile) {
        const rootCauses = [];
        // Apply analysis rules
        for (const [ruleId, rule] of this.analysisRules) {
            if (!rule.enabled)
                continue;
            try {
                if (await this.evaluateRule(rule, bottleneck, profile)) {
                    const rootCause = await this.generateRootCause(rule, bottleneck, profile);
                    if (rootCause && rootCause.confidence >= this.config.confidenceThreshold) {
                        rootCauses.push(rootCause);
                    }
                    this.emit('ruleMatched', {
                        ruleId,
                        bottleneckId: bottleneck.id,
                        profileId: profile.id,
                        confidence: rootCause?.confidence || 0,
                        timestamp: new Date()
                    });
                }
            }
            catch (error) {
                console.error(`Failed to apply analysis rule ${ruleId}:`, error.message);
                this.emit('ruleError', {
                    ruleId,
                    bottleneckId: bottleneck.id,
                    error: error.message,
                    timestamp: new Date()
                });
            }
        }
        // Pattern-based analysis
        if (this.config.enableDeepAnalysis) {
            const patternRootCauses = await this.analyzePatterns(bottleneck, profile);
            rootCauses.push(...patternRootCauses);
        }
        // Historical comparison analysis
        const historicalRootCauses = await this.analyzeHistoricalComparison(bottleneck, profile);
        rootCauses.push(...historicalRootCauses);
        // Machine learning analysis (if enabled)
        if (this.config.enableMachineLearning) {
            const mlRootCauses = await this.analyzeMachineLearning(bottleneck, profile);
            rootCauses.push(...mlRootCauses);
        }
        // Store analysis results
        this.analyzedBottlenecks.set(bottleneck.id, rootCauses);
        this.storeHistoricalAnalysis(bottleneck, profile, rootCauses);
        this.emit('analysisCompleted', {
            bottleneckId: bottleneck.id,
            profileId: profile.id,
            rootCausesFound: rootCauses.length,
            timestamp: new Date()
        });
        return rootCauses;
    }
    async evaluateRule(rule, bottleneck, profile) {
        for (const condition of rule.conditions) {
            if (!(await this.evaluateCondition(condition, bottleneck, profile))) {
                return false; // All conditions must be met
            }
        }
        return true;
    }
    async evaluateCondition(condition, bottleneck, profile) {
        switch (condition.type) {
            case ConditionType.METRIC_THRESHOLD:
                return this.evaluateMetricThreshold(condition, profile);
            case ConditionType.METRIC_TREND:
                return this.evaluateMetricTrend(condition, profile);
            case ConditionType.METRIC_CORRELATION:
                return this.evaluateMetricCorrelation(condition, profile);
            case ConditionType.PATTERN_MATCH:
                return this.evaluatePatternMatch(condition, bottleneck, profile);
            case ConditionType.HISTORICAL_COMPARISON:
                return this.evaluateHistoricalComparison(condition, bottleneck, profile);
            default:
                return false;
        }
    }
    evaluateMetricThreshold(condition, profile) {
        if (!condition.metric)
            return false;
        const metrics = profile.metrics.filter(m => m.metric_type === condition.metric);
        if (metrics.length === 0)
            return false;
        const avgValue = metrics.reduce((sum, m) => sum + m.value, 0) / metrics.length;
        switch (condition.operator) {
            case ComparisonOperator.GREATER_THAN:
                return avgValue > condition.value;
            case ComparisonOperator.LESS_THAN:
                return avgValue < condition.value;
            case ComparisonOperator.EQUALS:
                return Math.abs(avgValue - condition.value) < 0.01;
            case ComparisonOperator.GREATER_THAN_OR_EQUAL:
                return avgValue >= condition.value;
            case ComparisonOperator.LESS_THAN_OR_EQUAL:
                return avgValue <= condition.value;
            default:
                return false;
        }
    }
    evaluateMetricTrend(condition, profile) {
        if (!condition.metric)
            return false;
        const metrics = profile.metrics.filter(m => m.metric_type === condition.metric);
        if (metrics.length < 3)
            return false; // Need at least 3 points for trend
        const values = metrics.map(m => m.value);
        const trend = this.calculateTrend(values);
        return Math.abs(trend) > condition.value;
    }
    evaluateMetricCorrelation(condition, profile) {
        // Simplified correlation evaluation
        return false; // Would implement actual correlation analysis
    }
    evaluatePatternMatch(condition, bottleneck, profile) {
        // Check if bottleneck matches known patterns
        return bottleneck.type === PerformanceDataModel_1.BottleneckType.LOCK_CONTENTION;
    }
    evaluateHistoricalComparison(condition, bottleneck, profile) {
        // Compare with historical data
        const historical = this.historicalAnalyses.get(profile.target_id) || [];
        return historical.length > 0; // Simplified check
    }
    async generateRootCause(rule, bottleneck, profile) {
        try {
            const evidences = rule.action.evidenceGenerator(bottleneck, profile);
            const fixSuggestions = rule.action.fixSuggestionGenerator(bottleneck, profile);
            const impactAssessment = this.calculateImpactAssessment(bottleneck, profile);
            const rootCause = {
                id: this.generateRootCauseId(),
                category: rule.category,
                description: rule.action.description,
                confidence: rule.confidence,
                evidence: evidences,
                fix_suggestions: fixSuggestions,
                impact_assessment: impactAssessment
            };
            return rootCause;
        }
        catch (error) {
            console.error(`Failed to generate root cause for rule ${rule.id}:`, error.message);
            return null;
        }
    }
    // Evidence generators for different rule types
    generateCpuEvidences(bottleneck, profile) {
        const evidences = [];
        const cpuMetrics = profile.metrics.filter(m => m.category === PerformanceDataModel_1.PerformanceCategory.CPU);
        if (cpuMetrics.length > 0) {
            const avgCpuUsage = cpuMetrics.reduce((sum, m) => sum + m.value, 0) / cpuMetrics.length;
            const maxCpuUsage = Math.max(...cpuMetrics.map(m => m.value));
            evidences.push({
                type: PerformanceDataModel_1.EvidenceType.RESOURCE_UTILIZATION,
                description: `High CPU usage detected: Average ${avgCpuUsage.toFixed(2)}%, Peak ${maxCpuUsage.toFixed(2)}%`,
                data: { avgCpuUsage, maxCpuUsage, sampleCount: cpuMetrics.length },
                strength: Math.min(avgCpuUsage / 100, 1),
                timestamp: new Date()
            });
            // Check for CPU spikes
            const cpuVariance = this.calculateVariance(cpuMetrics.map(m => m.value));
            if (cpuVariance > 100) {
                evidences.push({
                    type: PerformanceDataModel_1.EvidenceType.PATTERN_MATCHING,
                    description: `High CPU usage variability detected (variance: ${cpuVariance.toFixed(2)})`,
                    data: { variance: cpuVariance },
                    strength: 0.7,
                    timestamp: new Date()
                });
            }
        }
        return evidences;
    }
    generateMemoryLeakEvidences(bottleneck, profile) {
        const evidences = [];
        const memoryMetrics = profile.metrics.filter(m => m.category === PerformanceDataModel_1.PerformanceCategory.MEMORY);
        if (memoryMetrics.length >= 3) {
            const values = memoryMetrics.map(m => m.value);
            const trend = this.calculateTrend(values);
            if (trend > 0.05) { // Memory increasing
                evidences.push({
                    type: PerformanceDataModel_1.EvidenceType.TIMING_ANALYSIS,
                    description: `Memory usage increasing over time (trend: ${(trend * 100).toFixed(2)}% per sample)`,
                    data: { trend, values },
                    strength: Math.min(trend * 10, 1),
                    timestamp: new Date()
                });
            }
            // Check for GC frequency
            const gcMetrics = profile.metrics.filter(m => m.metric_type === PerformanceDataModel_1.PerformanceMetricType.GARBAGE_COLLECTION_TIME);
            if (gcMetrics.length > 0) {
                const avgGcTime = gcMetrics.reduce((sum, m) => sum + m.value, 0) / gcMetrics.length;
                evidences.push({
                    type: PerformanceDataModel_1.EvidenceType.RESOURCE_UTILIZATION,
                    description: `High garbage collection activity (average: ${avgGcTime.toFixed(2)}ms)`,
                    data: { avgGcTime, gcCount: gcMetrics.length },
                    strength: Math.min(avgGcTime / 100, 1),
                    timestamp: new Date()
                });
            }
        }
        return evidences;
    }
    generateSlowQueryEvidences(bottleneck, profile) {
        const evidences = [];
        const dbMetrics = profile.metrics.filter(m => m.metric_type === PerformanceDataModel_1.PerformanceMetricType.DATABASE_QUERY_TIME);
        if (dbMetrics.length > 0) {
            const avgQueryTime = dbMetrics.reduce((sum, m) => sum + m.value, 0) / dbMetrics.length;
            const maxQueryTime = Math.max(...dbMetrics.map(m => m.value));
            evidences.push({
                type: PerformanceDataModel_1.EvidenceType.QUERY_PLAN,
                description: `Slow database queries detected: Average ${avgQueryTime.toFixed(2)}ms, Max ${maxQueryTime.toFixed(2)}ms`,
                data: { avgQueryTime, maxQueryTime, queryCount: dbMetrics.length },
                strength: Math.min(avgQueryTime / 1000, 1),
                timestamp: new Date()
            });
            // Check for query timeout patterns
            const slowQueries = dbMetrics.filter(m => m.value > 5000); // > 5 seconds
            if (slowQueries.length > 0) {
                evidences.push({
                    type: PerformanceDataModel_1.EvidenceType.PATTERN_MATCHING,
                    description: `${slowQueries.length} queries exceeded 5-second threshold`,
                    data: { slowQueryCount: slowQueries.length, totalQueries: dbMetrics.length },
                    strength: slowQueries.length / dbMetrics.length,
                    timestamp: new Date()
                });
            }
        }
        return evidences;
    }
    generateNetworkEvidences(bottleneck, profile) {
        const evidences = [];
        const networkMetrics = profile.metrics.filter(m => m.category === PerformanceDataModel_1.PerformanceCategory.NETWORK);
        if (networkMetrics.length > 0) {
            const avgLatency = networkMetrics.reduce((sum, m) => sum + m.value, 0) / networkMetrics.length;
            const maxLatency = Math.max(...networkMetrics.map(m => m.value));
            evidences.push({
                type: PerformanceDataModel_1.EvidenceType.RESOURCE_UTILIZATION,
                description: `High network latency detected: Average ${avgLatency.toFixed(2)}ms, Max ${maxLatency.toFixed(2)}ms`,
                data: { avgLatency, maxLatency, requestCount: networkMetrics.length },
                strength: Math.min(avgLatency / 1000, 1),
                timestamp: new Date()
            });
            // Check for network timeout patterns
            const highLatencyRequests = networkMetrics.filter(m => m.value > 1000); // > 1 second
            if (highLatencyRequests.length > 0) {
                evidences.push({
                    type: PerformanceDataModel_1.EvidenceType.PATTERN_MATCHING,
                    description: `${highLatencyRequests.length} requests exceeded 1-second latency threshold`,
                    data: { highLatencyCount: highLatencyRequests.length, totalRequests: networkMetrics.length },
                    strength: highLatencyRequests.length / networkMetrics.length,
                    timestamp: new Date()
                });
            }
        }
        return evidences;
    }
    generateDiskIoEvidences(bottleneck, profile) {
        const evidences = [];
        const ioMetrics = profile.metrics.filter(m => m.category === PerformanceDataModel_1.PerformanceCategory.IO);
        if (ioMetrics.length > 0) {
            const avgIoTime = ioMetrics.reduce((sum, m) => sum + m.value, 0) / ioMetrics.length;
            const maxIoTime = Math.max(...ioMetrics.map(m => m.value));
            evidences.push({
                type: PerformanceDataModel_1.EvidenceType.RESOURCE_UTILIZATION,
                description: `High disk I/O latency detected: Average ${avgIoTime.toFixed(2)}ms, Max ${maxIoTime.toFixed(2)}ms`,
                data: { avgIoTime, maxIoTime, ioCount: ioMetrics.length },
                strength: Math.min(avgIoTime / 200, 1),
                timestamp: new Date()
            });
        }
        return evidences;
    }
    generateLockContentionEvidences(bottleneck, profile) {
        const evidences = [];
        // Look for patterns indicating lock contention
        const cpuMetrics = profile.metrics.filter(m => m.category === PerformanceDataModel_1.PerformanceCategory.CPU);
        const responseTimeMetrics = profile.metrics.filter(m => m.metric_type === PerformanceDataModel_1.PerformanceMetricType.RESPONSE_TIME);
        if (cpuMetrics.length > 0 && responseTimeMetrics.length > 0) {
            const avgCpuUsage = cpuMetrics.reduce((sum, m) => sum + m.value, 0) / cpuMetrics.length;
            const avgResponseTime = responseTimeMetrics.reduce((sum, m) => sum + m.value, 0) / responseTimeMetrics.length;
            if (avgCpuUsage < 30 && avgResponseTime > 1000) { // Low CPU but high response time
                evidences.push({
                    type: PerformanceDataModel_1.EvidenceType.PATTERN_MATCHING,
                    description: `Lock contention pattern: Low CPU usage (${avgCpuUsage.toFixed(2)}%) with high response time (${avgResponseTime.toFixed(2)}ms)`,
                    data: { avgCpuUsage, avgResponseTime },
                    strength: 0.8,
                    timestamp: new Date()
                });
            }
        }
        return evidences;
    }
    generateGcEvidences(bottleneck, profile) {
        const evidences = [];
        const gcMetrics = profile.metrics.filter(m => m.metric_type === PerformanceDataModel_1.PerformanceMetricType.GARBAGE_COLLECTION_TIME);
        if (gcMetrics.length > 0) {
            const totalGcTime = gcMetrics.reduce((sum, m) => sum + m.value, 0);
            const gcOverhead = (totalGcTime / profile.duration_ms) * 100;
            evidences.push({
                type: PerformanceDataModel_1.EvidenceType.RESOURCE_UTILIZATION,
                description: `High garbage collection overhead: ${gcOverhead.toFixed(2)}% of total execution time`,
                data: { totalGcTime, profileDuration: profile.duration_ms, gcOverhead },
                strength: Math.min(gcOverhead / 10, 1),
                timestamp: new Date()
            });
        }
        return evidences;
    }
    // Fix suggestion generators
    generateCpuFixSuggestions(bottleneck, profile) {
        const suggestions = [];
        suggestions.push({
            id: this.generateFixSuggestionId(),
            category: PerformanceDataModel_1.FixCategory.CODE_OPTIMIZATION,
            title: 'Optimize CPU-intensive algorithms',
            description: 'Review and optimize algorithms that are consuming excessive CPU resources',
            implementation_effort: PerformanceDataModel_1.ImplementationEffort.MEDIUM,
            expected_improvement: 30,
            risks: ['Code complexity may increase', 'Requires thorough testing'],
            prerequisites: ['Profile CPU usage at method level', 'Identify hotspots'],
            code_changes: [{
                    file_path: 'src/performance-critical-module.ts',
                    change_type: PerformanceDataModel_1.CodeChangeType.MODIFICATION,
                    description: 'Optimize sorting algorithm from O(n²) to O(n log n)',
                    before_code: 'bubbleSort(array)',
                    after_code: 'quickSort(array) // or array.sort()'
                }]
        });
        suggestions.push({
            id: this.generateFixSuggestionId(),
            category: PerformanceDataModel_1.FixCategory.CACHING_STRATEGY,
            title: 'Implement CPU result caching',
            description: 'Cache results of expensive CPU operations to avoid repeated calculations',
            implementation_effort: PerformanceDataModel_1.ImplementationEffort.LOW,
            expected_improvement: 50,
            risks: ['Memory usage increase', 'Cache invalidation complexity'],
            prerequisites: ['Identify cacheable operations', 'Design cache key strategy'],
            code_changes: [{
                    file_path: 'src/cache-service.ts',
                    change_type: PerformanceDataModel_1.CodeChangeType.ADDITION,
                    description: 'Add LRU cache for expensive calculations',
                    after_code: 'const cache = new LRUCache({ max: 1000 });'
                }]
        });
        return suggestions;
    }
    generateMemoryLeakFixSuggestions(bottleneck, profile) {
        const suggestions = [];
        suggestions.push({
            id: this.generateFixSuggestionId(),
            category: PerformanceDataModel_1.FixCategory.CODE_OPTIMIZATION,
            title: 'Fix memory leaks',
            description: 'Identify and fix memory leaks by properly managing object references',
            implementation_effort: PerformanceDataModel_1.ImplementationEffort.HIGH,
            expected_improvement: 80,
            risks: ['May affect existing functionality', 'Requires extensive testing'],
            prerequisites: ['Memory profiling', 'Heap dump analysis'],
            code_changes: [{
                    file_path: 'src/event-listeners.ts',
                    change_type: PerformanceDataModel_1.CodeChangeType.MODIFICATION,
                    description: 'Remove event listeners to prevent memory leaks',
                    before_code: 'element.addEventListener("click", handler)',
                    after_code: 'element.addEventListener("click", handler);\n// Add cleanup:\nelement.removeEventListener("click", handler);'
                }]
        });
        suggestions.push({
            id: this.generateFixSuggestionId(),
            category: PerformanceDataModel_1.FixCategory.CONFIGURATION_CHANGE,
            title: 'Adjust garbage collection settings',
            description: 'Tune GC parameters to reduce memory pressure',
            implementation_effort: PerformanceDataModel_1.ImplementationEffort.LOW,
            expected_improvement: 25,
            risks: ['May affect overall performance', 'Requires monitoring'],
            prerequisites: ['Understand current GC behavior', 'Test in staging environment'],
            code_changes: []
        });
        return suggestions;
    }
    generateSlowQueryFixSuggestions(bottleneck, profile) {
        const suggestions = [];
        suggestions.push({
            id: this.generateFixSuggestionId(),
            category: PerformanceDataModel_1.FixCategory.DATABASE_OPTIMIZATION,
            title: 'Add database indexes',
            description: 'Create indexes on frequently queried columns to improve query performance',
            implementation_effort: PerformanceDataModel_1.ImplementationEffort.LOW,
            expected_improvement: 70,
            risks: ['Index maintenance overhead', 'Storage space increase'],
            prerequisites: ['Analyze query execution plans', 'Identify missing indexes'],
            code_changes: [{
                    file_path: 'migrations/add-performance-indexes.sql',
                    change_type: PerformanceDataModel_1.CodeChangeType.ADDITION,
                    description: 'Add indexes for slow queries',
                    after_code: 'CREATE INDEX idx_user_created_at ON users(created_at);'
                }]
        });
        suggestions.push({
            id: this.generateFixSuggestionId(),
            category: PerformanceDataModel_1.FixCategory.CODE_OPTIMIZATION,
            title: 'Optimize database queries',
            description: 'Rewrite inefficient queries and reduce N+1 query problems',
            implementation_effort: PerformanceDataModel_1.ImplementationEffort.MEDIUM,
            expected_improvement: 60,
            risks: ['Query complexity may increase', 'Requires database knowledge'],
            prerequisites: ['Query analysis', 'Understanding of ORM behavior'],
            code_changes: [{
                    file_path: 'src/user-service.ts',
                    change_type: PerformanceDataModel_1.CodeChangeType.MODIFICATION,
                    description: 'Use JOIN instead of multiple queries',
                    before_code: 'const users = await User.findAll();\nfor (const user of users) {\n  user.posts = await Post.findByUserId(user.id);\n}',
                    after_code: 'const users = await User.findAll({\n  include: [Post]\n});'
                }]
        });
        return suggestions;
    }
    generateNetworkFixSuggestions(bottleneck, profile) {
        const suggestions = [];
        suggestions.push({
            id: this.generateFixSuggestionId(),
            category: PerformanceDataModel_1.FixCategory.CACHING_STRATEGY,
            title: 'Implement network response caching',
            description: 'Cache network responses to reduce external API calls',
            implementation_effort: PerformanceDataModel_1.ImplementationEffort.MEDIUM,
            expected_improvement: 60,
            risks: ['Stale data issues', 'Cache invalidation complexity'],
            prerequisites: ['Identify cacheable responses', 'Design cache TTL strategy'],
            code_changes: [{
                    file_path: 'src/api-client.ts',
                    change_type: PerformanceDataModel_1.CodeChangeType.MODIFICATION,
                    description: 'Add HTTP response caching',
                    before_code: 'const response = await fetch(url);',
                    after_code: 'const cachedResponse = cache.get(url);\nif (cachedResponse) return cachedResponse;\nconst response = await fetch(url);\ncache.set(url, response, { ttl: 300 });'
                }]
        });
        suggestions.push({
            id: this.generateFixSuggestionId(),
            category: PerformanceDataModel_1.FixCategory.CONFIGURATION_CHANGE,
            title: 'Optimize network timeouts',
            description: 'Adjust connection and request timeouts to reduce waiting time',
            implementation_effort: PerformanceDataModel_1.ImplementationEffort.LOW,
            expected_improvement: 20,
            risks: ['May cause premature timeouts', 'Requires testing'],
            prerequisites: ['Analyze current timeout values', 'Test with different settings'],
            code_changes: []
        });
        return suggestions;
    }
    generateDiskIoFixSuggestions(bottleneck, profile) {
        const suggestions = [];
        suggestions.push({
            id: this.generateFixSuggestionId(),
            category: PerformanceDataModel_1.FixCategory.INFRASTRUCTURE_SCALING,
            title: 'Upgrade storage to SSD',
            description: 'Replace traditional HDDs with SSDs for better I/O performance',
            implementation_effort: PerformanceDataModel_1.ImplementationEffort.HIGH,
            expected_improvement: 80,
            risks: ['Cost increase', 'Migration downtime'],
            prerequisites: ['Evaluate storage requirements', 'Plan migration strategy'],
            code_changes: []
        });
        suggestions.push({
            id: this.generateFixSuggestionId(),
            category: PerformanceDataModel_1.FixCategory.CODE_OPTIMIZATION,
            title: 'Implement asynchronous I/O',
            description: 'Use asynchronous I/O operations to prevent blocking',
            implementation_effort: PerformanceDataModel_1.ImplementationEffort.MEDIUM,
            expected_improvement: 40,
            risks: ['Code complexity increase', 'Error handling complexity'],
            prerequisites: ['Identify synchronous I/O operations', 'Understand async patterns'],
            code_changes: [{
                    file_path: 'src/file-service.ts',
                    change_type: PerformanceDataModel_1.CodeChangeType.MODIFICATION,
                    description: 'Convert synchronous file operations to async',
                    before_code: 'const data = fs.readFileSync(filePath);',
                    after_code: 'const data = await fs.promises.readFile(filePath);'
                }]
        });
        return suggestions;
    }
    generateLockContentionFixSuggestions(bottleneck, profile) {
        const suggestions = [];
        suggestions.push({
            id: this.generateFixSuggestionId(),
            category: PerformanceDataModel_1.FixCategory.ARCHITECTURAL_REFACTOR,
            title: 'Reduce lock granularity',
            description: 'Use finer-grained locking to reduce contention',
            implementation_effort: PerformanceDataModel_1.ImplementationEffort.HIGH,
            expected_improvement: 70,
            risks: ['Increased complexity', 'Potential deadlocks'],
            prerequisites: ['Analyze current locking strategy', 'Design new locking scheme'],
            code_changes: [{
                    file_path: 'src/shared-resource.ts',
                    change_type: PerformanceDataModel_1.CodeChangeType.REFACTORING,
                    description: 'Replace global lock with per-resource locks',
                    before_code: 'lock.acquire(() => { /* process all resources */ });',
                    after_code: 'resourceLocks[resourceId].acquire(() => { /* process specific resource */ });'
                }]
        });
        suggestions.push({
            id: this.generateFixSuggestionId(),
            category: PerformanceDataModel_1.FixCategory.ARCHITECTURAL_REFACTOR,
            title: 'Implement lock-free algorithms',
            description: 'Use lock-free data structures and algorithms where possible',
            implementation_effort: PerformanceDataModel_1.ImplementationEffort.VERY_HIGH,
            expected_improvement: 90,
            risks: ['Very high complexity', 'Difficult to debug'],
            prerequisites: ['Deep understanding of concurrency', 'Extensive testing'],
            code_changes: []
        });
        return suggestions;
    }
    generateGcFixSuggestions(bottleneck, profile) {
        const suggestions = [];
        suggestions.push({
            id: this.generateFixSuggestionId(),
            category: PerformanceDataModel_1.FixCategory.CONFIGURATION_CHANGE,
            title: 'Tune garbage collection parameters',
            description: 'Optimize GC settings for your workload characteristics',
            implementation_effort: PerformanceDataModel_1.ImplementationEffort.MEDIUM,
            expected_improvement: 40,
            risks: ['May affect memory usage', 'Requires monitoring'],
            prerequisites: ['Analyze GC logs', 'Understand workload patterns'],
            code_changes: []
        });
        suggestions.push({
            id: this.generateFixSuggestionId(),
            category: PerformanceDataModel_1.FixCategory.CODE_OPTIMIZATION,
            title: 'Reduce object allocation',
            description: 'Minimize object creation to reduce GC pressure',
            implementation_effort: PerformanceDataModel_1.ImplementationEffort.MEDIUM,
            expected_improvement: 50,
            risks: ['Code complexity may increase', 'May affect readability'],
            prerequisites: ['Profile object allocation', 'Identify allocation hotspots'],
            code_changes: [{
                    file_path: 'src/data-processor.ts',
                    change_type: PerformanceDataModel_1.CodeChangeType.MODIFICATION,
                    description: 'Reuse objects instead of creating new ones',
                    before_code: 'for (const item of items) {\n  const result = new ProcessResult(item);\n  results.push(result);\n}',
                    after_code: 'const reusableResult = new ProcessResult();\nfor (const item of items) {\n  reusableResult.reset(item);\n  results.push(reusableResult.clone());\n}'
                }]
        });
        return suggestions;
    }
    async analyzePatterns(bottleneck, profile) {
        const rootCauses = [];
        // Check for known patterns
        for (const [patternId, pattern] of this.patternDatabase) {
            if (this.matchesPattern(bottleneck, profile, pattern)) {
                const rootCause = {
                    id: this.generateRootCauseId(),
                    category: PerformanceDataModel_1.RootCauseCategory.ARCHITECTURAL_ISSUE,
                    description: `Pattern detected: ${pattern.description}`,
                    confidence: pattern.confidence,
                    evidence: [{
                            type: PerformanceDataModel_1.EvidenceType.PATTERN_MATCHING,
                            description: `Matches known performance pattern: ${pattern.name}`,
                            data: { patternId, indicators: pattern.indicators },
                            strength: pattern.confidence,
                            timestamp: new Date()
                        }],
                    fix_suggestions: this.generatePatternFixSuggestions(pattern),
                    impact_assessment: this.calculateImpactAssessment(bottleneck, profile)
                };
                rootCauses.push(rootCause);
            }
        }
        return rootCauses;
    }
    matchesPattern(bottleneck, profile, pattern) {
        // Simplified pattern matching - would implement more sophisticated logic
        switch (pattern.id) {
            case 'memory_leak_pattern':
                return bottleneck.type === PerformanceDataModel_1.BottleneckType.MEMORY_BOUND;
            case 'cpu_spike_pattern':
                return bottleneck.type === PerformanceDataModel_1.BottleneckType.CPU_BOUND;
            case 'thread_pool_exhaustion':
                return bottleneck.type === PerformanceDataModel_1.BottleneckType.RESOURCE_STARVATION;
            case 'database_connection_pool_exhaustion':
                return bottleneck.type === PerformanceDataModel_1.BottleneckType.DATABASE_BOUND;
            default:
                return false;
        }
    }
    generatePatternFixSuggestions(pattern) {
        // Generate fix suggestions based on the pattern
        const suggestions = [];
        switch (pattern.id) {
            case 'memory_leak_pattern':
                suggestions.push({
                    id: this.generateFixSuggestionId(),
                    category: PerformanceDataModel_1.FixCategory.CODE_OPTIMIZATION,
                    title: 'Fix memory leak',
                    description: 'Implement proper resource cleanup to prevent memory leaks',
                    implementation_effort: PerformanceDataModel_1.ImplementationEffort.HIGH,
                    expected_improvement: 80,
                    risks: ['Requires careful testing'],
                    prerequisites: ['Memory profiling'],
                    code_changes: []
                });
                break;
            case 'thread_pool_exhaustion':
                suggestions.push({
                    id: this.generateFixSuggestionId(),
                    category: PerformanceDataModel_1.FixCategory.CONFIGURATION_CHANGE,
                    title: 'Increase thread pool size',
                    description: 'Configure larger thread pool to handle concurrent requests',
                    implementation_effort: PerformanceDataModel_1.ImplementationEffort.LOW,
                    expected_improvement: 50,
                    risks: ['Increased resource usage'],
                    prerequisites: ['Analyze current thread usage'],
                    code_changes: []
                });
                break;
        }
        return suggestions;
    }
    async analyzeHistoricalComparison(bottleneck, profile) {
        const rootCauses = [];
        const historical = this.historicalAnalyses.get(profile.target_id) || [];
        if (historical.length === 0)
            return rootCauses;
        // Compare with historical performance
        const recentAnalyses = historical.slice(-10); // Last 10 analyses
        const avgHistoricalPerformance = recentAnalyses.reduce((sum, h) => sum + h.performanceScore, 0) / recentAnalyses.length;
        const currentPerformanceScore = profile.summary.performance_score;
        if (currentPerformanceScore < avgHistoricalPerformance * 0.8) { // 20% degradation
            const rootCause = {
                id: this.generateRootCauseId(),
                category: PerformanceDataModel_1.RootCauseCategory.CODE_INEFFICIENCY,
                description: 'Performance degradation compared to historical baseline',
                confidence: 0.8,
                evidence: [{
                        type: PerformanceDataModel_1.EvidenceType.TIMING_ANALYSIS,
                        description: `Current performance score (${currentPerformanceScore}) is ${((avgHistoricalPerformance - currentPerformanceScore) / avgHistoricalPerformance * 100).toFixed(1)}% worse than historical average (${avgHistoricalPerformance.toFixed(1)})`,
                        data: { currentScore: currentPerformanceScore, historicalAverage: avgHistoricalPerformance },
                        strength: 0.8,
                        timestamp: new Date()
                    }],
                fix_suggestions: [{
                        id: this.generateFixSuggestionId(),
                        category: PerformanceDataModel_1.FixCategory.CODE_OPTIMIZATION,
                        title: 'Investigate performance regression',
                        description: 'Analyze recent changes that may have caused performance degradation',
                        implementation_effort: PerformanceDataModel_1.ImplementationEffort.MEDIUM,
                        expected_improvement: 30,
                        risks: ['May require code rollback'],
                        prerequisites: ['Code change analysis', 'Git history review'],
                        code_changes: []
                    }],
                impact_assessment: this.calculateImpactAssessment(bottleneck, profile)
            };
            rootCauses.push(rootCause);
        }
        return rootCauses;
    }
    async analyzeMachineLearning(bottleneck, profile) {
        const rootCauses = [];
        // Placeholder for ML-based analysis
        // In a real implementation, this would use trained models to predict root causes
        // based on performance patterns, historical data, and system context
        return rootCauses;
    }
    calculateImpactAssessment(bottleneck, profile) {
        return {
            performance_impact: Math.min(bottleneck.impact_score, 100),
            user_experience_impact: Math.min(bottleneck.impact_score * 0.9, 100),
            resource_cost_impact: Math.min(bottleneck.impact_score * 0.7, 100),
            business_impact: Math.min(bottleneck.impact_score * 0.6, 100),
            affected_operations: [bottleneck.operation],
            affected_users: 0 // Would calculate based on actual usage data
        };
    }
    storeHistoricalAnalysis(bottleneck, profile, rootCauses) {
        const targetId = profile.target_id;
        if (!this.historicalAnalyses.has(targetId)) {
            this.historicalAnalyses.set(targetId, []);
        }
        const historical = this.historicalAnalyses.get(targetId);
        historical.push({
            timestamp: new Date(),
            profileId: profile.id,
            bottleneckId: bottleneck.id,
            performanceScore: profile.summary.performance_score,
            rootCauseCount: rootCauses.length,
            topRootCauseCategory: rootCauses.length > 0 ? rootCauses[0].category : PerformanceDataModel_1.RootCauseCategory.CODE_INEFFICIENCY
        });
        // Keep only recent analyses
        if (historical.length > this.config.historicalAnalysisWindow) {
            historical.splice(0, historical.length - this.config.historicalAnalysisWindow);
        }
    }
    // Utility methods
    calculateTrend(values) {
        if (values.length < 2)
            return 0;
        const n = values.length;
        const xSum = (n * (n - 1)) / 2;
        const ySum = values.reduce((sum, val) => sum + val, 0);
        const xySum = values.reduce((sum, val, idx) => sum + val * idx, 0);
        const xxSum = (n * (n - 1) * (2 * n - 1)) / 6;
        return (n * xySum - xSum * ySum) / (n * xxSum - xSum * xSum) || 0;
    }
    calculateVariance(values) {
        if (values.length === 0)
            return 0;
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        return values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
    }
    // Public API methods
    getRootCauses(bottleneckId) {
        return this.analyzedBottlenecks.get(bottleneckId) || [];
    }
    getAnalysisRules() {
        return Array.from(this.analysisRules.values());
    }
    enableRule(ruleId) {
        const rule = this.analysisRules.get(ruleId);
        if (rule) {
            rule.enabled = true;
        }
    }
    disableRule(ruleId) {
        const rule = this.analysisRules.get(ruleId);
        if (rule) {
            rule.enabled = false;
        }
    }
    getAnalysisStatistics() {
        return {
            total_rules: this.analysisRules.size,
            enabled_rules: Array.from(this.analysisRules.values()).filter(r => r.enabled).length,
            analyzed_bottlenecks: this.analyzedBottlenecks.size,
            total_root_causes: Array.from(this.analyzedBottlenecks.values()).reduce((sum, causes) => sum + causes.length, 0),
            patterns_in_database: this.patternDatabase.size,
            historical_analyses: Array.from(this.historicalAnalyses.values()).reduce((sum, analyses) => sum + analyses.length, 0)
        };
    }
    generateRootCauseId() {
        return `rootcause_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    generateFixSuggestionId() {
        return `fix_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    async shutdown() {
        // Cleanup resources
        this.analyzedBottlenecks.clear();
        this.historicalAnalyses.clear();
        console.log('Root Cause Analysis Service shutdown complete');
    }
}
exports.RootCauseAnalysisService = RootCauseAnalysisService;
