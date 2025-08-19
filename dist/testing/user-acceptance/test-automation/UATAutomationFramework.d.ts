import { Page } from 'playwright';
export interface TestConfig {
    baseUrl: string;
    timeout: number;
    retries: number;
    browsers: ('chromium' | 'firefox' | 'webkit')[];
    headless: boolean;
    slowMo: number;
    screenshots: boolean;
    videos: boolean;
}
export interface TestUser {
    username: string;
    password: string;
    role: 'admin' | 'portfolio_manager' | 'advisor' | 'client';
    mfaEnabled: boolean;
    permissions: string[];
}
export interface TestResult {
    testId: string;
    testName: string;
    status: 'PASS' | 'FAIL' | 'SKIP';
    duration: number;
    browser: string;
    device?: string;
    error?: string;
    screenshots: string[];
    evidence: TestEvidence[];
}
export interface TestEvidence {
    type: 'screenshot' | 'video' | 'network' | 'console' | 'api_response';
    timestamp: Date;
    data: any;
    description: string;
}
export declare class UATAutomationFramework {
    private config;
    private browsers;
    private contexts;
    private pages;
    private testUsers;
    private testResults;
    constructor(config: TestConfig);
    private setupTestUsers;
    initialize(): Promise<void>;
    createTestSession(browserId: string, sessionId: string): Promise<Page>;
    authenticateUser(sessionId: string, userType: string): Promise<void>;
    testUserAuthentication(): Promise<TestResult[]>;
    testPortfolioManagement(): Promise<TestResult[]>;
    testComplianceMonitoring(): Promise<TestResult[]>;
    testPerformanceReporting(): Promise<TestResult[]>;
    testMobileApplication(): Promise<TestResult[]>;
    private verifyRoleBasedAccess;
    private testSessionTimeout;
    private captureScreenshots;
    generateReport(): Promise<void>;
    cleanup(): Promise<void>;
}
