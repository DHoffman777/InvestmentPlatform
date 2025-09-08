"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function (o, m, k, k2) {
    if (k2 === undefined)
        k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
        desc = { enumerable: true, get: function () { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function (o, m, k, k2) {
    if (k2 === undefined)
        k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function (o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function (o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function (o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o)
                if (Object.prototype.hasOwnProperty.call(o, k))
                    ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule)
            return mod;
        var result = {};
        if (mod != null)
            for (var k = ownKeys(mod), i = 0; i < k.length; i++)
                if (k[i] !== "default")
                    __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PershingIntegrationService = void 0;
const axios_1 = __importDefault(require("axios"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const ssh2_sftp_client_1 = require("ssh2-sftp-client");
const logger_1 = require("../../../utils/logger");
const CustodianIntegration_1 = require("../../../models/custodianIntegration/CustodianIntegration");
class PershingIntegrationService {
    client;
    sftpClient;
    baseUrl;
    apiVersion;
    constructor() {
        this.baseUrl = process.env.PERSHING_API_BASE_URL || 'https://api.pershing.com';
        this.apiVersion = 'v2';
        this.client = axios_1.default.create({
            baseURL: `${this.baseUrl}/${this.apiVersion}`,
            timeout: 90000, // Pershing can have very slow response times
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'User-Agent': 'InvestmentPlatform/1.0'
            }
        });
        this.sftpClient = new ssh2_sftp_client_1.Client();
        this.setupInterceptors();
    }
    setupInterceptors() {
        // Request interceptor for authentication
        this.client.interceptors.request.use((config) => {
            // Add OAuth2 authentication
            const token = this.getAuthToken();
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            // Add client certificate if configured
            const certConfig = this.getCertificateConfig();
            if (certConfig) {
                // Certificate configuration would be added here
            }
            logger_1.logger.debug('Pershing API Request', {
                method: config.method,
                url: config.url,
                headers: { ...config.headers, Authorization: '[REDACTED]' }
            });
            return config;
        }, (error) => {
            logger_1.logger.error('Pershing API Request Error:', error);
            return Promise.reject(error);
        });
        // Response interceptor for error handling
        this.client.interceptors.response.use((response) => {
            logger_1.logger.debug('Pershing API Response', {
                status: response.status,
                url: response.config.url,
                dataLength: JSON.stringify(response.data).length
            });
            return response;
        }, async (error) => {
            logger_1.logger.error('Pershing API Response Error:', {
                status: error.response?.status,
                statusText: error.response?.statusText,
                url: error.config?.url,
                data: error.response?.data
            });
            // Handle token expiration
            if (error.response?.status === 401) {
                logger_1.logger.warn('Pershing token expired, attempting refresh');
                const refreshed = await this.refreshAuthToken();
                if (refreshed) {
                    return this.client.request(error.config);
                }
            }
            // Handle rate limiting - Pershing has strict limits
            if (error.response?.status === 429) {
                const retryAfter = error.response.headers['retry-after'] || 300; // 5 minutes default
                logger_1.logger.warn(`Pershing API rate limited. Retrying after ${retryAfter} seconds`);
                await this.delay(retryAfter * 1000);
                return this.client.request(error.config);
            }
            // Handle server errors with exponential backoff
            if (error.response?.status >= 500) {
                const retryCount = error.config.__retryCount || 0;
                if (retryCount < 5) { // More retries for Pershing due to reliability issues
                    error.config.__retryCount = retryCount + 1;
                    const delay = Math.min(Math.pow(2, retryCount) * 2000, 30000); // Cap at 30 seconds
                    logger_1.logger.warn(`Pershing API server error. Retrying in ${delay}ms (attempt ${retryCount + 1})`);
                    await this.delay(delay);
                    return this.client.request(error.config);
                }
            }
            return Promise.reject(error);
        });
    }
    async validateConfig(config) {
        // Validate Pershing-specific configuration requirements
        if (config.connectionType === CustodianIntegration_1.APIConnectionType.REST_API) {
            if (!config.authentication.credentials.clientId) {
                throw new Error('Pershing Client ID is required for REST API connections');
            }
            if (!config.authentication.credentials.clientSecret) {
                throw new Error('Pershing Client Secret is required for REST API connections');
            }
        }
        else if (config.connectionType === CustodianIntegration_1.APIConnectionType.SFTP) {
            if (!config.fileTransfer) {
                throw new Error('File transfer configuration is required for SFTP connections');
            }
            if (!config.fileTransfer.host || !config.fileTransfer.directory) {
                throw new Error('SFTP host and directory are required');
            }
            if (!config.authentication.credentials.username || !config.authentication.credentials.password) {
                throw new Error('SFTP username and password are required');
            }
        }
        else if (config.connectionType === CustodianIntegration_1.APIConnectionType.FTP) {
            // Pershing also supports FTP
            if (!config.fileTransfer) {
                throw new Error('File transfer configuration is required for FTP connections');
            }
        }
        else {
            throw new Error('Pershing supports REST API, SFTP, and FTP connection types');
        }
        // Validate Pershing-specific data mapping
        if (!config.dataMapping) {
            throw new Error('Pershing data mapping configuration is required');
        }
        // Validate required endpoints for API connections
        if (config.connectionType === CustodianIntegration_1.APIConnectionType.REST_API) {
            const requiredEndpoints = ['positions', 'transactions', 'cashBalances'];
            for (const endpoint of requiredEndpoints) {
                if (!config.endpoints[endpoint]) {
                    throw new Error(`Missing required endpoint: ${endpoint}`);
                }
            }
        }
    }
    async testConnection(config) {
        const results = [];
        try {
            if (config.connectionType === CustodianIntegration_1.APIConnectionType.REST_API) {
                // Test REST API connection
                const authResult = await this.testApiAuthentication(config);
                results.push(authResult);
                if (authResult.success) {
                    const connectivityResult = await this.testApiConnectivity(config);
                    results.push(connectivityResult);
                    const dataRetrievalResult = await this.testApiDataRetrieval(config);
                    results.push(dataRetrievalResult);
                    // Test order submission if supported
                    if (config.endpoints.orderSubmission) {
                        const orderSubmissionResult = await this.testOrderSubmission(config);
                        results.push(orderSubmissionResult);
                    }
                }
            }
            else if (config.connectionType === CustodianIntegration_1.APIConnectionType.SFTP) {
                // Test SFTP connection
                const sftpResult = await this.testSftpConnection(config);
                results.push(sftpResult);
            }
            else if (config.connectionType === CustodianIntegration_1.APIConnectionType.FTP) {
                // Test FTP connection
                const ftpResult = await this.testFtpConnection(config);
                results.push(ftpResult);
            }
        }
        catch (error) {
            logger_1.logger.error('Pershing connection test failed:', error);
            results.push({
                testType: 'CONNECTIVITY',
                success: false,
                responseTime: 0,
                errorMessage: error instanceof Error ? error.message : String(error)
            });
        }
        return results;
    }
    async testApiAuthentication(config) {
        const startTime = Date.now();
        try {
            const response = await this.authenticate(config);
            return {
                testType: 'AUTHENTICATION',
                success: response.success,
                responseTime: Date.now() - startTime,
                details: {
                    tokenType: response.tokenType,
                    expiresIn: response.expiresIn
                }
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
    async testApiConnectivity(config) {
        const startTime = Date.now();
        try {
            const response = await this.client.get('/accounts/info', {
                timeout: 20000
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
    async testApiDataRetrieval(config) {
        const startTime = Date.now();
        try {
            const response = await this.client.get('/positions', {
                params: {
                    page: 1,
                    size: 1,
                    asOfDate: new Date().toISOString().split('T')[0]
                },
                timeout: 30000
            });
            return {
                testType: 'DATA_RETRIEVAL',
                success: response.status === 200,
                responseTime: Date.now() - startTime,
                details: {
                    statusCode: response.status,
                    recordCount: response.data?.data?.length || 0
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
            const response = await this.client.get('/orders/test', {
                timeout: 15000
            });
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
    async testSftpConnection(config) {
        const startTime = Date.now();
        try {
            await this.sftpClient.connect({
                host: config.fileTransfer.host,
                port: config.fileTransfer.port || 22,
                username: config.authentication.credentials.username,
                password: config.authentication.credentials.password,
                readyTimeout: 15000
            });
            const files = await this.sftpClient.list(config.fileTransfer.directory);
            await this.sftpClient.end();
            return {
                testType: 'CONNECTIVITY',
                success: true,
                responseTime: Date.now() - startTime,
                details: {
                    fileCount: files.length,
                    directory: config.fileTransfer.directory
                }
            };
        }
        catch (error) {
            try {
                await this.sftpClient.end();
            }
            catch (closeError) {
                // Ignore close errors
            }
            return {
                testType: 'CONNECTIVITY',
                success: false,
                responseTime: Date.now() - startTime,
                errorMessage: error instanceof Error ? error.message : String(error)
            };
        }
    }
    async testFtpConnection(config) {
        const startTime = Date.now();
        try {
            // FTP test implementation would go here
            // For now, return a placeholder
            return {
                testType: 'CONNECTIVITY',
                success: true,
                responseTime: Date.now() - startTime,
                details: { connectionType: 'FTP' }
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
    async retrieveData(connection, request) {
        try {
            logger_1.logger.info('Retrieving data from Pershing', {
                feedType: request.feedType,
                portfolioId: request.portfolioId,
                connectionType: connection.connectionType
            });
            if (connection.connectionType === CustodianIntegration_1.APIConnectionType.REST_API) {
                return await this.retrieveDataViaApi(connection, request);
            }
            else if (connection.connectionType === CustodianIntegration_1.APIConnectionType.SFTP) {
                return await this.retrieveDataViaSftp(connection, request);
            }
            else if (connection.connectionType === CustodianIntegration_1.APIConnectionType.FTP) {
                return await this.retrieveDataViaFtp(connection, request);
            }
            else {
                throw new Error(`Unsupported connection type: ${connection.connectionType}`);
            }
        }
        catch (error) {
            logger_1.logger.error('Error retrieving data from Pershing:', error);
            throw error;
        }
    }
    async retrieveDataViaApi(connection, request) {
        let endpoint = '';
        let params = {
            asOfDate: new Date().toISOString().split('T')[0]
        };
        switch (request.feedType) {
            case CustodianIntegration_1.DataFeedType.POSITIONS:
                endpoint = '/positions';
                if (request.accountNumber) {
                    params.accountNumber = request.accountNumber;
                }
                break;
            case CustodianIntegration_1.DataFeedType.TRANSACTIONS:
                endpoint = '/transactions';
                if (request.accountNumber) {
                    params.accountNumber = request.accountNumber;
                }
                if (request.dateFrom) {
                    params.fromDate = request.dateFrom.toISOString().split('T')[0];
                }
                if (request.dateTo) {
                    params.toDate = request.dateTo.toISOString().split('T')[0];
                }
                break;
            case CustodianIntegration_1.DataFeedType.CASH_BALANCES:
                endpoint = '/cash-balances';
                if (request.accountNumber) {
                    params.accountNumber = request.accountNumber;
                }
                break;
            case CustodianIntegration_1.DataFeedType.CORPORATE_ACTIONS:
                endpoint = '/corporate-actions';
                params.fromDate = request.dateFrom?.toISOString().split('T')[0];
                params.toDate = request.dateTo?.toISOString().split('T')[0];
                break;
            case CustodianIntegration_1.DataFeedType.SETTLEMENTS:
                endpoint = '/settlements';
                params.fromDate = request.dateFrom?.toISOString().split('T')[0];
                params.toDate = request.dateTo?.toISOString().split('T')[0];
                break;
            default:
                throw new Error(`Unsupported feed type: ${request.feedType}`);
        }
        // Pershing uses pagination
        let allRecords = [];
        let page = 1;
        let hasMore = true;
        const pageSize = 1000;
        while (hasMore) {
            const paginatedParams = {
                ...params,
                page,
                size: pageSize
            };
            const response = await this.client.get(endpoint, { params: paginatedParams });
            const data = response.data;
            if (data.data && data.data.length > 0) {
                const transformedRecords = this.transformPershingApiData(data.data, request.feedType);
                allRecords.push(...transformedRecords);
                hasMore = data.data.length === pageSize && data.pagination?.hasNext;
                page++;
            }
            else {
                hasMore = false;
            }
            // Add delay between requests to respect rate limits
            if (hasMore) {
                await this.delay(1000);
            }
        }
        return {
            records: allRecords,
            metadata: {
                recordCount: allRecords.length,
                retrievedAt: new Date(),
                endpoint,
                params,
                source: 'API',
                pagesRetrieved: page - 1
            }
        };
    }
    async retrieveDataViaSftp(connection, request) {
        try {
            await this.sftpClient.connect({
                host: connection.connectionConfig.fileTransfer.host,
                port: connection.connectionConfig.fileTransfer.port || 22,
                username: connection.connectionConfig.authentication.credentials.username,
                password: connection.connectionConfig.authentication.credentials.password,
                readyTimeout: 30000
            });
            const filePattern = this.getPershingFilePattern(request.feedType, request.dateFrom, request.dateTo);
            const files = await this.sftpClient.list(connection.connectionConfig.fileTransfer.directory);
            const matchingFiles = files.filter(file => this.matchesPattern(file.name, filePattern))
                .sort((a, b) => b.modifyTime - a.modifyTime); // Most recent first
            if (matchingFiles.length === 0) {
                throw new Error(`No files found matching pattern: ${filePattern}`);
            }
            const allRecords = [];
            for (const file of matchingFiles.slice(0, 5)) { // Limit to 5 most recent files
                const localPath = path.join('/tmp', `pershing_${file.name}`);
                const remotePath = path.join(connection.connectionConfig.fileTransfer.directory, file.name);
                await this.sftpClient.fastGet(remotePath, localPath);
                const records = await this.parsePershingFile(localPath, request.feedType);
                allRecords.push(...records);
                fs.unlinkSync(localPath);
            }
            await this.sftpClient.end();
            return {
                records: allRecords,
                metadata: {
                    recordCount: allRecords.length,
                    retrievedAt: new Date(),
                    filesProcessed: matchingFiles.slice(0, 5).map(f => f.name),
                    source: 'SFTP'
                }
            };
        }
        catch (error) {
            try {
                await this.sftpClient.end();
            }
            catch (closeError) {
                // Ignore close errors
            }
            throw error;
        }
    }
    async retrieveDataViaFtp(connection, request) {
        // FTP implementation would go here
        // For now, return empty result
        return {
            records: [],
            metadata: {
                recordCount: 0,
                retrievedAt: new Date(),
                source: 'FTP',
                note: 'FTP implementation pending'
            }
        };
    }
    async submitOrders(connection, request) {
        try {
            logger_1.logger.info('Submitting orders to Pershing', {
                portfolioId: request.portfolioId,
                orderCount: request.orders.length
            });
            const orderStatuses = [];
            const errors = [];
            let successCount = 0;
            for (const order of request.orders) {
                try {
                    const pershingOrder = this.transformOrderToPershingFormat(order);
                    const response = await this.client.post('/orders', pershingOrder, {
                        timeout: 30000
                    });
                    orderStatuses.push({
                        internalOrderId: order.internalOrderId,
                        custodianOrderId: response.data.orderReference,
                        status: 'SUBMITTED',
                        filledQuantity: undefined,
                        averageFillPrice: undefined
                    });
                    successCount++;
                    // Add delay between order submissions
                    await this.delay(2000);
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
                orderStatuses,
                overallStatus,
                errors
            };
        }
        catch (error) {
            logger_1.logger.error('Error submitting orders to Pershing:', error);
            throw error;
        }
    }
    async retrieveDocuments(connection, request) {
        try {
            logger_1.logger.info('Retrieving documents from Pershing', {
                documentType: request.documentType,
                portfolioId: request.portfolioId
            });
            if (connection.connectionType === CustodianIntegration_1.APIConnectionType.REST_API) {
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
                const response = await this.client.get(endpoint, { params });
                return response.data.documents?.map((doc) => ({
                    documentId: doc.documentReference,
                    fileName: doc.fileName,
                    fileSize: doc.fileSize,
                    documentDate: new Date(doc.documentDate),
                    downloadUrl: doc.downloadLink,
                    expiresAt: doc.expiration ? new Date(doc.expiration) : undefined,
                    status: 'AVAILABLE'
                })) || [];
            }
            else {
                // SFTP/FTP document retrieval
                return await this.retrieveDocumentsViaFileTransfer(connection, request);
            }
        }
        catch (error) {
            logger_1.logger.error('Error retrieving documents from Pershing:', error);
            throw error;
        }
    }
    async retrieveDocumentsViaFileTransfer(connection, request) {
        // Implementation for SFTP/FTP document retrieval
        return [];
    }
    async healthCheck(connection) {
        try {
            if (connection.connectionType === CustodianIntegration_1.APIConnectionType.REST_API) {
                const response = await this.client.get('/health', { timeout: 10000 });
                return response.status === 200;
            }
            else if (connection.connectionType === CustodianIntegration_1.APIConnectionType.SFTP) {
                await this.sftpClient.connect({
                    host: connection.connectionConfig.fileTransfer.host,
                    port: connection.connectionConfig.fileTransfer.port || 22,
                    username: connection.connectionConfig.authentication.credentials.username,
                    password: connection.connectionConfig.authentication.credentials.password,
                    readyTimeout: 10000
                });
                await this.sftpClient.end();
                return true;
            }
            else {
                return true; // Assume FTP is healthy for now
            }
        }
        catch (error) {
            logger_1.logger.error('Pershing health check failed:', error);
            return false;
        }
    }
    async authenticate(config) {
        try {
            const authData = {
                grant_type: 'client_credentials',
                client_id: config.authentication.credentials.clientId,
                client_secret: config.authentication.credentials.clientSecret,
                scope: config.authentication.credentials.scope || 'read write'
            };
            const response = await axios_1.default.post(`${this.baseUrl}/oauth/token`, authData, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                timeout: 30000
            });
            const token = response.data.access_token;
            const expiresIn = response.data.expires_in;
            this.storeAuthToken(token, expiresIn);
            return {
                success: true,
                tokenType: response.data.token_type,
                expiresIn
            };
        }
        catch (error) {
            logger_1.logger.error('Pershing authentication failed:', error);
            throw error;
        }
    }
    async refreshAuthToken() {
        try {
            logger_1.logger.info('Refreshing Pershing auth token');
            // Implementation would re-authenticate using stored credentials
            return true;
        }
        catch (error) {
            logger_1.logger.error('Failed to refresh Pershing auth token:', error);
            return false;
        }
    }
    getAuthToken() {
        return process.env.PERSHING_ACCESS_TOKEN || null;
    }
    getCertificateConfig() {
        return null; // Certificate configuration would be returned here
    }
    storeAuthToken(token, expiresIn) {
        process.env.PERSHING_ACCESS_TOKEN = token;
        setTimeout(() => {
            this.refreshAuthToken();
        }, (expiresIn - 600) * 1000); // Refresh 10 minutes before expiry
    }
    transformPershingApiData(data, feedType) {
        return data.map(item => {
            switch (feedType) {
                case CustodianIntegration_1.DataFeedType.POSITIONS:
                    return {
                        symbol: item.instrumentSymbol,
                        cusip: item.cusip,
                        description: item.instrumentDescription,
                        quantity: parseFloat(item.quantity),
                        unitPrice: parseFloat(item.unitPrice),
                        marketValue: parseFloat(item.marketValue),
                        costBasis: parseFloat(item.costBasis),
                        unrealizedGainLoss: parseFloat(item.unrealizedGainLoss),
                        currency: item.currency,
                        assetType: item.instrumentType,
                        accountNumber: item.accountNumber
                    };
                case CustodianIntegration_1.DataFeedType.TRANSACTIONS:
                    return {
                        transactionId: item.transactionReference,
                        symbol: item.instrumentSymbol,
                        description: item.instrumentDescription,
                        transactionType: item.transactionType,
                        tradeDate: new Date(item.tradeDate),
                        settlementDate: new Date(item.settlementDate),
                        quantity: parseFloat(item.quantity),
                        unitPrice: parseFloat(item.unitPrice),
                        grossAmount: parseFloat(item.grossAmount),
                        netAmount: parseFloat(item.netAmount),
                        fees: parseFloat(item.fees || 0),
                        commission: parseFloat(item.commission || 0),
                        accountNumber: item.accountNumber
                    };
                case CustodianIntegration_1.DataFeedType.CASH_BALANCES:
                    return {
                        accountNumber: item.accountNumber,
                        currency: item.currency,
                        accountType: item.accountType,
                        balance: parseFloat(item.balance),
                        availableBalance: parseFloat(item.availableBalance),
                        pendingCredits: parseFloat(item.pendingCredits || 0),
                        pendingDebits: parseFloat(item.pendingDebits || 0)
                    };
                default:
                    return item;
            }
        });
    }
    transformOrderToPershingFormat(order) {
        return {
            accountNumber: order.accountNumber,
            instrumentSymbol: order.symbol,
            orderType: order.orderType.toUpperCase(),
            side: order.side.toUpperCase(),
            quantity: order.quantity.toString(),
            price: order.price?.toString(),
            stopPrice: order.stopPrice?.toString(),
            timeInForce: order.timeInForce,
            specialInstructions: order.specialInstructions,
            orderDate: new Date().toISOString()
        };
    }
    getPershingFilePattern(feedType, dateFrom, dateTo) {
        const dateStr = dateFrom ? dateFrom.toISOString().split('T')[0].replace(/-/g, '') : '*';
        switch (feedType) {
            case CustodianIntegration_1.DataFeedType.POSITIONS:
                return `POS_${dateStr}_*.txt`;
            case CustodianIntegration_1.DataFeedType.TRANSACTIONS:
                return `TXN_${dateStr}_*.txt`;
            case CustodianIntegration_1.DataFeedType.CASH_BALANCES:
                return `CASH_${dateStr}_*.txt`;
            case CustodianIntegration_1.DataFeedType.SETTLEMENTS:
                return `SETTL_${dateStr}_*.txt`;
            default:
                return `*_${dateStr}_*.txt`;
        }
    }
    matchesPattern(fileName, pattern) {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(fileName);
    }
    async parsePershingFile(filePath, feedType) {
        // Pershing uses fixed-width format files
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');
        const records = [];
        for (const line of lines) {
            if (line.trim() && !line.startsWith('HDR')) { // Skip header records
                const record = this.parsePershingRecord(line, feedType);
                if (record) {
                    records.push(record);
                }
            }
        }
        return records;
    }
    parsePershingRecord(line, feedType) {
        try {
            // Parse fixed-width format based on Pershing specifications
            switch (feedType) {
                case CustodianIntegration_1.DataFeedType.POSITIONS:
                    return {
                        accountNumber: line.substring(0, 10).trim(),
                        symbol: line.substring(10, 20).trim(),
                        cusip: line.substring(20, 29).trim(),
                        quantity: parseFloat(line.substring(29, 42).trim()),
                        unitPrice: parseFloat(line.substring(42, 55).trim()),
                        marketValue: parseFloat(line.substring(55, 68).trim())
                    };
                case CustodianIntegration_1.DataFeedType.TRANSACTIONS:
                    return {
                        accountNumber: line.substring(0, 10).trim(),
                        transactionId: line.substring(10, 25).trim(),
                        symbol: line.substring(25, 35).trim(),
                        transactionType: line.substring(35, 40).trim(),
                        quantity: parseFloat(line.substring(40, 53).trim()),
                        unitPrice: parseFloat(line.substring(53, 66).trim()),
                        tradeDate: this.parsePershingDate(line.substring(66, 74).trim())
                    };
                default:
                    return null;
            }
        }
        catch (error) {
            logger_1.logger.warn('Error parsing Pershing record:', { line, error: error instanceof Error ? error.message : String(error) });
            return null;
        }
    }
    parsePershingDate(dateStr) {
        // Pershing date format: YYYYMMDD
        if (dateStr.length === 8) {
            const year = parseInt(dateStr.substring(0, 4));
            const month = parseInt(dateStr.substring(4, 6)) - 1; // Month is 0-based
            const day = parseInt(dateStr.substring(6, 8));
            return new Date(year, month, day);
        }
        return new Date();
    }
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
exports.PershingIntegrationService = PershingIntegrationService;
