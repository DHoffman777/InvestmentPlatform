"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.IdentityVerificationService = exports.KBAStatus = exports.DocumentVerificationStatus = exports.DocumentType = exports.BiometricStatus = exports.BiometricType = exports.VerificationStatus = exports.VerificationMethodType = exports.VerificationSessionStatus = exports.VerificationSessionType = void 0;
const events_1 = require("events");
const crypto_1 = require("crypto");
var VerificationSessionType;
(function (VerificationSessionType) {
    VerificationSessionType["FULL_VERIFICATION"] = "FULL_VERIFICATION";
    VerificationSessionType["DOCUMENT_ONLY"] = "DOCUMENT_ONLY";
    VerificationSessionType["BIOMETRIC_ONLY"] = "BIOMETRIC_ONLY";
    VerificationSessionType["KBA_ONLY"] = "KBA_ONLY";
    VerificationSessionType["RE_VERIFICATION"] = "RE_VERIFICATION";
    VerificationSessionType["PERIODIC_REVIEW"] = "PERIODIC_REVIEW";
})(VerificationSessionType || (exports.VerificationSessionType = VerificationSessionType = {}));
var VerificationSessionStatus;
(function (VerificationSessionStatus) {
    VerificationSessionStatus["PENDING"] = "PENDING";
    VerificationSessionStatus["IN_PROGRESS"] = "IN_PROGRESS";
    VerificationSessionStatus["AWAITING_INPUT"] = "AWAITING_INPUT";
    VerificationSessionStatus["PROCESSING"] = "PROCESSING";
    VerificationSessionStatus["COMPLETED"] = "COMPLETED";
    VerificationSessionStatus["FAILED"] = "FAILED";
    VerificationSessionStatus["EXPIRED"] = "EXPIRED";
    VerificationSessionStatus["CANCELLED"] = "CANCELLED";
})(VerificationSessionStatus || (exports.VerificationSessionStatus = VerificationSessionStatus = {}));
var VerificationMethodType;
(function (VerificationMethodType) {
    VerificationMethodType["DOCUMENT_VERIFICATION"] = "DOCUMENT_VERIFICATION";
    VerificationMethodType["BIOMETRIC_VERIFICATION"] = "BIOMETRIC_VERIFICATION";
    VerificationMethodType["KNOWLEDGE_BASED_AUTH"] = "KNOWLEDGE_BASED_AUTH";
    VerificationMethodType["DATABASE_VERIFICATION"] = "DATABASE_VERIFICATION";
    VerificationMethodType["PHONE_VERIFICATION"] = "PHONE_VERIFICATION";
    VerificationMethodType["EMAIL_VERIFICATION"] = "EMAIL_VERIFICATION";
    VerificationMethodType["ADDRESS_VERIFICATION"] = "ADDRESS_VERIFICATION";
})(VerificationMethodType || (exports.VerificationMethodType = VerificationMethodType = {}));
var VerificationStatus;
(function (VerificationStatus) {
    VerificationStatus["PENDING"] = "PENDING";
    VerificationStatus["IN_PROGRESS"] = "IN_PROGRESS";
    VerificationStatus["COMPLETED"] = "COMPLETED";
    VerificationStatus["FAILED"] = "FAILED";
    VerificationStatus["TIMEOUT"] = "TIMEOUT";
    VerificationStatus["CANCELLED"] = "CANCELLED";
})(VerificationStatus || (exports.VerificationStatus = VerificationStatus = {}));
var BiometricType;
(function (BiometricType) {
    BiometricType["FACE_MATCH"] = "FACE_MATCH";
    BiometricType["LIVENESS_CHECK"] = "LIVENESS_CHECK";
    BiometricType["VOICE_PRINT"] = "VOICE_PRINT";
    BiometricType["FINGERPRINT"] = "FINGERPRINT";
})(BiometricType || (exports.BiometricType = BiometricType = {}));
var BiometricStatus;
(function (BiometricStatus) {
    BiometricStatus["PENDING"] = "PENDING";
    BiometricStatus["CAPTURING"] = "CAPTURING";
    BiometricStatus["PROCESSING"] = "PROCESSING";
    BiometricStatus["VERIFIED"] = "VERIFIED";
    BiometricStatus["FAILED"] = "FAILED";
    BiometricStatus["QUALITY_INSUFFICIENT"] = "QUALITY_INSUFFICIENT";
    BiometricStatus["LIVENESS_FAILED"] = "LIVENESS_FAILED";
})(BiometricStatus || (exports.BiometricStatus = BiometricStatus = {}));
var DocumentType;
(function (DocumentType) {
    DocumentType["DRIVERS_LICENSE"] = "DRIVERS_LICENSE";
    DocumentType["PASSPORT"] = "PASSPORT";
    DocumentType["NATIONAL_ID"] = "NATIONAL_ID";
    DocumentType["BIRTH_CERTIFICATE"] = "BIRTH_CERTIFICATE";
})(DocumentType || (exports.DocumentType = DocumentType = {}));
var DocumentVerificationStatus;
(function (DocumentVerificationStatus) {
    DocumentVerificationStatus["PENDING"] = "PENDING";
    DocumentVerificationStatus["PROCESSING"] = "PROCESSING";
    DocumentVerificationStatus["VERIFIED"] = "VERIFIED";
    DocumentVerificationStatus["FAILED"] = "FAILED";
    DocumentVerificationStatus["INVALID_DOCUMENT"] = "INVALID_DOCUMENT";
    DocumentVerificationStatus["EXPIRED_DOCUMENT"] = "EXPIRED_DOCUMENT";
    DocumentVerificationStatus["POOR_IMAGE_QUALITY"] = "POOR_IMAGE_QUALITY";
})(DocumentVerificationStatus || (exports.DocumentVerificationStatus = DocumentVerificationStatus = {}));
var KBAStatus;
(function (KBAStatus) {
    KBAStatus["PENDING"] = "PENDING";
    KBAStatus["IN_PROGRESS"] = "IN_PROGRESS";
    KBAStatus["PASSED"] = "PASSED";
    KBAStatus["FAILED"] = "FAILED";
    KBAStatus["INSUFFICIENT_DATA"] = "INSUFFICIENT_DATA";
    KBAStatus["TIMEOUT"] = "TIMEOUT";
})(KBAStatus || (exports.KBAStatus = KBAStatus = {}));
class IdentityVerificationService extends events_1.EventEmitter {
    sessions = new Map();
    biometricVerifications = new Map();
    documentVerifications = new Map();
    kbaVerifications = new Map();
    constructor() {
        super();
    }
    async createVerificationSession(clientId, tenantId, workflowId, sessionType, provider = 'default', options = {}) {
        const sessionId = (0, crypto_1.randomUUID)();
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + (options.sessionTimeout || 30));
        const session = {
            id: sessionId,
            clientId,
            tenantId,
            workflowId,
            sessionType,
            status: VerificationSessionStatus.PENDING,
            provider,
            methods: [],
            results: [],
            metadata: {
                attempts: 0,
                maxAttempts: options.maxAttempts || 3
            },
            createdAt: new Date(),
            updatedAt: new Date(),
            expiresAt
        };
        this.sessions.set(sessionId, session);
        // Initialize required verification methods
        const requiredMethods = options.requiredMethods || this.getDefaultMethodsForSessionType(sessionType);
        for (const methodType of requiredMethods) {
            await this.initializeVerificationMethod(sessionId, methodType);
        }
        this.emit('verificationSessionCreated', session);
        return session;
    }
    getDefaultMethodsForSessionType(sessionType) {
        switch (sessionType) {
            case VerificationSessionType.FULL_VERIFICATION:
                return [
                    VerificationMethodType.DOCUMENT_VERIFICATION,
                    VerificationMethodType.BIOMETRIC_VERIFICATION,
                    VerificationMethodType.KNOWLEDGE_BASED_AUTH
                ];
            case VerificationSessionType.DOCUMENT_ONLY:
                return [VerificationMethodType.DOCUMENT_VERIFICATION];
            case VerificationSessionType.BIOMETRIC_ONLY:
                return [VerificationMethodType.BIOMETRIC_VERIFICATION];
            case VerificationSessionType.KBA_ONLY:
                return [VerificationMethodType.KNOWLEDGE_BASED_AUTH];
            case VerificationSessionType.RE_VERIFICATION:
                return [
                    VerificationMethodType.BIOMETRIC_VERIFICATION,
                    VerificationMethodType.KNOWLEDGE_BASED_AUTH
                ];
            default:
                return [VerificationMethodType.DOCUMENT_VERIFICATION];
        }
    }
    async initializeVerificationMethod(sessionId, methodType) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return;
        const method = {
            id: (0, crypto_1.randomUUID)(),
            type: methodType,
            status: VerificationStatus.PENDING,
            confidence: 0,
            provider: session.provider,
            startedAt: new Date(),
            data: {}
        };
        session.methods.push(method);
        session.updatedAt = new Date();
        this.emit('verificationMethodInitialized', { sessionId, method });
    }
    async startDocumentVerification(sessionId, documentType, frontImagePath, backImagePath) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error('Verification session not found');
        }
        const method = session.methods.find(m => m.type === VerificationMethodType.DOCUMENT_VERIFICATION);
        if (!method) {
            throw new Error('Document verification method not initialized');
        }
        method.status = VerificationStatus.IN_PROGRESS;
        method.data = { documentType, frontImagePath, backImagePath };
        const documentVerification = {
            id: (0, crypto_1.randomUUID)(),
            sessionId,
            documentType,
            status: DocumentVerificationStatus.PROCESSING,
            authenticity: {
                score: 0,
                verified: false,
                features: []
            },
            dataExtraction: {
                success: false,
                confidence: 0,
                extractedData: {},
                validationResults: []
            },
            imageQuality: {
                score: 0,
                acceptable: false,
                issues: []
            },
            createdAt: new Date()
        };
        this.documentVerifications.set(documentVerification.id, documentVerification);
        // Simulate document processing
        await this.processDocumentVerification(documentVerification.id);
        return documentVerification;
    }
    async processDocumentVerification(verificationId) {
        const verification = this.documentVerifications.get(verificationId);
        if (!verification)
            return;
        // Simulate image quality assessment
        verification.imageQuality = {
            score: Math.random() * 30 + 70, // 70-100
            acceptable: Math.random() > 0.1,
            issues: Math.random() < 0.2 ? ['blur', 'glare'] : []
        };
        // Simulate authenticity check
        verification.authenticity = {
            score: Math.random() * 20 + 80, // 80-100
            verified: Math.random() > 0.05,
            features: [
                {
                    name: 'Microtext',
                    present: Math.random() > 0.1,
                    confidence: Math.random() * 20 + 80,
                    description: 'Security microtext verification'
                },
                {
                    name: 'Hologram',
                    present: Math.random() > 0.15,
                    confidence: Math.random() * 25 + 75,
                    description: 'Holographic security element'
                },
                {
                    name: 'UV Features',
                    present: Math.random() > 0.1,
                    confidence: Math.random() * 15 + 85,
                    description: 'UV-visible security features'
                }
            ]
        };
        // Simulate data extraction
        verification.dataExtraction = {
            success: Math.random() > 0.05,
            confidence: Math.random() * 20 + 80,
            extractedData: this.generateMockExtractedData(verification.documentType),
            validationResults: [
                {
                    field: 'dateOfBirth',
                    status: 'valid',
                    message: 'Valid date format',
                    extractedValue: '1990-01-01'
                },
                {
                    field: 'expirationDate',
                    status: Math.random() > 0.1 ? 'valid' : 'warning',
                    message: Math.random() > 0.1 ? 'Document not expired' : 'Document expires within 30 days'
                }
            ]
        };
        // Determine overall status
        if (!verification.imageQuality.acceptable) {
            verification.status = DocumentVerificationStatus.POOR_IMAGE_QUALITY;
        }
        else if (!verification.authenticity.verified) {
            verification.status = DocumentVerificationStatus.INVALID_DOCUMENT;
        }
        else if (!verification.dataExtraction.success) {
            verification.status = DocumentVerificationStatus.FAILED;
        }
        else {
            verification.status = DocumentVerificationStatus.VERIFIED;
        }
        this.emit('documentVerificationComplete', verification);
        await this.updateSessionProgress(verification.sessionId);
    }
    generateMockExtractedData(documentType) {
        const baseData = {
            firstName: 'John',
            lastName: 'Doe',
            dateOfBirth: '1990-01-01',
            documentNumber: 'DOC123456789'
        };
        switch (documentType) {
            case DocumentType.DRIVERS_LICENSE:
                return {
                    ...baseData,
                    licenseClass: 'C',
                    address: '123 Main St, Anytown, ST 12345',
                    expirationDate: '2025-12-31',
                    restrictions: 'NONE'
                };
            case DocumentType.PASSPORT:
                return {
                    ...baseData,
                    passportNumber: 'P123456789',
                    nationality: 'US',
                    placeOfBirth: 'New York, NY',
                    expirationDate: '2030-12-31'
                };
            default:
                return baseData;
        }
    }
    async startBiometricVerification(sessionId, biometricType, captureData) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error('Verification session not found');
        }
        const method = session.methods.find(m => m.type === VerificationMethodType.BIOMETRIC_VERIFICATION);
        if (!method) {
            throw new Error('Biometric verification method not initialized');
        }
        method.status = VerificationStatus.IN_PROGRESS;
        method.data = { biometricType, captureData };
        const biometricVerification = {
            id: (0, crypto_1.randomUUID)(),
            sessionId,
            type: biometricType,
            status: BiometricStatus.PROCESSING,
            liveness: {
                score: 0,
                verified: false,
                flags: []
            },
            quality: {
                score: 0,
                acceptable: false,
                issues: []
            },
            comparison: {
                documentPhoto: false,
                selfiePhoto: false,
                matchScore: 0,
                verified: false
            },
            createdAt: new Date()
        };
        this.biometricVerifications.set(biometricVerification.id, biometricVerification);
        // Simulate biometric processing
        await this.processBiometricVerification(biometricVerification.id);
        return biometricVerification;
    }
    async processBiometricVerification(verificationId) {
        const verification = this.biometricVerifications.get(verificationId);
        if (!verification)
            return;
        // Simulate quality assessment
        verification.quality = {
            score: Math.random() * 30 + 70, // 70-100
            acceptable: Math.random() > 0.1,
            issues: Math.random() < 0.15 ? ['poor_lighting', 'motion_blur'] : []
        };
        // Simulate liveness detection
        verification.liveness = {
            score: Math.random() * 20 + 80, // 80-100
            verified: Math.random() > 0.05,
            flags: Math.random() < 0.1 ? ['static_image', 'presentation_attack'] : []
        };
        // Simulate face matching
        if (verification.type === BiometricType.FACE_MATCH) {
            verification.comparison = {
                documentPhoto: true,
                selfiePhoto: true,
                matchScore: Math.random() * 20 + 80, // 80-100
                verified: Math.random() > 0.1
            };
        }
        // Determine overall status
        if (!verification.quality.acceptable) {
            verification.status = BiometricStatus.QUALITY_INSUFFICIENT;
        }
        else if (!verification.liveness.verified) {
            verification.status = BiometricStatus.LIVENESS_FAILED;
        }
        else if (verification.type === BiometricType.FACE_MATCH && !verification.comparison.verified) {
            verification.status = BiometricStatus.FAILED;
        }
        else {
            verification.status = BiometricStatus.VERIFIED;
        }
        this.emit('biometricVerificationComplete', verification);
        await this.updateSessionProgress(verification.sessionId);
    }
    async startKnowledgeBasedAuth(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session) {
            throw new Error('Verification session not found');
        }
        const method = session.methods.find(m => m.type === VerificationMethodType.KNOWLEDGE_BASED_AUTH);
        if (!method) {
            throw new Error('KBA method not initialized');
        }
        method.status = VerificationStatus.IN_PROGRESS;
        const kbaVerification = {
            id: (0, crypto_1.randomUUID)(),
            sessionId,
            provider: 'KBAProvider',
            status: KBAStatus.IN_PROGRESS,
            questions: this.generateKBAQuestions(),
            score: 0,
            passed: false,
            metadata: {
                questionsAnswered: 0,
                correctAnswers: 0,
                timeSpent: 0,
                riskIndicators: []
            },
            createdAt: new Date()
        };
        this.kbaVerifications.set(kbaVerification.id, kbaVerification);
        this.emit('kbaStarted', kbaVerification);
        return kbaVerification;
    }
    generateKBAQuestions() {
        const questionTemplates = [
            'Which of the following streets have you lived on?',
            'What was the make of your first car?',
            'Which of these phone numbers have you had?',
            'What year did you graduate from high school?',
            'Which bank have you had an account with?'
        ];
        return questionTemplates.map(question => ({
            id: (0, crypto_1.randomUUID)(),
            question,
            options: [
                'Option A',
                'Option B',
                'Option C',
                'None of the above'
            ]
        }));
    }
    async submitKBAAnswers(kbaId, answers) {
        const kba = this.kbaVerifications.get(kbaId);
        if (!kba) {
            throw new Error('KBA verification not found');
        }
        // Process answers
        let correctAnswers = 0;
        let totalTimeSpent = 0;
        answers.forEach(answer => {
            const question = kba.questions.find(q => q.id === answer.questionId);
            if (question) {
                question.answer = answer.answer;
                question.timeSpent = answer.timeSpent;
                question.correct = Math.random() > 0.25; // 75% chance of correct answer
                question.confidence = Math.random() * 30 + 70;
                if (question.correct)
                    correctAnswers++;
                totalTimeSpent += answer.timeSpent;
            }
        });
        kba.metadata.questionsAnswered = answers.length;
        kba.metadata.correctAnswers = correctAnswers;
        kba.metadata.timeSpent = totalTimeSpent;
        kba.score = (correctAnswers / answers.length) * 100;
        kba.passed = kba.score >= 75; // 75% passing threshold
        kba.status = kba.passed ? KBAStatus.PASSED : KBAStatus.FAILED;
        kba.completedAt = new Date();
        // Check for risk indicators
        if (totalTimeSpent < 30000) { // Less than 30 seconds
            kba.metadata.riskIndicators.push('unusually_fast_completion');
        }
        if (correctAnswers === answers.length && totalTimeSpent < 60000) {
            kba.metadata.riskIndicators.push('perfect_score_fast_completion');
        }
        this.emit('kbaCompleted', kba);
        await this.updateSessionProgress(kba.sessionId);
        return kba;
    }
    async updateSessionProgress(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return;
        // Check if all methods are completed
        const allMethodsCompleted = session.methods.every(method => [VerificationStatus.COMPLETED, VerificationStatus.FAILED].includes(method.status));
        if (allMethodsCompleted) {
            // Calculate overall results
            const results = await this.calculateSessionResults(sessionId);
            session.results = results;
            // Determine session status
            const hasFailures = results.some(r => !r.verified);
            session.status = hasFailures ? VerificationSessionStatus.FAILED : VerificationSessionStatus.COMPLETED;
            session.completedAt = new Date();
            session.updatedAt = new Date();
            this.emit('verificationSessionCompleted', session);
        }
    }
    async calculateSessionResults(sessionId) {
        const session = this.sessions.get(sessionId);
        if (!session)
            return [];
        const results = [];
        for (const method of session.methods) {
            let verified = false;
            let confidence = 0;
            let score = 0;
            let riskFactors = [];
            let details = {};
            switch (method.type) {
                case VerificationMethodType.DOCUMENT_VERIFICATION:
                    const docVerification = Array.from(this.documentVerifications.values())
                        .find(dv => dv.sessionId === sessionId);
                    if (docVerification) {
                        verified = docVerification.status === DocumentVerificationStatus.VERIFIED;
                        confidence = docVerification.authenticity.score;
                        score = verified ? 100 : 0;
                        details = {
                            documentType: docVerification.documentType,
                            authenticityScore: docVerification.authenticity.score,
                            dataExtractionSuccess: docVerification.dataExtraction.success
                        };
                        if (!verified) {
                            riskFactors.push('document_verification_failed');
                        }
                    }
                    break;
                case VerificationMethodType.BIOMETRIC_VERIFICATION:
                    const bioVerification = Array.from(this.biometricVerifications.values())
                        .find(bv => bv.sessionId === sessionId);
                    if (bioVerification) {
                        verified = bioVerification.status === BiometricStatus.VERIFIED;
                        confidence = bioVerification.comparison.matchScore;
                        score = verified ? bioVerification.comparison.matchScore : 0;
                        details = {
                            livenessScore: bioVerification.liveness.score,
                            qualityScore: bioVerification.quality.score,
                            matchScore: bioVerification.comparison.matchScore
                        };
                        if (!bioVerification.liveness.verified) {
                            riskFactors.push('liveness_check_failed');
                        }
                        if (!verified) {
                            riskFactors.push('biometric_match_failed');
                        }
                    }
                    break;
                case VerificationMethodType.KNOWLEDGE_BASED_AUTH:
                    const kbaVerification = Array.from(this.kbaVerifications.values())
                        .find(kv => kv.sessionId === sessionId);
                    if (kbaVerification) {
                        verified = kbaVerification.passed;
                        confidence = kbaVerification.score;
                        score = kbaVerification.score;
                        details = {
                            questionsAnswered: kbaVerification.metadata.questionsAnswered,
                            correctAnswers: kbaVerification.metadata.correctAnswers,
                            timeSpent: kbaVerification.metadata.timeSpent,
                            riskIndicators: kbaVerification.metadata.riskIndicators
                        };
                        if (kbaVerification.metadata.riskIndicators.length > 0) {
                            riskFactors.push(...kbaVerification.metadata.riskIndicators);
                        }
                    }
                    break;
            }
            results.push({
                id: (0, crypto_1.randomUUID)(),
                sessionId,
                methodId: method.id,
                verified,
                confidence,
                score,
                riskFactors,
                details,
                timestamp: new Date()
            });
        }
        return results;
    }
    getVerificationSession(sessionId) {
        return this.sessions.get(sessionId);
    }
    getSessionsByClient(clientId, tenantId) {
        return Array.from(this.sessions.values())
            .filter(session => session.clientId === clientId && session.tenantId === tenantId);
    }
    async getVerificationMetrics(tenantId) {
        const sessions = Array.from(this.sessions.values())
            .filter(session => !tenantId || session.tenantId === tenantId);
        const totalSessions = sessions.length;
        const completedSessions = sessions.filter(s => s.status === VerificationSessionStatus.COMPLETED).length;
        const failedSessions = sessions.filter(s => s.status === VerificationSessionStatus.FAILED).length;
        const successRate = totalSessions > 0 ? (completedSessions / totalSessions) * 100 : 0;
        const completedSessionsWithDuration = sessions
            .filter(s => s.status === VerificationSessionStatus.COMPLETED && s.completedAt)
            .map(s => s.completedAt.getTime() - s.createdAt.getTime());
        const averageSessionDuration = completedSessionsWithDuration.length > 0
            ? completedSessionsWithDuration.reduce((a, b) => a + b, 0) / completedSessionsWithDuration.length
            : 0;
        const methodSuccessRates = {};
        Object.values(VerificationMethodType).forEach(methodType => {
            const methodResults = sessions
                .flatMap(s => s.results.map(r => ({ result: r, session: s })))
                .filter(({ result, session }) => session.methods.find((m) => m.id === result.methodId)?.type === methodType)
                .map(({ result }) => result);
            const successfulMethods = methodResults.filter(r => r.verified).length;
            methodSuccessRates[methodType] = methodResults.length > 0
                ? (successfulMethods / methodResults.length) * 100
                : 0;
        });
        return {
            totalSessions,
            completedSessions,
            failedSessions,
            successRate,
            averageSessionDuration,
            methodSuccessRates
        };
    }
}
exports.IdentityVerificationService = IdentityVerificationService;
