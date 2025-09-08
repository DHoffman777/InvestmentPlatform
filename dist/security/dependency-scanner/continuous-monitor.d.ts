export = ContinuousDependencyMonitor;
/**
 * Continuous Dependency Monitoring System
 * Automated monitoring and alerting for dependency security issues
 */
declare class ContinuousDependencyMonitor {
    scanner: DependencyScanner;
    config: {
        scanInterval: string;
        alertThresholds: {
            critical: number;
            high: number;
            medium: number;
            outdated: number;
        };
        notifications: {
            email: {
                enabled: boolean;
                smtp: {
                    host: string;
                    port: string | number;
                    secure: boolean;
                    auth: {
                        user: string;
                        pass: string;
                    };
                };
                from: string;
                to: string[];
            };
            slack: {
                enabled: boolean;
                webhook: string;
            };
        };
        autoUpdate: {
            enabled: boolean;
            securityOnly: boolean;
            testCommand: string;
            maxSeverity: string;
        };
    };
    history: any[];
    lastScanResults: {
        timestamp: string;
        summary: {
            total: number;
            vulnerable: number;
            outdated: number;
            critical: number;
            high: number;
            medium: number;
            low: number;
        };
        vulnerabilities: any[];
        outdatedPackages: any[];
        recommendations: any[];
        ecosystems: any[];
    };
    startMonitoring(): Promise<void>;
    performScheduledScan(): Promise<void>;
    analyzeResults(currentResults: any): Promise<{
        alerts: any[];
        trends: {};
        riskScore: number;
        recommendations: any[];
    }>;
    calculateTrends(previous: any, current: any): {
        vulnerabilities: {
            critical: number;
            high: number;
            medium: number;
            low: number;
        };
        packages: {
            total: number;
            outdated: number;
        };
    };
    calculateRiskScore(results: any): number;
    generateRecommendations(results: any, analysis: any): {
        priority: string;
        action: string;
        description: string;
    }[];
    shouldAlert(analysis: any): boolean;
    shouldAutoUpdate(analysis: any): boolean;
    sendAlerts(results: any, analysis: any): Promise<void>;
    sendEmailAlert(alertData: any): Promise<void>;
    sendSlackAlert(alertData: any): Promise<void>;
    generateAlertEmail(alertData: any): string;
    performAutoUpdate(results: any, analysis: any): Promise<void>;
    isUpdateable(vuln: any): boolean;
    shouldAutoUpdateSeverity(severity: any): boolean;
    updatePackage(vuln: any): Promise<void>;
    createBackup(): Promise<void>;
    rollbackUpdates(): Promise<void>;
    generateTrendReport(): Promise<void>;
    analyzeTrends(): {
        period: string;
        metrics: {
            vulnerabilities: any[];
            packages: any[];
            riskScores: any[];
        };
    };
    sendErrorAlert(error: any): Promise<void>;
    sendAutoUpdateNotification(updates: any): Promise<void>;
    sendAutoUpdateFailureNotification(error: any): Promise<void>;
}
import DependencyScanner = require("./scanner");
