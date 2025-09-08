import axios, { AxiosInstance, AxiosResponse } from 'axios';
import * as fs from 'fs';
import * as path from 'path';
// @ts-ignore - ssh2-sftp-client types not installed
import { Client } from 'ssh2-sftp-client';
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
  DataFeedType
} from '../../../models/custodianIntegration/CustodianIntegration';

export class FidelityIntegrationService {
  private client: AxiosInstance;
  private sftpClient: Client;
  private baseUrl: string;
  private apiVersion: string;

  constructor() {
    this.baseUrl = process.env.FIDELITY_API_BASE_URL || 'https://api.fidelity.com';
    this.apiVersion = 'v1';
    
    this.client = axios.create({
      baseURL: `${this.baseUrl}/${this.apiVersion}`,
      timeout: 60000, // Fidelity may have slower response times
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'InvestmentPlatform/1.0'
      }
    });

    this.sftpClient = new Client();
    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor for authentication
    this.client.interceptors.request.use(
      (config) => {
        // Add API key authentication
        const apiKey = this.getApiKey();
        if (apiKey) {
          config.headers['X-API-Key'] = apiKey;
        }

        // Add certificate authentication if configured
        const certPath = this.getCertificatePath();
        if (certPath && fs.existsSync(certPath)) {
          // Certificate authentication setup would go here
        }
        
        logger.debug('Fidelity API Request', {
          method: config.method,
          url: config.url,
          headers: { ...config.headers, 'X-API-Key': '[REDACTED]' }
        });
        
        return config;
      },
      (error) => {
        logger.error('Fidelity API Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        logger.debug('Fidelity API Response', {
          status: response.status,
          url: response.config.url,
          dataLength: JSON.stringify(response.data).length
        });
        return response;
      },
      async (error) => {
        logger.error('Fidelity API Response Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
          url: error.config?.url,
          data: error.response?.data
        });

        // Handle authentication errors
        if (error.response?.status === 401) {
          logger.warn('Fidelity API authentication failed');
          // Fidelity typically uses API keys that don't expire, so this indicates a configuration issue
        }

        // Handle rate limiting - Fidelity uses different rate limits
        if (error.response?.status === 429) {
          const retryAfter = error.response.headers['retry-after'] || 120;
          logger.warn(`Fidelity API rate limited. Retrying after ${retryAfter} seconds`);
          await this.delay(retryAfter * 1000);
          return this.client.request(error.config);
        }

        // Handle server errors with exponential backoff
        if (error.response?.status >= 500) {
          const retryCount = error.config.__retryCount || 0;
          if (retryCount < 3) {
            error.config.__retryCount = retryCount + 1;
            const delay = Math.pow(2, retryCount) * 1000;
            logger.warn(`Fidelity API server error. Retrying in ${delay}ms (attempt ${retryCount + 1})`);
            await this.delay(delay);
            return this.client.request(error.config);
          }
        }

