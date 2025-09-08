export const __esModule: boolean;
export class PershingIntegrationService {
    client: any;
    sftpClient: any;
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
            expiresIn: any;
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
    } | {
        testType: string;
        success: boolean;
        responseTime: number;
        details: {
            fileCount: any;
            directory: any;
        };
        errorMessage?: undefined;
    } | {
        testType: string;
        success: boolean;
        responseTime: number;
        details: {
            connectionType: string;
        };
        errorMessage?: undefined;
    })[]>;
    testApiAuthentication(config: any): Promise<{
        testType: string;
        success: boolean;
        responseTime: number;
        details: {
            tokenType: any;
            expiresIn: any;
        };
        errorMessage?: undefined;
    } | {
        testType: string;
        success: boolean;
        responseTime: number;
        errorMessage: string;
        details?: undefined;
    }>;
    testApiConnectivity(config: any): Promise<{
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
    testApiDataRetrieval(config: any): Promise<{
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
    testSftpConnection(config: any): Promise<{
        testType: string;
        success: boolean;
        responseTime: number;
        details: {
            fileCount: any;
            directory: any;
        };
        errorMessage?: undefined;
    } | {
        testType: string;
        success: boolean;
        responseTime: number;
        errorMessage: string;
        details?: undefined;
    }>;
    testFtpConnection(config: any): Promise<{
        testType: string;
        success: boolean;
        responseTime: number;
        details: {
            connectionType: string;
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
        records: any[];
        metadata: {
            recordCount: number;
            retrievedAt: Date;
            endpoint: string;
            params: {
                asOfDate: string;
            };
            source: string;
            pagesRetrieved: number;
        };
    } | {
        records: ({
            accountNumber: any;
            symbol: any;
            cusip: any;
            quantity: number;
            unitPrice: number;
            marketValue: number;
            transactionId?: undefined;
            transactionType?: undefined;
            tradeDate?: undefined;
        } | {
            accountNumber: any;
            transactionId: any;
            symbol: any;
            transactionType: any;
            quantity: number;
            unitPrice: number;
            tradeDate: Date;
            cusip?: undefined;
            marketValue?: undefined;
        })[];
        metadata: {
            recordCount: number;
            retrievedAt: Date;
            filesProcessed: any;
            source: string;
        };
    } | {
        records: any[];
        metadata: {
            recordCount: number;
            retrievedAt: Date;
            source: string;
            note: string;
        };
    }>;
    retrieveDataViaApi(connection: any, request: any): Promise<{
        records: any[];
        metadata: {
            recordCount: number;
            retrievedAt: Date;
            endpoint: string;
            params: {
                asOfDate: string;
            };
            source: string;
            pagesRetrieved: number;
        };
    }>;
    retrieveDataViaSftp(connection: any, request: any): Promise<{
        records: ({
            accountNumber: any;
            symbol: any;
            cusip: any;
            quantity: number;
            unitPrice: number;
            marketValue: number;
            transactionId?: undefined;
            transactionType?: undefined;
            tradeDate?: undefined;
        } | {
            accountNumber: any;
            transactionId: any;
            symbol: any;
            transactionType: any;
            quantity: number;
            unitPrice: number;
            tradeDate: Date;
            cusip?: undefined;
            marketValue?: undefined;
        })[];
        metadata: {
            recordCount: number;
            retrievedAt: Date;
            filesProcessed: any;
            source: string;
        };
    }>;
    retrieveDataViaFtp(connection: any, request: any): Promise<{
        records: any[];
        metadata: {
            recordCount: number;
            retrievedAt: Date;
            source: string;
            note: string;
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
    retrieveDocumentsViaFileTransfer(connection: any, request: any): Promise<any[]>;
    healthCheck(connection: any): Promise<boolean>;
    authenticate(config: any): Promise<{
        success: boolean;
        tokenType: any;
        expiresIn: any;
    }>;
    refreshAuthToken(): Promise<boolean>;
    getAuthToken(): string;
    getCertificateConfig(): any;
    storeAuthToken(token: any, expiresIn: any): void;
    transformPershingApiData(data: any, feedType: any): any;
    transformOrderToPershingFormat(order: any): {
        accountNumber: any;
        instrumentSymbol: any;
        orderType: any;
        side: any;
        quantity: any;
        price: any;
        stopPrice: any;
        timeInForce: any;
        specialInstructions: any;
        orderDate: string;
    };
    getPershingFilePattern(feedType: any, dateFrom: any, dateTo: any): string;
    matchesPattern(fileName: any, pattern: any): boolean;
    parsePershingFile(filePath: any, feedType: any): Promise<({
        accountNumber: any;
        symbol: any;
        cusip: any;
        quantity: number;
        unitPrice: number;
        marketValue: number;
        transactionId?: undefined;
        transactionType?: undefined;
        tradeDate?: undefined;
    } | {
        accountNumber: any;
        transactionId: any;
        symbol: any;
        transactionType: any;
        quantity: number;
        unitPrice: number;
        tradeDate: Date;
        cusip?: undefined;
        marketValue?: undefined;
    })[]>;
    parsePershingRecord(line: any, feedType: any): {
        accountNumber: any;
        symbol: any;
        cusip: any;
        quantity: number;
        unitPrice: number;
        marketValue: number;
        transactionId?: undefined;
        transactionType?: undefined;
        tradeDate?: undefined;
    } | {
        accountNumber: any;
        transactionId: any;
        symbol: any;
        transactionType: any;
        quantity: number;
        unitPrice: number;
        tradeDate: Date;
        cusip?: undefined;
        marketValue?: undefined;
    };
    parsePershingDate(dateStr: any): Date;
    delay(ms: any): Promise<any>;
}
