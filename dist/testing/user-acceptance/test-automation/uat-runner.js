#!/usr/bin/env ts-node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const UATAutomationFramework_1 = require("./UATAutomationFramework");
const config = {
    baseUrl: process.env.UAT_BASE_URL || 'http://localhost:3000',
    timeout: 30000,
    retries: 2,
    browsers: ['chromium', 'firefox', 'webkit'],
    headless: process.env.HEADLESS !== 'false',
    slowMo: parseInt(process.env.SLOW_MO || '0'),
    screenshots: true,
    videos: true,
};
async function runUATSuite() {
    const framework = new UATAutomationFramework_1.UATAutomationFramework(config);
    try {
        console.log('🚀 Starting UAT Automation Suite...\n');
        // Initialize framework
        await framework.initialize();
        // Execute test phases
        console.log('📋 Phase 1: Authentication & User Management');
        const authResults = await framework.testUserAuthentication();
        console.log(`✅ Completed ${authResults.length} authentication tests\n`);
        console.log('📋 Phase 2: Portfolio Management');
        const portfolioResults = await framework.testPortfolioManagement();
        console.log(`✅ Completed ${portfolioResults.length} portfolio tests\n`);
        console.log('📋 Phase 3: Compliance Monitoring');
        const complianceResults = await framework.testComplianceMonitoring();
        console.log(`✅ Completed ${complianceResults.length} compliance tests\n`);
        console.log('📋 Phase 4: Performance Reporting');
        const reportingResults = await framework.testPerformanceReporting();
        console.log(`✅ Completed ${reportingResults.length} reporting tests\n`);
        console.log('📋 Phase 5: Mobile Application');
        const mobileResults = await framework.testMobileApplication();
        console.log(`✅ Completed ${mobileResults.length} mobile tests\n`);
        // Generate final report
        console.log('📊 Generating UAT Report...');
        await framework.generateReport();
        console.log('\n🎉 UAT Suite Completed Successfully!');
    }
    catch (error) {
        console.error('❌ UAT Suite Failed:', error);
        process.exit(1);
    }
    finally {
        await framework.cleanup();
    }
}
// CLI argument parsing
const args = process.argv.slice(2);
if (args.includes('--help')) {
    console.log(`
UAT Automation Runner

Usage: npm run uat [options]

Options:
  --help              Show this help message
  --headless=false    Run browsers in headful mode
  --slow-mo=1000      Add delay between actions (ms)
  --base-url=URL      Set the base URL for testing
  --browsers=chrome   Specify browsers (comma-separated)

Environment Variables:
  UAT_BASE_URL        Base URL for the application
  HEADLESS            Run in headless mode (default: true)
  SLOW_MO             Delay between actions in milliseconds
  
Examples:
  npm run uat
  npm run uat -- --headless=false --slow-mo=1000
  UAT_BASE_URL=https://staging.example.com npm run uat
`);
    process.exit(0);
}
// Parse command line arguments
args.forEach(arg => {
    if (arg.startsWith('--base-url=')) {
        config.baseUrl = arg.split('=')[1];
    }
    else if (arg.startsWith('--headless=')) {
        config.headless = arg.split('=')[1] === 'true';
    }
    else if (arg.startsWith('--slow-mo=')) {
        config.slowMo = parseInt(arg.split('=')[1]);
    }
    else if (arg.startsWith('--browsers=')) {
        const browsers = arg.split('=')[1].split(',');
        config.browsers = browsers.map(b => {
            switch (b.toLowerCase()) {
                case 'chrome':
                case 'chromium':
                    return 'chromium';
                case 'firefox':
                    return 'firefox';
                case 'safari':
                case 'webkit':
                    return 'webkit';
                default:
                    throw new Error(`Unsupported browser: ${b}`);
            }
        });
    }
});
// Run the UAT suite
runUATSuite().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
});
