import { PrismaClient } from '@prisma/client';

export interface FinancialQueryPattern {
  id: string;
  name: string;
  description: string;
  sqlPattern: RegExp;
  optimizationStrategy: string;
  recommendedIndexes: string[];
  estimatedImpact: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface QueryOptimizationPlan {
  queryId: string;
  originalQuery: string;
  optimizedQuery: string;
  optimizationSteps: OptimizationStep[];
  estimatedPerformanceGain: number;
  implementationRisk: 'LOW' | 'MEDIUM' | 'HIGH';
  testingSuggestions: string[];
}

export interface OptimizationStep {
  step: number;
  type: 'INDEX_CREATION' | 'QUERY_REWRITE' | 'SCHEMA_CHANGE' | 'CONFIGURATION';
  description: string;
  sqlCommands: string[];
  expectedGain: number;
  dependencies?: string[];
}

export interface PerformanceBenchmark {
  queryType: string;
  tableSize: 'SMALL' | 'MEDIUM' | 'LARGE' | 'XLARGE';
  benchmarkResults: {
    baseline: number;
    optimized: number;
    improvement: number;
  };
  date: Date;
}

export class QueryPerformanceAnalyzer extends PrismaClient {
  private financialQueryPatterns: FinancialQueryPattern[] = [];

  constructor() {
    super();
    this.initializeFinancialPatterns();
  }

  private initializeFinancialPatterns(): void {
    this.financialQueryPatterns = [
      {
        id: 'portfolio_performance_calc',
        name: 'Portfolio Performance Calculation',
        description: 'Queries calculating portfolio returns over time periods',
        sqlPattern: /SELECT.*FROM.*positions.*transactions.*WHERE.*date.*BETWEEN/i,
        optimizationStrategy: 'Create composite indexes on date ranges and portfolio IDs, consider materialized views for common time periods',
        recommendedIndexes: [
          'idx_transactions_portfolio_date',
          'idx_positions_portfolio_date',
          'idx_performance_portfolio_period'
        ],
        estimatedImpact: 'HIGH'
      },
      {
        id: 'real_time_valuation',
        name: 'Real-time Portfolio Valuation',
        description: 'Queries for calculating current portfolio values with market data',
        sqlPattern: /SELECT.*FROM.*positions.*JOIN.*market_data.*WHERE.*symbol.*IN/i,
        optimizationStrategy: 'Implement Redis caching for market data, create covering indexes, consider read replicas',
        recommendedIndexes: [
          'idx_market_data_symbol_date',
          'idx_positions_portfolio_symbol',
          'idx_covering_positions_valuation'
        ],
        estimatedImpact: 'HIGH'
      },
      {
        id: 'risk_aggregation',
        name: 'Risk Metrics Aggregation',
        description: 'Queries aggregating risk metrics across portfolios and asset classes',
        sqlPattern: /SELECT.*SUM|AVG|COUNT.*FROM.*positions.*GROUP.*BY.*asset_class|sector/i,
        optimizationStrategy: 'Create summary tables updated via triggers, implement column store indexes',
        recommendedIndexes: [
          'idx_positions_asset_class_risk',
          'idx_positions_sector_date',
          'idx_risk_metrics_portfolio'
        ],
        estimatedImpact: 'MEDIUM'
      },
      {
        id: 'transaction_history',
        name: 'Transaction History Queries',
        description: 'Historical transaction searches with multiple filters',
        sqlPattern: /SELECT.*FROM.*transactions.*WHERE.*date.*AND.*(symbol|amount|type)/i,
        optimizationStrategy: 'Partition tables by date, create filtered indexes, implement archiving strategy',
        recommendedIndexes: [
          'idx_transactions_date_symbol',
          'idx_transactions_portfolio_type_date',
          'idx_transactions_amount_date'
        ],
        estimatedImpact: 'MEDIUM'
      },
      {
        id: 'compliance_monitoring',
        name: 'Compliance Rule Monitoring',
        description: 'Queries checking portfolio compliance against investment rules',
        sqlPattern: /SELECT.*FROM.*positions.*WHERE.*(percentage|limit|restriction)/i,
        optimizationStrategy: 'Create specialized compliance indexes, implement rule-based materialized views',
        recommendedIndexes: [
          'idx_positions_compliance_check',
          'idx_portfolio_restrictions',
          'idx_asset_allocation_limits'
        ],
        estimatedImpact: 'MEDIUM'
      },
      {
        id: 'client_reporting',
        name: 'Client Reporting Queries',
        description: 'Complex reporting queries joining multiple entities',
        sqlPattern: /SELECT.*FROM.*portfolios.*JOIN.*clients.*JOIN.*positions.*ORDER.*BY/i,
        optimizationStrategy: 'Create dedicated reporting schemas, implement incremental refresh strategies',
        recommendedIndexes: [
          'idx_reporting_client_portfolio',
          'idx_positions_reporting_date',
          'idx_clients_portfolio_hierarchy'
        ],
        estimatedImpact: 'HIGH'
      }
    ];
  }

