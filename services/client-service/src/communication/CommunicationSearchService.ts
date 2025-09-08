import { EventEmitter } from 'events';
import {
  CommunicationRecord,
  CommunicationSearchQuery,
  CommunicationSearchResult,
  CommunicationSortField,
  SortOrder,
  SearchFacet,
  FacetValue,
  CommunicationType,
  CommunicationChannel,
  CommunicationCategory,
  CommunicationStatus,
  Priority,
  ComplianceReviewStatus,
  CommunicationThread,
  ThreadStatus
} from './CommunicationDataModel';

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

export enum SearchEngine {
  ELASTICSEARCH = 'elasticsearch',
  SOLR = 'solr',
  DATABASE = 'database',
  HYBRID = 'hybrid'
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

export enum SearchIndexType {
  MESSAGES = 'messages',
  THREADS = 'threads',
  PARTICIPANTS = 'participants',
  ATTACHMENTS = 'attachments',
  COMBINED = 'combined'
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

export enum FieldType {
  TEXT = 'text',
  KEYWORD = 'keyword',
  DATE = 'date',
  INTEGER = 'integer',
  FLOAT = 'float',
  BOOLEAN = 'boolean',
  GEO_POINT = 'geo_point',
  NESTED = 'nested',
  OBJECT = 'object'
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

export enum QueryType {
  MATCH = 'match',
  MATCH_PHRASE = 'match_phrase',
  MATCH_PHRASE_PREFIX = 'match_phrase_prefix',
  MULTI_MATCH = 'multi_match',
  TERM = 'term',
  TERMS = 'terms',
  RANGE = 'range',
  EXISTS = 'exists',
  PREFIX = 'prefix',
  WILDCARD = 'wildcard',
  REGEXP = 'regexp',
  FUZZY = 'fuzzy',
  BOOL = 'bool',
  NESTED = 'nested',
  GEO_DISTANCE = 'geo_distance',
  MORE_LIKE_THIS = 'more_like_this'
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

export enum AlertFrequency {
  IMMEDIATE = 'immediate',
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

export interface SearchSuggestion {
  text: string;
  type: SuggestionType;
  score: number;
  metadata?: Record<string, any>;
}

export enum SuggestionType {
  COMPLETION = 'completion',
  PHRASE = 'phrase',
  TERM = 'term',
  CONTEXT = 'context',
  CATEGORY = 'category',
  PARTICIPANT = 'participant',
  DATE_RANGE = 'date_range'
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

export enum TimeGranularity {
  HOUR = 'hour',
  DAY = 'day',
  WEEK = 'week',
  MONTH = 'month'
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

class CommunicationSearchService extends EventEmitter {
  private config: SearchConfiguration;
  private searchIndexes: Map<string, SearchIndex>;
  private savedSearches: Map<string, SavedSearch>;
  private searchCache: Map<string, CommunicationSearchResult>;
  private queryAnalytics: SearchAnalytics;
  private suggestionEngine: SuggestionEngine;
  private isInitialized: boolean = false;

  constructor(config: SearchConfiguration) {
    super();
    this.config = config;
    this.searchIndexes = new Map();
    this.savedSearches = new Map();
    this.searchCache = new Map();
    this.queryAnalytics = this.initializeAnalytics();
    this.suggestionEngine = new SuggestionEngine();
  }

  async initialize(): Promise<any> {
    if (this.isInitialized) {
      return;
    }

    try {
      // Initialize search indexes
      await this.initializeIndexes();

      // Load saved searches
      await this.loadSavedSearches();

      // Initialize suggestion engine
      await this.suggestionEngine.initialize();

      this.isInitialized = true;
      this.emit('search_service_initialized');
      console.log('Communication search service initialized successfully');

    } catch (error: any) {
      console.error('Failed to initialize communication search service:', error);
      throw error;
    }
  }

