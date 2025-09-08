export = OWASPComplianceChecker;
/**
 * OWASP Top 10 Compliance Checker for Investment Platform
 * Comprehensive assessment against OWASP Top 10 2021 security risks
 */
declare class OWASPComplianceChecker {
    results: {
        timestamp: string;
        owaspVersion: string;
        overallScore: number;
        compliance: any[];
        recommendations: any[];
        summary: {
            compliant: number;
            partiallyCompliant: number;
            nonCompliant: number;
        };
    };
    owaspTop10: {
        id: string;
        name: string;
        description: string;
        tests: string[];
    }[];
    runComplianceCheck(): Promise<void>;
    assessCategory(category: any): Promise<void>;
    assessBrokenAccessControl(assessment: any): Promise<void>;
    assessCryptographicFailures(assessment: any): Promise<void>;
    assessInjection(assessment: any): Promise<void>;
    assessInsecureDesign(assessment: any): Promise<void>;
    assessSecurityMisconfiguration(assessment: any): Promise<void>;
    assessVulnerableComponents(assessment: any): Promise<void>;
    assessAuthenticationFailures(assessment: any): Promise<void>;
    assessIntegrityFailures(assessment: any): Promise<void>;
    assessLoggingMonitoring(assessment: any): Promise<void>;
    assessSSRF(assessment: any): Promise<void>;
    checkFileExists(filePath: any): Promise<boolean>;
    checkForPattern(pattern: any, directories: any): Promise<boolean>;
    calculateOverallScore(): void;
    generateComplianceReport(): Promise<void>;
    generateHTMLReport(): string;
}
