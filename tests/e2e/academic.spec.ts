import { test, expect } from '@playwright/test';

test.describe('Academic Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'admin@teachingcenter.com');
    await page.fill('input[name="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');
  });

  test('should display academic dashboard', async ({ page }) => {
    await page.goto('/admin/academic');
    await expect(page.locator('text=Academic Management')).toBeVisible();
  });

  test('should display subjects list', async ({ page }) => {
    await page.goto('/admin/academic');
    await expect(page.locator('text=Subjects')).toBeVisible();
  });

  test('should add new subject', async ({ page }) => {
    await page.goto('/admin/academic');

    // Click add subject button
    await page.click('text=Add Subject');

    // Should open add subject modal
    await expect(page.locator('text=Add New Subject')).toBeVisible();
  });

  test('should display tests and grades', async ({ page }) => {
    await page.goto('/admin/academic');
    await expect(page.locator('text=Tests & Grades')).toBeVisible();
  });

  test('should create new test', async ({ page }) => {
    await page.goto('/admin/academic');

    // Click create test button
    await page.click('text=Create Test');

    // Should open create test modal
    await expect(page.locator('text=Create New Test')).toBeVisible();
  });

  test('should display test results', async ({ page }) => {
    await page.goto('/admin/academic');

    // Navigate to test results section
    await page.click('text=Test Results');

    // Should display test results table
    await expect(page.locator('text=Student')).toBeVisible();
    await expect(page.locator('text=Score')).toBeVisible();
  });

  test('should filter tests by subject', async ({ page }) => {
    await page.goto('/admin/academic');

    // Click on subject filter
    await page.click('button:has-text("All Subjects")');

    // Select Mathematics
    await page.click('text=Mathematics');

    // Should filter to show only Mathematics tests
    await expect(page.locator('text=Mathematics')).toBeVisible();
  });

  test('should display grade statistics', async ({ page }) => {
    await page.goto('/admin/academic');
    await expect(page.locator('text=Grade Statistics')).toBeVisible();
    await expect(page.locator('text=Average Grade')).toBeVisible();
  });

  test('should export academic data', async ({ page }) => {
    await page.goto('/admin/academic');

    // Click export button
    await page.click('text=Export Data');

    // Should trigger download or show export options
    await expect(page.locator('text=Export')).toBeVisible();
  });
});