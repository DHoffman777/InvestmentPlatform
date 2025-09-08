export const __esModule: boolean;
export class FundsService {
    constructor(prisma: any);
    prisma: any;
    upsertETF(etfData: any): Promise<any>;
    upsertMutualFund(fundData: any): Promise<any>;
    searchFunds(filters: any): Promise<any[]>;
    getFundDetails(symbol: any): Promise<any>;
    getFundFamilies(): Promise<{
        name: any;
        count: any;
        totalAUM: any;
    }[]>;
    storeFundMetadata(securityId: any, metadata: any): Promise<void>;
    getFundMetadata(securityId: any): Promise<any>;
}
