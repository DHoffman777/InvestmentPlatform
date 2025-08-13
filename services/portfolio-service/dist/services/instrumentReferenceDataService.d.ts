import { PrismaClient } from '@prisma/client';
import { InstrumentMaster, CorporateAction, MarketDataSnapshot, CreateInstrumentRequest, UpdateInstrumentRequest, SearchInstrumentRequest, ProcessCorporateActionRequest, InstrumentLookupRequest, BulkInstrumentUpdateRequest, InstrumentValidationResult, InstrumentSearchResult, DataQualityReport } from '../models/assets/InstrumentReferenceData';
export declare class InstrumentReferenceDataService {
    private prisma;
    private kafkaService;
    constructor(prisma: PrismaClient, kafkaService: any);
    createInstrument(request: CreateInstrumentRequest): Promise<InstrumentMaster>;
    updateInstrument(request: UpdateInstrumentRequest): Promise<InstrumentMaster>;
    searchInstruments(request: SearchInstrumentRequest): Promise<InstrumentSearchResult>;
    lookupInstrument(request: InstrumentLookupRequest): Promise<InstrumentMaster | null>;
    processCorporateAction(request: ProcessCorporateActionRequest): Promise<CorporateAction>;
    getCorporateActions(instrumentId: string, tenantId: string): Promise<CorporateAction[]>;
    updateMarketData(instrumentId: string, marketData: Partial<MarketDataSnapshot>, tenantId: string): Promise<void>;
    getMarketData(instrumentId: string, tenantId: string): Promise<MarketDataSnapshot | null>;
    bulkUpdateInstruments(request: BulkInstrumentUpdateRequest): Promise<{
        successful: string[];
        failed: Array<{
            instrumentId: string;
            error: string;
        }>;
    }>;
    validateInstrumentData(instrumentId: string, tenantId: string): Promise<InstrumentValidationResult>;
    generateDataQualityReport(instrumentId: string, tenantId: string): Promise<DataQualityReport>;
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
}