  public analyzeQuery(query: string): {
    matchedPatterns: FinancialQueryPattern[];
    optimizationPlan: QueryOptimizationPlan | null;
  } {
    const matchedPatterns = this.financialQueryPatterns.filter(
      pattern => pattern.sqlPattern.test(query)
    );

    let optimizationPlan: QueryOptimizationPlan | null = null;
    if (matchedPatterns.length > 0) {
      optimizationPlan = this.generateOptimizationPlan(query, matchedPatterns[0]);
    }

    return {
      matchedPatterns,
      optimizationPlan
    };
  }

  private generateOptimizationPlan(query: string, pattern: FinancialQueryPattern): QueryOptimizationPlan {
    const queryId = Buffer.from(query.substring(0, 100)).toString('base64').substring(0, 16);
    
    const optimizationSteps: OptimizationStep[] = [];
    let estimatedGain = 0;

    // Step 1: Index creation
    if (pattern.recommendedIndexes.length > 0) {
      optimizationSteps.push({
        step: 1,
        type: 'INDEX_CREATION',
        description: `Create optimized indexes for ${pattern.name}`,
        sqlCommands: pattern.recommendedIndexes.map(idx => 
          `CREATE INDEX CONCURRENTLY ${idx} ON ${this.extractTableName(query)} (${this.extractColumns(query, idx)});`
        ),
        expectedGain: 40,
      });
      estimatedGain += 40;
    }

    // Step 2: Query rewrite
    const optimizedQuery = this.rewriteQuery(query, pattern);
    if (optimizedQuery !== query) {
      optimizationSteps.push({
        step: 2,
        type: 'QUERY_REWRITE',
        description: 'Optimize query structure and joins',
        sqlCommands: [optimizedQuery],
        expectedGain: 30,
        dependencies: ['INDEX_CREATION'],
      });
      estimatedGain += 30;
    }

    // Step 3: Schema optimizations
    if (this.needsSchemaOptimization(query, pattern)) {
      optimizationSteps.push({
        step: 3,
        type: 'SCHEMA_CHANGE',
        description: 'Implement schema optimizations for better performance',
        sqlCommands: this.generateSchemaOptimizations(query, pattern),
        expectedGain: 20,
        dependencies: ['INDEX_CREATION'],
      });
      estimatedGain += 20;
    }

    return {
      queryId,
      originalQuery: query,
      optimizedQuery: optimizedQuery,
      optimizationSteps,
      estimatedPerformanceGain: Math.min(estimatedGain, 85), // Cap at 85%
      implementationRisk: this.assessImplementationRisk(optimizationSteps),
      testingSuggestions: this.generateTestingSuggestions(pattern),
    };
  }

  private extractTableName(query: string): string {
    const match = query.match(/FROM\s+(\w+)/i);
    return match ? match[1] : 'table_name';
  }

  private extractColumns(query: string, indexName: string): string {
    // Simplified column extraction based on common patterns
    const patterns = {
      'portfolio_date': 'portfolio_id, date',
      'symbol_date': 'symbol, date DESC',
      'compliance': 'portfolio_id, asset_class, percentage',
      'reporting': 'client_id, portfolio_id, created_at DESC',
    };

    for (const [key, columns] of Object.entries(patterns)) {
      if (indexName.includes(key)) {
        return columns;
      }
    }

    return 'id'; // Default
  }

  private rewriteQuery(query: string, pattern: FinancialQueryPattern): string {
    let optimized = query;

    // Apply pattern-specific optimizations
    switch (pattern.id) {
      case 'portfolio_performance_calc':
        optimized = this.optimizePerformanceCalculation(optimized);
        break;
      case 'real_time_valuation':
        optimized = this.optimizeValuationQuery(optimized);
        break;
      case 'risk_aggregation':
        optimized = this.optimizeRiskAggregation(optimized);
        break;
      case 'transaction_history':
        optimized = this.optimizeTransactionHistory(optimized);
        break;
      case 'compliance_monitoring':
        optimized = this.optimizeComplianceQuery(optimized);
        break;
      case 'client_reporting':
        optimized = this.optimizeReportingQuery(optimized);
        break;
    }

    return optimized;
  }

