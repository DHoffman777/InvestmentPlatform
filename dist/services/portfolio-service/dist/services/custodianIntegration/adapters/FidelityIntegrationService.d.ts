export const __esModule: boolean;
export class FidelityIntegrationService {
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
            statusCode: any;
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
            fileCount: any;
            directory: any;
        };
        errorMessage?: undefined;
    })[]>;
    testApiAuthentication(config: any): Promise<{
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
    retrieveData(connection: any, request: any): Promise<{
        records: any;
        metadata: {
            recordCount: any;
            retrievedAt: Date;
            endpoint: string;
            params: {
                accountNumber: any;
                startDate: any;
                endDate: any;
            };
            source: string;
        };
    } | {
        records: ({
            symbol: any;
            cusip: any;
            description: any;
            quantity: number;
            unitPrice: number;
            marketValue: number;
            costBasis: number;
            transactionId?: undefined;
            transactionType?: undefined;
            tradeDate?: undefined;
            netAmount?: undefined;
        } | {
            transactionId: any;
            symbol: any;
            transactionType: any;
            tradeDate: Date;
            quantity: number;
            unitPrice: number;
            netAmount: number;
            cusip?: undefined;
            description?: undefined;
            marketValue?: undefined;
            costBasis?: undefined;
        })[];
        metadata: {
            recordCount: number;
            retrievedAt: Date;
            filesProcessed: any;
            source: string;
        };
    }>;
    retrieveDataViaApi(connection: any, request: any): Promise<{
        records: any;
        metadata: {
            recordCount: any;
            retrievedAt: Date;
            endpoint: string;
            params: {
                accountNumber: any;
                startDate: any;
                endDate: any;
            };
            source: string;
        };
    }>;
    retrieveDataViaSftp(connection: any, request: any): Promise<{
        records: ({
            symbol: any;
            cusip: any;
            description: any;
            quantity: number;
            unitPrice: number;
            marketValue: number;
            costBasis: number;
            transactionId?: undefined;
            transactionType?: undefined;
            tradeDate?: undefined;
            netAmount?: undefined;
        } | {
            transactionId: any;
            symbol: any;
            transactionType: any;
            tradeDate: Date;
            quantity: number;
            unitPrice: number;
            netAmount: number;
            cusip?: undefined;
            description?: undefined;
            marketValue?: undefined;
            costBasis?: undefined;
        })[];
        metadata: {
            recordCount: number;
            retrievedAt: Date;
            filesProcessed: any;
            source: string;
        };
    }>;
    submitOrders(connection: any, request: any): Promise<void>;
    retrieveDocuments(connection: any, request: any): Promise<any>;
    retrieveDocumentsViaSftp(connection: any, request: any): Promise<any[]>;
    healthCheck(connection: any): Promise<boolean>;
    getApiKey(): string;
    getCertificatePath(): string;
    transformFidelityApiData(data: any, feedType: any): any;
    getFidelityFilePattern(feedType: any, dateFrom: any, dateTo: any): string;
    matchesPattern(fileName: any, pattern: any): boolean;
    parseFidelityFile(filePath: any, feedType: any): Promise<({
        symbol: any;
        cusip: any;
        description: any;
        quantity: number;
        unitPrice: number;
        marketValue: number;
        costBasis: number;
        transactionId?: undefined;
        transactionType?: undefined;
        tradeDate?: undefined;
        netAmount?: undefined;
    } | {
        transactionId: any;
        symbol: any;
        transactionType: any;
        tradeDate: Date;
        quantity: number;
        unitPrice: number;
        netAmount: number;
        cusip?: undefined;
        description?: undefined;
        marketValue?: undefined;
        costBasis?: undefined;
    })[]>;
    parseFidelityRecord(fields: any, feedType: any): {
        symbol: any;
        cusip: any;
        description: any;
        quantity: number;
        unitPrice: number;
        marketValue: number;
        costBasis: number;
        transactionId?: undefined;
        transactionType?: undefined;
        tradeDate?: undefined;
        netAmount?: undefined;
    } | {
        transactionId: any;
        symbol: any;
        transactionType: any;
        tradeDate: Date;
        quantity: number;
        unitPrice: number;
        netAmount: number;
        cusip?: undefined;
        description?: undefined;
        marketValue?: undefined;
        costBasis?: undefined;
    };
    delay(ms: any): Promise<any>;
}
