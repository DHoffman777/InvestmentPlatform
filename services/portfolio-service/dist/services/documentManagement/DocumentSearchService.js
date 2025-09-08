"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentSearchService = void 0;
// Kafka service will be imported when available
// import { KafkaService } from '../infrastructure/KafkaService';
const DocumentManagement_1 = require("../../models/documentManagement/DocumentManagement");
class DocumentSearchService {
    prisma;
    logger;
    kafkaService; // KafkaService - type will be restored when module is available
    searchEngine;
    vectorDatabase;
    queryAnalyzer;
    semanticSearchEngine;
    indexManager;
    cacheManager;
    constructor(prisma, logger, kafkaService // KafkaService - type will be restored when module is available
    ) {
        this.prisma = prisma;
        this.logger = logger;
        this.kafkaService = kafkaService;
        this.queryAnalyzer = new QueryAnalyzer();
        this.semanticSearchEngine = new SemanticSearchEngine();
        this.indexManager = new SearchIndexManager();
        this.cacheManager = new SearchCacheManager();
        this.initializeSearchService();
    }
    async searchDocuments(request) {
        try {
            this.logger.info('Starting document search', {
                query: request.query,
                tenantId: request.tenantId,
                filters: Object.keys(request).filter(key => request[key])
            });
            const startTime = Date.now();
            const cacheKey = this.generateCacheKey(request);
            const cachedResult = await this.cacheManager.get(cacheKey);
            if (cachedResult) {
                this.logger.info('Returning cached search result', { cacheKey });
                return cachedResult;
            }
            const queryAnalysis = await this.queryAnalyzer.analyze(request.query || '');
            const enhancedQuery = await this.buildEnhancedQuery(request, queryAnalysis);
            const searchResults = await this.executeSearch(enhancedQuery, request);
            const facets = await this.calculateFacets(enhancedQuery, request);
            const recommendations = await this.generateRecommendations(queryAnalysis, searchResults);
            const autoCorrections = await this.generateAutoCorrections(request.query || '');
            const searchPerformance = {
                totalTime: Date.now() - startTime,
                queryTime: 0,
                fetchTime: 0,
                indexTime: 0,
                cacheHit: false,
                shardStatistics: {
                    total: 1,
                    successful: 1,
                    skipped: 0,
                    failed: 0,
                    averageTime: Date.now() - startTime
                },
                optimizations: []
            };
            const enhancedResult = {
                documents: searchResults.documents,
                totalCount: searchResults.totalCount,
                page: request.page,
                limit: request.limit,
                totalPages: Math.ceil(searchResults.totalCount / request.limit),
                facets,
                suggestions: [],
                searchTime: Date.now() - startTime,
                queryAnalysis,
                searchPerformance,
                recommendations,
                relatedQueries: await this.generateRelatedQueries(queryAnalysis),
                autoCorrections
            };
            await this.cacheManager.set(cacheKey, enhancedResult, 300);
            await this.publishSearchEvent(request, enhancedResult);
            this.logger.info('Document search completed', {
                query: request.query,
                resultsFound: searchResults.totalCount,
                searchTime: enhancedResult.searchTime
            });
            return enhancedResult;
        }
        catch (error) {
            this.logger.error('Document search failed', {
                query: request.query,
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error.stack
            });
            throw error;
        }
    }
    async semanticSearch(query, tenantId) {
        try {
            this.logger.info('Starting semantic search', {
                text: query.text,
                tenantId,
                threshold: query.similarityThreshold
            });
            const embedding = query.embedding || await this.semanticSearchEngine.generateEmbedding(query.text);
            const similarDocuments = await this.vectorDatabase.findSimilar(embedding, query.similarityThreshold, query.maxResults);
            const results = [];
            for (const doc of similarDocuments) {
                const matchedSections = await this.findMatchedSections(doc, query.text);
                const explanation = this.generateSemanticExplanation(doc, query.text, matchedSections);
                results.push({
                    documentId: doc.documentId,
                    similarity: doc.similarity,
                    relevanceScore: doc.relevanceScore,
                    matchedSections,
                    explanation
                });
            }
            this.logger.info('Semantic search completed', {
                resultsFound: results.length,
                averageSimilarity: results.reduce((sum, r) => sum + r.similarity, 0) / results.length
            });
            return results;
        }
        catch (error) {
            this.logger.error('Semantic search failed', {
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error.stack
            });
            throw error;
        }
    }
    async indexDocument(document, extractedData) {
        try {
            this.logger.info('Indexing document', { documentId: document.id });
            const indexEntry = {
                documentId: document.id,
                content: await this.extractDocumentContent(document),
                title: document.title || document.fileName,
                extractedText: extractedData?.fields.map(f => f.value).join(' ') || '',
                metadata: {
                    ...document.metadata,
                    documentType: document.documentType,
                    classification: document.classification,
                    status: document.status,
                    language: document.language,
                    uploadedAt: document.uploadedAt,
                    fileSize: document.fileSize,
                    portfolioId: document.portfolioId,
                    clientId: document.clientId
                },
                tags: document.tags,
                vectors: await this.semanticSearchEngine.generateEmbedding(`${document.title || ''} ${extractedData?.fields.map(f => f.value).join(' ') || ''}`),
                lastIndexed: new Date(),
                indexVersion: '1.0'
            };
            await this.searchEngine.index(indexEntry);
            await this.vectorDatabase.store(indexEntry.documentId, indexEntry.vectors, indexEntry.metadata);
            this.logger.info('Document indexed successfully', { documentId: document.id });
        }
        catch (error) {
            this.logger.error('Document indexing failed', {
                documentId: document.id,
                error: error.message
            });
            throw error;
        }
    }
    async removeFromIndex(documentId) {
        try {
            this.logger.info('Removing document from index', { documentId });
            await this.searchEngine.delete(documentId);
            await this.vectorDatabase.delete(documentId);
            this.logger.info('Document removed from index', { documentId });
        }
        catch (error) {
            this.logger.error('Failed to remove document from index', {
                documentId,
                error: error.message
            });
            throw error;
        }
    }
    async rebuildIndex(tenantId) {
        try {
            this.logger.info('Starting index rebuild', { tenantId });
            const documents = await this.getAllDocuments(tenantId);
            await this.searchEngine.clear(tenantId);
            await this.vectorDatabase.clear(tenantId);
            for (const document of documents) {
                await this.indexDocument(document);
            }
            this.logger.info('Index rebuild completed', {
                tenantId,
                documentsIndexed: documents.length
            });
        }
        catch (error) {
            this.logger.error('Index rebuild failed', {
                tenantId,
                error: error.message
            });
            throw error;
        }
    }
    async buildEnhancedQuery(request, analysis) {
        const filters = [];
        if (request.tenantId) {
            filters.push({
                field: 'tenantId',
                operator: 'EQUALS',
                value: request.tenantId
            });
        }
        if (request.documentTypes && request.documentTypes.length > 0) {
            filters.push({
                field: 'documentType',
                operator: 'IN',
                value: request.documentTypes
            });
        }
        if (request.classifications && request.classifications.length > 0) {
            filters.push({
                field: 'classification',
                operator: 'IN',
                value: request.classifications
            });
        }
        if (request.statuses && request.statuses.length > 0) {
            filters.push({
                field: 'status',
                operator: 'IN',
                value: request.statuses
            });
        }
        if (request.portfolioIds && request.portfolioIds.length > 0) {
            filters.push({
                field: 'portfolioId',
                operator: 'IN',
                value: request.portfolioIds
            });
        }
        if (request.clientIds && request.clientIds.length > 0) {
            filters.push({
                field: 'clientId',
                operator: 'IN',
                value: request.clientIds
            });
        }
        if (request.tags && request.tags.length > 0) {
            filters.push({
                field: 'tags',
                operator: 'IN',
                value: request.tags
            });
        }
        if (request.dateRange) {
            filters.push({
                field: request.dateRange.field,
                operator: 'RANGE',
                value: {
                    gte: request.dateRange.startDate,
                    lte: request.dateRange.endDate
                }
            });
        }
        if (request.language) {
            filters.push({
                field: 'language',
                operator: 'EQUALS',
                value: request.language
            });
        }
        if (request.metadata) {
            for (const [key, value] of Object.entries(request.metadata)) {
                filters.push({
                    field: `metadata.${key}`,
                    operator: 'EQUALS',
                    value
                });
            }
        }
        if (request.extractedFields) {
            for (const [key, value] of Object.entries(request.extractedFields)) {
                filters.push({
                    field: `extractedFields.${key}`,
                    operator: 'EQUALS',
                    value
                });
            }
        }
        const sortOptions = [];
        if (request.sortBy) {
            if (request.sortBy === 'relevance') {
                sortOptions.push({ field: '_score', order: 'DESC' });
            }
            else {
                sortOptions.push({
                    field: request.sortBy,
                    order: request.sortOrder || 'DESC'
                });
            }
        }
        return {
            query: request.query || '*',
            filters,
            facets: ['documentType', 'classification', 'status', 'language', 'tags'],
            sortBy: sortOptions,
            aggregations: [],
            highlighting: {
                enabled: true,
                fields: ['title', 'content', 'extractedText'],
                fragmentSize: 100,
                maxFragments: 3,
                preTag: '<mark>',
                postTag: '</mark>'
            },
            pagination: {
                page: request.page,
                size: request.limit
            }
        };
    }
    async executeSearch(query, request) {
        const mockDocuments = [
            {
                id: 'doc_1',
                tenantId: request.tenantId,
                documentType: DocumentManagement_1.DocumentType.STATEMENT,
                classification: DocumentManagement_1.DocumentClassification.CONFIDENTIAL,
                status: DocumentManagement_1.DocumentStatus.PROCESSED,
                fileName: 'account_statement_q1_2024.pdf',
                originalFileName: 'account_statement_q1_2024.pdf',
                filePath: '/documents/statements/2024/Q1/account_statement_q1_2024.pdf',
                fileSize: 2048576,
                mimeType: 'application/pdf',
                checksum: 'abc123',
                language: DocumentManagement_1.Language.ENGLISH,
                pageCount: 5,
                title: 'Q1 2024 Account Statement',
                description: 'Quarterly account statement for Q1 2024',
                tags: ['quarterly', 'statement', '2024', 'Q1'],
                metadata: { quarter: 'Q1', year: 2024 },
                uploadedBy: 'user_1',
                uploadedAt: new Date('2024-01-01'),
                versions: [],
                ocrResults: [],
                extractedData: [],
                auditLog: [],
                relatedDocuments: [],
                childDocumentIds: [],
                createdAt: new Date('2024-01-01'),
                updatedAt: new Date('2024-01-01'),
                createdBy: 'user_1',
                updatedBy: 'user_1'
            }
        ];
        const filteredDocuments = this.applyFilters(mockDocuments, query.filters);
        return {
            documents: filteredDocuments.slice((query.pagination.page - 1) * query.pagination.size, query.pagination.page * query.pagination.size),
            totalCount: filteredDocuments.length,
            page: query.pagination.page,
            limit: query.pagination.size,
            totalPages: Math.ceil(filteredDocuments.length / query.pagination.size),
            facets: {},
            searchTime: 50
        };
    }
    applyFilters(documents, filters) {
        return documents.filter(doc => {
            return filters.every(filter => {
                const value = this.getDocumentFieldValue(doc, filter.field);
                switch (filter.operator) {
                    case 'EQUALS':
                        return value === filter.value;
                    case 'CONTAINS':
                        return String(value).toLowerCase().includes(String(filter.value).toLowerCase());
                    case 'IN':
                        return Array.isArray(filter.value) && filter.value.includes(value);
                    case 'EXISTS':
                        return value !== null && value !== undefined;
                    case 'NOT_EXISTS':
                        return value === null || value === undefined;
                    default:
                        return true;
                }
            });
        });
    }
    getDocumentFieldValue(document, field) {
        const parts = field.split('.');
        let value = document;
        for (const part of parts) {
            if (value && typeof value === 'object') {
                value = value[part];
            }
            else {
                return undefined;
            }
        }
        return value;
    }
    async calculateFacets(query, request) {
        return {
            documentTypes: [
                { value: DocumentManagement_1.DocumentType.STATEMENT, count: 25 },
                { value: DocumentManagement_1.DocumentType.TRADE_CONFIRMATION, count: 15 },
                { value: DocumentManagement_1.DocumentType.PROSPECTUS, count: 10 }
            ],
            classifications: [
                { value: DocumentManagement_1.DocumentClassification.CONFIDENTIAL, count: 30 },
                { value: DocumentManagement_1.DocumentClassification.INTERNAL, count: 15 },
                { value: DocumentManagement_1.DocumentClassification.PUBLIC, count: 5 }
            ],
            statuses: [
                { value: DocumentManagement_1.DocumentStatus.PROCESSED, count: 40 },
                { value: DocumentManagement_1.DocumentStatus.FILED, count: 8 },
                { value: DocumentManagement_1.DocumentStatus.ARCHIVED, count: 2 }
            ],
            languages: [
                { value: DocumentManagement_1.Language.ENGLISH, count: 45 },
                { value: DocumentManagement_1.Language.SPANISH, count: 3 },
                { value: DocumentManagement_1.Language.FRENCH, count: 2 }
            ],
            tags: [
                { value: 'quarterly', count: 20 },
                { value: 'annual', count: 15 },
                { value: 'monthly', count: 10 },
                { value: 'trade', count: 8 },
                { value: 'statement', count: 25 }
            ],
            portfolios: [
                { value: 'portfolio_1', count: 20 },
                { value: 'portfolio_2', count: 15 },
                { value: 'portfolio_3', count: 10 }
            ],
            clients: [
                { value: 'client_1', count: 25 },
                { value: 'client_2', count: 15 },
                { value: 'client_3', count: 10 }
            ]
        };
    }
    async generateRecommendations(analysis, results) {
        const recommendations = [];
        if (results.totalCount === 0) {
            recommendations.push({
                type: 'QUERY_EXPANSION',
                suggestion: 'Try using broader search terms or remove some filters',
                confidence: 0.8,
                explanation: 'No results found with current query'
            });
        }
        if (analysis.detectedLanguage !== DocumentManagement_1.Language.ENGLISH) {
            recommendations.push({
                type: 'FILTER_SUGGESTION',
                suggestion: `Add language filter: ${analysis.detectedLanguage}`,
                confidence: 0.9,
                explanation: 'Query appears to be in a non-English language'
            });
        }
        if (analysis.intentAnalysis.entities.length > 0) {
            const dateEntities = analysis.intentAnalysis.entities.filter(e => e.type === 'DATE');
            if (dateEntities.length > 0) {
                recommendations.push({
                    type: 'FILTER_SUGGESTION',
                    suggestion: 'Add date range filter based on detected dates',
                    confidence: 0.7,
                    explanation: 'Date entities detected in query'
                });
            }
        }
        return recommendations;
    }
    async generateRelatedQueries(analysis) {
        const relatedQueries = [];
        if (analysis.parsedQuery.terms.length > 0) {
            const primaryTerm = analysis.parsedQuery.terms[0].term;
            relatedQueries.push(`${primaryTerm} quarterly`, `${primaryTerm} annual`, `${primaryTerm} monthly`, `recent ${primaryTerm}`, `${primaryTerm} analysis`);
        }
        if (analysis.intentAnalysis.primaryIntent === 'FIND_DOCUMENT') {
            relatedQueries.push('recent documents', 'pending documents', 'archived documents');
        }
        return relatedQueries.slice(0, 5);
    }
    async generateAutoCorrections(query) {
        const corrections = [];
        const spellChecks = [
            { original: 'statment', corrected: 'statement', confidence: 0.9 },
            { original: 'protfolio', corrected: 'portfolio', confidence: 0.9 },
            { original: 'invesment', corrected: 'investment', confidence: 0.9 }
        ];
        for (const check of spellChecks) {
            if (query.toLowerCase().includes(check.original)) {
                corrections.push({
                    original: check.original,
                    corrected: check.corrected,
                    confidence: check.confidence,
                    type: 'SPELLING'
                });
            }
        }
        return corrections;
    }
    async findMatchedSections(document, queryText) {
        const sections = [];
        const content = document.content || '';
        const queryTerms = queryText.toLowerCase().split(' ');
        for (const term of queryTerms) {
            const index = content.toLowerCase().indexOf(term);
            if (index !== -1) {
                const start = Math.max(0, index - 50);
                const end = Math.min(content.length, index + term.length + 50);
                sections.push({
                    text: content.substring(index, index + term.length),
                    startOffset: index,
                    endOffset: index + term.length,
                    similarity: 0.85,
                    context: content.substring(start, end)
                });
            }
        }
        return sections;
    }
    generateSemanticExplanation(document, queryText, sections) {
        return `Document matches query "${queryText}" with ${sections.length} relevant sections found. Average similarity: ${sections.reduce((sum, s) => sum + s.similarity, 0) / sections.length}.`;
    }
    async extractDocumentContent(document) {
        return `${document.title || ''} ${document.description || ''} ${document.tags.join(' ')}`;
    }
    generateCacheKey(request) {
        return `search_${request.tenantId}_${JSON.stringify(request)}`;
    }
    async getAllDocuments(tenantId) {
        return [];
    }
    async initializeSearchService() {
        try {
            this.searchEngine = {
                index: async (entry) => {
                    console.log(`Indexing document: ${entry.documentId}`);
                },
                delete: async (documentId) => {
                    console.log(`Deleting document from index: ${documentId}`);
                },
                clear: async (tenantId) => {
                    console.log(`Clearing index for tenant: ${tenantId}`);
                }
            };
            this.vectorDatabase = {
                store: async (id, vectors, metadata) => {
                    console.log(`Storing vectors for document: ${id}`);
                },
                findSimilar: async (embedding, threshold, limit) => {
                    return [];
                },
                delete: async (documentId) => {
                    console.log(`Deleting vectors for document: ${documentId}`);
                },
                clear: async (tenantId) => {
                    console.log(`Clearing vectors for tenant: ${tenantId}`);
                }
            };
            this.logger.info('Document search service initialized');
        }
        catch (error) {
            this.logger.error('Failed to initialize search service', { error: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async publishSearchEvent(request, result) {
        const event = {
            eventType: 'DOCUMENT_SEARCH_PERFORMED',
            tenantId: request.tenantId,
            query: request.query,
            resultsFound: result.totalCount,
            searchTime: result.searchTime,
            timestamp: new Date().toISOString()
        };
        await this.kafkaService.publishEvent('document-processing', event);
    }
}
exports.DocumentSearchService = DocumentSearchService;
class QueryAnalyzer {
    async analyze(query) {
        const parsedQuery = this.parseQuery(query);
        const queryType = this.detectQueryType(query);
        const detectedLanguage = this.detectLanguage(query);
        const intentAnalysis = this.analyzeIntent(query, parsedQuery);
        return {
            originalQuery: query,
            parsedQuery,
            queryType,
            confidence: 0.85,
            detectedLanguage,
            intentAnalysis
        };
    }
    parseQuery(query) {
        const terms = query.split(' ').map(term => ({
            term: term.toLowerCase(),
            boost: 1.0,
            type: 'EXACT'
        }));
        return {
            terms,
            phrases: [],
            filters: [],
            operators: [],
            modifiers: []
        };
    }
    detectQueryType(query) {
        if (query.includes('"'))
            return 'PHRASE';
        if (query.includes('AND') || query.includes('OR') || query.includes('NOT'))
            return 'BOOLEAN';
        if (query.includes('*') || query.includes('?'))
            return 'WILDCARD';
        if (query.includes('~'))
            return 'FUZZY';
        return 'SIMPLE';
    }
    detectLanguage(query) {
        return DocumentManagement_1.Language.ENGLISH;
    }
    analyzeIntent(query, parsedQuery) {
        return {
            primaryIntent: 'FIND_DOCUMENT',
            confidence: 0.8,
            entities: [],
            timeframe: { confidence: 0.5 },
            scope: { confidence: 0.5 }
        };
    }
}
class SemanticSearchEngine {
    async generateEmbedding(text) {
        return Array.from({ length: 384 }, () => Math.random());
    }
}
class SearchIndexManager {
    async optimizeIndex(tenantId) {
        console.log(`Optimizing search index for tenant: ${tenantId}`);
    }
    async getIndexStats(tenantId) {
        return {
            documentCount: 1000,
            indexSize: '100MB',
            lastOptimized: new Date()
        };
    }
}
class SearchCacheManager {
    cache = new Map();
    async get(key) {
        return this.cache.get(key);
    }
    async set(key, value, ttl) {
        this.cache.set(key, value);
        setTimeout(() => this.cache.delete(key), ttl * 1000);
    }
    async clear() {
        this.cache.clear();
    }
}
