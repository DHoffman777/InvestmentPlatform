/**
 * Simplified ABAC (Attribute-Based Access Control) for Investment Platform
 * 
 * Focused on specific financial platform needs:
 * - Portfolio-level permissions
 * - Data field-level permissions  
 * - Time-based access restrictions
 */

// Core permission types for investment platform
export type Permission = 
  | 'read'
  | 'write'
  | 'approve'
  | 'trade'
  | 'export'
  | 'delete';

export type ResourceType = 
  | 'portfolio'
  | 'client'
  | 'transaction'
  | 'report'
  | 'trading'
  | 'compliance';

// Simple attribute types for financial platform
export interface UserAttributes {
  userId: string;
  roles: string[];
  department: string;
  portfolioAccess: string[]; // Portfolio IDs user can access
  clientAccess: string[];    // Client IDs user can access
  permissions: Permission[];
  restrictedFields: string[]; // Fields user cannot see (e.g., 'ssn', 'accountNumber')
  tradingEnabled: boolean;
  timeRestrictions?: TimeRestriction[];
}

export interface TimeRestriction {
  type: 'trading' | 'reporting' | 'compliance';
  allowedHours: {
    start: string; // "09:30"
    end: string;   // "16:00"
  };
  allowedDays: number[]; // 1-7 (Monday-Sunday)
  timezone: string;
}

// Access request and decision
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

// Simple policy rules for common scenarios
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