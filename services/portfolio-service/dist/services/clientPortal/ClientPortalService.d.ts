import { ClientDashboardLayout, ClientMessage, ClientPreferences, ClientPortalSession, PortalAnalytics, DashboardDataRequest, DashboardDataResponse, MessageType, MessageStatus } from '../../models/clientPortal/ClientPortal';
export declare class ClientPortalService {
    private eventPublisher;
    constructor();
    getDashboardLayout(tenantId: string, clientId: string, layoutId?: string): Promise<ClientDashboardLayout>;
    updateDashboardLayout(tenantId: string, clientId: string, layoutId: string, updates: Partial<ClientDashboardLayout>): Promise<ClientDashboardLayout>;
    getDashboardData(request: DashboardDataRequest): Promise<DashboardDataResponse>;
    private getPortfolioSummaryData;
    private getPerformanceChartData;
    private getAssetAllocationData;
    private getRecentTransactionData;
    getClientMessages(clientId: string, options?: {
        status?: MessageStatus;
        type?: MessageType;
        limit?: number;
        offset?: number;
    }): Promise<{
        messages: ClientMessage[];
        totalCount: number;
    }>;
    markMessageAsRead(tenantId: string, clientId: string, messageId: string): Promise<void>;
    private getClientAlerts;
    private getClientDocuments;
    private getMarketNews;
    getClientPreferences(tenantId: string, clientId: string): Promise<ClientPreferences>;
    updateClientPreferences(tenantId: string, clientId: string, updates: Partial<ClientPreferences>): Promise<ClientPreferences>;
    createPortalSession(tenantId: string, clientId: string, userId: string, deviceInfo: any): Promise<ClientPortalSession>;
    getPortalAnalytics(tenantId: string, clientId: string, period: {
        startDate: Date;
        endDate: Date;
    }): Promise<PortalAnalytics>;
    private generateSessionToken;
    private saveDashboardLayout;
    private saveClientPreferences;
    private savePortalSession;
    private updateMessageStatus;
}
