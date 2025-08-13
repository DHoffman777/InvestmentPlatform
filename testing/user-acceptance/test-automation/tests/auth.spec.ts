import { test, expect } from '@playwright/test';

test.describe('Authentication Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('TC-001: Valid user login', async ({ page }) => {
    // Enter valid credentials
    await page.fill('[data-testid="username"]', 'pm@testfirm.com');
    await page.fill('[data-testid="password"]', 'TestPM123!');
    await page.click('[data-testid="login-button"]');

    // Verify successful login
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('[data-testid="user-profile"]')).toContainText('pm@testfirm.com');
    await expect(page.locator('[data-testid="dashboard"]')).toBeVisible();
  });

  test('TC-001: Invalid credentials', async ({ page }) => {
    // Enter invalid credentials
    await page.fill('[data-testid="username"]', 'invalid@testfirm.com');
    await page.fill('[data-testid="password"]', 'wrongpassword');
    await page.click('[data-testid="login-button"]');

    // Verify error message
    await expect(page.locator('[data-testid="error-message"]')).toContainText('Invalid credentials');
    await expect(page).toHaveURL(/.*login/);
  });

  test('TC-001: Account lockout after failed attempts', async ({ page }) => {
    // Attempt login with wrong password multiple times
    for (let i = 0; i < 5; i++) {
      await page.fill('[data-testid="username"]', 'pm@testfirm.com');
      await page.fill('[data-testid="password"]', 'wrongpassword');
      await page.click('[data-testid="login-button"]');
      
      await page.waitForSelector('[data-testid="error-message"]');
      await page.reload();
    }

    // Verify account lockout
    await page.fill('[data-testid="username"]', 'pm@testfirm.com');
    await page.fill('[data-testid="password"]', 'TestPM123!'); // Correct password
    await page.click('[data-testid="login-button"]');

    await expect(page.locator('[data-testid="error-message"]')).toContainText('Account locked');
  });

  test('TC-001: MFA authentication', async ({ page }) => {
    // Login with MFA-enabled user
    await page.fill('[data-testid="username"]', 'admin@testfirm.com');
    await page.fill('[data-testid="password"]', 'TestAdmin123!');
    await page.click('[data-testid="login-button"]');

    // Verify MFA prompt
    await expect(page.locator('[data-testid="mfa-prompt"]')).toBeVisible();
    await expect(page.locator('[data-testid="mfa-token"]')).toBeVisible();

    // Enter MFA token
    await page.fill('[data-testid="mfa-token"]', '123456'); // Test token
    await page.click('[data-testid="mfa-submit"]');

    // Verify successful login
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('[data-testid="user-profile"]')).toContainText('admin@testfirm.com');
  });

  test('TC-001: Session timeout', async ({ page }) => {
    // Login successfully
    await page.fill('[data-testid="username"]', 'pm@testfirm.com');
    await page.fill('[data-testid="password"]', 'TestPM123!');
    await page.click('[data-testid="login-button"]');
    await expect(page).toHaveURL(/.*dashboard/);

    // Simulate session timeout by clearing session storage
    await page.evaluate(() => {
      sessionStorage.clear();
      localStorage.removeItem('authToken');
    });

    // Navigate to protected page
    await page.goto('/portfolios');

    // Verify redirect to login
    await expect(page).toHaveURL(/.*login/);
    await expect(page.locator('[data-testid="session-timeout-message"]')).toBeVisible();
  });

  test('TC-002: Role-based access - Admin', async ({ page }) => {
    // Login as admin
    await page.fill('[data-testid="username"]', 'admin@testfirm.com');
    await page.fill('[data-testid="password"]', 'TestAdmin123!');
    await page.click('[data-testid="login-button"]');
    
    // Handle MFA
    await page.fill('[data-testid="mfa-token"]', '123456');
    await page.click('[data-testid="mfa-submit"]');

    // Verify admin-specific elements
    await expect(page.locator('[data-testid="admin-menu"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-management"]')).toBeVisible();
    await expect(page.locator('[data-testid="system-settings"]')).toBeVisible();
  });

  test('TC-002: Role-based access - Portfolio Manager', async ({ page }) => {
    // Login as portfolio manager
    await page.fill('[data-testid="username"]', 'pm@testfirm.com');
    await page.fill('[data-testid="password"]', 'TestPM123!');
    await page.click('[data-testid="login-button"]');

    // Verify PM-specific elements
    await expect(page.locator('[data-testid="portfolios-menu"]')).toBeVisible();
    await expect(page.locator('[data-testid="trading-menu"]')).toBeVisible();
    await expect(page.locator('[data-testid="reports-menu"]')).toBeVisible();
    
    // Verify admin elements are hidden
    await expect(page.locator('[data-testid="admin-menu"]')).not.toBeVisible();
  });

  test('TC-002: Role-based access - Client', async ({ page }) => {
    // Login as client
    await page.fill('[data-testid="username"]', 'client@testfirm.com');
    await page.fill('[data-testid="password"]', 'TestClient123!');
    await page.click('[data-testid="login-button"]');

    // Verify client-specific elements
    await expect(page.locator('[data-testid="portfolio-view"]')).toBeVisible();
    await expect(page.locator('[data-testid="documents-menu"]')).toBeVisible();
    await expect(page.locator('[data-testid="statements-menu"]')).toBeVisible();
    
    // Verify restricted elements are hidden
    await expect(page.locator('[data-testid="admin-menu"]')).not.toBeVisible();
    await expect(page.locator('[data-testid="trading-menu"]')).not.toBeVisible();
  });
});