"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserProfileService = exports.AuditSource = exports.AuditAction = exports.TimeHorizon = exports.RiskTolerance = exports.DocumentStatus = exports.DocumentType = exports.KYCTier = exports.KYCStatus = exports.ContactMethod = exports.AddressType = exports.PhoneType = exports.MaritalStatus = exports.InvestmentExperience = exports.EmploymentStatus = exports.ComplianceStatus = exports.ProfileStatus = void 0;
const events_1 = require("events");
const crypto_1 = require("crypto");
// Enums
var ProfileStatus;
(function (ProfileStatus) {
    ProfileStatus["DRAFT"] = "draft";
    ProfileStatus["PENDING_VERIFICATION"] = "pending_verification";
    ProfileStatus["ACTIVE"] = "active";
    ProfileStatus["SUSPENDED"] = "suspended";
    ProfileStatus["CLOSED"] = "closed";
    ProfileStatus["ARCHIVED"] = "archived";
})(ProfileStatus || (exports.ProfileStatus = ProfileStatus = {}));
var ComplianceStatus;
(function (ComplianceStatus) {
    ComplianceStatus["COMPLIANT"] = "compliant";
    ComplianceStatus["NON_COMPLIANT"] = "non_compliant";
    ComplianceStatus["UNDER_REVIEW"] = "under_review";
    ComplianceStatus["EXEMPT"] = "exempt";
})(ComplianceStatus || (exports.ComplianceStatus = ComplianceStatus = {}));
var EmploymentStatus;
(function (EmploymentStatus) {
    EmploymentStatus["EMPLOYED"] = "employed";
    EmploymentStatus["UNEMPLOYED"] = "unemployed";
    EmploymentStatus["RETIRED"] = "retired";
    EmploymentStatus["STUDENT"] = "student";
    EmploymentStatus["SELF_EMPLOYED"] = "self_employed";
})(EmploymentStatus || (exports.EmploymentStatus = EmploymentStatus = {}));
var InvestmentExperience;
(function (InvestmentExperience) {
    InvestmentExperience["NONE"] = "none";
    InvestmentExperience["LIMITED"] = "limited";
    InvestmentExperience["GOOD"] = "good";
    InvestmentExperience["EXTENSIVE"] = "extensive";
})(InvestmentExperience || (exports.InvestmentExperience = InvestmentExperience = {}));
var MaritalStatus;
(function (MaritalStatus) {
    MaritalStatus["SINGLE"] = "single";
    MaritalStatus["MARRIED"] = "married";
    MaritalStatus["DIVORCED"] = "divorced";
    MaritalStatus["WIDOWED"] = "widowed";
    MaritalStatus["SEPARATED"] = "separated";
})(MaritalStatus || (exports.MaritalStatus = MaritalStatus = {}));
var PhoneType;
(function (PhoneType) {
    PhoneType["HOME"] = "home";
    PhoneType["WORK"] = "work";
    PhoneType["MOBILE"] = "mobile";
    PhoneType["FAX"] = "fax";
})(PhoneType || (exports.PhoneType = PhoneType = {}));
var AddressType;
(function (AddressType) {
    AddressType["HOME"] = "home";
    AddressType["WORK"] = "work";
    AddressType["MAILING"] = "mailing";
    AddressType["BILLING"] = "billing";
})(AddressType || (exports.AddressType = AddressType = {}));
var ContactMethod;
(function (ContactMethod) {
    ContactMethod["EMAIL"] = "email";
    ContactMethod["PHONE"] = "phone";
    ContactMethod["SMS"] = "sms";
    ContactMethod["MAIL"] = "mail";
})(ContactMethod || (exports.ContactMethod = ContactMethod = {}));
var KYCStatus;
(function (KYCStatus) {
    KYCStatus["NOT_STARTED"] = "not_started";
    KYCStatus["IN_PROGRESS"] = "in_progress";
    KYCStatus["PENDING_REVIEW"] = "pending_review";
    KYCStatus["APPROVED"] = "approved";
    KYCStatus["REJECTED"] = "rejected";
    KYCStatus["EXPIRED"] = "expired";
})(KYCStatus || (exports.KYCStatus = KYCStatus = {}));
var KYCTier;
(function (KYCTier) {
    KYCTier["TIER_1"] = "tier_1";
    KYCTier["TIER_2"] = "tier_2";
    KYCTier["TIER_3"] = "tier_3"; // Premium
})(KYCTier || (exports.KYCTier = KYCTier = {}));
var DocumentType;
(function (DocumentType) {
    DocumentType["GOVERNMENT_ID"] = "government_id";
    DocumentType["PASSPORT"] = "passport";
    DocumentType["DRIVERS_LICENSE"] = "drivers_license";
    DocumentType["UTILITY_BILL"] = "utility_bill";
    DocumentType["BANK_STATEMENT"] = "bank_statement";
    DocumentType["TAX_DOCUMENT"] = "tax_document";
    DocumentType["EMPLOYMENT_VERIFICATION"] = "employment_verification";
    DocumentType["PROOF_OF_INCOME"] = "proof_of_income";
    DocumentType["OTHER"] = "other";
})(DocumentType || (exports.DocumentType = DocumentType = {}));
var DocumentStatus;
(function (DocumentStatus) {
    DocumentStatus["PENDING"] = "pending";
    DocumentStatus["APPROVED"] = "approved";
    DocumentStatus["REJECTED"] = "rejected";
    DocumentStatus["EXPIRED"] = "expired";
})(DocumentStatus || (exports.DocumentStatus = DocumentStatus = {}));
var RiskTolerance;
(function (RiskTolerance) {
    RiskTolerance["CONSERVATIVE"] = "conservative";
    RiskTolerance["MODERATE"] = "moderate";
    RiskTolerance["AGGRESSIVE"] = "aggressive";
})(RiskTolerance || (exports.RiskTolerance = RiskTolerance = {}));
var TimeHorizon;
(function (TimeHorizon) {
    TimeHorizon["SHORT_TERM"] = "short_term";
    TimeHorizon["MEDIUM_TERM"] = "medium_term";
    TimeHorizon["LONG_TERM"] = "long_term"; // > 7 years
})(TimeHorizon || (exports.TimeHorizon = TimeHorizon = {}));
var AuditAction;
(function (AuditAction) {
    AuditAction["CREATE"] = "create";
    AuditAction["UPDATE"] = "update";
    AuditAction["DELETE"] = "delete";
    AuditAction["VIEW"] = "view";
    AuditAction["VERIFY"] = "verify";
    AuditAction["SUSPEND"] = "suspend";
    AuditAction["ACTIVATE"] = "activate";
})(AuditAction || (exports.AuditAction = AuditAction = {}));
var AuditSource;
(function (AuditSource) {
    AuditSource["WEB_PORTAL"] = "web_portal";
    AuditSource["MOBILE_APP"] = "mobile_app";
    AuditSource["API"] = "api";
    AuditSource["ADMIN_PANEL"] = "admin_panel";
    AuditSource["SYSTEM"] = "system";
})(AuditSource || (exports.AuditSource = AuditSource = {}));
class UserProfileService extends events_1.EventEmitter {
    profiles = new Map();
    validationRules = new Map();
    complianceRules = new Map();
    constructor() {
        super();
        this.initializeValidationRules();
        this.initializeComplianceRules();
    }
    async createProfile(profileData) {
        const profile = {
            id: (0, crypto_1.randomUUID)(),
            lastUpdated: new Date(),
            version: 1,
            auditTrail: [],
            ...profileData
        };
        // Validate profile data
        const validationErrors = await this.validateProfile(profile);
        if (validationErrors.length > 0) {
            throw new Error(`Profile validation failed: ${validationErrors.map(e => e.message).join(', ')}`);
        }
        // Add audit entry
        this.addAuditEntry(profile, AuditAction.CREATE, undefined, undefined, profile.userId, 'Profile created', 'unknown', 'unknown', AuditSource.SYSTEM);
        this.profiles.set(profile.id, profile);
        this.emit('profileCreated', profile);
        return profile;
    }
    async getProfile(profileId) {
        const profile = this.profiles.get(profileId);
        if (profile) {
            this.addAuditEntry(profile, AuditAction.VIEW, undefined, undefined, profile.userId, 'Profile viewed', 'unknown', 'unknown', AuditSource.API);
        }
        return profile || null;
    }
    async getProfileByUserId(userId, tenantId) {
        const profile = Array.from(this.profiles.values())
            .find(p => p.userId === userId && p.tenantId === tenantId);
        if (profile) {
            this.addAuditEntry(profile, AuditAction.VIEW, undefined, undefined, userId, 'Profile viewed by user ID', 'unknown', 'unknown', AuditSource.API);
        }
        return profile || null;
    }
    async updateProfile(profileId, updates, updatedBy, ipAddress, userAgent) {
        const profile = this.profiles.get(profileId);
        if (!profile)
            return null;
        const updatedProfile = { ...profile };
        const errors = [];
        for (const update of updates) {
            try {
                // Validate individual field update
                const fieldErrors = await this.validateFieldUpdate(updatedProfile, update.field, update.value);
                if (fieldErrors.length > 0) {
                    errors.push(...fieldErrors);
                    continue;
                }
                const oldValue = this.getNestedProperty(updatedProfile, update.field);
                this.setNestedProperty(updatedProfile, update.field, update.value);
                // Add audit entry for each field change
                this.addAuditEntry(updatedProfile, AuditAction.UPDATE, update.field, oldValue, updatedBy, update.reason || 'Profile updated', ipAddress, userAgent, AuditSource.WEB_PORTAL);
            }
            catch (error) {
                errors.push({
                    field: update.field,
                    message: this.getErrorMessage(error),
                    code: 'UPDATE_ERROR',
                    severity: 'error'
                });
            }
        }
        if (errors.length > 0) {
            throw new Error(`Profile update failed: ${errors.map(e => e.message).join(', ')}`);
        }
        // Increment version and update timestamp
        updatedProfile.version++;
        updatedProfile.lastUpdated = new Date();
        // Validate entire profile after updates
        const validationErrors = await this.validateProfile(updatedProfile);
        if (validationErrors.length > 0) {
            throw new Error(`Profile validation failed after update: ${validationErrors.map(e => e.message).join(', ')}`);
        }
        // Check compliance status
        updatedProfile.compliance = await this.checkComplianceStatus(updatedProfile);
        this.profiles.set(profileId, updatedProfile);
        this.emit('profileUpdated', updatedProfile);
        return updatedProfile;
    }
    async addDocument(profileId, document, uploadedBy) {
        const profile = this.profiles.get(profileId);
        if (!profile)
            return null;
        const newDocument = {
            id: (0, crypto_1.randomUUID)(),
            uploadedAt: new Date(),
            ...document
        };
        profile.documents.push(newDocument);
        profile.lastUpdated = new Date();
        profile.version++;
        this.addAuditEntry(profile, AuditAction.CREATE, 'documents', undefined, uploadedBy, `Document ${document.name} uploaded`, 'unknown', 'unknown', AuditSource.WEB_PORTAL);
        this.emit('documentAdded', { profile, document: newDocument });
        return newDocument;
    }
    async removeDocument(profileId, documentId, removedBy, reason) {
        const profile = this.profiles.get(profileId);
        if (!profile)
            return false;
        const documentIndex = profile.documents.findIndex(d => d.id === documentId);
        if (documentIndex === -1)
            return false;
        const removedDocument = profile.documents[documentIndex];
        profile.documents.splice(documentIndex, 1);
        profile.lastUpdated = new Date();
        profile.version++;
        this.addAuditEntry(profile, AuditAction.DELETE, 'documents', removedDocument, removedBy, reason, 'unknown', 'unknown', AuditSource.WEB_PORTAL);
        this.emit('documentRemoved', { profile, document: removedDocument });
        return true;
    }
    async updateKYCStatus(profileId, status, updatedBy, reason) {
        const profile = this.profiles.get(profileId);
        if (!profile)
            return null;
        const oldStatus = profile.kycInfo.status;
        profile.kycInfo.status = status;
        if (status === KYCStatus.APPROVED) {
            profile.kycInfo.completedAt = new Date();
        }
        profile.lastUpdated = new Date();
        profile.version++;
        this.addAuditEntry(profile, AuditAction.UPDATE, 'kycInfo.status', oldStatus, updatedBy, reason, 'unknown', 'unknown', AuditSource.ADMIN_PANEL);
        this.emit('kycStatusUpdated', { profile, oldStatus, newStatus: status });
        return profile;
    }
    async getProfilesForTenant(tenantId, filter = {}) {
        let profiles = Array.from(this.profiles.values())
            .filter(p => p.tenantId === tenantId);
        if (filter.status) {
            profiles = profiles.filter(p => p.status === filter.status);
        }
        if (filter.kycStatus) {
            profiles = profiles.filter(p => p.kycInfo.status === filter.kycStatus);
        }
        if (filter.lastUpdatedAfter) {
            profiles = profiles.filter(p => p.lastUpdated >= filter.lastUpdatedAfter);
        }
        if (filter.lastUpdatedBefore) {
            profiles = profiles.filter(p => p.lastUpdated <= filter.lastUpdatedBefore);
        }
        return profiles.sort((a, b) => b.lastUpdated.getTime() - a.lastUpdated.getTime());
    }
    async validateProfile(profile) {
        const errors = [];
        const rules = this.validationRules.get(profile.tenantId) || [];
        for (const rule of rules) {
            try {
                const isValid = rule.validator(profile);
                if (!isValid) {
                    errors.push({
                        field: rule.field,
                        message: rule.message,
                        code: rule.code,
                        severity: rule.severity
                    });
                }
            }
            catch (error) {
                errors.push({
                    field: rule.field,
                    message: `Validation error: ${this.getErrorMessage(error)}`,
                    code: 'VALIDATION_EXCEPTION',
                    severity: 'error'
                });
            }
        }
        return errors;
    }
    async checkComplianceStatus(profile) {
        const rules = this.complianceRules.get(profile.tenantId) || [];
        for (const rule of rules) {
            const isCompliant = rule.validator(profile);
            if (!isCompliant) {
                return ComplianceStatus.NON_COMPLIANT;
            }
        }
        return ComplianceStatus.COMPLIANT;
    }
    async getAuditTrail(profileId, filter = {}) {
        const profile = this.profiles.get(profileId);
        if (!profile)
            return [];
        let auditEntries = [...profile.auditTrail];
        if (filter.action) {
            auditEntries = auditEntries.filter(entry => entry.action === filter.action);
        }
        if (filter.field) {
            auditEntries = auditEntries.filter(entry => entry.field === filter.field);
        }
        if (filter.userId) {
            auditEntries = auditEntries.filter(entry => entry.userId === filter.userId);
        }
        if (filter.startDate) {
            auditEntries = auditEntries.filter(entry => entry.timestamp >= filter.startDate);
        }
        if (filter.endDate) {
            auditEntries = auditEntries.filter(entry => entry.timestamp <= filter.endDate);
        }
        return auditEntries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    async validateFieldUpdate(profile, field, value) {
        const errors = [];
        // Add field-specific validation logic here
        switch (field) {
            case 'personalInfo.ssn':
                if (value && !this.isValidSSN(value)) {
                    errors.push({
                        field,
                        message: 'Invalid SSN format',
                        code: 'INVALID_SSN',
                        severity: 'error'
                    });
                }
                break;
            case 'contactInfo.primaryEmail':
                if (!this.isValidEmail(value)) {
                    errors.push({
                        field,
                        message: 'Invalid email format',
                        code: 'INVALID_EMAIL',
                        severity: 'error'
                    });
                }
                break;
            // Add more field validations as needed
        }
        return errors;
    }
    addAuditEntry(profile, action, field, oldValue, userId, reason, ipAddress, userAgent, source) {
        const auditEntry = {
            id: (0, crypto_1.randomUUID)(),
            timestamp: new Date(),
            userId,
            action,
            field,
            oldValue,
            newValue: field ? this.getNestedProperty(profile, field) : undefined,
            reason,
            ipAddress,
            userAgent,
            source
        };
        profile.auditTrail.push(auditEntry);
    }
    getNestedProperty(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
    setNestedProperty(obj, path, value) {
        const keys = path.split('.');
        const lastKey = keys.pop();
        const target = keys.reduce((current, key) => {
            if (!current[key])
                current[key] = {};
            return current[key];
        }, obj);
        target[lastKey] = value;
    }
    isValidSSN(ssn) {
        const ssnRegex = /^\d{3}-?\d{2}-?\d{4}$/;
        return ssnRegex.test(ssn);
    }
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    initializeValidationRules() {
        // Initialize basic validation rules - would be loaded from configuration
        const basicRules = [
            {
                field: 'personalInfo.firstName',
                validator: (profile) => !!profile.personalInfo.firstName?.trim(),
                message: 'First name is required',
                code: 'REQUIRED_FIELD',
                severity: 'error'
            },
            {
                field: 'personalInfo.lastName',
                validator: (profile) => !!profile.personalInfo.lastName?.trim(),
                message: 'Last name is required',
                code: 'REQUIRED_FIELD',
                severity: 'error'
            },
            {
                field: 'contactInfo.primaryEmail',
                validator: (profile) => this.isValidEmail(profile.contactInfo.primaryEmail),
                message: 'Valid primary email is required',
                code: 'INVALID_EMAIL',
                severity: 'error'
            }
        ];
        this.validationRules.set('default', basicRules);
    }
    initializeComplianceRules() {
        // Initialize basic compliance rules
        const basicRules = [
            {
                field: 'kycInfo.status',
                validator: (profile) => profile.kycInfo.status !== KYCStatus.REJECTED,
                message: 'KYC must not be rejected',
                code: 'KYC_REJECTED'
            }
        ];
        this.complianceRules.set('default', basicRules);
    }
    getErrorMessage(error) {
        if (error instanceof Error) {
            return error.message;
        }
        return String(error);
    }
}
exports.UserProfileService = UserProfileService;
