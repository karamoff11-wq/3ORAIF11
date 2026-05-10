import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Legal Compliance (Priority #6 & #7)
 * ─────────────────────────────────────────────────────────────
 * #6 — Cookie Consent Banner (GDPR)
 * #7 — Legal Pages (Terms of Service + Privacy Policy)
 */

// ══════════════════════════════════════════════════════════════
// PRIORITY 6 — Cookie Consent Banner
// ══════════════════════════════════════════════════════════════
test.describe('Priority 6 — Cookie Consent Banner (GDPR)', () => {

  test('P6.1 — Cookie banner appears on the landing page for new visitors', async ({ page }) => {
    // Clear storage to simulate a fresh visitor
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('al-arif-cookie-consent'));
    await page.reload();

    // Banner should appear after ~1.2s delay
    const acceptBtn = page.locator('button', { hasText: /Accept|قبول/i }).first();
    await expect(acceptBtn).toBeVisible({ timeout: 6000 });
  });

  test('P6.2 — Clicking Accept stores consent and hides the banner', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('al-arif-cookie-consent'));
    await page.reload();

    const acceptBtn = page.locator('button', { hasText: /Accept|قبول/i }).first();
    await expect(acceptBtn).toBeVisible({ timeout: 6000 });
    await acceptBtn.click();

    // Banner should disappear
    await expect(acceptBtn).not.toBeVisible({ timeout: 3000 });

    // Verify localStorage was set
    const stored = await page.evaluate(() => localStorage.getItem('al-arif-cookie-consent'));
    expect(stored).toBe('accepted');
  });

  test('P6.3 — Clicking Decline stores declined state and hides the banner', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('al-arif-cookie-consent'));
    await page.reload();

    const declineBtn = page.locator('button', { hasText: /Decline|رفض/i }).first();
    await expect(declineBtn).toBeVisible({ timeout: 6000 });
    await declineBtn.click();

    // Banner should disappear
    await expect(declineBtn).not.toBeVisible({ timeout: 3000 });

    // Verify declined state
    const stored = await page.evaluate(() => localStorage.getItem('al-arif-cookie-consent'));
    expect(stored).toBe('declined');
  });

  test('P6.4 — Banner does NOT appear again after consent is already given', async ({ page }) => {
    // Pre-set consent before page loads
    await page.goto('/');
    await page.evaluate(() => localStorage.setItem('al-arif-cookie-consent', 'accepted'));
    await page.reload();

    // Wait 2.5s (longer than the 1.2s banner delay) and verify it never appeared
    await page.waitForTimeout(2500);
    const banner = page.locator('button', { hasText: /Accept|قبول/i }).first();
    await expect(banner).not.toBeVisible();
  });

  test('P6.5 — Cookie banner contains a link to Privacy Policy', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => localStorage.removeItem('al-arif-cookie-consent'));
    await page.reload();

    // Wait for banner
    const privacyLink = page.locator('a[href="/legal/privacy"]').first();
    await expect(privacyLink).toBeVisible({ timeout: 6000 });
  });

});

// ══════════════════════════════════════════════════════════════
// PRIORITY 7 — Legal Pages
// ══════════════════════════════════════════════════════════════
test.describe('Priority 7 — Legal Pages (Terms & Privacy)', () => {

  test('P7.1 — Privacy Policy page loads with correct content', async ({ page }) => {
    await page.goto('/legal/privacy');
    await expect(page).toHaveURL(/\/legal\/privacy/);

    // Check the page has a visible heading
    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible({ timeout: 8000 });
  });

  test('P7.2 — Privacy Policy page has at least 5 sections', async ({ page }) => {
    await page.goto('/legal/privacy');

    // The page renders sections as cards with h2 headings
    // Use an auto-retrying assertion to wait for rendering
    await expect(page.locator('h2').nth(4)).toBeAttached();
    const count = await page.locator('h2').count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test('P7.3 — Privacy Policy page has a contact email link', async ({ page }) => {
    await page.goto('/legal/privacy');

    const emailLink = page.locator('a[href^="mailto:"]').first();
    await expect(emailLink).toBeVisible({ timeout: 8000 });
  });

  test('P7.4 — Privacy Policy links back to the landing page', async ({ page }) => {
    await page.goto('/legal/privacy');

    const backLink = page.locator('a[href="/"]').first();
    await expect(backLink).toBeVisible({ timeout: 8000 });
  });

  test('P7.5 — Terms of Service page loads with correct content', async ({ page }) => {
    await page.goto('/legal/terms');
    await expect(page).toHaveURL(/\/legal\/terms/);

    const heading = page.locator('h1').first();
    await expect(heading).toBeVisible({ timeout: 8000 });
  });

  test('P7.6 — Terms of Service page has at least 5 sections', async ({ page }) => {
    await page.goto('/legal/terms');

    // Use an auto-retrying assertion to wait for rendering
    await expect(page.locator('h2').nth(4)).toBeAttached();
    const count = await page.locator('h2').count();
    expect(count).toBeGreaterThanOrEqual(5);
  });

  test('P7.7 — Terms of Service page has a contact email link', async ({ page }) => {
    await page.goto('/legal/terms');

    const emailLink = page.locator('a[href^="mailto:"]').first();
    await expect(emailLink).toBeVisible({ timeout: 8000 });
  });

  test('P7.8 — Terms links to Privacy Policy (cross-link)', async ({ page }) => {
    await page.goto('/legal/terms');

    const privacyLink = page.locator('a[href="/legal/privacy"]').first();
    await expect(privacyLink).toBeVisible({ timeout: 8000 });
  });

  test('P7.9 — Privacy Policy links to Terms of Service (cross-link)', async ({ page }) => {
    await page.goto('/legal/privacy');

    const termsLink = page.locator('a[href="/legal/terms"]').first();
    await expect(termsLink).toBeVisible({ timeout: 8000 });
  });

});
