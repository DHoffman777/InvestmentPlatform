export declare class CommunicationService {
    getClientCommunications(clientId: string, tenantId: string, options: {
        limit: number;
        offset: number;
    }): Promise<{
        communications: never[];
        total: number;
        limit: number;
        offset: number;
        hasMore: boolean;
    }>;
    getCommunicationsByIds(communicationIds: string[]): Promise<never[]>;
    createCommunication(data: any): Promise<any>;
    getCommunications(filters: any): Promise<{
        communications: never[];
        total: number;
        limit: any;
        offset: any;
        hasMore: boolean;
    }>;
    getCommunicationById(communicationId: string, tenantId: string): Promise<{
        id: string;
        tenantId: string;
        subject: string;
        content: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateCommunication(communicationId: string, data: any, tenantId: string): Promise<any>;
    deleteCommunication(communicationId: string, reason: string, userId: string, tenantId: string): Promise<{
        success: boolean;
    }>;
    searchCommunications(tenantId: string, query: string, filters: any, options: {
        sortBy?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        communications: never[];
        total: number;
        facets: {};
        limit: number;
        offset: number;
        hasMore: boolean;
    }>;
}