        return Promise.reject(error);
      }
    );
  }

  async validateConfig(config: CustodianConnectionConfig & { connectionType?: APIConnectionType }): Promise<any> {
    // Validate Fidelity-specific configuration requirements
    if (config.connectionType === APIConnectionType.REST_API) {
      if (!config.authentication.credentials.apiKey) {
        throw new Error('Fidelity API Key is required for REST API connections');
      }
    } else if (config.connectionType === APIConnectionType.SFTP) {
      if (!config.fileTransfer) {
        throw new Error('File transfer configuration is required for SFTP connections');
      }
      
      if (!config.fileTransfer.host || !config.fileTransfer.directory) {
        throw new Error('SFTP host and directory are required');
      }
      
      if (!config.authentication.credentials.username || !config.authentication.credentials.password) {
        throw new Error('SFTP username and password are required');
      }
    } else {
      throw new Error('Fidelity supports REST API and SFTP connection types');
    }

    // Validate data mapping configuration
    if (!config.dataMapping || !config.dataMapping.positionMapping) {
      throw new Error('Fidelity data mapping configuration is required');
    }
  }

  async testConnection(config: CustodianConnectionConfig & { connectionType?: APIConnectionType }): Promise<ConnectionTestResult[]> {
    const results: ConnectionTestResult[] = [];

    try {
      if (config.connectionType === APIConnectionType.REST_API) {
        // Test REST API connection
        const authResult = await this.testApiAuthentication(config);
        results.push(authResult);

        if (authResult.success) {
          const connectivityResult = await this.testApiConnectivity(config);
          results.push(connectivityResult);

          const dataRetrievalResult = await this.testApiDataRetrieval(config);
          results.push(dataRetrievalResult);
        }
      } else if (config.connectionType === APIConnectionType.SFTP) {
        // Test SFTP connection
        const sftpResult = await this.testSftpConnection(config);
        results.push(sftpResult);
      }

    } catch (error: any) {
      logger.error('Fidelity connection test failed:', error);
      results.push({
        testType: 'CONNECTIVITY',
        success: false,
        responseTime: 0,
        errorMessage: error instanceof Error ? error.message : String(error)
      });
    }

    return results;
  }

  private async testApiAuthentication(config: CustodianConnectionConfig & { connectionType?: APIConnectionType }): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    
    try {
      // Set API key for test
      const originalHeaders = this.client.defaults.headers;
      this.client.defaults.headers['X-API-Key'] = config.authentication.credentials.apiKey || '';
      
      const response = await this.client.get('/auth/validate', {
        timeout: 10000
      });
      
      // Restore original headers
      this.client.defaults.headers = originalHeaders;
      
      return {
        testType: 'AUTHENTICATION',
        success: response.status === 200,
        responseTime: Date.now() - startTime,
        details: { statusCode: response.status }
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
      const response = await this.client.get('/accounts/summary', {
        timeout: 15000
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
        params: { limit: 1 },
        timeout: 20000
      });
      
      return {
        testType: 'DATA_RETRIEVAL',
        success: response.status === 200,
        responseTime: Date.now() - startTime,
        details: { 
          statusCode: response.status,
          recordCount: response.data?.positions?.length || 0
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

  private async testSftpConnection(config: CustodianConnectionConfig): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    
    try {
      await this.sftpClient.connect({
        host: config.fileTransfer!.host,
        port: config.fileTransfer!.port || 22,
        username: config.authentication.credentials.username,
        password: config.authentication.credentials.password,
        readyTimeout: 10000
      });

      // Test directory access
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

  async retrieveData(connection: CustodianConnection, request: DataFeedRequest): Promise<any> {
    try {
      logger.info('Retrieving data from Fidelity', {
        feedType: request.feedType,
        portfolioId: request.portfolioId,
        connectionType: connection.connectionType
      });

      if (connection.connectionType === APIConnectionType.REST_API) {
        return await this.retrieveDataViaApi(connection, request);
      } else if (connection.connectionType === APIConnectionType.SFTP) {
        return await this.retrieveDataViaSftp(connection, request);
      } else {
        throw new Error(`Unsupported connection type: ${connection.connectionType}`);
      }

    } catch (error: any) {
      logger.error('Error retrieving data from Fidelity:', error);
      throw error;
    }
  }

  private async retrieveDataViaApi(connection: CustodianConnection, request: DataFeedRequest): Promise<any> {
    let endpoint = '';
    let params: any = {};

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
          params.startDate = request.dateFrom.toISOString().split('T')[0];
        }
        if (request.dateTo) {
          params.endDate = request.dateTo.toISOString().split('T')[0];
        }
        break;

      case DataFeedType.CASH_BALANCES:
        endpoint = '/balances';
        if (request.accountNumber) {
          params.accountNumber = request.accountNumber;
        }
        break;

      case DataFeedType.CORPORATE_ACTIONS:
        endpoint = '/corporate-actions';
        params.startDate = request.dateFrom?.toISOString().split('T')[0];
        params.endDate = request.dateTo?.toISOString().split('T')[0];
        break;

      default:
        throw new Error(`Unsupported feed type: ${request.feedType}`);
    }

    const response = await this.client.get(endpoint, { params });
    
    return {
      records: this.transformFidelityApiData(response.data, request.feedType),
      metadata: {
        recordCount: response.data?.length || 0,
        retrievedAt: new Date(),
        endpoint,
        params,
        source: 'API'
      }
    };
  }

  private async retrieveDataViaSftp(connection: CustodianConnection, request: DataFeedRequest): Promise<any> {
    try {
      // Connect to SFTP server
      await this.sftpClient.connect({
        host: connection.connectionConfig.fileTransfer!.host,
        port: connection.connectionConfig.fileTransfer!.port || 22,
        username: connection.connectionConfig.authentication.credentials.username,
        password: connection.connectionConfig.authentication.credentials.password,
        readyTimeout: 30000
      });

      // Determine file pattern based on feed type
      const filePattern = this.getFidelityFilePattern(request.feedType, request.dateFrom, request.dateTo);
      
      // List files matching pattern
      const files = await this.sftpClient.list(connection.connectionConfig.fileTransfer!.directory);
      const matchingFiles = files.filter((file: any) => this.matchesPattern(file.name, filePattern));

      if (matchingFiles.length === 0) {
        throw new Error(`No files found matching pattern: ${filePattern}`);
      }

      // Download and process files
      const allRecords: any[] = [];
      for (const file of matchingFiles) {
        const localPath = path.join('/tmp', file.name);
        const remotePath = path.join(connection.connectionConfig.fileTransfer!.directory, file.name);
        
        await this.sftpClient.fastGet(remotePath, localPath);
        
        const records = await this.parseFidelityFile(localPath, request.feedType);
        allRecords.push(...records);
        
        // Clean up local file
        fs.unlinkSync(localPath);
      }

      await this.sftpClient.end();

      return {
        records: allRecords,
        metadata: {
          recordCount: allRecords.length,
          retrievedAt: new Date(),
          filesProcessed: matchingFiles.map((f: any) => f.name),
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

  async submitOrders(connection: CustodianConnection, request: OrderSubmissionRequest): Promise<OrderSubmissionResponse> {
    try {
      logger.info('Submitting orders to Fidelity', {
        portfolioId: request.portfolioId,
        orderCount: request.orders.length
      });

      // Fidelity typically doesn't support direct order submission via API
      // This would be implemented based on their specific requirements
      
      throw new Error('Order submission not supported for Fidelity integration. Please use Fidelity WorkStation for order entry.');

    } catch (error: any) {
      logger.error('Error submitting orders to Fidelity:', error);
      throw error;
    }
  }

  async retrieveDocuments(connection: CustodianConnection, request: DocumentRetrievalRequest): Promise<any[]> {
    try {
      logger.info('Retrieving documents from Fidelity', {
        documentType: request.documentType,
        portfolioId: request.portfolioId
      });

      if (connection.connectionType === APIConnectionType.SFTP) {
        return await this.retrieveDocumentsViaSftp(connection, request);
      } else {
        // API document retrieval
        let endpoint = '/documents';
        const params: any = {
          documentType: request.documentType.toLowerCase()
        };

        if (request.accountNumber) {
          params.accountNumber = request.accountNumber;
        }

        if (request.dateFrom) {
          params.startDate = request.dateFrom.toISOString().split('T')[0];
        }

        if (request.dateTo) {
          params.endDate = request.dateTo.toISOString().split('T')[0];
        }

        const response = await this.client.get(endpoint, { params });

        return response.data.documents.map((doc: any) => ({
          documentId: doc.documentId,
          fileName: doc.fileName,
          fileSize: doc.fileSize,
          documentDate: new Date(doc.documentDate),
          downloadUrl: doc.downloadUrl,
          expiresAt: doc.expiresAt ? new Date(doc.expiresAt) : undefined,
          status: 'AVAILABLE'
        }));
      }

    } catch (error: any) {
      logger.error('Error retrieving documents from Fidelity:', error);
      throw error;
    }
  }

  private async retrieveDocumentsViaSftp(connection: CustodianConnection, request: DocumentRetrievalRequest): Promise<any[]> {
    // Implementation for SFTP document retrieval
    // This would download documents from the SFTP server
    return [];
  }

  async healthCheck(connection: CustodianConnection): Promise<boolean> {
    try {
      if (connection.connectionType === APIConnectionType.REST_API) {
        const response = await this.client.get('/health', { timeout: 5000 });
        return response.status === 200;
      } else {
        // SFTP health check
        await this.sftpClient.connect({
          host: connection.connectionConfig.fileTransfer!.host,
          port: connection.connectionConfig.fileTransfer!.port || 22,
          username: connection.connectionConfig.authentication.credentials.username,
          password: connection.connectionConfig.authentication.credentials.password,
          readyTimeout: 5000
        });
        await this.sftpClient.end();
        return true;
      }
    } catch (error: any) {
      logger.error('Fidelity health check failed:', error);
      return false;
    }
  }

  private getApiKey(): string | null {
    return process.env.FIDELITY_API_KEY || null;
  }

  private getCertificatePath(): string | null {
    return process.env.FIDELITY_CERT_PATH || null;
  }

  private transformFidelityApiData(data: any, feedType: DataFeedType): any[] {
    // Transform Fidelity API data format to our standard format
    switch (feedType) {
      case DataFeedType.POSITIONS:
        return data.positions?.map((pos: any) => ({
          symbol: pos.instrumentSymbol,
          cusip: pos.cusip,
          description: pos.instrumentDescription,
          quantity: pos.quantity,
          unitPrice: pos.marketValue / pos.quantity,
          marketValue: pos.marketValue,
          costBasis: pos.costBasis,
          unrealizedGainLoss: pos.marketValue - pos.costBasis,
          currency: pos.currency || 'USD',
          assetType: pos.instrumentType
        })) || [];

      case DataFeedType.TRANSACTIONS:
        return data.transactions?.map((txn: any) => ({
          transactionId: txn.transactionId,
          symbol: txn.instrumentSymbol,
          description: txn.instrumentDescription,
          transactionType: txn.activityType,
          tradeDate: new Date(txn.tradeDate),
          settlementDate: new Date(txn.settlementDate),
          quantity: txn.quantity,
          unitPrice: txn.price,
          grossAmount: txn.netAmount,
          netAmount: txn.netAmount,
          fees: txn.fees || 0,
          commission: txn.commission || 0
        })) || [];

      default:
        return data;
    }
  }

  private getFidelityFilePattern(feedType: DataFeedType, dateFrom?: Date, dateTo?: Date): string {
    const dateStr = dateFrom ? dateFrom.toISOString().split('T')[0].replace(/-/g, '') : '*';
    
    switch (feedType) {
      case DataFeedType.POSITIONS:
        return `positions_${dateStr}.csv`;
      case DataFeedType.TRANSACTIONS:
        return `transactions_${dateStr}.csv`;
      case DataFeedType.CASH_BALANCES:
        return `balances_${dateStr}.csv`;
      default:
        return `*_${dateStr}.csv`;
    }
  }

  private matchesPattern(fileName: string, pattern: string): boolean {
    // Simple pattern matching - in production this would be more sophisticated
    const regex = new RegExp(pattern.replace(/\*/g, '.*'));
    return regex.test(fileName);
  }

  private async parseFidelityFile(filePath: string, feedType: DataFeedType): Promise<any[]> {
    // Parse CSV files from Fidelity SFTP
    // This is a simplified implementation - production would use a proper CSV parser
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const records: any[] = [];

    // Skip header row
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line) {
        const fields = line.split(',');
        const record = this.parseFidelityRecord(fields, feedType);
        if (record) {
          records.push(record);
        }
      }
    }

    return records;
  }

  private parseFidelityRecord(fields: string[], feedType: DataFeedType): any | null {
    // Parse individual record based on Fidelity file format
    // This would be implemented based on Fidelity's actual file specifications
    
    try {
      switch (feedType) {
        case DataFeedType.POSITIONS:
          return {
            symbol: fields[0],
            cusip: fields[1],
            description: fields[2],
            quantity: parseFloat(fields[3]),
            unitPrice: parseFloat(fields[4]),
            marketValue: parseFloat(fields[5]),
            costBasis: parseFloat(fields[6])
          };
        
        case DataFeedType.TRANSACTIONS:
          return {
            transactionId: fields[0],
            symbol: fields[1],
            transactionType: fields[2],
            tradeDate: new Date(fields[3]),
            quantity: parseFloat(fields[4]),
            unitPrice: parseFloat(fields[5]),
            netAmount: parseFloat(fields[6])
          };
        
        default:
          return null;
      }
    } catch (error: any) {
      logger.warn('Error parsing Fidelity record:', { fields, error: error instanceof Error ? error.message : String(error) });
      return null;
    }
  }

  private delay(ms: number): Promise<any> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

