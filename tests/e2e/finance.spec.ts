import { test, expect } from '@playwright/test';

test.describe('Financial Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'admin@teachingcenter.com');
    await page.fill('input[name="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');
  });

  test.describe('Payments', () => {
    test('should display payments page', async ({ page }) => {
      await page.goto('/admin/business/payments');
      await expect(page.locator('text=Payments')).toBeVisible();
    });

    test('should show payment statistics', async ({ page }) => {
      await page.goto('/admin/business/payments');
      await expect(page.locator('text=Total Revenue')).toBeVisible();
      await expect(page.locator('text=Pending Amount')).toBeVisible();
    });

    test('should display payments table', async ({ page }) => {
      await page.goto('/admin/business/payments');
      await expect(page.locator('text=Student')).toBeVisible();
      await expect(page.locator('text=Amount')).toBeVisible();
      await expect(page.locator('text=Status')).toBeVisible();
    });

    test('should filter payments by status', async ({ page }) => {
      await page.goto('/admin/business/payments');

      // Click on status filter
      await page.click('button:has-text("All")');

      // Select Paid status
      await page.click('text=Paid');

      // Should filter to show only paid payments
      const statusCells = page.locator('td:has-text("PAID")');
      await expect(statusCells.first()).toBeVisible();
    });

    test('should search payments', async ({ page }) => {
      await page.goto('/admin/business/payments');

      // Search for a student name
      await page.fill('input[placeholder*="Search"]', 'John');

      // Should filter results
      await expect(page.locator('text=John')).toBeVisible();
    });
  });

  test.describe('Expenses', () => {
    test('should display expenses page', async ({ page }) => {
      await page.goto('/admin/business/expenses');
      await expect(page.locator('text=Expenses')).toBeVisible();
    });

    test('should show expense statistics', async ({ page }) => {
      await page.goto('/admin/business/expenses');
      await expect(page.locator('text=Total Expenses')).toBeVisible();
    });

    test('should display expenses table', async ({ page }) => {
      await page.goto('/admin/business/expenses');
      await expect(page.locator('text=Description')).toBeVisible();
      await expect(page.locator('text=Amount')).toBeVisible();
      await expect(page.locator('text=Category')).toBeVisible();
    });

    test('should add new expense', async ({ page }) => {
      await page.goto('/admin/business/expenses');

      // Click add expense button
      await page.click('text=Add Expense');

      // Should open add expense modal
      await expect(page.locator('text=Add New Expense')).toBeVisible();
    });

    test('should filter expenses by category', async ({ page }) => {
      await page.goto('/admin/business/expenses');

      // Click on category filter
      await page.click('button:has-text("All Categories")');

      // Select a category
      await page.click('text=Office Supplies');

      // Should filter results
      await expect(page.locator('text=Office Supplies')).toBeVisible();
    });
  });

  test.describe('Business Dashboard', () => {
    test('should display business dashboard', async ({ page }) => {
      await page.goto('/admin/business');
      await expect(page.locator('text=Business Dashboard')).toBeVisible();
    });

    test('should show financial overview stats', async ({ page }) => {
      await page.goto('/admin/business');
      await expect(page.locator('text=Total Income')).toBeVisible();
      await expect(page.locator('text=Total Expenses')).toBeVisible();
      await expect(page.locator('text=Net Profit')).toBeVisible();
    });

    test('should navigate to payments from business dashboard', async ({ page }) => {
      await page.goto('/admin/business');

      // Click payments button
      await page.click('text=Payments');

      // Should navigate to payments page
      await page.waitForURL('/admin/business/payments');
      await expect(page.locator('text=Payments')).toBeVisible();
    });

    test('should navigate to expenses from business dashboard', async ({ page }) => {
      await page.goto('/admin/business');

      // Click expenses button
      await page.click('text=Expenses');

      // Should navigate to expenses page
      await page.waitForURL('/admin/business/expenses');
      await expect(page.locator('text=Expenses')).toBeVisible();
    });

    test('should display recent financial movements', async ({ page }) => {
      await page.goto('/admin/business');
      await expect(page.locator('text=Recent Movements')).toBeVisible();
    });
  });

  test.describe('Finance Page', () => {
    test('should display finance management page', async ({ page }) => {
      await page.goto('/admin/finance');
      await expect(page.locator('text=Finance Management')).toBeVisible();
    });

    test('should show payment generation options', async ({ page }) => {
      await page.goto('/admin/finance');
      await expect(page.locator('text=Auto Payment Generator')).toBeVisible();
    });

    test('should display payment statistics', async ({ page }) => {
      await page.goto('/admin/finance');
      await expect(page.locator('text=Total Revenue')).toBeVisible();
      await expect(page.locator('text=Monthly Revenue')).toBeVisible();
    });
  });
});