  async search(query: CommunicationSearchQuery, userId?: string): Promise<CommunicationSearchResult> {
    const startTime = Date.now();
    
    try {
      // Validate query
      this.validateQuery(query);

      // Check cache first
      const cacheKey = this.generateCacheKey(query);
      if (this.config.cache_enabled && this.searchCache.has(cacheKey)) {
        const cachedResult = this.searchCache.get(cacheKey)!;
        this.recordAnalytics(query, cachedResult, Date.now() - startTime, true, userId);
        return cachedResult;
      }

      // Build search query based on engine
      const searchQuery = await this.buildSearchQuery(query);

      // Execute search
      let result: CommunicationSearchResult;
      switch (this.config.default_search_engine) {
        case SearchEngine.ELASTICSEARCH:
          result = await this.searchElasticsearch(searchQuery, query);
          break;
        case SearchEngine.DATABASE:
          result = await this.searchDatabase(query);
          break;
        case SearchEngine.HYBRID:
          result = await this.searchHybrid(searchQuery, query);
          break;
        default:
          throw new Error(`Unsupported search engine: ${this.config.default_search_engine}`);
      }

      // Apply post-processing
      result = await this.postProcessResults(result, query);

      // Cache result
      if (this.config.cache_enabled) {
        this.searchCache.set(cacheKey, result);
        setTimeout(() => this.searchCache.delete(cacheKey), this.config.cache_ttl_minutes * 60 * 1000);
      }

      // Record analytics
      this.recordAnalytics(query, result, Date.now() - startTime, false, userId);

      this.emit('search_completed', { query, result, user_id: userId });
      return result;

    } catch (error: any) {
      console.error('Search error:', error);
      this.emit('search_error', { query, error, user_id: userId });
      throw error;
    }
  }

  async searchThreads(query: ThreadSearchQuery): Promise<ThreadSearchResult> {
    // Similar to message search but for communication threads
    const messages = await this.search({
      ...query,
      include_archived: query.include_closed || false
    });

    // Group messages into threads
    const threads = this.groupMessagesIntoThreads(messages.records);
    
    return {
      threads,
      total_count: threads.length,
      page: query.page || 1,
      page_size: query.page_size || this.config.default_page_size,
      total_pages: Math.ceil(threads.length / (query.page_size || this.config.default_page_size)),
      search_time_ms: messages.search_time_ms
    };
  }

  async getSuggestions(partial_query: string, context?: SuggestionContext): Promise<SearchSuggestion[]> {
    if (!this.config.autocomplete_enabled) {
      return [];
    }

    return await this.suggestionEngine.getSuggestions(partial_query, context);
  }

  async getFacets(query: CommunicationSearchQuery): Promise<SearchFacet[]> {
    if (!this.config.faceted_search_enabled) {
      return [];
    }

    const facets: SearchFacet[] = [];

    // Get type facets
    facets.push(await this.buildTypeFacet(query));
    
    // Get channel facets
    facets.push(await this.buildChannelFacet(query));
    
    // Get category facets
    facets.push(await this.buildCategoryFacet(query));
    
    // Get status facets
    facets.push(await this.buildStatusFacet(query));
    
    // Get priority facets
    facets.push(await this.buildPriorityFacet(query));
    
    // Get date range facets
    facets.push(await this.buildDateRangeFacet(query));

    return facets.filter(facet => facet.values.length > 0);
  }

  async saveSearch(search: Omit<SavedSearch, 'id' | 'created_at' | 'updated_at' | 'last_executed' | 'execution_count' | 'result_count_history'>): Promise<string> {
    if (!this.config.saved_searches_enabled) {
      throw new Error('Saved searches are not enabled');
    }

    const savedSearch: SavedSearch = {
      ...search,
      id: this.generateSearchId(),
      created_at: new Date(),
      updated_at: new Date(),
      last_executed: new Date(0),
      execution_count: 0,
      result_count_history: []
    };

    this.savedSearches.set(savedSearch.id, savedSearch);
    this.emit('search_saved', savedSearch);

    return savedSearch.id;
  }

  async executeSavedSearch(searchId: string): Promise<CommunicationSearchResult> {
    const savedSearch = this.savedSearches.get(searchId);
    if (!savedSearch) {
      throw new Error(`Saved search ${searchId} not found`);
    }

    const result = await this.search(savedSearch.query, savedSearch.user_id);

    // Update saved search statistics
    savedSearch.last_executed = new Date();
    savedSearch.execution_count++;
    savedSearch.result_count_history.push(result.total_count);

    // Keep only last 100 result counts
    if (savedSearch.result_count_history.length > 100) {
      savedSearch.result_count_history = savedSearch.result_count_history.slice(-100);
    }

    return result;
  }

  async deleteSavedSearch(searchId: string, userId: string): Promise<any> {
    const savedSearch = this.savedSearches.get(searchId);
    if (!savedSearch) {
      throw new Error(`Saved search ${searchId} not found`);
    }

    if (savedSearch.user_id !== userId && !savedSearch.is_public) {
      throw new Error('Unauthorized to delete this saved search');
    }

    this.savedSearches.delete(searchId);
    this.emit('search_deleted', { search_id: searchId, user_id: userId });
  }

