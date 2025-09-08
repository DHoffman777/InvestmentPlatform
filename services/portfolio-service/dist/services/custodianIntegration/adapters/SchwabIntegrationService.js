"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchwabIntegrationService = void 0;
const axios_1 = __importDefault(require("axios"));
const logger_1 = require("../../../utils/logger");
const CustodianIntegration_1 = require("../../../models/custodianIntegration/CustodianIntegration");
class SchwabIntegrationService {
    client;
    baseUrl;
    apiVersion;
    constructor() {
        this.baseUrl = process.env.SCHWAB_API_BASE_URL || 'https://api.schwabapi.com';
        this.apiVersion = 'v1';
        this.client = axios_1.default.create({
            baseURL: `${this.baseUrl}/${this.apiVersion}`,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
        this.setupInterceptors();
    }
    setupInterceptors() {
        // Request interceptor for authentication
        this.client.interceptors.request.use((config) => {
            // Add authentication headers
            const token = this.getAuthToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            // Log request for debugging
            logger_1.logger.debug('Schwab API Request', {
                method: config.method,
                url: config.url,
                headers: config.headers
            });
            return config;
        }, (error) => {
            logger_1.logger.error('Schwab API Request Error:', error);
            return Promise.reject(error);
        });
        // Response interceptor for error handling
        this.client.interceptors.response.use((response) => {
            logger_1.logger.debug('Schwab API Response', {
                status: response.status,
                url: response.config.url,
                dataLength: JSON.stringify(response.data).length
            });
            return response;
        }, async (error) => {
            logger_1.logger.error('Schwab API Response Error:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                url: error.config?.url,
                data: error.response?.data
            });
            // Handle token expiration
            if (error.response?.status === 401) {
                await this.refreshAuthToken();
                // Retry the original request
                return this.client.request(error.config);
            }
            // Handle rate limiting
            if (error.response?.status === 429) {
                const retryAfter = error.response.headers['retry-after'] || 60;
                logger_1.logger.warn(`Schwab API rate limited. Retrying after ${retryAfter} seconds`);
                await this.delay(retryAfter * 1000);
                return this.client.request(error.config);
            }
            return Promise.reject(error);
        });
    }
    async validateConfig(config) {
        // Validate Schwab-specific configuration requirements
        if (!config.authentication.credentials.clientId) {
            throw new Error('Schwab Client ID is required');
        }
        if (!config.authentication.credentials.clientSecret) {
            throw new Error('Schwab Client Secret is required');
        }
        if (config.connectionType !== CustodianIntegration_1.APIConnectionType.REST_API) {
            throw new Error('Schwab only supports REST API connections');
        }
        // Validate required endpoints
        const requiredEndpoints = ['positions', 'transactions', 'cashBalances', 'accountInformation'];
        for (const endpoint of requiredEndpoints) {
            if (!config.endpoints[endpoint]) {
                throw new Error(`Missing required endpoint: ${endpoint}`);
            }
        }
    }
    async testConnection(config) {
        const results = [];
        try {
            // Test authentication
            const authResult = await this.testAuthentication(config);
            results.push(authResult);
            if (authResult.success) {
                // Test connectivity
                const connectivityResult = await this.testConnectivity(config);
                results.push(connectivityResult);
                // Test data retrieval
                const dataRetrievalResult = await this.testDataRetrieval(config);
                results.push(dataRetrievalResult);
                // Test order submission (if supported)
                if (config.endpoints.orderSubmission) {
                    const orderSubmissionResult = await this.testOrderSubmission(config);
                    results.push(orderSubmissionResult);
                }
            }
        }
        catch (error) {
            logger_1.logger.error('Schwab connection test failed:', error);
            results.push({
                testType: 'CONNECTIVITY',
                success: false,
                responseTime: 0,
                errorMessage: error instanceof Error ? error.message : String(error)
            });
        }
        return results;
    }
    async testAuthentication(config) {
        const startTime = Date.now();
        try {
            const response = await this.authenticate(config);
            return {
                testType: 'AUTHENTICATION',
                success: response.success,
                responseTime: Date.now() - startTime,
                details: { tokenType: response.tokenType }
            };
        }
        catch (error) {
            return {
                testType: 'AUTHENTICATION',
                success: false,
                responseTime: Date.now() - startTime,
                errorMessage: error instanceof Error ? error.message : String(error)
            };
        }
    }
    async testConnectivity(config) {
        const startTime = Date.now();
        try {
            const response = await this.client.get('/accounts', {
                timeout: 10000
            });
            return {
                testType: 'CONNECTIVITY',
                success: response.status === 200,
                responseTime: Date.now() - startTime,
                details: { statusCode: response.status }
            };
        }
        catch (error) {
            return {
                testType: 'CONNECTIVITY',
                success: false,
                responseTime: Date.now() - startTime,
                errorMessage: error instanceof Error ? error.message : String(error)
            };
        }
    }
    async testDataRetrieval(config) {
        const startTime = Date.now();
        try {
            // Try to retrieve a small amount of position data
            const response = await this.client.get('/accounts/positions', {
                params: { limit: 1 },
                timeout: 15000
            });
            return {
                testType: 'DATA_RETRIEVAL',
                success: response.status === 200,
                responseTime: Date.now() - startTime,
                details: {
                    statusCode: response.status,
                    recordCount: response.data?.length || 0
                }
            };
        }
        catch (error) {
            return {
                testType: 'DATA_RETRIEVAL',
                success: false,
                responseTime: Date.now() - startTime,
                errorMessage: error instanceof Error ? error.message : String(error)
            };
        }
    }
    async testOrderSubmission(config) {
        const startTime = Date.now();
        try {
            // Test order submission endpoint without actually submitting an order
            const response = await this.client.options('/orders');
            return {
                testType: 'ORDER_SUBMISSION',
                success: response.status < 400,
                responseTime: Date.now() - startTime,
                details: { statusCode: response.status }
            };
        }
        catch (error) {
            return {
                testType: 'ORDER_SUBMISSION',
                success: false,
                responseTime: Date.now() - startTime,
                errorMessage: error instanceof Error ? error.message : String(error)
            };
        }
    }
    async retrieveData(connection, request) {
        try {
            logger_1.logger.info('Retrieving data from Schwab', {
                feedType: request.feedType,
                portfolioId: request.portfolioId
            });
            let endpoint = '';
            let params = {};
            switch (request.feedType) {
                case CustodianIntegration_1.DataFeedType.POSITIONS:
                    endpoint = '/accounts/positions';
                    if (request.accountNumber) {
                        endpoint = `/accounts/${request.accountNumber}/positions`;
                    }
                    break;
                case CustodianIntegration_1.DataFeedType.TRANSACTIONS:
                    endpoint = '/accounts/transactions';
                    if (request.accountNumber) {
                        endpoint = `/accounts/${request.accountNumber}/transactions`;
                    }
                    if (request.dateFrom) {
                        params.fromDate = request.dateFrom.toISOString().split('T')[0];
                    }
                    if (request.dateTo) {
                        params.toDate = request.dateTo.toISOString().split('T')[0];
                    }
                    break;
                case CustodianIntegration_1.DataFeedType.CASH_BALANCES:
                    endpoint = '/accounts/balances';
                    if (request.accountNumber) {
                        endpoint = `/accounts/${request.accountNumber}/balances`;
                    }
                    break;
                case CustodianIntegration_1.DataFeedType.CORPORATE_ACTIONS:
                    endpoint = '/corporateactions';
                    params.fromDate = request.dateFrom?.toISOString().split('T')[0];
                    params.toDate = request.dateTo?.toISOString().split('T')[0];
                    break;
                default:
                    throw new Error(`Unsupported feed type: ${request.feedType}`);
            }
            const response = await this.client.get(endpoint, { params });
            return {
                records: response.data,
                metadata: {
                    recordCount: response.data?.length || 0,
                    retrievedAt: new Date(),
                    endpoint,
                    params
                }
            };
        }
        catch (error) {
            logger_1.logger.error('Error retrieving data from Schwab:', error);
            throw error;
        }
    }
    async submitOrders(connection, request) {
        try {
            logger_1.logger.info('Submitting orders to Schwab', {
                portfolioId: request.portfolioId,
                orderCount: request.orders.length
            });
            const orderStatuses = [];
            const errors = [];
            let successCount = 0;
            for (const order of request.orders) {
                try {
                    const schwabOrder = this.transformOrderToSchwabFormat(order);
                    const response = await this.client.post('/orders', schwabOrder);
                    orderStatuses.push({
                        internalOrderId: order.internalOrderId,
                        custodianOrderId: response.data.orderId,
                        status: 'SUBMITTED',
                        filledQuantity: undefined,
                        averageFillPrice: undefined
                    });
                    successCount++;
                }
                catch (error) {
                    const errorMessage = error instanceof Error ? error.message : String(error);
                    orderStatuses.push({
                        internalOrderId: order.internalOrderId,
                        custodianOrderId: undefined,
                        status: 'REJECTED',
                        rejectionReason: errorMessage
                    });
                    errors.push({
                        errorCode: 'ORDER_SUBMISSION_FAILED',
                        errorMessage,
                        severity: 'ERROR',
                        timestamp: new Date(),
                        resolved: false
                    });
                }
            }
            const overallStatus = successCount === request.orders.length ? 'SUCCESS' :
                successCount > 0 ? 'PARTIAL_SUCCESS' : 'FAILED';
            return {
                submissionId: crypto.randomUUID(),
                orderStatuses: orderStatuses,
                overallStatus,
                errors: errors
            };
        }
        catch (error) {
            logger_1.logger.error('Error submitting orders to Schwab:', error);
            throw error;
        }
    }
    async retrieveDocuments(connection, request) {
        try {
            logger_1.logger.info('Retrieving documents from Schwab', {
                documentType: request.documentType,
                portfolioId: request.portfolioId
            });
            let endpoint = '/documents';
            const params = {
                documentType: request.documentType.toLowerCase()
            };
            if (request.accountNumber) {
                params.accountNumber = request.accountNumber;
            }
            if (request.dateFrom) {
                params.fromDate = request.dateFrom.toISOString().split('T')[0];
            }
            if (request.dateTo) {
                params.toDate = request.dateTo.toISOString().split('T')[0];
            }
            if (request.symbol) {
                params.symbol = request.symbol;
            }
            const response = await this.client.get(endpoint, { params });
            return response.data.map((doc) => ({
                documentId: doc.id,
                fileName: doc.fileName,
                fileSize: doc.fileSize,
                documentDate: new Date(doc.documentDate),
                downloadUrl: doc.downloadUrl,
                expiresAt: doc.expiresAt ? new Date(doc.expiresAt) : undefined,
                status: 'AVAILABLE'
            }));
        }
        catch (error) {
            logger_1.logger.error('Error retrieving documents from Schwab:', error);
            throw error;
        }
    }
    async healthCheck(connection) {
        try {
            const response = await this.client.get('/health', { timeout: 5000 });
            return response.status === 200;
        }
        catch (error) {
            logger_1.logger.error('Schwab health check failed:', error);
            return false;
        }
    }
    async authenticate(config) {
        try {
            const authData = {
                grant_type: 'client_credentials',
                client_id: config.authentication.credentials.clientId,
                client_secret: config.authentication.credentials.clientSecret,
                scope: config.authentication.credentials.scope || 'read'
            };
            const response = await axios_1.default.post(`${this.baseUrl}/oauth/token`, authData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                }
            });
            const token = response.data.access_token;
            const expiresIn = response.data.expires_in;
            // Store token for future use
            this.storeAuthToken(token, expiresIn);
            return {
                success: true,
                tokenType: response.data.token_type,
                expiresIn
            };
        }
        catch (error) {
            logger_1.logger.error('Schwab authentication failed:', error);
            throw error;
        }
    }
    async refreshAuthToken() {
        // Implementation for token refresh
        logger_1.logger.info('Refreshing Schwab auth token');
        // This would implement the OAuth2 refresh flow
    }
    getAuthToken() {
        // Implementation to retrieve stored auth token
        return process.env.SCHWAB_ACCESS_TOKEN || null;
    }
    storeAuthToken(token, expiresIn) {
        // Implementation to store auth token securely
        // In production, this would use secure storage
        process.env.SCHWAB_ACCESS_TOKEN = token;
        // Set up token refresh timer
        setTimeout(() => {
            this.refreshAuthToken();
        }, (expiresIn - 300) * 1000); // Refresh 5 minutes before expiry
    }
    transformOrderToSchwabFormat(order) {
        return {
            accountNumber: order.accountNumber,
            orderType: order.orderType.toUpperCase(),
            session: 'NORMAL',
            duration: order.timeInForce,
            orderStrategyType: 'SINGLE',
            orderLegCollection: [
                {
                    instruction: order.side.toUpperCase(),
                    quantity: order.quantity,
                    instrument: {
                        symbol: order.symbol,
                        assetType: 'EQUITY' // This would be determined dynamically
                    }
                }
            ]
        };
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.SchwabIntegrationService = SchwabIntegrationService;
