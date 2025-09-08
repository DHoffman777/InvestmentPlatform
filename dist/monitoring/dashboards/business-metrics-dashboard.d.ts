export = BusinessMetricsDashboard;
/**
 * Investment Platform Business Metrics Dashboard
 * Comprehensive business intelligence and metrics visualization for financial services
 */
declare class BusinessMetricsDashboard extends EventEmitter<[never]> {
    constructor();
    metrics: Map<any, any>;
    widgets: Map<any, any>;
    dashboards: Map<any, any>;
    alerts: any[];
    config: {
        refreshInterval: number;
        retention: number;
        alertThresholds: {
            tradingVolume: {
                dailyMin: number;
                hourlyMax: number;
            };
            portfolioValue: {
                changeThreshold: number;
            };
            userActivity: {
                loginRate: number;
                sessionLength: number;
            };
            systemHealth: {
                errorRate: number;
                responseTime: number;
            };
        };
        integrations: {
            grafana: boolean;
            powerbi: boolean;
            tableau: boolean;
            elasticsearch: boolean;
        };
    };
    dataCollectors: Map<any, any>;
    refreshTimer: NodeJS.Timeout;
    initializeDashboard(): void;
    registerCoreMetrics(): void;
    createDefaultDashboards(): void;
    createDashboard(id: any, config: any): void;
    createWidget(id: any, config: any): void;
    initializeDataCollectors(): void;
    startMetricsCollection(): void;
    collectTradingMetrics(): Promise<void>;
    collectPortfolioMetrics(): Promise<void>;
    collectUserMetrics(): Promise<void>;
    collectFinancialMetrics(): Promise<void>;
    collectSystemMetrics(): Promise<void>;
    updateMetric(metricId: any, value: any, timestamp?: number): void;
    checkTradingThresholds(volume: any, value: any): void;
    checkPortfolioThresholds(performance: any): void;
    checkUserThresholds(activeUsers: any, sessions: any): void;
    checkSystemThresholds(uptime: any, requests: any): void;
    createAlert(alert: any): void;
    getHourlyAggregate(metricId: any): any;
    getDailyAggregate(metricId: any): any;
    refreshDashboards(): void;
    refreshDashboard(dashboardId: any): void;
    refreshWidget(widgetId: any): void;
    getMetricData(metricId: any): {
        value: number;
        trend: string;
        lastUpdated: any;
        unit?: undefined;
        type?: undefined;
    } | {
        value: any;
        trend: string;
        lastUpdated: any;
        unit: any;
        type: any;
    };
    getChartData(metricIds: any, timeRange: any, chartType: any): {
        series: any;
        chartType: any;
        timeRange: any;
    };
    getTableData(metricIds: any): {
        rows: any;
    };
    getGaugeData(metricId: any, target: any): {
        value: number;
        target: any;
        percentage: number;
        unit?: undefined;
    } | {
        value: any;
        target: any;
        percentage: number;
        unit: any;
    };
    getHeatmapData(metricIds: any): {
        heatmapData: any;
    };
    getStatusData(components: any): {
        components: any;
    };
    parseTimeRange(timeRange: any): number;
    getDashboard(dashboardId: any): any;
    getAllDashboards(): {
        id: any;
        name: any;
        description: any;
        lastUpdated: any;
        active: any;
    }[];
    exportDashboard(dashboardId: any, format?: string): Promise<string>;
    convertDashboardToCSV(dashboard: any): string;
    generateId(): string;
    generateReport(): Promise<string>;
    getBusinessSummary(): {
        timestamp: number;
        overview: {};
        performance: {};
        alerts: {
            total: number;
            unresolved: number;
            critical: number;
        };
    };
    shutdown(): void;
}
import { EventEmitter } from "events";