  async indexMessage(message: CommunicationRecord): Promise<any> {
    if (!this.config.indexing_enabled) {
      return;
    }

    try {
      // Create search document
      const searchDoc = this.createSearchDocument(message);

      // Index in all relevant indexes
      for (const [indexName, index] of this.searchIndexes) {
        if (this.shouldIndexInIndex(message, index)) {
          await this.indexDocument(indexName, searchDoc);
        }
      }

      this.emit('message_indexed', { message_id: message.id });

    } catch (error: any) {
      console.error(`Error indexing message ${message.id}:`, error);
      this.emit('indexing_error', { message_id: message.id, error });
    }
  }

  async reindexAll(): Promise<any> {
    if (!this.config.indexing_enabled) {
      throw new Error('Indexing is not enabled');
    }

    try {
      // Clear existing indexes
      for (const indexName of this.searchIndexes.keys()) {
        await this.clearIndex(indexName);
      }

      // Reindex all messages (this would typically be done in batches)
      this.emit('reindex_started');
      
      // Implementation would fetch messages in batches and index them
      // This is a placeholder for the actual implementation
      
      this.emit('reindex_completed');

    } catch (error: any) {
      console.error('Reindexing error:', error);
      this.emit('reindex_error', error);
      throw error;
    }
  }

  async optimizeIndexes(): Promise<any> {
    for (const [indexName, index] of this.searchIndexes) {
      try {
        await this.optimizeIndex(indexName);
        index.last_optimized = new Date();
        this.emit('index_optimized', { index_name: indexName });
      } catch (error: any) {
        console.error(`Error optimizing index ${indexName}:`, error);
      }
    }
  }

  getAnalytics(): SearchAnalytics {
    return { ...this.queryAnalytics };
  }

  getSavedSearches(userId: string): SavedSearch[] {
    return Array.from(this.savedSearches.values())
      .filter(search => search.user_id === userId || search.is_public);
  }

  private validateQuery(query: CommunicationSearchQuery): void {
    if (query.query && query.query.length < this.config.min_query_length) {
      throw new Error(`Query must be at least ${this.config.min_query_length} characters`);
    }

    if (query.query && query.query.length > this.config.max_query_length) {
      throw new Error(`Query must be at most ${this.config.max_query_length} characters`);
    }

    if (query.page_size && query.page_size > this.config.max_page_size) {
      throw new Error(`Page size cannot exceed ${this.config.max_page_size}`);
    }
  }

  private async buildSearchQuery(query: CommunicationSearchQuery): Promise<SearchQueryBuilder> {
    const searchQuery: SearchQueryBuilder = {
      must: [],
      should: [],
      filter: [],
      must_not: [],
      boost: 1.0
    };

    // Main query
    if (query.query) {
      if (this.config.fuzzy_search_enabled) {
        searchQuery.should.push({
          type: QueryType.MULTI_MATCH,
          value: query.query,
          fuzziness: 'AUTO',
          boost: 2.0
        });
      }
      
      searchQuery.should.push({
        type: QueryType.MULTI_MATCH,
        value: query.query,
        boost: 1.0
      });

      searchQuery.minimum_should_match = '1';
    }

    // Filters
    if (query.client_id) {
      searchQuery.filter.push({
        type: QueryType.TERM,
        field: 'client_id',
        value: query.client_id
      });
    }

    if (query.advisor_id) {
      searchQuery.filter.push({
        type: QueryType.TERM,
        field: 'advisor_id',
        value: query.advisor_id
      });
    }

    if (query.type && query.type.length > 0) {
      searchQuery.filter.push({
        type: QueryType.TERMS,
        field: 'type',
        value: query.type
      });
    }

    if (query.channel && query.channel.length > 0) {
      searchQuery.filter.push({
        type: QueryType.TERMS,
        field: 'channel',
        value: query.channel
      });
    }

    if (query.category && query.category.length > 0) {
      searchQuery.filter.push({
        type: QueryType.TERMS,
        field: 'category',
        value: query.category
      });
    }

    if (query.status && query.status.length > 0) {
      searchQuery.filter.push({
        type: QueryType.TERMS,
        field: 'status',
        value: query.status
      });
    }

    if (query.date_from || query.date_to) {
      const rangeQuery: QueryClause = {
        type: QueryType.RANGE,
        field: 'timestamp'
      };
      
      if (query.date_from) rangeQuery.value = { ...rangeQuery.value, gte: query.date_from };
      if (query.date_to) rangeQuery.value = { ...rangeQuery.value, lte: query.date_to };
      
      searchQuery.filter.push(rangeQuery);
    }

    if (query.tags && query.tags.length > 0) {
      searchQuery.filter.push({
        type: QueryType.TERMS,
        field: 'tags',
        value: query.tags
      });
    }

    if (query.has_attachments !== undefined) {
      if (query.has_attachments) {
        searchQuery.filter.push({
          type: QueryType.EXISTS,
          field: 'attachments'
        });
      } else {
        searchQuery.must_not.push({
          type: QueryType.EXISTS,
          field: 'attachments'
        });
      }
    }

    // Exclude archived/deleted if not explicitly requested
    if (!query.include_archived) {
      searchQuery.must_not.push({
        type: QueryType.TERM,
        field: 'status',
        value: CommunicationStatus.ARCHIVED
      });
    }

    if (!query.include_deleted) {
      searchQuery.must_not.push({
        type: QueryType.TERM,
        field: 'status',
        value: CommunicationStatus.DELETED
      });
    }

    return searchQuery;
  }

