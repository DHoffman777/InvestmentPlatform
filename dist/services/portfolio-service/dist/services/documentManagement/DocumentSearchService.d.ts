export const __esModule: boolean;
export class DocumentSearchService {
    constructor(prisma: any, logger: any, kafkaService: any);
    prisma: any;
    logger: any;
    kafkaService: any;
    searchEngine: any;
    vectorDatabase: any;
    queryAnalyzer: QueryAnalyzer;
    semanticSearch: SemanticSearchEngine;
    indexManager: SearchIndexManager;
    cacheManager: SearchCacheManager;
    searchDocuments(request: any): Promise<any>;
    indexDocument(document: any, extractedData: any): Promise<void>;
    removeFromIndex(documentId: any): Promise<void>;
    rebuildIndex(tenantId: any): Promise<void>;
    buildEnhancedQuery(request: any, analysis: any): Promise<{
        query: any;
        filters: ({
            field: string;
            operator: string;
            value: any;
        } | {
            field: any;
            operator: string;
            value: {
                gte: any;
                lte: any;
            };
        })[];
        facets: string[];
        sortBy: {
            field: any;
            order: any;
        }[];
        aggregations: any[];
        highlighting: {
            enabled: boolean;
            fields: string[];
            fragmentSize: number;
            maxFragments: number;
            preTag: string;
            postTag: string;
        };
        pagination: {
            page: any;
            size: any;
        };
    }>;
    executeSearch(query: any, request: any): Promise<{
        documents: any;
        totalCount: any;
        page: any;
        limit: any;
        totalPages: number;
        facets: {};
        searchTime: number;
    }>;
    applyFilters(documents: any, filters: any): any;
    getDocumentFieldValue(document: any, field: any): any;
    calculateFacets(query: any, request: any): Promise<{
        documentTypes: {
            value: DocumentManagement_1.DocumentType;
            count: number;
        }[];
        classifications: {
            value: DocumentManagement_1.DocumentClassification;
            count: number;
        }[];
        statuses: {
            value: DocumentManagement_1.DocumentStatus;
            count: number;
        }[];
        languages: {
            value: DocumentManagement_1.Language;
            count: number;
        }[];
        tags: {
            value: string;
            count: number;
        }[];
        portfolios: {
            value: string;
            count: number;
        }[];
        clients: {
            value: string;
            count: number;
        }[];
    }>;
    generateRecommendations(analysis: any, results: any): Promise<{
        type: string;
        suggestion: string;
        confidence: number;
        explanation: string;
    }[]>;
    generateRelatedQueries(analysis: any): Promise<string[]>;
    generateAutoCorrections(query: any): Promise<{
        original: string;
        corrected: string;
        confidence: number;
        type: string;
    }[]>;
    findMatchedSections(document: any, queryText: any): Promise<{
        text: any;
        startOffset: any;
        endOffset: any;
        similarity: number;
        context: any;
    }[]>;
    generateSemanticExplanation(document: any, queryText: any, sections: any): string;
    extractDocumentContent(document: any): Promise<string>;
    generateCacheKey(request: any): string;
    getAllDocuments(tenantId: any): Promise<any[]>;
    initializeSearchService(): Promise<void>;
    publishSearchEvent(request: any, result: any): Promise<void>;
}
declare class QueryAnalyzer {
    analyze(query: any): Promise<{
        originalQuery: any;
        parsedQuery: {
            terms: any;
            phrases: any[];
            filters: any[];
            operators: any[];
            modifiers: any[];
        };
        queryType: string;
        confidence: number;
        detectedLanguage: DocumentManagement_1.Language;
        intentAnalysis: {
            primaryIntent: string;
            confidence: number;
            entities: any[];
            timeframe: {
                confidence: number;
            };
            scope: {
                confidence: number;
            };
        };
    }>;
    parseQuery(query: any): {
        terms: any;
        phrases: any[];
        filters: any[];
        operators: any[];
        modifiers: any[];
    };
    detectQueryType(query: any): "FUZZY" | "BOOLEAN" | "SIMPLE" | "PHRASE" | "WILDCARD";
    detectLanguage(query: any): DocumentManagement_1.Language;
    analyzeIntent(query: any, parsedQuery: any): {
        primaryIntent: string;
        confidence: number;
        entities: any[];
        timeframe: {
            confidence: number;
        };
        scope: {
            confidence: number;
        };
    };
}
declare class SemanticSearchEngine {
    generateEmbedding(text: any): Promise<number[]>;
}
declare class SearchIndexManager {
    optimizeIndex(tenantId: any): Promise<void>;
    getIndexStats(tenantId: any): Promise<{
        documentCount: number;
        indexSize: string;
        lastOptimized: Date;
    }>;
}
declare class SearchCacheManager {
    cache: Map<any, any>;
    get(key: any): Promise<any>;
    set(key: any, value: any, ttl: any): Promise<void>;
    clear(): Promise<void>;
}
import DocumentManagement_1 = require("../../models/documentManagement/DocumentManagement");
export {};