  private optimizePerformanceCalculation(query: string): string {
    // Add date range optimization and proper ordering
    let optimized = query;
    
    // Ensure proper date indexing
    if (!query.includes('ORDER BY')) {
      optimized += ' ORDER BY date DESC';
    }
    
    // Add LIMIT if not present for pagination
    if (!query.includes('LIMIT') && query.includes('SELECT')) {
      optimized = optimized.replace('SELECT', 'SELECT /*+ USE_INDEX(idx_transactions_portfolio_date) */');
    }
    
    return optimized;
  }

  private optimizeValuationQuery(query: string): string {
    // Optimize real-time valuation queries
    let optimized = query;
    
    // Add hints for join optimization
    if (query.includes('JOIN market_data')) {
      optimized = optimized.replace(
        'JOIN market_data',
        'JOIN market_data /*+ USE_INDEX(idx_market_data_symbol_date) */'
      );
    }
    
    return optimized;
  }

  private optimizeRiskAggregation(query: string): string {
    // Optimize aggregation queries
    let optimized = query;
    
    // Add proper grouping hints
    if (query.includes('GROUP BY')) {
      optimized = optimized.replace('GROUP BY', '/*+ USE_HASH_AGGREGATION */ GROUP BY');
    }
    
    return optimized;
  }

  private optimizeTransactionHistory(query: string): string {
    // Optimize transaction history queries
    let optimized = query;
    
    // Add date range optimization
    if (query.includes('WHERE') && query.includes('date')) {
      optimized = optimized.replace(
        'WHERE',
        'WHERE /*+ INDEX_RANGE_SCAN(transactions idx_transactions_date_symbol) */'
      );
    }
    
    return optimized;
  }

  private optimizeComplianceQuery(query: string): string {
    // Optimize compliance monitoring queries
    let optimized = query;
    
    // Add covering index hints
    if (query.includes('percentage') || query.includes('limit')) {
      optimized = optimized.replace('SELECT', 'SELECT /*+ INDEX_FAST_FULL_SCAN */');
    }
    
    return optimized;
  }

  private optimizeReportingQuery(query: string): string {
    // Optimize complex reporting queries
    let optimized = query;
    
    // Optimize join order
    optimized = optimized.replace(/JOIN/g, '/*+ ORDERED */ JOIN');
    
    return optimized;
  }

  private needsSchemaOptimization(query: string, pattern: FinancialQueryPattern): boolean {
    // Determine if schema changes would benefit this query pattern
    return pattern.estimatedImpact === 'HIGH' && (
      query.includes('GROUP BY') ||
      query.includes('SUM(') ||
      query.includes('COUNT(') ||
      query.includes('BETWEEN')
    );
  }

  private generateSchemaOptimizations(query: string, pattern: FinancialQueryPattern): string[] {
    const optimizations: string[] = [];

    switch (pattern.id) {
      case 'portfolio_performance_calc':
        optimizations.push(
          `CREATE MATERIALIZED VIEW mv_portfolio_performance AS
           SELECT portfolio_id, 
                  date_trunc('month', date) as month,
                  SUM(value) as total_value,
                  AVG(return_rate) as avg_return
           FROM positions 
           GROUP BY portfolio_id, date_trunc('month', date);`,
          `CREATE INDEX idx_mv_portfolio_performance ON mv_portfolio_performance (portfolio_id, month);`
        );
        break;
      
      case 'real_time_valuation':
        optimizations.push(
          `CREATE TABLE market_data_cache AS SELECT * FROM market_data WHERE date = CURRENT_DATE;`,
          `CREATE INDEX idx_market_data_cache_symbol ON market_data_cache (symbol);`
        );
        break;
        
      case 'risk_aggregation':
        optimizations.push(
          `CREATE TABLE risk_summary (
             portfolio_id UUID,
             asset_class VARCHAR(50),
             risk_metric DECIMAL(10,4),
             calculation_date DATE,
             PRIMARY KEY (portfolio_id, asset_class, calculation_date)
           );`,
          `CREATE INDEX idx_risk_summary_date ON risk_summary (calculation_date DESC);`
        );
        break;
    }

    return optimizations;
  }

  private assessImplementationRisk(steps: OptimizationStep[]): 'LOW' | 'MEDIUM' | 'HIGH' {
    const hasSchemaChanges = steps.some(s => s.type === 'SCHEMA_CHANGE');
    const hasComplexRewrites = steps.some(s => s.type === 'QUERY_REWRITE' && s.expectedGain > 30);
    
    if (hasSchemaChanges && hasComplexRewrites) return 'HIGH';
    if (hasSchemaChanges || hasComplexRewrites) return 'MEDIUM';
    return 'LOW';
  }

