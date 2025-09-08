"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UATAutomationFramework = void 0;
const playwright_1 = require("playwright");
const test_1 = require("@playwright/test");
class UATAutomationFramework {
    config;
    browsers = new Map();
    contexts = new Map();
    pages = new Map();
    testUsers = new Map();
    testResults = [];
    constructor(config) {
        this.config = config;
        this.setupTestUsers();
    }
    setupTestUsers() {
        // Admin user
        this.testUsers.set('admin', {
            username: 'admin@testfirm.com',
            password: 'TestAdmin123!',
            role: 'admin',
            mfaEnabled: true,
            permissions: ['*'],
        });
        // Portfolio Manager
        this.testUsers.set('pm', {
            username: 'pm@testfirm.com',
            password: 'TestPM123!',
            role: 'portfolio_manager',
            mfaEnabled: true,
            permissions: ['portfolio.read', 'portfolio.write', 'trade.execute', 'reports.generate'],
        });
        // Financial Advisor
        this.testUsers.set('advisor', {
            username: 'advisor@testfirm.com',
            password: 'TestAdvisor123!',
            role: 'advisor',
            mfaEnabled: false,
            permissions: ['client.read', 'portfolio.read', 'reports.generate'],
        });
        // Client user
        this.testUsers.set('client', {
            username: 'client@testfirm.com',
            password: 'TestClient123!',
            role: 'client',
            mfaEnabled: false,
            permissions: ['portfolio.read.own', 'documents.read.own'],
        });
    }
    async initialize() {
        console.log('Initializing UAT Automation Framework...');
        for (const browserType of this.config.browsers) {
            let browser;
            switch (browserType) {
                case 'chromium':
                    browser = await playwright_1.chromium.launch({
                        headless: this.config.headless,
                        slowMo: this.config.slowMo,
                    });
                    break;
                case 'firefox':
                    browser = await playwright_1.firefox.launch({
                        headless: this.config.headless,
                        slowMo: this.config.slowMo,
                    });
                    break;
                case 'webkit':
                    browser = await playwright_1.webkit.launch({
                        headless: this.config.headless,
                        slowMo: this.config.slowMo,
                    });
                    break;
                default:
                    throw new Error(`Unsupported browser: ${browserType}`);
            }
            this.browsers.set(browserType, browser);
        }
        console.log(`Initialized ${this.browsers.size} browser(s)`);
    }
    async createTestSession(browserId, sessionId) {
        const browser = this.browsers.get(browserId);
        if (!browser) {
            throw new Error(`Browser ${browserId} not initialized`);
        }
        const context = await browser.newContext({
            viewport: { width: 1920, height: 1080 },
            recordVideo: this.config.videos ? {
                dir: `./test-results/videos/${sessionId}/`,
            } : undefined,
        });
        const page = await context.newPage();
        // Set up page event listeners
        page.on('console', (msg) => {
            console.log(`[${browserId}] Console: ${msg.text()}`);
        });
        page.on('pageerror', (error) => {
            console.error(`[${browserId}] Page Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
        });
        this.contexts.set(sessionId, context);
        this.pages.set(sessionId, page);
        return page;
    }
    async authenticateUser(sessionId, userType) {
        const page = this.pages.get(sessionId);
        const user = this.testUsers.get(userType);
        if (!page || !user) {
            throw new Error(`Session ${sessionId} or user ${userType} not found`);
        }
        // Navigate to login page
        await page.goto(`${this.config.baseUrl}/login`);
        await page.waitForLoadState('networkidle');
        // Enter credentials
        await page.fill('[data-testid="username"]', user.username);
        await page.fill('[data-testid="password"]', user.password);
        await page.click('[data-testid="login-button"]');
        // Handle MFA if enabled
        if (user.mfaEnabled) {
            await page.waitForSelector('[data-testid="mfa-token"]', { timeout: 5000 });
            // In a real scenario, you would integrate with MFA provider
            // For testing, we'll use a test token
            await page.fill('[data-testid="mfa-token"]', '123456');
            await page.click('[data-testid="mfa-submit"]');
        }
        // Wait for successful login
        await page.waitForSelector('[data-testid="dashboard"]', { timeout: 10000 });
        await test_1.expect(page.locator('[data-testid="user-profile"]')).toContainText(user.username);
    }
    // Test Case: TC-001 - User Authentication
    async testUserAuthentication() {
        const results = [];
        for (const [browserId] of this.browsers) {
            for (const [userType, user] of this.testUsers) {
                const testId = `TC-001-${userType}-${browserId}`;
                const startTime = Date.now();
                let result;
                try {
                    const page = await this.createTestSession(browserId, testId);
                    // Test valid login
                    await this.authenticateUser(testId, userType);
                    // Verify dashboard elements based on role
                    await this.verifyRoleBasedAccess(page, user.role);
                    // Test session timeout (simulate)
                    await this.testSessionTimeout(page);
                    result = {
                        testId,
                        testName: `User Authentication - ${user.role} - ${browserId}`,
                        status: 'PASS',
                        duration: Date.now() - startTime,
                        browser: browserId,
                        screenshots: await this.captureScreenshots(testId, page),
                        evidence: [],
                    };
                }
                catch (error) {
                    result = {
                        testId,
                        testName: `User Authentication - ${user.role} - ${browserId}`,
                        status: 'FAIL',
                        duration: Date.now() - startTime,
                        browser: browserId,
                        error: error.message,
                        screenshots: [],
                        evidence: [],
                    };
                }
                results.push(result);
                this.testResults.push(result);
            }
        }
        return results;
    }
    // Test Case: TC-003 - Portfolio Management
    async testPortfolioManagement() {
        const results = [];
        for (const [browserId] of this.browsers) {
            const testId = `TC-003-${browserId}`;
            const startTime = Date.now();
            let result;
            try {
                const page = await this.createTestSession(browserId, testId);
                await this.authenticateUser(testId, 'pm');
                // Test portfolio creation
                await page.click('[data-testid="portfolios-menu"]');
                await page.click('[data-testid="create-portfolio"]');
                await page.fill('[data-testid="portfolio-name"]', 'UAT Test Portfolio');
                await page.fill('[data-testid="client-search"]', 'Test Client');
                await page.click('[data-testid="client-option"]:first-child');
                await page.selectOption('[data-testid="investment-objective"]', 'growth');
                await page.click('[data-testid="save-portfolio"]');
                // Verify portfolio creation
                await page.waitForSelector('[data-testid="portfolio-success"]');
                await test_1.expect(page.locator('[data-testid="portfolio-list"]'))
                    .toContainText('UAT Test Portfolio');
                // Test position management
                await page.click('[data-testid="add-position"]');
                await page.fill('[data-testid="symbol-search"]', 'AAPL');
                await page.click('[data-testid="symbol-option"]:first-child');
                await page.fill('[data-testid="shares"]', '100');
                await page.fill('[data-testid="price"]', '150.00');
                await page.click('[data-testid="add-position-confirm"]');
                // Verify position addition
                await test_1.expect(page.locator('[data-testid="positions-table"]'))
                    .toContainText('AAPL');
                await test_1.expect(page.locator('[data-testid="portfolio-value"]'))
                    .toContainText('15,000');
                result = {
                    testId,
                    testName: `Portfolio Management - ${browserId}`,
                    status: 'PASS',
                    duration: Date.now() - startTime,
                    browser: browserId,
                    screenshots: await this.captureScreenshots(testId, page),
                    evidence: [],
                };
            }
            catch (error) {
                result = {
                    testId,
                    testName: `Portfolio Management - ${browserId}`,
                    status: 'FAIL',
                    duration: Date.now() - startTime,
                    browser: browserId,
                    error: error.message,
                    screenshots: [],
                    evidence: [],
                };
            }
            results.push(result);
            this.testResults.push(result);
        }
        return results;
    }
    // Test Case: TC-006 - Compliance Monitoring
    async testComplianceMonitoring() {
        const results = [];
        for (const [browserId] of this.browsers) {
            const testId = `TC-006-${browserId}`;
            const startTime = Date.now();
            let result;
            try {
                const page = await this.createTestSession(browserId, testId);
                await this.authenticateUser(testId, 'pm');
                // Navigate to compliance dashboard
                await page.click('[data-testid="compliance-menu"]');
                await page.waitForLoadState('networkidle');
                // Test suitability assessment
                await page.click('[data-testid="suitability-tab"]');
                await page.click('[data-testid="new-assessment"]');
                await page.fill('[data-testid="client-search"]', 'Test Client');
                await page.click('[data-testid="client-option"]:first-child');
                await page.selectOption('[data-testid="product-type"]', 'equity');
                await page.click('[data-testid="conduct-assessment"]');
                // Wait for assessment completion
                await page.waitForSelector('[data-testid="assessment-result"]');
                await test_1.expect(page.locator('[data-testid="suitability-determination"]'))
                    .toBeVisible();
                // Test AML screening
                await page.click('[data-testid="aml-tab"]');
                await page.click('[data-testid="new-aml-check"]');
                await page.fill('[data-testid="client-search"]', 'Test Client');
                await page.click('[data-testid="client-option"]:first-child');
                await page.selectOption('[data-testid="check-type"]', 'periodic');
                await page.click('[data-testid="perform-check"]');
                // Verify AML check completion
                await page.waitForSelector('[data-testid="aml-result"]');
                await test_1.expect(page.locator('[data-testid="risk-level"]'))
                    .toBeVisible();
                // Test violation recording
                await page.click('[data-testid="violations-tab"]');
                await page.click('[data-testid="record-violation"]');
                await page.selectOption('[data-testid="violation-type"]', 'REGULATORY');
                await page.selectOption('[data-testid="severity"]', 'MEDIUM');
                await page.fill('[data-testid="regulation"]', 'Investment Advisers Act');
                await page.fill('[data-testid="description"]', 'UAT Test Violation');
                await page.click('[data-testid="save-violation"]');
                // Verify violation recording
                await page.waitForSelector('[data-testid="violation-success"]');
                await test_1.expect(page.locator('[data-testid="violations-list"]'))
                    .toContainText('UAT Test Violation');
                result = {
                    testId,
                    testName: `Compliance Monitoring - ${browserId}`,
                    status: 'PASS',
                    duration: Date.now() - startTime,
                    browser: browserId,
                    screenshots: await this.captureScreenshots(testId, page),
                    evidence: [],
                };
            }
            catch (error) {
                result = {
                    testId,
                    testName: `Compliance Monitoring - ${browserId}`,
                    status: 'FAIL',
                    duration: Date.now() - startTime,
                    browser: browserId,
                    error: error.message,
                    screenshots: [],
                    evidence: [],
                };
            }
            results.push(result);
            this.testResults.push(result);
        }
        return results;
    }
    // Test Case: TC-007 - Performance Reporting
    async testPerformanceReporting() {
        const results = [];
        for (const [browserId] of this.browsers) {
            const testId = `TC-007-${browserId}`;
            const startTime = Date.now();
            let result;
            try {
                const page = await this.createTestSession(browserId, testId);
                await this.authenticateUser(testId, 'pm');
                // Navigate to reports
                await page.click('[data-testid="reports-menu"]');
                await page.click('[data-testid="performance-reports"]');
                // Generate TWR report
                await page.click('[data-testid="twr-report"]');
                await page.fill('[data-testid="start-date"]', '2024-01-01');
                await page.fill('[data-testid="end-date"]', '2024-12-31');
                await page.click('[data-testid="select-portfolio"]');
                await page.click('[data-testid="portfolio-option"]:first-child');
                await page.click('[data-testid="generate-report"]');
                // Wait for report generation
                await page.waitForSelector('[data-testid="report-results"]', { timeout: 30000 });
                // Verify report content
                await test_1.expect(page.locator('[data-testid="twr-value"]')).toBeVisible();
                await test_1.expect(page.locator('[data-testid="benchmark-comparison"]')).toBeVisible();
                await test_1.expect(page.locator('[data-testid="performance-chart"]')).toBeVisible();
                // Test attribution analysis
                await page.click('[data-testid="attribution-tab"]');
                await page.click('[data-testid="generate-attribution"]');
                await page.waitForSelector('[data-testid="attribution-table"]');
                await test_1.expect(page.locator('[data-testid="sector-attribution"]')).toBeVisible();
                await test_1.expect(page.locator('[data-testid="security-attribution"]')).toBeVisible();
                // Test report export
                await page.click('[data-testid="export-dropdown"]');
                const downloadPromise = page.waitForEvent('download');
                await page.click('[data-testid="export-pdf"]');
                const download = await downloadPromise;
                (0, test_1.expect)(download.suggestedFilename()).toContain('.pdf');
                result = {
                    testId,
                    testName: `Performance Reporting - ${browserId}`,
                    status: 'PASS',
                    duration: Date.now() - startTime,
                    browser: browserId,
                    screenshots: await this.captureScreenshots(testId, page),
                    evidence: [],
                };
            }
            catch (error) {
                result = {
                    testId,
                    testName: `Performance Reporting - ${browserId}`,
                    status: 'FAIL',
                    duration: Date.now() - startTime,
                    browser: browserId,
                    error: error.message,
                    screenshots: [],
                    evidence: [],
                };
            }
            results.push(result);
            this.testResults.push(result);
        }
        return results;
    }
    // Mobile Testing
    async testMobileApplication() {
        const results = [];
        const mobileDevices = [
            { name: 'iPhone 12', viewport: { width: 390, height: 844 } },
            { name: 'Samsung Galaxy S21', viewport: { width: 384, height: 854 } },
            { name: 'iPad Pro', viewport: { width: 1024, height: 1366 } },
        ];
        for (const device of mobileDevices) {
            const testId = `TC-010-${device.name.replace(/\s+/g, '-')}`;
            const startTime = Date.now();
            let result;
            try {
                const browser = this.browsers.get('chromium');
                if (!browser)
                    throw new Error('Chromium browser not available');
                const context = await browser.newContext({
                    viewport: device.viewport,
                    userAgent: device.name.includes('iPhone') ?
                        'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X) AppleWebKit/605.1.15' :
                        'Mozilla/5.0 (Linux; Android 11; SM-G991B) AppleWebKit/537.36',
                });
                const page = await context.newPage();
                this.pages.set(testId, page);
                // Test mobile login
                await page.goto(`${this.config.baseUrl}/mobile`);
                await this.authenticateUser(testId, 'client');
                // Test responsive design
                await test_1.expect(page.locator('[data-testid="mobile-dashboard"]')).toBeVisible();
                await test_1.expect(page.locator('[data-testid="portfolio-summary"]')).toBeVisible();
                // Test touch interactions
                await page.tap('[data-testid="portfolio-card"]');
                await page.waitForSelector('[data-testid="portfolio-details"]');
                // Test biometric authentication (simulated)
                if (device.name.includes('iPhone') || device.name.includes('Samsung')) {
                    await page.click('[data-testid="enable-biometric"]');
                    await page.click('[data-testid="simulate-biometric"]');
                    await test_1.expect(page.locator('[data-testid="biometric-success"]')).toBeVisible();
                }
                result = {
                    testId,
                    testName: `Mobile Application - ${device.name}`,
                    status: 'PASS',
                    duration: Date.now() - startTime,
                    browser: 'chromium',
                    device: device.name,
                    screenshots: await this.captureScreenshots(testId, page),
                    evidence: [],
                };
                await context.close();
            }
            catch (error) {
                result = {
                    testId,
                    testName: `Mobile Application - ${device.name}`,
                    status: 'FAIL',
                    duration: Date.now() - startTime,
                    browser: 'chromium',
                    device: device.name,
                    error: error.message,
                    screenshots: [],
                    evidence: [],
                };
            }
            results.push(result);
            this.testResults.push(result);
        }
        return results;
    }
    async verifyRoleBasedAccess(page, role) {
        switch (role) {
            case 'admin':
                await test_1.expect(page.locator('[data-testid="admin-menu"]')).toBeVisible();
                await test_1.expect(page.locator('[data-testid="user-management"]')).toBeVisible();
                break;
            case 'portfolio_manager':
                await test_1.expect(page.locator('[data-testid="portfolios-menu"]')).toBeVisible();
                await test_1.expect(page.locator('[data-testid="trading-menu"]')).toBeVisible();
                break;
            case 'advisor':
                await test_1.expect(page.locator('[data-testid="clients-menu"]')).toBeVisible();
                await test_1.expect(page.locator('[data-testid="reports-menu"]')).toBeVisible();
                break;
            case 'client':
                await test_1.expect(page.locator('[data-testid="portfolio-view"]')).toBeVisible();
                await test_1.expect(page.locator('[data-testid="documents-menu"]')).toBeVisible();
                await test_1.expect(page.locator('[data-testid="admin-menu"]')).not.toBeVisible();
                break;
        }
    }
    async testSessionTimeout(page) {
        // Simulate session timeout by clearing session storage
        await page.evaluate(() => {
            sessionStorage.clear();
            localStorage.removeItem('authToken');
        });
        // Navigate to protected page
        await page.goto(`${this.config.baseUrl}/portfolios`);
        // Should be redirected to login
        await test_1.expect(page.locator('[data-testid="login-form"]')).toBeVisible();
    }
    async captureScreenshots(testId, page) {
        if (!this.config.screenshots)
            return [];
        const screenshots = [];
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `./test-results/screenshots/${testId}_${timestamp}.png`;
        await page.screenshot({
            path: filename,
            fullPage: true
        });
        screenshots.push(filename);
        return screenshots;
    }
    async generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            summary: {
                total: this.testResults.length,
                passed: this.testResults.filter(r => r.status === 'PASS').length,
                failed: this.testResults.filter(r => r.status === 'FAIL').length,
                skipped: this.testResults.filter(r => r.status === 'SKIP').length,
            },
            results: this.testResults,
        };
        const fs = require('fs').promises;
        await fs.writeFile('./test-results/uat-results.json', JSON.stringify(report, null, 2));
        console.log('\n=== UAT Test Results ===');
        console.log(`Total Tests: ${report.summary.total}`);
        console.log(`Passed: ${report.summary.passed}`);
        console.log(`Failed: ${report.summary.failed}`);
        console.log(`Skipped: ${report.summary.skipped}`);
        console.log(`Pass Rate: ${((report.summary.passed / report.summary.total) * 100).toFixed(2)}%`);
    }
    async cleanup() {
        // Close all pages and contexts
        for (const [sessionId, page] of this.pages) {
            await page.close();
        }
        for (const [sessionId, context] of this.contexts) {
            await context.close();
        }
        // Close all browsers
        for (const [browserId, browser] of this.browsers) {
            await browser.close();
        }
        console.log('UAT Automation Framework cleanup completed');
    }
}
exports.UATAutomationFramework = UATAutomationFramework;