  private async searchElasticsearch(searchQuery: SearchQueryBuilder, query: CommunicationSearchQuery): Promise<CommunicationSearchResult> {
    // Placeholder for Elasticsearch implementation
    // In a real implementation, this would use the Elasticsearch client
    console.log('Executing Elasticsearch query:', JSON.stringify(searchQuery, null, 2));
    
    return {
      records: [],
      total_count: 0,
      page: query.page || 1,
      page_size: query.page_size || this.config.default_page_size,
      total_pages: 0,
      facets: [],
      search_time_ms: 0,
      suggestions: []
    };
  }

  private async searchDatabase(query: CommunicationSearchQuery): Promise<CommunicationSearchResult> {
    // Placeholder for database search implementation
    // This would use SQL queries with full-text search capabilities
    
    return {
      records: [],
      total_count: 0,
      page: query.page || 1,
      page_size: query.page_size || this.config.default_page_size,
      total_pages: 0,
      facets: [],
      search_time_ms: 0,
      suggestions: []
    };
  }

  private async searchHybrid(searchQuery: SearchQueryBuilder, query: CommunicationSearchQuery): Promise<CommunicationSearchResult> {
    // Placeholder for hybrid search (combining multiple engines)
    const elasticsearchResult = await this.searchElasticsearch(searchQuery, query);
    const databaseResult = await this.searchDatabase(query);
    
    // Merge and rank results
    return this.mergeSearchResults([elasticsearchResult, databaseResult]);
  }

  private async postProcessResults(result: CommunicationSearchResult, query: CommunicationSearchQuery): Promise<CommunicationSearchResult> {
    // Apply highlighting if enabled
    if (this.config.highlight_enabled && query.query) {
      result.records = result.records.map(record => 
        this.addHighlighting(record, query.query!)
      );
    }

    // Apply sorting
    if (query.sort_by && query.sort_order) {
      result.records.sort((a, b) => {
        const aValue = this.getSortValue(a, query.sort_by!);
        const bValue = this.getSortValue(b, query.sort_by!);
        
        const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
        return query.sort_order === SortOrder.DESC ? -comparison : comparison;
      });
    }

    // Get suggestions if enabled
    if (this.config.autocomplete_enabled && query.query) {
      const suggestions = await this.getSuggestions(query.query);
      result.suggestions = suggestions.map(s => s.text);
    }

    return result;
  }

  private addHighlighting(record: CommunicationRecord, query: string): CommunicationRecord {
    // Simple highlighting implementation
    const highlightedRecord = { ...record };
    const highlightTag = '<mark>';
    const highlightEndTag = '</mark>';
    
    if (record.content.toLowerCase().includes(query.toLowerCase())) {
      highlightedRecord.content = record.content.replace(
        new RegExp(query, 'gi'),
        `${highlightTag}$&${highlightEndTag}`
      );
    }
    
    if (record.subject?.toLowerCase().includes(query.toLowerCase())) {
      highlightedRecord.subject = record.subject.replace(
        new RegExp(query, 'gi'),
        `${highlightTag}$&${highlightEndTag}`
      );
    }
    
    return highlightedRecord;
  }

