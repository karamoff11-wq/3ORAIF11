// lib/paddle.ts
// Paddle Billing integration utility
// Docs: https://developer.paddle.com/build/subscriptions

export const PADDLE_CONFIG = {
  // Sandbox = testing, Production = live
  environment: (process.env.NEXT_PUBLIC_PADDLE_ENV ?? 'sandbox') as 'sandbox' | 'production',
  clientToken: process.env.NEXT_PUBLIC_PADDLE_CLIENT_TOKEN ?? '',

  // Price IDs from your Paddle dashboard
  prices: {
    pro:  process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO  ?? '',
    team: process.env.NEXT_PUBLIC_PADDLE_PRICE_TEAM ?? '',
  },
}

// Plan types mirroring the DB enum
export type PlanType = 'free' | 'pro' | 'team'

// Map plan ID → Paddle price ID
export function getPriceId(plan: 'pro' | 'team'): string {
  return PADDLE_CONFIG.prices[plan]
}

// Helper: is the current plan paid?
export function isPaidPlan(plan: PlanType): boolean {
  return plan === 'pro' || plan === 'team'
}

// Helper: can this plan create unlimited sessions?
export function canCreateUnlimitedSessions(plan: PlanType): boolean {
  return isPaidPlan(plan)
}

// Helper: max teams allowed by plan
export function maxTeamsForPlan(plan: PlanType): number {
  switch (plan) {
    case 'pro':  return 4
    case 'team': return 10
    default:     return 2   // free
  }
}
