/**
 * Simplified ABAC (Attribute-Based Access Control) for Investment Platform
 *
 * Focused on specific financial platform needs:
 * - Portfolio-level permissions
 * - Data field-level permissions
 * - Time-based access restrictions
 */
export type Permission = 'read' | 'write' | 'approve' | 'trade' | 'export' | 'delete';
export type ResourceType = 'portfolio' | 'client' | 'transaction' | 'report' | 'trading' | 'compliance';
export interface UserAttributes {
    userId: string;
    roles: string[];
    department: string;
    portfolioAccess: string[];
    clientAccess: string[];
    permissions: Permission[];
    restrictedFields: string[];
    tradingEnabled: boolean;
    timeRestrictions?: TimeRestriction[];
}
export interface TimeRestriction {
    type: 'trading' | 'reporting' | 'compliance';
    allowedHours: {
        start: string;
        end: string;
    };
    allowedDays: number[];
    timezone: string;
}
export interface AccessRequest {
    userId: string;
    resourceType: ResourceType;
    resourceId: string;
    permission: Permission;
    timestamp: Date;
    context?: {
        ipAddress?: string;
        sessionId?: string;
        requestedFields?: string[];
    };
}
export interface AccessDecision {
    allowed: boolean;
    reason: string;
    restrictedFields?: string[];
    timeRestricted?: boolean;
    conditions?: string[];
}
export interface AccessRule {
    id: string;
    name: string;
    resourceType: ResourceType;
    permission: Permission;
    conditions: {
        roles?: string[];
        departments?: string[];
        timeRestricted?: boolean;
        requiresApproval?: boolean;
    };
    active: boolean;
}
