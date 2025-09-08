import { CustodianConnection, CustodianConnectionConfig, DataFeedRequest, OrderSubmissionRequest, OrderSubmissionResponse, DocumentRetrievalRequest, ConnectionTestResult } from '../../../models/custodianIntegration/CustodianIntegration';
export declare class SchwabIntegrationService {
    private client;
    private baseUrl;
    private apiVersion;
    constructor();
    private setupInterceptors;
    validateConfig(config: CustodianConnectionConfig): Promise<any>;
    testConnection(config: CustodianConnectionConfig): Promise<ConnectionTestResult[]>;
    private testAuthentication;
    private testConnectivity;
    private testDataRetrieval;
    private testOrderSubmission;
    retrieveData(connection: CustodianConnection, request: DataFeedRequest): Promise<any>;
    submitOrders(connection: CustodianConnection, request: OrderSubmissionRequest): Promise<OrderSubmissionResponse>;
    retrieveDocuments(connection: CustodianConnection, request: DocumentRetrievalRequest): Promise<any[]>;
    healthCheck(connection: CustodianConnection): Promise<boolean>;
    private authenticate;
    private refreshAuthToken;
    private getAuthToken;
    private storeAuthToken;
    private transformOrderToSchwabFormat;
    private delay;
}
