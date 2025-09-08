import { EventEmitter } from 'events';
import { CommunicationRecord, CommunicationSearchQuery, CommunicationSearchResult, SortOrder, SearchFacet, CommunicationCategory, CommunicationThread, ThreadStatus } from './CommunicationDataModel';
export interface SearchConfiguration {
    enabled_search_engines: SearchEngine[];
    default_search_engine: SearchEngine;
    indexing_enabled: boolean;
    full_text_search_enabled: boolean;
    fuzzy_search_enabled: boolean;
    autocomplete_enabled: boolean;
    faceted_search_enabled: boolean;
    saved_searches_enabled: boolean;
    search_analytics_enabled: boolean;
    max_results_per_query: number;
    max_page_size: number;
    default_page_size: number;
    search_timeout_ms: number;
    cache_enabled: boolean;
    cache_ttl_minutes: number;
    highlight_enabled: boolean;
    snippet_length: number;
    min_query_length: number;
    max_query_length: number;
    allowed_wildcards: boolean;
    regex_search_enabled: boolean;
    case_sensitive_default: boolean;
}
export declare enum SearchEngine {
    ELASTICSEARCH = "elasticsearch",
    SOLR = "solr",
    DATABASE = "database",
    HYBRID = "hybrid"
}
export interface SearchIndex {
    name: string;
    type: SearchIndexType;
    fields: IndexField[];
    settings: IndexSettings;
    created_at: Date;
    updated_at: Date;
    document_count: number;
    size_bytes: number;
    last_optimized: Date;
}
export declare enum SearchIndexType {
    MESSAGES = "messages",
    THREADS = "threads",
    PARTICIPANTS = "participants",
    ATTACHMENTS = "attachments",
    COMBINED = "combined"
}
export interface IndexField {
    name: string;
    type: FieldType;
    indexed: boolean;
    stored: boolean;
    analyzed: boolean;
    boost: number;
    facetable: boolean;
    sortable: boolean;
    highlight: boolean;
}
export declare enum FieldType {
    TEXT = "text",
    KEYWORD = "keyword",
    DATE = "date",
    INTEGER = "integer",
    FLOAT = "float",
    BOOLEAN = "boolean",
    GEO_POINT = "geo_point",
    NESTED = "nested",
    OBJECT = "object"
}
export interface IndexSettings {
    number_of_shards: number;
    number_of_replicas: number;
    refresh_interval: string;
    max_result_window: number;
    analysis: AnalysisSettings;
}
export interface AnalysisSettings {
    analyzers: Record<string, AnalyzerConfig>;
    tokenizers: Record<string, TokenizerConfig>;
    filters: Record<string, FilterConfig>;
}
export interface AnalyzerConfig {
    type: string;
    tokenizer: string;
    filters: string[];
}
export interface TokenizerConfig {
    type: string;
    pattern?: string;
    flags?: string;
}
export interface FilterConfig {
    type: string;
    stopwords?: string[];
    synonyms?: string[];
    stemmer_name?: string;
}
export interface SearchQueryBuilder {
    must: QueryClause[];
    should: QueryClause[];
    filter: QueryClause[];
    must_not: QueryClause[];
    boost: number;
    minimum_should_match?: string;
}
export interface QueryClause {
    type: QueryType;
    field?: string;
    value?: any;
    boost?: number;
    operator?: string;
    analyzer?: string;
    fuzziness?: string;
    prefix_length?: number;
    max_expansions?: number;
    slop?: number;
    tie_breaker?: number;
}
export declare enum QueryType {
    MATCH = "match",
    MATCH_PHRASE = "match_phrase",
    MATCH_PHRASE_PREFIX = "match_phrase_prefix",
    MULTI_MATCH = "multi_match",
    TERM = "term",
    TERMS = "terms",
    RANGE = "range",
    EXISTS = "exists",
    PREFIX = "prefix",
    WILDCARD = "wildcard",
    REGEXP = "regexp",
    FUZZY = "fuzzy",
    BOOL = "bool",
    NESTED = "nested",
    GEO_DISTANCE = "geo_distance",
    MORE_LIKE_THIS = "more_like_this"
}
export interface SavedSearch {
    id: string;
    name: string;
    description: string;
    query: CommunicationSearchQuery;
    user_id: string;
    is_public: boolean;
    is_alert: boolean;
    alert_frequency?: AlertFrequency;
    created_at: Date;
    updated_at: Date;
    last_executed: Date;
    execution_count: number;
    result_count_history: number[];
}
export declare enum AlertFrequency {
    IMMEDIATE = "immediate",
    HOURLY = "hourly",
    DAILY = "daily",
    WEEKLY = "weekly",
    MONTHLY = "monthly"
}
export interface SearchSuggestion {
    text: string;
    type: SuggestionType;
    score: number;
    metadata?: Record<string, any>;
}
export declare enum SuggestionType {
    COMPLETION = "completion",
    PHRASE = "phrase",
    TERM = "term",
    CONTEXT = "context",
    CATEGORY = "category",
    PARTICIPANT = "participant",
    DATE_RANGE = "date_range"
}
export interface SearchAnalytics {
    period: AnalyticsPeriod;
    total_searches: number;
    unique_users: number;
    average_response_time: number;
    most_common_queries: QueryFrequency[];
    most_common_filters: FilterFrequency[];
    search_success_rate: number;
    zero_result_queries: string[];
    popular_facets: FacetUsage[];
    search_volume_by_hour: HourlyVolume[];
    user_search_patterns: UserSearchPattern[];
    performance_metrics: SearchPerformanceMetrics;
}
export interface AnalyticsPeriod {
    start_date: Date;
    end_date: Date;
    granularity: TimeGranularity;
}
export declare enum TimeGranularity {
    HOUR = "hour",
    DAY = "day",
    WEEK = "week",
    MONTH = "month"
}
export interface QueryFrequency {
    query: string;
    count: number;
    success_rate: number;
    average_results: number;
}
export interface FilterFrequency {
    filter_name: string;
    filter_value: string;
    count: number;
}
export interface FacetUsage {
    facet_name: string;
    usage_count: number;
    unique_values_accessed: number;
}
export interface HourlyVolume {
    hour: number;
    search_count: number;
    unique_users: number;
}
export interface UserSearchPattern {
    user_id: string;
    search_count: number;
    unique_queries: number;
    most_common_category: CommunicationCategory;
    average_session_length: number;
    preferred_sort_order: SortOrder;
}
export interface SearchPerformanceMetrics {
    average_query_time: number;
    p95_query_time: number;
    p99_query_time: number;
    cache_hit_rate: number;
    index_size_mb: number;
    documents_indexed: number;
    indexing_rate_per_second: number;
}
export interface AdvancedSearchOptions {
    proximity_search: boolean;
    boolean_operators: boolean;
    field_specific_search: boolean;
    date_math: boolean;
    geo_search: boolean;
    machine_learning_ranking: boolean;
    personalized_results: boolean;
    collaborative_filtering: boolean;
}
declare class CommunicationSearchService extends EventEmitter {
    private config;
    private searchIndexes;
    private savedSearches;
    private searchCache;
    private queryAnalytics;
    private suggestionEngine;
    private isInitialized;
    constructor(config: SearchConfiguration);
    initialize(): Promise<any>;
    search(query: CommunicationSearchQuery, userId?: string): Promise<CommunicationSearchResult>;
    searchThreads(query: ThreadSearchQuery): Promise<ThreadSearchResult>;
    getSuggestions(partial_query: string, context?: SuggestionContext): Promise<SearchSuggestion[]>;
    getFacets(query: CommunicationSearchQuery): Promise<SearchFacet[]>;
    saveSearch(search: Omit<SavedSearch, 'id' | 'created_at' | 'updated_at' | 'last_executed' | 'execution_count' | 'result_count_history'>): Promise<string>;
    executeSavedSearch(searchId: string): Promise<CommunicationSearchResult>;
    deleteSavedSearch(searchId: string, userId: string): Promise<any>;
    indexMessage(message: CommunicationRecord): Promise<any>;
    reindexAll(): Promise<any>;
    optimizeIndexes(): Promise<any>;
    getAnalytics(): SearchAnalytics;
    getSavedSearches(userId: string): SavedSearch[];
    private validateQuery;
    private buildSearchQuery;
    private searchElasticsearch;
    private searchDatabase;
    private searchHybrid;
    private postProcessResults;
    private addHighlighting;
    private getSortValue;
    private buildTypeFacet;
    private buildChannelFacet;
    private buildCategoryFacet;
    private buildStatusFacet;
    private buildPriorityFacet;
    private buildDateRangeFacet;
    private mergeSearchResults;
    private generateCacheKey;
    private generateSearchId;
    private createSearchDocument;
    private shouldIndexInIndex;
    private indexDocument;
    private clearIndex;
    private optimizeIndex;
    private recordAnalytics;
    private groupMessagesIntoThreads;
    private generateThreadKey;
    private initializeIndexes;
    private loadSavedSearches;
    private initializeAnalytics;
}
interface ThreadSearchQuery extends CommunicationSearchQuery {
    thread_status?: ThreadStatus[];
    include_closed?: boolean;
    min_message_count?: number;
    max_message_count?: number;
}
interface ThreadSearchResult {
    threads: CommunicationThread[];
    total_count: number;
    page: number;
    page_size: number;
    total_pages: number;
    search_time_ms: number;
}
interface SuggestionContext {
    user_id?: string;
    recent_searches?: string[];
    preferred_categories?: CommunicationCategory[];
    user_role?: string;
}
export { CommunicationSearchService };
