export interface LoginRequest {
    email: string;
    password: string;
    tenantId?: string;
    mfaToken?: string;
}
export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
    user: UserProfile;
}
export interface RefreshTokenRequest {
    refreshToken: string;
}
export interface LogoutRequest {
    refreshToken?: string;
}
export interface MfaSetupRequest {
    userId: string;
    method: MfaMethod;
}
export interface MfaVerifyRequest {
    userId: string;
    token: string;
    method: MfaMethod;
}
export interface PasswordResetRequest {
    email: string;
    tenantId?: string;
}
export interface PasswordUpdateRequest {
    token: string;
    newPassword: string;
}
export interface UserProfile {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    roles: string[];
    permissions: string[];
    tenantId: string;
    lastLoginAt?: Date;
    mfaEnabled: boolean;
}
export declare enum MfaMethod {
    SMS = "SMS",
    TOTP = "TOTP",
    EMAIL = "EMAIL",
    HARDWARE_TOKEN = "HARDWARE_TOKEN"
}
export interface JwtPayload {
    sub: string;
    email: string;
    tenantId: string;
    roles: string[];
    permissions: string[];
    iat: number;
    exp: number;
}
export interface JWTPayload {
    userId: string;
    email: string;
    tenantId: string;
    roles: string[];
    permissions: string[];
}
export interface TokenPair {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    tokenType: string;
}
export declare enum Permission {
    USER_CREATE = "user:create",
    USER_READ = "user:read",
    USER_UPDATE = "user:update",
    USER_DELETE = "user:delete",
    PORTFOLIO_CREATE = "portfolio:create",
    PORTFOLIO_READ = "portfolio:read",
    PORTFOLIO_UPDATE = "portfolio:update",
    PORTFOLIO_DELETE = "portfolio:delete",
    TRADE_EXECUTE = "trade:execute",
    TRADE_APPROVE = "trade:approve",
    TRADE_VIEW = "trade:view",
    REPORT_GENERATE = "report:generate",
    REPORT_VIEW = "report:view",
    REPORT_EXPORT = "report:export",
    ADMIN_TENANT = "admin:tenant",
    ADMIN_SYSTEM = "admin:system"
}
export declare enum Role {
    SUPER_ADMIN = "super_admin",
    ADMIN = "admin",
    PORTFOLIO_MANAGER = "portfolio_manager",
    ANALYST = "analyst",
    OPERATIONS = "operations",
    COMPLIANCE_OFFICER = "compliance_officer",
    CLIENT_SERVICE = "client_service",
    AUDITOR = "auditor"
}
