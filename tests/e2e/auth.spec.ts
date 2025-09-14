import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test('should load login page', async ({ page }) => {
    await page.goto('/auth/signin');
    await expect(page).toHaveTitle(/Teaching Center/);
    await expect(page.locator('text=Sign In')).toBeVisible();
  });

  test('should login with admin credentials', async ({ page }) => {
    await page.goto('/auth/signin');

    // Fill in login form
    await page.fill('input[name="email"]', 'admin@teachingcenter.com');
    await page.fill('input[name="password"]', 'demo123');

    // Click sign in button
    await page.click('button[type="submit"]');

    // Should redirect to admin dashboard
    await page.waitForURL('/admin/dashboard');
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should login with teacher credentials', async ({ page }) => {
    await page.goto('/auth/signin');

    // Fill in login form
    await page.fill('input[name="email"]', 'teacher@teachingcenter.com');
    await page.fill('input[name="password"]', 'demo123');

    // Click sign in button
    await page.click('button[type="submit"]');

    // Should redirect to appropriate page (teacher dashboard or students)
    await expect(page.locator('text=Students')).toBeVisible();
  });

  test('should login with parent credentials', async ({ page }) => {
    await page.goto('/auth/signin');

    // Fill in login form
    await page.fill('input[name="email"]', 'parent@teachingcenter.com');
    await page.fill('input[name="password"]', 'demo123');

    // Click sign in button
    await page.click('button[type="submit"]');

    // Should redirect to parent dashboard
    await expect(page.locator('text=Parent Dashboard')).toBeVisible();
  });

  test('should login with student credentials', async ({ page }) => {
    await page.goto('/auth/signin');

    // Fill in login form
    await page.fill('input[name="email"]', 'student@teachingcenter.com');
    await page.fill('input[name="password"]', 'demo123');

    // Click sign in button
    await page.click('button[type="submit"]');

    // Should redirect to student dashboard
    await expect(page.locator('text=Student Dashboard')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/auth/signin');

    // Fill in invalid credentials
    await page.fill('input[name="email"]', 'invalid@example.com');
    await page.fill('input[name="password"]', 'wrongpassword');

    // Click sign in button
    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=Invalid credentials')).toBeVisible();
  });

  test('should redirect unauthenticated users from protected routes', async ({ page }) => {
    // Try to access admin dashboard without authentication
    await page.goto('/admin/dashboard');

    // Should redirect to sign in page
    await page.waitForURL('/auth/signin');
    await expect(page.locator('text=Sign In')).toBeVisible();
  });
});