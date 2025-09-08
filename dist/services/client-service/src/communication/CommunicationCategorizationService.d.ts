import { EventEmitter } from 'events';
import { CommunicationRecord, CommunicationCategory, ConditionOperator, LogicalOperator, RuleScope } from './CommunicationDataModel';
export interface CategorizationConfiguration {
    auto_categorization_enabled: boolean;
    ml_categorization_enabled: boolean;
    rule_based_categorization_enabled: boolean;
    keyword_categorization_enabled: boolean;
    pattern_matching_enabled: boolean;
    learning_enabled: boolean;
    confidence_threshold: number;
    fallback_category: CommunicationCategory;
    max_processing_time_ms: number;
    cache_enabled: boolean;
    cache_ttl_minutes: number;
    audit_enabled: boolean;
    feedback_learning_enabled: boolean;
}
export interface CategorizationRule {
    id: string;
    name: string;
    description: string;
    category: CommunicationCategory;
    priority: number;
    is_active: boolean;
    conditions: CategorizationCondition[];
    actions: CategorizationAction[];
    confidence_score: number;
    applies_to: RuleScope;
    created_at: Date;
    updated_at: Date;
    created_by: string;
    execution_count: number;
    success_rate: number;
    last_executed_at?: Date;
}
export interface CategorizationCondition {
    field: CategorizationField;
    operator: ConditionOperator;
    value: any;
    weight: number;
    logical_operator?: LogicalOperator;
    case_sensitive?: boolean;
    regex_flags?: string;
}
export declare enum CategorizationField {
    CONTENT = "content",
    SUBJECT = "subject",
    SENDER_EMAIL = "sender_email",
    SENDER_NAME = "sender_name",
    RECIPIENT_EMAIL = "recipient_email",
    RECIPIENT_NAME = "recipient_name",
    TYPE = "type",
    CHANNEL = "channel",
    TIMESTAMP = "timestamp",
    ATTACHMENTS = "attachments",
    PARTICIPANTS = "participants",
    METADATA = "metadata",
    BUSINESS_CONTEXT = "business_context",
    CLIENT_SEGMENT = "client_segment",
    ADVISOR_DEPARTMENT = "advisor_department"
}
export interface CategorizationAction {
    type: CategorizationActionType;
    parameters: Record<string, any>;
    confidence_adjustment: number;
    order: number;
}
export declare enum CategorizationActionType {
    SET_CATEGORY = "set_category",
    SET_PRIORITY = "set_priority",
    SET_URGENCY = "set_urgency",
    SET_SENSITIVITY = "set_sensitivity",
    ADD_TAG = "add_tag",
    REMOVE_TAG = "remove_tag",
    SET_METADATA = "set_metadata",
    TRIGGER_WORKFLOW = "trigger_workflow",
    NOTIFY_SUPERVISOR = "notify_supervisor",
    ESCALATE = "escalate",
    AUTO_ROUTE = "auto_route",
    SCHEDULE_FOLLOWUP = "schedule_followup"
}
export interface KeywordSet {
    id: string;
    name: string;
    category: CommunicationCategory;
    keywords: string[];
    phrases: string[];
    patterns: RegExp[];
    weight: number;
    is_active: boolean;
    case_sensitive: boolean;
    whole_word_only: boolean;
    language: string;
    created_at: Date;
    updated_at: Date;
}
export interface PatternMatcher {
    id: string;
    name: string;
    description: string;
    category: CommunicationCategory;
    pattern: RegExp;
    weight: number;
    confidence_boost: number;
    is_active: boolean;
    applies_to_fields: CategorizationField[];
    created_at: Date;
    updated_at: Date;
}
export interface MLModel {
    id: string;
    name: string;
    version: string;
    model_type: MLModelType;
    is_active: boolean;
    accuracy: number;
    precision: number;
    recall: number;
    f1_score: number;
    training_data_size: number;
    last_trained: Date;
    model_path: string;
    feature_extractors: FeatureExtractor[];
    preprocessing_steps: PreprocessingStep[];
}
export declare enum MLModelType {
    NAIVE_BAYES = "naive_bayes",
    SVM = "svm",
    RANDOM_FOREST = "random_forest",
    NEURAL_NETWORK = "neural_network",
    BERT = "bert",
    TRANSFORMERS = "transformers",
    ENSEMBLE = "ensemble"
}
export interface FeatureExtractor {
    type: FeatureType;
    parameters: Record<string, any>;
    weight: number;
}
export declare enum FeatureType {
    BAG_OF_WORDS = "bag_of_words",
    TF_IDF = "tf_idf",
    WORD_EMBEDDINGS = "word_embeddings",
    N_GRAMS = "n_grams",
    SENTIMENT = "sentiment",
    NAMED_ENTITIES = "named_entities",
    POS_TAGS = "pos_tags",
    LENGTH_FEATURES = "length_features",
    TIME_FEATURES = "time_features",
    METADATA_FEATURES = "metadata_features"
}
export interface PreprocessingStep {
    type: PreprocessingType;
    parameters: Record<string, any>;
    order: number;
}
export declare enum PreprocessingType {
    LOWERCASE = "lowercase",
    REMOVE_PUNCTUATION = "remove_punctuation",
    REMOVE_STOPWORDS = "remove_stopwords",
    STEMMING = "stemming",
    LEMMATIZATION = "lemmatization",
    REMOVE_HTML = "remove_html",
    REMOVE_URLS = "remove_urls",
    REMOVE_EMAILS = "remove_emails",
    REMOVE_PHONE_NUMBERS = "remove_phone_numbers",
    NORMALIZE_WHITESPACE = "normalize_whitespace",
    SPELL_CORRECTION = "spell_correction"
}
export interface CategorizationResult {
    message_id: string;
    predicted_category: CommunicationCategory;
    confidence: number;
    alternative_categories: CategoryPrediction[];
    applied_rules: string[];
    processing_time_ms: number;
    method_used: CategorizationMethod;
    feature_importance?: Record<string, number>;
    explanation?: string;
    requires_review: boolean;
    metadata: CategorizationMetadata;
}
export interface CategoryPrediction {
    category: CommunicationCategory;
    confidence: number;
    reasoning: string;
}
export declare enum CategorizationMethod {
    RULE_BASED = "rule_based",
    KEYWORD_BASED = "keyword_based",
    PATTERN_MATCHING = "pattern_matching",
    MACHINE_LEARNING = "machine_learning",
    HYBRID = "hybrid",
    FALLBACK = "fallback"
}
export interface CategorizationMetadata {
    processed_at: Date;
    model_version?: string;
    feature_vector?: number[];
    preprocessing_applied: PreprocessingType[];
    rules_evaluated: number;
    keywords_matched: string[];
    patterns_matched: string[];
    confidence_adjustments: ConfidenceAdjustment[];
}
export interface ConfidenceAdjustment {
    source: string;
    adjustment: number;
    reason: string;
}
export interface FeedbackData {
    message_id: string;
    predicted_category: CommunicationCategory;
    actual_category: CommunicationCategory;
    confidence: number;
    user_id: string;
    feedback_timestamp: Date;
    feedback_notes?: string;
    correction_source: CorrectionSource;
}
export declare enum CorrectionSource {
    USER_CORRECTION = "user_correction",
    AUTOMATED_REVIEW = "automated_review",
    COMPLIANCE_REVIEW = "compliance_review",
    SUPERVISOR_REVIEW = "supervisor_review",
    AUDIT_REVIEW = "audit_review"
}
export interface CategorizationMetrics {
    total_processed: number;
    accuracy: number;
    precision_by_category: Record<CommunicationCategory, number>;
    recall_by_category: Record<CommunicationCategory, number>;
    f1_by_category: Record<CommunicationCategory, number>;
    average_confidence: number;
    average_processing_time: number;
    method_usage: Record<CategorizationMethod, number>;
    rule_performance: Record<string, RulePerformance>;
    category_distribution: Record<CommunicationCategory, number>;
    confidence_distribution: ConfidenceDistribution;
    error_analysis: ErrorAnalysis;
}
export interface RulePerformance {
    rule_id: string;
    executions: number;
    successes: number;
    success_rate: number;
    average_confidence: number;
    last_execution: Date;
}
export interface ConfidenceDistribution {
    very_high: number;
    high: number;
    medium: number;
    low: number;
    very_low: number;
}
export interface ErrorAnalysis {
    total_errors: number;
    false_positives: Record<CommunicationCategory, number>;
    false_negatives: Record<CommunicationCategory, number>;
    common_misclassifications: CategoryConfusion[];
    low_confidence_categories: CommunicationCategory[];
}
export interface CategoryConfusion {
    predicted: CommunicationCategory;
    actual: CommunicationCategory;
    count: number;
    confidence_range: string;
}
declare class CommunicationCategorizationService extends EventEmitter {
    private config;
    private rules;
    private keywordSets;
    private patternMatchers;
    private mlModels;
    private activeModel?;
    private cache;
    private metrics;
    private feedbackData;
    constructor(config: CategorizationConfiguration);
    categorizeMessage(message: CommunicationRecord): Promise<CategorizationResult>;
    categorizeBatch(messages: CommunicationRecord[]): Promise<Map<string, CategorizationResult>>;
    addRule(rule: CategorizationRule): Promise<any>;
    updateRule(ruleId: string, updates: Partial<CategorizationRule>): Promise<any>;
    deleteRule(ruleId: string): Promise<any>;
    addKeywordSet(keywordSet: KeywordSet): Promise<any>;
    addPatternMatcher(pattern: PatternMatcher): Promise<any>;
    trainModel(trainingData: TrainingData[]): Promise<any>;
    recordFeedback(feedback: FeedbackData): Promise<any>;
    getMetrics(): CategorizationMetrics;
    getRules(): CategorizationRule[];
    getKeywordSets(): KeywordSet[];
    getPatternMatchers(): PatternMatcher[];
    private categorizeRuleBased;
    private categorizeKeywordBased;
    private categorizePatternBased;
    private categorizeMachineLearning;
    private createFallbackResult;
    private postProcessResult;
    private validateRule;
    private evaluateRuleScope;
    private evaluateRule;
    private evaluateCondition;
    private getFieldValue;
    private preprocessText;
    private normalizeScore;
    private generateCacheKey;
    private generateCacheKeyFromId;
    private extractFeatures;
    private predictWithModel;
    private updateMetrics;
    private initializeMetrics;
    private initializeDefaultRules;
    private initializeDefaultKeywords;
    private initializeDefaultPatterns;
}
interface TrainingData {
    message: CommunicationRecord;
    category: CommunicationCategory;
    confidence: number;
}
export { CommunicationCategorizationService };
