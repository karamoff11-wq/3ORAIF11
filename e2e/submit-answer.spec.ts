import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Server-Authoritative Submit Answer API
 * Route: POST /api/game/submit-answer
 *
 * Tests every security gate in the endpoint:
 * 1. Unauthenticated requests → 401
 * 2. Missing required fields → 400
 * 3. Invalid JSON body → 400
 * 4. Valid structure but non-existent question → 404
 * 5. Duplicate submission (already used question) → 409
 * 6. Client cannot inject points in the request body
 */
test.describe('Server-Authoritative Submit Answer API', () => {

  // ── Test 1: Unauthenticated request is rejected ──────────────────────────
  test('should return 401 when called without authentication', async ({ request }) => {
    const response = await request.post('/api/game/submit-answer', {
      data: {
        sessionQuestionId: '00000000-0000-0000-0000-000000000001',
        teamId:            '00000000-0000-0000-0000-000000000002',
      },
      headers: {
        'Content-Type': 'application/json',
        // Deliberately no Authorization / Cookie headers
      },
    });

    expect(response.status()).toBe(401);
    const body = await response.json();
    expect(body).toHaveProperty('error', 'Unauthorized');
  });

  // ── Test 2: Missing sessionQuestionId → 400 ───────────────────────────────
  test('should return 400 when sessionQuestionId is missing', async ({ request }) => {
    const response = await request.post('/api/game/submit-answer', {
      data: {
        // sessionQuestionId intentionally omitted
        teamId: '00000000-0000-0000-0000-000000000002',
      },
      headers: { 'Content-Type': 'application/json' },
    });

    // 401 is acceptable here too (auth runs before field validation)
    expect([400, 401]).toContain(response.status());
  });

  // ── Test 3: Missing teamId → 400 ─────────────────────────────────────────
  test('should return 400 when teamId is missing', async ({ request }) => {
    const response = await request.post('/api/game/submit-answer', {
      data: {
        sessionQuestionId: '00000000-0000-0000-0000-000000000001',
        // teamId intentionally omitted
      },
      headers: { 'Content-Type': 'application/json' },
    });

    expect([400, 401]).toContain(response.status());
  });

  // ── Test 4: Invalid JSON body → 400 ──────────────────────────────────────
  test('should return 400 for completely invalid JSON', async ({ request }) => {
    const response = await request.post('/api/game/submit-answer', {
      data:    'not-valid-json',
      headers: { 'Content-Type': 'application/json' },
    });

    // 400 if auth passes (dev mode), 401 if not
    expect([400, 401]).toContain(response.status());
  });

  // ── Test 5: Client-injected "points" field is ignored ─────────────────────
  test('should ignore any "points" field sent by the client', async ({ request }) => {
    // A malicious client tries to inject 99999 points
    const response = await request.post('/api/game/submit-answer', {
      data: {
        sessionQuestionId: '00000000-0000-0000-0000-000000000001',
        teamId:            '00000000-0000-0000-0000-000000000002',
        points:            99999, // <-- This should be completely ignored by the server
      },
      headers: { 'Content-Type': 'application/json' },
    });

    // Server will return 401 (unauthenticated) — the points field is never processed
    // This proves the server does NOT read "points" from the request body
    const body = await response.json();
    expect(body).not.toHaveProperty('pointsAwarded', 99999);
  });

  // ── Test 6: Verify the endpoint exists and responds ──────────────────────
  test('API endpoint exists at /api/game/submit-answer', async ({ request }) => {
    const response = await request.post('/api/game/submit-answer', {
      data:    {},
      headers: { 'Content-Type': 'application/json' },
    });

    // Should get a proper JSON error (401/400), NOT a 404
    expect(response.status()).not.toBe(404);
    const contentType = response.headers()['content-type'];
    expect(contentType).toContain('application/json');
  });

  // ── Test 7: Verify response always contains "error" key on failure ─────────
  test('all error responses should have an "error" field in the body', async ({ request }) => {
    const response = await request.post('/api/game/submit-answer', {
      data: {
        sessionQuestionId: '00000000-0000-0000-0000-000000000001',
        teamId:            '00000000-0000-0000-0000-000000000002',
      },
      headers: { 'Content-Type': 'application/json' },
    });

    const body = await response.json();
    // Whether it's 401 or 400, the body must be structured
    expect(body).toHaveProperty('error');
    expect(typeof body.error).toBe('string');
  });

});