  private getSortValue(record: CommunicationRecord, sortField: CommunicationSortField): any {
    switch (sortField) {
      case CommunicationSortField.TIMESTAMP:
        return record.timestamp;
      case CommunicationSortField.CREATED_AT:
        return record.created_at;
      case CommunicationSortField.UPDATED_AT:
        return record.updated_at;
      case CommunicationSortField.PRIORITY:
        return record.metadata.priority;
      case CommunicationSortField.STATUS:
        return record.status;
      case CommunicationSortField.TYPE:
        return record.type;
      case CommunicationSortField.CATEGORY:
        return record.category;
      case CommunicationSortField.SUBJECT:
        return record.subject || '';
      case CommunicationSortField.ATTACHMENT_COUNT:
        return record.attachments.length;
      default:
        return record.timestamp;
    }
  }

  private async buildTypeFacet(query: CommunicationSearchQuery): Promise<SearchFacet> {
    // In a real implementation, this would query the search engine for facet counts
    const values: FacetValue[] = Object.values(CommunicationType).map(type => ({
      value: type,
      count: Math.floor(Math.random() * 100), // Placeholder
      selected: query.type?.includes(type) || false
    }));

    return {
      field: 'type',
      values: values.filter(v => v.count > 0)
    };
  }

  private async buildChannelFacet(query: CommunicationSearchQuery): Promise<SearchFacet> {
    const values: FacetValue[] = Object.values(CommunicationChannel).map(channel => ({
      value: channel,
      count: Math.floor(Math.random() * 50),
      selected: query.channel?.includes(channel) || false
    }));

    return {
      field: 'channel',
      values: values.filter(v => v.count > 0)
    };
  }

  private async buildCategoryFacet(query: CommunicationSearchQuery): Promise<SearchFacet> {
    const values: FacetValue[] = Object.values(CommunicationCategory).map(category => ({
      value: category,
      count: Math.floor(Math.random() * 80),
      selected: query.category?.includes(category) || false
    }));

    return {
      field: 'category',
      values: values.filter(v => v.count > 0)
    };
  }

  private async buildStatusFacet(query: CommunicationSearchQuery): Promise<SearchFacet> {
    const values: FacetValue[] = Object.values(CommunicationStatus).map(status => ({
      value: status,
      count: Math.floor(Math.random() * 60),
      selected: query.status?.includes(status) || false
    }));

    return {
      field: 'status',
      values: values.filter(v => v.count > 0)
    };
  }

  private async buildPriorityFacet(query: CommunicationSearchQuery): Promise<SearchFacet> {
    const values: FacetValue[] = Object.values(Priority).map(priority => ({
      value: priority,
      count: Math.floor(Math.random() * 40),
      selected: query.priority?.includes(priority) || false
    }));

    return {
      field: 'priority',
      values: values.filter(v => v.count > 0)
    };
  }

  private async buildDateRangeFacet(query: CommunicationSearchQuery): Promise<SearchFacet> {
    const dateRanges = [
      { label: 'Last 24 hours', count: 25 },
      { label: 'Last week', count: 156 },
      { label: 'Last month', count: 734 },
      { label: 'Last 3 months', count: 2145 },
      { label: 'Last year', count: 8967 }
    ];

    const values: FacetValue[] = dateRanges.map(range => ({
      value: range.label,
      count: range.count,
      selected: false // Would need to check against query date range
    }));

    return {
      field: 'date_range',
      values
    };
  }

  private mergeSearchResults(results: CommunicationSearchResult[]): CommunicationSearchResult {
    // Simple merge implementation - in practice would be more sophisticated
    const mergedRecords: CommunicationRecord[] = [];
    let totalCount = 0;
    let totalSearchTime = 0;

    for (const result of results) {
      mergedRecords.push(...result.records);
      totalCount += result.total_count;
      totalSearchTime += result.search_time_ms;
    }

    // Remove duplicates based on ID
    const uniqueRecords = mergedRecords.filter((record, index, self) => 
      index === self.findIndex(r => r.id === record.id)
    );

    return {
      records: uniqueRecords,
      total_count: totalCount,
      page: 1,
      page_size: uniqueRecords.length,
      total_pages: 1,
      facets: [],
      search_time_ms: totalSearchTime,
      suggestions: []
    };
  }

  private generateCacheKey(query: CommunicationSearchQuery): string {
    return JSON.stringify(query);
  }

