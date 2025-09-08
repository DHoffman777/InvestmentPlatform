"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClientPortalService = void 0;
const crypto_1 = require("crypto");
const ClientPortal_1 = require("../../models/clientPortal/ClientPortal");
const logger_1 = require("../../utils/logger");
const eventPublisher_1 = require("../../utils/eventPublisher");
class ClientPortalService {
    eventPublisher;
    constructor() {
        this.eventPublisher = new eventPublisher_1.EventPublisher();
    }
    // Dashboard Management
    async getDashboardLayout(tenantId, clientId, layoutId) {
        try {
            logger_1.logger.info('Retrieving dashboard layout', { tenantId, clientId, layoutId });
            // Mock implementation - replace with actual database query
            const layout = {
                id: layoutId || (0, crypto_1.randomUUID)(),
                tenantId,
                clientId,
                name: 'Default Dashboard',
                description: 'Default client dashboard layout',
                widgets: [
                    {
                        id: (0, crypto_1.randomUUID)(),
                        type: ClientPortal_1.DashboardWidgetType.PORTFOLIO_SUMMARY,
                        title: 'Portfolio Summary',
                        position: { row: 0, column: 0, width: 6, height: 4 },
                        configuration: { showChart: true, period: '1Y' },
                        isVisible: true,
                        refreshIntervalMs: 300000, // 5 minutes
                        lastUpdated: new Date()
                    },
                    {
                        id: (0, crypto_1.randomUUID)(),
                        type: ClientPortal_1.DashboardWidgetType.PERFORMANCE_CHART,
                        title: 'Performance Chart',
                        position: { row: 0, column: 6, width: 6, height: 4 },
                        configuration: { timeframe: '1Y', showBenchmark: true },
                        isVisible: true,
                        refreshIntervalMs: 300000,
                        lastUpdated: new Date()
                    },
                    {
                        id: (0, crypto_1.randomUUID)(),
                        type: ClientPortal_1.DashboardWidgetType.ASSET_ALLOCATION,
                        title: 'Asset Allocation',
                        position: { row: 4, column: 0, width: 4, height: 4 },
                        configuration: { chartType: 'PIE', showTargets: true },
                        isVisible: true,
                        refreshIntervalMs: 600000, // 10 minutes
                        lastUpdated: new Date()
                    },
                    {
                        id: (0, crypto_1.randomUUID)(),
                        type: ClientPortal_1.DashboardWidgetType.RECENT_TRANSACTIONS,
                        title: 'Recent Transactions',
                        position: { row: 4, column: 4, width: 8, height: 4 },
                        configuration: { limit: 10, showPending: true },
                        isVisible: true,
                        refreshIntervalMs: 120000, // 2 minutes
                        lastUpdated: new Date()
                    }
                ],
                isDefault: true,
                theme: {
                    primaryColor: '#1976D2',
                    secondaryColor: '#424242',
                    backgroundColor: '#FAFAFA',
                    fontFamily: 'Roboto, sans-serif',
                    logoUrl: '/assets/logo.png'
                },
                createdAt: new Date(),
                updatedAt: new Date(),
                createdBy: clientId
            };
            return layout;
        }
        catch (error) {
            logger_1.logger.error('Error retrieving dashboard layout:', error);
            throw error;
        }
    }
    async updateDashboardLayout(tenantId, clientId, layoutId, updates) {
        try {
            logger_1.logger.info('Updating dashboard layout', { tenantId, clientId, layoutId });
            const existingLayout = await this.getDashboardLayout(tenantId, clientId, layoutId);
            const updatedLayout = {
                ...existingLayout,
                ...updates,
                updatedAt: new Date()
            };
            // Save to database
            await this.saveDashboardLayout(updatedLayout);
            // Publish event
            await this.eventPublisher.publish('client.dashboard.updated', {
                tenantId,
                clientId,
                layoutId,
                changes: updates
            });
            return updatedLayout;
        }
        catch (error) {
            logger_1.logger.error('Error updating dashboard layout:', error);
            throw error;
        }
    }
    // Dashboard Data Aggregation
    async getDashboardData(request) {
        try {
            logger_1.logger.info('Retrieving dashboard data', {
                clientId: request.clientId,
                widgetTypes: request.widgetTypes
            });
            const data = {
                portfolioSummaries: [],
                performanceData: [],
                assetAllocations: [],
                recentTransactions: [],
                alerts: [],
                messages: [],
                watchlists: [],
                documents: [],
                goalProgress: [],
                marketNews: [],
                lastUpdated: new Date()
            };
            // Fetch data for each requested widget type
            const dataPromises = [];
            if (request.widgetTypes.includes(ClientPortal_1.DashboardWidgetType.PORTFOLIO_SUMMARY)) {
                dataPromises.push(this.getPortfolioSummaryData(request.clientId, request.portfolioIds)
                    .then(summaries => { data.portfolioSummaries = summaries; }));
            }
            if (request.widgetTypes.includes(ClientPortal_1.DashboardWidgetType.PERFORMANCE_CHART)) {
                dataPromises.push(this.getPerformanceChartData(request.clientId, request.portfolioIds, request.dateRange)
                    .then(performance => { data.performanceData = performance; }));
            }
            if (request.widgetTypes.includes(ClientPortal_1.DashboardWidgetType.ASSET_ALLOCATION)) {
                dataPromises.push(this.getAssetAllocationData(request.clientId, request.portfolioIds)
                    .then(allocations => { data.assetAllocations = allocations; }));
            }
            if (request.widgetTypes.includes(ClientPortal_1.DashboardWidgetType.RECENT_TRANSACTIONS)) {
                dataPromises.push(this.getRecentTransactionData(request.clientId, request.portfolioIds)
                    .then(transactions => { data.recentTransactions = transactions; }));
            }
            if (request.widgetTypes.includes(ClientPortal_1.DashboardWidgetType.ALERTS)) {
                dataPromises.push(this.getClientAlerts(request.clientId)
                    .then(alerts => { data.alerts = alerts; }));
            }
            if (request.widgetTypes.includes(ClientPortal_1.DashboardWidgetType.DOCUMENTS)) {
                dataPromises.push(this.getClientDocuments(request.clientId)
                    .then(documents => { data.documents = documents; }));
            }
            if (request.widgetTypes.includes(ClientPortal_1.DashboardWidgetType.MARKET_NEWS)) {
                dataPromises.push(this.getMarketNews(request.clientId)
                    .then(news => { data.marketNews = news; }));
            }
            // Wait for all data to be fetched
            await Promise.all(dataPromises);
            return data;
        }
        catch (error) {
            logger_1.logger.error('Error retrieving dashboard data:', error);
            throw error;
        }
    }
    // Portfolio Data Methods
    async getPortfolioSummaryData(clientId, portfolioIds) {
        // Mock implementation
        return [
            {
                portfolioId: (0, crypto_1.randomUUID)(),
                portfolioName: 'Growth Portfolio',
                totalValue: 1250000,
                dayChange: 15750,
                dayChangePercent: 1.28,
                totalReturn: 187500,
                totalReturnPercent: 17.65,
                cash: 25000,
                asOfDate: new Date()
            },
            {
                portfolioId: (0, crypto_1.randomUUID)(),
                portfolioName: 'Income Portfolio',
                totalValue: 850000,
                dayChange: -3200,
                dayChangePercent: -0.37,
                totalReturn: 95000,
                totalReturnPercent: 12.58,
                cash: 15000,
                asOfDate: new Date()
            }
        ];
    }
    async getPerformanceChartData(clientId, portfolioIds, dateRange) {
        // Mock implementation
        const periods = [];
        const startDate = dateRange?.startDate || new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        const endDate = dateRange?.endDate || new Date();
        for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 7)) {
            periods.push({
                date: new Date(date),
                value: 1000000 + Math.random() * 300000,
                benchmarkValue: 1000000 + Math.random() * 250000
            });
        }
        return [
            {
                portfolioId: (0, crypto_1.randomUUID)(),
                periods,
                totalReturn: 15.8,
                benchmarkReturn: 12.3,
                timeframe: '1Y'
            }
        ];
    }
    async getAssetAllocationData(clientId, portfolioIds) {
        // Mock implementation
        return [
            {
                portfolioId: (0, crypto_1.randomUUID)(),
                allocations: [
                    { assetClass: 'Equities', value: 750000, percentage: 60, target: 65, color: '#1976D2' },
                    { assetClass: 'Fixed Income', value: 300000, percentage: 24, target: 25, color: '#388E3C' },
                    { assetClass: 'Real Estate', value: 125000, percentage: 10, target: 10, color: '#F57C00' },
                    { assetClass: 'Cash', value: 75000, percentage: 6, target: 0, color: '#7B1FA2' }
                ],
                totalValue: 1250000,
                asOfDate: new Date()
            }
        ];
    }
    async getRecentTransactionData(clientId, portfolioIds) {
        // Mock implementation
        return [
            {
                transactionId: (0, crypto_1.randomUUID)(),
                date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
                symbol: 'AAPL',
                description: 'Apple Inc.',
                type: 'BUY',
                quantity: 100,
                price: 175.50,
                amount: -17550,
                status: 'SETTLED'
            },
            {
                transactionId: (0, crypto_1.randomUUID)(),
                date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
                symbol: 'MSFT',
                description: 'Microsoft Corporation',
                type: 'SELL',
                quantity: 50,
                price: 380.25,
                amount: 19012.50,
                status: 'SETTLED'
            },
            {
                transactionId: (0, crypto_1.randomUUID)(),
                date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
                symbol: 'DIVIDEND',
                description: 'Quarterly Dividend Payment',
                type: 'DIVIDEND',
                quantity: 0,
                price: 0,
                amount: 2450,
                status: 'SETTLED'
            }
        ];
    }
    // Messages and Alerts
    async getClientMessages(clientId, options = {}) {
        try {
            logger_1.logger.info('Retrieving client messages', { clientId, options });
            // Mock implementation
            const messages = [
                {
                    id: (0, crypto_1.randomUUID)(),
                    tenantId: 'tenant-1',
                    clientId,
                    type: ClientPortal_1.MessageType.STATEMENT,
                    subject: 'Your Q4 2024 Statement is Ready',
                    content: 'Your quarterly statement for Q4 2024 is now available for download.',
                    status: ClientPortal_1.MessageStatus.UNREAD,
                    priority: ClientPortal_1.AlertPriority.MEDIUM,
                    sender: {
                        id: 'advisor-1',
                        name: 'John Smith',
                        role: 'Financial Advisor'
                    },
                    attachments: [
                        {
                            id: (0, crypto_1.randomUUID)(),
                            fileName: 'Q4_2024_Statement.pdf',
                            fileSize: 2500000,
                            downloadUrl: '/api/documents/download/statement-q4-2024'
                        }
                    ],
                    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000)
                },
                {
                    id: (0, crypto_1.randomUUID)(),
                    tenantId: 'tenant-1',
                    clientId,
                    type: ClientPortal_1.MessageType.GENERAL,
                    subject: 'Market Update: Federal Reserve Decision',
                    content: 'Following today\'s Federal Reserve announcement, we wanted to update you on potential impacts to your portfolio.',
                    status: ClientPortal_1.MessageStatus.READ,
                    priority: ClientPortal_1.AlertPriority.HIGH,
                    sender: {
                        id: 'advisor-1',
                        name: 'John Smith',
                        role: 'Financial Advisor'
                    },
                    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
                    readAt: new Date(Date.now() - 23 * 60 * 60 * 1000)
                }
            ];
            return {
                messages: messages.slice(0, options.limit || 10),
                totalCount: messages.length
            };
        }
        catch (error) {
            logger_1.logger.error('Error retrieving client messages:', error);
            throw error;
        }
    }
    async markMessageAsRead(tenantId, clientId, messageId) {
        try {
            logger_1.logger.info('Marking message as read', { tenantId, clientId, messageId });
            // Update message status
            await this.updateMessageStatus(messageId, ClientPortal_1.MessageStatus.READ);
            // Publish event
            await this.eventPublisher.publish('client.message.read', {
                tenantId,
                clientId,
                messageId,
                readAt: new Date()
            });
        }
        catch (error) {
            logger_1.logger.error('Error marking message as read:', error);
            throw error;
        }
    }
    async getClientAlerts(clientId) {
        // Mock implementation
        return [
            {
                id: (0, crypto_1.randomUUID)(),
                tenantId: 'tenant-1',
                clientId,
                type: ClientPortal_1.AlertType.PRICE_ALERT,
                priority: ClientPortal_1.AlertPriority.MEDIUM,
                title: 'Price Alert: AAPL',
                message: 'Apple Inc. (AAPL) has reached your target price of $180.00',
                data: { symbol: 'AAPL', price: 180.25, targetPrice: 180.00 },
                isRead: false,
                isAcknowledged: false,
                createdAt: new Date(Date.now() - 30 * 60 * 1000)
            },
            {
                id: (0, crypto_1.randomUUID)(),
                tenantId: 'tenant-1',
                clientId,
                type: ClientPortal_1.AlertType.PORTFOLIO_ALERT,
                priority: ClientPortal_1.AlertPriority.LOW,
                title: 'Portfolio Rebalancing',
                message: 'Your portfolio allocation has drifted from targets. Consider rebalancing.',
                isRead: true,
                isAcknowledged: false,
                createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
                readAt: new Date(Date.now() - 60 * 60 * 1000)
            }
        ];
    }
    // Document Access
    async getClientDocuments(clientId) {
        // Mock implementation
        return [
            {
                documentId: (0, crypto_1.randomUUID)(),
                title: 'Q4 2024 Portfolio Statement',
                type: 'STATEMENT',
                category: 'Statements',
                size: 2500000,
                uploadDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
                downloadUrl: '/api/documents/download/statement-q4-2024',
                previewUrl: '/api/documents/preview/statement-q4-2024',
                isNew: true
            },
            {
                documentId: (0, crypto_1.randomUUID)(),
                title: 'Tax Document - 1099',
                type: 'TAX',
                category: 'Tax Documents',
                size: 150000,
                uploadDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
                downloadUrl: '/api/documents/download/1099-2024',
                isNew: false
            }
        ];
    }
    // Market News
    async getMarketNews(clientId) {
        // Mock implementation
        return [
            {
                id: (0, crypto_1.randomUUID)(),
                headline: 'Federal Reserve Holds Interest Rates Steady',
                summary: 'The Federal Reserve announced today that it will maintain current interest rates, citing economic stability concerns.',
                source: 'Reuters',
                publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
                category: 'Economic News',
                tags: ['Federal Reserve', 'Interest Rates', 'Monetary Policy'],
                relevantSymbols: ['SPY', 'QQQ', 'TLT'],
                articleUrl: 'https://example.com/fed-rates-steady'
            },
            {
                id: (0, crypto_1.randomUUID)(),
                headline: 'Tech Sector Rallies on AI Optimism',
                summary: 'Technology stocks surge as investors remain optimistic about artificial intelligence developments.',
                source: 'Bloomberg',
                publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
                category: 'Market News',
                tags: ['Technology', 'AI', 'Stock Market'],
                relevantSymbols: ['AAPL', 'MSFT', 'GOOGL', 'NVDA'],
                articleUrl: 'https://example.com/tech-ai-rally'
            }
        ];
    }
    // Preferences Management
    async getClientPreferences(tenantId, clientId) {
        try {
            logger_1.logger.info('Retrieving client preferences', { tenantId, clientId });
            // Mock implementation
            return {
                id: (0, crypto_1.randomUUID)(),
                tenantId,
                clientId,
                theme: 'LIGHT',
                language: 'en-US',
                timezone: 'America/New_York',
                currency: 'USD',
                dateFormat: 'MM/DD/YYYY',
                defaultDashboard: 'default',
                widgetRefreshInterval: 300000,
                emailNotifications: {
                    statementReady: true,
                    documentUploaded: true,
                    priceAlerts: true,
                    portfolioAlerts: true,
                    marketNews: false,
                    systemMaintenance: true
                },
                pushNotifications: {
                    enabled: true,
                    priceAlerts: true,
                    portfolioAlerts: true,
                    urgentMessages: true
                },
                dataSharing: {
                    analytics: true,
                    marketing: false,
                    thirdParty: false
                },
                sessionTimeout: 1800, // 30 minutes
                requireMfaForSensitiveActions: true,
                createdAt: new Date(),
                updatedAt: new Date()
            };
        }
        catch (error) {
            logger_1.logger.error('Error retrieving client preferences:', error);
            throw error;
        }
    }
    async updateClientPreferences(tenantId, clientId, updates) {
        try {
            logger_1.logger.info('Updating client preferences', { tenantId, clientId });
            const existingPreferences = await this.getClientPreferences(tenantId, clientId);
            const updatedPreferences = {
                ...existingPreferences,
                ...updates,
                updatedAt: new Date()
            };
            // Save preferences
            await this.saveClientPreferences(updatedPreferences);
            // Publish event
            await this.eventPublisher.publish('client.preferences.updated', {
                tenantId,
                clientId,
                changes: updates
            });
            return updatedPreferences;
        }
        catch (error) {
            logger_1.logger.error('Error updating client preferences:', error);
            throw error;
        }
    }
    // Session Management
    async createPortalSession(tenantId, clientId, userId, deviceInfo) {
        try {
            logger_1.logger.info('Creating portal session', { tenantId, clientId, userId });
            const session = {
                id: (0, crypto_1.randomUUID)(),
                tenantId,
                clientId,
                userId,
                sessionToken: this.generateSessionToken(),
                deviceInfo,
                loginTime: new Date(),
                lastActivityTime: new Date(),
                expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
                isActive: true
            };
            // Save session
            await this.savePortalSession(session);
            // Publish event
            await this.eventPublisher.publish('client.portal.login', {
                tenantId,
                clientId,
                sessionId: session.id,
                deviceInfo
            });
            return session;
        }
        catch (error) {
            logger_1.logger.error('Error creating portal session:', error);
            throw error;
        }
    }
    // Analytics
    async getPortalAnalytics(tenantId, clientId, period) {
        try {
            logger_1.logger.info('Retrieving portal analytics', { tenantId, clientId, period });
            // Mock implementation
            return {
                clientId,
                pageViews: [
                    { page: 'dashboard', views: 45, lastViewed: new Date() },
                    { page: 'portfolio', views: 23, lastViewed: new Date(Date.now() - 60 * 60 * 1000) },
                    { page: 'documents', views: 12, lastViewed: new Date(Date.now() - 2 * 60 * 60 * 1000) },
                    { page: 'reports', views: 8, lastViewed: new Date(Date.now() - 3 * 60 * 60 * 1000) }
                ],
                featureUsage: [
                    { feature: 'document_download', usageCount: 15, lastUsed: new Date() },
                    { feature: 'report_generation', usageCount: 8, lastUsed: new Date(Date.now() - 60 * 60 * 1000) },
                    { feature: 'message_read', usageCount: 25, lastUsed: new Date(Date.now() - 30 * 60 * 1000) }
                ],
                sessionDuration: 1245, // seconds
                documentsDownloaded: 15,
                reportsGenerated: 8,
                messagesRead: 25,
                alertsAcknowledged: 5,
                period
            };
        }
        catch (error) {
            logger_1.logger.error('Error retrieving portal analytics:', error);
            throw error;
        }
    }
    // Private helper methods
    generateSessionToken() {
        return (0, crypto_1.randomUUID)() + '.' + Date.now().toString(36);
    }
    async saveDashboardLayout(layout) {
        // Mock implementation
        logger_1.logger.debug('Saving dashboard layout', { layoutId: layout.id });
    }
    async saveClientPreferences(preferences) {
        // Mock implementation
        logger_1.logger.debug('Saving client preferences', { clientId: preferences.clientId });
    }
    async savePortalSession(session) {
        // Mock implementation
        logger_1.logger.debug('Saving portal session', { sessionId: session.id });
    }
    async updateMessageStatus(messageId, status) {
        // Mock implementation
        logger_1.logger.debug('Updating message status', { messageId, status });
    }
}
exports.ClientPortalService = ClientPortalService;
