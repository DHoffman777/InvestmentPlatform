import { PrismaClient } from '@prisma/client';
import { DashboardWidget, DashboardWidgetType } from '../../models/clientPortal/ClientPortal';
interface WidgetDataContext {
    tenantId: string;
    clientId: string;
    portfolioIds?: string[];
    dateRange?: {
        startDate: Date;
        endDate: Date;
    };
}
export declare class DashboardWidgetService {
    private prisma;
    constructor(prisma: PrismaClient);
    getWidgetData(widget: DashboardWidget, context: WidgetDataContext): Promise<any>;
    refreshWidget(widgetId: string, context: WidgetDataContext): Promise<{
        data: any;
        lastUpdated: Date;
    }>;
    private getPortfolioSummaryWidget;
    private getPerformanceChartWidget;
    private getAssetAllocationWidget;
    private getRecentTransactionsWidget;
    private getMarketNewsWidget;
    private getAccountBalanceWidget;
    private getWatchlistWidget;
    private getAlertsWidget;
    private getGoalsProgressWidget;
    private getTimeframeDays;
    private getWidget;
    private updateWidgetTimestamp;
    validateWidgetConfiguration(type: DashboardWidgetType, configuration: any): boolean;
    private validatePortfolioSummaryConfig;
    private validatePerformanceChartConfig;
    private validateAssetAllocationConfig;
    private validateRecentTransactionsConfig;
}
export {};
