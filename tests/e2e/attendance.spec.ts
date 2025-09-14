import { test, expect } from '@playwright/test';

test.describe('Attendance Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'admin@teachingcenter.com');
    await page.fill('input[name="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');
  });

  test('should display attendance dashboard', async ({ page }) => {
    await page.goto('/admin/attendance-dashboard');
    await expect(page.locator('text=Attendance Dashboard')).toBeVisible();
  });

  test('should show attendance statistics', async ({ page }) => {
    await page.goto('/admin/attendance-dashboard');
    await expect(page.locator('text=Total Students')).toBeVisible();
    await expect(page.locator('text=Present Today')).toBeVisible();
    await expect(page.locator('text=Absent Today')).toBeVisible();
  });

  test('should display weekly attendance overview', async ({ page }) => {
    await page.goto('/admin/attendance-dashboard');
    await expect(page.locator('text=Weekly Overview')).toBeVisible();
  });

  test('should log attendance for student', async ({ page }) => {
    await page.goto('/admin/students');

    // Click on first student
    await page.locator('tbody tr').first().click();

    // Click log attendance button
    await page.click('text=Log Attendance');

    // Fill attendance form
    await page.selectOption('select[name="status"]', 'PRESENT');
    await page.fill('input[name="checkInTime"]', '09:00');
    await page.fill('input[name="checkOutTime"]', '17:00');

    // Submit form
    await page.click('button[type="submit"]');

    // Should show success message
    await expect(page.locator('text=Attendance logged successfully')).toBeVisible();
  });

  test('should display student attendance history', async ({ page }) => {
    await page.goto('/admin/students');

    // Click on first student
    await page.locator('tbody tr').first().click();

    // Should display attendance table
    await expect(page.locator('text=Weekly Attendance')).toBeVisible();
    await expect(page.locator('text=Date')).toBeVisible();
    await expect(page.locator('text=Check-in')).toBeVisible();
    await expect(page.locator('text=Check-out')).toBeVisible();
  });

  test('should mark student as present', async ({ page }) => {
    await page.goto('/admin/attendance-dashboard');

    // Find a student and mark as present
    const studentRow = page.locator('tbody tr').first();
    await studentRow.locator('button:has-text("Present")').click();

    // Should update status
    await expect(studentRow.locator('text=PRESENT')).toBeVisible();
  });

  test('should mark student as absent', async ({ page }) => {
    await page.goto('/admin/attendance-dashboard');

    // Find a student and mark as absent
    const studentRow = page.locator('tbody tr').first();
    await studentRow.locator('button:has-text("Absent")').click();

    // Should update status
    await expect(studentRow.locator('text=ABSENT')).toBeVisible();
  });

  test('should filter attendance by date', async ({ page }) => {
    await page.goto('/admin/attendance-dashboard');

    // Select a specific date
    await page.fill('input[type="date"]', '2025-09-15');

    // Should update attendance view
    await expect(page.locator('text=September 15, 2025')).toBeVisible();
  });

  test('should export attendance data', async ({ page }) => {
    await page.goto('/admin/attendance-dashboard');

    // Click export button
    await page.click('text=Export Attendance');

    // Should trigger download
    const downloadPromise = page.waitForEvent('download');
    await downloadPromise;
  });

  test('should show attendance trends', async ({ page }) => {
    await page.goto('/admin/attendance-dashboard');
    await expect(page.locator('text=Attendance Trends')).toBeVisible();
  });
});