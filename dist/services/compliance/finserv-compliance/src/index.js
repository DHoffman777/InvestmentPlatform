#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const FinancialServicesComplianceService_1 = require("./FinancialServicesComplianceService");
const config = {
    service: {
        port: parseInt(process.env.PORT || '3013'),
        host: process.env.HOST || 'localhost',
        environment: process.env.NODE_ENV || 'development',
    },
    database: {
        redis: {
            host: process.env.REDIS_HOST || 'localhost',
            port: parseInt(process.env.REDIS_PORT || '6379'),
            password: process.env.REDIS_PASSWORD,
            db: parseInt(process.env.REDIS_DB || '3'),
        },
    },
    compliance: {
        violationThresholds: {
            monetary: parseInt(process.env.MONETARY_THRESHOLD || '10000'),
            operational: parseInt(process.env.OPERATIONAL_THRESHOLD || '5'),
            reputational: parseInt(process.env.REPUTATIONAL_THRESHOLD || '3'),
        },
        reportingDeadlines: {
            routine: parseInt(process.env.ROUTINE_DEADLINE_DAYS || '30'),
            material: parseInt(process.env.MATERIAL_DEADLINE_HOURS || '24'),
            immediate: parseInt(process.env.IMMEDIATE_DEADLINE_MINUTES || '15'),
        },
        reviewCycles: {
            suitability: parseInt(process.env.SUITABILITY_REVIEW_DAYS || '365'),
            bestExecution: parseInt(process.env.BEST_EXECUTION_REVIEW_DAYS || '90'),
            aml: parseInt(process.env.AML_REVIEW_DAYS || '180'),
            trading: parseInt(process.env.TRADING_REVIEW_DAYS || '30'),
        },
    },
    regulators: {
        sec: {
            enabled: process.env.SEC_ENABLED === 'true',
            filingSystem: process.env.SEC_FILING_SYSTEM || 'EDGAR',
            credentials: process.env.SEC_ENABLED === 'true' ? {
                username: process.env.SEC_USERNAME || '',
                password: process.env.SEC_PASSWORD || '',
                cik: process.env.SEC_CIK || '',
            } : undefined,
        },
        finra: {
            enabled: process.env.FINRA_ENABLED === 'true',
            gateway: process.env.FINRA_GATEWAY || 'https://gateway.finra.org',
            credentials: process.env.FINRA_ENABLED === 'true' ? {
                username: process.env.FINRA_USERNAME || '',
                password: process.env.FINRA_PASSWORD || '',
                firmId: process.env.FINRA_FIRM_ID || '',
            } : undefined,
        },
        cftc: {
            enabled: process.env.CFTC_ENABLED === 'true',
            filingSystem: process.env.CFTC_FILING_SYSTEM || 'NFA',
            credentials: process.env.CFTC_ENABLED === 'true' ? {
                username: process.env.CFTC_USERNAME || '',
                password: process.env.CFTC_PASSWORD || '',
                nfaId: process.env.CFTC_NFA_ID || '',
            } : undefined,
        },
    },
    monitoring: {
        realTimeAlerts: process.env.REAL_TIME_ALERTS === 'true',
        alertThresholds: {
            violations: parseInt(process.env.VIOLATION_ALERT_THRESHOLD || '5'),
            exposure: parseInt(process.env.EXPOSURE_ALERT_THRESHOLD || '1000000'),
            concentration: parseInt(process.env.CONCENTRATION_ALERT_THRESHOLD || '25'),
        },
        dashboardRefresh: parseInt(process.env.DASHBOARD_REFRESH_SECONDS || '30'),
    },
    integrations: {
        tradingSystem: process.env.TRADING_SYSTEM_URL || 'http://localhost:3001',
        portfolioManagement: process.env.PORTFOLIO_MGMT_URL || 'http://localhost:3002',
        riskManagement: process.env.RISK_MGMT_URL || 'http://localhost:3003',
        clientManagement: process.env.CLIENT_MGMT_URL || 'http://localhost:3004',
    },
};
const service = new FinancialServicesComplianceService_1.FinancialServicesComplianceService(config);
// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('Received SIGTERM, shutting down gracefully...');
    await service.cleanup();
    process.exit(0);
});
process.on('SIGINT', async () => {
    console.log('Received SIGINT, shutting down gracefully...');
    await service.cleanup();
    process.exit(0);
});
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
// Start the service
service.start().catch((error) => {
    console.error('Failed to start Financial Services Compliance Service:', error);
    process.exit(1);
});
console.log('Financial Services Compliance Service starting...');
