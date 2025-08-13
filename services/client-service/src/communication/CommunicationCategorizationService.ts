import { EventEmitter } from 'events';
import {
  CommunicationRecord,
  CommunicationCategory,
  CommunicationType,
  CommunicationChannel,
  Priority,
  Urgency,
  SensitivityLevel,
  CommunicationRule,
  RuleCondition,
  RuleAction,
  ActionType,
  ConditionOperator,
  LogicalOperator,
  RuleScope
} from './CommunicationDataModel';

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

export enum CategorizationField {
  CONTENT = 'content',
  SUBJECT = 'subject',
  SENDER_EMAIL = 'sender_email',
  SENDER_NAME = 'sender_name',
  RECIPIENT_EMAIL = 'recipient_email',
  RECIPIENT_NAME = 'recipient_name',
  TYPE = 'type',
  CHANNEL = 'channel',
  TIMESTAMP = 'timestamp',
  ATTACHMENTS = 'attachments',
  PARTICIPANTS = 'participants',
  METADATA = 'metadata',
  BUSINESS_CONTEXT = 'business_context',
  CLIENT_SEGMENT = 'client_segment',
  ADVISOR_DEPARTMENT = 'advisor_department'
}

export interface CategorizationAction {
  type: CategorizationActionType;
  parameters: Record<string, any>;
  confidence_adjustment: number;
  order: number;
}

export enum CategorizationActionType {
  SET_CATEGORY = 'set_category',
  SET_PRIORITY = 'set_priority',
  SET_URGENCY = 'set_urgency',
  SET_SENSITIVITY = 'set_sensitivity',
  ADD_TAG = 'add_tag',
  REMOVE_TAG = 'remove_tag',
  SET_METADATA = 'set_metadata',
  TRIGGER_WORKFLOW = 'trigger_workflow',
  NOTIFY_SUPERVISOR = 'notify_supervisor',
  ESCALATE = 'escalate',
  AUTO_ROUTE = 'auto_route',
  SCHEDULE_FOLLOWUP = 'schedule_followup'
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

export enum MLModelType {
  NAIVE_BAYES = 'naive_bayes',
  SVM = 'svm',
  RANDOM_FOREST = 'random_forest',
  NEURAL_NETWORK = 'neural_network',
  BERT = 'bert',
  TRANSFORMERS = 'transformers',
  ENSEMBLE = 'ensemble'
}

export interface FeatureExtractor {
  type: FeatureType;
  parameters: Record<string, any>;
  weight: number;
}

export enum FeatureType {
  BAG_OF_WORDS = 'bag_of_words',
  TF_IDF = 'tf_idf',
  WORD_EMBEDDINGS = 'word_embeddings',
  N_GRAMS = 'n_grams',
  SENTIMENT = 'sentiment',
  NAMED_ENTITIES = 'named_entities',
  POS_TAGS = 'pos_tags',
  LENGTH_FEATURES = 'length_features',
  TIME_FEATURES = 'time_features',
  METADATA_FEATURES = 'metadata_features'
}

export interface PreprocessingStep {
  type: PreprocessingType;
  parameters: Record<string, any>;
  order: number;
}

export enum PreprocessingType {
  LOWERCASE = 'lowercase',
  REMOVE_PUNCTUATION = 'remove_punctuation',
  REMOVE_STOPWORDS = 'remove_stopwords',
  STEMMING = 'stemming',
  LEMMATIZATION = 'lemmatization',
  REMOVE_HTML = 'remove_html',
  REMOVE_URLS = 'remove_urls',
  REMOVE_EMAILS = 'remove_emails',
  REMOVE_PHONE_NUMBERS = 'remove_phone_numbers',
  NORMALIZE_WHITESPACE = 'normalize_whitespace',
  SPELL_CORRECTION = 'spell_correction'
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

export enum CategorizationMethod {
  RULE_BASED = 'rule_based',
  KEYWORD_BASED = 'keyword_based',
  PATTERN_MATCHING = 'pattern_matching',
  MACHINE_LEARNING = 'machine_learning',
  HYBRID = 'hybrid',
  FALLBACK = 'fallback'
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

export enum CorrectionSource {
  USER_CORRECTION = 'user_correction',
  AUTOMATED_REVIEW = 'automated_review',
  COMPLIANCE_REVIEW = 'compliance_review',
  SUPERVISOR_REVIEW = 'supervisor_review',
  AUDIT_REVIEW = 'audit_review'
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
  very_high: number; // 0.9-1.0
  high: number; // 0.7-0.9
  medium: number; // 0.5-0.7
  low: number; // 0.3-0.5
  very_low: number; // 0.0-0.3
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

export class CommunicationCategorizationService extends EventEmitter {
  private config: CategorizationConfiguration;
  private rules: Map<string, CategorizationRule>;
  private keywordSets: Map<string, KeywordSet>;
  private patternMatchers: Map<string, PatternMatcher>;
  private mlModels: Map<string, MLModel>;
  private activeModel?: MLModel;
  private cache: Map<string, CategorizationResult>;
  private metrics: CategorizationMetrics;
  private feedbackData: FeedbackData[];

