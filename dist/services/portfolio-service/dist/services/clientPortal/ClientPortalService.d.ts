export const __esModule: boolean;
export class ClientPortalService {
    eventPublisher: eventPublisher_1.EventPublisher;
    getDashboardLayout(tenantId: any, clientId: any, layoutId: any): Promise<{
        id: any;
        tenantId: any;
        clientId: any;
        name: string;
        description: string;
        widgets: ({
            id: `${string}-${string}-${string}-${string}-${string}`;
            type: ClientPortal_1.DashboardWidgetType;
            title: string;
            position: {
                row: number;
                column: number;
                width: number;
                height: number;
            };
            configuration: {
                showChart: boolean;
                period: string;
                timeframe?: undefined;
                showBenchmark?: undefined;
                chartType?: undefined;
                showTargets?: undefined;
                limit?: undefined;
                showPending?: undefined;
            };
            isVisible: boolean;
            refreshIntervalMs: number;
            lastUpdated: Date;
        } | {
            id: `${string}-${string}-${string}-${string}-${string}`;
            type: ClientPortal_1.DashboardWidgetType;
            title: string;
            position: {
                row: number;
                column: number;
                width: number;
                height: number;
            };
            configuration: {
                timeframe: string;
                showBenchmark: boolean;
                showChart?: undefined;
                period?: undefined;
                chartType?: undefined;
                showTargets?: undefined;
                limit?: undefined;
                showPending?: undefined;
            };
            isVisible: boolean;
            refreshIntervalMs: number;
            lastUpdated: Date;
        } | {
            id: `${string}-${string}-${string}-${string}-${string}`;
            type: ClientPortal_1.DashboardWidgetType;
            title: string;
            position: {
                row: number;
                column: number;
                width: number;
                height: number;
            };
            configuration: {
                chartType: string;
                showTargets: boolean;
                showChart?: undefined;
                period?: undefined;
                timeframe?: undefined;
                showBenchmark?: undefined;
                limit?: undefined;
                showPending?: undefined;
            };
            isVisible: boolean;
            refreshIntervalMs: number;
            lastUpdated: Date;
        } | {
            id: `${string}-${string}-${string}-${string}-${string}`;
            type: ClientPortal_1.DashboardWidgetType;
            title: string;
            position: {
                row: number;
                column: number;
                width: number;
                height: number;
            };
            configuration: {
                limit: number;
                showPending: boolean;
                showChart?: undefined;
                period?: undefined;
                timeframe?: undefined;
                showBenchmark?: undefined;
                chartType?: undefined;
                showTargets?: undefined;
            };
            isVisible: boolean;
            refreshIntervalMs: number;
            lastUpdated: Date;
        })[];
        isDefault: boolean;
        theme: {
            primaryColor: string;
            secondaryColor: string;
            backgroundColor: string;
            fontFamily: string;
            logoUrl: string;
        };
        createdAt: Date;
        updatedAt: Date;
        createdBy: any;
    }>;
    updateDashboardLayout(tenantId: any, clientId: any, layoutId: any, updates: any): Promise<any>;
    getDashboardData(request: any): Promise<{
        portfolioSummaries: any[];
        performanceData: any[];
        assetAllocations: any[];
        recentTransactions: any[];
        alerts: any[];
        messages: any[];
        watchlists: any[];
        documents: any[];
        goalProgress: any[];
        marketNews: any[];
        lastUpdated: Date;
    }>;
    getPortfolioSummaryData(clientId: any, portfolioIds: any): Promise<{
        portfolioId: `${string}-${string}-${string}-${string}-${string}`;
        portfolioName: string;
        totalValue: number;
        dayChange: number;
        dayChangePercent: number;
        totalReturn: number;
        totalReturnPercent: number;
        cash: number;
        asOfDate: Date;
    }[]>;
    getPerformanceChartData(clientId: any, portfolioIds: any, dateRange: any): Promise<{
        portfolioId: `${string}-${string}-${string}-${string}-${string}`;
        periods: {
            date: Date;
            value: number;
            benchmarkValue: number;
        }[];
        totalReturn: number;
        benchmarkReturn: number;
        timeframe: string;
    }[]>;
    getAssetAllocationData(clientId: any, portfolioIds: any): Promise<{
        portfolioId: `${string}-${string}-${string}-${string}-${string}`;
        allocations: {
            assetClass: string;
            value: number;
            percentage: number;
            target: number;
            color: string;
        }[];
        totalValue: number;
        asOfDate: Date;
    }[]>;
    getRecentTransactionData(clientId: any, portfolioIds: any): Promise<{
        transactionId: `${string}-${string}-${string}-${string}-${string}`;
        date: Date;
        symbol: string;
        description: string;
        type: string;
        quantity: number;
        price: number;
        amount: number;
        status: string;
    }[]>;
    getClientMessages(clientId: any, options?: {}): Promise<{
        messages: ({
            id: `${string}-${string}-${string}-${string}-${string}`;
            tenantId: string;
            clientId: any;
            type: ClientPortal_1.MessageType;
            subject: string;
            content: string;
            status: ClientPortal_1.MessageStatus;
            priority: ClientPortal_1.AlertPriority;
            sender: {
                id: string;
                name: string;
                role: string;
            };
            attachments: {
                id: `${string}-${string}-${string}-${string}-${string}`;
                fileName: string;
                fileSize: number;
                downloadUrl: string;
            }[];
            createdAt: Date;
            readAt?: undefined;
        } | {
            id: `${string}-${string}-${string}-${string}-${string}`;
            tenantId: string;
            clientId: any;
            type: ClientPortal_1.MessageType;
            subject: string;
            content: string;
            status: ClientPortal_1.MessageStatus;
            priority: ClientPortal_1.AlertPriority;
            sender: {
                id: string;
                name: string;
                role: string;
            };
            createdAt: Date;
            readAt: Date;
            attachments?: undefined;
        })[];
        totalCount: number;
    }>;
    markMessageAsRead(tenantId: any, clientId: any, messageId: any): Promise<void>;
    getClientAlerts(clientId: any): Promise<({
        id: `${string}-${string}-${string}-${string}-${string}`;
        tenantId: string;
        clientId: any;
        type: ClientPortal_1.AlertType;
        priority: ClientPortal_1.AlertPriority;
        title: string;
        message: string;
        data: {
            symbol: string;
            price: number;
            targetPrice: number;
        };
        isRead: boolean;
        isAcknowledged: boolean;
        createdAt: Date;
        readAt?: undefined;
    } | {
        id: `${string}-${string}-${string}-${string}-${string}`;
        tenantId: string;
        clientId: any;
        type: ClientPortal_1.AlertType;
        priority: ClientPortal_1.AlertPriority;
        title: string;
        message: string;
        isRead: boolean;
        isAcknowledged: boolean;
        createdAt: Date;
        readAt: Date;
        data?: undefined;
    })[]>;
    getClientDocuments(clientId: any): Promise<({
        documentId: `${string}-${string}-${string}-${string}-${string}`;
        title: string;
        type: string;
        category: string;
        size: number;
        uploadDate: Date;
        downloadUrl: string;
        previewUrl: string;
        isNew: boolean;
    } | {
        documentId: `${string}-${string}-${string}-${string}-${string}`;
        title: string;
        type: string;
        category: string;
        size: number;
        uploadDate: Date;
        downloadUrl: string;
        isNew: boolean;
        previewUrl?: undefined;
    })[]>;
    getMarketNews(clientId: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        headline: string;
        summary: string;
        source: string;
        publishedAt: Date;
        category: string;
        tags: string[];
        relevantSymbols: string[];
        articleUrl: string;
    }[]>;
    getClientPreferences(tenantId: any, clientId: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        tenantId: any;
        clientId: any;
        theme: string;
        language: string;
        timezone: string;
        currency: string;
        dateFormat: string;
        defaultDashboard: string;
        widgetRefreshInterval: number;
        emailNotifications: {
            statementReady: boolean;
            documentUploaded: boolean;
            priceAlerts: boolean;
            portfolioAlerts: boolean;
            marketNews: boolean;
            systemMaintenance: boolean;
        };
        pushNotifications: {
            enabled: boolean;
            priceAlerts: boolean;
            portfolioAlerts: boolean;
            urgentMessages: boolean;
        };
        dataSharing: {
            analytics: boolean;
            marketing: boolean;
            thirdParty: boolean;
        };
        sessionTimeout: number;
        requireMfaForSensitiveActions: boolean;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateClientPreferences(tenantId: any, clientId: any, updates: any): Promise<any>;
    createPortalSession(tenantId: any, clientId: any, userId: any, deviceInfo: any): Promise<{
        id: `${string}-${string}-${string}-${string}-${string}`;
        tenantId: any;
        clientId: any;
        userId: any;
        sessionToken: string;
        deviceInfo: any;
        loginTime: Date;
        lastActivityTime: Date;
        expiresAt: Date;
        isActive: boolean;
    }>;
    getPortalAnalytics(tenantId: any, clientId: any, period: any): Promise<{
        clientId: any;
        pageViews: {
            page: string;
            views: number;
            lastViewed: Date;
        }[];
        featureUsage: {
            feature: string;
            usageCount: number;
            lastUsed: Date;
        }[];
        sessionDuration: number;
        documentsDownloaded: number;
        reportsGenerated: number;
        messagesRead: number;
        alertsAcknowledged: number;
        period: any;
    }>;
    generateSessionToken(): string;
    saveDashboardLayout(layout: any): Promise<void>;
    saveClientPreferences(preferences: any): Promise<void>;
    savePortalSession(session: any): Promise<void>;
    updateMessageStatus(messageId: any, status: any): Promise<void>;
}
import eventPublisher_1 = require("../../utils/eventPublisher");
import ClientPortal_1 = require("../../models/clientPortal/ClientPortal");
