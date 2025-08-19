"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentFilingService = void 0;
const DocumentManagement_1 = require("../../models/documentManagement/DocumentManagement");
class DocumentFilingService {
    prisma;
    logger;
    kafkaService;
    filingRules;
    directoryTemplates;
    classificationEngine;
    taggingEngine;
    fileSystemManager;
    constructor(prisma, logger, kafkaService) {
        this.prisma = prisma;
        this.logger = logger;
        this.kafkaService = kafkaService;
        this.filingRules = new Map();
        this.directoryTemplates = new Map();
        this.initializeFilingService();
    }
    async fileDocument(request) {
        try {
            this.logger.info('Starting document filing', {
                documentId: request.documentId,
                documentType: request.document.documentType,
                enableAutoClassification: request.enableAutoClassification
            });
            const startTime = Date.now();
            const errors = [];
            let filingStatus = 'SUCCESS';
            let autoClassificationResult;
            if (request.enableAutoClassification) {
                try {
                    autoClassificationResult = await this.performAutoClassification(request.document, request.extractedData);
                }
                catch (error) {
                    errors.push(`Auto-classification failed: ${error.message}`);
                    filingStatus = 'PARTIAL';
                }
            }
            let tagGenerationResult;
            if (request.enableAutoTagging) {
                try {
                    tagGenerationResult = await this.generateTags(request.document, request.extractedData);
                }
                catch (error) {
                    errors.push(`Tag generation failed: ${error.message}`);
                    filingStatus = 'PARTIAL';
                }
            }
            const applicableRules = await this.getApplicableRules(request.document, request.customFilingRules);
            const appliedRules = [];
            const updatedMetadata = { ...request.document.metadata };
            let updatedClassification = request.document.classification;
            for (const rule of applicableRules) {
                try {
                    const ruleStartTime = Date.now();
                    const matchedConditions = await this.evaluateRuleConditions(rule, request.document, request.extractedData);
                    if (matchedConditions.length > 0) {
                        const executedActions = await this.executeRuleActions(rule, request.document, updatedMetadata);
                        if (executedActions.some(action => action.type === 'SET_CLASSIFICATION')) {
                            const classificationAction = executedActions.find(a => a.type === 'SET_CLASSIFICATION');
                            if (classificationAction) {
                                updatedClassification = classificationAction.parameters.classification;
                            }
                        }
                        appliedRules.push({
                            ruleId: rule.id,
                            ruleName: rule.name,
                            matchedConditions: matchedConditions.map(c => c.field),
                            executedActions: executedActions.map(a => a.type),
                            executionTime: Date.now() - ruleStartTime
                        });
                    }
                }
                catch (error) {
                    errors.push(`Rule execution failed for ${rule.name}: ${error.message}`);
                    filingStatus = 'PARTIAL';
                }
            }
            const filingPath = await this.generateFilingPath(request.document, autoClassificationResult, appliedRules, request.targetDirectory);
            const directoryStructure = await this.createDirectoryStructure(filingPath, request.document);
            try {
                await this.moveDocumentToPath(request.document, filingPath);
            }
            catch (error) {
                errors.push(`Document move failed: ${error.message}`);
                filingStatus = 'FAILED';
            }
            const generatedTags = [
                ...(tagGenerationResult?.tags.map(t => t.tag) || []),
                ...request.document.tags
            ];
            await this.updateDocumentRecord(request.documentId, {
                filingPath,
                classification: updatedClassification,
                tags: generatedTags,
                metadata: updatedMetadata,
                status: DocumentManagement_1.DocumentStatus.FILED
            });
            const result = {
                documentId: request.documentId,
                filingPath,
                appliedRules,
                generatedTags,
                updatedClassification: autoClassificationResult ? autoClassificationResult.classification : undefined,
                updatedMetadata,
                directoryStructure,
                processingTime: Date.now() - startTime,
                filingStatus,
                errors,
                metadata: {
                    filingMethod: this.determineFilingMethod(appliedRules, autoClassificationResult),
                    confidenceScore: this.calculateConfidenceScore(appliedRules, autoClassificationResult, tagGenerationResult),
                    rulesEvaluated: applicableRules.length,
                    rulesMatched: appliedRules.length,
                    tagsGenerated: tagGenerationResult?.tags.length || 0,
                    directoryDepth: filingPath.split('/').length,
                    filedAt: new Date(),
                    filedBy: 'DocumentFilingService'
                }
            };
            await this.publishFilingEvent(request.documentId, request.tenantId, result);
            this.logger.info('Document filing completed', {
                documentId: request.documentId,
                filingPath,
                rulesApplied: appliedRules.length,
                status: filingStatus,
                processingTime: result.processingTime
            });
            return result;
        }
        catch (error) {
            this.logger.error('Document filing failed', {
                documentId: request.documentId,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }
    async performAutoClassification(document, extractedData) {
        try {
            if (!this.classificationEngine) {
                return this.performRuleBasedClassification(document, extractedData);
            }
            const features = this.extractClassificationFeatures(document, extractedData);
            const prediction = await this.classificationEngine.classify(features);
            return {
                documentType: prediction.documentType,
                confidence: prediction.confidence,
                classification: this.inferDocumentClassification(prediction.documentType),
                reasoning: prediction.reasoning || [],
                alternativeTypes: prediction.alternatives || []
            };
        }
        catch (error) {
            this.logger.warn('ML classification failed, falling back to rule-based', { error: error.message });
            return this.performRuleBasedClassification(document, extractedData);
        }
    }
    performRuleBasedClassification(document, extractedData) {
        const classificationRules = [
            {
                type: DocumentManagement_1.DocumentType.TRADE_CONFIRMATION,
                keywords: ['trade', 'confirmation', 'buy', 'sell', 'executed'],
                weight: 0.9
            },
            {
                type: DocumentManagement_1.DocumentType.STATEMENT,
                keywords: ['statement', 'account', 'balance', 'period ending'],
                weight: 0.85
            },
            {
                type: DocumentManagement_1.DocumentType.PROSPECTUS,
                keywords: ['prospectus', 'fund', 'investment objective', 'risk factors'],
                weight: 0.9
            },
            {
                type: DocumentManagement_1.DocumentType.TAX_DOCUMENT,
                keywords: ['1099', 'tax', 'dividend', 'interest', 'capital gain'],
                weight: 0.8
            }
        ];
        const fullText = `${document.title || ''} ${document.description || ''}`.toLowerCase();
        const extractedText = extractedData?.fields.map(f => String(f.value)).join(' ').toLowerCase() || '';
        const combinedText = `${fullText} ${extractedText}`;
        const scores = classificationRules.map(rule => {
            const matchCount = rule.keywords.filter(keyword => combinedText.includes(keyword)).length;
            return {
                type: rule.type,
                confidence: (matchCount / rule.keywords.length) * rule.weight
            };
        }).sort((a, b) => b.confidence - a.confidence);
        const best = scores[0];
        const alternatives = scores.slice(1, 4);
        return {
            documentType: best.type,
            confidence: best.confidence,
            classification: this.inferDocumentClassification(best.type),
            reasoning: [`Matched keywords for ${best.type}`],
            alternativeTypes: alternatives
        };
    }
    async generateTags(document, extractedData) {
        const tags = [];
        tags.push(...this.extractKeywordTags(document));
        if (extractedData) {
            tags.push(...this.extractDataTags(extractedData));
        }
        tags.push(...this.extractMetadataTags(document));
        if (this.taggingEngine) {
            try {
                const nlpTags = await this.generateNLPTags(document);
                tags.push(...nlpTags);
            }
            catch (error) {
                this.logger.warn('NLP tag generation failed', { error: error.message });
            }
        }
        const uniqueTags = this.deduplicateTags(tags);
        const sortedTags = uniqueTags.sort((a, b) => b.relevance - a.relevance).slice(0, 20);
        return {
            tags: sortedTags,
            confidence: sortedTags.length > 0 ? sortedTags.reduce((sum, tag) => sum + tag.confidence, 0) / sortedTags.length : 0,
            method: this.taggingEngine ? 'NLP_ANALYSIS' : 'KEYWORD_EXTRACTION'
        };
    }
    extractKeywordTags(document) {
        const tags = [];
        const text = `${document.title || ''} ${document.description || ''}`.toLowerCase();
        const financialKeywords = [
            'portfolio', 'investment', 'asset', 'equity', 'bond', 'fund', 'stock',
            'dividend', 'interest', 'yield', 'return', 'risk', 'volatility',
            'trade', 'transaction', 'buy', 'sell', 'price', 'value', 'market'
        ];
        for (const keyword of financialKeywords) {
            if (text.includes(keyword)) {
                tags.push({
                    tag: keyword,
                    confidence: 0.8,
                    source: 'CONTENT',
                    relevance: text.split(keyword).length - 1
                });
            }
        }
        if (document.documentType) {
            tags.push({
                tag: document.documentType.toLowerCase().replace('_', '-'),
                confidence: 0.9,
                source: 'METADATA',
                relevance: 1
            });
        }
        return tags;
    }
    extractDataTags(extractedData) {
        const tags = [];
        for (const field of extractedData.fields) {
            if (field.fieldName && field.value) {
                tags.push({
                    tag: field.fieldName.toLowerCase().replace('_', '-'),
                    confidence: field.confidence,
                    source: 'EXTRACTED_DATA',
                    relevance: field.confidence
                });
                if (field.fieldName.toLowerCase().includes('amount') && typeof field.value === 'number') {
                    if (field.value > 100000) {
                        tags.push({
                            tag: 'high-value',
                            confidence: 0.9,
                            source: 'EXTRACTED_DATA',
                            relevance: 0.9
                        });
                    }
                }
                if (field.fieldName.toLowerCase().includes('date')) {
                    const currentYear = new Date().getFullYear().toString();
                    if (String(field.value).includes(currentYear)) {
                        tags.push({
                            tag: 'current-year',
                            confidence: 0.8,
                            source: 'EXTRACTED_DATA',
                            relevance: 0.7
                        });
                    }
                }
            }
        }
        return tags;
    }
    extractMetadataTags(document) {
        const tags = [];
        if (document.portfolioId) {
            tags.push({
                tag: `portfolio-${document.portfolioId}`,
                confidence: 1.0,
                source: 'METADATA',
                relevance: 0.9
            });
        }
        if (document.clientId) {
            tags.push({
                tag: `client-${document.clientId}`,
                confidence: 1.0,
                source: 'METADATA',
                relevance: 0.9
            });
        }
        if (document.language) {
            tags.push({
                tag: `lang-${document.language}`,
                confidence: 1.0,
                source: 'METADATA',
                relevance: 0.6
            });
        }
        const uploadDate = new Date(document.uploadedAt);
        const monthYear = `${uploadDate.getFullYear()}-${(uploadDate.getMonth() + 1).toString().padStart(2, '0')}`;
        tags.push({
            tag: `uploaded-${monthYear}`,
            confidence: 1.0,
            source: 'METADATA',
            relevance: 0.5
        });
        return tags;
    }
    async generateNLPTags(document) {
        const tags = [];
        if (!this.taggingEngine)
            return tags;
        try {
            const text = `${document.title || ''} ${document.description || ''}`;
            const nlpResult = await this.taggingEngine.extractKeywords(text);
            for (const keyword of nlpResult.keywords) {
                tags.push({
                    tag: keyword.text.toLowerCase().replace(/\s+/g, '-'),
                    confidence: keyword.relevance,
                    source: 'CONTENT',
                    relevance: keyword.relevance
                });
            }
        }
        catch (error) {
            this.logger.warn('NLP tag generation failed', { error: error.message });
        }
        return tags;
    }
    deduplicateTags(tags) {
        const tagMap = new Map();
        for (const tag of tags) {
            const existing = tagMap.get(tag.tag);
            if (!existing || tag.confidence > existing.confidence) {
                tagMap.set(tag.tag, tag);
            }
        }
        return Array.from(tagMap.values());
    }
    async getApplicableRules(document, customRules) {
        const allRules = [
            ...Array.from(this.filingRules.values()),
            ...(customRules || [])
        ];
        return allRules
            .filter(rule => rule.isActive &&
            (rule.applicableDocumentTypes.length === 0 ||
                rule.applicableDocumentTypes.includes(document.documentType)))
            .sort((a, b) => b.priority - a.priority);
    }
    async evaluateRuleConditions(rule, document, extractedData) {
        const matchedConditions = [];
        for (const condition of rule.conditions) {
            if (await this.evaluateCondition(condition, document, extractedData)) {
                matchedConditions.push(condition);
            }
        }
        return matchedConditions;
    }
    async evaluateCondition(condition, document, extractedData) {
        const value = this.getFieldValue(condition.field, document, extractedData);
        if (value === null || value === undefined) {
            return condition.operator === 'EXISTS' ? false : condition.operator === 'EQUALS' && condition.value === null;
        }
        const stringValue = String(value);
        const conditionValue = String(condition.value);
        const compareValue = condition.caseSensitive ? stringValue : stringValue.toLowerCase();
        const targetValue = condition.caseSensitive ? conditionValue : conditionValue.toLowerCase();
        switch (condition.operator) {
            case 'EQUALS':
                return compareValue === targetValue;
            case 'CONTAINS':
                return compareValue.includes(targetValue);
            case 'STARTS_WITH':
                return compareValue.startsWith(targetValue);
            case 'ENDS_WITH':
                return compareValue.endsWith(targetValue);
            case 'REGEX':
                return new RegExp(condition.value, condition.caseSensitive ? 'g' : 'gi').test(stringValue);
            case 'GREATER_THAN':
                const numValue = parseFloat(stringValue);
                const numCondition = parseFloat(conditionValue);
                return !isNaN(numValue) && !isNaN(numCondition) && numValue > numCondition;
            case 'LESS_THAN':
                const numValue2 = parseFloat(stringValue);
                const numCondition2 = parseFloat(conditionValue);
                return !isNaN(numValue2) && !isNaN(numCondition2) && numValue2 < numCondition2;
            case 'EXISTS':
                return true;
            default:
                return false;
        }
    }
    getFieldValue(fieldPath, document, extractedData) {
        if (fieldPath.startsWith('document.')) {
            const field = fieldPath.substring(9);
            return document[field];
        }
        if (fieldPath.startsWith('metadata.')) {
            const field = fieldPath.substring(9);
            return document.metadata[field];
        }
        if (fieldPath.startsWith('extracted.') && extractedData) {
            const field = fieldPath.substring(10);
            const extractedField = extractedData.fields.find(f => f.fieldName === field);
            return extractedField?.value;
        }
        return null;
    }
    async executeRuleActions(rule, document, metadata) {
        const executedActions = [];
        for (const action of rule.actions) {
            try {
                await this.executeAction(action, document, metadata);
                executedActions.push(action);
            }
            catch (error) {
                this.logger.warn('Action execution failed', {
                    ruleId: rule.id,
                    actionType: action.type,
                    error: error.message
                });
            }
        }
        return executedActions;
    }
    async executeAction(action, document, metadata) {
        switch (action.type) {
            case 'ADD_TAG':
                if (!document.tags.includes(action.parameters.tag)) {
                    document.tags.push(action.parameters.tag);
                }
                break;
            case 'SET_CLASSIFICATION':
                // This will be handled in the calling function
                break;
            case 'UPDATE_METADATA':
                Object.assign(metadata, action.parameters.metadata || {});
                break;
            case 'SEND_NOTIFICATION':
                await this.sendNotification(action.parameters, document);
                break;
            case 'TRIGGER_WORKFLOW':
                await this.triggerWorkflow(action.parameters, document);
                break;
            default:
                this.logger.warn('Unknown action type', { actionType: action.type });
        }
    }
    async generateFilingPath(document, classification, appliedRules, targetDirectory) {
        const basePath = targetDirectory || '/documents';
        const docType = classification?.documentType || document.documentType;
        const template = this.directoryTemplates.get(docType);
        if (template) {
            return template.generatePath(document, classification);
        }
        const year = new Date(document.uploadedAt).getFullYear();
        const month = new Date(document.uploadedAt).getMonth() + 1;
        let path = `${basePath}/${docType.toLowerCase()}/${year}/${month.toString().padStart(2, '0')}`;
        if (document.clientId) {
            path += `/client_${document.clientId}`;
        }
        if (document.portfolioId) {
            path += `/portfolio_${document.portfolioId}`;
        }
        return `${path}/${document.fileName}`;
    }
    async createDirectoryStructure(filePath, document) {
        const pathParts = filePath.split('/').filter(part => part.length > 0);
        const structure = [];
        let currentPath = '';
        for (let i = 0; i < pathParts.length - 1; i++) {
            const part = pathParts[i];
            currentPath += `/${part}`;
            structure.push({
                name: part,
                path: currentPath,
                type: 'FOLDER',
                metadata: {
                    created: new Date(),
                    documentCount: 1
                }
            });
        }
        structure.push({
            name: document.fileName,
            path: filePath,
            type: 'FILE',
            metadata: {
                size: document.fileSize,
                mimeType: document.mimeType,
                documentId: document.id
            }
        });
        return structure;
    }
    async moveDocumentToPath(document, targetPath) {
        if (this.fileSystemManager) {
            await this.fileSystemManager.moveFile(document.filePath, targetPath);
        }
        else {
            this.logger.info('File system manager not available, skipping physical file move', {
                documentId: document.id,
                targetPath
            });
        }
    }
    async updateDocumentRecord(documentId, updates) {
        this.logger.info('Updating document record', { documentId, updates });
    }
    determineFilingMethod(appliedRules, classification) {
        if (appliedRules.length > 0 && classification) {
            return 'HYBRID';
        }
        else if (appliedRules.length > 0) {
            return 'RULE_BASED';
        }
        else if (classification) {
            return 'ML_BASED';
        }
        else {
            return 'TEMPLATE_BASED';
        }
    }
    calculateConfidenceScore(appliedRules, classification, tagging) {
        let totalScore = 0;
        let components = 0;
        if (appliedRules.length > 0) {
            totalScore += 0.8;
            components++;
        }
        if (classification) {
            totalScore += classification.confidence;
            components++;
        }
        if (tagging) {
            totalScore += tagging.confidence;
            components++;
        }
        return components > 0 ? totalScore / components : 0.5;
    }
    inferDocumentClassification(documentType) {
        const classificationMap = {
            [DocumentManagement_1.DocumentType.TRADE_CONFIRMATION]: DocumentManagement_1.DocumentClassification.CONFIDENTIAL,
            [DocumentManagement_1.DocumentType.STATEMENT]: DocumentManagement_1.DocumentClassification.CONFIDENTIAL,
            [DocumentManagement_1.DocumentType.PROSPECTUS]: DocumentManagement_1.DocumentClassification.PUBLIC,
            [DocumentManagement_1.DocumentType.TAX_DOCUMENT]: DocumentManagement_1.DocumentClassification.HIGHLY_CONFIDENTIAL,
            [DocumentManagement_1.DocumentType.CONTRACT]: DocumentManagement_1.DocumentClassification.CONFIDENTIAL,
            [DocumentManagement_1.DocumentType.LEGAL_OPINION]: DocumentManagement_1.DocumentClassification.CONFIDENTIAL,
            [DocumentManagement_1.DocumentType.COMPLIANCE_CERTIFICATE]: DocumentManagement_1.DocumentClassification.INTERNAL,
            [DocumentManagement_1.DocumentType.AUDIT_REPORT]: DocumentManagement_1.DocumentClassification.CONFIDENTIAL,
            [DocumentManagement_1.DocumentType.REGULATORY_FILING]: DocumentManagement_1.DocumentClassification.PUBLIC,
            [DocumentManagement_1.DocumentType.CLIENT_COMMUNICATION]: DocumentManagement_1.DocumentClassification.CONFIDENTIAL,
            [DocumentManagement_1.DocumentType.PERFORMANCE_REPORT]: DocumentManagement_1.DocumentClassification.CONFIDENTIAL,
            [DocumentManagement_1.DocumentType.RISK_REPORT]: DocumentManagement_1.DocumentClassification.CONFIDENTIAL,
            [DocumentManagement_1.DocumentType.KYC_DOCUMENT]: DocumentManagement_1.DocumentClassification.HIGHLY_CONFIDENTIAL,
            [DocumentManagement_1.DocumentType.AML_DOCUMENT]: DocumentManagement_1.DocumentClassification.HIGHLY_CONFIDENTIAL,
            [DocumentManagement_1.DocumentType.OTHER]: DocumentManagement_1.DocumentClassification.INTERNAL
        };
        return classificationMap[documentType] || DocumentManagement_1.DocumentClassification.INTERNAL;
    }
    extractClassificationFeatures(document, extractedData) {
        const features = [];
        features.push(document.fileName.length);
        features.push(document.fileSize);
        features.push(document.pageCount || 1);
        features.push(document.tags.length);
        const hasAmount = extractedData?.fields.some(f => f.fieldName.toLowerCase().includes('amount')) ? 1 : 0;
        features.push(hasAmount);
        const hasDate = extractedData?.fields.some(f => f.fieldName.toLowerCase().includes('date')) ? 1 : 0;
        features.push(hasDate);
        while (features.length < 20) {
            features.push(0);
        }
        return features.slice(0, 20);
    }
    async sendNotification(parameters, document) {
        this.logger.info('Sending notification', {
            documentId: document.id,
            parameters
        });
    }
    async triggerWorkflow(parameters, document) {
        this.logger.info('Triggering workflow', {
            documentId: document.id,
            parameters
        });
    }
    async initializeFilingService() {
        try {
            await this.loadDefaultFilingRules();
            await this.loadDirectoryTemplates();
            await this.initializeEngines();
            this.logger.info('Document filing service initialized', {
                rules: this.filingRules.size,
                templates: this.directoryTemplates.size
            });
        }
        catch (error) {
            this.logger.error('Failed to initialize filing service', { error: error.message });
        }
    }
    async loadDefaultFilingRules() {
        const defaultRules = [
            {
                id: 'high_value_trades',
                name: 'High Value Trade Documents',
                description: 'File high value trade confirmations in special directory',
                conditions: [
                    {
                        field: 'document.documentType',
                        operator: 'EQUALS',
                        value: DocumentManagement_1.DocumentType.TRADE_CONFIRMATION,
                        caseSensitive: false
                    },
                    {
                        field: 'extracted.amount',
                        operator: 'GREATER_THAN',
                        value: 100000,
                        caseSensitive: false
                    }
                ],
                actions: [
                    {
                        type: 'ADD_TAG',
                        parameters: { tag: 'high-value' }
                    },
                    {
                        type: 'SET_CLASSIFICATION',
                        parameters: { classification: DocumentManagement_1.DocumentClassification.HIGHLY_CONFIDENTIAL }
                    }
                ],
                priority: 100,
                isActive: true,
                applicableDocumentTypes: [DocumentManagement_1.DocumentType.TRADE_CONFIRMATION]
            },
            {
                id: 'current_year_statements',
                name: 'Current Year Statements',
                description: 'Tag current year statements for easy access',
                conditions: [
                    {
                        field: 'document.documentType',
                        operator: 'EQUALS',
                        value: DocumentManagement_1.DocumentType.STATEMENT,
                        caseSensitive: false
                    },
                    {
                        field: 'document.uploadedAt',
                        operator: 'CONTAINS',
                        value: new Date().getFullYear().toString(),
                        caseSensitive: false
                    }
                ],
                actions: [
                    {
                        type: 'ADD_TAG',
                        parameters: { tag: 'current-year' }
                    }
                ],
                priority: 50,
                isActive: true,
                applicableDocumentTypes: [DocumentManagement_1.DocumentType.STATEMENT]
            }
        ];
        for (const rule of defaultRules) {
            this.filingRules.set(rule.id, rule);
        }
        this.logger.info('Default filing rules loaded', { count: defaultRules.length });
    }
    async loadDirectoryTemplates() {
        const templates = [
            new TradeConfirmationDirectoryTemplate(),
            new StatementDirectoryTemplate(),
            new ProspectusDirectoryTemplate()
        ];
        for (const template of templates) {
            this.directoryTemplates.set(template.documentType, template);
        }
        this.logger.info('Directory templates loaded', { count: templates.length });
    }
    async initializeEngines() {
        try {
            this.classificationEngine = {
                classify: async (features) => ({
                    documentType: DocumentManagement_1.DocumentType.STATEMENT,
                    confidence: 0.85,
                    reasoning: ['Feature-based classification'],
                    alternatives: []
                })
            };
            this.taggingEngine = {
                extractKeywords: async (text) => ({
                    keywords: [
                        { text: 'investment', relevance: 0.9 },
                        { text: 'portfolio', relevance: 0.8 },
                        { text: 'financial', relevance: 0.7 }
                    ]
                })
            };
        }
        catch (error) {
            this.logger.warn('Failed to initialize classification/tagging engines', { error: error.message });
        }
    }
    async publishFilingEvent(documentId, tenantId, result) {
        const event = {
            eventType: 'DOCUMENT_FILING_COMPLETED',
            documentId,
            tenantId,
            filingPath: result.filingPath,
            rulesApplied: result.appliedRules.length,
            status: result.filingStatus,
            timestamp: new Date().toISOString()
        };
        await this.kafkaService.publishEvent('document-processing', event);
    }
}
exports.DocumentFilingService = DocumentFilingService;
class TradeConfirmationDirectoryTemplate {
    documentType = DocumentManagement_1.DocumentType.TRADE_CONFIRMATION;
    generatePath(document, classification) {
        const year = new Date(document.uploadedAt).getFullYear();
        const month = new Date(document.uploadedAt).getMonth() + 1;
        let path = `/documents/trades/${year}/${month.toString().padStart(2, '0')}`;
        if (document.portfolioId) {
            path += `/portfolio_${document.portfolioId}`;
        }
        return `${path}/${document.fileName}`;
    }
}
class StatementDirectoryTemplate {
    documentType = DocumentManagement_1.DocumentType.STATEMENT;
    generatePath(document, classification) {
        const year = new Date(document.uploadedAt).getFullYear();
        const quarter = Math.ceil((new Date(document.uploadedAt).getMonth() + 1) / 3);
        let path = `/documents/statements/${year}/Q${quarter}`;
        if (document.clientId) {
            path += `/client_${document.clientId}`;
        }
        return `${path}/${document.fileName}`;
    }
}
class ProspectusDirectoryTemplate {
    documentType = DocumentManagement_1.DocumentType.PROSPECTUS;
    generatePath(document, classification) {
        const year = new Date(document.uploadedAt).getFullYear();
        return `/documents/prospectuses/${year}/${document.fileName}`;
    }
}
