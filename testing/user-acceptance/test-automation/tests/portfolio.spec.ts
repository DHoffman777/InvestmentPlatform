import { test, expect } from '@playwright/test';

test.describe('Portfolio Management Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Login as portfolio manager
    await page.goto('/login');
    await page.fill('[data-testid="username"]', 'pm@testfirm.com');
    await page.fill('[data-testid="password"]', 'TestPM123!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('TC-003: Create new portfolio', async ({ page }) => {
    // Navigate to portfolios
    await page.click('[data-testid="portfolios-menu"]');
    await expect(page.locator('[data-testid="portfolios-list"]')).toBeVisible();

    // Click create portfolio
    await page.click('[data-testid="create-portfolio"]');
    await expect(page.locator('[data-testid="portfolio-form"]')).toBeVisible();

    // Fill portfolio details
    await page.fill('[data-testid="portfolio-name"]', 'UAT Test Portfolio');
    await page.fill('[data-testid="portfolio-description"]', 'Created during UAT testing');
    
    // Select client
    await page.click('[data-testid="client-search"]');
    await page.fill('[data-testid="client-search"]', 'Test Client');
    await page.click('[data-testid="client-option"]:first-child');

    // Set investment objective
    await page.selectOption('[data-testid="investment-objective"]', 'growth');
    
    // Set risk tolerance
    await page.selectOption('[data-testid="risk-tolerance"]', 'moderate');

    // Save portfolio
    await page.click('[data-testid="save-portfolio"]');

    // Verify success
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Portfolio created successfully');
    await expect(page.locator('[data-testid="portfolio-list"]')).toContainText('UAT Test Portfolio');
  });

  test('TC-003: Portfolio configuration', async ({ page }) => {
    // Navigate to existing portfolio
    await page.click('[data-testid="portfolios-menu"]');
    await page.click('[data-testid="portfolio-item"]:first-child');
    
    // Edit portfolio settings
    await page.click('[data-testid="edit-portfolio"]');
    await expect(page.locator('[data-testid="portfolio-settings"]')).toBeVisible();

    // Add investment restrictions
    await page.click('[data-testid="add-restriction"]');
    await page.selectOption('[data-testid="restriction-type"]', 'sector-limit');
    await page.fill('[data-testid="restriction-value"]', '25');
    await page.click('[data-testid="save-restriction"]');

    // Add asset allocation targets
    await page.click('[data-testid="allocation-tab"]');
    await page.fill('[data-testid="equity-target"]', '60');
    await page.fill('[data-testid="fixed-income-target"]', '35');
    await page.fill('[data-testid="cash-target"]', '5');
    
    // Save configuration
    await page.click('[data-testid="save-configuration"]');
    await expect(page.locator('[data-testid="success-message"]')).toBeVisible();

    // Verify restrictions are saved
    await page.reload();
    await expect(page.locator('[data-testid="restrictions-list"]')).toContainText('sector-limit: 25%');
  });

  test('TC-003: Position management', async ({ page }) => {
    // Navigate to portfolio
    await page.click('[data-testid="portfolios-menu"]');
    await page.click('[data-testid="portfolio-item"]:first-child');
    
    // Add new position
    await page.click('[data-testid="add-position"]');
    await expect(page.locator('[data-testid="position-form"]')).toBeVisible();

    // Search for security
    await page.fill('[data-testid="symbol-search"]', 'AAPL');
    await page.click('[data-testid="symbol-option"]:first-child');
    
    // Enter position details
    await page.fill('[data-testid="shares"]', '100');
    await page.fill('[data-testid="price"]', '150.00');
    await page.selectOption('[data-testid="position-type"]', 'long');
    
    // Add position
    await page.click('[data-testid="add-position-confirm"]');
    
    // Verify position added
    await expect(page.locator('[data-testid="positions-table"]')).toContainText('AAPL');
    await expect(page.locator('[data-testid="portfolio-value"]')).toContainText('15,000');

    // Edit position
    await page.click('[data-testid="edit-position-AAPL"]');
    await page.fill('[data-testid="shares"]', '150');
    await page.click('[data-testid="save-position"]');
    
    // Verify position updated
    await expect(page.locator('[data-testid="portfolio-value"]')).toContainText('22,500');

    // Remove position
    await page.click('[data-testid="remove-position-AAPL"]');
    await page.click('[data-testid="confirm-remove"]');
    
    // Verify position removed
    await expect(page.locator('[data-testid="positions-table"]')).not.toContainText('AAPL');
  });

  test('TC-004: Transaction processing', async ({ page }) => {
    // Navigate to trading
    await page.click('[data-testid="trading-menu"]');
    await expect(page.locator('[data-testid="trading-dashboard"]')).toBeVisible();

    // Enter buy order
    await page.click('[data-testid="new-order"]');
    await page.selectOption('[data-testid="order-type"]', 'market');
    await page.selectOption('[data-testid="side"]', 'buy');
    
    // Select security
    await page.fill('[data-testid="symbol-search"]', 'MSFT');
    await page.click('[data-testid="symbol-option"]:first-child');
    
    // Enter order details
    await page.fill('[data-testid="quantity"]', '50');
    await page.selectOption('[data-testid="portfolio"]', 'Test Portfolio');
    
    // Submit order
    await page.click('[data-testid="submit-order"]');
    
    // Verify order confirmation
    await expect(page.locator('[data-testid="order-confirmation"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-id"]')).toBeVisible();

    // Check order status
    await page.click('[data-testid="orders-tab"]');
    await expect(page.locator('[data-testid="orders-table"]')).toContainText('MSFT');
    await expect(page.locator('[data-testid="order-status"]')).toContainText('PENDING');

    // Simulate order execution
    await page.click('[data-testid="simulate-execution"]');
    await page.fill('[data-testid="execution-price"]', '300.00');
    await page.click('[data-testid="execute-order"]');
    
    // Verify execution
    await expect(page.locator('[data-testid="order-status"]')).toContainText('FILLED');
    
    // Check position created
    await page.click('[data-testid="portfolios-menu"]');
    await page.click('[data-testid="portfolio-item"]:first-child');
    await expect(page.locator('[data-testid="positions-table"]')).toContainText('MSFT');
  });

  test('TC-004: Settlement processing', async ({ page }) => {
    // Navigate to settlements
    await page.click('[data-testid="trading-menu"]');
    await page.click('[data-testid="settlements-tab"]');
    
    // View pending settlements
    await expect(page.locator('[data-testid="settlements-table"]')).toBeVisible();
    
    // Process settlement
    await page.click('[data-testid="process-settlement"]:first-child');
    await page.click('[data-testid="confirm-settlement"]');
    
    // Verify settlement processed
    await expect(page.locator('[data-testid="settlement-status"]')).toContainText('SETTLED');
    
    // Check cash impact
    await page.click('[data-testid="portfolios-menu"]');
    await page.click('[data-testid="portfolio-item"]:first-child');
    await page.click('[data-testid="cash-tab"]');
    await expect(page.locator('[data-testid="cash-balance"]')).toBeVisible();
  });

  test('TC-004: Corporate actions', async ({ page }) => {
    // Navigate to corporate actions
    await page.click('[data-testid="portfolios-menu"]');
    await page.click('[data-testid="portfolio-item"]:first-child');
    await page.click('[data-testid="corporate-actions-tab"]');
    
    // Process dividend
    await page.click('[data-testid="new-corporate-action"]');
    await page.selectOption('[data-testid="action-type"]', 'dividend');
    await page.fill('[data-testid="symbol-search"]', 'AAPL');
    await page.click('[data-testid="symbol-option"]:first-child');
    await page.fill('[data-testid="dividend-amount"]', '0.25');
    await page.fill('[data-testid="ex-date"]', '2024-02-01');
    await page.fill('[data-testid="pay-date"]', '2024-02-15');
    
    // Process action
    await page.click('[data-testid="process-action"]');
    
    // Verify dividend processed
    await expect(page.locator('[data-testid="success-message"]')).toContainText('Corporate action processed');
    
    // Check cash impact
    await page.click('[data-testid="cash-tab"]');
    await expect(page.locator('[data-testid="dividend-received"]')).toBeVisible();

    // Process stock split
    await page.click('[data-testid="corporate-actions-tab"]');
    await page.click('[data-testid="new-corporate-action"]');
    await page.selectOption('[data-testid="action-type"]', 'split');
    await page.fill('[data-testid="symbol-search"]', 'TSLA');
    await page.click('[data-testid="symbol-option"]:first-child');
    await page.fill('[data-testid="split-ratio"]', '2:1');
    await page.fill('[data-testid="effective-date"]', '2024-02-01');
    
    // Process split
    await page.click('[data-testid="process-action"]');
    
    // Verify position adjustment
    await page.click('[data-testid="positions-tab"]');
    await expect(page.locator('[data-testid="position-TSLA-shares"]')).toContainText('200'); // Doubled
  });

  test('TC-003: Portfolio hierarchy', async ({ page }) => {
    // Create parent portfolio
    await page.click('[data-testid="portfolios-menu"]');
    await page.click('[data-testid="create-portfolio"]');
    await page.fill('[data-testid="portfolio-name"]', 'Master Portfolio');
    await page.selectOption('[data-testid="portfolio-type"]', 'master');
    await page.click('[data-testid="save-portfolio"]');
    
    // Create sub-portfolio
    await page.click('[data-testid="create-portfolio"]');
    await page.fill('[data-testid="portfolio-name"]', 'Sub Portfolio');
    await page.selectOption('[data-testid="portfolio-type"]', 'sub');
    await page.selectOption('[data-testid="parent-portfolio"]', 'Master Portfolio');
    await page.click('[data-testid="save-portfolio"]');
    
    // Verify hierarchy
    await expect(page.locator('[data-testid="portfolio-hierarchy"]')).toContainText('Master Portfolio > Sub Portfolio');
    
    // Test consolidated view
    await page.click('[data-testid="consolidated-view"]');
    await expect(page.locator('[data-testid="consolidated-positions"]')).toBeVisible();
  });
});