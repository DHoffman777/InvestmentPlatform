export const __esModule: boolean;
export class DashboardWidgetService {
    eventPublisher: eventPublisher_1.EventPublisher;
    getWidgetData(widget: any, context: any): Promise<{
        portfolios: {
            portfolioId: `${string}-${string}-${string}-${string}-${string}`;
            portfolioName: string;
            totalValue: number;
            dayChange: number;
            dayChangePercent: number;
            totalReturn: number;
            totalReturnPercent: number;
            cash: number;
            asOfDate: Date;
        }[];
        totalValue: number;
        totalChange: number;
        totalChangePercent: number;
        configuration: any;
    } | {
        chartData: {
            portfolioId: `${string}-${string}-${string}-${string}-${string}`;
            periods: {
                date: Date;
                value: number;
                benchmarkValue: number;
            }[];
            totalReturn: number;
            benchmarkReturn: number;
            timeframe: any;
        };
        timeframe: any;
        showBenchmark: any;
        configuration: any;
    } | {
        allocation: {
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
        };
        chartType: any;
        showTargets: any;
        configuration: any;
    } | {
        transactions: {
            transactionId: `${string}-${string}-${string}-${string}-${string}`;
            date: Date;
            symbol: string;
            description: string;
            type: string;
            quantity: number;
            price: number;
            amount: number;
            status: string;
        }[];
        limit: any;
        showPending: any;
        configuration: any;
    } | {
        news: {
            id: `${string}-${string}-${string}-${string}-${string}`;
            headline: string;
            summary: string;
            source: string;
            publishedAt: Date;
            category: string;
            tags: string[];
            relevantSymbols: string[];
            articleUrl: string;
        }[];
        categories: any;
        limit: any;
        configuration: any;
    } | {
        totalBalance: number;
        availableCash: number;
        pendingTransactions: number;
        accounts: {
            id: string;
            name: string;
            balance: number;
            type: string;
        }[];
        configuration: any;
    } | {
        watchlist: {
            id: `${string}-${string}-${string}-${string}-${string}`;
            tenantId: any;
            clientId: any;
            name: string;
            symbols: ({
                symbol: string;
                name: string;
                price: number;
                change: number;
                changePercent: number;
                alerts: {
                    priceAbove: number;
                };
                addedAt: Date;
            } | {
                symbol: string;
                name: string;
                price: number;
                change: number;
                changePercent: number;
                addedAt: Date;
                alerts?: undefined;
            })[];
            isDefault: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        priceAlerts: number;
        configuration: any;
    } | {
        alerts: {
            id: `${string}-${string}-${string}-${string}-${string}`;
            tenantId: any;
            clientId: any;
            type: string;
            priority: string;
            title: string;
            message: string;
            data: {
                symbol: string;
                price: number;
            };
            isRead: boolean;
            isAcknowledged: boolean;
            createdAt: Date;
        }[];
        unreadCount: number;
        criticalCount: number;
        configuration: any;
    } | {
        goals: ({
            goalId: `${string}-${string}-${string}-${string}-${string}`;
            goalName: string;
            targetAmount: number;
            currentAmount: number;
            progressPercent: number;
            targetDate: Date;
            monthsRemaining: number;
            onTrack: boolean;
            requiredMonthlyContribution: number;
            projectedCompletionDate: Date;
        } | {
            goalId: `${string}-${string}-${string}-${string}-${string}`;
            goalName: string;
            targetAmount: number;
            currentAmount: number;
            progressPercent: number;
            targetDate: Date;
            monthsRemaining: number;
            onTrack: boolean;
            requiredMonthlyContribution: number;
            projectedCompletionDate?: undefined;
        })[];
        onTrackCount: number;
        atRiskCount: number;
        configuration: any;
    }>;
    refreshWidget(widgetId: any, context: any): Promise<{
        data: {
            portfolios: {
                portfolioId: `${string}-${string}-${string}-${string}-${string}`;
                portfolioName: string;
                totalValue: number;
                dayChange: number;
                dayChangePercent: number;
                totalReturn: number;
                totalReturnPercent: number;
                cash: number;
                asOfDate: Date;
            }[];
            totalValue: number;
            totalChange: number;
            totalChangePercent: number;
            configuration: any;
        } | {
            chartData: {
                portfolioId: `${string}-${string}-${string}-${string}-${string}`;
                periods: {
                    date: Date;
                    value: number;
                    benchmarkValue: number;
                }[];
                totalReturn: number;
                benchmarkReturn: number;
                timeframe: any;
            };
            timeframe: any;
            showBenchmark: any;
            configuration: any;
        } | {
            allocation: {
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
            };
            chartType: any;
            showTargets: any;
            configuration: any;
        } | {
            transactions: {
                transactionId: `${string}-${string}-${string}-${string}-${string}`;
                date: Date;
                symbol: string;
                description: string;
                type: string;
                quantity: number;
                price: number;
                amount: number;
                status: string;
            }[];
            limit: any;
            showPending: any;
            configuration: any;
        } | {
            news: {
                id: `${string}-${string}-${string}-${string}-${string}`;
                headline: string;
                summary: string;
                source: string;
                publishedAt: Date;
                category: string;
                tags: string[];
                relevantSymbols: string[];
                articleUrl: string;
            }[];
            categories: any;
            limit: any;
            configuration: any;
        } | {
            totalBalance: number;
            availableCash: number;
            pendingTransactions: number;
            accounts: {
                id: string;
                name: string;
                balance: number;
                type: string;
            }[];
            configuration: any;
        } | {
            watchlist: {
                id: `${string}-${string}-${string}-${string}-${string}`;
                tenantId: any;
                clientId: any;
                name: string;
                symbols: ({
                    symbol: string;
                    name: string;
                    price: number;
                    change: number;
                    changePercent: number;
                    alerts: {
                        priceAbove: number;
                    };
                    addedAt: Date;
                } | {
                    symbol: string;
                    name: string;
                    price: number;
                    change: number;
                    changePercent: number;
                    addedAt: Date;
                    alerts?: undefined;
                })[];
                isDefault: boolean;
                createdAt: Date;
                updatedAt: Date;
            };
            priceAlerts: number;
            configuration: any;
        } | {
            alerts: {
                id: `${string}-${string}-${string}-${string}-${string}`;
                tenantId: any;
                clientId: any;
                type: string;
                priority: string;
                title: string;
                message: string;
                data: {
                    symbol: string;
                    price: number;
                };
                isRead: boolean;
                isAcknowledged: boolean;
                createdAt: Date;
            }[];
            unreadCount: number;
            criticalCount: number;
            configuration: any;
        } | {
            goals: ({
                goalId: `${string}-${string}-${string}-${string}-${string}`;
                goalName: string;
                targetAmount: number;
                currentAmount: number;
                progressPercent: number;
                targetDate: Date;
                monthsRemaining: number;
                onTrack: boolean;
                requiredMonthlyContribution: number;
                projectedCompletionDate: Date;
            } | {
                goalId: `${string}-${string}-${string}-${string}-${string}`;
                goalName: string;
                targetAmount: number;
                currentAmount: number;
                progressPercent: number;
                targetDate: Date;
                monthsRemaining: number;
                onTrack: boolean;
                requiredMonthlyContribution: number;
                projectedCompletionDate?: undefined;
            })[];
            onTrackCount: number;
            atRiskCount: number;
            configuration: any;
        };
        lastUpdated: Date;
    }>;
    getPortfolioSummaryWidget(widget: any, context: any): Promise<{
        portfolios: {
            portfolioId: `${string}-${string}-${string}-${string}-${string}`;
            portfolioName: string;
            totalValue: number;
            dayChange: number;
            dayChangePercent: number;
            totalReturn: number;
            totalReturnPercent: number;
            cash: number;
            asOfDate: Date;
        }[];
        totalValue: number;
        totalChange: number;
        totalChangePercent: number;
        configuration: any;
    }>;
    getPerformanceChartWidget(widget: any, context: any): Promise<{
        chartData: {
            portfolioId: `${string}-${string}-${string}-${string}-${string}`;
            periods: {
                date: Date;
                value: number;
                benchmarkValue: number;
            }[];
            totalReturn: number;
            benchmarkReturn: number;
            timeframe: any;
        };
        timeframe: any;
        showBenchmark: any;
        configuration: any;
    }>;
    getAssetAllocationWidget(widget: any, context: any): Promise<{
        allocation: {
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
        };
        chartType: any;
        showTargets: any;
        configuration: any;
    }>;
    getRecentTransactionsWidget(widget: any, context: any): Promise<{
        transactions: {
            transactionId: `${string}-${string}-${string}-${string}-${string}`;
            date: Date;
            symbol: string;
            description: string;
            type: string;
            quantity: number;
            price: number;
            amount: number;
            status: string;
        }[];
        limit: any;
        showPending: any;
        configuration: any;
    }>;
    getMarketNewsWidget(widget: any, context: any): Promise<{
        news: {
            id: `${string}-${string}-${string}-${string}-${string}`;
            headline: string;
            summary: string;
            source: string;
            publishedAt: Date;
            category: string;
            tags: string[];
            relevantSymbols: string[];
            articleUrl: string;
        }[];
        categories: any;
        limit: any;
        configuration: any;
    }>;
    getAccountBalanceWidget(widget: any, context: any): Promise<{
        totalBalance: number;
        availableCash: number;
        pendingTransactions: number;
        accounts: {
            id: string;
            name: string;
            balance: number;
            type: string;
        }[];
        configuration: any;
    }>;
    getWatchlistWidget(widget: any, context: any): Promise<{
        watchlist: {
            id: `${string}-${string}-${string}-${string}-${string}`;
            tenantId: any;
            clientId: any;
            name: string;
            symbols: ({
                symbol: string;
                name: string;
                price: number;
                change: number;
                changePercent: number;
                alerts: {
                    priceAbove: number;
                };
                addedAt: Date;
            } | {
                symbol: string;
                name: string;
                price: number;
                change: number;
                changePercent: number;
                addedAt: Date;
                alerts?: undefined;
            })[];
            isDefault: boolean;
            createdAt: Date;
            updatedAt: Date;
        };
        priceAlerts: number;
        configuration: any;
    }>;
    getAlertsWidget(widget: any, context: any): Promise<{
        alerts: {
            id: `${string}-${string}-${string}-${string}-${string}`;
            tenantId: any;
            clientId: any;
            type: string;
            priority: string;
            title: string;
            message: string;
            data: {
                symbol: string;
                price: number;
            };
            isRead: boolean;
            isAcknowledged: boolean;
            createdAt: Date;
        }[];
        unreadCount: number;
        criticalCount: number;
        configuration: any;
    }>;
    getGoalsProgressWidget(widget: any, context: any): Promise<{
        goals: ({
            goalId: `${string}-${string}-${string}-${string}-${string}`;
            goalName: string;
            targetAmount: number;
            currentAmount: number;
            progressPercent: number;
            targetDate: Date;
            monthsRemaining: number;
            onTrack: boolean;
            requiredMonthlyContribution: number;
            projectedCompletionDate: Date;
        } | {
            goalId: `${string}-${string}-${string}-${string}-${string}`;
            goalName: string;
            targetAmount: number;
            currentAmount: number;
            progressPercent: number;
            targetDate: Date;
            monthsRemaining: number;
            onTrack: boolean;
            requiredMonthlyContribution: number;
            projectedCompletionDate?: undefined;
        })[];
        onTrackCount: number;
        atRiskCount: number;
        configuration: any;
    }>;
    getTimeframeDays(timeframe: any): 90 | 30 | 365 | 180 | 3650 | 1095 | 1825;
    getWidget(widgetId: any): Promise<any>;
    updateWidgetTimestamp(widgetId: any, timestamp: any): Promise<void>;
    validateWidgetConfiguration(type: any, configuration: any): boolean;
    validatePortfolioSummaryConfig(config: any): boolean;
    validatePerformanceChartConfig(config: any): boolean;
    validateAssetAllocationConfig(config: any): boolean;
    validateRecentTransactionsConfig(config: any): boolean;
}
import eventPublisher_1 = require("../../utils/eventPublisher");