  constructor(config: CategorizationConfiguration) {
    super();
    this.config = config;
    this.rules = new Map();
    this.keywordSets = new Map();
    this.patternMatchers = new Map();
    this.mlModels = new Map();
    this.cache = new Map();
    this.feedbackData = [];
    this.metrics = this.initializeMetrics();
    this.initializeDefaultRules();
    this.initializeDefaultKeywords();
    this.initializeDefaultPatterns();
  }

  async categorizeMessage(message: CommunicationRecord): Promise<CategorizationResult> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(message);

    // Check cache first
    if (this.config.cache_enabled && this.cache.has(cacheKey)) {
      const cachedResult = this.cache.get(cacheKey)!;
      this.emit('categorization_cached', { message_id: message.id, result: cachedResult });
      return cachedResult;
    }

    try {
      let result: CategorizationResult;

      // Apply categorization methods based on configuration
      if (this.config.ml_categorization_enabled && this.activeModel) {
        result = await this.categorizeMachineLearning(message);
      } else if (this.config.rule_based_categorization_enabled) {
        result = await this.categorizeRuleBased(message);
      } else if (this.config.keyword_categorization_enabled) {
        result = await this.categorizeKeywordBased(message);
      } else if (this.config.pattern_matching_enabled) {
        result = await this.categorizePatternBased(message);
      } else {
        result = this.createFallbackResult(message);
      }

      // Apply post-processing
      result = await this.postProcessResult(result, message);

      // Update processing time
      result.processing_time_ms = Date.now() - startTime;

      // Cache result if enabled
      if (this.config.cache_enabled) {
        this.cache.set(cacheKey, result);
        setTimeout(() => this.cache.delete(cacheKey), this.config.cache_ttl_minutes * 60 * 1000);
      }

      // Update metrics
      this.updateMetrics(result);

      // Emit events
      this.emit('message_categorized', { message_id: message.id, result });

      if (result.confidence < this.config.confidence_threshold) {
        this.emit('low_confidence_categorization', { message_id: message.id, result });
      }

      return result;

    } catch (error) {
      console.error(`Error categorizing message ${message.id}:`, error);
      const fallbackResult = this.createFallbackResult(message);
      fallbackResult.processing_time_ms = Date.now() - startTime;
      return fallbackResult;
    }
  }