  private generateSearchId(): string {
    return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createSearchDocument(message: CommunicationRecord): SearchDocument {
    return {
      id: message.id,
      content: message.content,
      subject: message.subject,
      type: message.type,
      channel: message.channel,
      category: message.category,
      status: message.status,
      timestamp: message.timestamp,
      client_id: message.client_id,
      advisor_id: message.advisor_id,
      tags: message.tags,
      participants: message.participants.map(p => ({
        id: p.id,
        name: p.name,
        email: p.email,
        role: p.role
      })),
      attachments: message.attachments.map(a => ({
        filename: a.filename,
        file_type: a.file_type,
        file_size: a.file_size
      })),
      priority: message.metadata.priority,
      urgency: message.metadata.urgency,
      sensitivity: message.metadata.sensitivity,
      created_at: message.created_at,
      updated_at: message.updated_at
    };
  }

  private shouldIndexInIndex(message: CommunicationRecord, index: SearchIndex): boolean {
    switch (index.type) {
      case SearchIndexType.MESSAGES:
        return true;
      case SearchIndexType.THREADS:
        return false; // Threads are indexed separately
      case SearchIndexType.PARTICIPANTS:
        return message.participants.length > 0;
      case SearchIndexType.ATTACHMENTS:
        return message.attachments.length > 0;
      case SearchIndexType.COMBINED:
        return true;
      default:
        return false;
    }
  }

  private async indexDocument(indexName: string, document: SearchDocument): Promise<any> {
    // Placeholder for actual indexing implementation
    console.log(`Indexing document ${document.id} in index ${indexName}`);
  }

  private async clearIndex(indexName: string): Promise<any> {
    // Placeholder for clearing index
    console.log(`Clearing index ${indexName}`);
  }

  private async optimizeIndex(indexName: string): Promise<any> {
    // Placeholder for index optimization
    console.log(`Optimizing index ${indexName}`);
  }

  private recordAnalytics(query: CommunicationSearchQuery, result: CommunicationSearchResult, responseTime: number, fromCache: boolean, userId?: string): void {
    if (!this.config.search_analytics_enabled) {
      return;
    }

    this.queryAnalytics.total_searches++;
    this.queryAnalytics.average_response_time = 
      (this.queryAnalytics.average_response_time * (this.queryAnalytics.total_searches - 1) + responseTime) / 
      this.queryAnalytics.total_searches;

    if (userId) {
      // Track unique users (simplified)
      this.queryAnalytics.unique_users = Math.max(this.queryAnalytics.unique_users, 1);
    }

    // Record query frequency
    if (query.query) {
      const existingQuery = this.queryAnalytics.most_common_queries.find(q => q.query === query.query);
      if (existingQuery) {
        existingQuery.count++;
        existingQuery.average_results = (existingQuery.average_results + result.total_count) / 2;
      } else {
        this.queryAnalytics.most_common_queries.push({
          query: query.query,
          count: 1,
          success_rate: result.total_count > 0 ? 1 : 0,
          average_results: result.total_count
        });
      }
    }

    // Update success rate
    const hasResults = result.total_count > 0;
    this.queryAnalytics.search_success_rate = 
      (this.queryAnalytics.search_success_rate * (this.queryAnalytics.total_searches - 1) + (hasResults ? 1 : 0)) / 
      this.queryAnalytics.total_searches;

    // Record zero result queries
    if (!hasResults && query.query && !this.queryAnalytics.zero_result_queries.includes(query.query)) {
      this.queryAnalytics.zero_result_queries.push(query.query);
    }
  }

  private groupMessagesIntoThreads(messages: CommunicationRecord[]): CommunicationThread[] {
    const threadMap = new Map<string, CommunicationRecord[]>();

    // Group messages by thread key (simplified)
    messages.forEach(message => {
      const threadKey = this.generateThreadKey(message);
      if (!threadMap.has(threadKey)) {
        threadMap.set(threadKey, []);
      }
      threadMap.get(threadKey)!.push(message);
    });

    // Convert to thread objects
    return Array.from(threadMap.entries()).map(([key, threadMessages]) => {
      const firstMessage = threadMessages[0];
      return {
        id: key,
        subject: firstMessage.subject || 'No Subject',
        participants: firstMessage.participants,
        messages: threadMessages.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime()),
        created_at: threadMessages.reduce((earliest, msg) => 
          msg.timestamp < earliest ? msg.timestamp : earliest, threadMessages[0].timestamp),
        updated_at: threadMessages.reduce((latest, msg) => 
          msg.timestamp > latest ? msg.timestamp : latest, threadMessages[0].timestamp),
        status: ThreadStatus.ACTIVE,
        category: firstMessage.category,
        tags: [...new Set(threadMessages.flatMap(msg => msg.tags))],
        priority: firstMessage.metadata.priority,
        client_id: firstMessage.client_id,
        advisor_id: firstMessage.advisor_id,
        business_context: firstMessage.metadata.business_context,
        compliance_info: firstMessage.compliance
      };
    });
  }

