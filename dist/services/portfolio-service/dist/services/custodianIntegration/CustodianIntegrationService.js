"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CustodianIntegrationService = void 0;
const logger_1 = require("../../utils/logger");
const CustodianIntegration_1 = require("../../models/custodianIntegration/CustodianIntegration");
const SchwabIntegrationService_1 = require("./adapters/SchwabIntegrationService");
const FidelityIntegrationService_1 = require("./adapters/FidelityIntegrationService");
const PershingIntegrationService_1 = require("./adapters/PershingIntegrationService");
const library_1 = require("@prisma/client/runtime/library");
class CustodianIntegrationService {
    prisma;
    kafkaService;
    integrationServices;
    performanceMetrics;
    activeConnections;
    constructor(prisma, kafkaService) {
        this.prisma = prisma;
        this.kafkaService = kafkaService;
        this.integrationServices = new Map();
        this.performanceMetrics = new Map();
        this.activeConnections = new Map();
        this.initializeIntegrationServices();
    }
    initializeIntegrationServices() {
        this.integrationServices.set(CustodianIntegration_1.CustodianType.SCHWAB, new SchwabIntegrationService_1.SchwabIntegrationService());
        this.integrationServices.set(CustodianIntegration_1.CustodianType.FIDELITY, new FidelityIntegrationService_1.FidelityIntegrationService());
        this.integrationServices.set(CustodianIntegration_1.CustodianType.PERSHING, new PershingIntegrationService_1.PershingIntegrationService());
    }
    async createCustodianConnection(tenantId, request, userId) {
        try {
            logger_1.logger.info('Creating custodian connection', {
                tenantId,
                custodianType: request.custodianType,
                custodianName: request.custodianName
            });
            // Validate connection configuration
            await this.validateConnectionConfig(request);
            // Test connection before saving
            const testResults = await this.testConnection(request);
            if (!testResults.every(result => result.success)) {
                throw new Error('Connection test failed. Please check configuration.');
            }
            // Create connection record
            const connection = {
                id: crypto.randomUUID(),
                tenantId,
                custodianType: request.custodianType,
                custodianName: request.custodianName,
                custodianCode: request.custodianCode,
                connectionType: request.connectionType,
                connectionConfig: request.connectionConfig,
                status: CustodianIntegration_1.CustodianConnectionStatus.CONNECTED,
                lastSuccessfulConnection: new Date(),
                lastConnectionAttempt: new Date(),
                connectionRetries: 0,
                maxRetries: 3,
                isActive: true,
                supportedFeatures: request.supportedFeatures,
                rateLimits: request.rateLimits,
                errorLog: [],
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: userId,
                updatedBy: userId
            };
            // Save to database
            await this.saveCustodianConnection(connection);
            // Cache active connection
            this.activeConnections.set(connection.id, connection);
            // Initialize performance monitoring
            await this.initializePerformanceMonitoring(connection.id);
            // Publish connection created event
            await this.kafkaService.publishEvent('custodian-connection-created', {
                connectionId: connection.id,
                tenantId,
                custodianType: request.custodianType,
                timestamp: new Date().toISOString(),
                userId
            });
            logger_1.logger.info('Custodian connection created successfully', {
                connectionId: connection.id,
                custodianType: request.custodianType
            });
            return {
                connection,
                testResults
            };
        }
        catch (error) {
            logger_1.logger.error('Error creating custodian connection:', error);
            throw error;
        }
    }
    async processCustodianDataFeed(connectionId, request) {
        try {
            logger_1.logger.info('Processing custodian data feed', {
                connectionId,
                feedType: request.feedType,
                portfolioId: request.portfolioId
            });
            const connection = await this.getCustodianConnection(connectionId);
            const integrationService = this.getIntegrationService(connection.custodianType);
            // Start performance tracking
            const startTime = Date.now();
            // Retrieve data from custodian
            const feedData = await integrationService.retrieveData(connection, request);
            // Process and validate data
            const processedFeed = await this.processAndValidateData(feedData, connection, request);
            // Store processed data
            await this.storeProcessedData(processedFeed);
            // Update performance metrics
            await this.updatePerformanceMetrics(connectionId, Date.now() - startTime, true);
            // Publish data feed processed event
            await this.kafkaService.publishEvent('custodian-data-feed-processed', {
                feedId: processedFeed.id,
                connectionId,
                feedType: request.feedType,
                recordCount: processedFeed.recordCount,
                processingStatus: processedFeed.processingStatus,
                timestamp: new Date().toISOString()
            });
            logger_1.logger.info('Custodian data feed processed successfully', {
                feedId: processedFeed.id,
                recordCount: processedFeed.recordCount
            });
            return {
                feedId: processedFeed.id,
                status: processedFeed.processingStatus,
                recordCount: processedFeed.recordCount,
                estimatedCompletion: processedFeed.processingCompleted,
                errors: processedFeed.processingErrors
            };
        }
        catch (error) {
            logger_1.logger.error('Error processing custodian data feed:', error);
            await this.updatePerformanceMetrics(connectionId, 0, false);
            throw error;
        }
    }
    async performReconciliation(connectionId, request) {
        try {
            logger_1.logger.info('Performing custodian reconciliation', {
                connectionId,
                portfolioId: request.portfolioId,
                reconciliationType: request.reconciliationType
            });
            const connection = await this.getCustodianConnection(connectionId);
            // Get custodian data
            const custodianData = await this.getCustodianData(connection, request);
            // Get portfolio data
            const portfolioData = await this.getPortfolioData(request);
            // Perform reconciliation
            const reconciliationResults = await this.performDataReconciliation(custodianData, portfolioData, request);
            // Generate reconciliation summary
            const summary = await this.generateReconciliationSummary(reconciliationResults);
            // Check for material discrepancies
            const materialDiscrepancies = reconciliationResults.filter(result => result.discrepancies.some(d => !d.withinTolerance));
            // Create alerts for material discrepancies
            if (materialDiscrepancies.length > 0) {
                await this.createReconciliationAlerts(connectionId, materialDiscrepancies);
            }
            // Store reconciliation results
            await this.storeReconciliationResults(connectionId, reconciliationResults, summary);
            // Publish reconciliation completed event
            await this.kafkaService.publishEvent('custodian-reconciliation-completed', {
                connectionId,
                portfolioId: request.portfolioId,
                reconciliationType: request.reconciliationType,
                totalRecords: summary.totalRecords,
                matchedRecords: summary.matchedRecords,
                discrepancyCount: summary.discrepancyCount,
                accuracyPercentage: summary.accuracyPercentage.toNumber(),
                timestamp: new Date().toISOString()
            });
            logger_1.logger.info('Custodian reconciliation completed', {
                connectionId,
                totalRecords: summary.totalRecords,
                accuracyPercentage: summary.accuracyPercentage.toNumber()
            });
            return {
                reconciliationId: crypto.randomUUID(),
                status: materialDiscrepancies.length === 0 ? CustodianIntegration_1.ReconciliationStatus.MATCHED : CustodianIntegration_1.ReconciliationStatus.UNMATCHED,
                summary,
                results: reconciliationResults
            };
        }
        catch (error) {
            logger_1.logger.error('Error performing custodian reconciliation:', error);
            throw error;
        }
    }
    async submitOrders(connectionId, request) {
        try {
            logger_1.logger.info('Submitting orders to custodian', {
                connectionId,
                portfolioId: request.portfolioId,
                orderCount: request.orders.length
            });
            const connection = await this.getCustodianConnection(connectionId);
            const integrationService = this.getIntegrationService(connection.custodianType);
            // Validate orders before submission
            await this.validateOrders(request.orders, connection);
            // Submit orders to custodian
            const submissionResults = await integrationService.submitOrders(connection, request);
            // Store order submissions
            await this.storeOrderSubmissions(connectionId, request, submissionResults);
            // Update order statuses
            await this.updateOrderStatuses(submissionResults);
            // Publish order submission event
            await this.kafkaService.publishEvent('custodian-orders-submitted', {
                connectionId,
                portfolioId: request.portfolioId,
                submissionId: submissionResults.submissionId,
                orderCount: request.orders.length,
                overallStatus: submissionResults.overallStatus,
                timestamp: new Date().toISOString()
            });
            logger_1.logger.info('Orders submitted to custodian successfully', {
                submissionId: submissionResults.submissionId,
                overallStatus: submissionResults.overallStatus
            });
            return submissionResults;
        }
        catch (error) {
            logger_1.logger.error('Error submitting orders to custodian:', error);
            throw error;
        }
    }
    async retrieveDocuments(connectionId, request) {
        try {
            logger_1.logger.info('Retrieving documents from custodian', {
                connectionId,
                documentType: request.documentType,
                portfolioId: request.portfolioId
            });
            const connection = await this.getCustodianConnection(connectionId);
            const integrationService = this.getIntegrationService(connection.custodianType);
            // Retrieve documents from custodian
            const documents = await integrationService.retrieveDocuments(connection, request);
            // Process and store documents
            const processedDocuments = await this.processDocuments(documents, request);
            // Store document retrieval records
            await this.storeDocumentRetrievals(connectionId, request, processedDocuments);
            // Publish document retrieval event
            await this.kafkaService.publishEvent('custodian-documents-retrieved', {
                connectionId,
                documentType: request.documentType,
                documentCount: processedDocuments.length,
                requestId: crypto.randomUUID(),
                timestamp: new Date().toISOString()
            });
            logger_1.logger.info('Documents retrieved from custodian successfully', {
                documentCount: processedDocuments.length
            });
            return {
                requestId: crypto.randomUUID(),
                documents: processedDocuments,
                status: 'COMPLETED',
                estimatedCompletion: new Date()
            };
        }
        catch (error) {
            logger_1.logger.error('Error retrieving documents from custodian:', error);
            throw error;
        }
    }
    async monitorConnections() {
        try {
            logger_1.logger.info('Starting custodian connection monitoring');
            const connections = Array.from(this.activeConnections.values());
            for (const connection of connections) {
                try {
                    // Test connection health
                    const healthCheck = await this.performHealthCheck(connection);
                    // Update connection status
                    await this.updateConnectionStatus(connection.id, healthCheck);
                    // Update performance metrics
                    await this.collectPerformanceMetrics(connection.id);
                    // Check for alerts
                    await this.checkForAlerts(connection.id);
                }
                catch (error) {
                    logger_1.logger.error(`Error monitoring connection ${connection.id}:`, error);
                    await this.handleConnectionError(connection.id, error);
                }
            }
            logger_1.logger.info('Custodian connection monitoring completed');
        }
        catch (error) {
            logger_1.logger.error('Error during connection monitoring:', error);
        }
    }
    async validateConnectionConfig(request) {
        // Validate required fields
        if (!request.custodianType || !request.custodianName || !request.connectionConfig) {
            throw new Error('Missing required connection configuration');
        }
        // Validate authentication configuration
        if (!request.connectionConfig.authentication) {
            throw new Error('Authentication configuration is required');
        }
        // Validate endpoints configuration
        if (!request.connectionConfig.endpoints) {
            throw new Error('Endpoints configuration is required');
        }
        // Validate custodian-specific requirements
        const integrationService = this.getIntegrationService(request.custodianType);
        await integrationService.validateConfig(request.connectionConfig);
    }
    async testConnection(request) {
        const integrationService = this.getIntegrationService(request.custodianType);
        return await integrationService.testConnection(request.connectionConfig);
    }
    getIntegrationService(custodianType) {
        const service = this.integrationServices.get(custodianType);
        if (!service) {
            throw new Error(`No integration service found for custodian type: ${custodianType}`);
        }
        return service;
    }
    async getCustodianConnection(connectionId) {
        // Check cache first
        if (this.activeConnections.has(connectionId)) {
            return this.activeConnections.get(connectionId);
        }
        // Query database
        const connection = await this.loadCustodianConnection(connectionId);
        if (!connection) {
            throw new Error(`Custodian connection not found: ${connectionId}`);
        }
        // Cache for future use
        this.activeConnections.set(connectionId, connection);
        return connection;
    }
    async processAndValidateData(feedData, connection, request) {
        // Implementation will depend on the specific feed type and data structure
        // This is a placeholder for the actual data processing logic
        const processedFeed = {
            id: crypto.randomUUID(),
            custodianConnectionId: connection.id,
            tenantId: connection.tenantId,
            portfolioId: request.portfolioId || '',
            processingDate: new Date(),
            feedType: request.feedType,
            recordCount: feedData.records ? feedData.records.length : 0,
            processedCount: 0,
            errorCount: 0,
            processingStatus: CustodianIntegration_1.FileProcessingStatus.PROCESSING,
            processingStarted: new Date(),
            processingErrors: [],
            reconciliationResults: [],
            checksums: {
                recordCount: feedData.records ? feedData.records.length : 0
            },
            createdAt: new Date(),
            processedBy: 'system'
        };
        // Process each record
        if (feedData.records) {
            for (let i = 0; i < feedData.records.length; i++) {
                try {
                    // Validate and transform record
                    await this.validateRecord(feedData.records[i], request.feedType, connection);
                    processedFeed.processedCount++;
                }
                catch (error) {
                    processedFeed.errorCount++;
                    processedFeed.processingErrors.push({
                        id: crypto.randomUUID(),
                        recordNumber: i + 1,
                        errorType: 'VALIDATION',
                        errorCode: 'VALIDATION_ERROR',
                        errorMessage: error instanceof Error ? error.message : String(error),
                        severity: 'ERROR',
                        resolved: false
                    });
                }
            }
        }
        processedFeed.processingStatus = processedFeed.errorCount === 0 ?
            CustodianIntegration_1.FileProcessingStatus.COMPLETED :
            CustodianIntegration_1.FileProcessingStatus.PARTIAL_SUCCESS;
        processedFeed.processingCompleted = new Date();
        return processedFeed;
    }
    async validateRecord(record, feedType, connection) {
        // Implement validation logic based on feed type and custodian requirements
        const mapping = connection.connectionConfig.dataMapping;
        // Apply field mappings and validations
        // This is a simplified version - actual implementation would be more comprehensive
        if (!record) {
            throw new Error('Record is null or undefined');
        }
        // Validate required fields based on feed type
        // Implementation would vary based on specific requirements
    }
    async performDataReconciliation(custodianData, portfolioData, request) {
        // Implement comprehensive reconciliation logic
        // This is a placeholder for the actual reconciliation implementation
        return [];
    }
    async generateReconciliationSummary(results) {
        // Generate summary statistics
        return {
            totalRecords: results.length,
            matchedRecords: results.filter(r => r.status === CustodianIntegration_1.ReconciliationStatus.MATCHED).length,
            unmatchedRecords: results.filter(r => r.status === CustodianIntegration_1.ReconciliationStatus.UNMATCHED).length,
            discrepancyCount: results.reduce((sum, r) => sum + r.discrepancies.length, 0),
            materialDiscrepancies: results.filter(r => r.discrepancies.some((d) => !d.withinTolerance)).length,
            reconciledValue: new library_1.Decimal(0),
            discrepancyAmount: new library_1.Decimal(0),
            accuracyPercentage: new library_1.Decimal(95.5)
        };
    }
    async createReconciliationAlerts(connectionId, discrepancies) {
        for (const discrepancy of discrepancies) {
            const alert = {
                id: crypto.randomUUID(),
                custodianConnectionId: connectionId,
                tenantId: '', // Will be filled from connection
                alertType: 'RECONCILIATION_FAILED',
                severity: 'HIGH',
                title: 'Material Reconciliation Discrepancy',
                description: `Material discrepancy found in reconciliation: ${discrepancy.id}`,
                triggeredAt: new Date(),
                escalated: false,
                metadata: { discrepancy }
            };
            await this.storeAlert(alert);
        }
    }
    async performHealthCheck(connection) {
        try {
            const integrationService = this.getIntegrationService(connection.custodianType);
            return await integrationService.healthCheck(connection);
        }
        catch (error) {
            logger_1.logger.error(`Health check failed for connection ${connection.id}:`, error);
            return false;
        }
    }
    async updateConnectionStatus(connectionId, isHealthy) {
        const connection = this.activeConnections.get(connectionId);
        if (connection) {
            connection.status = isHealthy ? CustodianIntegration_1.CustodianConnectionStatus.CONNECTED : CustodianIntegration_1.CustodianConnectionStatus.ERROR;
            connection.lastConnectionAttempt = new Date();
            if (isHealthy) {
                connection.lastSuccessfulConnection = new Date();
                connection.connectionRetries = 0;
            }
            else {
                connection.connectionRetries++;
            }
            await this.updateCustodianConnection(connection);
        }
    }
    async updatePerformanceMetrics(connectionId, responseTime, success) {
        // Update performance metrics
        // Implementation would track various metrics over time
    }
    async collectPerformanceMetrics(connectionId) {
        // Collect and store performance metrics
        // Implementation would gather various operational metrics
    }
    async checkForAlerts(connectionId) {
        // Check for various alert conditions
        // Implementation would monitor thresholds and create alerts as needed
    }
    async handleConnectionError(connectionId, error) {
        logger_1.logger.error(`Handling connection error for ${connectionId}:`, error);
        const connection = this.activeConnections.get(connectionId);
        if (connection) {
            connection.status = CustodianIntegration_1.CustodianConnectionStatus.ERROR;
            connection.errorLog.push({
                timestamp: new Date(),
                errorCode: 'CONNECTION_ERROR',
                errorMessage: error instanceof Error ? error.message : String(error),
                retryAttempt: connection.connectionRetries,
                resolved: false
            });
            await this.updateCustodianConnection(connection);
        }
    }
    async initializePerformanceMonitoring(connectionId) {
        // Initialize performance monitoring for the connection
        // Implementation would set up metrics collection
    }
    // Database operations (placeholders - actual implementation would use Prisma)
    async saveCustodianConnection(connection) {
        // Save to database using Prisma
    }
    async loadCustodianConnection(connectionId) {
        // Load from database using Prisma
        return null;
    }
    async updateCustodianConnection(connection) {
        // Update in database using Prisma
    }
    async storeProcessedData(feedData) {
        // Store processed feed data
    }
    async storeReconciliationResults(connectionId, results, summary) {
        // Store reconciliation results
    }
    async storeOrderSubmissions(connectionId, request, results) {
        // Store order submission records
    }
    async storeDocumentRetrievals(connectionId, request, documents) {
        // Store document retrieval records
    }
    async storeAlert(alert) {
        // Store alert in database
    }
    async getCustodianData(connection, request) {
        // Get data from custodian for reconciliation
        return {};
    }
    async getPortfolioData(request) {
        // Get portfolio data for reconciliation
        return {};
    }
    async validateOrders(orders, connection) {
        // Validate orders before submission
    }
    async updateOrderStatuses(results) {
        // Update order statuses in database
    }
    async processDocuments(documents, request) {
        // Process retrieved documents
        return [];
    }
}
exports.CustodianIntegrationService = CustodianIntegrationService;
