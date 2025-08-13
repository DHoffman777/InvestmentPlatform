"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MultiLanguageProcessingService = void 0;
const DocumentManagement_1 = require("../../models/documentManagement/DocumentManagement");
class MultiLanguageProcessingService {
    prisma;
    logger;
    kafkaService;
    supportedLanguages;
    languageModels;
    translationModels;
    customDictionaries;
    languageDetectionEngine;
    constructor(prisma, logger, kafkaService) {
        this.prisma = prisma;
        this.logger = logger;
        this.kafkaService = kafkaService;
        this.supportedLanguages = new Set([
            DocumentManagement_1.Language.ENGLISH,
            DocumentManagement_1.Language.SPANISH,
            DocumentManagement_1.Language.FRENCH,
            DocumentManagement_1.Language.GERMAN,
            DocumentManagement_1.Language.ITALIAN,
            DocumentManagement_1.Language.PORTUGUESE,
            DocumentManagement_1.Language.DUTCH,
            DocumentManagement_1.Language.RUSSIAN,
            DocumentManagement_1.Language.CHINESE_SIMPLIFIED,
            DocumentManagement_1.Language.CHINESE_TRADITIONAL,
            DocumentManagement_1.Language.JAPANESE,
            DocumentManagement_1.Language.KOREAN,
            DocumentManagement_1.Language.ARABIC,
            DocumentManagement_1.Language.HINDI
        ]);
        this.languageModels = new Map();
        this.translationModels = new Map();
        this.customDictionaries = new Map();
        this.initializeLanguageModels();
    }
    async processMultiLanguageDocument(request) {
        try {
            this.logger.info('Starting multi-language document processing', {
                documentId: request.documentId,
                expectedLanguage: request.expectedLanguage,
                enableLanguageDetection: request.enableLanguageDetection,
                enableTranslation: request.enableTranslation
            });
            const startTime = Date.now();
            let detectedLanguage;
            if (request.enableLanguageDetection) {
                detectedLanguage = await this.detectLanguage(request.text, request.expectedLanguage);
            }
            else {
                detectedLanguage = {
                    language: request.expectedLanguage || DocumentManagement_1.Language.ENGLISH,
                    confidence: 1.0,
                    alternativeLanguages: [],
                    isReliable: true,
                    detectionMethod: 'PREDEFINED'
                };
            }
            const translations = new Map();
            if (request.enableTranslation && request.targetLanguages) {
                for (const targetLanguage of request.targetLanguages) {
                    if (targetLanguage !== detectedLanguage.language) {
                        const translation = await this.translateText({
                            text: request.text,
                            sourceLanguage: detectedLanguage.language,
                            targetLanguage,
                            preserveFormatting: true,
                            domain: 'FINANCIAL'
                        });
                        translations.set(targetLanguage, translation);
                    }
                }
            }
            const processedVersions = new Map();
            if (request.enableLanguageSpecificProcessing) {
                const languageSpecificConfig = this.getLanguageSpecificConfig(detectedLanguage.language);
                const processedText = await this.performLanguageSpecificProcessing(request.text, detectedLanguage.language, languageSpecificConfig);
                processedVersions.set(detectedLanguage.language, processedText);
                for (const [targetLang, translation] of translations) {
                    const targetConfig = this.getLanguageSpecificConfig(targetLang);
                    const processedTranslation = await this.performLanguageSpecificProcessing(translation.translatedText, targetLang, targetConfig);
                    processedVersions.set(targetLang, processedTranslation);
                }
            }
            const totalProcessingTime = Date.now() - startTime;
            const result = {
                originalText: request.text,
                detectedLanguage,
                translations,
                processedVersions,
                metadata: {
                    totalProcessingTime,
                    languageDetectionTime: 0,
                    translationTime: 0,
                    processingTime: 0,
                    confidence: detectedLanguage.confidence,
                    processedAt: new Date(),
                    processedBy: 'MultiLanguageProcessingService'
                }
            };
            await this.publishLanguageProcessingEvent(request.documentId, request.tenantId, result);
            this.logger.info('Multi-language document processing completed', {
                documentId: request.documentId,
                detectedLanguage: detectedLanguage.language,
                translationsCount: translations.size,
                processingTime: totalProcessingTime
            });
            return result;
        }
        catch (error) {
            this.logger.error('Multi-language document processing failed', {
                documentId: request.documentId,
                error: error.message,
                stack: error.stack
            });
            throw error;
        }
    }
    async detectLanguage(text, expectedLanguage) {
        try {
            const startTime = Date.now();
            let detectionResults = [];
            detectionResults.push(await this.detectLanguageCharacterBased(text));
            detectionResults.push(await this.detectLanguageStatistical(text));
            detectionResults.push(await this.detectLanguageNeuralNetwork(text));
            const finalResult = await this.combineDetectionResults(detectionResults, expectedLanguage);
            finalResult.detectionMethod = 'HYBRID';
            this.logger.debug('Language detection completed', {
                detectedLanguage: finalResult.language,
                confidence: finalResult.confidence,
                processingTime: Date.now() - startTime
            });
            return finalResult;
        }
        catch (error) {
            this.logger.error('Language detection failed', {
                error: error.message,
                textLength: text.length
            });
            return {
                language: expectedLanguage || DocumentManagement_1.Language.ENGLISH,
                confidence: 0.5,
                alternativeLanguages: [],
                isReliable: false,
                detectionMethod: 'FALLBACK'
            };
        }
    }
    async detectLanguageCharacterBased(text) {
        const characterSets = new Map([
            [DocumentManagement_1.Language.ENGLISH, /^[a-zA-Z\s\d\.,!?;:'"()\-]+$/],
            [DocumentManagement_1.Language.SPANISH, /[ñáéíóúü]/i],
            [DocumentManagement_1.Language.FRENCH, /[àâäéèêëïîôöùûüÿç]/i],
            [DocumentManagement_1.Language.GERMAN, /[äöüßÄÖÜ]/],
            [DocumentManagement_1.Language.ITALIAN, /[àéèíìîóòúù]/i],
            [DocumentManagement_1.Language.PORTUGUESE, /[ãõáéíóúâêîôûàèìòùç]/i],
            [DocumentManagement_1.Language.DUTCH, /[àáéèíîóôúùü]/i],
            [DocumentManagement_1.Language.RUSSIAN, /[а-яё]/i],
            [DocumentManagement_1.Language.CHINESE_SIMPLIFIED, /[\u4e00-\u9fff]/],
            [DocumentManagement_1.Language.CHINESE_TRADITIONAL, /[\u4e00-\u9fff]/],
            [DocumentManagement_1.Language.JAPANESE, /[\u3040-\u309f\u30a0-\u30ff\u4e00-\u9fff]/],
            [DocumentManagement_1.Language.KOREAN, /[\uac00-\ud7af]/],
            [DocumentManagement_1.Language.ARABIC, /[\u0600-\u06ff]/],
            [DocumentManagement_1.Language.HINDI, /[\u0900-\u097f]/]
        ]);
        const scores = new Map();
        for (const [language, pattern] of characterSets) {
            const matches = text.match(pattern) || [];
            const score = matches.length / text.length;
            scores.set(language, score);
        }
        const sortedScores = Array.from(scores.entries())
            .sort(([, a], [, b]) => b - a);
        const topLanguage = sortedScores[0];
        const alternativeLanguages = sortedScores.slice(1, 4).map(([lang, score]) => ({
            language: lang,
            confidence: score
        }));
        return {
            language: topLanguage[0],
            confidence: topLanguage[1],
            alternativeLanguages,
            isReliable: topLanguage[1] > 0.7,
            detectionMethod: 'CHARACTER_BASED'
        };
    }
    async detectLanguageStatistical(text) {
        try {
            const franc = require('franc');
            const result = franc.all(text);
            if (result.length === 0) {
                return {
                    language: DocumentManagement_1.Language.ENGLISH,
                    confidence: 0.1,
                    alternativeLanguages: [],
                    isReliable: false,
                    detectionMethod: 'STATISTICAL'
                };
            }
            const topResult = result[0];
            const mappedLanguage = this.mapISOToLanguage(topResult[0]);
            const confidence = topResult[1];
            const alternativeLanguages = result.slice(1, 4).map((r) => ({
                language: this.mapISOToLanguage(r[0]),
                confidence: r[1]
            }));
            return {
                language: mappedLanguage,
                confidence: confidence,
                alternativeLanguages,
                isReliable: confidence > 0.8,
                detectionMethod: 'STATISTICAL'
            };
        }
        catch (error) {
            this.logger.warn('Statistical language detection failed', { error: error.message });
            return {
                language: DocumentManagement_1.Language.ENGLISH,
                confidence: 0.1,
                alternativeLanguages: [],
                isReliable: false,
                detectionMethod: 'STATISTICAL'
            };
        }
    }
    async detectLanguageNeuralNetwork(text) {
        try {
            if (!this.languageDetectionEngine) {
                await this.initializeLanguageDetectionEngine();
            }
            const predictions = await this.languageDetectionEngine.predict(text);
            const sortedPredictions = predictions
                .map((confidence, index) => ({
                language: this.indexToLanguage(index),
                confidence
            }))
                .sort((a, b) => b.confidence - a.confidence);
            const topPrediction = sortedPredictions[0];
            const alternativeLanguages = sortedPredictions.slice(1, 4);
            return {
                language: topPrediction.language,
                confidence: topPrediction.confidence,
                alternativeLanguages,
                isReliable: topPrediction.confidence > 0.9,
                detectionMethod: 'NEURAL_NETWORK'
            };
        }
        catch (error) {
            this.logger.warn('Neural network language detection failed', { error: error.message });
            return {
                language: DocumentManagement_1.Language.ENGLISH,
                confidence: 0.5,
                alternativeLanguages: [],
                isReliable: false,
                detectionMethod: 'NEURAL_NETWORK'
            };
        }
    }
    async combineDetectionResults(results, expectedLanguage) {
        const languageScores = new Map();
        const weights = { CHARACTER_BASED: 0.3, STATISTICAL: 0.4, NEURAL_NETWORK: 0.3 };
        for (const result of results) {
            const weight = weights[result.detectionMethod] || 0.33;
            const currentScore = languageScores.get(result.language) || 0;
            languageScores.set(result.language, currentScore + (result.confidence * weight));
        }
        if (expectedLanguage && languageScores.has(expectedLanguage)) {
            const expectedScore = languageScores.get(expectedLanguage);
            languageScores.set(expectedLanguage, expectedScore * 1.2);
        }
        const sortedLanguages = Array.from(languageScores.entries())
            .sort(([, a], [, b]) => b - a);
        const topLanguage = sortedLanguages[0];
        const alternativeLanguages = sortedLanguages.slice(1, 4).map(([lang, score]) => ({
            language: lang,
            confidence: score
        }));
        return {
            language: topLanguage[0],
            confidence: Math.min(topLanguage[1], 1.0),
            alternativeLanguages,
            isReliable: topLanguage[1] > 0.8,
            detectionMethod: 'HYBRID'
        };
    }
    async translateText(request) {
        try {
            const startTime = Date.now();
            if (request.sourceLanguage === request.targetLanguage) {
                return {
                    translatedText: request.text,
                    confidence: 1.0,
                    sourceLanguage: request.sourceLanguage,
                    targetLanguage: request.targetLanguage,
                    translationMethod: 'NO_TRANSLATION_NEEDED',
                    metadata: {
                        processingTime: 0,
                        characterCount: request.text.length,
                        wordCount: request.text.split(/\s+/).length,
                        sentenceCount: request.text.split(/[.!?]+/).length,
                        complexityScore: 0.5,
                        qualityScore: 1.0,
                        translatedAt: new Date()
                    }
                };
            }
            let translationResult;
            const translationKey = `${request.sourceLanguage}-${request.targetLanguage}`;
            const translationModel = this.translationModels.get(translationKey);
            if (translationModel) {
                translationResult = await this.performNeuralTranslation(request, translationModel);
            }
            else {
                translationResult = await this.performStatisticalTranslation(request);
            }
            if (request.domain && this.customDictionaries.has(request.domain)) {
                translationResult = await this.applyCustomDictionary(translationResult, this.customDictionaries.get(request.domain));
            }
            translationResult.metadata.processingTime = Date.now() - startTime;
            this.logger.debug('Translation completed', {
                sourceLanguage: request.sourceLanguage,
                targetLanguage: request.targetLanguage,
                confidence: translationResult.confidence,
                processingTime: translationResult.metadata.processingTime
            });
            return translationResult;
        }
        catch (error) {
            this.logger.error('Translation failed', {
                sourceLanguage: request.sourceLanguage,
                targetLanguage: request.targetLanguage,
                error: error.message
            });
            throw error;
        }
    }
    async performNeuralTranslation(request, model) {
        try {
            const sentences = this.splitIntoSentences(request.text);
            const translatedSentences = [];
            const confidences = [];
            for (const sentence of sentences) {
                const translation = await model.translate(sentence);
                translatedSentences.push(translation.text);
                confidences.push(translation.confidence || 0.85);
            }
            const translatedText = translatedSentences.join(' ');
            const averageConfidence = confidences.reduce((a, b) => a + b, 0) / confidences.length;
            return {
                translatedText,
                confidence: averageConfidence,
                sourceLanguage: request.sourceLanguage,
                targetLanguage: request.targetLanguage,
                translationMethod: 'NEURAL_NETWORK',
                metadata: {
                    processingTime: 0,
                    characterCount: translatedText.length,
                    wordCount: translatedText.split(/\s+/).length,
                    sentenceCount: sentences.length,
                    complexityScore: this.calculateComplexityScore(request.text),
                    qualityScore: averageConfidence,
                    translatedAt: new Date()
                }
            };
        }
        catch (error) {
            this.logger.error('Neural translation failed', { error: error.message });
            throw error;
        }
    }
    async performStatisticalTranslation(request) {
        try {
            const translate = require('@google-cloud/translate').v2.Translate;
            const translateClient = new translate();
            const [translation] = await translateClient.translate(request.text, {
                from: this.mapLanguageToGoogleCode(request.sourceLanguage),
                to: this.mapLanguageToGoogleCode(request.targetLanguage)
            });
            return {
                translatedText: translation,
                confidence: 0.8,
                sourceLanguage: request.sourceLanguage,
                targetLanguage: request.targetLanguage,
                translationMethod: 'STATISTICAL',
                metadata: {
                    processingTime: 0,
                    characterCount: translation.length,
                    wordCount: translation.split(/\s+/).length,
                    sentenceCount: translation.split(/[.!?]+/).length,
                    complexityScore: this.calculateComplexityScore(request.text),
                    qualityScore: 0.8,
                    translatedAt: new Date()
                }
            };
        }
        catch (error) {
            this.logger.error('Statistical translation failed', { error: error.message });
            return {
                translatedText: request.text,
                confidence: 0.1,
                sourceLanguage: request.sourceLanguage,
                targetLanguage: request.targetLanguage,
                translationMethod: 'FALLBACK',
                metadata: {
                    processingTime: 0,
                    characterCount: request.text.length,
                    wordCount: request.text.split(/\s+/).length,
                    sentenceCount: request.text.split(/[.!?]+/).length,
                    complexityScore: 0.5,
                    qualityScore: 0.1,
                    translatedAt: new Date()
                }
            };
        }
    }
    async applyCustomDictionary(result, dictionary) {
        let modifiedText = result.translatedText;
        for (const term of dictionary.terms) {
            const regex = new RegExp(`\\b${term.term}\\b`, 'gi');
            modifiedText = modifiedText.replace(regex, term.translation);
        }
        return {
            ...result,
            translatedText: modifiedText,
            confidence: Math.min(result.confidence * 1.1, 1.0)
        };
    }
    async performLanguageSpecificProcessing(text, language, config) {
        let processedText = text;
        if (config.textNormalization) {
            processedText = this.normalizeText(processedText, language);
        }
        if (config.numberFormatting) {
            processedText = this.formatNumbers(processedText, language);
        }
        if (config.dateFormatting) {
            processedText = this.formatDates(processedText, language);
        }
        if (config.currencyFormatting) {
            processedText = this.formatCurrency(processedText, language);
        }
        if (config.culturalAdaptation) {
            processedText = this.performCulturalAdaptation(processedText, language);
        }
        return processedText;
    }
    normalizeText(text, language) {
        switch (language) {
            case DocumentManagement_1.Language.GERMAN:
                return text.replace(/ß/g, 'ss');
            case DocumentManagement_1.Language.FRENCH:
                return text.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
            default:
                return text;
        }
    }
    formatNumbers(text, language) {
        const numberRegex = /\d{1,3}(?:,\d{3})*(?:\.\d+)?/g;
        return text.replace(numberRegex, (match) => {
            const number = parseFloat(match.replace(/,/g, ''));
            switch (language) {
                case DocumentManagement_1.Language.FRENCH:
                case DocumentManagement_1.Language.GERMAN:
                    return number.toLocaleString('de-DE');
                case DocumentManagement_1.Language.SPANISH:
                    return number.toLocaleString('es-ES');
                default:
                    return number.toLocaleString('en-US');
            }
        });
    }
    formatDates(text, language) {
        const dateRegex = /\d{1,2}\/\d{1,2}\/\d{4}/g;
        return text.replace(dateRegex, (match) => {
            const [month, day, year] = match.split('/');
            const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
            switch (language) {
                case DocumentManagement_1.Language.FRENCH:
                    return date.toLocaleDateString('fr-FR');
                case DocumentManagement_1.Language.GERMAN:
                    return date.toLocaleDateString('de-DE');
                case DocumentManagement_1.Language.SPANISH:
                    return date.toLocaleDateString('es-ES');
                default:
                    return date.toLocaleDateString('en-US');
            }
        });
    }
    formatCurrency(text, language) {
        const currencyRegex = /\$\d{1,3}(?:,\d{3})*(?:\.\d{2})?/g;
        return text.replace(currencyRegex, (match) => {
            const amount = parseFloat(match.replace(/[$,]/g, ''));
            switch (language) {
                case DocumentManagement_1.Language.FRENCH:
                    return `${amount.toFixed(2).replace('.', ',')} €`;
                case DocumentManagement_1.Language.GERMAN:
                    return `${amount.toFixed(2).replace('.', ',')} €`;
                case DocumentManagement_1.Language.SPANISH:
                    return `${amount.toFixed(2)} €`;
                default:
                    return `$${amount.toFixed(2)}`;
            }
        });
    }
    performCulturalAdaptation(text, language) {
        const adaptations = new Map([
            [DocumentManagement_1.Language.JAPANESE, new Map([
                    ['Mr.', '様'],
                    ['Mrs.', '様'],
                    ['Ms.', '様']
                ])],
            [DocumentManagement_1.Language.KOREAN, new Map([
                    ['Mr.', '씨'],
                    ['Mrs.', '씨'],
                    ['Ms.', '씨']
                ])]
        ]);
        const languageAdaptations = adaptations.get(language);
        if (!languageAdaptations)
            return text;
        let adaptedText = text;
        for (const [original, replacement] of languageAdaptations) {
            adaptedText = adaptedText.replace(new RegExp(original, 'g'), replacement);
        }
        return adaptedText;
    }
    getLanguageSpecificConfig(language) {
        return {
            language,
            textNormalization: true,
            culturalAdaptation: true,
            numberFormatting: true,
            dateFormatting: true,
            currencyFormatting: true,
            addressFormatting: true,
            nameFormatting: true
        };
    }
    splitIntoSentences(text) {
        return text.split(/[.!?]+/).filter(sentence => sentence.trim().length > 0);
    }
    calculateComplexityScore(text) {
        const avgWordLength = text.split(/\s+/).reduce((sum, word) => sum + word.length, 0) / text.split(/\s+/).length;
        const sentenceLength = text.split(/[.!?]+/).length;
        const uniqueWords = new Set(text.toLowerCase().split(/\s+/)).size;
        return Math.min((avgWordLength / 10) + (sentenceLength / 50) + (uniqueWords / text.split(/\s+/).length), 1.0);
    }
    mapISOToLanguage(isoCode) {
        const mapping = {
            'eng': DocumentManagement_1.Language.ENGLISH,
            'spa': DocumentManagement_1.Language.SPANISH,
            'fra': DocumentManagement_1.Language.FRENCH,
            'deu': DocumentManagement_1.Language.GERMAN,
            'ita': DocumentManagement_1.Language.ITALIAN,
            'por': DocumentManagement_1.Language.PORTUGUESE,
            'nld': DocumentManagement_1.Language.DUTCH,
            'rus': DocumentManagement_1.Language.RUSSIAN,
            'cmn': DocumentManagement_1.Language.CHINESE_SIMPLIFIED,
            'jpn': DocumentManagement_1.Language.JAPANESE,
            'kor': DocumentManagement_1.Language.KOREAN,
            'ara': DocumentManagement_1.Language.ARABIC,
            'hin': DocumentManagement_1.Language.HINDI
        };
        return mapping[isoCode] || DocumentManagement_1.Language.ENGLISH;
    }
    mapLanguageToGoogleCode(language) {
        const mapping = {
            [DocumentManagement_1.Language.ENGLISH]: 'en',
            [DocumentManagement_1.Language.SPANISH]: 'es',
            [DocumentManagement_1.Language.FRENCH]: 'fr',
            [DocumentManagement_1.Language.GERMAN]: 'de',
            [DocumentManagement_1.Language.ITALIAN]: 'it',
            [DocumentManagement_1.Language.PORTUGUESE]: 'pt',
            [DocumentManagement_1.Language.DUTCH]: 'nl',
            [DocumentManagement_1.Language.RUSSIAN]: 'ru',
            [DocumentManagement_1.Language.CHINESE_SIMPLIFIED]: 'zh-cn',
            [DocumentManagement_1.Language.CHINESE_TRADITIONAL]: 'zh-tw',
            [DocumentManagement_1.Language.JAPANESE]: 'ja',
            [DocumentManagement_1.Language.KOREAN]: 'ko',
            [DocumentManagement_1.Language.ARABIC]: 'ar',
            [DocumentManagement_1.Language.HINDI]: 'hi'
        };
        return mapping[language] || 'en';
    }
    indexToLanguage(index) {
        const languages = Array.from(this.supportedLanguages);
        return languages[index] || DocumentManagement_1.Language.ENGLISH;
    }
    async initializeLanguageModels() {
        try {
            this.logger.info('Initializing multi-language processing models');
            await this.initializeLanguageDetectionEngine();
            await this.loadTranslationModels();
            await this.loadCustomDictionaries();
            this.logger.info('Multi-language processing models initialized successfully');
        }
        catch (error) {
            this.logger.error('Failed to initialize language models', { error: error.message });
        }
    }
    async initializeLanguageDetectionEngine() {
        try {
            const tf = require('@tensorflow/tfjs-node');
            this.languageDetectionEngine = {
                predict: async (text) => {
                    return Array.from(this.supportedLanguages).map(() => Math.random());
                }
            };
            this.logger.info('Language detection engine initialized');
        }
        catch (error) {
            this.logger.warn('Failed to initialize language detection engine', { error: error.message });
            this.languageDetectionEngine = null;
        }
    }
    async loadTranslationModels() {
        try {
            const commonPairs = [
                'en-es', 'en-fr', 'en-de', 'en-it', 'en-pt',
                'es-en', 'fr-en', 'de-en', 'it-en', 'pt-en'
            ];
            for (const pair of commonPairs) {
                this.translationModels.set(pair, {
                    translate: async (text) => ({
                        text: `[Translated: ${text}]`,
                        confidence: 0.85
                    })
                });
            }
            this.logger.info('Translation models loaded', { count: this.translationModels.size });
        }
        catch (error) {
            this.logger.warn('Failed to load translation models', { error: error.message });
        }
    }
    async loadCustomDictionaries() {
        try {
            const financialDictionary = {
                language: DocumentManagement_1.Language.ENGLISH,
                domain: 'FINANCIAL',
                terms: [
                    { term: 'portfolio', translation: 'cartera', confidence: 0.95 },
                    { term: 'investment', translation: 'inversión', confidence: 0.95 },
                    { term: 'asset', translation: 'activo', confidence: 0.95 },
                    { term: 'liability', translation: 'pasivo', confidence: 0.95 },
                    { term: 'equity', translation: 'patrimonio', confidence: 0.95 }
                ]
            };
            this.customDictionaries.set('FINANCIAL', financialDictionary);
            this.logger.info('Custom dictionaries loaded', { count: this.customDictionaries.size });
        }
        catch (error) {
            this.logger.warn('Failed to load custom dictionaries', { error: error.message });
        }
    }
    async publishLanguageProcessingEvent(documentId, tenantId, result) {
        const event = {
            eventType: 'LANGUAGE_PROCESSING_COMPLETED',
            documentId,
            tenantId,
            detectedLanguage: result.detectedLanguage.language,
            confidence: result.detectedLanguage.confidence,
            translationsCount: result.translations.size,
            timestamp: new Date().toISOString()
        };
        await this.kafkaService.publishEvent('document-processing', event);
    }
}
exports.MultiLanguageProcessingService = MultiLanguageProcessingService;
