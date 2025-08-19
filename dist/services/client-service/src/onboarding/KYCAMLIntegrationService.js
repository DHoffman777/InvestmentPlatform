"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KYCAMLIntegrationService = exports.AMLScreeningType = exports.RiskFactorType = exports.RiskLevel = exports.AMLStatus = exports.KYCStatus = void 0;
const events_1 = require("events");
const crypto_1 = require("crypto");
var KYCStatus;
(function (KYCStatus) {
    KYCStatus["NOT_STARTED"] = "NOT_STARTED";
    KYCStatus["IN_PROGRESS"] = "IN_PROGRESS";
    KYCStatus["ADDITIONAL_INFO_REQUIRED"] = "ADDITIONAL_INFO_REQUIRED";
    KYCStatus["UNDER_REVIEW"] = "UNDER_REVIEW";
    KYCStatus["APPROVED"] = "APPROVED";
    KYCStatus["REJECTED"] = "REJECTED";
    KYCStatus["EXPIRED"] = "EXPIRED";
})(KYCStatus || (exports.KYCStatus = KYCStatus = {}));
var AMLStatus;
(function (AMLStatus) {
    AMLStatus["NOT_SCREENED"] = "NOT_SCREENED";
    AMLStatus["SCREENING_IN_PROGRESS"] = "SCREENING_IN_PROGRESS";
    AMLStatus["CLEAR"] = "CLEAR";
    AMLStatus["POTENTIAL_MATCH"] = "POTENTIAL_MATCH";
    AMLStatus["HIT_CONFIRMED"] = "HIT_CONFIRMED";
    AMLStatus["UNDER_REVIEW"] = "UNDER_REVIEW";
    AMLStatus["APPROVED_WITH_CONDITIONS"] = "APPROVED_WITH_CONDITIONS";
    AMLStatus["REJECTED"] = "REJECTED";
})(AMLStatus || (exports.AMLStatus = AMLStatus = {}));
var RiskLevel;
(function (RiskLevel) {
    RiskLevel["LOW"] = "LOW";
    RiskLevel["MEDIUM"] = "MEDIUM";
    RiskLevel["HIGH"] = "HIGH";
    RiskLevel["CRITICAL"] = "CRITICAL";
})(RiskLevel || (exports.RiskLevel = RiskLevel = {}));
var RiskFactorType;
(function (RiskFactorType) {
    RiskFactorType["GEOGRAPHIC"] = "GEOGRAPHIC";
    RiskFactorType["POLITICAL_EXPOSURE"] = "POLITICAL_EXPOSURE";
    RiskFactorType["ADVERSE_MEDIA"] = "ADVERSE_MEDIA";
    RiskFactorType["SANCTIONS"] = "SANCTIONS";
    RiskFactorType["HIGH_RISK_BUSINESS"] = "HIGH_RISK_BUSINESS";
    RiskFactorType["LARGE_CASH_TRANSACTIONS"] = "LARGE_CASH_TRANSACTIONS";
    RiskFactorType["FREQUENT_TRANSACTIONS"] = "FREQUENT_TRANSACTIONS";
    RiskFactorType["UNUSUAL_TRANSACTION_PATTERNS"] = "UNUSUAL_TRANSACTION_PATTERNS";
    RiskFactorType["INSUFFICIENT_DOCUMENTATION"] = "INSUFFICIENT_DOCUMENTATION";
    RiskFactorType["INCONSISTENT_INFORMATION"] = "INCONSISTENT_INFORMATION";
    RiskFactorType["REGULATORY_ACTION"] = "REGULATORY_ACTION";
    RiskFactorType["CRIMINAL_BACKGROUND"] = "CRIMINAL_BACKGROUND";
    RiskFactorType["OTHER"] = "OTHER";
})(RiskFactorType || (exports.RiskFactorType = RiskFactorType = {}));
var AMLScreeningType;
(function (AMLScreeningType) {
    AMLScreeningType["INITIAL_SCREENING"] = "INITIAL_SCREENING";
    AMLScreeningType["PERIODIC_SCREENING"] = "PERIODIC_SCREENING";
    AMLScreeningType["TRANSACTION_SCREENING"] = "TRANSACTION_SCREENING";
    AMLScreeningType["AD_HOC_SCREENING"] = "AD_HOC_SCREENING";
})(AMLScreeningType || (exports.AMLScreeningType = AMLScreeningType = {}));
class KYCAMLIntegrationService extends events_1.EventEmitter {
    kycProfiles = new Map();
    amlScreeningResults = new Map();
    constructor() {
        super();
    }
    async initiateKYCProcess(clientId, tenantId, workflowId, initialData) {
        const kycProfile = {
            id: (0, crypto_1.randomUUID)(),
            clientId,
            tenantId,
            workflowId,
            personalInfo: initialData.personalInfo || {},
            addressInfo: initialData.addressInfo || { currentAddress: {}, previousAddresses: [], addressHistory: [] },
            identificationInfo: initialData.identificationInfo || { primaryId: {}, verificationMethods: [] },
            financialInfo: initialData.financialInfo || { employmentStatus: 'employed', sourceOfWealth: [], sourceOfFunds: [], bankingRelationships: [] },
            businessInfo: initialData.businessInfo,
            riskFactors: [],
            kycStatus: KYCStatus.IN_PROGRESS,
            amlStatus: AMLStatus.NOT_SCREENED,
            overallRisk: RiskLevel.MEDIUM,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.kycProfiles.set(kycProfile.id, kycProfile);
        this.emit('kycInitiated', kycProfile);
        // Start automated verification processes
        await this.performIdentityVerification(kycProfile.id);
        await this.performAddressVerification(kycProfile.id);
        await this.performAMLScreening(kycProfile.id);
        return kycProfile;
    }
    async performIdentityVerification(kycProfileId) {
        const profile = this.kycProfiles.get(kycProfileId);
        if (!profile)
            return;
        const verificationMethods = [];
        if (profile.identificationInfo.primaryId) {
            verificationMethods.push({
                method: 'document',
                provider: 'DocumentVerificationService',
                status: Math.random() > 0.1 ? 'passed' : 'failed',
                confidence: Math.random() * 20 + 80,
                details: {
                    documentType: profile.identificationInfo.primaryId.type,
                    authenticityCheck: true,
                    dataExtraction: true,
                    expirationCheck: true
                },
                verifiedAt: new Date()
            });
        }
        verificationMethods.push({
            method: 'knowledge_based',
            provider: 'KBAService',
            status: Math.random() > 0.15 ? 'passed' : 'failed',
            confidence: Math.random() * 30 + 70,
            details: {
                questionsAnswered: 4,
                correctAnswers: Math.floor(Math.random() * 2) + 3,
                timeTaken: Math.floor(Math.random() * 300) + 120
            },
            verifiedAt: new Date()
        });
        profile.identificationInfo.verificationMethods = verificationMethods;
        const failedVerifications = verificationMethods.filter(v => v.status === 'failed').length;
        if (failedVerifications > 1) {
            profile.riskFactors.push({
                type: RiskFactorType.INSUFFICIENT_DOCUMENTATION,
                level: RiskLevel.HIGH,
                description: 'Multiple identity verification methods failed',
                source: 'IdentityVerificationService',
                detectedAt: new Date(),
                mitigated: false
            });
        }
        this.emit('identityVerificationComplete', { kycProfileId, verificationMethods });
    }
    async performAddressVerification(kycProfileId) {
        const profile = this.kycProfiles.get(kycProfileId);
        if (!profile || !profile.addressInfo.currentAddress)
            return;
        const highRiskCountries = ['Country1', 'Country2'];
        if (highRiskCountries.includes(profile.addressInfo.currentAddress.country)) {
            profile.riskFactors.push({
                type: RiskFactorType.GEOGRAPHIC,
                level: RiskLevel.HIGH,
                description: `Client resides in high-risk jurisdiction: ${profile.addressInfo.currentAddress.country}`,
                source: 'GeographicRiskAssessment',
                detectedAt: new Date(),
                mitigated: false
            });
        }
        this.emit('addressVerificationComplete', { kycProfileId });
    }
    async performAMLScreening(kycProfileId) {
        const profile = this.kycProfiles.get(kycProfileId);
        if (!profile)
            return;
        profile.amlStatus = AMLStatus.SCREENING_IN_PROGRESS;
        const screeningResult = {
            id: (0, crypto_1.randomUUID)(),
            clientId: profile.clientId,
            screeningType: AMLScreeningType.INITIAL_SCREENING,
            provider: 'AMLScreeningService',
            status: 'clear',
            confidence: 95,
            results: [],
            screenedAt: new Date()
        };
        if (!this.amlScreeningResults.has(profile.clientId)) {
            this.amlScreeningResults.set(profile.clientId, []);
        }
        this.amlScreeningResults.get(profile.clientId).push(screeningResult);
        profile.amlStatus = AMLStatus.CLEAR;
        this.emit('amlScreeningComplete', { kycProfileId, screeningResult });
        await this.performRiskAssessment(kycProfileId);
    }
    async performRiskAssessment(kycProfileId) {
        const profile = this.kycProfiles.get(kycProfileId);
        if (!profile)
            return;
        let riskScore = 0;
        profile.riskFactors.forEach(factor => {
            switch (factor.level) {
                case RiskLevel.LOW:
                    riskScore += 10;
                    break;
                case RiskLevel.MEDIUM:
                    riskScore += 25;
                    break;
                case RiskLevel.HIGH:
                    riskScore += 50;
                    break;
                case RiskLevel.CRITICAL:
                    riskScore += 100;
                    break;
            }
        });
        if (riskScore >= 100) {
            profile.overallRisk = RiskLevel.CRITICAL;
        }
        else if (riskScore >= 60) {
            profile.overallRisk = RiskLevel.HIGH;
        }
        else if (riskScore >= 30) {
            profile.overallRisk = RiskLevel.MEDIUM;
        }
        else {
            profile.overallRisk = RiskLevel.LOW;
        }
        if (profile.overallRisk === RiskLevel.CRITICAL) {
            profile.kycStatus = KYCStatus.REJECTED;
        }
        else if (profile.overallRisk === RiskLevel.HIGH) {
            profile.kycStatus = KYCStatus.UNDER_REVIEW;
        }
        else if (profile.amlStatus === AMLStatus.CLEAR &&
            profile.identificationInfo.verificationMethods.every(v => v.status === 'passed')) {
            profile.kycStatus = KYCStatus.APPROVED;
            profile.completedAt = new Date();
        }
        else {
            profile.kycStatus = KYCStatus.ADDITIONAL_INFO_REQUIRED;
        }
        profile.updatedAt = new Date();
        this.emit('riskAssessmentComplete', { kycProfileId, riskScore, overallRisk: profile.overallRisk });
    }
    getKYCProfile(kycProfileId) {
        return this.kycProfiles.get(kycProfileId);
    }
    getKYCProfileByClient(clientId) {
        return Array.from(this.kycProfiles.values())
            .find(profile => profile.clientId === clientId);
    }
    getAMLScreeningResults(clientId) {
        return this.amlScreeningResults.get(clientId) || [];
    }
}
exports.KYCAMLIntegrationService = KYCAMLIntegrationService;
