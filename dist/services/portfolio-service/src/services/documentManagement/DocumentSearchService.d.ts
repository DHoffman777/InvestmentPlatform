import { Logger } from 'winston';
import { PrismaClient } from '@prisma/client';
import { Document, DocumentSearchRequest, DocumentSearchResult, DocumentType, Language, ExtractedData } from '../../models/documentManagement/DocumentManagement';
export interface SearchQuery {
    query: string;
    filters: SearchFilter[];
    facets: string[];
    sortBy: SortOption[];
    aggregations: AggregationRequest[];
    highlighting: HighlightingOptions;
    pagination: PaginationOptions;
}
export interface SearchFilter {
    field: string;
    operator: 'EQUALS' | 'CONTAINS' | 'STARTS_WITH' | 'RANGE' | 'IN' | 'EXISTS' | 'NOT_EXISTS';
    value: any;
    boost?: number;
}
export interface SortOption {
    field: string;
    order: 'ASC' | 'DESC';
    boost?: number;
}
export interface AggregationRequest {
    name: string;
    type: 'TERMS' | 'DATE_HISTOGRAM' | 'RANGE' | 'STATS' | 'CARDINALITY';
    field: string;
    size?: number;
    parameters?: Record<string, any>;
}
export interface HighlightingOptions {
    enabled: boolean;
    fields: string[];
    fragmentSize: number;
    maxFragments: number;
    preTag: string;
    postTag: string;
}
export interface PaginationOptions {
    page: number;
    size: number;
    scrollId?: string;
    searchAfter?: any[];
}
export interface EnhancedSearchResult extends DocumentSearchResult {
    queryAnalysis: QueryAnalysis;
    searchPerformance: SearchPerformance;
    recommendations: SearchRecommendation[];
    relatedQueries: string[];
    autoCorrections: AutoCorrection[];
}
export interface QueryAnalysis {
    originalQuery: string;
    parsedQuery: ParsedQuery;
    queryType: 'SIMPLE' | 'PHRASE' | 'BOOLEAN' | 'WILDCARD' | 'FUZZY' | 'SEMANTIC';
    confidence: number;
    detectedLanguage: Language;
    intentAnalysis: QueryIntent;
}
export interface ParsedQuery {
    terms: QueryTerm[];
    phrases: string[];
    filters: QueryFilter[];
    operators: QueryOperator[];
    modifiers: QueryModifier[];
}
export interface QueryTerm {
    term: string;
    field?: string;
    boost: number;
    type: 'EXACT' | 'FUZZY' | 'WILDCARD' | 'REGEX';
    stemmed?: string;
    synonyms?: string[];
}
export interface QueryFilter {
    field: string;
    value: any;
    operator: string;
    implicit: boolean;
}
export interface QueryOperator {
    type: 'AND' | 'OR' | 'NOT';
    position: number;
}
export interface QueryModifier {
    type: 'BOOST' | 'PROXIMITY' | 'SLOP' | 'MINIMUM_SHOULD_MATCH';
    value: any;
    field?: string;
}
export interface QueryIntent {
    primaryIntent: 'FIND_DOCUMENT' | 'ANALYZE_CONTENT' | 'COMPARE_VERSIONS' | 'AUDIT_TRAIL' | 'COMPLIANCE_CHECK';
    confidence: number;
    entities: DetectedEntity[];
    timeframe: TimeframeIntent;
    scope: ScopeIntent;
}
export interface DetectedEntity {
    entity: string;
    type: 'PERSON' | 'ORGANIZATION' | 'AMOUNT' | 'DATE' | 'DOCUMENT_TYPE' | 'PORTFOLIO' | 'CLIENT';
    confidence: number;
    normalized: string;
}
export interface TimeframeIntent {
    startDate?: Date;
    endDate?: Date;
    period?: 'TODAY' | 'WEEK' | 'MONTH' | 'QUARTER' | 'YEAR' | 'CUSTOM';
    confidence: number;
}
export interface ScopeIntent {
    portfolios?: string[];
    clients?: string[];
    documentTypes?: DocumentType[];
    confidence: number;
}
export interface SearchPerformance {
    totalTime: number;
    queryTime: number;
    fetchTime: number;
    indexTime: number;
    cacheHit: boolean;
    shardStatistics: ShardStatistics;
    optimizations: string[];
}
export interface ShardStatistics {
    total: number;
    successful: number;
    skipped: number;
    failed: number;
    averageTime: number;
}
export interface SearchRecommendation {
    type: 'QUERY_EXPANSION' | 'FILTER_SUGGESTION' | 'SORT_OPTIMIZATION' | 'RELATED_CONTENT';
    suggestion: string;
    confidence: number;
    explanation: string;
    metadata?: Record<string, any>;
}
export interface AutoCorrection {
    original: string;
    corrected: string;
    confidence: number;
    type: 'SPELLING' | 'GRAMMAR' | 'TERMINOLOGY';
}
export interface SearchIndexEntry {
    documentId: string;
    content: string;
    title: string;
    extractedText: string;
    metadata: Record<string, any>;
    tags: string[];
    vectors: number[];
    lastIndexed: Date;
    indexVersion: string;
}
export interface SemanticSearchQuery {
    text: string;
    embedding?: number[];
    similarityThreshold: number;
    maxResults: number;
    includeMetadata: boolean;
}
export interface SemanticSearchResult {
    documentId: string;
    similarity: number;
    relevanceScore: number;
    matchedSections: MatchedSection[];
    explanation: string;
}
export interface MatchedSection {
    text: string;
    startOffset: number;
    endOffset: number;
    similarity: number;
    context: string;
}
export declare class DocumentSearchService {
    private prisma;
    private logger;
    private kafkaService;
    private searchEngine;
    private vectorDatabase;
    private queryAnalyzer;
    private semanticSearchEngine;
    private indexManager;
    private cacheManager;
    constructor(prisma: PrismaClient, logger: Logger, kafkaService: any);
    searchDocuments(request: DocumentSearchRequest): Promise<EnhancedSearchResult>;
    semanticSearch(query: SemanticSearchQuery, tenantId: string): Promise<SemanticSearchResult[]>;
    indexDocument(document: Document, extractedData?: ExtractedData): Promise<any>;
    removeFromIndex(documentId: string): Promise<any>;
    rebuildIndex(tenantId: string): Promise<any>;
    private buildEnhancedQuery;
    private executeSearch;
    private applyFilters;
    private getDocumentFieldValue;
    private calculateFacets;
    private generateRecommendations;
    private generateRelatedQueries;
    private generateAutoCorrections;
    private findMatchedSections;
    private generateSemanticExplanation;
    private extractDocumentContent;
    private generateCacheKey;
    private getAllDocuments;
    private initializeSearchService;
    private publishSearchEvent;
}
