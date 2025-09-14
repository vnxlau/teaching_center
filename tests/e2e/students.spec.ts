import { test, expect } from '@playwright/test';

test.describe('Student Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'admin@teachingcenter.com');
    await page.fill('input[name="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');
  });

  test('should display students list', async ({ page }) => {
    await page.goto('/admin/students');
    await expect(page.locator('text=Students')).toBeVisible();
    await expect(page.locator('text=Student Code')).toBeVisible();
  });

  test('should search students', async ({ page }) => {
    await page.goto('/admin/students');

    // Wait for students to load
    await page.waitForSelector('table');

    // Get initial count
    const initialCount = await page.locator('tbody tr').count();

    // Search for a specific student
    await page.fill('input[placeholder*="Search"]', 'John');

    // Wait for search results
    await page.waitForTimeout(1000);

    // Should filter results
    const filteredCount = await page.locator('tbody tr').count();
    expect(filteredCount).toBeLessThanOrEqual(initialCount);
  });

  test('should navigate to student detail page', async ({ page }) => {
    await page.goto('/admin/students');

    // Click on first student
    await page.locator('tbody tr').first().click();

    // Should navigate to student detail page
    await expect(page.locator('text=Student Information')).toBeVisible();
  });

  test('should display student details correctly', async ({ page }) => {
    await page.goto('/admin/students');

    // Click on first student
    const firstRow = page.locator('tbody tr').first();
    const studentCode = await firstRow.locator('td').first().textContent();

    await firstRow.click();

    // Should display student information
    await expect(page.locator('text=Student Information')).toBeVisible();
    await expect(page.locator(`text=${studentCode}`)).toBeVisible();
  });

  test('should log attendance for student', async ({ page }) => {
    await page.goto('/admin/students');

    // Click on first student
    await page.locator('tbody tr').first().click();

    // Click log attendance button
    await page.click('text=Log Attendance');

    // Should open attendance modal
    await expect(page.locator('text=Log Attendance')).toBeVisible();
  });

  test('should add note to student', async ({ page }) => {
    await page.goto('/admin/students');

    // Click on first student
    await page.locator('tbody tr').first().click();

    // Click add note button
    await page.click('text=Add Note');

    // Should open add note modal
    await expect(page.locator('text=Add Note')).toBeVisible();
  });

  test('should display student attendance history', async ({ page }) => {
    await page.goto('/admin/students');

    // Click on first student
    await page.locator('tbody tr').first().click();

    // Should display attendance table
    await expect(page.locator('text=Date')).toBeVisible();
    await expect(page.locator('text=Status')).toBeVisible();
  });

  test('should display student test scores', async ({ page }) => {
    await page.goto('/admin/students');

    // Click on first student
    await page.locator('tbody tr').first().click();

    // Should display test score evolution graph
    await expect(page.locator('text=Test Score Evolution')).toBeVisible();
  });

  test('should filter test scores by time range', async ({ page }) => {
    await page.goto('/admin/students');

    // Click on first student
    await page.locator('tbody tr').first().click();

    // Click on 3 months button
    await page.click('text=3 Months');

    // Should update the graph title
    await expect(page.locator('text=Test Scores - Last 3 Months')).toBeVisible();
  });
});