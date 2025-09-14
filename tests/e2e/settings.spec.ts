import { test, expect } from '@playwright/test';

test.describe('Admin Settings', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'admin@teachingcenter.com');
    await page.fill('input[name="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');
  });

  test('should display settings page', async ({ page }) => {
    await page.goto('/admin/settings');
    await expect(page.locator('text=Settings')).toBeVisible();
  });

  test('should display system settings', async ({ page }) => {
    await page.goto('/admin/settings');
    await expect(page.locator('text=System Settings')).toBeVisible();
    await expect(page.locator('text=School Name')).toBeVisible();
  });

  test('should update school name', async ({ page }) => {
    await page.goto('/admin/settings');

    // Update school name
    await page.fill('input[name="schoolName"]', 'Updated Teaching Center');

    // Save changes
    await page.click('button[type="submit"]');

    // Should show success message
    await expect(page.locator('text=Settings updated successfully')).toBeVisible();
  });

  test('should display user settings', async ({ page }) => {
    await page.goto('/admin/settings');
    await expect(page.locator('text=User Settings')).toBeVisible();
  });

  test('should update user profile', async ({ page }) => {
    await page.goto('/admin/settings');

    // Update user information
    await page.fill('input[name="name"]', 'Updated Admin Name');

    // Save changes
    await page.click('button[type="submit"]');

    // Should show success message
    await expect(page.locator('text=Profile updated successfully')).toBeVisible();
  });

  test('should change password', async ({ page }) => {
    await page.goto('/admin/settings');

    // Fill password change form
    await page.fill('input[name="currentPassword"]', 'demo123');
    await page.fill('input[name="newPassword"]', 'newpassword123');
    await page.fill('input[name="confirmPassword"]', 'newpassword123');

    // Submit form
    await page.click('button[type="submit"]');

    // Should show success message
    await expect(page.locator('text=Password changed successfully')).toBeVisible();
  });

  test('should display notification settings', async ({ page }) => {
    await page.goto('/admin/settings');
    await expect(page.locator('text=Notifications')).toBeVisible();
  });

  test('should update notification preferences', async ({ page }) => {
    await page.goto('/admin/settings');

    // Toggle email notifications
    await page.check('input[name="emailNotifications"]');

    // Save changes
    await page.click('button[type="submit"]');

    // Should show success message
    await expect(page.locator('text=Notification preferences updated')).toBeVisible();
  });

  test('should display security settings', async ({ page }) => {
    await page.goto('/admin/settings');
    await expect(page.locator('text=Security')).toBeVisible();
  });

  test('should enable two-factor authentication', async ({ page }) => {
    await page.goto('/admin/settings');

    // Enable 2FA
    await page.check('input[name="twoFactorEnabled"]');

    // Save changes
    await page.click('button[type="submit"]');

    // Should show 2FA setup
    await expect(page.locator('text=Two-Factor Authentication Setup')).toBeVisible();
  });

  test('should display integration settings', async ({ page }) => {
    await page.goto('/admin/settings');
    await expect(page.locator('text=Integrations')).toBeVisible();
  });

  test('should configure email integration', async ({ page }) => {
    await page.goto('/admin/settings');

    // Configure SMTP settings
    await page.fill('input[name="smtpHost"]', 'smtp.gmail.com');
    await page.fill('input[name="smtpPort"]', '587');
    await page.fill('input[name="smtpUser"]', 'admin@teachingcenter.com');

    // Save changes
    await page.click('button[type="submit"]');

    // Should show success message
    await expect(page.locator('text=Email integration configured')).toBeVisible();
  });

  test('should display backup settings', async ({ page }) => {
    await page.goto('/admin/settings');
    await expect(page.locator('text=Backup & Restore')).toBeVisible();
  });

  test('should create backup', async ({ page }) => {
    await page.goto('/admin/settings');

    // Click create backup button
    await page.click('text=Create Backup');

    // Should show backup progress
    await expect(page.locator('text=Creating backup...')).toBeVisible();
  });

  test('should display audit log', async ({ page }) => {
    await page.goto('/admin/settings');
    await expect(page.locator('text=Audit Log')).toBeVisible();
  });

  test('should view audit log entries', async ({ page }) => {
    await page.goto('/admin/settings');

    // Should display audit log table
    await expect(page.locator('text=Action')).toBeVisible();
    await expect(page.locator('text=User')).toBeVisible();
    await expect(page.locator('text=Timestamp')).toBeVisible();
  });

  test('should export audit log', async ({ page }) => {
    await page.goto('/admin/settings');

    // Click export audit log button
    await page.click('text=Export Audit Log');

    // Should trigger download
    const downloadPromise = page.waitForEvent('download');
    await downloadPromise;
  });
});