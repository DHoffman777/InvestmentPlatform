export const __esModule: boolean;
export class DatabaseService {
    static instance: any;
    static getInstance(): any;
    pool: pg_1.Pool;
    query(text: any, params: any): Promise<any[][]>;
    queryOne(text: any, params: any): Promise<any[]>;
    transaction(callback: any): Promise<any>;
    close(): Promise<void>;
    getTenantSchema(tenantId: any): string;
    setTenantContext(tenantId: any): Promise<void>;
    getTenantIdByDomain(domain: any): Promise<any>;
}
import pg_1 = require("pg");
