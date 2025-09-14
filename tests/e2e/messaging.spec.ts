import { test, expect } from '@playwright/test';

test.describe('Messaging System', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin before each test
    await page.goto('/auth/signin');
    await page.fill('input[name="email"]', 'admin@teachingcenter.com');
    await page.fill('input[name="password"]', 'demo123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/admin/dashboard');
  });

  test('should display messages page', async ({ page }) => {
    await page.goto('/admin/messages');
    await expect(page.locator('text=Messages')).toBeVisible();
  });

  test('should show message inbox', async ({ page }) => {
    await page.goto('/admin/messages');
    await expect(page.locator('text=Inbox')).toBeVisible();
  });

  test('should compose new message', async ({ page }) => {
    await page.goto('/admin/messages');

    // Click compose button
    await page.click('text=Compose');

    // Should open compose modal
    await expect(page.locator('text=New Message')).toBeVisible();
  });

  test('should send message to student', async ({ page }) => {
    await page.goto('/admin/messages');

    // Click compose button
    await page.click('text=Compose');

    // Fill message form
    await page.selectOption('select[name="recipientType"]', 'STUDENT');
    await page.selectOption('select[name="recipientId"]', 'student1');
    await page.fill('input[name="subject"]', 'Test Message');
    await page.fill('textarea[name="content"]', 'This is a test message from admin.');

    // Send message
    await page.click('button[type="submit"]');

    // Should show success message
    await expect(page.locator('text=Message sent successfully')).toBeVisible();
  });

  test('should send message to parent', async ({ page }) => {
    await page.goto('/admin/messages');

    // Click compose button
    await page.click('text=Compose');

    // Fill message form
    await page.selectOption('select[name="recipientType"]', 'PARENT');
    await page.selectOption('select[name="recipientId"]', 'parent1');
    await page.fill('input[name="subject"]', 'Test Message to Parent');
    await page.fill('textarea[name="content"]', 'This is a test message to parent.');

    // Send message
    await page.click('button[type="submit"]');

    // Should show success message
    await expect(page.locator('text=Message sent successfully')).toBeVisible();
  });

  test('should display received messages', async ({ page }) => {
    await page.goto('/admin/messages');

    // Should display message list
    await expect(page.locator('text=Subject')).toBeVisible();
    await expect(page.locator('text=From')).toBeVisible();
    await expect(page.locator('text=Date')).toBeVisible();
  });

  test('should view message details', async ({ page }) => {
    await page.goto('/admin/messages');

    // Click on first message
    await page.locator('.message-item').first().click();

    // Should display message content
    await expect(page.locator('text=Message Details')).toBeVisible();
  });

  test('should reply to message', async ({ page }) => {
    await page.goto('/admin/messages');

    // Click on first message
    await page.locator('.message-item').first().click();

    // Click reply button
    await page.click('text=Reply');

    // Should open reply form
    await expect(page.locator('text=Reply to Message')).toBeVisible();
  });

  test('should mark message as read', async ({ page }) => {
    await page.goto('/admin/messages');

    // Click on unread message
    const unreadMessage = page.locator('.message-item.unread').first();
    await unreadMessage.click();

    // Should mark as read
    await expect(unreadMessage).not.toHaveClass('unread');
  });

  test('should delete message', async ({ page }) => {
    await page.goto('/admin/messages');

    // Click delete button on first message
    await page.locator('.message-item').first().locator('button[aria-label="Delete"]').click();

    // Confirm deletion
    await page.click('text=Confirm');

    // Should show success message
    await expect(page.locator('text=Message deleted successfully')).toBeVisible();
  });

  test('should filter messages by type', async ({ page }) => {
    await page.goto('/admin/messages');

    // Click filter button
    await page.click('button:has-text("All Messages")');

    // Select sent messages
    await page.click('text=Sent');

    // Should show only sent messages
    await expect(page.locator('text=To:')).toBeVisible();
  });

  test('should search messages', async ({ page }) => {
    await page.goto('/admin/messages');

    // Search for specific message
    await page.fill('input[placeholder*="Search messages"]', 'test');

    // Should filter results
    await expect(page.locator('text=test')).toBeVisible();
  });
});