import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('can navigate from landing to register page', async ({ page }) => {
    // Navigate to landing
    await page.goto('/');

    // Find and click the register link
    const startLink = page.locator('a[href="/auth/register"]').last();
    await expect(startLink).toBeVisible({ timeout: 10000 });
    await startLink.click();

    // Ensure we are on the register page
    await expect(page).toHaveURL(/\/auth\/register/);

    // Ensure an email input exists
    const emailInput = page.locator('input[type="email"]').first();
    await expect(emailInput).toBeVisible();

    // Ensure a password input exists
    const passwordInput = page.locator('input[type="password"]').first();
    await expect(passwordInput).toBeVisible();
  });
});
