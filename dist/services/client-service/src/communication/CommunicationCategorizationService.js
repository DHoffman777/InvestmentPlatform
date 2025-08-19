"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommunicationCategorizationService = exports.CorrectionSource = exports.CategorizationMethod = exports.PreprocessingType = exports.FeatureType = exports.MLModelType = exports.CategorizationActionType = exports.CategorizationField = void 0;
const events_1 = require("events");
const CommunicationDataModel_1 = require("./CommunicationDataModel");
var CategorizationField;
(function (CategorizationField) {
    CategorizationField["CONTENT"] = "content";
    CategorizationField["SUBJECT"] = "subject";
    CategorizationField["SENDER_EMAIL"] = "sender_email";
    CategorizationField["SENDER_NAME"] = "sender_name";
    CategorizationField["RECIPIENT_EMAIL"] = "recipient_email";
    CategorizationField["RECIPIENT_NAME"] = "recipient_name";
    CategorizationField["TYPE"] = "type";
    CategorizationField["CHANNEL"] = "channel";
    CategorizationField["TIMESTAMP"] = "timestamp";
    CategorizationField["ATTACHMENTS"] = "attachments";
    CategorizationField["PARTICIPANTS"] = "participants";
    CategorizationField["METADATA"] = "metadata";
    CategorizationField["BUSINESS_CONTEXT"] = "business_context";
    CategorizationField["CLIENT_SEGMENT"] = "client_segment";
    CategorizationField["ADVISOR_DEPARTMENT"] = "advisor_department";
})(CategorizationField || (exports.CategorizationField = CategorizationField = {}));
var CategorizationActionType;
(function (CategorizationActionType) {
    CategorizationActionType["SET_CATEGORY"] = "set_category";
    CategorizationActionType["SET_PRIORITY"] = "set_priority";
    CategorizationActionType["SET_URGENCY"] = "set_urgency";
    CategorizationActionType["SET_SENSITIVITY"] = "set_sensitivity";
    CategorizationActionType["ADD_TAG"] = "add_tag";
    CategorizationActionType["REMOVE_TAG"] = "remove_tag";
    CategorizationActionType["SET_METADATA"] = "set_metadata";
    CategorizationActionType["TRIGGER_WORKFLOW"] = "trigger_workflow";
    CategorizationActionType["NOTIFY_SUPERVISOR"] = "notify_supervisor";
    CategorizationActionType["ESCALATE"] = "escalate";
    CategorizationActionType["AUTO_ROUTE"] = "auto_route";
    CategorizationActionType["SCHEDULE_FOLLOWUP"] = "schedule_followup";
})(CategorizationActionType || (exports.CategorizationActionType = CategorizationActionType = {}));
var MLModelType;
(function (MLModelType) {
    MLModelType["NAIVE_BAYES"] = "naive_bayes";
    MLModelType["SVM"] = "svm";
    MLModelType["RANDOM_FOREST"] = "random_forest";
    MLModelType["NEURAL_NETWORK"] = "neural_network";
    MLModelType["BERT"] = "bert";
    MLModelType["TRANSFORMERS"] = "transformers";
    MLModelType["ENSEMBLE"] = "ensemble";
})(MLModelType || (exports.MLModelType = MLModelType = {}));
var FeatureType;
(function (FeatureType) {
    FeatureType["BAG_OF_WORDS"] = "bag_of_words";
    FeatureType["TF_IDF"] = "tf_idf";
    FeatureType["WORD_EMBEDDINGS"] = "word_embeddings";
    FeatureType["N_GRAMS"] = "n_grams";
    FeatureType["SENTIMENT"] = "sentiment";
    FeatureType["NAMED_ENTITIES"] = "named_entities";
    FeatureType["POS_TAGS"] = "pos_tags";
    FeatureType["LENGTH_FEATURES"] = "length_features";
    FeatureType["TIME_FEATURES"] = "time_features";
    FeatureType["METADATA_FEATURES"] = "metadata_features";
})(FeatureType || (exports.FeatureType = FeatureType = {}));
var PreprocessingType;
(function (PreprocessingType) {
    PreprocessingType["LOWERCASE"] = "lowercase";
    PreprocessingType["REMOVE_PUNCTUATION"] = "remove_punctuation";
    PreprocessingType["REMOVE_STOPWORDS"] = "remove_stopwords";
    PreprocessingType["STEMMING"] = "stemming";
    PreprocessingType["LEMMATIZATION"] = "lemmatization";
    PreprocessingType["REMOVE_HTML"] = "remove_html";
    PreprocessingType["REMOVE_URLS"] = "remove_urls";
    PreprocessingType["REMOVE_EMAILS"] = "remove_emails";
    PreprocessingType["REMOVE_PHONE_NUMBERS"] = "remove_phone_numbers";
    PreprocessingType["NORMALIZE_WHITESPACE"] = "normalize_whitespace";
    PreprocessingType["SPELL_CORRECTION"] = "spell_correction";
})(PreprocessingType || (exports.PreprocessingType = PreprocessingType = {}));
var CategorizationMethod;
(function (CategorizationMethod) {
    CategorizationMethod["RULE_BASED"] = "rule_based";
    CategorizationMethod["KEYWORD_BASED"] = "keyword_based";
    CategorizationMethod["PATTERN_MATCHING"] = "pattern_matching";
    CategorizationMethod["MACHINE_LEARNING"] = "machine_learning";
    CategorizationMethod["HYBRID"] = "hybrid";
    CategorizationMethod["FALLBACK"] = "fallback";
})(CategorizationMethod || (exports.CategorizationMethod = CategorizationMethod = {}));
var CorrectionSource;
(function (CorrectionSource) {
    CorrectionSource["USER_CORRECTION"] = "user_correction";
    CorrectionSource["AUTOMATED_REVIEW"] = "automated_review";
    CorrectionSource["COMPLIANCE_REVIEW"] = "compliance_review";
    CorrectionSource["SUPERVISOR_REVIEW"] = "supervisor_review";
    CorrectionSource["AUDIT_REVIEW"] = "audit_review";
})(CorrectionSource || (exports.CorrectionSource = CorrectionSource = {}));
class CommunicationCategorizationService extends events_1.EventEmitter {
    config;
    rules;
    keywordSets;
    patternMatchers;
    mlModels;
    activeModel;
    cache;
    metrics;
    feedbackData;
    constructor(config) {
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
    async categorizeMessage(message) {
        const startTime = Date.now();
        const cacheKey = this.generateCacheKey(message);
        // Check cache first
        if (this.config.cache_enabled && this.cache.has(cacheKey)) {
            const cachedResult = this.cache.get(cacheKey);
            this.emit('categorization_cached', { message_id: message.id, result: cachedResult });
            return cachedResult;
        }
        try {
            let result;
            // Apply categorization methods based on configuration
            if (this.config.ml_categorization_enabled && this.activeModel) {
                result = await this.categorizeMachineLearning(message);
            }
            else if (this.config.rule_based_categorization_enabled) {
                result = await this.categorizeRuleBased(message);
            }
            else if (this.config.keyword_categorization_enabled) {
                result = await this.categorizeKeywordBased(message);
            }
            else if (this.config.pattern_matching_enabled) {
                result = await this.categorizePatternBased(message);
            }
            else {
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
        }
        catch (error) {
            console.error(`Error categorizing message ${message.id}:`, error);
            const fallbackResult = this.createFallbackResult(message);
            fallbackResult.processing_time_ms = Date.now() - startTime;
            return fallbackResult;
        }
    }
    async categorizeBatch(messages) {
        const results = new Map();
        const batchSize = 50; // Process in batches to avoid memory issues
        for (let i = 0; i < messages.length; i += batchSize) {
            const batch = messages.slice(i, i + batchSize);
            const batchPromises = batch.map(message => this.categorizeMessage(message).then(result => ({ messageId: message.id, result })));
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
    async addRule(rule) {
        // Validate rule
        this.validateRule(rule);
        this.rules.set(rule.id, rule);
        this.emit('rule_added', rule);
    }
    async updateRule(ruleId, updates) {
        const existingRule = this.rules.get(ruleId);
        if (!existingRule) {
            throw new Error(`Rule ${ruleId} not found`);
        }
        const updatedRule = { ...existingRule, ...updates, updated_at: new Date() };
        this.validateRule(updatedRule);
        this.rules.set(ruleId, updatedRule);
        this.emit('rule_updated', updatedRule);
    }
    async deleteRule(ruleId) {
        const rule = this.rules.get(ruleId);
        if (rule) {
            this.rules.delete(ruleId);
            this.emit('rule_deleted', rule);
        }
    }
    async addKeywordSet(keywordSet) {
        this.keywordSets.set(keywordSet.id, keywordSet);
        this.emit('keyword_set_added', keywordSet);
    }
    async addPatternMatcher(pattern) {
        this.patternMatchers.set(pattern.id, pattern);
        this.emit('pattern_matcher_added', pattern);
    }
    async trainModel(trainingData) {
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
    async recordFeedback(feedback) {
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
    getMetrics() {
        return { ...this.metrics };
    }
    getRules() {
        return Array.from(this.rules.values());
    }
    getKeywordSets() {
        return Array.from(this.keywordSets.values());
    }
    getPatternMatchers() {
        return Array.from(this.patternMatchers.values());
    }
    async categorizeRuleBased(message) {
        const appliedRules = [];
        let bestCategory = this.config.fallback_category;
        let bestConfidence = 0;
        const alternativeCategories = [];
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
                    }
                    else if (ruleResult.confidence > this.config.confidence_threshold * 0.7) {
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
    async categorizeKeywordBased(message) {
        const matchedKeywords = [];
        const categoryScores = new Map();
        // Preprocess message content
        const content = this.preprocessText(message.content);
        const subject = this.preprocessText(message.subject || '');
        for (const keywordSet of this.keywordSets.values()) {
            if (!keywordSet.is_active)
                continue;
            let score = 0;
            const setMatches = [];
            // Check keywords
            for (const keyword of keywordSet.keywords) {
                const regex = new RegExp(keywordSet.whole_word_only ? `\\b${keyword}\\b` : keyword, keywordSet.case_sensitive ? 'g' : 'gi');
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
        const alternativeCategories = [];
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
            }
            else if (score > 0) {
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
    async categorizePatternBased(message) {
        const matchedPatterns = [];
        const categoryScores = new Map();
        for (const pattern of this.patternMatchers.values()) {
            if (!pattern.is_active)
                continue;
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
        const alternativeCategories = [];
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
            }
            else if (score > 0) {
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
    async categorizeMachineLearning(message) {
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
    createFallbackResult(message) {
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
    async postProcessResult(result, message) {
        // Apply any post-processing rules or adjustments
        const processedResult = { ...result };
        // Business logic adjustments
        if (message.type === CommunicationDataModel_1.CommunicationType.EMAIL && message.subject?.toLowerCase().includes('complaint')) {
            processedResult.predicted_category = CommunicationDataModel_1.CommunicationCategory.COMPLAINT;
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
    validateRule(rule) {
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
    evaluateRuleScope(rule, message) {
        switch (rule.applies_to) {
            case CommunicationDataModel_1.RuleScope.ALL_COMMUNICATIONS:
                return true;
            case CommunicationDataModel_1.RuleScope.SPECIFIC_CLIENT:
                return message.client_id === rule.conditions.find(c => c.field === CategorizationField.CLIENT_SEGMENT)?.value;
            case CommunicationDataModel_1.RuleScope.SPECIFIC_CHANNEL:
                return message.channel === rule.conditions.find(c => c.field === CategorizationField.CHANNEL)?.value;
            case CommunicationDataModel_1.RuleScope.SPECIFIC_TYPE:
                return message.type === rule.conditions.find(c => c.field === CategorizationField.TYPE)?.value;
            default:
                return true;
        }
    }
    async evaluateRule(rule, message) {
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
    evaluateCondition(condition, message) {
        const fieldValue = this.getFieldValue(message, condition.field);
        if (fieldValue === null || fieldValue === undefined) {
            return condition.operator === CommunicationDataModel_1.ConditionOperator.IS_NULL;
        }
        switch (condition.operator) {
            case CommunicationDataModel_1.ConditionOperator.EQUALS:
                return fieldValue === condition.value;
            case CommunicationDataModel_1.ConditionOperator.NOT_EQUALS:
                return fieldValue !== condition.value;
            case CommunicationDataModel_1.ConditionOperator.CONTAINS:
                return typeof fieldValue === 'string' &&
                    fieldValue.toLowerCase().includes(condition.value.toLowerCase());
            case CommunicationDataModel_1.ConditionOperator.NOT_CONTAINS:
                return typeof fieldValue === 'string' &&
                    !fieldValue.toLowerCase().includes(condition.value.toLowerCase());
            case CommunicationDataModel_1.ConditionOperator.STARTS_WITH:
                return typeof fieldValue === 'string' &&
                    fieldValue.toLowerCase().startsWith(condition.value.toLowerCase());
            case CommunicationDataModel_1.ConditionOperator.ENDS_WITH:
                return typeof fieldValue === 'string' &&
                    fieldValue.toLowerCase().endsWith(condition.value.toLowerCase());
            case CommunicationDataModel_1.ConditionOperator.REGEX_MATCH:
                return typeof fieldValue === 'string' &&
                    new RegExp(condition.value, condition.regex_flags || 'i').test(fieldValue);
            case CommunicationDataModel_1.ConditionOperator.IN:
                return Array.isArray(condition.value) && condition.value.includes(fieldValue);
            case CommunicationDataModel_1.ConditionOperator.NOT_IN:
                return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
            case CommunicationDataModel_1.ConditionOperator.IS_NULL:
                return fieldValue === null || fieldValue === undefined;
            case CommunicationDataModel_1.ConditionOperator.IS_NOT_NULL:
                return fieldValue !== null && fieldValue !== undefined;
            default:
                return false;
        }
    }
    getFieldValue(message, field) {
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
                return message.participants.find(p => p.role === 'sender')?.email;
            case CategorizationField.SENDER_NAME:
                return message.participants.find(p => p.role === 'sender')?.name;
            case CategorizationField.RECIPIENT_EMAIL:
                return message.participants.find(p => p.role === 'recipient')?.email;
            case CategorizationField.RECIPIENT_NAME:
                return message.participants.find(p => p.role === 'recipient')?.name;
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
    preprocessText(text) {
        return text
            .toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
    }
    normalizeScore(score) {
        // Simple normalization - in practice, this would be more sophisticated
        return Math.min(score / 10, 1.0);
    }
    generateCacheKey(message) {
        return `${message.id}_${message.updated_at.getTime()}`;
    }
    generateCacheKeyFromId(messageId) {
        return messageId; // Simplified for this example
    }
    async extractFeatures(message) {
        // Placeholder feature extraction
        const features = [];
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
    async predictWithModel(features, model) {
        // Placeholder ML prediction
        return {
            category: CommunicationDataModel_1.CommunicationCategory.GENERAL_INQUIRY,
            confidence: 0.85,
            alternatives: [
                { category: CommunicationDataModel_1.CommunicationCategory.ACCOUNT_MANAGEMENT, confidence: 0.72, reasoning: 'ML model alternative' }
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
    updateMetrics(result) {
        this.metrics.total_processed++;
        this.metrics.method_usage[result.method_used] = (this.metrics.method_usage[result.method_used] || 0) + 1;
        this.metrics.category_distribution[result.predicted_category] =
            (this.metrics.category_distribution[result.predicted_category] || 0) + 1;
        // Update confidence distribution
        if (result.confidence >= 0.9)
            this.metrics.confidence_distribution.very_high++;
        else if (result.confidence >= 0.7)
            this.metrics.confidence_distribution.high++;
        else if (result.confidence >= 0.5)
            this.metrics.confidence_distribution.medium++;
        else if (result.confidence >= 0.3)
            this.metrics.confidence_distribution.low++;
        else
            this.metrics.confidence_distribution.very_low++;
        // Update average confidence
        this.metrics.average_confidence =
            (this.metrics.average_confidence * (this.metrics.total_processed - 1) + result.confidence) /
                this.metrics.total_processed;
        // Update average processing time
        this.metrics.average_processing_time =
            (this.metrics.average_processing_time * (this.metrics.total_processed - 1) + result.processing_time_ms) /
                this.metrics.total_processed;
    }
    initializeMetrics() {
        return {
            total_processed: 0,
            accuracy: 0,
            precision_by_category: {},
            recall_by_category: {},
            f1_by_category: {},
            average_confidence: 0,
            average_processing_time: 0,
            method_usage: {},
            rule_performance: {},
            category_distribution: {},
            confidence_distribution: {
                very_high: 0,
                high: 0,
                medium: 0,
                low: 0,
                very_low: 0
            },
            error_analysis: {
                total_errors: 0,
                false_positives: {},
                false_negatives: {},
                common_misclassifications: [],
                low_confidence_categories: []
            }
        };
    }
    initializeDefaultRules() {
        // Add default categorization rules
        const defaultRules = [
            {
                id: 'complaint_detection',
                name: 'Complaint Detection',
                description: 'Detect customer complaints',
                category: CommunicationDataModel_1.CommunicationCategory.COMPLAINT,
                priority: 100,
                is_active: true,
                conditions: [
                    {
                        field: CategorizationField.CONTENT,
                        operator: CommunicationDataModel_1.ConditionOperator.CONTAINS,
                        value: 'complaint',
                        weight: 1,
                        case_sensitive: false
                    },
                    {
                        field: CategorizationField.SUBJECT,
                        operator: CommunicationDataModel_1.ConditionOperator.CONTAINS,
                        value: 'issue',
                        weight: 0.8,
                        case_sensitive: false
                    }
                ],
                actions: [],
                confidence_score: 0.9,
                applies_to: CommunicationDataModel_1.RuleScope.ALL_COMMUNICATIONS,
                created_at: new Date(),
                updated_at: new Date(),
                created_by: 'system',
                execution_count: 0,
                success_rate: 0
            }
        ];
        defaultRules.forEach(rule => this.rules.set(rule.id, rule));
    }
    initializeDefaultKeywords() {
        // Add default keyword sets
        const defaultKeywordSets = [
            {
                id: 'trading_keywords',
                name: 'Trading Keywords',
                category: CommunicationDataModel_1.CommunicationCategory.TRADE_EXECUTION,
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
    initializeDefaultPatterns() {
        // Add default pattern matchers
        const defaultPatterns = [
            {
                id: 'account_number_pattern',
                name: 'Account Number Pattern',
                description: 'Detect account numbers in content',
                category: CommunicationDataModel_1.CommunicationCategory.ACCOUNT_MANAGEMENT,
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
exports.CommunicationCategorizationService = CommunicationCategorizationService;
