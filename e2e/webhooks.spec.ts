import { test, expect } from '@playwright/test';

test.describe('Paddle Webhook API', () => {
  test('should handle a simulated session pack purchase', async ({ request }) => {
    // Mock payload mimicking a transaction.completed event from Paddle
    // for a 5-session pack
    const mockPayload = {
      event_id: 'evt_01h',
      event_type: 'transaction.completed',
      occurred_at: new Date().toISOString(),
      data: {
        id: 'tra_mock_123',
        status: 'completed',
        currency_code: 'USD',
        custom_data: {
          user_id: '00000000-0000-0000-0000-000000000000', // Using a dummy UUID
          sessions: '5',
          pack_id: 'five'
        },
        details: {
          totals: {
            total: '1000' // $10.00
          }
        }
      }
    };

    // Send POST request to the webhook endpoint
    const response = await request.post('/api/webhooks/paddle', {
      data: mockPayload,
      headers: {
        'Content-Type': 'application/json',
        'paddle-signature': 'mock_signature' // Doesn't matter since secret is empty in dev
      }
    });

    // Check if the response is successful
    expect(response.status()).toBe(200);
    const body = await response.json();
    expect(body).toEqual({ received: true });
  });

  test('should return 400 for invalid JSON', async ({ request }) => {
    const response = await request.post('/api/webhooks/paddle', {
      data: Buffer.from('invalid-json'),
      headers: {
        'Content-Type': 'application/json'
      }
    });

    expect(response.status()).toBe(400);
  });
});
