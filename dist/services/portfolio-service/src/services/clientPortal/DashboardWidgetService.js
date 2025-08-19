"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardWidgetService = void 0;
const crypto_1 = require("crypto");
const ClientPortal_1 = require("../../models/clientPortal/ClientPortal");
const logger_1 = require("../../utils/logger");
const eventPublisher_1 = require("../../utils/eventPublisher");
class DashboardWidgetService {
    eventPublisher;
    constructor() {
        this.eventPublisher = new eventPublisher_1.EventPublisher();
    }
    async getWidgetData(widget, context) {
        try {
            logger_1.logger.info('Retrieving widget data', {
                widgetId: widget.id,
                widgetType: widget.type,
                clientId: context.clientId
            });
            switch (widget.type) {
                case ClientPortal_1.DashboardWidgetType.PORTFOLIO_SUMMARY:
                    return await this.getPortfolioSummaryWidget(widget, context);
                case ClientPortal_1.DashboardWidgetType.PERFORMANCE_CHART:
                    return await this.getPerformanceChartWidget(widget, context);
                case ClientPortal_1.DashboardWidgetType.ASSET_ALLOCATION:
                    return await this.getAssetAllocationWidget(widget, context);
                case ClientPortal_1.DashboardWidgetType.RECENT_TRANSACTIONS:
                    return await this.getRecentTransactionsWidget(widget, context);
                case ClientPortal_1.DashboardWidgetType.MARKET_NEWS:
                    return await this.getMarketNewsWidget(widget, context);
                case ClientPortal_1.DashboardWidgetType.ACCOUNT_BALANCE:
                    return await this.getAccountBalanceWidget(widget, context);
                case ClientPortal_1.DashboardWidgetType.WATCHLIST:
                    return await this.getWatchlistWidget(widget, context);
                case ClientPortal_1.DashboardWidgetType.ALERTS:
                    return await this.getAlertsWidget(widget, context);
                case ClientPortal_1.DashboardWidgetType.GOALS_PROGRESS:
                    return await this.getGoalsProgressWidget(widget, context);
                default:
                    throw new Error(`Unsupported widget type: ${widget.type}`);
            }
        }
        catch (error) {
            logger_1.logger.error('Error retrieving widget data:', error);
            throw error;
        }
    }
    async refreshWidget(widgetId, context) {
        try {
            logger_1.logger.info('Refreshing widget', { widgetId, clientId: context.clientId });
            // Get widget configuration
            const widget = await this.getWidget(widgetId);
            if (!widget) {
                throw new Error('Widget not found');
            }
            // Get fresh data
            const data = await this.getWidgetData(widget, context);
            // Update last updated timestamp
            const lastUpdated = new Date();
            await this.updateWidgetTimestamp(widgetId, lastUpdated);
            // Publish refresh event
            await this.eventPublisher.publish('dashboard.widget.refreshed', {
                tenantId: context.tenantId,
                clientId: context.clientId,
                widgetId,
                widgetType: widget.type,
                refreshedAt: lastUpdated
            });
            return { data, lastUpdated };
        }
        catch (error) {
            logger_1.logger.error('Error refreshing widget:', error);
            throw error;
        }
    }
    // Widget-specific data retrieval methods
    async getPortfolioSummaryWidget(widget, context) {
        const config = widget.configuration;
        // Mock data - replace with real portfolio service calls
        const portfolios = [
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
        const totalValue = portfolios.reduce((sum, p) => sum + p.totalValue, 0);
        const totalChange = portfolios.reduce((sum, p) => sum + p.dayChange, 0);
        const totalChangePercent = (totalChange / (totalValue - totalChange)) * 100;
        return {
            portfolios,
            totalValue,
            totalChange,
            totalChangePercent,
            configuration: config
        };
    }
    async getPerformanceChartWidget(widget, context) {
        const config = widget.configuration;
        const timeframe = config.timeframe || '1Y';
        const showBenchmark = config.showBenchmark || false;
        // Generate mock performance data
        const periods = [];
        const daysBack = this.getTimeframeDays(timeframe);
        const startValue = 1000000;
        for (let i = daysBack; i >= 0; i -= 7) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const volatility = 0.15; // 15% annual volatility
            const dailyVolatility = volatility / Math.sqrt(252);
            const randomReturn = (Math.random() - 0.5) * 2 * dailyVolatility;
            const value = startValue * (1 + randomReturn * (daysBack - i) / daysBack);
            periods.push({
                date,
                value: Math.round(value),
                benchmarkValue: showBenchmark ? Math.round(value * 0.95) : undefined
            });
        }
        const chartData = {
            portfolioId: (0, crypto_1.randomUUID)(),
            periods,
            totalReturn: 15.8,
            benchmarkReturn: showBenchmark ? 12.3 : undefined,
            timeframe: timeframe
        };
        return {
            chartData,
            timeframe,
            showBenchmark,
            configuration: config
        };
    }
    async getAssetAllocationWidget(widget, context) {
        const config = widget.configuration;
        const chartType = config.chartType || 'PIE';
        const showTargets = config.showTargets || false;
        const allocation = {
            portfolioId: (0, crypto_1.randomUUID)(),
            allocations: [
                {
                    assetClass: 'Equities',
                    value: 750000,
                    percentage: 60,
                    target: showTargets ? 65 : undefined,
                    color: '#1976D2'
                },
                {
                    assetClass: 'Fixed Income',
                    value: 300000,
                    percentage: 24,
                    target: showTargets ? 25 : undefined,
                    color: '#388E3C'
                },
                {
                    assetClass: 'Real Estate',
                    value: 125000,
                    percentage: 10,
                    target: showTargets ? 10 : undefined,
                    color: '#F57C00'
                },
                {
                    assetClass: 'Cash',
                    value: 75000,
                    percentage: 6,
                    target: showTargets ? 0 : undefined,
                    color: '#7B1FA2'
                }
            ],
            totalValue: 1250000,
            asOfDate: new Date()
        };
        return {
            allocation,
            chartType,
            showTargets,
            configuration: config
        };
    }
    async getRecentTransactionsWidget(widget, context) {
        const config = widget.configuration;
        const limit = config.limit || 10;
        const showPending = config.showPending || false;
        const allTransactions = [
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
                date: new Date(Date.now() - 1 * 60 * 60 * 1000),
                symbol: 'GOOGL',
                description: 'Alphabet Inc.',
                type: 'BUY',
                quantity: 25,
                price: 142.80,
                amount: -3570,
                status: 'PENDING'
            }
        ];
        let transactions = allTransactions;
        if (!showPending) {
            transactions = transactions.filter(t => t.status !== 'PENDING');
        }
        return {
            transactions: transactions.slice(0, limit),
            limit,
            showPending,
            configuration: config
        };
    }
    async getMarketNewsWidget(widget, context) {
        const config = widget.configuration;
        const limit = config.limit || 5;
        const categories = config.categories || ['Market News', 'Economic News'];
        const allNews = [
            {
                id: (0, crypto_1.randomUUID)(),
                headline: 'Federal Reserve Holds Interest Rates Steady',
                summary: 'The Federal Reserve announced today that it will maintain current interest rates.',
                source: 'Reuters',
                publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
                category: 'Economic News',
                tags: ['Federal Reserve', 'Interest Rates'],
                relevantSymbols: ['SPY', 'QQQ'],
                articleUrl: 'https://example.com/fed-rates'
            },
            {
                id: (0, crypto_1.randomUUID)(),
                headline: 'Tech Sector Rallies on AI Optimism',
                summary: 'Technology stocks surge as investors remain optimistic about AI developments.',
                source: 'Bloomberg',
                publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
                category: 'Market News',
                tags: ['Technology', 'AI'],
                relevantSymbols: ['AAPL', 'MSFT', 'GOOGL'],
                articleUrl: 'https://example.com/tech-ai'
            }
        ];
        const filteredNews = allNews.filter(news => categories.includes(news.category)).slice(0, limit);
        return {
            news: filteredNews,
            categories,
            limit,
            configuration: config
        };
    }
    async getAccountBalanceWidget(widget, context) {
        const config = widget.configuration;
        return {
            totalBalance: 2100000,
            availableCash: 40000,
            pendingTransactions: -3570,
            accounts: [
                { id: '1', name: 'Growth Portfolio', balance: 1250000, type: 'INVESTMENT' },
                { id: '2', name: 'Income Portfolio', balance: 850000, type: 'INVESTMENT' }
            ],
            configuration: config
        };
    }
    async getWatchlistWidget(widget, context) {
        const config = widget.configuration;
        const watchlist = {
            id: (0, crypto_1.randomUUID)(),
            tenantId: context.tenantId,
            clientId: context.clientId,
            name: 'My Watchlist',
            symbols: [
                {
                    symbol: 'AAPL',
                    name: 'Apple Inc.',
                    price: 175.50,
                    change: 2.25,
                    changePercent: 1.30,
                    alerts: { priceAbove: 180.00 },
                    addedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
                },
                {
                    symbol: 'MSFT',
                    name: 'Microsoft Corporation',
                    price: 380.25,
                    change: -1.75,
                    changePercent: -0.46,
                    addedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000)
                }
            ],
            isDefault: true,
            createdAt: new Date(),
            updatedAt: new Date()
        };
        const priceAlerts = watchlist.symbols.filter(s => s.alerts).length;
        return {
            watchlist,
            priceAlerts,
            configuration: config
        };
    }
    async getAlertsWidget(widget, context) {
        const config = widget.configuration;
        const limit = config.limit || 5;
        // Mock alerts data - would come from actual alert service
        const alerts = [
            {
                id: (0, crypto_1.randomUUID)(),
                tenantId: context.tenantId,
                clientId: context.clientId,
                type: 'PRICE_ALERT',
                priority: 'HIGH',
                title: 'Price Alert: AAPL',
                message: 'Apple Inc. has reached your target price of $180.00',
                data: { symbol: 'AAPL', price: 180.25 },
                isRead: false,
                isAcknowledged: false,
                createdAt: new Date(Date.now() - 30 * 60 * 1000)
            }
        ];
        const unreadCount = alerts.filter(a => !a.isRead).length;
        const criticalCount = alerts.filter(a => a.priority === 'CRITICAL').length;
        return {
            alerts: alerts.slice(0, limit),
            unreadCount,
            criticalCount,
            configuration: config
        };
    }
    async getGoalsProgressWidget(widget, context) {
        const config = widget.configuration;
        const goals = [
            {
                goalId: (0, crypto_1.randomUUID)(),
                goalName: 'Retirement Fund',
                targetAmount: 2000000,
                currentAmount: 1250000,
                progressPercent: 62.5,
                targetDate: new Date(2040, 11, 31),
                monthsRemaining: 192,
                onTrack: true,
                requiredMonthlyContribution: 2500,
                projectedCompletionDate: new Date(2039, 6, 15)
            },
            {
                goalId: (0, crypto_1.randomUUID)(),
                goalName: 'College Fund',
                targetAmount: 300000,
                currentAmount: 85000,
                progressPercent: 28.3,
                targetDate: new Date(2035, 8, 1),
                monthsRemaining: 128,
                onTrack: false,
                requiredMonthlyContribution: 1800
            }
        ];
        const onTrackCount = goals.filter(g => g.onTrack).length;
        const atRiskCount = goals.filter(g => !g.onTrack).length;
        return {
            goals,
            onTrackCount,
            atRiskCount,
            configuration: config
        };
    }
    // Utility methods
    getTimeframeDays(timeframe) {
        switch (timeframe) {
            case '1M': return 30;
            case '3M': return 90;
            case '6M': return 180;
            case '1Y': return 365;
            case '3Y': return 1095;
            case '5Y': return 1825;
            case 'ALL': return 3650; // 10 years max
            default: return 365;
        }
    }
    async getWidget(widgetId) {
        // Mock implementation - would fetch from database
        return null;
    }
    async updateWidgetTimestamp(widgetId, timestamp) {
        // Mock implementation - would update in database
        logger_1.logger.debug('Updated widget timestamp', { widgetId, timestamp });
    }
    // Widget configuration validation
    validateWidgetConfiguration(type, configuration) {
        switch (type) {
            case ClientPortal_1.DashboardWidgetType.PORTFOLIO_SUMMARY:
                return this.validatePortfolioSummaryConfig(configuration);
            case ClientPortal_1.DashboardWidgetType.PERFORMANCE_CHART:
                return this.validatePerformanceChartConfig(configuration);
            case ClientPortal_1.DashboardWidgetType.ASSET_ALLOCATION:
                return this.validateAssetAllocationConfig(configuration);
            case ClientPortal_1.DashboardWidgetType.RECENT_TRANSACTIONS:
                return this.validateRecentTransactionsConfig(configuration);
            default:
                return true; // Default widgets don't need validation
        }
    }
    validatePortfolioSummaryConfig(config) {
        return config && typeof config.showChart === 'boolean';
    }
    validatePerformanceChartConfig(config) {
        const validTimeframes = ['1M', '3M', '6M', '1Y', '3Y', '5Y', 'ALL'];
        return config &&
            validTimeframes.includes(config.timeframe) &&
            typeof config.showBenchmark === 'boolean';
    }
    validateAssetAllocationConfig(config) {
        const validChartTypes = ['PIE', 'DONUT', 'BAR'];
        return config &&
            validChartTypes.includes(config.chartType) &&
            typeof config.showTargets === 'boolean';
    }
    validateRecentTransactionsConfig(config) {
        return config &&
            typeof config.limit === 'number' &&
            config.limit > 0 &&
            config.limit <= 50 &&
            typeof config.showPending === 'boolean';
    }
}
exports.DashboardWidgetService = DashboardWidgetService;
