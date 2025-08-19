export declare class DatabaseService {
    private static instance;
    private pool;
    private constructor();
    static getInstance(): DatabaseService;
    query<T = any>(text: string, params?: any[]): Promise<T[]>;
    queryOne<T = any>(text: string, params?: any[]): Promise<T | null>;
    transaction<T>(callback: (client: any) => Promise<T>): Promise<T>;
    close(): Promise<void>;
    getTenantSchema(tenantId: string): string;
    setTenantContext(tenantId: string): Promise<void>;
    getTenantIdByDomain(domain: string): Promise<string | null>;
}
