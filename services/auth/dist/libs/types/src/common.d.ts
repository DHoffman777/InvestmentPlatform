export interface BaseEntity {
    id: string;
    createdAt: Date;
    updatedAt: Date;
    version: number;
}
export interface TenantEntity extends BaseEntity {
    tenantId: string;
}
export interface AuditableEntity extends TenantEntity {
    createdBy: string;
    updatedBy: string;
}
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    message?: string;
    timestamp: Date;
}
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
}
export interface FilterOptions {
    page?: number;
    limit?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    search?: string;
}
export declare enum EntityStatus {
    ACTIVE = "ACTIVE",
    INACTIVE = "INACTIVE",
    SUSPENDED = "SUSPENDED",
    LOCKED = "LOCKED",
    DELETED = "DELETED"
}
export declare enum CurrencyCode {
    USD = "USD",
    EUR = "EUR",
    GBP = "GBP",
    JPY = "JPY",
    CAD = "CAD",
    AUD = "AUD",
    CHF = "CHF",
    CNY = "CNY"
}
export interface Money {
    amount: number;
    currency: CurrencyCode;
}
