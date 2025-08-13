import Redis from 'ioredis';
import { EventEmitter } from 'events';

export interface CacheConfig {
  redis: {
    host: string;
    port: number;
    password?: string;
    db: number;
    keyPrefix: string;
    cluster?: {
      nodes: Array<{ host: string; port: number }>;
      options: any;
    };
  };
  defaultTTL: number;
  compressionThreshold: number;
  maxMemoryPolicy: 'allkeys-lru' | 'volatile-lru' | 'allkeys-lfu' | 'volatile-lfu';
}

export interface CacheStrategy {
  name: string;
  pattern: RegExp;
  ttl: number;
  dependencies?: string[];
  invalidationRules: {
    events: string[];
    conditions: Array<(data: any) => boolean>;
  };
  warmupStrategy?: {
    enabled: boolean;
    schedule: string; // cron pattern
    priority: number;
  };
  compressionEnabled: boolean;
  tags: string[];
}

export interface CacheMetrics {
  key: string;
  pattern: string;
  hits: number;
  misses: number;
  hitRate: number;
  averageResponseTime: number;
  dataSize: number;
  ttl: number;
  createdAt: Date;
  lastAccessed: Date;
  expiresAt: Date;
}

export interface CachePerformanceReport {
  overall: {
    totalKeys: number;
    totalHits: number;
    totalMisses: number;
    overallHitRate: number;
    memoryUsage: number;
    evictions: number;
  };
  byPattern: Array<{
    pattern: string;
    keyCount: number;
    hitRate: number;
    averageSize: number;
    recommendations: string[];
  }>;
  topKeys: Array<{
    key: string;
    hits: number;
    size: number;
    efficiency: number;
  }>;
  recommendations: Array<{
    type: 'TTL_ADJUSTMENT' | 'PATTERN_OPTIMIZATION' | 'MEMORY_OPTIMIZATION' | 'STRATEGY_CHANGE';
    description: string;
    impact: 'LOW' | 'MEDIUM' | 'HIGH';
    implementation: string;
  }>;
}

export class CachingStrategy extends EventEmitter {
  private redis: Redis;
  private clusterClient?: Redis.Cluster;
  private strategies: Map<string, CacheStrategy> = new Map();
  private metrics: Map<string, CacheMetrics> = new Map();
  private config: CacheConfig;

  constructor(config: CacheConfig) {
    super();
    this.config = config;
    this.initializeRedis();
    this.initializeDefaultStrategies();
    this.startMetricsCollection();
  }

  private initializeRedis(): void {
    if (this.config.redis.cluster) {
      this.clusterClient = new Redis.Cluster(
        this.config.redis.cluster.nodes,
        this.config.redis.cluster.options
      );
      this.redis = this.clusterClient as any;
    } else {
      this.redis = new Redis({
        host: this.config.redis.host,
        port: this.config.redis.port,
        password: this.config.redis.password,
        db: this.config.redis.db,
        keyPrefix: this.config.redis.keyPrefix,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
      });
    }

    this.redis.on('connect', () => {
      this.emit('connected');
    });

    this.redis.on('error', (error) => {
      this.emit('error', error);
    });
  }

