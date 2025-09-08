export const __esModule: boolean;
export class SchwabIntegrationService {
    client: any;
    baseUrl: string;
    apiVersion: string;
    setupInterceptors(): void;
    validateConfig(config: any): Promise<void>;
    testConnection(config: any): Promise<({
        testType: string;
        success: boolean;
        responseTime: number;
        details: {
            tokenType: any;
        };
        errorMessage?: undefined;
    } | {
        testType: string;
        success: boolean;
        responseTime: number;
        errorMessage: string;
        details?: undefined;
    } | {
        testType: string;
        success: boolean;
        responseTime: number;
        details: {
            statusCode: any;
        };
        errorMessage?: undefined;
    })[]>;
    testAuthentication(config: any): Promise<{
        testType: string;
        success: boolean;
        responseTime: number;
        details: {
            tokenType: any;
        };
        errorMessage?: undefined;
    } | {
        testType: string;
        success: boolean;
        responseTime: number;
        errorMessage: string;
        details?: undefined;
    }>;
    testConnectivity(config: any): Promise<{
        testType: string;
        success: boolean;
        responseTime: number;
        details: {
            statusCode: any;
        };
        errorMessage?: undefined;
    } | {
        testType: string;
        success: boolean;
        responseTime: number;
        errorMessage: string;
        details?: undefined;
    }>;
    testDataRetrieval(config: any): Promise<{
        testType: string;
        success: boolean;
        responseTime: number;
        details: {
            statusCode: any;
            recordCount: any;
        };
        errorMessage?: undefined;
    } | {
        testType: string;
        success: boolean;
        responseTime: number;
        errorMessage: string;
        details?: undefined;
    }>;
    testOrderSubmission(config: any): Promise<{
        testType: string;
        success: boolean;
        responseTime: number;
        details: {
            statusCode: any;
        };
        errorMessage?: undefined;
    } | {
        testType: string;
        success: boolean;
        responseTime: number;
        errorMessage: string;
        details?: undefined;
    }>;
    retrieveData(connection: any, request: any): Promise<{
        records: any;
        metadata: {
            recordCount: any;
            retrievedAt: Date;
            endpoint: string;
            params: {};
        };
    }>;
    submitOrders(connection: any, request: any): Promise<{
        submissionId: `${string}-${string}-${string}-${string}-${string}`;
        orderStatuses: ({
            internalOrderId: any;
            custodianOrderId: any;
            status: string;
            filledQuantity: any;
            averageFillPrice: any;
            rejectionReason?: undefined;
        } | {
            internalOrderId: any;
            custodianOrderId: any;
            status: string;
            rejectionReason: string;
            filledQuantity?: undefined;
            averageFillPrice?: undefined;
        })[];
        overallStatus: string;
        errors: {
            errorCode: string;
            errorMessage: string;
            severity: string;
            timestamp: Date;
            resolved: boolean;
        }[];
    }>;
    retrieveDocuments(connection: any, request: any): Promise<any>;
    healthCheck(connection: any): Promise<boolean>;
    authenticate(config: any): Promise<{
        success: boolean;
        tokenType: any;
        expiresIn: any;
    }>;
    refreshAuthToken(): Promise<void>;
    getAuthToken(): string;
    storeAuthToken(token: any, expiresIn: any): void;
    transformOrderToSchwabFormat(order: any): {
        accountNumber: any;
        orderType: any;
        session: string;
        duration: any;
        orderStrategyType: string;
        orderLegCollection: {
            instruction: any;
            quantity: any;
            instrument: {
                symbol: any;
                assetType: string;
            };
        }[];
    };
    delay(ms: any): Promise<any>;
}
