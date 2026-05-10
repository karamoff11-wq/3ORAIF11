import { test, expect } from '@playwright/test';

test.describe('Admin Topics Page', () => {

  test('P1 — Renders topics correctly using mocked data', async ({ page }) => {
    // 1. Mock Authentication
    await page.route('**/auth/v1/user', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: 'admin-user-123',
          aud: 'authenticated',
          role: 'authenticated',
          email: 'admin@test.com'
        })
      });
    });

    // 2. Mock Admin Profile check
    await page.route('**/rest/v1/profiles*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/vnd.pgrst.object+json',
        body: JSON.stringify({
          role: 'admin'
        })
      });
    });

    // 3. Mock Topics Data
    await page.route('**/rest/v1/topics*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'topic-1', name: 'Mocked Science', icon: '🔬', color: '#3b82f6', order_index: 1 }
        ])
      });
    });

    // 4. Mock Categories Data
    await page.route('**/rest/v1/categories*', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'cat-1', topic_id: 'topic-1', name: 'Physics', icon: '⚡' }
        ])
      });
    });

    // Navigate to the test route that bypasses middleware
    await page.goto('/e2e-admin-topics');

    // Verify the page title rendered (this proves the syntax error is gone)
    const title = page.locator('h1.gradient-text-primary').filter({ hasText: 'المواضيع الرئيسية' });
    await expect(title).toBeVisible();

    // Verify the mocked topic rendered
    const topicName = page.locator('text=Mocked Science');
    await expect(topicName).toBeVisible();

    // Verify the mocked category rendered inside the topic card
    const categoryName = page.locator('text=Physics');
    await expect(categoryName).toBeVisible();
  });

});