  private initializeDefaultStrategies(): void {
    const strategies: CacheStrategy[] = [
      {
        name: 'portfolio_data',
        pattern: /^portfolio:\d+:(positions|performance|summary)$/,
        ttl: 300, // 5 minutes
        dependencies: ['positions', 'market_data'],
        invalidationRules: {
          events: ['position_updated', 'trade_executed', 'market_data_updated'],
          conditions: [
            (data) => data.portfolioId !== undefined,
          ],
        },
        warmupStrategy: {
          enabled: true,
          schedule: '0 8 * * 1-5', // Weekdays at 8 AM
          priority: 1,
        },
        compressionEnabled: true,
        tags: ['portfolio', 'financial_data'],
      },
      {
        name: 'market_data',
        pattern: /^market_data:(quotes|historical):[A-Z]+$/,
        ttl: 60, // 1 minute for real-time data
        dependencies: ['external_market_feeds'],
        invalidationRules: {
          events: ['market_data_received'],
          conditions: [
            (data) => data.symbol !== undefined,
          ],
        },
        warmupStrategy: {
          enabled: true,
          schedule: '*/15 6-20 * * 1-5', // Every 15 minutes during market hours
          priority: 2,
        },
        compressionEnabled: false, // Small data, compression overhead not worth it
        tags: ['market_data', 'real_time'],
      },
      {
        name: 'user_session',
        pattern: /^session:[a-f0-9-]+$/,
        ttl: 3600, // 1 hour
        dependencies: ['authentication'],
        invalidationRules: {
          events: ['user_logout', 'session_expired'],
          conditions: [
            (data) => data.sessionId !== undefined,
          ],
        },
        compressionEnabled: false,
        tags: ['session', 'authentication'],
      },
      {
        name: 'analytics_reports',
        pattern: /^analytics:(performance|risk|allocation):[0-9-]+$/,
        ttl: 1800, // 30 minutes
        dependencies: ['portfolio_data', 'market_data'],
        invalidationRules: {
          events: ['portfolio_updated', 'market_close'],
          conditions: [
            (data) => data.portfolioId !== undefined || data.reportType !== undefined,
          ],
        },
        warmupStrategy: {
          enabled: true,
          schedule: '0 9,15 * * 1-5', // 9 AM and 3 PM on weekdays
          priority: 3,
        },
        compressionEnabled: true,
        tags: ['analytics', 'reports'],
      },
      {
        name: 'client_data',
        pattern: /^client:\d+:(profile|preferences|documents)$/,
        ttl: 900, // 15 minutes
        dependencies: ['user_management'],
        invalidationRules: {
          events: ['client_updated', 'preferences_changed'],
          conditions: [
            (data) => data.clientId !== undefined,
          ],
        },
        compressionEnabled: true,
        tags: ['client_data', 'profile'],
      },
    ];

    for (const strategy of strategies) {
      this.strategies.set(strategy.name, strategy);
    }
  }

  public async set(
    key: string,
    value: any,
    options?: {
      ttl?: number;
      tags?: string[];
      compress?: boolean;
    }
  ): Promise<boolean> {
    try {
      const strategy = this.findStrategy(key);
      const ttl = options?.ttl || strategy?.ttl || this.config.defaultTTL;
      const shouldCompress = options?.compress ?? 
                           (strategy?.compressionEnabled || false);

      let serializedValue = JSON.stringify(value);
      
      if (shouldCompress && serializedValue.length > this.config.compressionThreshold) {
        const zlib = await import('zlib');
        const compressed = zlib.gzipSync(serializedValue);
        serializedValue = `__compressed__${compressed.toString('base64')}`;
      }

      await this.redis.setex(key, ttl, serializedValue);
      
      // Update metrics
      this.updateMetrics(key, 'set', {
        dataSize: serializedValue.length,
        ttl,
        strategy: strategy?.name,
      });

      // Add tags if provided
      if (options?.tags || strategy?.tags) {
        const tags = [...(options?.tags || []), ...(strategy?.tags || [])];
        await this.addTags(key, tags);
      }

      this.emit('cacheSet', { key, ttl, size: serializedValue.length });
      return true;

    } catch (error) {
      this.emit('error', { operation: 'set', key, error });
      return false;
    }
  }

  public async get<T = any>(key: string): Promise<T | null> {
    try {
      const startTime = Date.now();
      const value = await this.redis.get(key);
      const responseTime = Date.now() - startTime;

      if (value === null) {
        this.updateMetrics(key, 'miss', { responseTime });
        this.emit('cacheMiss', { key });
        return null;
      }

      let deserializedValue = value;
      
      // Check if value is compressed
      if (value.startsWith('__compressed__')) {
        const zlib = await import('zlib');
        const compressedData = value.substring('__compressed__'.length);
        const decompressed = zlib.gunzipSync(Buffer.from(compressedData, 'base64'));
        deserializedValue = decompressed.toString();
      }

      const result = JSON.parse(deserializedValue);
      
      this.updateMetrics(key, 'hit', { responseTime });
      this.emit('cacheHit', { key, responseTime });
      
      return result;

    } catch (error) {
      this.emit('error', { operation: 'get', key, error });
      return null;
    }
  }

