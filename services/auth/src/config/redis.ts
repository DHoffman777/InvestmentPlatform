import { createClient } from 'redis';
import { logger } from './logger';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  password: process.env.REDIS_PASSWORD,
});

redisClient.on('error', (err) => {
  logger.error('Redis client error', err);
});

redisClient.on('connect', () => {
  logger.info('Connected to Redis');
});

redisClient.on('ready', () => {
  logger.info('Redis client ready');
});

export class CacheService {
  private static instance: CacheService;
  private client: typeof redisClient;

  private constructor() {
    this.client = redisClient;
  }

  public static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  async connect(): Promise<any> {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  async disconnect(): Promise<any> {
    if (this.client.isOpen) {
      await this.client.disconnect();
    }
  }

  async get(key: string): Promise<string | null> {
    try {
      return await this.client.get(key);
    } catch (error: any) {
      logger.error('Redis GET error:', { key, error });
      return null;
    }
  }

  async set(key: string, value: string, ttl?: number): Promise<any> {
    try {
      if (ttl) {
        await this.client.setEx(key, ttl, value);
      } else {
        await this.client.set(key, value);
      }
    } catch (error: any) {
      logger.error('Redis SET error:', { key, error });
    }
  }

  async del(key: string): Promise<any> {
    try {
      await this.client.del(key);
    } catch (error: any) {
      logger.error('Redis DEL error:', { key, error });
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error: any) {
      logger.error('Redis EXISTS error:', { key, error });
      return false;
    }
  }

  async incr(key: string): Promise<number> {
    try {
      return await this.client.incr(key);
    } catch (error: any) {
      logger.error('Redis INCR error:', { key, error });
      throw error;
    }
  }

  async expire(key: string, ttl: number): Promise<any> {
    try {
      await this.client.expire(key, ttl);
    } catch (error: any) {
      logger.error('Redis EXPIRE error:', { key, ttl, error });
    }
  }

  // Session management helpers
  async setSession(sessionId: string, data: any, ttl: number = 86400): Promise<any> {
    const key = `session:${sessionId}`;
    await this.set(key, JSON.stringify(data), ttl);
  }

  async getSession(sessionId: string): Promise<any | null> {
    const key = `session:${sessionId}`;
    const data = await this.get(key);
    return data ? JSON.parse(data) : null;
  }

  async deleteSession(sessionId: string): Promise<any> {
    const key = `session:${sessionId}`;
    await this.del(key);
  }

  // Rate limiting helpers
  async rateLimit(key: string, limit: number, window: number): Promise<{ allowed: boolean; remaining: number }> {
    const current = await this.incr(key);
    
    if (current === 1) {
      await this.expire(key, window);
    }

    return {
      allowed: current <= limit,
      remaining: Math.max(0, limit - current)
    };
  }
}

export { redisClient };
export default CacheService;