  async categorizeBatch(messages: CommunicationRecord[]): Promise<Map<string, CategorizationResult>> {
    const results = new Map<string, CategorizationResult>();
    const batchSize = 50; // Process in batches to avoid memory issues

    for (let i = 0; i < messages.length; i += batchSize) {
      const batch = messages.slice(i, i + batchSize);
      const batchPromises = batch.map(message => 
        this.categorizeMessage(message).then(result => ({ messageId: message.id, result }))
      );

      const batchResults = await Promise.all(batchPromises);
      batchResults.forEach(({ messageId, result }) => {
        results.set(messageId, result);
      });

      // Small delay between batches to prevent overwhelming the system
      if (i + batchSize < messages.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    this.emit('batch_categorization_completed', { 
      total_messages: messages.length, 
      results_count: results.size 
    });

    return results;
  }

  async addRule(rule: CategorizationRule): Promise<void> {
    // Validate rule
    this.validateRule(rule);

    this.rules.set(rule.id, rule);
    this.emit('rule_added', rule);
  }

  async updateRule(ruleId: string, updates: Partial<CategorizationRule>): Promise<void> {
    const existingRule = this.rules.get(ruleId);
    if (!existingRule) {
      throw new Error(`Rule ${ruleId} not found`);
    }

    const updatedRule = { ...existingRule, ...updates, updated_at: new Date() };
    this.validateRule(updatedRule);

    this.rules.set(ruleId, updatedRule);
    this.emit('rule_updated', updatedRule);
  }

  async deleteRule(ruleId: string): Promise<void> {
    const rule = this.rules.get(ruleId);
    if (rule) {
      this.rules.delete(ruleId);
      this.emit('rule_deleted', rule);
    }
  }

  async addKeywordSet(keywordSet: KeywordSet): Promise<void> {
    this.keywordSets.set(keywordSet.id, keywordSet);
    this.emit('keyword_set_added', keywordSet);
  }

  async addPatternMatcher(pattern: PatternMatcher): Promise<void> {
    this.patternMatchers.set(pattern.id, pattern);
    this.emit('pattern_matcher_added', pattern);
  }

  async trainModel(trainingData: TrainingData[]): Promise<void> {
    if (!this.config.ml_categorization_enabled) {
      throw new Error('ML categorization is not enabled');
    }

    // Implementation would depend on the ML framework used
    console.log(`Training model with ${trainingData.length} samples`);
    
    // Placeholder for actual model training
    this.emit('model_training_started', { sample_count: trainingData.length });
    
    // Simulate training time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    this.emit('model_training_completed', { 
      accuracy: 0.95, 
      precision: 0.93, 
      recall: 0.94 
    });
  }

  async recordFeedback(feedback: FeedbackData): Promise<void> {
    this.feedbackData.push(feedback);

    // Update rule performance if applicable
    const result = this.cache.get(this.generateCacheKeyFromId(feedback.message_id));
    if (result) {
      for (const ruleId of result.applied_rules) {
        const rule = this.rules.get(ruleId);
        if (rule) {
          const isCorrect = feedback.predicted_category === feedback.actual_category;
          rule.execution_count++;
          rule.success_rate = isCorrect ? 
            (rule.success_rate * (rule.execution_count - 1) + 1) / rule.execution_count :
            (rule.success_rate * (rule.execution_count - 1)) / rule.execution_count;
        }
      }
    }

    // Trigger retraining if enabled and enough feedback accumulated
    if (this.config.feedback_learning_enabled && this.feedbackData.length % 100 === 0) {
      this.emit('feedback_threshold_reached', { feedback_count: this.feedbackData.length });
    }

    this.emit('feedback_recorded', feedback);
  }

  getMetrics(): CategorizationMetrics {
    return { ...this.metrics };
  }

  getRules(): CategorizationRule[] {
    return Array.from(this.rules.values());
  }

  getKeywordSets(): KeywordSet[] {
    return Array.from(this.keywordSets.values());
  }

  getPatternMatchers(): PatternMatcher[] {
    return Array.from(this.patternMatchers.values());
  }

