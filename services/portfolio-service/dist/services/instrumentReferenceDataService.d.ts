import { PrismaClient } from '@prisma/client';
import { InstrumentMaster, CorporateAction, CreateInstrumentRequest, UpdateInstrumentRequest, SearchInstrumentRequest, ProcessCorporateActionRequest, InstrumentLookupRequest, BulkInstrumentUpdateRequest, InstrumentValidationResult, InstrumentSearchResult, DataQualityReport } from '../models/assets/InstrumentReferenceData';
export declare class InstrumentReferenceDataService {
    private prisma;
    private kafkaService;
    constructor(prisma: PrismaClient, kafkaService: any);
    createInstrument(request: CreateInstrumentRequest): Promise<InstrumentMaster>;
    updateInstrument(request: UpdateInstrumentRequest): Promise<InstrumentMaster>;
    searchInstruments(request: SearchInstrumentRequest): Promise<InstrumentSearchResult>;
    lookupInstrument(request: InstrumentLookupRequest): Promise<InstrumentMaster | null>;
    processCorporateAction(request: ProcessCorporateActionRequest): Promise<CorporateAction>;
    getCorporateActions(securityId: string): Promise<CorporateAction[]>;
    updateMarketData(securityId: string, marketData: any): Promise<any>;
    getMarketData(securityId: string): Promise<any>;
    bulkUpdateInstruments(request: BulkInstrumentUpdateRequest): Promise<{
        successful: string[];
        failed: Array<{
            securityId: string;
            error: string;
        }>;
    }>;
    validateInstrumentData(securityId: string, tenantId: string): Promise<InstrumentValidationResult>;
    generateDataQualityReport(securityId: string, tenantId: string): Promise<DataQualityReport>;
    private findInstrumentByIdentifiers;
    private validateInstrumentRequest;
    private validateInstrumentUpdate;
    private validateCorporateActionRequest;
    private validateCUSIP;
    private validateISIN;
    private calculateCUSIPCheckDigit;
    private validateISINCheckDigit;
    private assessDataQuality;
    private generateActionCode;
    private generateActionDescription;
    private scheduleCorporateActionProcessing;
    private validateInstrumentUpdateDuplicate;
    private enrichWithMarketData;
    private getCorporateActionsBySecurityId;
    private applyDividendAction;
    private applyStockSplitAction;
    private applyMergerAction;
    private processInBatch;
}
