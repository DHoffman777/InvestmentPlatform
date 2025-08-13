import { createClient, RedisClientType } from 'redis';
import { logger } from './logger';

let redisClient: RedisClientType | null = null;

export const initializeRedis = async (): Promise<RedisClientType> => {
  if (redisClient) {
    return redisClient;
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
  
  redisClient = createClient({
    url: redisUrl,
    socket: {
      connectTimeout: 5000,
      lazyConnect: true,
    },
  });

  redisClient.on('error', (err) => {
    logger.error('Redis Client Error:', err);
  });

  redisClient.on('connect', () => {
    logger.info('Redis client connected');
  });

  redisClient.on('ready', () => {
    logger.info('Redis client ready');
  });

  redisClient.on('end', () => {
    logger.info('Redis client disconnected');
  });

  try {
    await redisClient.connect();
    logger.info('Connected to Redis');
    return redisClient;
  } catch (error) {
    logger.error('Failed to connect to Redis:', error);
    throw error;
  }
};

export const getRedisClient = (): RedisClientType => {
  if (!redisClient) {
    throw new Error('Redis client not initialized. Call initializeRedis() first.');
  }
  return redisClient;
};

export const closeRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.disconnect();
    redisClient = null;
    logger.info('Redis connection closed');
  }
};

// Cache utilities for market data
export const cacheGet = async (key: string): Promise<string | null> => {
  try {
    const client = getRedisClient();
    return await client.get(key);
  } catch (error) {
    logger.error('Cache get error:', { key, error });
    return null;
  }
};

export const cacheSet = async (key: string, value: string, ttlSeconds?: number): Promise<boolean> => {
  try {
    const client = getRedisClient();
    if (ttlSeconds) {
      await client.setEx(key, ttlSeconds, value);
    } else {
      await client.set(key, value);
    }
    return true;
  } catch (error) {
    logger.error('Cache set error:', { key, error });
    return false;
  }
};

export const cacheDelete = async (key: string): Promise<boolean> => {
  try {
    const client = getRedisClient();
    const result = await client.del(key);
    return result > 0;
  } catch (error) {
    logger.error('Cache delete error:', { key, error });
    return false;
  }
};

export const cacheGetJSON = async <T>(key: string): Promise<T | null> => {
  try {
    const value = await cacheGet(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    logger.error('Cache get JSON error:', { key, error });
    return null;
  }
};

export const cacheSetJSON = async <T>(key: string, value: T, ttlSeconds?: number): Promise<boolean> => {
  try {
    return await cacheSet(key, JSON.stringify(value), ttlSeconds);
  } catch (error) {
    logger.error('Cache set JSON error:', { key, error });
    return false;
  }
};