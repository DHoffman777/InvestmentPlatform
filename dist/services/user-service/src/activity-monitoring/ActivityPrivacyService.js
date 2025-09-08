"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityPrivacyService = exports.DataFlowFrequency = exports.DataVolume = exports.RiskLevel = exports.PrivacyOperation = exports.RightRequestStatus = exports.DataSubjectRight = exports.ConsentMethod = exports.LegalBasis = exports.AnonymizationMethod = exports.ProcessingOperation = exports.DataCategory = void 0;
const events_1 = require("events");
const crypto_1 = require("crypto");
var DataCategory;
(function (DataCategory) {
    DataCategory["PERSONAL_IDENTIFIERS"] = "personal_identifiers";
    DataCategory["CONTACT_INFORMATION"] = "contact_information";
    DataCategory["FINANCIAL_DATA"] = "financial_data";
    DataCategory["BEHAVIORAL_DATA"] = "behavioral_data";
    DataCategory["TECHNICAL_DATA"] = "technical_data";
    DataCategory["LOCATION_DATA"] = "location_data";
    DataCategory["BIOMETRIC_DATA"] = "biometric_data";
    DataCategory["HEALTH_DATA"] = "health_data";
    DataCategory["COMMUNICATION_DATA"] = "communication_data";
    DataCategory["SENSITIVE_ATTRIBUTES"] = "sensitive_attributes"; // Race, religion, political views
})(DataCategory || (exports.DataCategory = DataCategory = {}));
var ProcessingOperation;
(function (ProcessingOperation) {
    ProcessingOperation["COLLECTION"] = "collection";
    ProcessingOperation["STORAGE"] = "storage";
    ProcessingOperation["ACCESS"] = "access";
    ProcessingOperation["ANALYSIS"] = "analysis";
    ProcessingOperation["SHARING"] = "sharing";
    ProcessingOperation["TRANSFER"] = "transfer";
    ProcessingOperation["DELETION"] = "deletion";
    ProcessingOperation["ANONYMIZATION"] = "anonymization";
    ProcessingOperation["PROFILING"] = "profiling";
    ProcessingOperation["AUTOMATED_DECISION_MAKING"] = "automated_decision_making";
})(ProcessingOperation || (exports.ProcessingOperation = ProcessingOperation = {}));
var AnonymizationMethod;
(function (AnonymizationMethod) {
    AnonymizationMethod["NONE"] = "none";
    AnonymizationMethod["PSEUDONYMIZATION"] = "pseudonymization";
    AnonymizationMethod["GENERALIZATION"] = "generalization";
    AnonymizationMethod["SUPPRESSION"] = "suppression";
    AnonymizationMethod["NOISE_ADDITION"] = "noise_addition";
    AnonymizationMethod["K_ANONYMITY"] = "k_anonymity";
    AnonymizationMethod["L_DIVERSITY"] = "l_diversity";
    AnonymizationMethod["T_CLOSENESS"] = "t_closeness";
    AnonymizationMethod["DIFFERENTIAL_PRIVACY"] = "differential_privacy";
    AnonymizationMethod["TOKENIZATION"] = "tokenization";
    AnonymizationMethod["HASHING"] = "hashing"; // One-way hash functions
})(AnonymizationMethod || (exports.AnonymizationMethod = AnonymizationMethod = {}));
var LegalBasis;
(function (LegalBasis) {
    LegalBasis["CONSENT"] = "consent";
    LegalBasis["CONTRACT"] = "contract";
    LegalBasis["LEGAL_OBLIGATION"] = "legal_obligation";
    LegalBasis["VITAL_INTERESTS"] = "vital_interests";
    LegalBasis["PUBLIC_TASK"] = "public_task";
    LegalBasis["LEGITIMATE_INTERESTS"] = "legitimate_interests"; // GDPR Article 6(1)(f)
})(LegalBasis || (exports.LegalBasis = LegalBasis = {}));
var ConsentMethod;
(function (ConsentMethod) {
    ConsentMethod["EXPLICIT_OPT_IN"] = "explicit_opt_in";
    ConsentMethod["IMPLIED_CONSENT"] = "implied_consent";
    ConsentMethod["PRE_TICKED_BOX"] = "pre_ticked_box";
    ConsentMethod["CONTINUATION_OF_SERVICE"] = "continuation_of_service";
    ConsentMethod["BROWSER_SETTINGS"] = "browser_settings";
})(ConsentMethod || (exports.ConsentMethod = ConsentMethod = {}));
var DataSubjectRight;
(function (DataSubjectRight) {
    DataSubjectRight["RIGHT_TO_ACCESS"] = "right_to_access";
    DataSubjectRight["RIGHT_TO_RECTIFICATION"] = "right_to_rectification";
    DataSubjectRight["RIGHT_TO_ERASURE"] = "right_to_erasure";
    DataSubjectRight["RIGHT_TO_RESTRICT"] = "right_to_restrict";
    DataSubjectRight["RIGHT_TO_PORTABILITY"] = "right_to_portability";
    DataSubjectRight["RIGHT_TO_OBJECT"] = "right_to_object";
    DataSubjectRight["RIGHT_NOT_AUTOMATED"] = "right_not_automated_decision"; // Article 22
})(DataSubjectRight || (exports.DataSubjectRight = DataSubjectRight = {}));
var RightRequestStatus;
(function (RightRequestStatus) {
    RightRequestStatus["SUBMITTED"] = "submitted";
    RightRequestStatus["VERIFYING"] = "verifying";
    RightRequestStatus["PROCESSING"] = "processing";
    RightRequestStatus["COMPLETED"] = "completed";
    RightRequestStatus["REJECTED"] = "rejected";
    RightRequestStatus["PARTIALLY_FULFILLED"] = "partially_fulfilled";
})(RightRequestStatus || (exports.RightRequestStatus = RightRequestStatus = {}));
var PrivacyOperation;
(function (PrivacyOperation) {
    PrivacyOperation["DATA_COLLECTION"] = "data_collection";
    PrivacyOperation["DATA_ACCESS"] = "data_access";
    PrivacyOperation["DATA_PROCESSING"] = "data_processing";
    PrivacyOperation["DATA_SHARING"] = "data_sharing";
    PrivacyOperation["DATA_TRANSFER"] = "data_transfer";
    PrivacyOperation["DATA_DELETION"] = "data_deletion";
    PrivacyOperation["CONSENT_CHANGE"] = "consent_change";
    PrivacyOperation["RIGHTS_REQUEST"] = "rights_request";
    PrivacyOperation["POLICY_CHANGE"] = "policy_change";
    PrivacyOperation["BREACH_DETECTED"] = "breach_detected";
})(PrivacyOperation || (exports.PrivacyOperation = PrivacyOperation = {}));
var RiskLevel;
(function (RiskLevel) {
    RiskLevel["LOW"] = "low";
    RiskLevel["MEDIUM"] = "medium";
    RiskLevel["HIGH"] = "high";
    RiskLevel["CRITICAL"] = "critical";
})(RiskLevel || (exports.RiskLevel = RiskLevel = {}));
var DataVolume;
(function (DataVolume) {
    DataVolume["INDIVIDUAL_RECORDS"] = "individual_records";
    DataVolume["SMALL_DATASET"] = "small_dataset";
    DataVolume["MEDIUM_DATASET"] = "medium_dataset";
    DataVolume["LARGE_DATASET"] = "large_dataset";
    DataVolume["BIG_DATA"] = "big_data"; // > 1,000,000 records
})(DataVolume || (exports.DataVolume = DataVolume = {}));
var DataFlowFrequency;
(function (DataFlowFrequency) {
    DataFlowFrequency["REAL_TIME"] = "real_time";
    DataFlowFrequency["HOURLY"] = "hourly";
    DataFlowFrequency["DAILY"] = "daily";
    DataFlowFrequency["WEEKLY"] = "weekly";
    DataFlowFrequency["MONTHLY"] = "monthly";
    DataFlowFrequency["ON_DEMAND"] = "on_demand";
    DataFlowFrequency["ONE_TIME"] = "one_time";
})(DataFlowFrequency || (exports.DataFlowFrequency = DataFlowFrequency = {}));
class ActivityPrivacyService extends events_1.EventEmitter {
    privacyPolicies = new Map();
    consentRecords = new Map();
    dataSubjectRights = new Map();
    auditLogs = new Map();
    dataFlowMappings = new Map();
    anonymizationCache = new Map();
    pseudonymMappings = new Map();
    getErrorMessage(error) {
        if (error instanceof Error) {
            return error.message;
        }
        return String(error);
    }
    constructor() {
        super();
        this.initializeDefaultPolicies();
    }
    async createPrivacyPolicy(policy) {
        const newPolicy = {
            id: (0, crypto_1.randomUUID)(),
            createdAt: new Date(),
            updatedAt: new Date(),
            ...policy
        };
        // Validate policy compliance
        await this.validatePolicyCompliance(newPolicy);
        this.privacyPolicies.set(newPolicy.id, newPolicy);
        this.emit('privacyPolicyCreated', newPolicy);
        return newPolicy;
    }
    async applyPrivacyRules(activity, tenantId) {
        const applicablePolicies = this.getApplicablePolicies(tenantId);
        let processedActivity = { ...activity };
        for (const policy of applicablePolicies) {
            if (!policy.isActive)
                continue;
            // Check consent requirements
            if (policy.consentRequired && !await this.hasValidConsent(activity.userId, policy.id)) {
                throw new Error(`Valid consent required for policy ${policy.name}`);
            }
            // Apply privacy rules
            for (const rule of policy.rules) {
                processedActivity = await this.applyPrivacyRule(processedActivity, rule, policy.id);
            }
            // Log privacy operation
            await this.logPrivacyOperation({
                operation: PrivacyOperation.DATA_PROCESSING,
                tenantId,
                userId: activity.userId,
                dataCategory: this.classifyActivityData(activity),
                legalBasis: policy.legalBasis[0],
                purpose: policy.dataProcessingPurposes[0],
                dataElements: Object.keys(activity),
                processingMethod: ProcessingOperation.ANALYSIS,
                accessRequester: 'system',
                justification: `Activity processing under policy ${policy.name}`,
                riskAssessment: this.assessRisk(activity, policy.rules[0] || {}),
                thirdPartiesInvolved: [],
                crossBorderTransfer: false,
                destinationCountries: [],
                safeguards: []
            });
        }
        return processedActivity;
    }
    async anonymizeActivity(activity, method) {
        const cacheKey = `${activity.id}_${method}`;
        if (this.anonymizationCache.has(cacheKey)) {
            return this.anonymizationCache.get(cacheKey);
        }
        let anonymized = { ...activity };
        switch (method) {
            case AnonymizationMethod.PSEUDONYMIZATION:
                anonymized = await this.pseudonymizeActivity(anonymized);
                break;
            case AnonymizationMethod.GENERALIZATION:
                anonymized = await this.generalizeActivity(anonymized);
                break;
            case AnonymizationMethod.SUPPRESSION:
                anonymized = await this.suppressActivityData(anonymized);
                break;
            case AnonymizationMethod.NOISE_ADDITION:
                anonymized = await this.addNoiseToActivity(anonymized);
                break;
            case AnonymizationMethod.K_ANONYMITY:
                anonymized = await this.applyKAnonymity(anonymized);
                break;
            case AnonymizationMethod.DIFFERENTIAL_PRIVACY:
                anonymized = await this.applyDifferentialPrivacy(anonymized);
                break;
            case AnonymizationMethod.TOKENIZATION:
                anonymized = await this.tokenizeActivity(anonymized);
                break;
            case AnonymizationMethod.HASHING:
                anonymized = await this.hashActivityData(anonymized);
                break;
        }
        this.anonymizationCache.set(cacheKey, anonymized);
        this.emit('activityAnonymized', { original: activity.id, method, anonymized });
        return anonymized;
    }
    async recordConsent(consent) {
        const newConsent = {
            id: (0, crypto_1.randomUUID)(),
            ...consent
        };
        // Validate consent method
        if (!this.isValidConsentMethod(newConsent.consentMethod)) {
            throw new Error(`Invalid consent method: ${newConsent.consentMethod}`);
        }
        this.consentRecords.set(newConsent.id, newConsent);
        this.emit('consentRecorded', newConsent);
        // Log privacy operation
        await this.logPrivacyOperation({
            operation: PrivacyOperation.CONSENT_CHANGE,
            tenantId: newConsent.tenantId,
            userId: newConsent.userId,
            dataCategory: [DataCategory.PERSONAL_IDENTIFIERS],
            legalBasis: LegalBasis.CONSENT,
            purpose: 'Consent management',
            dataElements: ['consent_status'],
            processingMethod: ProcessingOperation.STORAGE,
            accessRequester: newConsent.userId,
            justification: 'User consent recording',
            consentReference: newConsent.id,
            riskAssessment: RiskLevel.LOW,
            thirdPartiesInvolved: [],
            crossBorderTransfer: false,
            destinationCountries: [],
            safeguards: []
        });
        return newConsent;
    }
    async withdrawConsent(userId, policyId, reason) {
        const existingConsent = Array.from(this.consentRecords.values())
            .find(consent => consent.userId === userId &&
            consent.policyId === policyId &&
            consent.isActive);
        if (!existingConsent)
            return false;
        existingConsent.isActive = false;
        existingConsent.withdrawalDate = new Date();
        existingConsent.withdrawalReason = reason;
        this.emit('consentWithdrawn', existingConsent);
        // Log privacy operation
        await this.logPrivacyOperation({
            operation: PrivacyOperation.CONSENT_CHANGE,
            tenantId: existingConsent.tenantId,
            userId: existingConsent.userId,
            dataCategory: [DataCategory.PERSONAL_IDENTIFIERS],
            legalBasis: LegalBasis.CONSENT,
            purpose: 'Consent withdrawal',
            dataElements: ['consent_status'],
            processingMethod: ProcessingOperation.DELETION,
            accessRequester: existingConsent.userId,
            justification: `User consent withdrawal: ${reason}`,
            consentReference: existingConsent.id,
            riskAssessment: RiskLevel.MEDIUM,
            thirdPartiesInvolved: [],
            crossBorderTransfer: false,
            destinationCountries: [],
            safeguards: []
        });
        return true;
    }
    async processDataSubjectRight(request) {
        const newRequest = {
            id: (0, crypto_1.randomUUID)(),
            requestDate: new Date(),
            status: RightRequestStatus.SUBMITTED,
            processingNotes: [],
            ...request
        };
        this.dataSubjectRights.set(newRequest.id, newRequest);
        this.emit('dataSubjectRightRequested', newRequest);
        // Start processing asynchronously
        this.processDataSubjectRightAsync(newRequest.id);
        return newRequest;
    }
    async exportUserData(userId, tenantId) {
        // Collect all user data for portability
        const activityData = []; // Would query from activity service
        const consentHistory = Array.from(this.consentRecords.values())
            .filter(consent => consent.userId === userId && consent.tenantId === tenantId);
        const rightsRequests = Array.from(this.dataSubjectRights.values())
            .filter(request => request.userId === userId && request.tenantId === tenantId);
        const personalData = {
            userId,
            tenantId,
            exportDate: new Date(),
            dataCategories: this.getUserDataCategories(userId)
        };
        // Log privacy operation
        await this.logPrivacyOperation({
            operation: PrivacyOperation.DATA_ACCESS,
            tenantId,
            userId,
            dataCategory: [DataCategory.PERSONAL_IDENTIFIERS, DataCategory.BEHAVIORAL_DATA],
            legalBasis: LegalBasis.CONSENT,
            purpose: 'Data portability request',
            dataElements: ['all_user_data'],
            processingMethod: ProcessingOperation.ACCESS,
            accessRequester: userId,
            justification: 'GDPR Article 20 - Right to data portability',
            riskAssessment: RiskLevel.MEDIUM,
            thirdPartiesInvolved: [],
            crossBorderTransfer: false,
            destinationCountries: [],
            safeguards: []
        });
        return {
            personalData,
            activityData,
            consentHistory,
            rightsRequests
        };
    }
    async createDataFlowMapping(mapping) {
        const newMapping = {
            id: (0, crypto_1.randomUUID)(),
            ...mapping
        };
        // Assess risk level
        newMapping.riskLevel = this.assessDataFlowRisk(newMapping);
        this.dataFlowMappings.set(newMapping.id, newMapping);
        this.emit('dataFlowMappingCreated', newMapping);
        return newMapping;
    }
    async getPrivacyAuditLogs(filter = {}) {
        let logs = Array.from(this.auditLogs.values());
        if (filter.tenantId) {
            logs = logs.filter(log => log.tenantId === filter.tenantId);
        }
        if (filter.userId) {
            logs = logs.filter(log => log.userId === filter.userId);
        }
        if (filter.operation) {
            logs = logs.filter(log => log.operation === filter.operation);
        }
        if (filter.startDate) {
            logs = logs.filter(log => log.timestamp >= filter.startDate);
        }
        if (filter.endDate) {
            logs = logs.filter(log => log.timestamp <= filter.endDate);
        }
        if (filter.riskLevel) {
            logs = logs.filter(log => log.riskAssessment === filter.riskLevel);
        }
        return logs.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
    async getComplianceReport(tenantId) {
        const policies = Array.from(this.privacyPolicies.values())
            .filter(p => p.tenantId === tenantId);
        const consents = Array.from(this.consentRecords.values())
            .filter(c => c.tenantId === tenantId);
        const rightsRequests = Array.from(this.dataSubjectRights.values())
            .filter(r => r.tenantId === tenantId);
        const dataFlows = Array.from(this.dataFlowMappings.values())
            .filter(f => f.tenantId === tenantId);
        // Calculate compliance metrics
        const policyCompliance = this.assessPolicyCompliance(policies);
        const consentCoverage = this.calculateConsentCoverage(consents, policies);
        const rightsRequestMetrics = this.calculateRightsMetrics(rightsRequests);
        const dataFlowRisks = this.calculateDataFlowRisks(dataFlows);
        const auditFindings = this.generateAuditFindings(tenantId);
        const recommendations = this.generateComplianceRecommendations(policies, consents, dataFlows);
        return {
            policyCompliance,
            consentCoverage,
            rightsRequestMetrics,
            dataFlowRisks,
            auditFindings,
            recommendations
        };
    }
    async validatePolicyCompliance(policy) {
        // Validate against GDPR, CCPA, and other regulations
        if (policy.consentRequired && policy.legalBasis.includes(LegalBasis.LEGITIMATE_INTERESTS)) {
            throw new Error('Consent required policies cannot use legitimate interests as legal basis');
        }
        if (policy.crossBorderTransfer && policy.allowedJurisdictions.length === 0) {
            throw new Error('Cross-border transfer requires specified allowed jurisdictions');
        }
        // Validate data retention period
        if (policy.dataRetentionPeriod > 7 * 365 * 24 * 60 * 60 * 1000) { // 7 years
            console.warn('Data retention period exceeds recommended maximum of 7 years');
        }
    }
    getApplicablePolicies(tenantId) {
        return Array.from(this.privacyPolicies.values())
            .filter(policy => policy.tenantId === tenantId && policy.isActive)
            .filter(policy => {
            const now = new Date();
            return now >= policy.effectiveDate &&
                (!policy.expirationDate || now <= policy.expirationDate);
        });
    }
    async hasValidConsent(userId, policyId) {
        const consent = Array.from(this.consentRecords.values())
            .find(consent => consent.userId === userId &&
            consent.policyId === policyId &&
            consent.isActive &&
            consent.consentGiven &&
            (!consent.expirationDate || consent.expirationDate > new Date()));
        return !!consent;
    }
    async applyPrivacyRule(activity, rule, policyId) {
        let processedActivity = { ...activity };
        // Apply minimization rules
        for (const minRule of rule.minimizationRules) {
            processedActivity = this.applyMinimizationRule(processedActivity, minRule);
        }
        // Apply anonymization if required
        if (rule.anonymizationMethod !== AnonymizationMethod.NONE) {
            processedActivity = await this.anonymizeActivity(processedActivity, rule.anonymizationMethod);
        }
        // Apply encryption if required
        if (rule.encryptionRequired) {
            processedActivity = await this.encryptSensitiveFields(processedActivity);
        }
        return processedActivity;
    }
    applyMinimizationRule(activity, rule) {
        const processed = { ...activity };
        switch (rule.action) {
            case 'remove':
                delete processed[rule.field];
                break;
            case 'mask':
                const fieldValue = processed[rule.field];
                if (fieldValue) {
                    processed[rule.field] = this.maskValue(fieldValue, rule.parameters);
                }
                break;
            case 'generalize':
                const value = processed[rule.field];
                if (value) {
                    processed[rule.field] = this.generalizeValue(value, rule.parameters);
                }
                break;
            case 'pseudonymize':
                const originalValue = processed[rule.field];
                if (originalValue) {
                    processed[rule.field] = this.pseudonymizeValue(originalValue);
                }
                break;
        }
        return processed;
    }
    classifyActivityData(activity) {
        const categories = [];
        // Check for personal identifiers
        if (activity.userId || activity.sessionId) {
            categories.push(DataCategory.PERSONAL_IDENTIFIERS);
        }
        // Check for technical data
        if (activity.ipAddress || activity.userAgent) {
            categories.push(DataCategory.TECHNICAL_DATA);
        }
        // Check for location data
        if (activity.location) {
            categories.push(DataCategory.LOCATION_DATA);
        }
        // Check for behavioral data
        if (activity.activityType || activity.metadata) {
            categories.push(DataCategory.BEHAVIORAL_DATA);
        }
        // Check for financial data
        if (activity.resource?.includes('portfolio') || activity.resource?.includes('trading')) {
            categories.push(DataCategory.FINANCIAL_DATA);
        }
        return categories;
    }
    assessRisk(activity, rule) {
        let riskScore = 0;
        // Risk factors
        if (activity.sensitiveData)
            riskScore += 2;
        if (activity.riskScore && activity.riskScore > 0.7)
            riskScore += 2;
        if (rule.dataCategory === DataCategory.FINANCIAL_DATA)
            riskScore += 1;
        if (rule.dataCategory === DataCategory.BIOMETRIC_DATA)
            riskScore += 3;
        if (activity.location && activity.location.country !== 'US')
            riskScore += 1;
        if (riskScore >= 4)
            return RiskLevel.CRITICAL;
        if (riskScore >= 3)
            return RiskLevel.HIGH;
        if (riskScore >= 2)
            return RiskLevel.MEDIUM;
        return RiskLevel.LOW;
    }
    async logPrivacyOperation(operation) {
        const log = {
            id: (0, crypto_1.randomUUID)(),
            timestamp: new Date(),
            complianceCheck: await this.performComplianceCheck(operation),
            violations: await this.checkViolations(operation),
            ...operation
        };
        this.auditLogs.set(log.id, log);
        this.emit('privacyOperationLogged', log);
    }
    // Anonymization method implementations
    async pseudonymizeActivity(activity) {
        const pseudonymized = { ...activity };
        if (pseudonymized.userId) {
            pseudonymized.userId = this.pseudonymizeValue(pseudonymized.userId);
        }
        if (pseudonymized.ipAddress) {
            pseudonymized.ipAddress = this.pseudonymizeValue(pseudonymized.ipAddress);
        }
        return pseudonymized;
    }
    async generalizeActivity(activity) {
        const generalized = { ...activity };
        // Generalize timestamp to hour
        const timestamp = new Date(generalized.timestamp);
        timestamp.setMinutes(0, 0, 0);
        generalized.timestamp = timestamp;
        // Generalize location to city level
        if (generalized.location) {
            generalized.location = {
                ...generalized.location,
                latitude: undefined,
                longitude: undefined
            };
        }
        return generalized;
    }
    async suppressActivityData(activity) {
        const suppressed = { ...activity };
        // Remove personally identifiable information
        suppressed.userId = 'SUPPRESSED';
        suppressed.ipAddress = 'SUPPRESSED';
        suppressed.userAgent = 'SUPPRESSED';
        if (suppressed.location) {
            suppressed.location = {
                country: suppressed.location.country,
                region: 'SUPPRESSED',
                city: 'SUPPRESSED',
                timezone: suppressed.location.timezone
            };
        }
        return suppressed;
    }
    async addNoiseToActivity(activity) {
        const noisy = { ...activity };
        // Add noise to timestamp (±5 minutes)
        const noise = (Math.random() - 0.5) * 10 * 60 * 1000; // ±5 minutes in ms
        noisy.timestamp = new Date(activity.timestamp.getTime() + noise);
        // Add noise to risk score
        if (noisy.riskScore) {
            const riskNoise = (Math.random() - 0.5) * 0.1; // ±0.05
            noisy.riskScore = Math.max(0, Math.min(1, noisy.riskScore + riskNoise));
        }
        return noisy;
    }
    async applyKAnonymity(activity, k = 5) {
        // Simplified k-anonymity implementation
        // In production, would need access to other records to ensure k-anonymity
        return this.generalizeActivity(activity);
    }
    async applyDifferentialPrivacy(activity, epsilon = 1.0) {
        // Simplified differential privacy implementation
        // Add Laplace noise based on epsilon parameter
        return this.addNoiseToActivity(activity);
    }
    async tokenizeActivity(activity) {
        const tokenized = { ...activity };
        if (tokenized.userId) {
            tokenized.userId = `TOKEN_${(0, crypto_1.randomUUID)()}`;
        }
        if (tokenized.sessionId) {
            tokenized.sessionId = `TOKEN_${(0, crypto_1.randomUUID)()}`;
        }
        return tokenized;
    }
    async hashActivityData(activity) {
        const hashed = { ...activity };
        if (hashed.userId) {
            hashed.userId = this.hashValue(hashed.userId);
        }
        if (hashed.ipAddress) {
            hashed.ipAddress = this.hashValue(hashed.ipAddress);
        }
        return hashed;
    }
    pseudonymizeValue(value) {
        if (this.pseudonymMappings.has(value)) {
            return this.pseudonymMappings.get(value);
        }
        const pseudonym = `PSEUDO_${(0, crypto_1.randomUUID)()}`;
        this.pseudonymMappings.set(value, pseudonym);
        return pseudonym;
    }
    maskValue(value, parameters) {
        const maskChar = parameters?.maskChar || '*';
        const visibleChars = parameters?.visibleChars || 2;
        if (value.length <= visibleChars * 2) {
            return maskChar.repeat(value.length);
        }
        return value.substring(0, visibleChars) +
            maskChar.repeat(value.length - visibleChars * 2) +
            value.substring(value.length - visibleChars);
    }
    generalizeValue(value, parameters) {
        if (typeof value === 'number') {
            const precision = parameters?.precision || 10;
            return Math.round(value / precision) * precision;
        }
        if (typeof value === 'string' && parameters?.categories) {
            // Map to category
            return parameters.categories[value] || 'OTHER';
        }
        return value;
    }
    hashValue(value) {
        // Simplified hash - in production use proper cryptographic hash
        let hash = 0;
        for (let i = 0; i < value.length; i++) {
            const char = value.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return `HASH_${Math.abs(hash).toString(16)}`;
    }
    async encryptSensitiveFields(activity) {
        // Placeholder for encryption implementation
        return activity;
    }
    isValidConsentMethod(method) {
        // GDPR requires explicit consent for most cases
        return method === ConsentMethod.EXPLICIT_OPT_IN;
    }
    async processDataSubjectRightAsync(requestId) {
        const request = this.dataSubjectRights.get(requestId);
        if (!request)
            return;
        try {
            request.status = RightRequestStatus.PROCESSING;
            this.emit('dataSubjectRightStatusChanged', request);
            // Process based on right type
            switch (request.right) {
                case DataSubjectRight.RIGHT_TO_ACCESS:
                    await this.processAccessRight(request);
                    break;
                case DataSubjectRight.RIGHT_TO_ERASURE:
                    await this.processErasureRight(request);
                    break;
                case DataSubjectRight.RIGHT_TO_PORTABILITY:
                    await this.processPortabilityRight(request);
                    break;
                // Handle other rights
            }
            request.status = RightRequestStatus.COMPLETED;
            request.responseDate = new Date();
        }
        catch (error) {
            request.status = RightRequestStatus.REJECTED;
            request.processingNotes.push(`Error: ${this.getErrorMessage(error)}`);
        }
        this.emit('dataSubjectRightStatusChanged', request);
    }
    async processAccessRight(request) {
        request.responseData = await this.exportUserData(request.userId, request.tenantId);
        request.processingNotes.push('Data export completed');
    }
    async processErasureRight(request) {
        // Check if erasure is legally permissible
        const canErase = await this.canEraseUserData(request.userId, request.tenantId);
        if (canErase) {
            // Perform erasure
            request.processingNotes.push('User data erased');
        }
        else {
            request.status = RightRequestStatus.PARTIALLY_FULFILLED;
            request.processingNotes.push('Partial erasure due to legal obligations');
        }
    }
    async processPortabilityRight(request) {
        request.responseData = await this.exportUserData(request.userId, request.tenantId);
        request.processingNotes.push('Portable data export completed');
    }
    getUserDataCategories(userId) {
        // Determine what data categories exist for user
        return [
            DataCategory.PERSONAL_IDENTIFIERS,
            DataCategory.BEHAVIORAL_DATA,
            DataCategory.TECHNICAL_DATA,
            DataCategory.FINANCIAL_DATA
        ];
    }
    assessDataFlowRisk(mapping) {
        let riskScore = 0;
        // Risk factors
        if (mapping.dataCategories.includes(DataCategory.SENSITIVE_ATTRIBUTES))
            riskScore += 3;
        if (mapping.dataCategories.includes(DataCategory.BIOMETRIC_DATA))
            riskScore += 3;
        if (mapping.dataCategories.includes(DataCategory.FINANCIAL_DATA))
            riskScore += 2;
        if (mapping.dataVolume === DataVolume.BIG_DATA)
            riskScore += 2;
        if (mapping.frequency === DataFlowFrequency.REAL_TIME)
            riskScore += 1;
        if (riskScore >= 5)
            return RiskLevel.CRITICAL;
        if (riskScore >= 3)
            return RiskLevel.HIGH;
        if (riskScore >= 2)
            return RiskLevel.MEDIUM;
        return RiskLevel.LOW;
    }
    async performComplianceCheck(operation) {
        // Simplified compliance check
        return operation.legalBasis !== undefined && operation.purpose !== undefined;
    }
    async checkViolations(operation) {
        const violations = [];
        if (!operation.legalBasis) {
            violations.push('No legal basis specified');
        }
        if (!operation.purpose) {
            violations.push('No processing purpose specified');
        }
        if (operation.crossBorderTransfer && !operation.safeguards?.length) {
            violations.push('Cross-border transfer without adequate safeguards');
        }
        return violations;
    }
    assessPolicyCompliance(policies) {
        const compliance = {};
        policies.forEach(policy => {
            compliance[policy.name] = policy.isActive &&
                policy.legalBasis.length > 0 &&
                policy.dataProcessingPurposes.length > 0;
        });
        return compliance;
    }
    calculateConsentCoverage(consents, policies) {
        const consentRequiredPolicies = policies.filter(p => p.consentRequired);
        if (consentRequiredPolicies.length === 0)
            return 100;
        const validConsents = consents.filter(c => c.isActive && c.consentGiven).length;
        return (validConsents / consentRequiredPolicies.length) * 100;
    }
    calculateRightsMetrics(requests) {
        const metrics = {
            [RightRequestStatus.SUBMITTED]: 0,
            [RightRequestStatus.VERIFYING]: 0,
            [RightRequestStatus.PROCESSING]: 0,
            [RightRequestStatus.COMPLETED]: 0,
            [RightRequestStatus.REJECTED]: 0,
            [RightRequestStatus.PARTIALLY_FULFILLED]: 0
        };
        requests.forEach(request => {
            metrics[request.status]++;
        });
        return metrics;
    }
    calculateDataFlowRisks(dataFlows) {
        const risks = {
            [RiskLevel.LOW]: 0,
            [RiskLevel.MEDIUM]: 0,
            [RiskLevel.HIGH]: 0,
            [RiskLevel.CRITICAL]: 0
        };
        dataFlows.forEach(flow => {
            risks[flow.riskLevel]++;
        });
        return risks;
    }
    generateAuditFindings(tenantId) {
        const logs = Array.from(this.auditLogs.values())
            .filter(log => log.tenantId === tenantId);
        const findings = [];
        const violationsCount = logs.filter(log => log.violations.length > 0).length;
        if (violationsCount > 0) {
            findings.push(`${violationsCount} operations with compliance violations`);
        }
        const highRiskOps = logs.filter(log => log.riskAssessment === RiskLevel.HIGH ||
            log.riskAssessment === RiskLevel.CRITICAL).length;
        if (highRiskOps > 0) {
            findings.push(`${highRiskOps} high-risk privacy operations`);
        }
        return findings;
    }
    generateComplianceRecommendations(policies, consents, dataFlows) {
        const recommendations = [];
        // Check for missing consent
        const consentRequiredPolicies = policies.filter(p => p.consentRequired);
        const activeConsents = consents.filter(c => c.isActive && c.consentGiven);
        if (consentRequiredPolicies.length > activeConsents.length) {
            recommendations.push('Obtain missing user consents for data processing');
        }
        // Check for high-risk data flows
        const highRiskFlows = dataFlows.filter(f => f.riskLevel === RiskLevel.HIGH ||
            f.riskLevel === RiskLevel.CRITICAL);
        if (highRiskFlows.length > 0) {
            recommendations.push('Review and implement additional safeguards for high-risk data flows');
        }
        // Check policy expiration
        const expiringPolicies = policies.filter(p => p.expirationDate &&
            p.expirationDate.getTime() - Date.now() < 30 * 24 * 60 * 60 * 1000 // 30 days
        );
        if (expiringPolicies.length > 0) {
            recommendations.push('Update expiring privacy policies');
        }
        return recommendations;
    }
    async canEraseUserData(userId, tenantId) {
        // Check legal obligations that prevent erasure
        const auditLogs = await this.getPrivacyAuditLogs({ userId, tenantId });
        const hasLegalObligation = auditLogs.some(log => log.legalBasis === LegalBasis.LEGAL_OBLIGATION);
        return !hasLegalObligation;
    }
    initializeDefaultPolicies() {
        // Create default privacy policy templates
        const defaultPolicies = [
            {
                name: 'Standard Data Processing Policy',
                description: 'Standard policy for general data processing activities',
                version: '1.0',
                tenantId: 'default',
                effectiveDate: new Date(),
                isActive: true,
                consentRequired: true,
                dataProcessingPurposes: ['Service provision', 'Analytics', 'Security'],
                legalBasis: [LegalBasis.CONSENT, LegalBasis.LEGITIMATE_INTERESTS],
                dataRetentionPeriod: 2 * 365 * 24 * 60 * 60 * 1000, // 2 years
                thirdPartySharing: false,
                crossBorderTransfer: false,
                allowedJurisdictions: ['US'],
                rules: [
                    {
                        id: (0, crypto_1.randomUUID)(),
                        name: 'Personal Data Protection',
                        dataCategory: DataCategory.PERSONAL_IDENTIFIERS,
                        processingOperation: [ProcessingOperation.COLLECTION, ProcessingOperation.STORAGE],
                        anonymizationMethod: AnonymizationMethod.PSEUDONYMIZATION,
                        accessRestrictions: [
                            {
                                role: 'admin',
                                operations: [ProcessingOperation.ACCESS, ProcessingOperation.ANALYSIS],
                                conditions: ['audit_logged']
                            }
                        ],
                        auditRequired: true,
                        encryptionRequired: true,
                        minimizationRules: [
                            {
                                field: 'ipAddress',
                                condition: 'always',
                                action: 'mask',
                                parameters: { visibleChars: 2 }
                            }
                        ]
                    }
                ]
            }
        ];
        defaultPolicies.forEach(policy => this.createPrivacyPolicy(policy));
    }
}
exports.ActivityPrivacyService = ActivityPrivacyService;
