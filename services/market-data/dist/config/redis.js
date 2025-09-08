"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.cacheSetJSON = exports.cacheGetJSON = exports.cacheDelete = exports.cacheSet = exports.cacheGet = exports.closeRedis = exports.getRedisClient = exports.initializeRedis = void 0;
const redis_1 = require("redis");
const logger_1 = require("./logger");
let redisClient = null;
const initializeRedis = async () => {
    if (redisClient) {
        return redisClient;
    }
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    redisClient = (0, redis_1.createClient)({
        url: redisUrl,
        socket: {
            connectTimeout: 5000,
        },
    });
    redisClient.on('error', (err) => {
        logger_1.logger.error('Redis Client Error:', err);
    });
    redisClient.on('connect', () => {
        logger_1.logger.info('Redis client connected');
    });
    redisClient.on('ready', () => {
        logger_1.logger.info('Redis client ready');
    });
    redisClient.on('end', () => {
        logger_1.logger.info('Redis client disconnected');
    });
    try {
        await redisClient.connect();
        logger_1.logger.info('Connected to Redis');
        return redisClient;
    }
    catch (error) {
        logger_1.logger.error('Failed to connect to Redis:', error);
        throw error;
    }
};
exports.initializeRedis = initializeRedis;
const getRedisClient = () => {
    if (!redisClient) {
        throw new Error('Redis client not initialized. Call initializeRedis() first.');
    }
    return redisClient;
};
exports.getRedisClient = getRedisClient;
const closeRedis = async () => {
    if (redisClient) {
        await redisClient.disconnect();
        redisClient = null;
        logger_1.logger.info('Redis connection closed');
    }
};
exports.closeRedis = closeRedis;
// Cache utilities for market data
const cacheGet = async (key) => {
    try {
        const client = (0, exports.getRedisClient)();
        return await client.get(key);
    }
    catch (error) {
        logger_1.logger.error('Cache get error:', { key, error });
        return null;
    }
};
exports.cacheGet = cacheGet;
const cacheSet = async (key, value, ttlSeconds) => {
    try {
        const client = (0, exports.getRedisClient)();
        if (ttlSeconds) {
            await client.setEx(key, ttlSeconds, value);
        }
        else {
            await client.set(key, value);
        }
        return true;
    }
    catch (error) {
        logger_1.logger.error('Cache set error:', { key, error });
        return false;
    }
};
exports.cacheSet = cacheSet;
const cacheDelete = async (key) => {
    try {
        const client = (0, exports.getRedisClient)();
        const result = await client.del(key);
        return result > 0;
    }
    catch (error) {
        logger_1.logger.error('Cache delete error:', { key, error });
        return false;
    }
};
exports.cacheDelete = cacheDelete;
const cacheGetJSON = async (key) => {
    try {
        const value = await (0, exports.cacheGet)(key);
        return value ? JSON.parse(value) : null;
    }
    catch (error) {
        logger_1.logger.error('Cache get JSON error:', { key, error });
        return null;
    }
};
exports.cacheGetJSON = cacheGetJSON;
const cacheSetJSON = async (key, value, ttlSeconds) => {
    try {
        return await (0, exports.cacheSet)(key, JSON.stringify(value), ttlSeconds);
    }
    catch (error) {
        logger_1.logger.error('Cache set JSON error:', { key, error });
        return false;
    }
};
exports.cacheSetJSON = cacheSetJSON;
//# sourceMappingURL=redis.js.map