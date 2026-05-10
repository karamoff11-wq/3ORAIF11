import { test, expect } from '@playwright/test';

test('landing page loads correctly', async ({ page }) => {
  // Navigate to the root URL
  await page.goto('/');

  // Check that the page has the correct title
  await expect(page).toHaveTitle(/Abu Al-Areef|العُريف/i);

  // Look for the logo or a known element
  // The roadmap title or features should be visible
  const startButton = page.locator('a[href="/auth/register"]').first();
  await expect(startButton).toBeVisible({ timeout: 10000 });
});
