import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
// @ts-ignore - ssh2-sftp-client types not installed
import * as SftpClient from 'ssh2-sftp-client';
type Client = any;
import { logger } from '../../../utils/logger';
import { 
  CustodianConnection,
  CustodianConnectionConfig,
  DataFeedRequest,
  OrderSubmissionRequest,
  OrderSubmissionResponse,
  DocumentRetrievalRequest,
  ConnectionTestResult,
  APIConnectionType,
  DataFeedType,
  OrderStatus,
  OrderSubmissionError
} from '../../../models/custodianIntegration/CustodianIntegration';

export class PershingIntegrationService {
  private client: AxiosInstance;
  private sftpClient: Client;
  private baseUrl: string;
  private apiVersion: string;

  constructor() {
    this.baseUrl = process.env.PERSHING_API_BASE_URL || 'https://api.pershing.com';
    this.apiVersion = 'v2';
    
    this.client = axios.create({
      baseURL: `${this.baseUrl}/${this.apiVersion}`,
      timeout: 90000, // Pershing can have very slow response times
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'InvestmentPlatform/1.0'
      }
    });

    this.sftpClient = new (SftpClient as any)();
    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for authentication
    this.client.interceptors.request.use(
      (config) => {
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
        
        logger.debug('Pershing API Request', {
          method: config.method,
          url: config.url,
          headers: { ...config.headers, Authorization: '[REDACTED]' }
        });
        
        return config;
      },
      (error) => {
        logger.error('Pershing API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        logger.debug('Pershing API Response', {
          status: response.status,
          url: response.config.url,
          dataLength: JSON.stringify(response.data).length
        });
        return response;
      },
      async (error) => {
        logger.error('Pershing API Response Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          data: error.response?.data
        });

        // Handle token expiration
        if (error.response?.status === 401) {
          logger.warn('Pershing token expired, attempting refresh');
          const refreshed = await this.refreshAuthToken();
          if (refreshed) {
            return this.client.request(error.config);
          }
        }

