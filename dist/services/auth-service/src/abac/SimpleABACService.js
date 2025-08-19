"use strict";
/**
 * Simplified ABAC Service for Investment Platform
 *
 * Handles portfolio-level, field-level, and time-based access control
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleABACService = void 0;
const events_1 = require("events");
class SimpleABACService extends events_1.EventEmitter {
    userAttributes = new Map();
    accessRules = [];
    constructor() {
        super();
        this.initializeDefaultRules();
    }
    /**
     * Check if user has access to a resource
     */
    async checkAccess(request) {
        const user = this.userAttributes.get(request.userId);
        if (!user) {
            return {
                allowed: false,
                reason: 'User not found'
            };
        }
        // Check portfolio-level access
        if (request.resourceType === 'portfolio') {
            if (!user.portfolioAccess.includes(request.resourceId)) {
                this.emit('access-denied', { request, reason: 'Portfolio not accessible' });
                return {
                    allowed: false,
                    reason: 'No access to this portfolio'
                };
            }
        }
        // Check client-level access
        if (request.resourceType === 'client') {
            if (!user.clientAccess.includes(request.resourceId)) {
                this.emit('access-denied', { request, reason: 'Client not accessible' });
                return {
                    allowed: false,
                    reason: 'No access to this client'
                };
            }
        }
        // Check permission level
        if (!user.permissions.includes(request.permission)) {
            this.emit('access-denied', { request, reason: 'Permission denied' });
            return {
                allowed: false,
                reason: `No ${request.permission} permission`
            };
        }
        // Check time restrictions
        const timeCheck = this.checkTimeRestrictions(user, request);
        if (!timeCheck.allowed) {
            return timeCheck;
        }
        // Check trading permissions
        if (request.permission === 'trade' && !user.tradingEnabled) {
            this.emit('access-denied', { request, reason: 'Trading disabled' });
            return {
                allowed: false,
                reason: 'Trading is disabled for this user'
            };
        }
        // Apply field restrictions
        const restrictedFields = this.getRestrictedFields(user, request);
        this.emit('access-granted', { request, user: user.userId });
        return {
            allowed: true,
            reason: 'Access granted',
            restrictedFields: restrictedFields.length > 0 ? restrictedFields : undefined
        };
    }
    /**
     * Set user attributes
     */
    setUserAttributes(userId, attributes) {
        this.userAttributes.set(userId, attributes);
        this.emit('user-attributes-updated', { userId, attributes });
    }
    /**
     * Get user attributes
     */
    getUserAttributes(userId) {
        return this.userAttributes.get(userId);
    }
    /**
     * Add access rule
     */
    addAccessRule(rule) {
        this.accessRules.push(rule);
        this.emit('rule-added', rule);
    }
    /**
     * Check time-based restrictions
     */
    checkTimeRestrictions(user, request) {
        if (!user.timeRestrictions || user.timeRestrictions.length === 0) {
            return { allowed: true, reason: 'No time restrictions' };
        }
        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentDay = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const currentTime = currentHour * 60 + currentMinute; // Minutes since midnight
        for (const restriction of user.timeRestrictions) {
            // Check if restriction applies to this request type
            if (this.doesRestrictionApply(restriction, request)) {
                // Check day of week
                if (!restriction.allowedDays.includes(currentDay)) {
                    return {
                        allowed: false,
                        reason: `Access not allowed on ${this.getDayName(currentDay)}`,
                        timeRestricted: true
                    };
                }
                // Check time of day
                const startTime = this.parseTime(restriction.allowedHours.start);
                const endTime = this.parseTime(restriction.allowedHours.end);
                if (currentTime < startTime || currentTime > endTime) {
                    return {
                        allowed: false,
                        reason: `Access only allowed between ${restriction.allowedHours.start} and ${restriction.allowedHours.end}`,
                        timeRestricted: true
                    };
                }
            }
        }
        return { allowed: true, reason: 'Time restrictions passed' };
    }
    /**
     * Check if time restriction applies to this request
     */
    doesRestrictionApply(restriction, request) {
        switch (restriction.type) {
            case 'trading':
                return request.permission === 'trade' || request.resourceType === 'trading';
            case 'reporting':
                return request.resourceType === 'report' || request.permission === 'export';
            case 'compliance':
                return request.resourceType === 'compliance';
            default:
                return false;
        }
    }
    /**
     * Get fields that should be restricted for this user
     */
    getRestrictedFields(user, request) {
        const requestedFields = request.context?.requestedFields || [];
        if (requestedFields.length === 0) {
            return [];
        }
        return requestedFields.filter(field => user.restrictedFields.includes(field));
    }
    /**
     * Parse time string (HH:MM) to minutes since midnight
     */
    parseTime(timeStr) {
        const [hours, minutes] = timeStr.split(':').map(Number);
        return hours * 60 + minutes;
    }
    /**
     * Get day name from day number
     */
    getDayName(dayNum) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[dayNum];
    }
    /**
     * Initialize default access rules for common scenarios
     */
    initializeDefaultRules() {
        // Portfolio managers can read/write portfolios
        this.addAccessRule({
            id: 'portfolio-manager-access',
            name: 'Portfolio Manager Access',
            resourceType: 'portfolio',
            permission: 'write',
            conditions: {
                roles: ['portfolio-manager'],
                timeRestricted: false
            },
            active: true
        });
        // Traders can trade during market hours
        this.addAccessRule({
            id: 'trader-access',
            name: 'Trader Access',
            resourceType: 'trading',
            permission: 'trade',
            conditions: {
                roles: ['trader', 'portfolio-manager'],
                timeRestricted: true
            },
            active: true
        });
        // Compliance officers can access everything
        this.addAccessRule({
            id: 'compliance-access',
            name: 'Compliance Officer Access',
            resourceType: 'compliance',
            permission: 'read',
            conditions: {
                roles: ['compliance-officer'],
                timeRestricted: false
            },
            active: true
        });
        // Analysts can read but not modify
        this.addAccessRule({
            id: 'analyst-read-access',
            name: 'Analyst Read Access',
            resourceType: 'portfolio',
            permission: 'read',
            conditions: {
                roles: ['analyst'],
                timeRestricted: false
            },
            active: true
        });
    }
    /**
     * Bulk check access for multiple requests
     */
    async checkBulkAccess(requests) {
        const results = new Map();
        for (const request of requests) {
            const key = `${request.userId}-${request.resourceType}-${request.resourceId}-${request.permission}`;
            const decision = await this.checkAccess(request);
            results.set(key, decision);
        }
        return results;
    }
    /**
     * Get access summary for a user
     */
    getUserAccessSummary(userId) {
        const user = this.userAttributes.get(userId);
        if (!user) {
            return null;
        }
        return {
            portfolios: user.portfolioAccess,
            clients: user.clientAccess,
            permissions: user.permissions,
            restrictions: {
                fields: user.restrictedFields,
                timeRestrictions: user.timeRestrictions || [],
                tradingEnabled: user.tradingEnabled
            }
        };
    }
}
exports.SimpleABACService = SimpleABACService;
