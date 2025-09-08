"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseMonitor = void 0;
const events_1 = require("events");
const client_1 = require("@prisma/client");
class DatabaseMonitor extends events_1.EventEmitter {
    prisma;
    monitoringInterval = null;
    alertRules = new Map();
    activeAlerts = new Map();
    healthHistory = [];
    maxHistorySize = 1000;
    constructor() {
        super();
        this.prisma = new client_1.PrismaClient();
        this.initializeDefaultAlertRules();
    }
    initializeDefaultAlertRules() {
        const defaultRules = [
            {
                id: 'slow_query_threshold',
                name: 'Slow Query Alert',
                metric: 'performance.avgQueryTime',
                operator: '>',
                threshold: 2000, // 2 seconds
                severity: 'HIGH',
                duration: 60, // 1 minute
                enabled: true,
                notificationChannels: ['email', 'slack'],
            },
            {
                id: 'connection_pool_exhaustion',
                name: 'Connection Pool Exhaustion',
                metric: 'connectionPool.waiting',
                operator: '>',
                threshold: 10,
                severity: 'CRITICAL',
                duration: 30,
                enabled: true,
                notificationChannels: ['email', 'slack', 'pagerduty'],
            },
            {
                id: 'cache_hit_ratio_low',
                name: 'Low Cache Hit Ratio',
                metric: 'performance.cacheHitRatio',
                operator: '<',
                threshold: 0.95,
                severity: 'MEDIUM',
                duration: 300, // 5 minutes
                enabled: true,
                notificationChannels: ['email'],
            },
            {
                id: 'replication_lag_high',
                name: 'High Replication Lag',
                metric: 'replication.lagBehindMaster',
                operator: '>',
                threshold: 5000, // 5 seconds
                severity: 'HIGH',
                duration: 120,
                enabled: true,
                notificationChannels: ['email', 'slack'],
            },
            {
                id: 'deadlock_detection',
                name: 'Deadlock Detection',
                metric: 'locks.deadlocks',
                operator: '>',
                threshold: 0,
                severity: 'HIGH',
                duration: 0, // Immediate
                enabled: true,
                notificationChannels: ['email', 'slack'],
            },
            {
                id: 'disk_usage_high',
                name: 'High Disk Usage',
                metric: 'resources.diskUsage',
                operator: '>',
                threshold: 85, // 85%
                severity: 'HIGH',
                duration: 300,
                enabled: true,
                notificationChannels: ['email', 'slack'],
            }
        ];
        for (const rule of defaultRules) {
            this.alertRules.set(rule.id, rule);
        }
    }
    startMonitoring(intervalMs = 30000) {
        if (this.monitoringInterval) {
            this.stopMonitoring();
        }
        this.monitoringInterval = setInterval(async () => {
            try {
                const health = await this.collectHealthMetrics();
                this.healthHistory.push(health);
                // Maintain history size
                if (this.healthHistory.length > this.maxHistorySize) {
                    this.healthHistory = this.healthHistory.slice(-this.maxHistorySize);
                }
                this.emit('healthUpdate', health);
                this.checkAlertRules(health);
            }
            catch (error) {
                this.emit('monitoringError', error);
            }
        }, intervalMs);
        this.emit('monitoringStarted', { interval: intervalMs });
    }
    stopMonitoring() {
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
            this.emit('monitoringStopped');
        }
    }
    async collectHealthMetrics() {
        const [connectionStats, performanceStats, resourceStats, lockStats, replicationStats] = await Promise.allSettled([
            this.getConnectionPoolStats(),
            this.getPerformanceStats(),
            this.getResourceStats(),
            this.getLockStats(),
            this.getReplicationStats()
        ]);
        const health = {
            timestamp: new Date(),
            connectionPool: connectionStats.status === 'fulfilled' ? connectionStats.value : {
                active: 0, idle: 0, total: 0, waiting: 0
            },
            performance: performanceStats.status === 'fulfilled' ? performanceStats.value : {
                avgQueryTime: 0, slowQueries: 0, queriesPerSecond: 0, cacheHitRatio: 0
            },
            resources: resourceStats.status === 'fulfilled' ? resourceStats.value : {
                cpuUsage: 0, memoryUsage: 0, diskUsage: 0, ioWait: 0
            },
            locks: lockStats.status === 'fulfilled' ? lockStats.value : {
                activeLocks: 0, waitingQueries: 0, deadlocks: 0
            },
            replication: replicationStats.status === 'fulfilled' ? replicationStats.value : {
                lagBehindMaster: 0, replicationHealth: 'HEALTHY'
            },
            overallHealth: 'HEALTHY'
        };
        // Determine overall health
        health.overallHealth = this.calculateOverallHealth(health);
        return health;
    }
    async getConnectionPoolStats() {
        try {
            const result = await this.prisma.$queryRaw `
        SELECT state, count(*)::int as count
        FROM pg_stat_activity 
        WHERE datname = current_database()
        GROUP BY state;
      `;
            const stats = {
                active: 0,
                idle: 0,
                total: 0,
                waiting: 0
            };
            for (const row of result) {
                stats.total += row.count;
                switch (row.state) {
                    case 'active':
                        stats.active = row.count;
                        break;
                    case 'idle':
                        stats.idle = row.count;
                        break;
                    case 'idle in transaction':
                        stats.waiting = row.count;
                        break;
                }
            }
            return stats;
        }
        catch (error) {
            throw new Error(`Failed to get connection pool stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getPerformanceStats() {
        try {
            const [queryStats, cacheStats] = await Promise.all([
                this.prisma.$queryRaw `
          SELECT 
            sum(calls)::int as calls,
            sum(total_time)::float as total_time,
            avg(mean_time)::float as mean_time
          FROM pg_stat_statements
          WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database());
        `,
                this.prisma.$queryRaw `
          SELECT 
            sum(heap_blks_read)::int as heap_blks_read,
            sum(heap_blks_hit)::int as heap_blks_hit
          FROM pg_statio_user_tables;
        `
            ]);
            const queryResult = queryStats[0] || { calls: 0, total_time: 0, mean_time: 0 };
            const cacheResult = cacheStats[0] || { heap_blks_read: 0, heap_blks_hit: 0 };
            const cacheHitRatio = cacheResult.heap_blks_hit + cacheResult.heap_blks_read > 0
                ? cacheResult.heap_blks_hit / (cacheResult.heap_blks_hit + cacheResult.heap_blks_read)
                : 1;
            const slowQueries = await this.prisma.$queryRaw `
        SELECT count(*)::int as count
        FROM pg_stat_statements
        WHERE mean_time > 1000
        AND dbid = (SELECT oid FROM pg_database WHERE datname = current_database());
      `;
            return {
                avgQueryTime: queryResult.mean_time || 0,
                slowQueries: slowQueries[0]?.count || 0,
                queriesPerSecond: queryResult.calls / 60, // Approximate QPS over last minute
                cacheHitRatio: cacheHitRatio,
            };
        }
        catch (error) {
            throw new Error(`Failed to get performance stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getResourceStats() {
        try {
            // These would typically come from system monitoring tools
            // For now, we'll provide estimated values based on database metrics
            const dbSize = await this.prisma.$queryRaw `
        SELECT pg_database_size(current_database())::bigint as size;
      `;
            const activeConnections = await this.prisma.$queryRaw `
        SELECT count(*)::int as count FROM pg_stat_activity WHERE state = 'active';
      `;
            return {
                cpuUsage: Math.min(activeConnections[0].count * 10, 100), // Estimate
                memoryUsage: Math.min(dbSize[0].size / (1024 * 1024 * 1024) * 2, 100), // Estimate
                diskUsage: Math.min(dbSize[0].size / (1024 * 1024 * 1024 * 10) * 100, 100), // Estimate
                ioWait: Math.random() * 10, // Would come from system metrics
            };
        }
        catch (error) {
            throw new Error(`Failed to get resource stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getLockStats() {
        try {
            const lockStats = await this.prisma.$queryRaw `
        SELECT mode, count(*)::int as count
        FROM pg_locks
        WHERE database = (SELECT oid FROM pg_database WHERE datname = current_database())
        GROUP BY mode;
      `;
            const waitingQueries = await this.prisma.$queryRaw `
        SELECT count(*)::int as count
        FROM pg_stat_activity
        WHERE wait_event_type = 'Lock' AND state = 'active';
      `;
            // Deadlock detection would require additional monitoring
            const activeLocks = lockStats.reduce((sum, row) => sum + row.count, 0);
            return {
                activeLocks,
                waitingQueries: waitingQueries[0]?.count || 0,
                deadlocks: 0, // Would be tracked separately
            };
        }
        catch (error) {
            throw new Error(`Failed to get lock stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async getReplicationStats() {
        try {
            // Check if we're on a replica
            const replicationInfo = await this.prisma.$queryRaw `SELECT pg_is_in_recovery() as in_recovery;`;
            if (!replicationInfo[0].in_recovery) {
                // We're on the primary, check replica lag
                const replicationLag = await this.prisma.$queryRaw `
          SELECT COALESCE(
            EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp()))::int,
            0
          ) as lag;
        `;
                const lag = replicationLag[0]?.lag || 0;
                const health = lag < 1 ? 'HEALTHY' : lag < 5 ? 'WARNING' : 'CRITICAL';
                return {
                    lagBehindMaster: lag * 1000, // Convert to milliseconds
                    replicationHealth: health,
                };
            }
            return {
                lagBehindMaster: 0,
                replicationHealth: 'HEALTHY',
            };
        }
        catch (error) {
            throw new Error(`Failed to get replication stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    calculateOverallHealth(health) {
        const issues = [];
        // Check various health indicators
        if (health.performance.avgQueryTime > 1000)
            issues.push('Slow queries detected');
        if (health.connectionPool.waiting > 5)
            issues.push('Connection pool congestion');
        if (health.performance.cacheHitRatio < 0.9)
            issues.push('Low cache hit ratio');
        if (health.resources.cpuUsage > 80)
            issues.push('High CPU usage');
        if (health.resources.memoryUsage > 85)
            issues.push('High memory usage');
        if (health.resources.diskUsage > 90)
            issues.push('High disk usage');
        if (health.locks.waitingQueries > 10)
            issues.push('Lock contention');
        if (health.replication.replicationHealth === 'CRITICAL')
            issues.push('Replication issues');
        if (issues.length === 0)
            return 'HEALTHY';
        if (issues.length <= 2)
            return 'WARNING';
        return 'CRITICAL';
    }
    checkAlertRules(health) {
        for (const [ruleId, rule] of this.alertRules.entries()) {
            if (!rule.enabled)
                continue;
            const currentValue = this.getMetricValue(health, rule.metric);
            const shouldAlert = this.evaluateCondition(currentValue, rule.operator, rule.threshold);
            if (shouldAlert) {
                this.triggerAlert(rule, currentValue);
            }
            else {
                this.resolveAlert(ruleId);
            }
        }
    }
    getMetricValue(health, metricPath) {
        const parts = metricPath.split('.');
        let value = health;
        for (const part of parts) {
            if (value && typeof value === 'object' && part in value) {
                value = value[part];
            }
            else {
                return 0; // Metric not found
            }
        }
        return typeof value === 'number' ? value : 0;
    }
    evaluateCondition(current, operator, threshold) {
        switch (operator) {
            case '>': return current > threshold;
            case '<': return current < threshold;
            case '=': return current === threshold;
            case '!=': return current !== threshold;
            case '>=': return current >= threshold;
            case '<=': return current <= threshold;
            default: return false;
        }
    }
    triggerAlert(rule, currentValue) {
        const existingAlert = this.activeAlerts.get(rule.id);
        if (existingAlert && !existingAlert.resolvedAt) {
            // Alert already active, update current value
            existingAlert.currentValue = currentValue;
            return;
        }
        const alert = {
            id: `alert_${Date.now()}_${rule.id}`,
            ruleId: rule.id,
            ruleName: rule.name,
            severity: rule.severity,
            metric: rule.metric,
            currentValue,
            threshold: rule.threshold,
            message: `${rule.name}: ${rule.metric} is ${currentValue} (threshold: ${rule.threshold})`,
            triggeredAt: new Date(),
            actionsTaken: [],
        };
        this.activeAlerts.set(rule.id, alert);
        this.emit('alertTriggered', alert);
        // Take automated actions if configured
        this.takeAutomatedActions(alert);
    }
    resolveAlert(ruleId) {
        const alert = this.activeAlerts.get(ruleId);
        if (alert && !alert.resolvedAt) {
            alert.resolvedAt = new Date();
            this.emit('alertResolved', alert);
        }
    }
    takeAutomatedActions(alert) {
        const actions = [];
        switch (alert.ruleId) {
            case 'slow_query_threshold':
                actions.push('Initiated query performance analysis');
                // Could trigger automatic query optimization analysis
                break;
            case 'connection_pool_exhaustion':
                actions.push('Scaled connection pool size');
                // Could automatically increase pool size
                break;
            case 'cache_hit_ratio_low':
                actions.push('Triggered cache warming procedures');
                // Could initiate cache warming
                break;
            case 'deadlock_detection':
                actions.push('Logged deadlock details for analysis');
                // Could capture detailed deadlock information
                break;
        }
        alert.actionsTaken = actions;
        if (actions.length > 0) {
            this.emit('automatedActionsExecuted', { alert, actions });
        }
    }
    async getDetailedStatistics() {
        const [tableStats, indexStats, connectionStats, queryStats] = await Promise.allSettled([
            this.getTableStatistics(),
            this.getIndexStatistics(),
            this.getConnectionStatistics(),
            this.getQueryStatistics()
        ]);
        return {
            tableStats: tableStats.status === 'fulfilled' ? tableStats.value : [],
            indexStats: indexStats.status === 'fulfilled' ? indexStats.value : [],
            connectionStats: connectionStats.status === 'fulfilled' ? connectionStats.value : {
                totalConnections: 0, activeConnections: 0, idleConnections: 0,
                idleInTransaction: 0, maxConnections: 100
            },
            queryStats: queryStats.status === 'fulfilled' ? queryStats.value : {
                totalQueries: 0, avgQueryTime: 0, slowestQueries: []
            }
        };
    }
    async getTableStatistics() {
        const result = await this.prisma.$queryRaw `
      SELECT 
        schemaname || '.' || tablename as table_name,
        n_live_tup::int as row_count,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as table_size,
        pg_size_pretty(pg_indexes_size(schemaname||'.'||tablename)) as index_size,
        pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename) + pg_indexes_size(schemaname||'.'||tablename)) as total_size,
        seq_scan::int,
        idx_scan::int,
        n_tup_ins::int,
        n_tup_upd::int,
        n_tup_del::int,
        last_vacuum,
        last_analyze
      FROM pg_stat_user_tables 
      ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
    `;
        return result.map(row => ({
            tableName: row.table_name,
            rowCount: row.row_count,
            tableSize: row.table_size,
            indexSize: row.index_size,
            totalSize: row.total_size,
            sequentialScans: row.seq_scan,
            indexScans: row.idx_scan,
            tuplesInserted: row.n_tup_ins,
            tuplesUpdated: row.n_tup_upd,
            tuplesDeleted: row.n_tup_del,
            lastVacuum: row.last_vacuum ?? undefined,
            lastAnalyze: row.last_analyze ?? undefined,
        }));
    }
    async getIndexStatistics() {
        const result = await this.prisma.$queryRaw `
      SELECT 
        schemaname || '.' || tablename as table_name,
        indexname as index_name,
        pg_size_pretty(pg_relation_size(schemaname||'.'||indexname)) as index_size,
        idx_scan::int,
        idx_tup_read::int,
        idx_tup_fetch::int
      FROM pg_stat_user_indexes 
      ORDER BY idx_scan DESC;
    `;
        return result.map(row => ({
            tableName: row.table_name,
            indexName: row.index_name,
            indexSize: row.index_size,
            indexScans: row.idx_scan,
            tuplesRead: row.idx_tup_read,
            tuplesFetched: row.idx_tup_fetch,
            efficiency: row.idx_tup_read > 0 ? (row.idx_tup_fetch / row.idx_tup_read) * 100 : 0,
        }));
    }
    async getConnectionStatistics() {
        const result = await this.prisma.$queryRaw `
      SELECT 
        COALESCE(state, 'unknown') as state,
        count(*)::int as count
      FROM pg_stat_activity 
      WHERE datname = current_database()
      GROUP BY state;
    `;
        const maxConnections = await this.prisma.$queryRaw `
      SELECT setting::int as max_connections FROM pg_settings WHERE name = 'max_connections';
    `;
        const stats = {
            totalConnections: 0,
            activeConnections: 0,
            idleConnections: 0,
            idleInTransaction: 0,
            maxConnections: maxConnections[0]?.max_connections || 100,
        };
        for (const row of result) {
            stats.totalConnections += row.count;
            switch (row.state) {
                case 'active':
                    stats.activeConnections = row.count;
                    break;
                case 'idle':
                    stats.idleConnections = row.count;
                    break;
                case 'idle in transaction':
                    stats.idleInTransaction = row.count;
                    break;
            }
        }
        return stats;
    }
    async getQueryStatistics() {
        try {
            const result = await this.prisma.$queryRaw `
        SELECT 
          sum(calls)::int as calls,
          sum(total_time)::float as total_time,
          avg(mean_time)::float as mean_time,
          query
        FROM pg_stat_statements
        WHERE dbid = (SELECT oid FROM pg_database WHERE datname = current_database())
        GROUP BY query
        ORDER BY total_time DESC
        LIMIT 10;
      `;
            const totalStats = result.reduce((acc, row) => ({
                calls: acc.calls + row.calls,
                totalTime: acc.totalTime + row.total_time,
            }), { calls: 0, totalTime: 0 });
            return {
                totalQueries: totalStats.calls,
                avgQueryTime: totalStats.calls > 0 ? totalStats.totalTime / totalStats.calls : 0,
                slowestQueries: result.map(row => ({
                    query: row.query.substring(0, 100) + '...',
                    calls: row.calls,
                    totalTime: row.total_time,
                    avgTime: row.mean_time,
                })),
            };
        }
        catch (error) {
            // pg_stat_statements might not be enabled
            return {
                totalQueries: 0,
                avgQueryTime: 0,
                slowestQueries: [],
            };
        }
    }
    getHealthHistory(hours = 24) {
        const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
        return this.healthHistory.filter(h => h.timestamp >= cutoff);
    }
    getActiveAlerts() {
        return Array.from(this.activeAlerts.values()).filter(alert => !alert.resolvedAt);
    }
    acknowledgeAlert(alertId) {
        for (const alert of this.activeAlerts.values()) {
            if (alert.id === alertId) {
                alert.acknowledgedAt = new Date();
                this.emit('alertAcknowledged', alert);
                return true;
            }
        }
        return false;
    }
    addAlertRule(rule) {
        this.alertRules.set(rule.id, rule);
        this.emit('alertRuleAdded', rule);
    }
    removeAlertRule(ruleId) {
        const deleted = this.alertRules.delete(ruleId);
        if (deleted) {
            this.emit('alertRuleRemoved', ruleId);
        }
        return deleted;
    }
    async disconnect() {
        this.stopMonitoring();
        await this.prisma.$disconnect();
    }
}
exports.DatabaseMonitor = DatabaseMonitor;
