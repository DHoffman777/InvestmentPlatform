"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseService = void 0;
const pg_1 = require("pg");
const logger_1 = require("./logger");
const pool = new pg_1.Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
});
pool.on('connect', () => {
    logger_1.logger.info('Connected to PostgreSQL database');
});
pool.on('error', (err) => {
    logger_1.logger.error('Unexpected error on idle client', err);
    process.exit(-1);
});
class DatabaseService {
    static instance;
    pool;
    constructor() {
        this.pool = pool;
    }
    static getInstance() {
        if (!DatabaseService.instance) {
            DatabaseService.instance = new DatabaseService();
        }
        return DatabaseService.instance;
    }
    async query(text, params) {
        const client = await this.pool.connect();
        try {
            const result = await client.query(text, params);
            return result.rows;
        }
        catch (error) {
            logger_1.logger.error('Database query error:', { query: text, params, error });
            throw error;
        }
        finally {
            client.release();
        }
    }
    async queryOne(text, params) {
        const results = await this.query(text, params);
        return results.length > 0 ? results[0] : null;
    }
    async transaction(callback) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        }
        catch (error) {
            await client.query('ROLLBACK');
            throw error;
        }
        finally {
            client.release();
        }
    }
    async close() {
        await this.pool.end();
    }
    // Multi-tenant helper methods
    getTenantSchema(tenantId) {
        return `tenant_${tenantId.replace(/-/g, '')}`;
    }
    async setTenantContext(tenantId) {
        const schema = this.getTenantSchema(tenantId);
        await this.query(`SET search_path TO ${schema}, public`);
    }
    async getTenantIdByDomain(domain) {
        const result = await this.queryOne('SELECT id FROM shared.tenants WHERE domain = $1 AND status = $2', [domain, 'ACTIVE']);
        return result ? result.id : null;
    }
}
exports.DatabaseService = DatabaseService;