  private async categorizeRuleBased(message: CommunicationRecord): Promise<CategorizationResult> {
    const appliedRules: string[] = [];
    let bestCategory = this.config.fallback_category;
    let bestConfidence = 0;
    const alternativeCategories: CategoryPrediction[] = [];

    // Sort rules by priority
    const sortedRules = Array.from(this.rules.values())
      .filter(rule => rule.is_active)
      .sort((a, b) => b.priority - a.priority);

    for (const rule of sortedRules) {
      if (this.evaluateRuleScope(rule, message)) {
        const ruleResult = await this.evaluateRule(rule, message);
        
        if (ruleResult.matches) {
          appliedRules.push(rule.id);
          
          if (ruleResult.confidence > bestConfidence) {
            alternativeCategories.push({
              category: bestCategory,
              confidence: bestConfidence,
              reasoning: `Previous best match`
            });
            bestCategory = rule.category;
            bestConfidence = ruleResult.confidence;
          } else if (ruleResult.confidence > this.config.confidence_threshold * 0.7) {
            alternativeCategories.push({
              category: rule.category,
              confidence: ruleResult.confidence,
              reasoning: `Rule: ${rule.name}`
            });
          }

          // Update rule execution stats
          rule.execution_count++;
          rule.last_executed_at = new Date();
        }
      }
    }

    return {
      message_id: message.id,
      predicted_category: bestCategory,
      confidence: bestConfidence,
      alternative_categories: alternativeCategories.slice(0, 3),
      applied_rules: appliedRules,
      processing_time_ms: 0,
      method_used: CategorizationMethod.RULE_BASED,
      requires_review: bestConfidence < this.config.confidence_threshold,
      metadata: {
        processed_at: new Date(),
        preprocessing_applied: [],
        rules_evaluated: sortedRules.length,
        keywords_matched: [],
        patterns_matched: [],
        confidence_adjustments: []
      }
    };
  }

  private async categorizeKeywordBased(message: CommunicationRecord): Promise<CategorizationResult> {
    const matchedKeywords: string[] = [];
    const categoryScores = new Map<CommunicationCategory, number>();

    // Preprocess message content
    const content = this.preprocessText(message.content);
    const subject = this.preprocessText(message.subject || '');

    for (const keywordSet of this.keywordSets.values()) {
      if (!keywordSet.is_active) continue;

      let score = 0;
      const setMatches: string[] = [];

      // Check keywords
      for (const keyword of keywordSet.keywords) {
        const regex = new RegExp(
          keywordSet.whole_word_only ? `\\b${keyword}\\b` : keyword,
          keywordSet.case_sensitive ? 'g' : 'gi'
        );

        const contentMatches = (content.match(regex) || []).length;
        const subjectMatches = (subject.match(regex) || []).length;

        if (contentMatches > 0 || subjectMatches > 0) {
          setMatches.push(keyword);
          score += (contentMatches + subjectMatches * 2) * keywordSet.weight;
        }
      }

      // Check phrases
      for (const phrase of keywordSet.phrases) {
        const regex = new RegExp(phrase, keywordSet.case_sensitive ? 'g' : 'gi');
        
        const contentMatches = (content.match(regex) || []).length;
        const subjectMatches = (subject.match(regex) || []).length;

        if (contentMatches > 0 || subjectMatches > 0) {
          setMatches.push(phrase);
          score += (contentMatches + subjectMatches * 2) * keywordSet.weight;
        }
      }

      if (score > 0) {
        matchedKeywords.push(...setMatches);
        const currentScore = categoryScores.get(keywordSet.category) || 0;
        categoryScores.set(keywordSet.category, currentScore + score);
      }
    }

    // Find best category
    let bestCategory = this.config.fallback_category;
    let bestScore = 0;
    const alternativeCategories: CategoryPrediction[] = [];

    for (const [category, score] of categoryScores) {
      if (score > bestScore) {
        if (bestScore > 0) {
          alternativeCategories.push({
            category: bestCategory,
            confidence: this.normalizeScore(bestScore),
            reasoning: `Keyword matching`
          });
        }
        bestCategory = category;
        bestScore = score;
      } else if (score > 0) {
        alternativeCategories.push({
          category,
          confidence: this.normalizeScore(score),
          reasoning: `Keyword matching`
        });
      }
    }

    const confidence = this.normalizeScore(bestScore);

    return {
      message_id: message.id,
      predicted_category: bestCategory,
      confidence,
      alternative_categories: alternativeCategories.slice(0, 3),
      applied_rules: [],
      processing_time_ms: 0,
      method_used: CategorizationMethod.KEYWORD_BASED,
      requires_review: confidence < this.config.confidence_threshold,
      metadata: {
        processed_at: new Date(),
        preprocessing_applied: [PreprocessingType.LOWERCASE, PreprocessingType.NORMALIZE_WHITESPACE],
        rules_evaluated: 0,
        keywords_matched: matchedKeywords,
        patterns_matched: [],
        confidence_adjustments: []
      }
    };
  }

