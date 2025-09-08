"use strict";
// Document Parsing Service for Structured Products
// Phase 4.1 - Intelligent OCR with machine learning for term sheet and prospectus processing
Object.defineProperty(exports, "__esModule", { value: true });
exports.DocumentParsingService = void 0;
const logger_1 = require("../../utils/logger");
class DocumentParsingService {
    prisma;
    kafkaService;
    parsingConfig;
    documentTemplates;
    constructor(prisma, kafkaService) {
        this.prisma = prisma;
        this.kafkaService = kafkaService;
        this.parsingConfig = {
            ocrEngine: 'AZURE_COGNITIVE',
            confidenceThreshold: 0.8,
            languageModels: ['en', 'fr', 'de', 'ja'],
            templateMatching: true,
            mlModelVersion: 'v2.1'
        };
        this.documentTemplates = this.initializeTemplates();
    }
    // Parse document and extract structured data
    async parseDocument(documentId, documentPath, documentType, tenantId) {
        try {
            const startTime = Date.now();
            logger_1.logger.info('Starting document parsing', {
                documentId,
                documentType,
                tenantId,
                ocrEngine: this.parsingConfig.ocrEngine
            });
            // Initialize parsing result
            const parsingResult = {
                id: `parse_${documentId}_${Date.now()}`,
                documentId,
                documentType,
                parsingStatus: 'IN_PROGRESS',
                parsingEngine: this.parsingConfig.ocrEngine,
                extractedTerms: {},
                structuredData: {},
                extractionConfidence: {},
                overallConfidence: 0,
                validationErrors: [],
                validationWarnings: [],
                processingStartTime: new Date(startTime),
                requiresReview: false,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            try {
                // Step 1: OCR Processing
                const ocrText = await this.performOCR(documentPath, documentType);
                // Step 2: Text preprocessing
                const preprocessedText = await this.preprocessText(ocrText);
                // Step 3: Template matching and field extraction
                const extractedTerms = await this.extractTerms(preprocessedText, documentType);
                // Step 4: Machine learning enhancement
                const enhancedTerms = await this.enhanceWithML(extractedTerms, preprocessedText, documentType);
                // Step 5: Data validation and confidence scoring
                const validationResults = await this.validateExtractedData(enhancedTerms);
                // Step 6: Convert to structured product format
                const structuredData = await this.convertToStructuredProduct(enhancedTerms, tenantId);
                // Calculate overall confidence
                const confidenceScores = Object.values(validationResults.confidence);
                const overallConfidence = confidenceScores.length > 0
                    ? confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length
                    : 0;
                // Update parsing result
                parsingResult.parsingStatus = 'COMPLETED';
                parsingResult.extractedTerms = enhancedTerms;
                parsingResult.structuredData = structuredData;
                parsingResult.extractionConfidence = validationResults.confidence;
                parsingResult.overallConfidence = overallConfidence;
                parsingResult.validationErrors = validationResults.errors;
                parsingResult.validationWarnings = validationResults.warnings;
                parsingResult.processingEndTime = new Date();
                parsingResult.processingDuration = Date.now() - startTime;
                parsingResult.requiresReview = overallConfidence < this.parsingConfig.confidenceThreshold ||
                    validationResults.errors.length > 0;
                // Store parsing result
                await this.storeParsingResult(parsingResult);
                // Publish parsing event
                await this.publishParsingEvent(parsingResult);
                logger_1.logger.info('Document parsing completed', {
                    documentId,
                    overallConfidence,
                    requiresReview: parsingResult.requiresReview,
                    processingDuration: parsingResult.processingDuration
                });
                return parsingResult;
            }
            catch (error) {
                parsingResult.parsingStatus = 'FAILED';
                parsingResult.processingEndTime = new Date();
                parsingResult.processingDuration = Date.now() - startTime;
                parsingResult.validationErrors.push({
                    field: 'general',
                    errorType: 'PARSING_FAILED',
                    message: `Document parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
                    severity: 'ERROR'
                });
                await this.storeParsingResult(parsingResult);
                throw error;
            }
        }
        catch (error) {
            logger_1.logger.error('Error in document parsing:', error);
            throw error;
        }
    }
    // Perform OCR on document
    async performOCR(documentPath, documentType) {
        try {
            logger_1.logger.debug('Performing OCR', {
                documentPath,
                engine: this.parsingConfig.ocrEngine
            });
            // In a real implementation, this would integrate with actual OCR services
            switch (this.parsingConfig.ocrEngine) {
                case 'AZURE_COGNITIVE':
                    return await this.performAzureOCR(documentPath);
                case 'AWS_TEXTRACT':
                    return await this.performAWSTextract(documentPath);
                case 'GOOGLE_VISION':
                    return await this.performGoogleVisionOCR(documentPath);
                case 'TESSERACT':
                    return await this.performTesseractOCR(documentPath);
                default:
                    throw new Error(`Unsupported OCR engine: ${this.parsingConfig.ocrEngine}`);
            }
        }
        catch (error) {
            logger_1.logger.error('OCR processing failed:', error);
            throw error;
        }
    }
    // Mock OCR implementations (in production, these would call actual services)
    async performAzureOCR(documentPath) {
        // Mock extracted text from a structured note term sheet
        return `
      STRUCTURED NOTE TERM SHEET
      
      Issuer: Goldman Sachs Bank USA
      CUSIP: 38141GXX1
      
      Product Name: Equity Linked Note on Apple Inc.
      Underlying Asset: Apple Inc. (AAPL)
      
      Principal Amount: $1,000,000
      Minimum Investment: $10,000
      Currency: USD
      
      Issue Date: January 15, 2024
      Maturity Date: January 15, 2026
      
      Payoff: 100% participation in the positive performance of AAPL
      Formula: max(0, Participation Rate × (Final Level / Initial Level - 1))
      Participation Rate: 100%
      
      Barrier Features:
      - Knock-Out Barrier: 70% of Initial Level
      - Observation: Daily American Style
      - Barrier Level: $98.00
      
      Capital Protection: None
      
      Initial Level: $140.00 (closing price on Issue Date)
      
      Credit Rating: A+ (S&P)
      
      Risk Factors:
      - Market risk of underlying asset
      - Credit risk of issuer
      - Barrier risk - early termination if barrier is hit
      - Liquidity risk in secondary market
    `;
    }
    async performAWSTextract(documentPath) {
        // Mock implementation
        return await this.performAzureOCR(documentPath);
    }
    async performGoogleVisionOCR(documentPath) {
        // Mock implementation
        return await this.performAzureOCR(documentPath);
    }
    async performTesseractOCR(documentPath) {
        // Mock implementation with lower quality
        return await this.performAzureOCR(documentPath);
    }
    // Preprocess extracted text
    async preprocessText(rawText) {
        // Clean up common OCR errors
        let cleanedText = rawText
            .replace(/[^\w\s\.\,\:\;\(\)\[\]\-\%\$]/g, '') // Remove special characters
            .replace(/\s+/g, ' ') // Normalize whitespace
            .replace(/(\d)\s+(\d)/g, '$1$2') // Fix split numbers
            .replace(/([A-Z])\s+([A-Z])/g, '$1$2') // Fix split acronyms
            .trim();
        // Normalize financial terms
        cleanedText = cleanedText
            .replace(/\$\s*(\d)/g, '$$$1') // Fix currency formatting
            .replace(/(\d+)\s*%/g, '$1%') // Fix percentage formatting
            .replace(/(\d+)\s*,\s*(\d+)/g, '$1,$2'); // Fix number formatting
        return cleanedText;
    }
    // Extract terms using template matching
    async extractTerms(text, documentType) {
        const template = this.documentTemplates.get(documentType);
        if (!template) {
            throw new Error(`No template found for document type: ${documentType}`);
        }
        const extractedTerms = {
            rawSections: {}
        };
        // Extract fields based on template patterns
        for (const [fieldName, pattern] of Object.entries(template.patterns)) {
            try {
                const extractedValue = await this.extractField(text, fieldName, pattern);
                if (extractedValue !== null) {
                    this.setNestedValue(extractedTerms, fieldName, extractedValue);
                }
            }
            catch (error) {
                logger_1.logger.warn('Failed to extract field', { fieldName, error });
            }
        }
        // Extract raw sections for reference
        extractedTerms.rawSections = this.extractSections(text);
        return extractedTerms;
    }
    // Extract individual field using pattern matching
    async extractField(text, fieldName, pattern) {
        let bestMatch = null;
        let bestConfidence = 0;
        // Try regex patterns
        for (const regex of pattern.regex) {
            const matches = text.match(regex);
            if (matches && matches.length > 1) {
                bestMatch = matches[1].trim();
                bestConfidence = Math.max(bestConfidence, 0.8);
                break;
            }
        }
        // Try keyword-based extraction if regex fails
        if (!bestMatch && pattern.keywords.length > 0) {
            for (const keyword of pattern.keywords) {
                const keywordIndex = text.toLowerCase().indexOf(keyword.toLowerCase());
                if (keywordIndex !== -1) {
                    // Extract value after keyword
                    const afterKeyword = text.substring(keywordIndex + keyword.length);
                    const valueMatch = afterKeyword.match(/:\s*([^\n\r]+)/);
                    if (valueMatch) {
                        bestMatch = valueMatch[1].trim();
                        bestConfidence = Math.max(bestConfidence, 0.6);
                        break;
                    }
                }
            }
        }
        if (bestMatch) {
            return this.convertDataType(bestMatch, pattern.dataType);
        }
        return null;
    }
    // Convert extracted string to appropriate data type
    convertDataType(value, dataType) {
        try {
            switch (dataType) {
                case 'number':
                    const numStr = value.replace(/[^\d\.\-]/g, '');
                    return parseFloat(numStr);
                case 'percentage':
                    const pctStr = value.replace(/[^\d\.\-]/g, '');
                    return parseFloat(pctStr);
                case 'currency':
                    const currStr = value.replace(/[^\d\.\-]/g, '');
                    return parseFloat(currStr);
                case 'date':
                    return new Date(value);
                case 'array':
                    return value.split(/[,;]/).map(item => item.trim());
                case 'string':
                default:
                    return value;
            }
        }
        catch (error) {
            logger_1.logger.warn('Data type conversion failed', { value, dataType, error });
            return value;
        }
    }
    // Set nested value in object
    setNestedValue(obj, path, value) {
        const keys = path.split('.');
        let current = obj;
        for (let i = 0; i < keys.length - 1; i++) {
            if (!(keys[i] in current)) {
                current[keys[i]] = {};
            }
            current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
    }
    // Extract document sections
    extractSections(text) {
        const sections = {};
        // Common section headers
        const sectionHeaders = [
            'PRODUCT DESCRIPTION',
            'UNDERLYING ASSET',
            'PAYOFF STRUCTURE',
            'BARRIER FEATURES',
            'RISK FACTORS',
            'TERMS AND CONDITIONS',
            'SETTLEMENT',
            'TAXATION'
        ];
        for (let i = 0; i < sectionHeaders.length; i++) {
            const currentHeader = sectionHeaders[i];
            const nextHeader = sectionHeaders[i + 1];
            const startIndex = text.indexOf(currentHeader);
            if (startIndex !== -1) {
                let endIndex = text.length;
                if (nextHeader) {
                    const nextIndex = text.indexOf(nextHeader, startIndex + 1);
                    if (nextIndex !== -1) {
                        endIndex = nextIndex;
                    }
                }
                sections[currentHeader] = text.substring(startIndex + currentHeader.length, endIndex).trim();
            }
        }
        return sections;
    }
    // Enhance extraction with machine learning models
    async enhanceWithML(extractedTerms, fullText, documentType) {
        try {
            // In a real implementation, this would call ML models for:
            // - Named Entity Recognition (NER)
            // - Financial term classification
            // - Confidence scoring
            // - Missing field prediction
            const enhancedTerms = { ...extractedTerms };
            // Mock ML enhancements
            if (!enhancedTerms.payoffDescription && fullText.includes('participation')) {
                enhancedTerms.payoffDescription = 'Participation in underlying performance';
            }
            if (!enhancedTerms.riskFactors) {
                enhancedTerms.riskFactors = this.extractRiskFactors(fullText);
            }
            // Classify product type based on content
            if (!enhancedTerms.productName) {
                const productType = this.classifyProductType(fullText);
                enhancedTerms.productName = `${productType} Note`;
            }
            return enhancedTerms;
        }
        catch (error) {
            logger_1.logger.warn('ML enhancement failed, returning original terms:', error);
            return extractedTerms;
        }
    }
    // Extract risk factors using NLP
    extractRiskFactors(text) {
        const riskKeywords = [
            'market risk',
            'credit risk',
            'liquidity risk',
            'barrier risk',
            'interest rate risk',
            'currency risk',
            'early termination',
            'issuer default',
            'regulatory risk'
        ];
        const foundRisks = [];
        const lowerText = text.toLowerCase();
        for (const risk of riskKeywords) {
            if (lowerText.includes(risk)) {
                foundRisks.push(risk.charAt(0).toUpperCase() + risk.slice(1));
            }
        }
        return foundRisks;
    }
    // Classify product type based on content
    classifyProductType(text) {
        const lowerText = text.toLowerCase();
        if (lowerText.includes('barrier') || lowerText.includes('knock')) {
            return 'Barrier';
        }
        else if (lowerText.includes('autocall')) {
            return 'Autocallable';
        }
        else if (lowerText.includes('reverse convertible')) {
            return 'Reverse Convertible';
        }
        else if (lowerText.includes('participation')) {
            return 'Participation';
        }
        else {
            return 'Structured';
        }
    }
    // Validate extracted data
    async validateExtractedData(extractedTerms) {
        const confidence = {};
        const errors = [];
        const warnings = [];
        // Validate required fields
        const requiredFields = [
            'productName',
            'issuer',
            'notionalAmount',
            'currency',
            'issueDate',
            'maturityDate'
        ];
        for (const field of requiredFields) {
            const value = this.getNestedValue(extractedTerms, field);
            if (value === undefined || value === null) {
                errors.push({
                    field,
                    errorType: 'MISSING_REQUIRED_FIELD',
                    message: `Required field '${field}' is missing`,
                    severity: 'ERROR'
                });
                confidence[field] = 0;
            }
            else {
                confidence[field] = 0.9;
            }
        }
        // Validate data types and ranges
        if (extractedTerms.notionalAmount !== undefined) {
            if (extractedTerms.notionalAmount <= 0) {
                errors.push({
                    field: 'notionalAmount',
                    errorType: 'INVALID_VALUE',
                    message: 'Notional amount must be positive',
                    severity: 'ERROR'
                });
            }
            else {
                confidence['notionalAmount'] = 0.95;
            }
        }
        // Validate dates
        if (extractedTerms.issueDate && extractedTerms.maturityDate) {
            if (extractedTerms.issueDate >= extractedTerms.maturityDate) {
                errors.push({
                    field: 'maturityDate',
                    errorType: 'INVALID_DATE_RANGE',
                    message: 'Maturity date must be after issue date',
                    severity: 'ERROR'
                });
            }
            else {
                confidence['issueDate'] = 0.9;
                confidence['maturityDate'] = 0.9;
            }
        }
        // Validate barriers
        if (extractedTerms.barriers) {
            for (const barrier of extractedTerms.barriers) {
                if (barrier.level <= 0 || barrier.level > 2) {
                    warnings.push({
                        field: 'barriers',
                        warningType: 'UNUSUAL_VALUE',
                        message: `Barrier level ${barrier.level} seems unusual`,
                        impact: 'May indicate parsing error'
                    });
                }
            }
            confidence['barriers'] = 0.8;
        }
        return { confidence, errors, warnings };
    }
    // Get nested value from object
    getNestedValue(obj, path) {
        const keys = path.split('.');
        let current = obj;
        for (const key of keys) {
            if (current && typeof current === 'object' && key in current) {
                current = current[key];
            }
            else {
                return undefined;
            }
        }
        return current;
    }
    // Convert extracted terms to structured product format
    async convertToStructuredProduct(extractedTerms, tenantId) {
        const structuredData = {
            tenantId,
            productName: extractedTerms.productName || 'Untitled Structured Product',
            issuer: extractedTerms.issuer || 'Unknown Issuer',
            cusip: extractedTerms.cusip,
            isin: extractedTerms.isin,
            notionalAmount: extractedTerms.notionalAmount || 0,
            currency: extractedTerms.currency || 'USD',
            issueDate: extractedTerms.issueDate || new Date(),
            maturityDate: extractedTerms.maturityDate || new Date(),
            minInvestment: extractedTerms.minInvestment || 1000,
            // Map payoff type
            payoffType: this.mapPayoffType(extractedTerms.payoffDescription),
            payoffFormula: this.generatePayoffFormula(extractedTerms),
            payoffParameters: this.extractPayoffParameters(extractedTerms),
            // Map underlying type and assets
            underlyingType: this.determineUnderlyingType(extractedTerms.underlyingAssets),
            underlyingAssets: this.mapUnderlyingAssets(extractedTerms.underlyingAssets),
            // Map barriers
            hasBarrier: extractedTerms.barriers ? extractedTerms.barriers.length > 0 : false,
            barriers: this.mapBarriers(extractedTerms.barriers),
            // Other features
            hasCoupon: extractedTerms.couponRate !== undefined,
            isCallable: extractedTerms.callFeatures !== undefined,
            isPutable: false, // Would need to parse put features
            hasCapitalProtection: extractedTerms.capitalProtection !== undefined,
            protectionLevel: extractedTerms.capitalProtection,
            settlementType: 'CASH',
            settlementDays: 3,
            riskFactors: extractedTerms.riskFactors || [],
            creditRating: extractedTerms.creditRating,
            status: 'DRAFT',
            isActive: true
        };
        return structuredData;
    }
    // Map payoff description to payoff type
    mapPayoffType(description) {
        if (!description)
            return 'PARTICIPATION';
        const lowerDesc = description.toLowerCase();
        if (lowerDesc.includes('participation'))
            return 'PARTICIPATION';
        if (lowerDesc.includes('leverage'))
            return 'LEVERAGED';
        if (lowerDesc.includes('cap'))
            return 'CAPPED';
        if (lowerDesc.includes('digital'))
            return 'DIGITAL';
        if (lowerDesc.includes('fixed'))
            return 'FIXED_COUPON';
        return 'PARTICIPATION';
    }
    // Generate payoff formula
    generatePayoffFormula(extractedTerms) {
        const participation = extractedTerms.participationRate || 1.0;
        if (extractedTerms.cap) {
            return `min(${extractedTerms.cap}, max(0, ${participation} * (finalLevel / initialLevel - 1)))`;
        }
        else {
            return `max(0, ${participation} * (finalLevel / initialLevel - 1))`;
        }
    }
    // Extract payoff parameters
    extractPayoffParameters(extractedTerms) {
        const parameters = {};
        if (extractedTerms.participationRate) {
            parameters.participation = extractedTerms.participationRate;
        }
        if (extractedTerms.leverage) {
            parameters.leverage = extractedTerms.leverage;
        }
        if (extractedTerms.cap) {
            parameters.cap = extractedTerms.cap;
        }
        if (extractedTerms.floor) {
            parameters.floor = extractedTerms.floor;
        }
        return parameters;
    }
    // Determine underlying type
    determineUnderlyingType(underlyingAssets) {
        if (!underlyingAssets || underlyingAssets.length === 0) {
            return 'SINGLE_STOCK';
        }
        if (underlyingAssets.length === 1) {
            return 'SINGLE_STOCK';
        }
        else {
            return 'BASKET';
        }
    }
    // Map underlying assets
    mapUnderlyingAssets(underlyingAssets) {
        if (!underlyingAssets)
            return [];
        return underlyingAssets.map((asset, index) => ({
            id: `underlying_${index + 1}`,
            symbol: asset.symbol || 'UNKNOWN',
            name: asset.name || asset.symbol || 'Unknown Asset',
            assetType: 'EQUITY',
            weight: asset.weight || (100 / underlyingAssets.length),
            initialLevel: asset.initialLevel
        }));
    }
    // Map barriers
    mapBarriers(barriers) {
        if (!barriers)
            return [];
        return barriers.map((barrier, index) => ({
            id: `barrier_${index + 1}`,
            barrierType: this.mapBarrierType(barrier.type),
            level: barrier.level,
            observationFrequency: this.mapObservationFrequency(barrier.observationFrequency),
            observationStartDate: new Date(),
            observationEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
            isAmerican: true,
            isActive: true,
            hasBeenHit: false
        }));
    }
    // Map barrier type
    mapBarrierType(type) {
        if (!type)
            return 'DOWN_AND_OUT';
        const lowerType = type.toLowerCase();
        if (lowerType.includes('knock-out') || lowerType.includes('knock out')) {
            return 'DOWN_AND_OUT';
        }
        if (lowerType.includes('knock-in') || lowerType.includes('knock in')) {
            return 'DOWN_AND_IN';
        }
        if (lowerType.includes('up') && lowerType.includes('out')) {
            return 'UP_AND_OUT';
        }
        if (lowerType.includes('up') && lowerType.includes('in')) {
            return 'UP_AND_IN';
        }
        return 'DOWN_AND_OUT';
    }
    // Map observation frequency
    mapObservationFrequency(frequency) {
        if (!frequency)
            return 'DAILY';
        const lowerFreq = frequency.toLowerCase();
        if (lowerFreq.includes('daily'))
            return 'DAILY';
        if (lowerFreq.includes('weekly'))
            return 'WEEKLY';
        if (lowerFreq.includes('monthly'))
            return 'MONTHLY';
        if (lowerFreq.includes('quarterly'))
            return 'QUARTERLY';
        if (lowerFreq.includes('maturity'))
            return 'MATURITY_ONLY';
        return 'DAILY';
    }
    // Initialize document templates
    initializeTemplates() {
        const templates = new Map();
        // Term Sheet Template
        templates.set('TERM_SHEET', {
            documentType: 'TERM_SHEET',
            patterns: {
                'productName': {
                    regex: [
                        /Product Name:\s*([^\n\r]+)/i,
                        /Structured Note:\s*([^\n\r]+)/i,
                        /Note Name:\s*([^\n\r]+)/i
                    ],
                    keywords: ['Product Name', 'Note Name', 'Structured Note'],
                    context: ['term sheet', 'product'],
                    required: true,
                    dataType: 'string'
                },
                'issuer': {
                    regex: [
                        /Issuer:\s*([^\n\r]+)/i,
                        /Issued by:\s*([^\n\r]+)/i
                    ],
                    keywords: ['Issuer', 'Issued by'],
                    context: ['issuer', 'bank'],
                    required: true,
                    dataType: 'string'
                },
                'cusip': {
                    regex: [
                        /CUSIP:\s*([A-Z0-9]{9})/i,
                        /CUSIP No\.:\s*([A-Z0-9]{9})/i
                    ],
                    keywords: ['CUSIP'],
                    context: ['identifier'],
                    required: false,
                    dataType: 'string'
                },
                'notionalAmount': {
                    regex: [
                        /Principal Amount:\s*\$?([\d,]+)/i,
                        /Notional Amount:\s*\$?([\d,]+)/i,
                        /Amount:\s*\$?([\d,]+)/i
                    ],
                    keywords: ['Principal Amount', 'Notional Amount', 'Amount'],
                    context: ['principal', 'notional'],
                    required: true,
                    dataType: 'currency'
                },
                'participationRate': {
                    regex: [
                        /Participation Rate:\s*([\d.]+)%?/i,
                        /Upside Participation:\s*([\d.]+)%?/i
                    ],
                    keywords: ['Participation Rate', 'Upside Participation'],
                    context: ['participation', 'upside'],
                    required: false,
                    dataType: 'percentage'
                }
            }
        });
        return templates;
    }
    // Store parsing result
    async storeParsingResult(result) {
        try {
            // In a real implementation, this would store in database
            logger_1.logger.debug('Storing parsing result', {
                documentId: result.documentId,
                overallConfidence: result.overallConfidence,
                requiresReview: result.requiresReview
            });
        }
        catch (error) {
            logger_1.logger.error('Error storing parsing result:', error);
        }
    }
    // Publish parsing event
    async publishParsingEvent(result) {
        try {
            await this.kafkaService.publishEvent('structured-products.document.parsed', {
                documentId: result.documentId,
                documentType: result.documentType,
                parsingStatus: result.parsingStatus,
                overallConfidence: result.overallConfidence,
                requiresReview: result.requiresReview,
                processingDuration: result.processingDuration
            });
        }
        catch (error) {
            logger_1.logger.error('Error publishing parsing event:', error);
        }
    }
    // Batch process multiple documents
    async batchParseDocuments(documents, tenantId) {
        try {
            logger_1.logger.info('Starting batch document parsing', {
                documentCount: documents.length,
                tenantId
            });
            const results = await Promise.all(documents.map(doc => this.parseDocument(doc.documentId, doc.documentPath, doc.documentType, tenantId)));
            const successCount = results.filter(r => r.parsingStatus === 'COMPLETED').length;
            const reviewCount = results.filter(r => r.requiresReview).length;
            logger_1.logger.info('Batch document parsing completed', {
                totalDocuments: documents.length,
                successfulParses: successCount,
                requireReview: reviewCount
            });
            return results;
        }
        catch (error) {
            logger_1.logger.error('Error in batch document parsing:', error);
            throw error;
        }
    }
    // Get parsing result by document ID
    async getParsingResult(documentId) {
        try {
            // In a real implementation, this would query the database
            logger_1.logger.debug('Retrieving parsing result', { documentId });
            return null; // Placeholder
        }
        catch (error) {
            logger_1.logger.error('Error retrieving parsing result:', error);
            return null;
        }
    }
    // Human review and correction
    async reviewAndCorrect(parsingResultId, corrections, reviewerId) {
        try {
            logger_1.logger.info('Processing human review corrections', {
                parsingResultId,
                reviewerId,
                correctionCount: Object.keys(corrections).length
            });
            // In a real implementation, this would:
            // 1. Load the original parsing result
            // 2. Apply human corrections
            // 3. Recalculate confidence scores
            // 4. Update the parsing result
            // 5. Trigger reprocessing if needed
            const updatedResult = {
                id: parsingResultId,
                documentId: 'doc_001',
                documentType: 'TERM_SHEET',
                parsingStatus: 'COMPLETED',
                parsingEngine: this.parsingConfig.ocrEngine,
                extractedTerms: corrections,
                structuredData: {},
                extractionConfidence: {},
                overallConfidence: 0.95, // Higher confidence after human review
                validationErrors: [],
                validationWarnings: [],
                processingStartTime: new Date(),
                processingEndTime: new Date(),
                processingDuration: 1000,
                requiresReview: false,
                reviewedBy: reviewerId,
                reviewedAt: new Date(),
                reviewNotes: 'Human review completed with corrections',
                createdAt: new Date(),
                updatedAt: new Date()
            };
            await this.storeParsingResult(updatedResult);
            await this.publishParsingEvent(updatedResult);
            return updatedResult;
        }
        catch (error) {
            logger_1.logger.error('Error processing review corrections:', error);
            throw error;
        }
    }
}
exports.DocumentParsingService = DocumentParsingService;
