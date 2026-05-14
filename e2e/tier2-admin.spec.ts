import { test, expect } from '@playwright/test';

test.describe('Tier 2: Admin Dashboard & Management Upgrades', () => {
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    // We use the ?test=true bypass to access admin pages locally
    await page.goto('/admin?test=true');
    await page.waitForLoadState('networkidle');
  });

  test('2.1 & 2.2: Dashboard Stats and Live Monitoring', async ({ page }) => {
    // Check for stats cards using more robust text matching
    await expect(page.getByText('إجمالي الجلسات')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('جلسات نشطة')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('إجمالي الأسئلة')).toBeVisible({ timeout: 10000 });
    
    // Scroll down to see the tools section
    await page.evaluate(() => window.scrollTo(0, 1000));
    
    // Check for "Admin Tools" section
    await expect(page.getByText('أدوات الإدارة')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('مدير الأسئلة المتقدم')).toBeVisible({ timeout: 10000 });
  });

  test('2.5: Notification Bell and Dropdown', async ({ page }) => {
    // Locate the bell icon
    const bell = page.locator('button:has-text("🔔")');
    await expect(bell).toBeVisible({ timeout: 10000 });
    
    // Click to open dropdown
    await bell.click();
    
    // Check dropdown header
    await expect(page.getByText('التنبيهات').last()).toBeVisible({ timeout: 10000 });
  });

  test('2.4: Bulk Question Manager Functionality', async ({ page }) => {
    await page.goto('/admin/questions?test=true');
    await page.waitForLoadState('networkidle');

    // Verify select-all checkbox exists in the header
    const selectAll = page.locator('th input[type="checkbox"]');
    await expect(selectAll).toBeVisible({ timeout: 10000 });

    // Verify CSV buttons exist
    await expect(page.getByText('📥 استيراد CSV')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('📤 تصدير CSV')).toBeVisible({ timeout: 10000 });

    // Select a single question
    await page.waitForSelector('tbody input[type="checkbox"]', { timeout: 10000 });
    const firstCheckbox = page.locator('tbody input[type="checkbox"]').first();
    
    if (await firstCheckbox.isVisible()) {
      await firstCheckbox.check();
      
      // Bulk actions bar should appear (look for the "سؤال محدد" text)
      await expect(page.getByText('سؤال محدد')).toBeVisible({ timeout: 10000 });
      await expect(page.getByText('🗑️ حذف المحدد')).toBeVisible({ timeout: 10000 });
      
      // Click cancel selection
      await page.getByText('إلغاء التحديد').click();
      await expect(page.getByText('سؤال محدد')).not.toBeVisible();
    }
  });

  test('2.1 & 2.3: Live Sessions and Inspector Drill-Down', async ({ page }) => {
    await page.goto('/admin/sessions?test=true');
    await page.waitForLoadState('networkidle');

    // Check for any of the session status badges
    const statusText = page.locator('.card-glass').first();
    await expect(statusText).toBeVisible({ timeout: 15000 });

    // Click on the first session row
    await statusText.click();
    
    // Should navigate to /admin/sessions/[id]
    await page.waitForURL(/\/admin\/sessions\/.+/, { timeout: 15000 });
    
    // Check for inspector details
    await expect(page.getByText('الفرق والنقاط')).toBeVisible({ timeout: 10000 });
    await expect(page.getByText('الأسئلة')).toBeVisible({ timeout: 10000 });
  });
});
