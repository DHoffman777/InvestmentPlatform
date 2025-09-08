export = DashboardAPI;
/**
 * Business Metrics Dashboard API Routes
 * RESTful API for dashboard management and real-time metrics
 */
declare class DashboardAPI {
    router: import("express-serve-static-core").Router;
    dashboard: BusinessMetricsDashboard;
    setupRoutes(): void;
    setupWebSocket(): void;
    broadcastEvent(eventType: any, data: any): void;
    getRouter(): import("express-serve-static-core").Router;
    shutdown(): void;
}
import BusinessMetricsDashboard = require("./business-metrics-dashboard");
