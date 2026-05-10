import { test, expect } from '@playwright/test';

/**
 * E2E Tests: Realtime Buzz-In Mechanics (Priority #4 / Phase 2)
 * ─────────────────────────────────────────────────────────────
 * Validates the UI logic surrounding the new Broadcast buzz-in feature.
 * We mock the Supabase REST API to avoid needing a seeded local database.
 */

test.describe('Realtime Broadcast Buzz-In', () => {

  const mockSessionId = 'mock-session-123';
  const mockJoinCode = 'ABCDEF';

  test('P5.1 — Remote players save their team ID to sessionStorage upon joining', async ({ page }) => {
    // 1. Mock the sessions API
    await page.route(`**/rest/v1/sessions*`, async route => {
      const url = route.request().url();
      if (url.includes(mockJoinCode)) {
        await route.fulfill({
          status: 200,
          contentType: 'application/vnd.pgrst.object+json',
          body: JSON.stringify({ id: mockSessionId, state: 'lobby', mode: 'remote' })
        });
      } else {
        await route.fulfill({
          status: 200,
          contentType: 'application/vnd.pgrst.object+json',
          body: JSON.stringify({ id: mockSessionId, state: 'lobby', mode: 'remote', join_code: mockJoinCode })
        });
      }
    });

    // 3. Mock teams for the join page
    await page.route(`**/rest/v1/teams*`, async route => {
      const url = route.request().url();
      if (url.includes('session_id=eq.' + mockSessionId)) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify([
            { id: 'team-A', session_id: mockSessionId, name: 'Red Team', color: '#EF4444', score: 0 },
            { id: 'team-B', session_id: mockSessionId, name: 'Blue Team', color: '#3B82F6', score: 0 }
          ])
        });
      } else {
        await route.continue();
      }
    });

    // 4. Mock the player insert
    await page.route(`**/rest/v1/players*`, async route => {
      if (route.request().method() === 'POST') {
        await route.fulfill({ status: 201, body: JSON.stringify([{ id: 'player-1' }]) });
      } else {
        await route.continue();
      }
    });

    // Navigate to Join Page
    await page.goto('/join');
    
    // Fill the 6-character code
    const inputs = page.locator('input[type="text"]');
    await expect(inputs).toHaveCount(6);
    
    for (let i = 0; i < 6; i++) {
      await inputs.nth(i).fill(mockJoinCode[i]);
    }

    // Click join
    const joinBtn = page.getByRole('button', { name: /انضم الآن/i });
    await expect(joinBtn).toBeEnabled();
    await joinBtn.click();

    // Verify we reached the lobby page
    await expect(page).toHaveURL(new RegExp(`/game/join/${mockSessionId}`));

    // Enter name
    const nameInput = page.getByPlaceholder('أدخل اسمك...');
    await expect(nameInput).toBeVisible();
    await nameInput.fill('Test Player');

    // Pick Team A
    const teamBtn = page.getByRole('button', { name: /Red Team/i });
    await expect(teamBtn).toBeVisible();
    await teamBtn.click();

    // Submit
    const finalJoinBtn = page.getByRole('button', { name: /انضم الآن/i }).last();
    await expect(finalJoinBtn).toBeEnabled();
    
    // Intercept navigation to prevent actually loading the game board yet
    await page.route(`**/game/${mockSessionId}`, async route => {
      await route.fulfill({ status: 200, body: '<html><body>Mocked Game Board</body></html>' });
    });
    
    await finalJoinBtn.click();

    // Wait for the simulated navigation
    await expect(page).toHaveURL(new RegExp(`/game/${mockSessionId}`));

    // Verify sessionStorage was set
    const storedTeam = await page.evaluate((id) => sessionStorage.getItem(`trivia_team_${id}`), mockSessionId);
    expect(storedTeam).toBe('team-A');
  });

  test('P5.2 — Remote players cannot click tiles (Host only restriction)', async ({ page }) => {
    // Pre-populate sessionStorage so the game board knows we are a player
    await page.addInitScript((id) => {
      sessionStorage.setItem(`trivia_team_${id}`, 'team-A');
    }, mockSessionId);

    // Mock session details
    await page.route(`**/rest/v1/sessions*`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/vnd.pgrst.object+json',
        body: JSON.stringify({ id: mockSessionId, state: 'playing', mode: 'remote', host_id: 'real-host-id' })
      });
    });

    // Mock teams
    await page.route(`**/rest/v1/teams*`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { id: 'team-A', session_id: mockSessionId, name: 'Red Team', color: '#EF4444', score: 0 }
        ])
      });
    });

    // Mock session_questions
    await page.route(`**/rest/v1/session_questions*`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { 
            id: 'sq-1', session_id: mockSessionId, team_id: 'team-A', used: false, 
            question: { id: 'q1', category_id: 'cat-1', difficulty: 'easy', question: 'Q1', answer: 'A1' }
          }
        ])
      });
    });

    // Mock categories
    await page.route(`**/rest/v1/session_categories*`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify([
          { category_id: 'cat-1', categories: { id: 'cat-1', name: 'Science' } }
        ])
      });
    });

    // Mock scoring config
    await page.route(`**/rest/v1/scoring_config*`, async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/vnd.pgrst.object+json',
        body: JSON.stringify({ easy_points: 100, medium_points: 200, hard_points: 300, default_timer_seconds: 30 })
      });
    });

    // Navigate to game board
    await page.goto(`/game/${mockSessionId}`);

    // Wait for the tile to render
    const tile = page.locator('button').filter({ hasText: '100' }).first();
    await expect(tile).toBeVisible({ timeout: 10000 });

    // Click the tile
    await tile.click();

    // Verify the toast message appears (preventing players from opening questions)
    const toastMessage = page.locator('text=فقط المضيف يمكنه اختيار السؤال!');
    await expect(toastMessage).toBeVisible({ timeout: 5000 });

    // Verify the modal did NOT open (the player buzz UI or host reveal UI is not present)
    const modalButton = page.locator('text=كشف الإجابة');
    await expect(modalButton).not.toBeVisible();
  });

});
