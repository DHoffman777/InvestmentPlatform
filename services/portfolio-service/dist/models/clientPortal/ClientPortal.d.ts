export declare enum DashboardWidgetType {
    PORTFOLIO_SUMMARY = "PORTFOLIO_SUMMARY",
    PERFORMANCE_CHART = "PERFORMANCE_CHART",
    ASSET_ALLOCATION = "ASSET_ALLOCATION",
    RECENT_TRANSACTIONS = "RECENT_TRANSACTIONS",
    MARKET_NEWS = "MARKET_NEWS",
    ACCOUNT_BALANCE = "ACCOUNT_BALANCE",
    WATCHLIST = "WATCHLIST",
    ALERTS = "ALERTS",
    DOCUMENTS = "DOCUMENTS",
    GOALS_PROGRESS = "GOALS_PROGRESS"
}
export declare enum MessageType {
    GENERAL = "GENERAL",
    ALERT = "ALERT",
    STATEMENT = "STATEMENT",
    TRADE_CONFIRMATION = "TRADE_CONFIRMATION",
    DOCUMENT_NOTIFICATION = "DOCUMENT_NOTIFICATION",
    SYSTEM_MAINTENANCE = "SYSTEM_MAINTENANCE"
}
export declare enum MessageStatus {
    UNREAD = "UNREAD",
    READ = "READ",
    ARCHIVED = "ARCHIVED",
    DELETED = "DELETED"
}
export declare enum AlertType {
    PRICE_ALERT = "PRICE_ALERT",
    PORTFOLIO_ALERT = "PORTFOLIO_ALERT",
    COMPLIANCE_ALERT = "COMPLIANCE_ALERT",
    DOCUMENT_ALERT = "DOCUMENT_ALERT",
    SYSTEM_ALERT = "SYSTEM_ALERT",
    MARKET_ALERT = "MARKET_ALERT"
}
export declare enum AlertPriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export interface DashboardWidget {
    id: string;
    type: DashboardWidgetType;
    title: string;
    position: {
        row: number;
        column: number;
        width: number;
        height: number;
    };
    configuration: Record<string, any>;
    isVisible: boolean;
    refreshIntervalMs: number;
    lastUpdated: Date;
}
export interface ClientDashboardLayout {
    id: string;
    tenantId: string;
    clientId: string;
    name: string;
    description?: string;
    widgets: DashboardWidget[];
    isDefault: boolean;
    theme: {
        primaryColor: string;
        secondaryColor: string;
        backgroundColor: string;
        fontFamily: string;
        logoUrl?: string;
    };
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
}
export interface PortfolioSummaryData {
    portfolioId: string;
    portfolioName: string;
    totalValue: number;
    dayChange: number;
    dayChangePercent: number;
    totalReturn: number;
    totalReturnPercent: number;
    cash: number;
    asOfDate: Date;
}
export interface PerformanceChartData {
    portfolioId: string;
    periods: {
        date: Date;
        value: number;
        benchmarkValue?: number;
    }[];
    totalReturn: number;
    benchmarkReturn?: number;
    timeframe: 'YTD' | '1M' | '3M' | '6M' | '1Y' | '3Y' | '5Y' | 'ALL';
}
export interface AssetAllocationData {
    portfolioId: string;
    allocations: {
        assetClass: string;
        value: number;
        percentage: number;
        target?: number;
        color: string;
    }[];
    totalValue: number;
    asOfDate: Date;
}
export interface RecentTransactionData {
    transactionId: string;
    date: Date;
    symbol: string;
    description: string;
    type: string;
    quantity: number;
    price: number;
    amount: number;
    status: string;
}
export interface ClientMessage {
    id: string;
    tenantId: string;
    clientId: string;
    type: MessageType;
    subject: string;
    content: string;
    status: MessageStatus;
    priority: AlertPriority;
    sender: {
        id: string;
        name: string;
        role: string;
    };
    attachments?: {
        id: string;
        fileName: string;
        fileSize: number;
        downloadUrl: string;
    }[];
    createdAt: Date;
    readAt?: Date;
    archivedAt?: Date;
    deletedAt?: Date;
}
export interface ClientAlert {
    id: string;
    tenantId: string;
    clientId: string;
    type: AlertType;
    priority: AlertPriority;
    title: string;
    message: string;
    data?: Record<string, any>;
    isRead: boolean;
    isAcknowledged: boolean;
    expiresAt?: Date;
    createdAt: Date;
    readAt?: Date;
    acknowledgedAt?: Date;
}
export interface ClientWatchlist {
    id: string;
    tenantId: string;
    clientId: string;
    name: string;
    symbols: {
        symbol: string;
        name: string;
        price: number;
        change: number;
        changePercent: number;
        alerts?: {
            priceAbove?: number;
            priceBelow?: number;
        };
        addedAt: Date;
    }[];
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface ClientDocumentAccess {
    documentId: string;
    title: string;
    type: string;
    category: string;
    size: number;
    uploadDate: Date;
    downloadUrl: string;
    previewUrl?: string;
    isNew: boolean;
    requiresSignature?: boolean;
}
export interface StatementRequest {
    id: string;
    tenantId: string;
    clientId: string;
    portfolioId?: string;
    type: 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'CUSTOM';
    format: 'PDF' | 'EXCEL' | 'CSV';
    dateRange: {
        startDate: Date;
        endDate: Date;
    };
    deliveryMethod: 'DOWNLOAD' | 'EMAIL';
    emailAddress?: string;
    status: 'PENDING' | 'GENERATING' | 'READY' | 'DELIVERED' | 'FAILED';
    requestDate: Date;
    completedDate?: Date;
    downloadUrl?: string;
}
export interface GoalProgress {
    goalId: string;
    goalName: string;
    targetAmount: number;
    currentAmount: number;
    progressPercent: number;
    targetDate: Date;
    monthsRemaining: number;
    onTrack: boolean;
    requiredMonthlyContribution?: number;
    projectedCompletionDate?: Date;
}
export interface MarketNewsItem {
    id: string;
    headline: string;
    summary: string;
    content?: string;
    source: string;
    publishedAt: Date;
    category: string;
    tags: string[];
    relevantSymbols?: string[];
    imageUrl?: string;
    articleUrl: string;
}
export interface ClientPreferences {
    id: string;
    tenantId: string;
    clientId: string;
    theme: 'LIGHT' | 'DARK' | 'AUTO';
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
}
export interface ClientPortalSession {
    id: string;
    tenantId: string;
    clientId: string;
    userId: string;
    sessionToken: string;
    deviceInfo: {
        userAgent: string;
        ipAddress: string;
        deviceType: 'DESKTOP' | 'MOBILE' | 'TABLET';
        os: string;
        browser: string;
    };
    loginTime: Date;
    lastActivityTime: Date;
    expiresAt: Date;
    isActive: boolean;
    logoutTime?: Date;
}
export interface PortalAnalytics {
    clientId: string;
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
    period: {
        startDate: Date;
        endDate: Date;
    };
}
export interface ClientPortalConfiguration {
    tenantId: string;
    branding: {
        companyName: string;
        logoUrl: string;
        faviconUrl: string;
        primaryColor: string;
        secondaryColor: string;
        accentColor: string;
        fontFamily: string;
    };
    features: {
        dashboard: boolean;
        portfolio: boolean;
        documents: boolean;
        messages: boolean;
        reports: boolean;
        alerts: boolean;
        watchlist: boolean;
        goals: boolean;
        settings: boolean;
    };
    security: {
        sessionTimeoutMinutes: number;
        maxLoginAttempts: number;
        lockoutDurationMinutes: number;
        requireMfa: boolean;
        allowedDevices: string[];
        ipWhitelist?: string[];
    };
    customization: {
        allowThemeChange: boolean;
        allowWidgetCustomization: boolean;
        allowLayoutChange: boolean;
        defaultLanguage: string;
        supportedLanguages: string[];
    };
    integrations: {
        chatSupport?: {
            enabled: boolean;
            provider: string;
            configuration: Record<string, any>;
        };
        analytics?: {
            enabled: boolean;
            provider: string;
            trackingId: string;
        };
    };
}
export interface PortalApiResponse<T> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: any;
    };
    metadata?: {
        total?: number;
        page?: number;
        limit?: number;
        hasMore?: boolean;
    };
}
export interface DashboardDataRequest {
    clientId: string;
    widgetTypes: DashboardWidgetType[];
    dateRange?: {
        startDate: Date;
        endDate: Date;
    };
    portfolioIds?: string[];
}
export interface DashboardDataResponse {
    portfolioSummaries: PortfolioSummaryData[];
    performanceData: PerformanceChartData[];
    assetAllocations: AssetAllocationData[];
    recentTransactions: RecentTransactionData[];
    alerts: ClientAlert[];
    messages: ClientMessage[];
    watchlists: ClientWatchlist[];
    documents: ClientDocumentAccess[];
    goalProgress: GoalProgress[];
    marketNews: MarketNewsItem[];
    lastUpdated: Date;
}