  private async categorizePatternBased(message: CommunicationRecord): Promise<CategorizationResult> {
    const matchedPatterns: string[] = [];
    const categoryScores = new Map<CommunicationCategory, number>();

    for (const pattern of this.patternMatchers.values()) {
      if (!pattern.is_active) continue;

      for (const field of pattern.applies_to_fields) {
        const fieldValue = this.getFieldValue(message, field);
        if (fieldValue && pattern.pattern.test(fieldValue)) {
          matchedPatterns.push(pattern.name);
          const currentScore = categoryScores.get(pattern.category) || 0;
          categoryScores.set(pattern.category, currentScore + pattern.weight);
        }
      }
    }

    // Find best category (similar to keyword-based logic)
    let bestCategory = this.config.fallback_category;
    let bestScore = 0;
    const alternativeCategories: CategoryPrediction[] = [];

    for (const [category, score] of categoryScores) {
      if (score > bestScore) {
        if (bestScore > 0) {
          alternativeCategories.push({
            category: bestCategory,
            confidence: this.normalizeScore(bestScore),
            reasoning: `Pattern matching`
          });
        }
        bestCategory = category;
        bestScore = score;
      } else if (score > 0) {
        alternativeCategories.push({
          category,
          confidence: this.normalizeScore(score),
          reasoning: `Pattern matching`
        });
      }
    }

    const confidence = this.normalizeScore(bestScore);

    return {
      message_id: message.id,
      predicted_category: bestCategory,
      confidence,
      alternative_categories: alternativeCategories.slice(0, 3),
      applied_rules: [],
      processing_time_ms: 0,
      method_used: CategorizationMethod.PATTERN_MATCHING,
      requires_review: confidence < this.config.confidence_threshold,
      metadata: {
        processed_at: new Date(),
        preprocessing_applied: [],
        rules_evaluated: 0,
        keywords_matched: [],
        patterns_matched: matchedPatterns,
        confidence_adjustments: []
      }
    };
  }

  private async categorizeMachineLearning(message: CommunicationRecord): Promise<CategorizationResult> {
    if (!this.activeModel) {
      throw new Error('No active ML model available');
    }

    // Extract features
    const features = await this.extractFeatures(message);
    
    // Make prediction (placeholder implementation)
    const prediction = await this.predictWithModel(features, this.activeModel);

    return {
      message_id: message.id,
      predicted_category: prediction.category,
      confidence: prediction.confidence,
      alternative_categories: prediction.alternatives,
      applied_rules: [],
      processing_time_ms: 0,
      method_used: CategorizationMethod.MACHINE_LEARNING,
      feature_importance: prediction.feature_importance,
      requires_review: prediction.confidence < this.config.confidence_threshold,
      metadata: {
        processed_at: new Date(),
        model_version: this.activeModel.version,
        feature_vector: features,
        preprocessing_applied: this.activeModel.preprocessing_steps.map(step => step.type),
        rules_evaluated: 0,
        keywords_matched: [],
        patterns_matched: [],
        confidence_adjustments: []
      }
    };
  }

  private createFallbackResult(message: CommunicationRecord): CategorizationResult {
    return {
      message_id: message.id,
      predicted_category: this.config.fallback_category,
      confidence: 0.5,
      alternative_categories: [],
      applied_rules: [],
      processing_time_ms: 0,
      method_used: CategorizationMethod.FALLBACK,
      requires_review: true,
      metadata: {
        processed_at: new Date(),
        preprocessing_applied: [],
        rules_evaluated: 0,
        keywords_matched: [],
        patterns_matched: [],
        confidence_adjustments: []
      }
    };
  }