  private generateTestingSuggestions(pattern: FinancialQueryPattern): string[] {
    const suggestions = [
      'Run EXPLAIN ANALYZE on both original and optimized queries',
      'Test with representative data volumes',
      'Verify results match between original and optimized queries',
      'Monitor query performance over time',
    ];

    // Add pattern-specific testing suggestions
    switch (pattern.id) {
      case 'portfolio_performance_calc':
        suggestions.push(
          'Test with various date ranges and portfolio sizes',
          'Validate calculation accuracy against known benchmarks'
        );
        break;
      case 'real_time_valuation':
        suggestions.push(
          'Test under high market volatility conditions',
          'Verify cache invalidation works correctly'
        );
        break;
      case 'risk_aggregation':
        suggestions.push(
          'Test aggregation accuracy with edge cases',
          'Validate risk calculations meet regulatory requirements'
        );
        break;
    }

    return suggestions;
  }

  public async benchmarkQuery(
    query: string,
    iterations: number = 10
  ): Promise<{
    averageExecutionTime: number;
    minExecutionTime: number;
    maxExecutionTime: number;
    standardDeviation: number;
    executionPlan: any;
  }> {
    const executionTimes: number[] = [];
    let executionPlan: any = null;

    // Get execution plan first
    try {
      const explainResult = await this.$queryRawUnsafe(`EXPLAIN (ANALYZE, BUFFERS) ${query}`);
      executionPlan = explainResult;
    } catch (error) {
      console.warn('Could not get execution plan:', error);
    }

    // Run benchmark iterations
    for (let i = 0; i < iterations; i++) {
      const startTime = Date.now();
      
      try {
        await this.$queryRawUnsafe(query);
        const executionTime = Date.now() - startTime;
        executionTimes.push(executionTime);
      } catch (error) {
        console.error(`Benchmark iteration ${i + 1} failed:`, error);
      }
    }

    // Calculate statistics
    const averageExecutionTime = executionTimes.reduce((sum, time) => sum + time, 0) / executionTimes.length;
    const minExecutionTime = Math.min(...executionTimes);
    const maxExecutionTime = Math.max(...executionTimes);
    
    const variance = executionTimes.reduce((sum, time) => sum + Math.pow(time - averageExecutionTime, 2), 0) / executionTimes.length;
    const standardDeviation = Math.sqrt(variance);

    return {
      averageExecutionTime,
      minExecutionTime,
      maxExecutionTime,
      standardDeviation,
      executionPlan,
    };
  }

  public async generateOptimizationReport(queries: string[]): Promise<{
    totalQueriesAnalyzed: number;
    patternsMatched: { [key: string]: number };
    optimizationPlans: QueryOptimizationPlan[];
    estimatedTotalGain: number;
    implementationPriority: Array<{
      queryId: string;
      priority: number;
      reason: string;
    }>;
  }> {
    const patternsMatched: { [key: string]: number } = {};
    const optimizationPlans: QueryOptimizationPlan[] = [];
    let totalEstimatedGain = 0;

    for (const query of queries) {
      const analysis = this.analyzeQuery(query);
      
      for (const pattern of analysis.matchedPatterns) {
        patternsMatched[pattern.name] = (patternsMatched[pattern.name] || 0) + 1;
      }

      if (analysis.optimizationPlan) {
        optimizationPlans.push(analysis.optimizationPlan);
        totalEstimatedGain += analysis.optimizationPlan.estimatedPerformanceGain;
      }
    }

    // Calculate implementation priority
    const implementationPriority = optimizationPlans
      .map(plan => ({
        queryId: plan.queryId,
        priority: this.calculatePriority(plan),
        reason: this.getPriorityReason(plan),
      }))
      .sort((a, b) => b.priority - a.priority);

    return {
      totalQueriesAnalyzed: queries.length,
      patternsMatched,
      optimizationPlans,
      estimatedTotalGain: totalEstimatedGain / queries.length,
      implementationPriority,
    };
  }

  private calculatePriority(plan: QueryOptimizationPlan): number {
    let priority = plan.estimatedPerformanceGain;
    
    // Reduce priority for high-risk implementations
    if (plan.implementationRisk === 'HIGH') priority *= 0.7;
    else if (plan.implementationRisk === 'MEDIUM') priority *= 0.85;
    
    // Increase priority for low-effort optimizations
    const hasLowEffort = plan.optimizationSteps.some(step => 
      step.type === 'INDEX_CREATION' && step.expectedGain > 30
    );
    if (hasLowEffort) priority *= 1.2;
    
    return Math.round(priority);
  }

  private getPriorityReason(plan: QueryOptimizationPlan): string {
    if (plan.estimatedPerformanceGain > 60) {
      return 'High performance gain potential';
    }
    if (plan.implementationRisk === 'LOW' && plan.estimatedPerformanceGain > 30) {
      return 'Low risk with good performance improvement';
    }
    if (plan.optimizationSteps.length === 1) {
      return 'Simple implementation with immediate benefits';
    }
    return 'Standard optimization opportunity';
  }
}