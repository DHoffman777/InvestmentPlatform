"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClient = exports.CacheService = void 0;
const redis_1 = require("redis");
const logger_1 = require("./logger");
const redisClient = (0, redis_1.createClient)({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD,
});
exports.redisClient = redisClient;
redisClient.on('error', (err) => {
    logger_1.logger.error('Redis client error', err);
});
redisClient.on('connect', () => {
    logger_1.logger.info('Connected to Redis');
});
redisClient.on('ready', () => {
    logger_1.logger.info('Redis client ready');
});
class CacheService {
    static instance;
    client;
    constructor() {
        this.client = redisClient;
    }
    static getInstance() {
        if (!CacheService.instance) {
            CacheService.instance = new CacheService();
        }
        return CacheService.instance;
    }
    async connect() {
        if (!this.client.isOpen) {
            await this.client.connect();
        }
    }
    async disconnect() {
        if (this.client.isOpen) {
            await this.client.disconnect();
        }
    }
    async get(key) {
        try {
            return await this.client.get(key);
        }
        catch (error) {
            logger_1.logger.error('Redis GET error:', { key, error });
            return null;
        }
    }
    async set(key, value, ttl) {
        try {
            if (ttl) {
                await this.client.setEx(key, ttl, value);
            }
            else {
                await this.client.set(key, value);
            }
        }
        catch (error) {
            logger_1.logger.error('Redis SET error:', { key, error });
        }
    }
    async del(key) {
        try {
            await this.client.del(key);
        }
        catch (error) {
            logger_1.logger.error('Redis DEL error:', { key, error });
        }
    }
    async exists(key) {
        try {
            const result = await this.client.exists(key);
            return result === 1;
        }
        catch (error) {
            logger_1.logger.error('Redis EXISTS error:', { key, error });
            return false;
        }
    }
    async incr(key) {
        try {
            return await this.client.incr(key);
        }
        catch (error) {
            logger_1.logger.error('Redis INCR error:', { key, error });
            throw error;
        }
    }
    async expire(key, ttl) {
        try {
            await this.client.expire(key, ttl);
        }
        catch (error) {
            logger_1.logger.error('Redis EXPIRE error:', { key, ttl, error });
        }
    }
    // Session management helpers
    async setSession(sessionId, data, ttl = 86400) {
        const key = `session:${sessionId}`;
        await this.set(key, JSON.stringify(data), ttl);
    }
    async getSession(sessionId) {
        const key = `session:${sessionId}`;
        const data = await this.get(key);
        return data ? JSON.parse(data) : null;
    }
    async deleteSession(sessionId) {
        const key = `session:${sessionId}`;
        await this.del(key);
    }
    // Rate limiting helpers
    async rateLimit(key, limit, window) {
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
exports.CacheService = CacheService;
exports.default = CacheService;
