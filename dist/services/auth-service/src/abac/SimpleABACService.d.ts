/**
 * Simplified ABAC Service for Investment Platform
 *
 * Handles portfolio-level, field-level, and time-based access control
 */
import { EventEmitter } from 'events';
import { UserAttributes, AccessRequest, AccessDecision, AccessRule, Permission, TimeRestriction } from './types/ABACTypes';
export declare class SimpleABACService extends EventEmitter {
    private userAttributes;
    private accessRules;
    constructor();
    /**
     * Check if user has access to a resource
     */
    checkAccess(request: AccessRequest): Promise<AccessDecision>;
    /**
     * Set user attributes
     */
    setUserAttributes(userId: string, attributes: UserAttributes): void;
    /**
     * Get user attributes
     */
    getUserAttributes(userId: string): UserAttributes | undefined;
    /**
     * Add access rule
     */
    addAccessRule(rule: AccessRule): void;
    /**
     * Check time-based restrictions
     */
    private checkTimeRestrictions;
    /**
     * Check if time restriction applies to this request
     */
    private doesRestrictionApply;
    /**
     * Get fields that should be restricted for this user
     */
    private getRestrictedFields;
    /**
     * Parse time string (HH:MM) to minutes since midnight
     */
    private parseTime;
    /**
     * Get day name from day number
     */
    private getDayName;
    /**
     * Initialize default access rules for common scenarios
     */
    private initializeDefaultRules;
    /**
     * Bulk check access for multiple requests
     */
    checkBulkAccess(requests: AccessRequest[]): Promise<Map<string, AccessDecision>>;
    /**
     * Get access summary for a user
     */
    getUserAccessSummary(userId: string): {
        portfolios: string[];
        clients: string[];
        permissions: Permission[];
        restrictions: {
            fields: string[];
            timeRestrictions: TimeRestriction[];
            tradingEnabled: boolean;
        };
    } | null;
}