  private async postProcessResult(result: CategorizationResult, message: CommunicationRecord): Promise<CategorizationResult> {
    // Apply any post-processing rules or adjustments
    const processedResult = { ...result };

    // Business logic adjustments
    if (message.type === CommunicationType.EMAIL && message.subject?.toLowerCase().includes('complaint')) {
      processedResult.predicted_category = CommunicationCategory.COMPLAINT;
      processedResult.confidence = Math.max(processedResult.confidence, 0.8);
      processedResult.metadata.confidence_adjustments.push({
        source: 'post_processing',
        adjustment: 0.2,
        reason: 'Email subject contains complaint keyword'
      });
    }

    // Priority adjustments based on content
    if (message.content.toLowerCase().includes('urgent') || message.content.toLowerCase().includes('emergency')) {
      processedResult.metadata.confidence_adjustments.push({
        source: 'urgency_detection',
        adjustment: 0.1,
        reason: 'Urgent content detected'
      });
    }

    return processedResult;
  }

  private validateRule(rule: CategorizationRule): void {
    if (!rule.id || !rule.name || !rule.category) {
      throw new Error('Rule must have id, name, and category');
    }

    if (rule.conditions.length === 0) {
      throw new Error('Rule must have at least one condition');
    }

    for (const condition of rule.conditions) {
      if (!condition.field || !condition.operator) {
        throw new Error('Each condition must have field and operator');
      }
    }
  }

  private evaluateRuleScope(rule: CategorizationRule, message: CommunicationRecord): boolean {
    switch (rule.applies_to) {
      case RuleScope.ALL_COMMUNICATIONS:
        return true;
      case RuleScope.SPECIFIC_CLIENT:
        return message.client_id === rule.conditions.find(c => c.field === CategorizationField.CLIENT_SEGMENT)?.value;
      case RuleScope.SPECIFIC_CHANNEL:
        return message.channel === rule.conditions.find(c => c.field === CategorizationField.CHANNEL)?.value;
      case RuleScope.SPECIFIC_TYPE:
        return message.type === rule.conditions.find(c => c.field === CategorizationField.TYPE)?.value;
      default:
        return true;
    }
  }

  private async evaluateRule(rule: CategorizationRule, message: CommunicationRecord): Promise<{ matches: boolean; confidence: number }> {
    let totalWeight = 0;
    let matchedWeight = 0;

    for (const condition of rule.conditions) {
      totalWeight += condition.weight;
      
      if (this.evaluateCondition(condition, message)) {
        matchedWeight += condition.weight;
      }
    }

    const matches = matchedWeight / totalWeight >= 0.5; // At least 50% of weighted conditions must match
    const confidence = matches ? (matchedWeight / totalWeight) * rule.confidence_score : 0;

    return { matches, confidence };
  }

  private evaluateCondition(condition: CategorizationCondition, message: CommunicationRecord): boolean {
    const fieldValue = this.getFieldValue(message, condition.field);
    
    if (fieldValue === null || fieldValue === undefined) {
      return condition.operator === ConditionOperator.IS_NULL;
    }

    switch (condition.operator) {
      case ConditionOperator.EQUALS:
        return fieldValue === condition.value;
      case ConditionOperator.NOT_EQUALS:
        return fieldValue !== condition.value;
      case ConditionOperator.CONTAINS:
        return typeof fieldValue === 'string' && 
               fieldValue.toLowerCase().includes(condition.value.toLowerCase());
      case ConditionOperator.NOT_CONTAINS:
        return typeof fieldValue === 'string' && 
               !fieldValue.toLowerCase().includes(condition.value.toLowerCase());
      case ConditionOperator.STARTS_WITH:
        return typeof fieldValue === 'string' && 
               fieldValue.toLowerCase().startsWith(condition.value.toLowerCase());
      case ConditionOperator.ENDS_WITH:
        return typeof fieldValue === 'string' && 
               fieldValue.toLowerCase().endsWith(condition.value.toLowerCase());
      case ConditionOperator.REGEX_MATCH:
        return typeof fieldValue === 'string' && 
               new RegExp(condition.value, condition.regex_flags || 'i').test(fieldValue);
      case ConditionOperator.IN:
        return Array.isArray(condition.value) && condition.value.includes(fieldValue);
      case ConditionOperator.NOT_IN:
        return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
      case ConditionOperator.IS_NULL:
        return fieldValue === null || fieldValue === undefined;
      case ConditionOperator.IS_NOT_NULL:
        return fieldValue !== null && fieldValue !== undefined;
      default:
        return false;
    }
  }