  private generateThreadKey(message: CommunicationRecord): string {
    // Simplified thread key generation
    const participantIds = message.participants.map(p => p.id).sort().join(',');
    const subjectKey = message.subject?.toLowerCase().replace(/^(re:|fwd:)\s*/i, '') || 'no-subject';
    return `${participantIds}_${subjectKey}`;
  }

  private async initializeIndexes(): Promise<any> {
    // Initialize default search indexes
    const defaultIndexes: SearchIndex[] = [
      {
        name: 'messages',
        type: SearchIndexType.MESSAGES,
        fields: [
          { name: 'content', type: FieldType.TEXT, indexed: true, stored: true, analyzed: true, boost: 1.0, facetable: false, sortable: false, highlight: true },
          { name: 'subject', type: FieldType.TEXT, indexed: true, stored: true, analyzed: true, boost: 2.0, facetable: false, sortable: true, highlight: true },
          { name: 'type', type: FieldType.KEYWORD, indexed: true, stored: true, analyzed: false, boost: 1.0, facetable: true, sortable: true, highlight: false },
          { name: 'category', type: FieldType.KEYWORD, indexed: true, stored: true, analyzed: false, boost: 1.0, facetable: true, sortable: true, highlight: false },
          { name: 'timestamp', type: FieldType.DATE, indexed: true, stored: true, analyzed: false, boost: 1.0, facetable: true, sortable: true, highlight: false }
        ],
        settings: {
          number_of_shards: 3,
          number_of_replicas: 1,
          refresh_interval: '1s',
          max_result_window: 10000,
          analysis: {
            analyzers: {},
            tokenizers: {},
            filters: {}
          }
        },
        created_at: new Date(),
        updated_at: new Date(),
        document_count: 0,
        size_bytes: 0,
        last_optimized: new Date()
      }
    ];

    defaultIndexes.forEach(index => this.searchIndexes.set(index.name, index));
  }

  private async loadSavedSearches(): Promise<any> {
    // Load saved searches from storage
    // This is a placeholder implementation
  }

  private initializeAnalytics(): SearchAnalytics {
    return {
      period: {
        start_date: new Date(),
        end_date: new Date(),
        granularity: TimeGranularity.DAY
      },
      total_searches: 0,
      unique_users: 0,
      average_response_time: 0,
      most_common_queries: [],
      most_common_filters: [],
      search_success_rate: 0,
      zero_result_queries: [],
      popular_facets: [],
      search_volume_by_hour: [],
      user_search_patterns: [],
      performance_metrics: {
        average_query_time: 0,
        p95_query_time: 0,
        p99_query_time: 0,
        cache_hit_rate: 0,
        index_size_mb: 0,
        documents_indexed: 0,
        indexing_rate_per_second: 0
      }
    };
  }
}

// Supporting interfaces and classes
interface SearchDocument {
  id: string;
  content: string;
  subject?: string;
  type: CommunicationType;
  channel: CommunicationChannel;
  category: CommunicationCategory;
  status: CommunicationStatus;
  timestamp: Date;
  client_id: string;
  advisor_id: string;
  tags: string[];
  participants: any[];
  attachments: any[];
  priority: Priority;
  urgency: any; // Urgency type not defined
  sensitivity: any; // SensitivityLevel type not defined
  created_at: Date;
  updated_at: Date;
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

class SuggestionEngine {
  async initialize(): Promise<any> {
    // Initialize suggestion engine
  }

  async getSuggestions(partialQuery: string, context?: SuggestionContext): Promise<SearchSuggestion[]> {
    // Placeholder implementation
    return [
      {
        text: partialQuery + ' completion',
        type: SuggestionType.COMPLETION,
        score: 0.8,
        metadata: {}
      }
    ];
  }
}

export { CommunicationSearchService };

