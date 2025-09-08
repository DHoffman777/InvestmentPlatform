import { CustodianConnection, CustodianConnectionConfig, DataFeedRequest, OrderSubmissionRequest, OrderSubmissionResponse, DocumentRetrievalRequest, ConnectionTestResult, APIConnectionType } from '../../../models/custodianIntegration/CustodianIntegration';
export declare class FidelityIntegrationService {
    private client;
    private sftpClient;
    private baseUrl;
    private apiVersion;
    constructor();
    private setupInterceptors;
    validateConfig(config: CustodianConnectionConfig & {
        connectionType?: APIConnectionType;
    }): Promise<any>;
    testConnection(config: CustodianConnectionConfig & {
        connectionType?: APIConnectionType;
    }): Promise<ConnectionTestResult[]>;
    private testApiAuthentication;
    private testApiConnectivity;
    private testApiDataRetrieval;
    private testSftpConnection;
    retrieveData(connection: CustodianConnection, request: DataFeedRequest): Promise<any>;
    private retrieveDataViaApi;
    private retrieveDataViaSftp;
    submitOrders(connection: CustodianConnection, request: OrderSubmissionRequest): Promise<OrderSubmissionResponse>;
    retrieveDocuments(connection: CustodianConnection, request: DocumentRetrievalRequest): Promise<any[]>;
    private retrieveDocumentsViaSftp;
    healthCheck(connection: CustodianConnection): Promise<boolean>;
    private getApiKey;
    private getCertificatePath;
    private transformFidelityApiData;
    private getFidelityFilePattern;
    private matchesPattern;
    private parseFidelityFile;
    private parseFidelityRecord;
    private delay;
}