  private getFieldValue(message: CommunicationRecord, field: CategorizationField): any {
    switch (field) {
      case CategorizationField.CONTENT:
        return message.content;
      case CategorizationField.SUBJECT:
        return message.subject;
      case CategorizationField.TYPE:
        return message.type;
      case CategorizationField.CHANNEL:
        return message.channel;
      case CategorizationField.TIMESTAMP:
        return message.timestamp;
      case CategorizationField.SENDER_EMAIL:
        return message.participants.find(p => p.role === 'sender' as any)?.email;
      case CategorizationField.SENDER_NAME:
        return message.participants.find(p => p.role === 'sender' as any)?.name;
      case CategorizationField.RECIPIENT_EMAIL:
        return message.participants.find(p => p.role === 'recipient' as any)?.email;
      case CategorizationField.RECIPIENT_NAME:
        return message.participants.find(p => p.role === 'recipient' as any)?.name;
      case CategorizationField.ATTACHMENTS:
        return message.attachments.length;
      case CategorizationField.PARTICIPANTS:
        return message.participants.length;
      case CategorizationField.METADATA:
        return message.metadata;
      case CategorizationField.BUSINESS_CONTEXT:
        return message.metadata.business_context;
      default:
        return null;
    }
  }

  private preprocessText(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private normalizeScore(score: number): number {
    // Simple normalization - in practice, this would be more sophisticated
    return Math.min(score / 10, 1.0);
  }

  private generateCacheKey(message: CommunicationRecord): string {
    return `${message.id}_${message.updated_at.getTime()}`;
  }

  private generateCacheKeyFromId(messageId: string): string {
    return messageId; // Simplified for this example
  }

  private async extractFeatures(message: CommunicationRecord): Promise<number[]> {
    // Placeholder feature extraction
    const features: number[] = [];
    
    // Content length
    features.push(message.content.length);
    
    // Number of words
    features.push(message.content.split(/\s+/).length);
    
    // Number of participants
    features.push(message.participants.length);
    
    // Has attachments
    features.push(message.attachments.length > 0 ? 1 : 0);
    
    // Time of day (0-23)
    features.push(message.timestamp.getHours());
    
    // Day of week (0-6)
    features.push(message.timestamp.getDay());
    
    return features;
  }

  private async predictWithModel(features: number[], model: MLModel): Promise<MLPrediction> {
    // Placeholder ML prediction
    return {
      category: CommunicationCategory.GENERAL_INQUIRY,
      confidence: 0.85,
      alternatives: [
        { category: CommunicationCategory.ACCOUNT_MANAGEMENT, confidence: 0.72, reasoning: 'ML model alternative' }
      ],
      feature_importance: {
        'content_length': 0.3,
        'word_count': 0.4,
        'participants': 0.1,
        'has_attachments': 0.05,
        'time_of_day': 0.1,
        'day_of_week': 0.05
      }
    };
  }

  private updateMetrics(result: CategorizationResult): void {
    this.metrics.total_processed++;
    this.metrics.method_usage[result.method_used] = (this.metrics.method_usage[result.method_used] || 0) + 1;
    this.metrics.category_distribution[result.predicted_category] = 
      (this.metrics.category_distribution[result.predicted_category] || 0) + 1;
    
    // Update confidence distribution
    if (result.confidence >= 0.9) this.metrics.confidence_distribution.very_high++;
    else if (result.confidence >= 0.7) this.metrics.confidence_distribution.high++;
    else if (result.confidence >= 0.5) this.metrics.confidence_distribution.medium++;
    else if (result.confidence >= 0.3) this.metrics.confidence_distribution.low++;
    else this.metrics.confidence_distribution.very_low++;
    
    // Update average confidence
    this.metrics.average_confidence = 
      (this.metrics.average_confidence * (this.metrics.total_processed - 1) + result.confidence) / 
      this.metrics.total_processed;
    
    // Update average processing time
    this.metrics.average_processing_time = 
      (this.metrics.average_processing_time * (this.metrics.total_processed - 1) + result.processing_time_ms) / 
      this.metrics.total_processed;
  }

  private initializeMetrics(): CategorizationMetrics {
    return {
      total_processed: 0,
      accuracy: 0,
      precision_by_category: {} as Record<CommunicationCategory, number>,
      recall_by_category: {} as Record<CommunicationCategory, number>,
      f1_by_category: {} as Record<CommunicationCategory, number>,
      average_confidence: 0,
      average_processing_time: 0,
      method_usage: {} as Record<CategorizationMethod, number>,
      rule_performance: {} as Record<string, RulePerformance>,
      category_distribution: {} as Record<CommunicationCategory, number>,
      confidence_distribution: {
        very_high: 0,
        high: 0,
        medium: 0,
        low: 0,
        very_low: 0
      },
      error_analysis: {
        total_errors: 0,
        false_positives: {} as Record<CommunicationCategory, number>,
        false_negatives: {} as Record<CommunicationCategory, number>,
        common_misclassifications: [],
        low_confidence_categories: []
      }
    };
  }

  private initializeDefaultRules(): void {
    // Add default categorization rules
    const defaultRules: CategorizationRule[] = [
      {
        id: 'complaint_detection',
        name: 'Complaint Detection',
        description: 'Detect customer complaints',
        category: CommunicationCategory.COMPLAINT,
        priority: 100,
        is_active: true,
        conditions: [
          {
            field: CategorizationField.CONTENT,
            operator: ConditionOperator.CONTAINS,
            value: 'complaint',
            weight: 1,
            case_sensitive: false
          },
          {
            field: CategorizationField.SUBJECT,
            operator: ConditionOperator.CONTAINS,
            value: 'issue',
            weight: 0.8,
            case_sensitive: false
          }
        ],
        actions: [],
        confidence_score: 0.9,
        applies_to: RuleScope.ALL_COMMUNICATIONS,
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'system',
        execution_count: 0,
        success_rate: 0
      }
    ];

    defaultRules.forEach(rule => this.rules.set(rule.id, rule));
  }

  private initializeDefaultKeywords(): void {
    // Add default keyword sets
    const defaultKeywordSets: KeywordSet[] = [
      {
        id: 'trading_keywords',
        name: 'Trading Keywords',
        category: CommunicationCategory.TRADE_EXECUTION,
        keywords: ['buy', 'sell', 'trade', 'order', 'execution', 'market', 'limit'],
        phrases: ['place an order', 'execute trade', 'trading account'],
        patterns: [],
        weight: 1.0,
        is_active: true,
        case_sensitive: false,
        whole_word_only: true,
        language: 'en',
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    defaultKeywordSets.forEach(set => this.keywordSets.set(set.id, set));
  }

  private initializeDefaultPatterns(): void {
    // Add default pattern matchers
    const defaultPatterns: PatternMatcher[] = [
      {
        id: 'account_number_pattern',
        name: 'Account Number Pattern',
        description: 'Detect account numbers in content',
        category: CommunicationCategory.ACCOUNT_MANAGEMENT,
        pattern: /\b\d{10,12}\b/g,
        weight: 1.0,
        confidence_boost: 0.2,
        is_active: true,
        applies_to_fields: [CategorizationField.CONTENT, CategorizationField.SUBJECT],
        created_at: new Date(),
        updated_at: new Date()
      }
    ];

    defaultPatterns.forEach(pattern => this.patternMatchers.set(pattern.id, pattern));
  }
}

interface TrainingData {
  message: CommunicationRecord;
  category: CommunicationCategory;
  confidence: number;
}

interface MLPrediction {
  category: CommunicationCategory;
  confidence: number;
  alternatives: CategoryPrediction[];
  feature_importance: Record<string, number>;
}

export { CommunicationCategorizationService };