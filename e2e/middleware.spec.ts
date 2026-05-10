import { test, expect } from '@playwright/test';

test.describe('Middleware Route Protection', () => {
  test('should redirect unauthenticated users from /dashboard to /auth/login', async ({ page }) => {
    // Attempt to navigate directly to the dashboard
    await page.goto('/dashboard');

    // Check if the URL has changed to the login page
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('should redirect unauthenticated users from /admin to /auth/login', async ({ page }) => {
    // Attempt to navigate directly to an admin route
    await page.goto('/admin');

    // Check if the URL has changed to the login page
    await expect(page).toHaveURL(/\/auth\/login/);
  });
});
