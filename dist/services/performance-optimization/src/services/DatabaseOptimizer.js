"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseOptimizer = void 0;
const client_1 = require("@prisma/client");
const events_1 = require("events");
class DatabaseOptimizer extends events_1.EventEmitter {
    prisma;
    performanceMetrics = new Map();
    optimizationHistory = [];
    constructor() {
        super();
        this.prisma = new client_1.PrismaClient({
            log: [
                { emit: 'event', level: 'query' },
                { emit: 'event', level: 'info' },
                { emit: 'event', level: 'warn' },
                { emit: 'event', level: 'error' },
            ],
        });
        this.setupQueryMonitoring();
    }
    setupQueryMonitoring() {
        this.prisma.$on('query', (e) => {
            this.captureQueryMetrics(e);
        });
    }
    async captureQueryMetrics(queryEvent) {
        try {
            const startTime = Date.now();
            const queryId = this.generateQueryId(queryEvent.query);
            // Get connection pool info
            const poolInfo = await this.getConnectionPoolInfo();
            // Analyze query pattern
            const queryAnalysis = this.analyzeQuery(queryEvent.query);
            const metrics = {
                queryId,
                sqlQuery: queryEvent.query,
                executionTime: queryEvent.duration,
                rowsReturned: 0, // Will be populated from explain plan
                rowsExamined: 0, // Will be populated from explain plan
                tableName: queryAnalysis.tableName,
                operationType: queryAnalysis.operationType,
                timestamp: new Date(),
                indexesUsed: [], // Will be populated from explain plan
                connectionInfo: poolInfo,
            };
            // Get explain plan for SELECT queries
            if (queryAnalysis.operationType === 'SELECT') {
                try {
                    const explainPlan = await this.getExplainPlan(queryEvent.query);
                    metrics.queryPlan = explainPlan;
                    metrics.rowsExamined = this.extractRowsExamined(explainPlan);
                    metrics.indexesUsed = this.extractIndexesUsed(explainPlan);
                }
                catch (error) {
                    console.warn('Failed to get explain plan:', error);
                }
            }
            // Store metrics
            const tableMetrics = this.performanceMetrics.get(metrics.tableName) || [];
            tableMetrics.push(metrics);
            this.performanceMetrics.set(metrics.tableName, tableMetrics);
            // Emit events for real-time monitoring
            this.emit('queryExecuted', metrics);
            // Check for slow queries
            if (metrics.executionTime > 1000) { // > 1 second
                this.emit('slowQuery', metrics);
                this.analyzeSlowQuery(metrics);
            }
        }
        catch (error) {
            this.emit('error', error);
        }
    }
    generateQueryId(query) {
        // Create a hash-like ID based on query pattern
        const pattern = query.replace(/\$\d+/g, '?').replace(/\d+/g, 'N');
        return Buffer.from(pattern).toString('base64').substring(0, 16);
    }
    analyzeQuery(query) {
        const normalizedQuery = query.trim().toUpperCase();
        let operationType = 'SELECT';
        if (normalizedQuery.startsWith('INSERT'))
            operationType = 'INSERT';
        else if (normalizedQuery.startsWith('UPDATE'))
            operationType = 'UPDATE';
        else if (normalizedQuery.startsWith('DELETE'))
            operationType = 'DELETE';
        // Extract table name (simplified)
        const tableMatch = query.match(/(?:FROM|INTO|UPDATE)\s+["`]?(\w+)["`]?/i);
        const tableName = tableMatch ? tableMatch[1] : 'unknown';
        return { tableName, operationType };
    }
    async getConnectionPoolInfo() {
        try {
            // This would need to be adapted based on your connection pool implementation
            return {
                poolSize: 10, // Default, should be read from actual pool
                activeConnections: 5,
                idleConnections: 5,
            };
        }
        catch (error) {
            return {
                poolSize: 0,
                activeConnections: 0,
                idleConnections: 0,
            };
        }
    }
    async getExplainPlan(query) {
        try {
            const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`;
            const result = await this.prisma.$queryRawUnsafe(explainQuery);
            return result;
        }
        catch (error) {
            throw new Error(`Failed to get explain plan: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    extractRowsExamined(explainPlan) {
        try {
            // Parse PostgreSQL explain plan to extract rows examined
            if (explainPlan && explainPlan[0] && explainPlan[0]['QUERY PLAN']) {
                return explainPlan[0]['QUERY PLAN'][0]?.['Actual Rows'] || 0;
            }
            return 0;
        }
        catch (error) {
            return 0;
        }
    }
    extractIndexesUsed(explainPlan) {
        try {
            const indexes = [];
            const plan = explainPlan?.[0]?.['QUERY PLAN'];
            if (plan) {
                this.traversePlan(plan, (node) => {
                    if (node['Index Name']) {
                        indexes.push(node['Index Name']);
                    }
                });
            }
            return indexes;
        }
        catch (error) {
            return [];
        }
    }
    traversePlan(plan, callback) {
        if (Array.isArray(plan)) {
            plan.forEach(node => {
                callback(node);
                if (node.Plans) {
                    this.traversePlan(node.Plans, callback);
                }
            });
        }
        else if (plan && typeof plan === 'object') {
            callback(plan);
            if (plan.Plans) {
                this.traversePlan(plan.Plans, callback);
            }
        }
    }
    async analyzeSlowQueries(timeWindow = 3600000) {
        const cutoffTime = new Date(Date.now() - timeWindow);
        const slowQueries = new Map();
        // Group slow queries by pattern
        for (const [tableName, metrics] of this.performanceMetrics.entries()) {
            const recentSlowQueries = metrics.filter(m => m.timestamp >= cutoffTime && m.executionTime > 1000);
            for (const query of recentSlowQueries) {
                const pattern = this.normalizeQueryPattern(query.sqlQuery);
                const existing = slowQueries.get(pattern) || [];
                existing.push(query);
                slowQueries.set(pattern, existing);
            }
        }
        // Analyze patterns
        const analyses = [];
        for (const [pattern, queries] of slowQueries.entries()) {
            const analysis = {
                queryPattern: pattern,
                occurrences: queries.length,
                averageExecutionTime: queries.reduce((sum, q) => sum + q.executionTime, 0) / queries.length,
                maxExecutionTime: Math.max(...queries.map(q => q.executionTime)),
                totalExecutionTime: queries.reduce((sum, q) => sum + q.executionTime, 0),
                affectedTables: [...new Set(queries.map(q => q.tableName))],
                commonFilters: this.extractCommonFilters(queries),
                suggestedOptimizations: this.generateOptimizationSuggestions(queries),
            };
            analyses.push(analysis);
        }
        return analyses.sort((a, b) => b.totalExecutionTime - a.totalExecutionTime);
    }
    normalizeQueryPattern(query) {
        return query
            .replace(/\$\d+/g, '?')
            .replace(/\d+/g, 'N')
            .replace(/['"][^'"]*['"]/g, "'?'")
            .replace(/\s+/g, ' ')
            .trim();
    }
    extractCommonFilters(queries) {
        const filters = [];
        const wherePatterns = new Map();
        for (const query of queries) {
            const whereMatch = query.sqlQuery.match(/WHERE\s+(.+?)(?:\s+ORDER\s+BY|\s+GROUP\s+BY|\s+LIMIT|$)/i);
            if (whereMatch) {
                const normalized = whereMatch[1].replace(/\$\d+/g, '?').replace(/\d+/g, 'N');
                wherePatterns.set(normalized, (wherePatterns.get(normalized) || 0) + 1);
            }
        }
        // Return filters that appear in at least 30% of queries
        const threshold = Math.max(1, Math.floor(queries.length * 0.3));
        for (const [pattern, count] of wherePatterns.entries()) {
            if (count >= threshold) {
                filters.push(pattern);
            }
        }
        return filters;
    }
    generateOptimizationSuggestions(queries) {
        const suggestions = [];
        const sample = queries[0];
        // Check for missing indexes
        if (sample.indexesUsed.length === 0) {
            suggestions.push('Consider adding indexes on frequently filtered columns');
        }
        // Check for full table scans
        if (sample.queryPlan && this.hasFullTableScan(sample.queryPlan)) {
            suggestions.push('Query appears to perform full table scan - consider adding WHERE clause or index');
        }
        // Check execution time patterns
        const avgTime = queries.reduce((sum, q) => sum + q.executionTime, 0) / queries.length;
        if (avgTime > 5000) {
            suggestions.push('Consider breaking down complex query or optimizing joins');
        }
        // Check for N+1 problems
        if (queries.length > 100 && avgTime < 100) {
            suggestions.push('Possible N+1 query problem - consider using batch operations or includes');
        }
        return suggestions;
    }
    hasFullTableScan(queryPlan) {
        let hasSeqScan = false;
        this.traversePlan(queryPlan, (node) => {
            if (node['Node Type'] === 'Seq Scan') {
                hasSeqScan = true;
            }
        });
        return hasSeqScan;
    }
    async analyzeSlowQuery(metrics) {
        const recommendations = await this.generateRecommendations(metrics);
        for (const recommendation of recommendations) {
            this.optimizationHistory.push(recommendation);
            this.emit('optimizationRecommendation', recommendation);
        }
    }
    async generateRecommendations(metrics) {
        const recommendations = [];
        // Analyze for missing indexes
        if (metrics.indexesUsed.length === 0 && metrics.operationType === 'SELECT') {
            recommendations.push({
                id: `idx_${Date.now()}_${metrics.queryId}`,
                queryId: metrics.queryId,
                priority: 'HIGH',
                type: 'INDEX',
                title: 'Missing Index Detected',
                description: `Query on table ${metrics.tableName} is not using any indexes`,
                suggestedSolution: `Add composite index on frequently filtered columns`,
                estimatedImpact: {
                    performanceGain: 70,
                    confidenceLevel: 85,
                },
                implementation: {
                    effort: 'LOW',
                    riskLevel: 'LOW',
                    sqlCommands: [
                        `-- Analyze query patterns first`,
                        `-- CREATE INDEX CONCURRENTLY idx_${metrics.tableName}_optimized ON ${metrics.tableName} (column1, column2);`
                    ],
                },
                createdAt: new Date(),
            });
        }
        // Analyze for query rewrite opportunities
        if (metrics.executionTime > 5000) {
            recommendations.push({
                id: `qr_${Date.now()}_${metrics.queryId}`,
                queryId: metrics.queryId,
                priority: 'MEDIUM',
                type: 'QUERY_REWRITE',
                title: 'Query Optimization Opportunity',
                description: `Query execution time (${metrics.executionTime}ms) exceeds performance threshold`,
                suggestedSolution: 'Consider optimizing query structure, joins, or adding LIMIT clauses',
                estimatedImpact: {
                    performanceGain: 50,
                    confidenceLevel: 70,
                },
                implementation: {
                    effort: 'MEDIUM',
                    riskLevel: 'MEDIUM',
                },
                createdAt: new Date(),
            });
        }
        return recommendations;
    }
    async analyzeIndexUsage() {
        const analyses = [];
        try {
            // Get index statistics from PostgreSQL
            const indexStats = await this.prisma.$queryRaw `
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes
        ORDER BY idx_tup_read DESC;
      `;
            const indexInfo = await this.prisma.$queryRaw `
        SELECT 
          n.nspname as schema_name,
          t.relname as table_name,
          i.relname as index_name,
          array_to_string(array_agg(a.attname), ', ') as column_names,
          ix.indisunique as is_unique
        FROM 
          pg_class t,
          pg_class i,
          pg_index ix,
          pg_attribute a,
          pg_namespace n
        WHERE 
          t.oid = ix.indrelid
          AND i.oid = ix.indexrelid
          AND a.attrelid = t.oid
          AND a.attnum = ANY(ix.indkey)
          AND t.relkind = 'r'
          AND n.oid = t.relnamespace
          AND n.nspname = 'public'
        GROUP BY 
          n.nspname, t.relname, i.relname, ix.indisunique
        ORDER BY 
          t.relname, i.relname;
      `;
            // Combine stats with info
            for (const info of indexInfo) {
                const stats = indexStats.find(s => s.tablename === info.table_name && s.indexname === info.index_name);
                const usage = stats ? {
                    totalQueries: stats.idx_tup_read || 0,
                    averageSelectivity: this.calculateSelectivity(stats),
                    maintenanceCost: this.estimateMaintenanceCost(info.table_name),
                } : {
                    totalQueries: 0,
                    averageSelectivity: 0,
                    maintenanceCost: 1,
                };
                const recommendations = this.analyzeIndexRecommendations(usage, info);
                analyses.push({
                    tableName: info.table_name,
                    indexName: info.index_name,
                    columns: info.column_names.split(', '),
                    isUnique: info.is_unique,
                    usage,
                    recommendations,
                });
            }
        }
        catch (error) {
            console.error('Error analyzing index usage:', error);
        }
        return analyses;
    }
    calculateSelectivity(stats) {
        const reads = stats.idx_tup_read || 0;
        const fetches = stats.idx_tup_fetch || 0;
        return reads > 0 ? (fetches / reads) * 100 : 0;
    }
    estimateMaintenanceCost(tableName) {
        // Simplified maintenance cost estimation
        // In practice, this would consider table size, update frequency, etc.
        return 1; // Base cost
    }
    analyzeIndexRecommendations(usage, info) {
        if (usage.totalQueries === 0) {
            return {
                action: 'DROP',
                reason: 'Index is not being used',
                impact: 'Reduce storage overhead and improve write performance',
            };
        }
        if (usage.averageSelectivity < 10) {
            return {
                action: 'MODIFY',
                reason: 'Low selectivity suggests index may not be optimal',
                impact: 'Could improve query performance with better column order',
            };
        }
        return {
            action: 'KEEP',
            reason: 'Index is being used effectively',
            impact: 'Continue providing query performance benefits',
        };
    }
    async generateOptimizationReport() {
        const slowQueries = await this.analyzeSlowQueries();
        const indexAnalysis = await this.analyzeIndexUsage();
        const allMetrics = Array.from(this.performanceMetrics.values()).flat();
        const totalQueries = allMetrics.length;
        const slowQueryCount = allMetrics.filter(m => m.executionTime > 1000).length;
        const averageExecutionTime = totalQueries > 0
            ? allMetrics.reduce((sum, m) => sum + m.executionTime, 0) / totalQueries
            : 0;
        return {
            summary: {
                totalQueries,
                slowQueries: slowQueryCount,
                averageExecutionTime,
                optimizationOpportunities: this.optimizationHistory.length,
            },
            slowQueries,
            indexAnalysis,
            recommendations: this.optimizationHistory.slice(-20), // Last 20 recommendations
        };
    }
    async disconnect() {
        await this.prisma.$disconnect();
    }
}
exports.DatabaseOptimizer = DatabaseOptimizer;
