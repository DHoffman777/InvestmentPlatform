export const __esModule: boolean;
export class InstrumentReferenceDataService {
    constructor(prisma: any, kafkaService: any);
    prisma: any;
    kafkaService: any;
    createInstrument(request: any): Promise<any>;
    updateInstrument(request: any): Promise<any>;
    searchInstruments(request: any): Promise<{
        instruments: any;
        total: any;
        hasMore: boolean;
        searchQuery: any;
        filters: {
            instrumentType: any;
            securityType: any;
            exchange: any;
            currency: any;
            isActive: any;
        };
    }>;
    lookupInstrument(request: any): Promise<any>;
    processCorporateAction(request: any): Promise<any>;
    getCorporateActions(securityId: any, tenantId: any): Promise<any>;
    updateMarketData(securityId: any, marketData: any, tenantId: any): Promise<void>;
    getMarketData(securityId: any, tenantId: any): Promise<any>;
    bulkUpdateInstruments(request: any): Promise<{
        successful: any[];
        failed: any[];
    }>;
    validateInstrumentData(securityId: any, tenantId: any): Promise<{
        instrumentId: any;
        isValid: boolean;
        errors: string[];
        dataQuality: string;
        warnings?: undefined;
        suggestions?: undefined;
    } | {
        instrumentId: any;
        isValid: boolean;
        errors: string[];
        warnings: string[];
        suggestions: string[];
        dataQuality: string;
    }>;
    generateDataQualityReport(securityId: any, tenantId: any): Promise<{
        instrumentId: any;
        overallQuality: string;
        fieldQuality: {};
        missingFields: any[];
        inconsistencies: string[];
        lastValidated: Date;
        recommendations: string[];
    }>;
    findInstrumentByIdentifiers(identifiers: any, tenantId: any): Promise<any>;
    validateInstrumentRequest(request: any): {
        securityId: any;
        isValid: boolean;
        errors: string[];
        dataQuality: string;
    };
    validateInstrumentUpdate(existing: any, updates: any): {
        securityId: any;
        isValid: boolean;
        errors: string[];
        dataQuality: string;
    };
    validateCorporateActionRequest(request: any): {
        securityId: any;
        isValid: boolean;
        errors: string[];
        dataQuality: string;
    };
    validateCUSIP(cusip: any): {
        identifier: any;
        identifierType: string;
        isValid: boolean;
        checkDigitValid: boolean;
        formatValid: boolean;
        errors: string[];
    };
    validateISIN(isin: any): {
        identifier: any;
        identifierType: string;
        isValid: boolean;
        checkDigitValid: boolean;
        formatValid: boolean;
        errors: string[];
    };
    calculateCUSIPCheckDigit(cusipBase: any): number;
    validateISINCheckDigit(isin: any): boolean;
    assessDataQuality(instrument: any): "EXCELLENT" | "GOOD" | "FAIR" | "POOR" | "UNVERIFIED";
    generateActionCode(actionType: any): any;
    generateActionDescription(actionType: any, details: any): string;
    scheduleCorporateActionProcessing(action: any): Promise<void>;
}