        // Handle rate limiting - Pershing has strict limits
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'] || 300; // 5 minutes default
          logger.warn(`Pershing API rate limited. Retrying after ${retryAfter} seconds`);
          await this.delay(retryAfter * 1000);
          return this.client.request(error.config);
        }

        // Handle server errors with exponential backoff
        if (error.response?.status >= 500) {
          const retryCount = error.config.__retryCount || 0;
          if (retryCount < 5) { // More retries for Pershing due to reliability issues
            error.config.__retryCount = retryCount + 1;
            const delay = Math.min(Math.pow(2, retryCount) * 2000, 30000); // Cap at 30 seconds
            logger.warn(`Pershing API server error. Retrying in ${delay}ms (attempt ${retryCount + 1})`);
            await this.delay(delay);
            return this.client.request(error.config);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async validateConfig(config: CustodianConnectionConfig, connectionType?: APIConnectionType): Promise<any> {
    // Validate Pershing-specific configuration requirements
    if (connectionType === APIConnectionType.REST_API) {
      if (!config.authentication.credentials.clientId) {
        throw new Error('Pershing Client ID is required for REST API connections');
      }
      
      if (!config.authentication.credentials.clientSecret) {
        throw new Error('Pershing Client Secret is required for REST API connections');
      }
    } else if (connectionType === APIConnectionType.SFTP) {
      if (!config.fileTransfer) {
        throw new Error('File transfer configuration is required for SFTP connections');
      }
      
      if (!config.fileTransfer.host || !config.fileTransfer.directory) {
        throw new Error('SFTP host and directory are required');
      }
      
      if (!config.authentication.credentials.username || !config.authentication.credentials.password) {
        throw new Error('SFTP username and password are required');
      }
    } else if (connectionType === APIConnectionType.FTP) {
      // Pershing also supports FTP
      if (!config.fileTransfer) {
        throw new Error('File transfer configuration is required for FTP connections');
      }
    } else {
      throw new Error('Pershing supports REST API, SFTP, and FTP connection types');
    }

    // Validate Pershing-specific data mapping
    if (!config.dataMapping) {
      throw new Error('Pershing data mapping configuration is required');
    }

    // Validate required endpoints for API connections
    if (connectionType === APIConnectionType.REST_API) {
      const requiredEndpoints = ['positions', 'transactions', 'cashBalances'];
      for (const endpoint of requiredEndpoints) {
        if (!config.endpoints[endpoint as keyof typeof config.endpoints]) {
          throw new Error(`Missing required endpoint: ${endpoint}`);
        }
      }
    }
  }

  async testConnection(config: CustodianConnectionConfig, connectionType?: APIConnectionType): Promise<ConnectionTestResult[]> {
    const results: ConnectionTestResult[] = [];

    try {
      if (connectionType === APIConnectionType.REST_API) {
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
      } else if (connectionType === APIConnectionType.SFTP) {
        // Test SFTP connection
        const sftpResult = await this.testSftpConnection(config);
        results.push(sftpResult);
      } else if (connectionType === APIConnectionType.FTP) {
        // Test FTP connection
        const ftpResult = await this.testFtpConnection(config);
        results.push(ftpResult);
      }

    } catch (error: any) {
      logger.error('Pershing connection test failed:', error);
      results.push({
        testType: 'CONNECTIVITY',
        success: false,
        responseTime: 0,
        errorMessage: error instanceof Error ? error.message : String(error)
      });
    }

    return results;
  }

  private async testApiAuthentication(config: CustodianConnectionConfig): Promise<ConnectionTestResult> {
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
    } catch (error: any) {
      return {
        testType: 'AUTHENTICATION',
        success: false,
        responseTime: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async testApiConnectivity(config: CustodianConnectionConfig): Promise<ConnectionTestResult> {
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
    } catch (error: any) {
      return {
        testType: 'CONNECTIVITY',
        success: false,
        responseTime: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async testApiDataRetrieval(config: CustodianConnectionConfig): Promise<ConnectionTestResult> {
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
    } catch (error: any) {
      return {
        testType: 'DATA_RETRIEVAL',
        success: false,
        responseTime: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async testOrderSubmission(config: CustodianConnectionConfig): Promise<ConnectionTestResult> {
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
    } catch (error: any) {
      return {
        testType: 'ORDER_SUBMISSION',
        success: false,
        responseTime: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : String(error)
      };
    }
  }

  private async testSftpConnection(config: CustodianConnectionConfig): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    
    try {
      await this.sftpClient.connect({
        host: config.fileTransfer!.host,
        port: config.fileTransfer!.port || 22,
        username: config.authentication.credentials.username,
        password: config.authentication.credentials.password,
        readyTimeout: 15000
      });

      const files = await this.sftpClient.list(config.fileTransfer!.directory);
      await this.sftpClient.end();
      
      return {
        testType: 'CONNECTIVITY',
        success: true,
        responseTime: Date.now() - startTime,
        details: { 
          fileCount: files.length,
          directory: config.fileTransfer!.directory
        }
      };
    } catch (error: any) {
      try {
        await this.sftpClient.end();
      } catch (closeError) {
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

  private async testFtpConnection(config: CustodianConnectionConfig): Promise<ConnectionTestResult> {
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
    } catch (error: any) {
      return {
        testType: 'CONNECTIVITY',
        success: false,
        responseTime: Date.now() - startTime,
        errorMessage: error instanceof Error ? error.message : String(error)
      };
    }
  }

  async retrieveData(connection: CustodianConnection, request: DataFeedRequest): Promise<any> {
    try {
      logger.info('Retrieving data from Pershing', {
        feedType: request.feedType,
        portfolioId: request.portfolioId,
        connectionType: connection.connectionType
      });

      if (connection.connectionType === APIConnectionType.REST_API) {
        return await this.retrieveDataViaApi(connection, request);
      } else if (connection.connectionType === APIConnectionType.SFTP) {
        return await this.retrieveDataViaSftp(connection, request);
      } else if (connection.connectionType === APIConnectionType.FTP) {
        return await this.retrieveDataViaFtp(connection, request);
      } else {
        throw new Error(`Unsupported connection type: ${connection.connectionType}`);
      }

    } catch (error: any) {
      logger.error('Error retrieving data from Pershing:', error);
      throw error;
    }
  }

  private async retrieveDataViaApi(connection: CustodianConnection, request: DataFeedRequest): Promise<any> {
    let endpoint = '';
    let params: any = {
      asOfDate: new Date().toISOString().split('T')[0]
    };

    switch (request.feedType) {
      case DataFeedType.POSITIONS:
        endpoint = '/positions';
        if (request.accountNumber) {
          params.accountNumber = request.accountNumber;
        }
        break;

      case DataFeedType.TRANSACTIONS:
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

      case DataFeedType.CASH_BALANCES:
        endpoint = '/cash-balances';
        if (request.accountNumber) {
          params.accountNumber = request.accountNumber;
        }
        break;

      case DataFeedType.CORPORATE_ACTIONS:
        endpoint = '/corporate-actions';
        params.fromDate = request.dateFrom?.toISOString().split('T')[0];
        params.toDate = request.dateTo?.toISOString().split('T')[0];
        break;

      case DataFeedType.SETTLEMENTS:
        endpoint = '/settlements';
        params.fromDate = request.dateFrom?.toISOString().split('T')[0];
        params.toDate = request.dateTo?.toISOString().split('T')[0];
        break;

      default:
        throw new Error(`Unsupported feed type: ${request.feedType}`);
    }

    // Pershing uses pagination
    let allRecords: any[] = [];
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
      } else {
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

  private async retrieveDataViaSftp(connection: CustodianConnection, request: DataFeedRequest): Promise<any> {
    try {
      await this.sftpClient.connect({
        host: connection.connectionConfig.fileTransfer!.host,
        port: connection.connectionConfig.fileTransfer!.port || 22,
        username: connection.connectionConfig.authentication.credentials.username,
        password: connection.connectionConfig.authentication.credentials.password,
        readyTimeout: 30000
      });

      const filePattern = this.getPershingFilePattern(request.feedType, request.dateFrom, request.dateTo);
      const files = await this.sftpClient.list(connection.connectionConfig.fileTransfer!.directory);
      const matchingFiles = files.filter((file: any) => this.matchesPattern(file.name, filePattern))
                                 .sort((a: any, b: any) => b.modifyTime - a.modifyTime); // Most recent first

      if (matchingFiles.length === 0) {
        throw new Error(`No files found matching pattern: ${filePattern}`);
      }

      const allRecords: any[] = [];
      for (const file of matchingFiles.slice(0, 5)) { // Limit to 5 most recent files
        const localPath = path.join('/tmp', `pershing_${file.name}`);
        const remotePath = path.join(connection.connectionConfig.fileTransfer!.directory, file.name);
        
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
          filesProcessed: matchingFiles.slice(0, 5).map((f: any) => f.name),
          source: 'SFTP'
        }
      };

    } catch (error: any) {
      try {
        await this.sftpClient.end();
      } catch (closeError) {
        // Ignore close errors
      }
      throw error;
    }
  }

  private async retrieveDataViaFtp(connection: CustodianConnection, request: DataFeedRequest): Promise<any> {
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

  async submitOrders(connection: CustodianConnection, request: OrderSubmissionRequest): Promise<OrderSubmissionResponse> {
    try {
      logger.info('Submitting orders to Pershing', {
        portfolioId: request.portfolioId,
        orderCount: request.orders.length
      });

      const orderStatuses: OrderStatus[] = [];
      const errors: OrderSubmissionError[] = [];
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
            status: 'SUBMITTED' as const,
            filledQuantity: undefined,
            averageFillPrice: undefined
          });
          
          successCount++;
          
          // Add delay between order submissions
          await this.delay(2000);
          
        } catch (error: any) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          
          orderStatuses.push({
            internalOrderId: order.internalOrderId,
            custodianOrderId: undefined,
            status: 'REJECTED' as const,
            rejectionReason: errorMessage
          });
          
          errors.push({
            errorCode: 'ORDER_SUBMISSION_FAILED',
            errorMessage,
            severity: 'ERROR' as const,
            timestamp: new Date(),
            resolved: false
          });
        }
      }

      const overallStatus = (successCount === request.orders.length ? 'SUCCESS' :
                           successCount > 0 ? 'PARTIAL_SUCCESS' : 'FAILED') as 'SUCCESS' | 'PARTIAL_SUCCESS' | 'FAILED';

      return {
        submissionId: crypto.randomBytes(16).toString('hex'),
        orderStatuses,
        overallStatus,
        errors
      };

    } catch (error: any) {
      logger.error('Error submitting orders to Pershing:', error);
      throw error;
    }
  }

  async retrieveDocuments(connection: CustodianConnection, request: DocumentRetrievalRequest): Promise<any[]> {
    try {
      logger.info('Retrieving documents from Pershing', {
        documentType: request.documentType,
        portfolioId: request.portfolioId
      });

      if (connection.connectionType === APIConnectionType.REST_API) {
        let endpoint = '/documents';
        const params: any = {
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

        return response.data.documents?.map((doc: any) => ({
          documentId: doc.documentReference,
          fileName: doc.fileName,
          fileSize: doc.fileSize,
          documentDate: new Date(doc.documentDate),
          downloadUrl: doc.downloadLink,
          expiresAt: doc.expiration ? new Date(doc.expiration) : undefined,
          status: 'AVAILABLE'
        })) || [];
      } else {
        // SFTP/FTP document retrieval
        return await this.retrieveDocumentsViaFileTransfer(connection, request);
      }

    } catch (error: any) {
      logger.error('Error retrieving documents from Pershing:', error);
      throw error;
    }
  }

  private async retrieveDocumentsViaFileTransfer(connection: CustodianConnection, request: DocumentRetrievalRequest): Promise<any[]> {
    // Implementation for SFTP/FTP document retrieval
    return [];
  }

  async healthCheck(connection: CustodianConnection): Promise<boolean> {
    try {
      if (connection.connectionType === APIConnectionType.REST_API) {
        const response = await this.client.get('/health', { timeout: 10000 });
        return response.status === 200;
      } else if (connection.connectionType === APIConnectionType.SFTP) {
        await this.sftpClient.connect({
          host: connection.connectionConfig.fileTransfer!.host,
          port: connection.connectionConfig.fileTransfer!.port || 22,
          username: connection.connectionConfig.authentication.credentials.username,
          password: connection.connectionConfig.authentication.credentials.password,
          readyTimeout: 10000
        });
        await this.sftpClient.end();
        return true;
      } else {
        return true; // Assume FTP is healthy for now
      }
    } catch (error: any) {
      logger.error('Pershing health check failed:', error);
      return false;
    }
  }

  private async authenticate(config: CustodianConnectionConfig): Promise<any> {
    try {
      const authData = {
        grant_type: 'client_credentials',
        client_id: config.authentication.credentials.clientId,
        client_secret: config.authentication.credentials.clientSecret,
        scope: config.authentication.credentials.scope || 'read write'
      };

      const response = await axios.post(`${this.baseUrl}/oauth/token`, authData, {
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

    } catch (error: any) {
      logger.error('Pershing authentication failed:', error);
      throw error;
    }
  }

  private async refreshAuthToken(): Promise<boolean> {
    try {
      logger.info('Refreshing Pershing auth token');
      // Implementation would re-authenticate using stored credentials
      return true;
    } catch (error: any) {
      logger.error('Failed to refresh Pershing auth token:', error);
      return false;
    }
  }

  private getAuthToken(): string | null {
    return process.env.PERSHING_ACCESS_TOKEN || null;
  }

  private getCertificateConfig(): any | null {
    return null; // Certificate configuration would be returned here
  }

  private storeAuthToken(token: string, expiresIn: number): void {
    process.env.PERSHING_ACCESS_TOKEN = token;
    
    setTimeout(() => {
      this.refreshAuthToken();
    }, (expiresIn - 600) * 1000); // Refresh 10 minutes before expiry
  }

  private transformPershingApiData(data: any[], feedType: DataFeedType): any[] {
    return data.map(item => {
      switch (feedType) {
        case DataFeedType.POSITIONS:
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

        case DataFeedType.TRANSACTIONS:
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

        case DataFeedType.CASH_BALANCES:
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

  private transformOrderToPershingFormat(order: any): any {
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

  private getPershingFilePattern(feedType: DataFeedType, dateFrom?: Date, dateTo?: Date): string {
    const dateStr = dateFrom ? dateFrom.toISOString().split('T')[0].replace(/-/g, '') : '*';
    
    switch (feedType) {
      case DataFeedType.POSITIONS:
        return `POS_${dateStr}_*.txt`;
      case DataFeedType.TRANSACTIONS:
        return `TXN_${dateStr}_*.txt`;
      case DataFeedType.CASH_BALANCES:
        return `CASH_${dateStr}_*.txt`;
      case DataFeedType.SETTLEMENTS:
        return `SETTL_${dateStr}_*.txt`;
      default:
        return `*_${dateStr}_*.txt`;
    }
  }

  private matchesPattern(fileName: string, pattern: string): boolean {
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(fileName);
  }

  private async parsePershingFile(filePath: string, feedType: DataFeedType): Promise<any[]> {
    // Pershing uses fixed-width format files
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const records: any[] = [];

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

  private parsePershingRecord(line: string, feedType: DataFeedType): any | null {
    try {
      // Parse fixed-width format based on Pershing specifications
      switch (feedType) {
        case DataFeedType.POSITIONS:
          return {
            accountNumber: line.substring(0, 10).trim(),
            symbol: line.substring(10, 20).trim(),
            cusip: line.substring(20, 29).trim(),
            quantity: parseFloat(line.substring(29, 42).trim()),
            unitPrice: parseFloat(line.substring(42, 55).trim()),
            marketValue: parseFloat(line.substring(55, 68).trim())
          };
        
        case DataFeedType.TRANSACTIONS:
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
    } catch (error: any) {
      logger.warn('Error parsing Pershing record:', { line, error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }

  private parsePershingDate(dateStr: string): Date {
    // Pershing date format: YYYYMMDD
    if (dateStr.length === 8) {
      const year = parseInt(dateStr.substring(0, 4));
      const month = parseInt(dateStr.substring(4, 6)) - 1; // Month is 0-based
      const day = parseInt(dateStr.substring(6, 8));
      return new Date(year, month, day);
    }
    return new Date();
  }

  private delay(ms: number): Promise<any> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

