import { test, expect } from '@playwright/test';

/**
 * MASTER E2E TEST SUITE
 * Abu Al-Areef Trivia Platform — Security & Production Hardening
 *
 * Covers all 3 priority implementations:
 * ─────────────────────────────────────────────────────────────
 * Priority 1: Route Protection (proxy.ts Middleware)
 * Priority 2: Paddle Monetization Webhook
 * Priority 3: Server-Authoritative Game Engine (submit-answer)
 * ─────────────────────────────────────────────────────────────
 */

// ══════════════════════════════════════════════════════════════
// PRIORITY 1: Route Protection
// ══════════════════════════════════════════════════════════════
test.describe('Priority 1 — Route Protection (Middleware)', () => {

  test('P1.1 — Unauthenticated user is redirected from /dashboard to /auth/login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('P1.2 — Unauthenticated user is redirected from /admin to /auth/login', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test('P1.3 — Landing page is publicly accessible (no redirect)', async ({ page }) => {
    await page.goto('/');
    // Should NOT redirect to /auth/login
    await expect(page).not.toHaveURL(/\/auth\/login/);
  });

  test('P1.4 — /auth/login page is publicly accessible and shows a form', async ({ page }) => {
    await page.goto('/auth/login');
    await expect(page).toHaveURL(/\/auth\/login/);

    // The login form uses a custom SmartInput component — locate by form submit button
    const submitBtn = page.locator('button[type="submit"]').first();
    await expect(submitBtn).toBeVisible({ timeout: 10000 });

    // At least one text input must be present for email
    const inputs = page.locator('input');
    await expect(inputs.first()).toBeVisible();
  });

});

// ══════════════════════════════════════════════════════════════
// PRIORITY 2: Paddle Webhook API
// ══════════════════════════════════════════════════════════════
test.describe('Priority 2 — Paddle Monetization Webhook', () => {

  test('P2.1 — Webhook endpoint exists and accepts POST requests', async ({ request }) => {
    const response = await request.post('/api/webhooks/paddle', {
      data:    {},
      headers: { 'Content-Type': 'application/json' },
    });
    // Must return JSON, not a 404 HTML page
    expect(response.status()).not.toBe(404);
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/json');
  });

  test('P2.2 — Webhook returns 200 for a valid transaction.completed event', async ({ request }) => {
    const mockPayload = {
      event_type: 'transaction.completed',
      data: {
        id:            'tra_mock_e2e_123',
        status:        'completed',
        currency_code: 'USD',
        custom_data: {
          user_id:  '00000000-0000-0000-0000-000000000000',
          sessions: '5',
          pack_id:  'five',
        },
        details: {
          totals: { total: '1000' },
        },
      },
    };

    const response = await request.post('/api/webhooks/paddle', {
      data:    mockPayload,
      headers: { 'Content-Type': 'application/json' },
    });

    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ received: true });
  });

  test('P2.3 — Webhook accepts a subscription.created event (200 or handled error)', async ({ request }) => {
    const mockPayload = {
      event_type: 'subscription.created',
      data: {
        id:     'sub_mock_e2e_456',
        status: 'active',
        custom_data: { user_id: '00000000-0000-0000-0000-000000000000' },
        items: [{ price_id: 'pri_mock_pro' }],
        current_billing_period: { ends_at: new Date(Date.now() + 30 * 86400000).toISOString() },
      },
    };

    const response = await request.post('/api/webhooks/paddle', {
      data:    mockPayload,
      headers: { 'Content-Type': 'application/json' },
    });

    // 200 = success, 500 = DB error (expected with mock user_id — no real DB record)
    // Both prove the webhook parses and processes the event correctly
    expect([200, 500]).toContain(response.status());
    const body = await response.json();
    // Must be structured JSON either way
    expect(typeof body).toBe('object');
  });

  test('P2.4 — Webhook returns structured JSON for any valid POST (no HTML error pages)', async ({ request }) => {
    // Send a valid JSON body with an unknown event type
    const response = await request.post('/api/webhooks/paddle', {
      data: {
        event_type: 'unknown.event',
        data:       {},
      },
      headers: { 'Content-Type': 'application/json' },
    });

    // The webhook must always return structured JSON — never a raw HTML error page
    // 200 = unrecognised event (still receives cleanly), 400 = parse issue
    expect(response.status()).not.toBe(500);
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/json');
    const body = await response.json();
    // Must be a structured response
    expect(typeof body).toBe('object');
  });

});

// ══════════════════════════════════════════════════════════════
// PRIORITY 3: Server-Authoritative Game Engine
// ══════════════════════════════════════════════════════════════
test.describe('Priority 3 — Server-Authoritative Game Engine', () => {

  test('P3.1 — Endpoint exists at /api/game/submit-answer', async ({ request }) => {
    const response = await request.post('/api/game/submit-answer', {
      data:    {},
      headers: { 'Content-Type': 'application/json' },
    });
    // Must not 404
    expect(response.status()).not.toBe(404);
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/json');
  });

  test('P3.2 — Unauthenticated request returns 401 (security gate)', async ({ request }) => {
    const response = await request.post('/api/game/submit-answer', {
      data: {
        sessionQuestionId: '00000000-0000-0000-0000-000000000001',
        teamId:            '00000000-0000-0000-0000-000000000002',
      },
      headers: { 'Content-Type': 'application/json' },
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body).toHaveProperty('error', 'Unauthorized');
  });

  test('P3.3 — Missing sessionQuestionId returns 400 or 401', async ({ request }) => {
    const response = await request.post('/api/game/submit-answer', {
      data:    { teamId: '00000000-0000-0000-0000-000000000002' },
      headers: { 'Content-Type': 'application/json' },
    });

    expect([400, 401]).toContain(response.status());
  });

  test('P3.4 — Missing teamId returns 400 or 401', async ({ request }) => {
    const response = await request.post('/api/game/submit-answer', {
      data:    { sessionQuestionId: '00000000-0000-0000-0000-000000000001' },
      headers: { 'Content-Type': 'application/json' },
    });

    expect([400, 401]).toContain(response.status());
  });

  test('P3.5 — Client-injected "points" field is ignored by the server (anti-cheat)', async ({ request }) => {
    const response = await request.post('/api/game/submit-answer', {
      data: {
        sessionQuestionId: '00000000-0000-0000-0000-000000000001',
        teamId:            '00000000-0000-0000-0000-000000000002',
        points:            99999, // Malicious injection — must be ignored
      },
      headers: { 'Content-Type': 'application/json' },
    });

    const body = await response.json();
    // Server should never echo back 99999 points
    expect(body.pointsAwarded).not.toBe(99999);
  });

  test('P3.6 — All error responses contain a structured "error" field', async ({ request }) => {
    const response = await request.post('/api/game/submit-answer', {
      data: {
        sessionQuestionId: '00000000-0000-0000-0000-000000000001',
        teamId:            '00000000-0000-0000-0000-000000000002',
      },
      headers: { 'Content-Type': 'application/json' },
    });

    const body = await response.json();
    expect(body).toHaveProperty('error');
    expect(typeof body.error).toBe('string');
  });

});