  public async mget<T = any>(keys: string[]): Promise<Array<T | null>> {
    try {
      const startTime = Date.now();
      const values = await this.redis.mget(...keys);
      const responseTime = Date.now() - startTime;

      const results: Array<T | null> = [];
      
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const value = values[i];

        if (value === null) {
          this.updateMetrics(key, 'miss', { responseTime: responseTime / keys.length });
          results.push(null);
          continue;
        }

        let deserializedValue = value;
        
        if (value.startsWith('__compressed__')) {
          const zlib = await import('zlib');
          const compressedData = value.substring('__compressed__'.length);
          const decompressed = zlib.gunzipSync(Buffer.from(compressedData, 'base64'));
          deserializedValue = decompressed.toString();
        }

        const result = JSON.parse(deserializedValue);
        this.updateMetrics(key, 'hit', { responseTime: responseTime / keys.length });
        results.push(result);
      }

      this.emit('cacheMultiGet', { keys, hitCount: results.filter(r => r !== null).length });
      return results;

    } catch (error) {
      this.emit('error', { operation: 'mget', keys, error });
      return keys.map(() => null);
    }
  }

  public async del(key: string | string[]): Promise<number> {
    try {
      const keys = Array.isArray(key) ? key : [key];
      const deletedCount = await this.redis.del(...keys);
      
      // Remove from metrics
      for (const k of keys) {
        this.metrics.delete(k);
      }

      this.emit('cacheDeleted', { keys, count: deletedCount });
      return deletedCount;

    } catch (error) {
      this.emit('error', { operation: 'del', key, error });
      return 0;
    }
  }

  public async invalidateByTag(tag: string): Promise<number> {
    try {
      const keys = await this.redis.smembers(`tag:${tag}`);
      if (keys.length === 0) return 0;

      const deletedCount = await this.redis.del(...keys);
      await this.redis.del(`tag:${tag}`);

      this.emit('cacheInvalidatedByTag', { tag, keys, count: deletedCount });
      return deletedCount;

    } catch (error) {
      this.emit('error', { operation: 'invalidateByTag', tag, error });
      return 0;
    }
  }

  public async invalidateByPattern(pattern: string): Promise<number> {
    try {
      const keys: string[] = [];
      const scanStream = this.redis.scanStream({
        match: pattern,
        count: 100,
      });

      for await (const keysChunk of scanStream) {
        keys.push(...keysChunk);
      }

      if (keys.length === 0) return 0;

      const deletedCount = await this.redis.del(...keys);
      this.emit('cacheInvalidatedByPattern', { pattern, keys, count: deletedCount });
      return deletedCount;

    } catch (error) {
      this.emit('error', { operation: 'invalidateByPattern', pattern, error });
      return 0;
    }
  }

  private async addTags(key: string, tags: string[]): Promise<void> {
    const pipeline = this.redis.pipeline();
    
    for (const tag of tags) {
      pipeline.sadd(`tag:${tag}`, key);
      pipeline.expire(`tag:${tag}`, 86400); // Tag expires in 24 hours
    }
    
    await pipeline.exec();
  }

  private findStrategy(key: string): CacheStrategy | undefined {
    for (const strategy of this.strategies.values()) {
      if (strategy.pattern.test(key)) {
        return strategy;
      }
    }
    return undefined;
  }

  private updateMetrics(
    key: string,
    operation: 'hit' | 'miss' | 'set',
    data: {
      responseTime?: number;
      dataSize?: number;
      ttl?: number;
      strategy?: string;
    }
  ): void {
    const existing = this.metrics.get(key);
    const now = new Date();

    if (!existing) {
      this.metrics.set(key, {
        key,
        pattern: this.findStrategy(key)?.name || 'unknown',
        hits: operation === 'hit' ? 1 : 0,
        misses: operation === 'miss' ? 1 : 0,
        hitRate: operation === 'hit' ? 1 : 0,
        averageResponseTime: data.responseTime || 0,
        dataSize: data.dataSize || 0,
        ttl: data.ttl || 0,
        createdAt: now,
        lastAccessed: now,
        expiresAt: new Date(now.getTime() + (data.ttl || 0) * 1000),
      });
    } else {
      if (operation === 'hit') {
        existing.hits++;
      } else if (operation === 'miss') {
        existing.misses++;
      }

      existing.hitRate = existing.hits / (existing.hits + existing.misses);
      existing.lastAccessed = now;

      if (data.responseTime) {
        existing.averageResponseTime = 
          (existing.averageResponseTime + data.responseTime) / 2;
      }
    }
  }

  public async warmupCache(): Promise<void> {
    const warmupStrategies = Array.from(this.strategies.values())
      .filter(s => s.warmupStrategy?.enabled)
      .sort((a, b) => (a.warmupStrategy?.priority || 0) - (b.warmupStrategy?.priority || 0));

    for (const strategy of warmupStrategies) {
      try {
        await this.executeWarmupStrategy(strategy);
      } catch (error) {
        this.emit('warmupError', { strategy: strategy.name, error });
      }
    }

    this.emit('warmupCompleted', { strategiesWarmed: warmupStrategies.length });
  }

  private async executeWarmupStrategy(strategy: CacheStrategy): Promise<void> {
    // This would be implemented based on specific business logic
    // For now, we'll emit an event that can be handled by the application
    this.emit('executeWarmup', strategy);
  }

  public async getPerformanceReport(): Promise<CachePerformanceReport> {
    const info = await this.redis.info('memory');
    const memoryUsage = this.parseMemoryInfo(info);
    
    const allMetrics = Array.from(this.metrics.values());
    const totalHits = allMetrics.reduce((sum, m) => sum + m.hits, 0);
    const totalMisses = allMetrics.reduce((sum, m) => sum + m.misses, 0);

    // Group by pattern
    const byPattern = new Map<string, CacheMetrics[]>();
    for (const metric of allMetrics) {
      const pattern = metric.pattern;
      const existing = byPattern.get(pattern) || [];
      existing.push(metric);
      byPattern.set(pattern, existing);
    }

    const patternAnalysis = Array.from(byPattern.entries()).map(([pattern, metrics]) => {
      const totalHitsForPattern = metrics.reduce((sum, m) => sum + m.hits, 0);
      const totalMissesForPattern = metrics.reduce((sum, m) => sum + m.misses, 0);
      const hitRate = totalHitsForPattern / (totalHitsForPattern + totalMissesForPattern);
      const averageSize = metrics.reduce((sum, m) => sum + m.dataSize, 0) / metrics.length;

      const recommendations = this.generatePatternRecommendations(pattern, hitRate, averageSize, metrics);

      return {
        pattern,
        keyCount: metrics.length,
        hitRate,
        averageSize,
        recommendations,
      };
    });

    // Top performing keys
    const topKeys = allMetrics
      .map(m => ({
        key: m.key,
        hits: m.hits,
        size: m.dataSize,
        efficiency: m.hits / Math.max(m.dataSize / 1024, 1), // hits per KB
      }))
      .sort((a, b) => b.efficiency - a.efficiency)
      .slice(0, 20);

    const recommendations = this.generateGlobalRecommendations(allMetrics, memoryUsage);

    return {
      overall: {
        totalKeys: allMetrics.length,
        totalHits,
        totalMisses,
        overallHitRate: totalHits / (totalHits + totalMisses),
        memoryUsage: memoryUsage.used,
        evictions: memoryUsage.evictions,
      },
      byPattern: patternAnalysis,
      topKeys,
      recommendations,
    };
  }

  private parseMemoryInfo(info: string): { used: number; evictions: number } {
    const lines = info.split('\r\n');
    let used = 0;
    let evictions = 0;

    for (const line of lines) {
      if (line.startsWith('used_memory:')) {
        used = parseInt(line.split(':')[1]);
      } else if (line.startsWith('evicted_keys:')) {
        evictions = parseInt(line.split(':')[1]);
      }
    }

    return { used, evictions };
  }

  private generatePatternRecommendations(
    pattern: string,
    hitRate: number,
    averageSize: number,
    metrics: CacheMetrics[]
  ): string[] {
    const recommendations: string[] = [];

    if (hitRate < 0.7) {
      recommendations.push('Consider increasing TTL or reviewing cache invalidation strategy');
    }

    if (averageSize > 100 * 1024) { // 100KB
      recommendations.push('Enable compression for large data sets');
    }

    const oldestMetric = metrics.reduce((oldest, current) => 
      current.createdAt < oldest.createdAt ? current : oldest
    );
    
    const daysSinceCreation = (Date.now() - oldestMetric.createdAt.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceCreation > 7 && hitRate < 0.3) {
      recommendations.push('Consider removing unused cache keys');
    }

    return recommendations;
  }

  private generateGlobalRecommendations(
    metrics: CacheMetrics[],
    memoryInfo: { used: number; evictions: number }
  ): CachePerformanceReport['recommendations'] {
    const recommendations: CachePerformanceReport['recommendations'] = [];

    // High eviction rate
    if (memoryInfo.evictions > 1000) {
      recommendations.push({
        type: 'MEMORY_OPTIMIZATION',
        description: 'High eviction rate detected. Consider increasing Redis memory limit or optimizing TTL values.',
        impact: 'HIGH',
        implementation: 'Increase maxmemory setting or implement smarter TTL strategies',
      });
    }

    // Low overall hit rate
    const totalHits = metrics.reduce((sum, m) => sum + m.hits, 0);
    const totalMisses = metrics.reduce((sum, m) => sum + m.misses, 0);
    const overallHitRate = totalHits / (totalHits + totalMisses);

    if (overallHitRate < 0.8) {
      recommendations.push({
        type: 'STRATEGY_CHANGE',
        description: 'Overall hit rate is below optimal. Review caching strategies and TTL values.',
        impact: 'MEDIUM',
        implementation: 'Analyze access patterns and adjust cache strategies accordingly',
      });
    }

    // Large average data size
    const averageDataSize = metrics.reduce((sum, m) => sum + m.dataSize, 0) / metrics.length;
    if (averageDataSize > 50 * 1024) {
      recommendations.push({
        type: 'PATTERN_OPTIMIZATION',
        description: 'Large average cache entry size. Consider enabling compression or caching smaller data sets.',
        impact: 'MEDIUM',
        implementation: 'Enable compression for entries over threshold or break down large objects',
      });
    }

    return recommendations;
  }

  private startMetricsCollection(): void {
    // Collect Redis info every minute
    setInterval(async () => {
      try {
        const info = await this.redis.info('stats');
        this.emit('metricsCollected', { timestamp: new Date(), info });
      } catch (error) {
        this.emit('error', { operation: 'metricsCollection', error });
      }
    }, 60000);
  }

  public addStrategy(strategy: CacheStrategy): void {
    this.strategies.set(strategy.name, strategy);
    this.emit('strategyAdded', strategy);
  }

  public removeStrategy(name: string): boolean {
    const removed = this.strategies.delete(name);
    if (removed) {
      this.emit('strategyRemoved', name);
    }
    return removed;
  }

  public getStrategies(): CacheStrategy[] {
    return Array.from(this.strategies.values());
  }

  public async disconnect(): Promise<void> {
    await this.redis.quit();
    if (this.clusterClient) {
      await this.clusterClient.quit();
    }
  }
}