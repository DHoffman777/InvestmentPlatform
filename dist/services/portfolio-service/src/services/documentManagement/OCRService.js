"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OCRService = void 0;
const DocumentManagement_1 = require("../../models/documentManagement/DocumentManagement");
class OCRService {
    prisma;
    logger;
    kafkaService;
    mlModels;
    supportedLanguages;
    processingQueue;
    constructor(prisma, logger, kafkaService) {
        this.prisma = prisma;
        this.logger = logger;
        this.kafkaService = kafkaService;
        this.mlModels = new Map();
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
        this.processingQueue = new Map();
        this.initializeMLModels();
    }
    async performOCR(request) {
        try {
            this.logger.info('Starting OCR processing', {
                documentId: request.documentId,
                engine: request.ocrEngine,
                language: request.language
            });
            const startTime = Date.now();
            const job = await this.createProcessingJob(request);
            this.processingQueue.set(request.documentId, job);
            await this.updateJobStatus(job.id, DocumentManagement_1.ProcessingStatus.IN_PROGRESS);
            const document = await this.getDocument(request.documentId, request.tenantId);
            if (!document) {
                throw new Error(`Document not found: ${request.documentId}`);
            }
            let preprocessedFilePath = request.filePath;
            if (request.enablePreprocessing) {
                preprocessedFilePath = await this.preprocessImage(request.filePath, request.preprocessingOptions);
            }
            const ocrResults = [];
            const pageCount = document.pageCount || 1;
            for (let pageNumber = 1; pageNumber <= pageCount; pageNumber++) {
                const pageResult = await this.processPage(preprocessedFilePath, pageNumber, request);
                ocrResults.push(pageResult);
                await this.updateJobProgress(job.id, (pageNumber / pageCount) * 80);
            }
            if (request.enablePostProcessing) {
                for (const result of ocrResults) {
                    await this.postprocessOCRResult(result, request.postprocessingOptions);
                }
            }
            await this.storeOCRResults(ocrResults);
            await this.updateJobStatus(job.id, DocumentManagement_1.ProcessingStatus.COMPLETED, { results: ocrResults });
            const processingTime = Date.now() - startTime;
            this.logger.info('OCR processing completed', {
                documentId: request.documentId,
                pages: ocrResults.length,
                processingTime
            });
            await this.publishOCRCompletedEvent(request.documentId, request.tenantId, ocrResults);
            this.processingQueue.delete(request.documentId);
            return ocrResults;
        }
        catch (error) {
            this.logger.error('OCR processing failed', {
                documentId: request.documentId,
                error: error instanceof Error ? error.message : 'Unknown error',
                stack: error.stack
            });
            const job = this.processingQueue.get(request.documentId);
            if (job) {
                await this.updateJobStatus(job.id, DocumentManagement_1.ProcessingStatus.FAILED, { error: error instanceof Error ? error.message : 'Unknown error' });
                this.processingQueue.delete(request.documentId);
            }
            throw error;
        }
    }
    async processPage(filePath, pageNumber, request) {
        const startTime = Date.now();
        let ocrResult;
        switch (request.ocrEngine) {
            case 'TESSERACT':
                ocrResult = await this.processTesseractOCR(filePath, pageNumber, request);
                break;
            case 'AWS_TEXTRACT':
                ocrResult = await this.processAWSTextract(filePath, pageNumber, request);
                break;
            case 'GOOGLE_VISION':
                ocrResult = await this.processGoogleVision(filePath, pageNumber, request);
                break;
            case 'AZURE_COGNITIVE':
                ocrResult = await this.processAzureCognitive(filePath, pageNumber, request);
                break;
            case 'CUSTOM_ML':
                ocrResult = await this.processCustomML(filePath, pageNumber, request);
                break;
            default:
                throw new Error(`Unsupported OCR engine: ${request.ocrEngine}`);
        }
        ocrResult.processingTime = Date.now() - startTime;
        return ocrResult;
    }
    async processTesseractOCR(filePath, pageNumber, request) {
        try {
            const tesseract = require('tesseract.js');
            const worker = await tesseract.createWorker({
                logger: (m) => this.logger.debug('Tesseract:', m)
            });
            const language = this.mapToTesseractLanguage(request.language || DocumentManagement_1.Language.ENGLISH);
            await worker.loadLanguage(language);
            await worker.initialize(language);
            await worker.setParameters({
                tessedit_pageseg_mode: tesseract.PSM.AUTO,
                tessedit_ocr_engine_mode: tesseract.OEM.LSTM_ONLY
            });
            const { data } = await worker.recognize(filePath);
            await worker.terminate();
            return this.convertTesseractToOCRResult(data, request.documentId, pageNumber, language);
        }
        catch (error) {
            this.logger.error('Tesseract OCR failed', {
                filePath,
                pageNumber,
                error: error.message
            });
            throw error;
        }
    }
    async processAWSTextract(filePath, pageNumber, request) {
        try {
            const AWS = require('aws-sdk');
            const fs = require('fs');
            const textract = new AWS.Textract();
            const imageBytes = fs.readFileSync(filePath);
            const params = {
                Document: {
                    Bytes: imageBytes
                },
                FeatureTypes: ['TABLES', 'FORMS']
            };
            const result = await textract.analyzeDocument(params).promise();
            return this.convertTextractToOCRResult(result, request.documentId, pageNumber);
        }
        catch (error) {
            this.logger.error('AWS Textract OCR failed', {
                filePath,
                pageNumber,
                error: error.message
            });
            throw error;
        }
    }
    async processGoogleVision(filePath, pageNumber, request) {
        try {
            const vision = require('@google-cloud/vision');
            const fs = require('fs');
            const client = new vision.ImageAnnotatorClient();
            const imageBuffer = fs.readFileSync(filePath);
            const [result] = await client.textDetection({
                image: { content: imageBuffer },
                imageContext: {
                    languageHints: [request.language || DocumentManagement_1.Language.ENGLISH]
                }
            });
            return this.convertGoogleVisionToOCRResult(result, request.documentId, pageNumber);
        }
        catch (error) {
            this.logger.error('Google Vision OCR failed', {
                filePath,
                pageNumber,
                error: error.message
            });
            throw error;
        }
    }
    async processAzureCognitive(filePath, pageNumber, request) {
        try {
            const { ComputerVisionClient } = require('@azure/cognitiveservices-computervision');
            const { ApiKeyCredentials } = require('@azure/ms-rest-js');
            const fs = require('fs');
            const key = process.env.AZURE_COGNITIVE_SERVICES_KEY;
            const endpoint = process.env.AZURE_COGNITIVE_SERVICES_ENDPOINT;
            const cognitiveServiceCredentials = new ApiKeyCredentials({
                inHeader: { 'Ocp-Apim-Subscription-Key': key }
            });
            const client = new ComputerVisionClient(cognitiveServiceCredentials, endpoint);
            const imageBuffer = fs.readFileSync(filePath);
            const result = await client.readInStream(imageBuffer, {
                language: request.language || DocumentManagement_1.Language.ENGLISH
            });
            return this.convertAzureCognitiveToOCRResult(result, request.documentId, pageNumber);
        }
        catch (error) {
            this.logger.error('Azure Cognitive OCR failed', {
                filePath,
                pageNumber,
                error: error.message
            });
            throw error;
        }
    }
    async processCustomML(filePath, pageNumber, request) {
        try {
            const modelConfig = this.mlModels.get('default') || this.mlModels.values().next().value;
            if (!modelConfig) {
                throw new Error('No ML model configured');
            }
            const tf = require('@tensorflow/tfjs-node');
            const sharp = require('sharp');
            const model = await tf.loadLayersModel(`file://${modelConfig.modelPath}`);
            const imageBuffer = await sharp(filePath)
                .resize(224, 224)
                .grayscale()
                .raw()
                .toBuffer();
            const tensor = tf.tensor4d(Array.from(imageBuffer).map((x) => x / 255.0), [1, 224, 224, 1]);
            const predictions = await model.predict(tensor);
            const predictionData = await predictions.data();
            return this.convertMLPredictionToOCRResult(predictionData, request.documentId, pageNumber, modelConfig);
        }
        catch (error) {
            this.logger.error('Custom ML OCR failed', {
                filePath,
                pageNumber,
                error: error.message
            });
            throw error;
        }
    }
    async preprocessImage(filePath, options) {
        try {
            const sharp = require('sharp');
            const path = require('path');
            let pipeline = sharp(filePath);
            if (options?.deskew) {
                pipeline = pipeline.rotate();
            }
            if (options?.denoise) {
                pipeline = pipeline.median(3);
            }
            if (options?.enhanceContrast) {
                pipeline = pipeline.normalize();
            }
            if (options?.removeBackground) {
                pipeline = pipeline.threshold(128);
            }
            if (options?.sharpen) {
                pipeline = pipeline.sharpen();
            }
            if (options?.binarize) {
                pipeline = pipeline.threshold(128, { grayscale: false });
            }
            if (options?.scaleImage && options?.targetDPI) {
                const density = options.targetDPI;
                pipeline = pipeline.withMetadata({ density });
            }
            const processedPath = path.join(path.dirname(filePath), `preprocessed_${path.basename(filePath)}`);
            await pipeline.toFile(processedPath);
            return processedPath;
        }
        catch (error) {
            this.logger.error('Image preprocessing failed', {
                filePath,
                error: error.message
            });
            throw error;
        }
    }
    async postprocessOCRResult(result, options) {
        try {
            if (options?.spellCheck) {
                result.text = await this.performSpellCheck(result.text, result.language);
            }
            if (options?.languageModel) {
                result.text = await this.applyLanguageModel(result.text, result.language);
            }
            if (options?.contextualCorrection) {
                result.text = await this.performContextualCorrection(result.text);
            }
            if (options?.confidenceFiltering) {
                result.words = result.words.filter(word => word.confidence >= (options.minWordConfidence || 0.5));
                result.lines = result.lines.filter(line => line.confidence >= (options.minLineConfidence || 0.5));
            }
            if (options?.removeNoiseCharacters) {
                result.text = this.removeNoiseCharacters(result.text);
            }
            if (options?.formatText) {
                result.text = this.formatText(result.text);
            }
            result.confidence = this.recalculateConfidence(result);
        }
        catch (error) {
            this.logger.error('OCR postprocessing failed', {
                documentId: result.documentId,
                error: error.message
            });
            throw error;
        }
    }
    async performSpellCheck(text, language) {
        try {
            const Spellchecker = require('spellchecker');
            const words = text.split(/\s+/);
            const correctedWords = words.map(word => {
                if (Spellchecker.isMisspelled(word)) {
                    const corrections = Spellchecker.getCorrectionsForMisspelling(word);
                    return corrections.length > 0 ? corrections[0] : word;
                }
                return word;
            });
            return correctedWords.join(' ');
        }
        catch (error) {
            this.logger.warn('Spell check failed', { error: error instanceof Error ? error.message : 'Unknown error' });
            return text;
        }
    }
    async applyLanguageModel(text, language) {
        try {
            const natural = require('natural');
            const tokenizer = new natural.WordTokenizer();
            const tokens = tokenizer.tokenize(text);
            return tokens.join(' ');
        }
        catch (error) {
            this.logger.warn('Language model application failed', { error: error instanceof Error ? error.message : 'Unknown error' });
            return text;
        }
    }
    async performContextualCorrection(text) {
        const corrections = new Map([
            ['rn', 'm'],
            ['vv', 'w'],
            ['nn', 'n'],
            ['cl', 'd'],
            ['0', 'o'],
            ['1', 'l'],
            ['5', 's']
        ]);
        let correctedText = text;
        corrections.forEach((replacement, pattern) => {
            correctedText = correctedText.replace(new RegExp(pattern, 'gi'), replacement);
        });
        return correctedText;
    }
    removeNoiseCharacters(text) {
        return text.replace(/[^\w\s\.\,\;\:\!\?\-\(\)]/g, '');
    }
    formatText(text) {
        return text
            .replace(/\s+/g, ' ')
            .replace(/\s+([\.,:;!?])/g, '$1')
            .trim();
    }
    recalculateConfidence(result) {
        if (result.words.length === 0)
            return 0;
        const totalConfidence = result.words.reduce((sum, word) => sum + word.confidence, 0);
        return totalConfidence / result.words.length;
    }
    convertTesseractToOCRResult(data, documentId, pageNumber, language) {
        const words = data.words.map((word) => ({
            text: word.text,
            confidence: word.confidence / 100.0,
            boundingBox: {
                x: word.bbox.x0,
                y: word.bbox.y0,
                width: word.bbox.x1 - word.bbox.x0,
                height: word.bbox.y1 - word.bbox.y0
            }
        }));
        const lines = data.lines.map((line) => ({
            text: line.text,
            confidence: line.confidence / 100.0,
            words: words.filter(word => word.boundingBox.y >= line.bbox.y0 &&
                word.boundingBox.y <= line.bbox.y1),
            boundingBox: {
                x: line.bbox.x0,
                y: line.bbox.y0,
                width: line.bbox.x1 - line.bbox.x0,
                height: line.bbox.y1 - line.bbox.y0
            }
        }));
        const paragraphs = data.paragraphs.map((para) => ({
            text: para.text,
            confidence: para.confidence / 100.0,
            lines: lines.filter(line => line.boundingBox.y >= para.bbox.y0 &&
                line.boundingBox.y <= para.bbox.y1),
            boundingBox: {
                x: para.bbox.x0,
                y: para.bbox.y0,
                width: para.bbox.x1 - para.bbox.x0,
                height: para.bbox.y1 - para.bbox.y0
            }
        }));
        const regions = [{
                text: data.text,
                confidence: data.confidence / 100.0,
                paragraphs,
                boundingBox: {
                    x: 0,
                    y: 0,
                    width: data.width || 0,
                    height: data.height || 0
                }
            }];
        return {
            id: `ocr_${documentId}_${pageNumber}_${Date.now()}`,
            documentId,
            pageNumber,
            text: data.text,
            confidence: data.confidence / 100.0,
            language: this.mapFromTesseractLanguage(language),
            words,
            lines,
            paragraphs,
            regions,
            processingTime: 0,
            ocrEngine: 'TESSERACT',
            ocrVersion: '4.1.1',
            createdAt: new Date()
        };
    }
    convertTextractToOCRResult(data, documentId, pageNumber) {
        const words = [];
        const lines = [];
        data.Blocks.forEach((block) => {
            if (block.BlockType === 'WORD') {
                words.push({
                    text: block.Text,
                    confidence: block.Confidence / 100.0,
                    boundingBox: this.convertTextractBoundingBox(block.Geometry.BoundingBox)
                });
            }
            else if (block.BlockType === 'LINE') {
                lines.push({
                    text: block.Text,
                    confidence: block.Confidence / 100.0,
                    words: [],
                    boundingBox: this.convertTextractBoundingBox(block.Geometry.BoundingBox)
                });
            }
        });
        const fullText = lines.map(line => line.text).join('\n');
        const averageConfidence = words.length > 0
            ? words.reduce((sum, word) => sum + word.confidence, 0) / words.length
            : 0;
        return {
            id: `ocr_${documentId}_${pageNumber}_${Date.now()}`,
            documentId,
            pageNumber,
            text: fullText,
            confidence: averageConfidence,
            language: DocumentManagement_1.Language.ENGLISH,
            words,
            lines,
            paragraphs: [],
            regions: [],
            processingTime: 0,
            ocrEngine: 'AWS_TEXTRACT',
            ocrVersion: '1.0.0',
            createdAt: new Date()
        };
    }
    convertTextractBoundingBox(bbox) {
        return {
            x: bbox.Left,
            y: bbox.Top,
            width: bbox.Width,
            height: bbox.Height
        };
    }
    convertGoogleVisionToOCRResult(data, documentId, pageNumber) {
        const textAnnotations = data.textAnnotations || [];
        const fullText = textAnnotations.length > 0 ? textAnnotations[0].description : '';
        const words = textAnnotations.slice(1).map((annotation) => ({
            text: annotation.description,
            confidence: 0.95,
            boundingBox: this.convertGoogleVisionBoundingBox(annotation.boundingPoly)
        }));
        return {
            id: `ocr_${documentId}_${pageNumber}_${Date.now()}`,
            documentId,
            pageNumber,
            text: fullText,
            confidence: 0.95,
            language: DocumentManagement_1.Language.ENGLISH,
            words,
            lines: [],
            paragraphs: [],
            regions: [],
            processingTime: 0,
            ocrEngine: 'GOOGLE_VISION',
            ocrVersion: '1.0.0',
            createdAt: new Date()
        };
    }
    convertGoogleVisionBoundingBox(boundingPoly) {
        const vertices = boundingPoly.vertices;
        const minX = Math.min(...vertices.map((v) => v.x || 0));
        const minY = Math.min(...vertices.map((v) => v.y || 0));
        const maxX = Math.max(...vertices.map((v) => v.x || 0));
        const maxY = Math.max(...vertices.map((v) => v.y || 0));
        return {
            x: minX,
            y: minY,
            width: maxX - minX,
            height: maxY - minY
        };
    }
    convertAzureCognitiveToOCRResult(data, documentId, pageNumber) {
        const lines = [];
        const words = [];
        if (data.analyzeResult && data.analyzeResult.readResults) {
            data.analyzeResult.readResults.forEach((page) => {
                page.lines.forEach((line) => {
                    const lineWords = line.words.map((word) => ({
                        text: word.text,
                        confidence: word.confidence,
                        boundingBox: this.convertAzureBoundingBox(word.boundingBox)
                    }));
                    words.push(...lineWords);
                    lines.push({
                        text: line.text,
                        confidence: line.confidence || 0.95,
                        words: lineWords,
                        boundingBox: this.convertAzureBoundingBox(line.boundingBox)
                    });
                });
            });
        }
        const fullText = lines.map(line => line.text).join('\n');
        const averageConfidence = words.length > 0
            ? words.reduce((sum, word) => sum + word.confidence, 0) / words.length
            : 0;
        return {
            id: `ocr_${documentId}_${pageNumber}_${Date.now()}`,
            documentId,
            pageNumber,
            text: fullText,
            confidence: averageConfidence,
            language: DocumentManagement_1.Language.ENGLISH,
            words,
            lines,
            paragraphs: [],
            regions: [],
            processingTime: 0,
            ocrEngine: 'AZURE_COGNITIVE',
            ocrVersion: '3.2.0',
            createdAt: new Date()
        };
    }
    convertAzureBoundingBox(bbox) {
        return {
            x: Math.min(bbox[0], bbox[2], bbox[4], bbox[6]),
            y: Math.min(bbox[1], bbox[3], bbox[5], bbox[7]),
            width: Math.max(bbox[0], bbox[2], bbox[4], bbox[6]) - Math.min(bbox[0], bbox[2], bbox[4], bbox[6]),
            height: Math.max(bbox[1], bbox[3], bbox[5], bbox[7]) - Math.min(bbox[1], bbox[3], bbox[5], bbox[7])
        };
    }
    convertMLPredictionToOCRResult(predictions, documentId, pageNumber, modelConfig) {
        const text = this.decodePredictions(predictions, modelConfig);
        return {
            id: `ocr_${documentId}_${pageNumber}_${Date.now()}`,
            documentId,
            pageNumber,
            text,
            confidence: 0.85,
            language: DocumentManagement_1.Language.ENGLISH,
            words: [],
            lines: [],
            paragraphs: [],
            regions: [],
            processingTime: 0,
            ocrEngine: 'CUSTOM_ML',
            ocrVersion: '1.0.0',
            createdAt: new Date()
        };
    }
    decodePredictions(predictions, modelConfig) {
        return Array.from(predictions)
            .map(pred => String.fromCharCode(Math.round(pred * 255)))
            .join('')
            .replace(/[^\w\s]/g, '');
    }
    mapToTesseractLanguage(language) {
        const mapping = {
            [DocumentManagement_1.Language.ENGLISH]: 'eng',
            [DocumentManagement_1.Language.SPANISH]: 'spa',
            [DocumentManagement_1.Language.FRENCH]: 'fra',
            [DocumentManagement_1.Language.GERMAN]: 'deu',
            [DocumentManagement_1.Language.ITALIAN]: 'ita',
            [DocumentManagement_1.Language.PORTUGUESE]: 'por',
            [DocumentManagement_1.Language.DUTCH]: 'nld',
            [DocumentManagement_1.Language.RUSSIAN]: 'rus',
            [DocumentManagement_1.Language.CHINESE_SIMPLIFIED]: 'chi_sim',
            [DocumentManagement_1.Language.CHINESE_TRADITIONAL]: 'chi_tra',
            [DocumentManagement_1.Language.JAPANESE]: 'jpn',
            [DocumentManagement_1.Language.KOREAN]: 'kor',
            [DocumentManagement_1.Language.ARABIC]: 'ara',
            [DocumentManagement_1.Language.HINDI]: 'hin'
        };
        return mapping[language] || 'eng';
    }
    mapFromTesseractLanguage(tesseractLang) {
        const mapping = {
            'eng': DocumentManagement_1.Language.ENGLISH,
            'spa': DocumentManagement_1.Language.SPANISH,
            'fra': DocumentManagement_1.Language.FRENCH,
            'deu': DocumentManagement_1.Language.GERMAN,
            'ita': DocumentManagement_1.Language.ITALIAN,
            'por': DocumentManagement_1.Language.PORTUGUESE,
            'nld': DocumentManagement_1.Language.DUTCH,
            'rus': DocumentManagement_1.Language.RUSSIAN,
            'chi_sim': DocumentManagement_1.Language.CHINESE_SIMPLIFIED,
            'chi_tra': DocumentManagement_1.Language.CHINESE_TRADITIONAL,
            'jpn': DocumentManagement_1.Language.JAPANESE,
            'kor': DocumentManagement_1.Language.KOREAN,
            'ara': DocumentManagement_1.Language.ARABIC,
            'hin': DocumentManagement_1.Language.HINDI
        };
        return mapping[tesseractLang] || DocumentManagement_1.Language.ENGLISH;
    }
    async initializeMLModels() {
        try {
            const defaultModel = {
                modelType: 'TRANSFORMER',
                modelPath: '/models/ocr/default/model.json',
                vocabularyPath: '/models/ocr/default/vocab.json',
                device: 'CPU',
                batchSize: 1,
                maxSequenceLength: 512,
                confidenceThreshold: 0.7
            };
            this.mlModels.set('default', defaultModel);
            this.logger.info('ML models initialized', {
                models: Array.from(this.mlModels.keys())
            });
        }
        catch (error) {
            this.logger.error('Failed to initialize ML models', { error: error instanceof Error ? error.message : 'Unknown error' });
        }
    }
    async createProcessingJob(request) {
        const job = {
            id: `ocr_job_${request.documentId}_${Date.now()}`,
            documentId: request.documentId,
            tenantId: request.tenantId,
            jobType: 'OCR',
            status: DocumentManagement_1.ProcessingStatus.NOT_STARTED,
            priority: 'MEDIUM',
            progress: 0,
            retryCount: 0,
            maxRetries: 3,
            configuration: {
                engine: request.ocrEngine,
                language: request.language,
                enablePreprocessing: request.enablePreprocessing,
                enablePostProcessing: request.enablePostProcessing
            },
            createdAt: new Date(),
            updatedAt: new Date()
        };
        return job;
    }
    async updateJobStatus(jobId, status, results) {
        this.logger.info('Job status updated', { jobId, status });
        if (results) {
            this.logger.debug('Job results', { jobId, results });
        }
    }
    async updateJobProgress(jobId, progress) {
        this.logger.debug('Job progress updated', { jobId, progress });
    }
    async getDocument(documentId, tenantId) {
        return {
            id: documentId,
            tenantId,
            pageCount: 1
        };
    }
    async storeOCRResults(results) {
        this.logger.info('Storing OCR results', { count: results.length });
    }
    async publishOCRCompletedEvent(documentId, tenantId, results) {
        const event = {
            eventType: 'OCR_COMPLETED',
            documentId,
            tenantId,
            results: results.map(r => ({ id: r.id, confidence: r.confidence, pageNumber: r.pageNumber })),
            timestamp: new Date().toISOString()
        };
        await this.kafkaService.publishEvent('document-processing', event);
    }
}
exports.OCRService = OCRService;
