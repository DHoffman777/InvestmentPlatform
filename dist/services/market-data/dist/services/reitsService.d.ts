export const __esModule: boolean;
export class REITsService {
    constructor(prisma: any);
    prisma: any;
    upsertREIT(reitData: any): Promise<any>;
    upsertMLP(mlpData: any): Promise<any>;
    searchREITsAndMLPs(filters: any): Promise<any[]>;
    getREITOrMLPDetails(symbol: any): Promise<any>;
    storeREITMetadata(securityId: any, metadata: any): Promise<void>;
    getREITMetadata(securityId: any): Promise<any>;
}
